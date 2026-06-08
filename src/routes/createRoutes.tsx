import { Route } from 'react-router-dom';
import { getPurchaseRequisitionById } from '../pages/purchase-requisition/purchaseRequisitionCatalogueData';
import { getPurchaseOrderById } from '../pages/purchase-order/purchaseOrderData';
import { getPurchaseOrderById as getPurchaseReceiptById } from '../pages/purchase-receipt/purchaseReceiptData';
import { getPurchaseOrderById as getPurchaseInvoiceById } from '../pages/purchase-invoice/purchaseInvoiceData';
import { getSaleOrderById } from '../pages/sale-order/saleOrderData';
import { findSaleOrderV2Document } from '../pages/sale-order-v2/saleOrderV2Data';
import { getSaleAllocationRequisitionById } from '../pages/sale-allocation-requisition/saleAllocationRequisitionData';
import { getSaleAllocationById } from '../pages/sale-allocation/saleAllocationData';
import { getSaleInvoiceById } from '../pages/sale-invoice/saleInvoiceData';
import { getDeliveryById } from '../pages/delivery/deliveryData';
import { getPurchaseOrderByIdFromStore, getSaleOrderByIdFromStore } from '../stores/documentStore';
import { paths } from './routeConfig';
import {
  CreateApprovalWorkflow,
  CreateDelivery,
  CreatePurchaseInvoice,
  CreatePurchaseOrder,
  CreatePurchaseReceipt,
  CreatePurchaseRequisition,
  CreateSaleAllocation,
  CreateSaleAllocationRequisition,
  CreateSaleInvoice,
  CreateSaleOrder,
  CreateSaleOrderV2,
} from './routeScreens';
import type { CreateRouteContext } from './routeTypes';

