import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Check, RotateCcw, ArrowRight } from 'lucide-react';
import { VOCABULARY_DATA, type VocabularyItem } from '../../../lib/vocabularyData';
import { shuffleArray } from '../../../lib/hiraganaUtils';

interface HardcoreTypingProps {
  onQuit: () => void;
  onFinish: () => void;
}

export const HardcoreTyping: React.FC<HardcoreTypingProps> = ({ onQuit, onFinish }) => {
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<'playing' | 'correct' | 'wrong' | 'finished'>('playing');
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize game with hard items
  useEffect(() => {
    const hardItems = VOCABULARY_DATA.filter(v => v.tier === 'hard');
    const sessionItems = shuffleArray(hardItems).slice(0, 5); // 5 sentences per session
    setItems(sessionItems);
    setCurrentIndex(0);
  }, []);

  useEffect(() => {
    if (phase === 'playing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [phase]);

  const currentItem = items[currentIndex];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phase !== 'playing' || !input.trim()) return;
    
    // Normalize string: lower case, remove punctuation, trim extra spaces
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z\s]/g, '').trim().replace(/\s+/g, ' ');
    
    const isCorrect = normalize(input) === normalize(currentItem.romaji);
    
    setPhase(isCorrect ? 'correct' : 'wrong');
  };

  const handleNext = () => {
    if (currentIndex + 1 >= items.length) {
      setPhase('finished');
    } else {
      setCurrentIndex(prev => prev + 1);
      setInput('');
      setPhase('playing');
    }
  };

  const handleRetry = () => {
    setInput('');
    setPhase('playing');
  };

  if (phase === 'finished') {
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center px-4">
        <div className="text-6xl mb-6">🏆</div>
        <h2 className="text-3xl font-heading font-bold text-main mb-4">You are a Master!</h2>
        <p className="text-muted mb-8">You've successfully completed the Hardcore Typing challenge.</p>
        <button
          onClick={onFinish}
          className="bg-primary hover:bg-primary-hover text-on-primary px-8 py-3 rounded-full font-semibold transition-colors"
        >
          Continue
        </button>
      </div>
    );
  }

  if (!currentItem) return null;

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onQuit}
          className="p-2 -ml-2 rounded-full hover:bg-surface-hover text-muted hover:text-main transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <div className="h-3 bg-surface-hover rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(currentIndex / items.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center gap-12">
        <div className="text-center">
          <div className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Hardcore Typing</div>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-main mb-4 leading-tight">
            {currentItem.hiragana}
          </h2>
          <p className="text-muted text-lg">{currentItem.english}</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={phase !== 'playing'}
            placeholder="Type the romaji (e.g. arigatou gozaimasu)"
            className={`w-full bg-surface border-2 rounded-2xl px-6 py-5 text-xl text-center outline-none transition-all ${
              phase === 'correct' ? 'border-success text-success bg-success/5' :
              phase === 'wrong' ? 'border-danger text-danger bg-danger/5' :
              'border-border hover:border-primary/50 focus:border-primary text-main'
            }`}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
        </form>
      </div>

      {/* Footer Actions */}
      <div className={`mt-8 p-6 -mx-4 -mb-6 md:mx-0 md:mb-0 md:rounded-3xl border-t-2 md:border-2 transition-colors ${
        phase === 'correct' ? 'bg-success/10 border-success/30' :
        phase === 'wrong' ? 'bg-danger/10 border-danger/30' :
        'bg-surface border-border-subtle'
      }`}>
        {phase === 'playing' ? (
          <div className="text-center text-muted font-medium">
            Press Enter to submit
          </div>
        ) : phase === 'correct' ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-success font-bold text-xl">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                <Check className="w-6 h-6" />
              </div>
              Perfect!
            </div>
            <button
              onClick={handleNext}
              className="bg-success hover:bg-success-hover text-on-primary px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-colors"
            >
              Continue <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="text-danger font-bold text-xl">
              Not quite right. Expected: {currentItem.romaji}
            </div>
            <button
              onClick={handleRetry}
              className="bg-danger hover:bg-danger-hover text-on-primary px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-5 h-5" /> Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
