import crypto from 'node:crypto';

function parseCookies(header = '') {
  return Object.fromEntries(String(header).split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
    const separator = part.indexOf('=');
    return [decodeURIComponent(separator >= 0 ? part.slice(0, separator) : part), decodeURIComponent(separator >= 0 ? part.slice(separator + 1) : '')];
  }));
}

export function registerProfileHubRoutes(app, db) {
  const sessionSecret = String(process.env.SESSION_SECRET || '').trim();

  db.exec(`
    CREATE TABLE IF NOT EXISTS player_profile_details (
      player_id TEXT PRIMARY KEY,
      display_name TEXT,
      bio TEXT NOT NULL DEFAULT '',
      avatar_url TEXT,
      banner_url TEXT,
      location TEXT,
      favourite_game TEXT,
      is_public INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const getSessionUser = db.prepare(`
    SELECT u.discord_id, u.username, u.global_name, u.avatar
    FROM member_sessions s JOIN discord_users u ON u.discord_id = s.discord_id
    WHERE s.token_hash = ? AND s.expires_at > ?
  `);
  const getOwner = db.prepare('SELECT * FROM player_profile_owners WHERE player_id = ?');
  const getDetails = db.prepare('SELECT * FROM player_profile_details WHERE player_id = ?');
  const saveDetails = db.prepare(`
    INSERT INTO player_profile_details
      (player_id, display_name, bio, avatar_url, banner_url, location, favourite_game, is_public, created_at, updated_at)
    VALUES (@playerId, @displayName, @bio, @avatarUrl, @bannerUrl, @location, @favouriteGame, @isPublic, @createdAt, @updatedAt)
    ON CONFLICT(player_id) DO UPDATE SET
      display_name=excluded.display_name, bio=excluded.bio, avatar_url=excluded.avatar_url,
      banner_url=excluded.banner_url, location=excluded.location, favourite_game=excluded.favourite_game,
      is_public=excluded.is_public, updated_at=excluded.updated_at
  `);
  const listAccounts = db.prepare('SELECT provider, provider_id, display_name, profile_url, avatar_url, verified_at, is_public FROM player_linked_accounts WHERE player_id = ? ORDER BY provider');
  const getDayz = db.prepare('SELECT total_playtime_seconds, session_count, first_seen_at, last_seen_at FROM players WHERE id = ?');
  const getSeven = db.prepare('SELECT current_name, aliases_json, zombie_kills, pvp_kills, deaths, total_playtime_seconds, level, game_stage, score, first_seen_at, last_seen_at, server_id FROM telemetry_players WHERE player_id = ?');

  function tokenHash(token) {
    return crypto.createHmac('sha256', sessionSecret).update(token).digest('hex');
  }

  function member(request) {
    if (!sessionSecret) return null;
    const token = parseCookies(request.headers.cookie || '').apexorder_member;
    if (!token) return null;
    return getSessionUser.get(tokenHash(token), new Date().toISOString()) || null;
  }

  function canManage(request, playerId) {
    const current = member(request);
    const owner = getOwner.get(playerId);
    return Boolean(current && owner?.discord_id === current.discord_id);
  }

  function achievements(playerId, accounts, dayz, seven) {
    const result = [];
    const add = (id, name, description, tier = 'bronze') => result.push({ id, name, description, tier });
    if (accounts.length >= 1) add('connected', 'Connected', 'Linked the first verified account.');
    if (accounts.length >= 3) add('identity-complete', 'Identity Complete', 'Linked Steam, Discord and Battle.net.', 'gold');
    if (accounts.some((item) => item.provider === 'steam')) add('steam-verified', 'Steam Verified', 'Verified a Steam account.', 'silver');
    if (accounts.some((item) => item.provider === 'battlenet')) add('battlenet-verified', 'Battle.net Verified', 'Verified a Battle.net account.', 'silver');
    const totalPlaytime = Number(dayz?.total_playtime_seconds || 0) + Number(seven?.total_playtime_seconds || 0);
    if (totalPlaytime >= 3600) add('first-hour', 'Settled In', 'Played for at least one hour.');
    if (totalPlaytime >= 86400) add('day-one', 'Dedicated', 'Reached 24 hours across ApexOrder servers.', 'silver');
    if (totalPlaytime >= 360000) add('centurion', 'Centurion', 'Reached 100 hours across ApexOrder servers.', 'gold');
    if (Number(seven?.zombie_kills || 0) >= 100) add('zombie-hunter', 'Zombie Hunter', 'Killed 100 zombies in 7 Days to Die.', 'silver');
    if (Number(seven?.zombie_kills || 0) >= 1000) add('zombie-slayer', 'Zombie Slayer', 'Killed 1,000 zombies in 7 Days to Die.', 'gold');
    if (Number(dayz?.session_count || 0) >= 10) add('dayz-regular', 'Pripyat Regular', 'Completed 10 DayZ sessions.', 'silver');
    return result;
  }

  app.get('/api/players/:id/identity-hub', (request, response) => {
    const playerId = request.params.id;
    const manageable = canManage(request, playerId);
    const details = getDetails.get(playerId);
    if (details && !details.is_public && !manageable) return response.status(404).json({ error: 'Profile not found.' });
    const allAccounts = listAccounts.all(playerId);
    const visibleAccounts = manageable ? allAccounts : allAccounts.filter((item) => item.is_public);
    const dayz = getDayz.get(playerId) || null;
    const seven = getSeven.get(playerId) || null;
    response.json({
      canManage: manageable,
      details: details ? {
        displayName: details.display_name,
        bio: details.bio,
        avatarUrl: details.avatar_url,
        bannerUrl: details.banner_url,
        location: details.location,
        favouriteGame: details.favourite_game,
        isPublic: Boolean(details.is_public),
      } : null,
      accounts: visibleAccounts.map((item) => ({ ...item, isPublic: Boolean(item.is_public) })),
      gameProfiles: {
        dayz: dayz ? { totalPlaytimeSeconds: dayz.total_playtime_seconds, sessionCount: dayz.session_count, firstSeenAt: dayz.first_seen_at, lastSeenAt: dayz.last_seen_at } : null,
        sevenDaysToDie: seven ? { currentName: seven.current_name, aliases: JSON.parse(seven.aliases_json || '[]'), zombieKills: seven.zombie_kills, pvpKills: seven.pvp_kills, deaths: seven.deaths, totalPlaytimeSeconds: seven.total_playtime_seconds, level: seven.level, gameStage: seven.game_stage, score: seven.score, firstSeenAt: seven.first_seen_at, lastSeenAt: seven.last_seen_at, serverId: seven.server_id } : null,
      },
      achievements: achievements(playerId, allAccounts, dayz, seven),
    });
  });

  app.put('/api/players/:id/identity-hub', (request, response) => {
    const playerId = request.params.id;
    if (!canManage(request, playerId)) return response.status(403).json({ error: 'You do not own this player profile.' });
    const now = new Date().toISOString();
    const clean = (value, max) => String(value || '').trim().slice(0, max);
    const displayName = clean(request.body?.displayName, 48) || null;
    const bio = clean(request.body?.bio, 500);
    const avatarUrl = clean(request.body?.avatarUrl, 500) || null;
    const bannerUrl = clean(request.body?.bannerUrl, 500) || null;
    const location = clean(request.body?.location, 80) || null;
    const favouriteGame = clean(request.body?.favouriteGame, 80) || null;
    for (const value of [avatarUrl, bannerUrl]) if (value && !/^https:\/\//i.test(value)) return response.status(400).json({ error: 'Image URLs must begin with https://.' });
    saveDetails.run({ playerId, displayName, bio, avatarUrl, bannerUrl, location, favouriteGame, isPublic: request.body?.isPublic === false ? 0 : 1, createdAt: now, updatedAt: now });
    response.json({ ok: true });
  });
}
