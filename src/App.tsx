import { useEffect, useState } from 'react';
import { emptyCatalogueFilters } from './catalogueFilters';
import Dashboard from './Dashboard';
import CreatePurchaseRequisition from './CreatePurchaseRequisition';
import ExcellonBrandGuidelinesPreview from './ExcellonBrandGuidelinesPreview';
import FormLayoutEditor from './FormLayoutEditor';
import FormLayoutSettings from './FormLayoutSettings';
import PurchaseRequisitionCatalogueView from './PurchaseRequisitionCatalogueView';
import { getPurchaseRequisitionById } from './purchaseRequisitionCatalogueData';
import CreatePurchaseOrder from './purchase order/CreatePurchaseOrder';
import { getPurchaseOrderById } from './purchase order/purchaseOrderData';
import PurhcaseOrderList from './purchase order/purhcaseorderlist';
import CreatePurchaseReceipt from './purhcase receipt/CreatePurchaseReceipt';
import PurchaseReceiptList from './purhcase receipt/purchasereceiptlist';
import { getPurchaseOrderById as getPurchaseReceiptById } from './purhcase receipt/purchaseReceiptData';
import CreatePurchaseInvoice from './purchase invoice/CreatePurchaseInvoice';
import PurchaseInvoiceList from './purchase invoice/purchaseinvoicelist';
import { getPurchaseOrderById as getPurchaseInvoiceById } from './purchase invoice/purchaseInvoiceData';
import CreateSaleOrder from './sale order/CreateSaleOrder';
import SaleOrderList from './sale order/saleorderlist';
import { getSaleOrderById } from './sale order/saleOrderData';
import CreateSaleAllocationRequisition from './sale allocation requisition/CreateSaleAllocationRequisition';
import SaleAllocationRequisitionList from './sale allocation requisition/saleallocationrequisitionlist';
import { getSaleAllocationRequisitionById } from './sale allocation requisition/saleAllocationRequisitionData';
import CreateSaleAllocation from './sale allocation/CreateSaleAllocation';
import SaleAllocationList from './sale allocation/saleallocationlist';
import { getSaleAllocationById } from './sale allocation/saleAllocationData';
import CreateSaleInvoice from './sale invoice/CreateSaleInvoice';
import SaleInvoiceList from './sale invoice/saleinvoicelist';
import { getSaleInvoiceById } from './sale invoice/saleInvoiceData';
import CreateDelivery from './delivery/CreateDelivery';
import DeliveryList from './delivery/deliverylist';
import { getDeliveryById } from './delivery/deliveryData';

type AppRoute =
  | 'dashboard'
  | 'purchase-requisition-list'
  | 'purchase-requisition-create'
  | 'purchase-order-list'
  | 'purchase-order-create'
  | 'purchase-receipt-list'
  | 'purchase-receipt-create'
  | 'purchase-invoice-list'
  | 'purchase-invoice-create'
  | 'sale-order-list'
  | 'sale-order-create'
  | 'sale-allocation-requisition-list'
  | 'sale-allocation-requisition-create'
  | 'sale-allocation-list'
  | 'sale-allocation-create'
  | 'sale-invoice-list'
  | 'sale-invoice-create'
  | 'delivery-list'
  | 'delivery-create'
  | 'form-layout-settings'
  | 'form-layout-editor'
  | 'brand-guidelines';

const routeHashes: Record<AppRoute, string> = {
  dashboard: '#/dashboard',
  'purchase-requisition-list': '#/purchase-requisition',
  'purchase-requisition-create': '#/purchase-requisition/new',
  'purchase-order-list': '#/purchase-order',
  'purchase-order-create': '#/purchase-order/new',
  'purchase-receipt-list': '#/purchasereceiptlist',
  'purchase-receipt-create': '#/purchase-receipt/new',
  'purchase-invoice-list': '#/purchaseinvoicelist',
  'purchase-invoice-create': '#/purchase-invoice/new',
  'sale-order-list': '#/sale-order',
  'sale-order-create': '#/sale-order/new',
  'sale-allocation-requisition-list': '#/sale-allocation-requisition',
  'sale-allocation-requisition-create': '#/sale-allocation-requisition/new',
  'sale-allocation-list': '#/sale-allocation',
  'sale-allocation-create': '#/sale-allocation/new',
  'sale-invoice-list': '#/sale-invoice',
  'sale-invoice-create': '#/sale-invoice/new',
  'delivery-list': '#/delivery',
  'delivery-create': '#/delivery/new',
  'form-layout-settings': '#/profile/form-layout',
  'form-layout-editor': '#/profile/form-layout/edit',
  'brand-guidelines': '#/brand-guidelines',
};

