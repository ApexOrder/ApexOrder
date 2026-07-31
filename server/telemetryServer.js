import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const dataDir = path.resolve(process.env.DATA_DIR || path.join(projectRoot, 'data'));
const databasePath = path.join(dataDir, 'apexorder.sqlite');
const port = Math.max(1, Number(process.env.TELEMETRY_PORT || 3002));
const maxClockSkewSeconds = Math.max(30, Number(process.env.TELEMETRY_MAX_CLOCK_SKEW_SECONDS || 300));

fs.mkdirSync(dataDir, { recursive: true });

function readServerKeys() {
  const raw = String(process.env.TELEMETRY_KEYS_JSON || '').trim();
  if (!raw) return new Map();
  const parsed = JSON.parse(raw);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('TELEMETRY_KEYS_JSON must map server IDs to secrets.');
  return new Map(Object.entries(parsed).map(([serverId, secret]) => [String(serverId), String(secret)]));
}

const serverKeys = readServerKeys();
const db = new Database(databasePath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
  CREATE TABLE IF NOT EXISTS telemetry_events (
    id TEXT PRIMARY KEY,
    server_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    occurred_at TEXT NOT NULL,
    received_at TEXT NOT NULL,
    player_id TEXT,
    player_name TEXT,
    payload TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_telemetry_events_server_time ON telemetry_events (server_id, occurred_at DESC);
  CREATE INDEX IF NOT EXISTS idx_telemetry_events_player_time ON telemetry_events (player_id, occurred_at DESC);
  CREATE TABLE IF NOT EXISTS telemetry_players (
    player_id TEXT PRIMARY KEY,
    provider TEXT,
    current_name TEXT,
    aliases TEXT NOT NULL DEFAULT '[]',
    first_seen_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    total_playtime_seconds INTEGER NOT NULL DEFAULT 0,
    zombie_kills INTEGER NOT NULL DEFAULT 0,
    pvp_kills INTEGER NOT NULL DEFAULT 0,
    deaths INTEGER NOT NULL DEFAULT 0,
    level INTEGER,
    game_stage INTEGER,
    score INTEGER,
    updated_at TEXT NOT NULL
  );
`);

const insertEvent = db.prepare(`INSERT OR IGNORE INTO telemetry_events
  (id, server_id, event_type, occurred_at, received_at, player_id, player_name, payload)
  VALUES (@id, @serverId, @eventType, @occurredAt, @receivedAt, @playerId, @playerName, @payload)`);
const getPlayer = db.prepare('SELECT * FROM telemetry_players WHERE player_id = ?');
const insertPlayer = db.prepare(`INSERT INTO telemetry_players
  (player_id, provider, current_name, aliases, first_seen_at, last_seen_at, total_playtime_seconds, zombie_kills, pvp_kills, deaths, level, game_stage, score, updated_at)
  VALUES (@playerId, @provider, @currentName, @aliases, @firstSeenAt, @lastSeenAt, @totalPlaytimeSeconds, @zombieKills, @pvpKills, @deaths, @level, @gameStage, @score, @updatedAt)`);
const updatePlayer = db.prepare(`UPDATE telemetry_players SET provider=@provider, current_name=@currentName, aliases=@aliases,
  last_seen_at=@lastSeenAt, total_playtime_seconds=@totalPlaytimeSeconds, zombie_kills=@zombieKills,
  pvp_kills=@pvpKills, deaths=@deaths, level=@level, game_stage=@gameStage, score=@score, updated_at=@updatedAt
  WHERE player_id=@playerId`);
const leaderboard = db.prepare(`SELECT * FROM telemetry_players
  ORDER BY zombie_kills DESC, total_playtime_seconds DESC, current_name COLLATE NOCASE ASC LIMIT ?`);

function safeEqualHex(left, right) {
  if (!/^[a-f0-9]{64}$/i.test(left) || !/^[a-f0-9]{64}$/i.test(right)) return false;
  return crypto.timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
}

function verifyRequest(request, response, next) {
  const serverId = String(request.headers['x-apex-server'] || '').trim();
  const timestampText = String(request.headers['x-apex-timestamp'] || '').trim();
  const signature = String(request.headers['x-apex-signature'] || '').trim().toLowerCase();
  const secret = serverKeys.get(serverId);
  if (!serverId || !timestampText || !signature || !secret) return response.status(401).json({ error: 'Unknown server or missing signature.' });
  const timestamp = Number(timestampText);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(timestamp) || Math.abs(now - timestamp) > maxClockSkewSeconds) return response.status(401).json({ error: 'Timestamp outside allowed window.' });
  const body = request.body.toString('utf8');
  const expected = crypto.createHmac('sha256', secret).update(`${timestampText}.${body}`).digest('hex');
  if (!safeEqualHex(signature, expected)) return response.status(401).json({ error: 'Invalid signature.' });
  try { request.telemetryBody = JSON.parse(body); } catch { return response.status(400).json({ error: 'Invalid JSON.' }); }
  request.telemetryServerId = serverId;
  next();
}

function normaliseIdentity(event) {
  const identity = event.player || event.identity || {};
  const playerId = String(event.playerId || identity.playerId || identity.steamId || identity.steamId64 || identity.eosId || '').trim();
  if (!playerId) return null;
  return {
    playerId,
    provider: identity.provider || (identity.steamId || identity.steamId64 ? 'steam' : identity.eosId ? 'eos' : null),
    name: String(event.playerName || identity.name || identity.displayName || '').trim() || null,
  };
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function applyEventToPlayer(event, occurredAt) {
  const identity = normaliseIdentity(event);
  if (!identity) return;
  const existing = getPlayer.get(identity.playerId);
  const aliases = new Set(existing ? JSON.parse(existing.aliases || '[]') : []);
  if (existing?.current_name) aliases.add(existing.current_name);
  if (identity.name) aliases.add(identity.name);
  const eventType = String(event.type || event.eventType || 'unknown').toLowerCase();
  const playtimeDelta = Math.max(0, numberOrNull(event.playtimeSeconds ?? event.sessionSeconds ?? event.durationSeconds) || 0);
  const zombieDelta = eventType.includes('zombie') && eventType.includes('kill') ? 1 : Math.max(0, numberOrNull(event.zombieKillsDelta) || 0);
  const pvpDelta = (eventType.includes('pvp') || eventType.includes('player')) && eventType.includes('kill') ? 1 : Math.max(0, numberOrNull(event.pvpKillsDelta) || 0);
  const deathDelta = eventType.includes('death') ? 1 : Math.max(0, numberOrNull(event.deathsDelta) || 0);
  const record = {
    playerId: identity.playerId,
    provider: identity.provider || existing?.provider || null,
    currentName: identity.name || existing?.current_name || null,
    aliases: JSON.stringify([...aliases].filter(Boolean).sort((a, b) => a.localeCompare(b))),
    firstSeenAt: existing?.first_seen_at || occurredAt,
    lastSeenAt: occurredAt,
    totalPlaytimeSeconds: (existing?.total_playtime_seconds || 0) + playtimeDelta,
    zombieKills: (existing?.zombie_kills || 0) + zombieDelta,
    pvpKills: (existing?.pvp_kills || 0) + pvpDelta,
    deaths: (existing?.deaths || 0) + deathDelta,
    level: numberOrNull(event.level) ?? existing?.level ?? null,
    gameStage: numberOrNull(event.gameStage) ?? existing?.game_stage ?? null,
    score: numberOrNull(event.score) ?? existing?.score ?? null,
    updatedAt: new Date().toISOString(),
  };
  if (existing) updatePlayer.run(record); else insertPlayer.run(record);
}

const ingestBatch = db.transaction((serverId, events) => {
  const receivedAt = new Date().toISOString();
  let accepted = 0;
  for (const event of events) {
    if (!event || typeof event !== 'object') continue;
    const eventType = String(event.type || event.eventType || 'unknown').trim().slice(0, 80) || 'unknown';
    const occurredAt = String(event.occurredAt || event.timestamp || event.createdAt || receivedAt);
    const identity = normaliseIdentity(event);
    const eventId = String(event.id || event.eventId || crypto.createHash('sha256').update(`${serverId}:${eventType}:${occurredAt}:${JSON.stringify(event)}`).digest('hex'));
    const result = insertEvent.run({ id: eventId, serverId, eventType, occurredAt, receivedAt, playerId: identity?.playerId || null, playerName: identity?.name || null, payload: JSON.stringify(event) });
    if (result.changes > 0) { applyEventToPlayer(event, occurredAt); accepted += 1; }
  }
  return accepted;
});

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.get('/health', (_request, response) => response.json({ ok: true, service: 'apexorder-telemetry', configuredServers: serverKeys.size }));
app.post('/api/telemetry/v1/events', express.raw({ type: 'application/json', limit: '2mb' }), verifyRequest, (request, response) => {
  const body = request.telemetryBody;
  if (!body || String(body.serverId || '') !== request.telemetryServerId || !Array.isArray(body.events)) return response.status(400).json({ error: 'Body must contain serverId and events.' });
  if (body.events.length > 500) return response.status(413).json({ error: 'Maximum batch size is 500.' });
  response.status(202).json({ accepted: ingestBatch(request.telemetryServerId, body.events), received: body.events.length });
});
app.get('/api/leaderboards/7dtd', (request, response) => {
  const limit = Math.min(100, Math.max(1, Number(request.query.limit || 25)));
  response.json(leaderboard.all(limit).map((row) => ({ playerId: row.player_id, provider: row.provider, name: row.current_name,
    aliases: JSON.parse(row.aliases || '[]'), firstSeenAt: row.first_seen_at, lastSeenAt: row.last_seen_at,
    totalPlaytimeSeconds: row.total_playtime_seconds, zombieKills: row.zombie_kills, pvpKills: row.pvp_kills,
    deaths: row.deaths, level: row.level, gameStage: row.game_stage, score: row.score })));
});
app.listen(port, '127.0.0.1', () => {
  console.log(`[ApexTelemetry] Listening on http://127.0.0.1:${port}`);
  if (serverKeys.size === 0) console.warn('[ApexTelemetry] No server keys configured.');
});
