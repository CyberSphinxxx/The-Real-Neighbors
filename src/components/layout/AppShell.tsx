import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { BirthdayWidget } from '../birthdays/BirthdayWidget';
import { EventWidget } from '../events/EventWidget';
import { ErrorBoundary } from '../ui/ErrorBoundary';

export const AppShell: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-base md:flex-row overflow-hidden">
      {/* Mobile Top Bar */}
      <div className="md:hidden">
        <TopBar />
      </div>

      {/* Desktop Left Sidebar */}
      <div className="hidden md:flex flex-col w-[240px] flex-shrink-0 bg-surface border-r border-border-subtle h-full">
        <Sidebar />
      </div>

      {/* Center Content */}
      <main className="flex-1 overflow-y-auto w-full max-w-full">
        <div className="mx-auto max-w-3xl p-4 md:p-6 w-full pb-24 md:pb-6">
          <ErrorBoundary>
            <div className="animate-in fade-in duration-300">
              <Outlet />
            </div>
          </ErrorBoundary>
        </div>
      </main>

      {/* Desktop Right Sidebar Placeholder */}
      <aside className="hidden lg:flex flex-col w-[280px] flex-shrink-0 bg-surface border-l border-border-subtle h-full p-4 overflow-y-auto">
        <BirthdayWidget />
        <EventWidget />
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <MobileNav />
      </div>
    </div>
  );
};
