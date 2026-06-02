import { useState, useEffect } from 'react';
import { subscribeToCollection } from '../lib/firestore';
import type { Playlist } from '../types';

export function useNowVibing() {
  const [vibingMap, setVibingMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const unsubscribe = subscribeToCollection<Playlist>('playlists', (playlists) => {
      const newMap = new Map<string, string>();
      playlists.forEach(playlist => {
        if (playlist.nowVibing && Array.isArray(playlist.nowVibing)) {
          playlist.nowVibing.forEach(uid => {
            newMap.set(uid, playlist.title);
          });
        }
      });
      setVibingMap(newMap);
    });

    return () => unsubscribe();
  }, []);

  return vibingMap;
}
