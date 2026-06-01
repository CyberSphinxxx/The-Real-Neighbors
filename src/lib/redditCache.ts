import type { RedditPost } from '../types';

export type RedditCacheEntry = {
  posts: RedditPost[];
  fetchedAt: number;
};

const cache: Record<string, RedditCacheEntry> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getCached = (subreddit: string): RedditPost[] | null => {
  const entry = cache[subreddit];
  if (!entry) return null;
  
  if (Date.now() - entry.fetchedAt < CACHE_TTL) {
    return entry.posts;
  }
  
  return null;
};

export const setCached = (subreddit: string, posts: RedditPost[]): void => {
  const fetchedAt = Date.now();
  const limitedPosts = posts.slice(0, 25); // Limit to 25
  
  cache[subreddit] = { posts: limitedPosts, fetchedAt };
  
  try {
    localStorage.setItem(`reddit_cache_${subreddit}`, JSON.stringify({ posts: limitedPosts, fetchedAt }));
  } catch (err) {
    console.warn('Failed to save to localStorage', err);
  }
};

export const loadFromStorage = (subreddit: string): void => {
  try {
    const data = localStorage.getItem(`reddit_cache_${subreddit}`);
    if (data) {
      const entry = JSON.parse(data) as RedditCacheEntry;
      if (Date.now() - entry.fetchedAt < 30 * 60 * 1000) { // 30 minutes
        cache[subreddit] = entry;
      } else {
        localStorage.removeItem(`reddit_cache_${subreddit}`);
      }
    }
  } catch (err) {
    console.warn('Failed to parse from localStorage', err);
  }
};

export const isFresh = (subreddit: string): boolean => {
  const entry = cache[subreddit];
  if (!entry) return false;
  return Date.now() - entry.fetchedAt < CACHE_TTL;
};

export const invalidate = (subreddit: string): void => {
  delete cache[subreddit];
  try {
    localStorage.removeItem(`reddit_cache_${subreddit}`);
  } catch (err) {
    console.warn('Failed to remove from localStorage', err);
  }
};

export const prefetchSubreddit = async (subreddit: string): Promise<void> => {
  try {
    const url = `/reddit-api/r/${subreddit}/.rss?limit=25`;
    const res = await fetch(url);
    if (!res.ok) return;

    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const entries = xml.querySelectorAll('entry');
    
    const posts: RedditPost[] = Array.from(entries).map((entry) => {
      const id = entry.querySelector('id')?.textContent || '';
      const title = entry.querySelector('title')?.textContent || '';
      const author = entry.querySelector('author > name')?.textContent?.replace('/u/', '') || '';
      const link = entry.querySelector('link')?.getAttribute('href') || '';
      const content = entry.querySelector('content')?.textContent || '';
      const updated = entry.querySelector('updated')?.textContent || '';
      const category = entry.querySelector('category')?.getAttribute('label') || subreddit;
      
      const permalink = link.replace('https://www.reddit.com', '');
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      
      let imageUrl = '';
      const allLinks = tempDiv.querySelectorAll('a');
      for (const a of Array.from(allLinks)) {
        const href = a.getAttribute('href') || '';
        if (/\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(href) && href.includes('redd.it')) {
          imageUrl = href;
          break;
        }
      }
      
      if (!imageUrl) {
        const img = tempDiv.querySelector('img');
        if (img) {
          const src = img.getAttribute('src') || '';
          if (/\.(jpg|jpeg|png|gif|webp)/i.test(src)) {
            imageUrl = src;
          }
        }
      }
      
      const isImage = !!imageUrl;
      
      const selftextRaw = tempDiv.textContent?.trim() || '';
      const selftext = selftextRaw
        .replace(/submitted by\s+\/u\/\S+\s*/g, '')
        .replace(/\[link\]/g, '')
        .replace(/\[comments\]/g, '')
        .trim()
        .substring(0, 500);
      
      return {
        id: id.split('/').pop() || id,
        title,
        author,
        subreddit: category,
        selftext: selftext !== title ? selftext : '',
        url: isImage ? imageUrl : link,
        is_video: false,
        is_reddit_media_domain: isImage,
        thumbnail: isImage ? imageUrl : 'self',
        score: 0,
        num_comments: 0,
        created_utc: updated ? Math.floor(new Date(updated).getTime() / 1000) : Date.now() / 1000,
        permalink,
      };
    });

    setCached(subreddit, posts);
  } catch (err) {
    // Fire and forget, ignore errors
  }
};
