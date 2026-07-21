import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Server, Filter, RefreshCw } from 'lucide-react';
import SectionHeading from '@/components/ui/SectionHeading';
import ServerCard from '@/components/servers/ServerCard';
import { base44 } from '@/api/base44Client';

const filters = ['ALL', 'SURVIVAL', 'ROLEPLAY', 'SANDBOX', 'HARDCORE', 'FPS', 'STRATEGY'];

function dbServerToShape(s) {
  return {
    id: s.id,
    name: s.name,
    tag: s.tag || 'SURVIVAL',
    status: String(s.status || 'offline').toLowerCase(),
    description: s.description || '',
    image: s.image,
    players: { current: s.players_current || 0, max: s.players_max || 32 },
    map: s.map || '',
    mods: s.mods ? s.mods.split(',').map(m => m.trim()).filter(Boolean) : [],
    ip: s.ip || s.join_link || '',
    joinInstructions: s.join_instructions || s.join_link || '',
    ampEnabled: Boolean(s.amp_enabled),
  };
}

function publicStatusFromLive(live) {
  if (!live || live.available === false) return 'unknown';

  switch (live.stateId) {
    case 20:
      return 'online';
    case 5:
    case 7:
    case 10:
      return 'starting';
    case 30:
      return 'restarting';
    case 40:
    case 45:
      return 'stopping';
    case 50:
      return 'sleeping';
    case 70:
    case 75:
      return 'updating';
    case 100:
      return 'error';
    case 200:
    case 250:
      return 'maintenance';
    case 0:
      return 'offline';
    default:
      break;
  }

  const state = String(live.state || '').toLowerCase();
  if (live.online || ['ready', 'running', 'online', 'started'].some(value => state.includes(value))) return 'online';
  if (state.includes('restart')) return 'restarting';
  if (state.includes('start') || state.includes('configur')) return 'starting';
  if (state.includes('stop')) return 'stopping';
  if (state.includes('sleep')) return 'sleeping';
  if (state.includes('install') || state.includes('updat')) return 'updating';
  if (state.includes('fail') || state.includes('error')) return 'error';
  if (state.includes('maint') || state.includes('suspend')) return 'maintenance';
  if (state.includes('offline') || state.includes('stopped')) return 'offline';
  return 'unknown';
}

function mergeLiveStatus(server, live) {
  if (!live) {
    return server.ampEnabled ? { ...server, status: 'unknown' } : server;
  }

  return {
    ...server,
    live,
    status: publicStatusFromLive(live),
    players: {
      current: live.playersCurrent ?? server.players?.current ?? 0,
      max: live.playersMax ?? server.players?.max ?? 0,
    },
    map: live.map || server.map,
  };
}

export default function Servers() {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadLiveStats = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/servers/live', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Live server status failed: ${response.status}`);
      const statuses = await response.json();
      const safeStatuses = Array.isArray(statuses) ? statuses : [];
      const byId = new Map(safeStatuses.map(status => [status.serverId, status]));
      setServers(current => current.map(server => mergeLiveStatus(server, byId.get(server.id))));
      setLastUpdated(new Date());
    } catch (error) {
      console.warn('[AMP] Unable to refresh live server statistics.', error);
      setServers(current => current.map(server => (
        server.ampEnabled ? { ...server, status: 'unknown', live: { ...(server.live || {}), available: false } } : server
      )));
    } finally {
      setRefreshing(false);
    }
  };

  const loadServers = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await base44.entities.Server.list('sort_order');
      const records = Array.isArray(data) ? data : [];
      setServers(records.map(dbServerToShape));
    } catch (error) {
      console.error('[Servers] Unable to load server records.', error);
      setServers([]);
      setLoadError('Unable to load the server list right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const initialise = async () => {
      await loadServers();
      if (!cancelled) await loadLiveStats();
    };

    initialise();

    const timer = window.setInterval(() => {
      if (!document.hidden) loadLiveStats();
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const filtered = activeFilter === 'ALL'
    ? servers
    : servers.filter(s => s.tag === activeFilter);

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 relative z-10">
        <SectionHeading title="Game Servers" subtitle="TACTICAL GRID" />
        <p className="text-center text-muted-foreground max-w-2xl mx-auto -mt-8 mb-10">
          Our dedicated servers run 24/7 with active moderation, custom configurations, and regular updates. Pick your battlefield.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <Filter size={14} className="text-muted-foreground mr-2" />
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 text-xs font-mono tracking-wider rounded border transition-all duration-300 ${
                activeFilter === filter
                  ? 'bg-emerald-glow/10 border-emerald-glow/40 text-emerald-glow'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 mb-12 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Server size={14} className="text-emerald-glow" />
            <span className="text-muted-foreground">{servers.filter(s => s.status === 'online').length} SERVERS ONLINE</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-glow animate-pulse" />
            <span className="text-muted-foreground">
              {servers.reduce((sum, s) => sum + (s.players?.current ?? 0), 0)} PLAYERS ACTIVE
            </span>
          </div>
          <div className="w-px h-4 bg-border" />
          <button onClick={loadLiveStats} disabled={refreshing || loading} className="flex items-center gap-2 text-muted-foreground hover:text-emerald-glow transition-colors disabled:opacity-50">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'REFRESHING' : lastUpdated ? `LIVE · ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'REFRESH LIVE'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-16">
            <RefreshCw size={22} className="mx-auto mb-4 animate-spin text-emerald-glow" />
            <p className="text-muted-foreground font-mono">Loading servers…</p>
          </div>
        ) : loadError ? (
          <div className="text-center py-16">
            <p className="text-red-300 font-mono">{loadError}</p>
            <button onClick={loadServers} className="mt-4 text-xs font-mono text-emerald-glow hover:underline">TRY AGAIN</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((server, index) => (
                <ServerCard key={server.id} server={server} index={index} />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground font-mono">
                  {servers.length === 0 ? 'No servers have been added yet.' : 'No servers match this filter.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
