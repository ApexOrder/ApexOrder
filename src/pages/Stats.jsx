import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, RefreshCw, Skull, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SectionHeading from '@/components/ui/SectionHeading';
import GlassCard from '@/components/ui/GlassCard';

function KDRatio({ kills, deaths }) {
  const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills > 0 ? '∞' : '0.00';
  const val = Number.parseFloat(kd);
  const color = val >= 2 ? '#10FF8B' : val >= 1 ? '#D4AF37' : '#ef4444';
  return <span style={{ color }} className="font-mono font-bold">{kd}</span>;
}

function RankIcon({ rank }) {
  if (rank === 1) return <span className="text-base">🥇</span>;
  if (rank === 2) return <span className="text-base">🥈</span>;
  if (rank === 3) return <span className="text-base">🥉</span>;
  return <span className="font-mono text-xs text-gray-500">#{rank}</span>;
}

function isSevenDaysServer(server) {
  const value = [server?.query_type, server?.queryType, server?.game, server?.name]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return value.includes('7dtd') || value.includes('7 days') || value.includes('seven days');
}

function mapTelemetryStat(item, serverId) {
  return {
    id: `telemetry-${item.playerId}`,
    server_id: serverId,
    player_id: item.playerId,
    player_name: item.name || item.aliases?.[0] || 'Unknown survivor',
    aliases: item.aliases || [],
    kills: item.zombieKills ?? 0,
    pvp_kills: item.pvpKills ?? 0,
    deaths: item.deaths ?? 0,
    playtime_hours: Math.round(((item.totalPlaytimeSeconds ?? 0) / 3600) * 10) / 10,
    score: item.score ?? 0,
    level: item.level,
    game_stage: item.gameStage,
    last_seen_at: item.lastSeenAt,
    source: 'telemetry',
  };
}

function ServerGameTab({ server, stats, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 px-4 py-3 rounded transition-all duration-200 min-w-[110px]"
      style={isActive
        ? { background: 'rgba(16,255,139,0.12)', border: '1px solid rgba(16,255,139,0.4)', color: '#10FF8B' }
        : { background: 'rgba(10,20,10,0.4)', border: '1px solid rgba(16,255,139,0.1)', color: '#666' }}
    >
      {server.image && <img src={server.image} alt="" className="w-8 h-8 rounded object-cover" />}
      <span className="text-xs font-bold tracking-wider leading-tight text-center">{server.name}</span>
      <span className="text-xs font-mono" style={{ color: isActive ? 'rgba(16,255,139,0.6)' : '#444' }}>
        {stats.length} players
      </span>
    </button>
  );
}

