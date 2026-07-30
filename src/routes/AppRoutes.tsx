import { Routes } from 'react-router-dom';
import { renderCreateRoutes } from './createRoutes';
import { renderListRoutes } from './listRoutes';
import { renderProfileRoutes } from './profileRoutes';
import { renderRedirectRoutes } from './redirectRoutes';
import { renderAdminRoutes } from './adminRoutes';
import { renderUiStudioRoutes } from './uiStudioRoutes';
import type { CatalogueFilters, CatalogueFiltersSetter, NavigateTo } from './routeTypes';
import { isUiStudioEnabled } from '../ui-studio/integration/featureFlag';

export type AppRoutesProps = {
  editingDocumentId: string | null;
  isLayoutConfigurationMode: boolean;
  locationSearch: string;
  navigateTo: NavigateTo;
  jobCardCatalogueFilters: CatalogueFilters;
  purchaseInvoiceCatalogueFilters: CatalogueFilters;
  purchaseOrderCatalogueFilters: CatalogueFilters;
  purchaseReceiptCatalogueFilters: CatalogueFilters;
  requisitionCatalogueFilters: CatalogueFilters;
  routeQuery: URLSearchParams;
  setJobCardCatalogueFilters: CatalogueFiltersSetter;
  setPurchaseInvoiceCatalogueFilters: CatalogueFiltersSetter;
  setPurchaseOrderCatalogueFilters: CatalogueFiltersSetter;
  setPurchaseReceiptCatalogueFilters: CatalogueFiltersSetter;
  setRequisitionCatalogueFilters: CatalogueFiltersSetter;
};

export function AppRoutes({
  editingDocumentId,
  isLayoutConfigurationMode,
  locationSearch,
  navigateTo,
  jobCardCatalogueFilters,
  purchaseInvoiceCatalogueFilters,
  purchaseOrderCatalogueFilters,
  purchaseReceiptCatalogueFilters,
  requisitionCatalogueFilters,
  routeQuery,
  setJobCardCatalogueFilters,
  setPurchaseInvoiceCatalogueFilters,
  setPurchaseOrderCatalogueFilters,
  setPurchaseReceiptCatalogueFilters,
  setRequisitionCatalogueFilters,
}: AppRoutesProps) {
  const uiStudioEnabled = isUiStudioEnabled();

  return (
    <Routes>
      {renderUiStudioRoutes(uiStudioEnabled)}
      {renderAdminRoutes()}
      {renderProfileRoutes({ locationSearch, navigateTo, routeQuery })}
      {renderCreateRoutes({ editingDocumentId, isLayoutConfigurationMode, locationSearch, navigateTo, routeQuery })}
      {renderListRoutes({
        navigateTo,
        jobCardCatalogueFilters,
        purchaseInvoiceCatalogueFilters,
        purchaseOrderCatalogueFilters,
        purchaseReceiptCatalogueFilters,
        requisitionCatalogueFilters,
        setJobCardCatalogueFilters,
        setPurchaseInvoiceCatalogueFilters,
        setPurchaseOrderCatalogueFilters,
        setPurchaseReceiptCatalogueFilters,
        setRequisitionCatalogueFilters,
      })}
      {renderRedirectRoutes(locationSearch)}
    </Routes>
  );
}
