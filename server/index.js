import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import express from 'express';
import { OAuth2Client } from 'google-auth-library';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const dataDir = path.resolve(process.env.DATA_DIR || path.join(projectRoot, 'data'));
const databasePath = path.join(dataDir, 'apexorder.sqlite');
const port = Number(process.env.PORT || 3001);
const googleClientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
const sessionDays = Math.max(1, Number(process.env.SESSION_DAYS || 7));
const isProduction = process.env.NODE_ENV === 'production';
const adminEmails = new Set(
  String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

if (isProduction && !googleClientId) {
  console.warn('GOOGLE_CLIENT_ID is not configured. Admin login is disabled.');
}

if (isProduction && adminEmails.size === 0) {
  console.warn('ADMIN_EMAILS is empty. No Google account can access the admin panel.');
}

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

  CREATE INDEX IF NOT EXISTS idx_entities_type_created
    ON entities (entity_type, created_at DESC);

  CREATE TABLE IF NOT EXISTS admin_sessions (
    token_hash TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT,
    picture TEXT,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_admin_sessions_expiry
    ON admin_sessions (expires_at);
`);

const listEntities = db.prepare(`
  SELECT id, data, created_at, updated_at
  FROM entities
  WHERE entity_type = ?
`);
const getEntity = db.prepare(`
  SELECT id, data, created_at, updated_at
  FROM entities
  WHERE entity_type = ? AND id = ?
`);
const insertEntity = db.prepare(`
  INSERT INTO entities (entity_type, id, data, created_at, updated_at)
  VALUES (@entityType, @id, @data, @createdAt, @updatedAt)
`);
const updateEntity = db.prepare(`
  UPDATE entities
  SET data = @data, updated_at = @updatedAt
  WHERE entity_type = @entityType AND id = @id
`);
const deleteEntity = db.prepare(`
  DELETE FROM entities
  WHERE entity_type = ? AND id = ?
`);
const insertSession = db.prepare(`
  INSERT INTO admin_sessions (token_hash, email, name, picture, created_at, expires_at)
  VALUES (@tokenHash, @email, @name, @picture, @createdAt, @expiresAt)
`);
const getSession = db.prepare(`
  SELECT email, name, picture, expires_at
  FROM admin_sessions
  WHERE token_hash = ?
`);
const deleteSession = db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?');
const deleteExpiredSessions = db.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?');
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;
const sessionCookieName = 'apexorder_admin';

function normaliseEntityType(value) {
  const entityType = String(value || '').trim();
  if (!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(entityType)) {
    throw new Error('Invalid entity type.');
  }
  return entityType;
}

function parseRow(row) {
  if (!row) return null;
  const data = JSON.parse(row.data);
  return {
    ...data,
    id: row.id,
    created_date: data.created_date || row.created_at,
    updated_date: row.updated_at,
  };
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

function sortItems(items, sortExpression) {
  if (!sortExpression) return items;
  const descending = sortExpression.startsWith('-');
  const key = descending ? sortExpression.slice(1) : sortExpression;
  return [...items].sort((left, right) => {
    const a = left[key];
    const b = right[key];
    if (a === b) return 0;
    if (a === undefined || a === null) return 1;
    if (b === undefined || b === null) return -1;
    const result = String(a).localeCompare(String(b), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
    return descending ? -result : result;
  });
}

function parseCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf('=');
        const key = separator >= 0 ? part.slice(0, separator) : part;
        const value = separator >= 0 ? part.slice(separator + 1) : '';
        return [decodeURIComponent(key), decodeURIComponent(value)];
      })
  );
}

function hashSessionToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function setSessionCookie(response, token, expiresAt) {
  const attributes = [
    `${sessionCookieName}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Expires=${expiresAt.toUTCString()}`,
  ];
  if (isProduction) attributes.push('Secure');
  response.setHeader('Set-Cookie', attributes.join('; '));
}

function clearSessionCookie(response) {
  const attributes = [
    `${sessionCookieName}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ];
  if (isProduction) attributes.push('Secure');
  response.setHeader('Set-Cookie', attributes.join('; '));
}

function readAdminSession(request) {
  deleteExpiredSessions.run(new Date().toISOString());
  const token = parseCookies(request.headers.cookie)[sessionCookieName];
  if (!token) return null;
  const session = getSession.get(hashSessionToken(token));
  if (!session || new Date(session.expires_at) <= new Date()) return null;
  return {
    id: session.email,
    email: session.email,
    full_name: session.name || session.email,
    picture: session.picture || null,
    role: 'admin',
  };
}

