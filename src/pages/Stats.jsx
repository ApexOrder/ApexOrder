import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, History, Radio, RefreshCw, Skull, Star, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import SectionHeading from '@/components/ui/SectionHeading';
import GlassCard from '@/components/ui/GlassCard';

function RankIcon({ rank }) {
  if (rank === 1) return <span>🥇</span>;
  if (rank === 2) return <span>🥈</span>;
  if (rank === 3) return <span>🥉</span>;
  return <span className="font-mono text-xs text-gray-500">#{rank}</span>;
}
function formatDuration(seconds = 0) {
  const total = Math.max(0, Number(seconds) || 0); const hours = Math.floor(total / 3600); const minutes = Math.floor((total % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}
function serverText(server) { return [server?.query_type, server?.queryType, server?.game, server?.name].filter(Boolean).join(' ').toLowerCase(); }
function isSevenDaysServer(server) { const value = serverText(server); return value.includes('7dtd') || value.includes('7 days') || value.includes('seven days'); }
function isDayZServer(server) { return serverText(server).includes('dayz'); }
function shown(server, key) { return server?.[key] !== false; }

function mapSevenDays(item, serverId) {
  return { id: `7dtd-${item.playerId}`, server_id: serverId, player_id: item.playerId, player_name: item.name || item.aliases?.[0] || 'Unknown survivor', kills: item.zombieKills ?? 0, pvp_kills: item.pvpKills ?? 0, deaths: item.deaths ?? 0, playtime_hours: Math.round(((item.totalPlaytimeSeconds ?? 0) / 3600) * 10) / 10, score: item.score ?? 0, level: item.level, game_stage: item.gameStage, source: '7dtd' };
}
function mapDayZ(item, serverId) {
  return { id: `dayz-${item.id}`, profile_id: item.id, server_id: serverId, player_name: item.displayName || 'Unknown survivor', totalPlaytimeSeconds: item.totalPlaytimeSeconds ?? 0, weekPlaytimeSeconds: item.weekPlaytimeSeconds ?? 0, monthPlaytimeSeconds: item.monthPlaytimeSeconds ?? 0, sessionCount: item.sessionCount ?? 0, longestSessionSeconds: item.longestSessionSeconds ?? 0, currentSessionSeconds: item.currentSessionSeconds ?? 0, online: Boolean(item.online), last_seen_at: item.lastSeenAt, source: 'dayz' };
}

function ServerCard({ server, count, active, onClick }) {
  return <button onClick={onClick} className="flex flex-col items-center gap-1.5 px-4 py-3 rounded min-w-[110px] transition-all" style={active ? { background: 'rgba(16,255,139,0.12)', border: '1px solid rgba(16,255,139,0.65)', color: '#10FF8B', boxShadow: '0 0 0 1px #10FF8B' } : { background: 'rgba(10,20,10,0.4)', border: '1px solid rgba(16,255,139,0.12)', color: '#666' }}>
    {server.image && <img src={server.image} alt="" className="w-8 h-8 rounded object-cover" />}<span className="text-xs font-bold text-center">{server.name}</span><span className="text-xs font-mono">{count} players</span>
  </button>;
}

function SevenDaysRow({ stat, rank, sortKey, server }) {
  const metrics = [
    shown(server, 'stat_show_zombie_kills') && { key: 'kills', label: 'ZOMBIES', value: stat.kills },
    shown(server, 'stat_show_pvp_kills') && { key: 'pvp_kills', label: 'PVP', value: stat.pvp_kills },
    shown(server, 'stat_show_deaths') && { key: 'deaths', label: 'DEATHS', value: stat.deaths },
    shown(server, 'stat_show_playtime') && { key: 'playtime_hours', label: 'HOURS', value: stat.playtime_hours },
    shown(server, 'stat_show_score') && { key: 'score', label: 'SCORE', value: stat.score },
  ].filter(Boolean);
  return <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: rank * 0.025 }} className="flex items-center gap-3 px-4 py-3 rounded hover:bg-white/5">
    <div className="w-8 text-center"><RankIcon rank={rank} /></div><div className="w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0" style={{ background: 'rgba(16,255,139,0.1)', color: '#10FF8B' }}>{stat.player_name?.[0]?.toUpperCase() || '?'}</div>
    <div className="flex-1 min-w-0"><div className="font-bold text-white truncate">{stat.player_name}</div>{shown(server, 'stat_show_level') && stat.level != null && <div className="text-[10px] font-mono text-gray-500">LVL {stat.level}{stat.game_stage != null ? ` · GS ${stat.game_stage}` : ''}</div>}</div>
    <div className="hidden sm:flex gap-6 text-center text-xs font-mono">{metrics.map((metric) => <div key={metric.key}><div className="text-gray-600">{metric.label}</div><div className={sortKey === metric.key ? 'text-emerald-glow font-bold' : 'text-gray-300'}>{metric.value}</div></div>)}</div>
  </motion.div>;
}

