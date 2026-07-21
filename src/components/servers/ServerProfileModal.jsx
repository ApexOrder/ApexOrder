import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Map, Cpu, Copy, Check, Wifi, WifiOff } from 'lucide-react';
import CapacityBar from '@/components/ui/CapacityBar';

export default function ServerProfileModal({ server, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (server.ip) {
      navigator.clipboard.writeText(server.ip);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isOnline = server.status === 'online';
  const mods = Array.isArray(server.mods) ? server.mods : (server.mods ? server.mods.split(',').map(m => m.trim()).filter(Boolean) : []);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-lg z-10 rounded-xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          style={{ background: 'rgba(6,14,6,0.98)', border: '1px solid rgba(16,255,139,0.2)' }}
        >
          {/* Hero image */}
          <div className="relative h-48 overflow-hidden">
            {server.image ? (
              <img src={server.image} alt={server.name} className="w-full h-full object-cover opacity-70" />
            ) : (
              <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #0a1a0a, #050a05)' }} />
            )}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(6,14,6,1) 0%, rgba(6,14,6,0.3) 60%, transparent 100%)' }} />

            {/* Tag */}
            <div className="absolute top-4 left-4 px-2 py-1 text-xs font-mono font-bold rounded"
              style={{ background: 'rgba(5,10,5,0.8)', border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37' }}>
              {server.tag}
            </div>

            {/* Status */}
            <div className="absolute top-4 right-12 flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono"
              style={{ background: 'rgba(5,10,5,0.8)', border: `1px solid ${isOnline ? 'rgba(16,255,139,0.3)' : 'rgba(255,80,80,0.3)'}`, color: isOnline ? '#10FF8B' : '#ff5555' }}>
              {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>

            {/* Close */}
            <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded flex items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
              <X size={14} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <h2 className="text-2xl font-heading font-bold mb-1" style={{ color: '#10FF8B', textShadow: '0 0 20px rgba(16,255,139,0.3)' }}>
              {server.name}
            </h2>
            {server.description && (
              <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>{server.description}</p>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-lg p-3" style={{ background: 'rgba(16,255,139,0.04)', border: '1px solid rgba(16,255,139,0.1)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Users size={12} style={{ color: '#10FF8B' }} />
                  <span className="text-xs font-mono tracking-wider" style={{ color: 'rgba(16,255,139,0.6)' }}>PLAYERS</span>
                </div>
                <div className="text-lg font-black" style={{ color: '#10FF8B' }}>
                  {server.players?.current ?? 0}<span className="text-sm font-normal opacity-50">/{server.players?.max ?? 32}</span>
                </div>
              </div>
              {server.map && (
                <div className="rounded-lg p-3" style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.1)' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Map size={12} style={{ color: '#D4AF37' }} />
                    <span className="text-xs font-mono tracking-wider" style={{ color: 'rgba(212,175,55,0.6)' }}>MAP</span>
                  </div>
                  <div className="text-sm font-bold truncate" style={{ color: '#D4AF37' }}>{server.map}</div>
                </div>
              )}
            </div>

            <CapacityBar current={server.players?.current ?? 0} max={server.players?.max ?? 32} label="SERVER CAPACITY" />

            {/* Mods */}
            {mods.length > 0 && (
              <div className="mt-5">
                <div className="flex items-center gap-1.5 mb-2">
                  <Cpu size={12} style={{ color: 'rgba(255,255,255,0.4)' }} />
                  <span className="text-xs font-mono tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>MODS / PLUGINS</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {mods.map(mod => (
                    <span key={mod} className="text-xs font-mono px-2 py-0.5 rounded"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)' }}>
                      {mod}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Join section */}
            {(server.ip || server.joinInstructions) && (
              <div className="mt-5 p-4 rounded-lg" style={{ background: 'rgba(16,255,139,0.04)', border: '1px solid rgba(16,255,139,0.12)' }}>
                <div className="text-xs font-mono tracking-wider mb-3" style={{ color: 'rgba(16,255,139,0.5)' }}>HOW TO JOIN</div>
                {server.joinInstructions && (
                  <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{server.joinInstructions}</p>
                )}
                {server.ip && (
                  <button onClick={handleCopy}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(16,255,139,0.2)' }}>
                    <span className="font-mono text-sm" style={{ color: '#10FF8B' }}>{server.ip}</span>
                    {copied
                      ? <Check size={14} style={{ color: '#10FF8B' }} />
                      : <Copy size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />}
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}