import { Routes } from 'react-router-dom';
import { renderCreateRoutes } from './createRoutes';
import { renderListRoutes } from './listRoutes';
import { renderProfileRoutes } from './profileRoutes';
import { renderRedirectRoutes } from './redirectRoutes';
import type { CatalogueFilters, CatalogueFiltersSetter, NavigateTo } from './routeTypes';

export type AppRoutesProps = {
  editingDocumentId: string | null;
  isLayoutConfigurationMode: boolean;
  locationSearch: string;
  navigateTo: NavigateTo;
  purchaseInvoiceCatalogueFilters: CatalogueFilters;
  purchaseOrderCatalogueFilters: CatalogueFilters;
  purchaseReceiptCatalogueFilters: CatalogueFilters;
  requisitionCatalogueFilters: CatalogueFilters;
  routeQuery: URLSearchParams;
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
  purchaseInvoiceCatalogueFilters,
  purchaseOrderCatalogueFilters,
  purchaseReceiptCatalogueFilters,
  requisitionCatalogueFilters,
  routeQuery,
  setPurchaseInvoiceCatalogueFilters,
  setPurchaseOrderCatalogueFilters,
  setPurchaseReceiptCatalogueFilters,
  setRequisitionCatalogueFilters,
}: AppRoutesProps) {
  return (
    <Routes>
      {renderProfileRoutes({ locationSearch, navigateTo, routeQuery })}
      {renderCreateRoutes({ editingDocumentId, isLayoutConfigurationMode, locationSearch, navigateTo, routeQuery })}
      {renderListRoutes({
        navigateTo,
        purchaseInvoiceCatalogueFilters,
        purchaseOrderCatalogueFilters,
        purchaseReceiptCatalogueFilters,
        requisitionCatalogueFilters,
        setPurchaseInvoiceCatalogueFilters,
        setPurchaseOrderCatalogueFilters,
        setPurchaseReceiptCatalogueFilters,
        setRequisitionCatalogueFilters,
      })}
      {renderRedirectRoutes(locationSearch)}
    </Routes>
  );
}