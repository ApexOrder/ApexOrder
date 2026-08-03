import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Gamepad2, Link2, MessageCircle, ShieldCheck, Unlink } from 'lucide-react';

const PROVIDERS = {
  steam: { label: 'Steam', icon: Gamepad2 },
  discord: { label: 'Discord', icon: MessageCircle },
  battlenet: { label: 'Battle.net', icon: ShieldCheck },
};

export default function LinkedAccounts({ playerId }) {
  const [payload, setPayload] = useState({ items: [], canManage: false, claimed: false, battleNetConfigured: false });
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [accountsResponse, memberResponse] = await Promise.all([
        fetch(`/api/players/${encodeURIComponent(playerId)}/linked-accounts`, { cache: 'no-store' }),
        fetch('/api/member/me', { cache: 'no-store' }),
      ]);
      const accounts = accountsResponse.ok ? await accountsResponse.json() : { items: [] };
      const currentMember = memberResponse.ok ? await memberResponse.json() : null;
      setPayload({ items: Array.isArray(accounts.items) ? accounts.items : [], canManage: Boolean(accounts.canManage), claimed: Boolean(accounts.claimed), battleNetConfigured: Boolean(accounts.battleNetConfigured) });
      setMember(currentMember || null);
    } catch (error) {
      setMessage(error.message || 'Unable to load linked accounts.');
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => { void load(); }, [load]);

  async function mutate(url, options = {}) {
    setBusy(url); setMessage('');
    try {
      const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
      await load();
    } catch (error) {
      setMessage(error.message || 'Unable to update linked accounts.');
    } finally {
      setBusy('');
    }
  }

  const byProvider = new Map(payload.items.map((account) => [account.provider, account]));

  return (
    <section className="mt-6 rounded-2xl border border-cyan-400/15 bg-black/35 p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-cyan-300/70">ApexOrder Identity</div>
          <h2 className="mt-1 text-xl font-black text-white">Linked Accounts</h2>
          <p className="mt-1 text-xs text-white/35">Verified gaming and community accounts attached to this player profile.</p>
        </div>
        {!payload.claimed && member && <button disabled={Boolean(busy)} onClick={() => mutate(`/api/players/${encodeURIComponent(playerId)}/claim`, { method: 'POST', body: '{}' })} className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-black text-cyan-200 disabled:opacity-50">CLAIM THIS PROFILE</button>}
        {!payload.claimed && !member && <a href={`/api/member/login?returnTo=${encodeURIComponent(`/players/${playerId}`)}`} className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-black text-cyan-200">SIGN IN TO CLAIM</a>}
      </div>

      {message && <div className="mb-4 rounded-lg border border-amber-300/20 bg-amber-300/5 p-3 text-sm text-amber-100">{message}</div>}
      {loading ? <div className="py-8 text-center text-sm text-white/35">Loading linked accounts…</div> : (
        <div className="grid gap-3 md:grid-cols-3">
          {Object.entries(PROVIDERS).map(([provider, config]) => {
            const account = byProvider.get(provider);
            const Icon = config.icon;
            const canConnect = provider !== 'battlenet' || payload.battleNetConfigured;
            return <div key={provider} className="rounded-xl border border-white/7 bg-white/[0.025] p-4">
              <div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Icon size={18} className="text-cyan-300" /><span className="text-sm font-black text-white">{config.label}</span></div>{account && <CheckCircle2 size={16} className="text-emerald-300" />}</div>
              {account ? <>
                <div className="truncate text-sm font-bold text-white">{account.displayName}</div>
                <div className="mt-1 truncate font-mono text-[10px] text-white/30">{account.providerId}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {account.profileUrl && <a href={account.profileUrl} target="_blank" rel="noopener noreferrer" className="rounded border border-white/10 px-2 py-1 text-[10px] font-bold text-white/55">OPEN</a>}
                  {payload.canManage && <button onClick={() => mutate(`/api/players/${encodeURIComponent(playerId)}/linked-accounts/${provider}`, { method: 'PATCH', body: JSON.stringify({ isPublic: !account.isPublic }) })} className="rounded border border-white/10 p-1.5 text-white/50" title={account.isPublic ? 'Hide account' : 'Show account'}>{account.isPublic ? <Eye size={13} /> : <EyeOff size={13} />}</button>}
                  {payload.canManage && <button onClick={() => mutate(`/api/players/${encodeURIComponent(playerId)}/linked-accounts/${provider}`, { method: 'DELETE' })} className="rounded border border-red-400/15 p-1.5 text-red-300" title="Unlink account"><Unlink size={13} /></button>}
                </div>
              </> : payload.canManage ? <>
                <div className="mb-3 text-xs text-white/35">No {config.label} account linked.</div>
                {provider === 'discord' ? <button disabled={Boolean(busy)} onClick={() => mutate(`/api/players/${encodeURIComponent(playerId)}/linked-accounts/discord`, { method: 'POST', body: '{}' })} className="inline-flex items-center gap-2 rounded border border-cyan-300/25 px-3 py-2 text-xs font-bold text-cyan-200 disabled:opacity-50"><Link2 size={13} /> LINK DISCORD</button> : canConnect ? <a href={`/api/players/${encodeURIComponent(playerId)}/link/${provider}?returnTo=${encodeURIComponent(`/players/${playerId}`)}`} className="inline-flex items-center gap-2 rounded border border-cyan-300/25 px-3 py-2 text-xs font-bold text-cyan-200"><Link2 size={13} /> LINK {config.label.toUpperCase()}</a> : <div className="text-[10px] font-mono text-amber-200/60">OAuth configuration required</div>}
              </> : <div className="text-xs text-white/25">Not linked</div>}
            </div>;
          })}
        </div>
      )}
    </section>
  );
}
