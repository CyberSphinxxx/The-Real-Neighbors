import { getDoc, addDoc } from './firestore';
import type { User, Notification } from '../types';
import { useAuthStore } from '../stores/authStore';

export const writeNotification = async (
  targetUid: string,
  data: Omit<Notification, 'id' | 'isRead' | 'createdAt'>,
  prefKey?: string
) => {
  const currentUser = useAuthStore.getState().user;
  
  // Never write a notification to yourself (unless explicitly allowed, e.g., reminders)
  // We'll let the caller handle self-notification logic, but block it here if prefKey is standard
  const isSelfNotification = targetUid === currentUser?.id;
  if (isSelfNotification && !['expiry', 'event_reminder'].includes(data.type)) {
    return;
  }

  try {
    // Check target user's notification preferences
    const targetUser = await getDoc<User>('users', [targetUid]);
    if (targetUser && prefKey) {
      const prefs = targetUser.notificationPrefs || {};
      // If the pref is explicitly false, don't send
      if (prefs[prefKey] === false) {
        return;
      }
    }

    const newNotification: Omit<Notification, 'id'> = {
      ...data,
      isRead: false,
      createdAt: Date.now(),
    };

    await addDoc<Omit<Notification, 'id'>>(`users/${targetUid}/notifications`, newNotification);
  } catch (error) {
    console.error('Failed to write notification', error);
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
    
    const promises: Promise<any>[] = [];
    usersSnap.forEach(doc => {
      const uid = doc.id;
      if (uid === excludeUid) return;
      
      const targetUser = doc.data() as User;
      const prefs = targetUser.notificationPrefs || {};
      
      if (prefs[prefKey] !== false) {
        const newNotification: Omit<Notification, 'id'> = {
          ...data,
          isRead: false,
          createdAt: Date.now(),
        };
        promises.push(addDoc<Omit<Notification, 'id'>>(`users/${uid}/notifications`, newNotification));
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('Failed to broadcast notification', error);
  }
};
