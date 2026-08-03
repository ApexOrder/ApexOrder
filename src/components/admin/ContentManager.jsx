import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const QUERY_TYPES = ['protocol-valve', 'dayz', 'minecraft', 'minecraftbedrock', 'rust', 'valheim', 'arkse', 'conanexiles', 'terraria', 'cs2', 'teamspeak3', 'mumble'];

const SERVER_FIELDS = [
  ['name', 'Server Name'], ['game', 'Game'],
  ['tag', 'Category', 'select', ['SURVIVAL', 'ROLEPLAY', 'SANDBOX', 'HARDCORE', 'FPS', 'STRATEGY']],
  ['status', 'Fallback Status', 'select', ['offline', 'online', 'maintenance']],
  ['image', 'Image URL'], ['banner_position', 'Banner Position', 'select', ['top', 'upper', 'center', 'lower', 'bottom']],
  ['description', 'Description', 'textarea'], ['ip', 'Connection Address'], ['join_link', 'Join Button URL'],
  ['join_instructions', 'Joining Instructions', 'textarea'], ['query_type', 'Query Protocol / Game Type', 'select', QUERY_TYPES],
  ['query_host', 'Query Host'], ['query_port', 'Query Port', 'number'], ['rcon_enabled', 'Use BattlEye RCon Players', 'boolean'],
  ['rcon_host', 'BattlEye RCon Host'], ['rcon_port', 'BattlEye RCon Port', 'number'], ['rcon_password', 'BattlEye RCon Password', 'password'],
  ['live_map_url', 'Live Map URL'], ['discord_channel_url', 'Discord Channel URL'], ['map', 'Fallback Map'], ['version', 'Fallback Version'],
  ['players_max', 'Fallback Max Players', 'number'], ['mods', 'Mods / Plugins (comma separated)'], ['sort_order', 'Sort Order', 'number'], ['featured', 'Featured Server', 'boolean'],
  ['stat_show_zombie_kills', 'Leaderboard: Zombie Kills', 'boolean'], ['stat_show_pvp_kills', 'Leaderboard: PvP Kills', 'boolean'],
  ['stat_show_deaths', 'Leaderboard: Deaths', 'boolean'], ['stat_show_playtime', 'Leaderboard: 7DTD Playtime', 'boolean'],
  ['stat_show_score', 'Leaderboard: Score', 'boolean'], ['stat_show_level', 'Leaderboard: Level / Game Stage', 'boolean'],
  ['stat_show_total_playtime', 'Leaderboard: DayZ Total Playtime', 'boolean'], ['stat_show_week_playtime', 'Leaderboard: DayZ Weekly Playtime', 'boolean'],
  ['stat_show_month_playtime', 'Leaderboard: DayZ Monthly Playtime', 'boolean'], ['stat_show_sessions', 'Leaderboard: DayZ Sessions', 'boolean'],
  ['stat_show_longest_session', 'Leaderboard: DayZ Longest Session', 'boolean'], ['stat_show_online_status', 'Leaderboard: DayZ Online Status', 'boolean'],
];

