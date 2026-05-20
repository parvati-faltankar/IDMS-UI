import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronDown, Clock, LayoutDashboard, Search, Star, X } from 'lucide-react';
import { cn } from '../utils/classNames';
import { navigateToHash } from '../components/common/appShellShared';
import { adminNavGroups, findGroupForMasterKey, type AdminNavGroup, type AdminMasterItem } from './adminNavConfig';
import {
  loadAdminFavorites,
  loadRecentAdminMasters,
  recordRecentAdminMaster,
  toggleAdminFavorite,
  type RecentMasterEntry,
} from './adminStorage';

interface AdminSidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isCollapsed, isMobileOpen, onCloseMobile }) => {
  const location = useLocation();
  const activeMasterKey = location.pathname.startsWith('/admin/master/')
    ? location.pathname.replace('/admin/master/', '').split('/')[0]
    : null;
  const isAdminDashboardActive = location.pathname === '/admin' || location.pathname === '/admin/';

  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => loadAdminFavorites());
  const [recentMasters, setRecentMasters] = useState<RecentMasterEntry[]>(() => loadRecentAdminMasters());
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const activeGroup = activeMasterKey ? findGroupForMasterKey(activeMasterKey) : null;
    const init: Record<string, boolean> = { __favourites: false, __recent: false };
    adminNavGroups.forEach((g) => { init[g.key] = g.key === activeGroup?.key; });
    return init;
  });
  const [hoveredMaster, setHoveredMaster] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeMasterKey) {
      const group = findGroupForMasterKey(activeMasterKey);
      if (group) setExpandedGroups((prev) => ({ ...prev, [group.key]: true }));
    }
  }, [activeMasterKey]);

  const sidebarCollapsed = isCollapsed && !isMobileOpen;

  const toggleGroup = (key: string) => {
    if (sidebarCollapsed) return;
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleMasterClick = (master: AdminMasterItem, group: AdminNavGroup) => {
    const updated = recordRecentAdminMaster({
      key: master.key,
      label: master.label,
      path: master.path,
      groupLabel: group.label,
      groupIconBg: group.iconBg,
      groupIconColor: group.iconColor,
    });
    setRecentMasters(updated);
    navigateToHash(`#${master.path}`);
    if (isMobileOpen) onCloseMobile();
  };

  const handleFavToggle = (e: React.MouseEvent, masterKey: string) => {
    e.stopPropagation();
    setFavorites(toggleAdminFavorite(masterKey));
  };

  const handleDashboardClick = () => {
    navigateToHash('#/admin');
    if (isMobileOpen) onCloseMobile();
  };

  // ── Derived lists ──────────────────────────────────────────────────

  const searchLower = searchQuery.toLowerCase().trim();
  const filteredItems = searchLower
    ? adminNavGroups.flatMap((g) =>
        g.masters
          .filter((m) => m.label.toLowerCase().includes(searchLower) || m.description.toLowerCase().includes(searchLower))
          .map((m) => ({ master: m, group: g }))
      )
    : null;

  const favoriteMasters = favorites
    .map((key) => {
      const group = adminNavGroups.find((g) => g.masters.some((m) => m.key === key));
      const master = group?.masters.find((m) => m.key === key);
      return master && group ? { master, group } : null;
    })
    .filter((x): x is { master: AdminMasterItem; group: AdminNavGroup } => x !== null);

  const recentItems = recentMasters.slice(0, 5)
    .map((r) => {
      const group = findGroupForMasterKey(r.key);
      const master = group?.masters.find((m) => m.key === r.key);
      return master && group ? { master, group } : null;
    })
    .filter((x): x is { master: AdminMasterItem; group: AdminNavGroup } => x !== null);

  return (
    <>
      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          style={{ top: '48px' }}
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          'app-sidebar',
          sidebarCollapsed && 'app-sidebar--collapsed',
          isMobileOpen && 'app-sidebar--mobile-open'
        )}
      >
        <nav className="app-sidebar__nav" aria-label="Admin navigation">

          {/* ── Dashboard ───────────────────────────────────────── */}
          <div className="app-sidebar__group">
            <button
              type="button"
              onClick={handleDashboardClick}
              title={sidebarCollapsed ? 'Admin Dashboard' : undefined}
              className={cn(
                'app-sidebar__level3',
                isAdminDashboardActive && 'app-sidebar__level3--active'
              )}
              style={{ width: '100%' }}
            >
              <LayoutDashboard size={15} strokeWidth={1.9} aria-hidden="true" />
              {!sidebarCollapsed && <span>Admin Dashboard</span>}
            </button>
          </div>

          {/* ── Search ──────────────────────────────────────────── */}
          {!sidebarCollapsed && (
            <div style={{ margin: '4px 0 8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-subtle)',
                }}
              >
                <Search size={13} strokeWidth={2} style={{ color: 'var(--color-nav-muted)', flexShrink: 0 }} />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search masters…"
                  aria-label="Search admin masters"
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: 'var(--font-size-12)',
                    color: 'var(--color-text)',
                    minWidth: 0,
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }}
                    aria-label="Clear search"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      color: 'var(--color-nav-muted)',
                      flexShrink: 0,
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Search results ───────────────────────────────────── */}
          {filteredItems && !sidebarCollapsed && (
            <div className="app-sidebar__group">
              {filteredItems.length === 0 ? (
                <div
                  style={{
                    padding: '8px 12px',
                    fontSize: 'var(--font-size-12)',
                    color: 'var(--color-nav-muted)',
                  }}
                >
                  No results for &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                <>
                  <div
                    style={{
                      padding: '2px 12px 4px',
                      fontSize: 'var(--font-size-10)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-nav-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}
                  </div>
                  <div className="app-sidebar__level3-wrap" style={{ marginLeft: 0, borderLeft: 'none', paddingLeft: 0 }}>
                    {filteredItems.map(({ master, group }) => (
                      <MasterButton
                        key={master.key}
                        master={master}
                        isActive={activeMasterKey === master.key}
                        isFavorited={favorites.includes(master.key)}
                        isHovered={hoveredMaster === master.key}
                        onMouseEnter={() => setHoveredMaster(master.key)}
                        onMouseLeave={() => setHoveredMaster(null)}
                        onClick={() => handleMasterClick(master, group)}
                        onFavToggle={(e) => handleFavToggle(e, master.key)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Main nav ─────────────────────────────────────────── */}
          {!filteredItems && (
            <>
              {/* Favourites */}
              {favoriteMasters.length > 0 && (
                <NavGroup
                  groupKey="__favourites"
                  label="Favourites"
                  collapsedIcon={<Star size={15} strokeWidth={1.9} aria-hidden="true" />}
                  isExpanded={expandedGroups['__favourites'] ?? false}
                  isCollapsed={sidebarCollapsed}
                  onToggle={() => toggleGroup('__favourites')}
                >
                  {favoriteMasters.map(({ master, group }) => (
                    <MasterButton
                      key={master.key}
                      master={master}
                      isActive={activeMasterKey === master.key}
                      isFavorited
                      isHovered={hoveredMaster === master.key}
                      onMouseEnter={() => setHoveredMaster(master.key)}
                      onMouseLeave={() => setHoveredMaster(null)}
                      onClick={() => handleMasterClick(master, group)}
                      onFavToggle={(e) => handleFavToggle(e, master.key)}
                    />
                  ))}
                </NavGroup>
              )}

              {/* Recently visited */}
              {recentItems.length > 0 && (
                <NavGroup
                  groupKey="__recent"
                  label="Recently Visited"
                  collapsedIcon={<Clock size={15} strokeWidth={1.9} aria-hidden="true" />}
                  isExpanded={expandedGroups['__recent'] ?? false}
                  isCollapsed={sidebarCollapsed}
                  onToggle={() => toggleGroup('__recent')}
                >
                  {recentItems.map(({ master, group }) => (
                    <MasterButton
                      key={master.key}
                      master={master}
                      isActive={activeMasterKey === master.key}
                      isFavorited={favorites.includes(master.key)}
                      isHovered={hoveredMaster === master.key}
                      onMouseEnter={() => setHoveredMaster(master.key)}
                      onMouseLeave={() => setHoveredMaster(null)}
                      onClick={() => handleMasterClick(master, group)}
                      onFavToggle={(e) => handleFavToggle(e, master.key)}
                    />
                  ))}
                </NavGroup>
              )}

              {/* Separator */}
              {(favoriteMasters.length > 0 || recentItems.length > 0) && !sidebarCollapsed && (
                <div style={{ margin: '6px 0', height: '1px', background: 'var(--color-border)' }} />
              )}

              {/* All 12 admin groups */}
              {adminNavGroups.map((group) => {
                const GroupIcon = group.icon;
                const isExpanded = expandedGroups[group.key] ?? false;
                return (
                  <NavGroup
                    key={group.key}
                    groupKey={group.key}
                    label={group.label}
                    dotColor={group.iconColor}
                    collapsedIcon={<GroupIcon size={15} strokeWidth={1.9} aria-hidden="true" />}
                    isExpanded={isExpanded}
                    isCollapsed={sidebarCollapsed}
                    onToggle={() => toggleGroup(group.key)}
                  >
                    {group.masters.map((master) => (
                      <MasterButton
                        key={master.key}
                        master={master}
                        isActive={activeMasterKey === master.key}
                        isFavorited={favorites.includes(master.key)}
                        isHovered={hoveredMaster === master.key}
                        onMouseEnter={() => setHoveredMaster(master.key)}
                        onMouseLeave={() => setHoveredMaster(null)}
                        onClick={() => handleMasterClick(master, group)}
                        onFavToggle={(e) => handleFavToggle(e, master.key)}
                      />
                    ))}
                  </NavGroup>
                );
              })}
            </>
          )}
        </nav>
      </aside>
    </>
  );
};

// ─── NavGroup ─────────────────────────────────────────────────────────────────

interface NavGroupProps {
  groupKey: string;
  label: string;
  collapsedIcon: React.ReactNode;
  dotColor?: string;
  isExpanded: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const NavGroup: React.FC<NavGroupProps> = ({ label, collapsedIcon, dotColor, isExpanded, isCollapsed, onToggle, children }) => (
  <div className="app-sidebar__group">
    <button
      type="button"
      onClick={onToggle}
      disabled={isCollapsed}
      title={isCollapsed ? label : undefined}
      className={cn(
        'app-sidebar__level1',
        isCollapsed && 'app-sidebar__level1--collapsed',
        isExpanded && !isCollapsed && 'app-sidebar__level1--expanded'
      )}
      aria-expanded={isCollapsed ? undefined : isExpanded}
    >
      {!isCollapsed ? (
        <>
          <ChevronDown
            size={16}
            className={cn('app-sidebar__chevron', !isExpanded && 'app-sidebar__chevron--collapsed')}
          />
          {dotColor && (
            <span
              aria-hidden="true"
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: dotColor,
                flexShrink: 0,
              }}
            />
          )}
          <span>{label}</span>
        </>
      ) : (
        collapsedIcon
      )}
    </button>

    {!isCollapsed && isExpanded && (
      <div className="app-sidebar__level3-wrap">
        {children}
      </div>
    )}
  </div>
);

// ─── MasterButton ─────────────────────────────────────────────────────────────

interface MasterButtonProps {
  master: AdminMasterItem;
  isActive: boolean;
  isFavorited: boolean;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
  onFavToggle: (e: React.MouseEvent) => void;
}

const MasterButton: React.FC<MasterButtonProps> = ({
  master,
  isActive,
  isFavorited,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onFavToggle,
}) => (
  <div
    style={{ display: 'flex', alignItems: 'center', position: 'relative' }}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    <button
      type="button"
      onClick={onClick}
      className={cn('app-sidebar__level3', isActive && 'app-sidebar__level3--active')}
      style={{ flex: 1, textAlign: 'left', paddingRight: isHovered || isFavorited ? '26px' : undefined }}
    >
      <span
        style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'block',
        }}
      >
        {master.label}
      </span>
    </button>

    {(isHovered || isFavorited) && (
      <button
        type="button"
        onClick={onFavToggle}
        aria-label={isFavorited ? 'Remove from favourites' : 'Add to favourites'}
        title={isFavorited ? 'Remove from favourites' : 'Add to favourites'}
        style={{
          position: 'absolute',
          right: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '18px',
          height: '18px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          borderRadius: '3px',
          color: isFavorited ? '#F59E0B' : 'var(--color-nav-muted)',
          flexShrink: 0,
        }}
      >
        <Star size={11} fill={isFavorited ? '#F59E0B' : 'none'} stroke="currentColor" />
      </button>
    )}
  </div>
);

export default AdminSidebar;