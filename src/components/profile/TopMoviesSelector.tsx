import React, { useState, useEffect } from 'react';
import { Search, X, Loader2, Film } from 'lucide-react';
import toast from 'react-hot-toast';

export interface TopMovie {
  tmdbId: string;
  title: string;
  posterUrl: string;
}

interface Props {
  movies: TopMovie[];
  onChange: (movies: TopMovie[]) => void;
  maxMovies?: number;
}

export const TopMoviesSelector: React.FC<Props> = ({ movies, onChange, maxMovies = 4 }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const apiKey = import.meta.env.VITE_TMDB_API_KEY;
        if (!apiKey) return;
        
        const res = await fetch(`https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&api_key=${apiKey}&language=en-US&page=1`);
        const data = await res.json();
        const filtered = data.results?.filter((r: any) => (r.media_type === 'tv' || r.media_type === 'movie') && r.poster_path).slice(0, 5) || [];
        setResults(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (movie: any) => {
    if (movies.length >= maxMovies) {
      toast.error(`You can only select up to ${maxMovies} favorites`);
      return;
    }
    
    const id = movie.id.toString();
    if (movies.some(m => m.tmdbId === id)) {
      toast.error('Already added to your list');
      return;
    }

    const newMovie: TopMovie = {
      tmdbId: id,
      title: movie.title || movie.name,
      posterUrl: `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    };

    onChange([...movies, newMovie]);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
  };

  const handleRemove = (id: string) => {
    onChange(movies.filter(m => m.tmdbId !== id));
  };

  return (
    <div className="space-y-4 relative">
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: maxMovies }).map((_, i) => {
          const movie = movies[i];
          return (
            <div key={i} className="aspect-[2/3] bg-base border border-border-subtle rounded-xl overflow-hidden relative group flex items-center justify-center">
              {movie ? (
                <>
                  <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemove(movie.tmdbId)}
                      className="p-2 bg-danger text-white rounded-full hover:scale-110 transition-transform"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <Film size={24} className="text-border-subtle" />
              )}
            </div>
          );
        })}
      </div>

      {movies.length < maxMovies && (
        <div className="relative">
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3 text-muted" />
            <input
              type="text"
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search for a movie or show..."
              className="w-full bg-surface border border-border-subtle rounded-xl pl-9 pr-10 py-2 text-sm text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted"
            />
            {isSearching && (
              <Loader2 size={16} className="absolute right-3 animate-spin text-primary" />
            )}
          </div>
          
          {showDropdown && results.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-surface border border-border-subtle rounded-xl shadow-xl overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
              {results.map(res => (
                <button
                  key={res.id}
                  type="button"
                  onClick={() => handleSelect(res)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-base transition-colors border-b border-border-subtle last:border-0"
                >
                  <img loading="lazy" decoding="async" src={`https://image.tmdb.org/t/p/w92${res.poster_path}`} alt="" className="w-10 h-14 object-cover rounded bg-base" />
                  <div>
                    <div className="font-bold text-sm text-main line-clamp-1">{res.title || res.name}</div>
                    <div className="text-[10px] text-muted uppercase tracking-wider mt-0.5">
                      {res.media_type === 'tv' ? 'TV Show' : 'Movie'} • {(res.first_air_date || res.release_date || '').substring(0,4)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
