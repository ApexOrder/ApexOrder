import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import express from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const dataDir = path.resolve(process.env.DATA_DIR || path.join(projectRoot, 'data'));
const databasePath = path.join(dataDir, 'apexorder.sqlite');
const port = Number(process.env.PORT || 3001);
const isProduction = process.env.NODE_ENV === 'production';

const cloudflareTeamDomain = String(process.env.CLOUDFLARE_ACCESS_TEAM_DOMAIN || '').trim().replace(/\/$/, '');
const cloudflareAudience = String(process.env.CLOUDFLARE_ACCESS_AUD || '').trim();
const accessConfigured = Boolean(cloudflareTeamDomain && cloudflareAudience);
const discordClientId = String(process.env.DISCORD_CLIENT_ID || '').trim();
const discordClientSecret = String(process.env.DISCORD_CLIENT_SECRET || '').trim();
const discordRedirectUri = String(process.env.DISCORD_REDIRECT_URI || '').trim();
const appBaseUrl = String(process.env.APP_BASE_URL || 'http://localhost:5173').trim().replace(/\/$/, '');
const sessionSecret = String(process.env.SESSION_SECRET || '').trim();
const discordConfigured = Boolean(discordClientId && discordClientSecret && discordRedirectUri && sessionSecret);
const sessionDays = Math.max(1, Number(process.env.SESSION_DAYS || 30));
const memberCookieName = 'apexorder_member';

fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(databasePath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
  CREATE TABLE IF NOT EXISTS entities (
    entity_type TEXT NOT NULL,
    id TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (entity_type, id)
  );
  CREATE INDEX IF NOT EXISTS idx_entities_type_created ON entities (entity_type, created_at DESC);
  CREATE TABLE IF NOT EXISTS discord_users (
    discord_id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    global_name TEXT,
    avatar TEXT,
    email TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_login_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS member_sessions (
    id TEXT PRIMARY KEY,
    discord_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (discord_id) REFERENCES discord_users(discord_id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_member_sessions_expiry ON member_sessions (expires_at);
  CREATE TABLE IF NOT EXISTS oauth_states (
    state TEXT PRIMARY KEY,
    return_to TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_id TEXT NOT NULL,
    actor_email TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details TEXT,
    ip_address TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs (created_at DESC);
`);

const listEntities = db.prepare('SELECT id, data, created_at, updated_at FROM entities WHERE entity_type = ?');
const getEntity = db.prepare('SELECT id, data, created_at, updated_at FROM entities WHERE entity_type = ? AND id = ?');
const insertEntity = db.prepare('INSERT INTO entities (entity_type, id, data, created_at, updated_at) VALUES (@entityType, @id, @data, @createdAt, @updatedAt)');
const updateEntity = db.prepare('UPDATE entities SET data = @data, updated_at = @updatedAt WHERE entity_type = @entityType AND id = @id');
const deleteEntity = db.prepare('DELETE FROM entities WHERE entity_type = ? AND id = ?');
const upsertDiscordUser = db.prepare(`
  INSERT INTO discord_users (discord_id, username, global_name, avatar, email, created_at, updated_at, last_login_at)
  VALUES (@discordId, @username, @globalName, @avatar, @email, @now, @now, @now)
  ON CONFLICT(discord_id) DO UPDATE SET
    username = excluded.username,
    global_name = excluded.global_name,
    avatar = excluded.avatar,
    email = excluded.email,
    updated_at = excluded.updated_at,
    last_login_at = excluded.last_login_at
`);
const insertSession = db.prepare('INSERT INTO member_sessions (id, discord_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)');
const getSessionUser = db.prepare(`
  SELECT u.discord_id, u.username, u.global_name, u.avatar, u.email, u.created_at, u.last_login_at, s.expires_at
  FROM member_sessions s JOIN discord_users u ON u.discord_id = s.discord_id
  WHERE s.token_hash = ? AND s.expires_at > ?
`);
const deleteSession = db.prepare('DELETE FROM member_sessions WHERE token_hash = ?');
const insertOauthState = db.prepare('INSERT INTO oauth_states (state, return_to, created_at, expires_at) VALUES (?, ?, ?, ?)');
const consumeOauthState = db.prepare('DELETE FROM oauth_states WHERE state = ? RETURNING return_to, expires_at');
const insertAudit = db.prepare(`
  INSERT INTO audit_logs (id, actor_id, actor_email, action, entity_type, entity_id, details, ip_address, created_at)
  VALUES (@id, @actorId, @actorEmail, @action, @entityType, @entityId, @details, @ipAddress, @createdAt)
`);
const listAudit = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?');
const JWKS = accessConfigured ? createRemoteJWKSet(new URL(`${cloudflareTeamDomain}/cdn-cgi/access/certs`)) : null;

function normaliseEntityType(value) {
  const entityType = String(value || '').trim();
  if (!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(entityType)) throw new Error('Invalid entity type.');
  return entityType;
}

function parseRow(row) {
  if (!row) return null;
  const data = JSON.parse(row.data);
  return { ...data, id: row.id, created_date: data.created_date || row.created_at, updated_date: row.updated_at };
}

function matchesFilters(item, filters) {
  return Object.entries(filters).every(([key, expected]) => {
    const actual = item[key];
    if (Array.isArray(expected)) return expected.includes(actual);
    if (expected && typeof expected === 'object') {
      if ('$in' in expected && Array.isArray(expected.$in)) return expected.$in.includes(actual);
      if ('$ne' in expected) return actual !== expected.$ne;
    }
    return actual === expected;
  });
}

function sortItems(items, expression) {
  if (!expression) return items;
  const descending = expression.startsWith('-');
  const key = descending ? expression.slice(1) : expression;
  return [...items].sort((left, right) => {
    const result = String(left[key] ?? '').localeCompare(String(right[key] ?? ''), undefined, { numeric: true, sensitivity: 'base' });
    return descending ? -result : result;
  });
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
    const separator = part.indexOf('=');
    return [decodeURIComponent(separator >= 0 ? part.slice(0, separator) : part), decodeURIComponent(separator >= 0 ? part.slice(separator + 1) : '')];
  }));
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  return parts.join('; ');
}

function safeReturnTo(value) {
  const candidate = String(value || '/').trim();
  return candidate.startsWith('/') && !candidate.startsWith('//') ? candidate : '/';
}

function tokenHash(token) {
  return crypto.createHmac('sha256', sessionSecret).update(token).digest('hex');
}

function discordAvatarUrl(user) {
  if (!user.avatar) return null;
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
}

function publicMember(row) {
  if (!row) return null;
  return {
    id: row.discord_id,
    discordId: row.discord_id,
    username: row.username,
    displayName: row.global_name || row.username,
    avatar: row.avatar,
    email: row.email || null,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
    role: 'member',
  };
}

function getAccessToken(request) {
  return request.headers['cf-access-jwt-assertion'] || parseCookies(request.headers.cookie || '').CF_Authorization || '';
}

async function readCloudflareUser(request) {
  if (!JWKS || !accessConfigured) return null;
  const token = String(getAccessToken(request));
  if (!token) return null;
  const { payload } = await jwtVerify(token, JWKS, { issuer: cloudflareTeamDomain, audience: cloudflareAudience });
  const email = String(payload.email || '').trim().toLowerCase();
  if (!email) return null;
  return { id: String(payload.sub || email), email, full_name: String(payload.name || email), role: 'admin', provider: 'cloudflare' };
}

async function requireAdmin(request, response, next) {
  try {
    const user = await readCloudflareUser(request);
    if (!user) return response.status(401).json({ error: 'Cloudflare Access authentication required.' });
    request.user = user;
    next();
  } catch (error) {
    console.error('[Auth] Cloudflare token validation failed:', error.message);
    response.status(401).json({ error: 'Invalid Cloudflare Access session.' });
  }
}

function readMember(request) {
  if (!discordConfigured) return null;
  const token = parseCookies(request.headers.cookie || '')[memberCookieName];
  if (!token) return null;
  return publicMember(getSessionUser.get(tokenHash(token), new Date().toISOString()));
}

function audit(request, action, entityType = null, entityId = null, details = null) {
  insertAudit.run({
    id: crypto.randomUUID(), actorId: request.user.id, actorEmail: request.user.email,
    action, entityType, entityId, details: details ? JSON.stringify(details) : null,
    ipAddress: request.ip || null, createdAt: new Date().toISOString(),
  });
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_request, response) => response.json({ ok: true, database: databasePath, cloudflareAccess: accessConfigured, discordAuth: discordConfigured }));
app.get('/api/admin/me', requireAdmin, (request, response) => response.json(request.user));
app.get('/api/auth/me', requireAdmin, (request, response) => response.json(request.user));
app.get('/api/admin/audit', requireAdmin, (request, response) => {
  const limit = Math.min(200, Math.max(1, Number(request.query.limit || 50)));
  const offset = Math.max(0, Number(request.query.offset || 0));
  response.json(listAudit.all(limit, offset).map((row) => ({ ...row, details: row.details ? JSON.parse(row.details) : null })));
});
app.get('/api/admin/settings', requireAdmin, (_request, response) => response.json({
  appBaseUrl, databasePath, cloudflareAccess: accessConfigured, discordAuth: discordConfigured,
  discordClientId: discordClientId || null, discordRedirectUri: discordRedirectUri || null,
  sessionDays,
}));

app.get('/api/member/me', (request, response) => response.json(readMember(request)));
app.get('/api/auth/discord', (_request, response) => response.redirect('/api/member/login'));
app.get('/api/member/login', (request, response) => {
  if (!discordConfigured) return response.status(503).send('Discord authentication is not configured.');
  const now = new Date();
  const state = crypto.randomBytes(24).toString('hex');
  const expires = new Date(now.getTime() + 10 * 60 * 1000);
  insertOauthState.run(state, safeReturnTo(request.query.returnTo), now.toISOString(), expires.toISOString());
  const params = new URLSearchParams({ client_id: discordClientId, redirect_uri: discordRedirectUri, response_type: 'code', scope: 'identify email', state, prompt: 'none' });
  response.redirect(`https://discord.com/oauth2/authorize?${params}`);
});
app.get('/api/auth/discord/callback', async (request, response) => {
  try {
    if (!discordConfigured) throw new Error('Discord authentication is not configured.');
    const code = String(request.query.code || '');
    const state = String(request.query.state || '');
    if (!code || !state) throw new Error('Discord did not return a valid login response.');
    const stateRow = consumeOauthState.get(state);
    if (!stateRow || stateRow.expires_at <= new Date().toISOString()) throw new Error('The Discord login request expired.');
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: discordClientId, client_secret: discordClientSecret, grant_type: 'authorization_code', code, redirect_uri: discordRedirectUri }),
    });
    if (!tokenResponse.ok) throw new Error('Discord token exchange failed.');
    const tokens = await tokenResponse.json();
    const userResponse = await fetch('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    if (!userResponse.ok) throw new Error('Discord profile lookup failed.');
    const discordUser = await userResponse.json();
    const now = new Date();
    upsertDiscordUser.run({ discordId: discordUser.id, username: discordUser.username, globalName: discordUser.global_name || null, avatar: discordAvatarUrl(discordUser), email: discordUser.email || null, now: now.toISOString() });
    const sessionToken = crypto.randomBytes(32).toString('base64url');
    const expires = new Date(now.getTime() + sessionDays * 86400000);
    insertSession.run(crypto.randomUUID(), discordUser.id, tokenHash(sessionToken), now.toISOString(), expires.toISOString());
    response.setHeader('Set-Cookie', serializeCookie(memberCookieName, sessionToken, { path: '/', httpOnly: true, secure: isProduction, sameSite: 'Lax', maxAge: sessionDays * 86400 }));
    response.redirect(`${appBaseUrl}${safeReturnTo(stateRow.return_to)}`);
  } catch (error) {
    console.error('[Discord Auth]', error);
    response.redirect(`${appBaseUrl}/login?error=${encodeURIComponent(error.message)}`);
  }
});
app.post('/api/member/logout', (request, response) => {
  const token = parseCookies(request.headers.cookie || '')[memberCookieName];
  if (token && discordConfigured) deleteSession.run(tokenHash(token));
  response.setHeader('Set-Cookie', serializeCookie(memberCookieName, '', { path: '/', httpOnly: true, secure: isProduction, sameSite: 'Lax', maxAge: 0 }));
  response.status(204).end();
});

