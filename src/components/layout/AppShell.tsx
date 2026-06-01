import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { BirthdayWidget } from '../birthdays/BirthdayWidget';
import { EventWidget } from '../events/EventWidget';
import { OnlineWidget } from './OnlineWidget';
import { GroupStreakWidget } from './GroupStreakWidget';
import { MiniPollWidget } from './MiniPollWidget';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { usePresence } from '../../hooks/usePresence';
import { useStartupNotifications } from '../../hooks/useStartupNotifications';

export const AppShell: React.FC = () => {
  usePresence();
  useStartupNotifications();
  
  const location = useLocation();
  const isProfile = location.pathname === '/profile';

  return (
    <div className="flex flex-col h-screen bg-base md:flex-row overflow-hidden">
      {/* Mobile Top Bar */}
      <div className="md:hidden">
        <TopBar />
      </div>

      {/* Desktop Left Sidebar — fixed height, no scroll */}
      <div className="hidden md:flex flex-col w-[240px] flex-shrink-0 bg-surface border-r border-border-subtle h-full overflow-hidden">
        <Sidebar />
      </div>

      {/* Center Content — scrolls independently */}
      <main id="main-scroll-container" className="flex-1 overflow-y-auto h-full">
        <div className="mx-auto max-w-[680px] px-4 py-6 md:px-6 w-full pb-24 md:pb-8">
          <ErrorBoundary>
            <div className="animate-in fade-in duration-300">
              <Outlet />
            </div>
          </ErrorBoundary>
        </div>
      </main>

      {/* Desktop Right Sidebar — sticky, scrolls independently */}
      {!isProfile && (
        <aside className="hidden lg:flex flex-col w-[300px] flex-shrink-0 bg-base border-l border-border-subtle h-full overflow-y-auto p-4 gap-4 custom-scrollbar">
          <BirthdayWidget />
          <EventWidget />
          <OnlineWidget />
          <GroupStreakWidget />
          <MiniPollWidget />
        </aside>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <MobileNav />
      </div>
    </div>
  );
};
