function publicTelemetryPlayer(row) {
  if (!row) return null;
  return {
    id: `7dtd:${row.player_id}`,
    identityId: null,
    provider: row.provider || '7dtd',
    providerId: row.player_id,
    displayName: row.current_name || row.player_id,
    avatarUrl: null,
    profileUrl: row.provider === 'steam' ? `https://steamcommunity.com/profiles/${row.player_id}` : null,
    countryCode: null,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    createdAt: row.first_seen_at,
    updatedAt: row.updated_at,
    totalPlaytimeSeconds: Number(row.total_playtime_seconds || 0),
    sessionCount: 0,
    online: false,
    currentServerId: null,
    connectedSince: null,
    games: {
      sevenDaysToDie: {
        serverId: row.latest_server_id || null,
        steamId64: row.provider === 'steam' ? row.player_id : null,
        steamProfileUrl: row.provider === 'steam' ? `https://steamcommunity.com/profiles/${row.player_id}` : null,
        currentName: row.current_name || row.player_id,
        aliases: JSON.parse(row.aliases || '[]'),
        zombieKills: Number(row.zombie_kills || 0),
        pvpKills: Number(row.pvp_kills || 0),
        deaths: Number(row.deaths || 0),
        level: row.level == null ? null : Number(row.level),
        gameStage: row.game_stage == null ? null : Number(row.game_stage),
        score: row.score == null ? null : Number(row.score),
        totalPlaytimeSeconds: Number(row.total_playtime_seconds || 0),
        firstSeenAt: row.first_seen_at,
        lastSeenAt: row.last_seen_at,
      },
    },
  };
}

export function createTelemetryProfileService(db) {
  const tableExists = Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='telemetry_players'").get());
  if (!tableExists) {
    return {
      listPlayers: () => [],
      getPlayerByProvider: () => null,
      getPlayerBySyntheticId: () => null,
      enrichPlayer: (player) => player,
    };
  }

  const eventsTableExists = Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='telemetry_events'").get());
  const latestServerSelect = eventsTableExists
    ? `, (SELECT te.server_id FROM telemetry_events te WHERE te.player_id = tp.player_id ORDER BY te.occurred_at DESC, te.received_at DESC LIMIT 1) AS latest_server_id`
    : ', NULL AS latest_server_id';
  const telemetrySelect = `SELECT tp.*${latestServerSelect} FROM telemetry_players tp`;
  const listStatement = db.prepare(`${telemetrySelect} ORDER BY tp.last_seen_at DESC`);
  const getStatement = db.prepare(`${telemetrySelect} WHERE tp.player_id = ?`);

  function getByProvider(provider, providerId) {
    const normalisedProvider = String(provider || '').toLowerCase();
    const id = String(providerId || '');
    if (!id) return null;
    const row = getStatement.get(id);
    if (!row) return null;
    if (normalisedProvider === 'steam' && row.provider !== 'steam') return null;
    return publicTelemetryPlayer(row);
  }

  return {
    listPlayers() {
      return listStatement.all().map(publicTelemetryPlayer);
    },
    getPlayerByProvider: getByProvider,
    getPlayerBySyntheticId(id) {
      const value = String(id || '');
      if (!value.startsWith('7dtd:')) return null;
      return publicTelemetryPlayer(getStatement.get(value.slice(5)));
    },
    enrichPlayer(player) {
      if (!player) return null;
      const telemetry = getByProvider(player.provider, player.providerId);
      if (!telemetry) return player;
      return {
        ...player,
        firstSeenAt: new Date(player.firstSeenAt) < new Date(telemetry.firstSeenAt) ? player.firstSeenAt : telemetry.firstSeenAt,
        lastSeenAt: new Date(player.lastSeenAt) > new Date(telemetry.lastSeenAt) ? player.lastSeenAt : telemetry.lastSeenAt,
        totalPlaytimeSeconds: Number(player.totalPlaytimeSeconds || 0) + Number(telemetry.totalPlaytimeSeconds || 0),
        games: { ...(player.games || {}), ...(telemetry.games || {}) },
      };
    },
  };
}