app.get('/api/entities/:entityType', (request, response) => {
  try {
    const entityType = normaliseEntityType(request.params.entityType);
    let items = listEntities.all(entityType).map(parseRow);
    if (request.query.filters) items = items.filter((item) => matchesFilters(item, JSON.parse(String(request.query.filters))));
    response.json(sortItems(items, String(request.query.sort || '')));
  } catch (error) { response.status(400).json({ error: error.message }); }
});
app.get('/api/entities/:entityType/:id', (request, response) => {
  try {
    const item = parseRow(getEntity.get(normaliseEntityType(request.params.entityType), request.params.id));
    if (!item) return response.status(404).json({ error: 'Item not found.' });
    response.json(item);
  } catch (error) { response.status(400).json({ error: error.message }); }
});
app.post('/api/entities/:entityType', requireAdmin, (request, response) => {
  try {
    const entityType = normaliseEntityType(request.params.entityType);
    const id = String(request.body?.id || crypto.randomUUID());
    const now = new Date().toISOString();
    const data = { ...(request.body || {}), id, created_date: request.body?.created_date || now, updated_date: now };
    insertEntity.run({ entityType, id, data: JSON.stringify(data), createdAt: data.created_date, updatedAt: now });
    audit(request, 'create', entityType, id, { name: data.name || data.title || null });
    response.status(201).json(data);
  } catch (error) { response.status(String(error.message).includes('UNIQUE') ? 409 : 400).json({ error: error.message }); }
});
app.put('/api/entities/:entityType/:id', requireAdmin, (request, response) => {
  try {
    const entityType = normaliseEntityType(request.params.entityType);
    const existing = parseRow(getEntity.get(entityType, request.params.id));
    if (!existing) return response.status(404).json({ error: 'Item not found.' });
    const now = new Date().toISOString();
    const data = { ...existing, ...(request.body || {}), id: request.params.id, created_date: existing.created_date, updated_date: now };
    updateEntity.run({ entityType, id: request.params.id, data: JSON.stringify(data), updatedAt: now });
    audit(request, 'update', entityType, request.params.id, { changedFields: Object.keys(request.body || {}) });
    response.json(data);
  } catch (error) { response.status(400).json({ error: error.message }); }
});
app.delete('/api/entities/:entityType/:id', requireAdmin, (request, response) => {
  try {
    const entityType = normaliseEntityType(request.params.entityType);
    const result = deleteEntity.run(entityType, request.params.id);
    if (!result.changes) return response.status(404).json({ error: 'Item not found.' });
    audit(request, 'delete', entityType, request.params.id);
    response.status(204).end();
  } catch (error) { response.status(400).json({ error: error.message }); }
});

const distDir = path.join(projectRoot, 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (request, response, next) => {
    if (request.path.startsWith('/api/')) return next();
    response.sendFile(path.join(distDir, 'index.html'));
  });
}
app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: 'Internal server error.' });
});
app.listen(port, '0.0.0.0', () => {
  console.log(`ApexOrder running on http://0.0.0.0:${port}`);
  console.log(`SQLite database: ${databasePath}`);
  console.log(`Cloudflare Access: ${accessConfigured ? 'configured' : 'not configured'}`);
  console.log(`Discord OAuth: ${discordConfigured ? 'configured' : 'not configured'}`);
});
