import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { getDoc } from '../lib/firestore';
import type { User, Event } from '../types';

export const useStartupNotifications = () => {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    
    const checkBirthdaysSafe = async () => {
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      const usersSnap = await getDocs(collection(db, 'users'));
      
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      
      usersSnap.forEach(doc => {
        const u = doc.data() as User;
        if (u.id === user.id || !u.birthdate) return; // Don't notify yourself of your own birthday
        const [, monthStr, dayStr] = u.birthdate.split('-');
        if (parseInt(monthStr, 10) === month && parseInt(dayStr, 10) === day) {
          const key = `birthday_self_${u.id}_${today.getFullYear()}`;
          if (!localStorage.getItem(key)) {
            localStorage.setItem(key, 'true');
            import('../lib/notifications').then(({ writeNotification }) => {
              writeNotification(user.id, {
                type: 'birthday',
                fromUid: 'system',
                fromName: 'System',
                fromAvatarColor: 'var(--color-bg-elevated)',
                message: `It's ${u.displayName}'s birthday today! 🎂`,
              }, 'birthdays');
            });
          }
        }
      });
    };

    const checkEvents = async () => {
      const { collection, getDocs, query, where } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const startT = tomorrow.getTime();
      const endT = startT + 24 * 60 * 60 * 1000;
      
      const q = query(
        collection(db, 'events'),
        where('date', '>=', startT),
        where('date', '<', endT)
      );
      
      const snap = await getDocs(q);
      snap.forEach(doc => {
        const event = { id: doc.id, ...doc.data() } as Event;
        if (event.rsvps && event.rsvps[user.id] === 'going') {
          const key = `event_reminder_${event.id}`;
          if (!localStorage.getItem(key)) {
            localStorage.setItem(key, 'true');
            import('../lib/notifications').then(({ writeNotification }) => {
              writeNotification(user.id, {
                type: 'event_reminder',
                fromUid: 'system',
                fromName: 'System',
                fromAvatarColor: 'var(--color-bg-elevated)',
                message: `Reminder: ${event.title} is tomorrow!`,
              }, 'event_reminders');
            });
          }
        }
      });
    };
    
    const checkStreakSafe = async () => {
      const groupStats = await getDoc<any>('groupStats', ['streak']);
      if (groupStats && groupStats.currentStreak > 1 && groupStats.lastPostDate) {
        const last = new Date(groupStats.lastPostDate);
        const today = new Date();
        const isYesterday = last.getDate() === today.getDate() - 1 && last.getMonth() === today.getMonth();
        
        if (isYesterday) {
          const key = `streak_risk_self_${today.getFullYear()}_${today.getMonth()}_${today.getDate()}`;
          if (!localStorage.getItem(key)) {
            localStorage.setItem(key, 'true');
            import('../lib/notifications').then(({ writeNotification }) => {
              writeNotification(user.id, {
                type: 'streak_risk',
                fromUid: 'system',
                fromName: 'System',
                fromAvatarColor: 'var(--color-bg-elevated)',
                message: `Group streak (${groupStats.currentStreak} 🔥) is at risk! Post to save it!`,
              }, 'streak');
            });
          }
        }
      }
    };

    checkBirthdaysSafe();
    checkEvents();
    checkStreakSafe();

  }, [user]);
};
