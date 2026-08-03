import { useEffect, useState } from 'react';
import { Award, Edit3, Gamepad2, MapPin, Save, ShieldCheck, X } from 'lucide-react';

function duration(seconds = 0) {
  const hours = Math.floor((Number(seconds) || 0) / 3600);
  return hours < 1 ? '<1h' : `${hours}h`;
}

const tierClass = {
  bronze: 'border-amber-700/35 bg-amber-800/10 text-amber-300',
  silver: 'border-slate-300/25 bg-slate-200/5 text-slate-200',
  gold: 'border-yellow-300/30 bg-yellow-300/10 text-yellow-200',
};

export default function IdentityHub({ playerId, fallbackName, fallbackAvatar }) {
  const [hub, setHub] = useState(null);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    const response = await fetch(`/api/players/${encodeURIComponent(playerId)}/identity-hub`, { credentials: 'include', cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Unable to load identity profile.');
    setHub(payload);
    setForm({
      displayName: payload.details?.displayName || fallbackName || '',
      bio: payload.details?.bio || '',
      avatarUrl: payload.details?.avatarUrl || fallbackAvatar || '',
      bannerUrl: payload.details?.bannerUrl || '',
      location: payload.details?.location || '',
      favouriteGame: payload.details?.favouriteGame || '',
      isPublic: payload.details?.isPublic !== false,
    });
  };

  useEffect(() => { load().catch((err) => setError(err.message)); }, [playerId]);

  const save = async () => {
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/players/${encodeURIComponent(playerId)}/identity-hub`, {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Unable to save profile.');
      await load(); setEditing(false);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  if (!hub && !error) return <div className="mt-6 rounded-2xl border border-white/8 bg-black/35 p-6 text-sm text-white/35">Loading identity hub…</div>;

  const details = hub?.details || {};
  const games = hub?.gameProfiles || {};

  return <section className="mt-6 overflow-hidden rounded-2xl border border-emerald-glow/15 bg-black/35">
    <div className="relative min-h-32 border-b border-white/8 bg-gradient-to-br from-emerald-950/70 via-black to-black" style={details.bannerUrl ? { backgroundImage: `linear-gradient(to right, rgba(0,0,0,.72), rgba(0,0,0,.4)), url(${details.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
      <div className="flex flex-wrap items-end justify-between gap-4 p-6">
        <div className="flex items-end gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-xl border border-emerald-glow/30 bg-black/60">{(details.avatarUrl || fallbackAvatar) ? <img src={details.avatarUrl || fallbackAvatar} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><ShieldCheck className="text-emerald-glow" /></div>}</div>
          <div><div className="text-[10px] font-black uppercase tracking-[.24em] text-emerald-glow/70">ApexOrder Identity</div><h2 className="mt-1 text-2xl font-black text-white">{details.displayName || fallbackName}</h2>{details.location && <div className="mt-1 flex items-center gap-1 text-xs text-white/45"><MapPin size={12} /> {details.location}</div>}</div>
        </div>
        {hub?.canManage && <button onClick={() => setEditing(!editing)} className="flex items-center gap-2 rounded-lg border border-emerald-glow/25 bg-black/50 px-3 py-2 text-xs font-bold text-emerald-glow">{editing ? <X size={14} /> : <Edit3 size={14} />}{editing ? 'CANCEL' : 'EDIT PROFILE'}</button>}
      </div>
    </div>

    <div className="p-6">
      {error && <div className="mb-4 rounded-lg border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-200">{error}</div>}
      {editing ? <div className="grid gap-4 md:grid-cols-2">
        {[['displayName','Display name'],['location','Location'],['favouriteGame','Favourite game'],['avatarUrl','Avatar URL'],['bannerUrl','Banner URL']].map(([key,label]) => <label key={key}><span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</span><input value={form[key] || ''} onChange={(e) => setForm((v) => ({ ...v, [key]: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-emerald-glow/40" /></label>)}
        <label className="md:col-span-2"><span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-white/40">Bio</span><textarea rows={4} maxLength={500} value={form.bio || ''} onChange={(e) => setForm((v) => ({ ...v, bio: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-emerald-glow/40" /></label>
        <label className="flex items-center gap-3 text-sm text-white/60"><input type="checkbox" checked={form.isPublic !== false} onChange={(e) => setForm((v) => ({ ...v, isPublic: e.target.checked }))} /> Public profile</label>
        <div className="md:text-right"><button disabled={busy} onClick={save} className="inline-flex items-center gap-2 rounded-lg bg-emerald-glow px-4 py-2 text-xs font-black text-black disabled:opacity-50"><Save size={14} /> {busy ? 'SAVING…' : 'SAVE PROFILE'}</button></div>
      </div> : <p className="max-w-3xl text-sm leading-6 text-white/55">{details.bio || 'This player has not added a bio yet.'}</p>}

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <div><div className="mb-3 flex items-center gap-2"><Gamepad2 size={17} className="text-emerald-glow" /><h3 className="font-black text-white">Game Profiles</h3></div><div className="space-y-3">
          {games.dayz && <div className="rounded-xl border border-white/8 bg-white/[.025] p-4"><div className="font-black text-white">DayZ</div><div className="mt-2 flex flex-wrap gap-2 text-[11px] text-white/45"><span>{duration(games.dayz.totalPlaytimeSeconds)} played</span><span>·</span><span>{games.dayz.sessionCount || 0} sessions</span></div></div>}
          {games.sevenDaysToDie && <div className="rounded-xl border border-amber-300/10 bg-amber-300/[.035] p-4"><div className="font-black text-white">7 Days to Die</div><div className="mt-1 text-xs text-amber-200/60">{games.sevenDaysToDie.currentName}</div><div className="mt-2 flex flex-wrap gap-2 text-[11px] text-white/45"><span>{duration(games.sevenDaysToDie.totalPlaytimeSeconds)} played</span><span>·</span><span>{games.sevenDaysToDie.zombieKills || 0} zombies</span><span>·</span><span>Level {games.sevenDaysToDie.level ?? '—'}</span></div></div>}
          {!games.dayz && !games.sevenDaysToDie && <div className="rounded-xl border border-white/8 p-5 text-sm text-white/35">No captured game identities yet.</div>}
        </div></div>

        <div><div className="mb-3 flex items-center gap-2"><Award size={17} className="text-amber-300" /><h3 className="font-black text-white">Achievements</h3></div><div className="grid gap-2 sm:grid-cols-2">{(hub?.achievements || []).map((achievement) => <div key={achievement.id} className={`rounded-xl border p-3 ${tierClass[achievement.tier] || tierClass.bronze}`}><div className="text-sm font-black">{achievement.name}</div><div className="mt-1 text-[11px] opacity-65">{achievement.description}</div></div>)}{!hub?.achievements?.length && <div className="rounded-xl border border-white/8 p-5 text-sm text-white/35 sm:col-span-2">Achievements will unlock automatically from linked accounts and server activity.</div>}</div></div>
      </div>
    </div>
  </section>;
}
