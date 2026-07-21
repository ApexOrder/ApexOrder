import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Star, Crown, Heart, Swords } from 'lucide-react';

const values = [
  { icon: Shield, label: 'LOYALTY', text: 'We stand by our community.' },
  { icon: Star, label: 'QUALITY', text: 'Excellence in everything we do.' },
  { icon: Crown, label: 'LEADERSHIP', text: 'Leading the way since 2007.' },
  { icon: Heart, label: 'RESPECT', text: 'Respect is the foundation.' },
  { icon: Swords, label: 'PASSION', text: 'Fuelled by passion, driven to succeed.' },
];

export default function MissionSection() {
  return (
    <section className="py-16 lg:py-20 border-t border-b border-emerald-glow/10 bg-obsidian-light/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mission statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold/50" />
            <span className="text-xs font-mono tracking-[0.3em] text-gold">OUR MISSION</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold/50" />
          </div>
          <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
            To create unforgettable gaming experiences and bring people together through passion, dedication and a shared love for the game.
          </p>
        </motion.div>

        {/* Values bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {values.map((value, index) => (
            <motion.div
              key={value.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-panel rounded-lg px-4 py-5 text-center group hover:border-gold/30 transition-all duration-300"
            >
              <value.icon size={20} className="text-gold mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="text-gold font-heading font-bold text-xs tracking-wider mb-1">{value.label}</h4>
              <p className="text-muted-foreground text-xs">{value.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}