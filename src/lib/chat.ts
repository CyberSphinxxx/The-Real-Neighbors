import { collection, doc, query, orderBy, onSnapshot, addDoc, updateDoc, limit, where, setDoc, getDoc } from 'firebase/firestore';
import { ref, onValue, set, onDisconnect, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';
import { db, rtdb } from './firebase';
import type { Channel, ChatMessage, DirectMessage } from '../types';

// ========================
// CHANNELS (Firestore)
// ========================

export const subscribeToChannels = (callback: (channels: Channel[]) => void) => {
  const q = query(collection(db, 'channels'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const channels = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Channel[];
    callback(channels);
  });
};

export const createChannel = async (channel: Omit<Channel, 'id' | 'createdAt'>) => {
  return addDoc(collection(db, 'channels'), {
    ...channel,
    createdAt: Date.now()
  });
};

// ========================
// DIRECT MESSAGES (Firestore)
// ========================

export const getDMId = (uid1: string, uid2: string) => {
  return [uid1, uid2].sort().join('_');
};

export const subscribeToDMs = (userId: string, callback: (dms: DirectMessage[]) => void) => {
  const q = query(
    collection(db, 'dms'),
    where('participants', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const dms = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as DirectMessage[];
    callback(dms);
  });
};

export const initializeDM = async (uid1: string, uid2: string) => {
  const dmId = getDMId(uid1, uid2);
  const dmRef = doc(db, 'dms', dmId);
  const dmSnap = await getDoc(dmRef);
  
  if (!dmSnap.exists()) {
    await setDoc(dmRef, {
      participants: [uid1, uid2],
      lastMessage: '',
      lastMessageAt: Date.now(),
      seenBy: {}
    });
  }
  
  return dmId;
};

export const updateDMSeenReceipt = async (dmId: string, userId: string) => {
  const dmRef = doc(db, 'dms', dmId);
  return updateDoc(dmRef, {
    [`seenBy.${userId}`]: Date.now()
  });
};

// ========================
// MESSAGES (Firestore)
// ========================

export const subscribeToMessages = (threadId: string, limitCount: number = 100, callback: (messages: ChatMessage[]) => void, threadType: 'channels' | 'dms' = 'channels') => {
  const collectionPath = threadType === 'channels' ? `channels/${threadId}/messages` : `dms/${threadId}/messages`;
  const q = query(
    collection(db, collectionPath),
    orderBy('createdAt', 'asc'),
    limit(limitCount)
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatMessage[];
    callback(messages);
  });
};

export const sendMessage = async (threadId: string, message: Omit<ChatMessage, 'id' | 'isEdited' | 'isDeleted' | 'reactions' | 'createdAt'>, threadType: 'channels' | 'dms' = 'channels') => {
  const collectionPath = threadType === 'channels' ? `channels/${threadId}/messages` : `dms/${threadId}/messages`;
  const now = Date.now();
  
  const promise = addDoc(collection(db, collectionPath), {
    ...message,
    reactions: {},
    isEdited: false,
    isDeleted: false,
    createdAt: now
  });

  if (threadType === 'dms') {
    const dmRef = doc(db, 'dms', threadId);
    await updateDoc(dmRef, {
      lastMessage: message.type === 'image' ? 'Sent an image' : message.content,
      lastMessageAt: now
    });
  }

  return promise;
};

export const updateMessage = async (threadId: string, messageId: string, updates: Partial<ChatMessage>, threadType: 'channels' | 'dms' = 'channels') => {
  const collectionPath = threadType === 'channels' ? `channels/${threadId}/messages` : `dms/${threadId}/messages`;
  const messageRef = doc(db, collectionPath, messageId);
  return updateDoc(messageRef, {
    ...updates,
    isEdited: true
  });
};

export const deleteMessage = async (threadId: string, messageId: string, threadType: 'channels' | 'dms' = 'channels') => {
  const collectionPath = threadType === 'channels' ? `channels/${threadId}/messages` : `dms/${threadId}/messages`;
  const messageRef = doc(db, collectionPath, messageId);
  return updateDoc(messageRef, {
    content: 'This message was deleted.',
    type: 'system',
    isDeleted: true,
    imageUrl: null,
  });
};

export const addReaction = async (threadId: string, messageId: string, emoji: string, userId: string, currentReactions: Record<string, string[]>, threadType: 'channels' | 'dms' = 'channels') => {
  const collectionPath = threadType === 'channels' ? `channels/${threadId}/messages` : `dms/${threadId}/messages`;
  const messageRef = doc(db, collectionPath, messageId);
  const newReactions = { ...currentReactions };
  
  if (!newReactions[emoji]) {
    newReactions[emoji] = [];
  }
  
  if (newReactions[emoji].includes(userId)) {
    newReactions[emoji] = newReactions[emoji].filter(id => id !== userId);
    if (newReactions[emoji].length === 0) {
      delete newReactions[emoji];
    }
  } else {
    newReactions[emoji].push(userId);
  }
  
  return updateDoc(messageRef, { reactions: newReactions });
};

// ========================
// TYPING INDICATORS (RTDB)
// ========================

export const setTypingStatus = (threadId: string, userId: string, isTyping: boolean) => {
  const typingRef = ref(rtdb, `typing/${threadId}/${userId}`);
  if (isTyping) {
    set(typingRef, {
      isTyping: true,
      updatedAt: rtdbServerTimestamp()
    });
    onDisconnect(typingRef).remove();
  } else {
    set(typingRef, null);
  }
};

export const subscribeToTypingStatus = (threadId: string, callback: (typingUsers: Record<string, any>) => void) => {
  const typingRef = ref(rtdb, `typing/${threadId}`);
  return onValue(typingRef, (snapshot) => {
    const val = snapshot.val();
    callback(val || {});
  });
};
