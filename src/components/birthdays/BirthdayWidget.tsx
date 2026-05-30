import React, { useState, useEffect } from 'react';
import { subscribeToCollection } from '../../lib/firestore';
import { getDaysUntilBirthday, isBirthdayToday } from '../../utils/date';
import type { User } from '../../types';
import { Cake } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAvatarColor } from '../../utils/avatarColor';

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
          <Cake size={13} />
          Birthdays
        </span>
        <Link
          to="/birthdays"
          className="text-sm font-medium transition-colors hover:underline"
          style={{ color: 'var(--color-primary)' }}
        >
          See all
        </Link>
      </div>

      <div className="flex flex-col gap-2.5">
        {upcoming.map(user => {
          const days = getDaysUntilBirthday(user.birthdate!);
          const isToday = isBirthdayToday(user.birthdate!);
          const isSoon = days > 0 && days <= 7;

          const dateStr = new Date(user.birthdate!).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          });

          return (
            <div
              key={user.id}
              className="flex items-center gap-3 p-2 rounded-lg transition-colors"
              style={{
                background: isToday
                  ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)'
                  : undefined,
                border: isToday ? '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)' : '1px solid transparent',
              }}
            >
              {/* Generated-color avatar */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                style={{ background: user.avatarUrl ? undefined : getAvatarColor(user.displayName) }}
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  user.displayName.charAt(0).toUpperCase()
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: isToday ? 'var(--color-primary)' : 'var(--color-text-main)' }}
                >
                  {user.displayName}
                </p>
                <div className="flex items-center gap-1.5 text-xs mt-0.5">
                  {isToday ? (
                    <span
                      className="font-bold animate-pulse"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      🎂 Happy Birthday!
                    </span>
                  ) : (
                    <>
                      <span style={{ color: isSoon ? 'var(--color-warning)' : 'var(--color-text-muted)', fontWeight: isSoon ? 500 : 400 }}>
                        {days === 1 ? 'Tomorrow' : `In ${days} days`}
                      </span>
                      <span style={{ color: 'var(--color-text-faint)' }}>·</span>
                      <span style={{ color: 'var(--color-text-faint)' }}>{dateStr}</span>
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
