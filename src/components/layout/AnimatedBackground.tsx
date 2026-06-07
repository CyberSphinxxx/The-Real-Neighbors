import React, { useEffect, useState } from 'react';

export const AnimatedBackground: React.FC = () => {
  const [animation, setAnimation] = useState(localStorage.getItem('bg-animation') || 'none');
  const [settings, setSettings] = useState({
    amount: parseInt(localStorage.getItem('bg-amount') || '3', 10),
    opacity: parseInt(localStorage.getItem('bg-opacity') || '50', 10),
    speed: parseInt(localStorage.getItem('bg-speed') || '3', 10),
    angle: parseInt(localStorage.getItem('bg-angle') || '0', 10),
  });

  useEffect(() => {
    const handlePatternChange = () => {
      const newAnim = localStorage.getItem('bg-animation') || 'none';
      setAnimation(newAnim);
      setSettings({
        amount: parseInt(localStorage.getItem('bg-amount') || '3', 10),
        opacity: parseInt(localStorage.getItem('bg-opacity') || '50', 10),
        speed: parseInt(localStorage.getItem('bg-speed') || '3', 10),
        angle: parseInt(localStorage.getItem('bg-angle') || '0', 10),
      });
    };
    window.addEventListener('bg-animation-changed', handlePatternChange);
    window.addEventListener('bg-settings-changed', handlePatternChange);
    window.addEventListener('storage', handlePatternChange);

    return () => {
      window.removeEventListener('bg-animation-changed', handlePatternChange);
      window.removeEventListener('bg-settings-changed', handlePatternChange);
      window.removeEventListener('storage', handlePatternChange);
    };
  }, []);

  // Speed multiplier: speed=3 is 1x, speed=1 is 4x slower, speed=5 is 4x faster
  const speedMult = Math.pow(0.5, settings.speed - 3);

  const bubbles = React.useMemo(() => Array.from({ length: 5 * settings.amount }).map(() => ({
    width: `${Math.random() * 12 + 4}px`,
    height: `${Math.random() * 12 + 4}px`,
    left: `${Math.random() * 90 + 5}%`,
    animationDuration: `${(Math.random() * 15 + 15) * speedMult}s`,
    animationDelay: `-${Math.random() * 30}s`,
    opacity: Math.random() * 0.2 + 0.2,
  })), [settings.amount, speedMult]);

  const raindrops = React.useMemo(() => Array.from({ length: 15 * settings.amount }).map(() => ({
    height: `${Math.random() * 40 + 60}px`,
    left: `${Math.random() * 100}%`,
    background: 'linear-gradient(to bottom, transparent, var(--color-primary))',
    animationDuration: `${(Math.random() * 1 + 1) * speedMult}s`,
    animationDelay: `-${Math.random() * 2}s`,
    opacity: Math.random() * 0.3 + 0.2,
  })), [settings.amount, speedMult]);

  const dustParticles = React.useMemo(() => Array.from({ length: 15 * settings.amount }).map(() => ({
    width: `${Math.random() * 4 + 2}px`,
    height: `${Math.random() * 4 + 2}px`,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDuration: `${(Math.random() * 40 + 40) * speedMult}s`,
    animationDelay: `-${Math.random() * 80}s`,
    opacity: Math.random() * 0.3 + 0.2,
    background: 'var(--color-primary)',
    boxShadow: '0 0 8px 1px var(--color-primary)',
  })), [settings.amount, speedMult]);

  console.log('[AnimatedBackground] Render:', { animation });

  if (animation === 'none') return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={{ opacity: settings.opacity / 100 }}>
      {animation === 'aurora' && (
        <div 
          className="absolute -inset-[50%] animate-blob mix-blend-screen" 
          style={{ backgroundImage: `linear-gradient(${settings.angle + 135}deg, var(--color-primary) 0%, transparent 40%, var(--color-secondary) 100%)` }}
        />
      )}

      {animation === 'particles' && (
        <div className="absolute inset-0">
          {dustParticles.map((style, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-dust"
              style={style}
            />
          ))}
        </div>
      )}

      {animation === 'bubbles' && (
        <div className="absolute inset-0">
          {bubbles.map((style, i) => (
            <div
              key={i}
              className="absolute bottom-[-20px] rounded-full border border-primary animate-bubble"
              style={style}
            />
          ))}
        </div>
      )}

      {animation === 'rain' && (
        <div 
          className="absolute inset-0 transform scale-[1.5]"
          style={{ transform: `rotate(${settings.angle - 12}deg) scale(1.5)` }}
        >
          {raindrops.map((style, i) => (
            <div
              key={i}
              className="absolute top-[-100px] w-px animate-rain"
              style={style}
            />
          ))}
        </div>
      )}
    </div>
  );
};
