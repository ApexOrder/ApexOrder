import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, RefreshCw, ShieldCheck, Activity, Settings, Database, LayoutDashboard, ExternalLink } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import ContentManager from '@/components/admin/ContentManager';

const siteLinks = [
  ['Home', '/'],
  ['Servers', '/servers'],
  ['Community', '/community'],
  ['News', '/news'],
  ['Projects', '/projects'],
  ['Store', '/store'],
];

async function api(path) {
  const response = await fetch(path, { credentials: 'include' });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || `Request failed: ${response.status}`);
  return data;
}

function Card({ children }) {
  return <div className="rounded-xl border border-emerald-400/15 bg-black/30 p-5">{children}</div>;
}

export default function Admin() {
  const { admin, isLoading, logoutAdmin } = useAuth();
  const [tab, setTab] = useState('content');
  const [audit, setAudit] = useState([]);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const [nextAudit, nextSettings] = await Promise.all([
        api('/api/admin/audit?limit=100'),
        api('/api/admin/settings'),
      ]);
      setAudit(nextAudit);
      setSettings(nextSettings);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (admin) load();
  }, [admin]);

  const counts = useMemo(() => audit.reduce((result, item) => {
    result[item.action] = (result[item.action] || 0) + 1;
    return result;
  }, {}), [audit]);

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center bg-[#050a05] text-emerald-300">Loading secure admin…</div>;
  }

  if (!admin) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#050a05] px-4">
        <Card>
          <div className="max-w-md text-center">
            <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
            <h1 className="text-xl font-bold text-white">Cloudflare Access required</h1>
            <p className="mt-2 text-sm text-gray-400">This area is reserved for the ApexOrder owner account.</p>
            <button onClick={() => { window.location.href = '/admin'; }} className="mt-5 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-5 py-2 text-sm font-bold text-emerald-300">Retry authentication</button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050a05] text-white">
      <header className="sticky top-0 z-20 border-b border-emerald-400/10 bg-[#050a05]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <div className="text-sm font-black tracking-[0.22em] text-emerald-400">APEX ADMIN</div>
            <div className="mt-1 text-xs text-gray-500">Cloudflare verified · {admin.email}</div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-400/15">
              <ExternalLink size={15} /> VIEW SITE
            </Link>
            <button onClick={load} className="rounded-lg border border-white/10 p-2 text-gray-400 hover:text-white" title="Refresh"><RefreshCw size={17} /></button>
            <button onClick={logoutAdmin} className="flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs font-bold text-red-300"><LogOut size={15} /> SIGN OUT</button>
          </div>
        </div>

        <div className="border-t border-white/5">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-600">Website</span>
            {siteLinks.map(([label, path]) => (
              <Link key={path} to={path} className="text-xs font-bold uppercase tracking-wider text-gray-400 transition-colors hover:text-emerald-300">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <nav className="mb-6 flex flex-wrap gap-2">
          {[
            ['content', LayoutDashboard, 'Content Manager'],
            ['overview', Activity, 'Overview'],
            ['audit', Database, 'Audit Log'],
            ['settings', Settings, 'Settings'],
          ].map(([id, Icon, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold ${tab === id ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-white/10 text-gray-400'}`}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>

        {error && <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

        {tab === 'content' && <ContentManager />}

        {tab === 'overview' && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card><div className="text-xs uppercase tracking-widest text-gray-500">Admin</div><div className="mt-2 text-lg font-bold">{admin.full_name || admin.email}</div><div className="mt-1 text-xs text-emerald-400">Verified by Cloudflare Access</div></Card>
            <Card><div className="text-xs uppercase tracking-widest text-gray-500">Recorded actions</div><div className="mt-2 text-3xl font-black text-emerald-400">{audit.length}</div><div className="mt-1 text-xs text-gray-500">Create {counts.create || 0} · Update {counts.update || 0} · Delete {counts.delete || 0}</div></Card>
            <Card><div className="text-xs uppercase tracking-widest text-gray-500">Member authentication</div><div className="mt-2 text-lg font-bold">{settings?.discordAuth ? 'Discord connected' : 'Not configured'}</div><div className="mt-1 text-xs text-gray-500">Admin access remains separate</div></Card>
          </div>
        )}

        {tab === 'audit' && (
          <Card>
            <div className="mb-4 flex items-center justify-between"><h2 className="font-bold text-emerald-300">ADMIN ACTIONS</h2><span className="text-xs text-gray-500">Newest first</span></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-500"><tr><th className="py-3 pr-4">Time</th><th className="py-3 pr-4">Action</th><th className="py-3 pr-4">Target</th><th className="py-3">Actor</th></tr></thead>
                <tbody>{audit.map((item) => <tr key={item.id} className="border-b border-white/5"><td className="py-3 pr-4 text-gray-400">{new Date(item.created_at).toLocaleString()}</td><td className="py-3 pr-4 font-bold text-emerald-300">{item.action.toUpperCase()}</td><td className="py-3 pr-4 text-gray-300">{item.entity_type || 'System'}{item.entity_id ? ` · ${item.entity_id}` : ''}</td><td className="py-3 text-gray-500">{item.actor_email}</td></tr>)}</tbody>
              </table>
              {!audit.length && <div className="py-10 text-center text-sm text-gray-500">No admin actions recorded yet.</div>}
            </div>
          </Card>
        )}

        {tab === 'settings' && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card><h2 className="font-bold text-emerald-300">AUTHENTICATION</h2><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-gray-500">Cloudflare admin</dt><dd>{settings?.cloudflareAccess ? 'Configured' : 'Not configured'}</dd></div><div><dt className="text-gray-500">Discord members</dt><dd>{settings?.discordAuth ? 'Configured' : 'Not configured'}</dd></div><div><dt className="text-gray-500">Discord Client ID</dt><dd className="break-all">{settings?.discordClientId || '—'}</dd></div><div><dt className="text-gray-500">Redirect URI</dt><dd className="break-all">{settings?.discordRedirectUri || '—'}</dd></div></dl></Card>
            <Card><h2 className="font-bold text-emerald-300">SYSTEM</h2><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-gray-500">Application URL</dt><dd>{settings?.appBaseUrl || '—'}</dd></div><div><dt className="text-gray-500">Member session length</dt><dd>{settings?.sessionDays || '—'} days</dd></div><div><dt className="text-gray-500">Database</dt><dd className="break-all text-xs">{settings?.databasePath || '—'}</dd></div></dl></Card>
          </div>
        )}
      </main>
    </div>
  );
}
