import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Tv, Calendar, Cake, Link as LinkIcon } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const navItems = [
    { name: 'Feed', path: '/', icon: Home },
    { name: 'Watch', path: '/watchlist', icon: Tv },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'B-Days', path: '/birthdays', icon: Cake },
    { name: 'Links', path: '/links', icon: LinkIcon },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border-subtle pb-safe pt-1 px-2 flex justify-around items-center z-50">
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center p-2 min-w-[64px] transition-colors ${
              isActive ? 'text-primary' : 'text-muted hover:text-main'
            }`
          }
        >
          <item.icon className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">{item.name}</span>
        </NavLink>
      ))}
    </div>
  );
};
