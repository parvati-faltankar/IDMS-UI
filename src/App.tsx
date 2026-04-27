import { Suspense, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { emptyCatalogueFilters } from './utils/catalogueFilters';
import { AppRoutes } from './routes/AppRoutes';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [requisitionCatalogueFilters, setRequisitionCatalogueFilters] = useState(emptyCatalogueFilters);
  const [purchaseOrderCatalogueFilters, setPurchaseOrderCatalogueFilters] = useState(emptyCatalogueFilters);
  const [purchaseReceiptCatalogueFilters, setPurchaseReceiptCatalogueFilters] = useState(emptyCatalogueFilters);
  const [purchaseInvoiceCatalogueFilters, setPurchaseInvoiceCatalogueFilters] = useState(emptyCatalogueFilters);
  const routeQuery = new URLSearchParams(location.search);
  const editingDocumentId = routeQuery.get('id');

  const navigateTo = (nextPath: string, query?: Record<string, string>) => {
    const params = new URLSearchParams(query);
    const search = params.toString();
    const targetPath = search ? `${nextPath}?${search}` : nextPath;

    if (`${location.pathname}${location.search}` !== targetPath) {
      navigate(targetPath);
    }
  };

  return (
    <Suspense fallback={null}>
      <AppRoutes
        editingDocumentId={editingDocumentId}
        isLayoutConfigurationMode={routeQuery.get('config') === 'form-layout'}
        locationSearch={location.search}
        navigateTo={navigateTo}
        purchaseInvoiceCatalogueFilters={purchaseInvoiceCatalogueFilters}
        purchaseOrderCatalogueFilters={purchaseOrderCatalogueFilters}
        purchaseReceiptCatalogueFilters={purchaseReceiptCatalogueFilters}
        requisitionCatalogueFilters={requisitionCatalogueFilters}
        routeQuery={routeQuery}
        setPurchaseInvoiceCatalogueFilters={setPurchaseInvoiceCatalogueFilters}
        setPurchaseOrderCatalogueFilters={setPurchaseOrderCatalogueFilters}
        setPurchaseReceiptCatalogueFilters={setPurchaseReceiptCatalogueFilters}
        setRequisitionCatalogueFilters={setRequisitionCatalogueFilters}
      />
    </Suspense>
  );
}

export default App;
