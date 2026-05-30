import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { subscribeToCollection } from '../../lib/firestore';
import type { Post, User, Event } from '../../types';

export const NotificationBell: React.FC = () => {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    let unmounted = false;

    // Track last visited (update every minute while active)
    const updateLastVisited = () => {
      localStorage.setItem('lastVisited', Date.now().toString());
    };
    const lastVisitedStr = localStorage.getItem('lastVisited');
    const lastVisited = lastVisitedStr ? parseInt(lastVisitedStr, 10) : Date.now() - 86400000; // default 24h ago
    
    updateLastVisited();
    const interval = setInterval(updateLastVisited, 60000);

    let recentPosts = 0;
    let upcomingEvents = 0;
    let birthdaysToday = 0;

    const evaluateUnread = () => {
      if (unmounted) return;
      setHasUnread(recentPosts > 0 || upcomingEvents > 0 || birthdaysToday > 0);
    };

    const unsubPosts = subscribeToCollection<Post>('posts', (data) => {
      recentPosts = data.filter(p => Number(p.createdAt) > lastVisited).length;
      evaluateUnread();
    });

    const unsubEvents = subscribeToCollection<Event>('events', (data) => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const twoDaysFromNow = new Date(now);
      twoDaysFromNow.setDate(now.getDate() + 2);

      upcomingEvents = data.filter(e => {
        const d = new Date(e.date);
        return d >= now && d <= twoDaysFromNow;
      }).length;
      evaluateUnread();
    });

    const unsubBirthdays = subscribeToCollection<User>('users', (data) => {
      const todayStr = new Date().toISOString().slice(5, 10); // MM-DD
      birthdaysToday = data.filter(u => u.birthdate && u.birthdate.slice(5, 10) === todayStr).length;
      evaluateUnread();
    });

    return () => {
      unmounted = true;
      clearInterval(interval);
      unsubPosts();
      unsubEvents();
      unsubBirthdays();
    };
  }, []);

  const handleClick = () => {
    // Clear notification dot when clicked
    setHasUnread(false);
    localStorage.setItem('lastVisited', Date.now().toString());
  };

  return (
    <button 
      onClick={handleClick}
      className="p-2 rounded-full hover:bg-border-subtle text-muted transition-colors relative"
      title="Notifications"
    >
      <Bell className="w-6 h-6" />
      {hasUnread && (
        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger rounded-full border-2 border-surface animate-pulse"></span>
      )}
    </button>
  );
};
