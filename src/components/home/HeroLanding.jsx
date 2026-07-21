import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Server, Users, BarChart2, Box, Calendar, Users2, MessageSquare } from 'lucide-react';

/* ─── Lightning canvas overlay ──────────────────────────────── */
function generateBolt(x1, y1, x2, y2, roughness = 0.5, depth = 0) {
  if (depth > 7) return [[x1, y1], [x2, y2]];
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const offset = (Math.random() - 0.5) * len * roughness;
  const nx = -dy / len;
  const ny = dx / len;
  const midX = mx + nx * offset;
  const midY = my + ny * offset;
  return [
    ...generateBolt(x1, y1, midX, midY, roughness * 0.75, depth + 1),
    ...generateBolt(midX, midY, x2, y2, roughness * 0.75, depth + 1).slice(1),
  ];
}

// Draw a single bolt path with all its render layers
function drawBolt(ctx, points, opacity, lineWidthMultiplier = 1) {
  const draw = (color, width, blur = 0) => {
    ctx.save();
    if (blur > 0) { ctx.shadowColor = '#10FF8B'; ctx.shadowBlur = blur; }
    ctx.strokeStyle = color;
    ctx.lineWidth = width * lineWidthMultiplier;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    points.forEach(([px, py], i) => i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py));
    ctx.stroke();
    ctx.restore();
  };
  // Wide outer glow
  draw(`rgba(16,255,139,${opacity * 0.18})`, 18, 30);
  // Mid glow
  draw(`rgba(16,255,139,${opacity * 0.4})`, 7, 16);
  // Inner glow
  draw(`rgba(16,255,139,${opacity * 0.75})`, 3, 6);
  // Core bright
  draw(`rgba(16,255,139,${opacity * 0.95})`, 1.5);
  // White-hot center
  draw(`rgba(220,255,235,${opacity * 0.85})`, 0.6);
}

