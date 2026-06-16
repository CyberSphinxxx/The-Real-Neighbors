const seenPostsMap = new Map<string, string>(); // postId -> userId
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export const queueSeenPost = (postId: string, userId: string) => {
  seenPostsMap.set(postId, userId);

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(async () => {
    if (seenPostsMap.size === 0) return;

    // Copy and clear the map
    const entriesToUpdate = Array.from(seenPostsMap.entries());
    seenPostsMap.clear();

    try {
      const { writeBatch, doc, arrayUnion } = await import('firebase/firestore');
      const { db } = await import('./firebase');

      const batch = writeBatch(db);
      entriesToUpdate.forEach(([postId, uid]) => {
        batch.update(doc(db, 'posts', postId), {
          seenBy: arrayUnion(uid)
        });
      });

      await batch.commit();
    } catch (err) {
      console.error('Failed to batch update seenBy', err);
    }
  }, 3000); // 3 seconds debounce
};
