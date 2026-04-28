import React, { useEffect, useState } from 'react';
import { cn } from '../../utils/classNames';
import AppSidebar from './AppSidebar';
import AppTopHeader from './AppTopHeader';
import type { AppShellProps } from './appShellShared';

export { default as TopHeader } from './AppTopHeader';
export type { ActiveLeaf, AppShellProps, SidebarProps } from './appShellShared';

const AppShell: React.FC<AppShellProps> = ({
  children,
  activeLeaf = 'purchase-requisition',
  bottomBar,
  contentClassName,
  contentRef,
  onContentScroll,
  onPurchaseOrderClick,
  onPurchaseReceiptClick,
  onPurchaseInvoiceClick,
  onPurchaseRequisitionClick,
  onSaleOrderClick,
  onSaleAllocationRequisitionClick,
  onSaleAllocationClick,
  onSaleInvoiceClick,
  onDeliveryClick,
  onFormLayoutClick,
  onBusinessSettingsClick,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleToggleNavigation = () => {
    if (window.innerWidth > 1024) {
      setIsSidebarCollapsed((current) => !current);
      return;
    }

    setIsMobileNavOpen((current) => !current);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsMobileNavOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileNavOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div className="app-shell">
      <AppTopHeader
        activeLeaf={activeLeaf}
        isSidebarCollapsed={isSidebarCollapsed}
        isMobileNavOpen={isMobileNavOpen}
        onToggleNavigation={handleToggleNavigation}
        onFormLayoutClick={onFormLayoutClick}
        onBusinessSettingsClick={onBusinessSettingsClick}
      />
      <div className="app-shell__body">
        <AppSidebar
          activeLeaf={activeLeaf}
          isCollapsed={isSidebarCollapsed}
          onPurchaseOrderClick={onPurchaseOrderClick}
          onPurchaseReceiptClick={onPurchaseReceiptClick}
          onPurchaseInvoiceClick={onPurchaseInvoiceClick}
          onPurchaseRequisitionClick={onPurchaseRequisitionClick}
          onSaleOrderClick={onSaleOrderClick}
          onSaleAllocationRequisitionClick={onSaleAllocationRequisitionClick}
          onSaleAllocationClick={onSaleAllocationClick}
          onSaleInvoiceClick={onSaleInvoiceClick}
          onDeliveryClick={onDeliveryClick}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />
        <button
          type="button"
          className={cn('app-shell__overlay', isMobileNavOpen && 'app-shell__overlay--visible')}
          onClick={() => setIsMobileNavOpen(false)}
          aria-label="Close navigation overlay"
          aria-hidden={!isMobileNavOpen}
          tabIndex={isMobileNavOpen ? 0 : -1}
        />
        <div className="app-shell__main">
          <div
            ref={contentRef}
            onScroll={onContentScroll}
            className={cn('app-shell__content', contentClassName)}
          >
            {children}
          </div>
          {bottomBar && <div className="app-shell__bottom-bar">{bottomBar}</div>}
        </div>
      </div>
    </div>
  );
};

export default AppShell;
