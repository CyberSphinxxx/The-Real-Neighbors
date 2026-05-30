import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { getDoc, setDoc } from '../../lib/firestore';
import { useAuthStore } from '../../stores/authStore';
import type { User } from '../../types';
import toast from 'react-hot-toast';

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

        // 2. Check if users/{uid} profile exists
        let userProfile = await getDoc<User>('users', [firebaseUser.uid]);
        
        if (!userProfile) {
          // Extract display name from email (before @)
          const namePrefix = firebaseUser.email.split('@')[0];
          
          userProfile = {
            id: firebaseUser.uid,
            displayName: namePrefix,
            email: firebaseUser.email,
            role: 'member',
            joinedAt: Date.now(),
            accentColor: '#6366f1', // default accent color
          };
          
          // Create the user profile in Firestore
          await setDoc<User>('users', [firebaseUser.uid], userProfile);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-border-subtle border-t-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-muted font-medium animate-pulse">Authenticating...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
