import { type PresenceUser } from '../hooks/useOnlineUsers';

export function getMembersByUids(uids: string[], onlineUsers: PresenceUser[], offlineUsers: PresenceUser[]): PresenceUser[] {
  if (!uids || uids.length === 0) return [];
  const allUsers = [...onlineUsers, ...offlineUsers];
  
  const members: PresenceUser[] = [];
  uids.forEach(uid => {
    const found = allUsers.find(u => u.uid === uid);
    if (found) members.push(found);
  });
  
  return members;
}

export function getTotalReactions(reactions: Record<string, string[]> | undefined): number {
  if (!reactions) return 0;
  return Object.values(reactions).reduce((acc, curr) => acc + curr.length, 0);
}

export function getReactionsByEmoji(reactions: Record<string, string[]> | undefined): { emoji: string, uids: string[], count: number }[] {
  if (!reactions) return [];
  
  return Object.entries(reactions)
    .filter(([_, uids]) => uids.length > 0)
    .map(([emoji, uids]) => ({
      emoji,
      uids,
      count: uids.length
    }))
    .sort((a, b) => b.count - a.count);
}
