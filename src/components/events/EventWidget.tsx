import React, { useState, useEffect } from 'react';
import { subscribeToCollection } from '../../lib/firestore';
import type { Event } from '../../types';
import { Calendar, Palmtree, Gamepad2, Plane, Monitor, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  hangout: <Palmtree size={12} />,
  gaming: <Gamepad2 size={12} />,
  trip: <Plane size={12} />,
  online: <Monitor size={12} />,
};

// Badge styles using inline CSS variables — no hardcoded Tailwind color classes
const TYPE_BADGE_STYLES: Record<string, React.CSSProperties> = {
  hangout: { color: '#f97316', background: 'rgba(249,115,22,0.1)', borderColor: 'rgba(249,115,22,0.25)' },
  gaming: { color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.25)' },
  trip: { color: '#3b82f6', background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.25)' },
  online: { color: '#10b981', background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.25)' },
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

  const eventTime = typeof nextEvent.date === 'string'
    ? new Date(nextEvent.date).getTime()
    : typeof nextEvent.date === 'number'
      ? nextEvent.date
      : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = eventTime - today.getTime();
  const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let countdown = '';
  if (daysUntil === 0) countdown = 'Today!';
  else if (daysUntil === 1) countdown = 'Tomorrow';
  else countdown = `In ${daysUntil} days`;

  const dateStr = new Date(eventTime).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  const isCustomType = !['hangout', 'gaming', 'trip', 'online'].includes(nextEvent.type);
  const badgeStyle: React.CSSProperties = isCustomType
    ? {
        color: 'var(--color-primary)',
        background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
        borderColor: 'color-mix(in srgb, var(--color-primary) 25%, transparent)',
      }
    : TYPE_BADGE_STYLES[nextEvent.type];

  const badgeIcon = isCustomType ? <Star size={12} /> : TYPE_ICONS[nextEvent.type];

  const countdownIsUrgent = daysUntil <= 3;

  return (
    <div
      className="rounded-xl p-4 flex flex-col"
      style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Widget header */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Calendar size={13} />
          Next Event
        </span>
        <Link
          to="/events"
          className="text-sm font-medium transition-colors hover:underline"
          style={{ color: 'var(--color-primary)' }}
        >
          See all
        </Link>
      </div>

      {/* Event card */}
      <div
        className="p-3 rounded-xl transition-colors group"
        style={{
          background: 'var(--color-bg-base)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        {/* Badge row */}
        <div className="flex items-center justify-between mb-2">
          <span
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
            style={badgeStyle}
          >
            {badgeIcon} {nextEvent.type}
          </span>

          {/* Countdown badge */}
          {daysUntil <= 1 ? (
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{
                background: 'var(--color-warning)',
                color: '#000',
              }}
            >
              {countdown}
            </span>
          ) : (
            <span
              className="text-xs font-semibold"
              style={{ color: countdownIsUrgent ? 'var(--color-warning)' : 'var(--color-text-muted)' }}
            >
              {countdown}
            </span>
          )}
        </div>

        <h4
          className="text-sm font-semibold mb-1.5 truncate transition-colors group-hover:underline"
          style={{ color: 'var(--color-text-main)' }}
        >
          {nextEvent.title}
        </h4>

        <p
          className="text-xs flex items-center gap-1.5"
          style={{ color: 'var(--color-text-faint)' }}
        >
          <Calendar size={11} />
          {dateStr}
        </p>
      </div>
    </div>
  );
};
