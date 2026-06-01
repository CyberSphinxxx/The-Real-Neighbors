import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { getDoc } from '../lib/firestore';
import VanillaTilt from 'vanilla-tilt';
import gsap from 'gsap';
import { useTextScramble } from '../hooks/useTextScramble';

const EMOJIS = ['🎮', '🍜', '🎵', '👀', '🔥', '🏘️', '😄', '🎬', '🎲', '🌙'];
const FLOATING_EMOJIS = Array.from({ length: 15 }).map((_, i) => ({
  id: i,
  emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
  left: `${5 + Math.random() * 90}%`,
  bottom: `-${20 + Math.random() * 20}%`,
  fontSize: `${16 + Math.random() * 12}px`,
  duration: `${8 + Math.random() * 12}s`,
  delay: `-${Math.random() * 10}s`,
  opacity: 0.15 + Math.random() * 0.25,
  swayAmp: 10 + Math.random() * 20,
}));

interface Sparkle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

const SPARKLE_COLORS = [
  'rgba(139,92,246,0.9)',
  'rgba(59,130,246,0.9)',
  'rgba(236,72,153,0.9)',
  'rgba(16,185,129,0.9)',
  'rgba(245,158,11,0.9)',
];

export const LoginPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const buttonWrapperRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const bottomRef = useRef<HTMLParagraphElement>(null);

  const scrambledTitle = useTextScramble('The Real Neighbors', 300);

  // 1. Sparkle Trail
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

    const sparkles: Sparkle[] = [];
    let animFrame = 0;

    const onMouseMove = (e: MouseEvent) => {
      for (let i = 0; i < 4; i++) {
        sparkles.push({
          x: e.clientX,
          y: e.clientY,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 0,
          maxLife: 40 + Math.random() * 20,
          size: 2 + Math.random() * 2,
          color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
        });
      }
    };
    window.addEventListener('mousemove', onMouseMove);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const p = sparkles[i];
        p.life++;
        if (p.life >= p.maxLife) {
          sparkles.splice(i, 1);
          continue;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity

        const progress = p.life / p.maxLife;
        const currentSize = p.size * (1 - progress);
        const opacity = 1 - progress;

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.beginPath();
        ctx.arc(0, 0, currentSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      animFrame = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animFrame);
    };
  }, []);

  // 2. Glow Follow & Magnetic Button
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Glow
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${e.clientX - 300}px, ${e.clientY - 300}px)`;
      }

      // Magnetic Button
      if (buttonWrapperRef.current) {
        const rect = buttonWrapperRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distanceX = e.clientX - centerX;
        const distanceY = e.clientY - centerY;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

        if (distance < 80) {
          buttonWrapperRef.current.style.transform = `translate(${distanceX * 0.35}px, ${distanceY * 0.35}px)`;
          buttonWrapperRef.current.style.transition = 'transform 0.1s ease';
        } else {
          buttonWrapperRef.current.style.transform = 'translate(0px, 0px)';
          buttonWrapperRef.current.style.transition = 'transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94)';
        }
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 3. Vanilla Tilt & GSAP Animations
  useEffect(() => {
    if (cardRef.current) {
      VanillaTilt.init(cardRef.current, {
        max: 8,
        speed: 400,
        glare: true,
        'max-glare': 0.15,
        scale: 1.02,
        perspective: 1000,
      });
    }

    const tl = gsap.timeline();
    tl.fromTo(
      cardRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.2 }
    )
    .fromTo(
      subtitleRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.4 },
      "+=0.8"
    )
    .fromTo(
      buttonWrapperRef.current,
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' },
      "-=0.2"
    )
    .fromTo(
      bottomRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.3 },
      "-=0.2"
    );

    return () => {
      if (cardRef.current && (cardRef.current as any).vanillaTilt) {
        (cardRef.current as any).vanillaTilt.destroy();
      }
    };
  }, []);

  const handleGoogleLogin = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Whitelist check
      const allowedEmailDoc = await getDoc<any>('allowedEmails', [result.user.email!]);
      if (!allowedEmailDoc) {
        await auth.signOut();
        setErrorMsg("Access denied. Contact the admin.");
        setIsSubmitting(false);
        return;
      }

      navigate('/');
    } catch (error: any) {
      let msg = 'An error occurred during sign in.';
      if (error.code === 'auth/popup-closed-by-user') msg = 'Sign in was cancelled.';
      else if (error.code === 'auth/user-disabled') msg = 'This account has been disabled.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes aurora {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .bg-aurora {
          background: linear-gradient(-45deg, #0a0a1a, #1a0a2e, #0d1b4b, #0a2a3a);
          background-size: 400% 400%;
          animation: aurora 12s ease-in-out infinite;
        }
        @keyframes float-up {
          0% { transform: translate(0, 0); opacity: 0; }
          25% { transform: translate(var(--sway), -27.5vh); opacity: var(--max-opacity); }
          50% { transform: translate(0, -55vh); }
          75% { transform: translate(calc(var(--sway) * -1), -82.5vh); opacity: var(--max-opacity); }
          100% { transform: translate(0, -110vh); opacity: 0; }
        }
        .js-tilt-glare {
          border-radius: 24px;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>

      <div className="relative min-h-screen bg-aurora flex items-center justify-center overflow-hidden">
        
        {/* Glow Follow */}
        <div 
          ref={glowRef}
          className="fixed top-0 left-0 w-[600px] h-[600px] rounded-full pointer-events-none z-0"
          style={{
            background: 'radial-gradient(circle, rgba(120,80,255,0.15) 0%, transparent 70%)',
            transform: 'translate(-500px, -500px)',
            willChange: 'transform'
          }}
        />

        {/* Floating Emojis */}
        {FLOATING_EMOJIS.map((item) => (
          <span
            key={item.id}
            className="fixed pointer-events-none z-5"
            style={{
              left: item.left,
              bottom: item.bottom,
              fontSize: item.fontSize,
              animation: `float-up ${item.duration} linear infinite`,
              animationDelay: item.delay,
              '--sway': `${item.swayAmp}px`,
              '--max-opacity': item.opacity,
            } as React.CSSProperties}
          >
            {item.emoji}
          </span>
        ))}

        {/* Sparkle Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />

        {/* Login Card */}
        <div className="relative z-20 px-4 w-full max-w-[480px]">
          <div 
            ref={cardRef}
            className="flex flex-col items-center text-center p-10 md:px-12 md:py-12 select-none"
            style={{
              background: 'rgba(255, 255, 255, 0.07)',
              backdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset, 0 0 60px rgba(120, 80, 255, 0.1)',
              borderRadius: '24px',
            }}
          >
            <div className="mb-4">
              <span 
                className="text-white uppercase font-medium"
                style={{ opacity: 0.5, letterSpacing: '0.2em', fontSize: '11px' }}
              >
                Private · Invite Only
              </span>
            </div>

            <h1 
              className="text-4xl md:text-5xl font-heading font-bold text-white mb-2 leading-tight"
              style={{ textShadow: '0 0 40px rgba(139, 92, 246, 0.5)' }}
            >
              {scrambledTitle.map((item, i) => (
                <span 
                  key={i} 
                  style={{ opacity: item.resolved ? 1 : 0.4 }}
                >
                  {item.char}
                </span>
              ))}
            </h1>

            <p 
              ref={subtitleRef}
              className="text-sm text-white mb-10"
              style={{ opacity: 0.6 }} // Overridden by GSAP but sets base styling intention
            >
              Your group's private corner of the internet.
            </p>

            <div ref={buttonWrapperRef} className="will-change-transform z-30 inline-block">
              <button
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="group relative flex items-center justify-center gap-3 px-8 py-3 rounded-full font-semibold text-sm transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'white',
                  color: '#1a1a2e',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)'
                }}
                onMouseEnter={e => {
                  if (isSubmitting) return;
                  e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)';
                }}
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>{isSubmitting ? 'Signing in…' : 'Continue with Google'}</span>
              </button>
            </div>

            {errorMsg && (
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-red-300 animate-shake w-full px-2">
                <span className="text-base shrink-0">⚠️</span>
                <span className="font-medium text-left">{errorMsg}</span>
              </div>
            )}

            <p 
              ref={bottomRef}
              className="mt-6 text-xs text-white"
              style={{ opacity: 0.35 }}
            >
              Don't have access? Ask an admin to add you.
            </p>
          </div>
        </div>

      </div>
    </>
  );
};

export default LoginPage;
