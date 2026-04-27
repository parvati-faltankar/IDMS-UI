export interface CatalogueFilters {
  supplier: string;
  priority: string;
  branch: string;
  startDate: string;
  endDate: string;
  poDateFrom: string;
  poDateTo: string;
  prDateFrom: string;
  prDateTo: string;
  statuses: string[];
  createdBy: string;
}

export const emptyCatalogueFilters: CatalogueFilters = {
  supplier: '',
  priority: '',
  branch: '',
  startDate: '',
  endDate: '',
  poDateFrom: '',
  poDateTo: '',
  prDateFrom: '',
  prDateTo: '',
  statuses: [],
  createdBy: '',
};

export function getActiveFilterCount(filters: CatalogueFilters): number {
  return Object.values(filters).filter((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return value.trim().length > 0;
  }).length;
}

export function validateDateRange(filters: CatalogueFilters): string {
  if (filters.startDate && filters.endDate && filters.endDate < filters.startDate) {
    return 'End Date cannot be earlier than Start Date.';
  }

  return '';
}
