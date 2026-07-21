import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import SectionHeading from '@/components/ui/SectionHeading';

const CATEGORY_COLORS = {
  'Server Update': { bg: 'rgba(16,255,139,0.1)', border: 'rgba(16,255,139,0.3)', text: '#10FF8B' },
  'Mod Update': { bg: 'rgba(100,180,255,0.1)', border: 'rgba(100,180,255,0.3)', text: '#64b4ff' },
  'Bug Fix': { bg: 'rgba(255,100,100,0.1)', border: 'rgba(255,100,100,0.3)', text: '#ff6464' },
  'New Feature': { bg: 'rgba(212,175,55,0.1)', border: 'rgba(212,175,55,0.3)', text: '#D4AF37' },
  'Announcement': { bg: 'rgba(180,100,255,0.1)', border: 'rgba(180,100,255,0.3)', text: '#b464ff' },
};

const ALL_CATEGORIES = ['All', 'Server Update', 'Mod Update', 'Bug Fix', 'New Feature', 'Announcement'];

export default function Changelog() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    base44.entities.Changelog.filter({ published: true }, '-created_date').then(data => {
      setEntries(data);
      setLoading(false);
    });
  }, []);

  const filtered = filter === 'All' ? entries : entries.filter(e => e.category === filter);

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Changelog" subtitle="PATCH NOTES & UPDATES" />

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {ALL_CATEGORIES.map(cat => {
            const style = CATEGORY_COLORS[cat];
            const active = filter === cat;
            return (
              <button key={cat} onClick={() => setFilter(cat)}
                className="px-3 py-1.5 text-xs font-mono tracking-wider rounded border transition-all"
                style={active
                  ? { background: style?.bg || 'rgba(16,255,139,0.1)', border: `1px solid ${style?.border || 'rgba(16,255,139,0.3)'}`, color: style?.text || '#10FF8B' }
                  : { background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#666' }
                }>
                {cat}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-emerald-glow/20 border-t-emerald-glow rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground font-mono text-sm py-16">No entries found.</p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-emerald-glow/10 hidden sm:block" />
            <div className="space-y-6">
              {filtered.map((entry, i) => {
                const style = CATEGORY_COLORS[entry.category] || CATEGORY_COLORS['Server Update'];
                return (
                  <motion.div key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="sm:pl-12 relative"
                  >
                    {/* Dot */}
                    <div className="absolute left-2.5 top-5 w-3 h-3 rounded-full border-2 hidden sm:block"
                      style={{ background: style.bg, borderColor: style.text }} />
                    <div className="p-5 rounded-xl" style={{ background: 'rgba(10,20,10,0.7)', border: '1px solid rgba(16,255,139,0.1)' }}>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded"
                          style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.text }}>
                          {entry.category}
                        </span>
                        {entry.version && (
                          <span className="text-xs font-mono px-2 py-0.5 rounded"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#999' }}>
                            {entry.version}
                          </span>
                        )}
                        {entry.game && <span className="text-xs font-mono" style={{ color: '#D4AF37' }}>{entry.game}</span>}
                        <span className="text-xs font-mono text-gray-600 ml-auto">
                          {new Date(entry.created_date).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-white font-heading font-bold text-base mb-2">{entry.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{entry.content}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}