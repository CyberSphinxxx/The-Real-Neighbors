import { getDoc } from './firestore';
import type { User, Notification } from '../types';
import { useAuthStore } from '../stores/authStore';

// Batching queue
type QueuedNotification = {
  path: string;
  data: Omit<Notification, 'id'>;
};

let notificationQueue: QueuedNotification[] = [];
let batchTimer: ReturnType<typeof setTimeout> | null = null;

const commitBatch = async () => {
  if (notificationQueue.length === 0) return;

  const queueCopy = [...notificationQueue];
  notificationQueue = [];

  try {
    const { writeBatch, doc, collection } = await import('firebase/firestore');
    const { db } = await import('./firebase');

    const batch = writeBatch(db);
    queueCopy.forEach(({ path, data }) => {
      // Create a new doc reference with auto ID
      const docRef = doc(collection(db, path));
      batch.set(docRef, data);
    });

    await batch.commit();
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
    const targetUser = await getDoc<User>('users', [targetUid]);
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
    const { collection, getDocs } = await import('firebase/firestore');
    const { db } = await import('./firebase');
    const usersSnap = await getDocs(collection(db, 'users'));
    
    usersSnap.forEach(docSnap => {
      const uid = docSnap.id;
      if (uid === excludeUid) return;
      
      const targetUser = docSnap.data() as User;
      const prefs = targetUser.notificationPrefs || {};
      
      if (prefs[prefKey] !== false) {
        const newNotification: Omit<Notification, 'id'> = {
          ...data,
          isRead: false,
          createdAt: Date.now(),
        };
        queueWrite(`users/${uid}/notifications`, newNotification);
      }
    });
  } catch (error) {
    console.error('Failed to broadcast notification', error);
  }
};
