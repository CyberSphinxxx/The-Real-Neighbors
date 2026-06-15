import React, { useState, useEffect, useRef } from 'react';
import { CornerDownLeft } from 'lucide-react';
import { isCorrectAnswer } from '../../../lib/hiraganaUtils';
import { type HiraganaChar } from '../../../lib/hiraganaData';

interface TypeInputProps {
  char: HiraganaChar;
  onSubmit: (answer: string) => void;
  disabled: boolean;
  phase: string;
  showHints: boolean;
}

export const TypeInput: React.FC<TypeInputProps> = ({
  char,
  onSubmit,
  disabled,
  phase,
  showHints
}) => {
  const [value, setValue] = useState('');
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset and focus on new card
  useEffect(() => {
    if (phase === 'playing') {
      setValue('');
      setShowHint(false);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  }, [phase, char]);

  // Show hint after 5 seconds if enabled
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (phase === 'playing' && showHints) {
      timer = setTimeout(() => {
        setShowHint(true);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [phase, showHints]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const val = e.target.value.toLowerCase().trim();
    setValue(val);

    // Smart auto-submit
    if (val.length > 0) {
      // If it matches exactly, submit immediately
      if (isCorrectAnswer(val, char)) {
        onSubmit(val);
        return;
      }
      
      // If typed length > longest possible romaji AND it's wrong, auto submit to show error
      const maxLen = Math.max(char.romaji.length, ...char.alternates.map(a => a.length));
      if (val.length > maxLen) {
        onSubmit(val);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled && value.length > 0) {
      onSubmit(value);
    }
  };

  let inputClass = "bg-elevated border-border focus:border-primary focus:ring-1 focus:ring-primary";
  let showCorrectAnswer = false;

  if (phase === 'answered' || disabled) {
    if (isCorrectAnswer(value, char)) {
      inputClass = "bg-green-500/10 border-green-500 text-green-400";
    } else {
      inputClass = "bg-red-500/10 border-red-500 text-red-400 animate-[shake_0.3s_ease-in-out]";
      showCorrectAnswer = true;
    }
  }

  return (
    <div className="w-full max-w-[300px] mx-auto mt-6 px-4 md:px-0 relative">
      <div className="flex relative">
        <input
          ref={inputRef}
          type="text"
          value={phase === 'answered' && isCorrectAnswer(value, char) ? char.romaji : value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="type romaji here..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          className={`w-full rounded-xl border-2 text-center font-mono font-semibold text-lg md:text-xl py-3 px-4 transition-all outline-none ${inputClass}`}
        />
        
        {/* Desktop Enter hint/button */}
        <button 
          onClick={() => !disabled && value.length > 0 && onSubmit(value)}
          disabled={disabled || value.length === 0}
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 items-center gap-1 bg-surface border border-border-subtle rounded-md px-2 py-1 text-xs text-muted hover:text-main disabled:opacity-0 transition-opacity"
        >
          Enter <CornerDownLeft className="w-3 h-3" />
        </button>
      </div>

      {/* Mobile Submit button */}
      <button
        className="md:hidden w-full mt-3 bg-primary text-on-primary rounded-xl py-3 font-semibold disabled:opacity-50 transition-opacity"
        disabled={disabled || value.length === 0}
        onClick={() => !disabled && value.length > 0 && onSubmit(value)}
      >
        Submit
      </button>

      {/* Feedback below input */}
      <div className="h-8 mt-2 text-center">
        {showCorrectAnswer ? (
          <p className="text-green-400 text-sm font-medium animate-in fade-in slide-in-from-top-2">
            Correct: {char.romaji}
          </p>
        ) : showHint && showHints ? (
          <p className="text-faint text-xs animate-in fade-in">
            Hint: {char.group}
          </p>
        ) : null}
      </div>
    </div>
  );
};
