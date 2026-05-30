import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Tv, Calendar, Cake, Link as LinkIcon } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

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
    <div className="flex flex-col h-full justify-between p-4">
      <div>
        <div className="mb-8 px-2">
          <h1 className="text-xl font-heading font-bold text-primary">The Real Neighbors</h1>
        </div>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted hover:bg-border-subtle hover:text-main'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
      
      {/* User Profile - Bottom */}
      {user && (
        <div className="p-4 border-t border-border-subtle mt-auto">
          <NavLink 
            to="/profile"
            className={({ isActive }) => `flex items-center gap-3 p-2 rounded-xl transition-colors ${
              isActive ? 'bg-primary/10' : 'hover:bg-base'
            }`}
          >
            <div 
              className="w-10 h-10 rounded-full bg-primary/10 border-2 flex items-center justify-center font-bold text-primary overflow-hidden flex-shrink-0"
              style={{ borderColor: user.accentColor || '#3b82f6' }}
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                user.displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-main line-clamp-1">{user.displayName}</p>
              <div className="text-xs text-muted capitalize">{user.role}</div>
            </div>
          </NavLink>
        </div>
      )}
    </div>
  );
};
