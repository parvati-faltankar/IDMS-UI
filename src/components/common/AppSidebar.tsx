import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronRight, FileText, Search, Star, X } from 'lucide-react';
import { cn } from '../../utils/classNames';
import { navigateToHash, type FlyoutGroupItem, type Level1Item, type Level3Item, type SidebarComponentProps } from './appShellShared';
import { usePublishedMenu } from '../../hooks/usePublishedMenu';
import { navigationItemTranslationKeys, navigationSectionTranslationKeys, useLocalization } from '../../localization';
import { loadSidebarRecentDocuments, recordSidebarRecentDocument, removeSidebarRecentDocument, SIDEBAR_RECENT_DOCUMENTS_UPDATED, type SidebarRecentDocument } from '../../utils/sidebarRecentDocuments';
import { loadSidebarFavoriteItems, SIDEBAR_FAVORITE_ITEMS_UPDATED, toggleSidebarFavoriteItem, type SidebarFavoriteItem } from '../../utils/sidebarFavoriteItems';

const COLLAPSED_FLYOUT_WIDTH = '16rem';
const COLLAPSED_FLYOUT_GAP = 8;
const SEARCH_MIN_LENGTH = 2;

type MenuBranch = { item: Level3Item; parentLabel: string; groupLabel?: string };
type ResolvedFavoriteItem = SidebarFavoriteItem & MenuBranch;

