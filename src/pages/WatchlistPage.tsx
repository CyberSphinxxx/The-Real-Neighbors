import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { subscribeToCollection, deleteDoc } from '../lib/firestore';
import { useWatchlistStore } from '../stores/watchlistStore';
import type { User, WatchlistEntry } from '../types';
import { UserWatchlist } from '../components/watchlist/UserWatchlist';
import { GroupConsensusView } from '../components/watchlist/GroupConsensusView';
import { AddWatchlistEntryModal } from '../components/watchlist/AddWatchlistEntryModal';
import { MediaDetailModal } from '../components/watchlist/MediaDetailModal';
import { WatchlistSkeleton } from '../components/watchlist/WatchlistSkeleton';
import { Tv, Plus, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirm } from '../contexts/ConfirmContext';

export const WatchlistPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const { entries, setEntries } = useWatchlistStore();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [activeTypeFilter, setActiveTypeFilter] = useState<'all' | 'movie' | 'tv' | 'anime'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<WatchlistEntry | undefined>(undefined);
  const [selectedMedia, setSelectedMedia] = useState<WatchlistEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Default tab to current user once loaded
  useEffect(() => {
    if (currentUser && activeTab === 'all' && isLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(currentUser.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, isLoading]);

  useEffect(() => {
    const unsubUsers = subscribeToCollection<User>('users', (data) => setUsers(data));
    
    const unsubWatchlists = subscribeToCollection<WatchlistEntry>('watchlists', (data) => {
      setEntries(data);
      setIsLoading(false);
    });

    return () => {
      unsubUsers();
      unsubWatchlists();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const usersMap = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach(u => map[u.id] = u.displayName);
    return map;
  }, [users]);
  const filteredEntries = useMemo(() => {
    if (activeTypeFilter === 'all') return entries;
    // Treat undefined type as 'movie' for legacy compatibility, or just strictly match. 
    // Plan: Treat undefined as 'movie'
    return entries.filter(e => {
      const type = e.type || 'movie';
      return type === activeTypeFilter;
    });
  }, [entries, activeTypeFilter]);

  const { confirm } = useConfirm();

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Watchlist Entry',
      message: 'Are you sure you want to delete this entry from your watchlist?',
      isDanger: true,
      confirmText: 'Delete'
    });

    if (isConfirmed) {
      try {
        await deleteDoc('watchlists', id);
        useWatchlistStore.getState().invalidate();
        toast.success('Entry deleted');
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete entry');
      }
    }
  };

  const handleEdit = (entry: WatchlistEntry) => {
    setEntryToEdit(entry);
    setShowAddModal(true);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <WatchlistSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  // Sort users so current user is first, then alphabetical
  const sortedUsers = [...users].sort((a, b) => {
    if (a.id === currentUser?.id) return -1;
    if (b.id === currentUser?.id) return 1;
    return a.displayName.localeCompare(b.displayName);
  });

  const isViewingOwn = activeTab === currentUser?.id;

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-main tracking-tight flex items-center gap-3">
            <Tv className="text-primary" /> Shared Watchlist
          </h1>
          <p className="text-sm text-muted mt-1">Track what you're watching and discover group favorites.</p>
        </div>

        {isViewingOwn && (
          <button
            onClick={() => { setEntryToEdit(undefined); setShowAddModal(true); }}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-on-primary font-bold py-2.5 px-4 rounded-xl transition-colors shadow-sm"
          >
            <Plus size={18} /> Add Entry
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto custom-scrollbar gap-2 mb-6 pb-2">
        {/* Consensus Tab */}
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-all flex-shrink-0 ${
            activeTab === 'all'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface border border-border-subtle text-muted hover:bg-base hover:text-main'
          }`}
        >
          <Users size={16} /> Group Picks
        </button>

        <div className="w-px bg-border-subtle mx-1 my-1 flex-shrink-0"></div>

        {/* User Tabs */}
        {sortedUsers.map(u => (
          <button
            key={u.id}
            onClick={() => setActiveTab(u.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold whitespace-nowrap transition-all flex-shrink-0 ${
              activeTab === u.id
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface border border-border-subtle text-muted hover:bg-base hover:text-main'
            }`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${activeTab === u.id ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
              {u.displayName.charAt(0).toUpperCase()}
            </div>
            {u.id === currentUser?.id ? 'My List' : u.displayName.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Content Type Filter */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 custom-scrollbar">
        {(['all', 'movie', 'tv', 'anime'] as const).map(type => {
          const isSelected = activeTypeFilter === type;
          const label = type === 'all' ? '🎬 All' : type === 'movie' ? '🎬 Movies' : type === 'tv' ? '📺 TV Shows' : '🎌 Anime';
          return (
            <button
              key={type}
              onClick={() => setActiveTypeFilter(type)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                isSelected 
                  ? 'bg-primary text-on-primary border-primary' 
                  : 'bg-surface text-muted hover:text-main hover:bg-elevated border-border-subtle'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'all' ? (
          <GroupConsensusView 
            entries={filteredEntries} 
            usersMap={usersMap} 
            onCardClick={setSelectedMedia} 
          />
        ) : (
          <UserWatchlist 
            entries={filteredEntries.filter(e => e.userId === activeTab)} 
            usersMap={usersMap}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCardClick={setSelectedMedia}
          />
        )}
      </div>

      {/* Modal */}
      {showAddModal && (
        <AddWatchlistEntryModal 
          onClose={() => { setShowAddModal(false); setEntryToEdit(undefined); }}
          users={users}
          entryToEdit={entryToEdit}
        />
      )}

      {selectedMedia && (
        <MediaDetailModal
          entry={selectedMedia}
          users={users}
          onClose={() => setSelectedMedia(null)}
        />
      )}
    </div>
  );
};

export default WatchlistPage;
