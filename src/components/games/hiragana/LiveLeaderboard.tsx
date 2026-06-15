import React, { useMemo } from 'react';
import { type ScoreEntry } from '../../../lib/gameUtils';
import { useAuthStore } from '../../../stores/authStore';

interface LiveLeaderboardProps {
  currentScore: number;
  leaderboardScores: ScoreEntry[];
}

export const LiveLeaderboard: React.FC<LiveLeaderboardProps> = ({ currentScore, leaderboardScores }) => {
  const user = useAuthStore(state => state.user);

  const combinedScores = useMemo(() => {
    if (!user) return [];
    
    // Filter out user's previous best if it exists in the fetched list
    const filteredScores = leaderboardScores.filter(s => s.uid !== user.id);
    
    // Create a live entry for the current game
    const currentEntry: ScoreEntry = {
      uid: user.id,
      displayName: user.displayName + ' (You)',
      avatarColor: user.accentColor || '#6aaa64',
      score: currentScore,
      metadata: {},
      playedAt: new Date(),
      week: '',
      id: 'live-current-user'
    };
    
    const all = [...filteredScores, currentEntry];
    all.sort((a, b) => b.score - a.score);
    
    return all.slice(0, 10); // Keep top 10
  }, [currentScore, leaderboardScores, user]);

  if (!user) return null;

  return (
    <div className="bg-surface rounded-2xl border border-border-subtle p-5 w-full relative overflow-hidden flex flex-col h-full min-h-[400px]">
      <h3 className="text-xs text-faint uppercase tracking-wider font-semibold mb-4 flex items-center justify-between">
        <span>Live Rank</span>
        <span className="text-primary text-[10px] animate-pulse flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
          LIVE
        </span>
      </h3>
      
      <div className="flex-1 relative" style={{ minHeight: `${combinedScores.length * 64}px` }}>
        {combinedScores.map((entry, index) => {
          const isMe = entry.uid === user.id;
          
          return (
            <div
              key={entry.uid}
              className={`absolute left-0 w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                isMe 
                  ? 'bg-primary/10 border-primary shadow-lg shadow-primary/20 z-10' 
                  : 'bg-elevated border-border-subtle z-0 opacity-80'
              }`}
              style={{
                top: `${index * 64}px`, // 56px height + 8px gap = 64px
                height: '56px'
              }}
            >
              <div className="w-6 text-center font-bold text-xs text-muted">
                #{index + 1}
              </div>
              
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: entry.avatarColor }}
              >
                {entry.displayName.charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-1 truncate">
                <div className={`text-sm font-semibold truncate ${isMe ? 'text-primary' : 'text-main'}`}>
                  {entry.displayName}
                </div>
              </div>
              
              <div className={`font-mono font-bold ${isMe ? 'text-primary text-lg' : 'text-main'}`}>
                {Math.floor(entry.score)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
