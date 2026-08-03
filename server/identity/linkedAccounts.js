import crypto from 'node:crypto';

function parseCookies(header = '') {
  return Object.fromEntries(String(header).split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
    const separator = part.indexOf('=');
    return [decodeURIComponent(separator >= 0 ? part.slice(0, separator) : part), decodeURIComponent(separator >= 0 ? part.slice(separator + 1) : '')];
  }));
}

function safeReturnTo(value, fallback = '/') {
  const candidate = String(value || fallback).trim();
  return candidate.startsWith('/') && !candidate.startsWith('//') ? candidate : fallback;
}

function avatarForDiscord(user) {
  return user?.avatar || null;
}

export function registerLinkedAccountRoutes(app, db) {
  const sessionSecret = String(process.env.SESSION_SECRET || '').trim();
  const appBaseUrl = String(process.env.APP_BASE_URL || 'http://localhost:5173').trim().replace(/\/$/, '');
  const battleNetClientId = String(process.env.BATTLE_NET_CLIENT_ID || '').trim();
  const battleNetClientSecret = String(process.env.BATTLE_NET_CLIENT_SECRET || '').trim();
  const battleNetRedirectUri = String(process.env.BATTLE_NET_REDIRECT_URI || `${appBaseUrl}/api/auth/battlenet/callback`).trim();
  const battleNetRegion = String(process.env.BATTLE_NET_REGION || 'eu').trim().toLowerCase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS player_profile_owners (
      player_id TEXT PRIMARY KEY,
      discord_id TEXT NOT NULL,
      claimed_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (discord_id) REFERENCES discord_users(discord_id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_player_profile_owners_discord ON player_profile_owners (discord_id);

    CREATE TABLE IF NOT EXISTS player_linked_accounts (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      display_name TEXT NOT NULL,
      profile_url TEXT,
      avatar_url TEXT,
      verified_at TEXT NOT NULL,
      is_public INTEGER NOT NULL DEFAULT 1,
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (player_id, provider),
      UNIQUE (provider, provider_id)
    );
    CREATE INDEX IF NOT EXISTS idx_player_linked_accounts_player ON player_linked_accounts (player_id);

    CREATE TABLE IF NOT EXISTS account_link_states (
      state TEXT PRIMARY KEY,
      player_id TEXT NOT NULL,
      discord_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      return_to TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
  `);

  const getSessionUser = db.prepare(`
    SELECT u.discord_id, u.username, u.global_name, u.avatar, u.email
    FROM member_sessions s JOIN discord_users u ON u.discord_id = s.discord_id
    WHERE s.token_hash = ? AND s.expires_at > ?
  `);
  const getOwner = db.prepare('SELECT * FROM player_profile_owners WHERE player_id = ?');
  const getPlayer = db.prepare('SELECT id FROM players WHERE id = ? UNION SELECT player_id AS id FROM telemetry_players WHERE player_id = ? LIMIT 1');
  const claim = db.prepare('INSERT INTO player_profile_owners (player_id, discord_id, claimed_at, updated_at) VALUES (?, ?, ?, ?)');
  const listAccounts = db.prepare('SELECT * FROM player_linked_accounts WHERE player_id = ? ORDER BY provider');
  const upsertAccount = db.prepare(`
    INSERT INTO player_linked_accounts
      (id, player_id, provider, provider_id, display_name, profile_url, avatar_url, verified_at, is_public, metadata, created_at, updated_at)
    VALUES (@id, @playerId, @provider, @providerId, @displayName, @profileUrl, @avatarUrl, @verifiedAt, @isPublic, @metadata, @createdAt, @updatedAt)
    ON CONFLICT(player_id, provider) DO UPDATE SET
      provider_id=excluded.provider_id, display_name=excluded.display_name, profile_url=excluded.profile_url,
      avatar_url=excluded.avatar_url, verified_at=excluded.verified_at, metadata=excluded.metadata, updated_at=excluded.updated_at
  `);
  const deleteAccount = db.prepare('DELETE FROM player_linked_accounts WHERE player_id = ? AND provider = ?');
  const updateVisibility = db.prepare('UPDATE player_linked_accounts SET is_public = ?, updated_at = ? WHERE player_id = ? AND provider = ?');
  const insertState = db.prepare('INSERT INTO account_link_states (state, player_id, discord_id, provider, return_to, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const consumeState = db.prepare('DELETE FROM account_link_states WHERE state = ? RETURNING *');

  function tokenHash(token) {
    return crypto.createHmac('sha256', sessionSecret).update(token).digest('hex');
  }

  function member(request) {
    if (!sessionSecret) return null;
    const token = parseCookies(request.headers.cookie || '').apexorder_member;
    if (!token) return null;
    return getSessionUser.get(tokenHash(token), new Date().toISOString()) || null;
  }

  function requireMember(request, response, next) {
    const current = member(request);
    if (!current) return response.status(401).json({ error: 'Discord sign-in required.' });
    request.member = current;
    next();
  }

  function requireOwner(request, response, next) {
    const current = member(request);
    if (!current) return response.status(401).json({ error: 'Discord sign-in required.' });
    const owner = getOwner.get(request.params.id || request.params.playerId);
    if (!owner || owner.discord_id !== current.discord_id) return response.status(403).json({ error: 'You do not own this player profile.' });
    request.member = current;
    next();
  }

  function publicAccount(row, includePrivate = false) {
    if (!row || (!includePrivate && !row.is_public)) return null;
    return {
      provider: row.provider,
      providerId: row.provider_id,
      displayName: row.display_name,
      profileUrl: row.profile_url,
      avatarUrl: row.avatar_url,
      verifiedAt: row.verified_at,
      isPublic: Boolean(row.is_public),
    };
  }

  function saveAccount(playerId, provider, providerId, displayName, profileUrl = null, avatarUrl = null, metadata = {}) {
    const now = new Date().toISOString();
    upsertAccount.run({
      id: crypto.randomUUID(), playerId, provider, providerId: String(providerId), displayName: String(displayName || providerId),
      profileUrl, avatarUrl, verifiedAt: now, isPublic: 1, metadata: JSON.stringify(metadata || {}), createdAt: now, updatedAt: now,
    });
  }

  function createState(playerId, discordId, provider, returnTo) {
    const state = crypto.randomBytes(24).toString('hex');
    const now = new Date();
    insertState.run(state, playerId, discordId, provider, safeReturnTo(returnTo, `/players/${playerId}`), now.toISOString(), new Date(now.getTime() + 10 * 60 * 1000).toISOString());
    return state;
  }

  app.get('/api/players/:id/linked-accounts', (request, response) => {
    const current = member(request);
    const owner = getOwner.get(request.params.id);
    const canManage = Boolean(current && owner?.discord_id === current.discord_id);
    const accounts = listAccounts.all(request.params.id).map((row) => publicAccount(row, canManage)).filter(Boolean);
    response.json({ items: accounts, canManage, claimed: Boolean(owner), battleNetConfigured: Boolean(battleNetClientId && battleNetClientSecret) });
  });

  app.post('/api/players/:id/claim', requireMember, (request, response) => {
    if (!getPlayer.get(request.params.id, request.params.id)) return response.status(404).json({ error: 'Player profile not found.' });
    const existing = getOwner.get(request.params.id);
    if (existing && existing.discord_id !== request.member.discord_id) return response.status(409).json({ error: 'This profile has already been claimed.' });
    if (!existing) {
      const now = new Date().toISOString();
      claim.run(request.params.id, request.member.discord_id, now, now);
    }
    saveAccount(request.params.id, 'discord', request.member.discord_id, request.member.global_name || request.member.username, null, avatarForDiscord(request.member));
    response.json({ ok: true });
  });

  app.post('/api/players/:id/linked-accounts/discord', requireOwner, (request, response) => {
    saveAccount(request.params.id, 'discord', request.member.discord_id, request.member.global_name || request.member.username, null, avatarForDiscord(request.member));
    response.json({ ok: true });
  });

  app.patch('/api/players/:id/linked-accounts/:provider', requireOwner, (request, response) => {
    const provider = String(request.params.provider || '').toLowerCase();
    if (!['steam', 'discord', 'battlenet'].includes(provider)) return response.status(400).json({ error: 'Unsupported provider.' });
    updateVisibility.run(request.body?.isPublic === false ? 0 : 1, new Date().toISOString(), request.params.id, provider);
    response.json({ ok: true });
  });

  app.delete('/api/players/:id/linked-accounts/:provider', requireOwner, (request, response) => {
    const provider = String(request.params.provider || '').toLowerCase();
    if (!['steam', 'discord', 'battlenet'].includes(provider)) return response.status(400).json({ error: 'Unsupported provider.' });
    deleteAccount.run(request.params.id, provider);
    response.json({ ok: true });
  });

  app.get('/api/players/:id/link/steam', requireOwner, (request, response) => {
    const state = createState(request.params.id, request.member.discord_id, 'steam', request.query.returnTo);
    const callback = `${appBaseUrl}/api/auth/steam/callback?state=${encodeURIComponent(state)}`;
    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0', 'openid.mode': 'checkid_setup',
      'openid.return_to': callback, 'openid.realm': appBaseUrl,
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    });
    response.redirect(`https://steamcommunity.com/openid/login?${params}`);
  });

  app.get('/api/auth/steam/callback', async (request, response) => {
    const stateRow = consumeState.get(String(request.query.state || ''));
    const fallback = stateRow?.player_id ? `/players/${stateRow.player_id}` : '/players';
    try {
      if (!stateRow || stateRow.provider !== 'steam' || stateRow.expires_at <= new Date().toISOString()) throw new Error('Steam link request expired.');
      const verification = new URLSearchParams();
      for (const [key, value] of Object.entries(request.query)) if (key.startsWith('openid.')) verification.set(key, String(value));
      verification.set('openid.mode', 'check_authentication');
      const verifyResponse = await fetch('https://steamcommunity.com/openid/login', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: verification });
      const verifyText = await verifyResponse.text();
      if (!verifyResponse.ok || !verifyText.includes('is_valid:true')) throw new Error('Steam could not verify this account.');
      const claimedId = String(request.query['openid.claimed_id'] || '');
      const steamId = claimedId.match(/\/id\/(\d+)$/)?.[1];
      if (!steamId) throw new Error('Steam did not return a SteamID64.');
      saveAccount(stateRow.player_id, 'steam', steamId, steamId, `https://steamcommunity.com/profiles/${steamId}`);
      response.redirect(`${appBaseUrl}${stateRow.return_to}?linked=steam`);
    } catch (error) {
      response.redirect(`${appBaseUrl}${fallback}?linkError=${encodeURIComponent(error.message)}`);
    }
  });

  app.get('/api/players/:id/link/battlenet', requireOwner, (request, response) => {
    if (!battleNetClientId || !battleNetClientSecret) return response.status(503).json({ error: 'Battle.net linking is not configured.' });
    const state = createState(request.params.id, request.member.discord_id, 'battlenet', request.query.returnTo);
    const params = new URLSearchParams({ client_id: battleNetClientId, redirect_uri: battleNetRedirectUri, response_type: 'code', scope: 'openid', state });
    response.redirect(`https://${battleNetRegion}.battle.net/oauth/authorize?${params}`);
  });

  app.get('/api/auth/battlenet/callback', async (request, response) => {
    const stateRow = consumeState.get(String(request.query.state || ''));
    const fallback = stateRow?.player_id ? `/players/${stateRow.player_id}` : '/players';
    try {
      if (!stateRow || stateRow.provider !== 'battlenet' || stateRow.expires_at <= new Date().toISOString()) throw new Error('Battle.net link request expired.');
      const tokenResponse = await fetch(`https://${battleNetRegion}.battle.net/oauth/token`, {
        method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${battleNetClientId}:${battleNetClientSecret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'authorization_code', code: String(request.query.code || ''), redirect_uri: battleNetRedirectUri }),
      });
      if (!tokenResponse.ok) throw new Error('Battle.net token exchange failed.');
      const token = await tokenResponse.json();
      const userResponse = await fetch(`https://${battleNetRegion}.battle.net/oauth/userinfo`, { headers: { Authorization: `Bearer ${token.access_token}` } });
      if (!userResponse.ok) throw new Error('Battle.net profile lookup failed.');
      const user = await userResponse.json();
      saveAccount(stateRow.player_id, 'battlenet', user.sub || user.id, user.battletag || user.battle_tag || user.sub || user.id, null, null, { region: battleNetRegion });
      response.redirect(`${appBaseUrl}${stateRow.return_to}?linked=battlenet`);
    } catch (error) {
      response.redirect(`${appBaseUrl}${fallback}?linkError=${encodeURIComponent(error.message)}`);
    }
  });
}
