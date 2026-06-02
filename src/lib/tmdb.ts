export interface TMDBResult {
  id: number;
  title: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  overview: string;
  year: string;
  type: 'movie' | 'tv';
  voteAverage: number;
  genreIds: number[];
}

const tmdbCache = new Map<string, TMDBResult[]>();

export async function searchTMDB(query: string, type: 'movie' | 'tv'): Promise<TMDBResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const cacheKey = `${type}:${trimmed.toLowerCase()}`;
  if (tmdbCache.has(cacheKey)) {
    return tmdbCache.get(cacheKey)!;
  }

  const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
  if (!API_KEY) {
    console.error('Missing TMDB API Key');
    return [];
  }

  try {
    const url = `https://api.themoviedb.org/3/search/${type}?api_key=${API_KEY}&query=${encodeURIComponent(trimmed)}&limit=8`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch from TMDB');
    
    const data = await res.json();
    const results: TMDBResult[] = (data.results || []).slice(0, 8).map((item: Record<string, unknown>) => {
      const year = type === 'movie' 
        ? (item.release_date as string)?.slice(0, 4) 
        : (item.first_air_date as string)?.slice(0, 4);

      return {
        id: item.id as number,
        title: (type === 'movie' ? item.title : item.name) as string,
        posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : null,
        backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : null,
        overview: (item.overview as string) || '',
        year: year || '',
        type,
        voteAverage: Math.round(((item.vote_average as number) || 0) * 10) / 10,
        genreIds: (item.genre_ids as number[]) || []
      };
    });

    tmdbCache.set(cacheKey, results);
    return results;
  } catch (error) {
    console.error('TMDB Search Error:', error);
    return [];
  }
}

export async function searchTMDBMulti(query: string): Promise<TMDBResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const cacheKey = `multi:${trimmed.toLowerCase()}`;
  if (tmdbCache.has(cacheKey)) {
    return tmdbCache.get(cacheKey)!;
  }

  const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
  if (!API_KEY) {
    console.error('Missing TMDB API Key');
    return [];
  }

  try {
    const url = `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch from TMDB');
    
    const data = await res.json();
    const results: TMDBResult[] = (data.results || [])
      .filter((item: Record<string, unknown>) => item.media_type === 'movie' || item.media_type === 'tv')
      .slice(0, 12)
      .map((item: Record<string, unknown>) => {
        const type = item.media_type as 'movie' | 'tv';
        const year = type === 'movie' 
          ? (item.release_date as string)?.slice(0, 4) 
          : (item.first_air_date as string)?.slice(0, 4);

        return {
          id: item.id as number,
          title: (type === 'movie' ? item.title : item.name) as string,
          posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : null,
          backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : null,
          overview: (item.overview as string) || '',
          year: year || '',
          type,
          voteAverage: Math.round(((item.vote_average as number) || 0) * 10) / 10,
          genreIds: (item.genre_ids as number[]) || []
        };
      });

    tmdbCache.set(cacheKey, results);
    return results;
  } catch (error) {
    console.error('TMDB Multi Search Error:', error);
    return [];
  }
}
