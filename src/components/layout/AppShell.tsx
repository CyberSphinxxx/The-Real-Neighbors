import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';

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
          <Outlet />
        </div>
      </main>

      {/* Desktop Right Sidebar Placeholder */}
      <aside className="hidden lg:flex flex-col w-[280px] flex-shrink-0 bg-surface border-l border-border-subtle h-full p-4 overflow-y-auto">
        <div className="mb-6 p-4 rounded-lg bg-base border border-border-subtle shadow-sm">
          <h3 className="font-heading font-semibold text-main mb-2">Birthdays</h3>
          <p className="text-sm text-muted">Placeholder for birthday widget</p>
        </div>
        <div className="p-4 rounded-lg bg-base border border-border-subtle shadow-sm">
          <h3 className="font-heading font-semibold text-main mb-2">Next Event</h3>
          <p className="text-sm text-muted">Placeholder for event widget</p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <MobileNav />
      </div>
    </div>
  );
};
