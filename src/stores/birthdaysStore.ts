import { create } from 'zustand';
import type { User } from '../types';

interface BirthdaysState {
  users: User[];
  fetchedAt: number | null;
  setUsers: (users: User[]) => void;
  invalidate: () => void;
}

export const useBirthdaysStore = create<BirthdaysState>((set) => ({
  users: [],
  fetchedAt: null,
  setUsers: (users) => set({ users, fetchedAt: Date.now() }),
  invalidate: () => set({ fetchedAt: null }),
}));
