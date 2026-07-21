import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, ShoppingBag, Plus, Edit2, Trash2, LogOut, Eye, EyeOff, Save, X, CheckCircle, CalendarDays, BarChart2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const ADMIN_PASSWORD = 'ApexOrder2007!';

// ── Tiny form field ──────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', options, placeholder }) {
  if (options) {
    return (
      <div>
        <label className="block text-xs font-bold tracking-wider mb-1" style={{ color: '#10FF8B' }}>{label}</label>
        <select
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded outline-none focus:ring-1"
          style={{ background: 'rgba(10,20,10,0.9)', border: '1px solid rgba(16,255,139,0.2)', color: '#e5e5e5', focusRing: '#10FF8B' }}
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }
  if (type === 'textarea') {
    return (
      <div>
        <label className="block text-xs font-bold tracking-wider mb-1" style={{ color: '#10FF8B' }}>{label}</label>
        <textarea
          rows={3}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm rounded outline-none focus:ring-1 resize-none"
          style={{ background: 'rgba(10,20,10,0.9)', border: '1px solid rgba(16,255,139,0.2)', color: '#e5e5e5' }}
        />
      </div>
    );
  }
  return (
    <div>
      <label className="block text-xs font-bold tracking-wider mb-1" style={{ color: '#10FF8B' }}>{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm rounded outline-none"
        style={{ background: 'rgba(10,20,10,0.9)', border: '1px solid rgba(16,255,139,0.2)', color: '#e5e5e5' }}
      />
    </div>
  );
}

// ── Server Form ──────────────────────────────────────────────
function ServerForm({ initial, onSave, onCancel }) {
  const [data, setData] = useState(initial || { name: '', image: '', join_link: '', api_link: '' });
  const set = (k) => (v) => setData(d => ({ ...d, [k]: v }));
  return (
    <div className="space-y-3">
      <Field label="Server Name" value={data.name} onChange={set('name')} placeholder="e.g. ApexOrder DayZ" />
      <Field label="Image URL" value={data.image} onChange={set('image')} placeholder="https://..." />
      <Field label="Joining Link" value={data.join_link} onChange={set('join_link')} placeholder="https://discord.gg/... or steam://connect/..." />
      <Field label="API Link" value={data.api_link} onChange={set('api_link')} placeholder="https://api.example.com/server/status" />
      <div className="flex gap-2 pt-2">
        <button onClick={() => onSave(data)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider rounded" style={{ background: 'rgba(16,255,139,0.15)', border: '1px solid #10FF8B', color: '#10FF8B' }}>
          <Save size={13} /> SAVE
        </button>
        <button onClick={onCancel} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider rounded" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#999' }}>
          <X size={13} /> CANCEL
        </button>
      </div>
    </div>
  );
}

// ── Event Form ───────────────────────────────────────────────
function EventForm({ initial, onSave, onCancel, servers }) {
  const [data, setData] = useState(initial || { title: '', description: '', date: '', game: '', server_id: '', discord_link: '' });
  const set = (k) => (v) => setData(d => ({ ...d, [k]: v }));
  const serverOptions = [{ value: '', label: '— None —' }, ...servers.map(s => ({ value: s.id, label: s.name }))];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Event Title" value={data.title} onChange={set('title')} />
        <Field label="Game" value={data.game} onChange={set('game')} placeholder="e.g. DayZ" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date & Time" value={data.date ? data.date.slice(0, 16) : ''} onChange={v => set('date')(new Date(v).toISOString())} type="datetime-local" />
        <div>
          <label className="block text-xs font-bold tracking-wider mb-1" style={{ color: '#10FF8B' }}>Linked Server</label>
          <select
            value={data.server_id ?? ''}
            onChange={e => set('server_id')(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded outline-none"
            style={{ background: 'rgba(10,20,10,0.9)', border: '1px solid rgba(16,255,139,0.2)', color: '#e5e5e5' }}
          >
            {serverOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <Field label="Discord Event Link" value={data.discord_link} onChange={set('discord_link')} placeholder="https://discord.gg/..." />
      <Field label="Banner Background Image URL" value={data.banner_image} onChange={set('banner_image')} placeholder="https://..." />
      <Field label="Description" value={data.description} onChange={set('description')} type="textarea" />
      <div className="flex gap-2 pt-2">
        <button onClick={() => onSave(data)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider rounded" style={{ background: 'rgba(16,255,139,0.15)', border: '1px solid #10FF8B', color: '#10FF8B' }}>
          <Save size={13} /> SAVE
        </button>
        <button onClick={onCancel} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider rounded" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#999' }}>
          <X size={13} /> CANCEL
        </button>
      </div>
    </div>
  );
}

// ── Project Form ─────────────────────────────────────────────
function ProjectForm({ initial, onSave, onCancel }) {
  const [data, setData] = useState(initial || {
    title: '', description: '', status: 'In Development', game: '',
    thumbnail: '', screenshots: '', video_url: '', tags: '', sort_order: 0
  });
  const set = (k) => (v) => setData(d => ({ ...d, [k]: v }));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Project Title" value={data.title} onChange={set('title')} />
        <Field label="Status" value={data.status} onChange={set('status')} options={['In Development','Live','Completed','On Hold']} />
        <Field label="Game" value={data.game} onChange={set('game')} placeholder="e.g. DayZ" />
        <Field label="Sort Order" value={data.sort_order} onChange={v => set('sort_order')(Number(v))} type="number" />
      </div>
      <Field label="Thumbnail Image URL" value={data.thumbnail} onChange={set('thumbnail')} placeholder="https://..." />
      <Field label="Screenshot URLs (comma-separated)" value={data.screenshots} onChange={set('screenshots')} placeholder="https://img1.jpg, https://img2.jpg" />
      <Field label="Video URL (YouTube or direct .mp4)" value={data.video_url} onChange={set('video_url')} placeholder="https://youtube.com/watch?v=..." />
      <Field label="Tags (comma-separated)" value={data.tags} onChange={set('tags')} placeholder="Custom Mods, PvP, DayZ" />
      <Field label="Description" value={data.description} onChange={set('description')} type="textarea" />
      <div className="flex gap-2 pt-2">
        <button onClick={() => onSave(data)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider rounded"
          style={{ background: 'rgba(16,255,139,0.15)', border: '1px solid #10FF8B', color: '#10FF8B' }}>
          <Save size={13} /> SAVE
        </button>
        <button onClick={onCancel} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider rounded"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#999' }}>
          <X size={13} /> CANCEL
        </button>
      </div>
    </div>
  );
}

// ── Store Item Form ───────────────────────────────────────────
function StoreItemForm({ initial, onSave, onCancel }) {
  const [data, setData] = useState(initial || {
    name: '', description: '', price_usd: 0, token_price: 0, category: 'Ranks',
    type: 'digital', image: '', badge: '', available: true, sort_order: 0
  });
  const set = (k) => (v) => setData(d => ({ ...d, [k]: v }));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Item Name" value={data.name} onChange={set('name')} />
        <Field label="Category" value={data.category} onChange={set('category')} options={['Ranks','Cosmetics','Bundles','Merch','Other']} />
        <Field label="Type" value={data.type} onChange={set('type')} options={['digital','physical']} />
        <Field label="Price (USD)" value={data.price_usd} onChange={v => set('price_usd')(Number(v))} type="number" />
        <Field label="Token Price" value={data.token_price} onChange={v => set('token_price')(Number(v))} type="number" />
        <Field label="Badge Label" value={data.badge} onChange={set('badge')} placeholder="e.g. POPULAR" />
        <Field label="Available" value={data.available ? 'true' : 'false'} onChange={v => set('available')(v === 'true')} options={['true','false']} />
        <Field label="Sort Order" value={data.sort_order} onChange={v => set('sort_order')(Number(v))} type="number" />
      </div>
      <Field label="Image URL" value={data.image} onChange={set('image')} placeholder="https://..." />
      <Field label="Description" value={data.description} onChange={set('description')} type="textarea" />
      <div className="flex gap-2 pt-2">
        <button onClick={() => onSave(data)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider rounded" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid #D4AF37', color: '#D4AF37' }}>
          <Save size={13} /> SAVE
        </button>
        <button onClick={onCancel} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider rounded" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#999' }}>
          <X size={13} /> CANCEL
        </button>
      </div>
    </div>
  );
}

// ── Player Stat Form ─────────────────────────────────────────
function PlayerStatForm({ initial, onSave, onCancel, servers }) {
  const [data, setData] = useState(initial || { player_name: '', server_id: '', game: '', kills: 0, deaths: 0, playtime_hours: 0, score: 0, badge: '', avatar_url: '' });
  const set = (k) => (v) => setData(d => ({ ...d, [k]: v }));
  const serverOptions = [{ value: '', label: '— Select Server —' }, ...servers.map(s => ({ value: s.id, label: s.name }))];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Player Name" value={data.player_name} onChange={set('player_name')} />
        <Field label="Game" value={data.game} onChange={set('game')} placeholder="e.g. DayZ" />
      </div>
      <div>
        <label className="block text-xs font-bold tracking-wider mb-1" style={{ color: '#10FF8B' }}>Linked Server</label>
        <select value={data.server_id ?? ''} onChange={e => set('server_id')(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded outline-none"
          style={{ background: 'rgba(10,20,10,0.9)', border: '1px solid rgba(16,255,139,0.2)', color: '#e5e5e5' }}>
          {serverOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Field label="Kills" value={data.kills} onChange={v => set('kills')(Number(v))} type="number" />
        <Field label="Deaths" value={data.deaths} onChange={v => set('deaths')(Number(v))} type="number" />
        <Field label="Playtime (hrs)" value={data.playtime_hours} onChange={v => set('playtime_hours')(Number(v))} type="number" />
        <Field label="Score" value={data.score} onChange={v => set('score')(Number(v))} type="number" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Badge" value={data.badge} onChange={set('badge')} placeholder="e.g. MVP" />
        <Field label="Avatar URL" value={data.avatar_url} onChange={set('avatar_url')} placeholder="https://..." />
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={() => onSave(data)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider rounded"
          style={{ background: 'rgba(16,255,139,0.15)', border: '1px solid #10FF8B', color: '#10FF8B' }}>
          <Save size={13} /> SAVE
        </button>
        <button onClick={onCancel} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider rounded"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#999' }}>
          <X size={13} /> CANCEL
        </button>
      </div>
    </div>
  );
}

// ── News Form ────────────────────────────────────────────────
function NewsForm({ initial, onSave, onCancel }) {
  const [data, setData] = useState(initial || { title: '', summary: '', content: '', category: 'Announcement', thumbnail: '', published: true });
  const set = (k) => (v) => setData(d => ({ ...d, [k]: v }));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Title" value={data.title} onChange={set('title')} />
        <Field label="Category" value={data.category} onChange={set('category')} options={['Announcement','Update','Event','Community','Other']} />
      </div>
      <Field label="Thumbnail URL" value={data.thumbnail} onChange={set('thumbnail')} placeholder="https://..." />
      <Field label="Short Summary" value={data.summary} onChange={set('summary')} placeholder="Brief description shown on the card" />
      <Field label="Full Content" value={data.content} onChange={set('content')} type="textarea" />
      <Field label="Published" value={data.published ? 'true' : 'false'} onChange={v => set('published')(v === 'true')} options={['true','false']} />
      <div className="flex gap-2 pt-2">
        <button onClick={() => onSave(data)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider rounded" style={{ background: 'rgba(16,255,139,0.15)', border: '1px solid #10FF8B', color: '#10FF8B' }}><Save size={13} /> SAVE</button>
        <button onClick={onCancel} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider rounded" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#999' }}><X size={13} /> CANCEL</button>
      </div>
    </div>
  );
}

// ── Changelog Form ────────────────────────────────────────────
function ChangelogForm({ initial, onSave, onCancel }) {
  const [data, setData] = useState(initial || { title: '', version: '', category: 'Server Update', game: '', content: '', published: true });
  const set = (k) => (v) => setData(d => ({ ...d, [k]: v }));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Title" value={data.title} onChange={set('title')} />
        <Field label="Category" value={data.category} onChange={set('category')} options={['Server Update','Mod Update','Bug Fix','New Feature','Announcement']} />
        <Field label="Version" value={data.version} onChange={set('version')} placeholder="e.g. v1.2.0" />
        <Field label="Game (optional)" value={data.game} onChange={set('game')} placeholder="e.g. DayZ" />
      </div>
      <Field label="Content" value={data.content} onChange={set('content')} type="textarea" />
      <Field label="Published" value={data.published ? 'true' : 'false'} onChange={v => set('published')(v === 'true')} options={['true','false']} />
      <div className="flex gap-2 pt-2">
        <button onClick={() => onSave(data)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider rounded" style={{ background: 'rgba(16,255,139,0.15)', border: '1px solid #10FF8B', color: '#10FF8B' }}><Save size={13} /> SAVE</button>
        <button onClick={onCancel} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider rounded" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#999' }}><X size={13} /> CANCEL</button>
      </div>
    </div>
  );
}

// ── Row card wrapper ─────────────────────────────────────────
function RowCard({ children, accentColor = '#10FF8B' }) {
  return (
    <div className="p-4 rounded" style={{ background: 'rgba(10,20,10,0.6)', border: `1px solid ${accentColor}22` }}>
      {children}
    </div>
  );
}

// ── Main Admin Page ──────────────────────────────────────────
export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [tab, setTab] = useState('servers');

  // Servers state
  const [servers, setServers] = useState([]);
  const [editingServer, setEditingServer] = useState(null); // id or 'new'
  const [serverLoading, setServerLoading] = useState(false);

  // Store state
  const [storeItems, setStoreItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [itemLoading, setItemLoading] = useState(false);

  // Events state
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventLoading, setEventLoading] = useState(false);

  // Player stats state
  const [playerStats, setPlayerStats] = useState([]);
  const [editingStat, setEditingStat] = useState(null);
  const [statLoading, setStatLoading] = useState(false);

  // Appeals state
  const [appeals, setAppeals] = useState([]);
  const [appealLoading, setAppealLoading] = useState(false);

  // Recruitment state
  const [applications, setApplications] = useState([]);
  const [appLoading, setAppLoading] = useState(false);

  // News state
  const [newsPosts, setNewsPosts] = useState([]);
  const [editingNews, setEditingNews] = useState(null);
  const [newsLoading, setNewsLoading] = useState(false);

  // Changelog state
  const [changelogEntries, setChangelogEntries] = useState([]);
  const [editingChangelog, setEditingChangelog] = useState(null);
  const [changelogLoading, setChangelogLoading] = useState(false);

  // Projects state
  const [projects, setProjects] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [projectLoading, setProjectLoading] = useState(false);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [orderLoading, setOrderLoading] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const login = () => {
    if (pw === ADMIN_PASSWORD) { setAuthed(true); setPwError(''); }
    else setPwError('Incorrect password.');
  };

  const loadServers = async () => {
    setServerLoading(true);
    const data = await base44.entities.Server.list('-sort_order');
    setServers(data);
    setServerLoading(false);
  };

  const loadItems = async () => {
    setItemLoading(true);
    const data = await base44.entities.StoreItem.list('-sort_order');
    setStoreItems(data);
    setItemLoading(false);
  };

  const loadEvents = async () => {
    setEventLoading(true);
    const data = await base44.entities.Event.list('date');
    setEvents(data);
    setEventLoading(false);
  };

  const loadStats = async () => {
    setStatLoading(true);
    const data = await base44.entities.PlayerStat.list();
    setPlayerStats(data);
    setStatLoading(false);
  };

  const loadProjects = async () => {
    setProjectLoading(true);
    const data = await base44.entities.Project.list('sort_order');
    setProjects(data);
    setProjectLoading(false);
  };

  const loadOrders = async () => {
    setOrderLoading(true);
    const data = await base44.entities.Order.list('-created_date');
    setOrders(data);
    setOrderLoading(false);
  };

  const loadAppeals = async () => { setAppealLoading(true); setAppeals(await base44.entities.BanAppeal.list('-created_date')); setAppealLoading(false); };
  const loadApplications = async () => { setAppLoading(true); setApplications(await base44.entities.Recruitment.list('-created_date')); setAppLoading(false); };
  const loadNews = async () => { setNewsLoading(true); setNewsPosts(await base44.entities.NewsPost.list('-created_date')); setNewsLoading(false); };
  const loadChangelog = async () => { setChangelogLoading(true); setChangelogEntries(await base44.entities.Changelog.list('-created_date')); setChangelogLoading(false); };

  useEffect(() => { if (authed) { loadServers(); loadItems(); loadEvents(); loadStats(); loadProjects(); loadOrders(); loadAppeals(); loadApplications(); loadNews(); loadChangelog(); } }, [authed]);

  const saveNews = async (data) => {
    if (editingNews === 'new') { await base44.entities.NewsPost.create(data); showToast('News post created!'); }
    else { await base44.entities.NewsPost.update(editingNews, data); showToast('News post updated!'); }
    setEditingNews(null); loadNews();
  };
  const deleteNews = async (id) => { if (!confirm('Delete this post?')) return; await base44.entities.NewsPost.delete(id); showToast('Post deleted.'); loadNews(); };

  const saveChangelog = async (data) => {
    if (editingChangelog === 'new') { await base44.entities.Changelog.create(data); showToast('Changelog entry created!'); }
    else { await base44.entities.Changelog.update(editingChangelog, data); showToast('Changelog updated!'); }
    setEditingChangelog(null); loadChangelog();
  };
  const deleteChangelog = async (id) => { if (!confirm('Delete this entry?')) return; await base44.entities.Changelog.delete(id); showToast('Entry deleted.'); loadChangelog(); };

  const updateAppealStatus = async (id, status) => { await base44.entities.BanAppeal.update(id, { status }); showToast(`Appeal marked ${status}`); loadAppeals(); };
  const updateAppStatus = async (id, status) => { await base44.entities.Recruitment.update(id, { status }); showToast(`Application marked ${status}`); loadApplications(); };

  const saveProject = async (data) => {
    if (editingProject === 'new') {
      await base44.entities.Project.create(data);
      showToast('Project created!');
    } else {
      await base44.entities.Project.update(editingProject, data);
      showToast('Project updated!');
    }
    setEditingProject(null);
    loadProjects();
  };

  const deleteProject = async (id) => {
    if (!confirm('Delete this project?')) return;
    await base44.entities.Project.delete(id);
    showToast('Project deleted.');
    loadProjects();
  };

  const saveEvent = async (data) => {
    if (editingEvent === 'new') {
      await base44.entities.Event.create(data);
      showToast('Event created!');
    } else {
      await base44.entities.Event.update(editingEvent, data);
      showToast('Event updated!');
    }
    setEditingEvent(null);
    loadEvents();
  };

  const deleteEvent = async (id) => {
    if (!confirm('Delete this event?')) return;
    await base44.entities.Event.delete(id);
    showToast('Event deleted.');
    loadEvents();
  };

  const saveStat = async (data) => {
    if (editingStat === 'new') {
      await base44.entities.PlayerStat.create(data);
      showToast('Player stat created!');
    } else {
      await base44.entities.PlayerStat.update(editingStat, data);
      showToast('Player stat updated!');
    }
    setEditingStat(null);
    loadStats();
  };

  const deleteStat = async (id) => {
    if (!confirm('Delete this player stat?')) return;
    await base44.entities.PlayerStat.delete(id);
    showToast('Stat deleted.');
    loadStats();
  };

  const saveServer = async (data) => {
    if (editingServer === 'new') {
      await base44.entities.Server.create(data);
      showToast('Server created!');
    } else {
      await base44.entities.Server.update(editingServer, data);
      showToast('Server updated!');
    }
    setEditingServer(null);
    loadServers();
  };

  const deleteServer = async (id) => {
    if (!confirm('Delete this server?')) return;
    await base44.entities.Server.delete(id);
    showToast('Server deleted.');
    loadServers();
  };

  const saveItem = async (data) => {
    if (editingItem === 'new') {
      await base44.entities.StoreItem.create(data);
      showToast('Item created!');
    } else {
      await base44.entities.StoreItem.update(editingItem, data);
      showToast('Item updated!');
    }
    setEditingItem(null);
    loadItems();
  };

  const deleteItem = async (id) => {
    if (!confirm('Delete this item?')) return;
    await base44.entities.StoreItem.delete(id);
    showToast('Item deleted.');
    loadItems();
  };

  const updateOrderStatus = async (id, status) => {
    await base44.entities.Order.update(id, { status });
    showToast(`Order marked ${status}`);
    loadOrders();
  };

  // ── Login screen ───────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#050a05' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="p-8 rounded" style={{ background: 'rgba(10,20,10,0.95)', border: '1px solid rgba(16,255,139,0.2)' }}>
            <a href="/" className="block text-xs text-gray-600 hover:text-gray-400 transition-colors mb-4">← Back</a>
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(16,255,139,0.08)', border: '1px solid rgba(16,255,139,0.25)' }}>
                <span className="text-2xl font-black" style={{ color: '#10FF8B' }}>A</span>
              </div>
              <h1 className="text-xl font-bold tracking-[0.2em]" style={{ color: '#10FF8B' }}>ADMIN PANEL</h1>
              <p className="text-gray-500 text-xs mt-1 tracking-wider">APEXORDER MANAGEMENT</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold tracking-wider mb-1" style={{ color: '#10FF8B' }}>PASSWORD</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={pw}
                    onChange={e => setPw(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && login()}
                    className="w-full px-3 py-2.5 pr-10 text-sm rounded outline-none"
                    style={{ background: 'rgba(5,12,5,0.8)', border: `1px solid ${pwError ? '#ff4444' : 'rgba(16,255,139,0.2)'}`, color: '#e5e5e5' }}
                    placeholder="Enter admin password"
                  />
                  <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {pwError && <p className="text-red-400 text-xs mt-1">{pwError}</p>}
              </div>
              <button
                onClick={login}
                className="w-full py-2.5 font-bold text-sm tracking-[0.2em] rounded transition-all"
                style={{ background: 'rgba(16,255,139,0.15)', border: '1px solid #10FF8B', color: '#10FF8B' }}
              >
                LOGIN
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Admin dashboard ────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: '#050a05' }}>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded text-sm font-bold"
            style={{ background: 'rgba(16,255,139,0.15)', border: '1px solid #10FF8B', color: '#10FF8B' }}>
            <CheckCircle size={14} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="border-b sticky top-0 z-40" style={{ background: 'rgba(5,10,5,0.97)', borderColor: 'rgba(16,255,139,0.12)' }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold tracking-[0.2em] text-sm" style={{ color: '#10FF8B' }}>APEX ADMIN</span>
            <span className="text-gray-600 text-xs">|</span>
            <div className="flex gap-1">
              {['servers', 'store', 'orders', 'events', 'stats', 'projects', 'news', 'changelog', 'appeals', 'recruit'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className="px-3 py-1.5 text-xs font-bold tracking-wider rounded transition-all"
                  style={tab === t
                    ? { background: 'rgba(16,255,139,0.12)', color: '#10FF8B', border: '1px solid rgba(16,255,139,0.3)' }
                    : { color: '#666', border: '1px solid transparent' }
                  }>
                  {t === 'servers' ? '⚡ SERVERS' : t === 'store' ? '🛒 STORE' : t === 'orders' ? '📦 ORDERS' : t === 'events' ? '📅 EVENTS' : t === 'stats' ? '📊 STATS' : t === 'projects' ? '🗂️ PROJECTS' : t === 'news' ? '📰 NEWS' : t === 'changelog' ? '📋 CHANGELOG' : t === 'appeals' ? '🛡️ APPEALS' : '👥 RECRUIT'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors">
              ← BACK
            </a>
            <button onClick={() => setAuthed(false)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors">
              <LogOut size={13} /> LOGOUT
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── SERVERS TAB ── */}
        {tab === 'servers' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold tracking-[0.15em]" style={{ color: '#10FF8B' }}>SERVERS ({servers.length})</h2>
              <button onClick={() => setEditingServer('new')} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider rounded" style={{ background: 'rgba(16,255,139,0.12)', border: '1px solid rgba(16,255,139,0.4)', color: '#10FF8B' }}>
                <Plus size={13} /> ADD SERVER
              </button>
            </div>

            {editingServer === 'new' && (
              <RowCard>
                <p className="text-xs font-bold tracking-wider mb-4" style={{ color: '#10FF8B' }}>NEW SERVER</p>
                <ServerForm onSave={saveServer} onCancel={() => setEditingServer(null)} />
              </RowCard>
            )}

            <div className="space-y-3 mt-3">
              {serverLoading ? (
                <p className="text-gray-500 text-sm text-center py-8">Loading...</p>
              ) : servers.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-12">No servers yet. Add one above.</p>
              ) : servers.map(s => (
                <RowCard key={s.id}>
                  {editingServer === s.id ? (
                    <>
                      <p className="text-xs font-bold tracking-wider mb-4" style={{ color: '#10FF8B' }}>EDITING: {s.name}</p>
                      <ServerForm initial={s} onSave={saveServer} onCancel={() => setEditingServer(null)} />
                    </>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {s.image && <img src={s.image} alt="" className="w-10 h-10 rounded object-cover" />}
                        <div>
                          <div className="font-bold text-sm text-white">{s.name}</div>
                          <div className="text-xs text-gray-500">{s.join_link || 'No join link'}{s.api_link ? ` · API: ${s.api_link}` : ''}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingServer(s.id)} className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => deleteServer(s.id)} className="p-1.5 rounded hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  )}
                </RowCard>
              ))}
            </div>
          </div>
        )}

        {/* ── EVENTS TAB ── */}
        {tab === 'events' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold tracking-[0.15em]" style={{ color: '#10FF8B' }}>EVENTS ({events.length})</h2>
              <button onClick={() => setEditingEvent('new')} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider rounded" style={{ background: 'rgba(16,255,139,0.12)', border: '1px solid rgba(16,255,139,0.4)', color: '#10FF8B' }}>
                <Plus size={13} /> ADD EVENT
              </button>
            </div>

            {editingEvent === 'new' && (
              <RowCard>
                <p className="text-xs font-bold tracking-wider mb-4" style={{ color: '#10FF8B' }}>NEW EVENT</p>
                <EventForm onSave={saveEvent} onCancel={() => setEditingEvent(null)} servers={servers} />
              </RowCard>
            )}

            <div className="space-y-3 mt-3">
              {eventLoading ? (
                <p className="text-gray-500 text-sm text-center py-8">Loading...</p>
              ) : events.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-12">No events yet. Add one above.</p>
              ) : events.map(ev => (
                <RowCard key={ev.id}>
                  {editingEvent === ev.id ? (
                    <>
                      <p className="text-xs font-bold tracking-wider mb-4" style={{ color: '#10FF8B' }}>EDITING: {ev.title}</p>
                      <EventForm initial={ev} onSave={saveEvent} onCancel={() => setEditingEvent(null)} servers={servers} />
                    </>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm text-white">{ev.title}</div>
                        <div className="text-xs text-gray-500">
                          {ev.date ? new Date(ev.date).toLocaleString() : 'No date'}{ev.game ? ` · ${ev.game}` : ''}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingEvent(ev.id)} className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => deleteEvent(ev.id)} className="p-1.5 rounded hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  )}
                </RowCard>
              ))}
            </div>
          </div>
        )}

        {/* ── STATS TAB ── */}
        {tab === 'stats' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold tracking-[0.15em]" style={{ color: '#10FF8B' }}>PLAYER STATS ({playerStats.length})</h2>
              <button onClick={() => setEditingStat('new')} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider rounded"
                style={{ background: 'rgba(16,255,139,0.12)', border: '1px solid rgba(16,255,139,0.4)', color: '#10FF8B' }}>
                <Plus size={13} /> ADD PLAYER
              </button>
            </div>

            {editingStat === 'new' && (
              <RowCard>
                <p className="text-xs font-bold tracking-wider mb-4" style={{ color: '#10FF8B' }}>NEW PLAYER STAT</p>
                <PlayerStatForm onSave={saveStat} onCancel={() => setEditingStat(null)} servers={servers} />
              </RowCard>
            )}

            <div className="space-y-3 mt-3">
              {statLoading ? (
                <p className="text-gray-500 text-sm text-center py-8">Loading...</p>
              ) : playerStats.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-12">No player stats yet. Add one above.</p>
              ) : playerStats.map(stat => {
                const linkedServer = servers.find(s => s.id === stat.server_id);
                return (
                  <RowCard key={stat.id}>
                    {editingStat === stat.id ? (
                      <>
                        <p className="text-xs font-bold tracking-wider mb-4" style={{ color: '#10FF8B' }}>EDITING: {stat.player_name}</p>
                        <PlayerStatForm initial={stat} onSave={saveStat} onCancel={() => setEditingStat(null)} servers={servers} />
                      </>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {stat.avatar_url && <img src={stat.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />}
                          <div>
                            <div className="font-bold text-sm text-white">{stat.player_name}</div>
                            <div className="text-xs text-gray-500">
                              {linkedServer?.name || stat.server_id} · {stat.game || '—'} · K: {stat.kills ?? 0} / D: {stat.deaths ?? 0} · Score: {stat.score ?? 0}
                              {stat.badge ? ` · ${stat.badge}` : ''}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingStat(stat.id)} className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><Edit2 size={14} /></button>
                          <button onClick={() => deleteStat(stat.id)} className="p-1.5 rounded hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    )}
                  </RowCard>
                );
              })}
            </div>
          </div>
        )}

        {/* ── PROJECTS TAB ── */}
        {tab === 'projects' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold tracking-[0.15em]" style={{ color: '#10FF8B' }}>PROJECTS ({projects.length})</h2>
              <button onClick={() => setEditingProject('new')} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider rounded"
                style={{ background: 'rgba(16,255,139,0.12)', border: '1px solid rgba(16,255,139,0.4)', color: '#10FF8B' }}>
                <Plus size={13} /> ADD PROJECT
              </button>
            </div>

            {editingProject === 'new' && (
              <RowCard>
                <p className="text-xs font-bold tracking-wider mb-4" style={{ color: '#10FF8B' }}>NEW PROJECT</p>
                <ProjectForm onSave={saveProject} onCancel={() => setEditingProject(null)} />
              </RowCard>
            )}

            <div className="space-y-3 mt-3">
              {projectLoading ? (
                <p className="text-gray-500 text-sm text-center py-8">Loading...</p>
              ) : projects.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-12">No projects yet. Add one above.</p>
              ) : projects.map(project => (
                <RowCard key={project.id}>
                  {editingProject === project.id ? (
                    <>
                      <p className="text-xs font-bold tracking-wider mb-4" style={{ color: '#10FF8B' }}>EDITING: {project.title}</p>
                      <ProjectForm initial={project} onSave={saveProject} onCancel={() => setEditingProject(null)} />
                    </>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {project.thumbnail && <img src={project.thumbnail} alt="" className="w-12 h-10 rounded object-cover shrink-0" />}
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-white">{project.title}</div>
                          <div className="text-xs text-gray-500">
                            {project.status}{project.game ? ` · ${project.game}` : ''}
                            {project.video_url ? ' · 🎬 video' : ''}
                            {project.screenshots ? ` · 📸 ${project.screenshots.split(',').filter(Boolean).length} screenshot(s)` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => setEditingProject(project.id)} className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => deleteProject(project.id)} className="p-1.5 rounded hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  )}
                </RowCard>
              ))}
            </div>
          </div>
        )}

        {/* ── STORE TAB ── */}
        {tab === 'store' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold tracking-[0.15em]" style={{ color: '#D4AF37' }}>STORE ITEMS ({storeItems.length})</h2>
              <button onClick={() => setEditingItem('new')} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider rounded" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37' }}>
                <Plus size={13} /> ADD ITEM
              </button>
            </div>

            {editingItem === 'new' && (
              <RowCard accentColor="#D4AF37">
                <p className="text-xs font-bold tracking-wider mb-4" style={{ color: '#D4AF37' }}>NEW ITEM</p>
                <StoreItemForm onSave={saveItem} onCancel={() => setEditingItem(null)} />
              </RowCard>
            )}

            <div className="space-y-3 mt-3">
              {itemLoading ? (
                <p className="text-gray-500 text-sm text-center py-8">Loading...</p>
              ) : storeItems.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-12">No store items yet. Add one above.</p>
              ) : storeItems.map(item => (
                <RowCard key={item.id} accentColor="#D4AF37">
                  {editingItem === item.id ? (
                    <>
                      <p className="text-xs font-bold tracking-wider mb-4" style={{ color: '#D4AF37' }}>EDITING: {item.name}</p>
                      <StoreItemForm initial={item} onSave={saveItem} onCancel={() => setEditingItem(null)} />
                    </>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {item.image && <img src={item.image} alt="" className="w-10 h-10 rounded object-cover" />}
                        <div>
                          <div className="font-bold text-sm text-white">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.category} · ${item.price_usd} · {item.type} · {item.available ? 'Available' : 'Hidden'}{item.badge ? ` · ${item.badge}` : ''}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingItem(item.id)} className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => deleteItem(item.id)} className="p-1.5 rounded hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  )}
                </RowCard>
              ))}
            </div>
          </div>
        )}

        {/* ── ORDERS TAB ── */}
        {tab === 'orders' && (
          <div>
            <h2 className="text-lg font-bold tracking-[0.15em] mb-6" style={{ color: '#D4AF37' }}>ORDERS ({orders.length})</h2>
            <div className="space-y-3">
              {orderLoading ? <p className="text-gray-500 text-sm text-center py-8">Loading...</p>
                : orders.length === 0 ? <p className="text-gray-600 text-sm text-center py-12">No orders yet.</p>
                : orders.map(order => {
                  const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
                  return (
                    <RowCard key={order.id} accentColor="#D4AF37">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-bold text-sm text-white">Order #{order.id.slice(-6)}</span>
                            <span className="text-xs font-mono px-2 py-0.5 rounded"
                              style={{ background: order.status === 'completed' ? 'rgba(16,255,139,0.1)' : order.status === 'cancelled' ? 'rgba(255,100,100,0.1)' : 'rgba(212,175,55,0.1)',
                                color: order.status === 'completed' ? '#10FF8B' : order.status === 'cancelled' ? '#ff6464' : '#D4AF37',
                                border: `1px solid ${order.status === 'completed' ? 'rgba(16,255,139,0.3)' : order.status === 'cancelled' ? 'rgba(255,100,100,0.3)' : 'rgba(212,175,55,0.3)'}` }}>
                              {order.status?.toUpperCase()}
                            </span>
                            <span className="text-xs font-mono" style={{ color: '#888' }}>{new Date(order.created_date).toLocaleDateString()}</span>
                          </div>
                          <div className="text-xs text-gray-500 mb-2">
                            ${order.total_usd?.toFixed(2)} · {items.length} item(s) · {order.type || 'digital'}
                          </div>
                          <div className="text-sm text-gray-300">
                            {items.map((i, idx) => (
                              <div key={idx}>{i.quantity}x {i.name} — ${(i.price_usd * i.quantity).toFixed(2)}</div>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 shrink-0">
                          {['pending','paid','processing','completed','refunded','cancelled'].map(s => (
                            <button key={s} onClick={() => updateOrderStatus(order.id, s)}
                              disabled={order.status === s}
                              className="px-2 py-1 text-xs font-mono rounded transition-all disabled:opacity-30"
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#888' }}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </RowCard>
                  );
                })}
            </div>
          </div>
        )}

        {/* ── NEWS TAB ── */}
        {tab === 'news' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold tracking-[0.15em]" style={{ color: '#10FF8B' }}>NEWS POSTS ({newsPosts.length})</h2>
              <button onClick={() => setEditingNews('new')} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider rounded"
                style={{ background: 'rgba(16,255,139,0.12)', border: '1px solid rgba(16,255,139,0.4)', color: '#10FF8B' }}>
                <Plus size={13} /> ADD POST
              </button>
            </div>
            {editingNews === 'new' && (
              <RowCard><p className="text-xs font-bold tracking-wider mb-4" style={{ color: '#10FF8B' }}>NEW POST</p>
                <NewsForm onSave={saveNews} onCancel={() => setEditingNews(null)} />
              </RowCard>
            )}
            <div className="space-y-3 mt-3">
              {newsLoading ? <p className="text-gray-500 text-sm text-center py-8">Loading...</p>
                : newsPosts.length === 0 ? <p className="text-gray-600 text-sm text-center py-12">No posts yet.</p>
                : newsPosts.map(post => (
                  <RowCard key={post.id}>
                    {editingNews === post.id ? (
                      <><p className="text-xs font-bold tracking-wider mb-4" style={{ color: '#10FF8B' }}>EDITING: {post.title}</p>
                        <NewsForm initial={post} onSave={saveNews} onCancel={() => setEditingNews(null)} /></>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div><div className="font-bold text-sm text-white">{post.title}</div>
                          <div className="text-xs text-gray-500">{post.category} · {post.published ? 'Published' : 'Draft'}</div></div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => setEditingNews(post.id)} className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><Edit2 size={14} /></button>
                          <button onClick={() => deleteNews(post.id)} className="p-1.5 rounded hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    )}
                  </RowCard>
                ))}
            </div>
          </div>
        )}

        {/* ── CHANGELOG TAB ── */}
        {tab === 'changelog' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold tracking-[0.15em]" style={{ color: '#10FF8B' }}>CHANGELOG ({changelogEntries.length})</h2>
              <button onClick={() => setEditingChangelog('new')} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider rounded"
                style={{ background: 'rgba(16,255,139,0.12)', border: '1px solid rgba(16,255,139,0.4)', color: '#10FF8B' }}>
                <Plus size={13} /> ADD ENTRY
              </button>
            </div>
            {editingChangelog === 'new' && (
              <RowCard><p className="text-xs font-bold tracking-wider mb-4" style={{ color: '#10FF8B' }}>NEW ENTRY</p>
                <ChangelogForm onSave={saveChangelog} onCancel={() => setEditingChangelog(null)} />
              </RowCard>
            )}
            <div className="space-y-3 mt-3">
              {changelogLoading ? <p className="text-gray-500 text-sm text-center py-8">Loading...</p>
                : changelogEntries.length === 0 ? <p className="text-gray-600 text-sm text-center py-12">No entries yet.</p>
                : changelogEntries.map(entry => (
                  <RowCard key={entry.id}>
                    {editingChangelog === entry.id ? (
                      <><p className="text-xs font-bold tracking-wider mb-4" style={{ color: '#10FF8B' }}>EDITING: {entry.title}</p>
                        <ChangelogForm initial={entry} onSave={saveChangelog} onCancel={() => setEditingChangelog(null)} /></>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div><div className="font-bold text-sm text-white">{entry.title}</div>
                          <div className="text-xs text-gray-500">{entry.category}{entry.version ? ` · ${entry.version}` : ''}{entry.game ? ` · ${entry.game}` : ''}</div></div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => setEditingChangelog(entry.id)} className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><Edit2 size={14} /></button>
                          <button onClick={() => deleteChangelog(entry.id)} className="p-1.5 rounded hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    )}
                  </RowCard>
                ))}
            </div>
          </div>
        )}

        {/* ── APPEALS TAB ── */}
        {tab === 'appeals' && (
          <div>
            <h2 className="text-lg font-bold tracking-[0.15em] mb-6" style={{ color: '#10FF8B' }}>BAN APPEALS ({appeals.length})</h2>
            <div className="space-y-3">
              {appealLoading ? <p className="text-gray-500 text-sm text-center py-8">Loading...</p>
                : appeals.length === 0 ? <p className="text-gray-600 text-sm text-center py-12">No appeals submitted yet.</p>
                : appeals.map(appeal => (
                  <RowCard key={appeal.id}>
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-white">{appeal.player_name}</span>
                          <span className="text-xs font-mono text-gray-500">{appeal.discord_tag}</span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded"
                            style={{ background: appeal.status === 'Approved' ? 'rgba(16,255,139,0.1)' : appeal.status === 'Denied' ? 'rgba(255,100,100,0.1)' : 'rgba(212,175,55,0.1)',
                              color: appeal.status === 'Approved' ? '#10FF8B' : appeal.status === 'Denied' ? '#ff6464' : '#D4AF37',
                              border: `1px solid ${appeal.status === 'Approved' ? 'rgba(16,255,139,0.3)' : appeal.status === 'Denied' ? 'rgba(255,100,100,0.3)' : 'rgba(212,175,55,0.3)'}` }}>
                            {appeal.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">{appeal.game}{appeal.server ? ` · ${appeal.server}` : ''}{appeal.ban_reason ? ` · Reason: ${appeal.ban_reason}` : ''}</div>
                        <p className="text-sm text-gray-300 leading-relaxed">{appeal.appeal_text}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        {['Pending','Under Review','Approved','Denied'].map(s => (
                          <button key={s} onClick={() => updateAppealStatus(appeal.id, s)}
                            disabled={appeal.status === s}
                            className="px-2 py-1 text-xs font-mono rounded transition-all disabled:opacity-30"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#888' }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </RowCard>
                ))}
            </div>
          </div>
        )}

        {/* ── RECRUITMENT TAB ── */}
        {tab === 'recruit' && (
          <div>
            <h2 className="text-lg font-bold tracking-[0.15em] mb-6" style={{ color: '#10FF8B' }}>APPLICATIONS ({applications.length})</h2>
            <div className="space-y-3">
              {appLoading ? <p className="text-gray-500 text-sm text-center py-8">Loading...</p>
                : applications.length === 0 ? <p className="text-gray-600 text-sm text-center py-12">No applications submitted yet.</p>
                : applications.map(app => (
                  <RowCard key={app.id}>
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-white">{app.player_name}</span>
                          <span className="text-xs font-mono text-gray-500">{app.discord_tag}</span>
                          <span className="text-xs font-mono" style={{ color: '#D4AF37' }}>{app.role_applying}</span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded"
                            style={{ background: app.status === 'Accepted' ? 'rgba(16,255,139,0.1)' : app.status === 'Declined' ? 'rgba(255,100,100,0.1)' : 'rgba(212,175,55,0.1)',
                              color: app.status === 'Accepted' ? '#10FF8B' : app.status === 'Declined' ? '#ff6464' : '#D4AF37',
                              border: `1px solid ${app.status === 'Accepted' ? 'rgba(16,255,139,0.3)' : app.status === 'Declined' ? 'rgba(255,100,100,0.3)' : 'rgba(212,175,55,0.3)'}` }}>
                            {app.status}
                          </span>
                        </div>
                        {app.age && <div className="text-xs text-gray-500 mb-1">Age: {app.age}{app.availability ? ` · Availability: ${app.availability}` : ''}</div>}
                        <p className="text-sm text-gray-300 leading-relaxed">{app.why_join}</p>
                        {app.experience && <p className="text-xs text-gray-500 mt-1">Experience: {app.experience}</p>}
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        {['Pending','Shortlisted','Accepted','Declined'].map(s => (
                          <button key={s} onClick={() => updateAppStatus(app.id, s)}
                            disabled={app.status === s}
                            className="px-2 py-1 text-xs font-mono rounded transition-all disabled:opacity-30"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#888' }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </RowCard>
                ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}