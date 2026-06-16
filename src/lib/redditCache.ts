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
    const url = `/api/reddit?path=/r/${subreddit}/.rss&limit=25`;
    const res = await fetch(url);
    if (!res.ok) return;

    const text = await res.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');
    const entries = Array.from(xmlDoc.querySelectorAll('entry'));

    const posts: RedditPost[] = entries.slice(0, 25).map((entry) => {
      const entryId = entry.querySelector('id')?.textContent || '';
      const id = entryId.replace('t3_', '');
      const title = entry.querySelector('title')?.textContent || '';
      const authorName = entry.querySelector('author > name')?.textContent || '';
      const author = authorName.replace('/u/', '');
      const category = entry.querySelector('category')?.getAttribute('term') || subreddit;
      const link = entry.querySelector('link')?.getAttribute('href') || '';
      const updated = entry.querySelector('updated')?.textContent || '';

      const contentHtml = entry.querySelector('content')?.textContent || '';
      const contentDoc = parser.parseFromString(contentHtml, 'text/html');

      let postUrl = link;
      let thumbnail = '';

      const imgTags = Array.from(contentDoc.querySelectorAll('img'));
      if (imgTags.length > 0) {
        thumbnail = imgTags[0].getAttribute('src') || '';
      }

      const aTags = Array.from(contentDoc.querySelectorAll('a'));
      for (const a of aTags) {
        const href = a.getAttribute('href');
        if (href && href.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)) {
          postUrl = href;
          break;
        }
      }
      if (postUrl === link && thumbnail) {
        postUrl = thumbnail;
      }

      const isRedditMedia = !!postUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);
      const selftext = contentDoc.body.textContent || '';

      return {
        id,
        title,
        author,
        subreddit: category,
        selftext: selftext.substring(0, 500),
        url: postUrl,
        is_video: false,
        is_reddit_media_domain: isRedditMedia,
        thumbnail: thumbnail || (isRedditMedia ? postUrl : 'self'),
        score: 0,
        num_comments: 0,
        created_utc: updated ? Math.floor(new Date(updated).getTime() / 1000) : Date.now() / 1000,
        permalink: link.replace('https://www.reddit.com', ''),
      };
    });

    setCached(subreddit, posts);
  } catch (err) {
    // Fire and forget, ignore errors
  }
};
