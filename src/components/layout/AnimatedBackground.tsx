import React, { useEffect, useState } from 'react';
import Particles, { ParticlesProvider } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine } from '@tsparticles/engine';

const initParticles = async (engine: Engine) => {
  await loadSlim(engine);
};

export const AnimatedBackground: React.FC = () => {
  const [animation, setAnimation] = useState(localStorage.getItem('bg-animation') || 'none');

  useEffect(() => {
    const handlePatternChange = () => {
      const newAnim = localStorage.getItem('bg-animation') || 'none';
      console.log('[AnimatedBackground] bg-animation-changed event, new anim:', newAnim);
      setAnimation(newAnim);
    };
    window.addEventListener('bg-animation-changed', handlePatternChange);
    window.addEventListener('storage', handlePatternChange);

    return () => {
      window.removeEventListener('bg-animation-changed', handlePatternChange);
      window.removeEventListener('storage', handlePatternChange);
    };
  }, []);

  const [bubbles] = useState(() => Array.from({ length: 12 }).map(() => ({
    width: `${Math.random() * 12 + 4}px`,
    height: `${Math.random() * 12 + 4}px`,
    left: `${Math.random() * 90 + 5}%`,
    animationDuration: `${Math.random() * 15 + 15}s`,
    animationDelay: `-${Math.random() * 30}s`,
    opacity: Math.random() * 0.05 + 0.1,
  })));

  const [raindrops] = useState(() => Array.from({ length: 20 }).map(() => ({
    height: `${Math.random() * 40 + 60}px`,
    left: `${Math.random() * 100}%`,
    background: 'linear-gradient(to bottom, transparent, var(--color-primary))',
    animationDuration: `${Math.random() * 1 + 1}s`,
    animationDelay: `-${Math.random() * 2}s`,
    opacity: Math.random() * 0.1 + 0.05,
  })));

  console.log('[AnimatedBackground] Render:', { animation });

  if (animation === 'none') return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {animation === 'aurora' && (
        <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-primary/30 via-transparent to-secondary/30 animate-blob" />
      )}

      {animation === 'particles' && (
        <ParticlesProvider init={initParticles}>
          <Particles
            id="tsparticles"
            className="absolute inset-0 opacity-15"
            options={{
              fpsLimit: 60,
              particles: {
                color: { value: 'var(--color-primary)' },
                links: {
                  color: 'var(--color-primary)',
                  distance: 150,
                  enable: true,
                  opacity: 0.05,
                  width: 1,
                },
                move: {
                  enable: true,
                  direction: 'none',
                  speed: 0.5,
                  random: true,
                  straight: false,
                  outModes: { default: 'out' },
                },
                number: {
                  density: { enable: true, width: 800 },
                  value: 40,
                },
                opacity: {
                  value: { min: 0.1, max: 0.3 },
                },
                shape: {
                  type: 'circle',
                },
                size: {
                  value: { min: 1, max: 2 },
                },
              },
              detectRetina: true,
            }}
          />
        </ParticlesProvider>
      )}

      {animation === 'bubbles' && (
        <div className="absolute inset-0 opacity-15">
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
        <div className="absolute inset-0 opacity-20 transform -rotate-12 scale-125">
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
