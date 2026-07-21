import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const SECTIONS = {
  Server: {
    label: 'Servers',
    sort: '-sort_order',
    title: 'name',
    fields: [
      ['name', 'Server Name'], ['image', 'Image URL'], ['join_link', 'Joining Link'],
      ['api_link', 'API Link'], ['sort_order', 'Sort Order', 'number'],
    ],
  },
  Project: {
    label: 'Projects', sort: 'sort_order', title: 'title',
    fields: [
      ['title', 'Project Title'], ['status', 'Status', 'select', ['In Development', 'Live', 'Completed', 'On Hold']],
      ['game', 'Game'], ['thumbnail', 'Thumbnail URL'], ['screenshots', 'Screenshot URLs'],
      ['video_url', 'Video URL'], ['tags', 'Tags'], ['sort_order', 'Sort Order', 'number'],
      ['description', 'Description', 'textarea'],
    ],
  },
  Event: {
    label: 'Events', sort: 'date', title: 'title',
    fields: [
      ['title', 'Event Title'], ['game', 'Game'], ['date', 'Date & Time', 'datetime-local'],
      ['server_id', 'Linked Server ID'], ['discord_link', 'Discord Event Link'],
      ['banner_image', 'Banner Image URL'], ['description', 'Description', 'textarea'],
    ],
  },
  StoreItem: {
    label: 'Store Items', sort: '-sort_order', title: 'name',
    fields: [
      ['name', 'Item Name'], ['category', 'Category', 'select', ['Ranks', 'Cosmetics', 'Bundles', 'Merch', 'Other']],
      ['type', 'Type', 'select', ['digital', 'physical']], ['price_usd', 'Price (USD)', 'number'],
      ['token_price', 'Token Price', 'number'], ['badge', 'Badge'], ['image', 'Image URL'],
      ['available', 'Available', 'boolean'], ['sort_order', 'Sort Order', 'number'],
      ['description', 'Description', 'textarea'],
    ],
  },
  NewsPost: {
    label: 'News', sort: '-created_date', title: 'title',
    fields: [
      ['title', 'Title'], ['category', 'Category', 'select', ['Announcement', 'Update', 'Event', 'Community', 'Other']],
      ['thumbnail', 'Thumbnail URL'], ['summary', 'Short Summary'], ['content', 'Full Content', 'textarea'],
      ['published', 'Published', 'boolean'],
    ],
  },
  Changelog: {
    label: 'Changelog', sort: '-created_date', title: 'title',
    fields: [
      ['title', 'Title'], ['version', 'Version'], ['category', 'Category', 'select', ['Server Update', 'Mod Update', 'Bug Fix', 'New Feature', 'Announcement']],
      ['game', 'Game'], ['content', 'Content', 'textarea'], ['published', 'Published', 'boolean'],
    ],
  },
  PlayerStat: {
    label: 'Player Stats', title: 'player_name',
    fields: [
      ['player_name', 'Player Name'], ['server_id', 'Server ID'], ['game', 'Game'],
      ['kills', 'Kills', 'number'], ['deaths', 'Deaths', 'number'], ['playtime_hours', 'Playtime Hours', 'number'],
      ['score', 'Score', 'number'], ['badge', 'Badge'], ['avatar_url', 'Avatar URL'],
    ],
  },
  Order: { label: 'Orders', sort: '-created_date', title: 'id', readOnly: true },
  BanAppeal: { label: 'Ban Appeals', sort: '-created_date', title: 'player_name', statusOnly: true },
  Recruitment: { label: 'Recruitment', sort: '-created_date', title: 'name', statusOnly: true },
};

function emptyFor(section) {
  return Object.fromEntries((section.fields || []).map(([key, , type, options]) => [
    key,
    type === 'number' ? 0 : type === 'boolean' ? true : type === 'select' ? options?.[0] || '' : '',
  ]));
}

