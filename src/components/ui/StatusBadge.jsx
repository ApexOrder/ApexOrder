import React from 'react';

const STATUS_STYLES = {
  online: {
    label: 'ONLINE',
    container: 'bg-emerald-glow/10 text-emerald-glow border-emerald-glow/30',
    dot: 'bg-emerald-glow animate-pulse',
  },
  starting: {
    label: 'STARTING',
    container: 'bg-sky-400/10 text-sky-300 border-sky-400/30',
    dot: 'bg-sky-300 animate-pulse',
  },
  restarting: {
    label: 'RESTARTING',
    container: 'bg-sky-400/10 text-sky-300 border-sky-400/30',
    dot: 'bg-sky-300 animate-pulse',
  },
  stopping: {
    label: 'STOPPING',
    container: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
    dot: 'bg-amber-300 animate-pulse',
  },
  sleeping: {
    label: 'SLEEPING',
    container: 'bg-violet-400/10 text-violet-300 border-violet-400/30',
    dot: 'bg-violet-300',
  },
  updating: {
    label: 'UPDATING',
    container: 'bg-sky-400/10 text-sky-300 border-sky-400/30',
    dot: 'bg-sky-300 animate-pulse',
  },
  maintenance: {
    label: 'MAINTENANCE',
    container: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
    dot: 'bg-amber-300',
  },
  error: {
    label: 'ERROR',
    container: 'bg-red-500/10 text-red-400 border-red-400/30',
    dot: 'bg-red-400',
  },
  unknown: {
    label: 'UNKNOWN',
    container: 'bg-gray-400/10 text-gray-300 border-gray-400/30',
    dot: 'bg-gray-300',
  },
  offline: {
    label: 'OFFLINE',
    container: 'bg-red-500/10 text-red-400 border-red-400/30',
    dot: 'bg-red-400',
  },
};

export default function StatusBadge({ status = 'unknown' }) {
  const normalised = String(status || 'unknown').trim().toLowerCase();
  const style = STATUS_STYLES[normalised] || STATUS_STYLES.unknown;

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-mono font-semibold tracking-wider ${style.container}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </div>
  );
}
