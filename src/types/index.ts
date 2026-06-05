export interface User {
  id: string;
  handle?: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bio?: string;
  statusMessage?: string;
  customTitle?: string;
  gamerTags?: {
    riot?: string;
    facebook?: string;
    steam?: string;
  };
  customLink?: {
    name: string;
    url: string;
  };
  topMovies?: {
    tmdbId: string;
    title: string;
    posterUrl: string;
  }[];
  themeSongUrl?: string;
  lore?: string;
  badges?: string[];
  birthdate?: string;
  accentColor?: string;
  role: 'admin' | 'member';
  joinedAt: string | number | Date;
  showAge?: boolean;
  subreddits?: string[];
  savedPosts?: string[];
  notificationPrefs?: Record<string, boolean>;
  feedPrefs?: {
    defaultSort?: 'latest' | 'reacted';
    defaultFilter?: 'all' | 'videos' | 'images' | 'colored' | 'links';
    autoLoad?: boolean;
    showSeenBy?: boolean;
    showReactionTooltips?: boolean;
    compactCards?: boolean;
  };
  privacyPrefs?: {
    showOnlineStatus?: boolean;
    showLastSeen?: boolean;
    showBirthday?: boolean;
    showBirthYear?: boolean;
    showReactions?: boolean;
    showSeenBy?: boolean;
  };
  postCount?: number;
  commentCount?: number;
  reactionCount?: number;
  lastLoginDate?: string;
  loginStreak?: number;
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
  expiresAt?: number;
  editedAt?: number;
  isEdited?: boolean;
  seenBy?: string[];
  mentions?: string[];
  sharedPostId?: string;
  sharedRedditPost?: RedditPost;
  botbotCommented?: number[];
}

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  createdAt: string | number | Date;
  parentId?: string;
  likes?: string[];
}

export interface Reaction {
  emoji: string;
  label: string;
}

export interface WatchlistEntry {
  id: string;
  userId: string;
  title: string;
  type: 'movie' | 'tv' | 'anime';
  status: 'watching' | 'finished' | 'planned';
  rating?: number;
  recommendedBy?: string;
  recommendedByName?: string;
  tmdbId?: number;
  malId?: number;
  coverUrl?: string;
  backdropUrl?: string;
  overview?: string;
  year?: string;
  episodes?: number;
  genres?: string[];
  externalScore?: number;
  createdAt: string | number | Date;
}

export interface WatchlistReview {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarColor: string;
  rating?: number;
  comment: string;
  createdAt: number;
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

export interface Poll {
  id: string;
  question: string;
  options: { id: string; label: string }[];
  votes: Record<string, string>; // uid -> optionId
  createdBy: string;
  expiresAt: number;
  isActive: boolean;
  createdAt: number;
}

export interface Notification {
  id: string;
  type: 'post' | 'reaction' | 'comment' | 'mention' | 'event' | 'birthday' | 'poll' | 'streak_risk' | 'expiry' | 'event_reminder';
  fromUid: string;
  fromName: string;
  fromAvatarColor: string;
  postId?: string;
  message: string;
  preview?: string;
  isRead: boolean;
  createdAt: number;
}

export interface SpotifyMeta {
  title: string;
  thumbnailUrl: string;
  providerName: string;
}

export interface Playlist {
  id: string;
  spotifyId: string;
  spotifyUrl: string;
  title: string;
  thumbnailUrl: string;
  addedBy: string;
  addedByName: string;
  addedByAvatarColor: string;
  addedAt: number;
  vibeTag?: { emoji: string; label: string; color: string };
  ratings: Record<string, number>;
  reactions: Record<string, string[]>;
  nowVibing: string[];
  description?: string;
}

export interface Channel {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: 'General' | 'Interests' | 'Utility' | string;
  isDefault: boolean;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatarColor: string;
  type: 'text' | 'image' | 'system';
  imageUrl?: string;
  replyTo?: {
    messageId: string;
    authorName: string;
    contentPreview: string;
  };
  reactions: Record<string, string[]>;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: number;
}

export interface DirectMessage {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: number;
  seenBy: Record<string, number>;
}
