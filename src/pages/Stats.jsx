import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Skull, Clock, Star, Zap, ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SectionHeading from '@/components/ui/SectionHeading';
import GlassCard from '@/components/ui/GlassCard';

const MEDAL_COLORS = ['#D4AF37', '#9CA3AF', '#CD7F32'];
const MEDAL_LABELS = ['1ST', '2ND', '3RD'];

function KDRatio({ kills, deaths }) {
  const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills > 0 ? '∞' : '0.00';
  const val = parseFloat(kd);
  const color = val >= 2 ? '#10FF8B' : val >= 1 ? '#D4AF37' : '#ef4444';
  return <span style={{ color }} className="font-mono font-bold">{kd}</span>;
}

function RankIcon({ rank }) {
  if (rank === 1) return <span style={{ color: '#D4AF37', textShadow: '0 0 8px rgba(212,175,55,0.6)' }} className="font-black text-base">🥇</span>;
  if (rank === 2) return <span className="font-black text-base">🥈</span>;
  if (rank === 3) return <span className="font-black text-base">🥉</span>;
  return <span className="font-mono text-xs text-gray-500">#{rank}</span>;
}

function ServerGameTab({ server, stats, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 px-4 py-3 rounded transition-all duration-200 text-left min-w-[110px]"
      style={isActive
        ? { background: 'rgba(16,255,139,0.12)', border: '1px solid rgba(16,255,139,0.4)', color: '#10FF8B' }
        : { background: 'rgba(10,20,10,0.4)', border: '1px solid rgba(16,255,139,0.1)', color: '#666' }
      }
    >
      {server.image && (
        <img src={server.image} alt="" className="w-8 h-8 rounded object-cover" />
      )}
      <span className="text-xs font-bold tracking-wider leading-tight text-center">{server.name}</span>
      <span className="text-xs font-mono" style={{ color: isActive ? 'rgba(16,255,139,0.6)' : '#444' }}>
        {stats.length} players
      </span>
    </button>
  );
}

