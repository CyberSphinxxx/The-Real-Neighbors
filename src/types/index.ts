export interface User {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  birthdate?: string;
  accentColor?: string;
  role: 'admin' | 'member';
  joinedAt: string | number | Date;
  showAge?: boolean;
  subreddits?: string[];
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  linkUrl?: string;
  linkMeta?: any;
  vibeTag?: { emoji: string; label: string; color: string };
  bgColor?: string;
  imageUrl?: string;
  reactions: Record<string, string[]>;
  comments: Comment[];
  createdAt: string | number | Date;
  isPinned: boolean;
  editHistory?: { content: string; editedAt: number }[];
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
  type: 'hangout' | 'gaming' | 'trip' | 'online' | string;
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

export interface BirthdayMessage {
  authorId: string;
  content: string;
  createdAt: number;
}

export interface BirthdayMessageBoard {
  id: string;
  year: number;
  messages: BirthdayMessage[];
}


export interface EventNote {
  id: string;
  authorId: string;
  content: string;
  createdAt: number;
}


export interface YoutubeQueueItem {
  id: string;
  url: string;
  videoId: string;
  title: string;
  thumbnailUrl: string;
  addedBy: string;
  createdAt: number;
}

export interface RedditPost {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  selftext?: string;
  url: string;
  is_video: boolean;
  is_reddit_media_domain: boolean;
  thumbnail?: string;
  score: number;
  num_comments: number;
  created_utc: number;
  permalink: string;
}
