export interface JikanResult {
  malId: number;
  title: string;
  posterUrl: string | null;
  synopsis: string;
  year: string | null;
  episodes: number | null;
  score: number | null;
  status: string;
  genres: string[];
  type: 'anime';
}

const jikanCache = new Map<string, JikanResult[]>();
let lastJikanRequestTime = 0;

async function throttleJikan() {
  const now = Date.now();
  const timeSinceLast = now - lastJikanRequestTime;
  if (timeSinceLast < 350) {
    await new Promise(resolve => setTimeout(resolve, 350 - timeSinceLast));
  }
  lastJikanRequestTime = Date.now();
}

// Jikan genre IDs — mapped from common genre names (aligned with TMDB genre names)
export const JIKAN_GENRE_MAP: Record<string, number> = {
  'action': 1,
  'adventure': 2,
  'comedy': 4,
  'drama': 8,
  'fantasy': 10,
  'horror': 14,
  'mystery': 7,
  'romance': 22,
  'science fiction': 24,
  'sci-fi & fantasy': 24,
  'thriller': 41,
  'animation': 2,
  'sports': 30,
  'action & adventure': 1,
};

function mapJikanItem(item: Record<string, unknown>): JikanResult {
  let synopsis = (item.synopsis as string) || '';
  if (synopsis.length > 200) synopsis = synopsis.slice(0, 197) + '...';
  return {
    malId: item.mal_id as number,
    title: (item.title_english || item.title) as string,
    posterUrl: (item.images as Record<string, Record<string, string>>)?.jpg?.image_url || null,
    synopsis,
    year: (item.year as number)?.toString() || null,
    episodes: (item.episodes as number) || null,
    score: item.score ? Math.round((item.score as number) * 10) / 10 : null,
    status: (item.status as string) || 'Unknown',
    genres: ((item.genres as Record<string, unknown>[]) || []).map(g => g.name as string),
    type: 'anime' as const
  };
}

export async function searchAnime(query: string, page = 1): Promise<JikanResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const cacheKey = `search:${trimmed.toLowerCase()}:${page}`;
  if (jikanCache.has(cacheKey)) return jikanCache.get(cacheKey)!;

  await throttleJikan();

  try {
    const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(trimmed)}&limit=12&sfw=true&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch from Jikan');
    const data = await res.json();
    const results = (data.data || []).map(mapJikanItem);
    jikanCache.set(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Jikan Search Error:', error);
    return [];
  }
}

export async function discoverAnimeByGenre(jikanGenreId: number, page = 1): Promise<JikanResult[]> {
  const cacheKey = `genre:${jikanGenreId}:${page}`;
  if (jikanCache.has(cacheKey)) return jikanCache.get(cacheKey)!;

  await throttleJikan();

  try {
    const url = `https://api.jikan.moe/v4/anime?genres=${jikanGenreId}&sfw=true&page=${page}&limit=12&order_by=score&sort=desc`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch from Jikan');
    const data = await res.json();
    const results = (data.data || []).map(mapJikanItem);
    jikanCache.set(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Jikan Genre Discovery Error:', error);
    return [];
  }
}
