import { useState, useEffect, useRef } from 'react';
import { GameShell } from '../../components/games/GameShell';
import { submitScore } from '../../lib/gameUtils';
import { ShareToFeedModal } from '../../components/games/ShareToFeedModal';

type Phase = 'instructions' | 'waiting' | 'ready' | 'clicked' | 'toosoon' | 'results';

export default function ReactionPage() {
  const [phase, setPhase] = useState<Phase>('instructions');
  const [attempts, setAttempts] = useState<number[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState(1);
  const [waitStart, setWaitStart] = useState<number>(0);
  const [currentReactionTime, setCurrentReactionTime] = useState<number>(0);
  const [showShareModal, setShowShareModal] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const startGame = () => {
    setAttempts([]);
    setCurrentAttempt(1);
    startWaitingPhase();
  };

  const startWaitingPhase = () => {
    setPhase('waiting');
    
    // Random delay between 2000ms and 5000ms
    const delay = Math.random() * 3000 + 2000;
    
    timeoutRef.current = setTimeout(() => {
      setWaitStart(Date.now());
      setPhase('ready');
    }, delay);
  };

  const handleScreenClick = () => {
    if (phase === 'waiting') {
      // Clicked too soon
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setPhase('toosoon');
      
      const newAttempts = [...attempts, 999]; // Penalty
      setAttempts(newAttempts);
      
      setTimeout(() => {
        advanceAttempt(newAttempts);
      }, 1500);

    } else if (phase === 'ready') {
      // Clicked on green
      const reactionTime = Date.now() - waitStart;
      setCurrentReactionTime(reactionTime);
      setPhase('clicked');
      
      const newAttempts = [...attempts, reactionTime];
      setAttempts(newAttempts);
      
      setTimeout(() => {
        advanceAttempt(newAttempts);
      }, 1500);
    }
  };

  const advanceAttempt = (currentAttempts: number[]) => {
    if (currentAttempts.length < 5) {
      setCurrentAttempt(prev => prev + 1);
      startWaitingPhase();
    } else {
      finishGame(currentAttempts);
    }
  };

  const finishGame = (finalAttempts: number[]) => {
    setPhase('results');
    
    const sum = finalAttempts.reduce((a, b) => a + b, 0);
    const avg = sum / 5;
    
    const roundedAvg = Math.round(avg);
    const score = Math.max(0, 1000 - roundedAvg);
    
    submitScore('reaction', score, {
      reactionTimeMs: roundedAvg
    }, `got an average reaction time of ${roundedAvg}ms`);
  };

  const getTimeColor = (time: number) => {
    if (time === 999) return 'text-red-500';
    if (time < 200) return 'text-green-400';
    if (time < 300) return 'text-[#f59e0b]'; // Using primary/amber
    if (time < 400) return 'text-amber-400';
    if (time < 500) return 'text-orange-400';
    return 'text-red-400';
  };

  const getEmojiForTime = (time: number) => {
    if (time === 999) return '❌';
    if (time < 200) return '⚡';
    if (time < 300) return '🔥';
    if (time < 400) return '👍';
    if (time < 500) return '😐';
    return '💀';
  };

  const getMessageForTime = (time: number) => {
    if (time === 999) return 'Penalty!';
    if (time < 200) return 'Superhuman! ⚡';
    if (time < 300) return 'Excellent! 🔥';
    if (time < 400) return 'Good 👍';
    if (time < 500) return 'Average 😐';
    return 'Slow... 💀';
  };

  const getShareText = () => {
    const validAttempts = attempts.filter(a => a !== 999);
    const avg = Math.round(attempts.reduce((a, b) => a + b, 0) / 5);
    const best = validAttempts.length > 0 ? Math.min(...validAttempts) : 999;
    
    let comment = 'Anyone faster? 😅';
    if (avg < 250) comment = 'I am built different 🧠';
    else if (avg < 350) comment = 'Not bad! Can you beat me? 👀';

    return `⚡ My reaction time: ${avg}ms average!\nBest attempt: ${best === 999 ? 'N/A' : `${best}ms`}\n\n${comment}\n\n— played on The Real Neighbors`;
  };

  // Full screen interaction container classes
  const getContainerClasses = () => {
    const base = "w-full min-h-[calc(100vh-48px)] flex flex-col items-center justify-center select-none ";
    if (phase === 'waiting') return base + "bg-[#ef4444] cursor-pointer";
    if (phase === 'ready') return base + "bg-[#22c55e] cursor-pointer";
    if (phase === 'toosoon') return base + "bg-danger/20";
    return base + "bg-transparent";
  };

  // Calculate results data
  const validAttempts = attempts.filter(a => a !== 999);
  const best = validAttempts.length > 0 ? Math.min(...validAttempts) : 999;
  const worst = validAttempts.length > 0 ? Math.max(...validAttempts) : 999;
  const average = Math.round(attempts.reduce((a, b) => a + b, 0) / 5);

  return (
    <GameShell gameId="reaction">
      <div 
        className={getContainerClasses()}
        onClick={(phase === 'waiting' || phase === 'ready') ? handleScreenClick : undefined}
      >
        
        {phase === 'instructions' && (
          <div className="w-full max-w-md mx-auto p-8 bg-surface border border-border-subtle rounded-2xl shadow-sm text-center animate-in slide-in-from-bottom-4">
            <div className="text-6xl mb-4">⚡</div>
            <h1 className="font-heading font-bold text-2xl text-main mb-2">Reaction Time Test</h1>
            <p className="text-muted text-base mb-6">Wait for green... then tap as fast as you can!</p>
            
            <p className="text-faint text-sm mb-8">5 rounds — your average is your score</p>
            
            <button 
              className="bg-[#f59e0b] text-white rounded-full px-12 py-3.5 font-medium text-base hover:brightness-110 transition-colors shadow-sm"
              onClick={startGame}
            >
              Start
            </button>
          </div>
        )}

        {phase === 'waiting' && (
          <div className="text-center p-4">
            <h2 className="text-white font-heading font-bold text-3xl sm:text-4xl mb-2">Wait for it...</h2>
            <p className="text-white/70 text-base sm:text-lg mb-8">Don't click yet! 🛑</p>
            
            <div className="flex justify-center gap-3 mt-12">
              {[1, 2, 3, 4, 5].map(n => (
                <div 
                  key={n} 
                  className={`w-3 h-3 rounded-full transition-colors ${
                    n < currentAttempt ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {phase === 'ready' && (
          <div className="text-center p-4">
            <h2 className="text-white font-heading font-bold text-5xl sm:text-7xl animate-pulse">GO!</h2>
          </div>
        )}

        {phase === 'clicked' && (
          <div className="text-center animate-in zoom-in-95 duration-200">
            <h2 className={`font-heading font-bold text-5xl sm:text-6xl mb-2 ${getTimeColor(currentReactionTime)}`}>
              {currentReactionTime}ms
            </h2>
            <p className={`text-xl font-medium mb-8 ${getTimeColor(currentReactionTime)}`}>
              {getMessageForTime(currentReactionTime)}
            </p>
            <p className="text-muted">Attempt {currentAttempt} of 5</p>
          </div>
        )}

        {phase === 'toosoon' && (
          <div className="text-center animate-in shake duration-300">
            <h2 className="text-danger font-heading font-bold text-3xl mb-2">Too soon! 😤</h2>
            <p className="text-muted text-lg">Wait for the screen to turn GREEN</p>
            <p className="text-danger text-sm mt-4 font-medium">Penalty (+999ms)</p>
          </div>
        )}

        {phase === 'results' && (
          <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-surface border border-border-subtle rounded-2xl shadow-sm animate-in slide-in-from-bottom-4">
            <h2 className="font-heading font-bold text-2xl text-main text-center mb-6">Your Results ⚡</h2>
            
            <div className="text-center mb-8">
              <div className={`font-heading font-bold text-5xl sm:text-6xl mb-2 ${getTimeColor(average)}`}>
                {average}ms
              </div>
              <p className="text-muted text-lg">average</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8 bg-elevated rounded-xl p-4">
              <div>
                <p className="text-faint text-xs uppercase tracking-wider mb-1">Best time</p>
                <p className={`font-mono font-bold text-lg ${best === 999 ? 'text-red-500' : 'text-main'}`}>
                  {best === 999 ? 'N/A' : `${best}ms`}
                </p>
              </div>
              <div>
                <p className="text-faint text-xs uppercase tracking-wider mb-1">Worst time</p>
                <p className={`font-mono font-bold text-lg ${worst === 999 ? 'text-red-500' : 'text-main'}`}>
                  {worst === 999 ? 'N/A' : `${worst}ms`}
                </p>
              </div>
              <div>
                <p className="text-faint text-xs uppercase tracking-wider mb-1">Attempts</p>
                <p className="font-mono font-bold text-lg text-main">5/5</p>
              </div>
              <div>
                <p className="text-faint text-xs uppercase tracking-wider mb-1">Grade</p>
                <p className="text-xl">{getEmojiForTime(average)}</p>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-muted text-sm mb-3">Your 5 attempts:</p>
              <div className="flex flex-wrap gap-2">
                {attempts.map((t, i) => (
                  <div 
                    key={i} 
                    className={`rounded-full px-3 py-1 text-xs font-mono font-medium border ${
                      t === 999 ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-elevated border-border-subtle text-main'
                    }`}
                  >
                    {t === 999 ? '❌' : `${t}ms`}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                className="w-full bg-[#f59e0b] text-white rounded-full py-3.5 font-medium hover:brightness-110 transition-colors flex justify-center items-center gap-2 shadow-sm"
                onClick={() => setShowShareModal(true)}
              >
                Share Result ⚡
              </button>
              <button 
                className="w-full bg-elevated text-main border border-border-subtle rounded-full py-3.5 font-medium hover:bg-surface-hover transition-colors"
                onClick={startGame}
              >
                Play Again
              </button>
            </div>
          </div>
        )}

      </div>

      {showShareModal && (
        <ShareToFeedModal
          gameId="reaction"
          scoreDisplay={`${average}ms`}
          resultCard={
            <div className="text-center">
              <div className="font-heading font-bold text-4xl text-[#f59e0b] leading-none mb-1">{average}ms</div>
              <div className="text-sm font-medium text-main">Average Reaction Time</div>
            </div>
          }
          shareText={getShareText()}
          onClose={() => setShowShareModal(false)}
          onShare={() => {}}
        />
      )}
    </GameShell>
  );
}
