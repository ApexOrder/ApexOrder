import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Map, ChevronRight, ExternalLink, Cpu, MemoryStick, Clock3, Radio } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import CapacityBar from '@/components/ui/CapacityBar';
import ServerProfileModal from './ServerProfileModal';

function formatBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return '—';
  if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(1)} GB`;
  if (value >= 1024 ** 2) return `${(value / 1024 ** 2).toFixed(0)} MB`;
  return `${Math.round(value / 1024)} KB`;
}

function formatUptime(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value < 0) return '—';
  const days = Math.floor(value / 86400);
  const hours = Math.floor((value % 86400) / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function ServerCard({ server, index }) {
  const [showProfile, setShowProfile] = useState(false);
  const live = server.live;

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
          />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent" />
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <StatusBadge status={server.status} />
            {live?.available && (
              <span className="flex items-center gap-1 rounded border border-emerald-glow/25 bg-obsidian/75 px-2 py-1 text-[10px] font-mono text-emerald-glow">
                <Radio size={10} className="animate-pulse" /> AMP LIVE
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
          <h3 className="text-xl font-heading font-bold text-foreground mb-1 group-hover:text-emerald-glow transition-colors">
            {server.name}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">{server.description}</p>

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

          {live?.available && (
            <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-emerald-glow/10 bg-emerald-glow/[0.03] p-3">
              <div className="text-center">
                <Cpu size={13} className="mx-auto mb-1 text-emerald-glow" />
                <div className="font-mono text-[11px] text-foreground">{live.cpuPercent == null ? '—' : `${Math.round(live.cpuPercent)}%`}</div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground">CPU</div>
              </div>
              <div className="text-center">
                <MemoryStick size={13} className="mx-auto mb-1 text-gold" />
                <div className="font-mono text-[11px] text-foreground">{formatBytes(live.memoryBytes)}</div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground">RAM</div>
              </div>
              <div className="text-center">
                <Clock3 size={13} className="mx-auto mb-1 text-sky-300" />
                <div className="font-mono text-[11px] text-foreground">{formatUptime(live.uptimeSeconds)}</div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Uptime</div>
              </div>
            </div>
          )}

          {live && !live.available && (
            <div className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[11px] font-mono text-amber-200">
              Live AMP data is temporarily unavailable. Showing saved server details.
            </div>
          )}

          {server.mods && server.mods.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {server.mods.slice(0, 3).map(mod => (
                <span key={mod} className="text-xs font-mono px-2 py-0.5 rounded bg-obsidian-light border border-border text-muted-foreground">
                  {mod}
                </span>
              ))}
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
            {server.joinUrl && (
              <a
                href={server.joinUrl}
                target="_blank"
                rel="noopener noreferrer"
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
