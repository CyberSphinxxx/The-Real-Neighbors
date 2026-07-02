import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../lib/firebase';
import { subscribeToCollection } from '../lib/firestore';
import { getAvatarColor } from '../utils/avatarColor';
import type { User } from '../types';

export interface PresenceUser {
  uid: string;
  displayName: string;
  handle?: string;
  avatarColor: string;
  avatarUrl?: string;
  customTitle?: string;
  online: boolean;
  lastSeen: number | null;
  privacyPrefs?: {
    showOnlineStatus?: boolean;
    showLastSeen?: boolean;
  };
}

export const useOnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [offlineUsers, setOfflineUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    let firestoreUsers: User[] = [];
    let rtdbPresence: Record<string, any> = {};

    const updateUsers = () => {
      const allUsersMap = new Map<string, PresenceUser>();

      firestoreUsers.forEach(u => {
        allUsersMap.set(u.id, {
          uid: u.id,
          displayName: u.displayName,
          handle: u.handle,
          avatarColor: getAvatarColor(u.displayName),
          avatarUrl: u.avatarUrl,
          customTitle: u.customTitle,
          online: false,
          lastSeen: null,
          privacyPrefs: u.privacyPrefs
        });
      });

      Object.keys(rtdbPresence).forEach(uid => {
        const p = rtdbPresence[uid];
        if (allUsersMap.has(uid)) {
          const u = allUsersMap.get(uid)!;
          u.online = p.connections ? Object.keys(p.connections).length > 0 : !!p.online;
          if (p.lastSeen) u.lastSeen = p.lastSeen;
          if (p.avatarColor) u.avatarColor = p.avatarColor;
        } else {
          allUsersMap.set(uid, { 
            uid, 
            ...p, 
            online: p.connections ? Object.keys(p.connections).length > 0 : !!p.online 
          });
        }
      });

      const allUsers = Array.from(allUsersMap.values());
      const online = allUsers.filter((u) => u.online && u.privacyPrefs?.showOnlineStatus !== false);
      const offline = allUsers
        .filter((u) => !u.online || u.privacyPrefs?.showOnlineStatus === false)
        .sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));

      setOnlineUsers(online);
      setOfflineUsers(offline);
    };

    const unsubFirestore = subscribeToCollection<User>('users', (data) => {
      firestoreUsers = data;
      updateUsers();
    });

    const presenceRef = ref(rtdb, 'presence');
    const unsubRTDB = onValue(presenceRef, (snapshot) => {
      rtdbPresence = snapshot.val() || {};
      updateUsers();
    });

    return () => {
      unsubFirestore();
      unsubRTDB();
    };
  }, []);

  return { onlineUsers, offlineUsers };
};
