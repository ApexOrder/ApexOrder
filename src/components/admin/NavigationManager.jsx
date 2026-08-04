import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { createCmsEntity, deleteCmsEntity, listCmsEntities, updateCmsEntity } from '@/api/cmsApi';

const SECTIONS = [
  { id: 'NavigationItem', label: 'Menu Builder', description: 'Control the links and dropdowns shown in the website header.' },
  { id: 'PageContent', label: 'Custom Pages', description: 'Create a new page, then optionally add it to the menu.' },
  { id: 'RuleCategory', label: 'Rule Sections', description: 'Manage the sections used by the existing Rules page.' },
  { id: 'RuleItem', label: 'Rules', description: 'Add and edit individual community, server or appeal rules.' },
];

const DEFAULT_NAV = [
  { label: 'HOME', path: '/', children: [] },
  { label: 'SERVERS', path: '/servers', children: [['Events', '/events']] },
  { label: 'PLAYERS', path: '/players', children: [] },
  { label: 'COMMUNITY', path: '/community', children: [['Stats', '/stats'], ['Rules', '/rules'], ['Ban Appeal', '/ban-appeal'], ['Recruitment', '/recruitment']] },
  { label: 'NEWS', path: '/news', children: [['Changelog', '/changelog']] },
  { label: 'PROJECTS', path: '/projects', children: [] },
  { label: 'STORE', path: '/store', children: [] },
  { label: 'ADMIN', path: '/admin', children: [] },
];

const inputClass = 'w-full rounded-lg border border-emerald-400/20 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/60';

