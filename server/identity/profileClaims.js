import crypto from 'node:crypto';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function page(title, message, link = '/players') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} | ApexOrder</title><style>body{margin:0;background:#050807;color:#eef7f1;font-family:system-ui,-apple-system,Segoe UI,sans-serif;min-height:100vh;display:grid;place-items:center}.card{width:min(560px,calc(100% - 40px));padding:32px;border:1px solid rgba(16,255,139,.28);border-radius:14px;background:rgba(8,18,13,.94);box-shadow:0 20px 80px rgba(0,0,0,.45)}h1{margin:0 0 12px;color:#10ff8b}p{line-height:1.6;color:#b8c8be}.button{display:inline-block;margin-top:16px;padding:11px 18px;border-radius:7px;background:#10ff8b;color:#031009;text-decoration:none;font-weight:800}</style></head><body><main class="card"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p><a class="button" href="${escapeHtml(link)}">Continue to ApexOrder</a></main></body></html>`;
}

export function registerProfileClaimRoutes(app, db) {
  const appBaseUrl = String(process.env.APP_BASE_URL || 'http://localhost:5173').trim().replace(/\/$/, '');

  db.exec(`
    CREATE TABLE IF NOT EXISTS game_profile_claim_states (
      state TEXT PRIMARY KEY,
      game TEXT NOT NULL,
      player_id TEXT NOT NULL,
      expected_provider TEXT NOT NULL,
      expected_provider_id TEXT NOT NULL,
      player_name TEXT,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_game_profile_claim_expiry ON game_profile_claim_states (expires_at);

    CREATE TABLE IF NOT EXISTS game_profile_claims (
      player_id TEXT PRIMARY KEY,
      game TEXT NOT NULL,
      provider TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      claimed_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (provider, provider_id)
    );
  `);

  const findSteamPlayer = db.prepare(`
    SELECT id, display_name AS displayName FROM players WHERE provider='steam' AND provider_id=?
    UNION ALL
    SELECT player_id AS id, current_name AS displayName FROM telemetry_players WHERE player_id=?
    LIMIT 1
  `);
  const getClaim = db.prepare('SELECT * FROM game_profile_claims WHERE provider=? AND provider_id=?');
  const insertState = db.prepare(`INSERT INTO game_profile_claim_states
    (state, game, player_id, expected_provider, expected_provider_id, player_name, created_at, expires_at)
    VALUES (?, '7dtd', ?, 'steam', ?, ?, ?, ?)`);
  const consumeState = db.prepare('DELETE FROM game_profile_claim_states WHERE state=? RETURNING *');
  const upsertClaim = db.prepare(`INSERT INTO game_profile_claims
    (player_id, game, provider, provider_id, claimed_at, updated_at)
    VALUES (?, '7dtd', 'steam', ?, ?, ?)
    ON CONFLICT(provider, provider_id) DO UPDATE SET player_id=excluded.player_id, updated_at=excluded.updated_at`);
  const upsertLinkedAccount = db.prepare(`INSERT INTO player_linked_accounts
    (id, player_id, provider, provider_id, display_name, profile_url, avatar_url, verified_at, is_public, metadata, created_at, updated_at)
    VALUES (?, ?, 'steam', ?, ?, ?, NULL, ?, 1, '{}', ?, ?)
    ON CONFLICT(provider, provider_id) DO UPDATE SET player_id=excluded.player_id, display_name=excluded.display_name,
      profile_url=excluded.profile_url, verified_at=excluded.verified_at, updated_at=excluded.updated_at`);

  app.get('/api/claims/7dtd/start', (request, response) => {
    const steamId = String(request.query.playerId || '').trim();
    const suppliedName = String(request.query.name || '').trim().slice(0, 80);
    if (!/^7656119\d{10}$/.test(steamId)) return response.status(400).send(page('Claim unavailable', 'The server did not provide a valid SteamID64.'));

    const existingClaim = getClaim.get('steam', steamId);
    if (existingClaim) return response.send(page('Profile already claimed', 'This Steam account is already linked to its ApexOrder player profile.', `/players/${existingClaim.player_id}`));

    const player = findSteamPlayer.get(steamId, steamId);
    if (!player) return response.status(404).send(page('Profile not ready yet', 'Your telemetry profile has not arrived yet. Rejoin the server and try the link again in a few seconds.'));

    const state = crypto.randomBytes(24).toString('hex');
    const now = new Date();
    insertState.run(state, player.id, steamId, suppliedName || player.displayName || null, now.toISOString(), new Date(now.getTime() + 30 * 60 * 1000).toISOString());
    const callback = `${appBaseUrl}/api/claims/7dtd/steam/callback?state=${encodeURIComponent(state)}`;
    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': callback,
      'openid.realm': appBaseUrl,
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    });
    response.redirect(`https://steamcommunity.com/openid/login?${params}`);
  });

  app.get('/api/claims/7dtd/steam/callback', async (request, response) => {
    const stateRow = consumeState.get(String(request.query.state || ''));
    try {
      if (!stateRow || stateRow.expires_at <= new Date().toISOString()) throw new Error('This claim link has expired. Rejoin the server for a fresh link.');
      const verification = new URLSearchParams();
      for (const [key, value] of Object.entries(request.query)) if (key.startsWith('openid.')) verification.set(key, String(value));
      verification.set('openid.mode', 'check_authentication');
      const verifyResponse = await fetch('https://steamcommunity.com/openid/login', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: verification,
      });
      const verifyText = await verifyResponse.text();
      if (!verifyResponse.ok || !verifyText.includes('is_valid:true')) throw new Error('Steam could not verify this sign-in.');
      const claimedId = String(request.query['openid.claimed_id'] || '');
      const steamId = claimedId.match(/\/id\/(\d+)$/)?.[1];
      if (!steamId || steamId !== stateRow.expected_provider_id) throw new Error('The signed-in Steam account does not match the account playing on the server.');

      const now = new Date().toISOString();
      const displayName = stateRow.player_name || steamId;
      const profileUrl = `https://steamcommunity.com/profiles/${steamId}`;
      upsertClaim.run(stateRow.player_id, steamId, now, now);
      upsertLinkedAccount.run(crypto.randomUUID(), stateRow.player_id, steamId, displayName, profileUrl, now, now, now);
      response.send(page('Profile claimed!', `Steam verified successfully. ${displayName}'s 7 Days to Die stats are now linked to this Steam account.`, `/players/${stateRow.player_id}`));
    } catch (error) {
      response.status(400).send(page('Claim failed', error.message || 'The profile could not be claimed.'));
    }
  });
}
