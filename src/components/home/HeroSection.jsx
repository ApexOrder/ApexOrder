import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="https://media.base44.com/images/public/6a300cbaaf30e01d8fac639e/641faa1b1_generated_8da09e89.png"
          alt="Cinematic gaming landscape"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian/60 via-obsidian/40 to-obsidian" />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian/80 via-transparent to-obsidian/80" />
      </div>

      {/* Emerald bottom glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-glow/8 rounded-full blur-[120px] breathe" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Status indicator */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-glow/20 bg-emerald-glow/5 mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-glow animate-pulse" />
            <span className="text-xs font-mono tracking-widest text-emerald-glow">SERVERS OPERATIONAL</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-heading font-black tracking-tight mb-2"
        >
          <span className="text-foreground">APEX</span>
          <span className="text-emerald-glow text-glow-emerald">ORDER</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <p className="text-lg sm:text-xl md:text-2xl font-heading font-light tracking-[0.15em] text-gold text-glow-gold mt-4 mb-3">
            FORGED BY GAMERS SINCE 2007
          </p>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            A premier gaming community built on loyalty, respect, and a shared passion for epic adventures. Join thousands of players across our dedicated servers.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="https://discord.gg/apexorder"
            target="_blank"
            rel="noopener noreferrer"
            className="group px-8 py-3.5 bg-emerald-glow text-obsidian font-bold text-sm tracking-wider rounded hover:bg-emerald-glow/90 transition-all duration-300 glow-emerald-strong flex items-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
            JOIN DISCORD
          </a>
          <Link
            to="/servers"
            className="px-8 py-3.5 border border-foreground/20 text-foreground font-bold text-sm tracking-wider rounded hover:border-emerald-glow/50 hover:text-emerald-glow transition-all duration-300 flex items-center gap-2"
          >
            VIEW SERVERS
            <ChevronDown size={16} className="animate-bounce" />
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
        <span className="text-xs font-mono tracking-widest text-muted-foreground">SCROLL</span>
        <div className="w-px h-8 bg-gradient-to-b from-emerald-glow/50 to-transparent" />
      </div>
    </section>
  );
}