import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, ExternalLink, Package, BookOpen } from 'lucide-react';
import SectionHeading from '@/components/ui/SectionHeading';
import GlassCard from '@/components/ui/GlassCard';
import { downloads } from '@/lib/serverData';

export default function Downloads() {
  const [activeGame, setActiveGame] = useState(0);

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading title="Downloads & Mods" subtitle="ARMOURY" />
        <p className="text-center text-muted-foreground max-w-2xl mx-auto -mt-8 mb-12">
          Everything you need to connect to our servers. Download mod packs, read setup guides, and get playing faster.
        </p>

        {/* Game selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {downloads.map((dl, i) => (
            <button
              key={dl.serverId}
              onClick={() => setActiveGame(i)}
              className={`px-5 py-2.5 text-xs font-mono tracking-wider rounded-lg border transition-all duration-300 ${
                activeGame === i
                  ? 'bg-emerald-glow/10 border-emerald-glow/40 text-emerald-glow glow-emerald'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
              }`}
            >
              {dl.game}
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={activeGame}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Mod Packs */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-glow/10 border border-emerald-glow/20 flex items-center justify-center">
                <Package size={18} className="text-emerald-glow" />
              </div>
              <div>
                <h3 className="text-foreground font-heading font-bold">Mod Packs</h3>
                <p className="text-xs font-mono text-muted-foreground">Required downloads for {downloads[activeGame].game}</p>
              </div>
            </div>

            <div className="space-y-3">
              {downloads[activeGame].packs.map((pack, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <GlassCard className="!p-4 group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-foreground font-semibold text-sm mb-1">{pack.name}</h4>
                        <p className="text-muted-foreground text-xs leading-relaxed mb-2">{pack.description}</p>
                        <span className="text-xs font-mono text-gold">{pack.size}</span>
                      </div>
                      <a
                        href={pack.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 w-10 h-10 rounded-lg bg-emerald-glow/10 border border-emerald-glow/20 flex items-center justify-center hover:bg-emerald-glow/20 transition-colors"
                      >
                        {pack.link.startsWith('http') ? (
                          <ExternalLink size={16} className="text-emerald-glow" />
                        ) : (
                          <Download size={16} className="text-emerald-glow" />
                        )}
                      </a>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Setup Guides */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
                <BookOpen size={18} className="text-gold" />
              </div>
              <div>
                <h3 className="text-foreground font-heading font-bold">Setup Guides</h3>
                <p className="text-xs font-mono text-muted-foreground">Get started with {downloads[activeGame].game}</p>
              </div>
            </div>

            <div className="space-y-3">
              {downloads[activeGame].guides.map((guide, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <GlassCard className="!p-4 group cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 shrink-0 rounded bg-obsidian border border-border flex items-center justify-center">
                        <FileText size={14} className="text-gold" />
                      </div>
                      <div>
                        <h4 className="text-foreground font-semibold text-sm mb-1 group-hover:text-emerald-glow transition-colors">
                          {guide.title}
                        </h4>
                        <p className="text-muted-foreground text-xs leading-relaxed">{guide.description}</p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>

            {/* Workshop links */}
            <div className="mt-8">
              <GlassCard className="!p-4">
                <h4 className="text-foreground font-semibold text-sm mb-3 flex items-center gap-2">
                  <ExternalLink size={14} className="text-emerald-glow" />
                  Useful Links
                </h4>
                <div className="space-y-2">
                  <a href="https://discord.gg/apexorder" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-emerald-glow transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-glow/50" />
                    Discord — For help and support
                  </a>
                  <a href="https://store.steampowered.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-emerald-glow transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-glow/50" />
                    Steam Workshop — Browse community mods
                  </a>
                  <a href="https://apexorder.uk" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-emerald-glow transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-glow/50" />
                    apexorder.uk — Official website
                  </a>
                </div>
              </GlassCard>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}