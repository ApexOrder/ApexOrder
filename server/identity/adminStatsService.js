function numberOrUndefined(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : undefined;
}

function cleanName(value) {
  if (value === undefined) return undefined;
  const name = String(value || '').trim();
  if (!name) throw new Error('Player name cannot be empty.');
  return name.slice(0, 100);
}

export function createAdminStatsService(db) {
  const getDayzPlayer = db.prepare('SELECT * FROM players WHERE id = ?');
  const updateDayzName = db.prepare('UPDATE players SET display_name = ?, updated_at = ? WHERE id = ?');
  const deleteDayzPlayer = db.prepare('DELETE FROM players WHERE id = ?');
  const getOverride = db.prepare('SELECT data FROM player_stat_overrides WHERE source = ? AND player_id = ?');
  const upsertOverride = db.prepare(`
    INSERT INTO player_stat_overrides (source, player_id, data, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(source, player_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
  `);
  const deleteOverride = db.prepare('DELETE FROM player_stat_overrides WHERE source = ? AND player_id = ?');

  const getTelemetryPlayer = db.prepare('SELECT * FROM telemetry_players WHERE player_id = ?');
  const updateTelemetryPlayer = db.prepare(`
    UPDATE telemetry_players SET
      current_name = @currentName,
      total_playtime_seconds = @totalPlaytimeSeconds,
      zombie_kills = @zombieKills,
      pvp_kills = @pvpKills,
      deaths = @deaths,
      level = @level,
      game_stage = @gameStage,
      score = @score,
      updated_at = @updatedAt
    WHERE player_id = @playerId
  `);
  const deleteTelemetryEvents = db.prepare('DELETE FROM telemetry_events WHERE player_id = ?');
  const deleteTelemetryPlayer = db.prepare('DELETE FROM telemetry_players WHERE player_id = ?');

  function readOverride(source, playerId) {
    const row = getOverride.get(source, playerId);
    if (!row) return {};
    try { return JSON.parse(row.data || '{}'); } catch { return {}; }
  }

  function applyDayzOverride(row) {
    const override = readOverride('dayz', row.id);
    return { ...row, ...override, displayName: override.displayName || row.displayName };
  }

  const deleteTransaction = db.transaction((source, playerId) => {
    deleteOverride.run(source, playerId);
    if (source === 'dayz') return deleteDayzPlayer.run(playerId).changes;
    deleteTelemetryEvents.run(playerId);
    return deleteTelemetryPlayer.run(playerId).changes;
  });

  return {
    applyDayzOverride,

    update(sourceValue, playerIdValue, patch = {}) {
      const source = String(sourceValue || '').toLowerCase();
      const playerId = String(playerIdValue || '').trim();
      if (!['dayz', '7dtd'].includes(source) || !playerId) throw new Error('Invalid player stat source or ID.');
      const now = new Date().toISOString();

      if (source === 'dayz') {
        const existing = getDayzPlayer.get(playerId);
        if (!existing) return null;
        const displayName = cleanName(patch.displayName ?? patch.player_name);
        if (displayName !== undefined) updateDayzName.run(displayName, now, playerId);

        const current = readOverride('dayz', playerId);
        const next = { ...current };
        const fields = ['totalPlaytimeSeconds', 'weekPlaytimeSeconds', 'monthPlaytimeSeconds', 'sessionCount', 'longestSessionSeconds'];
        for (const field of fields) {
          const value = numberOrUndefined(patch[field]);
          if (value !== undefined) next[field] = value;
        }
        if (displayName !== undefined) next.displayName = displayName;
        upsertOverride.run('dayz', playerId, JSON.stringify(next), now);
        return applyDayzOverride({ id: playerId, displayName: displayName || existing.display_name });
      }

      const existing = getTelemetryPlayer.get(playerId);
      if (!existing) return null;
      const currentName = cleanName(patch.name ?? patch.player_name) ?? existing.current_name;
      const value = (field, column) => numberOrUndefined(patch[field]) ?? Number(existing[column] || 0);
      const nullable = (field, column) => patch[field] === null ? null : numberOrUndefined(patch[field]) ?? existing[column];
      updateTelemetryPlayer.run({
        playerId,
        currentName,
        totalPlaytimeSeconds: value('totalPlaytimeSeconds', 'total_playtime_seconds'),
        zombieKills: value('zombieKills', 'zombie_kills'),
        pvpKills: value('pvpKills', 'pvp_kills'),
        deaths: value('deaths', 'deaths'),
        level: nullable('level', 'level'),
        gameStage: nullable('gameStage', 'game_stage'),
        score: nullable('score', 'score'),
        updatedAt: now,
      });
      return getTelemetryPlayer.get(playerId);
    },

    delete(sourceValue, playerIdValue) {
      const source = String(sourceValue || '').toLowerCase();
      const playerId = String(playerIdValue || '').trim();
      if (!['dayz', '7dtd'].includes(source) || !playerId) throw new Error('Invalid player stat source or ID.');
      return deleteTransaction(source, playerId) > 0;
    },
  };
}
