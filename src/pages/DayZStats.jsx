import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, History, Radio, RefreshCw, Timer } from 'lucide-react';
import SectionHeading from '@/components/ui/SectionHeading';
import GlassCard from '@/components/ui/GlassCard';

const SORT_OPTIONS = [
  { key: 'totalPlaytimeSeconds', label: 'Total playtime', icon: Clock },
  { key: 'weekPlaytimeSeconds', label: 'This week', icon: Timer },
  { key: 'monthPlaytimeSeconds', label: 'This month', icon: History },
  { key: 'sessionCount', label: 'Sessions', icon: Radio },
  { key: 'longestSessionSeconds', label: 'Longest session', icon: Clock },
];

function formatDuration(seconds = 0) {
  const total = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function Rank({ value }) {
  if (value === 1) return <span>🥇</span>;
  if (value === 2) return <span>🥈</span>;
  if (value === 3) return <span>🥉</span>;
  return <span className="font-mono text-xs text-gray-500">#{value}</span>;
}

export default function DayZStats() {
  const [rows, setRows] = useState([]);
  const [sortKey, setSortKey] = useState('totalPlaytimeSeconds');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const response = await fetch('/api/leaderboards/dayz?limit=100', { cache: 'no-store' });
      if (!response.ok) throw new Error(`DayZ leaderboard returned ${response.status}`);
      setRows(await response.json());
      setError(null);
    } catch (loadError) {
      console.error('[DayZStats]', loadError);
      setError(loadError.message);
    } finally {
      setLoading(false);
      if (!silent) setRefreshing(false);
    }
  };

  useEffect(() => {
    load(true);
    const timer = window.setInterval(() => load(true), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const sorted = useMemo(() => [...rows].sort((a, b) => {
    const difference = (Number(b[sortKey]) || 0) - (Number(a[sortKey]) || 0);
    return difference || String(a.displayName || '').localeCompare(String(b.displayName || ''));
  }), [rows, sortKey]);

  if (loading) return <div className="pt-24 min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-emerald-glow/20 border-t-emerald-glow rounded-full animate-spin" /></div>;

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading title="DayZ Leaderboard" subtitle="LIVE PLAYER ACTIVITY" />
        <div className="flex justify-end mb-5"><button onClick={() => load()} disabled={refreshing} className="flex items-center gap-2 px-3 py-2 rounded border border-emerald-glow/30 text-emerald-glow text-xs font-bold disabled:opacity-40"><RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> REFRESH</button></div>
        {error && <div className="mb-5 text-center text-xs font-mono text-red-400">{error}</div>}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="text-xs font-mono text-gray-500 mr-1">SORT BY</span>
          {SORT_OPTIONS.map((option) => <button key={option.key} onClick={() => setSortKey(option.key)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold tracking-wider rounded transition-all" style={sortKey === option.key ? { background: 'rgba(16,255,139,0.12)', border: '1px solid rgba(16,255,139,0.4)', color: '#10FF8B' } : { border: '1px solid rgba(255,255,255,0.08)', color: '#666' }}><option.icon size={11} />{option.label.toUpperCase()}</button>)}
        </div>
        {sorted.length === 0 ? <div className="text-center py-16 text-gray-600 font-mono text-sm">No DayZ sessions have been captured yet.</div> : (
          <GlassCard className="!p-3 space-y-1">
            {sorted.map((player, index) => (
              <motion.a href={`/players/${player.id}`} key={player.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.025 }} className="flex items-center gap-3 px-4 py-3 rounded hover:bg-white/5" style={{ border: index < 3 ? '1px solid rgba(212,175,55,0.12)' : '1px solid transparent' }}>
                <div className="w-8 text-center"><Rank value={index + 1} /></div>
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0" style={{ background: 'rgba(16,255,139,0.1)', color: '#10FF8B' }}>{player.displayName?.[0]?.toUpperCase() || '?'}</div>
                <div className="flex-1 min-w-0"><div className="font-bold text-white truncate">{player.displayName || 'Unknown survivor'}</div><div className="text-[10px] font-mono text-gray-500">{player.online ? `ONLINE · ${formatDuration(player.currentSessionSeconds)}` : `Last active ${new Date(player.lastSeenAt).toLocaleString()}`}</div></div>
                <div className="hidden sm:grid grid-cols-5 gap-5 text-center text-xs font-mono">
                  <div><div className="text-gray-600">TOTAL</div><div className={sortKey === 'totalPlaytimeSeconds' ? 'text-emerald-glow' : 'text-gray-300'}>{formatDuration(player.totalPlaytimeSeconds)}</div></div>
                  <div><div className="text-gray-600">WEEK</div><div className={sortKey === 'weekPlaytimeSeconds' ? 'text-emerald-glow' : 'text-gray-300'}>{formatDuration(player.weekPlaytimeSeconds)}</div></div>
                  <div><div className="text-gray-600">MONTH</div><div className={sortKey === 'monthPlaytimeSeconds' ? 'text-emerald-glow' : 'text-gray-300'}>{formatDuration(player.monthPlaytimeSeconds)}</div></div>
                  <div><div className="text-gray-600">SESSIONS</div><div className={sortKey === 'sessionCount' ? 'text-emerald-glow' : 'text-gray-300'}>{player.sessionCount}</div></div>
                  <div><div className="text-gray-600">LONGEST</div><div className={sortKey === 'longestSessionSeconds' ? 'text-emerald-glow' : 'text-gray-300'}>{formatDuration(player.longestSessionSeconds)}</div></div>
                </div>
                <div className="sm:hidden text-right text-xs font-mono text-emerald-glow">{formatDuration(player[sortKey])}</div>
              </motion.a>
            ))}
          </GlassCard>
        )}
      </div>
    </div>
  );
}
