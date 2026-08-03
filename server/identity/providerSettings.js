import { createRemoteJWKSet, jwtVerify } from 'jose';

function parseCookies(header = '') {
  return Object.fromEntries(String(header).split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
    const separator = part.indexOf('=');
    return [decodeURIComponent(separator >= 0 ? part.slice(0, separator) : part), decodeURIComponent(separator >= 0 ? part.slice(separator + 1) : '')];
  }));
}

function ensureSettingsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_provider_settings (
      provider TEXT PRIMARY KEY,
      client_id TEXT,
      client_secret TEXT,
      redirect_uri TEXT,
      region TEXT,
      updated_at TEXT NOT NULL
    );
  `);
}

export function applyStoredProviderSettings(db) {
  ensureSettingsTable(db);
  const row = db.prepare('SELECT * FROM auth_provider_settings WHERE provider = ?').get('battlenet');
  if (!row) return false;
  process.env.BATTLE_NET_CLIENT_ID = row.client_id || '';
  process.env.BATTLE_NET_CLIENT_SECRET = row.client_secret || '';
  process.env.BATTLE_NET_REDIRECT_URI = row.redirect_uri || '';
  process.env.BATTLE_NET_REGION = row.region || 'eu';
  return Boolean(row.client_id && row.client_secret);
}

export function registerProviderSettingsRoutes(app, db) {
  const teamDomain = String(process.env.CLOUDFLARE_ACCESS_TEAM_DOMAIN || '').trim().replace(/\/$/, '');
  const audience = String(process.env.CLOUDFLARE_ACCESS_AUD || '').trim();
  const jwks = teamDomain && audience ? createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`)) : null;
  const defaultRedirectUri = `${String(process.env.APP_BASE_URL || 'http://localhost:5173').trim().replace(/\/$/, '')}/api/auth/battlenet/callback`;

  ensureSettingsTable(db);
  const getSettings = db.prepare('SELECT * FROM auth_provider_settings WHERE provider = ?');
  const saveSettings = db.prepare(`
    INSERT INTO auth_provider_settings (provider, client_id, client_secret, redirect_uri, region, updated_at)
    VALUES (@provider, @clientId, @clientSecret, @redirectUri, @region, @updatedAt)
    ON CONFLICT(provider) DO UPDATE SET
      client_id=excluded.client_id,
      client_secret=excluded.client_secret,
      redirect_uri=excluded.redirect_uri,
      region=excluded.region,
      updated_at=excluded.updated_at
  `);

  async function requireAdmin(request, response, next) {
    try {
      if (!jwks) return response.status(503).json({ error: 'Cloudflare Access is not configured.' });
      const token = String(request.headers['cf-access-jwt-assertion'] || parseCookies(request.headers.cookie || '').CF_Authorization || '');
      if (!token) return response.status(401).json({ error: 'Cloudflare Access authentication required.' });
      const { payload } = await jwtVerify(token, jwks, { issuer: teamDomain, audience });
      if (!payload.email) return response.status(401).json({ error: 'Invalid Cloudflare Access session.' });
      request.adminEmail = String(payload.email).toLowerCase();
      next();
    } catch (error) {
      console.error('[Provider Settings Auth]', error.message);
      response.status(401).json({ error: 'Invalid Cloudflare Access session.' });
    }
  }

  app.get('/api/admin/provider-settings/battlenet', requireAdmin, (_request, response) => {
    const row = getSettings.get('battlenet');
    const clientId = row?.client_id || String(process.env.BATTLE_NET_CLIENT_ID || '').trim();
    const clientSecret = row?.client_secret || String(process.env.BATTLE_NET_CLIENT_SECRET || '').trim();
    response.json({
      clientId,
      clientSecretConfigured: Boolean(clientSecret),
      redirectUri: row?.redirect_uri || String(process.env.BATTLE_NET_REDIRECT_URI || defaultRedirectUri).trim(),
      region: row?.region || String(process.env.BATTLE_NET_REGION || 'eu').trim().toLowerCase(),
      configured: Boolean(clientId && clientSecret),
      updatedAt: row?.updated_at || null,
    });
  });

  app.put('/api/admin/provider-settings/battlenet', requireAdmin, (request, response) => {
    const clientId = String(request.body?.clientId || '').trim();
    const redirectUri = String(request.body?.redirectUri || defaultRedirectUri).trim();
    const region = String(request.body?.region || 'eu').trim().toLowerCase();
    const existing = getSettings.get('battlenet');
    const suppliedSecret = String(request.body?.clientSecret || '').trim();
    const clientSecret = suppliedSecret || existing?.client_secret || String(process.env.BATTLE_NET_CLIENT_SECRET || '').trim();

    if (!clientId) return response.status(400).json({ error: 'Battle.net Client ID is required.' });
    if (!clientSecret) return response.status(400).json({ error: 'Battle.net Client Secret is required.' });
    if (!/^https:\/\//i.test(redirectUri)) return response.status(400).json({ error: 'Battle.net Redirect URI must begin with https://.' });
    if (!['eu', 'us', 'kr', 'tw', 'cn'].includes(region)) return response.status(400).json({ error: 'Unsupported Battle.net region.' });

    const updatedAt = new Date().toISOString();
    saveSettings.run({ provider: 'battlenet', clientId, clientSecret, redirectUri, region, updatedAt });
    response.json({
      ok: true,
      clientId,
      clientSecretConfigured: true,
      redirectUri,
      region,
      configured: true,
      updatedAt,
      restarting: true,
    });

    // PM2 will bring the application back up and the stored credentials are loaded before OAuth routes register.
    setTimeout(() => process.exit(0), 500);
  });
}
