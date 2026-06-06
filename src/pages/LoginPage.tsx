import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, rtdb, db } from '../lib/firebase';
import { getDoc } from '../lib/firestore';
import { ref, get } from 'firebase/database';
import { collection, getCountFromServer } from 'firebase/firestore';
import VanillaTilt from 'vanilla-tilt';
import gsap from 'gsap';
import { useTextScramble } from '../hooks/useTextScramble';
import { useTypewriter } from '../hooks/useTypewriter';
import { 
  Home, Wifi, Flame, Music2, BarChart2, 
  Shield, Users, Sparkles, ChevronRight, AlertCircle,
  User as UserIcon, MessageSquare, Tv
} from 'lucide-react';

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

const TAGLINES = [
  "Where chismis flows freely. 👀",
  "The group chat, but better.",
  "Kanta, kwento, kain. All in one place.",
  "Your feed. Your rules. Your people.",
  "Barkada mode: activated. 🏘️"
];

export const LoginPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [totalNeighbors, setTotalNeighbors] = useState<number | null>(null);
  const navigate = useNavigate();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const buttonWrapperRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const heroRef = useRef<HTMLDivElement>(null);
  const pillsRef = useRef<HTMLDivElement>(null);
  const cardWrapperRef = useRef<HTMLDivElement>(null);

  const scrambledTitle = useTextScramble('The Real Neighbors', 300);
  const { displayText, isTyping } = useTypewriter({ texts: TAGLINES });

  // Fetch online count
  useEffect(() => {
    const fetchOnlineCount = async () => {
      try {
        const snapshot = await get(ref(rtdb, 'presence'));
        if (snapshot.exists()) {
          const data = snapshot.val();
          let count = 0;
          for (const key in data) {
            if (data[key].online) count++;
          }
          if (count > 0) setOnlineCount(count);
        }
      } catch (e) {
        console.error('Failed to fetch online presence count:', e);
      }
    };
    fetchOnlineCount();
  }, []);

  // Fetch total users count
  useEffect(() => {
    const fetchTotalCount = async () => {
      try {
        const coll = collection(db, 'users');
        const snapshot = await getCountFromServer(coll);
        setTotalNeighbors(snapshot.data().count);
      } catch (e) {
        console.error('Failed to fetch total users count:', e);
      }
    };
    fetchTotalCount();
  }, []);

  // 1. Sparkle Trail
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;

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
        p.vy += 0.05;

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
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${e.clientX - 300}px, ${e.clientY - 300}px)`;
      }

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
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    if (cardRef.current && !isMobile) {
      VanillaTilt.init(cardRef.current, {
        max: 6,
        speed: 400,
        glare: true,
        'max-glare': 0.08,
        scale: 1.01,
        perspective: 1200,
      });
    }

    const tl = gsap.timeline();
    
    if (heroRef.current) {
      tl.fromTo(
        heroRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.2 }
      );
    }
    
    if (pillsRef.current) {
      tl.fromTo(
        pillsRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5 },
        0.7
      );
    }

    if (cardWrapperRef.current) {
      tl.fromTo(
        cardWrapperRef.current,
        { opacity: 0, x: isMobile ? 0 : 20, y: isMobile ? 20 : 0 },
        { opacity: 1, x: 0, y: 0, duration: 0.5, ease: 'power2.out' },
        0.8
      );
    }

    if (subtitleRef.current && bottomRef.current) {
      tl.fromTo(
        [subtitleRef.current, bottomRef.current],
        { opacity: 0 },
        { opacity: 1, duration: 0.4 },
        1.1
      );
    }

    if (buttonWrapperRef.current) {
      tl.fromTo(
        buttonWrapperRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' },
        1.3
      );
    }

    const cardNode = cardRef.current;
    return () => {
      if (cardNode && (cardNode as any).vanillaTilt) {
        (cardNode as any).vanillaTilt.destroy();
      }
    };
  }, []);

  const handleGoogleLogin = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
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
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.97); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-50px, 30px) scale(1.08); }
        }
        @keyframes orbFloat3 {
          0%, 100% { transform: translate(0, 0); }
          40% { transform: translate(30px, -40px); }
          80% { transform: translate(-20px, 20px); }
        }
        @keyframes orbFloat4 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-30px, -25px); }
        }
        
        @keyframes cardFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }

        .animate-orb1 { animation: orbFloat1 20s ease-in-out infinite; }
        .animate-orb2 { animation: orbFloat2 25s ease-in-out infinite; }
        .animate-orb3 { animation: orbFloat3 18s ease-in-out infinite; }
        .animate-orb4 { animation: orbFloat4 22s ease-in-out infinite; }
        
        .float-card-1 { animation: cardFloat 6s ease-in-out infinite 0s; }
        .float-card-2 { animation: cardFloat 7s ease-in-out infinite 1s; }
        .float-card-3 { animation: cardFloat 5.5s ease-in-out infinite 0.5s; }
        .float-card-4 { animation: cardFloat 6.5s ease-in-out infinite 1.5s; }
        .float-card-5 { animation: cardFloat 7.5s ease-in-out infinite 0.8s; }
        
        @keyframes bentoIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .bento-card {
          opacity: 0;
          animation: bentoIn 400ms ease-out forwards;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .cursor-blink { animation: blink 0.6s infinite; }
        
        .js-tilt-glare { border-radius: 28px; }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 400ms ease-out; }
        
        @keyframes glowPulseNew {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.02); }
        }
        .animate-glow-ring-new {
          animation: glowPulseNew 3s ease-in-out infinite;
        }

        @keyframes dividerOpacityPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .animate-divider-new {
          animation: dividerOpacityPulse 3s ease-in-out infinite;
        }
        
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .animate-ping-slow { animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
      `}</style>

      {/* Shared top accent line */}
      <div 
        className="fixed top-0 left-0 right-0 h-[2px] z-[100] pointer-events-none"
        style={{
          background: 'linear-gradient(to right, transparent 0%, rgba(139,92,246,0.8) 30%, rgba(236,72,153,0.6) 50%, rgba(139,92,246,0.8) 70%, transparent 100%)'
        }}
      />

      <div className="relative min-h-screen bg-[#0a0812] flex flex-col md:flex-row overflow-hidden font-sans">
        
        {/* Background Layers */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div 
            className="absolute inset-0" 
            style={{
              backgroundImage: `
                radial-gradient(ellipse 600px 500px at 20% 30%, rgba(88,28,135,0.6) 0%, transparent 70%),
                radial-gradient(ellipse 500px 600px at 80% 20%, rgba(168,85,247,0.4) 0%, transparent 70%),
                radial-gradient(ellipse 700px 400px at 60% 80%, rgba(37,99,235,0.3) 0%, transparent 70%),
                radial-gradient(ellipse 400px 500px at 10% 80%, rgba(219,39,119,0.25) 0%, transparent 70%)
              `
            }}
          />
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`, backgroundSize: '200px 200px' }} />
          
          <div className="absolute top-[-5%] left-[10%] w-[600px] h-[600px] rounded-full animate-orb1" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15), transparent)' }} />
          <div className="absolute top-[50%] right-[-5%] w-[500px] h-[500px] rounded-full animate-orb2" style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.1), transparent)' }} />
          <div className="absolute bottom-[10%] left-[25%] w-[400px] h-[400px] rounded-full animate-orb3" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.1), transparent)' }} />
          <div className="absolute bottom-[-5%] right-[20%] w-[350px] h-[350px] rounded-full animate-orb4" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.12), transparent)' }} />
          
          {/* New 5th orb for center coverage */}
          <div className="fixed top-[40%] left-[50%] w-[800px] h-[400px]" style={{ background: 'radial-gradient(ellipse, rgba(88,28,135,0.08), transparent)', transform: 'translate(-50%, -50%)' }} />
          
          <div 
            ref={glowRef}
            className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full hidden md:block"
            style={{
              background: 'radial-gradient(circle, rgba(120,80,255,0.15) 0%, transparent 70%)',
              transform: 'translate(-500px, -500px)',
              willChange: 'transform'
            }}
          />
          
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        </div>

        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10 hidden md:block" />

        {/* LEFT PANEL */}
        <div className="relative z-10 w-full md:w-[55%] min-h-screen flex flex-col justify-center order-2 md:order-1 overflow-y-auto">
          
          {/* App Branding - Absolute Positioned */}
          <div className="hidden md:flex items-center gap-2 absolute top-[24px] left-[40px] z-20">
            <Home size={20} className="text-primary" />
            <span className="font-heading font-bold text-sm text-white/80">The Real Neighbors</span>
          </div>

          {/* Main Content Centered Container */}
          <div className="w-full max-w-[520px] mx-auto px-6 py-8 md:px-[40px] md:py-0 flex flex-col pt-16 md:pt-0">

            {/* Hero Text */}
            <div ref={heroRef} className="mt-4 md:mt-0">
              <div className="text-white/40 text-xs font-medium tracking-[0.25em] uppercase mb-3">
                PRIVATE · INVITE ONLY
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold leading-[1.15]">
                <div className="text-white/60">Your barkada's</div>
                <div className="text-white">private corner</div>
                <div className="text-primary">of the internet.</div>
              </h2>
              <div className="text-white/50 text-base md:text-lg font-normal mb-8 mt-4 h-[28px]">
                {displayText}
                <span className={`ml-[1px] ${!isTyping ? 'cursor-blink' : ''}`}>|</span>
              </div>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-2 gap-3 w-full">
              {/* Card 1: Feed */}
              <div className="col-span-2 h-[160px] md:h-[160px] p-4 bg-white/5 backdrop-blur-[8px] border border-white/10 rounded-2xl overflow-hidden cursor-default bento-card relative float-card-1" style={{ animationDelay: '600ms', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
                    <UserIcon size={12} className="text-white/80" />
                  </div>
                  <span className="text-white/80 text-xs font-medium">A Neighbor</span>
                  <span className="text-white/40 text-[10px] md:text-xs">just now</span>
                </div>
                <p className="text-white/70 text-sm mb-3">Frieren episode 28 grabe 😭</p>
                <div className="flex gap-1">
                  <div className="bg-white/10 rounded-full px-2 py-0.5 text-[10px] md:text-xs text-white/80">🔥 3</div>
                  <div className="bg-white/10 rounded-full px-2 py-0.5 text-[10px] md:text-xs text-white/80">😂 1</div>
                  <div className="bg-white/10 rounded-full px-2 py-0.5 text-[10px] md:text-xs text-white/80">💀 2</div>
                </div>
              </div>

              {/* Card 2: Online */}
              <div className="col-span-1 h-[120px] p-4 bg-white/5 backdrop-blur-[8px] border border-white/10 rounded-2xl overflow-hidden cursor-default bento-card float-card-2" style={{ animationDelay: '700ms', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                <div className="flex items-center gap-1.5 mb-3">
                  <Wifi size={12} className="text-green-400" />
                  <span className="text-white/50 text-[10px] md:text-xs uppercase tracking-wide">Who's Online</span>
                </div>
                <div className="flex items-center mb-2">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center mr-2">
                    <UserIcon size={10} className="text-white/70" />
                  </div>
                  <span className="text-white/70 text-[10px] md:text-xs">Neighbor 1</span>
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full ml-auto"></div>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center mr-2">
                    <UserIcon size={10} className="text-white/70" />
                  </div>
                  <span className="text-white/70 text-[10px] md:text-xs">Neighbor 2</span>
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full ml-auto"></div>
                </div>
              </div>

              {/* Card 3: Streak */}
              <div className="col-span-1 h-[120px] p-4 bg-white/5 backdrop-blur-[8px] border border-white/10 rounded-2xl overflow-hidden cursor-default text-center bento-card flex flex-col justify-center float-card-3" style={{ animationDelay: '800ms', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                <Flame size={24} className="text-orange-400 mx-auto mb-1" />
                <div className="font-bold text-xl md:text-2xl text-white">12</div>
                <div className="text-white/50 text-[10px] md:text-xs">day streak 🔥</div>
              </div>

              {/* Card 4: Playlist */}
              <div className="col-span-1 h-[110px] p-4 bg-white/5 backdrop-blur-[8px] border border-white/10 rounded-2xl overflow-hidden cursor-default bento-card float-card-4" style={{ animationDelay: '900ms', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                <div className="flex items-center gap-1 mb-2">
                  <Music2 size={12} className="text-primary md:w-[14px] md:h-[14px]" />
                  <span className="text-white/50 text-[10px] md:text-xs">Now Vibing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-pink-500 shrink-0"></div>
                  <div className="truncate text-white/70 text-[10px] md:text-xs font-medium">Late Night Playlist</div>
                </div>
                <div className="text-white/40 text-[9px] md:text-xs mt-1">Someone is vibing 🎵</div>
              </div>

              {/* Card 5: Poll */}
              <div className="col-span-1 h-[110px] p-4 bg-white/5 backdrop-blur-[8px] border border-white/10 rounded-2xl overflow-hidden cursor-default bento-card float-card-5" style={{ animationDelay: '1000ms', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <BarChart2 size={12} className="text-primary" />
                  <span className="text-white/50 text-[10px] md:text-xs uppercase tracking-wide">POLL</span>
                </div>
                <div className="text-white/70 text-[10px] md:text-xs mb-2 truncate">Saan kayo kumain?</div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="bg-primary/30 h-1.5 md:h-2 rounded w-3/4"></div>
                  <span className="text-white/40 text-[9px] md:text-xs">75%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-white/10 h-1.5 md:h-2 rounded w-1/4"></div>
                  <span className="text-white/40 text-[9px] md:text-xs">25%</span>
                </div>
              </div>
            </div>
            
            {/* Bottom Section */}
            <div className="mt-4 flex flex-col gap-6 pb-12 md:pb-0">
              
              {/* Feature highlights */}
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-primary" />
                  <div className="flex flex-col">
                    <span className="text-white/50 text-sm font-medium leading-tight">Group Chat</span>
                    <span className="text-white/30 text-xs">Channels & DMs</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Tv size={16} className="text-primary" />
                  <div className="flex flex-col">
                    <span className="text-white/50 text-sm font-medium leading-tight">Watchlist</span>
                    <span className="text-white/30 text-xs">Anime, movies & more</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Music2 size={16} className="text-primary" />
                  <div className="flex flex-col">
                    <span className="text-white/50 text-sm font-medium leading-tight">Playlists</span>
                    <span className="text-white/30 text-xs">Share your vibe</span>
                  </div>
                </div>
              </div>

              {/* A. Live member count */}
              {onlineCount !== null && (
                <div>
                  <div className="inline-flex items-center gap-2 bg-white/8 border border-white/10 rounded-full px-4 py-2 text-white/60 text-sm">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </div>
                    {onlineCount} neighbor{onlineCount !== 1 ? 's' : ''} online right now
                  </div>
                </div>
              )}

              {/* C. Testimonial */}
              <div className="bg-white/5 border border-white/8 rounded-2xl px-5 py-4 backdrop-blur-sm flex items-start gap-3 w-full">
                <span className="font-heading text-4xl text-primary leading-none mt-[-4px] flex-shrink-0">"</span>
                <div>
                  <p className="text-white/60 text-sm italic mb-2">
                    Finally, a place for our group that isn't just a WhatsApp thread.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-white/15 rounded-full flex items-center justify-center">
                      <UserIcon size={10} className="text-white/60" />
                    </div>
                    <span className="text-white/30 text-xs">— A Real Neighbor</span>
                  </div>
                </div>
              </div>
              
              {/* Feature stat pills */}
              <div ref={pillsRef} className="flex flex-row flex-wrap gap-2">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5 text-white/60 text-[10px] md:text-xs flex items-center gap-1.5">
                  <Home size={10} /> Private & invite only
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5 text-white/60 text-[10px] md:text-xs flex items-center gap-1.5">
                  <Shield size={10} /> Firebase secured
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5 text-white/60 text-[10px] md:text-xs flex items-center gap-1.5">
                  <Users size={10} /> For your barkada only
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5 text-white/60 text-[10px] md:text-xs flex items-center gap-1.5">
                  <Sparkles size={10} /> AI-powered by NBOT
                </div>
              </div>
              
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div 
          className="relative z-10 w-full md:w-[45%] flex items-center justify-center p-6 md:p-8 order-1 md:order-2 md:h-screen"
          style={{
            borderLeft: window.innerWidth >= 768 ? '1px solid rgba(139,92,246,0.25)' : 'none',
            boxShadow: window.innerWidth >= 768 ? 'inset 1px 0 20px rgba(139,92,246,0.1)' : 'none'
          }}
        >
          {/* Glowing Vertical Divider Pseudo-element */}
          <div 
            className="absolute hidden md:block pointer-events-none animate-divider-new"
            style={{
              left: 0,
              top: '10%',
              height: '80%',
              width: '1px',
              background: 'linear-gradient(to bottom, transparent, rgba(139,92,246,0.8) 25%, rgba(236,72,153,0.5) 50%, rgba(139,92,246,0.8) 75%, transparent)',
              boxShadow: '0 0 16px rgba(139,92,246,0.5), 0 0 32px rgba(139,92,246,0.2)'
            }}
          />

          <div ref={cardWrapperRef} className="w-full max-w-[400px] relative">
            
            {/* Animated Glow Ring Behind Card */}
            <div 
              className="absolute inset-[-1px] rounded-[30px] z-[-1] animate-glow-ring-new"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.5), rgba(236,72,153,0.3), rgba(59,130,246,0.4))',
                filter: 'blur(20px)',
                opacity: 0.7
              }} 
            />

            <div 
              ref={cardRef}
              className="flex flex-col items-center p-8 md:px-10 md:py-12 select-none"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(32px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.05) inset, 0 32px 64px rgba(0,0,0,0.5), 0 0 80px rgba(139,92,246,0.08)',
                borderRadius: '28px',
              }}
            >
              {/* App Icon */}
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.6), rgba(236,72,153,0.4))',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(4px)'
                }}
              >
                <Home size={24} className="text-white" />
              </div>

              <div className="mb-2">
                <span className="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-white/50 text-xs tracking-[0.15em] uppercase">
                  Private · Invite Only
                </span>
              </div>

              <h1 
                className="text-2xl md:text-3xl font-heading font-bold text-white mb-2 text-center"
                style={{ textShadow: '0 0 30px rgba(139,92,246,0.4)' }}
              >
                {scrambledTitle.map((item, i) => (
                  <span key={i} style={{ opacity: item.resolved ? 1 : 0.4 }}>
                    {item.char}
                  </span>
                ))}
              </h1>

              <p ref={subtitleRef} className="text-sm text-white/50 mb-6 text-center">
                No algorithms. No ads. Just your people.
              </p>

              <div className="w-full border-t border-white/10 mb-6"></div>

              <div ref={buttonWrapperRef} className="w-full relative">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-3 px-8 py-3.5 rounded-full font-semibold text-sm transition-all duration-200 focus:outline-none disabled:opacity-80 disabled:cursor-not-allowed"
                  style={{
                    background: 'rgba(255,255,255,0.95)',
                    color: '#1a1a2e',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)'
                  }}
                  onMouseEnter={e => {
                    if (isSubmitting) return;
                    e.currentTarget.style.background = 'rgba(255,255,255,1)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
                    e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)';
                  }}
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>{isSubmitting ? 'Signing in...' : 'Continue with Google'}</span>
                  {isSubmitting ? (
                    <div className="w-4 h-4 ml-auto border-2 border-[#1a1a2e]/30 border-t-[#1a1a2e] rounded-full animate-spin"></div>
                  ) : (
                    <ChevronRight size={14} className="ml-auto opacity-50" />
                  )}
                </button>
              </div>

              {/* Trusted by X neighbors */}
              <div ref={bottomRef} className="w-full flex flex-col items-center mt-2">
                <div className="flex items-center gap-3 w-full my-4">
                  <div className="flex-1 border-t border-white/15"></div>
                  <span className="text-white/20 text-xs">or</span>
                  <div className="flex-1 border-t border-white/15"></div>
                </div>
                
                <div className="flex items-center justify-center gap-2">
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full border border-white/20 bg-white/10 flex items-center justify-center z-30 relative">
                      <UserIcon size={10} className="text-white/50" />
                    </div>
                    <div className="w-6 h-6 rounded-full border border-white/20 bg-white/10 flex items-center justify-center -ml-[8px] z-20 relative">
                      <UserIcon size={10} className="text-white/50" />
                    </div>
                    <div className="w-6 h-6 rounded-full border border-white/20 bg-white/10 flex items-center justify-center -ml-[8px] z-10 relative">
                      <UserIcon size={10} className="text-white/50" />
                    </div>
                  </div>
                  <span className="text-white/60 font-medium text-xs">
                    {totalNeighbors !== null ? `+ ${totalNeighbors} neighbors inside` : '+ A few neighbors inside'}
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="mt-6 flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl w-full animate-shake">
                  <AlertCircle size={14} className="text-red-400 shrink-0" />
                  <span className="text-sm text-red-300 font-medium">{errorMsg}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Strip */}
      <div className="fixed bottom-0 left-0 right-0 h-12 z-[5] pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.3))' }}>
        <div className="absolute bottom-2 left-0 right-0 flex items-center justify-between px-8 pointer-events-auto">
          <span className="text-white/15 text-xs">v1.0.0</span>
          <span className="text-white/15 text-xs">Built by CyberSphinxxx 🏘️</span>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
