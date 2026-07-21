import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SectionHeading from '@/components/ui/SectionHeading';

const CATEGORY_COLORS = {
  'Announcement': { bg: 'rgba(16,255,139,0.1)', border: 'rgba(16,255,139,0.3)', text: '#10FF8B' },
  'Update': { bg: 'rgba(100,180,255,0.1)', border: 'rgba(100,180,255,0.3)', text: '#64b4ff' },
  'Event': { bg: 'rgba(212,175,55,0.1)', border: 'rgba(212,175,55,0.3)', text: '#D4AF37' },
  'Community': { bg: 'rgba(180,100,255,0.1)', border: 'rgba(180,100,255,0.3)', text: '#b464ff' },
  'Other': { bg: 'rgba(150,150,150,0.1)', border: 'rgba(150,150,150,0.3)', text: '#999' },
};

const ALL_CATEGORIES = ['All', 'Announcement', 'Update', 'Event', 'Community', 'Other'];

export default function News() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    base44.entities.NewsPost.filter({ published: true }, '-created_date').then(data => {
      setPosts(data);
      setLoading(false);
    });
  }, []);

  const filtered = filter === 'All' ? posts : posts.filter(p => p.category === filter);

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="News" subtitle="LATEST UPDATES" />

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
          <p className="text-center text-muted-foreground font-mono text-sm py-16">No news posts yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((post, i) => {
              const style = CATEGORY_COLORS[post.category] || CATEGORY_COLORS['Other'];
              return (
                <motion.div key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => setSelected(post)}
                  className="group cursor-pointer rounded-xl overflow-hidden flex flex-col"
                  style={{ background: 'rgba(10,20,10,0.7)', border: '1px solid rgba(16,255,139,0.12)' }}
                >
                  {post.thumbnail && (
                    <div className="h-44 overflow-hidden">
                      <img src={post.thumbnail} alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                  )}
                  <div className="p-5 flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded"
                        style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.text }}>
                        {post.category}
                      </span>
                      <span className="text-xs font-mono text-gray-600 ml-auto">
                        {new Date(post.created_date).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-white font-heading font-bold text-base leading-tight">{post.title}</h3>
                    {post.summary && <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">{post.summary}</p>}
                    <span className="text-xs font-mono mt-auto pt-2" style={{ color: 'rgba(16,255,139,0.6)' }}>Read more →</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Post modal */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
            onClick={() => setSelected(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl"
              style={{ background: 'rgba(8,15,8,0.98)', border: '1px solid rgba(16,255,139,0.2)' }}>
              {selected.thumbnail && (
                <img src={selected.thumbnail} alt={selected.title} className="w-full h-56 object-cover" />
              )}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono px-2 py-0.5 rounded"
                    style={{ background: CATEGORY_COLORS[selected.category]?.bg, border: `1px solid ${CATEGORY_COLORS[selected.category]?.border}`, color: CATEGORY_COLORS[selected.category]?.text }}>
                    {selected.category}
                  </span>
                  <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
                </div>
                <h2 className="text-white font-heading font-bold text-xl mb-2">{selected.title}</h2>
                <p className="text-xs font-mono text-gray-600 mb-4">{new Date(selected.created_date).toLocaleDateString()}</p>
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{selected.content}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}