function requireAdmin(request, response, next) {
  const user = readAdminSession(request);
  if (!user) return response.status(401).json({ error: 'Admin authentication required.' });
  request.user = user;
  next();
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, database: databasePath, googleAuth: Boolean(googleClientId) });
});

app.get('/api/auth/config', (_request, response) => {
  response.json({ googleClientId, enabled: Boolean(googleClientId && adminEmails.size) });
});

app.get('/api/auth/me', (request, response) => {
  const user = readAdminSession(request);
  if (!user) return response.status(401).json({ error: 'Not authenticated.' });
  response.json(user);
});

app.post('/api/auth/google', async (request, response) => {
  try {
    if (!googleClient || !googleClientId) {
      return response.status(503).json({ error: 'Google authentication is not configured.' });
    }

    const credential = String(request.body?.credential || '');
    if (!credential) return response.status(400).json({ error: 'Missing Google credential.' });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });
    const payload = ticket.getPayload();
    const email = String(payload?.email || '').trim().toLowerCase();

    if (!payload?.email_verified || !email) {
      return response.status(401).json({ error: 'Google email address could not be verified.' });
    }
    if (!adminEmails.has(email)) {
      return response.status(403).json({ error: 'This Google account is not authorised as an administrator.' });
    }

    const token = crypto.randomBytes(32).toString('base64url');
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + sessionDays * 24 * 60 * 60 * 1000);
    insertSession.run({
      tokenHash: hashSessionToken(token),
      email,
      name: payload.name || email,
      picture: payload.picture || null,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
    setSessionCookie(response, token, expiresAt);
    response.json({
      id: email,
      email,
      full_name: payload.name || email,
      picture: payload.picture || null,
      role: 'admin',
    });
  } catch (error) {
    console.error('[Auth] Google sign-in failed:', error);
    response.status(401).json({ error: 'Google sign-in could not be verified.' });
  }
});

app.post('/api/auth/logout', (request, response) => {
  const token = parseCookies(request.headers.cookie)[sessionCookieName];
  if (token) deleteSession.run(hashSessionToken(token));
  clearSessionCookie(response);
  response.status(204).end();
});

app.get('/api/entities/:entityType', (request, response) => {
  try {
    const entityType = normaliseEntityType(request.params.entityType);
    let items = listEntities.all(entityType).map(parseRow);
    if (request.query.filters) {
      const filters = JSON.parse(String(request.query.filters));
      items = items.filter((item) => matchesFilters(item, filters));
    }
    items = sortItems(items, String(request.query.sort || ''));
    response.json(items);
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
});

app.get('/api/entities/:entityType/:id', (request, response) => {
  try {
    const entityType = normaliseEntityType(request.params.entityType);
    const item = parseRow(getEntity.get(entityType, request.params.id));
    if (!item) return response.status(404).json({ error: 'Item not found.' });
    response.json(item);
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
});

app.post('/api/entities/:entityType', requireAdmin, (request, response) => {
  try {
    const entityType = normaliseEntityType(request.params.entityType);
    const id = String(request.body?.id || crypto.randomUUID());
    const now = new Date().toISOString();
    const data = {
      ...(request.body || {}),
      id,
      created_date: request.body?.created_date || now,
      updated_date: now,
    };
    insertEntity.run({
      entityType,
      id,
      data: JSON.stringify(data),
      createdAt: data.created_date,
      updatedAt: now,
    });
    response.status(201).json(data);
  } catch (error) {
    const status = String(error.message).includes('UNIQUE') ? 409 : 400;
    response.status(status).json({ error: error.message });
  }
});

app.put('/api/entities/:entityType/:id', requireAdmin, (request, response) => {
  try {
    const entityType = normaliseEntityType(request.params.entityType);
    const existing = parseRow(getEntity.get(entityType, request.params.id));
    if (!existing) return response.status(404).json({ error: 'Item not found.' });
    const now = new Date().toISOString();
    const data = {
      ...existing,
      ...(request.body || {}),
      id: request.params.id,
      created_date: existing.created_date,
      updated_date: now,
    };
    updateEntity.run({
      entityType,
      id: request.params.id,
      data: JSON.stringify(data),
      updatedAt: now,
    });
    response.json(data);
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
});

app.delete('/api/entities/:entityType/:id', requireAdmin, (request, response) => {
  try {
    const entityType = normaliseEntityType(request.params.entityType);
    const result = deleteEntity.run(entityType, request.params.id);
    if (!result.changes) return response.status(404).json({ error: 'Item not found.' });
    response.status(204).end();
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
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
});
