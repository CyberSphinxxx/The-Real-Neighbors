import React, { useState, useEffect, useRef, useMemo } from 'react';
import { orderBy } from 'firebase/firestore';
import { PostComposer } from '../components/feed/PostComposer';
import { PostCard } from '../components/feed/PostCard';
import { PostSkeleton } from '../components/feed/PostSkeleton';
import { PostDetailModal } from '../components/feed/PostDetailModal';
import { ExploreTab } from '../components/feed/ExploreTab';
import { subscribeToCollection } from '../lib/firestore';
import { Users } from 'lucide-react';
import { NotificationBell } from '../components/layout/NotificationBell';
import { getAvatarColor } from '../utils/avatarColor';
import type { Post, User, RedditPost } from '../types';

const FILTER_TYPES = ['All', 'Videos', 'Images', 'Colored', 'Links'];

const SPLASH_TEXTS = [
  "See what your neighbors are up to.",
  "Chismis is our love language.",
  "More fun in the neighborhood!",
  "Who's cooking adobo?",
  "Not a cult, promise.",
  "Touch grass!",
  "Currently ignoring responsibilities.",
  "Powered by iced coffee.",
  "Is it Friday yet?",
  "Have you drank water today?",
  "Welcome to the simulation.",
  "Error 404: Motivation not found.",
  "Pancit canton hits different at 3AM.",
  "May the vibes be ever in your favor.",
  "Running on 2 hours of sleep.",
  "Shhh... the admins are sleeping.",
  "Also try Terraria!",
  "The cake is a lie.",
  "Bloop!",
  "It's more fun in the Philippines!",
  "We live in a society."
];

const RARE_SPLASHES = [
  "Always watching... 👀",
  "Don't look behind you.",
  "Wake up.",
  "We know what you did last summer.",
  "They are coming."
];

