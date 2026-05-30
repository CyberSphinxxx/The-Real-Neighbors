import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Tv, Calendar, Cake, Link as LinkIcon } from 'lucide-react';

export const Sidebar: React.FC = () => {
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
      
      {/* User Avatar Placeholder */}
      <div className="pt-4 border-t border-border-subtle flex items-center gap-3 px-2">
        <div className="w-10 h-10 rounded-full bg-border-subtle overflow-hidden flex items-center justify-center text-muted font-semibold">
          UN
        </div>
        <div>
          <p className="text-sm font-semibold text-main">User Name</p>
          <p className="text-xs text-faint">View profile</p>
        </div>
      </div>
    </div>
  );
};
