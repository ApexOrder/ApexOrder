import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const TYPES = {
  NavigationItem: {
    label: 'Navigation',
    title: 'label',
    fields: [['label','Label'],['path','Path or URL'],['parent_id','Parent navigation ID'],['sort_order','Sort order','number'],['visible','Visible','boolean'],['external','Open externally','boolean']],
  },
  PageContent: {
    label: 'Pages',
    title: 'title',
    fields: [['slug','Slug'],['title','Page title'],['subtitle','Subtitle'],['summary','Intro text','textarea'],['content','Page content','textarea'],['published','Published','boolean']],
  },
  RuleCategory: {
    label: 'Rule Categories',
    title: 'label',
    fields: [['label','Category label'],['slug','Category slug'],['description','Description','textarea'],['sort_order','Sort order','number'],['visible','Visible','boolean']],
  },
  RuleItem: {
    label: 'Rules',
    title: 'title',
    fields: [['category_slug','Category slug'],['server_id','Server ID (optional)'],['title','Rule title'],['description','Rule text','textarea'],['sort_order','Sort order','number'],['visible','Visible','boolean']],
  },
};

function empty(fields) {
  return Object.fromEntries(fields.map(([key,,type]) => [key, type === 'number' ? 0 : type === 'boolean' ? true : '']));
}

function Field({ spec, value, onChange }) {
  const [key,label,type='text'] = spec;
  const cls = 'w-full rounded-lg border border-emerald-400/20 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/60';
  if (type === 'boolean') return <label className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-emerald-300"><span>{label}</span><input type="checkbox" checked={value !== false} onChange={(e) => onChange(key,e.target.checked)} /></label>;
  return <label className={type === 'textarea' ? 'md:col-span-2' : ''}><span className="mb-1 block text-xs font-bold uppercase tracking-wider text-emerald-300">{label}</span>{type === 'textarea' ? <textarea rows={6} className={cls} value={value ?? ''} onChange={(e) => onChange(key,e.target.value)} /> : <input className={cls} type={type} value={value ?? ''} onChange={(e) => onChange(key,type === 'number' ? Number(e.target.value) : e.target.value)} />}</label>;
}

export default function NavigationManager() {
  const [type,setType] = useState('NavigationItem');
  const [rows,setRows] = useState([]);
  const [form,setForm] = useState(null);
  const [loading,setLoading] = useState(false);
  const [message,setMessage] = useState('');
  const config = TYPES[type];

  async function load() {
    setLoading(true); setMessage('');
    try { setRows(await base44.entities[type].list('sort_order')); }
    catch (error) { setMessage(error.message || 'Unable to load records.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { setForm(null); void load(); }, [type]);

  async function save() {
    setLoading(true); setMessage('');
    try {
      const payload = { ...form };
      if (form.id) await base44.entities[type].update(form.id,payload);
      else await base44.entities[type].create(payload);
      setForm(null); await load();
    } catch (error) { setMessage(error.message || 'Unable to save.'); setLoading(false); }
  }
  async function remove(row) {
    if (!window.confirm(`Delete ${row[config.title] || row.id}?`)) return;
    try { await base44.entities[type].delete(row.id); await load(); }
    catch (error) { setMessage(error.message || 'Unable to delete.'); }
  }

  const parentNames = useMemo(() => new Map(rows.map((row) => [row.id,row.label])), [rows]);
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black text-white">NAVIGATION & PAGE CMS</h2><p className="mt-1 text-sm text-gray-500">Manage menu links, dropdowns, custom pages and every rule category.</p></div><button onClick={load} className="rounded border border-white/10 p-2 text-gray-400"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button></div>
    <div className="flex flex-wrap gap-2">{Object.entries(TYPES).map(([id,item]) => <button key={id} onClick={() => setType(id)} className={`rounded-lg border px-3 py-2 text-xs font-bold ${type === id ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-white/10 text-gray-400'}`}>{item.label}</button>)}</div>
    {message && <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-200">{message}</div>}
    {form && <div className="rounded-xl border border-emerald-400/20 bg-black/30 p-5"><div className="grid gap-4 md:grid-cols-2">{config.fields.map((spec) => <Field key={spec[0]} spec={spec} value={form[spec[0]]} onChange={(key,value) => setForm((old) => ({...old,[key]:value}))} />)}</div><div className="mt-4 flex gap-2"><button onClick={save} disabled={loading} className="flex items-center gap-2 rounded border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300"><Save size={15} /> SAVE</button><button onClick={() => setForm(null)} className="rounded border border-white/10 px-4 py-2 text-sm text-gray-400">CANCEL</button></div></div>}
    {!form && <button onClick={() => setForm(empty(config.fields))} className="flex items-center gap-2 rounded border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300"><Plus size={15} /> ADD {config.label.toUpperCase()}</button>}
    <div className="space-y-2">{rows.map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/7 bg-black/25 p-4"><div><div className="font-bold text-white">{row[config.title] || row.slug || row.id}</div><div className="mt-1 text-xs text-gray-500">{type === 'NavigationItem' ? `${row.path || 'No path'}${row.parent_id ? ` · under ${parentNames.get(row.parent_id) || row.parent_id}` : ''}` : row.slug || row.category_slug || row.id}</div></div><div className="flex gap-2"><button onClick={() => setForm({...row})} className="rounded border border-emerald-400/20 px-3 py-1.5 text-xs font-bold text-emerald-300">EDIT</button><button onClick={() => remove(row)} className="rounded border border-red-400/20 p-2 text-red-300"><Trash2 size={14} /></button></div></div>)}{!rows.length && !loading && <div className="rounded-lg border border-dashed border-white/10 py-10 text-center text-sm text-gray-500">No records yet.</div>}</div>
  </div>;
}
