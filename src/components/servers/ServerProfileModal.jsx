import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, ExternalLink, Gamepad2, Gauge, Map, Radio, RefreshCw, Timer, Trophy, UserRound, Users, Wifi, X } from 'lucide-react';
import CapacityBar from '@/components/ui/CapacityBar';
import MarkdownContent from '@/components/ui/MarkdownContent';
import StatusBadge from '@/components/ui/StatusBadge';
import GameLiveDetails from './GameLiveDetails';

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

function elapsedSince(value) {
  if (!value) return null;
  const started = new Date(value).getTime();
  if (!Number.isFinite(started)) return null;
  return formatSessionTime(Math.max(0, (Date.now() - started) / 1000));
}

function parseMods(value) {
  const list = Array.isArray(value) ? value : String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
  return list.map((entry) => {
    const [name = '', description = '', url = ''] = String(entry).split('|').map((part) => part.trim());
    return { name, description, url };
  }).filter((mod) => mod.name);
}

function getJoinUrl(server) {
  if (server.joinUrl) return server.joinUrl;
  const address = String(server.ip || '').trim();
  return address ? `steam://connect/${address}` : '';
}

function Metric({ icon: Icon, label, value, accent = '#10FF8B' }) {
  return (
    <div className="rounded-lg p-3" style={{ background: `${accent}0A`, border: `1px solid ${accent}22` }}>
      <div className="mb-1 flex items-center gap-1.5">
        <Icon size={12} style={{ color: accent }} />
        <span className="text-[10px] font-mono tracking-wider" style={{ color: `${accent}AA` }}>{label}</span>
      </div>
      <div className="truncate text-sm font-bold" style={{ color: accent }}>{value || '—'}</div>
    </div>
  );
}