function LeaderboardRow({ stat, rank, sortKey, isSevenDays }) {
  const highlightCell = (key) => key === sortKey
    ? { color: '#10FF8B', fontWeight: 'bold' }
    : { color: '#ccc' };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.03 }}
      className="flex items-center gap-3 px-4 py-3 rounded transition-colors hover:bg-white/5"
      style={{
        background: rank <= 3 ? `rgba(${rank === 1 ? '212,175,55' : rank === 2 ? '156,163,175' : '205,127,50'},0.05)` : 'transparent',
        border: rank <= 3 ? `1px solid rgba(${rank === 1 ? '212,175,55' : rank === 2 ? '156,163,175' : '205,127,50'},0.15)` : '1px solid transparent',
      }}
    >
      <div className="w-8 flex justify-center shrink-0"><RankIcon rank={rank} /></div>
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {stat.avatar_url ? (
          <img src={stat.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
            style={{ background: 'rgba(16,255,139,0.1)', border: '1px solid rgba(16,255,139,0.2)', color: '#10FF8B' }}>
            {stat.player_name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-sm font-bold text-white truncate">{stat.player_name}</div>
          {stat.level != null && (
            <span className="text-[10px] font-mono text-gray-500">LVL {stat.level}{stat.game_stage != null ? ` · GS ${stat.game_stage}` : ''}</span>
          )}
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-6 text-sm">
        <div className="text-center" style={highlightCell('kills')}>
          <div className="text-xs text-gray-500 font-mono">{isSevenDays ? 'ZOMBIES' : 'KILLS'}</div>
          <div>{stat.kills ?? 0}</div>
        </div>
        {isSevenDays && (
          <div className="text-center" style={highlightCell('pvp_kills')}>
            <div className="text-xs text-gray-500 font-mono">PVP</div>
            <div>{stat.pvp_kills ?? 0}</div>
          </div>
        )}
        <div className="text-center" style={highlightCell('deaths')}>
          <div className="text-xs text-gray-500 font-mono">DEATHS</div>
          <div>{stat.deaths ?? 0}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 font-mono">K/D</div>
          <KDRatio kills={isSevenDays ? (stat.pvp_kills ?? 0) : (stat.kills ?? 0)} deaths={stat.deaths ?? 0} />
        </div>
        <div className="text-center" style={highlightCell('playtime_hours')}>
          <div className="text-xs text-gray-500 font-mono">HOURS</div>
          <div>{stat.playtime_hours ?? 0}</div>
        </div>
        <div className="text-center" style={highlightCell('score')}>
          <div className="text-xs text-gray-500 font-mono">SCORE</div>
          <div>{stat.score ?? 0}</div>
        </div>
      </div>

      <div className="sm:hidden text-right">
        <div className="text-xs text-gray-500 font-mono">{isSevenDays ? 'ZOMBIES' : 'SCORE'}</div>
        <div className="text-sm font-bold" style={{ color: '#10FF8B' }}>{isSevenDays ? (stat.kills ?? 0) : (stat.score ?? 0)}</div>
      </div>
    </motion.div>
  );
}

const SORT_OPTIONS = [
  { key: 'score', label: 'Score', icon: Star },
  { key: 'kills', label: 'Kills', icon: Skull },
  { key: 'playtime_hours', label: 'Playtime', icon: Clock },
];

export default function Stats() {
  const [servers, setServers] = useState([]);
  const [manualStats, setManualStats] = useState([]);
  const [telemetryStats, setTelemetryStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeServerId, setActiveServerId] = useState(null);
  const [sortKey, setSortKey] = useState('score');
  const [telemetryError, setTelemetryError] = useState(null);

  const loadTelemetry = async (serverList, silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const response = await fetch('/api/leaderboards/7dtd?limit=100', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Telemetry returned ${response.status}`);
      const rows = await response.json();
      const sevenDaysServers = serverList.filter(isSevenDaysServer);
      const target = sevenDaysServers[0];
      setTelemetryStats(target ? rows.map((row) => mapTelemetryStat(row, target.id)) : []);
      setTelemetryError(null);
    } catch (error) {
      console.error('[Stats] Failed to load 7DTD telemetry:', error);
      setTelemetryError(error.message);
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      base44.entities.Server.list(),
      base44.entities.PlayerStat.list(),
    ]).then(async ([svrs, stats]) => {
      if (cancelled) return;
      setServers(svrs);
      setManualStats(stats);
      if (svrs.length > 0) setActiveServerId(svrs[0].id);
      await loadTelemetry(svrs, true);
      if (!cancelled) setLoading(false);
    }).catch((error) => {
      console.error('[Stats] Failed to load stats page:', error);
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!servers.length) return undefined;
    const timer = window.setInterval(() => loadTelemetry(servers, true), 30000);
    return () => window.clearInterval(timer);
  }, [servers]);

  const allStats = useMemo(() => {
    const telemetryServerIds = new Set(telemetryStats.map((stat) => stat.server_id));
    return [
      ...manualStats.filter((stat) => !telemetryServerIds.has(stat.server_id)),
      ...telemetryStats,
    ];
  }, [manualStats, telemetryStats]);

  const serverStats = allStats.filter((stat) => stat.server_id === activeServerId);
  const sorted = [...serverStats].sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0));
  const activeServer = servers.find((server) => server.id === activeServerId);
  const activeIsSevenDays = isSevenDaysServer(activeServer);
  const visibleSortOptions = activeIsSevenDays
    ? [{ key: 'kills', label: 'Zombie kills', icon: Skull }, { key: 'playtime_hours', label: 'Playtime', icon: Clock }, { key: 'score', label: 'Score', icon: Star }]
    : SORT_OPTIONS;

  useEffect(() => {
    if (activeIsSevenDays && sortKey === 'score') setSortKey('kills');
  }, [activeServerId, activeIsSevenDays]);

  if (loading) {
    return <div className="pt-24 pb-20 flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-emerald-glow/20 border-t-emerald-glow rounded-full animate-spin" /></div>;
  }

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading title="Community Stats" subtitle="LIVE LEADERBOARDS" />

        {servers.length === 0 ? (
          <div className="text-center py-20 text-gray-600 font-mono tracking-wider">No servers found. Add servers in the admin panel.</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-3 justify-center mb-10">
              {servers.map((server) => (
                <ServerGameTab key={server.id} server={server} stats={allStats.filter((stat) => stat.server_id === server.id)} isActive={activeServerId === server.id} onClick={() => setActiveServerId(server.id)} />
              ))}
            </div>

            {activeServer && (
              <motion.div key={activeServer.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <GlassCard className="flex items-center gap-5 !p-5">
                  {activeServer.image && <img src={activeServer.image} alt="" className="w-16 h-16 rounded-lg object-cover border border-emerald-glow/20" />}
                  <div className="flex-1">
                    <div className="text-xs font-mono tracking-[0.3em] text-gold mb-1">{activeIsSevenDays ? 'LIVE TELEMETRY' : 'ACTIVE SERVER'}</div>
                    <h2 className="text-xl font-heading font-bold text-white">{activeServer.name}</h2>
                    <div className="flex flex-wrap gap-4 mt-2 text-xs font-mono text-gray-500">
                      <span><span style={{ color: '#10FF8B' }}>{serverStats.length}</span> players tracked</span>
                      <span><span style={{ color: '#D4AF37' }}>{serverStats.reduce((total, stat) => total + (stat.kills ?? 0), 0)}</span> {activeIsSevenDays ? 'zombies killed' : 'total kills'}</span>
                      <span><span style={{ color: '#10FF8B' }}>{Math.round(serverStats.reduce((total, stat) => total + (stat.playtime_hours ?? 0), 0) * 10) / 10}</span>h playtime</span>
                    </div>
                    {activeIsSevenDays && telemetryError && <div className="mt-2 text-xs font-mono text-red-400">Telemetry temporarily unavailable: {telemetryError}</div>}
                  </div>
                  {activeIsSevenDays && (
                    <button onClick={() => loadTelemetry(servers)} disabled={refreshing} className="p-2.5 rounded border border-emerald-glow/30 text-emerald-glow disabled:opacity-40" title="Refresh telemetry">
                      <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                  )}
                </GlassCard>
              </motion.div>
            )}

            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-mono text-gray-500 mr-1">SORT BY</span>
              {visibleSortOptions.map((option) => (
                <button key={option.key} onClick={() => setSortKey(option.key)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold tracking-wider rounded transition-all"
                  style={sortKey === option.key ? { background: 'rgba(16,255,139,0.12)', border: '1px solid rgba(16,255,139,0.4)', color: '#10FF8B' } : { background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#555' }}>
                  <option.icon size={11} />{option.label.toUpperCase()}
                </button>
              ))}
            </div>

            {sorted.length === 0 ? (
              <div className="text-center py-16 text-gray-600 font-mono tracking-wider text-sm">
                {activeIsSevenDays ? 'No telemetry has been captured yet. Join the server to create the first live player record.' : 'No stats yet for this server.'}
              </div>
            ) : (
              <GlassCard className="!p-3 space-y-1">
                {sorted.map((stat, index) => <LeaderboardRow key={stat.id} stat={stat} rank={index + 1} sortKey={sortKey} isSevenDays={activeIsSevenDays} />)}
              </GlassCard>
            )}
          </>
        )}
      </div>
    </div>
  );
}
