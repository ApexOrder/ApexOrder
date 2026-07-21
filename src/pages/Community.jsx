import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Trophy, Clock, Star } from 'lucide-react';
import SectionHeading from '@/components/ui/SectionHeading';
import GlassCard from '@/components/ui/GlassCard';
import DiscordCTA from '@/components/home/DiscordCTA';

const stats = [
  { icon: Clock, label: 'YEARS ACTIVE', value: '17+', color: 'text-gold' },
  { icon: Users, label: 'COMMUNITY MEMBERS', value: '2,500+', color: 'text-emerald-glow' },
  { icon: Trophy, label: 'SERVERS HOSTED', value: '50+', color: 'text-gold' },
  { icon: Star, label: 'EVENTS HELD', value: '300+', color: 'text-emerald-glow' },
];

const timeline = [
  { year: '2007', title: 'The Beginning', description: 'A group of friends launched ApexOrder as a small Counter-Strike clan, forging bonds that would last decades.' },
  { year: '2010', title: 'First Dedicated Servers', description: 'We expanded into hosting our own game servers, starting with Minecraft and Garry\'s Mod.' },
  { year: '2014', title: 'Community Growth', description: 'ApexOrder hit 500 members and began hosting weekly community events and tournaments.' },
  { year: '2018', title: 'Modern Era', description: 'Moved to Discord as our primary hub. Launched DayZ, 7 Days to Die, and FiveM servers.' },
  { year: '2021', title: 'The Expansion', description: 'Added Valheim on launch day. Over 1,000 concurrent players across all servers.' },
  { year: '2022', title: 'Taking a Break', description: 'After years of non-stop hosting, the team stepped back to enjoy personal time and recharge. The community paused, but the brotherhood never faded.' },
  { year: '2026', title: 'We\'re Back', description: 'ApexOrder returns — refreshed, motivated and ready. We\'re bringing custom-built servers, hand-crafted mod packs, and brand new experiences built from the ground up for the community.' },
];

const galleryImages = [
  { src: 'https://media.base44.com/images/public/6a300cbaaf30e01d8fac639e/0fa8333f8_generated_9d03973c.png', alt: 'Epic battle scene' },
  { src: 'https://media.base44.com/images/public/6a300cbaaf30e01d8fac639e/6a5951577_generated_412597f7.png', alt: 'Community base building' },
  { src: 'https://media.base44.com/images/public/6a300cbaaf30e01d8fac639e/86715c882_generated_f0d93844.png', alt: 'Underground bunker' },
  { src: 'https://media.base44.com/images/public/6a300cbaaf30e01d8fac639e/793239a17_generated_8a8075dc.png', alt: 'Community gathering' },
];

const members = [
  { name: 'ShadowBlade', role: 'Founder', since: '2007', badge: '👑' },
  { name: 'IronWolf', role: 'Head Admin', since: '2008', badge: '⚔️' },
  { name: 'NightHawk', role: 'Server Lead', since: '2010', badge: '🛡️' },
  { name: 'PhoenixRise', role: 'Community Manager', since: '2012', badge: '🔥' },
  { name: 'StormBreaker', role: 'Event Coordinator', since: '2015', badge: '⚡' },
  { name: 'CyberVex', role: 'Mod Developer', since: '2018', badge: '💎' },
];

export default function Community() {
  const [activeImage, setActiveImage] = useState(null);

  return (
    <div className="pt-24 pb-20">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading title="Our Community" subtitle="THE LEGACY ARCHIVE" />
      </div>

      {/* About */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px w-8 bg-gold" />
              <span className="text-xs font-mono tracking-[0.3em] text-gold">ABOUT APEXORDER</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-heading font-bold mb-6">
              Built by Friends. <span className="text-emerald-glow">Forged by Time.</span>
            </h3>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                ApexOrder started in 2007 as a small group of friends who shared one thing: a deep love for gaming. What began as late-night sessions and casual matches evolved into something much bigger — a community that has stood the test of time.
              </p>
              <p>
                Over 17 years, we have hosted dozens of game servers, organized hundreds of events, and built a family of thousands of players who call ApexOrder home. We are not just another gaming community — we are a legacy.
              </p>
              <p>
                Our philosophy is simple: <span className="text-foreground font-semibold">respect, loyalty, and passion</span>. Whether you are a veteran player or brand new, you will find a welcoming home here.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <img
              src="https://media.base44.com/images/public/6a300cbaaf30e01d8fac639e/793239a17_generated_8a8075dc.png"
              alt="ApexOrder community gathering"
              className="rounded-xl w-full opacity-80"
            />
            <div className="absolute inset-0 rounded-xl border border-emerald-glow/20" />
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-emerald-glow/10 bg-obsidian-light/30 py-16 mb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <stat.icon size={24} className={`${stat.color} mx-auto mb-3`} />
                <div className={`text-3xl md:text-4xl font-heading font-black ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-xs font-mono tracking-wider text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <SectionHeading title="Our Journey" subtitle="TIMELINE" />
        <div className="relative">
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-glow/30 via-emerald-glow/10 to-transparent" />
          {timeline.map((event, i) => (
            <motion.div
              key={event.year}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`relative flex items-start gap-6 mb-10 ${
                i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
              }`}
            >
              <div className="hidden md:block flex-1" />
              <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-emerald-glow border-2 border-obsidian z-10" />
              <div className="flex-1 ml-10 md:ml-0">
                <GlassCard className="!p-5">
                  <span className="text-xs font-mono text-gold tracking-wider">{event.year}</span>
                  <h4 className="text-foreground font-heading font-bold mt-1 mb-2">{event.title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{event.description}</p>
                </GlassCard>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <SectionHeading title="Moments & Media" subtitle="GALLERY" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {galleryImages.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative group cursor-pointer overflow-hidden rounded-xl"
              onClick={() => setActiveImage(activeImage === i ? null : i)}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-56 md:h-64 object-cover transition-all duration-700 group-hover:scale-105 grayscale group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-obsidian/40 group-hover:bg-obsidian/10 transition-all duration-500" />
              <div className="absolute bottom-4 left-4 text-xs font-mono text-foreground/70 opacity-0 group-hover:opacity-100 transition-opacity">
                {img.alt}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Member highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <SectionHeading title="Core Team" subtitle="MEMBER HIGHLIGHTS" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <GlassCard className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-obsidian border border-emerald-glow/20 flex items-center justify-center text-2xl">
                  {member.badge}
                </div>
                <div>
                  <h4 className="text-foreground font-heading font-bold text-sm">{member.name}</h4>
                  <p className="text-emerald-glow text-xs font-mono">{member.role}</p>
                  <p className="text-muted-foreground text-xs font-mono">Since {member.since}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      <DiscordCTA />
    </div>
  );
}