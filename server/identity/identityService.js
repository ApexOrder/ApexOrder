import crypto from 'node:crypto';

function clampLimit(value, fallback = 50, maximum = 100) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(1, Math.trunc(parsed)));
}

function clampOffset(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.trunc(parsed));
}

function publicPlayer(row) {
  if (!row) return null;
  return {
    id: row.id,
    identityId: row.identity_id || null,
    provider: row.provider,
    providerId: row.provider_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url || null,
    profileUrl: row.profile_url || null,
    countryCode: row.country_code || null,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    totalPlaytimeSeconds: Number(row.total_playtime_seconds || 0),
    sessionCount: Number(row.session_count || 0),
  };
}

function publicSession(row) {
  return {
    id: row.id,
    playerId: row.player_id,
    serverId: row.server_id,
    connectedAt: row.connected_at,
    disconnectedAt: row.disconnected_at || null,
    durationSeconds: row.duration_seconds === null ? null : Number(row.duration_seconds),
  };
}

export function createIdentityService(db) {
  const listPlayersStatement = db.prepare(`
    SELECT p.*,
      COALESCE(SUM(ps.duration_seconds), 0) AS total_playtime_seconds,
      COUNT(ps.id) AS session_count
    FROM players p
    LEFT JOIN player_sessions ps ON ps.player_id = p.id
    GROUP BY p.id
    ORDER BY p.last_seen_at DESC
    LIMIT ? OFFSET ?
  `);
  const countPlayersStatement = db.prepare('SELECT COUNT(*) AS count FROM players');
  const getPlayerStatement = db.prepare(`
    SELECT p.*,
      COALESCE(SUM(ps.duration_seconds), 0) AS total_playtime_seconds,
      COUNT(ps.id) AS session_count
    FROM players p
    LEFT JOIN player_sessions ps ON ps.player_id = p.id
    WHERE p.id = ?
    GROUP BY p.id
  `);
  const getPlayerByProviderStatement = db.prepare('SELECT * FROM players WHERE provider = ? AND provider_id = ?');
  const insertPlayerStatement = db.prepare(`
    INSERT INTO players (
      id, identity_id, provider, provider_id, display_name, avatar_url, profile_url,
      country_code, first_seen_at, last_seen_at, created_at, updated_at
    ) VALUES (
      @id, @identityId, @provider, @providerId, @displayName, @avatarUrl, @profileUrl,
      @countryCode, @now, @now, @now, @now
    )
  `);
  const updatePlayerStatement = db.prepare(`
    UPDATE players SET
      display_name = @displayName,
      avatar_url = COALESCE(@avatarUrl, avatar_url),
      profile_url = COALESCE(@profileUrl, profile_url),
      country_code = COALESCE(@countryCode, country_code),
      last_seen_at = @now,
      updated_at = @now
    WHERE id = @id
  `);
  const listSessionsStatement = db.prepare(`
    SELECT id, player_id, server_id, connected_at, disconnected_at, duration_seconds
    FROM player_sessions
    WHERE player_id = ?
    ORDER BY connected_at DESC
    LIMIT ? OFFSET ?
  `);
  const countSessionsStatement = db.prepare('SELECT COUNT(*) AS count FROM player_sessions WHERE player_id = ?');

  const upsertPlayerTransaction = db.transaction((player) => {
    const provider = String(player.provider || '').trim().toLowerCase();
    const providerId = String(player.providerId || '').trim();
    const displayName = String(player.displayName || '').trim();
    if (!provider || !providerId || !displayName) throw new Error('provider, providerId and displayName are required.');

    const now = new Date().toISOString();
    const existing = getPlayerByProviderStatement.get(provider, providerId);
    if (existing) {
      updatePlayerStatement.run({
        id: existing.id,
        displayName,
        avatarUrl: player.avatarUrl || null,
        profileUrl: player.profileUrl || null,
        countryCode: player.countryCode || null,
        now,
      });
      return existing.id;
    }

    const id = crypto.randomUUID();
    insertPlayerStatement.run({
      id,
      identityId: player.identityId || null,
      provider,
      providerId,
      displayName,
      avatarUrl: player.avatarUrl || null,
      profileUrl: player.profileUrl || null,
      countryCode: player.countryCode || null,
      now,
    });
    return id;
  });

  return {
    listPlayers(options = {}) {
      const limit = clampLimit(options.limit);
      const offset = clampOffset(options.offset);
      return {
        items: listPlayersStatement.all(limit, offset).map(publicPlayer),
        total: Number(countPlayersStatement.get().count),
        limit,
        offset,
      };
    },

    getPlayer(id) {
      return publicPlayer(getPlayerStatement.get(String(id)));
    },

    upsertPlayer(player) {
      const id = upsertPlayerTransaction(player);
      return publicPlayer(getPlayerStatement.get(id));
    },

    listSessions(playerId, options = {}) {
      const limit = clampLimit(options.limit);
      const offset = clampOffset(options.offset);
      return {
        items: listSessionsStatement.all(String(playerId), limit, offset).map(publicSession),
        total: Number(countSessionsStatement.get(String(playerId)).count),
        limit,
        offset,
      };
    },
  };
}
