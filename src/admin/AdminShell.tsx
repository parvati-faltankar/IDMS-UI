import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppTopHeader from '../components/common/AppTopHeader';
import AdminSidebar from './AdminSidebar';
import { cn } from '../utils/classNames';
import { CommandPalette } from '../experience/components/CommandPalette';
import { HelpDrawer } from '../experience/components/HelpDrawer';
import { commandRegistry } from '../experience/navigation/commandRegistry';
import { getHelpTopic } from '../experience/help/helpTopics';
import { loadRecentAdminMasters } from './adminStorage';
import type { CommandItem } from '../experience/navigation/navigationTypes';

interface AdminShellProps {
  children: React.ReactNode;
  contentClassName?: string;
}

const AdminShell: React.FC<AdminShellProps> = ({ children, contentClassName }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [globalHelpOpen, setGlobalHelpOpen] = useState(false);
  const [globalHelpTopicId, setGlobalHelpTopicId] = useState('admin-dashboard');
  const navigate = useNavigate();

  // Merge recent-master "Continue" commands when palette opens (fresh from localStorage)
  const paletteCommands = useMemo<CommandItem[]>(() => {
    const recents = loadRecentAdminMasters().slice(0, 3);
    const continueCmds: CommandItem[] = recents.map((r) => ({
      id: `continue-${r.key}`,
      label: `Continue: ${r.label}`,
      description: `${r.groupLabel} · resume recent work`,
      actionType: 'navigate' as const,
      path: r.path,
      keywords: ['continue', 'recent', 'resume', r.key],
    }));
    return continueCmds.length > 0 ? [...continueCmds, ...commandRegistry] : commandRegistry;
  // Re-evaluate each time the palette opens so recent list is fresh
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commandPaletteOpen]);

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
    const handleCtrlK = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleEscape);
    window.addEventListener('keydown', handleCtrlK);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('keydown', handleCtrlK);
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
      <CommandPalette
        open={commandPaletteOpen}
        commands={paletteCommands}
        onClose={() => setCommandPaletteOpen(false)}
        onExecute={(cmd: CommandItem) => {
          if (cmd.actionType === 'navigate' && cmd.path) {
            navigate(cmd.path);
          } else if (cmd.actionType === 'open-help' && cmd.helpTopicId) {
            setGlobalHelpTopicId(cmd.helpTopicId);
            setGlobalHelpOpen(true);
          }
        }}
      />
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
