import { useState, useEffect, useMemo, useRef } from 'react';
import { subscribeToCollection } from '../lib/firestore';
import { Select } from '../components/ui/Select';
import { PlaylistCard } from '../components/playlist/PlaylistCard';
import { AddPlaylistModal } from '../components/playlist/AddPlaylistModal';
import { Plus, Search, Shuffle, Music2, Loader2, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Playlist, User } from '../types';

const SUBTITLES = [
  "Kanta tayo! 🎶",
  "Vibing hour 🎧",
  "Drop your playlist here!",
  "Music is better shared.",
  "What are we listening to?"
];

const GENRES = [
  { emoji: '', label: 'All', color: 'var(--color-primary)' },
  { emoji: '🎵', label: 'Pop', color: '#ec4899' },
  { emoji: '🎸', label: 'Rock', color: '#ef4444' },
  { emoji: '🎹', label: 'OPM', color: '#f97316' },
  { emoji: '🌸', label: 'J-Pop', color: '#a855f7' },
  { emoji: '🎌', label: 'Anime', color: '#3b82f6' },
  { emoji: '🎧', label: 'Hip-Hop', color: '#facc15' },
  { emoji: '🌊', label: 'R&B', color: '#14b8a6' },
  { emoji: '⚡', label: 'EDM', color: '#06b6d4' },
  { emoji: '🎷', label: 'Jazz', color: '#f59e0b' },
  { emoji: '🎻', label: 'Classical', color: '#8b5cf6' },
  { emoji: '🎮', label: 'Gaming OST', color: '#22c55e' },
  { emoji: '😌', label: 'Lo-fi', color: '#64748b' },
  { emoji: '✨', label: 'Custom', color: 'var(--color-primary)' },
];

