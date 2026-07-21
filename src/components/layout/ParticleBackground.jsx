import React, { useEffect, useRef } from 'react';

export default function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedY = -(Math.random() * 0.3 + 0.1);
        this.speedX = (Math.random() - 0.5) * 0.2;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.isGold = Math.random() > 0.8;
      }
      update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.opacity += (Math.random() - 0.5) * 0.02;
        this.opacity = Math.max(0.05, Math.min(0.6, this.opacity));
        if (this.y < -10) this.reset();
        if (this.y < -10) this.y = canvas.height + 10;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        const color = this.isGold ? `rgba(212,175,55,${this.opacity})` : `rgba(16,255,139,${this.opacity})`;
        ctx.fillStyle = color;
        ctx.shadowBlur = this.size * 4;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    for (let i = 0; i < 60; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}