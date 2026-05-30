import React, { useState, useEffect, useMemo } from 'react';
import { subscribeToCollection } from '../../lib/firestore';
import type { User, YoutubeQueueItem } from '../../types';
import { YoutubePlayer } from './YoutubePlayer';
import { YoutubeQueue } from './YoutubeQueue';
import { AddVideoModal } from './AddVideoModal';
import { Plus, PlaySquare, Loader2 } from 'lucide-react';

export const WatchTogetherTab: React.FC = () => {
  const [queue, setQueue] = useState<YoutubeQueueItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const unsubQueue = subscribeToCollection<YoutubeQueueItem>('youtubeQueue', (data) => {
      // Sort by createdAt ascending
      const sorted = [...data].sort((a, b) => a.createdAt - b.createdAt);
      setQueue(sorted);
      setIsLoading(false);
    });
    
    const unsubUsers = subscribeToCollection<User>('users', setUsers);

    return () => {
      unsubQueue();
      unsubUsers();
    };
  }, []);

  const usersMap = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach(u => map[u.id] = u.displayName);
    return map;
  }, [users]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted" />
      </div>
    );
  }

  const currentVideo = queue.length > 0 ? queue[0] : undefined;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#ff0000]/10 rounded-xl text-[#ff0000]">
            <PlaySquare size={24} />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl text-main">Watch Party</h2>
            <p className="text-sm text-muted leading-tight">Shared neighborhood queue.</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-[#ff0000] hover:bg-[#cc0000] text-white font-bold py-2.5 px-4 rounded-xl transition-colors shadow-sm"
        >
          <Plus size={18} /> Add to Queue
        </button>
      </div>

      <YoutubePlayer currentVideo={currentVideo} />
      
      <YoutubeQueue queue={queue} usersMap={usersMap} />

      {showAddModal && (
        <AddVideoModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
};
