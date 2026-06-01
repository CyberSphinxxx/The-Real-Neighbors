import { create } from 'zustand';
import type { Event } from '../types';

interface EventsState {
  events: Event[];
  fetchedAt: number | null;
  setEvents: (events: Event[]) => void;
  invalidate: () => void;
}

export const useEventsStore = create<EventsState>((set) => ({
  events: [],
  fetchedAt: null,
  setEvents: (events) => set({ events, fetchedAt: Date.now() }),
  invalidate: () => set({ fetchedAt: null }),
}));
