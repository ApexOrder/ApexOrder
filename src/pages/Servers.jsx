import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Server, Filter } from 'lucide-react';
import SectionHeading from '@/components/ui/SectionHeading';
import ServerCard from '@/components/servers/ServerCard';
import { servers as staticServers } from '@/lib/serverData';
import { base44 } from '@/api/base44Client';

const filters = ['ALL', 'SURVIVAL', 'ROLEPLAY', 'SANDBOX', 'HARDCORE', 'FPS', 'STRATEGY'];

function dbServerToShape(s) {
  return {
    id: s.id,
    name: s.name,
    tag: s.tag,
    status: s.status,
    description: s.description,
    image: s.image,
    players: { current: s.players_current || 0, max: s.players_max || 32 },
    map: s.map,
    mods: s.mods ? s.mods.split(',').map(m => m.trim()).filter(Boolean) : [],
    ip: s.ip,
    joinInstructions: s.join_instructions,
  };
}

export default function Servers() {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [servers, setServers] = useState(staticServers);

  useEffect(() => {
    base44.entities.Server.list('sort_order').then(data => {
      if (data.length > 0) setServers(data.map(dbServerToShape));
    });
  }, []);

  const filtered = activeFilter === 'ALL'
    ? servers
    : servers.filter(s => s.tag === activeFilter);

  return (
    <div className="pt-24 pb-20">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 relative z-10">
        <SectionHeading
          title="Game Servers"
          subtitle="TACTICAL GRID"
        />
        <p className="text-center text-muted-foreground max-w-2xl mx-auto -mt-8 mb-10">
          Our dedicated servers run 24/7 with active moderation, custom configurations, and regular updates. Pick your battlefield.
        </p>

        {/* Filter bar */}
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

        {/* Live status bar */}
        <div className="flex items-center justify-center gap-6 mb-12 text-xs font-mono">
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
        </div>
      </div>

      {/* Server grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((server, index) => (
            <ServerCard key={server.id} server={server} index={index} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-mono">No servers match this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}