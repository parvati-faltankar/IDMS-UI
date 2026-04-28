import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/classNames';
import { menuStructure, navigateToHash, type Level3Item, type SidebarComponentProps } from './appShellShared';

const AppSidebar: React.FC<SidebarComponentProps> = ({
  isCollapsed,
  onPurchaseRequisitionClick,
  onPurchaseOrderClick,
  onPurchaseReceiptClick,
  onPurchaseInvoiceClick,
  onSaleOrderClick,
  onSaleAllocationRequisitionClick,
  onSaleAllocationClick,
  onSaleInvoiceClick,
  onDeliveryClick,
  activeLeaf = 'purchase-requisition',
  isMobileOpen,
  onCloseMobile,
}) => {
  const isSalesLeaf =
    activeLeaf === 'sale-order' ||
    activeLeaf === 'sale-allocation-requisition' ||
    activeLeaf === 'sale-allocation' ||
    activeLeaf === 'sale-invoice' ||
    activeLeaf === 'delivery';
  const [expandedLevel1, setExpandedLevel1] = useState<Record<string, boolean>>({
    Procurement: !isSalesLeaf,
    Sales: isSalesLeaf,
    Inventory: false,
    Services: false,
  });
  const [expandedLevel2, setExpandedLevel2] = useState<Record<string, boolean>>({
    Procurement_Pages: !isSalesLeaf,
    Sales_Pages: isSalesLeaf,
    Inventory_Pages: false,
    Services_Pages: false,
  });

  const toggleLevel1 = (label: string) => {
    setExpandedLevel1((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const toggleLevel2 = (level1: string, level2: string) => {
    const key = `${level1}_${level2}`;
    setExpandedLevel2((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleLeafClick = (item: Level3Item) => {
    if (item.key === 'purchase-requisition') {
      if (onPurchaseRequisitionClick) {
        onPurchaseRequisitionClick();
      } else {
        navigateToHash('#/purchase-requisition');
      }
    }

    if (item.key === 'purchase-order') {
      if (onPurchaseOrderClick) {
        onPurchaseOrderClick();
      } else {
        navigateToHash('#/purchase-order');
      }
    }

    if (item.key === 'purchase-receipt') {
      if (onPurchaseReceiptClick) {
        onPurchaseReceiptClick();
      } else {
        navigateToHash('#/purchasereceiptlist');
      }
    }

    if (item.key === 'purchase-invoice') {
      if (onPurchaseInvoiceClick) {
        onPurchaseInvoiceClick();
      } else {
        navigateToHash('#/purchaseinvoicelist');
      }
    }

    if (item.key === 'sale-order') {
      if (onSaleOrderClick) {
        onSaleOrderClick();
      } else {
        navigateToHash('#/sale-order');
      }
    }

    if (item.key === 'sale-allocation-requisition') {
      if (onSaleAllocationRequisitionClick) {
        onSaleAllocationRequisitionClick();
      } else {
        navigateToHash('#/sale-allocation-requisition');
      }
    }

    if (item.key === 'sale-allocation') {
      if (onSaleAllocationClick) {
        onSaleAllocationClick();
      } else {
        navigateToHash('#/sale-allocation');
      }
    }

    if (item.key === 'sale-invoice') {
      if (onSaleInvoiceClick) {
        onSaleInvoiceClick();
      } else {
        navigateToHash('#/sale-invoice');
      }
    }

    if (item.key === 'delivery') {
      if (onDeliveryClick) {
        onDeliveryClick();
      } else {
        navigateToHash('#/delivery');
      }
    }

    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  const sidebarCollapsed = isCollapsed && !isMobileOpen;

  return (
    <aside
      className={cn(
        'app-sidebar',
        sidebarCollapsed && 'app-sidebar--collapsed',
        isMobileOpen && 'app-sidebar--mobile-open'
      )}
    >
      <nav className="app-sidebar__nav" aria-label="Primary navigation">
        {menuStructure.map((level1) => {
          const isLevel1Expanded = expandedLevel1[level1.label];

          return (
            <div key={level1.label} className="app-sidebar__group">
              <button
                type="button"
                onClick={() => !sidebarCollapsed && toggleLevel1(level1.label)}
                className={cn(
                  'app-sidebar__level1',
                  sidebarCollapsed && 'app-sidebar__level1--collapsed',
                  isLevel1Expanded && !sidebarCollapsed && 'app-sidebar__level1--expanded'
                )}
                disabled={sidebarCollapsed}
                aria-expanded={sidebarCollapsed ? undefined : isLevel1Expanded}
                title={sidebarCollapsed ? level1.label : undefined}
              >
                {!sidebarCollapsed && (
                  <ChevronDown
                    size={16}
                    className={cn('app-sidebar__chevron', !isLevel1Expanded && 'app-sidebar__chevron--collapsed')}
                  />
                )}
                {!sidebarCollapsed ? (
                  <span>{level1.label}</span>
                ) : (
                  <>
                    {level1.icon ? (
                      <level1.icon size={18} strokeWidth={1.9} aria-hidden="true" />
                    ) : (
                      <span className="app-sidebar__collapsed-label">{level1.label.charAt(0)}</span>
                    )}
                  </>
                )}
              </button>

              {!sidebarCollapsed && isLevel1Expanded && (
                <div className="app-sidebar__level2-wrap">
                  {level1.level2.map((level2) => {
                    const level2Key = `${level1.label}_${level2.label}`;
                    const isLevel2Expanded = expandedLevel2[level2Key];
                    const hasLevel3 = Boolean(level2.level3?.length);
                    const shouldFlattenLevel2 = level2.hideLabel && hasLevel3;

                    return (
                      <div key={level2Key}>
                        {!shouldFlattenLevel2 && (
                          <button
                            type="button"
                            onClick={() => hasLevel3 && toggleLevel2(level1.label, level2.label)}
                            className={cn('app-sidebar__level2', hasLevel3 && isLevel2Expanded && 'app-sidebar__level2--expanded')}
                            aria-expanded={hasLevel3 ? isLevel2Expanded : undefined}
                          >
                            {hasLevel3 ? (
                              <ChevronDown
                                size={14}
                                className={cn(
                                  'app-sidebar__chevron app-sidebar__chevron--small',
                                  !isLevel2Expanded && 'app-sidebar__chevron--collapsed'
                                )}
                              />
                            ) : (
                              <span className="app-sidebar__level2-spacer" />
                            )}
                            <span>{level2.label}</span>
                          </button>
                        )}

                        {hasLevel3 && (shouldFlattenLevel2 || isLevel2Expanded) && (
                          <div className="app-sidebar__level3-wrap">
                            {level2.level3?.map((level3) => (
                              <button
                                key={level3.key}
                                type="button"
                                onClick={() => handleLeafClick(level3)}
                                className={cn('app-sidebar__level3', level3.key === activeLeaf && 'app-sidebar__level3--active')}
                              >
                                {level3.icon && <level3.icon size={15} strokeWidth={1.9} aria-hidden="true" />}
                                <span>{level3.label}</span>
                              </button>
                            ))}
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
      </nav>
    </aside>
  );
};

export default AppSidebar;