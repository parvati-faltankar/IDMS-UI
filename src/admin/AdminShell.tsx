import React, { useEffect, useState } from 'react';
import AppTopHeader from '../components/common/AppTopHeader';
import AdminSidebar from './AdminSidebar';
import { cn } from '../utils/classNames';
import { HelpDrawer } from '../experience/components/HelpDrawer';
import { getHelpTopic } from '../experience/help/helpTopics';

interface AdminShellProps {
  children: React.ReactNode;
  contentClassName?: string;
}

const AdminShell: React.FC<AdminShellProps> = ({ children, contentClassName }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [globalHelpOpen, setGlobalHelpOpen] = useState(false);
  const [globalHelpTopicId, setGlobalHelpTopicId] = useState('admin-dashboard');

  const handleToggleNavigation = () => {
    if (window.innerWidth > 1024) {
      setIsSidebarCollapsed((prev) => !prev);
      return;
    }

    setIsMobileNavOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsMobileNavOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileNavOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div className="app-shell" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
      <HelpDrawer
        open={globalHelpOpen}
        topic={getHelpTopic(globalHelpTopicId)}
        onClose={() => setGlobalHelpOpen(false)}
        onTopicChange={(id) => setGlobalHelpTopicId(id)}
        titleFallback="Admin Help & Guidance"
      />
    </div>
  );
};

export default AdminShell;
