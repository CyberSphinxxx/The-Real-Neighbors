import React from 'react';
import { ArrowLeft, Check, RotateCcw, ArrowRight } from 'lucide-react';
import { type VocabTier } from '../../../lib/vocabularyData';
import { useWordBuilder } from '../../../hooks/useWordBuilder';

interface WordBuilderProps {
  tier: VocabTier;
  onQuit: () => void;
  onFinish: () => void;
}

export const WordBuilder: React.FC<WordBuilderProps> = ({ tier, onQuit, onFinish }) => {
  const {
    currentItem,
    bank,
    dropZone,
    phase,
    handleBankClick,
    handleDropZoneClick,
    handleNext,
    handleRetry,
    progress
  } = useWordBuilder(tier);

  if (phase === 'finished') {
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center px-4">
        <div className="text-6xl mb-6">🎉</div>
        <h2 className="text-3xl font-heading font-bold text-main mb-4">Lesson Complete!</h2>
        <p className="text-muted mb-8">You've successfully mastered 5 words from the {tier} tier.</p>
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
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center gap-12">
        <div className="text-center">
          <h2 className="text-3xl font-heading font-bold text-main mb-2">
            {currentItem.english}
          </h2>
          <p className="text-muted">{currentItem.romaji}</p>
        </div>

        {/* Drop Zone */}
        <div className="flex flex-wrap justify-center gap-3 min-h-[64px] p-4 bg-surface rounded-2xl border-2 border-dashed border-border-subtle">
          {dropZone.map((pill, idx) => (
            <div 
              key={idx}
              onClick={() => handleDropZoneClick(idx)}
              className={`h-12 min-w-[3rem] px-4 rounded-xl flex items-center justify-center font-bold text-xl transition-all cursor-pointer ${
                pill 
                  ? 'bg-elevated border-2 border-border text-main shadow-sm hover:border-primary/50 hover:-translate-y-1' 
                  : 'bg-transparent border-b-4 border-border-subtle'
              }`}
            >
              {pill?.text}
            </div>
          ))}
        </div>

        {/* Bank */}
        <div className="flex flex-wrap justify-center gap-3">
          {bank.map((pill) => (
            <button
              key={pill.id}
              onClick={() => handleBankClick(pill)}
              className="h-12 px-5 bg-surface border-2 border-border-subtle rounded-xl flex items-center justify-center font-bold text-xl text-main hover:bg-elevated hover:border-primary hover:-translate-y-1 hover:shadow-md transition-all active:translate-y-0 disabled:opacity-0"
              disabled={phase !== 'playing'}
            >
              {pill.text}
            </button>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className={`mt-8 p-6 -mx-4 -mb-6 md:mx-0 md:mb-0 md:rounded-3xl border-t-2 md:border-2 transition-colors ${
        phase === 'correct' ? 'bg-success/10 border-success/30' :
        phase === 'wrong' ? 'bg-danger/10 border-danger/30' :
        'bg-surface border-border-subtle'
      }`}>
        {phase === 'playing' ? (
          <div className="text-center text-muted font-medium">
            Tap the fragments to build the word
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
              Not quite right
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
