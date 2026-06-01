import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Search,
  X,
  SquarePen,
  Users,
  Home
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { useAuthStore } from '../../stores/authStore';
import { useOnlineUsers } from '../../hooks/useOnlineUsers';
import { useTheme } from '../../hooks/useTheme';
import { usePostStore } from '../../stores/postStore';
import { useWatchlistStore } from '../../stores/watchlistStore';
import { useLinksStore } from '../../stores/linksStore';
import { useFeedTabStore } from '../../stores/feedTabStore';
import { getAvatarColor } from '../../utils/avatarColor';
import { formatTimeAgo } from '../../utils/date';
import type { Post, WatchlistEntry, SavedLink } from '../../types';

// ─── Search Result Types ─────────────────────────────────────────────────────

interface SearchResults {
  posts: Post[];
  watchlist: WatchlistEntry[];
  links: SavedLink[];
}

// ─── Debounce hook ─────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Header component ────────────────────────────────────────────────────────

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { onlineUsers } = useOnlineUsers();
  const { nextThemeLabel, themeIcon: ThemeIcon, cycleTheme } = useTheme();
  const { posts } = usePostStore();
  const { entries: watchlistEntries } = useWatchlistStore();
  const { links } = useLinksStore();
  const { activeTab, setActiveTab } = useFeedTabStore();

  const isFeedPage = location.pathname === '/' || location.pathname === '/feed';

  // ─── Search state ──────────────────────────────────────────────────────────
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(searchQuery, 300);

  // ─── Mobile search expanded (takes full width) ────────────────────────────
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ─── Expand / collapse search ─────────────────────────────────────────────
  const expandSearch = () => {
    setSearchExpanded(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const collapseSearch = useCallback(() => {
    setSearchExpanded(false);
    setSearchQuery('');
    setShowDropdown(false);
  }, []);

  // Escape key collapses search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchExpanded) collapseSearch();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [searchExpanded, collapseSearch]);

  // Click outside closes dropdown + collapses
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        collapseSearch();
      }
    };
    if (searchExpanded) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [searchExpanded, collapseSearch]);

  // Show dropdown when query is present
  useEffect(() => {
    if (debouncedQuery.trim().length > 0) setShowDropdown(true);
    else setShowDropdown(false);
  }, [debouncedQuery]);

  // ─── Search results ────────────────────────────────────────────────────────
  const searchResults = useMemo<SearchResults>(() => {
    const q = debouncedQuery.toLowerCase().trim();
    if (!q) return { posts: [], watchlist: [], links: [] };

    const matchedPosts = posts
      .filter((p) => p.content?.toLowerCase().includes(q))
      .slice(0, 3);

    const matchedWatchlist = watchlistEntries
      .filter((e) => e.title?.toLowerCase().includes(q))
      .slice(0, 3);

    const matchedLinks = links
      .filter(
        (l) =>
          l.title?.toLowerCase().includes(q) ||
          l.tags?.some((t) => t.toLowerCase().includes(q))
      )
      .slice(0, 3);

    return { posts: matchedPosts, watchlist: matchedWatchlist, links: matchedLinks };
  }, [debouncedQuery, posts, watchlistEntries, links]);

  const hasResults =
    searchResults.posts.length > 0 ||
    searchResults.watchlist.length > 0 ||
    searchResults.links.length > 0;

  const storesEmpty =
    posts.length === 0 && watchlistEntries.length === 0 && links.length === 0;

  // ─── Handle tab switching ──────────────────────────────────────────────────
  const handleTabClick = (tab: 'our_feed' | 'explore') => {
    setActiveTab(tab);
    if (!isFeedPage) navigate('/');
  };

  // ─── Quick post ────────────────────────────────────────────────────────────
  const handleQuickPost = () => {
    if (isFeedPage) {
      window.dispatchEvent(new CustomEvent('focusComposer'));
    } else {
      navigate('/', { state: { openComposer: true } });
    }
  };

  // ─── Avatar ────────────────────────────────────────────────────────────────
  const avatarBg = user?.accentColor || getAvatarColor(user?.displayName ?? '');

  // ─── Result click handlers ────────────────────────────────────────────────
  const handlePostResultClick = (post: Post) => {
    collapseSearch();
    navigate('/');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openPostModal', { detail: post.id }));
    }, 100);
  };

  const handleWatchlistResultClick = () => {
    collapseSearch();
    navigate('/watchlist');
  };

  const handleLinkResultClick = (url: string) => {
    collapseSearch();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!user) return null;

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '48px',
        zIndex: 60,
        background: 'color-mix(in srgb, var(--color-bg-surface) 95%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border-subtle)',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '12px',
        paddingRight: '12px',
      }}
    >
      {/* Mobile: if search is expanded, show full-width search input only */}
      {isMobile && searchExpanded ? (
        <div
          ref={searchContainerRef}
          style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            style={{
              flex: 1,
              height: '32px',
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: '9999px',
              padding: '0 36px 0 12px',
              fontSize: '14px',
              color: 'var(--color-text-main)',
              outline: 'none',
            }}
          />
          <button
            onClick={collapseSearch}
            style={{
              position: 'absolute',
              right: '48px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={14} />
          </button>
          {/* Search dropdown */}
          {showDropdown && (
            <SearchDropdown
              query={debouncedQuery}
              results={searchResults}
              hasResults={hasResults}
              storesEmpty={storesEmpty}
              onPostClick={handlePostResultClick}
              onWatchlistClick={handleWatchlistResultClick}
              onLinkClick={handleLinkResultClick}
            />
          )}
        </div>
      ) : (
        <>
          {/* ── LEFT ZONE ─────────────────────────────────────────────────── */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, zIndex: 1 }}
            ref={!isMobile ? searchContainerRef : undefined}
          >
            {/* Logo */}
            <Link
              to="/feed"
              title="Home"
              className="flex items-center gap-1.5 shrink-0 transition-opacity hover:opacity-80"
              style={{ textDecoration: 'none' }}
            >
              <Home className="text-primary w-[18px] h-[18px]" strokeWidth={2} style={{ color: 'var(--color-primary)' }} />
              {!searchExpanded && (
                <span className="hidden md:inline font-heading font-bold text-sm text-main">
                  Neighbors
                </span>
              )}
            </Link>

            {/* Search */}
            {!searchExpanded ? (
              <button
                onClick={expandSearch}
                title="Search"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-muted)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 150ms, color 150ms',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-elevated)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-main)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'none';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)';
                }}
              >
                <Search size={18} />
              </button>
            ) : (
              // Desktop: inline expanded search
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  style={{
                    width: '220px',
                    height: '32px',
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '9999px',
                    padding: '0 32px 0 12px',
                    fontSize: '14px',
                    color: 'var(--color-text-main)',
                    outline: 'none',
                    transition: 'width 200ms ease-out',
                  }}
                />
                <button
                  onClick={collapseSearch}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={14} />
                </button>
                {/* Search dropdown */}
                {showDropdown && (
                  <SearchDropdown
                    query={debouncedQuery}
                    results={searchResults}
                    hasResults={hasResults}
                    storesEmpty={storesEmpty}
                    onPostClick={handlePostResultClick}
                    onWatchlistClick={handleWatchlistResultClick}
                    onLinkClick={handleLinkResultClick}
                  />
                )}
              </div>
            )}
          </div>

          {/* ── CENTER ZONE (absolute) ────────────────────────────────────── */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              height: '48px',
              bottom: 0,
            }}
          >
            {/* Mobile Title */}
            <div className="flex md:hidden items-center h-full">
              <span className="font-heading font-bold text-[17px] text-main">
                {isFeedPage ? (activeTab === 'our_feed' ? 'Our Feed' : 'Explore') : 
                 location.pathname === '/watchlist' ? 'Watchlist' :
                 location.pathname.startsWith('/events') ? 'Events' :
                 location.pathname === '/birthdays' ? 'Birthdays' :
                 location.pathname === '/links' ? 'Links' :
                 location.pathname === '/profile' ? 'Profile' : 'Neighbors'}
              </span>
            </div>

            {/* Desktop Tabs */}
            <div className="hidden md:flex items-center h-full">
            <button
              onClick={() => handleTabClick('our_feed')}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                height: '100%',
                fontSize: '14px',
                fontWeight: activeTab === 'our_feed' ? 600 : 500,
                color:
                  activeTab === 'our_feed'
                    ? 'var(--color-text-main)'
                    : 'var(--color-text-muted)',

                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'our_feed'
                  ? '2px solid var(--color-primary)'
                  : '2px solid transparent',
                cursor: 'pointer',
                transition: 'color 150ms, border-color 150ms',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'our_feed')
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-main)';
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'our_feed')
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)';
              }}
            >
              Our Feed
            </button>
            <button
              onClick={() => handleTabClick('explore')}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                height: '100%',
                fontSize: '14px',
                fontWeight: activeTab === 'explore' ? 600 : 500,
                color:
                  activeTab === 'explore'
                    ? 'var(--color-text-main)'
                    : 'var(--color-text-muted)',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'explore'
                  ? '2px solid var(--color-primary)'
                  : '2px solid transparent',
                cursor: 'pointer',
                transition: 'color 150ms, border-color 150ms',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'explore')
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-main)';
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'explore')
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)';
              }}
            >
              Explore
            </button>
            </div>
          </div>

          {/* ── RIGHT ZONE ────────────────────────────────────────────────── */}
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
              zIndex: 1,
            }}
          >
            {/* Online count pill — hidden on mobile */}
            <div
              className="hidden-mobile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: '9999px',
                padding: '2px 8px',
                fontSize: '12px',
                color: 'var(--color-text-muted)',
                cursor: 'default',
                userSelect: 'none',
                marginRight: '2px',
              }}
              title="Members online"
            >
              <Users size={14} />
              <span className="font-medium">
                {onlineUsers.length} <span className="hidden lg:inline">online</span>
              </span>
            </div>

            {/* Quick post button */}
            <HeaderIconButton
              onClick={handleQuickPost}
              title="New post"
              icon={<SquarePen size={18} />}
            />

            {/* Theme toggle */}
            <div className="hidden md:block">
              <HeaderIconButton
                onClick={cycleTheme}
                title={nextThemeLabel}
                icon={<ThemeIcon size={18} />}
              />
            </div>

            {/* Notification bell */}
            <NotificationBell />

            {/* User avatar */}
            <button
              onClick={() => navigate('/profile')}
              title="View profile"
              style={{
                position: 'relative',
                width: '32px',
                height: '32px',
                borderRadius: '9999px',
                background: avatarBg,
                border: '2px solid var(--color-border)',
                overflow: 'visible',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'border-color 150ms',
                flexShrink: 0,
                padding: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-primary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
              }}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '9999px',
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span
                  style={{
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '13px',
                    lineHeight: 1,
                    textTransform: 'uppercase',
                    pointerEvents: 'none',
                  }}
                >
                  {user.displayName?.charAt(0) ?? '?'}
                </span>
              )}
              {/* Green online dot */}
              <span
                style={{
                  position: 'absolute',
                  bottom: '-1px',
                  right: '-1px',
                  width: '8px',
                  height: '8px',
                  background: 'var(--color-success)',
                  borderRadius: '9999px',
                  border: '2px solid var(--color-bg-surface)',
                  pointerEvents: 'none',
                }}
              />
            </button>
          </div>
        </>
      )}

      {/* Global CSS for mobile-hidden and border-border-subtle alias */}
      <style>{`
        @media (max-width: 767px) {
          .hidden-mobile { display: none !important; }
        }
      `}</style>
    </header>
  );
};

