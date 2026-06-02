import React, { useState, useEffect, useRef } from 'react';
import { useWatchlistStore } from '../../stores/watchlistStore';
import { useAuthStore } from '../../stores/authStore';
import { addDoc, updateDoc } from '../../lib/firestore';
import type { WatchlistEntry, User } from '../../types';
import { searchTMDB, searchTMDBMulti, type TMDBResult } from '../../lib/tmdb';
import { searchAnime, type JikanResult } from '../../lib/jikan';
import { X, Tv, Film, Sparkles, Search, Loader2, ChevronLeft, Star, Users } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
  users: User[];
  entryToEdit?: WatchlistEntry;
}

type ContentType = 'all' | 'movie' | 'tv' | 'anime';
type Step = 1 | 2;

type SearchResult = (TMDBResult | JikanResult) & { idOrMalId: string | number };

export const AddWatchlistEntryModal: React.FC<Props> = ({ onClose, users, entryToEdit }) => {
  const { user } = useAuthStore();
  
  // Step State
  const [step, setStep] = useState<Step>(entryToEdit ? 2 : 1);
  const [contentType, setContentType] = useState<ContentType>(entryToEdit?.type || 'all');
  const [isManual, setIsManual] = useState(!!entryToEdit);
  
  // Search State
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Selected Item State (for Step 2)
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);

  // Form State (Step 2)
  const [title, setTitle] = useState(entryToEdit?.title || '');
  const [status, setStatus] = useState<'watching' | 'finished' | 'planned'>(entryToEdit?.status || 'planned');
  const [rating, setRating] = useState<number>(entryToEdit?.rating || 0);
  const [recommendedBy, setRecommendedBy] = useState(entryToEdit?.recommendedBy || '');
  const [coverUrl, setCoverUrl] = useState(entryToEdit?.coverUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Focus search input
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (step === 1 && !entryToEdit) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [step, entryToEdit]);

  // Handle Debounced Search
  useEffect(() => {
    if (step !== 1) return;
    
    if (searchTimeoutRef.current !== null) clearTimeout(searchTimeoutRef.current);
    
    if (query.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setIsSearching(false);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        let res: SearchResult[] = [];
        if (contentType === 'anime') {
          const animeRes = await searchAnime(query);
          res = animeRes.map(a => ({ ...a, idOrMalId: a.malId }));
        } else if (contentType === 'all') {
          const [tmdbRes, animeRes] = await Promise.all([
            searchTMDBMulti(query),
            searchAnime(query)
          ]);
          
          const combined: SearchResult[] = [];
          for (let i = 0; i < 12; i++) {
            if (tmdbRes[i]) combined.push({ ...tmdbRes[i], idOrMalId: tmdbRes[i].id });
            if (animeRes[i]) combined.push({ ...animeRes[i], idOrMalId: animeRes[i].malId });
          }
          res = combined.slice(0, 12); // total 12 results maximum for 'all'
        } else {
          const tmdbRes = await searchTMDB(query, contentType);
          res = tmdbRes.map(t => ({ ...t, idOrMalId: t.id }));
        }
        setResults(res);
        setHasSearched(true);
      } catch (err) {
        console.error(err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current !== null) clearTimeout(searchTimeoutRef.current);
    };
  }, [query, contentType, step]);

  // Handle Type Switch
  const handleTypeSwitch = (type: ContentType) => {
    setContentType(type);
    setQuery('');
    setResults([]);
    setHasSearched(false);
    searchInputRef.current?.focus();
  };

  const handleSelectResult = (item: SearchResult) => {
    setSelectedItem(item);
    setTitle(item.title);
    setCoverUrl(item.posterUrl || '');
    setIsManual(false);
    
    // Auto-set status for airing anime
    if (item.type === 'anime' && (item as JikanResult).status === 'Currently Airing') {
      setStatus('watching');
    } else {
      setStatus('planned');
    }
    
    setStep(2);
  };

  const handleAddManually = () => {
    setSelectedItem(null);
    setTitle(query);
    setIsManual(true);
    setStep(2);
  };

  // Close on Escape or click outside
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
      const recommender = users.find(u => u.id === recommendedBy);
      
      const payload: Partial<WatchlistEntry> = {
        title: title.trim(),
        type: contentType === 'all' ? 'movie' : contentType, // Fallback if manual entry while on 'all'
        status,
        rating: status === 'finished' && rating > 0 ? rating : undefined,
        recommendedBy: recommendedBy || undefined,
        recommendedByName: recommender?.displayName || undefined,
        coverUrl: coverUrl.trim() || undefined,
      };

      if (!isManual && selectedItem) {
        payload.year = selectedItem.year || undefined;
        
        if (selectedItem.type === 'anime') {
          const animeItem = selectedItem as JikanResult & { idOrMalId: string | number };
          payload.overview = animeItem.synopsis || undefined;
          payload.genres = animeItem.genres?.length ? animeItem.genres : undefined;
          payload.malId = animeItem.malId;
          payload.episodes = animeItem.episodes || undefined;
          payload.externalScore = animeItem.score || undefined;
        } else {
          const tmdbItem = selectedItem as TMDBResult & { idOrMalId: string | number };
          payload.overview = tmdbItem.overview || undefined;
          payload.tmdbId = tmdbItem.id;
          payload.backdropUrl = tmdbItem.backdropUrl || undefined;
          payload.externalScore = tmdbItem.voteAverage || undefined;
        }
      }

      // Remove undefined fields to prevent Firebase errors
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([, v]) => v !== undefined)
      );

      if (entryToEdit) {
        await updateDoc('watchlists', [entryToEdit.id], cleanPayload);
        toast.success('Entry updated');
      } else {
        cleanPayload.userId = user.id;
        cleanPayload.createdAt = Date.now();
        await addDoc('watchlists', cleanPayload as unknown as Record<string, unknown>);
        const typeIcon = contentType === 'anime' ? '🎌' : '🎬';
        toast.success(`Added to watchlist! ${typeIcon}`);
      }
      
      useWatchlistStore.getState().invalidate();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRatingDots = () => {
    return (
      <div className="flex gap-1 flex-wrap">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
          const isSelected = num <= rating;
          let colorClass = 'bg-success border-success text-on-success';
          if (rating <= 3) colorClass = 'bg-danger border-danger text-on-danger';
          else if (rating <= 6) colorClass = 'bg-warning border-warning text-black';
          else if (rating <= 8) colorClass = 'bg-primary border-primary text-on-primary';

          return (
            <button
              key={num}
              type="button"
              onClick={() => setRating(num === rating ? 0 : num)}
              className={`w-8 h-8 rounded-full text-xs font-bold transition-all border ${
                isSelected 
                  ? colorClass
                  : 'bg-elevated text-muted border-default hover:border-muted hover:text-main'
              }`}
            >
              {num}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => {
        if (step === 1 && !query) onClose(); // Only close on outside click if safe
      }}
    >
      <div 
        className="bg-surface border border-default rounded-2xl w-full max-w-[700px] shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-150 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-default bg-surface relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            {step === 2 && !entryToEdit ? (
              <button 
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-muted hover:text-main transition-colors text-sm"
              >
                <ChevronLeft size={16} /> Back
              </button>
            ) : (
              <>
                <Tv className="text-primary" size={18} />
                <h2 className="text-lg font-heading font-semibold text-main">
                  {step === 1 ? 'Add to Watchlist' : entryToEdit ? 'Edit Entry' : isManual ? 'Add Manually' : 'Confirm Entry'}
                </h2>
              </>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-elevated text-muted hover:text-main transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* STEP 1: SEARCH */}
        {step === 1 && (
          <div className="flex flex-col overflow-hidden">
            <div className="p-4 pb-2 shrink-0">
              {/* Type Selector */}
              <div className="flex gap-2 mb-4 overflow-x-auto custom-scrollbar pb-1">
                {(['all', 'movie', 'tv', 'anime'] as const).map(type => {
                  const label = type === 'all' ? '🔍 All' : type === 'movie' ? '🎬 Movie' : type === 'tv' ? '📺 TV Show' : '🎌 Anime';
                  return (
                    <button
                      key={type}
                      onClick={() => handleTypeSwitch(type)}
                      className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                        contentType === type 
                          ? 'bg-primary/15 border-primary text-primary'
                          : 'bg-surface border-default text-muted hover:bg-elevated hover:text-main'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  {isSearching ? <Loader2 size={16} className="animate-spin text-primary" /> : <Search size={16} className="text-muted" />}
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={`Search for a ${contentType === 'movie' ? 'movie' : contentType === 'tv' ? 'TV show' : 'anime'}...`}
                  className="w-full bg-elevated border border-default rounded-xl pl-10 pr-4 py-3 text-sm text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                />
              </div>
            </div>

            <div className="overflow-y-auto p-4 pt-2 max-h-[480px] custom-scrollbar">
              {isSearching && results.length === 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="animate-pulse flex flex-col gap-2">
                      <div className="aspect-[2/3] bg-elevated rounded-xl"></div>
                      <div className="h-4 bg-elevated rounded w-3/4"></div>
                      <div className="h-3 bg-elevated rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : results.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {results.map(res => (
                    <div 
                      key={res.idOrMalId} 
                      onClick={() => handleSelectResult(res)}
                      className="cursor-pointer rounded-xl overflow-hidden border border-default hover:border-primary hover:shadow-md transition-all flex flex-col group"
                    >
                      <div className="aspect-[2/3] w-full bg-elevated relative overflow-hidden shrink-0">
                        {res.posterUrl ? (
                          <img loading="lazy" src={res.posterUrl} alt={res.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-muted">
                            {res.type === 'movie' ? <Film size={32} /> : res.type === 'tv' ? <Tv size={32} /> : <Sparkles size={32} />}
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs rounded-full px-2 py-0.5 backdrop-blur-sm">
                          {res.type === 'movie' ? '🎬 Movie' : res.type === 'tv' ? '📺 TV' : '🎌 Anime'}
                        </div>
                        {((res as TMDBResult).voteAverage || (res as JikanResult).score) ? (
                          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs rounded-full px-2 py-0.5 backdrop-blur-sm flex items-center gap-1">
                            <Star size={10} className="fill-amber-500 text-amber-500" />
                            <span>{(res as TMDBResult).voteAverage || (res as JikanResult).score}</span>
                          </div>
                        ) : null}
                      </div>
                      <div className="p-2 flex flex-col justify-between flex-1">
                        <div className="text-sm font-medium text-main line-clamp-1">{res.title}</div>
                        <div className="text-xs text-muted mt-0.5">
                          {res.year}{res.year && (res as JikanResult).episodes ? ' · ' : ''}{(res as JikanResult).episodes ? `${(res as JikanResult).episodes} eps` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : hasSearched ? (
                <div className="py-12 flex flex-col items-center text-center">
                  <Search size={32} className="text-muted mb-3" />
                  <p className="text-sm text-main mb-1">No results found for '{query}'</p>
                  <p className="text-sm text-muted">Try a different title or check the spelling</p>
                  <button onClick={handleAddManually} className="mt-4 text-sm text-primary hover:underline underline-offset-2">
                    Or add manually
                  </button>
                </div>
              ) : (
                <div className="py-16 flex flex-col items-center text-center">
                  <div className="text-muted mb-3 flex gap-2">
                    {contentType === 'movie' ? <Film size={40} /> : contentType === 'tv' ? <Tv size={40} /> : contentType === 'anime' ? <Sparkles size={40} /> : <Search size={40} />}
                  </div>
                  <p className="text-sm text-muted">Search for {contentType === 'all' ? 'anything' : contentType === 'movie' ? 'a movie' : contentType === 'tv' ? 'a TV show' : 'an anime'} to add it to your watchlist</p>
                  <button onClick={handleAddManually} className="mt-4 text-sm text-primary hover:underline underline-offset-2">
                    Or add manually
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: FORM */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
            <div className="overflow-y-auto custom-scrollbar">
              {/* Preview Banner */}
              {!isManual && selectedItem && (
                <div className="w-full relative shrink-0 bg-black">
                  <div className="absolute inset-0 z-0 opacity-50">
                    {(selectedItem as TMDBResult).backdropUrl ? (
                      <img src={(selectedItem as TMDBResult).backdropUrl!} className="w-full h-full object-cover" alt="" />
                    ) : selectedItem.posterUrl ? (
                      <img src={selectedItem.posterUrl} className="w-full h-full object-cover blur-sm scale-110" alt="" />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                  </div>
                  
                  <div className="relative z-10 flex items-end gap-3 p-4 pt-12">
                    {selectedItem.posterUrl && (
                      <img src={selectedItem.posterUrl} className="w-14 h-20 rounded-lg object-cover border-2 border-white/20 shadow-md shrink-0" alt="" />
                    )}
                    <div className="pb-1">
                      <h3 className="font-heading font-bold text-lg text-white drop-shadow-md leading-tight line-clamp-2">
                        {selectedItem.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-white/80 text-xs flex-wrap">
                        <span>{selectedItem.year}</span>
                        <span className="px-1.5 py-0.5 bg-white/20 rounded text-[10px] uppercase">
                          {selectedItem.type}
                        </span>
                        {((selectedItem as TMDBResult).voteAverage || (selectedItem as JikanResult).score) ? (
                          <div className="flex items-center gap-1">
                            <Star size={10} className="fill-amber-500" />
                            <span>{(selectedItem as TMDBResult).voteAverage || (selectedItem as JikanResult).score}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  {((selectedItem as TMDBResult).overview || (selectedItem as JikanResult).synopsis) && (
                    <div className="px-4 pb-4 relative z-10">
                      <p className="text-white/70 text-xs line-clamp-3">
                        {(selectedItem as TMDBResult).overview || (selectedItem as JikanResult).synopsis}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="p-4 space-y-5">
                {/* Manual Fields */}
                {isManual && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-main mb-1.5">Title *</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g., Attack on Titan"
                        className="w-full bg-elevated border border-default rounded-xl px-4 py-3 text-sm text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-main mb-1.5">Content Type *</label>
                      <div className="flex gap-2">
                        {(['movie', 'tv', 'anime'] as const).map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setContentType(type)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                              contentType === type 
                                ? 'bg-primary/15 border-primary text-primary'
                                : 'bg-elevated border-default text-muted hover:text-main'
                            }`}
                          >
                            {type === 'movie' ? '🎬 Movie' : type === 'tv' ? '📺 TV' : '🎌 Anime'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Status Selector */}
                <div>
                  <label className="block text-sm font-medium text-main mb-1.5">Status *</label>
                  <div className="flex gap-2">
                    {(['watching', 'finished', 'planned'] as const).map(s => {
                      const label = s === 'watching' ? '📺 Watching' : s === 'finished' ? '✅ Finished' : '📋 Planned';
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStatus(s)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            status === s 
                              ? 'bg-primary/15 border-primary text-primary'
                              : 'bg-elevated border-default text-muted hover:text-main'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rating Input (Only if finished) */}
                {status === 'finished' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-150">
                    <label className="block text-sm font-medium text-main mb-2 flex items-center justify-between">
                      <span>Your Rating</span>
                      {selectedItem && ((selectedItem as TMDBResult).voteAverage || (selectedItem as JikanResult).score) && (
                        <span className="text-faint text-xs font-normal">
                          {selectedItem.type === 'anime' ? 'MAL' : 'TMDB'}: {(selectedItem as TMDBResult).voteAverage || (selectedItem as JikanResult).score}/10
                        </span>
                      )}
                    </label>
                    {renderRatingDots()}
                  </div>
                )}

                {/* Recommended By */}
                <div>
                  <label className="block text-sm font-medium text-main mb-1.5">Recommended By</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    <button
                      type="button"
                      onClick={() => setRecommendedBy('')}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors ${
                        !recommendedBy 
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-elevated border-default text-muted hover:text-main'
                      }`}
                    >
                      <Users size={14} /> No one
                    </button>
                    {users.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setRecommendedBy(u.id)}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors ${
                          recommendedBy === u.id
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-elevated border-default text-muted hover:text-main'
                        }`}
                      >
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                        ) : (
                          <div 
                            className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                            style={{ backgroundColor: u.accentColor || 'var(--color-primary)' }}
                          >
                            {u.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {u.displayName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cover URL (Manual only) */}
                {isManual && (
                  <div>
                    <label className="block text-sm font-medium text-main mb-1.5">Cover Image URL</label>
                    <div className="flex gap-3">
                      <input
                        type="url"
                        value={coverUrl}
                        onChange={e => setCoverUrl(e.target.value)}
                        placeholder="https://example.com/poster.jpg"
                        className="flex-1 bg-elevated border border-default rounded-xl px-4 py-3 text-sm text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                      />
                      {coverUrl && (
                        <div className="w-10 h-14 rounded-lg overflow-hidden border border-default shrink-0">
                          <img src={coverUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="56"><rect fill="%232d3748" width="40" height="56"/></svg>';
                          }} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-default flex items-center justify-between shrink-0 bg-surface">
              <div className="text-xs text-faint font-medium">
                {!isManual && selectedItem ? (
                  selectedItem.type === 'anime' ? 'MyAnimeList' : 'TMDB'
                ) : ''}
              </div>
              <button
                type="submit"
                disabled={isSubmitting || (isManual && !title.trim())}
                className="bg-primary hover:bg-primary-hover text-on-primary font-medium py-2.5 px-6 rounded-full transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {entryToEdit ? 'Save Changes' : 'Add to Watchlist'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
