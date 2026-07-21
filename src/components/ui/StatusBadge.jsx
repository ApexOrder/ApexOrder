import React from 'react';

export default function StatusBadge({ status = 'online' }) {
  const isOnline = status === 'online';
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold tracking-wider ${
      isOnline
        ? 'bg-emerald-glow/10 text-emerald-glow border border-emerald-glow/30'
        : 'bg-red-500/10 text-red-400 border border-red-400/30'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-glow animate-pulse' : 'bg-red-400'}`} />
      {isOnline ? 'ONLINE' : 'OFFLINE'}
    </div>
  );
}