import React, { useRef } from 'react';
import { X } from 'lucide-react';
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap';
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
  const { containerRef, handleKeyDown } = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
    initialFocusRef,
    fallbackFocusRef: closeButtonRef,
  });
  const titleId = `${title.replace(/\s+/g, '-').toLowerCase()}-title`;

  return (
    <div className={cn('side-drawer', isOpen && 'side-drawer--open')} aria-hidden={!isOpen}>
      <button
        type="button"
        className="side-drawer__backdrop"
        onClick={onClose}
        tabIndex={isOpen ? 0 : -1}
        aria-label={`Close ${title}`}
      />
      <aside
        ref={containerRef}
        className={cn('side-drawer__panel', panelClassName)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
      >
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
    </div>
  );
};

export default SideDrawer;
