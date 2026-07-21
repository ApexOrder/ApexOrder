import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SectionHeading from '@/components/ui/SectionHeading';

export default function BanAppeal() {
  const [form, setForm] = useState({
    player_name: '', discord_tag: '', game: '', server: '', ban_reason: '', appeal_text: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await base44.entities.BanAppeal.create({ ...form, status: 'Pending' });
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
          <h2 className="text-white font-heading font-bold text-2xl mb-3">Appeal Submitted</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Your ban appeal has been received. Our moderation team will review it within 48 hours. Please be patient and avoid submitting duplicate appeals.
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
        <SectionHeading title="Ban Appeal" subtitle="REQUEST REVIEW" />

        <div className="p-6 rounded-xl mb-8 flex items-start gap-4"
          style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}>
          <Shield size={20} style={{ color: '#D4AF37', flexShrink: 0, marginTop: 2 }} />
          <p className="text-sm text-gray-400 leading-relaxed">
            Fill this form honestly. Providing false information will result in immediate denial. One appeal per ban — duplicates are automatically declined.
          </p>
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
              <label className="block text-xs font-mono tracking-wider mb-1.5" style={{ color: '#10FF8B' }}>GAME *</label>
              <input required value={form.game} onChange={set('game')} placeholder="e.g. DayZ"
                className="w-full px-3 py-2.5 text-sm rounded outline-none"
                style={{ background: 'rgba(10,20,10,0.8)', border: '1px solid rgba(16,255,139,0.2)', color: '#e5e5e5' }} />
            </div>
            <div>
              <label className="block text-xs font-mono tracking-wider mb-1.5" style={{ color: '#10FF8B' }}>SERVER</label>
              <input value={form.server} onChange={set('server')} placeholder="Server name"
                className="w-full px-3 py-2.5 text-sm rounded outline-none"
                style={{ background: 'rgba(10,20,10,0.8)', border: '1px solid rgba(16,255,139,0.2)', color: '#e5e5e5' }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono tracking-wider mb-1.5" style={{ color: '#10FF8B' }}>BAN REASON (as shown)</label>
            <input value={form.ban_reason} onChange={set('ban_reason')} placeholder="What reason was displayed when you were banned?"
              className="w-full px-3 py-2.5 text-sm rounded outline-none"
              style={{ background: 'rgba(10,20,10,0.8)', border: '1px solid rgba(16,255,139,0.2)', color: '#e5e5e5' }} />
          </div>
          <div>
            <label className="block text-xs font-mono tracking-wider mb-1.5" style={{ color: '#10FF8B' }}>APPEAL STATEMENT *</label>
            <textarea required rows={6} value={form.appeal_text} onChange={set('appeal_text')}
              placeholder="Explain why you believe the ban was unjust, or why you deserve a second chance. Be honest and respectful."
              className="w-full px-3 py-2.5 text-sm rounded outline-none resize-none"
              style={{ background: 'rgba(10,20,10,0.8)', border: '1px solid rgba(16,255,139,0.2)', color: '#e5e5e5' }} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 font-bold text-sm tracking-[0.2em] rounded transition-all disabled:opacity-50"
            style={{ background: 'rgba(16,255,139,0.15)', border: '1px solid #10FF8B', color: '#10FF8B' }}>
            {loading ? 'SUBMITTING...' : 'SUBMIT APPEAL'}
          </button>
        </form>
      </div>
    </div>
  );
}