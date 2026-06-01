import React, { useEffect } from 'react';
import { AnimatedBackground } from './AnimatedBackground';

export const GlobalStyleManager: React.FC = () => {
  useEffect(() => {
    const applyStyles = () => {
      const pattern = localStorage.getItem('bg-pattern') || 'none';
      const fontSize = localStorage.getItem('font-size') || '14px';

      // Apply font-size
      document.documentElement.style.setProperty('--font-size-base', fontSize);

      // Apply bg-pattern
      const bodyElement = document.body;
      if (bodyElement) {
        // Remove existing pattern classes
        bodyElement.className = bodyElement.className.replace(/bg-pattern-\S+/g, '').trim();
        if (pattern !== 'none') {
          bodyElement.classList.add(`bg-pattern-${pattern}`);
        }
      }
    };

    applyStyles();

    const handleStorageChange = () => applyStyles();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('bg-pattern-changed', handleStorageChange);
    window.addEventListener('font-size-changed', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bg-pattern-changed', handleStorageChange);
      window.removeEventListener('font-size-changed', handleStorageChange);
    };
  }, []);

  return <AnimatedBackground />;
};
