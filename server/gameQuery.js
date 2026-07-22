import { GameDig } from 'gamedig';

const cache = new Map();
const cacheTtlMs = Math.max(5000, Number(process.env.GAME_QUERY_CACHE_MS || 15000));
const queryTimeoutMs = Math.max(1000, Number(process.env.GAME_QUERY_TIMEOUT_MS || 5000));

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalisePlayers(players) {
  if (!Array.isArray(players)) return [];
  return players
    .map((player) => ({
      name: String(player?.name || '').trim(),
      score: numberOrNull(player?.score),
      time: numberOrNull(player?.time),
    }))
    .filter((player) => player.name);
}

function cacheKey(server) {
  return `${server.id}:${server.query_host || '127.0.0.1'}:${Number(server.query_port || 26903)}`;
}

export function clearGameQueryCache(serverId) {
  for (const key of cache.keys()) {
    if (key.startsWith(`${serverId}:`)) cache.delete(key);
  }
}

export async function queryServerStatus(server, force = false) {
  const host = String(server?.query_host || '127.0.0.1').trim();
  const port = Number(server?.query_port || 26903);
  if (!host) throw new Error('Query host is required.');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Query port must be between 1 and 65535.');

  const key = cacheKey(server);
  const cached = cache.get(key);
  if (!force && cached && Date.now() - cached.time < cacheTtlMs) return cached.value;

  try {
    const result = await GameDig.query({
      type: 'protocol-valve',
      host,
      port,
      socketTimeout: queryTimeoutMs,
      attemptTimeout: queryTimeoutMs,
      maxAttempts: 1,
    });

    const players = normalisePlayers(result.players);
    const value = {
      serverId: server.id,
      source: 'gamedig',
      available: true,
      online: true,
      state: 'online',
      name: result.name || null,
      map: result.map || null,
      version: result.version || null,
      playersCurrent: numberOrNull(result.numplayers) ?? players.length,
      playersMax: numberOrNull(result.maxplayers),
      ping: numberOrNull(result.ping),
      password: Boolean(result.password),
      queryHost: host,
      queryPort: numberOrNull(result.queryPort) ?? port,
      players,
      fetchedAt: new Date().toISOString(),
    };

    cache.set(key, { time: Date.now(), value });
    return value;
  } catch (error) {
    const value = {
      serverId: server.id,
      source: 'gamedig',
      available: false,
      online: false,
      state: 'offline',
      queryHost: host,
      queryPort: port,
      error: error?.message || 'Server query failed.',
      fetchedAt: new Date().toISOString(),
    };
    cache.set(key, { time: Date.now(), value });
    return value;
  }
}
