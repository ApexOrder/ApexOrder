import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import SectionHeading from '@/components/ui/SectionHeading';
import DiscordCTA from '@/components/home/DiscordCTA';
import { base44 } from '@/api/base44Client';

const STATUS_COLORS = {
  'Live': { bg: 'rgba(16,255,139,0.12)', border: 'rgba(16,255,139,0.35)', text: '#10FF8B' },
  'In Development': { bg: 'rgba(212,175,55,0.12)', border: 'rgba(212,175,55,0.35)', text: '#D4AF37' },
  'Completed': { bg: 'rgba(100,180,255,0.12)', border: 'rgba(100,180,255,0.35)', text: '#64b4ff' },
  'On Hold': { bg: 'rgba(150,150,150,0.1)', border: 'rgba(150,150,150,0.25)', text: '#999' },
};

function isYouTube(url) {
  return url && (url.includes('youtube.com') || url.includes('youtu.be'));
}

function getYouTubeEmbed(url) {
  const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

function MediaModal({ project, onClose }) {
  const screenshots = project.screenshots
    ? project.screenshots.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const [imgIndex, setImgIndex] = useState(0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-3xl rounded-xl overflow-hidden"
        style={{ background: 'rgba(8,15,8,0.98)', border: '1px solid rgba(16,255,139,0.2)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(16,255,139,0.1)' }}>
          <h3 className="font-heading font-bold text-white">{project.title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        {/* Video */}
        {project.video_url && (
          <div className="px-5 pt-4">
            <p className="text-xs font-mono tracking-wider text-emerald-glow mb-2">VIDEO</p>
            {isYouTube(project.video_url) ? (
              <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                <iframe
                  src={getYouTubeEmbed(project.video_url)}
                  className="absolute inset-0 w-full h-full rounded-lg"
                  allowFullScreen
                  title={project.title}
                />
              </div>
            ) : (
              <video src={project.video_url} controls className="w-full rounded-lg" />
            )}
          </div>
        )}

        {/* Screenshots */}
        {screenshots.length > 0 && (
          <div className="px-5 py-4">
            <p className="text-xs font-mono tracking-wider text-emerald-glow mb-2">SCREENSHOTS ({screenshots.length})</p>
            <div className="relative">
              <img
                src={screenshots[imgIndex]}
                alt={`Screenshot ${imgIndex + 1}`}
                className="w-full rounded-lg object-cover"
                style={{ maxHeight: 380 }}
              />
              {screenshots.length > 1 && (
                <div className="flex items-center justify-between mt-2">
                  <button onClick={() => setImgIndex(i => (i - 1 + screenshots.length) % screenshots.length)}
                    className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-xs font-mono text-gray-500">{imgIndex + 1} / {screenshots.length}</span>
                  <button onClick={() => setImgIndex(i => (i + 1) % screenshots.length)}
                    className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {project.description && (
          <div className="px-5 pb-5">
            <p className="text-gray-400 text-sm leading-relaxed">{project.description}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    base44.entities.Project.list('sort_order').then(data => {
      setProjects(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-glow/20 border-t-emerald-glow rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading title="Projects" subtitle="COMMUNITY SHOWCASE" />

        {projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground font-mono text-sm">No projects yet — check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, i) => {
              const statusStyle = STATUS_COLORS[project.status] || STATUS_COLORS['In Development'];
              const tags = project.tags ? project.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
              const screenshots = project.screenshots
                ? project.screenshots.split(',').map(s => s.trim()).filter(Boolean)
                : [];
              const hasMedia = !!project.video_url || screenshots.length > 0;

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="group rounded-xl overflow-hidden flex flex-col"
                  style={{ background: 'rgba(10,20,10,0.7)', border: '1px solid rgba(16,255,139,0.12)' }}
                >
                  {/* Thumbnail */}
                  <div className="relative overflow-hidden" style={{ height: 180 }}>
                    {project.thumbnail ? (
                      <img
                        src={project.thumbnail}
                        alt={project.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, rgba(10,25,10,0.9), rgba(5,15,5,0.8))' }}>
                        <span className="text-4xl font-black opacity-10" style={{ color: '#10FF8B' }}>AO</span>
                      </div>
                    )}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(8,15,8,0.8) 0%, transparent 60%)' }} />

                    {/* Play/View button */}
                    {hasMedia && (
                      <button
                        onClick={() => setSelected(project)}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wider"
                          style={{ background: 'rgba(16,255,139,0.15)', border: '1px solid #10FF8B', color: '#10FF8B', backdropFilter: 'blur(8px)' }}>
                          <Play size={12} fill="currentColor" /> VIEW MEDIA
                        </div>
                      </button>
                    )}

                    {/* Status badge */}
                    <div className="absolute top-3 left-3">
                      <span className="text-xs font-mono font-bold tracking-wider px-2 py-1 rounded"
                        style={{ background: statusStyle.bg, border: `1px solid ${statusStyle.border}`, color: statusStyle.text }}>
                        {project.status}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 flex flex-col gap-2">
                    <div>
                      {project.game && <p className="text-xs font-mono" style={{ color: '#D4AF37' }}>{project.game}</p>}
                      <h3 className="text-white font-heading font-bold text-base leading-tight">{project.title}</h3>
                    </div>
                    {project.description && (
                      <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">{project.description}</p>
                    )}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                        {tags.map(tag => (
                          <span key={tag} className="text-xs font-mono px-2 py-0.5 rounded"
                            style={{ background: 'rgba(16,255,139,0.06)', border: '1px solid rgba(16,255,139,0.15)', color: 'rgba(16,255,139,0.7)' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {hasMedia && (
                      <button
                        onClick={() => setSelected(project)}
                        className="mt-2 flex items-center gap-1.5 text-xs font-mono tracking-wider transition-colors"
                        style={{ color: 'rgba(16,255,139,0.6)' }}
                      >
                        <ExternalLink size={11} /> {project.video_url ? 'Watch video' : `View ${screenshots.length} screenshot${screenshots.length > 1 ? 's' : ''}`}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-20">
        <DiscordCTA />
      </div>

      <AnimatePresence>
        {selected && <MediaModal project={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}