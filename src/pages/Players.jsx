import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock3, Search, ShieldCheck, UserRound, Users } from 'lucide-react';

function formatPlaytime(seconds) {
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

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch('/api/players?limit=100');
        if (!response.ok) throw new Error(`Player API returned ${response.status}`);
        const payload = await response.json();
        if (active) setPlayers(Array.isArray(payload.items) ? payload.items : []);
      } catch (loadError) {
        if (active) setError(loadError.message || 'Unable to load players.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return [...players]
      .filter((player) => !needle || player.displayName?.toLowerCase().includes(needle) || player.providerId?.toLowerCase().includes(needle))
      .sort((a, b) => Number(b.online) - Number(a.online) || new Date(b.lastSeenAt) - new Date(a.lastSeenAt));
  }, [players, search]);

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-emerald-glow"><Users size={15} /> Community identities</div>
        <h1 className="text-4xl font-black text-white md:text-5xl">Player Profiles</h1>
        <p className="mt-3 max-w-2xl text-sm text-white/50">Browse players captured across ApexOrder servers, including current status, activity and playtime.</p>
      </div>

      <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-glow/15 bg-black/40 px-4 py-3">
        <Search size={17} className="text-emerald-glow" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search player name or identity…" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25" />
      </div>

      {loading ? <div className="py-20 text-center font-mono text-sm text-white/40">Loading player identities…</div> : error ? <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-5 text-sm text-red-200">{error}</div> : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((player) => (
            <Link key={player.id} to={`/players/${player.id}`} className="group rounded-xl border border-white/8 bg-black/35 p-5 transition hover:border-emerald-glow/30 hover:bg-emerald-glow/[0.04]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-emerald-glow/20 bg-emerald-glow/5">
                    {player.avatarUrl ? <img src={player.avatarUrl} alt="" className="h-full w-full rounded-lg object-cover" /> : <UserRound className="text-emerald-glow" />}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-black text-white group-hover:text-emerald-glow">{player.displayName}</h2>
                    <p className="truncate text-[10px] font-mono uppercase tracking-wider text-white/35">{player.provider} · {player.providerId}</p>
                  </div>
                </div>
                <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${player.online ? 'border-emerald-glow/35 bg-emerald-glow/10 text-emerald-glow' : 'border-white/10 bg-white/5 text-white/40'}`}>{player.online ? 'Online' : 'Offline'}</span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-white/6 bg-white/[0.02] p-2"><Clock3 size={13} className="mx-auto mb-1 text-emerald-glow" /><div className="text-xs font-bold text-white">{formatPlaytime(player.totalPlaytimeSeconds)}</div><div className="text-[9px] uppercase text-white/30">Playtime</div></div>
                <div className="rounded-lg border border-white/6 bg-white/[0.02] p-2"><ShieldCheck size={13} className="mx-auto mb-1 text-emerald-glow" /><div className="text-xs font-bold text-white">{player.sessionCount}</div><div className="text-[9px] uppercase text-white/30">Sessions</div></div>
                <div className="rounded-lg border border-white/6 bg-white/[0.02] p-2"><UserRound size={13} className="mx-auto mb-1 text-emerald-glow" /><div className="truncate text-xs font-bold text-white">{formatDate(player.lastSeenAt).split(',')[0]}</div><div className="text-[9px] uppercase text-white/30">Last seen</div></div>
              </div>
            </Link>
          ))}
          {filtered.length === 0 && <div className="md:col-span-2 py-20 text-center text-sm text-white/35">No matching players found.</div>}
        </div>
      )}
    </div>
  );
}