function LightningCanvas({ cardRefs, logoRef }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const strikesRef = useRef([]);

  const scheduleStrikes = useCallback(() => {
    const count = Math.random() < 0.35 ? 2 : 1;
    const indices = [...Array(6).keys()].sort(() => Math.random() - 0.5).slice(0, count);
    const now = performance.now();
    indices.forEach(idx => {
      const flashes = Math.floor(Math.random() * 3) + 1;
      for (let f = 0; f < flashes; f++) {
        strikesRef.current.push({
          cardIndex: idx,
          startTime: now + f * (35 + Math.random() * 55),
          duration: 100 + Math.random() * 150,
          // pre-generate branch offset so it's stable per flash
          branchSeed: Math.random(),
        });
      }
    });
    animRef.current = setTimeout(scheduleStrikes, 600 + Math.random() * 1600);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    animRef.current = setTimeout(scheduleStrikes, 600);

    let rafId;
    const draw = (now) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!logoRef.current) { rafId = requestAnimationFrame(draw); return; }

      const logoRect = logoRef.current.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      const lx = logoRect.left + logoRect.width / 2 - canvasRect.left;
      const ly = logoRect.top + logoRect.height / 2 - canvasRect.top;
      // Offset origin to logo edge (radius ~90px) toward the target
      const LOGO_RADIUS = 90;

      strikesRef.current = strikesRef.current.filter(s => {
        const age = now - s.startTime;
        if (age < 0) return true;

        const cardEl = cardRefs.current[s.cardIndex];
        if (!cardEl) return false;
        const cardRect = cardEl.getBoundingClientRect();
        const isLeft = s.cardIndex < 3;
        const tx = isLeft ? cardRect.right - canvasRect.left : cardRect.left - canvasRect.left;
        const ty = cardRect.top + cardRect.height / 2 - canvasRect.top;

        // Origin sits on the logo's edge, pointing toward the card
        const angle = Math.atan2(ty - ly, tx - lx);
        const ox = lx + Math.cos(angle) * LOGO_RADIUS;
        const oy = ly + Math.sin(angle) * LOGO_RADIUS;

        const progress = age / s.duration;
        if (progress > 1) return false;

        // Sharp flash-in, hold, then fade out
        const opacity = progress < 0.15
          ? progress / 0.15
          : progress < 0.55
            ? 1
            : Math.pow(1 - (progress - 0.55) / 0.45, 1.5);

        // Main bolt
        const points = generateBolt(ox, oy, tx, ty, 0.5);
        drawBolt(ctx, points, opacity);

        // 1-2 branches off a mid-segment
        const branchCount = s.branchSeed > 0.5 ? 2 : 1;
        for (let b = 0; b < branchCount; b++) {
          const startIdx = Math.floor(points.length * (0.25 + b * 0.2));
          const [bx, by] = points[startIdx] || [ox, oy];
          // Branch endpoint: offset perpendicularly + toward target
          const bLen = 0.35 + Math.random() * 0.25;
          const bex = bx + (tx - ox) * bLen + (Math.random() - 0.5) * 60;
          const bey = by + (ty - oy) * bLen + (Math.random() - 0.5) * 60;
          const branchPts = generateBolt(bx, by, bex, bey, 0.6);
          drawBolt(ctx, branchPts, opacity * 0.55, 0.7);
        }

        // Origin pulse (behind logo edge)
        const pulseR = (progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7) * 28 * opacity;
        if (pulseR > 0) {
          const og = ctx.createRadialGradient(ox, oy, 0, ox, oy, pulseR);
          og.addColorStop(0, `rgba(16,255,139,${opacity * 0.9})`);
          og.addColorStop(0.4, `rgba(16,255,139,${opacity * 0.3})`);
          og.addColorStop(1, 'rgba(16,255,139,0)');
          ctx.save(); ctx.fillStyle = og;
          ctx.beginPath(); ctx.arc(ox, oy, pulseR, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }

        // Impact flash at card connector dot
        if (progress < 0.45) {
          const flashR = (1 - progress / 0.45) * 28 * opacity;
          const ig = ctx.createRadialGradient(tx, ty, 0, tx, ty, flashR);
          ig.addColorStop(0, `rgba(180,255,220,${opacity})`);
          ig.addColorStop(0.3, `rgba(16,255,139,${opacity * 0.7})`);
          ig.addColorStop(1, 'rgba(16,255,139,0)');
          ctx.save(); ctx.fillStyle = ig;
          ctx.beginPath(); ctx.arc(tx, ty, flashR, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }

        return true;
      });

      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [scheduleStrikes, cardRefs, logoRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 15 }}
    />
  );
}

/* ─── Hexagon clipped panel ─────────────────────────────────── */
function HexPanel({ icon: Icon, title, description, cta, ctaLink, delay = 0, side = 'left', index = 0, cardRef }) {
  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, x: side === 'left' ? -40 : 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay }}
      className="relative group"
    >
      {/* Outer border box with clipped corners */}
      <div
        className="relative p-[1px] transition-all duration-500 group-hover:shadow-lg"
        style={{
          clipPath: 'polygon(12px 0%, 100% 0%, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0% 100%, 0% 12px)',
          background: 'linear-gradient(135deg, rgba(212,175,55,0.5), rgba(16,255,139,0.15), rgba(212,175,55,0.1))',
          boxShadow: '0 0 20px rgba(16,255,139,0.08)',
        }}
      >
        <div
          className="relative px-3 py-3 sm:px-5 sm:py-5 transition-all duration-500 group-hover:bg-opacity-90"
          style={{
            clipPath: 'polygon(12px 0%, 100% 0%, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0% 100%, 0% 12px)',
            background: 'linear-gradient(135deg, rgba(8,20,8,0.97), rgba(10,25,10,0.95))',
            minWidth: 150,
            maxWidth: 180,
          }}
        >
          {/* Corner accent dots */}
          <div className="absolute top-2 right-2 w-1 h-1 rounded-full" style={{backgroundColor:'#10FF8B', boxShadow:'0 0 4px #10FF8B'}} />
          <div className="absolute bottom-2 left-2 w-0.5 h-0.5 rounded-full" style={{backgroundColor:'rgba(16,255,139,0.4)'}} />

          {/* Icon */}
          <div className="mb-2">
            <Icon size={18} style={{color:'#10FF8B', filter:'drop-shadow(0 0 4px rgba(16,255,139,0.6))'}} />
          </div>

          {/* Title */}
          <h3
            className="font-heading font-bold text-xs tracking-[0.18em] mb-1.5"
            style={{color:'#10FF8B', textShadow:'0 0 8px rgba(16,255,139,0.4)'}}
          >
            {title}
          </h3>

          {/* Description */}
          <p className="text-gray-400 text-xs leading-relaxed mb-3 line-clamp-3" style={{fontSize:'0.65rem'}}>
            {description}
          </p>

          {/* CTA button */}
          <Link to={ctaLink}>
            <div
              className="inline-block px-2.5 py-1 text-xs font-bold tracking-wider cursor-pointer transition-all duration-300 group-hover:text-white"
              style={{
                clipPath: 'polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)',
                border: '1px solid rgba(16,255,139,0.3)',
                color: 'rgba(200,220,200,0.8)',
                fontSize: '0.6rem',
                letterSpacing: '0.12em',
                backgroundColor: 'rgba(16,255,139,0.04)',
              }}
            >
              {cta}
            </div>
          </Link>
        </div>
      </div>

      {/* Connecting dot on the edge facing center */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full z-20 lg:w-2.5 lg:h-2.5"
        style={{
          [side === 'left' ? 'right' : 'left']: side === 'left' ? -10 : -10,
          backgroundColor: '#10FF8B',
          boxShadow: '0 0 8px #10FF8B, 0 0 16px rgba(16,255,139,0.5)',
        }}
      />
    </motion.div>
  );
}

