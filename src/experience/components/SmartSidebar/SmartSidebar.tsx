import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Clock, Search, Star, X } from 'lucide-react';
import { cn } from '../../../utils/classNames';
import type {
  SmartSidebarGroup,
  SmartSidebarItem,
  SmartSidebarProps,
  SmartSidebarRecentItem,
} from './SmartSidebar.types';

// ─── SmartSidebar ─────────────────────────────────────────────────────────────

const SmartSidebar: React.FC<SmartSidebarProps> = ({
  groups,
  activePath,
  isCollapsed = false,
  isMobileOpen = false,
  recentItems = [],
  favoriteKeys = [],
  onNavigate,
  onFavoriteToggle,
  onCloseMobile,
  topItem,
}) => {
  const sidebarCollapsed = isCollapsed && !isMobileOpen;

  // Derive active item key from activePath
  const activeKey = useMemo(() => {
    if (!activePath) return null;
    for (const g of groups) {
      const found = g.items.find((it) => it.path === activePath);
      if (found) return found.key;
    }
    return null;
  }, [activePath, groups]);

  // Initial expanded groups — open the group containing the active item
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const activeGroup = activePath
      ? groups.find((g) => g.items.some((it) => it.path === activePath))
      : null;
    const init: Record<string, boolean> = { __favourites: false, __recent: false };
    groups.forEach((g) => {
      init[g.key] = g.key === activeGroup?.key;
    });
    return init;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Auto-expand the group when the active route changes
  useEffect(() => {
    if (!activePath) return;
    const group = groups.find((g) => g.items.some((it) => it.path === activePath));
    if (group) {
      setExpandedGroups((prev) => ({ ...prev, [group.key]: true }));
    }
  }, [activePath, groups]);

  const toggleGroup = (key: string) => {
    if (sidebarCollapsed) return;
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleItemClick = (item: SmartSidebarItem) => {
    onNavigate(item.path, item.key);
    if (isMobileOpen && onCloseMobile) onCloseMobile();
  };

  const handleTopClick = () => {
    if (!topItem) return;
    onNavigate(topItem.path, topItem.key);
    if (isMobileOpen && onCloseMobile) onCloseMobile();
  };

  // ── Derived lists ──────────────────────────────────────────────────
  const searchLower = searchQuery.toLowerCase().trim();
  const filteredItems = searchLower
    ? groups.flatMap((g) =>
        g.items
          .filter(
            (it) =>
              it.label.toLowerCase().includes(searchLower) ||
              it.description?.toLowerCase().includes(searchLower)
          )
          .map((it) => ({ item: it, group: g }))
      )
    : null;

  const favoriteItems = useMemo(
    () =>
      favoriteKeys
        .map((key) => {
          const group = groups.find((g) => g.items.some((it) => it.key === key));
          return group?.items.find((it) => it.key === key) ?? null;
        })
        .filter((x): x is SmartSidebarItem => x !== null),
    [favoriteKeys, groups]
  );

  const isTopActive =
    !!topItem &&
    (activePath === topItem.path || activePath === topItem.path + '/');

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
        <nav className="app-sidebar__nav" aria-label="Navigation">

          {/* ── Top item (e.g. Dashboard) ────────────────────────── */}
          {topItem && (
            <div className="app-sidebar__group">
              <button
                type="button"
                onClick={handleTopClick}
                title={sidebarCollapsed ? topItem.label : undefined}
                className={cn(
                  'app-sidebar__level3',
                  isTopActive && 'app-sidebar__level3--active'
                )}
                style={{ width: '100%' }}
              >
                {topItem.icon}
                {!sidebarCollapsed && <span>{topItem.label}</span>}
              </button>
            </div>
          )}

          {/* ── Search ───────────────────────────────────────────── */}
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
                <Search
                  size={13}
                  strokeWidth={2}
                  style={{ color: 'var(--color-nav-muted)', flexShrink: 0 }}
                />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search masters…"
                  aria-label="Search navigation"
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
                    onClick={() => {
                      setSearchQuery('');
                      searchRef.current?.focus();
                    }}
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
                  <div
                    className="app-sidebar__level3-wrap"
                    style={{ marginLeft: 0, borderLeft: 'none', paddingLeft: 0 }}
                  >
                    {filteredItems.map(({ item }) => (
                      <ItemButton
                        key={item.key}
                        item={item}
                        isActive={activeKey === item.key}
                        isFavorited={favoriteKeys.includes(item.key)}
                        isHovered={hoveredItem === item.key}
                        onMouseEnter={() => setHoveredItem(item.key)}
                        onMouseLeave={() => setHoveredItem(null)}
                        onClick={() => handleItemClick(item)}
                        onFavToggle={
                          onFavoriteToggle
                            ? (e) => {
                                e.stopPropagation();
                                onFavoriteToggle(item.key);
                              }
                            : undefined
                        }
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Main grouped navigation ──────────────────────────── */}
          {!filteredItems && (
            <>
              {/* Favourites */}
              {favoriteItems.length > 0 && (
                <GroupSection
                  groupKey="__favourites"
                  label="Favourites"
                  collapsedIcon={<Star size={15} strokeWidth={1.9} aria-hidden="true" />}
                  isExpanded={expandedGroups['__favourites'] ?? false}
                  isCollapsed={sidebarCollapsed}
                  onToggle={() => toggleGroup('__favourites')}
                >
                  {favoriteItems.map((item) => (
                    <ItemButton
                      key={item.key}
                      item={item}
                      isActive={activeKey === item.key}
                      isFavorited
                      isHovered={hoveredItem === item.key}
                      onMouseEnter={() => setHoveredItem(item.key)}
                      onMouseLeave={() => setHoveredItem(null)}
                      onClick={() => handleItemClick(item)}
                      onFavToggle={
                        onFavoriteToggle
                          ? (e) => {
                              e.stopPropagation();
                              onFavoriteToggle(item.key);
                            }
                          : undefined
                      }
                    />
                  ))}
                </GroupSection>
              )}

              {/* Recently visited */}
              {recentItems.length > 0 && (
                <GroupSection
                  groupKey="__recent"
                  label="Recently Visited"
                  collapsedIcon={<Clock size={15} strokeWidth={1.9} aria-hidden="true" />}
                  isExpanded={expandedGroups['__recent'] ?? false}
                  isCollapsed={sidebarCollapsed}
                  onToggle={() => toggleGroup('__recent')}
                >
                  {recentItems.map((r) => resolveRecentItem(r, groups)).filter(Boolean).map((item) => (
                    <ItemButton
                      key={item!.key}
                      item={item!}
                      isActive={activeKey === item!.key}
                      isFavorited={favoriteKeys.includes(item!.key)}
                      isHovered={hoveredItem === item!.key}
                      onMouseEnter={() => setHoveredItem(item!.key)}
                      onMouseLeave={() => setHoveredItem(null)}
                      onClick={() => handleItemClick(item!)}
                      onFavToggle={
                        onFavoriteToggle
                          ? (e) => {
                              e.stopPropagation();
                              onFavoriteToggle(item!.key);
                            }
                          : undefined
                      }
                    />
                  ))}
                </GroupSection>
              )}

              {/* Separator */}
              {(favoriteItems.length > 0 || recentItems.length > 0) && !sidebarCollapsed && (
                <div style={{ margin: '6px 0', height: '1px', background: 'var(--color-border)' }} />
              )}

              {/* All groups */}
              {groups.map((group) => (
                <GroupSection
                  key={group.key}
                  groupKey={group.key}
                  label={group.label}
                  dotColor={group.dotColor}
                  collapsedIcon={group.collapsedIcon}
                  isExpanded={expandedGroups[group.key] ?? false}
                  isCollapsed={sidebarCollapsed}
                  onToggle={() => toggleGroup(group.key)}
                >
                  {group.items.map((item) => (
                    <ItemButton
                      key={item.key}
                      item={item}
                      isActive={activeKey === item.key}
                      isFavorited={favoriteKeys.includes(item.key)}
                      isHovered={hoveredItem === item.key}
                      onMouseEnter={() => setHoveredItem(item.key)}
                      onMouseLeave={() => setHoveredItem(null)}
                      onClick={() => handleItemClick(item)}
                      onFavToggle={
                        onFavoriteToggle
                          ? (e) => {
                              e.stopPropagation();
                              onFavoriteToggle(item.key);
                            }
                          : undefined
                      }
                    />
                  ))}
                </GroupSection>
              ))}
            </>
          )}
        </nav>
      </aside>
    </>
  );
};

export default SmartSidebar;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveRecentItem(
  r: SmartSidebarRecentItem,
  groups: SmartSidebarGroup[]
): SmartSidebarItem | null {
  for (const g of groups) {
    const found = g.items.find((it) => it.key === r.key);
    if (found) return found;
  }
  return null;
}

// ─── GroupSection ─────────────────────────────────────────────────────────────

interface GroupSectionProps {
  groupKey: string;
  label: string;
  collapsedIcon: React.ReactNode;
  dotColor?: string;
  isExpanded: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const GroupSection: React.FC<GroupSectionProps> = ({
  label,
  collapsedIcon,
  dotColor,
  isExpanded,
  isCollapsed,
  onToggle,
  children,
}) => (
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
            className={cn(
              'app-sidebar__chevron',
              !isExpanded && 'app-sidebar__chevron--collapsed'
            )}
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
      <div className="app-sidebar__level3-wrap">{children}</div>
    )}
  </div>
);

// ─── ItemButton ───────────────────────────────────────────────────────────────

interface ItemButtonProps {
  item: SmartSidebarItem;
  isActive: boolean;
  isFavorited: boolean;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
  onFavToggle?: (e: React.MouseEvent) => void;
}

const ItemButton: React.FC<ItemButtonProps> = ({
  item,
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
      style={{
        flex: 1,
        textAlign: 'left',
        paddingRight: isHovered || isFavorited ? '26px' : undefined,
      }}
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
        {item.label}
      </span>
    </button>

    {(isHovered || isFavorited) && onFavToggle && (
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
