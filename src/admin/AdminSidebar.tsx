import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { adminNavGroups } from './adminNavConfig';
import {
  loadAdminFavorites,
  loadRecentAdminMasters,
  recordRecentAdminMaster,
  toggleAdminFavorite,
} from './adminStorage';
import SmartSidebar from '../experience/components/SmartSidebar/SmartSidebar';
import type { SmartSidebarGroup, SmartSidebarRecentItem } from '../experience/components/SmartSidebar/SmartSidebar.types';

interface AdminSidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isCollapsed, isMobileOpen, onCloseMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState<string[]>(() => loadAdminFavorites());
  const [recentMasters, setRecentMasters] = useState(() => loadRecentAdminMasters());

  // Adapt adminNavGroups to SmartSidebarGroup[]
  const groups: SmartSidebarGroup[] = adminNavGroups.map((g) => {
    const GroupIcon = g.icon;
    return {
      key: g.key,
      label: g.label,
      dotColor: g.iconColor,
      collapsedIcon: <GroupIcon size={15} strokeWidth={1.9} aria-hidden="true" />,
      items: g.masters.map((m) => ({
        key: m.key,
        label: m.label,
        description: m.description,
        path: m.path,
      })),
    };
  });

  // Adapt recent masters to SmartSidebarRecentItem[]
  const recentItems: SmartSidebarRecentItem[] = recentMasters.slice(0, 5).map((r) => ({
    key: r.key,
    label: r.label,
    path: r.path,
  }));

  const handleNavigate = (path: string, key: string) => {
    const group = adminNavGroups.find((g) => g.masters.some((m) => m.key === key));
    const master = group?.masters.find((m) => m.key === key);
    if (master && group) {
      setRecentMasters(
        recordRecentAdminMaster({
          key: master.key,
          label: master.label,
          path: master.path,
          groupLabel: group.label,
          groupIconBg: group.iconBg,
          groupIconColor: group.iconColor,
        })
      );
    }
    navigate(path);
  };

  const handleFavoriteToggle = (key: string) => {
    setFavorites(toggleAdminFavorite(key));
  };

  return (
    <SmartSidebar
      groups={groups}
      activePath={location.pathname}
      isCollapsed={isCollapsed}
      isMobileOpen={isMobileOpen}
      recentItems={recentItems}
      favoriteKeys={favorites}
      onNavigate={handleNavigate}
      onFavoriteToggle={handleFavoriteToggle}
      onCloseMobile={onCloseMobile}
      topItem={{
        key: 'admin-dashboard',
        label: 'Admin Dashboard',
        path: '/admin',
        icon: <LayoutDashboard size={15} strokeWidth={1.9} aria-hidden="true" />,
      }}
    />
  );
};

export default AdminSidebar;