function getRouteFromHash(hash: string): AppRoute {
  const hashPath = hash.split('?')[0];

  if (hashPath.startsWith('#/profile/form-layout/edit') || hashPath.startsWith('#/profile/form-layout-editor')) {
    return 'form-layout-editor';
  }

  switch (hashPath) {
    case '#/dashboard':
      return 'dashboard';
    case '#/purchase-requisition/new':
    case '#/create-purchase-requisition':
      return 'purchase-requisition-create';
    case '#/purchase-order/new':
    case '#/create-purchase-order':
      return 'purchase-order-create';
    case '#/purchase-receipt/new':
    case '#/create-purchase-receipt':
      return 'purchase-receipt-create';
    case '#/purchase-invoice/new':
    case '#/create-purchase-invoice':
      return 'purchase-invoice-create';
    case '#/sale-order/new':
    case '#/create-sale-order':
      return 'sale-order-create';
    case '#/sale-allocation-requisition/new':
    case '#/create-sale-allocation-requisition':
      return 'sale-allocation-requisition-create';
    case '#/sale-allocation/new':
    case '#/create-sale-allocation':
      return 'sale-allocation-create';
    case '#/sale-invoice/new':
    case '#/create-sale-invoice':
      return 'sale-invoice-create';
    case '#/delivery/new':
    case '#/create-delivery':
      return 'delivery-create';
    case '#/profile/form-layout':
      return 'form-layout-settings';
    case '#/profile/form-layout/edit':
    case '#/profile/form-layout-editor':
      return 'form-layout-editor';
    case '#/purhcaseorderlist':
    case '#/purchase-order':
      return 'purchase-order-list';
    case '#/purchasereceiptlist':
    case '#/purchase-receipt':
      return 'purchase-receipt-list';
    case '#/purchaseinvoicelist':
    case '#/purchase-invoice':
      return 'purchase-invoice-list';
    case '#/saleorderlist':
    case '#/sale-order':
      return 'sale-order-list';
    case '#/saleallocationrequisitionlist':
    case '#/sale-allocation-requisition':
      return 'sale-allocation-requisition-list';
    case '#/saleallocationlist':
    case '#/sale-allocation':
      return 'sale-allocation-list';
    case '#/saleinvoicelist':
    case '#/sale-invoice':
      return 'sale-invoice-list';
    case '#/deliverylist':
    case '#/delivery':
      return 'delivery-list';
    case '#/brand-guidelines':
      return 'brand-guidelines';
    case '#/purchaserequistionlistview':
    case '#/purchase-requisition':
      return 'purchase-requisition-list';
    default:
      return 'dashboard';
  }
}

