import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { getDoc, setDoc, updateDoc } from '../../lib/firestore';
import { useAuthStore } from '../../stores/authStore';
import type { User } from '../../types';
import toast from 'react-hot-toast';
import { Home } from 'lucide-react';

const LOADING_MESSAGES = [
  "Getting things ready...",
  "Loading your feed...",
  "Almost there...",
  "Checking your access..."
];

const AuthLoadingScreen = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 800);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 50% 40% at 15% 20%, rgba(88,28,135,0.45) 0%, transparent 100%),
            radial-gradient(ellipse 40% 35% at 85% 15%, rgba(139,92,246,0.3) 0%, transparent 100%),
            radial-gradient(ellipse 45% 40% at 10% 85%, rgba(219,39,119,0.2) 0%, transparent 100%),
            radial-gradient(ellipse 50% 45% at 80% 80%, rgba(37,99,235,0.25) 0%, transparent 100%),
            radial-gradient(ellipse 60% 50% at 50% 50%, rgba(88,28,135,0.12) 0%, transparent 100%)
          `
        }}
      />

      <div className="fixed inset-0 pointer-events-none z-[1]" style={{ opacity: 0.035 }}>
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <filter id="authNoiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#authNoiseFilter)" />
        </svg>
      </div>

      <div 
        className="fixed inset-0 pointer-events-none z-[2]" 
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.06,
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
        }}
      />

      <style>
        {`
          @keyframes authCenterGlow {
            0%, 100% { transform: translate(-50%,-50%) scale(1); }
            50% { transform: translate(-50%,-50%) scale(1.2); }
          }
          @keyframes authDotPulse {
            0%, 60%, 100% { transform: scale(0.6); opacity: 0.3; }
            30% { transform: scale(1); opacity: 1; }
          }
          @keyframes authSlideUpFade {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes authSimpleFade {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes authIconFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
          }
        `}
      </style>
      <div 
        className="absolute top-1/2 left-1/2 rounded-full pointer-events-none z-0"
        style={{
          width: '400px',
          height: '400px',
          transform: 'translate(-50%, -50%)',
          zIndex: 0,
          background: 'radial-gradient(circle at center, rgba(139,92,246,0.2) 0%, rgba(139,92,246,0.08) 40%, transparent 70%)',
          animation: 'authCenterGlow 2s ease-in-out infinite'
        }}
      />

      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center flex flex-col items-center z-10">
        <div 
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.7), rgba(236,72,153,0.5))',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 8px 32px rgba(139,92,246,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
            animation: 'authSlideUpFade 400ms ease-out forwards, authIconFloat 3s ease-in-out 400ms infinite'
          }}
        >
          <Home size={28} className="text-white" />
        </div>

        <h1 
          className="mt-5 font-heading font-bold text-xl text-white opacity-0"
          style={{ animation: 'authSimpleFade 400ms ease-out 100ms forwards' }}
        >
          The Real Neighbors
        </h1>

        <div className="flex items-center justify-center gap-3 mt-6">
          {[0, 1, 2].map((i) => (
            <div 
              key={i}
              className="w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: 'var(--color-primary)',
                animation: `authDotPulse 1.4s ease-in-out ${i * 0.2}s infinite`
              }}
            />
          ))}
        </div>

        <p className="mt-4 text-white/50 text-sm font-normal">
          {LOADING_MESSAGES[messageIndex]}
        </p>

        <p className="mt-6 text-white/25 text-xs italic">
          Your private corner of the internet.
        </p>
      </div>
    </>
  );
};

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, setLoading, setUser, logout } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser || !firebaseUser.email) {
        logout();
        setLoading(false);
        return;
      }

      try {
        // 1. Check if email is in the allowedEmails whitelist
        // The rule requires reading allowedEmails/{email}
        const allowedEmailDoc = await getDoc<any>('allowedEmails', [firebaseUser.email]);
        
        if (!allowedEmailDoc) {
          await signOut(auth);
          logout();
          toast.error("Access denied. Contact the admin.");
          setLoading(false);
          return;
        }

        // Helper to generate unique handle
        const generateUniqueHandle = async (baseHandle: string) => {
          let handle = baseHandle.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (!handle) handle = 'user';
          let isUnique = false;
          let counter = 1;
          let currentHandle = handle;
          while (!isUnique) {
            const q = query(collection(db, 'users'), where('handle', '==', currentHandle));
            const snap = await getDocs(q);
            if (snap.empty) {
              isUnique = true;
            } else {
              currentHandle = `${handle}${counter}`;
              counter++;
            }
          }
          return currentHandle;
        };

        // 2. Check if users/{uid} profile exists
        let userProfile = await getDoc<User>('users', [firebaseUser.uid]);
        
        if (!userProfile) {
          // Extract display name from email (before @)
          const namePrefix = firebaseUser.email.split('@')[0];
          const uniqueHandle = await generateUniqueHandle(namePrefix);
          
          userProfile = {
            id: firebaseUser.uid,
            handle: uniqueHandle,
            displayName: namePrefix,
            email: firebaseUser.email,
            role: 'member',
            joinedAt: Date.now(),
            accentColor: '#6366f1', // default accent color
          };
          
          // Create the user profile in Firestore
          await setDoc<User>('users', [firebaseUser.uid], userProfile);
        } else if (!userProfile.handle) {
          // Backfill handle
          const uniqueHandle = await generateUniqueHandle(userProfile.displayName || firebaseUser.email.split('@')[0]);
          userProfile.handle = uniqueHandle;
          await setDoc<User>('users', [firebaseUser.uid], userProfile);
        }

        // 3. Login Streak Logic
        const today = new Date();
        const todayStr = today.toLocaleDateString('en-CA'); // YYYY-MM-DD local time
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString('en-CA');

        let needsUpdate = false;

        if (!userProfile.lastLoginDate) {
          userProfile.lastLoginDate = todayStr;
          userProfile.loginStreak = 1;
          needsUpdate = true;
        } else if (userProfile.lastLoginDate === yesterdayStr) {
          userProfile.lastLoginDate = todayStr;
          userProfile.loginStreak = (userProfile.loginStreak || 0) + 1;
          needsUpdate = true;
        } else if (userProfile.lastLoginDate !== todayStr) {
          // It's older than yesterday (or invalid), reset streak
          userProfile.lastLoginDate = todayStr;
          userProfile.loginStreak = 1;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await updateDoc<User>('users', [firebaseUser.uid], {
            lastLoginDate: userProfile.lastLoginDate,
            loginStreak: userProfile.loginStreak
          });
        }
        
        setUser(userProfile);
      } catch (error) {
        console.error("Auth state resolution error:", error);
        await signOut(auth);
        logout();
        toast.error("An error occurred during authentication.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setLoading, setUser, logout]);

  const [shouldRenderLoading, setShouldRenderLoading] = useState(isLoading);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!isLoading && shouldRenderLoading) {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setShouldRenderLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading, shouldRenderLoading]);

  return (
    <>
      {shouldRenderLoading && (
        <div 
          className="fixed inset-0 z-[9999] transition-opacity duration-300 ease-in"
          style={{ 
            backgroundColor: '#0a0812',
            opacity: isExiting ? 0 : 1
          }}
        >
          <AuthLoadingScreen />
        </div>
      )}
      
      {(!isLoading && isAuthenticated) && <>{children}</>}
      {(!isLoading && !isAuthenticated && !shouldRenderLoading) && <Navigate to="/login" replace />}
    </>
  );
};
