import React, { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { useAuthStore } from '../../../stores/authStore';
import type { GhostData } from '../../../hooks/useTypeRacer';

interface GhostSelectorProps {
  mode: string;
  pack: string;
  length: string;
  onSelect: (ghost: GhostData | null) => void;
  selectedGhost: GhostData | null;
}

export const GhostSelector: React.FC<GhostSelectorProps> = ({ mode, pack, length, onSelect, selectedGhost }) => {
  const [ghosts, setGhosts] = useState<GhostData[]>([]);
  const [loading, setLoading] = useState(false);
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    if (mode === 'zen') {
      setGhosts([]);
      onSelect(null);
      return;
    }

    let mounted = true;
    const fetchGhosts = async () => {
      setLoading(true);
      try {
        // We need an index for this query: mode, pack, length, netWPM desc
        const q = query(
          collection(db, 'typeracerGhosts'),
          where('mode', '==', mode),
          where('pack', '==', pack),
          where('length', '==', length),
          orderBy('netWPM', 'desc'),
          limit(10)
        );
        
        const snap = await getDocs(q);
        if (mounted) {
          const fetched: GhostData[] = [];
          snap.forEach(doc => {
            fetched.push(doc.data() as GhostData);
          });
          // Filter out self optionally, or keep self so you can race your own best
          setGhosts(fetched);
          // If the currently selected ghost is no longer in this list, deselect it
          if (selectedGhost && !fetched.find(g => g.uid === selectedGhost.uid)) {
            onSelect(null);
          }
        }
      } catch (err) {
        console.error('Failed to fetch ghosts:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchGhosts();

    return () => { mounted = false; };
  }, [mode, pack, length, user?.id]);

  if (mode === 'zen') return null;

  return (
    <div className="bg-surface rounded-2xl border border-border-subtle p-6 mb-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-main">Race against a Ghost</h3>
        <button 
          onClick={() => onSelect(null)}
          className={`text-sm font-medium ${!selectedGhost ? 'text-primary' : 'text-muted hover:text-main'}`}
        >
          No Ghost
        </button>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
          {[1,2,3].map(i => (
            <div key={i} className="min-w-[150px] h-[80px] bg-elevated rounded-xl animate-pulse flex-shrink-0" />
          ))}
        </div>
      ) : ghosts.length === 0 ? (
        <div className="text-center p-4 border border-dashed border-border-subtle rounded-xl text-muted text-sm">
          No ghosts found for this mode. Be the first to set a time!
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
          {ghosts.map(ghost => (
            <button
              key={ghost.uid}
              onClick={() => onSelect(ghost)}
              className={`min-w-[160px] p-3 rounded-xl border text-left transition-all flex-shrink-0 ${
                selectedGhost?.uid === ghost.uid
                  ? 'bg-primary/10 border-primary shadow-sm'
                  : 'bg-elevated border-border-subtle hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: ghost.avatarColor || '#3b82f6' }}
                >
                  {ghost.displayName.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-sm text-main truncate">{ghost.displayName}</span>
                {user?.id === ghost.uid && <span className="text-[10px] bg-primary/20 text-primary px-1.5 rounded-sm ml-auto">YOU</span>}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-main">{ghost.netWPM}</span>
                <span className="text-xs text-muted">WPM</span>
                <span className="text-xs text-muted ml-auto">{ghost.accuracy}% Acc</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
