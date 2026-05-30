import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Tv, Calendar, Cake, Link as LinkIcon, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getAvatarColor } from '../../utils/avatarColor';

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const navItems = [
    { name: 'Feed', path: '/', icon: Home },
    { name: 'Watchlist', path: '/watchlist', icon: Tv },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Birthdays', path: '/birthdays', icon: Cake },
    { name: 'Links', path: '/links', icon: LinkIcon },
  ];

  return (
    <div className="flex flex-col h-full justify-between py-6 px-4">
      {/* App name */}
      <div>
        <div className="mb-8 px-2">
          <h1
            className="font-heading font-bold text-primary"
            style={{ fontSize: '1.4rem', letterSpacing: '-0.02em' }}
          >
            The Real Neighbors
          </h1>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `group flex items-center gap-4 px-2 py-2.5 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-muted hover:text-main'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon 
                    className={`w-6 h-6 flex-shrink-0 transition-transform duration-300 ${
                      isActive 
                        ? 'scale-110 drop-shadow-[0_2px_4px_rgba(var(--color-primary-rgb),0.3)]' 
                        : 'group-hover:scale-110 group-hover:text-primary/70'
                    }`} 
                    strokeWidth={isActive ? 2.5 : 2} 
                  />
                  <span className="text-[16px] tracking-wide">{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User card at bottom */}
      {user && (
        <div
          className="mt-auto pt-4"
          style={{ borderTop: '1px solid var(--color-border-subtle)' }}
        >
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `group flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                isActive ? 'bg-surface' : 'hover:bg-surface'
              }`
            }
          >
            {/* Avatar with primary ring */}
            <div className="relative">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white overflow-hidden flex-shrink-0"
                style={{
                  background: user.avatarUrl
                    ? undefined
                    : getAvatarColor(user.displayName),
                  outline: '2px solid var(--color-primary)',
                  outlineOffset: '2px',
                }}
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  user.displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div
                className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full animate-pulse z-10"
                style={{
                  background: 'var(--color-success)',
                  border: '2px solid var(--color-bg-surface)',
                }}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-main line-clamp-1">
                {user.displayName}
              </p>
              {/* Member badge pill */}
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  background: 'var(--color-primary)',
                  color: 'var(--color-on-primary)',
                  opacity: 0.85,
                }}
              >
                {user.role === 'admin' ? 'Admin' : 'Member'}
              </span>
            </div>
            <ChevronRight size={16} className="text-muted group-hover:text-main transition-colors flex-shrink-0" />
          </NavLink>
        </div>
      )}
    </div>
  );
};
