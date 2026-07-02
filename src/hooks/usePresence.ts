import { useEffect } from 'react';
import { ref, onValue, set, onDisconnect, serverTimestamp, push, remove } from 'firebase/database';
import { rtdb } from '../lib/firebase';
import { useAuthStore } from '../stores/authStore';
import { getAvatarColor } from '../utils/avatarColor';

export const usePresence = () => {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    const uid = user.id;
    const myConnectionsRef = ref(rtdb, `presence/${uid}/connections`);
    const lastSeenRef = ref(rtdb, `presence/${uid}/lastSeen`);
    const connectedRef = ref(rtdb, '.info/connected');

    const avatarColor = getAvatarColor(user.displayName);
    let currentConnectionRef: any = null;

    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // 1. Add this device to connections list
        const con = push(myConnectionsRef);
        currentConnectionRef = con;

        // Clean up legacy online flag from previous system
        set(ref(rtdb, `presence/${uid}/online`), null).catch(console.error);

        // 2. When I disconnect, remove this device
        onDisconnect(con).remove().then(() => {
          // 3. Immediately write online status for this connection
          set(con, true).catch(console.error);

          // Update basic presence info
          set(ref(rtdb, `presence/${uid}/displayName`), user.displayName).catch(console.error);
          set(ref(rtdb, `presence/${uid}/avatarColor`), avatarColor).catch(console.error);
        }).catch(console.error);

        // 4. When I disconnect, update lastSeen
        onDisconnect(lastSeenRef).set(serverTimestamp()).catch(console.error);
      }
    });

    return () => {
      unsubscribe();
      if (currentConnectionRef) {
        onDisconnect(currentConnectionRef).cancel().catch(console.error);
        remove(currentConnectionRef).catch(console.error);
        set(lastSeenRef, serverTimestamp()).catch(console.error);
      }
    };
  }, [user]);
};
