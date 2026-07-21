import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Server, Users, Calendar, Shield, Download, Award } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

const panels = [
  {
    icon: Server,
    title: 'SERVERS',
    description: 'Our home for epic adventures and unforgettable moments.',
    link: '/servers',
    cta: 'VIEW SERVERS',
    stat: '6 Active',
  },
  {
    icon: Users,
    title: 'COMMUNITY',
    description: 'A community built on respect, loyalty and shared passion.',
    link: '/community',
    cta: 'JOIN THE FAMILY',
    stat: 'Since 2007',
  },
  {
    icon: Shield,
    title: 'RULES',
    description: 'Clear guidelines that keep our servers fair and fun for everyone.',
    link: '/rules',
    cta: 'READ RULES',
    stat: 'Fair Play',
  },
  {
    icon: Download,
    title: 'DOWNLOADS',
    description: 'Mod packs, setup guides and everything you need to get started.',
    link: '/downloads',
    cta: 'GET MODS',
    stat: 'Quick Setup',
  },
  {
    icon: Calendar,
    title: 'EVENTS',
    description: 'Community events and activities. More memories await.',
    link: '/community',
    cta: 'COMING SOON',
    stat: 'Upcoming',
  },
  {
    icon: Award,
    title: 'LEGACY',
    description: 'Our journey in numbers. Growing stronger every day.',
    link: '/community',
    cta: 'VIEW STATS',
    stat: '17+ Years',
  },
];

export default function QuickAccessGrid() {
  return (
    <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {panels.map((panel, index) => (
          <motion.div
            key={panel.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Link to={panel.link}>
              <GlassCard className="h-full group cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-glow/10 border border-emerald-glow/20 flex items-center justify-center group-hover:bg-emerald-glow/20 transition-colors">
                    <panel.icon size={22} className="text-emerald-glow" />
                  </div>
                  <span className="text-xs font-mono text-gold border border-gold/20 px-2 py-0.5 rounded">{panel.stat}</span>
                </div>
                <h3 className="text-emerald-glow font-heading font-bold text-sm tracking-wider mb-2">{panel.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">{panel.description}</p>
                <span className="inline-flex items-center text-xs font-mono tracking-wider text-foreground/70 group-hover:text-emerald-glow transition-colors border border-foreground/20 group-hover:border-emerald-glow/30 px-3 py-1.5 rounded">
                  {panel.cta}
                </span>
              </GlassCard>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}