import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MessageSquare, Gamepad2, Home, Bot, Calendar } from 'lucide-react';
import { subscribeToCollection } from '../../lib/firestore';
import { useAuthStore } from '../../stores/authStore';
import type { Event } from '../../types';

export const MobileNav: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const [unreadChatCount] = useState(0);
  const [hasNewEvents, setHasNewEvents] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Quick approximation of chat unreads for demo purposes
    // (Actual logic would depend on the chat system implementation)
    const storedEvents = localStorage.getItem(`lastVisited_${user.id}`);
    const lastVisited = storedEvents ? JSON.parse(storedEvents) : {};
    
    const unsubEvents = subscribeToCollection<Event>('events', (data) => {
      if (data.length > 0) {
        const latest = Math.max(...data.map(d => new Date(d.createdAt).getTime()));
        const visitedEvents = lastVisited['events'];
        if (!visitedEvents || new Date(latest) > new Date(visitedEvents)) {
          setHasNewEvents(true);
        } else {
          setHasNewEvents(false);
        }
      }
    });

    return () => {
      unsubEvents();
    };
  }, [user]);
  
  // Also clear event badge if we visit events page
  useEffect(() => {
    if (location.pathname.startsWith('/events')) {
      setHasNewEvents(false);
    }
  }, [location.pathname]);

  const navItems = [
    { name: 'Chat', path: '/chat', icon: MessageSquare, badge: unreadChatCount > 0 ? unreadChatCount : null },
    { name: 'Games', path: '/games', icon: Gamepad2, badge: null },
    { name: 'Feed', path: '/', icon: Home, badge: null },
    { name: 'Botbot', path: '/ai', icon: Bot, badge: null },
    { name: 'Events', path: '/events', icon: Calendar, badge: hasNewEvents ? 'dot' : null },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border-subtle pb-safe pt-2 px-2 flex justify-between items-center z-50 h-[64px]">
      {navItems.map((item) => {
        const isFeed = item.name === 'Feed';
        
        return (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => {
              if (isFeed) {
                return `relative flex flex-col items-center justify-center w-12 h-12 -translate-y-3 rounded-full shadow-[0_4px_12px_rgba(var(--color-primary-rgb),0.4)] transition-transform flex-shrink-0 mx-1 ${
                  isActive ? 'bg-primary text-on-primary scale-105' : 'bg-primary text-on-primary'
                }`;
              }
              return `relative flex flex-col items-center p-2 flex-1 transition-colors ${
                isActive ? 'text-primary' : 'text-muted hover:text-main'
              }`;
            }}
          >
            {({ isActive }) => (
              <>
                <item.icon className={isFeed ? "w-6 h-6" : "w-5 h-5 mb-1"} />
                {!isFeed && (
                  <span className={`text-[10px] ${isActive ? 'font-medium' : 'font-normal'}`}>
                    {item.name}
                  </span>
                )}
                
                {/* Active Indicator (Dot) */}
                {!isFeed && isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
                
                {/* Unread Badges */}
                {item.badge === 'dot' && !isActive && (
                  <span className="absolute top-2 right-[calc(50%-12px)] w-2 h-2 rounded-full bg-primary border-2 border-surface" />
                )}
                {typeof item.badge === 'number' && (
                  <span className="absolute top-1 right-[calc(50%-14px)] bg-danger text-white text-[9px] font-bold px-1.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full border-2 border-surface">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </div>
  );
};