const AppSidebar: React.FC<SidebarComponentProps> = ({
  isCollapsed,
  onPurchaseRequisitionClick,
  onPurchaseOrderClick,
  onPurchaseReceiptClick,
  onPurchaseInvoiceClick,
  onSaleOrderClick,
  onSaleOrderV2Click,
  onSaleAllocationRequisitionClick,
  onSaleAllocationClick,
  onSaleInvoiceClick,
  onDeliveryClick,
  activeLeaf = 'purchase-requisition',
  isMobileOpen,
  onCloseMobile,
}) => {
  const { t } = useLocalization();
  const currentMenuStructure = usePublishedMenu();
  const flyoutRef = useRef<HTMLDivElement | null>(null);
  const level1ButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const lastFlyoutTriggerLabelRef = useRef<string | null>(null);
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const isSalesLeaf =
    activeLeaf === 'sale-order' ||
    activeLeaf === 'sale-order-v2' ||
    activeLeaf === 'sale-allocation-requisition' ||
    activeLeaf === 'sale-allocation' ||
    activeLeaf === 'sale-invoice' ||
    activeLeaf === 'delivery';
  const [expandedLevel1, setExpandedLevel1] = useState<Record<string, boolean>>({
    'UI Studio': activeLeaf === 'ui-studio',
    'Approval Studio': activeLeaf === 'approval-studio',
    Procurement: !isSalesLeaf,
    Sales: isSalesLeaf,
    Inventory: false,
    Services: false,
  });
  const [expandedLevel2, setExpandedLevel2] = useState<Record<string, boolean>>({
    'UI Studio_Pages': activeLeaf === 'ui-studio',
    'Approval Studio_Pages': activeLeaf === 'approval-studio',
    Procurement_Pages: !isSalesLeaf,
    Sales_Pages: isSalesLeaf,
    Inventory_Pages: false,
    Services_Pages: false,
  });
  const [navigationSearchQuery, setNavigationSearchQuery] = useState('');
  const [recentDocuments, setRecentDocuments] = useState<SidebarRecentDocument[]>(() => loadSidebarRecentDocuments());
  const [favoriteItems, setFavoriteItems] = useState<SidebarFavoriteItem[]>(() => loadSidebarFavoriteItems());
  const [activeFlyoutSection, setActiveFlyoutSection] = useState<string | null>(null);
  const [activeFlyoutGroupKey, setActiveFlyoutGroupKey] = useState<string | null>(null);
  const [flyoutTop, setFlyoutTop] = useState<number | null>(null);

  const sidebarCollapsed = isCollapsed && !isMobileOpen;
  const hoverFlyoutEnabled = sidebarCollapsed && !isMobileOpen;
  const normalizedSearchQuery = navigationSearchQuery.trim().toLowerCase();
  const isNavigationSearchActive = normalizedSearchQuery.length >= SEARCH_MIN_LENGTH;

  const getSectionLabel = (label: string) => {
    const translationKey = navigationSectionTranslationKeys[label];
    return translationKey ? t(translationKey) : label;
  };

  const getItemLabel = (item: Level3Item) => {
    const translationKey = navigationItemTranslationKeys[item.key];
    return translationKey ? t(translationKey) : item.label;
  };

  const getSafeRoute = (item: Level3Item) => item.route ?? `/${item.key}`;

  const getNavigationRouteForItem = (item: Level3Item) => {
    if (item.externalUrl) return null;
    if (item.route) return item.route;

    if (item.key === 'purchase-requisition') return '/purchase-requisition';
    if (item.key === 'purchase-order') return '/purchase-order';
    if (item.key === 'purchase-receipt') return '/purchasereceiptlist';
    if (item.key === 'purchase-invoice') return '/purchaseinvoicelist';
    if (item.key === 'sale-order') return '/sale-order';
    if (item.key === 'sale-order-v2') return '/sale-order-v2';
    if (item.key === 'sale-allocation-requisition') return '/sale-allocation-requisition';
    if (item.key === 'sale-allocation') return '/sale-allocation';
    if (item.key === 'sale-invoice') return '/sale-invoice';
    if (item.key === 'delivery') return '/delivery';

    return null;
  };

  const navigateToStoredRoute = (route: string) => {
    const trimmedRoute = route.trim();
    if (!trimmedRoute) return;
    navigateToHash(trimmedRoute.startsWith('#') ? trimmedRoute : `#${trimmedRoute.startsWith('/') ? trimmedRoute : `/${trimmedRoute}`}`);
  };

  const findMenuBranch = (key: string, preferredParentLabel?: string): MenuBranch | null => {
    const branches = currentMenuStructure.flatMap((level1) =>
      level1.level2.flatMap((level2) =>
        (level2.level3 ?? []).map((level3) => ({ item: level3, parentLabel: level1.label, groupLabel: level2.label }))
      )
    );
    return branches.find((branch) => branch.item.key === key && branch.parentLabel === preferredParentLabel) ?? branches.find((branch) => branch.item.key === key) ?? null;
  };

  const resolvedFavoriteItems = useMemo<ResolvedFavoriteItem[]>(
    () => favoriteItems.map((favorite) => {
      const branch = findMenuBranch(favorite.key, favorite.parentLabel);
      return branch ? { ...favorite, ...branch } : null;
    }).filter((favorite): favorite is ResolvedFavoriteItem => Boolean(favorite)),
    [favoriteItems, currentMenuStructure]
  );

  const activeLevel1Label = useMemo(() => {
    const matchingSections = currentMenuStructure.filter((level1) =>
      level1.level2.some((level2) => level2.level3?.some((level3) => level3.key === activeLeaf))
    );
    return matchingSections.find((level1) =>
      level1.level2.some((level2) => level2.hideLabel && level2.level3?.some((level3) => level3.key === activeLeaf))
    )?.label ?? matchingSections[0]?.label ?? null;
  }, [activeLeaf, currentMenuStructure]);

  const matchesSearch = (values: Array<string | undefined>) => values.some((value) => value?.toLowerCase().includes(normalizedSearchQuery));

  const visibleMenuStructure = useMemo<Level1Item[]>(() => {
    if (!isNavigationSearchActive) return currentMenuStructure;

    return currentMenuStructure.reduce<Level1Item[]>((sections, level1) => {
      const level1Matches = matchesSearch([level1.label, getSectionLabel(level1.label)]);
      const level2 = level1.level2.reduce<typeof level1.level2>((groups, level2Item) => {
        const level2Matches = matchesSearch([level2Item.label, getSectionLabel(level2Item.label)]);
        const childItems = level2Item.level3 ?? [];
        const visibleLevel3 = level1Matches || level2Matches
          ? childItems
          : childItems.filter((level3) => matchesSearch([level3.key, level3.label, getItemLabel(level3)]));

        if (!level1Matches && !level2Matches && visibleLevel3.length === 0) return groups;
        groups.push({ ...level2Item, level3: visibleLevel3 });
        return groups;
      }, []);

      if (!level1Matches && level2.length === 0) return sections;
      sections.push({ ...level1, level2 });
      return sections;
    }, []);
  }, [currentMenuStructure, isNavigationSearchActive, normalizedSearchQuery]);

  const activeFlyoutMenu = useMemo(
    () => currentMenuStructure.find((level1) => level1.label === activeFlyoutSection) ?? null,
    [activeFlyoutSection, currentMenuStructure]
  );
  const activeFlyoutGroups = activeFlyoutMenu?.flyoutGroups ?? [];
  const hasGroupedFlyout = activeFlyoutGroups.length > 0;
  const directFlyoutItems = activeFlyoutMenu?.level2.flatMap((level2) => level2.level3 ?? []) ?? [];
  const activeFlyoutGroup = activeFlyoutGroups.find((group) => group.key === activeFlyoutGroupKey) ?? activeFlyoutGroups[0] ?? null;
  const showSidebarUtilities = !sidebarCollapsed && !isMobileOpen && !isNavigationSearchActive;
  const showRecentDocuments = showSidebarUtilities && recentDocuments.length > 0;
  const showFavoriteItems = showSidebarUtilities && resolvedFavoriteItems.length > 0;
  const showBrowseTitle = showSidebarUtilities;

  const clearFlyoutTimers = () => {
    if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    openTimerRef.current = null;
    closeTimerRef.current = null;
  };

  const updateFlyoutPosition = (label: string) => {
    const trigger = level1ButtonRefs.current[label];
    if (!trigger) return;
    const triggerRect = trigger.getBoundingClientRect();
    setFlyoutTop(Math.min(Math.max(triggerRect.top, 56), window.innerHeight - 80));
  };

  const openFlyout = (label: string) => {
    if (!hoverFlyoutEnabled) return;
    const nextFlyoutMenu = currentMenuStructure.find((level1) => level1.label === label);
    lastFlyoutTriggerLabelRef.current = label;
    updateFlyoutPosition(label);
    setActiveFlyoutSection(label);
    setActiveFlyoutGroupKey(nextFlyoutMenu?.flyoutGroups?.[0]?.key ?? null);
  };

  const closeFlyout = (returnFocus = false) => {
    const triggerLabel = lastFlyoutTriggerLabelRef.current;
    clearFlyoutTimers();
    setActiveFlyoutSection(null);
    setActiveFlyoutGroupKey(null);
    setFlyoutTop(null);

    if (returnFocus && triggerLabel && typeof window !== 'undefined') {
      window.requestAnimationFrame(() => level1ButtonRefs.current[triggerLabel]?.focus());
    }

    lastFlyoutTriggerLabelRef.current = null;
  };

  const scheduleFlyoutOpen = (label: string) => {
    if (!hoverFlyoutEnabled) return;
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
    closeTimerRef.current = null;
    openTimerRef.current = window.setTimeout(() => openFlyout(label), 120);
  };

  const scheduleFlyoutClose = () => {
    if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    openTimerRef.current = null;
    closeTimerRef.current = window.setTimeout(() => {
      closeFlyout();
    }, 160);
  };

  const toggleLevel1 = (label: string) => setExpandedLevel1((prev) => ({ ...prev, [label]: !prev[label] }));

  const handleLevel1Click = (label: string) => {
    if (label === 'UI Studio') {
      navigateToHash('#/ui-studio/builder');
      if (isMobileOpen) onCloseMobile();
      return;
    }
    if (sidebarCollapsed) {
      openFlyout(label);
      return;
    }
    toggleLevel1(label);
  };

  const toggleLevel2 = (level1: string, level2: string) => {
    const key = `${level1}_${level2}`;
    setExpandedLevel2((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLeafClick = (item: Level3Item, parentLabel?: string) => {
    const recentRoute = getNavigationRouteForItem(item);
    if (recentRoute) {
      const resolvedParentLabel = parentLabel ?? findMenuBranch(item.key)?.parentLabel ?? 'Navigation';
      setRecentDocuments(recordSidebarRecentDocument({
        documentId: `page:${item.key}`,
        documentNumber: getItemLabel(item),
        moduleKey: item.key,
        moduleLabel: getSectionLabel(resolvedParentLabel),
        partyLabel: 'Page',
        status: '',
        route: recentRoute,
      }));
    }

    if (item.onClick) item.onClick();
    else if (item.externalUrl) window.open(item.externalUrl, item.openInNewTab ? '_blank' : '_self', item.openInNewTab ? 'noopener,noreferrer' : undefined);
    else if (item.route) navigateToHash(`#${item.route}`);
    else if (item.key === 'purchase-requisition') onPurchaseRequisitionClick ? onPurchaseRequisitionClick() : navigateToHash('#/purchase-requisition');
    else if (item.key === 'purchase-order') onPurchaseOrderClick ? onPurchaseOrderClick() : navigateToHash('#/purchase-order');
    else if (item.key === 'purchase-receipt') onPurchaseReceiptClick ? onPurchaseReceiptClick() : navigateToHash('#/purchasereceiptlist');
    else if (item.key === 'purchase-invoice') onPurchaseInvoiceClick ? onPurchaseInvoiceClick() : navigateToHash('#/purchaseinvoicelist');
    else if (item.key === 'sale-order') onSaleOrderClick ? onSaleOrderClick() : navigateToHash('#/sale-order');
    else if (item.key === 'sale-order-v2') onSaleOrderV2Click ? onSaleOrderV2Click() : navigateToHash('#/sale-order-v2');
    else if (item.key === 'sale-allocation-requisition') onSaleAllocationRequisitionClick ? onSaleAllocationRequisitionClick() : navigateToHash('#/sale-allocation-requisition');
    else if (item.key === 'sale-allocation') onSaleAllocationClick ? onSaleAllocationClick() : navigateToHash('#/sale-allocation');
    else if (item.key === 'sale-invoice') onSaleInvoiceClick ? onSaleInvoiceClick() : navigateToHash('#/sale-invoice');
    else if (item.key === 'delivery') onDeliveryClick ? onDeliveryClick() : navigateToHash('#/delivery');
    else if (!parentLabel) navigateToStoredRoute(getSafeRoute(item));

    if (isMobileOpen) onCloseMobile();
    closeFlyout();
  };

  const isMenuItemFavorited = (item: Level3Item, parentLabel: string) =>
    favoriteItems.some((favorite) => favorite.key === item.key && favorite.parentLabel === parentLabel);

  const handleRecentRemove = (event: React.MouseEvent<HTMLButtonElement>, entry: SidebarRecentDocument) => {
    event.preventDefault();
    event.stopPropagation();
    setRecentDocuments(removeSidebarRecentDocument(entry.moduleKey, entry.documentId));
  };

  const handleFavoriteToggle = (event: React.MouseEvent<HTMLButtonElement>, item: Level3Item, parentLabel: string) => {
    event.preventDefault();
    event.stopPropagation();
    setFavoriteItems(toggleSidebarFavoriteItem({ key: item.key, route: getSafeRoute(item), parentLabel, labelFallback: item.label }));
  };

  useEffect(() => {
    const refreshRecentDocuments = () => setRecentDocuments(loadSidebarRecentDocuments());
    const refreshFavoriteItems = () => setFavoriteItems(loadSidebarFavoriteItems());
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === 'app-sidebar-recent-documents:v1') refreshRecentDocuments();
      if (!event.key || event.key === 'app-sidebar-favorite-items:v1') refreshFavoriteItems();
    };
    window.addEventListener(SIDEBAR_RECENT_DOCUMENTS_UPDATED, refreshRecentDocuments);
    window.addEventListener(SIDEBAR_FAVORITE_ITEMS_UPDATED, refreshFavoriteItems);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(SIDEBAR_RECENT_DOCUMENTS_UPDATED, refreshRecentDocuments);
      window.removeEventListener(SIDEBAR_FAVORITE_ITEMS_UPDATED, refreshFavoriteItems);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!hoverFlyoutEnabled) {
      setActiveFlyoutSection(null);
      setActiveFlyoutGroupKey(null);
      setFlyoutTop(null);
    }
  }, [hoverFlyoutEnabled]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (navigationSearchQuery) setNavigationSearchQuery('');
        if (activeFlyoutSection) {
          event.preventDefault();
          closeFlyout(true);
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [activeFlyoutSection, navigationSearchQuery]);

  useEffect(() => () => clearFlyoutTimers(), []);

  const isRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';

  const renderFlyoutHeader = (label: string) => (
    <div className="app-sidebar__flyout-header" aria-hidden="true">
      <span className="app-sidebar__flyout-header-title">{getSectionLabel(label)}</span>
    </div>
  );

  const renderFlyoutItems = (items: Level3Item[]) => (
    <div className="app-sidebar__flyout-list">
      {items.map((item) => (
        <button key={item.key} type="button" onClick={() => handleLeafClick(item, activeFlyoutMenu?.label)} className={cn('app-sidebar__flyout-item', item.key === activeLeaf && 'app-sidebar__flyout-item--active')} role="menuitem">
          <span className="app-sidebar__flyout-item-icon" aria-hidden="true">{item.icon ? <item.icon size={15} strokeWidth={1.9} /> : <FileText size={15} strokeWidth={1.9} />}</span>
          <span className="app-sidebar__flyout-item-label">{getItemLabel(item)}</span>
        </button>
      ))}
    </div>
  );

  const renderFlyoutGroups = (groups: FlyoutGroupItem[]) => (
    <div className="app-sidebar__flyout-list">
      {groups.map((group) => {
        const isActive = group.key === activeFlyoutGroupKey;
        return (
          <button key={group.key} type="button" className={cn('app-sidebar__flyout-group-button', isActive && 'app-sidebar__flyout-group-button--active')} onMouseEnter={() => setActiveFlyoutGroupKey(group.key)} onFocus={() => setActiveFlyoutGroupKey(group.key)} aria-haspopup="menu" aria-expanded={isActive} role="menuitem">
            <span className="app-sidebar__flyout-item-icon" aria-hidden="true">{group.icon ? <group.icon size={15} strokeWidth={1.9} /> : <FileText size={15} strokeWidth={1.9} />}</span>
            <span className="app-sidebar__flyout-item-label">{getSectionLabel(group.label)}</span>
            <ChevronRight size={14} strokeWidth={2} className="app-sidebar__flyout-group-arrow" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );

  const renderBottomLauncher = () => (
    <div className="app-sidebar__bottom-launcher" data-tooltip="Excellon Basket" aria-label="Excellon Basket">
      <span className="app-sidebar__launcher-mark" aria-hidden="true">
        {Array.from({ length: 9 }).map((_, index) => <span key={index} />)}
      </span>
    </div>
  );

  const flyoutPortal =
    typeof document !== 'undefined' && hoverFlyoutEnabled && activeFlyoutMenu && flyoutTop !== null
      ? createPortal(
          <div
            ref={flyoutRef}
            className={cn('app-sidebar__flyout', hasGroupedFlyout && 'app-sidebar__flyout--cascade')}
            style={{
              top: `${flyoutTop}px`,
              ...(hasGroupedFlyout ? {} : { width: COLLAPSED_FLYOUT_WIDTH }),
              ...(isRtl ? { right: `calc(5rem + ${COLLAPSED_FLYOUT_GAP}px)` } : { left: `calc(5rem + ${COLLAPSED_FLYOUT_GAP}px)` }),
            }}
            onMouseEnter={() => {
              if (closeTimerRef.current) {
                window.clearTimeout(closeTimerRef.current);
                closeTimerRef.current = null;
              }
            }}
            onMouseLeave={scheduleFlyoutClose}
            role="menu"
            aria-label={`${getSectionLabel(activeFlyoutMenu.label)} navigation`}
          >
            {hasGroupedFlyout ? (
              <>
                <div className="app-sidebar__flyout-panel">
                  {renderFlyoutHeader(activeFlyoutMenu.label)}
                  <div className="app-sidebar__flyout-scroll">{renderFlyoutGroups(activeFlyoutGroups)}</div>
                </div>
                {activeFlyoutGroup && (
                  <div className="app-sidebar__flyout-panel app-sidebar__flyout-panel--child">
                    {renderFlyoutHeader(activeFlyoutGroup.label)}
                    <div className="app-sidebar__flyout-scroll">{renderFlyoutItems(activeFlyoutGroup.items)}</div>
                  </div>
                )}
              </>
            ) : (
              <>
                {renderFlyoutHeader(activeFlyoutMenu.label)}
                <div className="app-sidebar__flyout-scroll">{renderFlyoutItems(directFlyoutItems)}</div>
              </>
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <aside className={cn('app-sidebar', sidebarCollapsed && 'app-sidebar--collapsed', isMobileOpen && 'app-sidebar--mobile-open')}>
        {!sidebarCollapsed && !isMobileOpen && (
          <div className="app-sidebar__search">
            <div className="app-sidebar__search-shell">
              <Search size={15} className="app-sidebar__search-icon" aria-hidden="true" />
              <input
                type="search"
                className="app-sidebar__search-input"
                value={navigationSearchQuery}
                placeholder="Search navigation"
                aria-label="Search navigation"
                onChange={(event) => setNavigationSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape' && navigationSearchQuery) {
                    event.preventDefault();
                    setNavigationSearchQuery('');
                  }
                }}
              />
              {navigationSearchQuery && (
                <button type="button" className="app-sidebar__search-clear" aria-label="Clear navigation search" onClick={() => setNavigationSearchQuery('')}>
                  <X size={13} strokeWidth={2.2} />
                </button>
              )}
            </div>
          </div>
        )}

        <nav className="app-sidebar__nav" aria-label="Primary navigation">
          {showRecentDocuments && (
            <section className="app-sidebar__recent" aria-label="Recent entries">
              <div className="app-sidebar__recent-title">Recent</div>
              <div className="app-sidebar__recent-list">
                {recentDocuments.map((entry) => {
                  const branch = findMenuBranch(entry.moduleKey);
                  const RecentIcon = branch?.item.icon ?? FileText;
                  return (
                    <div key={`${entry.moduleKey}-${entry.documentId}`} className="app-sidebar__recent-row">
                      <button type="button" className="app-sidebar__recent-item" title={`${entry.documentNumber} - ${entry.moduleLabel}`} onClick={() => navigateToStoredRoute(entry.route)}>
                        <span className="app-sidebar__recent-icon" aria-hidden="true"><RecentIcon size={15} strokeWidth={1.9} /></span>
                        <span className="app-sidebar__recent-copy">
                          <span className="app-sidebar__recent-primary"><span>{entry.documentNumber}</span>{entry.status && <span className="app-sidebar__recent-status">{entry.status}</span>}</span>
                          <span className="app-sidebar__recent-secondary">{[entry.moduleLabel, entry.partyLabel || 'Module page'].filter(Boolean).join(' - ')}</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        className="app-sidebar__recent-remove"
                        aria-label={`Remove ${entry.documentNumber} from recent`}
                        title="Remove from recent"
                        onClick={(event) => handleRecentRemove(event, entry)}
                      >
                        <X size={13} strokeWidth={2.2} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {showFavoriteItems && (
            <section className="app-sidebar__favorites" aria-label="Favorite navigation items">
              <div className="app-sidebar__favorites-title">Favorites</div>
              <div className="app-sidebar__favorite-list">
                {resolvedFavoriteItems.map((favorite) => {
                  const FavoriteIcon = favorite.item.icon ?? FileText;
                  return (
                    <div key={`${favorite.parentLabel}-${favorite.key}`} className="app-sidebar__favorite-row">
                      <button type="button" className="app-sidebar__favorite-item" onClick={() => handleLeafClick(favorite.item, favorite.parentLabel)}>
                        <span className="app-sidebar__favorite-icon" aria-hidden="true"><FavoriteIcon size={15} strokeWidth={1.9} /></span>
                        <span className="app-sidebar__favorite-copy"><span className="app-sidebar__favorite-primary">{getItemLabel(favorite.item)}</span><span className="app-sidebar__favorite-secondary">{getSectionLabel(favorite.parentLabel)}</span></span>
                      </button>
                      <button type="button" className="app-sidebar__favorite-action app-sidebar__favorite-action--active" aria-label={`Remove ${getItemLabel(favorite.item)} from favorites`} onClick={(event) => handleFavoriteToggle(event, favorite.item, favorite.parentLabel)}>
                        <Star size={14} fill="currentColor" strokeWidth={2} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {isNavigationSearchActive && visibleMenuStructure.length === 0 ? (
            <div className="app-sidebar__search-empty">No matching navigation items</div>
          ) : (
            <>
              {showBrowseTitle && <div className="app-sidebar__browse-title">Browse</div>}
              {visibleMenuStructure.map((level1) => {
                const isLevel1Expanded = isNavigationSearchActive || expandedLevel1[level1.label];
                const isLevel1Active = activeLevel1Label === level1.label;
                return (
                  <div key={level1.label} className="app-sidebar__group">
                    <button
                      type="button"
                      onClick={() => handleLevel1Click(level1.label)}
                      onMouseEnter={() => activeFlyoutSection === level1.label ? updateFlyoutPosition(level1.label) : scheduleFlyoutOpen(level1.label)}
                      onMouseLeave={() => hoverFlyoutEnabled && scheduleFlyoutClose()}
                      onFocus={() => scheduleFlyoutOpen(level1.label)}
                      ref={(element) => { level1ButtonRefs.current[level1.label] = element; }}
                      className={cn(
                        'app-sidebar__level1',
                        sidebarCollapsed && 'app-sidebar__level1--collapsed',
                        sidebarCollapsed && isLevel1Active && 'app-sidebar__level1--active',
                        isLevel1Expanded && !sidebarCollapsed && 'app-sidebar__level1--expanded',
                        activeFlyoutSection === level1.label && 'app-sidebar__level1--flyout-open'
                      )}
                      aria-expanded={sidebarCollapsed ? activeFlyoutSection === level1.label : isLevel1Expanded}
                      title={sidebarCollapsed ? getSectionLabel(level1.label) : undefined}
                    >
                      {!sidebarCollapsed && <ChevronDown size={16} className={cn('app-sidebar__chevron', !isLevel1Expanded && 'app-sidebar__chevron--collapsed')} />}
                      {!sidebarCollapsed ? <span>{getSectionLabel(level1.label)}</span> : level1.icon ? <level1.icon size={18} strokeWidth={1.9} aria-hidden="true" /> : <span className="app-sidebar__collapsed-label">{getSectionLabel(level1.label).charAt(0)}</span>}
                    </button>

                    {!sidebarCollapsed && isLevel1Expanded && (
                      <div className="app-sidebar__level2-wrap">
                        {level1.level2.map((level2) => {
                          const level2Key = `${level1.label}_${level2.label}`;
                          const isLevel2Expanded = isNavigationSearchActive || expandedLevel2[level2Key];
                          const hasLevel3 = Boolean(level2.level3?.length);
                          const shouldFlattenLevel2 = level2.hideLabel && hasLevel3;
                          return (
                            <div key={level2Key}>
                              {!shouldFlattenLevel2 && (
                                <button type="button" onClick={() => hasLevel3 && !isNavigationSearchActive && toggleLevel2(level1.label, level2.label)} className={cn('app-sidebar__level2', hasLevel3 && isLevel2Expanded && 'app-sidebar__level2--expanded')} aria-expanded={hasLevel3 ? isLevel2Expanded : undefined}>
                                  {hasLevel3 ? <ChevronDown size={14} className={cn('app-sidebar__chevron app-sidebar__chevron--small', !isLevel2Expanded && 'app-sidebar__chevron--collapsed')} /> : <span className="app-sidebar__level2-spacer" />}
                                  <span>{getSectionLabel(level2.label)}</span>
                                </button>
                              )}

                              {hasLevel3 && (shouldFlattenLevel2 || isLevel2Expanded) && (
                                <div className="app-sidebar__level3-wrap">
                                  {level2.level3?.map((level3) => {
                                    const isFavorited = isMenuItemFavorited(level3, level1.label);
                                    const Level3Icon = level3.icon;
                                    return (
                                      <div key={level3.key} className={cn('app-sidebar__level3-row', isFavorited && 'app-sidebar__level3-row--favorited')}>
                                        <button type="button" onClick={() => handleLeafClick(level3, level1.label)} className={cn('app-sidebar__level3', level3.key === activeLeaf && 'app-sidebar__level3--active')}>
                                          {Level3Icon && <Level3Icon size={15} strokeWidth={1.9} aria-hidden="true" />}
                                          <span>{getItemLabel(level3)}</span>
                                        </button>
                                        <button type="button" className={cn('app-sidebar__favorite-action', isFavorited && 'app-sidebar__favorite-action--active')} aria-label={`${isFavorited ? 'Remove' : 'Add'} ${getItemLabel(level3)} ${isFavorited ? 'from' : 'to'} favorites`} onClick={(event) => handleFavoriteToggle(event, level3, level1.label)}>
                                          <Star size={14} fill={isFavorited ? 'currentColor' : 'none'} strokeWidth={2} />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </nav>

        {renderBottomLauncher()}
      </aside>
      {flyoutPortal}
    </>
  );
};

export default AppSidebar;