function Field({ spec, value, onChange }) {
  const [key, label, type = 'text', options = []] = spec;
  const common = 'w-full rounded-lg border border-emerald-400/20 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/60';

  return (
    <label className={type === 'textarea' ? 'md:col-span-2' : ''}>
      <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-emerald-300">{label}</span>
      {type === 'textarea' ? (
        <textarea rows={5} className={common} value={value ?? ''} onChange={(e) => onChange(key, e.target.value)} />
      ) : type === 'select' ? (
        <select className={common} value={value ?? ''} onChange={(e) => onChange(key, e.target.value)}>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : type === 'boolean' ? (
        <select className={common} value={String(value ?? true)} onChange={(e) => onChange(key, e.target.value === 'true')}>
          <option value="true">Yes</option><option value="false">No</option>
        </select>
      ) : (
        <input className={common} type={type} value={type === 'datetime-local' && value ? String(value).slice(0, 16) : value ?? ''}
          onChange={(e) => onChange(key, type === 'number' ? Number(e.target.value) : e.target.value)} />
      )}
    </label>
  );
}

export default function ContentManager() {
  const sectionKeys = Object.keys(SECTIONS);
  const [entity, setEntity] = useState(sectionKeys[0]);
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const section = SECTIONS[entity];

  const load = async () => {
    setLoading(true); setMessage('');
    try { setRows(await base44.entities[entity].list(section.sort)); }
    catch (error) { setMessage(error.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { setEditing(null); load(); }, [entity]);

  const startNew = () => { setEditing('new'); setForm(emptyFor(section)); };
  const startEdit = (row) => { setEditing(row.id); setForm({ ...row }); };
  const cancel = () => { setEditing(null); setForm({}); };

  const save = async () => {
    setLoading(true); setMessage('');
    try {
      const payload = { ...form };
      if (payload.date && !String(payload.date).endsWith('Z')) payload.date = new Date(payload.date).toISOString();
      if (editing === 'new') await base44.entities[entity].create(payload);
      else await base44.entities[entity].update(editing, payload);
      setMessage(editing === 'new' ? 'Created successfully.' : 'Updated successfully.');
      cancel(); await load();
    } catch (error) { setMessage(error.message); }
    finally { setLoading(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this item permanently?')) return;
    setLoading(true);
    try { await base44.entities[entity].delete(id); setMessage('Deleted successfully.'); await load(); }
    catch (error) { setMessage(error.message); }
    finally { setLoading(false); }
  };

  const updateStatus = async (row, status) => {
    setLoading(true);
    try { await base44.entities[entity].update(row.id, { status }); await load(); }
    catch (error) { setMessage(error.message); }
    finally { setLoading(false); }
  };

  const summary = useMemo(() => `${rows.length} ${section.label.toLowerCase()}`, [rows.length, section.label]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {sectionKeys.map((key) => (
          <button key={key} onClick={() => setEntity(key)} className={`rounded-lg border px-3 py-2 text-xs font-bold ${entity === key ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300' : 'border-white/10 text-gray-400'}`}>
            {SECTIONS[key].label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-emerald-400/15 bg-black/30 p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-lg font-black text-white">{section.label}</h2><p className="text-xs text-gray-500">{summary}</p></div>
          <div className="flex gap-2">
            <button onClick={load} className="rounded-lg border border-white/10 p-2 text-gray-400 hover:text-white"><RefreshCw size={16} /></button>
            {!section.readOnly && !section.statusOnly && <button onClick={startNew} className="flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300"><Plus size={15} /> NEW</button>}
          </div>
        </div>

        {message && <div className="mb-4 rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-200">{message}</div>}

        {editing && (
          <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              {section.fields.map((spec) => <Field key={spec[0]} spec={spec} value={form[spec[0]]} onChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))} />)}
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={save} disabled={loading} className="flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-xs font-bold text-emerald-300"><Save size={15} /> SAVE</button>
              <button onClick={cancel} className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-xs font-bold text-gray-400"><X size={15} /> CANCEL</button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-4">
              <div className="min-w-0">
                <div className="truncate font-bold text-white">{row[section.title] || row.title || row.name || row.id}</div>
                <div className="mt-1 text-xs text-gray-500">{row.status || row.category || row.game || row.email || row.discord_id || row.id}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {section.statusOnly && ['pending', 'approved', 'rejected'].map((status) => <button key={status} onClick={() => updateStatus(row, status)} className="rounded border border-white/10 px-2 py-1 text-xs text-gray-300">{status}</button>)}
                {!section.readOnly && !section.statusOnly && <button onClick={() => startEdit(row)} className="rounded border border-emerald-400/30 px-3 py-1.5 text-xs font-bold text-emerald-300">EDIT</button>}
                {!section.readOnly && <button onClick={() => remove(row.id)} className="rounded border border-red-400/25 p-2 text-red-300"><Trash2 size={14} /></button>}
              </div>
            </div>
          ))}
          {!loading && !rows.length && <div className="py-10 text-center text-sm text-gray-500">No records found.</div>}
          {loading && <div className="py-10 text-center text-sm text-emerald-300">Loading…</div>}
        </div>
      </div>
    </div>
  );
}
