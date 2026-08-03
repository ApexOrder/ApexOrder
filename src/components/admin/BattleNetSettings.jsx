import { useEffect, useState } from 'react';
import { RefreshCw, Save, ShieldCheck } from 'lucide-react';

async function request(path, options = {}) {
  const response = await fetch(path, { credentials: 'include', ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

export default function BattleNetSettings({ onMessage, onError }) {
  const [form, setForm] = useState({ clientId: '', clientSecret: '', redirectUri: 'https://apexorder.uk/api/auth/battlenet/callback', region: 'eu' });
  const [secretConfigured, setSecretConfigured] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    request('/api/admin/provider-settings/battlenet')
      .then((data) => {
        if (!active) return;
        setForm((current) => ({ ...current, clientId: data.clientId || '', redirectUri: data.redirectUri || current.redirectUri, region: data.region || 'eu' }));
        setSecretConfigured(Boolean(data.clientSecretConfigured));
        setConfigured(Boolean(data.configured));
      })
      .catch((error) => onError?.(error.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [onError]);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    onError?.('');
    onMessage?.('');
    try {
      const result = await request('/api/admin/provider-settings/battlenet', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setSecretConfigured(true);
      setConfigured(true);
      setForm((current) => ({ ...current, clientSecret: '' }));
      onMessage?.('Battle.net settings saved. ApexOrder is restarting automatically; refresh this page in a few seconds.');
      if (result.restarting) setTimeout(() => window.location.reload(), 3500);
    } catch (error) {
      onError?.(error.message);
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = 'w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/50';

  return (
    <div className="rounded-xl border border-emerald-400/15 bg-black/30 p-5 md:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-emerald-300">BATTLE.NET ACCOUNT LINKING</h2>
          <p className="mt-2 text-sm text-gray-500">Configure Blizzard OAuth here. The client secret is encrypted only by server access controls and is never returned to the browser.</p>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${configured ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/30 bg-amber-400/10 text-amber-300'}`}>
          <ShieldCheck size={14} /> {configured ? 'CONFIGURED' : 'NOT CONFIGURED'}
        </span>
      </div>

      {loading ? <div className="py-8 text-center text-sm text-gray-500">Loading Battle.net settings…</div> : (
        <form onSubmit={save} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">Client ID</span>
            <input className={fieldClass} value={form.clientId} onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value }))} required />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">Client Secret</span>
            <input className={fieldClass} type="password" autoComplete="new-password" value={form.clientSecret} onChange={(event) => setForm((current) => ({ ...current, clientSecret: event.target.value }))} placeholder={secretConfigured ? 'Leave blank to keep current secret' : 'Enter Battle.net client secret'} required={!secretConfigured} />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">Redirect URI</span>
            <input className={fieldClass} type="url" value={form.redirectUri} onChange={(event) => setForm((current) => ({ ...current, redirectUri: event.target.value }))} required />
            <span className="mt-1 block text-xs text-gray-600">This must exactly match the callback URL configured in the Blizzard developer portal.</span>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">Region</span>
            <select className={fieldClass} value={form.region} onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))}>
              <option value="eu">Europe</option>
              <option value="us">United States</option>
              <option value="kr">Korea</option>
              <option value="tw">Taiwan</option>
              <option value="cn">China</option>
            </select>
          </label>
          <div className="flex items-end">
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-4 py-2.5 text-sm font-bold text-emerald-300 transition hover:bg-emerald-400/15 disabled:opacity-50">
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'SAVING AND RESTARTING…' : 'SAVE BATTLE.NET SETTINGS'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
