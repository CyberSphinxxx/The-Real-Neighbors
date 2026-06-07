import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { GAMES_CONFIG, getWeeklyLeaderboard, type ScoreEntry } from '../../lib/gameUtils';
import toast from 'react-hot-toast';

export const LeaderboardSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState(GAMES_CONFIG[0].id);
  const [subTab, setSubTab] = useState('all');
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const data = await getWeeklyLeaderboard(activeTab, subTab);
        if (mounted) {
          setScores(data.slice(0, 5));
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchLeaderboard();
    
    return () => {
      mounted = false;
    };
  }, [activeTab, subTab]);

  const activeGame = GAMES_CONFIG.find(g => g.id === activeTab);

  const formatScore = (gameId: string, entry: ScoreEntry) => {
    if (gameId === 'wordle') {
      return entry.metadata?.attempts ? `${entry.metadata.attempts}/6` : 'Played';
    }
    if (gameId === 'trivia') {
      return `${Math.round(entry.score / 10)}/10`;
    }
    if (gameId === 'reaction') {
      return entry.metadata?.reactionTimeMs 
        ? `${entry.metadata.reactionTimeMs}ms` 
        : `${1000 - entry.score}ms`;
    }
    if (gameId === 'typeracer') {
      return `${entry.score} WPM`;
    }
    return entry.score.toString();
  };

  const renderRankBadge = (index: number) => {
    if (index === 0) return <span className="text-xl">🥇</span>;
    if (index === 1) return <span className="text-xl">🥈</span>;
    if (index === 2) return <span className="text-xl">🥉</span>;
    return <span className="w-6 text-center text-faint text-sm font-medium">{index + 1}</span>;
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-[18px] h-[18px] text-primary" />
          <h2 className="font-semibold text-base text-main">This Week's Best</h2>
        </div>
        <span className="text-faint text-xs">Resets Monday</span>
      </div>

      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 mb-2">
        {GAMES_CONFIG.map(game => (
          <button
            key={game.id}
            onClick={() => setActiveTab(game.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === game.id 
                ? 'bg-primary text-on-primary' 
                : 'bg-elevated text-muted hover:text-main'
            }`}
          >
            {game.name}
          </button>
        ))}
      </div>

      {activeTab === 'typeracer' && (
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 mb-2 px-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'words', label: 'Words' },
            { id: 'quotes', label: 'Quotes' },
            { id: 'timed_30', label: 'Timed 30s' },
            { id: 'timed_60', label: 'Timed 60s' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                subTab === tab.id
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-surface text-muted border border-border-subtle hover:text-main'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 px-3 border-b border-border-subtle last:border-0">
                <div className="w-6 h-6 bg-elevated rounded animate-pulse" />
                <div className="w-8 h-8 rounded-full bg-elevated animate-pulse" />
                <div className="flex-1 h-4 bg-elevated rounded animate-pulse" />
                <div className="w-12 h-4 bg-elevated rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : scores.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-main mb-1">No scores yet this week.</p>
            <p className="text-muted text-sm">Be the first to play! 👀</p>
          </div>
        ) : (
          <div className="p-2">
            {scores.map((score, index) => (
              <div key={score.id} className="flex items-center gap-3 py-2.5 px-3 border-b border-border-subtle last:border-0 hover:bg-surface-hover transition-colors">
                <div className="w-6 flex justify-center">
                  {renderRankBadge(index)}
                </div>
                
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: score.avatarColor || 'var(--color-primary)' }}
                >
                  {score.displayName.charAt(0).toUpperCase()}
                </div>
                
                <span className="font-medium text-sm text-main flex-1 truncate">
                  {score.displayName}
                </span>
                
                <span 
                  className="font-semibold text-sm whitespace-nowrap"
                  style={{ color: activeGame?.accentColor || 'var(--color-primary)' }}
                >
                  {formatScore(activeTab, score)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-3 text-center">
        <button 
          className="text-primary text-sm hover:underline font-medium"
          onClick={() => toast.success("Coming soon!")}
        >
          View your scores
        </button>
      </div>
    </div>
  );
};