// ─── Icon button sub-component ────────────────────────────────────────────────

const HeaderIconButton: React.FC<{
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
}> = ({ onClick, title, icon }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      width: '32px',
      height: '32px',
      borderRadius: '6px',
      padding: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--color-text-muted)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      transition: 'background 150ms, color 150ms',
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-elevated)';
      (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-main)';
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLButtonElement).style.background = 'none';
      (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)';
    }}
  >
    {icon}
  </button>
);

// ─── Search dropdown sub-component ────────────────────────────────────────────

const SearchDropdown: React.FC<{
  query: string;
  results: SearchResults;
  hasResults: boolean;
  storesEmpty: boolean;
  onPostClick: (post: Post) => void;
  onWatchlistClick: () => void;
  onLinkClick: (url: string) => void;
}> = ({ query, results, hasResults, storesEmpty, onPostClick, onWatchlistClick, onLinkClick }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: 0,
        width: '320px',
        maxHeight: '400px',
        overflowY: 'auto',
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 50,
      }}
      className="custom-scrollbar"
    >
      {storesEmpty ? (
        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
          Start browsing to enable search
        </div>
      ) : !hasResults ? (
        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
          No results for "{query}"
        </div>
      ) : (
        <div style={{ padding: '4px' }}>
          {/* Posts */}
          {results.posts.length > 0 && (
            <div>
              <div style={{
                padding: '8px 12px 4px',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--color-text-faint)',
              }}>
                📝 Posts
              </div>
              {results.posts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => onPostClick(post)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 100ms',
                    fontSize: '13px',
                    color: 'var(--color-text-main)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-elevated)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'none';
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '9999px',
                      background: getAvatarColor(post.authorId),
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {post.content?.slice(0, 60)}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-faint)', flexShrink: 0 }}>
                    {formatTimeAgo(
                      typeof post.createdAt === 'number'
                        ? post.createdAt
                        : new Date(post.createdAt as any).getTime()
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Watchlist */}
          {results.watchlist.length > 0 && (
            <div>
              <div style={{
                padding: '8px 12px 4px',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--color-text-faint)',
              }}>
                📺 Watchlist
              </div>
              {results.watchlist.map((entry) => (
                <button
                  key={entry.id}
                  onClick={onWatchlistClick}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 100ms',
                    fontSize: '13px',
                    color: 'var(--color-text-main)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-elevated)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'none';
                  }}
                >
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.title}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border-subtle)',
                    color: 'var(--color-text-muted)',
                    flexShrink: 0,
                  }}>
                    {entry.status}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Links */}
          {results.links.length > 0 && (
            <div>
              <div style={{
                padding: '8px 12px 4px',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--color-text-faint)',
              }}>
                🔗 Links
              </div>
              {results.links.map((link) => (
                <button
                  key={link.id}
                  onClick={() => onLinkClick(link.url)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 100ms',
                    fontSize: '13px',
                    color: 'var(--color-text-main)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-elevated)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'none';
                  }}
                >
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=16`}
                    alt=""
                    width={16}
                    height={16}
                    style={{ borderRadius: '2px', flexShrink: 0 }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {link.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
