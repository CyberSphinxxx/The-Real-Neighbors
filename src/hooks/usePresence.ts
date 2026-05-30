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
        // We're connected (or reconnected)!
        const userRef = onDisconnect(userStatusDatabaseRef);
        userRef.set(isOfflineForDatabase).then(() => {
          // The promise resolves when the onDisconnect state has been sent to server,
          // then we can safely set ourselves online.
          set(userStatusDatabaseRef, isOnlineForDatabase).catch(console.error);
        }).catch(console.error);
      }
    });

    return () => {
      unsubscribe();
      // We rely on onDisconnect to handle offline status when the user actually disconnects,
      // preventing React StrictMode from incorrectly setting offline on component remount.
    };
  }, [user]);
};
