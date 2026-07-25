import { createPlayerProviderRegistry } from './providers/registry.js';

function parseServerRow(row) {
  try {
    return { ...JSON.parse(row.data), id: row.id };
  } catch {
    return null;
  }
}

export function startPlayerPoller(db, sessionTracker, options = {}) {
  const intervalMs = Math.max(10000, Number(options.intervalMs || process.env.PLAYER_POLL_INTERVAL_MS || 30000));
  const listServers = db.prepare("SELECT id, data FROM entities WHERE entity_type = 'Server'");
  const providerRegistry = createPlayerProviderRegistry();
  let running = false;

  async function poll() {
    if (running) return;
    running = true;
    try {
      const servers = listServers.all().map(parseServerRow).filter(Boolean);
      for (const server of servers) {
        const provider = providerRegistry.findForServer(server);
        if (!provider) continue;

        try {
          const observation = await provider.getOnlinePlayers(server);
          const observedAt = observation.status?.fetchedAt || new Date().toISOString();

          if (!observation.online) {
            sessionTracker.markServerOffline(server.id, observedAt);
          } else if (observation.complete) {
            const result = sessionTracker.reconcile(server.id, observation.players, observedAt);
            if (result.joined || result.left) {
              console.log(`[PlayerTracker:${provider.providerName}]`, result);
            }
          } else {
            console.warn(`[PlayerTracker:${provider.providerName}] ${server.id} reports players but did not expose every identity; preserving current sessions.`);
          }
        } catch (error) {
          console.error(`[PlayerTracker:${provider.providerName}] Failed to poll ${server.id}:`, error.message);
        }
      }
    } finally {
      running = false;
    }
  }

  const timer = setInterval(poll, intervalMs);
  timer.unref();
  void poll();

  console.log(`Player tracker: enabled (${Math.round(intervalMs / 1000)}s interval; ${providerRegistry.all().map((provider) => provider.providerName).join(', ')})`);
  return { stop: () => clearInterval(timer), poll };
}
