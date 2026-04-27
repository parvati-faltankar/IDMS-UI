import type { Dispatch, SetStateAction } from 'react';
import { emptyCatalogueFilters } from '../utils/catalogueFilters';

export type NavigateTo = (nextPath: string, query?: Record<string, string>) => void;
export type CatalogueFilters = typeof emptyCatalogueFilters;
export type CatalogueFiltersSetter = Dispatch<SetStateAction<CatalogueFilters>>;

export type SharedRouteContext = {
  locationSearch: string;
  navigateTo: NavigateTo;
  routeQuery: URLSearchParams;
};

export type CreateRouteContext = SharedRouteContext & {
  editingDocumentId: string | null;
  isLayoutConfigurationMode: boolean;
};

export type ListRouteContext = {
  navigateTo: NavigateTo;
  purchaseInvoiceCatalogueFilters: CatalogueFilters;
  purchaseOrderCatalogueFilters: CatalogueFilters;
  purchaseReceiptCatalogueFilters: CatalogueFilters;
  requisitionCatalogueFilters: CatalogueFilters;
  setPurchaseInvoiceCatalogueFilters: CatalogueFiltersSetter;
  setPurchaseOrderCatalogueFilters: CatalogueFiltersSetter;
  setPurchaseReceiptCatalogueFilters: CatalogueFiltersSetter;
  setRequisitionCatalogueFilters: CatalogueFiltersSetter;
};