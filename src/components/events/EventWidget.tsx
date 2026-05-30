import React, { useState, useEffect } from 'react';
import { subscribeToCollection } from '../../lib/firestore';
import type { Event } from '../../types';
import { Calendar, Palmtree, Gamepad2, Plane, Monitor, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  hangout: <Palmtree size={14} />,
  gaming: <Gamepad2 size={14} />,
  trip: <Plane size={14} />,
  online: <Monitor size={14} />,
};

const TYPE_COLORS: Record<string, string> = {
  hangout: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  gaming: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  trip: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  online: 'text-green-500 bg-green-500/10 border-green-500/20',
};

export const EventWidget: React.FC = () => {
  const [nextEvent, setNextEvent] = useState<Event | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToCollection<Event>('events', (events) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayMs = today.getTime();

      const upcoming = events
        .filter(e => {
          const eventTime = typeof e.date === 'string' ? new Date(e.date).getTime() : 
                            typeof e.date === 'number' ? e.date : 
                            (e.date as any).toMillis ? (e.date as any).toMillis() : 0;
          return eventTime >= todayMs;
        })
        .sort((a, b) => {
          const timeA = typeof a.date === 'string' ? new Date(a.date).getTime() : 
                        typeof a.date === 'number' ? a.date : 0;
          const timeB = typeof b.date === 'string' ? new Date(b.date).getTime() : 
                        typeof b.date === 'number' ? b.date : 0;
          return timeA - timeB;
        });

      setNextEvent(upcoming.length > 0 ? upcoming[0] : null);
    });

    return () => unsubscribe();
  }, []);

  if (!nextEvent) return null;

  const eventTime = typeof nextEvent.date === 'string' ? new Date(nextEvent.date).getTime() : typeof nextEvent.date === 'number' ? nextEvent.date : 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = eventTime - today.getTime();
  const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let countdown = '';
  if (daysUntil === 0) countdown = 'Today!';
  else if (daysUntil === 1) countdown = 'Tomorrow';
  else countdown = `In ${daysUntil} days`;

  const dateStr = new Date(eventTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const isCustomType = !['hangout', 'gaming', 'trip', 'online'].includes(nextEvent.type);
  const badgeColor = isCustomType ? 'text-primary bg-primary/10 border-primary/20' : TYPE_COLORS[nextEvent.type];
  const badgeIcon = isCustomType ? <Star size={14} /> : TYPE_ICONS[nextEvent.type];

  return (
    <div className="mb-6 p-4 rounded-xl bg-base border border-border-subtle shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-semibold text-main flex items-center gap-2">
          <Calendar size={18} className="text-primary" /> Next Event
        </h3>
        <Link to="/events" className="text-xs text-primary hover:underline">See all</Link>
      </div>

      <div className="p-3 rounded-lg bg-surface border border-border-subtle hover:border-border transition-colors group">
        <div className="flex justify-between items-start mb-2">
          <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badgeColor}`}>
            {badgeIcon} {nextEvent.type}
          </span>
          <span className={`text-xs font-semibold ${daysUntil <= 3 ? 'text-warning' : 'text-muted'}`}>
            {countdown}
          </span>
        </div>
        <h4 className="text-sm font-semibold text-main mb-1 truncate group-hover:text-primary transition-colors">{nextEvent.title}</h4>
        <p className="text-xs text-faint flex items-center gap-1">
          <Calendar size={12} /> {dateStr}
        </p>
      </div>
    </div>
  );
};