const SECTIONS = {
  Server: { label: 'Servers', sort: '-sort_order', title: 'name', fields: SERVER_FIELDS },
  Project: { label: 'Projects', sort: 'sort_order', title: 'title', fields: [['title', 'Project Title'], ['status', 'Status', 'select', ['In Development', 'Live', 'Completed', 'On Hold']], ['game', 'Game'], ['thumbnail', 'Thumbnail URL'], ['screenshots', 'Screenshot URLs'], ['video_url', 'Video URL'], ['tags', 'Tags'], ['sort_order', 'Sort Order', 'number'], ['description', 'Description', 'textarea']] },
  Event: { label: 'Events', sort: 'date', title: 'title', fields: [['title', 'Event Title'], ['game', 'Game'], ['date', 'Date & Time', 'datetime-local'], ['server_id', 'Linked Server ID'], ['discord_link', 'Discord Event Link'], ['banner_image', 'Banner Image URL'], ['description', 'Description', 'textarea']] },
  StoreItem: { label: 'Store Items', sort: '-sort_order', title: 'name', fields: [['name', 'Item Name'], ['category', 'Category', 'select', ['Ranks', 'Cosmetics', 'Bundles', 'Merch', 'Other']], ['type', 'Type', 'select', ['digital', 'physical']], ['price_usd', 'Price (USD)', 'number'], ['token_price', 'Token Price', 'number'], ['badge', 'Badge'], ['image', 'Image URL'], ['available', 'Available', 'boolean'], ['sort_order', 'Sort Order', 'number'], ['description', 'Description', 'textarea']] },
  NewsPost: { label: 'News', sort: '-created_date', title: 'title', fields: [['title', 'Title'], ['category', 'Category', 'select', ['Announcement', 'Update', 'Event', 'Community', 'Other']], ['thumbnail', 'Thumbnail URL'], ['summary', 'Short Summary'], ['content', 'Full Content', 'textarea'], ['published', 'Published', 'boolean']] },
  Changelog: { label: 'Changelog', sort: '-created_date', title: 'title', fields: [['title', 'Title'], ['version', 'Version'], ['category', 'Category', 'select', ['Server Update', 'Mod Update', 'Bug Fix', 'New Feature', 'Announcement']], ['game', 'Game'], ['content', 'Content', 'textarea'], ['published', 'Published', 'boolean']] },
  PlayerStat: { label: 'Live Player Stats', title: 'player_name', liveStats: true },
  Order: { label: 'Orders', sort: '-created_date', title: 'id', readOnly: true },
  BanAppeal: { label: 'Ban Appeals', sort: '-created_date', title: 'player_name', statusOnly: true },
  Recruitment: { label: 'Recruitment', sort: '-created_date', title: 'name', statusOnly: true },
};

function emptyFor(section) {
  return Object.fromEntries((section.fields || []).map(([key, , type, options]) => [key, type === 'number' ? 0 : type === 'boolean' ? true : type === 'select' ? options?.[0] || '' : '']));
}

function formForRow(section, row) { return { ...emptyFor(section), ...row }; }
function formatDuration(seconds = 0) {
  const total = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}
function serverText(server) { return [server?.query_type, server?.game, server?.name].filter(Boolean).join(' ').toLowerCase(); }
function isDayZ(server) { return serverText(server).includes('dayz'); }
function is7DTD(server) { const text = serverText(server); return text.includes('7dtd') || text.includes('7 days') || text.includes('seven days'); }

