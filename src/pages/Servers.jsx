import React, { useState, useEffect } from 'react';
import { Server, Filter, RefreshCw } from 'lucide-react';
import SectionHeading from '@/components/ui/SectionHeading';
import ServerCard from '@/components/servers/ServerCard';
import { base44 } from '@/api/base44Client';

const filters = ['ALL', 'SURVIVAL', 'ROLEPLAY', 'SANDBOX', 'HARDCORE', 'FPS', 'STRATEGY'];
const DEFAULT_BATTLEMETRICS_SERVER_ID = '39889715';
const BATTLEMETRICS_API = 'https://api.battlemetrics.com/servers';

function splitList(value) {
  if (Array.isArray(value)) return value;
  return String(value || '').split(',').map(item => item.trim()).filter(Boolean);
}

function dbServerToShape(s) {
  return {
    id: s.id,
    name: s.name,
    game: s.game || '',
    tag: s.tag || 'SURVIVAL',
    status: String(s.status || 'offline').toLowerCase(),
    description: s.description || '',
    image: s.image,
    players: { current: s.players_current || 0, max: s.players_max || s.max_players || 32 },
    map: s.map || '',
    version: s.version || '',
    mods: splitList(s.mods),
    ip: s.ip || '',
    joinUrl: s.join_link || '',
    joinInstructions: s.join_instructions || '',
    liveMapUrl: s.live_map_url || '',
    discordChannelUrl: s.discord_channel_url || '',
    featured: Boolean(s.featured),
    showPerformance: false,
    battleMetricsId: String(s.battlemetrics_id || DEFAULT_BATTLEMETRICS_SERVER_ID).trim(),
  };
}

