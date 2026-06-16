import { useEffect, useRef } from 'react';
import { fetchLatestRelease, fetchAllReleases } from '../lib/github';
import { useWhatsNewStore } from '../stores/whatsNewStore';
import { useAuthStore } from '../stores/authStore';
import { writeNotification } from '../lib/notifications';

export function useWhatsNew() {
  const store = useWhatsNewStore();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function checkReleases() {
      useWhatsNewStore.setState({ isLoading: true });

      const latest = await fetchLatestRelease();
      if (!latest) {
        useWhatsNewStore.setState({
          latestRelease: null,
          allReleases: [],
          shouldShow: false,
          isLoading: false,
        });
        return;
      }

      const lastSeenTag = localStorage.getItem('whatsNew_lastSeenTag');
      const shouldShow = lastSeenTag !== latest.tagName;

      useWhatsNewStore.setState({
        latestRelease: latest,
        shouldShow,
        isLoading: false,
      });

      if (shouldShow && lastSeenTag !== null) {
        const notifiedTag = localStorage.getItem('whatsNew_notifiedTag');
        if (notifiedTag !== latest.tagName) {
          const user = useAuthStore.getState().user;
          if (user) {
            writeNotification(user.id, {
              type: 'release',
              fromUid: 'system',
              fromName: 'System',
              fromAvatarColor: 'var(--color-primary)',
              message: `Version ${latest.tagName} is now live! Check out what's new.`,
            }).catch(err => console.error('Failed to create release notification:', err));

            localStorage.setItem('whatsNew_notifiedTag', latest.tagName);
          }
        }
      }

      // Fetch all releases in background
      fetchAllReleases().then((all) => {
        store.setAllReleases(all);
      });
    }

    checkReleases();
  }, []);

  return store;
}
