import React, { useState, useEffect, useMemo } from 'react';
import { PostComposer } from '../components/feed/PostComposer';
import { PostCard } from '../components/feed/PostCard';
import { subscribeToCollection } from '../lib/firestore';
import { orderBy } from 'firebase/firestore';
import type { Post } from '../types';
import { Loader2 } from 'lucide-react';

export const FeedPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Page Header (optional, usually Feed doesn't need a huge header if AppShell has one, but good for context) */}
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-main tracking-tight">Feed</h1>
        <p className="text-sm text-muted">See what your neighbors are up to.</p>
      </div>

      <PostComposer />

      <div className="space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Loading posts...</p>
          </div>
        ) : sortedPosts.length === 0 ? (
          <div className="bg-surface rounded-2xl p-12 text-center border border-border-subtle shadow-sm">
            <div className="w-16 h-16 bg-base rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              👋
            </div>
            <h3 className="text-lg font-semibold text-main mb-2">No posts yet</h3>
            <p className="text-muted">Break the silence! Be the first to share something with the group.</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {sortedPosts.map((post) => (
              <PostCard key={post.id} post={post} commentCount={0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedPage;
