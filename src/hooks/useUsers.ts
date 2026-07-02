import { useState, useEffect } from 'react';
import { subscribeToCollection } from '../lib/firestore';
import type { User } from '../types';

let cachedUsers: User[] = [];
const listeners = new Set<() => void>();
let isSubscribed = false;

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>(cachedUsers);

  useEffect(() => {
    const updateLocalState = () => {
      setUsers([...cachedUsers]);
    };

    listeners.add(updateLocalState);
    updateLocalState();

    if (!isSubscribed) {
      isSubscribed = true;

      subscribeToCollection<User>('users', (data) => {
        cachedUsers = data;
        listeners.forEach(l => l());
      });
    }

    return () => {
      listeners.delete(updateLocalState);
    };
  }, []);

  return { users };
};
