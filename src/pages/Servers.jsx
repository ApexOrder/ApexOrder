import React, { useEffect, useState } from 'react';
import { Server, Filter, RefreshCw } from 'lucide-react';
import SectionHeading from '@/components/ui/SectionHeading';
import ServerCard from '@/components/servers/ServerCard';
import { base44 } from '@/api/base44Client';

const filters = ['ALL', 'SURVIVAL', 'ROLEPLAY', 'SANDBOX', 'HARDCORE', 'FPS', 'STRATEGY'];

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
    queryHost: s.query_host || '127.0.0.1',
    queryPort: Number(s.query_port || 26903),
  };
}

function mergeLiveStatus(server, live) {
  if (!live) return server;
  return {
    ...server,
    live,
    status: live.online ? 'online' : 'offline',
    players: {
      current: live.playersCurrent ?? server.players.current,
      max: live.playersMax ?? server.players.max,
    },
    map: live.map || server.map,
    version: live.version || server.version,
  };
}

export default function Servers() {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadLiveStats = async ({ initial = false, force = false } = {}) => {
    if (initial) setLoading(true);
    else setRefreshing(true);
    setLoadError('');

    try {
      const data = await base44.entities.Server.list('sort_order');
      const shaped = (Array.isArray(data) ? data : []).map(dbServerToShape);
      const response = await fetch(`/api/servers/live${force ? '?refresh=1' : ''}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Live server query failed: ${response.status}`);
      const statuses = await response.json();
      const byId = new Map((Array.isArray(statuses) ? statuses : []).map(status => [status.serverId, status]));
      setServers(shaped.map(server => mergeLiveStatus(server, byId.get(server.id))));
      setLastUpdated(new Date());
    } catch (error) {
      console.warn('[GameDig] Unable to refresh live server statistics.', error);
      if (initial) {
        try {
          const data = await base44.entities.Server.list('sort_order');
          setServers((Array.isArray(data) ? data : []).map(dbServerToShape));
        } catch {
          setServers([]);
        }
      }
      setLoadError(initial ? 'Unable to load live server information right now.' : 'Live server data could not be refreshed.');
    } finally {
      if (initial) setLoading(false);
      else setRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    if (!cancelled) loadLiveStats({ initial: true });
    const timer = window.setInterval(() => {
      if (!document.hidden && !cancelled) loadLiveStats();
    }, 15000);
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
          Live server status and player counts are queried directly from our game servers.
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
          <button onClick={() => loadLiveStats({ force: true })} disabled={refreshing || loading} className="flex items-center gap-2 text-muted-foreground hover:text-emerald-glow transition-colors disabled:opacity-50">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'REFRESHING' : lastUpdated ? `LIVE · ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'REFRESH LIVE'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-16"><RefreshCw size={22} className="mx-auto mb-4 animate-spin text-emerald-glow" /><p className="text-muted-foreground font-mono">Loading servers…</p></div>
        ) : loadError && servers.length === 0 ? (
          <div className="text-center py-16"><p className="text-red-300 font-mono">{loadError}</p><button onClick={() => loadLiveStats({ initial: true, force: true })} className="mt-4 text-xs font-mono text-emerald-glow hover:underline">TRY AGAIN</button></div>
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
