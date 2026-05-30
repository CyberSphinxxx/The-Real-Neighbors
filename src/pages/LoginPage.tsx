import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import toast from 'react-hot-toast';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  angle: number;
  speed: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  shape: 'rect' | 'circle';
}

const COLORS = [
  'var(--color-primary)',
  'var(--color-secondary)',
  'var(--color-accent)',
  'var(--color-danger)',
  'var(--color-success)',
];

function makeParticle(id: number, width: number, height: number): Particle {
  return {
    id,
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 5 + 3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    angle: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.4 + 0.15,
    opacity: Math.random() * 0.6 + 0.3,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 1.2,
    shape: Math.random() > 0.4 ? 'rect' : 'circle',
  };
}

export const LoginPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Resolve CSS variable colors at runtime
    const getVar = (v: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(v.replace('var(', '').replace(')', '')).trim();

    const resolvedColors = COLORS.map(getVar);

    const COUNT = 90;
    particlesRef.current = Array.from({ length: COUNT }, (_, i) =>
      makeParticle(i, canvas.width, canvas.height)
    );

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = resolvedColors[COLORS.indexOf(p.color)] ?? p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size * 1.5, p.size, p.size * 3);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Drift
        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed;
        p.rotation += p.rotationSpeed;

        // Wrap edges
        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;
        if (p.y < -20) p.y = canvas.height + 20;
        if (p.y > canvas.height + 20) p.y = -20;
      });

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const handleGoogleLogin = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (error: any) {
      let errorMessage = 'An error occurred during sign in.';
      if (error.code === 'auth/popup-closed-by-user') errorMessage = 'Sign in was cancelled.';
      else if (error.code === 'auth/user-disabled') errorMessage = 'This account has been disabled.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-base flex items-center justify-center overflow-hidden">
      {/* Particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-lg w-full select-none">

        {/* Wordmark */}
        <div className="mb-2">
          <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-muted">Private · Invite Only</span>
        </div>

        <h1
          className="text-6xl sm:text-7xl font-heading font-bold text-main leading-tight tracking-tight mb-4"
          style={{ letterSpacing: '-0.03em' }}
        >
          The Real<br />Neighbors
        </h1>

        <p className="text-base text-muted mb-12 max-w-xs">
          Your group's private corner of the internet.
        </p>

        {/* Google Sign in */}
        <button
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="group relative flex items-center gap-3 px-6 py-3.5 rounded-full font-semibold text-sm text-main bg-surface border border-border transition-all duration-300 hover:border-primary hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 40px rgba(0,0,0,0.15), 0 0 0 1px var(--color-primary)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)')}
        >
          {/* Shimmer sweep on hover */}
          <span className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </span>

          {/* Google G */}
          <svg className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>

          <span>
            {isSubmitting ? 'Signing in…' : 'Continue with Google'}
          </span>

          <svg
            className="w-4 h-4 text-muted transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <p className="mt-8 text-xs text-faint">
          Don't have access? Ask an admin to add you.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
