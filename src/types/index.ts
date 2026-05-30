export interface User {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  birthdate?: string;
  accentColor?: string;
  role: 'admin' | 'member';
  joinedAt: string | number | Date;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  linkUrl?: string;
  linkMeta?: any;
  reactions: Record<string, string[]>;
  comments: Comment[];
  createdAt: string | number | Date;
  isPinned: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  createdAt: string | number | Date;
}

export interface Reaction {
  emoji: string;
  label: string;
}

export interface WatchlistEntry {
  id: string;
  userId: string;
  title: string;
  status: 'watching' | 'finished' | 'planned';
  rating?: number;
  recommendedBy?: string;
  tmdbId?: string;
  coverUrl?: string;
  createdAt: string | number | Date;
}

export interface BirthdayEntry {
  userId: string;
  displayName: string;
  birthdate: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string | number | Date;
  type: 'hangout' | 'gaming' | 'trip' | 'online';
  rsvps: Record<string, 'going' | 'maybe' | 'cant'>;
  createdBy: string;
  notes?: string;
  createdAt: string | number | Date;
}

export interface SavedLink {
  id: string;
  url: string;
  title: string;
  description?: string;
  tags: string[];
  savedBy: string;
  votes: string[];
  createdAt: string | number | Date;
}
