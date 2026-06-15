import React from 'react';
import { Flame } from 'lucide-react';
import { type HiraganaMode } from '../../../hooks/useHiragana';

interface ProgressHeaderProps {
  currentIndex: number;
  totalCards: number;
  correctCount: number;
  streak: number;
  mode: HiraganaMode;
  totalScore?: number;
  results?: { isCorrect: boolean }[];
}

export const ProgressHeader: React.FC<ProgressHeaderProps> = ({
  currentIndex,
  totalCards,
  correctCount,
  streak,
  mode,
  totalScore = 0,
  results = []
}) => {
  const progressRatio = currentIndex / totalCards;
  const isTenCardMode = mode.cardCount === 10;

  return (
    <div className="sticky top-0 bg-base z-10 pb-3 pt-2">
      {/* ROW 1: Progress Bar or Dots */}
      <div className="mb-3 px-4 md:px-6">
        {mode.id === 'endless' ? null : isTenCardMode ? (
          <div className="flex justify-center items-center gap-1.5 h-4">
            {Array.from({ length: 10 }).map((_, i) => {
              const result = results[i];
              let dotClass = "w-2 h-2 rounded-full bg-elevated";
              
              if (result) {
                dotClass = result.isCorrect 
                  ? "w-2 h-2 rounded-full bg-green-500" 
                  : "w-2 h-2 rounded-full bg-red-500";
              } else if (i === currentIndex) {
                dotClass = "w-2.5 h-2.5 rounded-full bg-primary animate-[pulse_1s_infinite]";
              }
              
              return <div key={i} className={dotClass} />;
            })}
          </div>
        ) : (
          <div className="w-full h-1 bg-elevated rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progressRatio * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* ROW 2: Stats */}
      <div className="flex justify-between items-center px-4 md:px-6">
        {/* LEFT: Card Counter */}
        <div className="w-24">
          {mode.id === 'endless' ? (
            <span className="text-primary text-xs font-semibold tracking-wide uppercase">
              Lv. {Math.floor(correctCount / 5) + 1}
            </span>
          ) : (
            <>
              <span className="text-faint text-xs hidden sm:inline">
                Card {Math.min(currentIndex + 1, totalCards)} of {totalCards}
              </span>
              <span className="text-faint text-xs sm:hidden">
                {Math.min(currentIndex + 1, totalCards)}/{totalCards}
              </span>
            </>
          )}
        </div>

        {/* CENTER: Streak Indicator */}
        <div className="flex-1 flex justify-center">
          <div className={`transition-all duration-200 ${streak >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}>
            <div className="flex items-center gap-1.5 bg-orange-500/10 rounded-full px-3 py-1">
              <Flame 
                className={`w-3.5 h-3.5 text-orange-400 ${streak >= 5 ? 'animate-[wiggle_0.3s_infinite]' : ''}`} 
                style={streak >= 5 ? { animation: 'wiggle 0.3s ease-in-out infinite' } : {}}
              />
              <span className="text-orange-400 text-xs font-medium">
                {streak} streak
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: Score */}
        <div className="w-24 text-right">
          {mode.hasTimer ? (
            <span className="text-primary text-sm font-semibold">
              {totalScore} pts
            </span>
          ) : (
            <span className="text-main text-sm font-medium">
              {correctCount} / {Math.max(1, currentIndex + (results.length > currentIndex ? 1 : 0))}
            </span>
          )}
        </div>
      </div>
      
      {/* Required keyframes for wiggle if not in global CSS */}
      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
      `}</style>
    </div>
  );
};
