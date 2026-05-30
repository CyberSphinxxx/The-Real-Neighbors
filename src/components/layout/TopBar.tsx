import React from 'react';
import { NotificationBell } from './NotificationBell';

export const TopBar: React.FC = () => {
  return (
    <header className="flex items-center justify-between p-4 bg-surface border-b border-border-subtle sticky top-0 z-10">
      <h1 className="text-xl font-heading font-bold text-primary">The Real Neighbors</h1>
      <NotificationBell />
    </header>
  );
};