export const FeedPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'our_feed' | 'explore'>('our_feed');

  const [rawPosts, setRawPosts] = useState<Post[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openPost, setOpenPost] = useState<Post | RedditPost | null>(null);

  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [pendingNewPostsCount, setPendingNewPostsCount] = useState(0);
  const renderedPostIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(false);

  useEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (!container) return;
    const handleScroll = () => {
      setIsScrolledDown(container.scrollTop > 300);
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (rawPosts.length === 0) return;

    if (!initialLoadRef.current) {
      setPosts(rawPosts);
      renderedPostIdsRef.current = new Set(rawPosts.map(p => p.id));
      initialLoadRef.current = true;
      setIsLoading(false);
      return;
    }

    const currentRenderedIds = renderedPostIdsRef.current;
    const newUnpinnedPosts = rawPosts.filter(p => !currentRenderedIds.has(p.id) && !p.isPinned);

    if (newUnpinnedPosts.length > 0 && isScrolledDown) {
      setPendingNewPostsCount(newUnpinnedPosts.length);
      // Keep displaying what's already rendered (plus any pinned posts, which bypass the buffer)
      const updatedPostsToRender = rawPosts.filter(p => currentRenderedIds.has(p.id) || p.isPinned);
      setPosts(updatedPostsToRender);
    } else {
      setPendingNewPostsCount(0);
      setPosts(rawPosts);
      renderedPostIdsRef.current = new Set(rawPosts.map(p => p.id));
    }
  }, [rawPosts, isScrolledDown]);

  const splashData = useMemo(() => {
    const isRare = Math.random() < 0.05;
    const list = isRare ? RARE_SPLASHES : SPLASH_TEXTS;
    return {
      text: list[Math.floor(Math.random() * list.length)],
      isRare
    };
  }, []);
  
  // Filter & Sort State
  const [activeType, setActiveType] = useState<string>('All');
  const [activeMember, setActiveMember] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'Latest' | 'Most Reacted'>('Latest');
  
  const composerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Subscribe to posts collection, ordering by creation time descending
    const unsubscribePosts = subscribeToCollection<Post>(
      'posts',
      (data) => {
        const now = Date.now();
        const validPosts = data.filter(p => !p.expiresAt || p.expiresAt > now);
        setRawPosts(validPosts);

        const expiredPosts = data.filter(p => p.expiresAt && p.expiresAt <= now);
        if (expiredPosts.length > 0) {
          import('firebase/firestore').then(({ writeBatch, doc }) => {
            import('../lib/firebase').then(({ db }) => {
              const batch = writeBatch(db);
              expiredPosts.forEach(p => {
                batch.delete(doc(db, 'posts', p.id));
              });
              batch.commit().catch(console.error);
            });
          });
        }
      },
      orderBy('createdAt', 'desc')
    );

    const unsubscribeUsers = subscribeToCollection<User>(
      'users',
      (data) => setUsers(data)
    );

    const handleOpenPostModal = (e: CustomEvent) => {
      const postId = e.detail;
      // Find the post
      import('../lib/firestore').then(({ getDoc }) => {
        getDoc<Post>('posts', [postId]).then(p => {
          if (p) setOpenPost(p);
        });
      });
    };

    const handleFocusComposer = () => {
      composerRef.current?.focus();
      composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const handleScrollToPoll = () => {
      // Small hack: wait for render then find the text 'Poll'
      setTimeout(() => {
        const h3s = Array.from(document.querySelectorAll('h3'));
        const pollHeader = h3s.find(h => h.textContent === 'Poll');
        if (pollHeader) {
          pollHeader.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    };

    window.addEventListener('openPostModal', handleOpenPostModal as EventListener);
    window.addEventListener('focusComposer', handleFocusComposer);
    window.addEventListener('scrollToPoll', handleScrollToPoll);

    return () => {
      unsubscribePosts();
      unsubscribeUsers();
      window.removeEventListener('openPostModal', handleOpenPostModal as EventListener);
      window.removeEventListener('focusComposer', handleFocusComposer);
      window.removeEventListener('scrollToPoll', handleScrollToPoll);
    };
  }, []);

  const sortedAndFilteredPosts = useMemo(() => {
    let filtered = [...posts];

    // 1. Type Filter
    if (activeType !== 'All') {
      filtered = filtered.filter(post => {
        if (activeType === 'Videos') return post.linkMeta?.youtubeId || post.linkUrl?.includes('youtube.com') || post.linkUrl?.includes('youtu.be');
        if (activeType === 'Images') return !!post.imageUrl;
        if (activeType === 'Colored') return !!post.bgColor;
        if (activeType === 'Links') return !!post.linkUrl && !post.linkMeta?.youtubeId && !post.linkUrl.includes('youtube.com') && !post.linkUrl.includes('youtu.be');
        
        return false;
      });
    }

    // 2. Member Filter
    if (activeMember) {
      filtered = filtered.filter(post => post.authorId === activeMember);
    }

    // 3. Sort
    if (sortBy === 'Most Reacted') {
      filtered.sort((a, b) => {
        const getReactionsCount = (p: Post) => Object.values(p.reactions || {}).reduce((sum, arr) => sum + arr.length, 0);
        return getReactionsCount(b) - getReactionsCount(a);
      });
    } else {
      // Latest - sort pinned posts to top ONLY if no filters are active, or just standard sort
      // Actually, standard behavior: pinned posts top, then newest
      filtered.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA;
      });
    }

    return filtered;
  }, [posts, activeType, activeMember, sortBy]);

  const handleFocusComposer = () => {
    composerRef.current?.focus();
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handlePrev = () => {
    if (!openPost) return;
    const idx = sortedAndFilteredPosts.findIndex(p => p.id === openPost.id);
    if (idx > 0) setOpenPost(sortedAndFilteredPosts[idx - 1]);
  };

  const handleNext = () => {
    if (!openPost) return;
    const idx = sortedAndFilteredPosts.findIndex(p => p.id === openPost.id);
    if (idx !== -1 && idx < sortedAndFilteredPosts.length - 1) setOpenPost(sortedAndFilteredPosts[idx + 1]);
  };

  const hasActiveFilters = activeType !== 'All' || activeMember !== null || sortBy !== 'Latest';

  const handleClearFilters = () => {
    setActiveType('All');
    setActiveMember(null);
    setSortBy('Latest');
  };

  return (
    <div className="relative">
      {/* Fixed Page Header */}
      <div 
        className="fixed top-0 left-0 right-0 md:left-[240px] lg:right-[300px] z-50 flex justify-center backdrop-blur-md" 
        style={{ 
          background: 'color-mix(in srgb, var(--color-bg-base) 95%, transparent)', 
          borderBottom: '1px solid var(--color-border-subtle)' 
        }}
      >
        <div className="flex items-center justify-end w-full max-w-[680px] h-[48px] px-4 md:px-6 relative">
          {/* CENTER: Tab Switcher */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 flex items-center h-full">
            <button
              onClick={() => setActiveTab('our_feed')}
              className={`flex items-center px-4 h-full font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'our_feed' ? 'border-primary text-main font-semibold' : 'border-transparent text-muted hover:text-main'
              }`}
            >
              Our Feed
            </button>
            <button
              onClick={() => setActiveTab('explore')}
              className={`flex items-center px-4 h-full font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'explore' ? 'border-primary text-main font-semibold' : 'border-transparent text-muted hover:text-main'
              }`}
            >
              Explore
            </button>
          </div>

          {/* RIGHT: Bell Icon */}
          <NotificationBell />
        </div>
      </div>

      {/* Scrollable Content Container */}
      <div className="-mt-6 pt-[48px]">
      {/* New Posts Pill */}
      {pendingNewPostsCount > 0 && (
        <div className="sticky top-[60px] z-30 flex justify-center w-full pointer-events-none mb-2 -mt-4">
          <button
            onClick={() => {
              const container = document.getElementById('main-scroll-container');
              if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="pointer-events-auto flex items-center gap-1.5 bg-primary text-on-primary px-4 py-1.5 rounded-full shadow-lg font-bold text-sm hover:scale-105 hover:bg-primary-hover active:scale-95 transition-all animate-in slide-in-from-top-4 fade-in duration-300"
          >
            &uarr; {pendingNewPostsCount} new post{pendingNewPostsCount > 1 ? 's' : ''}
          </button>
        </div>
      )}

      {activeTab === 'our_feed' ? (
        <>
          {/* Feed Heading Section */}
          <div className="pt-6 mb-4">
            <h1 className="font-heading font-bold text-2xl text-main">What's Up 👀</h1>
            <p 
              className={`text-sm mt-1 italic ${
                splashData.isRare 
                  ? 'text-rose-500 font-mono tracking-widest font-semibold animate-pulse uppercase' 
                  : 'text-faint'
              }`} 
            >
              {splashData.text}
            </p>
          </div>

          {/* Composer */}
          <div className="mb-3">
            <PostComposer composerRef={composerRef} allUsers={users} />
          </div>

          {/* Filter Bar */}
          {posts.length > 0 && (
            <div className="mb-3 flex flex-col gap-2">
              <div className="flex items-center gap-4 bg-transparent py-2 border-b border-border-subtle w-full">
                {/* LEFT: Type Filter Pills (Scrollable) */}
                <div className="relative flex-1 min-w-0">
                  <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 w-full pr-8">
                    {FILTER_TYPES.map(type => (
                      <button
                        key={type}
                        onClick={() => setActiveType(type)}
                        className={`flex-shrink-0 px-3 py-1.5 text-sm rounded-full border transition-colors ${
                          activeType === type
                            ? 'bg-primary/15 border-primary text-primary font-semibold'
                            : 'border-border text-muted bg-surface hover:text-main hover:border-border-subtle'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  {/* Fade gradient for scrolling edge */}
                  <div className="absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-base to-transparent pointer-events-none" />
                </div>

                {/* RIGHT: Member Filter & Sort Toggle */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Member Avatars */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveMember(null)}
                      className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 ${
                        activeMember === null ? 'ring-2 ring-primary ring-offset-2 ring-offset-base' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}
                      title="All members"
                    >
                      <Users size={12} className="text-muted md:w-4 md:h-4" />
                    </button>
                    {users.map(u => (
                      <button
                        key={u.id}
                        onClick={() => setActiveMember(u.id)}
                        className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center font-bold text-white text-[10px] md:text-[11px] flex-shrink-0 transition-transform active:scale-95 ${
                          activeMember === u.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-base' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ background: u.avatarUrl ? undefined : getAvatarColor(u.displayName) }}
                        title={u.displayName}
                      >
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          u.displayName.charAt(0).toUpperCase()
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Sort Toggle */}
                  <div className="flex items-center bg-surface border border-border-subtle rounded-full p-0.5 flex-shrink-0 shadow-sm">
                    {(['Latest', 'Most Reacted'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setSortBy(s)}
                        className={`px-2 py-1 md:px-3 md:py-1.5 text-[10px] md:text-xs rounded-full font-bold transition-all ${
                          sortBy === s
                            ? 'bg-primary text-on-primary shadow-sm'
                            : 'text-muted hover:text-main'
                        }`}
                      >
                        {s === 'Latest' ? '✨ Latest' : '🔥 Most Reacted'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Clear Filters (Below the bar) */}
              {hasActiveFilters && (
                <div className="flex justify-end px-1">
                  <button
                    onClick={handleClearFilters}
                    className="text-[11px] font-medium text-faint hover:text-main transition-colors"
                  >
                    &middot; Clear filters
                  </button>
                </div>
              )}
            </div>
          )}

      {/* Feed */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : posts.length === 0 ? (
          /* ── Empty State ── */
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div
              className="text-6xl mb-5 select-none"
              style={{ lineHeight: 1 }}
            >
              🏘️
            </div>
            <h3
              className="font-heading font-bold text-main mb-2"
              style={{ fontSize: '1.35rem' }}
            >
              No posts yet!
            </h3>
            <p className="text-muted text-sm mb-6 max-w-xs">
              Be the first to share something with the group.
            </p>
            <button
              onClick={handleFocusComposer}
              className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-150 hover:scale-105 active:scale-95"
              style={{
                background: 'var(--color-primary)',
                color: 'var(--color-on-primary)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              Write a post
            </button>
          </div>
        ) : sortedAndFilteredPosts.length === 0 ? (
          /* ── Filter Empty State ── */
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in">
            <div className="text-6xl mb-5 select-none" style={{ lineHeight: 1 }}>🔍</div>
            <h3 className="font-heading font-bold text-main mb-2" style={{ fontSize: '1.35rem' }}>
              No posts match this filter
            </h3>
            <p className="text-muted text-sm mb-6 max-w-xs">
              Try a different filter or clear them all.
            </p>
            <button
              onClick={handleClearFilters}
              className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-150 hover:scale-105 active:scale-95 border border-border-subtle bg-surface text-main hover:bg-elevated hover:border-border"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-4">
            {sortedAndFilteredPosts.map((post) => (
              <PostCard key={post.id} post={post} onOpenPost={setOpenPost} allUsers={users} />
            ))}
          </div>
        )}
      </div>

        </>
      ) : (
        <ExploreTab onOpenPost={setOpenPost} />
      )}
      </div>

      {/* Post Detail Modal */}
      {openPost && (
        <PostDetailModal
          post={openPost}
          isRedditPost={'subreddit' in openPost}
          onClose={() => setOpenPost(null)}
          allUsers={users}
          onPrev={
            !('subreddit' in openPost) && sortedAndFilteredPosts.findIndex(p => p.id === openPost.id) > 0 
              ? handlePrev 
              : undefined
          }
          onNext={
            !('subreddit' in openPost) && sortedAndFilteredPosts.findIndex(p => p.id === openPost.id) < sortedAndFilteredPosts.length - 1 
              ? handleNext 
              : undefined
          }
        />
      )}
    </div>
  );
};

export default FeedPage;
