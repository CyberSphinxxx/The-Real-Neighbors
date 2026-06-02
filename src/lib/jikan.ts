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

export async function searchAnime(query: string): Promise<JikanResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const cacheKey = trimmed.toLowerCase();
  if (jikanCache.has(cacheKey)) {
    return jikanCache.get(cacheKey)!;
  }

  await throttleJikan();

  try {
    const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(trimmed)}&limit=8&sfw=true`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch from Jikan');

    const data = await res.json();
    const results: JikanResult[] = (data.data || []).map((item: Record<string, unknown>) => {
      let synopsis = (item.synopsis as string) || '';
      if (synopsis.length > 200) {
        synopsis = synopsis.slice(0, 197) + '...';
      }

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
    });

    jikanCache.set(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Jikan Search Error:', error);
    return [];
  }
}
