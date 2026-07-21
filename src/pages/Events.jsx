import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ExternalLink, Server, Clock } from 'lucide-react';
import SectionHeading from '@/components/ui/SectionHeading';
import DiscordCTA from '@/components/home/DiscordCTA';
import { base44 } from '@/api/base44Client';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Event.list('date'),
      base44.entities.Server.list(),
    ]).then(([evs, srvs]) => {
      setEvents(evs);
      setServers(srvs);
      setLoading(false);
    });
  }, []);

  const serverMap = Object.fromEntries(servers.map(s => [s.id, s]));
  const upcoming = events.filter(ev => ev.date && new Date(ev.date) >= new Date());
  const past = events.filter(ev => ev.date && new Date(ev.date) < new Date());

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-glow/20 border-t-emerald-glow rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading title="Events" subtitle="COMMUNITY EVENTS" />

        {/* Upcoming */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(16,255,139,0.3), transparent)' }} />
            <span className="text-xs font-mono tracking-[0.25em] text-emerald-glow">UPCOMING</span>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, rgba(16,255,139,0.3), transparent)' }} />
          </div>

          {upcoming.length === 0 ? (
            <div className="text-center py-12">
              <Calendar size={32} className="text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground text-sm font-mono">No upcoming events — check back soon.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcoming.map((ev, i) => (
                <EventBanner key={ev.id} ev={ev} server={serverMap[ev.server_id]} index={i} />
              ))}
            </div>
          )}
        </section>

        {/* Past events */}
        {past.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.08), transparent)' }} />
              <span className="text-xs font-mono tracking-[0.25em] text-muted-foreground">PAST EVENTS</span>
              <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, rgba(255,255,255,0.08), transparent)' }} />
            </div>
            <div className="space-y-4 opacity-60">
              {past.slice().reverse().map((ev, i) => (
                <EventBanner key={ev.id} ev={ev} server={serverMap[ev.server_id]} index={i} past />
              ))}
            </div>
          </section>
        )}
      </div>

      <DiscordCTA />
    </div>
  );
}

function EventBanner({ ev, server, index, past }) {
  const d = ev.date ? new Date(ev.date) : null;
  const hasBg = !!ev.banner_image;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      className="relative overflow-hidden rounded-xl"
      style={{
        border: past
          ? '1px solid rgba(255,255,255,0.08)'
          : '1px solid rgba(16,255,139,0.25)',
        minHeight: 130,
      }}
    >
      {/* Background image */}
      {hasBg && (
        <img
          src={ev.banner_image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: past ? 0.2 : 0.35 }}
        />
      )}

      {/* Overlay gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: hasBg
            ? 'linear-gradient(to right, rgba(5,10,5,0.92) 40%, rgba(5,10,5,0.6) 100%)'
            : past
              ? 'rgba(10,15,10,0.8)'
              : 'linear-gradient(135deg, rgba(10,25,10,0.95), rgba(5,15,5,0.85))',
        }}
      />

      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ background: past ? 'rgba(255,255,255,0.12)' : 'linear-gradient(to bottom, #10FF8B, rgba(16,255,139,0.3))' }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5">
        {/* Date block */}
        <div
          className="shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-lg border"
          style={{
            background: past ? 'rgba(255,255,255,0.04)' : 'rgba(16,255,139,0.08)',
            borderColor: past ? 'rgba(255,255,255,0.1)' : 'rgba(16,255,139,0.3)',
          }}
        >
          {d ? (
            <>
              <span className="text-xs font-mono font-bold leading-tight" style={{ color: past ? '#666' : '#10FF8B' }}>
                {d.toLocaleString('en-GB', { day: '2-digit', month: 'short' })}
              </span>
              <span className="text-xs font-mono leading-tight" style={{ color: past ? '#444' : 'rgba(16,255,139,0.6)' }}>
                {d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </>
          ) : <Calendar size={18} className="text-muted-foreground" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {past && (
              <span className="text-xs font-mono tracking-wider px-2 py-0.5 rounded"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#666', border: '1px solid rgba(255,255,255,0.08)' }}>
                ENDED
              </span>
            )}
            {!past && (
              <span className="text-xs font-mono tracking-wider px-2 py-0.5 rounded"
                style={{ background: 'rgba(16,255,139,0.1)', color: '#10FF8B', border: '1px solid rgba(16,255,139,0.25)' }}>
                UPCOMING
              </span>
            )}
            {ev.game && <span className="text-xs font-mono" style={{ color: '#D4AF37' }}>{ev.game}</span>}
            {server && (
              <span className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                <Server size={10} /> {server.name}
              </span>
            )}
          </div>
          <h4 className="text-white font-heading font-bold text-base leading-tight">{ev.title}</h4>
          {ev.description && (
            <p className="text-gray-400 text-xs leading-relaxed mt-1 line-clamp-2">{ev.description}</p>
          )}
        </div>

        {/* Discord link */}
        {ev.discord_link && (
          <a
            href={ev.discord_link}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider rounded transition-all"
            style={{ border: '1px solid rgba(16,255,139,0.35)', color: '#10FF8B', background: 'rgba(16,255,139,0.08)' }}
          >
            <ExternalLink size={12} /> JOIN
          </a>
        )}
      </div>
    </motion.div>
  );
}