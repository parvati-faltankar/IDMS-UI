import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import { cn } from '../../utils/classNames';

export interface DataGridRowActionMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  tone?: 'default' | 'danger';
  onSelect: () => void;
}

interface DataGridRowActionMenuProps {
  triggerLabel: string;
  menuLabel: string;
  actions: DataGridRowActionMenuItem[];
}

interface MenuPosition {
  top: number;
  left: number;
  maxHeight: number;
}

const viewportPadding = 8;
const triggerGap = 8;
const fallbackMenuWidth = 164;
const fallbackMenuHeight = 180;

function normalizeMenuIndex(index: number, length: number): number {
  return ((index % length) + length) % length;
}

const DataGridRowActionMenu: React.FC<DataGridRowActionMenuProps> = ({
  triggerLabel,
  menuLabel,
  actions,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const initialFocusRef = useRef<'first' | 'last'>('first');

  const enabledActions = actions.filter((action) => !action.disabled);

  const getEnabledMenuItems = useCallback(() => {
    if (!menuRef.current) {
      return [] as HTMLButtonElement[];
    }

    return Array.from(menuRef.current.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'))
      .filter((item) => !item.disabled);
  }, []);

  const focusMenuItem = useCallback((index: number) => {
    const menuItems = getEnabledMenuItems();
    if (menuItems.length === 0) {
      return;
    }

    menuItems[normalizeMenuIndex(index, menuItems.length)]?.focus();
  }, [getEnabledMenuItems]);

  const updateMenuPosition = useCallback(() => {
    const triggerNode = triggerRef.current;
    if (!triggerNode || typeof window === 'undefined') {
      return;
    }

    const triggerRect = triggerNode.getBoundingClientRect();
    const menuNode = menuRef.current;
    const menuWidth = menuNode?.offsetWidth || fallbackMenuWidth;
    const menuHeight = menuNode?.offsetHeight || fallbackMenuHeight;
    const availableBelow = window.innerHeight - triggerRect.bottom - triggerGap - viewportPadding;
    const shouldOpenAbove = availableBelow < menuHeight && triggerRect.top > availableBelow;
    const top = shouldOpenAbove
      ? Math.max(viewportPadding, triggerRect.top - triggerGap - menuHeight)
      : Math.min(triggerRect.bottom + triggerGap, window.innerHeight - viewportPadding);
    const left = Math.max(
      viewportPadding,
      Math.min(triggerRect.right - menuWidth, window.innerWidth - menuWidth - viewportPadding)
    );
    const maxHeight = Math.max(120, window.innerHeight - top - viewportPadding);

    setMenuPosition({ top, left, maxHeight });
  }, []);

  const closeMenu = useCallback((restoreFocus = false) => {
    setIsOpen(false);
    setMenuPosition(null);
    if (restoreFocus) {
      window.setTimeout(() => triggerRef.current?.focus(), 0);
    }
  }, []);

  const openMenu = useCallback((focusTarget: 'first' | 'last' = 'first') => {
    if (enabledActions.length === 0) {
      return;
    }

    initialFocusRef.current = focusTarget;
    setIsOpen(true);
  }, [enabledActions.length]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    updateMenuPosition();
    const focusTimer = window.setTimeout(() => {
      updateMenuPosition();
      focusMenuItem(initialFocusRef.current === 'last' ? -1 : 0);
    }, 0);

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }

      closeMenu(false);
    };

    const handleViewportChange = () => updateMenuPosition();

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [closeMenu, focusMenuItem, isOpen, updateMenuPosition]);

  const handleTriggerClick = () => {
    if (isOpen) {
      closeMenu(false);
      return;
    }

    openMenu('first');
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openMenu('first');
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      openMenu('last');
    }
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const menuItems = getEnabledMenuItems();
    const currentIndex = menuItems.indexOf(document.activeElement as HTMLButtonElement);

    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu(true);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusMenuItem(currentIndex >= 0 ? currentIndex + 1 : 0);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusMenuItem(currentIndex >= 0 ? currentIndex - 1 : menuItems.length - 1);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      focusMenuItem(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      focusMenuItem(menuItems.length - 1);
    }
  };

  const menu = isOpen && menuPosition
    ? createPortal(
      <div
        ref={menuRef}
        className="catalogue-action-menu__panel"
        role="menu"
        aria-label={menuLabel}
        style={{
          position: 'fixed',
          top: menuPosition.top,
          left: menuPosition.left,
          maxHeight: menuPosition.maxHeight,
          overflowY: 'auto',
        }}
        onKeyDown={handleMenuKeyDown}
      >
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            className={cn(
              'catalogue-action-menu__item',
              action.tone === 'danger' && 'catalogue-action-menu__item--danger'
            )}
            role="menuitem"
            disabled={action.disabled}
            onClick={() => {
              if (action.disabled) {
                return;
              }

              action.onSelect();
              closeMenu(false);
            }}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>,
      document.body
    )
    : null;

  return (
    <div className="catalogue-action-menu">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        className="catalogue-action-menu__trigger"
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <MoreVertical size={15} />
      </button>
      {menu}
    </div>
  );
};

export default DataGridRowActionMenu;
