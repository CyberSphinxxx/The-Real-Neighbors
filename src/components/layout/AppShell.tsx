import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { BirthdayWidget } from '../birthdays/BirthdayWidget';
import { EventWidget } from '../events/EventWidget';
import { OnlineWidget } from './OnlineWidget';
import { GroupStreakWidget } from './GroupStreakWidget';
import { MiniPollWidget } from './MiniPollWidget';
import { VibeCheckWidget } from './VibeCheckWidget';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { usePresence } from '../../hooks/usePresence';
import { useStartupNotifications } from '../../hooks/useStartupNotifications';
import { useAuthStore } from '../../stores/authStore';
import { loadFromStorage } from '../../lib/redditCache';
import { useWhatsNew } from '../../hooks/useWhatsNew';
import { WhatsNewModal } from '../ui/WhatsNewModal';

export const AppShell: React.FC = () => {
  usePresence();
  useStartupNotifications();
  useWhatsNew();
  
  const { user } = useAuthStore();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (!container) return;
    const handleScroll = () => {
      setShowScrollTop(container.scrollTop > 400);
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    const container = document.getElementById('main-scroll-container');
    container?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (user?.subreddits) {
      user.subreddits.forEach((sub) => loadFromStorage(sub));
    }
  }, [user?.subreddits]);

  return (
    <div className="flex flex-col h-screen bg-transparent md:flex-row overflow-hidden relative">
      <WhatsNewModal />
      
      {/* Global Header — fixed, spans full width */}
      <Header />

      {/* Desktop Left Sidebar — offset below header */}
      <div
        className="hidden md:flex flex-col w-[240px] flex-shrink-0 bg-surface border-r border-border-subtle overflow-hidden"
        style={{ paddingTop: '48px', height: '100vh' }}
      >
        <Sidebar />
      </div>

      {/* Center Content — scrolls independently, offset below header */}
      <main
        id="main-scroll-container"
        className="flex-1 overflow-y-auto flex flex-col"
        style={{ paddingTop: '48px', height: '100vh' }}
      >
        <div className={(location.pathname.startsWith('/chat') || location.pathname.startsWith('/ai')) ? 'w-full flex-1 flex flex-col' : 'w-full px-4 py-6 md:px-6 pb-24 md:pb-8'}>
          <ErrorBoundary>
            <div key={location.pathname} className={`animate-in fade-in duration-300 ${(location.pathname.startsWith('/chat') || location.pathname.startsWith('/ai')) ? 'h-full flex flex-col flex-1 min-h-0' : ''}`}>
              <Outlet />
            </div>
          </ErrorBoundary>
        </div>

        {/* Scroll to top button */}
        <button
          onClick={scrollToTop}
          title="Back to top"
          className={`fixed left-1/2 -translate-x-1/2 bottom-[80px] md:bottom-6 z-30 p-2 rounded-full shadow-md bg-surface border border-border-subtle text-muted hover:text-main hover:bg-elevated transition-all duration-200 ${
            showScrollTop ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ArrowUp size={16} />
        </button>
      </main>

      {/* Desktop Right Sidebar — sticky, scrolls independently */}
      {!location.pathname.startsWith('/playlist') && !location.pathname.startsWith('/chat') && !location.pathname.startsWith('/ai') && (
        <aside
            className="hidden lg:flex flex-col w-[300px] flex-shrink-0 bg-base border-l border-border-subtle overflow-y-auto p-4 gap-4 custom-scrollbar"
            style={{ paddingTop: 'calc(48px + 1rem)', height: '100vh' }}
          >
            <BirthdayWidget />
            <EventWidget />
            <OnlineWidget />
            <GroupStreakWidget />
            <MiniPollWidget />
            <VibeCheckWidget />
          </aside>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <MobileNav />
      </div>
    </div>
  );
};
