import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Server, AlertTriangle, FileText, ExternalLink } from 'lucide-react';
import SectionHeading from '@/components/ui/SectionHeading';
import GlassCard from '@/components/ui/GlassCard';
import { communityRules, serverRules, servers } from '@/lib/serverData';

const categories = [
  { id: 'community', label: 'COMMUNITY RULES', icon: Shield },
  { id: 'servers', label: 'SERVER RULES', icon: Server },
  { id: 'appeal', label: 'BAN APPEALS', icon: AlertTriangle },
];

export default function Rules() {
  const [activeCategory, setActiveCategory] = useState('community');
  const [activeServer, setActiveServer] = useState('7dtd');

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="The Codex" subtitle="RULES & CONDUCT" />
        <p className="text-center text-muted-foreground max-w-2xl mx-auto -mt-8 mb-12">
          Our rules exist to maintain a fair, fun, and respectful environment. All members are expected to know and follow these guidelines.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 lg:sticky lg:top-24 lg:self-start">
            <div className="glass-panel rounded-xl p-4 space-y-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-semibold tracking-wider transition-all ${
                    activeCategory === cat.id
                      ? 'bg-emerald-glow/10 text-emerald-glow border border-emerald-glow/20'
                      : 'text-muted-foreground hover:text-foreground border border-transparent'
                  }`}
                >
                  <cat.icon size={16} />
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Quick disclaimer */}
            <div className="glass-panel rounded-xl p-4 mt-4">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <FileText size={14} className="text-gold mt-0.5 shrink-0" />
                <p>Rules are enforced by our moderation team. Repeated violations result in escalating penalties up to permanent ban.</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeCategory === 'community' && (
              <motion.div
                key="community"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {communityRules.map((rule, i) => (
                  <motion.div
                    key={rule.number}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <GlassCard className="flex items-start gap-5 !p-5">
                      <div className="w-10 h-10 shrink-0 rounded-lg bg-emerald-glow/10 border border-emerald-glow/20 flex items-center justify-center">
                        <span className="text-emerald-glow font-mono font-bold text-sm">{rule.number}</span>
                      </div>
                      <div>
                        <h4 className="text-foreground font-heading font-bold text-sm mb-1">{rule.title}</h4>
                        <p className="text-muted-foreground text-sm leading-relaxed">{rule.description}</p>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {activeCategory === 'servers' && (
              <motion.div
                key="servers"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Server selector */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {servers.filter(s => s.id !== 'coming-soon').map(server => (
                    <button
                      key={server.id}
                      onClick={() => setActiveServer(server.id)}
                      className={`px-4 py-2 text-xs font-mono tracking-wider rounded border transition-all ${
                        activeServer === server.id
                          ? 'bg-emerald-glow/10 border-emerald-glow/40 text-emerald-glow'
                          : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                      }`}
                    >
                      {server.name}
                    </button>
                  ))}
                </div>

                <GlassCard>
                  <h3 className="text-foreground font-heading font-bold mb-4 flex items-center gap-2">
                    <Server size={18} className="text-emerald-glow" />
                    {servers.find(s => s.id === activeServer)?.name} Rules
                  </h3>
                  <ul className="space-y-3">
                    {(serverRules[activeServer] || []).map((rule, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3"
                      >
                        <span className="w-6 h-6 shrink-0 rounded bg-obsidian border border-border flex items-center justify-center text-xs font-mono text-emerald-glow">
                          {i + 1}
                        </span>
                        <p className="text-muted-foreground text-sm leading-relaxed pt-0.5">{rule}</p>
                      </motion.li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground/60 font-mono mt-6">
                    These rules supplement the community rules above. All community rules apply to all servers.
                  </p>
                </GlassCard>
              </motion.div>
            )}

            {activeCategory === 'appeal' && (
              <motion.div
                key="appeal"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard className="mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                      <AlertTriangle size={24} className="text-gold" />
                    </div>
                    <div>
                      <h3 className="text-foreground font-heading font-bold text-lg mb-2">Ban Appeals</h3>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        If you believe your ban was unjust or you want a second chance, you can submit a ban appeal through our Discord. Our moderation team reviews every appeal fairly and thoroughly.
                      </p>
                      <div className="space-y-3">
                       <div className="glass-panel rounded-lg p-4">
                         <h4 className="text-foreground font-semibold text-sm mb-2">How to Appeal</h4>
                         <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
                           <li>Fill out the ban appeal form below</li>
                           <li>Provide your in-game name, server, and reason for appeal</li>
                           <li>Be honest and respectful — this is your chance to make things right</li>
                           <li>Wait for a staff member to review your case (usually within 48 hours)</li>
                         </ol>
                       </div>
                       <a
                         href="/ban-appeal"
                         className="inline-flex items-center gap-2 px-6 py-2.5 bg-gold/10 border border-gold/30 text-gold font-semibold text-sm tracking-wider rounded hover:bg-gold/20 transition-all"
                       >
                         SUBMIT APPEAL FORM
                         <ExternalLink size={14} />
                       </a>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard>
                  <h4 className="text-foreground font-heading font-bold text-sm mb-3">Important Notes</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-gold">•</span>
                      Appealing does not guarantee an unban. Each case is reviewed individually.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gold">•</span>
                      Only one appeal per ban. Spamming appeals will result in denial.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gold">•</span>
                      Permanent bans for cheating are rarely overturned.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gold">•</span>
                      If your appeal is denied, you may try again after 30 days.
                    </li>
                  </ul>
                </GlassCard>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}