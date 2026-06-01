import React, { useEffect, useState } from 'react';
import { subscribeToCollection } from '../../lib/firestore';

interface StreakData {
  id?: string;
  currentStreak: number;
  lastPostDate: string;
  longestStreak: number;
}

const GroupStreakWidgetComponent: React.FC = () => {
  const [streak, setStreak] = useState<StreakData | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToCollection<StreakData>(
      'groupStats',
      (data) => {
        const streakData = data.find((d: StreakData) => d.id === 'streak');
        if (streakData) {
          setStreak(streakData);
        }
      }
    );
    return () => unsubscribe();
  }, []);

  const handlePostNow = () => {
    // Scroll to the composer
    // In FeedPage, we have composerRef, but we can just use DOM methods here
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const composer = document.querySelector('textarea') as HTMLTextAreaElement;
    if (composer) {
      setTimeout(() => composer.focus(), 500); // Wait for scroll
    }
  };

  const getYesterdayDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const isBroken = streak?.lastPostDate && streak.lastPostDate < getYesterdayDateStr();
  const currentStreak = streak?.currentStreak || 0;
  const longestStreak = streak?.longestStreak || 0;

  return (
    <div 
      className="bg-surface rounded-xl shadow-sm p-4"
      style={{ border: '1px solid var(--color-border-subtle)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest">
          Group Streak
        </h3>
      </div>

      <div className="flex flex-col items-center justify-center text-center">
        {!streak || currentStreak === 0 ? (
          <>
            <span className="text-4xl mb-2">💀</span>
            <div className="font-heading font-bold text-lg text-main mb-1">
              No streak yet
            </div>
            <p className="text-sm text-muted">Post something to start one!</p>
          </>
        ) : isBroken ? (
          <>
            <span className="text-4xl mb-2">💔</span>
            <div className="font-heading font-bold text-lg text-danger mb-1">
              Streak broken!
            </div>
            <p className="text-xs text-muted mb-3">
              Last post was {streak.lastPostDate}. Post now to restart!
            </p>
            <button
              onClick={handlePostNow}
              className="px-4 py-1.5 rounded-full border border-danger text-danger text-xs font-semibold hover:bg-danger/10 transition-colors"
            >
              Post Now
            </button>
          </>
        ) : (
          <>
            <span className="text-4xl mb-2 inline-block animate-pulse">🔥</span>
            <div className="font-heading font-bold text-2xl text-main">
              {currentStreak} day streak
            </div>
            <p className="text-xs text-faint mt-1 font-medium tracking-wide uppercase">
              Best: {longestStreak} days
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export const GroupStreakWidget = React.memo(GroupStreakWidgetComponent);
