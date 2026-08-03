function requireAdmin(request, response, next) {
  const email = String(request.headers['cf-access-authenticated-user-email'] || '').trim();
  const assertion = String(request.headers['cf-access-jwt-assertion'] || '').trim();
  if (!email && !assertion) return response.status(401).json({ error: 'Admin authentication required.' });
  next();
}

export function registerIdentityRoutes(app, identityService, telemetryProfileService, adminStatsService) {
  app.get('/api/players', (request, response) => {
    const identityResult = identityService.listPlayers({ limit: request.query.limit, offset: request.query.offset });
    const identities = identityResult.items.map((player) => telemetryProfileService.enrichPlayer(player));
    const identityKeys = new Set(identities.map((player) => `${player.provider}:${player.providerId}`));
    const telemetryOnly = telemetryProfileService.listPlayers().filter((player) => !identityKeys.has(`${player.provider}:${player.providerId}`));
    const items = [...identities, ...telemetryOnly].sort((left, right) => new Date(right.lastSeenAt) - new Date(left.lastSeenAt));
    response.json({ ...identityResult, items, total: identityResult.total + telemetryOnly.length });
  });

  app.get('/api/players/online', (request, response) => {
    const items = identityService.listOnlinePlayers({ serverId: request.query.serverId }).map((player) => telemetryProfileService.enrichPlayer(player));
    response.json({ items, total: items.length });
  });

  app.get('/api/leaderboards/dayz', (request, response) => {
    const limit = Math.min(100, Math.max(1, Number(request.query.limit || 25)));
    const players = identityService.listPlayers({ limit: 100, offset: 0 }).items;
    const now = Date.now();
    const weekStart = now - (7 * 24 * 60 * 60 * 1000);
    const monthStart = now - (30 * 24 * 60 * 60 * 1000);

    const rows = players.map((player) => {
      const sessions = identityService.listSessions(player.id, { limit: 100, offset: 0 }).items;
      let weekPlaytimeSeconds = 0;
      let monthPlaytimeSeconds = 0;
      let longestSessionSeconds = 0;
      let currentSessionSeconds = 0;

      for (const session of sessions) {
        const connectedAt = new Date(session.connectedAt).getTime();
        const disconnectedAt = session.disconnectedAt ? new Date(session.disconnectedAt).getTime() : now;
        const durationSeconds = Math.max(0, Number(session.durationSeconds ?? Math.floor((disconnectedAt - connectedAt) / 1000)) || 0);
        longestSessionSeconds = Math.max(longestSessionSeconds, durationSeconds);
        if (!session.disconnectedAt) currentSessionSeconds = Math.max(currentSessionSeconds, durationSeconds);
        if (disconnectedAt >= weekStart) weekPlaytimeSeconds += durationSeconds;
        if (disconnectedAt >= monthStart) monthPlaytimeSeconds += durationSeconds;
      }

      return adminStatsService.applyDayzOverride({
        id: player.id,
        provider: player.provider,
        providerId: player.providerId,
        displayName: player.displayName,
        avatarUrl: player.avatarUrl,
        firstSeenAt: player.firstSeenAt,
        lastSeenAt: player.lastSeenAt,
        online: player.online,
        currentServerId: player.currentServerId,
        connectedSince: player.connectedSince,
        totalPlaytimeSeconds: player.totalPlaytimeSeconds,
        weekPlaytimeSeconds,
        monthPlaytimeSeconds,
        sessionCount: player.sessionCount,
        longestSessionSeconds,
        currentSessionSeconds,
      });
    });

    rows.sort((left, right) => right.totalPlaytimeSeconds - left.totalPlaytimeSeconds || String(left.displayName).localeCompare(String(right.displayName)));
    response.json(rows.slice(0, limit));
  });

  app.patch('/api/admin/player-stats/:source/:id', requireAdmin, (request, response) => {
    try {
      const updated = adminStatsService.update(request.params.source, request.params.id, request.body || {});
      if (!updated) return response.status(404).json({ error: 'Player stat record not found.' });
      response.json({ ok: true, item: updated });
    } catch (error) {
      response.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/admin/player-stats/:source/:id', requireAdmin, (request, response) => {
    try {
      const deleted = adminStatsService.delete(request.params.source, request.params.id);
      if (!deleted) return response.status(404).json({ error: 'Player stat record not found.' });
      response.json({ ok: true });
    } catch (error) {
      response.status(400).json({ error: error.message });
    }
  });

  app.get('/api/players/:id', (request, response) => {
    const identityPlayer = identityService.getPlayer(request.params.id);
    const player = identityPlayer ? telemetryProfileService.enrichPlayer(identityPlayer) : telemetryProfileService.getPlayerBySyntheticId(request.params.id);
    if (!player) return response.status(404).json({ error: 'Player not found.' });
    response.json(player);
  });

  app.get('/api/players/:id/sessions', (request, response) => {
    const player = identityService.getPlayer(request.params.id);
    if (!player) {
      const telemetryPlayer = telemetryProfileService.getPlayerBySyntheticId(request.params.id);
      if (!telemetryPlayer) return response.status(404).json({ error: 'Player not found.' });
      return response.json({ items: [], total: 0, limit: Number(request.query.limit || 50), offset: Number(request.query.offset || 0) });
    }
    response.json(identityService.listSessions(request.params.id, { limit: request.query.limit, offset: request.query.offset }));
  });
}