/* ─── Values bar item ────────────────────────────────────────── */
function ValueItem({ icon, label, text }) {
  return (
    <div
      className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 flex-1 min-w-[140px]"
      style={{
        borderRight: '1px solid rgba(212,175,55,0.15)',
        minWidth: 0,
      }}
    >
      <div className="shrink-0 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-bold tracking-[0.15em] sm:tracking-[0.18em] mb-0.5" style={{color:'#D4AF37', textShadow:'0 0 8px rgba(212,175,55,0.4)'}}>
          {label}
        </div>
        <div className="text-gray-500 leading-tight" style={{fontSize:'0.6rem'}}>
          {text}
        </div>
      </div>
    </div>
  );
}

/* ─── Discord status widget ─────────────────────────────────── */
function DiscordStatus() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.6 }}
      className="w-full max-w-xs mt-6"
    >
      <div
        className="p-[1px]"
        style={{
          clipPath: 'polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)',
          background: 'linear-gradient(135deg, rgba(88,101,242,0.4), rgba(16,255,139,0.1))',
        }}
      >
        <div
          className="px-4 py-3"
          style={{
            clipPath: 'polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)',
            background: 'rgba(8,15,8,0.95)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(88,101,242,0.15)', border: '1px solid rgba(88,101,242,0.3)' }}>
              <MessageSquare size={18} style={{ color: '#5865F2' }} />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold tracking-[0.15em]" style={{ color: '#5865F2' }}>DISCORD</div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-2 h-2 rounded-full" style={{ background: '#10FF8B', boxShadow: '0 0 6px #10FF8B' }} />
                <span className="text-gray-400 text-xs">Online Now</span>
              </div>
            </div>
            <a
              href="https://discord.gg/apexorder"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs font-bold tracking-wider rounded transition-all"
              style={{
                background: 'rgba(88,101,242,0.2)',
                border: '1px solid rgba(88,101,242,0.4)',
                color: '#5865F2',
              }}
            >
              JOIN
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── SVG Logo emblem ────────────────────────────────────────── */
function ApexEmblem() {
  return (
    <div className="relative flex items-center justify-center w-full" style={{height: 'auto', minHeight: 320}}>
      {/* Outer glow ring */}
      <div
        className="absolute rounded-full breathe w-[280px] h-[280px] sm:w-[380px] sm:h-[380px]"
        style={{
          background: 'radial-gradient(circle, rgba(16,255,139,0.12) 0%, rgba(16,255,139,0.04) 50%, transparent 70%)',
          boxShadow: '0 0 80px rgba(16,255,139,0.15), 0 0 160px rgba(16,255,139,0.06)',
        }}
      />

      {/* Radar ring 1 */}
      <div
        className="absolute rounded-full w-[240px] h-[240px] sm:w-[340px] sm:h-[340px]"
        style={{
          border: '1px solid rgba(16,255,139,0.12)',
        }}
      />
      {/* Radar ring 2 */}
      <div
        className="absolute rounded-full w-[180px] h-[180px] sm:w-[260px] sm:h-[260px]"
        style={{
          border: '1px solid rgba(16,255,139,0.08)',
        }}
      />

      {/* Main logo image */}
      <img
        src="https://media.base44.com/images/public/6a300cbaaf30e01d8fac639e/c82772277_ChatGPT_Image_Jun_16__2026__08_53_25_AM.png"
        alt="ApexOrder Emblem"
        className="relative select-none w-[260px] h-[260px] sm:w-[360px] sm:h-[360px]"
        style={{ zIndex: 30, objectFit: 'contain', mixBlendMode: 'screen', filter: 'drop-shadow(0 0 50px rgba(16,255,139,0.6)) drop-shadow(0 0 100px rgba(16,255,139,0.25))' }}
        draggable={false}
      />

      {/* Ground glow */}
      <div
        className="absolute bottom-4 w-[140px] h-[40px] sm:w-[200px] sm:h-[60px]"
        style={{
          background: 'radial-gradient(ellipse, rgba(16,255,139,0.35) 0%, transparent 70%)',
          filter: 'blur(8px)',
        }}
      />
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export default function HeroLanding() {
  const cardRefs = useRef([null, null, null, null, null, null]);
  const logoRef = useRef(null);
  const leftPanels = [
    {
      icon: Server,
      title: 'SERVERS',
      description: 'Our home for epic adventures and unforgettable moments.',
      cta: '0 ACTIVE',
      ctaLink: '/servers',
      delay: 0.1,
    },
    {
      icon: Users,
      title: 'COMMUNITY',
      description: 'A community built on respect, loyalty and shared passion.',
      cta: 'JOIN THE FAMILY',
      ctaLink: '/community',
      delay: 0.2,
    },
    {
      icon: BarChart2,
      title: 'STATS',
      description: 'Our journey in numbers. Growing stronger every day.',
      cta: 'VIEW STATS',
      ctaLink: '/stats',
      delay: 0.3,
    },
  ];

  const rightPanels = [
    {
      icon: Box,
      title: 'PROJECTS',
      description: 'Building the future. Innovating, creating and developing.',
      cta: '0 ACTIVE',
      ctaLink: '/projects',
      delay: 0.1,
    },
    {
      icon: Calendar,
      title: 'EVENTS',
      description: 'Community events and activities. More memories await.',
      cta: 'VIEW EVENTS',
      ctaLink: '/events',
      delay: 0.2,
    },
    {
      icon: Users2,
      title: 'PARTNERS',
      description: 'We are stronger together. Trusted partnerships.',
      cta: 'COMING SOON',
      ctaLink: '/community',
      delay: 0.3,
    },
  ];

  return (
    <div
      className="relative flex flex-col"
      style={{ minHeight: '100dvh' }}
    >
      {/* Full-bleed background image */}
      <div className="fixed inset-0" style={{ zIndex: 0 }}>
        <img
          src="https://media.base44.com/images/public/6a300cbaaf30e01d8fac639e/3b03f022f_generated_image.png"
          alt=""
          style={{ opacity: 0.55, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
        {/* Dark overlay gradients */}
        <div className="absolute inset-0" style={{background:'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,30,0,0.4) 0%, rgba(3,8,3,0.85) 70%, rgba(3,8,3,0.98) 100%)'}} />
        <div className="absolute inset-0" style={{background:'linear-gradient(to bottom, rgba(3,8,3,0.7) 0%, transparent 20%, transparent 75%, rgba(3,8,3,1) 100%)'}} />
      </div>

      {/* Scan line subtle overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{backgroundImage:'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)', opacity:0.5}} />

      {/* ── Main content ── */}
      <div className="relative z-10 flex-1 flex flex-col pt-12 sm:pt-16">

        {/* ── Three-column layout ── */}
        <div className="flex-1 flex items-center justify-center px-3 sm:px-4 py-6 sm:py-8">
          <div className="w-full max-w-7xl mx-auto">
            <div className="relative grid grid-cols-1 lg:grid-cols-[220px_1fr_220px] gap-4 sm:gap-6 items-center">
              {/* Lightning canvas — spans the whole grid */}
              <LightningCanvas cardRefs={cardRefs} logoRef={logoRef} />

              {/* Left panels */}
              <div className="hidden lg:flex flex-col gap-5 items-end relative">
                {leftPanels.map((panel, i) => (
                  <HexPanel key={panel.title} {...panel} side="left" index={i} cardRef={el => cardRefs.current[i] = el} />
                ))}
              </div>

              {/* Center: Logo + Mission */}
              <div className="flex flex-col items-center">
                <div ref={logoRef} className="w-full flex justify-center">
                  <ApexEmblem />
                </div>

                {/* Mission box */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.5 }}
                  className="relative w-full max-w-md mt-2 sm:mt-4"
                >
                  <div
                    className="p-[1px]"
                    style={{
                      clipPath: 'polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)',
                      background: 'linear-gradient(135deg, rgba(212,175,55,0.4), rgba(16,255,139,0.1))',
                    }}
                  >
                    <div
                      className="px-4 py-4 sm:px-6 sm:py-5 text-center"
                      style={{
                        clipPath: 'polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)',
                        background: 'rgba(5,12,5,0.92)',
                      }}
                    >
                      {/* Header line */}
                      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3">
                        <div className="h-px flex-1" style={{background:'linear-gradient(to right, transparent, rgba(212,175,55,0.5))'}} />
                        <span className="text-xs font-bold tracking-[0.2em] sm:tracking-[0.25em]" style={{color:'#D4AF37', fontSize:'0.6rem'}}>OUR MISSION</span>
                        <div className="h-px flex-1" style={{background:'linear-gradient(to left, transparent, rgba(212,175,55,0.5))'}} />
                      </div>

                      <p className="text-gray-300 text-xs sm:text-sm leading-relaxed" style={{fontSize:'0.75rem'}}>
                        To create unforgettable gaming experiences and bring people together through passion, dedication and a shared love for the game.
                      </p>

                      <div className="mt-3 pt-3 sm:mt-4 sm:pt-4" style={{borderTop:'1px solid rgba(16,255,139,0.1)'}}>
                        <p className="text-gray-400 leading-relaxed" style={{fontSize:'0.7rem'}}>
                          After some time away, <span style={{color:'#10FF8B'}}>we're back</span> — and bigger than ever. We've returned with a renewed vision: custom-built servers, hand-crafted mod packs, and experiences designed from the ground up by the community, for the community.
                        </p>
                      </div>

                      {/* Small diamond */}
                      <div className="mt-4 flex justify-center">
                        <div className="w-3 h-3 rotate-45" style={{background:'linear-gradient(135deg, #D4AF37, rgba(212,175,55,0.3))', boxShadow:'0 0 8px rgba(212,175,55,0.5)'}} />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Mobile panels */}
                <div className="lg:hidden mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-lg">
                  {[...leftPanels, ...rightPanels].map(panel => (
                    <HexPanel key={panel.title} {...panel} side="left" />
                  ))}
                </div>
              </div>

              {/* Right panels */}
              <div className="hidden lg:flex flex-col gap-5 items-start relative">
                {rightPanels.map((panel, i) => (
                  <HexPanel key={panel.title} {...panel} side="right" index={i} cardRef={el => cardRefs.current[i + 3] = el} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Values bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="relative z-10 mt-auto"
        >
          <div
            className="mx-3 mb-3 p-[1px]"
            style={{
              background: 'linear-gradient(90deg, rgba(212,175,55,0.5), rgba(16,255,139,0.2), rgba(212,175,55,0.5))',
            }}
          >
            <div
              className="flex flex-wrap justify-center sm:flex-nowrap"
              style={{background: 'rgba(4,9,4,0.96)'}}
            >
              <ValueItem
                icon={<svg viewBox="0 0 24 24" className="w-6 h-6" fill="none"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z" stroke="#D4AF37" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" fill="rgba(212,175,55,0.3)" stroke="#D4AF37" strokeWidth="1"/></svg>}
                label="LOYALTY"
                text="We stand by our community."
              />
              <ValueItem
                icon={<svg viewBox="0 0 24 24" className="w-6 h-6" fill="none"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="#D4AF37" strokeWidth="1.5" fill="rgba(212,175,55,0.2)"/></svg>}
                label="QUALITY"
                text="Excellence in everything we do."
              />
              <ValueItem
                icon={<svg viewBox="0 0 24 24" className="w-6 h-6" fill="none"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7l3-7z" stroke="#D4AF37" strokeWidth="1.5" fill="rgba(212,175,55,0.15)"/></svg>}
                label="LEADERSHIP"
                text="Leading the way since 2007."
              />
              <ValueItem
                icon={<svg viewBox="0 0 24 24" className="w-6 h-6" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="#D4AF37" strokeWidth="1.5" fill="rgba(212,175,55,0.15)"/></svg>}
                label="RESPECT"
                text="Respect is the foundation of our community."
              />
              <ValueItem
                icon={<svg viewBox="0 0 24 24" className="w-6 h-6" fill="none"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z" stroke="#D4AF37" strokeWidth="1.2"/><path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" stroke="#D4AF37" strokeWidth="1.2"/><path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z" stroke="#D4AF37" strokeWidth="1.2"/><path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z" stroke="#D4AF37" strokeWidth="1.2"/><path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z" stroke="#D4AF37" strokeWidth="1.2"/><path d="M15.5 9H14V7.5c0-.83.67-1.5 1.5-1.5" stroke="#D4AF37" strokeWidth="1.2"/><path d="M10 9.5c0 .83-.67 1.5-1.5 1.5H3c-.83 0-1.5-.67-1.5-1.5S2.17 8 3 8h6.5c.83 0 1.5.67 1.5 1.5z" stroke="#D4AF37" strokeWidth="1.2"/><path d="M8.5 15H10v1.5c0 .83-.67 1.5-1.5 1.5" stroke="#D4AF37" strokeWidth="1.2"/></svg>}
                label="PASSION"
                text="Fuelled by passion, driven to succeed."
              />
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}