export function renderCreateRoutes({
  editingDocumentId,
  isLayoutConfigurationMode,
  navigateTo,
  routeQuery,
}: CreateRouteContext) {
  return (
    <>
      <Route
        path={paths.approvalStudioCreate}
        element={
          <CreateApprovalWorkflow
            editingWorkflowId={editingDocumentId}
            mode={routeQuery.get('mode') === 'view' ? 'view' : routeQuery.get('mode') === 'edit' ? 'edit' : 'create'}
            onBack={() => navigateTo(paths.approvalStudioList)}
            onNavigateToList={() => navigateTo(paths.approvalStudioList)}
            onNavigateToCreate={() => navigateTo(paths.approvalStudioCreate)}
            onNavigateToView={(workflowId) => navigateTo(paths.approvalStudioCreate, { id: workflowId, mode: 'view' })}
          />
        }
      />

      <Route
        path={paths.purchaseRequisitionCreate}
        element={
          <CreatePurchaseRequisition
            key={`${editingDocumentId ?? 'new-requisition'}-${isLayoutConfigurationMode ? 'config' : 'live'}`}
            editingDocument={getPurchaseRequisitionById(editingDocumentId)}
            tourMode={routeQuery.get('tour') === 'pr-create' ? 'pr-create' : undefined}
            configurationMode={isLayoutConfigurationMode}
            onBack={() =>
              isLayoutConfigurationMode ? navigateTo(paths.formLayoutSettings) : navigateTo(paths.purchaseRequisitionList)
            }
            onNavigateToList={() => navigateTo(paths.purchaseRequisitionList)}
            onNavigateToPurchaseOrderList={() => navigateTo(paths.purchaseOrderList)}
          />
        }
      />

      <Route
        path={paths.purchaseOrderCreate}
        element={
          <CreatePurchaseOrder
            key={editingDocumentId ?? 'new-purchase-order'}
            editingDocument={getPurchaseOrderByIdFromStore(editingDocumentId) ?? getPurchaseOrderById(editingDocumentId)}
            onBack={() => navigateTo(paths.purchaseOrderList)}
            onNavigateToPurchaseOrderList={() => navigateTo(paths.purchaseOrderList)}
            onNavigateToPurchaseRequisitionList={() => navigateTo(paths.purchaseRequisitionList)}
          />
        }
      />

      <Route
        path={paths.purchaseReceiptCreate}
        element={
          <CreatePurchaseReceipt
            key={editingDocumentId ?? 'new-purchase-receipt'}
            editingDocument={getPurchaseReceiptById(editingDocumentId)}
            onBack={() => navigateTo(paths.purchaseReceiptList)}
            onNavigateToPurchaseReceiptList={() => navigateTo(paths.purchaseReceiptList)}
            onNavigateToPurchaseInvoiceList={() => navigateTo(paths.purchaseInvoiceList)}
            onNavigateToPurchaseOrderList={() => navigateTo(paths.purchaseOrderList)}
            onNavigateToPurchaseRequisitionList={() => navigateTo(paths.purchaseRequisitionList)}
          />
        }
      />

      <Route
        path={paths.purchaseInvoiceCreate}
        element={
          <CreatePurchaseInvoice
            key={editingDocumentId ?? 'new-purchase-invoice'}
            editingDocument={getPurchaseInvoiceById(editingDocumentId)}
            onBack={() => navigateTo(paths.purchaseInvoiceList)}
            onNavigateToPurchaseInvoiceList={() => navigateTo(paths.purchaseInvoiceList)}
            onNavigateToPurchaseReceiptList={() => navigateTo(paths.purchaseReceiptList)}
            onNavigateToPurchaseOrderList={() => navigateTo(paths.purchaseOrderList)}
            onNavigateToPurchaseRequisitionList={() => navigateTo(paths.purchaseRequisitionList)}
          />
        }
      />

      <Route
        path={paths.saleOrderCreate}
        element={
          <CreateSaleOrder
            key={editingDocumentId ?? 'new-sale-order'}
            editingDocument={getSaleOrderByIdFromStore(editingDocumentId ?? null) ?? getSaleOrderById(editingDocumentId ?? null)}
            onBack={() => navigateTo(paths.saleOrderList)}
            onNavigateToSaleOrderList={() => navigateTo(paths.saleOrderList)}
          />
        }
      />

      <Route
        path={paths.saleOrderV2Create}
        element={
          <CreateSaleOrderV2
            key={editingDocumentId ?? 'new-sale-order-v2'}
            editingDocument={getSaleOrderByIdFromStore(editingDocumentId ?? null) ?? findSaleOrderV2Document(editingDocumentId ?? undefined)}
            onBack={() => navigateTo(paths.saleOrderV2List)}
            onNavigateToSaleOrderList={() => navigateTo(paths.saleOrderV2List)}
          />
        }
      />

      <Route
        path={paths.saleAllocationRequisitionCreate}
        element={
          <CreateSaleAllocationRequisition
            key={editingDocumentId ?? 'new-sale-allocation-requisition'}
            editingDocument={getSaleAllocationRequisitionById(editingDocumentId ?? null)}
            onBack={() => navigateTo(paths.saleAllocationRequisitionList)}
            onNavigateToSaleAllocationRequisitionList={() => navigateTo(paths.saleAllocationRequisitionList)}
          />
        }
      />

      <Route
        path={paths.saleAllocationCreate}
        element={
          <CreateSaleAllocation
            key={editingDocumentId ?? 'new-sale-allocation'}
            editingDocument={getSaleAllocationById(editingDocumentId)}
            onBack={() => navigateTo(paths.saleAllocationList)}
            onNavigateToSaleAllocationList={() => navigateTo(paths.saleAllocationList)}
          />
        }
      />

      <Route
        path={paths.saleInvoiceCreate}
        element={
          <CreateSaleInvoice
            key={editingDocumentId ?? 'new-sale-invoice'}
            editingDocument={getSaleInvoiceById(editingDocumentId)}
            onBack={() => navigateTo(paths.saleInvoiceList)}
            onNavigateToSaleInvoiceList={() => navigateTo(paths.saleInvoiceList)}
          />
        }
      />

      <Route
        path={paths.deliveryCreate}
        element={
          <CreateDelivery
            key={editingDocumentId ?? 'new-delivery'}
            editingDocument={getDeliveryById(editingDocumentId)}
            onBack={() => navigateTo(paths.deliveryList)}
            onNavigateToDeliveryList={() => navigateTo(paths.deliveryList)}
          />
        }
      />
    </>
  );
}
