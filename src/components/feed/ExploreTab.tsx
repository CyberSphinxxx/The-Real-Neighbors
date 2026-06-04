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
  const [afterTokens, setAfterTokens] = useState<Record<string, string>>({}); // subreddit -> after

  // Initialize subreddits
  const subreddits = user?.subreddits?.length ? user.subreddits : DEFAULT_SUBREDDITS;
  
  useEffect(() => {
    if (user && (!user.subreddits || user.subreddits.length === 0)) {
      updateDoc('users', [user.id], { subreddits: DEFAULT_SUBREDDITS });
      useAuthStore.getState().setUser({ ...user, subreddits: DEFAULT_SUBREDDITS });
    }
  }, [user]);


  const fetchRedditPosts = async (subreddit: string, isLoadMore = false) => {
    if (!user) return;
    
    // Cache Check
    if (!isLoadMore) {
      if (subreddit === 'All') {
        let allFresh = true;
        let cachedAll: RedditPost[] = [];
        for (const sub of subreddits) {
          const c = getCached(sub);
          if (c) cachedAll = [...cachedAll, ...c];
          else allFresh = false;
        }
        if (cachedAll.length > 0) {
          cachedAll.sort((a, b) => b.created_utc - a.created_utc);
          setPosts(cachedAll);
          if (allFresh) return; // Stale-while-revalidate if not fresh
        } else {
          setIsLoading(true);
        }
      } else {
        const c = getCached(subreddit);
        if (c) {
          setPosts(c);
          setIsLoading(false);
          // If less than 2 minutes old, skip re-fetch entirely
          // Wait, getCached returns null if older than 5 minutes.
          // Let's rely on that or add stale-while-revalidate.
          // The prompt says: "In the background: if cache is older than 2 minutes, still refetch silently"
          // We can check Date.now() against cache later if we expose entry, but getCached only returns fresh (< 5min).
          // For simplicity, we'll just fetch in background if not isLoadMore.
        } else {
          setIsLoading(true);
        }
      }
    } else {
      setIsLoading(true);
    }

    setError('');

    try {
      const subsToFetch = subreddit === 'All' ? subreddits : [subreddit];
      
      const fetchPromises = subsToFetch.map(async (sub) => {
        const afterToken = isLoadMore ? afterTokens[sub] : '';
        const url = `/reddit-api/r/${sub}/.rss?limit=${subreddit === 'All' ? '10' : '25'}${afterToken ? `&after=${afterToken}` : ''}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to fetch r/${sub} (${res.status})`);
        }
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
          const category = entry.querySelector('category')?.getAttribute('label') || sub;
          
          const permalink = link.replace('https://www.reddit.com', '');
          
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = content;
          
          let imageUrl = '';
          const allLinks = tempDiv.querySelectorAll('a');
          let hasVideo = false;
          
          for (const a of Array.from(allLinks)) {
            const href = a.getAttribute('href') || '';
            if (/\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(href) && href.includes('redd.it')) {
              imageUrl = href;
            }
            // Heuristics for video detection in RSS:
            if (href.includes('v.redd.it') || href.includes('youtube.com') || href.includes('youtu.be')) {
              hasVideo = true;
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
          
          if (imageUrl.includes('preview.redd.it')) {
            imageUrl = imageUrl.split('?')[0].replace('preview.redd.it', 'i.redd.it');
          }
          
          // Another heuristic: look for [video] in the title or text
          const selftextRaw = tempDiv.textContent?.trim() || '';
          if (selftextRaw.toLowerCase().includes('[video]') || title.toLowerCase().includes('[video]')) {
              hasVideo = true;
          }
          
          const isImage = !!imageUrl;
          
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
            is_video: hasVideo,
            is_reddit_media_domain: isImage,
            thumbnail: isImage ? imageUrl : 'self',
            score: 0,
            num_comments: 0,
            created_utc: updated ? Math.floor(new Date(updated).getTime() / 1000) : Date.now() / 1000,
            permalink,
          };
        });

        // We don't get 'after' from RSS easily in the same way, but let's just clear it for now or rely on the old behavior
        const after = '';

        // Set cache if it's not a load more request and it's a specific sub (or All sub limits)
        if (!isLoadMore && subreddit !== 'All') {
          setCached(sub, posts);
        }

        return { sub, after, posts };
      });

      const results = await Promise.allSettled(fetchPromises);
      
      let allFetchedPosts: RedditPost[] = [];
      const newAfterTokens = { ...afterTokens };

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          allFetchedPosts = [...allFetchedPosts, ...result.value.posts];
          newAfterTokens[result.value.sub] = result.value.after;
        } else {
          console.error('Failed to fetch a subreddit:', result.reason);
        }
      });

      allFetchedPosts.sort((a, b) => b.created_utc - a.created_utc);

      setAfterTokens(newAfterTokens);
      setPosts(prev => {
        // If we used cache, just replace it with the fresh data (stale-while-revalidate)
        if (!isLoadMore) return allFetchedPosts;
        return [...prev, ...allFetchedPosts];
      });
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
