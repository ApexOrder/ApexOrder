import React from 'react';

export default function CapacityBar({ current, max, label }) {
  const percentage = max > 0 ? (current / max) * 100 : 0;
  const color = percentage > 80 ? 'bg-red-400' : percentage > 50 ? 'bg-gold' : 'bg-emerald-glow';

  return (
    <div>
      {label && <div className="flex justify-between mb-1">
        <span className="text-xs font-mono text-muted-foreground">{label}</span>
        <span className="text-xs font-mono text-foreground">{current}/{max}</span>
      </div>}
      <div className="h-1.5 bg-obsidian-light rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full capacity-fill transition-all duration-700`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}