function App() {
  const [route, setRoute] = useState<AppRoute>(() => getRouteFromHash(window.location.hash));
  const [requisitionCatalogueFilters, setRequisitionCatalogueFilters] = useState(emptyCatalogueFilters);
  const [purchaseOrderCatalogueFilters, setPurchaseOrderCatalogueFilters] = useState(emptyCatalogueFilters);
  const [purchaseReceiptCatalogueFilters, setPurchaseReceiptCatalogueFilters] = useState(emptyCatalogueFilters);
  const [purchaseInvoiceCatalogueFilters, setPurchaseInvoiceCatalogueFilters] = useState(emptyCatalogueFilters);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(() => {
    const hashQuery = window.location.hash.split('?')[1] ?? '';
    return new URLSearchParams(hashQuery).get('id');
  });
  const [routeQuery, setRouteQuery] = useState<URLSearchParams>(() => {
    const hashQuery = window.location.hash.split('?')[1] ?? '';
    return new URLSearchParams(hashQuery);
  });

  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${routeHashes.dashboard}`);
    }

    const handleHashChange = () => {
      setRoute(getRouteFromHash(window.location.hash));
      const hashQuery = window.location.hash.split('?')[1] ?? '';
      const nextRouteQuery = new URLSearchParams(hashQuery);
      setRouteQuery(nextRouteQuery);
      setEditingDocumentId(nextRouteQuery.get('id'));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (nextRoute: AppRoute, query?: Record<string, string>) => {
    const params = new URLSearchParams(query);
    const nextHash = params.toString()
      ? `${routeHashes[nextRoute]}?${params.toString()}`
      : routeHashes[nextRoute];

    if (window.location.hash === nextHash) {
      setRoute(nextRoute);
      const hashQuery = nextHash.split('?')[1] ?? '';
      const nextRouteQuery = new URLSearchParams(hashQuery);
      setRouteQuery(nextRouteQuery);
      setEditingDocumentId(nextRouteQuery.get('id'));
      return;
    }

    window.location.hash = nextHash;
  };

  if (route === 'brand-guidelines') {
    return <ExcellonBrandGuidelinesPreview />;
  }

  if (route === 'form-layout-settings') {
    return (
      <FormLayoutSettings
        onEditFormLayout={(formId) => {
          if (formId === 'purchase-requisition-create') {
            navigateTo('purchase-requisition-create', { config: 'form-layout' });
            return;
          }
          navigateTo('form-layout-editor', { formId });
        }}
        onNavigateToDashboard={() => navigateTo('dashboard')}
        onNavigateToPurchaseRequisitionList={() => navigateTo('purchase-requisition-list')}
      />
    );
  }

  if (route === 'form-layout-editor') {
    return (
      <FormLayoutEditor
        key={routeQuery.get('formId') ?? 'form-layout-editor'}
        formId={routeQuery.get('formId')}
        onBack={() => navigateTo('form-layout-settings')}
      />
    );
  }

  if (route === 'dashboard') {
    return (
      <Dashboard
        onNavigateToDashboard={() => navigateTo('dashboard')}
        onNavigateToPurchaseRequisitionList={() => navigateTo('purchase-requisition-list')}
        onNavigateToPurchaseOrderList={() => navigateTo('purchase-order-list')}
        onNavigateToPurchaseReceiptList={() => navigateTo('purchase-receipt-list')}
        onNavigateToPurchaseInvoiceList={() => navigateTo('purchase-invoice-list')}
        onNavigateToSaleOrderList={() => navigateTo('sale-order-list')}
        onNavigateToSaleAllocationRequisitionList={() => navigateTo('sale-allocation-requisition-list')}
        onNavigateToSaleAllocationList={() => navigateTo('sale-allocation-list')}
        onNavigateToSaleInvoiceList={() => navigateTo('sale-invoice-list')}
        onNavigateToDeliveryList={() => navigateTo('delivery-list')}
      />
    );
  }

  if (route === 'purchase-requisition-create') {
    const isLayoutConfigurationMode = routeQuery.get('config') === 'form-layout';

    return (
      <CreatePurchaseRequisition
        key={`${editingDocumentId ?? 'new-requisition'}-${isLayoutConfigurationMode ? 'config' : 'live'}`}
        editingDocument={getPurchaseRequisitionById(editingDocumentId)}
        tourMode={routeQuery.get('tour') === 'pr-create' ? 'pr-create' : undefined}
        configurationMode={isLayoutConfigurationMode}
        onBack={() =>
          isLayoutConfigurationMode ? navigateTo('form-layout-settings') : navigateTo('purchase-requisition-list')
        }
        onNavigateToList={() => navigateTo('purchase-requisition-list')}
        onNavigateToPurchaseOrderList={() => navigateTo('purchase-order-list')}
      />
    );
  }

  if (route === 'purchase-order-create') {
    return (
      <CreatePurchaseOrder
        key={editingDocumentId ?? 'new-purchase-order'}
        editingDocument={getPurchaseOrderById(editingDocumentId)}
        onBack={() => navigateTo('purchase-order-list')}
        onNavigateToPurchaseOrderList={() => navigateTo('purchase-order-list')}
        onNavigateToPurchaseRequisitionList={() => navigateTo('purchase-requisition-list')}
      />
    );
  }

  if (route === 'purchase-receipt-create') {
    return (
      <CreatePurchaseReceipt
        key={editingDocumentId ?? 'new-purchase-receipt'}
        editingDocument={getPurchaseReceiptById(editingDocumentId)}
        onBack={() => navigateTo('purchase-receipt-list')}
        onNavigateToPurchaseReceiptList={() => navigateTo('purchase-receipt-list')}
        onNavigateToPurchaseInvoiceList={() => navigateTo('purchase-invoice-list')}
        onNavigateToPurchaseOrderList={() => navigateTo('purchase-order-list')}
        onNavigateToPurchaseRequisitionList={() => navigateTo('purchase-requisition-list')}
      />
    );
  }

  if (route === 'purchase-invoice-create') {
    return (
      <CreatePurchaseInvoice
        key={editingDocumentId ?? 'new-purchase-invoice'}
        editingDocument={getPurchaseInvoiceById(editingDocumentId)}
        onBack={() => navigateTo('purchase-invoice-list')}
        onNavigateToPurchaseInvoiceList={() => navigateTo('purchase-invoice-list')}
        onNavigateToPurchaseReceiptList={() => navigateTo('purchase-receipt-list')}
        onNavigateToPurchaseOrderList={() => navigateTo('purchase-order-list')}
        onNavigateToPurchaseRequisitionList={() => navigateTo('purchase-requisition-list')}
      />
    );
  }

  if (route === 'sale-order-create') {
    return (
      <CreateSaleOrder
        key={editingDocumentId ?? 'new-sale-order'}
        editingDocument={getSaleOrderById(editingDocumentId)}
        onBack={() => navigateTo('sale-order-list')}
        onNavigateToSaleOrderList={() => navigateTo('sale-order-list')}
      />
    );
  }

  if (route === 'sale-allocation-requisition-create') {
    return (
      <CreateSaleAllocationRequisition
        key={editingDocumentId ?? 'new-sale-allocation-requisition'}
        editingDocument={getSaleAllocationRequisitionById(editingDocumentId)}
        onBack={() => navigateTo('sale-allocation-requisition-list')}
        onNavigateToSaleAllocationRequisitionList={() =>
          navigateTo('sale-allocation-requisition-list')
        }
      />
    );
  }

  if (route === 'sale-allocation-create') {
    return (
      <CreateSaleAllocation
        key={editingDocumentId ?? 'new-sale-allocation'}
        editingDocument={getSaleAllocationById(editingDocumentId)}
        onBack={() => navigateTo('sale-allocation-list')}
        onNavigateToSaleAllocationList={() => navigateTo('sale-allocation-list')}
      />
    );
  }

  if (route === 'sale-invoice-create') {
    return (
      <CreateSaleInvoice
        key={editingDocumentId ?? 'new-sale-invoice'}
        editingDocument={getSaleInvoiceById(editingDocumentId)}
        onBack={() => navigateTo('sale-invoice-list')}
        onNavigateToSaleInvoiceList={() => navigateTo('sale-invoice-list')}
      />
    );
  }

  if (route === 'delivery-create') {
    return (
      <CreateDelivery
        key={editingDocumentId ?? 'new-delivery'}
        editingDocument={getDeliveryById(editingDocumentId)}
        onBack={() => navigateTo('delivery-list')}
        onNavigateToDeliveryList={() => navigateTo('delivery-list')}
      />
    );
  }

  if (route === 'purchase-order-list') {
    return (
      <PurhcaseOrderList
        filters={purchaseOrderCatalogueFilters}
        onFiltersChange={setPurchaseOrderCatalogueFilters}
        onNew={() => navigateTo('purchase-order-create')}
        onEdit={(documentId) => navigateTo('purchase-order-create', { id: documentId, mode: 'edit' })}
        onNavigateToPurchaseOrderList={() => navigateTo('purchase-order-list')}
        onNavigateToPurchaseRequisitionList={() => navigateTo('purchase-requisition-list')}
      />
    );
  }

  if (route === 'purchase-receipt-list') {
    return (
      <PurchaseReceiptList
        filters={purchaseReceiptCatalogueFilters}
        onFiltersChange={setPurchaseReceiptCatalogueFilters}
        onNew={() => navigateTo('purchase-receipt-create')}
        onEdit={(documentId) => navigateTo('purchase-receipt-create', { id: documentId, mode: 'edit' })}
        onNavigateToPurchaseReceiptList={() => navigateTo('purchase-receipt-list')}
        onNavigateToPurchaseInvoiceList={() => navigateTo('purchase-invoice-list')}
        onNavigateToPurchaseOrderList={() => navigateTo('purchase-order-list')}
        onNavigateToPurchaseRequisitionList={() => navigateTo('purchase-requisition-list')}
      />
    );
  }

  if (route === 'purchase-invoice-list') {
    return (
      <PurchaseInvoiceList
        filters={purchaseInvoiceCatalogueFilters}
        onFiltersChange={setPurchaseInvoiceCatalogueFilters}
        onNew={() => navigateTo('purchase-invoice-create')}
        onEdit={(documentId) => navigateTo('purchase-invoice-create', { id: documentId, mode: 'edit' })}
        onNavigateToPurchaseInvoiceList={() => navigateTo('purchase-invoice-list')}
        onNavigateToPurchaseReceiptList={() => navigateTo('purchase-receipt-list')}
        onNavigateToPurchaseOrderList={() => navigateTo('purchase-order-list')}
        onNavigateToPurchaseRequisitionList={() => navigateTo('purchase-requisition-list')}
      />
    );
  }

  if (route === 'sale-order-list') {
    return (
      <SaleOrderList
        onNew={() => navigateTo('sale-order-create')}
        onEdit={(documentId) => navigateTo('sale-order-create', { id: documentId, mode: 'edit' })}
        onNavigateToSaleOrderList={() => navigateTo('sale-order-list')}
      />
    );
  }

  if (route === 'sale-allocation-requisition-list') {
    return (
      <SaleAllocationRequisitionList
        onNew={() => navigateTo('sale-allocation-requisition-create')}
        onEdit={(documentId) =>
          navigateTo('sale-allocation-requisition-create', { id: documentId, mode: 'edit' })
        }
        onNavigateToSaleAllocationRequisitionList={() =>
          navigateTo('sale-allocation-requisition-list')
        }
      />
    );
  }

  if (route === 'sale-allocation-list') {
    return (
      <SaleAllocationList
        onNew={() => navigateTo('sale-allocation-create')}
        onEdit={(documentId) =>
          navigateTo('sale-allocation-create', { id: documentId, mode: 'edit' })
        }
        onNavigateToSaleAllocationList={() => navigateTo('sale-allocation-list')}
      />
    );
  }

  if (route === 'sale-invoice-list') {
    return (
      <SaleInvoiceList
        onNew={() => navigateTo('sale-invoice-create')}
        onEdit={(documentId) =>
          navigateTo('sale-invoice-create', { id: documentId, mode: 'edit' })
        }
        onNavigateToSaleInvoiceList={() => navigateTo('sale-invoice-list')}
      />
    );
  }

  if (route === 'delivery-list') {
    return (
      <DeliveryList
        onNew={() => navigateTo('delivery-create')}
        onEdit={(documentId) =>
          navigateTo('delivery-create', { id: documentId, mode: 'edit' })
        }
        onNavigateToDeliveryList={() => navigateTo('delivery-list')}
      />
    );
  }

  return (
    <PurchaseRequisitionCatalogueView
      filters={requisitionCatalogueFilters}
      onFiltersChange={setRequisitionCatalogueFilters}
      onNew={() => navigateTo('purchase-requisition-create')}
      onStartCreateTour={() => navigateTo('purchase-requisition-create', { tour: 'pr-create' })}
      onEdit={(documentId) => navigateTo('purchase-requisition-create', { id: documentId, mode: 'edit' })}
      onNavigateToList={() => navigateTo('purchase-requisition-list')}
      onNavigateToPurchaseOrderList={() => navigateTo('purchase-order-list')}
    />
  );
}

export default App;
