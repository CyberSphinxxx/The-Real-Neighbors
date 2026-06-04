import { create } from 'zustand';
import type { GitHubRelease } from '../lib/github';

interface WhatsNewState {
  latestRelease: GitHubRelease | null;
  allReleases: GitHubRelease[];
  shouldShow: boolean;
  isLoading: boolean;
  markAsSeen: () => void;
  openManually: () => void;
  setReleasesData: (data: { latestRelease: GitHubRelease | null; allReleases: GitHubRelease[]; shouldShow: boolean; isLoading: boolean }) => void;
  setAllReleases: (allReleases: GitHubRelease[]) => void;
}

export const useWhatsNewStore = create<WhatsNewState>((set, get) => ({
  latestRelease: null,
  allReleases: [],
  shouldShow: false,
  isLoading: true,
  
  markAsSeen: () => {
    const { latestRelease } = get();
    if (latestRelease) {
      localStorage.setItem('whatsNew_lastSeenTag', latestRelease.tagName);
    }
    set({ shouldShow: false });
  },
  
  openManually: () => set({ shouldShow: true }),
  
  setReleasesData: (data) => set(data),

  setAllReleases: (allReleases) => set({ allReleases }),
}));