function DayZRow({ stat, rank, sortKey, server }) {
  const metrics = [
    shown(server, 'stat_show_total_playtime') && { key: 'totalPlaytimeSeconds', label: 'TOTAL', value: formatDuration(stat.totalPlaytimeSeconds) },
    shown(server, 'stat_show_week_playtime') && { key: 'weekPlaytimeSeconds', label: 'WEEK', value: formatDuration(stat.weekPlaytimeSeconds) },
    shown(server, 'stat_show_month_playtime') && { key: 'monthPlaytimeSeconds', label: 'MONTH', value: formatDuration(stat.monthPlaytimeSeconds) },
    shown(server, 'stat_show_sessions') && { key: 'sessionCount', label: 'SESSIONS', value: stat.sessionCount },
    shown(server, 'stat_show_longest_session') && { key: 'longestSessionSeconds', label: 'LONGEST', value: formatDuration(stat.longestSessionSeconds) },
  ].filter(Boolean);
  return <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: rank * 0.025 }}><Link to={`/players/${stat.profile_id}`} className="flex items-center gap-3 px-4 py-3 rounded hover:bg-white/5">
    <div className="w-8 text-center"><RankIcon rank={rank} /></div><div className="w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0" style={{ background: 'rgba(16,255,139,0.1)', color: '#10FF8B' }}>{stat.player_name?.[0]?.toUpperCase() || '?'}</div>
    <div className="flex-1 min-w-0"><div className="font-bold text-white truncate">{stat.player_name}</div>{shown(server, 'stat_show_online_status') && <div className="text-[10px] font-mono text-gray-500">{stat.online ? `ONLINE · ${formatDuration(stat.currentSessionSeconds)}` : `Last active ${stat.last_seen_at ? new Date(stat.last_seen_at).toLocaleString() : 'unknown'}`}</div>}</div>
    <div className="hidden sm:flex gap-5 text-center text-xs font-mono">{metrics.map((metric) => <div key={metric.key}><div className="text-gray-600">{metric.label}</div><div className={sortKey === metric.key ? 'text-emerald-glow font-bold' : 'text-gray-300'}>{metric.value}</div></div>)}</div>
  </Link></motion.div>;
}