function LeaderboardRow({ stat, rank, sortKey }) {
  const highlightCell = (key) => key === sortKey
    ? { color: '#10FF8B', fontWeight: 'bold' }
    : { color: '#ccc' };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.04 }}
      className="flex items-center gap-3 px-4 py-3 rounded transition-colors hover:bg-white/5"
      style={{
        background: rank <= 3 ? `rgba(${rank === 1 ? '212,175,55' : rank === 2 ? '156,163,175' : '205,127,50'},0.05)` : 'transparent',
        border: rank <= 3 ? `1px solid rgba(${rank === 1 ? '212,175,55' : rank === 2 ? '156,163,175' : '205,127,50'},0.15)` : '1px solid transparent',
      }}
    >
      {/* Rank */}
      <div className="w-8 flex justify-center shrink-0">
        <RankIcon rank={rank} />
      </div>

      {/* Avatar + Name */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {stat.avatar_url ? (
          <img src={stat.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
            style={{ background: 'rgba(16,255,139,0.1)', border: '1px solid rgba(16,255,139,0.2)', color: '#10FF8B' }}>
            {stat.player_name[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-sm font-bold text-white truncate">{stat.player_name}</div>
          {stat.badge && (
            <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37', fontSize: '0.6rem' }}>
              {stat.badge}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-6 text-sm">
        <div className="text-center" style={highlightCell('kills')}>
          <div className="text-xs text-gray-500 font-mono">KILLS</div>
          <div>{stat.kills ?? 0}</div>
        </div>
        <div className="text-center" style={highlightCell('deaths')}>
          <div className="text-xs text-gray-500 font-mono">DEATHS</div>
          <div>{stat.deaths ?? 0}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 font-mono">K/D</div>
          <KDRatio kills={stat.kills ?? 0} deaths={stat.deaths ?? 0} />
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

      {/* Mobile: score only */}
      <div className="sm:hidden text-right">
        <div className="text-xs text-gray-500 font-mono">SCORE</div>
        <div className="text-sm font-bold" style={{ color: '#10FF8B' }}>{stat.score ?? 0}</div>
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
  const [allStats, setAllStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeServerId, setActiveServerId] = useState(null);
  const [sortKey, setSortKey] = useState('score');

  useEffect(() => {
    Promise.all([
      base44.entities.Server.list(),
      base44.entities.PlayerStat.list(),
    ]).then(([svrs, stats]) => {
      setServers(svrs);
      setAllStats(stats);
      if (svrs.length > 0) setActiveServerId(svrs[0].id);
      setLoading(false);
    });
  }, []);

  const serverStats = allStats.filter(s => s.server_id === activeServerId);
  const sorted = [...serverStats].sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0));
  const activeServer = servers.find(s => s.id === activeServerId);

  if (loading) {
    return (
      <div className="pt-24 pb-20 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-emerald-glow/20 border-t-emerald-glow rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading title="Server Stats" subtitle="LEADERBOARDS" />

        {servers.length === 0 ? (
          <div className="text-center py-20 text-gray-600 font-mono tracking-wider">
            No servers found. Add servers in the admin panel.
          </div>
        ) : (
          <>
            {/* Server tabs */}
            <div className="flex flex-wrap gap-3 justify-center mb-10">
              {servers.map(server => (
                <ServerGameTab
                  key={server.id}
                  server={server}
                  stats={allStats.filter(s => s.server_id === server.id)}
                  isActive={activeServerId === server.id}
                  onClick={() => setActiveServerId(server.id)}
                />
              ))}
            </div>

            {/* Active server profile header */}
            {activeServer && (
              <motion.div
                key={activeServer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <GlassCard className="flex items-center gap-5 !p-5">
                  {activeServer.image && (
                    <img src={activeServer.image} alt="" className="w-16 h-16 rounded-lg object-cover border border-emerald-glow/20" />
                  )}
                  <div className="flex-1">
                    <div className="text-xs font-mono tracking-[0.3em] text-gold mb-1">ACTIVE SERVER</div>
                    <h2 className="text-xl font-heading font-bold text-white">{activeServer.name}</h2>
                    <div className="flex gap-4 mt-2 text-xs font-mono text-gray-500">
                      <span><span style={{ color: '#10FF8B' }}>{serverStats.length}</span> players tracked</span>
                      <span><span style={{ color: '#D4AF37' }}>{serverStats.reduce((a, b) => a + (b.kills ?? 0), 0)}</span> total kills</span>
                      <span><span style={{ color: '#10FF8B' }}>{serverStats.reduce((a, b) => a + (b.playtime_hours ?? 0), 0)}</span>h playtime</span>
                    </div>
                  </div>
                  {activeServer.join_link && (
                    <a href={activeServer.join_link} target="_blank" rel="noopener noreferrer"
                      className="px-4 py-2 text-xs font-bold tracking-wider rounded hidden sm:block"
                      style={{ background: 'rgba(16,255,139,0.12)', border: '1px solid rgba(16,255,139,0.4)', color: '#10FF8B' }}>
                      JOIN SERVER
                    </a>
                  )}
                </GlassCard>
              </motion.div>
            )}

            {/* Sort controls */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-mono text-gray-500 mr-1">SORT BY</span>
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setSortKey(opt.key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold tracking-wider rounded transition-all"
                  style={sortKey === opt.key
                    ? { background: 'rgba(16,255,139,0.12)', border: '1px solid rgba(16,255,139,0.4)', color: '#10FF8B' }
                    : { background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#555' }
                  }
                >
                  <opt.icon size={11} />
                  {opt.label.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Leaderboard */}
            {sorted.length === 0 ? (
              <div className="text-center py-16 text-gray-600 font-mono tracking-wider text-sm">
                No stats yet for this server. Add players in the admin panel.
              </div>
            ) : (
              <GlassCard className="!p-3 space-y-1">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-2 mb-1">
                  <div className="w-8" />
                  <div className="flex-1 text-xs font-mono text-gray-600 tracking-wider">PLAYER</div>
                  <div className="hidden sm:flex items-center gap-6 text-xs font-mono text-gray-600 tracking-wider">
                    <div className="w-10 text-center">KILLS</div>
                    <div className="w-12 text-center">DEATHS</div>
                    <div className="w-8 text-center">K/D</div>
                    <div className="w-10 text-center">HOURS</div>
                    <div className="w-10 text-center">SCORE</div>
                  </div>
                </div>
                {sorted.map((stat, i) => (
                  <LeaderboardRow key={stat.id} stat={stat} rank={i + 1} sortKey={sortKey} />
                ))}
              </GlassCard>
            )}
          </>
        )}
      </div>
    </div>
  );
}