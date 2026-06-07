import React, { useEffect } from 'react';

export type LetterState = 'correct' | 'present' | 'absent' | 'unused';

interface WordleKeyboardProps {
  onKeyPress: (key: string) => void;
  letterStates: Record<string, LetterState>;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
];

export const WordleKeyboard: React.FC<WordleKeyboardProps> = ({ onKeyPress, letterStates }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      
      if (e.key === 'Enter') {
        onKeyPress('ENTER');
      } else if (e.key === 'Backspace') {
        onKeyPress('BACKSPACE');
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        onKeyPress(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onKeyPress]);

  const getKeyClass = (key: string) => {
    const state = letterStates[key] || 'unused';
    
    let baseClass = "rounded-md font-bold text-sm flex items-center justify-center transition-colors select-none cursor-pointer hover:brightness-110 active:scale-95 ";
    
    // Height and width logic
    baseClass += "h-[44px] sm:h-[56px] ";
    if (key === 'ENTER' || key === 'BACKSPACE') {
      baseClass += "w-[50px] sm:w-[65px] text-xs sm:text-sm ";
    } else {
      baseClass += "flex-1 max-w-[40px] ";
    }

    // Color logic
    if (state === 'correct') {
      baseClass += "bg-[#6aaa64] text-white";
    } else if (state === 'present') {
      baseClass += "bg-[#c9b458] text-white";
    } else if (state === 'absent') {
      baseClass += "bg-[#3a3a3c] text-muted";
    } else {
      baseClass += "bg-elevated text-main";
    }

    return baseClass;
  };

  const renderKey = (key: string) => {
    const displayKey = key === 'BACKSPACE' ? '⌫' : key;
    return (
      <button
        key={key}
        className={getKeyClass(key)}
        onClick={() => onKeyPress(key)}
      >
        {displayKey}
      </button>
    );
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-2 px-2">
      {KEYBOARD_ROWS.map((row, i) => (
        <div key={i} className="flex justify-center gap-1 sm:gap-2">
          {/* Add a little padding on the middle row to stagger it nicely */}
          {i === 1 && <div className="w-[10%] max-w-[20px]" />}
          {row.map(renderKey)}
          {i === 1 && <div className="w-[10%] max-w-[20px]" />}
        </div>
      ))}
    </div>
  );
};
