import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SectionHeading from '@/components/ui/SectionHeading';

const ROLES = ['Moderator', 'Admin', 'Developer', 'Event Host', 'Content Creator', 'Other'];

export default function Recruitment() {
  const [form, setForm] = useState({
    player_name: '', discord_tag: '', age: '', role_applying: 'Moderator',
    games_played: '', experience: '', why_join: '', availability: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await base44.entities.Recruitment.create({ ...form, age: form.age ? Number(form.age) : undefined, status: 'Pending' });
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="pt-24 pb-20 min-h-screen flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(16,255,139,0.1)', border: '1px solid rgba(16,255,139,0.3)' }}>
            <CheckCircle size={32} style={{ color: '#10FF8B' }} />
          </div>
          <h2 className="text-white font-heading font-bold text-2xl mb-3">Application Submitted</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Thanks for applying to join the ApexOrder team! We'll review your application and get back to you via Discord within a few days.
          </p>
          <a href="/" className="inline-block mt-6 text-xs font-mono tracking-wider px-6 py-2.5 rounded"
            style={{ background: 'rgba(16,255,139,0.1)', border: '1px solid rgba(16,255,139,0.3)', color: '#10FF8B' }}>
            BACK TO HOME
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading title="Join the Team" subtitle="RECRUITMENT" />

        {/* Role selector */}
        <div className="mb-8">
          <p className="text-xs font-mono tracking-wider text-center mb-4" style={{ color: '#10FF8B' }}>SELECT ROLE</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ROLES.map(role => (
              <button key={role} type="button" onClick={() => setForm(f => ({ ...f, role_applying: role }))}
                className="py-3 px-4 rounded-lg text-sm font-semibold tracking-wide transition-all"
                style={form.role_applying === role
                  ? { background: 'rgba(16,255,139,0.12)', border: '1px solid rgba(16,255,139,0.4)', color: '#10FF8B' }
                  : { background: 'rgba(10,20,10,0.6)', border: '1px solid rgba(255,255,255,0.08)', color: '#666' }
                }>
                {role}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono tracking-wider mb-1.5" style={{ color: '#10FF8B' }}>IN-GAME NAME *</label>
              <input required value={form.player_name} onChange={set('player_name')}
                className="w-full px-3 py-2.5 text-sm rounded outline-none"
                style={{ background: 'rgba(10,20,10,0.8)', border: '1px solid rgba(16,255,139,0.2)', color: '#e5e5e5' }} />
            </div>
            <div>
              <label className="block text-xs font-mono tracking-wider mb-1.5" style={{ color: '#10FF8B' }}>DISCORD TAG *</label>
              <input required value={form.discord_tag} onChange={set('discord_tag')} placeholder="user#0000"
                className="w-full px-3 py-2.5 text-sm rounded outline-none"
                style={{ background: 'rgba(10,20,10,0.8)', border: '1px solid rgba(16,255,139,0.2)', color: '#e5e5e5' }} />
            </div>
            <div>
              <label className="block text-xs font-mono tracking-wider mb-1.5" style={{ color: '#10FF8B' }}>AGE</label>
              <input type="number" value={form.age} onChange={set('age')} min="13" max="99"
                className="w-full px-3 py-2.5 text-sm rounded outline-none"
                style={{ background: 'rgba(10,20,10,0.8)', border: '1px solid rgba(16,255,139,0.2)', color: '#e5e5e5' }} />
            </div>
            <div>
              <label className="block text-xs font-mono tracking-wider mb-1.5" style={{ color: '#10FF8B' }}>WEEKLY AVAILABILITY (hrs)</label>
              <input value={form.availability} onChange={set('availability')} placeholder="e.g. 10-15 hours"
                className="w-full px-3 py-2.5 text-sm rounded outline-none"
                style={{ background: 'rgba(10,20,10,0.8)', border: '1px solid rgba(16,255,139,0.2)', color: '#e5e5e5' }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono tracking-wider mb-1.5" style={{ color: '#10FF8B' }}>GAMES PLAYED ON APEXORDER</label>
            <input value={form.games_played} onChange={set('games_played')} placeholder="e.g. DayZ, 7 Days to Die"
              className="w-full px-3 py-2.5 text-sm rounded outline-none"
              style={{ background: 'rgba(10,20,10,0.8)', border: '1px solid rgba(16,255,139,0.2)', color: '#e5e5e5' }} />
          </div>
          <div>
            <label className="block text-xs font-mono tracking-wider mb-1.5" style={{ color: '#10FF8B' }}>RELEVANT EXPERIENCE</label>
            <textarea rows={3} value={form.experience} onChange={set('experience')}
              placeholder="Previous moderation, development, or community management experience"
              className="w-full px-3 py-2.5 text-sm rounded outline-none resize-none"
              style={{ background: 'rgba(10,20,10,0.8)', border: '1px solid rgba(16,255,139,0.2)', color: '#e5e5e5' }} />
          </div>
          <div>
            <label className="block text-xs font-mono tracking-wider mb-1.5" style={{ color: '#10FF8B' }}>WHY DO YOU WANT TO JOIN? *</label>
            <textarea required rows={5} value={form.why_join} onChange={set('why_join')}
              placeholder="Tell us why you want to be part of the ApexOrder team and what you'd bring to the community."
              className="w-full px-3 py-2.5 text-sm rounded outline-none resize-none"
              style={{ background: 'rgba(10,20,10,0.8)', border: '1px solid rgba(16,255,139,0.2)', color: '#e5e5e5' }} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 font-bold text-sm tracking-[0.2em] rounded transition-all disabled:opacity-50"
            style={{ background: 'rgba(16,255,139,0.15)', border: '1px solid #10FF8B', color: '#10FF8B' }}>
            {loading ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}
          </button>
        </form>
      </div>
    </div>
  );
}