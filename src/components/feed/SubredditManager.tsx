import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { updateDoc } from '../../lib/firestore';
import { useAuthStore } from '../../stores/authStore';

interface SubredditManagerProps {
  onClose: () => void;
  subreddits: string[];
  align?: 'left' | 'right';
}

export const SubredditManager: React.FC<SubredditManagerProps> = ({ onClose, subreddits, align = 'right' }) => {
  const { user, setUser } = useAuthStore();
  const [newSub, setNewSub] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const sub = newSub.trim().replace(/^r\//, '');
    if (!sub) return;
    
    if (subreddits.includes(sub)) {
      setError('Subreddit already added');
      return;
    }

    if (subreddits.length >= 10) {
      setError('Maximum 10 subreddits allowed');
      return;
    }

    setIsAdding(true);
    setError('');

    try {
      const res = await fetch(`/api/reddit?path=/r/${sub}/.rss&limit=1`);
      
      if (!res.ok) {
        setError('Subreddit not found or NSFW');
        return;
      }

      const updatedSubs = [...subreddits, sub];
      await updateDoc('users', [user.id], { subreddits: updatedSubs });
      setUser({ ...user, subreddits: updatedSubs });
      setNewSub('');
    } catch (err) {
      setError('Failed to verify subreddit');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (sub: string) => {
    if (!user) return;
    const updatedSubs = subreddits.filter(s => s !== sub);
    await updateDoc('users', [user.id], { subreddits: updatedSubs });
    setUser({ ...user, subreddits: updatedSubs });
  };

  return (
    <div className={`absolute top-full mt-2 w-[300px] bg-elevated rounded-xl border border-border shadow-lg p-4 z-50 animate-in fade-in zoom-in-95 duration-200 ${align === 'left' ? 'left-0' : 'right-0'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-main">Your Subreddits</h3>
        <button onClick={onClose} className="text-muted hover:text-main p-1 rounded-full transition-colors hover:bg-surface">
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-2 mb-4 max-h-[200px] overflow-y-auto custom-scrollbar">
        {subreddits.length === 0 ? (
          <p className="text-xs text-muted text-center py-2">No subreddits added.</p>
        ) : (
          subreddits.map(sub => (
            <div key={sub} className="flex items-center justify-between px-2 py-1.5 bg-surface rounded-lg border border-border-subtle">
              <span className="text-sm text-main font-medium truncate">r/{sub}</span>
              <button 
                onClick={() => handleRemove(sub)}
                className="text-muted hover:text-red-500 transition-colors p-1"
              >
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={newSub}
            onChange={(e) => { setNewSub(e.target.value); setError(''); }}
            placeholder="Add subreddit..."
            className="flex-1 bg-surface border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-main placeholder:text-muted focus:border-primary outline-none"
          />
          <button
            type="submit"
            disabled={!newSub.trim() || isAdding}
            className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {isAdding ? <Loader2 size={16} className="animate-spin" /> : 'Add'}
          </button>
        </div>
        {error && <p className="text-red-500 text-xs px-1">{error}</p>}
      </form>
    </div>
  );
};