function normaliseBattleMetricsStatus(payload) {
  const data = payload?.data;
  const attributes = data?.attributes;
  if (!data || !attributes) throw new Error('BattleMetrics returned an invalid server response.');

  const details = attributes.details || {};
  const status = String(attributes.status || '').toLowerCase();

  return {
    source: 'battlemetrics',
    battleMetricsId: String(data.id || ''),
    available: true,
    online: status === 'online',
    state: status || 'unknown',
    playersCurrent: Number.isFinite(Number(attributes.players)) ? Number(attributes.players) : null,
    playersMax: Number.isFinite(Number(attributes.maxPlayers)) ? Number(attributes.maxPlayers) : null,
    map: details.map || details.world || null,
    version: details.version || details.gameVersion || null,
    name: attributes.name || null,
    ip: attributes.ip || null,
    port: Number.isFinite(Number(attributes.port)) ? Number(attributes.port) : null,
    rank: Number.isFinite(Number(attributes.rank)) ? Number(attributes.rank) : null,
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchBattleMetricsStatus(serverId) {
  const response = await fetch(`${BATTLEMETRICS_API}/${encodeURIComponent(serverId)}`, {
    cache: 'no-store',
    headers: { Accept: 'application/vnd.api+json' },
  });

  if (!response.ok) throw new Error(`BattleMetrics request failed: ${response.status}`);
  return normaliseBattleMetricsStatus(await response.json());
}

function publicStatusFromLive(live) {
  if (!live || live.available === false) return 'unknown';

  const state = String(live.state || '').toLowerCase();
  if (live.online || ['ready', 'running', 'online', 'started'].some(value => state.includes(value))) return 'online';
  if (state.includes('restart')) return 'restarting';
  if (state.includes('start') || state.includes('configur')) return 'starting';
  if (state.includes('stop')) return 'stopping';
  if (state.includes('sleep')) return 'sleeping';
  if (state.includes('install') || state.includes('updat')) return 'updating';
  if (state.includes('fail') || state.includes('error')) return 'error';
  if (state.includes('maint') || state.includes('suspend')) return 'maintenance';
  if (state.includes('offline') || state.includes('stopped') || state.includes('dead')) return 'offline';
  return 'unknown';
}

function mergeLiveStatus(server, live) {
  if (!live) return server.battleMetricsId ? { ...server, status: 'unknown' } : server;

  return {
    ...server,
    live,
    status: publicStatusFromLive(live),
    players: {
      current: live.playersCurrent ?? server.players?.current ?? 0,
      max: live.playersMax ?? server.players?.max ?? 0,
    },
    map: live.map || server.map,
    version: live.version || server.version,
    battleMetricsName: live.name || '',
  };
}

export default function Servers() {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadLiveStats = async ({ initial = false } = {}) => {
    if (initial) setLoading(true);
    else setRefreshing(true);
    setLoadError('');

    try {
      const data = await base44.entities.Server.list('sort_order');
      const records = Array.isArray(data) ? data : [];
      const shaped = records.map(dbServerToShape);
      const uniqueIds = [...new Set(shaped.map(server => server.battleMetricsId).filter(Boolean))];
      const results = await Promise.allSettled(uniqueIds.map(async id => [id, await fetchBattleMetricsStatus(id)]));
      const byBattleMetricsId = new Map();

      for (const result of results) {
        if (result.status === 'fulfilled') byBattleMetricsId.set(result.value[0], result.value[1]);
        else console.warn('[BattleMetrics] Unable to refresh a server.', result.reason);
      }

      setServers(shaped.map(server => {
        const live = byBattleMetricsId.get(server.battleMetricsId);
        if (live) return mergeLiveStatus(server, live);
        return server.battleMetricsId
          ? { ...server, status: 'unknown', live: { source: 'battlemetrics', available: false } }
          : server;
      }));
      setLastUpdated(new Date());
    } catch (error) {
      console.warn('[BattleMetrics] Unable to refresh live server statistics.', error);
      if (initial) setServers([]);
      else setServers(current => current.map(server => (
        server.battleMetricsId ? { ...server, status: 'unknown', live: { ...(server.live || {}), source: 'battlemetrics', available: false } } : server
      )));
      setLoadError(initial ? 'Unable to load the server list right now.' : 'Live server data could not be refreshed.');
    } finally {
      if (initial) setLoading(false);
      else setRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const initialise = async () => {
      if (!cancelled) await loadLiveStats({ initial: true });
    };

    initialise();
    const timer = window.setInterval(() => {
      if (!document.hidden && !cancelled) loadLiveStats();
    }, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const filtered = activeFilter === 'ALL' ? servers : servers.filter(s => s.tag === activeFilter);
  const onlineCount = servers.filter(s => s.status === 'online').length;
  const activePlayers = servers.reduce((sum, s) => sum + (s.players?.current ?? 0), 0);

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 relative z-10">
        <SectionHeading title="Game Servers" subtitle="TACTICAL GRID" />
        <p className="text-center text-muted-foreground max-w-2xl mx-auto -mt-8 mb-10">
          Public server status and player counts are supplied by BattleMetrics. Server management remains securely handled through AMP.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <Filter size={14} className="text-muted-foreground mr-2" />
          {filters.map(filter => (
            <button key={filter} onClick={() => setActiveFilter(filter)} className={`px-4 py-1.5 text-xs font-mono tracking-wider rounded border transition-all duration-300 ${activeFilter === filter ? 'bg-emerald-glow/10 border-emerald-glow/40 text-emerald-glow' : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'}`}>
              {filter}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 mb-12 text-xs font-mono">
          <div className="flex items-center gap-2"><Server size={14} className="text-emerald-glow" /><span className="text-muted-foreground">{onlineCount} OF {servers.length} ONLINE</span></div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-glow animate-pulse" /><span className="text-muted-foreground">{activePlayers} PLAYERS ACTIVE</span></div>
          <div className="w-px h-4 bg-border" />
          <button onClick={() => loadLiveStats()} disabled={refreshing || loading} className="flex items-center gap-2 text-muted-foreground hover:text-emerald-glow transition-colors disabled:opacity-50">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'REFRESHING' : lastUpdated ? `BATTLEMETRICS · ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'REFRESH LIVE'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-16"><RefreshCw size={22} className="mx-auto mb-4 animate-spin text-emerald-glow" /><p className="text-muted-foreground font-mono">Loading servers…</p></div>
        ) : loadError && servers.length === 0 ? (
          <div className="text-center py-16"><p className="text-red-300 font-mono">{loadError}</p><button onClick={() => loadLiveStats({ initial: true })} className="mt-4 text-xs font-mono text-emerald-glow hover:underline">TRY AGAIN</button></div>
        ) : (
          <>
            {loadError && <div className="mb-6 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-center text-xs font-mono text-amber-200">{loadError}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((server, index) => <ServerCard key={server.id} server={server} index={index} />)}
            </div>
            {filtered.length === 0 && <div className="text-center py-16"><p className="text-muted-foreground font-mono">{servers.length === 0 ? 'No servers have been added yet.' : 'No servers match this filter.'}</p></div>}
          </>
        )}
      </div>
    </div>
  );
}
