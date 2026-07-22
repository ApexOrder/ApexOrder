import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Map, Cpu, Copy, Check, MemoryStick, Clock3, Gamepad2, ExternalLink, Radio, Gauge, UserRound, Timer, Trophy, Wifi } from 'lucide-react';
import CapacityBar from '@/components/ui/CapacityBar';
import StatusBadge from '@/components/ui/StatusBadge';

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

function formatSessionTime(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value < 0) return null;
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const secs = Math.floor(value % 60);
  if (hours) return `${hours}h ${minutes}m`;
  if (minutes) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function Metric({ icon: Icon, label, value, accent = '#10FF8B' }) {
  return (
    <div className="rounded-lg p-3" style={{ background: `${accent}0A`, border: `1px solid ${accent}22` }}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} style={{ color: accent }} />
        <span className="text-[10px] font-mono tracking-wider" style={{ color: `${accent}AA` }}>{label}</span>
      </div>
      <div className="text-sm font-bold truncate" style={{ color: accent }}>{value || '—'}</div>
    </div>
  );
}

export default function ServerProfileModal({ server, onClose }) {
  const [copied, setCopied] = useState(false);
  const live = server.live;

  const handleCopy = async () => {
    if (!server.ip) return;
    await navigator.clipboard.writeText(server.ip);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mods = Array.isArray(server.mods) ? server.mods : String(server.mods || '').split(',').map(m => m.trim()).filter(Boolean);
  const fetchedAt = live?.fetchedAt ? new Date(live.fetchedAt) : null;
  const players = Array.isArray(live?.players) ? live.players : [];

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10 rounded-xl"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          style={{ background: 'rgba(6,14,6,0.99)', border: '1px solid rgba(16,255,139,0.2)' }}
        >
          <div className="relative h-52 overflow-hidden">
            {server.image ? <img src={server.image} alt={server.name} className="w-full h-full object-cover opacity-70" /> : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #0a1a0a, #050a05)' }} />}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(6,14,6,1) 0%, rgba(6,14,6,0.25) 65%, transparent 100%)' }} />
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-2 py-1 text-xs font-mono font-bold rounded" style={{ background: 'rgba(5,10,5,0.8)', border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37' }}>{server.tag}</span>
              {live?.available && <span className="flex items-center gap-1 px-2 py-1 text-xs font-mono rounded" style={{ background: 'rgba(5,10,5,0.8)', border: '1px solid rgba(16,255,139,0.3)', color: '#10FF8B' }}><Radio size={11} className="animate-pulse" /> LIVE QUERY</span>}
            </div>
            <div className="absolute top-4 right-12"><StatusBadge status={server.status} /></div>
            <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}><X size={15} /></button>
          </div>

          <div className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
              <div>
                <h2 className="text-2xl font-heading font-bold" style={{ color: '#10FF8B', textShadow: '0 0 20px rgba(16,255,139,0.3)' }}>{server.name}</h2>
                <div className="mt-1 text-xs font-mono text-muted-foreground">{server.game || live?.name || 'GAME SERVER'}{server.version || live?.version ? ` · ${server.version || live.version}` : ''}</div>
              </div>
              {fetchedAt && <div className="text-[10px] font-mono text-muted-foreground">UPDATED {fetchedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>}
            </div>

            {server.description && <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.55)' }}>{server.description}</p>}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
              <Metric icon={Users} label="PLAYERS" value={`${server.players?.current ?? 0}/${server.players?.max ?? 32}`} />
              <Metric icon={Map} label="MAP" value={server.map || 'Unknown'} accent="#D4AF37" />
              <Metric icon={Gauge} label="STATE" value={live?.state || server.status} accent="#7DD3FC" />
              {live?.ping != null && <Metric icon={Wifi} label="PING" value={`${Math.round(live.ping)} ms`} accent="#7DD3FC" />}
              {server.showPerformance && <Metric icon={Cpu} label="CPU" value={live?.cpuPercent == null ? '—' : `${Math.round(live.cpuPercent)}%`} />}
              {server.showPerformance && <Metric icon={MemoryStick} label="RAM" value={formatBytes(live?.memoryBytes)} accent="#D4AF37" />}
              {server.showPerformance && <Metric icon={Clock3} label="UPTIME" value={formatUptime(live?.uptimeSeconds)} accent="#7DD3FC" />}
            </div>

            <CapacityBar current={server.players?.current ?? 0} max={server.players?.max ?? 32} label="SERVER CAPACITY" />

            {live?.available && (
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5"><Users size={13} className="text-emerald-glow" /><span className="text-xs font-mono tracking-wider text-emerald-glow">ONLINE PLAYERS</span></div>
                  <span className="text-[10px] font-mono text-muted-foreground">{server.players?.current ?? players.length} CONNECTED</span>
                </div>

                {players.length > 0 ? (
                  <div className="space-y-2">
                    {players.map((player, playerIndex) => {
                      const sessionTime = formatSessionTime(player.time);
                      return (
                        <div key={`${player.name}-${playerIndex}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg px-3 py-2.5" style={{ background: 'rgba(16,255,139,0.035)', border: '1px solid rgba(16,255,139,0.12)' }}>
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-glow shadow-[0_0_8px_rgba(16,255,139,0.8)]" />
                            <UserRound size={15} className="shrink-0 text-emerald-glow" />
                            <span className="truncate text-sm font-semibold text-foreground">{player.name}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                            {sessionTime && <span className="flex items-center gap-1"><Timer size={11} /> {sessionTime}</span>}
                            {player.score != null && <span className="flex items-center gap-1"><Trophy size={11} /> {player.score}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-4 text-center text-xs font-mono text-muted-foreground">
                    No players are currently online.
                  </div>
                )}
              </div>
            )}

            {mods.length > 0 && (
              <div className="mt-5">
                <div className="flex items-center gap-1.5 mb-2"><Gamepad2 size={12} className="text-muted-foreground" /><span className="text-xs font-mono tracking-wider text-muted-foreground">MODS / PLUGINS</span></div>
                <div className="flex flex-wrap gap-1.5">{mods.map(mod => <span key={mod} className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>{mod}</span>)}</div>
              </div>
            )}

            {(server.ip || server.joinInstructions) && (
              <div className="mt-5 p-4 rounded-lg" style={{ background: 'rgba(16,255,139,0.04)', border: '1px solid rgba(16,255,139,0.12)' }}>
                <div className="text-xs font-mono tracking-wider mb-3" style={{ color: 'rgba(16,255,139,0.55)' }}>CONNECT</div>
                {server.joinInstructions && <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>{server.joinInstructions}</p>}
                {server.ip && <button onClick={handleCopy} className="w-full flex items-center justify-between px-3 py-2.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(16,255,139,0.2)' }}><span className="font-mono text-sm" style={{ color: '#10FF8B' }}>{server.ip}</span>{copied ? <Check size={14} style={{ color: '#10FF8B' }} /> : <Copy size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />}</button>}
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {server.joinUrl && <a href={server.joinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded px-4 py-3 text-xs font-bold tracking-wider bg-emerald-glow text-obsidian">JOIN SERVER <ExternalLink size={13} /></a>}
              {server.liveMapUrl && <a href={server.liveMapUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded border border-gold/30 bg-gold/5 px-4 py-3 text-xs font-bold tracking-wider text-gold">LIVE MAP <ExternalLink size={13} /></a>}
              {server.discordChannelUrl && <a href={server.discordChannelUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded border border-sky-400/30 bg-sky-400/5 px-4 py-3 text-xs font-bold tracking-wider text-sky-300">DISCORD <ExternalLink size={13} /></a>}
            </div>

            {live && !live.available && <div className="mt-5 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[11px] font-mono text-amber-200">Live server query is temporarily unavailable. Saved server details are still available.</div>}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