export default function ServerProfileModal({ server, onClose }) {
  const [copied, setCopied] = useState(false);
  const [trackedPlayers, setTrackedPlayers] = useState([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const live = server.live;
  const mods = parseMods(server.mods);
  const joinUrl = getJoinUrl(server);
  const fetchedAt = live?.fetchedAt ? new Date(live.fetchedAt) : null;
  const queryPlayers = Array.isArray(live?.players) ? live.players : [];

  const loadTrackedPlayers = useCallback(async () => {
    setPlayersLoading(true);
    try {
      const response = await fetch(`/api/players/online?serverId=${encodeURIComponent(server.id)}`);
      if (!response.ok) throw new Error(`Player API returned ${response.status}`);
      const payload = await response.json();
      setTrackedPlayers(Array.isArray(payload.items) ? payload.items : []);
    } catch {
      setTrackedPlayers([]);
    } finally {
      setPlayersLoading(false);
    }
  }, [server.id]);

  useEffect(() => {
    void loadTrackedPlayers();
    const timer = setInterval(loadTrackedPlayers, 30000);
    return () => clearInterval(timer);
  }, [loadTrackedPlayers]);

  const players = trackedPlayers.length > 0
    ? trackedPlayers.map((player) => ({ ...player, name: player.displayName, time: elapsedSince(player.connectedSince), tracked: true }))
    : queryPlayers;

  const handleCopy = async () => {
    if (!server.ip) return;
    await navigator.clipboard.writeText(server.ip);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const liveLabel = live?.queryType === 'palworld-rest' ? 'REST LIVE' : 'LIVE QUERY';

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
        <motion.div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl" initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ type: 'spring', damping: 22, stiffness: 280 }} style={{ background: 'rgba(6,14,6,0.99)', border: '1px solid rgba(16,255,139,0.2)' }}>
          <div className="relative h-52 overflow-hidden bg-black">
            {server.image ? <img src={server.image} alt={server.name} className="h-full w-full object-cover opacity-90" style={{ objectPosition: `center ${server.bannerPosition || 'center'}` }} /> : <div className="h-full w-full bg-gradient-to-br from-emerald-950 to-black" />}
            <div className="absolute inset-0 bg-gradient-to-t from-[#060e06] via-[#060e06]/30 to-transparent" />
            <div className="absolute left-4 top-4 flex gap-2">
              <span className="rounded border border-gold/40 bg-black/80 px-2 py-1 text-xs font-mono font-bold text-gold">{server.tag}</span>
              {live?.available && <span className="flex items-center gap-1 rounded border border-emerald-glow/30 bg-black/80 px-2 py-1 text-xs font-mono text-emerald-glow"><Radio size={11} className="animate-pulse" /> {liveLabel}</span>}
            </div>
            <div className="absolute right-12 top-4"><StatusBadge status={server.status} /></div>
            <button onClick={onClose} className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded bg-white/10 text-white/70"><X size={15} /></button>
          </div>

          <div className="p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-heading font-bold text-emerald-glow">{server.name}</h2>
                <div className="mt-1 text-xs font-mono text-muted-foreground">{server.game || live?.name || 'GAME SERVER'}{server.version || live?.version ? ` · ${server.version || live.version}` : ''}</div>
              </div>
              {fetchedAt && <div className="text-[10px] font-mono text-muted-foreground">UPDATED {fetchedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>}
            </div>

            <MarkdownContent className="mb-5 text-sm text-white/55">{server.description}</MarkdownContent>

            <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Metric icon={Users} label="PLAYERS" value={`${server.players?.current ?? 0}/${server.players?.max ?? 32}`} />
              <Metric icon={Map} label="MAP" value={server.map || 'Unknown'} accent="#D4AF37" />
              <Metric icon={Gauge} label="STATE" value={live?.state || server.status} accent="#7DD3FC" />
              {live?.ping != null && <Metric icon={Wifi} label="RESPONSE" value={`${Math.round(live.ping)} ms`} accent="#7DD3FC" />}
            </div>

            <CapacityBar current={server.players?.current ?? 0} max={server.players?.max ?? 32} label="SERVER CAPACITY" />

            <GameLiveDetails server={server} />

            {live?.available && (
              <section className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5"><Users size={13} className="text-emerald-glow" /><span className="text-xs font-mono tracking-wider text-emerald-glow">ONLINE PLAYERS</span></div>
                  <button type="button" onClick={loadTrackedPlayers} disabled={playersLoading} className="flex items-center gap-1 rounded border border-emerald-glow/20 bg-emerald-glow/5 px-2 py-1 text-[10px] font-mono text-emerald-glow disabled:opacity-50"><RefreshCw size={11} className={playersLoading ? 'animate-spin' : ''} /> REFRESH</button>
                </div>
                {playersLoading && players.length === 0 ? <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-4 text-center text-xs font-mono text-muted-foreground">Loading players…</div> : players.length > 0 ? (
                  <div className="space-y-2">
                    {players.map((player, index) => {
                      const sessionTime = player.tracked ? player.time : formatSessionTime(player.time);
                      return <div key={player.id || player.playerId || `${player.name}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-glow/10 bg-emerald-glow/[0.03] px-3 py-2.5">
                        <div className="flex min-w-0 items-center gap-2.5"><span className="h-2 w-2 rounded-full bg-emerald-glow" />{player.avatarUrl ? <img src={player.avatarUrl} alt="" className="h-7 w-7 rounded object-cover" /> : <UserRound size={15} className="text-emerald-glow" />}<div className="min-w-0"><div className="truncate text-sm font-semibold">{player.name}</div>{player.level != null && <div className="text-[10px] font-mono text-muted-foreground">Level {player.level}</div>}</div></div>
                        <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">{sessionTime && <span className="flex items-center gap-1"><Timer size={11} /> {sessionTime}</span>}{player.score != null && <span className="flex items-center gap-1"><Trophy size={11} /> {player.score}</span>}{player.profileUrl && <a href={player.profileUrl} target="_blank" rel="noreferrer"><ExternalLink size={12} /></a>}</div>
                      </div>;
                    })}
                  </div>
                ) : <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-4 text-center text-xs font-mono text-muted-foreground">No players are currently online.</div>}
              </section>
            )}

            {mods.length > 0 && <section className="mt-5"><div className="mb-3 flex items-center gap-1.5"><Gamepad2 size={13} className="text-gold" /><span className="text-xs font-mono tracking-wider text-gold">FEATURED MODS / PLUGINS</span></div><div className="space-y-2">{mods.map((mod) => <div key={`${mod.name}-${mod.url}`} className="rounded-lg border border-gold/15 bg-gold/[0.03] p-3"><div className="font-semibold">{mod.name}</div>{mod.description && <MarkdownContent className="mt-1 text-xs text-muted-foreground">{mod.description}</MarkdownContent>}</div>)}</div></section>}

            {(server.ip || server.joinInstructions) && <section className="mt-5 rounded-lg border border-emerald-glow/10 bg-emerald-glow/[0.03] p-4"><div className="mb-3 text-xs font-mono tracking-wider text-emerald-glow/60">CONNECT</div><MarkdownContent className="mb-3 text-sm text-white/55">{server.joinInstructions}</MarkdownContent>{server.ip && <button onClick={handleCopy} className="flex w-full items-center justify-between rounded border border-emerald-glow/20 bg-white/[0.03] px-3 py-2.5"><span className="font-mono text-sm text-emerald-glow">{server.ip}</span>{copied ? <Check size={14} className="text-emerald-glow" /> : <Copy size={14} className="text-white/40" />}</button>}</section>}

            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">{joinUrl && <a href={joinUrl} className="flex items-center justify-center gap-2 rounded bg-emerald-glow px-4 py-3 text-xs font-bold tracking-wider text-obsidian">JOIN SERVER <ExternalLink size={13} /></a>}{server.liveMapUrl && <a href={server.liveMapUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded border border-gold/30 bg-gold/5 px-4 py-3 text-xs font-bold tracking-wider text-gold">LIVE MAP <ExternalLink size={13} /></a>}{server.discordChannelUrl && <a href={server.discordChannelUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded border border-sky-400/30 bg-sky-400/5 px-4 py-3 text-xs font-bold tracking-wider text-sky-300">DISCORD <ExternalLink size={13} /></a>}</div>

            {live && !live.available && <div className="mt-5 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[11px] font-mono text-amber-200">Live server data is temporarily unavailable. Saved details are still shown.</div>}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
