import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Map, ChevronRight, Copy, Check } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import CapacityBar from '@/components/ui/CapacityBar';
import ServerProfileModal from './ServerProfileModal';

export default function ServerCard({ server, index }) {
  const [showJoin, setShowJoin] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleCopy = () => {
    if (server.ip) {
      navigator.clipboard.writeText(server.ip);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group"
    >
      <div className="glass-panel rounded-xl overflow-hidden transition-all duration-500 hover:border-emerald-glow/40 hover:glow-emerald">
        {/* Image */}
        <div className="relative h-44 overflow-hidden">
          <img
            src={server.image}
            alt={`${server.name} server`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-70 group-hover:opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent" />
          <div className="absolute top-4 left-4">
            <StatusBadge status={server.status} />
          </div>
          <div className="absolute top-4 right-4">
            <span className="text-xs font-mono text-gold bg-obsidian/70 px-2 py-1 rounded border border-gold/20">
              {server.tag}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-xl font-heading font-bold text-foreground mb-1 group-hover:text-emerald-glow transition-colors">
            {server.name}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">{server.description}</p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Users size={14} className="text-emerald-glow" />
              <span className="font-mono text-xs text-muted-foreground">
                {server.players.current}/{server.players.max}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Map size={14} className="text-gold" />
              <span className="font-mono text-xs text-muted-foreground">{server.map}</span>
            </div>
          </div>

          <CapacityBar
            current={server.players.current}
            max={server.players.max}
            label="CAPACITY"
          />

          {/* Mods */}
          {server.mods && server.mods.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {server.mods.slice(0, 3).map(mod => (
                <span key={mod} className="text-xs font-mono px-2 py-0.5 rounded bg-obsidian-light border border-border text-muted-foreground">
                  {mod}
                </span>
              ))}
              {server.mods.length > 3 && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-obsidian-light border border-border text-gold">
                  +{server.mods.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-5 flex gap-2">
            <button
              onClick={() => setShowProfile(true)}
              className="flex-1 px-4 py-2.5 bg-emerald-glow/10 border border-emerald-glow/30 text-emerald-glow font-semibold text-xs tracking-wider rounded hover:bg-emerald-glow/20 transition-all flex items-center justify-center gap-2"
            >
              VIEW PROFILE
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => setShowJoin(!showJoin)}
              className="px-4 py-2.5 bg-obsidian-light border border-border text-muted-foreground font-semibold text-xs tracking-wider rounded hover:border-emerald-glow/30 hover:text-foreground transition-all flex items-center justify-center gap-2"
            >
              HOW TO JOIN
              <ChevronRight size={14} className={`transition-transform ${showJoin ? 'rotate-90' : ''}`} />
            </button>
          </div>

          {/* Join instructions */}
          {showJoin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-4 bg-obsidian rounded-lg border border-border"
            >
              <p className="text-sm text-muted-foreground mb-3">{server.joinInstructions}</p>
              {server.ip && (
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center justify-between px-3 py-2 bg-obsidian-light rounded border border-border hover:border-emerald-glow/30 transition-colors"
                >
                  <span className="font-mono text-sm text-emerald-glow">{server.ip}</span>
                  {copied ? <Check size={14} className="text-emerald-glow" /> : <Copy size={14} className="text-muted-foreground" />}
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>
      {showProfile && <ServerProfileModal server={server} onClose={() => setShowProfile(false)} />}
    </motion.div>
  );
}