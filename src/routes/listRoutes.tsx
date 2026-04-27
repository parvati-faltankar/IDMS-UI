import { Route } from 'react-router-dom';
import { paths } from './routeConfig';
import {
  DeliveryList,
  PurchaseInvoiceList,
  PurchaseReceiptList,
  PurchaseRequisitionCatalogueView,
  PurchaseOrderList,
  SaleAllocationList,
  SaleAllocationRequisitionList,
  SaleInvoiceList,
  SaleOrderList,
} from './routeScreens';
import type { ListRouteContext } from './routeTypes';

export function renderListRoutes({
  navigateTo,
  purchaseInvoiceCatalogueFilters,
  purchaseOrderCatalogueFilters,
  purchaseReceiptCatalogueFilters,
  requisitionCatalogueFilters,
  setPurchaseInvoiceCatalogueFilters,
  setPurchaseOrderCatalogueFilters,
  setPurchaseReceiptCatalogueFilters,
  setRequisitionCatalogueFilters,
}: ListRouteContext) {
  return (
    <>
      <Route
        path={paths.purchaseOrderList}
        element={
          <PurchaseOrderList
            filters={purchaseOrderCatalogueFilters}
            onFiltersChange={setPurchaseOrderCatalogueFilters}
            onNew={() => navigateTo(paths.purchaseOrderCreate)}
            onEdit={(documentId) => navigateTo(paths.purchaseOrderCreate, { id: documentId, mode: 'edit' })}
            onNavigateToPurchaseOrderList={() => navigateTo(paths.purchaseOrderList)}
            onNavigateToPurchaseRequisitionList={() => navigateTo(paths.purchaseRequisitionList)}
          />
        }
      />

      <Route
        path={paths.purchaseReceiptList}
        element={
          <PurchaseReceiptList
            filters={purchaseReceiptCatalogueFilters}
            onFiltersChange={setPurchaseReceiptCatalogueFilters}
            onNew={() => navigateTo(paths.purchaseReceiptCreate)}
            onEdit={(documentId) => navigateTo(paths.purchaseReceiptCreate, { id: documentId, mode: 'edit' })}
            onNavigateToPurchaseReceiptList={() => navigateTo(paths.purchaseReceiptList)}
            onNavigateToPurchaseInvoiceList={() => navigateTo(paths.purchaseInvoiceList)}
            onNavigateToPurchaseOrderList={() => navigateTo(paths.purchaseOrderList)}
            onNavigateToPurchaseRequisitionList={() => navigateTo(paths.purchaseRequisitionList)}
          />
        }
      />

      <Route
        path={paths.purchaseInvoiceList}
        element={
          <PurchaseInvoiceList
            filters={purchaseInvoiceCatalogueFilters}
            onFiltersChange={setPurchaseInvoiceCatalogueFilters}
            onNew={() => navigateTo(paths.purchaseInvoiceCreate)}
            onEdit={(documentId) => navigateTo(paths.purchaseInvoiceCreate, { id: documentId, mode: 'edit' })}
            onNavigateToPurchaseInvoiceList={() => navigateTo(paths.purchaseInvoiceList)}
            onNavigateToPurchaseReceiptList={() => navigateTo(paths.purchaseReceiptList)}
            onNavigateToPurchaseOrderList={() => navigateTo(paths.purchaseOrderList)}
            onNavigateToPurchaseRequisitionList={() => navigateTo(paths.purchaseRequisitionList)}
          />
        }
      />

      <Route
        path={paths.saleOrderList}
        element={
          <SaleOrderList
            onNew={() => navigateTo(paths.saleOrderCreate)}
            onEdit={(documentId) => navigateTo(paths.saleOrderCreate, { id: documentId, mode: 'edit' })}
            onNavigateToSaleOrderList={() => navigateTo(paths.saleOrderList)}
          />
        }
      />

      <Route
        path={paths.saleAllocationRequisitionList}
        element={
          <SaleAllocationRequisitionList
            onNew={() => navigateTo(paths.saleAllocationRequisitionCreate)}
            onEdit={(documentId) => navigateTo(paths.saleAllocationRequisitionCreate, { id: documentId, mode: 'edit' })}
            onNavigateToSaleAllocationRequisitionList={() => navigateTo(paths.saleAllocationRequisitionList)}
          />
        }
      />

      <Route
        path={paths.saleAllocationList}
        element={
          <SaleAllocationList
            onNew={() => navigateTo(paths.saleAllocationCreate)}
            onEdit={(documentId) => navigateTo(paths.saleAllocationCreate, { id: documentId, mode: 'edit' })}
            onNavigateToSaleAllocationList={() => navigateTo(paths.saleAllocationList)}
          />
        }
      />

      <Route
        path={paths.saleInvoiceList}
        element={
          <SaleInvoiceList
            onNew={() => navigateTo(paths.saleInvoiceCreate)}
            onEdit={(documentId) => navigateTo(paths.saleInvoiceCreate, { id: documentId, mode: 'edit' })}
            onNavigateToSaleInvoiceList={() => navigateTo(paths.saleInvoiceList)}
          />
        }
      />

      <Route
        path={paths.deliveryList}
        element={
          <DeliveryList
            onNew={() => navigateTo(paths.deliveryCreate)}
            onEdit={(documentId) => navigateTo(paths.deliveryCreate, { id: documentId, mode: 'edit' })}
            onNavigateToDeliveryList={() => navigateTo(paths.deliveryList)}
          />
        }
      />

      <Route
        path={paths.purchaseRequisitionList}
        element={
          <PurchaseRequisitionCatalogueView
            filters={requisitionCatalogueFilters}
            onFiltersChange={setRequisitionCatalogueFilters}
            onNew={() => navigateTo(paths.purchaseRequisitionCreate)}
            onStartCreateTour={() => navigateTo(paths.purchaseRequisitionCreate, { tour: 'pr-create' })}
            onEdit={(documentId) => navigateTo(paths.purchaseRequisitionCreate, { id: documentId, mode: 'edit' })}
            onNavigateToList={() => navigateTo(paths.purchaseRequisitionList)}
            onNavigateToPurchaseOrderList={() => navigateTo(paths.purchaseOrderList)}
          />
        }
      />
    </>
  );
}