import React from 'react';

export default function SectionHeading({ title, subtitle, accent = 'emerald', className = '' }) {
  return (
    <div className={`text-center mb-12 lg:mb-16 ${className}`}>
      <div className="flex items-center justify-center gap-4 mb-4">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-emerald-glow/50" />
        <span className="text-xs font-mono tracking-[0.3em] text-gold uppercase">{subtitle}</span>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-emerald-glow/50" />
      </div>
      <h2 className={`text-3xl md:text-4xl lg:text-5xl font-heading font-bold tracking-tight ${
        accent === 'emerald' ? 'text-foreground' : 'text-foreground'
      }`}>
        {title}
      </h2>
      <div className="mt-4 mx-auto w-24 h-0.5 bg-gradient-to-r from-emerald-glow/0 via-emerald-glow to-emerald-glow/0" />
    </div>
  );
}