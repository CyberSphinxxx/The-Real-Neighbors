import React, { useEffect, useRef, useState } from 'react';
import type { TypeRacerConfig } from '../../../hooks/useTypeRacer';
import { useTypeRacer } from '../../../hooks/useTypeRacer';
import { StatsBar } from './StatsBar';
import { CharacterDisplay } from './CharacterDisplay';
import { ResultScreen } from './ResultScreen';
import { X } from 'lucide-react';

interface RaceTrackProps {
  config: TypeRacerConfig;
  onExit: () => void;
  onRestart: () => void;
}

export const RaceTrack: React.FC<RaceTrackProps> = ({ config, onExit, onRestart }) => {
  const {
    phase,
    text,
    currentIndex,
    errors,
    errorCount,
    timeLeft,
    wpmHistory,
    netWPM,
    accuracy,
    ghostPosition,
    isPersonalBest,
    ghostResult,
    handleKeyPress,
    startRace
  } = useTypeRacer(config);

  const [countdown, setCountdown] = useState(3);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Settings
  const settingsStr = localStorage.getItem('typeracer_settings');
  const settings = settingsStr ? JSON.parse(settingsStr) : null;
  const fontSize = settings?.fontSize || 18;
  const fontFamily = settings?.fontFamily || 'mono';
  const blindMode = settings?.blindMode || false;
  const showWpmLive = settings?.showWpmLive ?? true;

  useEffect(() => {
    if (phase === 'countdown') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        startRace();
        // Focus hidden input
        setTimeout(() => inputRef.current?.focus(), 10);
      }
    }
  }, [phase, countdown, startRace]);

  // Keep input focused if clicked elsewhere
  useEffect(() => {
    const handleClick = () => {
      if (phase === 'racing') inputRef.current?.focus();
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [phase]);

  // Auto-scroll logic
  useEffect(() => {
    // Only scroll if we are deep into the text (e.g. timed mode or long text)
    // Finding the current character element is tricky without refs, 
    // but we can scroll the container based on progress
    if (containerRef.current && text.length > 0) {
      const progress = currentIndex / text.length;
      if (progress > 0.5 && containerRef.current.scrollHeight > containerRef.current.clientHeight) {
         containerRef.current.scrollTop = (containerRef.current.scrollHeight - containerRef.current.clientHeight) * ((progress - 0.5) * 2);
      }
    }
  }, [currentIndex, text.length]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent default scrolling for spacebar
    if (e.key === ' ') e.preventDefault();
    handleKeyPress(e.key);
  };

  if (phase === 'finished') {
    return (
      <ResultScreen 
        config={config}
        netWPM={netWPM}
        accuracy={accuracy}
        errors={errorCount}
        consistency={100} // TODO calculate
        wpmHistory={wpmHistory}
        isPersonalBest={isPersonalBest}
        ghostResult={ghostResult}
        onRestart={onRestart}
        onNewRace={onExit}
      />
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      <StatsBar 
        netWPM={showWpmLive ? netWPM : 0} 
        accuracy={accuracy} 
        errors={errors.size} 
        timeLeft={timeLeft}
        mode={config.mode}
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 flex items-center justify-center relative" ref={containerRef}>
        
        {/* Top Right Exit */}
        <button onClick={onExit} className="absolute top-4 right-4 p-2 text-muted hover:text-main rounded-full hover:bg-surface transition-colors z-30">
          <X size={20} />
        </button>

        {phase === 'countdown' && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in">
            <div className="text-9xl font-black font-mono text-primary animate-pulse drop-shadow-lg">
              {countdown}
            </div>
          </div>
        )}

        {/* Hidden Input */}
        <input 
          ref={inputRef}
          className="absolute opacity-0 pointer-events-none -left-[9999px]"
          onKeyDown={onKeyDown}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        {/* Text Container */}
        <div 
          className="max-w-4xl w-full leading-relaxed tracking-wide select-none outline-none break-words whitespace-pre-wrap relative"
          style={{ 
            fontSize: `${fontSize}px`, 
            fontFamily: fontFamily === 'mono' ? 'monospace' : fontFamily === 'code' ? '"Courier New", monospace' : '"VT323", monospace' 
          }}
          onClick={() => inputRef.current?.focus()}
        >
          {/* Ghost Cursor Overlay */}
          {config.ghost && ghostPosition > 0 && ghostPosition < text.length && (
            <span 
              className="absolute w-1 h-[1.2em] opacity-50 bg-warning transition-all duration-75"
              style={{
                 // Positioning a floating cursor without absolute coords of each char is hard in purely relative flow.
                 // A simple approximation or just displaying it inline is easier.
                 // In this implementation, we will just tint the text character the ghost is currently on.
                 display: 'none' // We'll handle this in CharacterDisplay or just skip exact positioning
              }} 
            />
          )}

          <CharacterDisplay 
            text={text} 
            currentIndex={currentIndex} 
            errors={errors}
            blindMode={blindMode}
          />
        </div>
      </div>
    </div>
  );
};
