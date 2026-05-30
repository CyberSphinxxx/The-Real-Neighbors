import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { addDoc, updateDoc } from '../../lib/firestore';
import type { WatchlistEntry, User } from '../../types';
import { X, Tv, Star, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
  users: User[];
  entryToEdit?: WatchlistEntry;
}

export const AddWatchlistEntryModal: React.FC<Props> = ({ onClose, users, entryToEdit }) => {
  const { user } = useAuthStore();
  const [title, setTitle] = useState(entryToEdit?.title || '');
  const [status, setStatus] = useState<'watching' | 'finished' | 'planned'>(entryToEdit?.status || 'planned');
  const [rating, setRating] = useState<number>(entryToEdit?.rating || 0);
  const [recommendedBy, setRecommendedBy] = useState(entryToEdit?.recommendedBy || '');
  const [coverUrl, setCoverUrl] = useState(entryToEdit?.coverUrl || '');
  const [tmdbId, setTmdbId] = useState(entryToEdit?.tmdbId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!title.trim() || entryToEdit) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const apiKey = import.meta.env.VITE_TMDB_API_KEY;
        if (!apiKey) {
          setIsSearching(false);
          return;
        }
        const res = await fetch(`https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(title)}&api_key=${apiKey}&language=en-US&page=1`);
        const data = await res.json();
        const filtered = data.results?.filter((r: any) => r.media_type === 'tv' || r.media_type === 'movie').slice(0, 5) || [];
        setSearchResults(filtered);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [title, entryToEdit]);

  const handleSelectResult = (result: any) => {
    const resultTitle = result.title || result.name;
    setTitle(resultTitle);
    if (result.poster_path) {
      setCoverUrl(`https://image.tmdb.org/t/p/w500${result.poster_path}`);
    }
    setTmdbId(result.id.toString());
    setShowResults(false);
  };

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const payload: Partial<WatchlistEntry> = {
        title: title.trim(),
        status,
        coverUrl: coverUrl.trim() || undefined,
        recommendedBy: recommendedBy || undefined,
        tmdbId: tmdbId.trim() || undefined,
      };

      if (status === 'finished' && rating > 0) {
        payload.rating = rating;
      } else {
        payload.rating = undefined; // clear rating if not finished
      }

      if (entryToEdit) {
        await updateDoc('watchlists', [entryToEdit.id], payload);
        toast.success('Entry updated');
      } else {
        payload.userId = user.id;
        payload.createdAt = Date.now();
        await addDoc('watchlists', payload as any);
        toast.success('Entry added');
      }
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRatingInput = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star === rating ? 0 : star)} // Click same star to clear
            className="focus:outline-none p-1 transition-transform hover:scale-110"
          >
            <Star 
              size={24} 
              className={`transition-colors ${star <= rating ? 'fill-warning text-warning' : 'text-muted hover:text-warning/50'}`} 
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm font-semibold text-warning">{rating} / 5</span>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-base border border-border-subtle rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-full animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border-subtle bg-surface">
          <h2 className="text-xl font-heading font-bold text-main flex items-center gap-2">
            <Tv className="text-primary" /> 
            {entryToEdit ? 'Edit Entry' : 'Add to Watchlist'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-base text-muted hover:text-main transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {/* Title */}
          <div className="relative">
            <label className="block text-sm font-semibold text-main mb-1.5 flex items-center justify-between">
              <span>Title *</span>
              {isSearching && <Loader2 size={14} className="animate-spin text-primary" />}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder="e.g., Attack on Titan"
              className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted"
            />
            
            {/* TMDB Results Dropdown */}
            {showResults && searchResults.length > 0 && !entryToEdit && (
              <div className="absolute z-10 w-full mt-2 bg-surface border border-border-subtle rounded-xl shadow-xl overflow-hidden max-h-[250px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
                {searchResults.map(res => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => handleSelectResult(res)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-base transition-colors border-b border-border-subtle last:border-0"
                  >
                    {res.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w92${res.poster_path}`} alt="" className="w-10 h-14 object-cover rounded bg-base" />
                    ) : (
                      <div className="w-10 h-14 bg-base rounded flex items-center justify-center text-muted text-xs">No img</div>
                    )}
                    <div>
                      <div className="font-bold text-main line-clamp-1">{res.title || res.name}</div>
                      <div className="text-xs text-muted">
                        {res.media_type === 'tv' ? 'TV Show' : 'Movie'} • {(res.first_air_date || res.release_date || '').substring(0,4)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-main mb-1.5">
              Status *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['watching', 'finished', 'planned'] as const).map((s) => (
                <label 
                  key={s} 
                  className={`flex items-center justify-center py-2 px-3 rounded-lg border cursor-pointer font-bold text-sm uppercase tracking-wider transition-all ${
                    status === s 
                      ? 'bg-primary/10 border-primary text-primary' 
                      : 'bg-surface border-border-subtle text-muted hover:border-border hover:bg-base'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="status" 
                    value={s} 
                    checked={status === s}
                    onChange={() => setStatus(s)}
                    className="sr-only" 
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>

          {/* Rating (Only if finished) */}
          {status === 'finished' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200 bg-surface border border-border-subtle p-4 rounded-xl">
              <label className="block text-sm font-semibold text-main mb-2">
                Your Rating
              </label>
              {renderRatingInput()}
            </div>
          )}

          {/* Cover URL */}
          <div>
            <label className="block text-sm font-semibold text-main mb-1.5">
              Cover Image URL <span className="text-muted font-normal">(Optional)</span>
            </label>
            <input
              type="url"
              value={coverUrl}
              onChange={e => setCoverUrl(e.target.value)}
              placeholder="https://example.com/poster.jpg"
              className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted"
            />
            {coverUrl && (
              <div className="mt-2 w-24 h-36 rounded-lg overflow-hidden border border-border-subtle shadow-sm">
                <img src={coverUrl} alt="Cover preview" className="w-full h-full object-cover" onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="150" viewBox="0 0 100 150"><rect fill="%232d3748" width="100" height="150"/><text fill="%23a0aec0" x="50" y="75" font-family="sans-serif" font-size="12" text-anchor="middle">Invalid Image</text></svg>';
                }} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Recommended By */}
            <div>
              <label className="block text-sm font-semibold text-main mb-1.5">
                Recommended By <span className="text-muted font-normal">(Optional)</span>
              </label>
              <select
                value={recommendedBy}
                onChange={e => setRecommendedBy(e.target.value)}
                className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
              >
                <option value="">No one</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.displayName}</option>
                ))}
              </select>
            </div>

            {/* TMDB ID */}
            <div>
              <label className="block text-sm font-semibold text-main mb-1.5">
                TMDB ID <span className="text-muted font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={tmdbId}
                onChange={e => setTmdbId(e.target.value)}
                placeholder="For future use"
                className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border-subtle">
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-on-primary font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
              {entryToEdit ? 'Save Changes' : 'Add to Watchlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
