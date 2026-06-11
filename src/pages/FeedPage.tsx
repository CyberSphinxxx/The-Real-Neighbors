import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PostComposer } from '../components/feed/PostComposer';
import { PostCard } from '../components/feed/PostCard';
import { PostSkeleton } from '../components/feed/PostSkeleton';
import { PostDetailModal } from '../components/feed/PostDetailModal';
import { ExploreTab } from '../components/feed/ExploreTab';
import { FilterBottomSheet } from '../components/feed/FilterBottomSheet';
import { FeedCatchUp } from '../components/ai/FeedCatchUp';
import { subscribeToCollection } from '../lib/firestore';
import { Users, Filter, Sparkles } from 'lucide-react';
import { getAvatarColor } from '../utils/avatarColor';
import { useAuthStore } from '../stores/authStore';
import { useFeedTabStore } from '../stores/feedTabStore';
import { usePostStore } from '../stores/postStore';
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
  const location = useLocation();
  const { activeTab } = useFeedTabStore();
  const { upsertPosts } = usePostStore();

  const [rawPosts, setRawPosts] = useState<Post[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openPost, setOpenPost] = useState<Post | RedditPost | null>(null);
  const [showCatchUpModal, setShowCatchUpModal] = useState(false);

  // Pagination State
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [pendingNewPostsCount, setPendingNewPostsCount] = useState(0);
  const renderedPostIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(false);
  const { user } = useAuthStore();

  // Open composer if navigated here with openComposer state
  useEffect(() => {
    if ((location.state as any)?.openComposer) {
      // Small delay to let the page render first
      setTimeout(() => {
        composerRef.current?.focus();
        composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
      // Clear the state so it doesn't re-trigger on re-renders
      window.history.replaceState({}, '');
    }
  }, []);

  useEffect(() => {
    if (user?.subreddits) {
      import('../lib/redditCache').then(({ isFresh, prefetchSubreddit }) => {
        user.subreddits!.forEach((sub: string, index: number) => {
          if (!isFresh(sub)) {
            setTimeout(() => prefetchSubreddit(sub), index * 500);
          }
        });
      });
    }
  }, [user?.subreddits]);

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

    // Sync into global post store for search
    upsertPosts(rawPosts);

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
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const fetchInitialPosts = async () => {
    setIsLoading(true);
    setRawPosts([]);
    setLastVisible(null);
    setHasMore(true);
    
    try {
      const { collection, query, orderBy, limit, getDocs } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(20));
      const snapshot = await getDocs(q);
      
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));
      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(docs.length === 20);
      
      const latestTs = docs.length > 0 ? docs[0].createdAt : Date.now();
      
      setRawPosts(docs);
      setIsLoading(false);
      return latestTs;
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      return Date.now();
    }
  };

  const handleLoadMore = async () => {
    if (!lastVisible || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const { collection, query, orderBy, limit, startAfter, getDocs } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), startAfter(lastVisible), limit(20));
      const snapshot = await getDocs(q);
      
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));
      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
      if (docs.length < 20) setHasMore(false);
      
      setRawPosts(prev => {
        const existing = new Map(prev.map(p => [p.id, p]));
        docs.forEach(d => existing.set(d.id, d));
        return Array.from(existing.values());
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    let unsubscribeNewPosts = () => {};
    let unsubscribePinned = () => {};

    const init = async () => {
      const latestTs = await fetchInitialPosts();
      
      const { collection, query, orderBy, where, onSnapshot } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      
      const newQ = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), where('createdAt', '>', latestTs));
      unsubscribeNewPosts = onSnapshot(newQ, (snap) => {
        const newDocs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
        if (newDocs.length > 0) {
          setRawPosts(prev => {
            const existing = new Map(prev.map(p => [p.id, p]));
            newDocs.forEach(d => existing.set(d.id, d));
            return Array.from(existing.values());
          });
        }
      });
      
      const pinnedQ = query(collection(db, 'posts'), where('isPinned', '==', true));
      unsubscribePinned = onSnapshot(pinnedQ, (snap) => {
        const pinnedDocs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
        if (pinnedDocs.length > 0) {
          setRawPosts(prev => {
            const existing = new Map(prev.map(p => [p.id, p]));
            pinnedDocs.forEach(d => existing.set(d.id, d));
            return Array.from(existing.values());
          });
        }
      });
    };
    
    init();

    const interval = setInterval(() => {
      const now = Date.now();
      setRawPosts(prev => prev.filter(p => !p.expiresAt || p.expiresAt > now));
    }, 60000);

    const unsubscribeUsers = subscribeToCollection<User>(
      'users',
      (data) => setUsers(data)
    );

    const handleOpenPostModal = (e: CustomEvent) => {
      const postId = e.detail;
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
      setTimeout(() => {
        const h3s = Array.from(document.querySelectorAll('h3'));
        const pollHeader = h3s.find(h => h.textContent === 'Poll');
        if (pollHeader) {
          pollHeader.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    };

    const handleOptimisticDelete = (e: CustomEvent) => {
      const postId = e.detail;
      setRawPosts(prev => prev.filter(p => p.id !== postId));
    };

    const handleOptimisticRestore = (e: CustomEvent) => {
      const post = e.detail;
      setRawPosts(prev => {
        const arr = [...prev, post];
        arr.sort((a, b) => b.createdAt - a.createdAt);
        return arr;
      });
    };

    window.addEventListener('openPostModal', handleOpenPostModal as EventListener);
    window.addEventListener('focusComposer', handleFocusComposer);
    window.addEventListener('scrollToPoll', handleScrollToPoll);
    window.addEventListener('optimisticDeletePost', handleOptimisticDelete as EventListener);
    window.addEventListener('optimisticRestorePost', handleOptimisticRestore as EventListener);

    return () => {
      unsubscribeNewPosts();
      unsubscribePinned();
      clearInterval(interval);
      unsubscribeUsers();
      window.removeEventListener('openPostModal', handleOpenPostModal as EventListener);
      window.removeEventListener('focusComposer', handleFocusComposer);
      window.removeEventListener('scrollToPoll', handleScrollToPoll);
      window.removeEventListener('optimisticDeletePost', handleOptimisticDelete as EventListener);
      window.removeEventListener('optimisticRestorePost', handleOptimisticRestore as EventListener);
    };
  }, [activeType, activeMember, sortBy]);

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
        const getTime = (val: any) => {
          if (!val) return 0;
          if (typeof val.toDate === 'function') return val.toDate().getTime();
          return new Date(val).getTime();
        };
        const timeA = getTime(a.createdAt);
        const timeB = getTime(b.createdAt);
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

  const isVirtual = sortedAndFilteredPosts.length > 30;
  const virtualizer = useVirtualizer({
    count: isVirtual ? sortedAndFilteredPosts.length : 0,
    getScrollElement: () => document.getElementById('main-scroll-container'),
    estimateSize: () => 400,
    overscan: 5,
  });


  const handleClearFilters = () => {
    setActiveType('All');
    setActiveMember(null);
    setSortBy('Latest');
  };

  return (
    <div className="w-full h-full relative pb-12">
      <div className="max-w-[680px] mx-auto relative">
        {/* MOBILE TAB SWITCHER */}
        <div className="md:hidden flex items-center bg-surface border border-border-subtle rounded-full p-1 mb-4 mt-4 shadow-sm mx-2 sm:mx-0">
          <button
            onClick={() => useFeedTabStore.getState().setActiveTab('our_feed')}
            className={`flex-1 py-2 text-sm rounded-full font-bold transition-all ${
              activeTab === 'our_feed' ? 'bg-primary text-on-primary shadow-sm' : 'text-muted hover:text-main'
            }`}
          >
            Our Feed
          </button>
          <button
            onClick={() => useFeedTabStore.getState().setActiveTab('explore')}
            className={`flex-1 py-2 text-sm rounded-full font-bold transition-all ${
              activeTab === 'explore' ? 'bg-primary text-on-primary shadow-sm' : 'text-muted hover:text-main'
            }`}
          >
            Explore
          </button>
        </div>
      </div>

      {/* New Posts Pill */}
      {pendingNewPostsCount > 0 && activeTab === 'our_feed' && (
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
        <div className="max-w-[680px] mx-auto relative">
          {/* Feed Heading Section */}
          <div className="pt-6 mb-4 flex justify-between items-start">
            <div>
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
            <button
              onClick={() => setShowCatchUpModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary text-primary text-sm font-semibold hover:bg-primary/10 transition-colors"
            >
              <Sparkles size={14} /> Catch me up
            </button>
          </div>

          {/* Composer */}
          <div className="mb-3">
            <PostComposer composerRef={composerRef} allUsers={users} />
          </div>

          {/* Filter Bar */}
          {posts.length > 0 && (
            <div className="mb-3 flex flex-col gap-2">
              {/* MOBILE FILTER BUTTON */}
              <div className="md:hidden flex justify-between items-center bg-transparent py-1 w-full px-2 sm:px-0">
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-surface border border-border-subtle rounded-full text-sm font-semibold text-main hover:bg-elevated transition-colors shadow-sm"
                >
                  <Filter size={16} />
                  Filters {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>}
                </button>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="text-[12px] font-medium text-faint hover:text-main transition-colors px-2"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* DESKTOP FILTER BAR */}
              <div className="hidden md:flex flex-col gap-3 py-3 border-b border-border-subtle w-full bg-transparent">
                {/* TOP ROW: Type Filter & Sort Toggle */}
                <div className="flex items-center justify-between gap-4 w-full">
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

                  {/* RIGHT: Sort Toggle */}
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

                {/* BOTTOM ROW: Member Avatars */}
                <div className="relative w-full">
                  <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar p-1 pb-2 w-full pr-8 -ml-1">
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
                          <img src={u.avatarUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover rounded-full" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        ) : (
                          u.displayName.charAt(0).toUpperCase()
                        )}
                      </button>
                    ))}
                  </div>
                  {/* Fade gradient for scrolling edge */}
                  <div className="absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-base to-transparent pointer-events-none" />
                </div>
              </div>
              
              {/* Clear Filters (Below the bar) */}
              {hasActiveFilters && (
                <div className="hidden md:flex justify-end px-1">
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
            {isVirtual ? (
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const post = sortedAndFilteredPosts[virtualRow.index];
                  return (
                    <div
                      key={post.id}
                      ref={virtualizer.measureElement}
                      data-index={virtualRow.index}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="pb-4"
                    >
                      <PostCard post={post} onOpenPost={setOpenPost} allUsers={users} />
                    </div>
                  );
                })}
              </div>
            ) : (
              sortedAndFilteredPosts.map((post) => (
                <PostCard key={post.id} post={post} onOpenPost={setOpenPost} allUsers={users} />
              ))
            )}
            
            {hasMore ? (
              <button 
                onClick={handleLoadMore} 
                disabled={isLoadingMore}
                className="w-full max-w-xs mx-auto my-4 py-2 border border-border-subtle rounded-full text-muted hover:text-main hover:bg-base transition-colors flex items-center justify-center gap-2"
              >
                {isLoadingMore ? <span className="animate-spin opacity-70">⏳</span> : null}
                {isLoadingMore ? 'Loading...' : 'Load more posts'}
              </button>
            ) : (
              <p className="text-faint text-xs text-center my-4">You've seen everything. Go touch grass. 🌿</p>
            )}
          </div>
        )}
      </div>

        </div>
      ) : (
        <ExploreTab onOpenPost={setOpenPost} />
      )}
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

      {showCatchUpModal && (
        <FeedCatchUp isModal onClose={() => setShowCatchUpModal(false)} />
      )}

      {/* Mobile Filter Bottom Sheet */}
      <FilterBottomSheet
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        activeType={activeType}
        setActiveType={setActiveType}
        activeMember={activeMember}
        setActiveMember={setActiveMember}
        sortBy={sortBy}
        setSortBy={setSortBy}
        users={users}
        filterTypes={FILTER_TYPES}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />
    </div>
  );
};

export default FeedPage;
