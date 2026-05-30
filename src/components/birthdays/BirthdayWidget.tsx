import React, { useState, useEffect } from 'react';
import { subscribeToCollection } from '../../lib/firestore';
import { getDaysUntilBirthday, isBirthdayToday } from '../../utils/date';
import type { User } from '../../types';
import { Cake } from 'lucide-react';
import { Link } from 'react-router-dom';

export const BirthdayWidget: React.FC = () => {
  const [upcoming, setUpcoming] = useState<User[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToCollection<User>('users', (users) => {
      const withBirthdays = users.filter(u => !!u.birthdate);
      const sorted = withBirthdays.sort((a, b) => 
        getDaysUntilBirthday(a.birthdate!) - getDaysUntilBirthday(b.birthdate!)
      );
      setUpcoming(sorted.slice(0, 3));
    });

    return () => unsubscribe();
  }, []);

  if (upcoming.length === 0) return null;

  return (
    <div className="mb-6 p-4 rounded-xl bg-base border border-border-subtle shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-semibold text-main flex items-center gap-2">
          <Cake size={18} className="text-primary" /> Birthdays
        </h3>
        <Link to="/birthdays" className="text-xs text-primary hover:underline">See all</Link>
      </div>

      <div className="flex flex-col gap-3">
        {upcoming.map(user => {
          const days = getDaysUntilBirthday(user.birthdate!);
          const isToday = isBirthdayToday(user.birthdate!);
          const isSoon = days > 0 && days <= 7;

          // Format date like "June 15"
          const dateStr = new Date(user.birthdate!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

          return (
            <div 
              key={user.id} 
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                isToday ? 'bg-primary/10 border border-primary/20' : 'hover:bg-surface'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isToday ? 'text-primary' : 'text-main'}`}>
                  {user.displayName}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  {isToday ? (
                    <span className="text-primary font-bold animate-pulse">🎂 Happy Birthday!</span>
                  ) : (
                    <>
                      <span className={isSoon ? 'text-warning font-medium' : 'text-muted'}>
                        {days === 1 ? 'Tomorrow' : `In ${days} days`}
                      </span>
                      <span className="text-faint">•</span>
                      <span className="text-faint">{dateStr}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
