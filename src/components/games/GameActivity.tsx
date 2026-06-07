import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { GAMES_CONFIG } from '../../lib/gameUtils';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  uid: string;
  displayName: string;
  avatarColor: string;
  gameId: string;
  gameName: string;
  score: number;
  summary: string;
  shareData?: any;
  createdAt: any;
}

export const GameActivity: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'gameActivity'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: ActivityItem[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as ActivityItem);
      });
      setActivities(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching game activity:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getGameIcon = (gameId: string) => {
    const game = GAMES_CONFIG.find(g => g.id === gameId);
    return game?.icon || '🎮';
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-primary" />
        <h2 className="font-semibold text-base text-main">Recent Activity</h2>
      </div>

      <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-elevated animate-pulse" />
                <div className="h-4 bg-elevated rounded animate-pulse flex-1" />
                <div className="w-10 h-3 bg-elevated rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-muted text-sm">No activity yet. Start playing! 🎮</p>
          </div>
        ) : (
          <div>
            {activities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-center gap-3 py-3 px-4 border-b border-border-subtle last:border-0 hover:bg-surface-hover transition-colors cursor-pointer"
                onClick={() => {
                  // Future: open a modal to show rich share data
                }}
              >
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: activity.avatarColor || 'var(--color-primary)' }}
                >
                  {activity.displayName.charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1 text-sm text-main truncate">
                  <span className="font-medium mr-1">{activity.displayName}</span>
                  <span className="mr-1">{getGameIcon(activity.gameId)}</span>
                  <span className="text-muted">{activity.summary}</span>
                </div>
                
                <div className="text-faint text-xs whitespace-nowrap">
                  {activity.createdAt?.toDate ? formatDistanceToNow(activity.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
