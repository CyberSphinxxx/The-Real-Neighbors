import { useCallback } from 'react';
import { collection, query, orderBy, limit, getDocs, doc, getDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useOnlineUsers } from './useOnlineUsers';

export interface BotbotContextData {
  members: { name: string; role: string }[];
  recentPosts: { authorName: string; content: string; createdAt: string }[];
  upcomingEvents: { title: string; date: string; type: string }[];
  activePoll: { question: string; options: string[] } | null;
  currentStreak: number;
  onlineMembers: string[];
}

let cachedContext: Omit<BotbotContextData, 'onlineMembers'> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useBotbotContext() {
  const { onlineUsers } = useOnlineUsers();

  const fetchContext = useCallback(async (): Promise<BotbotContextData> => {
    const now = Date.now();
    const currentOnline = onlineUsers.map(u => u.displayName);

    if (cachedContext && (now - cacheTimestamp < CACHE_TTL)) {
      return { ...cachedContext, onlineMembers: currentOnline };
    }

    try {
      // 1. Fetch users (members)
      const usersSnap = await getDocs(collection(db, 'users'));
      const members = usersSnap.docs.map(d => ({
        name: d.data().displayName || d.data().handle || 'Unknown',
        role: d.data().role || 'member'
      }));

      // 2. Fetch recent posts
      const postsQ = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(10));
      const postsSnap = await getDocs(postsQ);
      const recentPosts = postsSnap.docs.map(d => ({
        authorName: d.data().authorName || 'Unknown',
        content: d.data().content || '',
        createdAt: d.data().createdAt || new Date().toISOString()
      }));

      // 3. Fetch upcoming events
      const nowIso = new Date().toISOString();
      const eventsQ = query(collection(db, 'events'), where('date', '>=', nowIso), orderBy('date', 'asc'), limit(3));
      const eventsSnap = await getDocs(eventsQ);
      const upcomingEvents = eventsSnap.docs.map(d => ({
        title: d.data().title || 'Event',
        date: d.data().date || '',
        type: d.data().type || 'general'
      }));

      // 4. Fetch active poll (assume latest one if isActive not present)
      const pollsQ = query(collection(db, 'polls'), orderBy('createdAt', 'desc'), limit(1));
      const pollsSnap = await getDocs(pollsQ);
      let activePoll = null;
      if (!pollsSnap.empty) {
        const pData = pollsSnap.docs[0].data();
        activePoll = {
          question: pData.question || pData.title || 'Poll',
          options: pData.options ? pData.options.map((o: any) => typeof o === 'string' ? o : o.text || 'Option') : []
        };
      }

      // 5. Fetch current streak
      const streakDoc = await getDoc(doc(db, 'groupStats', 'streak'));
      const currentStreak = streakDoc.exists() ? (streakDoc.data().currentStreak || 0) : 0;

      cachedContext = {
        members,
        recentPosts,
        upcomingEvents,
        activePoll,
        currentStreak
      };
      cacheTimestamp = now;

      return { ...cachedContext, onlineMembers: currentOnline };
    } catch (err) {
      console.error("Failed to fetch Botbot context", err);
      // Fallback
      return {
        members: [],
        recentPosts: [],
        upcomingEvents: [],
        activePoll: null,
        currentStreak: 0,
        onlineMembers: currentOnline
      };
    }
  }, [onlineUsers]);

  return { fetchContext };
}
