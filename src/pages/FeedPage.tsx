import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PostComposer } from '../components/feed/PostComposer';
import { PostCard } from '../components/feed/PostCard';
import { PostSkeleton } from '../components/feed/PostSkeleton';
import { subscribeToCollection } from '../lib/firestore';
import { orderBy } from 'firebase/firestore';
import type { Post } from '../types';

export const FeedPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Subscribe to posts collection, ordering by creation time descending
    const unsubscribe = subscribeToCollection<Post>(
      'posts',
      (data) => {
        setPosts(data);
        setIsLoading(false);
      },
      orderBy('createdAt', 'desc')
    );

    return () => unsubscribe();
  }, []);

  // Sort pinned posts to the top on the client side
  const sortedPosts = useMemo(() => {
    const pinned = posts.filter(p => p.isPinned);
    const unpinned = posts.filter(p => !p.isPinned);
    return [...pinned, ...unpinned];
  }, [posts]);

  const handleFocusComposer = () => {
    composerRef.current?.focus();
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div>
      {/* Page Header */}
      <div
        className="mb-6 pb-5"
        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        <h1
          className="font-heading font-bold text-main"
          style={{ fontSize: '2rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}
        >
          What's Up 👀
        </h1>
        <p className="text-muted text-sm mt-1" style={{ fontStyle: 'italic' }}>
          See what your neighbors are up to.
        </p>
      </div>

      {/* Composer */}
      <PostComposer composerRef={composerRef} />

      {/* Feed */}
      <div className="mt-6 flex flex-col gap-4">
        {isLoading ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : sortedPosts.length === 0 ? (
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
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-4">
            {sortedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedPage;