function Toggle({ checked, onChange }) {
  return <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative h-7 w-12 rounded-full border transition ${checked ? 'border-emerald-300 bg-emerald-400/30' : 'border-white/15 bg-white/5'}`}>
    <span className={`absolute top-1 h-5 w-5 rounded-full transition ${checked ? 'left-6 bg-emerald-300' : 'left-1 bg-gray-500'}`} />
  </button>;
}

function Field({ spec, value, onChange }) {
  const [key, label, type = 'text', options = []] = spec;
  const common = 'w-full rounded-lg border border-emerald-400/20 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/60';
  if (type === 'boolean') return <label className="flex items-center justify-between gap-4 rounded-lg border border-white/5 bg-black/20 px-3 py-2"><span className="text-xs font-bold uppercase tracking-wider text-emerald-300">{label}</span><Toggle checked={value !== false} onChange={(next) => onChange(key, next)} /></label>;
  return <label className={type === 'textarea' ? 'md:col-span-2' : ''}>
    <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-emerald-300">{label}</span>
    {type === 'textarea' ? <textarea rows={5} className={common} value={value ?? ''} onChange={(event) => onChange(key, event.target.value)} />
      : type === 'select' ? <select className={common} value={value ?? ''} onChange={(event) => onChange(key, event.target.value)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>
        : <input className={common} type={type} autoComplete={type === 'password' ? 'new-password' : undefined} value={type === 'datetime-local' && value ? String(value).slice(0, 16) : value ?? ''} onChange={(event) => onChange(key, type === 'number' ? Number(event.target.value) : event.target.value)} />}
  </label>;
}

function liveFields(row) {
  return row?.source === 'dayz'
    ? [['player_name', 'Player Name'], ['totalPlaytimeSeconds', 'Total Playtime (seconds)', 'number'], ['weekPlaytimeSeconds', 'Weekly Playtime (seconds)', 'number'], ['monthPlaytimeSeconds', 'Monthly Playtime (seconds)', 'number'], ['sessionCount', 'Session Count', 'number'], ['longestSessionSeconds', 'Longest Session (seconds)', 'number']]
    : [['player_name', 'Player Name'], ['zombieKills', 'Zombie Kills', 'number'], ['pvpKills', 'PvP Kills', 'number'], ['deaths', 'Deaths', 'number'], ['totalPlaytimeSeconds', 'Playtime (seconds)', 'number'], ['score', 'Score', 'number'], ['level', 'Level', 'number'], ['gameStage', 'Game Stage', 'number']];
}

function LiveStatRow({ row, onEdit, onDelete }) {
  const source = row?.source === 'dayz' ? 'dayz' : '7dtd';
  const details = source === 'dayz'
    ? [`Total ${formatDuration(row.totalPlaytimeSeconds)}`, `Week ${formatDuration(row.weekPlaytimeSeconds)}`, `Month ${formatDuration(row.monthPlaytimeSeconds)}`, `${Number(row.sessionCount) || 0} sessions`, `Longest ${formatDuration(row.longestSessionSeconds)}`]
    : [`${Number(row.zombieKills) || 0} zombies`, `${Number(row.pvpKills) || 0} PvP`, `${Number(row.deaths) || 0} deaths`, `${formatDuration(row.totalPlaytimeSeconds)} played`, `Score ${Number(row.score) || 0}`];
  return <div className="rounded-lg border border-white/5 bg-black/25 p-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="font-bold text-white">{row.player_name || 'Unknown player'}</p><p className="text-xs text-gray-500">{row.server_name || 'Unknown server'} · {source.toUpperCase()}{row.online ? ' · ONLINE' : ''}</p></div>
      <div className="flex flex-wrap items-center gap-2"><div className="flex flex-wrap gap-2">{details.map((detail) => <span key={detail} className="rounded border border-emerald-400/15 bg-emerald-400/5 px-2 py-1 text-[11px] font-mono text-gray-300">{detail}</span>)}</div><button onClick={() => onEdit(row)} className="rounded border border-emerald-400/20 px-3 py-1.5 text-xs font-bold text-emerald-300">EDIT</button><button onClick={() => onDelete(row)} className="rounded border border-red-400/20 p-2 text-red-300"><Trash2 size={14} /></button></div>
    </div>
  </div>;
}

export default function ContentManager() {
  const sectionKeys = Object.keys(SECTIONS);
  const [entity, setEntity] = useState(sectionKeys[0]);
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [gameFilter, setGameFilter] = useState('all');
  const section = SECTIONS[entity];

  const loadLiveStats = async () => {
    const servers = await base44.entities.Server.list();
    const [sevenResult, dayzResult] = await Promise.allSettled([
      fetch('/api/leaderboards/7dtd?limit=100', { cache: 'no-store' }),
      fetch('/api/leaderboards/dayz?limit=100', { cache: 'no-store' }),
    ]);
    const readRows = async (result, label) => {
      if (result.status !== 'fulfilled') throw new Error(`${label} leaderboard could not be reached.`);
      if (!result.value.ok) throw new Error(`${label} leaderboard returned ${result.value.status}.`);
      const payload = await result.value.json();
      return Array.isArray(payload) ? payload : [];
    };
    const errors = [];
    let sevenRows = []; let dayzRows = [];
    try { sevenRows = await readRows(sevenResult, '7DTD'); } catch (error) { errors.push(error.message); }
    try { dayzRows = await readRows(dayzResult, 'DayZ'); } catch (error) { errors.push(error.message); }
    if (errors.length === 2) throw new Error(errors.join(' '));
    if (errors.length) setMessage(errors.join(' '));
    const sevenServer = servers.find(is7DTD);
    const dayzServer = servers.find(isDayZ);
    return [
      ...(sevenServer ? sevenRows.filter(Boolean).map((row) => ({ ...row, id: String(row.playerId || row.id || ''), player_name: row.name || row.aliases?.[0] || 'Unknown survivor', server_name: sevenServer.name, source: '7dtd' })).filter((row) => row.id) : []),
      ...(dayzServer ? dayzRows.filter(Boolean).map((row) => ({ ...row, id: String(row.id || ''), player_name: row.displayName || 'Unknown survivor', server_name: dayzServer.name, source: 'dayz' })).filter((row) => row.id) : []),
    ].sort((left, right) => String(left.server_name).localeCompare(String(right.server_name)) || String(left.player_name).localeCompare(String(right.player_name)));
  };

  const load = async () => {
    setLoading(true); setMessage('');
    try {
      const loaded = section.liveStats ? await loadLiveStats() : await base44.entities[entity].list(section.sort);
      setRows(Array.isArray(loaded) ? loaded : []);
    } catch (error) {
      console.error('[ContentManager] load failed:', error);
      setRows([]);
      setMessage(error?.message || 'Unable to load this section.');
    } finally { setLoading(false); }
  };

  useEffect(() => { setEditing(null); setGameFilter('all'); load(); }, [entity]);

  const startNew = () => {
    setEditing('new');
    const next = emptyFor(section);
    if (entity === 'Server') Object.assign(next, { query_type: 'protocol-valve', query_host: '127.0.0.1', query_port: 26903, rcon_enabled: false, rcon_port: 2306, banner_position: 'center' });
    setForm(next);
  };
  const startEdit = (row) => { setEditing(`${row.source || entity}-${row.id}`); setForm(section.liveStats ? { ...row } : formForRow(section, row)); };
  const cancel = () => { setEditing(null); setForm({}); };

  const save = async () => {
    setLoading(true); setMessage('');
    try {
      if (section.liveStats) {
        const response = await fetch(`/api/admin/player-stats/${form.source}/${encodeURIComponent(form.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || `Update failed (${response.status})`);
      } else {
        const payload = formForRow(section, form);
        if (payload.date && !String(payload.date).endsWith('Z')) payload.date = new Date(payload.date).toISOString();
        if (editing === 'new') await base44.entities[entity].create(payload); else await base44.entities[entity].update(form.id || editing, payload);
      }
      setMessage(editing === 'new' ? 'Created successfully.' : 'Updated successfully.');
      cancel(); await load();
    } catch (error) { setMessage(error?.message || 'Save failed.'); } finally { setLoading(false); }
  };

  const remove = async (rowOrId) => {
    const row = typeof rowOrId === 'object' ? rowOrId : null;
    const warning = row ? `Delete ${row.player_name} and all captured ${String(row.source).toUpperCase()} stats? The record may be recreated when the player next joins.` : 'Delete this item permanently?';
    if (!window.confirm(warning)) return;
    setLoading(true); setMessage('');
    try {
      if (section.liveStats && row) {
        const response = await fetch(`/api/admin/player-stats/${row.source}/${encodeURIComponent(row.id)}`, { method: 'DELETE' });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || `Delete failed (${response.status})`);
      } else await base44.entities[entity].delete(rowOrId);
      setMessage('Deleted successfully.'); await load();
    } catch (error) { setMessage(error?.message || 'Delete failed.'); } finally { setLoading(false); }
  };

  const updateStatus = async (row, status) => { setLoading(true); try { await base44.entities[entity].update(row.id, { status }); await load(); } catch (error) { setMessage(error.message); } finally { setLoading(false); } };
  const filteredRows = useMemo(() => section.liveStats && gameFilter !== 'all' ? rows.filter((row) => row.source === gameFilter) : rows, [rows, section.liveStats, gameFilter]);
  const summary = `${filteredRows.length}${section.liveStats && gameFilter !== 'all' ? ` of ${rows.length}` : ''} ${section.label.toLowerCase()}`;
  const editFields = section.liveStats ? liveFields(form) : section.fields || [];

  return <div className="space-y-5">
    <div className="flex flex-wrap gap-2">{sectionKeys.map((key) => <button key={key} onClick={() => setEntity(key)} className={`rounded-lg border px-3 py-2 text-xs font-bold ${entity === key ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300' : 'border-white/10 text-gray-400'}`}>{SECTIONS[key].label}</button>)}</div>
    <div className="rounded-xl border border-emerald-400/15 bg-black/30 p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black text-white">{section.label}</h2><p className="text-xs text-gray-500">{summary}{section.liveStats ? ' · automatically populated from live game data' : ''}</p></div><div className="flex gap-2"><button onClick={load} disabled={loading} className="rounded-lg border border-white/10 p-2 text-gray-400 hover:text-white disabled:opacity-40"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>{!section.readOnly && !section.statusOnly && !section.liveStats && <button onClick={startNew} className="flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300"><Plus size={15} /> NEW</button>}</div></div>
      {section.liveStats && <div className="mb-5 flex flex-wrap items-center gap-2"><span className="mr-1 text-xs font-bold uppercase tracking-wider text-gray-500">Filter by game</span>{[['all', 'All Games'], ['7dtd', '7 Days to Die'], ['dayz', 'DayZ']].map(([value, label]) => <button key={value} onClick={() => setGameFilter(value)} className={`rounded-lg border px-3 py-2 text-xs font-bold ${gameFilter === value ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300' : 'border-white/10 text-gray-400'}`}>{label}</button>)}</div>}
      {message && <div className="mb-4 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-200">{message}</div>}
      {editing && <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4"><div className="mb-3 text-xs font-bold uppercase tracking-widest text-gold">{section.liveStats ? `Editing ${String(form.source || '').toUpperCase()} live stats` : editing === 'new' ? 'New record' : 'Edit record'}</div><div className="grid gap-4 md:grid-cols-2">{editFields.map((spec) => <Field key={spec[0]} spec={spec} value={form[spec[0]]} onChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))} />)}</div><div className="mt-4 flex gap-2"><button onClick={save} disabled={loading} className="flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 text-xs font-black text-black disabled:opacity-50"><Save size={15} /> SAVE</button><button onClick={cancel} className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-xs font-bold text-gray-300"><X size={15} /> CANCEL</button></div></div>}
      {loading && !editing ? <div className="flex min-h-32 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400/20 border-t-emerald-400" /></div> : <div className="space-y-2">
        {section.liveStats ? filteredRows.map((row) => <LiveStatRow key={`${row.source}-${row.id}`} row={row} onEdit={startEdit} onDelete={remove} />) : filteredRows.map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/5 bg-black/25 p-3"><div><p className="font-bold text-white">{row[section.title] || row.id}</p><p className="text-xs text-gray-500">{row.status || row.category || row.game || row.id}</p></div><div className="flex items-center gap-2">{section.statusOnly ? <select value={row.status || 'pending'} onChange={(event) => updateStatus(row, event.target.value)} className="rounded border border-white/10 bg-black px-2 py-1 text-xs text-white"><option value="pending">pending</option><option value="reviewing">reviewing</option><option value="approved">approved</option><option value="rejected">rejected</option></select> : !section.readOnly && <button onClick={() => startEdit(row)} className="rounded border border-emerald-400/20 px-3 py-1.5 text-xs font-bold text-emerald-300">EDIT</button>}{!section.readOnly && <button onClick={() => remove(row.id)} className="rounded border border-red-400/20 p-2 text-red-300"><Trash2 size={14} /></button>}</div></div>)}
        {filteredRows.length === 0 && <p className="py-8 text-center text-sm text-gray-500">{section.liveStats && gameFilter !== 'all' ? `No ${gameFilter === 'dayz' ? 'DayZ' : '7 Days to Die'} player records found.` : 'No records yet.'}</p>}
      </div>}
    </div>
  </div>;
}
