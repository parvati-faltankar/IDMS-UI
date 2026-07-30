import { Component, Suspense, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { emptyCatalogueFilters } from './utils/catalogueFilters';
import { AppRoutes } from './routes/AppRoutes';
import ViewportSimulator, { isViewportSimulatorFrame } from './components/dev/ViewportSimulator';

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'sans-serif', color: '#334155' }}>
          <h2 style={{ color: '#dc2626', marginBottom: 8 }}>Something went wrong</h2>
          <pre style={{ background: '#f1f5f9', padding: 16, borderRadius: 8, fontSize: 13, overflowX: 'auto' }}>
            {this.state.error.message}
          </pre>
          <button
            onClick={() => { this.setState({ error: null }); window.location.hash = '/'; }}
            style={{ marginTop: 16, padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            Go to home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [requisitionCatalogueFilters, setRequisitionCatalogueFilters] = useState(emptyCatalogueFilters);
  const [jobCardCatalogueFilters, setJobCardCatalogueFilters] = useState(emptyCatalogueFilters);
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

  const appContent = (
    <AppErrorBoundary>
      <Suspense fallback={null}>
        <AppRoutes
          editingDocumentId={editingDocumentId}
          isLayoutConfigurationMode={routeQuery.get('config') === 'form-layout'}
          locationSearch={location.search}
          navigateTo={navigateTo}
          jobCardCatalogueFilters={jobCardCatalogueFilters}
          purchaseInvoiceCatalogueFilters={purchaseInvoiceCatalogueFilters}
          purchaseOrderCatalogueFilters={purchaseOrderCatalogueFilters}
          purchaseReceiptCatalogueFilters={purchaseReceiptCatalogueFilters}
          requisitionCatalogueFilters={requisitionCatalogueFilters}
          routeQuery={routeQuery}
          setJobCardCatalogueFilters={setJobCardCatalogueFilters}
          setPurchaseInvoiceCatalogueFilters={setPurchaseInvoiceCatalogueFilters}
          setPurchaseOrderCatalogueFilters={setPurchaseOrderCatalogueFilters}
          setPurchaseReceiptCatalogueFilters={setPurchaseReceiptCatalogueFilters}
          setRequisitionCatalogueFilters={setRequisitionCatalogueFilters}
        />
      </Suspense>
    </AppErrorBoundary>
  );

  if (!import.meta.env.DEV || isViewportSimulatorFrame()) {
    return appContent;
  }

  return <ViewportSimulator>{appContent}</ViewportSimulator>;
}

export default App;