export default function Stats() {
  const [servers, setServers] = useState([]); const [manualStats, setManualStats] = useState([]); const [sevenDaysStats, setSevenDaysStats] = useState([]); const [dayzStats, setDayzStats] = useState([]); const [activeServerId, setActiveServerId] = useState(null); const [sortKey, setSortKey] = useState('kills'); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState(null);

  const loadLive = async (serverList, silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const [sevenResponse, dayzResponse] = await Promise.all([fetch('/api/leaderboards/7dtd?limit=100', { cache: 'no-store' }), fetch('/api/leaderboards/dayz?limit=100', { cache: 'no-store' })]);
      if (!sevenResponse.ok || !dayzResponse.ok) throw new Error(`Leaderboard request failed (${sevenResponse.status}/${dayzResponse.status})`);
      const [sevenRows, dayzRows] = await Promise.all([sevenResponse.json(), dayzResponse.json()]); const sevenServer = serverList.find(isSevenDaysServer); const dayzServer = serverList.find(isDayZServer);
      setSevenDaysStats(sevenServer ? sevenRows.map((row) => mapSevenDays(row, sevenServer.id)) : []); setDayzStats(dayzServer ? dayzRows.map((row) => mapDayZ(row, dayzServer.id)) : []); setError(null);
    } catch (loadError) { console.error('[Stats] Failed to load live leaderboards:', loadError); setError(loadError.message); } finally { setLoading(false); if (!silent) setRefreshing(false); }
  };

  useEffect(() => { let cancelled = false; Promise.all([base44.entities.Server.list(), base44.entities.PlayerStat.list()]).then(async ([serverList, stats]) => { if (cancelled) return; setServers(serverList); setManualStats(stats); if (serverList.length) setActiveServerId(serverList[0].id); await loadLive(serverList, true); }).catch((loadError) => { console.error(loadError); setLoading(false); }); return () => { cancelled = true; }; }, []);
  useEffect(() => { if (!servers.length) return undefined; const timer = window.setInterval(() => loadLive(servers, true), 30000); return () => window.clearInterval(timer); }, [servers]);

  const allStats = useMemo(() => { const liveIds = new Set([...sevenDaysStats, ...dayzStats].map((stat) => stat.server_id)); return [...manualStats.filter((stat) => !liveIds.has(stat.server_id)), ...sevenDaysStats, ...dayzStats]; }, [manualStats, sevenDaysStats, dayzStats]);
  const activeServer = servers.find((server) => server.id === activeServerId); const activeIsDayZ = isDayZServer(activeServer); const activeIsSevenDays = isSevenDaysServer(activeServer); const serverStats = allStats.filter((stat) => stat.server_id === activeServerId);

  const sortOptions = activeIsDayZ ? [
    shown(activeServer, 'stat_show_total_playtime') && { key: 'totalPlaytimeSeconds', label: 'Total playtime', icon: Clock }, shown(activeServer, 'stat_show_week_playtime') && { key: 'weekPlaytimeSeconds', label: 'This week', icon: Timer }, shown(activeServer, 'stat_show_month_playtime') && { key: 'monthPlaytimeSeconds', label: 'This month', icon: History }, shown(activeServer, 'stat_show_sessions') && { key: 'sessionCount', label: 'Sessions', icon: Radio }, shown(activeServer, 'stat_show_longest_session') && { key: 'longestSessionSeconds', label: 'Longest session', icon: Clock },
  ].filter(Boolean) : activeIsSevenDays ? [
    shown(activeServer, 'stat_show_zombie_kills') && { key: 'kills', label: 'Zombie kills', icon: Skull }, shown(activeServer, 'stat_show_pvp_kills') && { key: 'pvp_kills', label: 'PvP kills', icon: Skull }, shown(activeServer, 'stat_show_deaths') && { key: 'deaths', label: 'Deaths', icon: Skull }, shown(activeServer, 'stat_show_playtime') && { key: 'playtime_hours', label: 'Playtime', icon: Clock }, shown(activeServer, 'stat_show_score') && { key: 'score', label: 'Score', icon: Star },
  ].filter(Boolean) : [{ key: 'score', label: 'Score', icon: Star }, { key: 'kills', label: 'Kills', icon: Skull }, { key: 'playtime_hours', label: 'Playtime', icon: Clock }];

  useEffect(() => { const first = sortOptions[0]?.key || 'score'; if (!sortOptions.some((option) => option.key === sortKey)) setSortKey(first); }, [activeServerId, servers]);
  const sorted = [...serverStats].sort((a, b) => (Number(b[sortKey]) || 0) - (Number(a[sortKey]) || 0));
  const totalHours = activeIsDayZ ? Math.round(serverStats.reduce((sum, stat) => sum + stat.totalPlaytimeSeconds, 0) / 360) / 10 : Math.round(serverStats.reduce((sum, stat) => sum + (stat.playtime_hours || 0), 0) * 10) / 10;

  if (loading) return <div className="pt-24 min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-emerald-glow/20 border-t-emerald-glow rounded-full animate-spin" /></div>;
  return <div className="pt-24 pb-20"><div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"><SectionHeading title="Community Stats" subtitle="LIVE LEADERBOARDS" />
    <div className="flex flex-wrap gap-3 justify-center mb-10">{servers.map((server) => <ServerCard key={server.id} server={server} count={allStats.filter((stat) => stat.server_id === server.id).length} active={activeServerId === server.id} onClick={() => setActiveServerId(server.id)} />)}</div>
    {activeServer && <GlassCard className="flex items-center gap-5 !p-5 mb-8">{activeServer.image && <img src={activeServer.image} alt="" className="w-16 h-16 rounded-lg object-cover border border-emerald-glow/20" />}<div className="flex-1"><div className="text-xs font-mono tracking-[0.3em] text-gold mb-1">{activeIsDayZ || activeIsSevenDays ? 'LIVE TELEMETRY' : 'ACTIVE SERVER'}</div><h2 className="text-xl font-heading font-bold text-white">{activeServer.name}</h2><div className="flex flex-wrap gap-4 mt-2 text-xs font-mono text-gray-500"><span><b className="text-emerald-glow">{serverStats.length}</b> players tracked</span>{activeIsDayZ && shown(activeServer, 'stat_show_online_status') ? <span><b className="text-gold">{serverStats.filter((stat) => stat.online).length}</b> online</span> : !activeIsDayZ && shown(activeServer, 'stat_show_zombie_kills') ? <span><b className="text-gold">{serverStats.reduce((sum, stat) => sum + (stat.kills || 0), 0)}</b> {activeIsSevenDays ? 'zombies killed' : 'total kills'}</span> : null}{((activeIsDayZ && shown(activeServer, 'stat_show_total_playtime')) || (!activeIsDayZ && shown(activeServer, 'stat_show_playtime'))) && <span><b className="text-emerald-glow">{totalHours}</b>h playtime</span>}</div>{error && <div className="mt-2 text-xs font-mono text-red-400">Live stats unavailable: {error}</div>}</div>{(activeIsDayZ || activeIsSevenDays) && <button onClick={() => loadLive(servers)} disabled={refreshing} className="p-2.5 rounded border border-emerald-glow/30 text-emerald-glow disabled:opacity-40"><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /></button>}</GlassCard>}
    {sortOptions.length > 0 && <div className="flex flex-wrap items-center gap-2 mb-4"><span className="text-xs font-mono text-gray-500 mr-1">SORT BY</span>{sortOptions.map((option) => <button key={option.key} onClick={() => setSortKey(option.key)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold tracking-wider rounded" style={sortKey === option.key ? { background: 'rgba(16,255,139,0.12)', border: '1px solid rgba(16,255,139,0.4)', color: '#10FF8B' } : { border: '1px solid rgba(255,255,255,0.08)', color: '#666' }}><option.icon size={11} />{option.label.toUpperCase()}</button>)}</div>}
    {sorted.length === 0 ? <div className="text-center py-16 text-gray-600 font-mono text-sm">No stats yet for this server.</div> : <GlassCard className="!p-3 space-y-1">{sorted.map((stat, index) => activeIsDayZ ? <DayZRow key={stat.id} stat={stat} rank={index + 1} sortKey={sortKey} server={activeServer} /> : <SevenDaysRow key={stat.id} stat={stat} rank={index + 1} sortKey={sortKey} server={activeServer} />)}</GlassCard>}
  </div></div>;
}
