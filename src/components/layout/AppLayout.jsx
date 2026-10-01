import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { MobileSidebar } from './MobileSidebar';
import { CommandSearch } from './CommandSearch';

/**
 * AppLayout component
 * Reusable application shell for all authenticated and internal platform screens.
 */
export const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Global Command Palette (⌘K / Ctrl+K) */}
      <CommandSearch />

      {/* Mobile Slide-in Navigation Drawer */}
      <MobileSidebar />

      {/* Main Split Layout: Fixed Sidebar + Scrollable Content */}
      <div className="flex-1 flex w-full">
        {/* Desktop Collapsible Sidebar */}
        <Sidebar />

        {/* Content Column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Fixed Application Navbar */}
          <TopNavbar />

          {/* Main Application Content Area */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto w-full space-y-6">
              {children || <Outlet />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
