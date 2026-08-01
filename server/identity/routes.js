export function registerIdentityRoutes(app, identityService, telemetryProfileService) {
  app.get('/api/players', (request, response) => {
    const identityResult = identityService.listPlayers({
      limit: request.query.limit,
      offset: request.query.offset,
    });
    const identities = identityResult.items.map((player) => telemetryProfileService.enrichPlayer(player));
    const identityKeys = new Set(identities.map((player) => `${player.provider}:${player.providerId}`));
    const telemetryOnly = telemetryProfileService.listPlayers()
      .filter((player) => !identityKeys.has(`${player.provider}:${player.providerId}`));
    const items = [...identities, ...telemetryOnly]
      .sort((left, right) => new Date(right.lastSeenAt) - new Date(left.lastSeenAt));
    response.json({ ...identityResult, items, total: identityResult.total + telemetryOnly.length });
  });

  app.get('/api/players/online', (request, response) => {
    const items = identityService.listOnlinePlayers({ serverId: request.query.serverId })
      .map((player) => telemetryProfileService.enrichPlayer(player));
    response.json({ items, total: items.length });
  });

  app.get('/api/players/:id', (request, response) => {
    const identityPlayer = identityService.getPlayer(request.params.id);
    const player = identityPlayer
      ? telemetryProfileService.enrichPlayer(identityPlayer)
      : telemetryProfileService.getPlayerBySyntheticId(request.params.id);
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
    response.json(identityService.listSessions(request.params.id, {
      limit: request.query.limit,
      offset: request.query.offset,
    }));
  });
}
