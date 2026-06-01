import { create } from 'zustand';
import type { SavedLink, YoutubeQueueItem } from '../types';

interface LinksState {
  links: SavedLink[];
  queue: YoutubeQueueItem[];
  fetchedAt: number | null;
  setLinks: (links: SavedLink[]) => void;
  setQueue: (queue: YoutubeQueueItem[]) => void;
  invalidate: () => void;
}

export const useLinksStore = create<LinksState>((set) => ({
  links: [],
  queue: [],
  fetchedAt: null,
  setLinks: (links) => set({ links, fetchedAt: Date.now() }),
  setQueue: (queue) => set({ queue, fetchedAt: Date.now() }),
  invalidate: () => set({ fetchedAt: null }),
}));
