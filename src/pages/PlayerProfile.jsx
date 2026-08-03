import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock3, Crosshair, Gauge, Radio, Server as ServerIcon, ShieldCheck, Skull, Trophy, UserRound } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import LinkedAccounts from '@/components/players/LinkedAccounts';

function formatDuration(seconds) {
  const value = Number(seconds || 0);
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

function StatCard({ icon: Icon, value, label, accent = 'text-emerald-glow' }) {
  return <div className="rounded-xl border border-white/7 bg-white/[0.025] p-4"><Icon size={17} className={`mb-3 ${accent}`} /><div className="text-xl font-black text-white">{value}</div><div className="text-[10px] uppercase tracking-wider text-white/35">{label}</div></div>;
}

export default function PlayerProfile() {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const serverNames = useMemo(() => new Map(servers.map((server) => [server.id, server.name])), [servers]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [playerResponse, sessionsResponse, serverPayload] = await Promise.all([
          fetch(`/api/players/${encodeURIComponent(id)}`),
          fetch(`/api/players/${encodeURIComponent(id)}/sessions?limit=50`),
          base44.entities.Server.list('sort_order').catch(() => []),
        ]);
        if (!playerResponse.ok) throw new Error(playerResponse.status === 404 ? 'Player profile not found.' : `Player API returned ${playerResponse.status}`);
        if (!sessionsResponse.ok) throw new Error(`Session API returned ${sessionsResponse.status}`);
        const playerPayload = await playerResponse.json();
        const sessionPayload = await sessionsResponse.json();
        if (active) {
          setPlayer(playerPayload);
          setSessions(Array.isArray(sessionPayload.items) ? sessionPayload.items : []);
          setServers(Array.isArray(serverPayload) ? serverPayload : []);
        }
      } catch (loadError) {
        if (active) setError(loadError.message || 'Unable to load this player profile.');
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [id]);

  if (loading) return <div className="min-h-screen px-4 pt-32 text-center font-mono text-sm text-white/40">Loading player profile…</div>;
  if (error || !player) return <div className="mx-auto min-h-screen max-w-4xl px-4 pt-32"><Link to="/players" className="mb-6 inline-flex items-center gap-2 text-sm text-emerald-glow"><ArrowLeft size={15} /> Back to players</Link><div className="rounded-xl border border-red-400/20 bg-red-400/5 p-5 text-red-200">{error || 'Player profile not found.'}</div></div>;

  const sevenDays = player.games?.sevenDaysToDie;
  const sevenDaysServerName = sevenDays?.serverId ? serverNames.get(sevenDays.serverId) || sevenDays.serverId : 'Unknown ApexOrder server';

  return <div className="mx-auto min-h-screen max-w-5xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
    <Link to="/players" className="mb-6 inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-emerald-glow"><ArrowLeft size={15} /> Back to players</Link>

    <section className="rounded-2xl border border-emerald-glow/20 bg-black/45 p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex min-w-0 items-center gap-4"><div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-emerald-glow/25 bg-emerald-glow/5">{player.avatarUrl ? <img src={player.avatarUrl} alt="" className="h-full w-full rounded-xl object-cover" /> : <UserRound size={36} className="text-emerald-glow" />}</div><div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2"><h1 className="truncate text-3xl font-black text-white md:text-4xl">{player.displayName}</h1><span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${player.online ? 'border-emerald-glow/35 bg-emerald-glow/10 text-emerald-glow' : 'border-white/10 bg-white/5 text-white/40'}`}>{player.online ? 'Online' : 'Offline'}</span></div><div className="text-xs font-mono uppercase tracking-wider text-white/35">{player.provider} · {player.providerId}</div></div></div>
        {player.profileUrl && <a href={player.profileUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-emerald-glow/25 bg-emerald-glow/5 px-4 py-2 text-xs font-bold text-emerald-glow">External profile</a>}
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><StatCard icon={Clock3} value={formatDuration(player.totalPlaytimeSeconds)} label="Total playtime" /><StatCard icon={ShieldCheck} value={player.sessionCount} label="Sessions" /><StatCard icon={UserRound} value={formatDate(player.firstSeenAt)} label="First seen" /><StatCard icon={Radio} value={formatDate(player.lastSeenAt)} label="Last seen" /></div>
    </section>

    <LinkedAccounts playerId={id} />

    {sevenDays && <section className="mt-6 rounded-2xl border border-amber-400/15 bg-black/35 p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><div className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-300/70">7 Days to Die</div><h2 className="mt-1 text-xl font-black text-white">Survivor Profile</h2></div><div className="text-xs text-white/35">Updated {formatDate(sevenDays.lastSeenAt)}</div></div>
      <div className="mb-4 grid gap-3 lg:grid-cols-2"><div className="rounded-xl border border-amber-300/10 bg-amber-300/[0.035] p-4"><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-300/70"><ServerIcon size={14} /> Server</div><div className="text-sm font-black text-white">{sevenDaysServerName}</div></div><div className="rounded-xl border border-amber-300/10 bg-amber-300/[0.035] p-4"><div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-300/70">Captured identity</div><div className="break-all font-mono text-sm font-black text-white">{sevenDays.steamId64 || player.providerId}</div></div></div>
      <div className="mb-4 rounded-xl border border-white/7 bg-white/[0.025] p-4"><div className="text-[10px] uppercase tracking-wider text-white/35">Player name and aliases</div><div className="mt-1 text-lg font-black text-white">{sevenDays.currentName || player.displayName}</div><div className="mt-2 text-xs text-white/45">{sevenDays.aliases?.length ? sevenDays.aliases.join(', ') : sevenDays.currentName || player.displayName}</div></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><StatCard icon={Skull} value={sevenDays.zombieKills} label="Zombie kills" accent="text-amber-300" /><StatCard icon={Crosshair} value={sevenDays.pvpKills} label="PvP kills" accent="text-amber-300" /><StatCard icon={ShieldCheck} value={sevenDays.deaths} label="Deaths" accent="text-amber-300" /><StatCard icon={Gauge} value={sevenDays.level ?? '—'} label="Level" accent="text-amber-300" /><StatCard icon={Gauge} value={sevenDays.gameStage ?? '—'} label="Game stage" accent="text-amber-300" /><StatCard icon={Trophy} value={sevenDays.score ?? '—'} label="Score" accent="text-amber-300" /></div>
    </section>}

    <section className="mt-6 rounded-2xl border border-white/8 bg-black/35 p-6"><div className="mb-5"><h2 className="text-xl font-black text-white">Recent Sessions</h2><p className="mt-1 text-xs text-white/35">Latest captured activity across ApexOrder servers.</p></div><div className="space-y-2">{sessions.map((session) => <div key={session.id} className="grid gap-3 rounded-xl border border-white/6 bg-white/[0.02] px-4 py-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><div className="text-sm font-bold text-white">{serverNames.get(session.serverId) || 'Unknown ApexOrder server'}</div><div className="text-[10px] font-mono text-white/30">Connected {formatDate(session.connectedAt)}</div></div><div className="text-xs text-white/45">{session.disconnectedAt ? `Left ${formatDate(session.disconnectedAt)}` : 'Currently online'}</div><div className="text-sm font-black text-emerald-glow">{session.durationSeconds == null ? 'Live' : formatDuration(session.durationSeconds)}</div></div>)}{sessions.length === 0 && <div className="py-10 text-center text-sm text-white/35">No sessions captured yet.</div>}</div></section>
  </div>;
}
