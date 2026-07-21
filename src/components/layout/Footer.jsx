import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="relative border-t border-emerald-glow/10 bg-obsidian">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 relative">
                <div className="absolute inset-0 bg-emerald-glow/20 rounded-lg rotate-45" />
                <div className="absolute inset-1 bg-obsidian rounded-sm rotate-45" />
                <span className="absolute inset-0 flex items-center justify-center text-emerald-glow font-black text-sm">A</span>
              </div>
              <div>
                <span className="text-foreground font-heading font-bold tracking-widest">APEX</span>
                <span className="text-emerald-glow font-heading font-bold tracking-widest">ORDER</span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              A premier gaming community forged by gamers since 2007. Building legendary experiences across multiple titles.
            </p>
            <div className="flex items-center gap-2 font-mono text-xs text-gold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-glow" />
              OPERATIONAL SINCE 2007
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-foreground font-semibold text-sm tracking-wider mb-4">NAVIGATE</h4>
            <ul className="space-y-2">
              {[
                { label: 'Home', path: '/' },
                { label: 'News', path: '/news' },
                { label: 'Servers', path: '/servers' },
                { label: 'Events', path: '/events' },
                { label: 'Projects', path: '/projects' },
                { label: 'Changelog', path: '/changelog' },
              ].map(link => (
                <li key={link.path}>
                  <Link to={link.path} className="text-muted-foreground hover:text-emerald-glow text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Servers */}
          <div>
            <h4 className="text-foreground font-semibold text-sm tracking-wider mb-4">SERVERS</h4>
            <ul className="space-y-2">
              {['7 Days to Die', 'FiveM', 'Valheim', 'Minecraft', 'DayZ'].map(server => (
                <li key={server}>
                  <Link to="/servers" className="text-muted-foreground hover:text-emerald-glow text-sm transition-colors">
                    {server}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-foreground font-semibold text-sm tracking-wider mb-4">CONNECT</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://discord.gg/apexorder" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-emerald-glow text-sm transition-colors">
                  Discord
                </a>
              </li>
              <li>
                <a href="https://apexorder.uk" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-emerald-glow text-sm transition-colors">
                  apexorder.uk
                </a>
              </li>
              <li>
                <Link to="/ban-appeal" className="text-muted-foreground hover:text-emerald-glow text-sm transition-colors">
                  Ban Appeals
                </Link>
              </li>
              <li>
                <Link to="/recruitment" className="text-muted-foreground hover:text-emerald-glow text-sm transition-colors">
                  Join the Team
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-xs font-mono">
            © {new Date().getFullYear()} APEXORDER.UK — ALL RIGHTS RESERVED
          </p>
          <div className="flex items-center gap-6">
            {['LOYALTY', 'QUALITY', 'LEADERSHIP', 'RESPECT', 'PASSION'].map(value => (
              <span key={value} className="text-xs font-mono text-muted-foreground/50 hidden md:inline">
                {value}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}