import React, { useState } from 'react';
import { Share, RefreshCw, ChevronDown, ChevronUp, BookOpen, Grid } from 'lucide-react';
import { type HiraganaMode, type CardResult, type HiraganaSettings } from '../../../hooks/useHiragana';
import { getScoreLabel, getWrongAnswerGroups } from '../../../lib/hiraganaUtils';

interface ResultScreenProps {
  mode: HiraganaMode;
  results: CardResult[];
  correctCount: number;
  totalScore: number;
  maxStreak: number;
  totalElapsedMs: number;
  isPersonalBest: boolean;
  onPlayAgain: () => void;
  onChangeMode: () => void;
  onStudyWrong: (wrongChars: CardResult[]) => void;
  onShare: (shareData: any) => void;
  settings: HiraganaSettings;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  mode,
  results,
  correctCount,
  totalScore,
  maxStreak,
  totalElapsedMs,
  isPersonalBest,
  onPlayAgain,
  onChangeMode,
  onStudyWrong,
  onShare,
  settings
}) => {
  const [showGotItRight, setShowGotItRight] = useState(false);
  const totalCards = results.length;
  const accuracy = Math.round((correctCount / Math.max(1, totalCards)) * 100);
  
  const wrongAnswers = results.filter(r => !r.isCorrect);
  const rightAnswers = results.filter(r => r.isCorrect);
  
  const scoreForLabel = mode.id === 'all' ? (correctCount * 10) : totalScore;
  const scoreLabel = getScoreLabel(scoreForLabel, mode.id, totalCards);
  const wrongGroups = getWrongAnswerGroups(wrongAnswers);

  const handleShare = () => {
    let scoreDisplay = '';
    if (mode.id === 'all') {
      scoreDisplay = `${correctCount}/${totalCards}`;
    } else {
      scoreDisplay = `${totalScore} pts`;
    }

    const shareText = `🎌 Hiragana Quiz results:\n${scoreDisplay} in ${mode.name}!\n${scoreLabel}\n${isPersonalBest ? '🏆 New personal best!\n' : ''}Max streak: ${maxStreak} 🔥\n— played on The Real Neighbors`;
    
    onShare({
      text: shareText,
      gameId: 'hiragana',
      scoreDisplay,
      modeName: mode.name
    });
  };

  const fontClass = settings.fontStyle === 'serif' ? 'font-serif' : 'font-sans';

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-8 pb-24 md:pb-8 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Banner */}
      {isPersonalBest && (
        <div className="bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl py-3 px-4 text-center mb-2">
          <p className="text-yellow-600 dark:text-yellow-400 font-semibold text-sm">
            🏆 New Personal Best! 🎌
          </p>
        </div>
      )}

      {/* Primary Score Area */}
      <div className="text-center">
        <div className="text-5xl mb-4">{mode.icon}</div>
        
        {mode.id === 'all' ? (
          <div>
            <h1 className="font-heading font-bold text-5xl text-main mb-1">
              {correctCount}<span className="text-3xl text-muted">/{totalCards}</span>
            </h1>
            <p className="text-muted text-sm">correct</p>
          </div>
        ) : (
          <div>
            <h1 className="font-heading font-bold text-5xl text-main mb-1">
              {totalScore}
            </h1>
            <p className="text-muted text-sm">pts out of {mode.maxScore}</p>
          </div>
        )}
        
        <p className={`font-semibold text-base mt-4 ${
          accuracy >= 80 ? 'text-green-500' : accuracy >= 50 ? 'text-yellow-500' : 'text-red-500'
        }`}>
          {scoreLabel}
        </p>
      </div>

      {/* Stats Grid */}
      <div className={`bg-elevated rounded-2xl grid ${mode.id === 'all' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-3'} gap-0 overflow-hidden border border-border-subtle`}>
        <div className="p-4 text-center border-r border-b border-border-subtle">
          <p className="text-faint text-xs mb-1 uppercase tracking-wider font-semibold">Correct</p>
          <p className="text-green-500 font-semibold text-xl">{correctCount}</p>
        </div>
        <div className="p-4 text-center border-b border-border-subtle md:border-r">
          <p className="text-faint text-xs mb-1 uppercase tracking-wider font-semibold">Wrong</p>
          <p className="text-red-500 font-semibold text-xl">{wrongAnswers.length}</p>
        </div>
        <div className="p-4 text-center border-r border-b border-border-subtle md:border-b">
          <p className="text-faint text-xs mb-1 uppercase tracking-wider font-semibold">Accuracy</p>
          <p className="text-primary font-semibold text-xl">{accuracy}%</p>
        </div>
        <div className="p-4 text-center border-b border-border-subtle md:border-b-0 md:border-r">
          <p className="text-faint text-xs mb-1 uppercase tracking-wider font-semibold">Best Streak</p>
          <p className="text-orange-400 font-semibold text-xl">{maxStreak} 🔥</p>
        </div>
        {mode.id === 'all' ? (
          <div className="p-4 text-center border-r border-border-subtle md:border-r-0">
            <p className="text-faint text-xs mb-1 uppercase tracking-wider font-semibold">Time</p>
            <p className="text-main font-semibold text-xl">{(totalElapsedMs / 1000).toFixed(1)}s</p>
          </div>
        ) : (
          <div className="p-4 text-center border-r border-border-subtle md:border-r-0">
            <p className="text-faint text-xs mb-1 uppercase tracking-wider font-semibold">Time per Card</p>
            <p className="text-main font-semibold text-xl">{(totalElapsedMs / totalCards / 1000).toFixed(1)}s</p>
          </div>
        )}
      </div>

      {/* Review Section */}
      <div className="mt-2">
        <h3 className="font-semibold text-base text-main mb-4 flex items-center gap-2">
          <span>📊</span> Your Results
        </h3>

        {/* Need Practice */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-faint uppercase tracking-wider mb-3">
            Need More Practice ❌
          </h4>
          
          {wrongAnswers.length === 0 ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
              <p className="text-green-500 font-medium text-sm">Perfect score! 完璧! 🏆</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {Object.entries(wrongGroups).map(([group, chars]) => (
                <div key={group} className="bg-surface border border-red-500/20 rounded-xl p-4">
                  {chars.length > 1 && (
                    <p className="text-red-400 text-xs font-medium mb-3">
                      You struggled with the {group}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {chars.map(c => (
                      <div key={c.character} className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 flex flex-col items-center min-w-[3rem]">
                        <span className={`${fontClass} font-bold text-xl text-main leading-none`}>{c.character}</span>
                        <span className="text-[10px] text-muted mt-1">{c.romaji}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              <button 
                onClick={() => onStudyWrong(wrongAnswers)}
                className="w-full mt-2 py-2.5 rounded-full border-2 border-primary text-primary font-semibold text-sm hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Study These 📚
              </button>
            </div>
          )}
        </div>

        {/* Got it Right */}
        <div>
          <button 
            className="w-full flex items-center justify-between text-xs font-semibold text-faint uppercase tracking-wider mb-3 hover:text-main transition-colors"
            onClick={() => setShowGotItRight(!showGotItRight)}
          >
            <span>Got It Right ✅ ({rightAnswers.length})</span>
            {showGotItRight ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showGotItRight && rightAnswers.length > 0 && (
            <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2">
              {rightAnswers.map(r => (
                <div key={r.char.character} className="bg-green-500/10 border border-green-500/30 rounded-lg px-2 py-1.5 flex flex-col items-center min-w-[2.5rem]">
                  <span className={`${fontClass} font-bold text-lg text-main leading-none`}>{r.char.character}</span>
                  <span className="text-[9px] text-muted mt-1">{r.char.romaji}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-6 border-t border-border-subtle">
        <button 
          className="flex-1 bg-primary hover:bg-primary-hover text-on-primary font-semibold py-3 rounded-full transition-colors flex items-center justify-center gap-2"
          onClick={onPlayAgain}
        >
          <RefreshCw className="w-4 h-4" />
          Play Again
        </button>
        <button 
          className="flex-1 bg-surface border-2 border-border hover:border-primary text-main font-semibold py-3 rounded-full transition-colors flex items-center justify-center gap-2"
          onClick={onChangeMode}
        >
          <Grid className="w-4 h-4" />
          Change Mode
        </button>
        <button 
          className="sm:w-14 bg-surface border-2 border-border hover:border-primary text-main font-semibold py-3 rounded-full transition-colors flex items-center justify-center"
          onClick={handleShare}
          aria-label="Share"
        >
          <Share className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
