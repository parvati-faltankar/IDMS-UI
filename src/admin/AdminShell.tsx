import React, { useEffect, useState } from 'react';
import AppTopHeader from '../components/common/AppTopHeader';
import AdminSidebar from './AdminSidebar';
import { cn } from '../utils/classNames';

interface AdminShellProps {
  children: React.ReactNode;
  contentClassName?: string;
}

const AdminShell: React.FC<AdminShellProps> = ({ children, contentClassName }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleToggleNavigation = () => {
    if (window.innerWidth > 1024) {
      setIsSidebarCollapsed((prev) => !prev);
    } else {
      setIsMobileNavOpen((prev) => !prev);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) setIsMobileNavOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileNavOpen(false);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div className="app-shell">
      <AppTopHeader
        activeLeaf={null}
        isSidebarCollapsed={isSidebarCollapsed}
        isMobileNavOpen={isMobileNavOpen}
        onToggleNavigation={handleToggleNavigation}
      />
      <div className="app-shell__body">
        <AdminSidebar
          isCollapsed={isSidebarCollapsed}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />
        <button
          type="button"
          className={cn('app-shell__overlay', isMobileNavOpen && 'app-shell__overlay--visible')}
          onClick={() => setIsMobileNavOpen(false)}
          aria-label="Close navigation overlay"
          aria-hidden={!isMobileNavOpen}
          tabIndex={isMobileNavOpen ? 0 : -1}
        />
        <div className="app-shell__main">
          <div className={cn('app-shell__content', contentClassName)}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminShell;
