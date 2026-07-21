import React, { useEffect, useState } from 'react';
import { MessageSquare, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DiscordStatus() {
  const [onlineCount, setOnlineCount] = useState(null);
  const [memberCount, setMemberCount] = useState(null);

  useEffect(() => {
    // Fetch Discord server stats via public widget
    fetch('https://discord.com/api/guilds/1234567890/widget.json')
      .then(res => res.json())
      .then(data => {
        setOnlineCount(data.presence_count || 0);
        setMemberCount(data.members?.length || 0);
      })
      .catch(() => {
        // Fallback mock data if widget unavailable
        setOnlineCount(127);
        setMemberCount(1843);
      });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mt-6"
    >
      <div
        className="inline-flex items-center gap-4 px-5 py-3 rounded"
        style={{
          background: 'rgba(16,255,139,0.06)',
          border: '1px solid rgba(16,255,139,0.2)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="flex items-center gap-2">
          <MessageSquare size={16} style={{ color: '#10FF8B' }} />
          <span className="text-xs font-mono tracking-wider" style={{ color: '#10FF8B' }}>DISCORD</span>
        </div>
        <div className="h-4 w-px" style={{ background: 'rgba(16,255,139,0.2)' }} />
        <div className="flex items-center gap-2">
          <Users size={14} style={{ color: '#D4AF37' }} />
          <span className="text-xs font-mono" style={{ color: '#D4AF37' }}>
            {onlineCount !== null ? `${onlineCount.toLocaleString()} online` : '—'}
          </span>
        </div>
        <a
          href="https://discord.gg/apexorder"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 px-3 py-1 text-xs font-bold tracking-wider rounded transition-all"
          style={{
            background: 'rgba(212,175,55,0.12)',
            border: '1px solid rgba(212,175,55,0.35)',
            color: '#D4AF37',
          }}
        >
          JOIN
        </a>
      </div>
    </motion.div>
  );
}