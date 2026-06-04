import { useEffect, useRef } from 'react';
import { fetchLatestRelease, fetchAllReleases } from '../lib/github';
import { useWhatsNewStore } from '../stores/whatsNewStore';

export function useWhatsNew() {
  const store = useWhatsNewStore();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function checkReleases() {
      store.setReleasesData({ ...store, isLoading: true });

      const latest = await fetchLatestRelease();
      if (!latest) {
        store.setReleasesData({
          latestRelease: null,
          allReleases: [],
          shouldShow: false,
          isLoading: false,
        });
        return;
      }

      const lastSeenTag = localStorage.getItem('whatsNew_lastSeenTag');
      const shouldShow = lastSeenTag !== latest.tagName;

      store.setReleasesData({
        latestRelease: latest,
        allReleases: store.allReleases,
        shouldShow,
        isLoading: false,
      });

      // Fetch all releases in background
      fetchAllReleases().then((all) => {
        store.setAllReleases(all);
      });
    }

    checkReleases();
  }, []);

  return store;
}
