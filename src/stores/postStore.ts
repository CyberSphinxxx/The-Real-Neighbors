import { create } from 'zustand';
import type { Post } from '../types';

interface PostStoreState {
  posts: Post[];
  setPosts: (posts: Post[]) => void;
  upsertPosts: (posts: Post[]) => void;
}

export const usePostStore = create<PostStoreState>((set) => ({
  posts: [],
  setPosts: (posts) => set({ posts }),
  upsertPosts: (incoming) =>
    set((state) => {
      const map = new Map(state.posts.map((p) => [p.id, p]));
      incoming.forEach((p) => map.set(p.id, p));
      return { posts: Array.from(map.values()) };
    }),
}));
