import React from 'react';
import { Lock, Play, ArrowLeft, Keyboard } from 'lucide-react';
import { type VocabTier } from '../../../lib/vocabularyData';
import { useProgressionStore } from '../../../stores/progressionStore';

interface WordsModeLandingProps {
  onSelectTier: (tier: VocabTier | 'typing') => void;
  onQuit: () => void;
}

export const WordsModeLanding: React.FC<WordsModeLandingProps> = ({ onSelectTier, onQuit }) => {
  const { wordsBasicCompleted, wordsMediumCompleted, isMediumUnlocked, isHardUnlocked } = useProgressionStore();

  const tiers = [
    {
      id: 'basic' as const,
      name: 'Basic Survival',
      description: 'Learn essential 2-3 character words like neko, baka, and mizu.',
      icon: '🌱',
      isUnlocked: true,
      progress: wordsBasicCompleted,
      required: 15,
      color: 'text-green-500',
      bg: 'bg-green-500/10 border-green-500/20 hover:border-green-500/50'
    },
    {
      id: 'medium' as const,
      name: 'Verbs & Adjectives',
      description: 'Master everyday actions and descriptions like taberu and oishii.',
      icon: '🏃',
      isUnlocked: isMediumUnlocked,
      progress: wordsMediumCompleted,
      required: 15,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10 border-blue-500/20 hover:border-blue-500/50'
    },
    {
      id: 'hard' as const,
      name: 'Sentences & Quotes',
      description: 'Build full anime quotes and common phrases from multiple words.',
      icon: '⚔️',
      isUnlocked: isHardUnlocked,
      progress: 0, // No next tier to unlock
      required: 0,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10 border-purple-500/20 hover:border-purple-500/50'
    }
  ];

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onQuit}
          className="p-2 -ml-2 rounded-full hover:bg-surface-hover text-muted hover:text-main transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-heading font-bold text-main">Words & Sentences</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {tiers.map((tier) => (
            <div 
              key={tier.id}
              className={`relative flex flex-col p-6 rounded-3xl border-2 transition-all ${
                tier.isUnlocked 
                  ? `${tier.bg} cursor-pointer hover:-translate-y-1 hover:shadow-lg` 
                  : 'bg-surface border-border-subtle opacity-60 grayscale cursor-not-allowed'
              }`}
              onClick={() => tier.isUnlocked && onSelectTier(tier.id)}
            >
              {!tier.isUnlocked && (
                <div className="absolute top-4 right-4 text-muted">
                  <Lock className="w-5 h-5" />
                </div>
              )}
              
              <div className="text-5xl mb-4">{tier.icon}</div>
              <h3 className={`font-heading font-bold text-xl mb-2 ${tier.isUnlocked ? tier.color : 'text-muted'}`}>
                {tier.name}
              </h3>
              <p className="text-muted text-sm flex-1 mb-6">{tier.description}</p>
              
              {tier.required > 0 && (
                <div className="mt-auto">
                  <div className="flex justify-between text-xs font-semibold mb-2 text-muted uppercase tracking-wider">
                    <span>Mastery</span>
                    <span>{tier.progress} / {tier.required}</span>
                  </div>
                  <div className="h-2 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${tier.color.replace('text-', 'bg-')}`}
                      style={{ width: `${Math.min(100, (tier.progress / tier.required) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {tier.required === 0 && tier.isUnlocked && (
                <div className="mt-auto flex items-center gap-2 text-sm font-bold text-primary">
                  <Play className="w-4 h-4" /> Play Now
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Final Boss Mode */}
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-4">
            <div className="inline-block px-3 py-1 rounded-full bg-danger/10 text-danger text-xs font-bold uppercase tracking-widest mb-2">
              Final Boss
            </div>
          </div>
          
          <div 
            className={`p-6 rounded-3xl border-2 transition-all flex items-center gap-6 ${
              isHardUnlocked 
                ? 'bg-danger/5 border-danger/30 hover:border-danger hover:bg-danger/10 cursor-pointer shadow-danger/5 hover:shadow-danger/20 hover:shadow-xl hover:-translate-y-1' 
                : 'bg-surface border-border-subtle opacity-60 grayscale cursor-not-allowed'
            }`}
            onClick={() => isHardUnlocked && onSelectTier('typing')}
          >
            <div className="w-16 h-16 rounded-2xl bg-danger/20 flex items-center justify-center shrink-0 text-danger">
              <Keyboard className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className={`font-heading font-bold text-xl mb-1 ${isHardUnlocked ? 'text-danger' : 'text-muted'}`}>
                Hardcore Typing
              </h3>
              <p className="text-muted text-sm">
                No pills. No hints. Type the exact romaji translation for anime quotes and phrases.
              </p>
            </div>
            {!isHardUnlocked && (
              <div className="text-muted shrink-0">
                <Lock className="w-6 h-6" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
