import React from 'react';
import { type HiraganaChar } from '../../../lib/hiraganaData';
import { type HiraganaSettings } from '../../../hooks/useHiragana';
import { ArrowLeft } from 'lucide-react';

interface DictionaryModeProps {
  cards: HiraganaChar[];
  settings: HiraganaSettings;
  onExit: () => void;
}

export const DictionaryMode: React.FC<DictionaryModeProps> = ({
  cards,
  settings,
  onExit
}) => {
  const fontClass = settings.fontStyle === 'serif' ? 'font-serif' : 'font-sans';

  // Group cards by their 'group' property
  const groupedCards = cards.reduce((acc, card) => {
    if (!acc[card.group]) acc[card.group] = [];
    acc[card.group].push(card);
    return acc;
  }, {} as Record<string, HiraganaChar[]>);

  return (
    <div className="max-w-4xl w-full mx-auto px-4 py-6 flex flex-col h-full bg-base">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={onExit}
          className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-surface-hover transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-main" />
        </button>
        <div>
          <h2 className="font-heading font-bold text-xl text-main">Dictionary</h2>
          <p className="text-sm text-muted">All characters in your current set</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {Object.entries(groupedCards).map(([group, groupCards]) => (
            <div key={group}>
            <h3 className="text-xs font-semibold text-faint uppercase tracking-wider mb-3">
              {group}
            </h3>
            <div className="flex flex-wrap gap-2">
              {groupCards.map((char) => (
                <div 
                  key={char.character} 
                  className="bg-surface border border-border-subtle rounded-xl px-3 py-3 flex flex-col items-center min-w-[3.5rem] shadow-sm hover:border-primary transition-colors group cursor-default"
                >
                  <span className={`${fontClass} font-bold text-2xl text-main leading-none mb-1 group-hover:text-primary transition-colors`}>
                    {char.character}
                  </span>
                  <span className="text-xs font-medium text-muted mt-1">
                    {char.romaji}
                  </span>
                  {char.alternates.length > 0 && (
                    <span className="text-[9px] text-faint mt-0.5">
                      ({char.alternates.join(', ')})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
};
