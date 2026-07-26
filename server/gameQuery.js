import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { GameDig } from 'gamedig';

const execFileAsync = promisify(execFile);
const cache = new Map();
const cacheTtlMs = Math.max(5000, Number(process.env.GAME_QUERY_CACHE_MS || 15000));
const queryTimeoutMs = Math.max(1000, Number(process.env.GAME_QUERY_TIMEOUT_MS || 5000));
const rconTimeoutMs = Math.max(1000, Number(process.env.RCON_QUERY_TIMEOUT_MS || 5000));
const berconCliPath = String(process.env.BERCON_CLI_PATH || 'bercon-cli').trim();
const loggedPlayerShapes = new Set();

const supportedQueryTypes = new Set([
  'protocol-valve',
  'dayz',
  'minecraft',
  'minecraftbedrock',
  'rust',
  'valheim',
  'arkse',
  'conanexiles',
  'terraria',
  'cs2',
  'teamspeak3',
  'mumble',
]);

const steamIdKeys = [
  'steamId',
  'steamID',
  'steamid',
  'steam_id',
  'steamID64',
  'steamId64',
  'steamid64',
  'steam_id_64',
  'steam',
  'communityId',
  'communityID',
  'community_id',
];

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function booleanValue(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function validSteamId(value) {
  const candidate = String(value ?? '').trim();
  return /^7656119\d{10}$/.test(candidate) ? candidate : null;
}

function findSteamId(value, depth = 0) {
  if (depth > 3 || value === null || value === undefined) return null;

  const direct = validSteamId(value);
  if (direct) return direct;

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findSteamId(item, depth + 1);
      if (found) return found;
    }
    return null;
  }

  if (typeof value !== 'object') return null;

  for (const key of steamIdKeys) {
    if (!(key in value)) continue;
    const found = findSteamId(value[key], depth + 1);
    if (found) return found;
  }

  for (const nested of Object.values(value)) {
    const found = findSteamId(nested, depth + 1);
    if (found) return found;
  }

  return null;
}

function logUnknownPlayerShape(player, queryType) {
  const keys = Object.keys(player || {}).sort();
  const signature = `${queryType}:${keys.join(',')}`;
  if (loggedPlayerShapes.has(signature)) return;

  loggedPlayerShapes.add(signature);
  console.info('[GameQuery] Player payload has no SteamID64. Raw payload for field discovery:', {
    queryType,
    keys,
    player,
  });
}

function normalisePlayers(players, queryType) {
  if (!Array.isArray(players)) return [];

  return players
    .map((player) => {
      const steamId = findSteamId(player);
      if (!steamId) logUnknownPlayerShape(player, queryType);

      return {
        steamId,
        name: String(player?.name || '').trim(),
        score: numberOrNull(player?.score),
        time: numberOrNull(player?.time),
      };
    })
    .filter((player) => player.name);
}

function normaliseRconPlayers(players) {
  if (!Array.isArray(players)) return [];

  return players
    .map((player) => ({
      guid: String(player?.guid || '').trim() || null,
      steamId: null,
      name: String(player?.name || '').trim(),
      ip: String(player?.ip || '').trim() || null,
      port: numberOrNull(player?.port),
      ping: numberOrNull(player?.ping),
      slot: numberOrNull(player?.id),
      valid: Boolean(player?.valid),
      lobby: Boolean(player?.lobby),
      score: null,
      time: null,
    }))
    .filter((player) => player.name && player.guid);
}

function queryTypeFor(server) {
  const requested = String(server?.query_type || 'protocol-valve').trim().toLowerCase();
  return supportedQueryTypes.has(requested) ? requested : 'protocol-valve';
}

function rconSettingsFor(server) {
  const host = String(server?.rcon_host || process.env.DAYZ_RCON_HOST || '').trim();
  const port = Number(server?.rcon_port || process.env.DAYZ_RCON_PORT || 2306);
  const password = String(process.env.DAYZ_RCON_PASSWORD || process.env.RCON_PASSWORD || '').trim();
  const explicitlyEnabled = server?.rcon_enabled !== undefined
    ? booleanValue(server.rcon_enabled)
    : booleanValue(process.env.DAYZ_RCON_ENABLED, Boolean(host && password));

  return {
    enabled: queryTypeFor(server) === 'dayz' && explicitlyEnabled,
    host,
    port,
    password,
  };
}

