import { useEffect } from 'react';
import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { rtdb } from '../lib/firebase';
import { useAuthStore } from '../stores/authStore';
import { getAvatarColor } from '../utils/avatarColor';

export const usePresence = () => {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    const uid = user.id;
    const userStatusDatabaseRef = ref(rtdb, `presence/${uid}`);
    const connectedRef = ref(rtdb, '.info/connected');

    const avatarColor = getAvatarColor(user.displayName);

    const isOfflineForDatabase = {
      online: false,
      lastSeen: serverTimestamp(),
      displayName: user.displayName,
      avatarColor,
    };

    const isOnlineForDatabase = {
      online: true,
      lastSeen: serverTimestamp(),
      displayName: user.displayName,
      avatarColor,
    };

    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // 1. Set onDisconnect handler (fire and forget - doesn't need to be awaited)
        onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).catch(console.error);
        // 2. Immediately write online status - don't wait for onDisconnect ACK
        set(userStatusDatabaseRef, isOnlineForDatabase).catch(console.error);
      }
    });

    return () => {
      unsubscribe();
      // We rely on onDisconnect to handle offline status when the user actually disconnects,
      // preventing React StrictMode from incorrectly setting offline on component remount.
    };
  }, [user]);
};
