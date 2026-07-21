import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ParticleBackground from './ParticleBackground';

export default function SiteLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen relative">
      {!isHome && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <img
            src="https://media.base44.com/images/public/6a300cbaaf30e01d8fac639e/3b03f022f_generated_image.png"
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: 0.45, minWidth: '100%', minHeight: '100vh', position: 'absolute', top: 0, left: 0 }}
          />
          <div className="absolute inset-0" style={{background:'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,30,0,0.4) 0%, rgba(3,8,3,0.85) 70%, rgba(3,8,3,0.98) 100%)'}} />
          <div className="absolute inset-0" style={{background:'linear-gradient(to bottom, rgba(3,8,3,0.7) 0%, transparent 20%, transparent 75%, rgba(3,8,3,1) 100%)'}} />
        </div>
      )}
      {!isHome && <ParticleBackground />}
      <Navbar />
      <main className="relative z-10">
        <Outlet />
      </main>
      {!isHome && <Footer />}
    </div>
  );
}
