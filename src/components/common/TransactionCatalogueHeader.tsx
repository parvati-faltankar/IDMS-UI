import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import CatalogueViewSelector from './CatalogueViewSelector';
import type { CatalogueViewSelectorItem } from './CatalogueViewSelector';
import { cn } from '../../utils/classNames';

interface TransactionCatalogueHeaderViewSelector {
  items: CatalogueViewSelectorItem[];
  activeViewId: string;
  activeCount: number;
  onSelect: (viewId: string) => void;
  onTogglePin: (viewId: string) => void;
  onOpenConfigurator: () => void;
}

interface TransactionCatalogueHeaderSearch {
  value: string;
  placeholder?: string;
  ariaLabel: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}

interface TransactionCatalogueHeaderViewMode {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

interface TransactionCatalogueHeaderFilter {
  label?: string;
  ariaLabel: string;
  activeCount?: number;
  icon?: React.ElementType;
  onClick: () => void;
}

interface TransactionCatalogueHeaderPrimaryAction {
  label: string;
  ariaLabel?: string;
  icon?: React.ElementType;
  onClick: () => void;
  dataTour?: string;
  hideOnMobile?: boolean;
  moveToBottomBarOnCompact?: boolean;
}

interface TransactionCatalogueHeaderProps {
  viewSelector?: TransactionCatalogueHeaderViewSelector;
  fallbackTitle?: string;
  count?: number;
  titleDataTour?: string;
  search?: TransactionCatalogueHeaderSearch;
  viewModes?: TransactionCatalogueHeaderViewMode[];
  activeViewMode?: string;
  onViewModeChange?: (viewModeId: string) => void;
  filter?: TransactionCatalogueHeaderFilter;
  primaryAction?: TransactionCatalogueHeaderPrimaryAction;
}

const TransactionCatalogueHeader: React.FC<TransactionCatalogueHeaderProps> = ({
  viewSelector,
  fallbackTitle = 'Catalogue',
  count,
  titleDataTour,
  search,
  viewModes = [],
  activeViewMode,
  onViewModeChange,
  filter,
  primaryAction,
}) => {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileOverflowOpen, setIsMobileOverflowOpen] = useState(false);
  const hasActiveFilters = Boolean(filter?.activeCount && filter.activeCount > 0);
  const showViewModes = viewModes.length > 0 && Boolean(activeViewMode && onViewModeChange);
  const PrimaryIcon = primaryAction?.icon;
  const FilterIcon = filter?.icon;

  const handleSearchClear = () => {
    if (!search) {
      return;
    }

    if (search.onClear) {
      search.onClear();
      return;
    }

    search.onChange('');
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Escape' || !search) {
      return;
    }

    if (search.value) {
      handleSearchClear();
      return;
    }

