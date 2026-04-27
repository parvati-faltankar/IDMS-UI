import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Pin,
  PinOff,
  RotateCcw,
  Rows3,
} from 'lucide-react';
import type { SortDirection, SortState } from '../../utils/sortState';
import { cn } from '../../utils/classNames';

export type TableColumnDataType = 'text' | 'number' | 'date' | 'status';

export interface TableColumnAggregation {
  count?: string;
  sum?: string;
  average?: string;
  min?: string;
  max?: string;
}

interface SortableTableHeaderProps<TKey extends string> {
  label: string;
  sortKey: TKey;
  sortState: SortState<TKey>;
  onSortChange: (key: TKey, direction: SortDirection | null) => void;
  sortable?: boolean;
  className?: string;
  style?: CSSProperties;
  dataType?: TableColumnDataType;
  aggregation?: TableColumnAggregation;
  menuLabel?: string;
  canGroup?: boolean;
  isGrouped?: boolean;
  onGroupToggle?: (key: TKey) => void;
  canPin?: boolean;
  pinState?: 'left' | 'right' | null;
  onPinChange?: (key: TKey, side: 'left' | 'right' | null) => void;
  canHide?: boolean;
  onHide?: (key: TKey) => void;
  onReset?: (key: TKey) => void;
  resizeHandle?: ReactNode;
}

