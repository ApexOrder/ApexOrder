import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  CalendarDays,
  ChevronRight,
  Clock,
  ExternalLink,
  Gauge,
  Home,
  Map,
  Radio,
  Users,
} from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import CapacityBar from '@/components/ui/CapacityBar';
import MarkdownContent from '@/components/ui/MarkdownContent';
import ServerProfileModal from './ServerProfileModal';

function getJoinUrl(server) {
  if (server.joinUrl) return server.joinUrl;
  const address = String(server.ip || '').trim();
  if (!address) return '';
  return `steam://connect/${address}`;
}

function formatUptime(seconds) {
  const total = Math.max(0, Number(seconds) || 0);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function isPalworld(server) {
  const text = [server?.game, server?.name, server?.live?.queryType].filter(Boolean).join(' ').toLowerCase();
  return text.includes('palworld') || text.includes('palworld-rest') || text.includes('apexpals');
}

function LiveMetric({ icon: Icon, label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="rounded-lg border border-white/5 bg-black/20 px-3 py-2.5">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        <Icon size={12} className="text-emerald-glow" />
        {label}
      </div>
      <div className="mt-1 font-mono text-sm font-bold text-foreground">{value}</div>
    </div>
  );
}

function PalworldMetrics({ live }) {
  const metrics = live?.metrics;
  if (!metrics) return null;

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-glow">Live world telemetry</span>
        {live.worldGuid && <span className="max-w-[135px] truncate text-[9px] font-mono text-muted-foreground" title={live.worldGuid}>{live.worldGuid}</span>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <LiveMetric icon={Activity} label="Server FPS" value={metrics.serverFps == null ? null : Math.round(metrics.serverFps)} />
        <LiveMetric icon={Gauge} label="Frame time" value={metrics.serverFrameTime == null ? null : `${Number(metrics.serverFrameTime).toFixed(1)} ms`} />
        <LiveMetric icon={CalendarDays} label="World day" value={metrics.worldDays} />
        <LiveMetric icon={Clock} label="Uptime" value={metrics.uptimeSeconds == null ? null : formatUptime(metrics.uptimeSeconds)} />
        <LiveMetric icon={Home} label="Base camps" value={metrics.baseCampCount} />
        <LiveMetric icon={Users} label="Online" value={`${live.playersCurrent ?? 0}/${live.playersMax ?? 0}`} />
      </div>
    </div>
  );
}

function OnlinePlayers({ live }) {
  const players = Array.isArray(live?.players) ? live.players : [];
  if (!players.length) return null;

  return (
    <div className="mt-4 rounded-lg border border-emerald-glow/10 bg-emerald-glow/[0.03] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-glow">Players online</span>
        <span className="text-[10px] font-mono text-muted-foreground">{players.length}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {players.slice(0, 5).map((player, playerIndex) => (
          <span key={`${player.playerId || player.steamId || player.name}-${playerIndex}`} className="max-w-full truncate rounded border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-mono text-foreground">
            {player.name}
            {player.level != null ? <span className="ml-1 text-muted-foreground">Lv.{player.level}</span> : null}
          </span>
        ))}
        {players.length > 5 && <span className="rounded border border-gold/20 bg-gold/5 px-2 py-1 text-[10px] font-mono text-gold">+{players.length - 5}</span>}
      </div>
    </div>
  );
}

export default function ServerCard({ server, index }) {
  const [showProfile, setShowProfile] = useState(false);
  const live = server.live;
  const joinUrl = getJoinUrl(server);
  const palworld = isPalworld(server);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group"
    >
      <div className="glass-panel rounded-xl overflow-hidden transition-all duration-500 hover:border-emerald-glow/40 hover:glow-emerald">
        <div className="relative h-44 overflow-hidden">
          <img
            src={server.image}
            alt={`${server.name} server`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-70 group-hover:opacity-90"
            style={{ objectPosition: server.bannerPosition || 'center' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent" />
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <StatusBadge status={server.status} />
            {live?.available && (
              <span className="flex items-center gap-1 rounded border border-emerald-glow/25 bg-obsidian/75 px-2 py-1 text-[10px] font-mono text-emerald-glow">
                <Radio size={10} className="animate-pulse" /> {palworld ? 'REST LIVE' : 'LIVE QUERY'}
              </span>
            )}
          </div>
          <div className="absolute top-4 right-4">
            <span className="text-xs font-mono text-gold bg-obsidian/70 px-2 py-1 rounded border border-gold/20">
              {server.tag}
            </span>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-1 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-heading font-bold text-foreground group-hover:text-emerald-glow transition-colors">
                {server.name}
              </h3>
              {server.game && <p className="mt-0.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{server.game}</p>}
            </div>
            {live?.version && <span className="max-w-[120px] truncate rounded border border-white/10 bg-black/20 px-2 py-1 text-[9px] font-mono text-muted-foreground" title={live.version}>{live.version}</span>}
          </div>
          <MarkdownContent className="mb-4 mt-3 text-sm text-muted-foreground line-clamp-[12]">{server.description}</MarkdownContent>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Users size={14} className="text-emerald-glow" />
              <span className="font-mono text-xs text-muted-foreground">
                {server.players.current}/{server.players.max}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Map size={14} className="text-gold" />
              <span className="font-mono text-xs text-muted-foreground truncate">{server.map || 'Unknown'}</span>
            </div>
          </div>

          <CapacityBar current={server.players.current} max={server.players.max} label="CAPACITY" />

          {palworld && live?.available ? <PalworldMetrics live={live} /> : null}
          <OnlinePlayers live={live} />

          {live?.available && live.ping != null && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-emerald-glow/10 bg-emerald-glow/[0.03] p-3 text-xs font-mono text-muted-foreground">
              <Gauge size={14} className="text-emerald-glow" />
              Query response: <span className="text-foreground">{Math.round(live.ping)} ms</span>
            </div>
          )}

          {live && !live.available && (
            <div className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[11px] font-mono text-amber-200">
              Live server information is temporarily unavailable. Showing saved server details.
            </div>
          )}

          {server.mods && server.mods.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {server.mods.slice(0, 3).map((mod) => {
                const name = String(mod).split('|')[0].trim();
                return (
                  <span key={mod} className="text-xs font-mono px-2 py-0.5 rounded bg-obsidian-light border border-border text-muted-foreground">
                    {name}
                  </span>
                );
              })}
              {server.mods.length > 3 && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-obsidian-light border border-border text-gold">
                  +{server.mods.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="mt-5 flex gap-2">
            <button
              onClick={() => setShowProfile(true)}
              className="flex-1 px-4 py-2.5 bg-emerald-glow/10 border border-emerald-glow/30 text-emerald-glow font-semibold text-xs tracking-wider rounded hover:bg-emerald-glow/20 transition-all flex items-center justify-center gap-2"
            >
              VIEW PROFILE
              <ChevronRight size={14} />
            </button>
            {joinUrl && (
              <a
                href={joinUrl}
                className="px-5 py-2.5 bg-emerald-glow border border-emerald-glow text-obsidian font-semibold text-xs tracking-wider rounded hover:bg-emerald-glow/90 transition-all flex items-center justify-center gap-2"
              >
                JOIN
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </div>
      {showProfile && <ServerProfileModal server={server} onClose={() => setShowProfile(false)} />}
    </motion.div>
  );
}