function cacheKey(server) {
  const type = queryTypeFor(server);
  const rcon = rconSettingsFor(server);
  return [
    server.id,
    type,
    server.query_host || '127.0.0.1',
    Number(server.query_port || 26903),
    rcon.enabled ? rcon.host : '',
    rcon.enabled ? rcon.port : '',
  ].join(':');
}

async function queryRconPlayers(server) {
  const settings = rconSettingsFor(server);
  if (!settings.enabled) return null;
  if (!settings.host) throw new Error('DayZ RCon host is required.');
  if (!Number.isInteger(settings.port) || settings.port < 1 || settings.port > 65535) {
    throw new Error('DayZ RCon port must be between 1 and 65535.');
  }
  if (!settings.password) throw new Error('DAYZ_RCON_PASSWORD or RCON_PASSWORD is required.');

  const { stdout } = await execFileAsync(berconCliPath, [
    '--ip', settings.host,
    '--port', String(settings.port),
    '--password', settings.password,
    '--timeout', String(Math.max(1, Math.ceil(rconTimeoutMs / 1000))),
    '--format=json',
    'players',
  ], {
    timeout: rconTimeoutMs + 1000,
    windowsHide: true,
    maxBuffer: 1024 * 1024,
  });

  let payload;
  try {
    payload = JSON.parse(stdout);
  } catch {
    throw new Error('BERCon returned invalid JSON.');
  }

  return {
    source: 'bercon',
    host: settings.host,
    port: settings.port,
    players: normaliseRconPlayers(payload),
  };
}

export function clearGameQueryCache(serverId) {
  for (const key of cache.keys()) {
    if (key.startsWith(`${serverId}:`)) cache.delete(key);
  }
}

export async function queryServerStatus(server, force = false) {
  const type = queryTypeFor(server);
  const host = String(server?.query_host || '127.0.0.1').trim();
  const port = Number(server?.query_port || 26903);
  if (!host) throw new Error('Query host is required.');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Query port must be between 1 and 65535.');

  const key = cacheKey(server);
  const cached = cache.get(key);
  if (!force && cached && Date.now() - cached.time < cacheTtlMs) return cached.value;

  try {
    const result = await GameDig.query({
      type,
      host,
      port,
      socketTimeout: queryTimeoutMs,
      attemptTimeout: queryTimeoutMs,
      maxAttempts: 1,
    });

    let players = normalisePlayers(result.players, type);
    let playerSource = 'gamedig';
    let rcon = null;
    let rconError = null;

    if (type === 'dayz' && rconSettingsFor(server).enabled) {
      try {
        rcon = await queryRconPlayers(server);
        players = rcon.players;
        playerSource = 'bercon';
      } catch (error) {
        rconError = error?.message || 'RCon player query failed.';
        console.warn(`[RCon] Unable to query players for server ${server.id}:`, rconError);
      }
    }

    const value = {
      serverId: server.id,
      source: playerSource === 'bercon' ? 'gamedig+bercon' : 'gamedig',
      playerSource,
      queryType: type,
      available: true,
      online: true,
      state: 'online',
      name: result.name || null,
      map: result.map || null,
      version: result.version || null,
      playersCurrent: playerSource === 'bercon'
        ? players.length
        : numberOrNull(result.numplayers) ?? players.length,
      playersMax: numberOrNull(result.maxplayers),
      ping: numberOrNull(result.ping),
      password: Boolean(result.password),
      queryHost: host,
      queryPort: numberOrNull(result.queryPort) ?? port,
      rcon: rcon ? { available: true, host: rcon.host, port: rcon.port } : { available: false, error: rconError },
      players,
      fetchedAt: new Date().toISOString(),
    };

    cache.set(key, { time: Date.now(), value });
    return value;
  } catch (error) {
    const value = {
      serverId: server.id,
      source: 'gamedig',
      playerSource: null,
      queryType: type,
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
