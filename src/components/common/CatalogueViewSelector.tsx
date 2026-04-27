import React, { useMemo, useState } from 'react';
import Popover from '@mui/material/Popover';
import Tooltip from '@mui/material/Tooltip';
import { Check, ChevronDown, Pin, Settings2, Sparkles } from 'lucide-react';
import { cn } from '../../utils/classNames';

export interface CatalogueViewSelectorItem {
  id: string;
  name: string;
  kind: 'system' | 'custom';
  count: number;
  isPinned: boolean;
}

interface CatalogueViewSelectorProps {
  items: CatalogueViewSelectorItem[];
  activeViewId: string;
  activeCount: number;
  onSelect: (viewId: string) => void;
  onTogglePin: (viewId: string) => void;
  onOpenConfigurator: () => void;
}

const CatalogueViewSelector: React.FC<CatalogueViewSelectorProps> = ({
  items,
  activeViewId,
  activeCount,
  onSelect,
  onTogglePin,
  onOpenConfigurator,
}) => {
  const [anchorElement, setAnchorElement] = useState<HTMLButtonElement | null>(null);
  const isOpen = Boolean(anchorElement);
  const activeItem = useMemo(
    () => items.find((item) => item.id === activeViewId) ?? items[0],
    [activeViewId, items]
  );

  return (
    <div className="catalogue-view-selector">
      <div className="catalogue-toolbar__title-row">
        <button
          type="button"
          className={cn('catalogue-toolbar__title-button', 'catalogue-view-selector__trigger')}
          aria-label="Select catalogue view"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={(event) => setAnchorElement(event.currentTarget)}
        >
          <h2 className="brand-page-title">{activeItem?.name ?? 'Catalogue view'}</h2>
          <ChevronDown size={16} className={cn('catalogue-view-selector__chevron', isOpen && 'catalogue-view-selector__chevron--open')} />
        </button>
        <span className="catalogue-toolbar__count">{activeCount}</span>
      </div>

      <Popover
        open={isOpen}
        anchorEl={anchorElement}
        onClose={() => setAnchorElement(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { className: 'catalogue-view-selector__popover' } }}
      >
        <div className="catalogue-view-selector__panel">
          <div className="catalogue-view-selector__panel-header">
            <div>
              <strong>Catalogue views</strong>
              <span>Switch between system and saved views.</span>
            </div>
          </div>

          <div className="catalogue-view-selector__list" role="listbox" aria-label="Catalogue views">
            {items.map((item) => {
              const isActive = item.id === activeViewId;

              return (
                <div
                  key={item.id}
                  className={cn('catalogue-view-selector__item', isActive && 'catalogue-view-selector__item--active')}
                  role="option"
                  aria-selected={isActive}
                >
                  <button
                    type="button"
                    className="catalogue-view-selector__item-select"
                    onClick={() => {
                      onSelect(item.id);
                      setAnchorElement(null);
                    }}
                  >
                    <span className="catalogue-view-selector__item-main">
                      <span className="catalogue-view-selector__item-title-row">
                        <span className="catalogue-view-selector__item-title">{item.name}</span>
                        {isActive && <Check size={14} className="catalogue-view-selector__item-check" />}
                      </span>
                      <span className="catalogue-view-selector__item-meta">
                        <span className="catalogue-view-selector__item-count">{item.count}</span>
                        <span className="catalogue-view-selector__item-type">
                          {item.kind === 'system' ? 'System' : 'Custom'}
                        </span>
                        {item.isPinned && (
                          <span className="catalogue-view-selector__item-pin-label">
                            <Pin size={12} />
                            Default
                          </span>
                        )}
                      </span>
                    </span>
                  </button>

                  <Tooltip title={item.isPinned ? 'Unpin default view' : 'Pin as default view'} arrow placement="top">
                    <span className="catalogue-view-selector__pin-wrap">
                      <button
                        type="button"
                        className={cn('catalogue-view-selector__pin-button', item.isPinned && 'catalogue-view-selector__pin-button--active')}
                        aria-label={item.isPinned ? `Unpin ${item.name}` : `Pin ${item.name} as default`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onTogglePin(item.id);
                        }}
                      >
                        <Pin size={14} />
                      </button>
                    </span>
                  </Tooltip>
                </div>
              );
            })}
          </div>

          <div className="catalogue-view-selector__footer">
            <button
              type="button"
              className="catalogue-view-selector__manage-button"
              onClick={() => {
                setAnchorElement(null);
                onOpenConfigurator();
              }}
            >
              <Sparkles size={14} />
              Configure views
              <Settings2 size={14} />
            </button>
          </div>
        </div>
      </Popover>
    </div>
  );
};

export default CatalogueViewSelector;
