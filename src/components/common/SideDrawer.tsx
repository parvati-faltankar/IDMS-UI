import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import AppDrawer from '../app/AppDrawer';
import { cn } from '../../utils/classNames';

interface SideDrawerProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  headerMeta?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  panelClassName?: string;
  contentClassName?: string;
}

const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  title,
  subtitle,
  headerMeta,
  headerActions,
  children,
  footer,
  onClose,
  initialFocusRef,
  panelClassName,
  contentClassName,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const titleId = `${title.replace(/\s+/g, '-').toLowerCase()}-title`;
  const isNarrow = panelClassName?.includes('side-drawer__panel--narrow');
  const isWide = panelClassName?.includes('side-drawer__panel--wide');
  const isChart = panelClassName?.includes('side-drawer__panel--chart');
  const drawerWidth = isChart ? 620 : isNarrow ? 384 : isWide ? 720 : 960;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      initialFocusRef?.current?.focus();

      if (!initialFocusRef?.current) {
        closeButtonRef.current?.focus();
      }
    }, 80);

    return () => window.clearTimeout(timer);
  }, [initialFocusRef, isOpen]);

  return (
    <AppDrawer open={isOpen} onClose={onClose} width={drawerWidth}>
      <aside aria-labelledby={titleId} className={cn(panelClassName)}>
        <div className="side-drawer__header">
          <div className="side-drawer__header-copy">
            <h2 id={titleId} className="brand-page-title side-drawer__title">
              {title}
            </h2>
            {subtitle && <p className="brand-page-subtitle">{subtitle}</p>}
            {headerMeta && <div className="side-drawer__meta">{headerMeta}</div>}
          </div>
          <div className="side-drawer__header-actions">
            {headerActions}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="side-drawer__close"
              aria-label={`Close ${title}`}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className={cn('side-drawer__content', contentClassName)}>{children}</div>

        {footer && <div className="side-drawer__footer">{footer}</div>}
      </aside>
    </AppDrawer>
  );
};

export default SideDrawer;
