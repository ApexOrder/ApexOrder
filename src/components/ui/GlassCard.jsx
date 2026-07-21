import React from 'react';

export default function GlassCard({ children, className = '', hover = true, glow = false }) {
  return (
    <div className={`
      glass-panel rounded-lg p-6 transition-all duration-500
      ${hover ? 'hover:border-emerald-glow/30 hover:translate-y-[-2px]' : ''}
      ${glow ? 'glow-emerald' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}