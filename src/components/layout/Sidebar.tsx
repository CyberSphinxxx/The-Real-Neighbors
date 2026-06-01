import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Tv, Calendar, Cake, Link as LinkIcon, ChevronRight, Settings } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getAvatarColor } from '../../utils/avatarColor';
import { useOnlineUsers } from '../../hooks/useOnlineUsers';
import { subscribeToCollection } from '../../lib/firestore';
import type { Event, WatchlistEntry, SavedLink, User } from '../../types';

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const { onlineUsers } = useOnlineUsers();
  const location = useLocation();
  
  const isOnline = user ? onlineUsers.some(u => u.uid === user.id) : false;

  const [lastVisited, setLastVisited] = useState<Record<string, string>>({});
  const [latestDates, setLatestDates] = useState<Record<string, string>>({});
  const [hasUpcomingBirthdays, setHasUpcomingBirthdays] = useState(false);

  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(`lastVisited_${user.id}`);
    if (stored) {
      setLastVisited(JSON.parse(stored));
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const path = location.pathname.substring(1);
    if (['events', 'birthdays', 'watchlist', 'links', 'settings'].includes(path)) {
      setLastVisited(prev => {
        const next = { ...prev, [path]: new Date().toISOString() };
        localStorage.setItem(`lastVisited_${user.id}`, JSON.stringify(next));
        return next;
      });
    }
  }, [location, user]);

  useEffect(() => {
    if (!user) return;

    const unsubEvents = subscribeToCollection<Event>('events', (data) => {
      if (data.length > 0) {
        const latest = Math.max(...data.map(d => new Date(d.createdAt).getTime()));
        setLatestDates(prev => ({ ...prev, events: new Date(latest).toISOString() }));
      }
    });

    const unsubWatchlist = subscribeToCollection<WatchlistEntry>('watchlists', (data) => {
      const othersData = data.filter(d => d.userId !== user.id);
      if (othersData.length > 0) {
        const latest = Math.max(...othersData.map(d => new Date(d.createdAt).getTime()));
        setLatestDates(prev => ({ ...prev, watchlist: new Date(latest).toISOString() }));
      }
    });

    const unsubLinks = subscribeToCollection<SavedLink>('links', (data) => {
      if (data.length > 0) {
        const latest = Math.max(...data.map(d => new Date(d.createdAt).getTime()));
        setLatestDates(prev => ({ ...prev, links: new Date(latest).toISOString() }));
      }
    });

    const unsubUsers = subscribeToCollection<User>('users', (data) => {
      const today = new Date();
      today.setHours(0,0,0,0);
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      const hasUpcoming = data.some(u => {
        if (!u.birthdate) return false;
        const [_, month, day] = u.birthdate.split('-');
        const bdayThisYear = new Date(today.getFullYear(), parseInt(month)-1, parseInt(day));
        if (bdayThisYear < today) bdayThisYear.setFullYear(today.getFullYear() + 1);
        return bdayThisYear >= today && bdayThisYear <= nextWeek;
      });
      setHasUpcomingBirthdays(hasUpcoming);
    });

    return () => {
      unsubEvents();
      unsubWatchlist();
      unsubLinks();
      unsubUsers();
    };
  }, [user]);

  const navItems = [
    { name: 'Feed', path: '/', id: 'feed', icon: Home },
    { name: 'Watchlist', path: '/watchlist', id: 'watchlist', icon: Tv },
    { name: 'Events', path: '/events', id: 'events', icon: Calendar },
    { name: 'Birthdays', path: '/birthdays', id: 'birthdays', icon: Cake },
    { name: 'Links', path: '/links', id: 'links', icon: LinkIcon },
    { name: 'Settings', path: '/settings', id: 'settings', icon: Settings },
  ];

  const hasUnread = (id: string) => {
    if (id === 'birthdays') {
      const visited = lastVisited[id];
      // If they haven't visited since we detected an upcoming bday, show dot.
      // Wait, birthdays last 7 days. Better: if hasUpcomingBirthdays and (visited is null or visited is older than 1 day)
      // Actually the prompt says: "show a dot if any user has a birthday within the next 7 days" and "Dot disappears immediately on navigating".
      // If hasUpcomingBirthdays is true, and they haven't visited since we calculated it? 
      // Let's just say: if hasUpcomingBirthdays and (!visited or visited was before today)
      if (!hasUpcomingBirthdays) return false;
      if (!visited) return true;
      const today = new Date();
      today.setHours(0,0,0,0);
      return new Date(visited) < today;
    }
    
    if (!latestDates[id]) return false;
    if (!lastVisited[id]) return true;
    return latestDates[id] > lastVisited[id];
  };

  return (
    <div className="flex flex-col h-full justify-between py-6 px-4">
      {/* App name */}
      {/* Nav items */}
      <div className="pt-4">
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 w-full transition-all duration-150 py-2.5 pr-3 pl-4 ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold rounded-r-lg'
                    : 'text-muted font-normal hover:bg-elevated hover:text-main rounded-lg'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1" 
                      style={{ 
                        background: 'var(--color-primary)',
                        borderRadius: '0 2px 2px 0' 
                      }} 
                    />
                  )}
                  <div className="relative flex-shrink-0 flex items-center justify-center">
                    <item.icon 
                      className={`w-[18px] h-[18px] transition-colors ${
                        isActive 
                          ? 'text-primary' 
                          : 'text-muted group-hover:text-main'
                      }`} 
                      strokeWidth={isActive ? 2 : 1.8} 
                    />
                    {!isActive && hasUnread(item.id) && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border-2 border-surface" />
                    )}
                  </div>
                  <span className="text-sm">{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User card at bottom */}
      {user && (
        <div className="mt-auto pt-3 border-t border-border-subtle">
          <NavLink
            to="/profile"
            className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-elevated transition-colors w-full"
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white overflow-hidden"
                style={{
                  background: user.avatarUrl
                    ? undefined
                    : getAvatarColor(user.displayName),
                }}
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  user.displayName.charAt(0).toUpperCase()
                )}
              </div>
              {isOnline && (
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full animate-pulse z-10"
                  style={{
                    background: 'var(--color-success)',
                    border: '2px solid var(--color-bg-surface)',
                  }}
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-main line-clamp-1">
                {user.displayName}
              </p>
              <p className="text-xs text-faint line-clamp-1">
                {user.role === 'admin' ? 'Admin' : 'Member'}
              </p>
            </div>
            
            <ChevronRight size={14} className="text-faint group-hover:text-main transition-colors flex-shrink-0" />
          </NavLink>
        </div>
      )}
    </div>
  );
};
