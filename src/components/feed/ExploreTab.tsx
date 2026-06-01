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

        // Set cache if it's not a load more request and it's a specific sub (or All sub limits)
        // Wait, for All it fetches 10 from each, so caching might be weird. Let's just cache specific subs.
        if (!isLoadMore && subreddit !== 'All') {
          setCached(sub, posts);
        }

        return { sub, after: '', posts };
      });

      const results = await Promise.all(fetchPromises);
      
      let allFetchedPosts: RedditPost[] = [];
      const newAfterTokens = { ...afterTokens };

      results.forEach(result => {
        allFetchedPosts = [...allFetchedPosts, ...result.posts];
        newAfterTokens[result.sub] = result.after;
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
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Subreddit Bar */}
      <div className="mb-3 border-b border-border-subtle py-2 bg-transparent flex items-center gap-2 overflow-x-auto custom-scrollbar relative z-20">
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
        
        <div className="relative">
          <button
            onClick={() => setShowManager(!showManager)}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 text-sm rounded-full border border-dashed border-border-subtle text-muted hover:text-main hover:border-border transition-colors ml-2"
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

      {/* Feed */}
      <div className="flex flex-col gap-3">
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
