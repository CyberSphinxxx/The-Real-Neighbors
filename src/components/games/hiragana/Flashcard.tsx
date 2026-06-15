import React from 'react';
import { Check, X } from 'lucide-react';
import { type HiraganaChar } from '../../../lib/hiraganaData';
import { type HiraganaSettings } from '../../../hooks/useHiragana';

interface FlashcardProps {
  char: HiraganaChar;
  phase: string;
  isCorrect: boolean | null;
  settings: HiraganaSettings;
  studyMode?: boolean;
  isFlipped?: boolean;
  onFlip?: () => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({ 
  char, 
  phase, 
  isCorrect, 
  settings, 
  studyMode = false,
  isFlipped = false,
  onFlip
}) => {
  const isCombination = char.type === 'combination';
  
  // Font sizes: smaller for combinations because they have 2 characters (e.g. きゃ)
  const fontSizeDesktop = isCombination ? 'text-[5rem]' : 'text-[7rem]';
  const fontSizeMobile = isCombination ? 'text-[3.5rem]' : 'text-[5rem]';
  
  const fontClass = settings.fontStyle === 'serif' ? 'font-serif' : 'font-sans';

  let borderColor = 'border-border';
  let bgColor = 'bg-surface';
  
  if (phase === 'answered' && isCorrect !== null && !studyMode) {
    borderColor = isCorrect ? 'border-green-500' : 'border-red-500';
    bgColor = isCorrect ? 'bg-green-500/10' : 'bg-red-500/10';
  }

  return (
    <div 
      className={`relative mx-auto w-[180px] h-[220px] md:w-[220px] md:h-[280px] perspective-1000 ${studyMode ? 'cursor-pointer' : ''}`}
      onClick={studyMode && onFlip ? onFlip : undefined}
    >
      <div 
        key={char.character} // Key forces re-mount animation on char change
        className={`w-full h-full rounded-2xl border-2 shadow-lg flex flex-col items-center justify-center overflow-hidden transition-all duration-200 transform-style-3d animate-in fade-in zoom-in-90 ${borderColor} ${bgColor} ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        {!isFlipped ? (
          // Front of card (Character)
          <div className="absolute inset-0 flex flex-col items-center justify-center backface-hidden">
            <span className={`${fontClass} font-bold text-main leading-none select-none ${fontSizeMobile} md:${fontSizeDesktop}`}>
              {char.character}
            </span>
            
            {settings.showHints && !studyMode && (
              <span className="text-faint text-xs text-center mt-3 select-none">
                {char.group}
              </span>
            )}
            
            {studyMode && (
              <span className="text-faint text-xs text-center absolute bottom-4">
                Tap to reveal
              </span>
            )}
          </div>
        ) : (
          // Back of card (Romaji - Study Mode only)
          <div className="absolute inset-0 flex flex-col items-center justify-center backface-hidden rotate-y-180">
            <span className="font-heading font-bold text-3xl text-primary select-none">
              {char.romaji}
            </span>
            
            {char.alternates.length > 0 && (
              <span className="text-muted text-sm mt-2 select-none">
                also: {char.alternates.join(', ')}
              </span>
            )}
            
            <span className="text-faint text-xs mt-4 select-none">
              {char.group}
            </span>
          </div>
        )}

        {/* Correct/Wrong Overlay */}
        {phase === 'answered' && !studyMode && isCorrect !== null && (
          <div 
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white animate-in zoom-in-50 ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}
          >
            {isCorrect ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4 stroke-[3]" />}
          </div>
        )}
      </div>
    </div>
  );
};
