import React, { useState } from 'react';
import Stats from './Stats';
import DayZStats from './DayZStats.jsx';

export default function CommunityStatsHub() {
  const [game, setGame] = useState('7dtd');

  return (
    <div>
      <div className="fixed top-16 left-0 right-0 z-40 pointer-events-none">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <div className="pointer-events-auto flex rounded overflow-hidden border border-emerald-glow/20 bg-black/85 backdrop-blur-xl shadow-xl">
            <button onClick={() => setGame('7dtd')} className="px-5 py-2 text-xs font-bold tracking-[0.16em] transition-all" style={game === '7dtd' ? { background: 'rgba(16,255,139,0.14)', color: '#10FF8B' } : { color: '#777' }}>7 DAYS TO DIE</button>
            <button onClick={() => setGame('dayz')} className="px-5 py-2 text-xs font-bold tracking-[0.16em] transition-all border-l border-emerald-glow/15" style={game === 'dayz' ? { background: 'rgba(16,255,139,0.14)', color: '#10FF8B' } : { color: '#777' }}>DAYZ</button>
          </div>
        </div>
      </div>
      {game === 'dayz' ? <DayZStats /> : <Stats />}
    </div>
  );
}
