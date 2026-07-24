export function registerIdentityRoutes(app, identityService) {
  app.get('/api/players', (request, response) => {
    response.json(identityService.listPlayers({
      limit: request.query.limit,
      offset: request.query.offset,
    }));
  });

  app.get('/api/players/:id', (request, response) => {
    const player = identityService.getPlayer(request.params.id);
    if (!player) return response.status(404).json({ error: 'Player not found.' });
    response.json(player);
  });

  app.get('/api/players/:id/sessions', (request, response) => {
    const player = identityService.getPlayer(request.params.id);
    if (!player) return response.status(404).json({ error: 'Player not found.' });
    response.json(identityService.listSessions(request.params.id, {
      limit: request.query.limit,
      offset: request.query.offset,
    }));
  });
}
