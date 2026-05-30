import React from 'react';
import { Bell } from 'lucide-react';

export const TopBar: React.FC = () => {
  return (
    <header className="flex items-center justify-between p-4 bg-surface border-b border-border-subtle sticky top-0 z-10">
      <h1 className="text-xl font-heading font-bold text-primary">The Real Neighbors</h1>
      <button className="p-2 rounded-full hover:bg-border-subtle text-muted transition-colors relative">
        <Bell className="w-6 h-6" />
        <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full border border-surface"></span>
      </button>
    </header>
  );
};
