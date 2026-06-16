import React, { useEffect } from 'react';
import { AnimatedBackground } from './AnimatedBackground';

import { useSettingsStore } from '../../stores/settingsStore';

export const GlobalStyleManager: React.FC = () => {
  const { bgPattern, fontSize } = useSettingsStore();

  useEffect(() => {
    // Apply font-size
    document.documentElement.style.setProperty('--font-size-base', fontSize);

    // Apply bg-pattern
    const bodyElement = document.body;
    if (bodyElement) {
      bodyElement.className = bodyElement.className.replace(/bg-pattern-\S+/g, '').trim();
      if (bgPattern !== 'none') {
        bodyElement.classList.add(`bg-pattern-${bgPattern}`);
      }
    }
  }, [bgPattern, fontSize]);

  return <AnimatedBackground />;
};
