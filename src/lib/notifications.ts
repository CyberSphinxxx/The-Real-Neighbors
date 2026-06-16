// getDoc removed
import type { User, Notification } from '../types';
import { useAuthStore } from '../stores/authStore';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from './firebase';

// Batching queue
type QueuedNotification = {
  path: string;
  data: Omit<Notification, 'id'>;
};

let notificationQueue: QueuedNotification[] = [];
let batchTimer: ReturnType<typeof setTimeout> | null = null;

let _cachedUsers: User[] | null = null;
let _cachedUsersTime = 0;

const getCachedUsers = async () => {
  if (_cachedUsers && Date.now() - _cachedUsersTime < 60000) {
    return _cachedUsers;
  }
  const snap = await getDocs(collection(db, 'users'));
  _cachedUsers = snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
  _cachedUsersTime = Date.now();
  return _cachedUsers;
};

const commitBatch = async () => {
  if (notificationQueue.length === 0) return;

  const queueCopy = [...notificationQueue];
  notificationQueue = [];

  try {
    // Firestore batch limit is 500 writes; chunk into 450 to stay safe
    const CHUNK_SIZE = 450;
    for (let i = 0; i < queueCopy.length; i += CHUNK_SIZE) {
      const chunk = queueCopy.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach(({ path, data }) => {
        const docRef = doc(collection(db, path));
        batch.set(docRef, data);
      });
      await batch.commit();
    }
  } catch (error) {
    console.error('Failed to commit notification batch', error);
  }
};

const queueWrite = (path: string, data: Omit<Notification, 'id'>) => {
  notificationQueue.push({ path, data });
  
  if (batchTimer) {
    clearTimeout(batchTimer);
  }
  
  batchTimer = setTimeout(() => {
    commitBatch();
  }, 2000); // 2 second debounce
};

export const writeNotification = async (
  targetUid: string,
  data: Omit<Notification, 'id' | 'isRead' | 'createdAt'>,
  prefKey?: string
) => {
  const currentUser = useAuthStore.getState().user;
  
  // Never write a notification to yourself (unless explicitly allowed, e.g., reminders)
  const isSelfNotification = targetUid === currentUser?.id;
  if (isSelfNotification && !['expiry', 'event_reminder'].includes(data.type)) {
    return;
  }

  try {
    // Check target user's notification preferences
    const users = await getCachedUsers();
    const targetUser = users.find(u => u.id === targetUid);
    if (targetUser && prefKey) {
      const prefs = targetUser.notificationPrefs || {};
      if (prefs[prefKey] === false) {
        return;
      }
    }

    const newNotification: Omit<Notification, 'id'> = {
      ...data,
      isRead: false,
      createdAt: Date.now(),
    };

    queueWrite(`users/${targetUid}/notifications`, newNotification);
  } catch (error) {
    console.error('Failed to queue notification', error);
  }
};

export const broadcastNotification = async (
  data: Omit<Notification, 'id' | 'isRead' | 'createdAt'>,
  prefKey: string,
  excludeUid?: string
) => {
  try {
    const users = await getCachedUsers();
    
    // Process users in batches to avoid blocking
    for (const targetUser of users) {
      const uid = targetUser.id;
      if (uid === excludeUid) continue;

      const prefs = targetUser.notificationPrefs || {};

      if (prefs[prefKey] !== false) {
        const newNotification: Omit<Notification, 'id'> = {
          ...data,
          isRead: false,
          createdAt: Date.now(),
        };
        queueWrite(`users/${uid}/notifications`, newNotification);
      }
    }
  } catch (error) {
    console.error('Failed to broadcast notification', error);
  }
};