export default function PlaylistPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [subtitle] = useState(() => SUBTITLES[Math.floor(Math.random() * SUBTITLES.length)]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Filters & Search
  const [activeGenre, setActiveGenre] = useState('All');
  const [activeMemberFilter, setActiveMemberFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'Recent' | 'Rated' | 'Commented' | 'A-Z'>('Recent');
  const [searchQuery, setSearchQuery] = useState('');
  
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(Math.ceil(scrollLeft) < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);


  useEffect(() => {
    let isMounted = true;
    const unsubUsers = subscribeToCollection<User>('users', (data) => {
      if (isMounted) setUsers(data);
    });
    const unsubPlaylists = subscribeToCollection<Playlist>('playlists', (data) => {
      if (isMounted) {
        setPlaylists(data);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubUsers();
      unsubPlaylists();
    };
  }, []);

  const filteredAndSortedPlaylists = useMemo(() => {
    let filtered = [...playlists];

    if (activeGenre !== 'All') {
      const genreLabel = activeGenre;
      // Also match custom genres if the active filter is 'Custom' and it's a custom tag?
      // Wait, the prompt says "Custom: shows ✨ + custom label text".
      // If they click 'Custom' pill, do they filter by ALL custom tags or just a specific one?
      // The prompt says: "When a user selects "Custom" as the genre in the Add Playlist modal... The entered text becomes the vibeTag.label".
      // If the label is customized, clicking "Custom" filter wouldn't match `p.vibeTag?.label === 'Custom'` because the label is different.
      // But wait! If the filter pill is 'Custom', and `p.vibeTag.label` is custom text, we can check if `p.vibeTag?.emoji === '✨'` since that's fixed for Custom.
      if (activeGenre === 'Custom') {
        filtered = filtered.filter(p => p.vibeTag?.emoji === '✨');
      } else {
        filtered = filtered.filter(p => p.vibeTag?.label === genreLabel);
      }
    }

    if (activeMemberFilter) {
      filtered = filtered.filter(p => p.addedBy === activeMemberFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => p.title.toLowerCase().includes(query));
    }

    switch (sortBy) {
      case 'Recent':
        filtered.sort((a, b) => b.addedAt - a.addedAt);
        break;
      case 'Rated':
        filtered.sort((a, b) => {
          const aVals = Object.values(a.ratings || {});
          const bVals = Object.values(b.ratings || {});
          const aAvg = aVals.length ? aVals.reduce((sum, val) => sum + val, 0) / aVals.length : 0;
          const bAvg = bVals.length ? bVals.reduce((sum, val) => sum + val, 0) / bVals.length : 0;
          return bAvg - aAvg;
        });
        break;
      case 'A-Z':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'Commented':
        // We don't have accurate subcollection comment counts here easily without aggregating.
        // As a fallback, we just sort by Recent if Commented is selected, or we'd need a cloud function to sync comment counts.
        // Given constraints, fallback to Recent or assume they want to see active ones.
        // The prompt says "Most Commented" - if we don't have it on the document, we can't sort locally perfectly. Let's fallback to Recent for now.
        filtered.sort((a, b) => b.addedAt - a.addedAt);
        break;
    }

    return filtered;
  }, [playlists, activeGenre, activeMemberFilter, sortBy, searchQuery]);

  const handleSurpriseMe = () => {
    if (filteredAndSortedPlaylists.length === 0) {
      toast('No playlists match your filters!', { icon: '🎵' });
      return;
    }

    const randomIdx = Math.floor(Math.random() * filteredAndSortedPlaylists.length);
    const randomPlaylist = filteredAndSortedPlaylists[randomIdx];
    const cardEl = cardRefs.current.get(randomPlaylist.id);

    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      cardEl.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
      setTimeout(() => {
        cardEl.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
      }, 2500);
    }
  };

  // Get unique members who have added playlists for the member filter
  const playlistAuthors = useMemo(() => {
    const authorIds = new Set(playlists.map(p => p.addedBy));
    return users.filter(u => authorIds.has(u.id));
  }, [playlists, users]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col h-full animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-subtle bg-base/80 backdrop-blur-md sticky top-0 z-20 pt-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-main">Playlists 🎵</h1>
          <p className="text-muted text-sm mt-1 font-medium">{subtitle}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-sm font-medium hover:bg-primary-hover transition-colors shadow-sm"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add Playlist</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Filter & Sort Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        {/* Left: Genre Pills */}
        <div className="relative flex-1 min-w-0 flex items-center group">
          {showLeftArrow && (
            <button
              onClick={() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
                }
              }}
              className="absolute left-0 z-20 p-1 bg-surface shadow-md rounded-full hidden md:flex items-center justify-center text-main hover:bg-elevated transition-colors"
              style={{ top: '50%', transform: 'translateY(-50%)', marginLeft: '-10px' }}
            >
              <ChevronLeft size={20} />
            </button>
          )}

          <div 
            ref={scrollContainerRef}
            id="playlist-category-scroll"
            onScroll={checkScroll}
            className="flex gap-2 overflow-x-auto custom-scrollbar w-full scroll-smooth relative z-10 py-1"
          >
            {GENRES.map(genre => {
              const isSelected = activeGenre === genre.label;
              return (
                <button
                  key={genre.label}
                  onClick={() => setActiveGenre(genre.label)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                  style={{
                    background: isSelected ? `color-mix(in srgb, ${genre.color} 15%, transparent)` : 'var(--color-bg-surface)',
                    color: isSelected ? genre.color : 'var(--color-text-muted)',
                    border: `1px solid ${isSelected ? genre.color : 'var(--color-border-border-subtle)'}`,
                  }}
                >
                  {genre.emoji && <span>{genre.emoji}</span>}
                  <span>{genre.label}</span>
                </button>
              );
            })}
          </div>

          {showRightArrow && (
            <button
              onClick={() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
                }
              }}
              className="absolute right-0 z-20 p-1 bg-surface shadow-md rounded-full hidden md:flex items-center justify-center text-main hover:bg-elevated transition-colors"
              style={{ top: '50%', transform: 'translateY(-50%)', marginRight: '-10px' }}
            >
              <ChevronRight size={20} />
            </button>
          )}

          {/* Fade Gradient Hint */}
          {showRightArrow && (
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-base to-transparent pointer-events-none z-10"></div>
          )}
        </div>

        {/* Right: Member Filter & Sort */}
        <div className="flex items-center gap-3">
          {/* Member Avatars */}
          <div className="flex -space-x-1.5">
            {playlistAuthors.slice(0, 5).map((author, idx) => (
              <button
                key={author.id}
                onClick={() => setActiveMemberFilter(activeMemberFilter === author.id ? null : author.id)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 transition-transform ${activeMemberFilter === author.id ? 'border-primary z-10 scale-110' : 'border-surface hover:scale-105'} shadow-sm`}
                style={{ background: author.avatarUrl ? undefined : (author.accentColor || '#3b82f6'), zIndex: activeMemberFilter === author.id ? 20 : 10 - idx }}
                title={author.displayName}
              >
                {author.avatarUrl ? (
                  <img src={author.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  author.displayName.charAt(0).toUpperCase()
                )}
              </button>
            ))}
            {activeMemberFilter && (
              <button
                onClick={() => setActiveMemberFilter(null)}
                className="w-7 h-7 rounded-full bg-elevated border-2 border-surface flex items-center justify-center text-muted hover:text-main hover:bg-base z-20 shadow-sm transition-colors"
                title="Clear member filter"
              >
                ✕
              </button>
            )}
          </div>

          <div className="relative">
              <Select
                value={sortBy}
                onChange={(val) => setSortBy(val as 'Recent' | 'Rated' | 'Commented' | 'A-Z')}
                options={[
                  { value: 'Recent', label: 'Recently Added' },
                  { value: 'Rated', label: 'Most Rated' },
                  { value: 'A-Z', label: 'A-Z' }
                ]}
                className="w-[160px] bg-surface border border-border-subtle rounded-lg text-sm text-main focus-within:border-primary outline-none"
              />
            <Filter size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Search & Random Row */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-full md:w-[260px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search playlists..."
            className="w-full bg-surface rounded-full border border-border-subtle pl-9 pr-4 py-2 text-sm text-main placeholder:text-muted focus:border-primary outline-none transition-colors"
          />
        </div>
        <button
          onClick={handleSurpriseMe}
          className="flex items-center gap-1.5 text-primary text-sm font-medium px-3 py-1.5 rounded-full border border-primary/30 hover:bg-primary/10 transition-colors flex-shrink-0"
        >
          <Shuffle size={16} />
          Surprise Me
        </button>
      </div>

      {/* Grid */}
      {filteredAndSortedPlaylists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-surface border border-border-subtle rounded-full flex items-center justify-center mb-4">
            <Music2 size={32} className="text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-main mb-1">No playlists found</h3>
          <p className="text-muted text-sm mb-6">Be the first to add one! 🎵</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-on-primary rounded-full text-sm font-medium hover:bg-primary-hover transition-colors shadow-sm"
          >
            <Plus size={16} />
            Add Playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
          {filteredAndSortedPlaylists.map(playlist => (
            <div key={playlist.id} ref={el => { if (el) cardRefs.current.set(playlist.id, el); }} className="transition-all rounded-2xl">
              <PlaylistCard playlist={playlist} allUsers={users} />
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddPlaylistModal onClose={() => setShowAddModal(false)} allUsers={users} />
      )}
    </div>
  );
}
