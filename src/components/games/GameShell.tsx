import React, { useEffect, useState } from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GAMES_CONFIG, getPersonalBest, isMobileDevice, type ScoreEntry } from '../../lib/gameUtils';

interface GameShellProps {
  gameId: string;
  children: React.ReactNode;
  subMode?: string;
  onBack?: () => void;
}

export const GameShell: React.FC<GameShellProps> = ({ gameId, subMode, children, onBack }) => {
  const navigate = useNavigate();
  const game = GAMES_CONFIG.find(g => g.id === gameId);
  const [personalBest, setPersonalBest] = useState<ScoreEntry | null>(null);

  useEffect(() => {
    async function fetchBest() {
      const best = await getPersonalBest(gameId, subMode);
      setPersonalBest(best);
    }
    fetchBest();
  }, [gameId, subMode]);

  if (!game) return <div>Game not found</div>;

  const isMobile = isMobileDevice();
  const showMobileWarning = !game.isMobileFriendly && isMobile;

  const formatScore = (score: number) => {
    if (game.id === 'wordle') return `${score}/6`;
    if (game.id === 'trivia') return `${score}/10`;
    if (game.id === 'reaction') return `${score}ms`;
    return score.toString();
  };

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Top Bar */}
      <div className="mt-4 mx-4 mb-2 h-14 bg-surface/80 backdrop-blur-md border border-border-subtle rounded-2xl flex items-center justify-between px-5 flex-shrink-0 z-10 shadow-sm relative">
        <button 
          onClick={onBack ? onBack : () => navigate('/games')}
          className="flex items-center gap-2 text-muted hover:text-main transition-colors bg-elevated/50 hover:bg-elevated px-3 py-1.5 rounded-xl border border-transparent hover:border-border-subtle"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline text-sm font-medium">Games</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xl">{game.icon}</span>
          <span className="font-semibold text-sm text-main">{game.name}</span>
        </div>

        <div className="min-w-[100px] flex justify-end">
          {personalBest && (
            <span className="text-primary text-xs rounded-xl px-3 py-1.5 font-bold border border-primary shadow-sm">
              Best: {formatScore(personalBest.score)}
            </span>
          )}
        </div>
      </div>

      {showMobileWarning && (
        <div className="bg-warning/10 border-b border-warning/20 p-2 flex items-center justify-center gap-2 text-warning text-xs">
          <AlertTriangle className="w-4 h-4" />
          <span>This game is best experienced on a desktop device.</span>
        </div>
      )}

      {/* Game Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        {children}
      </div>
    </div>
  );
};
