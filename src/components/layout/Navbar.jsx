import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';

const navLinks = [
  { label: 'HOME', path: '/' },
  {
    label: 'SERVERS',
    path: '/servers',
    dropdown: [
      { label: 'Events', path: '/events' }
    ]
  },
  {
    label: 'COMMUNITY',
    path: '/community',
    dropdown: [
      { label: 'Stats', path: '/stats' },
      { label: 'Rules', path: '/rules' },
      { label: 'Ban Appeal', path: '/ban-appeal' },
      { label: 'Recruitment', path: '/recruitment' }
    ]
  },
  {
    label: 'NEWS',
    path: '/news',
    dropdown: [
      { label: 'Changelog', path: '/changelog' }
    ]
  },
  { label: 'PROJECTS', path: '/projects' },
  { label: 'STORE', path: '/store' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setIsOpen(false); }, [location]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'backdrop-blur-xl' : 'backdrop-blur-sm'
      }`}
      style={{
        background: scrolled
          ? 'linear-gradient(to bottom, rgba(0,0,0,0.92) 50%, rgba(0,0,0,0) 100%)'
          : 'linear-gradient(to bottom, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0) 100%)',
        ...(isHome && { paddingBottom: '100px', marginBottom: '-100px' }),
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 lg:h-16">
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative w-9 h-9 flex items-center justify-center">
              <svg viewBox="0 0 40 40" className="w-9 h-9 absolute">
                <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="none" stroke="#D4AF37" strokeWidth="1.5" opacity="0.8" />
                <polygon points="20,6 32,13 32,27 20,34 8,27 8,13" fill="rgba(16,255,139,0.06)" stroke="rgba(16,255,139,0.3)" strokeWidth="0.5" />
              </svg>
              <span className="relative z-10 text-emerald-glow font-black text-base" style={{textShadow:'0 0 10px #10FF8B'}}>A</span>
            </div>
            <div className="flex items-center gap-0">
              <span className="text-white font-heading font-bold text-xl tracking-[0.15em]">APEX</span>
              <span className="font-heading font-bold text-xl tracking-[0.15em]" style={{color:'#10FF8B', textShadow:'0 0 12px rgba(16,255,139,0.6)'}}>ORDER</span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-0">
            {navLinks.map(link => (
              <div key={link.label} className="relative group">
                <Link
                  to={link.path}
                  className={`px-4 py-2 text-xs font-bold tracking-[0.15em] transition-all duration-300 flex items-center gap-1 ${
                    location.pathname === link.path ? 'text-emerald-glow' : 'text-gray-400 hover:text-white'
                  }`}
                  style={location.pathname === link.path ? { color: '#10FF8B', textShadow: '0 0 10px rgba(16,255,139,0.5)' } : {}}
                >
                  {link.label}
                  {link.dropdown && <ChevronDown size={12} className="opacity-60" />}
                </Link>
                {link.dropdown && (
                  <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="bg-black/95 backdrop-blur-xl border border-emerald-glow/20 rounded min-w-[160px]">
                      {link.dropdown.map(sub => (
                        <Link key={sub.path} to={sub.path} className="block px-4 py-2.5 text-xs font-bold tracking-wider text-gray-400 hover:text-emerald-glow hover:bg-emerald-glow/5 transition-colors first:rounded-t last:rounded-b">
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono tracking-wider" style={{color:'#D4AF37'}}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor:'#10FF8B', boxShadow:'0 0 6px #10FF8B'}} />
              SINCE 2007
            </div>
            <a
              href="https://discord.gg/apexorder"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 font-bold text-xs tracking-[0.2em] rounded transition-all duration-300"
              style={{ border: '1px solid #10FF8B', color: '#10FF8B', boxShadow: '0 0 12px rgba(16,255,139,0.2), inset 0 0 12px rgba(16,255,139,0.05)' }}
            >
              JOIN US
            </a>
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden p-2 text-white hover:text-emerald-glow transition-colors" aria-label="Toggle menu">
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden bg-black/95 backdrop-blur-xl border-t border-emerald-glow/10">
          <div className="px-4 py-6 space-y-1">
            {navLinks.map(link => (
              <div key={link.label}>
                <Link to={link.path} className="block px-4 py-3 text-sm font-bold tracking-wider text-gray-400 hover:text-white rounded transition-colors">{link.label}</Link>
                {link.dropdown && (
                  <div className="pl-8 space-y-1">
                    {link.dropdown.map(sub => (
                      <Link key={sub.path} to={sub.path} className="block px-4 py-2 text-xs font-bold tracking-wider text-gray-500 hover:text-emerald-glow transition-colors">{sub.label}</Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-4 border-t border-gray-800 mt-4">
              <a href="https://discord.gg/apexorder" target="_blank" rel="noopener noreferrer" className="block text-center px-5 py-3 border border-emerald-glow/50 text-emerald-glow font-bold text-sm tracking-wider rounded">JOIN US</a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
