import { getCached, setCached } from '../../lib/redditCache';
import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { updateDoc } from '../../lib/firestore';
import type { RedditPost } from '../../types';
import { SubredditManager } from './SubredditManager';
import { RedditPostCard } from './RedditPostCard';
import { PostSkeleton } from './PostSkeleton';

interface ExploreTabProps {
  onOpenPost: (post: RedditPost) => void;
}

const DEFAULT_SUBREDDITS = ['memes', 'animememes', 'Philippines', 'gaming', 'OnePiece'];

export const ExploreTab: React.FC<ExploreTabProps> = ({ onOpenPost }) => {
  const { user } = useAuthStore();
  const [showManager, setShowManager] = useState(false);
  const [activeSub, setActiveSub] = useState('All');
  
  // Data State
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize subreddits
  const subreddits = user?.subreddits?.length ? user.subreddits : DEFAULT_SUBREDDITS;
  
  useEffect(() => {
    if (user && (!user.subreddits || user.subreddits.length === 0)) {
      updateDoc('users', [user.id], { subreddits: DEFAULT_SUBREDDITS });
      useAuthStore.getState().setUser({ ...user, subreddits: DEFAULT_SUBREDDITS });
    }
  }, [user]);


  const parseRssEntry = (entry: Element, parser: DOMParser, subreddit: string): RedditPost => {
    const entryId = entry.querySelector("id")?.textContent || '';
    const id = entryId.replace('t3_', '');
    const title = entry.querySelector("title")?.textContent || '';
    const authorName = entry.querySelector("author > name")?.textContent || '';
    const author = authorName.replace('/u/', '');
    const category = entry.querySelector("category")?.getAttribute("term") || subreddit;
    const link = entry.querySelector("link")?.getAttribute("href") || '';
    const updated = entry.querySelector("updated")?.textContent || '';

    const contentHtml = entry.querySelector("content")?.textContent || '';
    const contentDoc = parser.parseFromString(contentHtml, "text/html");

    let postUrl = link;
    let thumbnail = '';

    const imgTags = Array.from(contentDoc.querySelectorAll("img"));
    if (imgTags.length > 0) {
       thumbnail = imgTags[0].getAttribute("src") || '';
    }

    const aTags = Array.from(contentDoc.querySelectorAll("a"));
    for (const a of aTags) {
      const href = a.getAttribute("href");
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
      created_utc: new Date(updated).getTime() / 1000 || Date.now() / 1000,
      permalink: link.replace('https://www.reddit.com', ''),
    };
  };

  const fetchSingleSubreddit = async (sub: string): Promise<RedditPost[]> => {
    const url = `/api/reddit?path=/r/${sub}/.rss&limit=10`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const text = await res.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    const entries = Array.from(xmlDoc.querySelectorAll("entry"));
    return entries.slice(0, 10).map(entry => parseRssEntry(entry, parser, sub));
  };

  const fetchRedditPosts = async (subreddit: string, isLoadMore = false) => {
    if (!user) return;

    // Cache Check
    const cacheKey = subreddit === 'All' ? 'All' : subreddit;
    if (!isLoadMore) {
      const c = getCached(cacheKey);
      if (c) {
        setPosts(c);
        setIsLoading(false);
        return;
      }
    }

    setError('');
    setIsLoading(true);

    try {
      let fetchedPosts: RedditPost[] = [];

      if (subreddit === 'All') {
        // Progressively load subreddits
        if (!isLoadMore) setPosts([]);

        for (const sub of subreddits) {
          try {
            const posts = await fetchSingleSubreddit(sub);
            if (posts.length > 0) {
              fetchedPosts.push(...posts);
              
              // Progressively update the UI!
              setPosts(prev => {
                const combined = isLoadMore ? [...prev, ...posts] : [...prev, ...posts];
                // Deduplicate by ID
                const uniqueMap = new Map(combined.map(p => [p.id, p]));
                return Array.from(uniqueMap.values())
                  .sort((a, b) => b.created_utc - a.created_utc)
                  .slice(0, 50);
              });
            }
          } catch (e) {
            console.error(`Failed to fetch subreddit ${sub}`, e);
          }
          if (sub !== subreddits[subreddits.length - 1]) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        fetchedPosts = fetchedPosts
          .sort((a, b) => b.created_utc - a.created_utc)
          .slice(0, 50);
      } else {
        const limit = '25';
        const url = `/api/reddit?path=/r/${subreddit}/.rss&limit=${limit}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to fetch ${cacheKey} (${res.status})`);
        }
        const text = await res.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        const entries = Array.from(xmlDoc.querySelectorAll("entry"));
        fetchedPosts = entries.slice(0, parseInt(limit)).map(entry => parseRssEntry(entry, parser, subreddit));
      }

      if (!isLoadMore) {
        setCached(cacheKey, fetchedPosts);
      }

      if (subreddit !== 'All') {
        setPosts(prev => {
          if (!isLoadMore) return fetchedPosts;
          const uniqueMap = new Map([...prev, ...fetchedPosts].map(p => [p.id, p]));
          return Array.from(uniqueMap.values());
        });
      }

    } catch (err) {
      console.error(err);
      if (posts.length === 0) {
        setError('Couldn\'t load posts. Check your connection. 🔌');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (subreddits.length > 0) {
      fetchRedditPosts(activeSub, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSub, subreddits.length]); 

  return (
    <div className="flex flex-col md:flex-row gap-6 justify-center w-full animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* ── DESKTOP SIDEBAR ── */}
      <div className="hidden md:flex flex-col w-[200px] flex-shrink-0 sticky top-20 gap-1.5 z-20 self-start">
        <h3 className="font-heading font-bold text-lg text-main mb-3 px-2">Subreddits</h3>
        
        <button
          onClick={() => setActiveSub('All')}
          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors font-medium ${
            activeSub === 'All'
              ? 'bg-primary/15 text-primary'
              : 'text-muted hover:bg-surface hover:text-main'
          }`}
        >
          <span className="text-lg">🌐</span> All
        </button>
        
        {subreddits.map(sub => (
          <button
            key={sub}
            onClick={() => setActiveSub(sub)}
            className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors font-medium text-left truncate ${
              activeSub === sub
                ? 'bg-primary/15 text-primary'
                : 'text-muted hover:bg-surface hover:text-main'
            }`}
          >
            r/{sub}
          </button>
        ))}
        
        <div className="relative mt-2">
          <button
            onClick={() => setShowManager(!showManager)}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-dashed border-border-subtle text-muted hover:text-main hover:bg-surface hover:border-border transition-colors w-full"
          >
            <Plus size={16} /> Add Subreddit
          </button>
          
          {showManager && (
            <SubredditManager 
              subreddits={subreddits} 
              onClose={() => setShowManager(false)}
              align="left"
            />
          )}
        </div>
      </div>

      {/* ── MAIN FEED COLUMN ── */}
      <div className="flex-1 w-full max-w-[680px] flex flex-col gap-3">
        
        {/* MOBILE SUBREDDIT BAR */}
        <div className="md:hidden mb-1 border-b border-border-subtle py-2 bg-transparent flex items-center relative z-20">
          <div className="flex-1 flex items-center gap-2 overflow-x-auto custom-scrollbar pr-2">
            <button
              onClick={() => setActiveSub('All')}
              className={`flex-shrink-0 px-3 py-1.5 text-sm rounded-full border transition-colors ${
                activeSub === 'All'
                  ? 'bg-primary/15 border-primary text-primary font-semibold'
                  : 'border-border text-muted bg-surface hover:text-main hover:border-border-subtle'
              }`}
            >
              🌐 All
            </button>
            {subreddits.map(sub => (
              <button
                key={sub}
                onClick={() => setActiveSub(sub)}
                className={`flex-shrink-0 px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  activeSub === sub
                    ? 'bg-primary/15 border-primary text-primary font-semibold'
                    : 'border-border text-muted bg-surface hover:text-main hover:border-border-subtle'
                }`}
              >
                r/{sub}
              </button>
            ))}
          </div>
          
          <div className="relative border-l border-border pl-3 flex-shrink-0">
            <button
              onClick={() => setShowManager(!showManager)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full border border-dashed border-border-subtle text-muted hover:text-main hover:border-border transition-colors bg-surface shadow-sm"
              title="Manage Subreddits"
            >
              <Plus size={14} /> Add
            </button>
            
            {showManager && (
              <SubredditManager 
                subreddits={subreddits} 
                onClose={() => setShowManager(false)} 
              />
            )}
          </div>
        </div>

        {/* FEED CONTENT */}
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4 font-medium">{error}</p>
            <button 
              onClick={() => fetchRedditPosts(activeSub, false)}
              className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-semibold hover:bg-elevated text-main"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {posts.map((post, idx) => (
              <RedditPostCard key={`${post.subreddit}-${post.id}-${idx}`} post={post} onOpenPost={onOpenPost} />
            ))}

            {isLoading && (
              <>
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
              </>
            )}

            {!isLoading && posts.length > 0 && (
              <div className="text-center mt-4 mb-8">
                <button
                  onClick={() => fetchRedditPosts(activeSub, true)}
                  className="px-6 py-2.5 bg-surface border border-border-subtle hover:border-border rounded-full text-sm font-semibold text-main transition-colors shadow-sm"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
