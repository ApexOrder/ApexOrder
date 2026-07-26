import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock3, Radio, ShieldCheck, UserRound } from 'lucide-react';

function formatDuration(seconds) {
  const value = Number(seconds || 0);
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function PlayerProfile() {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [playerResponse, sessionsResponse] = await Promise.all([
          fetch(`/api/players/${encodeURIComponent(id)}`),
          fetch(`/api/players/${encodeURIComponent(id)}/sessions?limit=50`),
        ]);
        if (!playerResponse.ok) throw new Error(playerResponse.status === 404 ? 'Player profile not found.' : `Player API returned ${playerResponse.status}`);
        if (!sessionsResponse.ok) throw new Error(`Session API returned ${sessionsResponse.status}`);
        const playerPayload = await playerResponse.json();
        const sessionPayload = await sessionsResponse.json();
        if (active) {
          setPlayer(playerPayload);
          setSessions(Array.isArray(sessionPayload.items) ? sessionPayload.items : []);
        }
      } catch (loadError) {
        if (active) setError(loadError.message || 'Unable to load this player profile.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [id]);

  if (loading) return <div className="min-h-screen px-4 pt-32 text-center font-mono text-sm text-white/40">Loading player profile…</div>;
  if (error || !player) return <div className="mx-auto min-h-screen max-w-4xl px-4 pt-32"><Link to="/players" className="mb-6 inline-flex items-center gap-2 text-sm text-emerald-glow"><ArrowLeft size={15} /> Back to players</Link><div className="rounded-xl border border-red-400/20 bg-red-400/5 p-5 text-red-200">{error || 'Player profile not found.'}</div></div>;

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <Link to="/players" className="mb-6 inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-emerald-glow"><ArrowLeft size={15} /> Back to players</Link>

      <section className="rounded-2xl border border-emerald-glow/20 bg-black/45 p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-emerald-glow/25 bg-emerald-glow/5">
              {player.avatarUrl ? <img src={player.avatarUrl} alt="" className="h-full w-full rounded-xl object-cover" /> : <UserRound size={36} className="text-emerald-glow" />}
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h1 className="truncate text-3xl font-black text-white md:text-4xl">{player.displayName}</h1>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${player.online ? 'border-emerald-glow/35 bg-emerald-glow/10 text-emerald-glow' : 'border-white/10 bg-white/5 text-white/40'}`}>{player.online ? 'Online' : 'Offline'}</span>
              </div>
              <div className="text-xs font-mono uppercase tracking-wider text-white/35">{player.provider} · {player.providerId}</div>
            </div>
          </div>
          {player.profileUrl && <a href={player.profileUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-emerald-glow/25 bg-emerald-glow/5 px-4 py-2 text-xs font-bold text-emerald-glow">External profile</a>}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/7 bg-white/[0.025] p-4"><Clock3 size={17} className="mb-3 text-emerald-glow" /><div className="text-xl font-black text-white">{formatDuration(player.totalPlaytimeSeconds)}</div><div className="text-[10px] uppercase tracking-wider text-white/35">Total playtime</div></div>
          <div className="rounded-xl border border-white/7 bg-white/[0.025] p-4"><ShieldCheck size={17} className="mb-3 text-emerald-glow" /><div className="text-xl font-black text-white">{player.sessionCount}</div><div className="text-[10px] uppercase tracking-wider text-white/35">Sessions</div></div>
          <div className="rounded-xl border border-white/7 bg-white/[0.025] p-4"><UserRound size={17} className="mb-3 text-emerald-glow" /><div className="text-sm font-black text-white">{formatDate(player.firstSeenAt)}</div><div className="text-[10px] uppercase tracking-wider text-white/35">First seen</div></div>
          <div className="rounded-xl border border-white/7 bg-white/[0.025] p-4"><Radio size={17} className="mb-3 text-emerald-glow" /><div className="text-sm font-black text-white">{formatDate(player.lastSeenAt)}</div><div className="text-[10px] uppercase tracking-wider text-white/35">Last seen</div></div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/8 bg-black/35 p-6">
        <div className="mb-5">
          <h2 className="text-xl font-black text-white">Recent Sessions</h2>
          <p className="mt-1 text-xs text-white/35">Latest captured activity across ApexOrder servers.</p>
        </div>
        <div className="space-y-2">
          {sessions.map((session) => (
            <div key={session.id} className="grid gap-3 rounded-xl border border-white/6 bg-white/[0.02] px-4 py-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
              <div><div className="text-sm font-bold text-white">Server {session.serverId}</div><div className="text-[10px] font-mono text-white/30">Connected {formatDate(session.connectedAt)}</div></div>
              <div className="text-xs text-white/45">{session.disconnectedAt ? `Left ${formatDate(session.disconnectedAt)}` : 'Currently online'}</div>
              <div className="text-sm font-black text-emerald-glow">{session.durationSeconds == null ? 'Live' : formatDuration(session.durationSeconds)}</div>
            </div>
          ))}
          {sessions.length === 0 && <div className="py-10 text-center text-sm text-white/35">No sessions captured yet.</div>}
        </div>
      </section>
    </div>
  );
}