const SortableTableHeader = <TKey extends string,>({
  label,
  sortKey,
  sortState,
  onSortChange,
  sortable = true,
  className,
  style,
  dataType = 'text',
  aggregation,
  menuLabel,
  canGroup = false,
  isGrouped = false,
  onGroupToggle,
  canPin = false,
  pinState = null,
  onPinChange,
  canHide = false,
  onHide,
  onReset,
  resizeHandle,
}: SortableTableHeaderProps<TKey>) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; maxHeight: number }>({
    top: 0,
    left: 0,
    maxHeight: 320,
  });
  const menuContentRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const isActive = sortable && sortState?.key === sortKey;
  const ariaSort = sortable ? (!isActive ? 'none' : sortState.direction === 'asc' ? 'ascending' : 'descending') : undefined;

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const updatePosition = () => {
      const triggerBounds = triggerRef.current?.getBoundingClientRect();
      if (!triggerBounds) {
        return;
      }

      const viewportPadding = 12;
      const menuWidth = menuContentRef.current?.offsetWidth ?? 248;
      const nextTop = triggerBounds.bottom + 8;
      const availableHeight = Math.max(160, window.innerHeight - nextTop - viewportPadding);
      const preferredLeft = triggerBounds.right - menuWidth;
      const nextLeft = Math.min(
        window.innerWidth - menuWidth - viewportPadding,
        Math.max(viewportPadding, preferredLeft)
      );

      setMenuPosition({
        top: nextTop,
        left: nextLeft,
        maxHeight: availableHeight,
      });
    };

    updatePosition();
    const rafId = window.requestAnimationFrame(updatePosition);

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuContentRef.current &&
        !menuContentRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isMenuOpen]);

  const availableAggregations = useMemo(() => {
    if (!aggregation) {
      return [];
    }

    return [
      aggregation.count ? { label: 'Count', value: aggregation.count } : null,
      dataType === 'number' && aggregation.sum ? { label: 'Sum', value: aggregation.sum } : null,
      dataType === 'number' && aggregation.average ? { label: 'Average', value: aggregation.average } : null,
      dataType === 'number' && aggregation.min ? { label: 'Minimum', value: aggregation.min } : null,
      dataType === 'number' && aggregation.max ? { label: 'Maximum', value: aggregation.max } : null,
    ].filter((item): item is { label: string; value: string } => Boolean(item));
  }, [aggregation, dataType]);

  const sortLabels = useMemo(() => {
    if (dataType === 'text' || dataType === 'status') {
      return {
        ascending: 'Sort A-Z',
        descending: 'Sort Z-A',
      };
    }

    return {
      ascending: 'Sort ascending',
      descending: 'Sort descending',
    };
  }, [dataType]);

  const handleSortAction = (direction: SortDirection | null) => {
    if (!sortable) {
      return;
    }

    onSortChange(sortKey, direction);
    setIsMenuOpen(false);
  };

  const handleGroupToggle = () => {
    if (!onGroupToggle) {
      return;
    }

    onGroupToggle(sortKey);
    setIsMenuOpen(false);
  };

  const handlePinAction = (side: 'left' | 'right' | null) => {
    if (!onPinChange) {
      return;
    }

    onPinChange(sortKey, side);
    setIsMenuOpen(false);
  };

  const handleHideColumn = () => {
    if (!onHide) {
      return;
    }

    onHide(sortKey);
    setIsMenuOpen(false);
  };

  const handleResetColumn = () => {
    if (!onReset) {
      return;
    }

    onReset(sortKey);
    setIsMenuOpen(false);
  };

  return (
    <th aria-sort={ariaSort} className={className} style={style}>
      <div className="catalogue-table__header-shell">
        <span className={cn('catalogue-table__header-label', isActive && 'catalogue-table__header-label--active')}>
          {label}
        </span>

        <div className="catalogue-column-menu">
          <button
            ref={triggerRef}
            type="button"
            className={cn(
              'catalogue-column-menu__trigger',
              isMenuOpen && 'catalogue-column-menu__trigger--open',
              isActive && 'catalogue-column-menu__trigger--active'
            )}
            aria-label={menuLabel ?? `Column options for ${label}`}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <MoreVertical size={14} />
          </button>

          {isMenuOpen &&
            createPortal(
              <div
                ref={menuContentRef}
                className="catalogue-column-menu__content"
                role="menu"
                aria-label={`${label} column actions`}
                style={{
                  position: 'fixed',
                  top: `${menuPosition.top}px`,
                  left: `${menuPosition.left}px`,
                  maxHeight: `${menuPosition.maxHeight}px`,
                  overflowY: 'auto',
                }}
              >
                {sortable && (
                  <div className="catalogue-column-menu__section">
                    <div className="catalogue-column-menu__section-title">Sort</div>
                    <button
                      type="button"
                      className={cn(
                        'catalogue-column-menu__item',
                        isActive && sortState?.direction === 'asc' && 'catalogue-column-menu__item--active'
                      )}
                      role="menuitem"
                      onClick={() => handleSortAction('asc')}
                    >
                      <span className="catalogue-column-menu__item-label">{sortLabels.ascending}</span>
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      className={cn(
                        'catalogue-column-menu__item',
                        isActive && sortState?.direction === 'desc' && 'catalogue-column-menu__item--active'
                      )}
                      role="menuitem"
                      onClick={() => handleSortAction('desc')}
                    >
                      <span className="catalogue-column-menu__item-label">{sortLabels.descending}</span>
                      <ChevronDown size={14} />
                    </button>
                    {isActive && (
                      <button
                        type="button"
                        className="catalogue-column-menu__item"
                        role="menuitem"
                        onClick={() => handleSortAction(null)}
                      >
                        <span className="catalogue-column-menu__item-label">Clear sort</span>
                        <RotateCcw size={14} />
                      </button>
                    )}
                  </div>
                )}

                {availableAggregations.length > 0 && (
                  <div className="catalogue-column-menu__section">
                    <div className="catalogue-column-menu__section-title">Current view</div>
                    <div className="catalogue-column-menu__metrics" role="presentation">
                      {availableAggregations.map((item) => (
                        <div key={item.label} className="catalogue-column-menu__metric">
                          <span>{item.label}</span>
                          <strong>{item.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(canGroup || canPin) && (
                  <div className="catalogue-column-menu__section">
                    <div className="catalogue-column-menu__section-title">Arrange</div>
                    {canGroup && onGroupToggle && (
                      <button
                        type="button"
                        className={cn('catalogue-column-menu__item', isGrouped && 'catalogue-column-menu__item--active')}
                        role="menuitem"
                        onClick={handleGroupToggle}
                      >
                        <span className="catalogue-column-menu__item-label">
                          {isGrouped ? 'Ungroup column' : 'Group by this column'}
                        </span>
                        <Rows3 size={14} />
                      </button>
                    )}

                    {canPin && onPinChange && (
                      <>
                        <button
                          type="button"
                          className={cn(
                            'catalogue-column-menu__item',
                            pinState === 'left' && 'catalogue-column-menu__item--active'
                          )}
                          role="menuitem"
                          onClick={() => handlePinAction('left')}
                        >
                          <span className="catalogue-column-menu__item-label">Pin column left</span>
                          <Pin size={14} />
                        </button>
                        <button
                          type="button"
                          className={cn(
                            'catalogue-column-menu__item',
                            pinState === 'right' && 'catalogue-column-menu__item--active'
                          )}
                          role="menuitem"
                          onClick={() => handlePinAction('right')}
                        >
                          <span className="catalogue-column-menu__item-label">Pin column right</span>
                          <Pin size={14} />
                        </button>
                        {pinState && (
                          <button
                            type="button"
                            className="catalogue-column-menu__item"
                            role="menuitem"
                            onClick={() => handlePinAction(null)}
                          >
                            <span className="catalogue-column-menu__item-label">Unpin column</span>
                            <PinOff size={14} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}

                {(canHide || onReset) && (
                  <div className="catalogue-column-menu__section">
                    <div className="catalogue-column-menu__section-title">Column</div>
                    {canHide && onHide && (
                      <button
                        type="button"
                        className="catalogue-column-menu__item"
                        role="menuitem"
                        onClick={handleHideColumn}
                      >
                        <span className="catalogue-column-menu__item-label">Hide column</span>
                      </button>
                    )}
                    {onReset && (
                      <button
                        type="button"
                        className="catalogue-column-menu__item"
                        role="menuitem"
                        onClick={handleResetColumn}
                      >
                        <span className="catalogue-column-menu__item-label">Reset column</span>
                      </button>
                    )}
                  </div>
                )}
              </div>,
              document.body
            )}
        </div>
        {resizeHandle}
      </div>
    </th>
  );
};

export default SortableTableHeader;