function slugify(value) {
  return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function Label({ title, help, children, wide = false }) {
  return <label className={wide ? 'md:col-span-2' : ''}>
    <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-emerald-300">{title}</span>
    {children}
    {help && <span className="mt-1 block text-xs text-gray-500">{help}</span>}
  </label>;
}

function Toggle({ label, value, onChange, help }) {
  return <label className="flex items-center justify-between gap-4 rounded-lg border border-white/10 px-4 py-3">
    <span><span className="block text-xs font-bold uppercase tracking-wider text-emerald-300">{label}</span>{help && <span className="mt-1 block text-xs text-gray-500">{help}</span>}</span>
    <input type="checkbox" checked={value !== false} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4" />
  </label>;
}

function newForm(type) {
  if (type === 'NavigationItem') return { label: '', path: '', parent_id: '', sort_order: 10, visible: true, external: false };
  if (type === 'PageContent') return { slug: '', title: '', subtitle: '', summary: '', content: '', published: true, add_to_navigation: false, navigation_parent_id: '' };
  if (type === 'RuleCategory') return { label: '', slug: '', description: '', sort_order: 10, visible: true };
  return { category_slug: 'community', server_id: '', title: '', description: '', sort_order: 10, visible: true };
}

export default function NavigationManager() {
  const [type, setType] = useState('NavigationItem');
  const [rows, setRows] = useState([]);
  const [navigationRows, setNavigationRows] = useState([]);
  const [categoryRows, setCategoryRows] = useState([]);
  const [servers, setServers] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const section = SECTIONS.find((item) => item.id === type);
  const topLevelNavigation = useMemo(() => navigationRows.filter((row) => !row.parent_id), [navigationRows]);
  const parentNames = useMemo(() => new Map(navigationRows.map((row) => [row.id, row.label])), [navigationRows]);

  async function load() {
    setLoading(true);
    setMessage('');
    try {
      const [currentRows, nav, categories, serverRows] = await Promise.all([
        listCmsEntities(type, 'sort_order'),
        listCmsEntities('NavigationItem', 'sort_order'),
        listCmsEntities('RuleCategory', 'sort_order'),
        listCmsEntities('Server', 'sort_order'),
      ]);
      setRows(currentRows);
      setNavigationRows(nav);
      setCategoryRows(categories);
      setServers(serverRows.filter((server) => server.id !== 'coming-soon'));
    } catch (error) {
      setMessage(error.message || 'Unable to load records.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { setForm(null); void load(); }, [type]);

  function validate() {
    if (type === 'NavigationItem' && (!form.label.trim() || !form.path.trim())) return 'Enter both a menu label and destination.';
    if (type === 'PageContent' && (!form.title.trim() || !slugify(form.slug || form.title))) return 'Enter a page title.';
    if (type === 'RuleCategory' && (!form.label.trim() || !slugify(form.slug || form.label))) return 'Enter a section name.';
    if (type === 'RuleItem' && (!form.category_slug || !form.description.trim())) return 'Choose a rule section and enter the rule text.';
    if (type === 'RuleItem' && form.category_slug === 'servers' && !form.server_id) return 'Choose which server this rule belongs to.';
    return '';
  }

  async function save() {
    const validationError = validate();
    if (validationError) { setMessage(validationError); return; }
    setLoading(true);
    setMessage('');
    try {
      const payload = { ...form };
      delete payload.add_to_navigation;
      delete payload.navigation_parent_id;
      if (type === 'PageContent') payload.slug = slugify(payload.slug || payload.title);
      if (type === 'RuleCategory') payload.slug = slugify(payload.slug || payload.label);
      if (type === 'RuleItem' && payload.category_slug !== 'servers') payload.server_id = '';

      let saved;
      if (form.id) saved = await updateCmsEntity(type, form.id, payload);
      else saved = await createCmsEntity(type, payload);

      if (type === 'PageContent' && !form.id && form.add_to_navigation) {
        await createCmsEntity('NavigationItem', {
          label: form.title.toUpperCase(),
          path: `/page/${payload.slug}`,
          parent_id: form.navigation_parent_id || '',
          sort_order: 10,
          visible: true,
          external: false,
        });
      }

      setForm(null);
      setMessage(`${saved?.title || saved?.label || 'Record'} saved successfully.`);
      await load();
    } catch (error) {
      setMessage(error.message || 'Unable to save.');
      setLoading(false);
    }
  }

  async function remove(row) {
    const name = row.label || row.title || row.slug || row.id;
    if (!window.confirm(`Delete “${name}”? This cannot be undone.`)) return;
    try {
      await deleteCmsEntity(type, row.id);
      setMessage(`${name} deleted.`);
      await load();
    } catch (error) {
      setMessage(error.message || 'Unable to delete.');
    }
  }

  async function importDefaults() {
    setLoading(true);
    setMessage('');
    try {
      const existing = await listCmsEntities('NavigationItem', 'sort_order');
      const working = [...existing];
      let added = 0;

      for (let index = 0; index < DEFAULT_NAV.length; index += 1) {
        const item = DEFAULT_NAV[index];
        let parent = working.find((row) => !row.parent_id && row.path === item.path);

        if (!parent) {
          parent = await createCmsEntity('NavigationItem', {
            label: item.label,
            path: item.path,
            parent_id: '',
            sort_order: (index + 1) * 10,
            visible: true,
            external: false,
          });
          working.push(parent);
          added += 1;
        }

        for (let childIndex = 0; childIndex < item.children.length; childIndex += 1) {
          const [label, path] = item.children[childIndex];
          if (working.some((row) => row.path === path)) continue;

          const child = await createCmsEntity('NavigationItem', {
            label,
            path,
            parent_id: parent.id,
            sort_order: childIndex + 1,
            visible: true,
            external: false,
          });
          working.push(child);
          added += 1;
        }
      }

      setMessage(added
        ? `${added} missing default menu item${added === 1 ? '' : 's'} added. Your existing links were left unchanged.`
        : 'All default menu items are already present. Nothing was changed.');
      await load();
    } catch (error) {
      setMessage(error.message || 'Unable to restore default navigation.');
      setLoading(false);
    }
  }

  function renderForm() {
    if (!form) return null;
    return <div className="rounded-xl border border-emerald-400/20 bg-black/30 p-5">
      <div className="mb-5"><h3 className="font-bold text-white">{form.id ? 'EDIT' : 'CREATE'} {section.label.toUpperCase()}</h3><p className="mt-1 text-xs text-gray-500">Required fields are explained below. You never need to copy database IDs manually.</p></div>
      <div className="grid gap-4 md:grid-cols-2">
        {type === 'NavigationItem' && <>
          <Label title="Menu text" help="What visitors will see, for example RULES."><input className={inputClass} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></Label>
          <Label title="Destination" help="Choose a site path such as /rules, or paste a full external URL."><input className={inputClass} placeholder="/rules" value={form.path} onChange={(e) => setForm({ ...form, path: e.target.value })} /></Label>
          <Label title="Put inside dropdown" help="Leave as Top-level menu item unless this belongs beneath another menu."><select className={inputClass} value={form.parent_id || ''} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}><option value="">Top-level menu item</option>{topLevelNavigation.filter((item) => item.id !== form.id).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Label>
          <Label title="Position" help="Lower numbers appear first."><input className={inputClass} type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></Label>
          <Toggle label="Visible" value={form.visible} onChange={(value) => setForm({ ...form, visible: value })} help="Turn off to hide without deleting." />
          <Toggle label="External link" value={form.external} onChange={(value) => setForm({ ...form, external: value })} help="Opens in a new browser tab." />
        </>}

        {type === 'PageContent' && <>
          <Label title="Page title" help="The main heading shown on the page."><input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.id ? form.slug : slugify(e.target.value) })} /></Label>
          <Label title="Page address" help={`This page will be available at /page/${slugify(form.slug || form.title) || 'your-page'}.`}><div className="flex"><span className="rounded-l-lg border border-r-0 border-emerald-400/20 bg-white/5 px-3 py-2.5 text-sm text-gray-500">/page/</span><input className={`${inputClass} rounded-l-none`} value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} /></div></Label>
          <Label title="Small label" help="Optional text shown above the title."><input className={inputClass} placeholder="APEXORDER GUIDE" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></Label>
          <Toggle label="Published" value={form.published} onChange={(value) => setForm({ ...form, published: value })} help="Unpublished pages are hidden from visitors." />
          <Label title="Introduction" help="A short opening paragraph." wide><textarea rows={3} className={inputClass} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></Label>
          <Label title="Page content" help="The main body of the page. Line breaks are preserved." wide><textarea rows={10} className={inputClass} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></Label>
          {!form.id && <><Toggle label="Add this page to the website menu" value={form.add_to_navigation} onChange={(value) => setForm({ ...form, add_to_navigation: value })} help="Creates the menu link automatically when you save." />{form.add_to_navigation && <Label title="Menu location" help="Choose a dropdown, or leave it as a main menu item."><select className={inputClass} value={form.navigation_parent_id || ''} onChange={(e) => setForm({ ...form, navigation_parent_id: e.target.value })}><option value="">Top-level menu</option>{topLevelNavigation.map((item) => <option key={item.id} value={item.id}>Inside {item.label}</option>)}</select></Label>}</>}
        </>}

        {type === 'RuleCategory' && <>
          <Label title="Section name" help="For example COMMUNITY RULES."><input className={inputClass} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value, slug: form.id ? form.slug : slugify(e.target.value) })} /></Label>
          <Label title="Section type" help="Use the built-in values to keep the existing Rules page layout working."><select className={inputClass} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}><option value="">Choose a section</option><option value="community">Community Rules</option><option value="servers">Server Rules</option><option value="appeal">Ban Appeal Notes</option></select></Label>
          <Label title="Description" wide><textarea rows={3} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Label>
          <Label title="Position"><input className={inputClass} type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></Label>
          <Toggle label="Visible" value={form.visible} onChange={(value) => setForm({ ...form, visible: value })} />
        </>}

        {type === 'RuleItem' && <>
          <Label title="Where does this rule appear?" help="This controls the existing Rules page section."><select className={inputClass} value={form.category_slug} onChange={(e) => setForm({ ...form, category_slug: e.target.value, server_id: e.target.value === 'servers' ? form.server_id : '' })}><option value="community">Community Rules</option><option value="servers">Server Rules</option><option value="appeal">Ban Appeal Important Notes</option>{categoryRows.filter((item) => !['community', 'servers', 'appeal'].includes(item.slug)).map((item) => <option key={item.id} value={item.slug}>{item.label}</option>)}</select></Label>
          {form.category_slug === 'servers' && <Label title="Server" help="Choose the server rather than entering an ID."><select className={inputClass} value={form.server_id} onChange={(e) => setForm({ ...form, server_id: e.target.value })}><option value="">Choose a server</option>{servers.map((server) => <option key={server.id} value={server.id}>{server.name}</option>)}</select></Label>}
          <Label title="Rule title" help="Used as the heading for community rules; optional for server and appeal notes."><input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Label>
          <Label title="Position" help="Lower numbers appear first."><input className={inputClass} type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></Label>
          <Label title="Rule text" wide><textarea rows={5} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Label>
          <Toggle label="Visible" value={form.visible} onChange={(value) => setForm({ ...form, visible: value })} help="Hide this rule without deleting it." />
        </>}
      </div>
      <div className="mt-5 flex gap-2"><button onClick={save} disabled={loading} className="flex items-center gap-2 rounded border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300"><Save size={15}/> SAVE</button><button onClick={() => setForm(null)} className="rounded border border-white/10 px-4 py-2 text-sm text-gray-400">CANCEL</button></div>
    </div>;
  }

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black text-white">WEBSITE CONTENT</h2><p className="mt-1 text-sm text-gray-500">Edit the menu, create pages and manage rules without touching code.</p></div><button onClick={load} className="rounded border border-white/10 p-2 text-gray-400"><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/></button></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{SECTIONS.map((item) => <button key={item.id} onClick={() => setType(item.id)} className={`rounded-xl border p-4 text-left ${type === item.id ? 'border-emerald-400/40 bg-emerald-400/10' : 'border-white/10 bg-black/20'}`}><div className={type === item.id ? 'font-bold text-emerald-300' : 'font-bold text-white'}>{item.label}</div><div className="mt-1 text-xs text-gray-500">{item.description}</div></button>)}</div>
    {message && <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-200">{message}</div>}
    {renderForm()}
    {!form && <div className="flex flex-wrap gap-2"><button onClick={() => setForm(newForm(type))} className="flex items-center gap-2 rounded border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300"><Plus size={15}/> ADD {section.label.toUpperCase()}</button>{type === 'NavigationItem' && <button onClick={importDefaults} className="rounded border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-bold text-gold">RESTORE MISSING DEFAULT MENU ITEMS</button>}</div>}
    <div className="space-y-2">{rows.map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/7 bg-black/25 p-4"><div><div className="font-bold text-white">{row.label || row.title || row.slug || row.id}</div><div className="mt-1 text-xs text-gray-500">{type === 'NavigationItem' ? `${row.path || 'No destination'}${row.parent_id ? ` · inside ${parentNames.get(row.parent_id) || 'dropdown'}` : ' · top-level'}` : type === 'PageContent' ? `/page/${row.slug}${row.published === false ? ' · unpublished' : ''}` : type === 'RuleItem' ? `${row.category_slug}${row.server_id ? ` · ${servers.find((server) => server.id === row.server_id)?.name || row.server_id}` : ''}` : row.slug}</div></div><div className="flex gap-2">{type === 'PageContent' && row.published !== false && <a href={`/page/${row.slug}`} target="_blank" rel="noreferrer" className="rounded border border-white/10 p-2 text-gray-400"><ExternalLink size={14}/></a>}<button onClick={() => setForm({ ...row })} className="rounded border border-emerald-400/20 px-3 py-1.5 text-xs font-bold text-emerald-300">EDIT</button><button onClick={() => remove(row)} className="rounded border border-red-400/20 p-2 text-red-300"><Trash2 size={14}/></button></div></div>)}{!rows.length && !loading && <div className="rounded-lg border border-dashed border-white/10 py-10 text-center text-sm text-gray-500">Nothing here yet. Use the button above to add your first item.</div>}</div>
  </div>;
}
