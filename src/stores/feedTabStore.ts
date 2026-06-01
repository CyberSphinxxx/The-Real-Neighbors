import { create } from 'zustand';

type FeedTab = 'our_feed' | 'explore';

interface FeedTabState {
  activeTab: FeedTab;
  setActiveTab: (tab: FeedTab) => void;
}

export const useFeedTabStore = create<FeedTabState>((set) => ({
  activeTab: 'our_feed',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
