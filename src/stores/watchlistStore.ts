import { create } from 'zustand';
import type { WatchlistEntry } from '../types';

interface WatchlistState {
  entries: WatchlistEntry[];
  fetchedAt: number | null;
  setEntries: (entries: WatchlistEntry[]) => void;
  invalidate: () => void;
}

export const useWatchlistStore = create<WatchlistState>((set) => ({
  entries: [],
  fetchedAt: null,
  setEntries: (entries) => set({ entries, fetchedAt: Date.now() }),
  invalidate: () => set({ fetchedAt: null }),
}));