    setIsMobileSearchOpen(false);
  };

  const renderSearch = (variant: 'desktop' | 'mobile') => {
    if (!search) {
      return null;
    }

    return (
      <div className={cn('transaction-catalogue-header__search', `transaction-catalogue-header__search--${variant}`)}>
        <Search size={16} className="transaction-catalogue-header__search-icon" />
        <input
          type="search"
          value={search.value}
          onChange={(event) => search.onChange(event.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder={search.placeholder ?? 'Search...'}
          className="search-input transaction-catalogue-header__search-input"
          aria-label={search.ariaLabel}
        />
        {search.value && (
          <button
            type="button"
            className="transaction-catalogue-header__search-clear"
            onClick={handleSearchClear}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>
    );
  };

  const renderViewModes = (variant: 'desktop' | 'mobile') => {
    if (!showViewModes) {
      return null;
    }

    return (
      <div className={cn('transaction-catalogue-header__view-toggle', `transaction-catalogue-header__view-toggle--${variant}`)} role="group" aria-label="Catalogue view mode">
        {viewModes.map((viewMode) => {
          const ViewModeIcon = viewMode.icon;
          const isActive = activeViewMode === viewMode.id;

          return (
            <button
              key={viewMode.id}
              type="button"
              onClick={() => {
                onViewModeChange?.(viewMode.id);
                setIsMobileOverflowOpen(false);
              }}
              className={cn('transaction-catalogue-header__view-toggle-button', isActive && 'transaction-catalogue-header__view-toggle-button--active')}
              data-view-mode-id={viewMode.id}
              aria-label={viewMode.description}
              aria-pressed={isActive}
              title={viewMode.label}
            >
              <ViewModeIcon size={16} />
              <span className="transaction-catalogue-header__view-toggle-label">{viewMode.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <header className="transaction-catalogue-header">
      <div className="transaction-catalogue-header__inner">
        <div className="transaction-catalogue-header__top">
          <div className="transaction-catalogue-header__title-zone" data-tour={titleDataTour}>
            {viewSelector ? (
              <CatalogueViewSelector
                items={viewSelector.items}
                activeViewId={viewSelector.activeViewId}
                activeCount={viewSelector.activeCount}
                onSelect={viewSelector.onSelect}
                onTogglePin={viewSelector.onTogglePin}
                onOpenConfigurator={viewSelector.onOpenConfigurator}
              />
            ) : (
              <div className="transaction-catalogue-header__fallback-title">
                <h2 className="brand-page-title">{fallbackTitle}</h2>
                {typeof count === 'number' && <span className="transaction-catalogue-header__count">{count}</span>}
              </div>
            )}
          </div>

          <div className="transaction-catalogue-header__actions transaction-catalogue-header__actions--desktop">
            <div className="transaction-catalogue-header__utility-group">
              {renderSearch('desktop')}
              {renderViewModes('desktop')}
            </div>

            <div className="transaction-catalogue-header__primary-group">
              {filter && (
                <button
                  type="button"
                  onClick={filter.onClick}
                  className={cn('btn btn--outline btn--icon-left transaction-catalogue-header__filter', hasActiveFilters && 'transaction-catalogue-header__filter--active')}
                  aria-label={filter.ariaLabel}
                >
                  {FilterIcon && <FilterIcon size={16} />}
                  <span className="transaction-catalogue-header__filter-label">{filter.label ?? 'Filters'}</span>
                  {hasActiveFilters && <span className="transaction-catalogue-header__filter-badge">{filter.activeCount}</span>}
                </button>
              )}

              {primaryAction && (
                <button
                  type="button"
                  onClick={primaryAction.onClick}
                  className={cn(
                    'btn btn--primary btn--icon-left transaction-catalogue-header__primary',
                    primaryAction.moveToBottomBarOnCompact && 'transaction-catalogue-header__primary--hide-on-compact'
                  )}
                  aria-label={primaryAction.ariaLabel}
                  data-tour={primaryAction.dataTour}
                >
                  {PrimaryIcon && <PrimaryIcon size={16} />}
                  {primaryAction.label}
                </button>
              )}
            </div>
          </div>

          <div className="transaction-catalogue-header__actions transaction-catalogue-header__actions--mobile">
            {search && (
              <button
                type="button"
                className="transaction-catalogue-header__mobile-icon-button"
                onClick={() => {
                  setIsMobileSearchOpen((current) => !current);
                  setIsMobileOverflowOpen(false);
                }}
                aria-label={isMobileSearchOpen ? 'Close search' : search.ariaLabel}
                aria-expanded={isMobileSearchOpen}
              >
                {isMobileSearchOpen ? <X size={17} /> : <Search size={17} />}
              </button>
            )}

            {filter && (
              <button
                type="button"
                className={cn('transaction-catalogue-header__mobile-icon-button', hasActiveFilters && 'transaction-catalogue-header__mobile-icon-button--active')}
                onClick={filter.onClick}
                aria-label={filter.ariaLabel}
              >
                {FilterIcon && <FilterIcon size={17} />}
                {hasActiveFilters && <span className="transaction-catalogue-header__mobile-badge">{filter.activeCount}</span>}
              </button>
            )}

            {primaryAction && !primaryAction.hideOnMobile && (
              <button
                type="button"
                className="transaction-catalogue-header__mobile-primary"
                onClick={primaryAction.onClick}
                aria-label={primaryAction.ariaLabel ?? primaryAction.label}
                data-tour={primaryAction.dataTour}
              >
                {PrimaryIcon && <PrimaryIcon size={16} />}
                <span>{primaryAction.label}</span>
              </button>
            )}
          </div>
        </div>

        {search && isMobileSearchOpen && (
          <div className="transaction-catalogue-header__mobile-search-row">
            {renderSearch('mobile')}
          </div>
        )}

        {showViewModes && isMobileOverflowOpen && (
          <div className="transaction-catalogue-header__mobile-overflow">
            <span className="transaction-catalogue-header__mobile-overflow-label">View mode</span>
            {renderViewModes('mobile')}
          </div>
        )}
      </div>
    </header>
  );
};

export default TransactionCatalogueHeader;

