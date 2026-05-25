import type React from 'react';

export interface SmartSidebarItem {
  key: string;
  label: string;
  description?: string;
  path: string;
}

export interface SmartSidebarGroup {
  key: string;
  label: string;
  dotColor?: string;
  /** Icon shown when the sidebar is in collapsed (icon-only) mode */
  collapsedIcon: React.ReactNode;
  items: SmartSidebarItem[];
}

export interface SmartSidebarRecentItem {
  key: string;
  label: string;
  path: string;
}

export interface SmartSidebarTopItem {
  key: string;
  label: string;
  path: string;
  icon: React.ReactNode;
}

export interface SmartSidebarProps {
  groups: SmartSidebarGroup[];
  /** Full pathname for active route matching, e.g. "/admin/master/org" */
  activePath?: string;
  /** Sidebar is in collapsed (icon-only) mode on desktop */
  isCollapsed?: boolean;
  /** Sidebar is open in mobile overlay mode */
  isMobileOpen?: boolean;
  /** Pre-resolved recent items to show (max 5 recommended) */
  recentItems?: SmartSidebarRecentItem[];
  /** Keys of favorited items */
  favoriteKeys?: string[];
  /** Called with (path, key) when user clicks any nav item */
  onNavigate: (path: string, key: string) => void;
  /** Called with key when user toggles a favorite star */
  onFavoriteToggle?: (key: string) => void;
  /** Closes mobile overlay */
  onCloseMobile?: () => void;
  /** Optional pinned top item (e.g. Dashboard) rendered above search */
  topItem?: SmartSidebarTopItem;
}
