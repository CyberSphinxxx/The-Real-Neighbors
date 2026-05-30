import React, { useState, useEffect, useRef, useMemo } from 'react';
import { orderBy } from 'firebase/firestore';
import { PostComposer } from '../components/feed/PostComposer';
import { PostCard } from '../components/feed/PostCard';
import { PostSkeleton } from '../components/feed/PostSkeleton';
import { PostDetailModal } from '../components/feed/PostDetailModal';
import { ExploreTab } from '../components/feed/ExploreTab';
import { subscribeToCollection } from '../lib/firestore';
import { Users, Bell } from 'lucide-react';
import { getAvatarColor } from '../utils/avatarColor';
import type { Post, User, RedditPost } from '../types';

const FILTER_TYPES = [
  'All', 'Videos', 'Images', 'Colored', 'Links', 
  'Vibing 🎵', 'Gaming 🎮', 'Chill 😄', 'Hype 🔥', 
  'Lutang 😴', 'Kain 🍜', 'Rant 😤', 'Tamad 💤'
];

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

  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openPost, setOpenPost] = useState<Post | RedditPost | null>(null);

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
        setPosts(data);
        setIsLoading(false);
      },
      orderBy('createdAt', 'desc')
    );

    const unsubscribeUsers = subscribeToCollection<User>(
      'users',
      (data) => setUsers(data)
    );

    return () => {
      unsubscribePosts();
      unsubscribeUsers();
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
        
        // Vibe tags
        if (post.vibeTag?.label && activeType.includes(post.vibeTag.label)) return true;
        
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
      {/* Sticky Page Header */}
      <div 
        className="sticky -top-6 z-20 flex items-center justify-between h-[56px] px-4 md:px-6 -mx-4 md:-mx-6 mb-4 backdrop-blur-md" 
        style={{ 
          background: 'color-mix(in srgb, var(--color-bg-base) 95%, transparent)', 
          borderBottom: '1px solid var(--color-border-subtle)' 
        }}
      >
        {/* LEFT: Title & Subtitle */}
        <div className="flex flex-col">
          <h1 className="font-heading font-bold text-lg text-main leading-none">What's Up 👀</h1>
          <p 
            className={`text-xs mt-1 hidden md:block ${
              splashData.isRare 
                ? 'text-rose-500 font-mono tracking-widest font-semibold animate-pulse uppercase' 
                : 'text-muted italic'
            }`} 
          >
            {splashData.text}
          </p>
        </div>

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

        {/* RIGHT: Bell Icon Placeholder */}
        <button className="p-2 rounded-md text-muted hover:bg-elevated hover:text-main transition-colors">
          <Bell size={20} />
        </button>
      </div>

      {activeTab === 'our_feed' ? (
        <>
          {/* Composer */}
          <div className="bg-surface rounded-xl border border-default shadow-sm mb-3">
            <PostComposer composerRef={composerRef} />
          </div>

          {/* Filter Bar */}
          {posts.length > 0 && (
            <div className="mb-3 border-b border-border-subtle py-2 bg-transparent flex flex-col gap-3">
              {/* Row 1: Type Filter Pills & Clear */}
              <div className="relative flex items-center w-full">
                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 w-full pr-12 relative z-10">
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
                
                {hasActiveFilters && (
                  <div className="absolute right-0 top-0 bottom-2 bg-gradient-to-l from-base via-base to-transparent pl-8 pr-1 flex items-center z-20 pointer-events-none">
                    <button
                      onClick={handleClearFilters}
                      className="text-xs text-muted hover:text-main font-semibold whitespace-nowrap bg-base px-2 py-1 rounded pointer-events-auto"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>

              {/* Row 2: Member Filter and Sort Toggle */}
              <div className="flex items-center justify-between gap-4">
                {/* LEFT: Member Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 flex-1">
              <button
                onClick={() => setActiveMember(null)}
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 ${
                  activeMember === null ? 'ring-2 ring-primary ring-offset-2 ring-offset-base' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}
                title="All members"
              >
                <Users size={16} className="text-muted" />
              </button>
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => setActiveMember(u.id)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-[11px] flex-shrink-0 transition-transform active:scale-95 ${
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

            {/* RIGHT: Sort Toggle */}
            <div className="flex items-center bg-surface border border-border-subtle rounded-full p-0.5 flex-shrink-0 shadow-sm">
              {(['Latest', 'Most Reacted'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`px-3 py-1.5 text-xs rounded-full font-bold transition-all ${
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
              <PostCard key={post.id} post={post} onOpenPost={setOpenPost} />
            ))}
          </div>
        )}
      </div>

        </>
      ) : (
        <ExploreTab onOpenPost={setOpenPost} />
      )}

      {/* Post Detail Modal */}
      {openPost && (
        <PostDetailModal
          post={openPost}
          isRedditPost={'subreddit' in openPost}
          onClose={() => setOpenPost(null)}
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
