// imports removed


const seenPostsSet = new Set<string>();
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export const queueSeenPost = (postId: string, userId: string) => {
  seenPostsSet.add(postId);
  
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  debounceTimer = setTimeout(async () => {
    if (seenPostsSet.size === 0) return;
    
    // Copy and clear the set
    const postIdsToUpdate = Array.from(seenPostsSet);
    seenPostsSet.clear();
    
    try {
      const { writeBatch, doc, arrayUnion } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      
      const batch = writeBatch(db);
      postIdsToUpdate.forEach(id => {
        batch.update(doc(db, 'posts', id), {
          seenBy: arrayUnion(userId)
        });
      });
      
      await batch.commit();
    } catch (err) {
      console.error('Failed to batch update seenBy', err);
    }
  }, 3000); // 3 seconds debounce
};
