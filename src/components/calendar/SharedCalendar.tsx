import React, { useState, useEffect } from 'react';
import { subscribeToCollection } from '../../lib/firestore';
import { useUsers } from '../../hooks/useUsers';
import type { Event, User } from '../../types';
import { ChevronLeft, ChevronRight, Cake, Palmtree, Gamepad2, Plane, Monitor, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  hangout: <Palmtree size={12} />,
  gaming: <Gamepad2 size={12} />,
  trip: <Plane size={12} />,
  online: <Monitor size={12} />,
};

const TYPE_COLORS: Record<string, string> = {
  hangout: 'bg-orange-500/20 text-orange-600 border-orange-500/30',
  gaming: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
  trip: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
  online: 'bg-green-500/20 text-green-600 border-green-500/30',
};

interface CalendarActivity {
  type: 'birthday' | 'event';
  id: string;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
  onClick: () => void;
}

export const SharedCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  
  const [events, setEvents] = useState<Event[]>([]);
  const { users } = useUsers();

  useEffect(() => {
    const unsubEvents = subscribeToCollection<Event>('events', setEvents);
    return () => {
      unsubEvents();
    };
  }, []);

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const isToday = (d: number) => {
    const today = new Date();
    return d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  // Group activities by day
  const getActivitiesForDay = (d: number): CalendarActivity[] => {
    const activities: CalendarActivity[] = [];

    // Add Birthdays
    users.forEach(user => {
      if (user.birthdate) {
        const [, bm, bd] = user.birthdate.split('-').map(Number);
        if (bm - 1 === month && bd === d) {
          activities.push({
            type: 'birthday',
            id: `bday-${user.id}`,
            label: `${user.displayName.split(' ')[0]}'s B-Day`,
            icon: <Cake size={12} />,
            colorClass: 'bg-pink-500/20 text-pink-600 font-bold border-pink-500/30 border',
            onClick: () => navigate('/birthdays')
          });
        }
      }
    });

    // Add Events
    events.forEach(event => {
      const eventTime = typeof event.date === 'string' ? new Date(event.date).getTime() : typeof event.date === 'number' ? event.date : 0;
      const dateObj = new Date(eventTime);
      if (dateObj.getFullYear() === year && dateObj.getMonth() === month && dateObj.getDate() === d) {
        const isCustomType = !['hangout', 'gaming', 'trip', 'online'].includes(event.type);
        const icon = isCustomType ? <Star size={12} /> : TYPE_ICONS[event.type];
        const colorClass = isCustomType ? 'bg-primary/20 text-primary border-primary/30 border' : `${TYPE_COLORS[event.type]} border`;

        activities.push({
          type: 'event',
          id: `event-${event.id}`,
          label: event.title,
          icon: icon,
          colorClass,
          onClick: () => navigate(`/events/${event.id}`)
        });
      }
    });

    return activities;
  };

  return (
    <div className="bg-surface border border-border-subtle rounded-2xl p-4 sm:p-6 shadow-sm mb-8 overflow-hidden select-none">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-heading font-bold text-main">
          {MONTHS[month]} {year}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={handleToday} className="px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors mr-2 hidden sm:block">
            Today
          </button>
          <button onClick={handlePrevMonth} className="p-2 rounded-xl bg-base border border-border-subtle hover:border-border text-muted hover:text-main transition-all">
            <ChevronLeft size={18} />
          </button>
          <button onClick={handleNextMonth} className="p-2 rounded-xl bg-base border border-border-subtle hover:border-border text-muted hover:text-main transition-all">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border-subtle rounded-xl overflow-hidden border border-border-subtle">
        {/* Header */}
        {DAYS.map(day => (
          <div key={day} className="bg-surface py-2 text-center text-xs font-bold text-muted uppercase tracking-wider">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}

        {/* Calendar Grid */}
        {days.map((d, i) => {
          if (!d) return <div key={i} className="bg-base/50 min-h-[80px] sm:min-h-[100px] p-1" />;
          
          const today = isToday(d);
          const activities = getActivitiesForDay(d);

          return (
            <div key={i} className="bg-surface min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 hover:bg-base transition-colors group relative flex flex-col">
              <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${today ? 'bg-primary text-on-primary shadow-md' : 'text-main'}`}>
                {d}
              </span>
              
              <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar flex-1 pb-1">
                {activities.map(act => (
                  <button
                    key={act.id}
                    onClick={act.onClick}
                    className={`w-full text-left px-1.5 py-1 rounded flex items-center gap-1.5 text-[10px] sm:text-xs truncate transition-all hover:brightness-95 ${act.colorClass}`}
                    title={act.label}
                  >
                    <span className="hidden sm:inline-flex flex-shrink-0">{act.icon}</span>
                    <span className="truncate">{act.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
