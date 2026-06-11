import React, { useEffect, useState } from 'react';
import { BookOpen, Smartphone, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPersonalBest, getWeeklyLeaderboard, isMobileDevice, type GameConfig, type ScoreEntry } from '../../lib/gameUtils';
import { HowToPlayModal } from './HowToPlayModal';

interface GameCardProps {
  game: GameConfig;
}

// Hoisted to prevent recreation on every render
const formatScore = (gameId: string, entry: ScoreEntry) => {
  if (gameId === 'wordle') {
    return entry.metadata?.attempts ? `${entry.metadata.attempts}/6 attempts` : 'Played';
  }
  if (gameId === 'trivia') {
    return `${Math.round(entry.score / 10)}/10 correct`;
  }
  if (gameId === 'reaction') {
    return entry.metadata?.reactionTimeMs 
      ? `${entry.metadata.reactionTimeMs}ms` 
      : `${1000 - entry.score}ms`;
  }
  return entry.score.toString();
};

export const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const navigate = useNavigate();
  const [personalBest, setPersonalBest] = useState<ScoreEntry | null>(null);
  const [groupBest, setGroupBest] = useState<ScoreEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchScores() {
      try {
        setError(false);
        const [pb, leaderboard] = await Promise.all([
          getPersonalBest(game.id),
          getWeeklyLeaderboard(game.id)
        ]);
        
        if (isMounted) {
          setPersonalBest(pb);
          setGroupBest(leaderboard.length > 0 ? leaderboard[0] : null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching game scores:', err);
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    fetchScores();

    return () => {
      isMounted = false;
    };
  }, [game.id]);

  // Memoize to avoid repeated regex parsing if isMobileDevice is complex
  const isMobile = React.useMemo(() => isMobileDevice(), []);
  const showMobileWarning = !game.isMobileFriendly && isMobile;

  const handleCardClick = () => navigate(`/games/${game.id}`);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <>
      <div 
        className="bg-surface rounded-2xl border border-border-subtle shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Play ${game.name}`}
      >
        <div 
          className="h-2 w-full" 
          style={{ backgroundColor: game.accentColor }} 
        />
        
        <div className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-3xl mb-2 block">{game.icon}</span>
              <h3 className="font-heading font-bold text-lg text-main">{game.name}</h3>
              <p className="text-muted text-sm mt-1">{game.description}</p>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <span className="bg-elevated text-faint text-xs rounded-full px-2 py-1 capitalize">
                {game.category}
              </span>
              {game.isMobileFriendly && (
                <Smartphone className="w-[14px] h-[14px] text-muted" aria-label="Mobile friendly" />
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border-subtle flex justify-between items-center">
            <div>
              <p className="text-faint text-xs">Your best:</p>
              {loading ? (
                <div className="h-4 w-20 bg-elevated animate-pulse rounded mt-1" />
              ) : error ? (
                <p className="font-semibold text-xs text-danger mt-1">Failed to load</p>
              ) : (
                <p className="font-semibold text-sm text-main">
                  {personalBest ? formatScore(game.id, personalBest) : 'No plays yet'}
                </p>
              )}
            </div>
            
            <div className="text-right">
              <p className="text-faint text-xs">Group best:</p>
              {loading ? (
                <div className="h-4 w-24 bg-elevated animate-pulse rounded mt-1 ml-auto" />
              ) : error ? (
                <p className="font-semibold text-xs text-danger mt-1">Failed to load</p>
              ) : (
                <p className="text-sm text-main font-medium">
                  {groupBest ? `${groupBest.displayName} (${formatScore(game.id, groupBest)})` : 'Be the first!'}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button 
              className="flex-1 bg-primary text-on-primary rounded-full py-2 font-medium text-sm hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              tabIndex={-1} // Handled by parent card
            >
              Play
            </button>
            <button 
              className="w-8 h-8 flex items-center justify-center bg-elevated rounded-full border border-border-subtle hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={(e) => {
                e.stopPropagation();
                setIsHowToPlayOpen(true);
              }}
              aria-label="How to play"
            >
              <BookOpen className="w-4 h-4 text-main" />
            </button>
          </div>

          {showMobileWarning && (
            <div className="mt-3 flex items-center gap-1.5 text-warning text-xs">
              <AlertTriangle className="w-3 h-3" />
              <span>Best on desktop</span>
            </div>
          )}
        </div>
      </div>

      {isHowToPlayOpen && (
        <HowToPlayModal 
          game={game} 
          onClose={() => setIsHowToPlayOpen(false)} 
        />
      )}
    </>
  );
};
