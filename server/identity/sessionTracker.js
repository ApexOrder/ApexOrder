import crypto from 'node:crypto';

export function createSessionTracker(db, identityService) {
  const getOpenSessions = db.prepare(`
    SELECT id, player_id, server_id, connected_at
    FROM player_sessions
    WHERE server_id = ? AND disconnected_at IS NULL
  `);
  const insertSession = db.prepare(`
    INSERT INTO player_sessions (
      id, player_id, server_id, connected_at, disconnected_at,
      duration_seconds, created_at, updated_at
    ) VALUES (@id, @playerId, @serverId, @now, NULL, NULL, @now, @now)
  `);
  const closeSession = db.prepare(`
    UPDATE player_sessions
    SET disconnected_at = @now,
        duration_seconds = MAX(0, CAST((julianday(@now) - julianday(connected_at)) * 86400 AS INTEGER)),
        updated_at = @now
    WHERE id = @id AND disconnected_at IS NULL
  `);

  const reconcileTransaction = db.transaction((serverId, observedPlayers, observedAt) => {
    const onlinePlayerIds = new Set();

    for (const observedPlayer of observedPlayers) {
      const player = identityService.upsertPlayer({ ...observedPlayer, seenAt: observedAt });
      onlinePlayerIds.add(player.id);
    }

    const openSessions = getOpenSessions.all(serverId);
    const openPlayerIds = new Set(openSessions.map((session) => session.player_id));

    for (const playerId of onlinePlayerIds) {
      if (openPlayerIds.has(playerId)) continue;
      insertSession.run({ id: crypto.randomUUID(), playerId, serverId, now: observedAt });
    }

    for (const session of openSessions) {
      if (onlinePlayerIds.has(session.player_id)) continue;
      closeSession.run({ id: session.id, now: observedAt });
    }

    return {
      serverId,
      online: onlinePlayerIds.size,
      joined: [...onlinePlayerIds].filter((id) => !openPlayerIds.has(id)).length,
      left: openSessions.filter((session) => !onlinePlayerIds.has(session.player_id)).length,
    };
  });

  return {
    reconcile(serverId, observedPlayers, observedAt = new Date().toISOString()) {
      return reconcileTransaction(String(serverId), observedPlayers, observedAt);
    },

    markServerOffline(serverId, observedAt = new Date().toISOString()) {
      return reconcileTransaction(String(serverId), [], observedAt);
    },
  };
}
