import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Ban,
  ChevronDown,
  Eye,
  FileText,
  Filter,
  LayoutGrid,
  List,
  MoreVertical,
  PencilLine,
  Plus,
  Search,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import CatalogueInsightCards from '../components/common/CatalogueInsightCards';
import DocumentPreviewDrawer from '../components/common/DocumentPreviewDrawer';
import SideDrawer from '../components/common/SideDrawer';
import SortableTableHeader from '../components/common/SortableTableHeader';
import StatusBadge from '../components/common/StatusBadge';
import { Input, Select } from '../components/common/FormControls';
import { emptyCatalogueFilters, getActiveFilterCount } from '../catalogueFilters';
import type { CatalogueFilters } from '../catalogueFilters';
import type { RequisitionPriority, RequisitionStatus } from '../purchaseRequisitionCatalogueData';
import { cn } from '../utils/classNames';
import { buildCountInsight, formatInsightAmount, formatInsightCount, getInsightPercent, sumNumericValues } from '../utils/catalogueInsights';
import { formatDate, formatDateTime } from '../utils/dateFormat';
import type { SortState } from '../utils/sortState';
import { buildNumberColumnAggregation, formatTableAggregationNumber } from '../utils/tableColumnAggregations';
import { useBusinessSettings } from '../utils/businessSettings';
import { extendedPurchaseOrderDocuments as extendedPurchaseInvoiceDocuments, type PurchaseOrderDocument as PurchaseInvoiceDocument } from './purchaseInvoiceData';

interface PurchaseInvoiceListProps {
  filters: CatalogueFilters;
  onFiltersChange: (value: CatalogueFilters) => void;
  onNew: () => void;
  onEdit: (documentId: string) => void;
  onNavigateToPurchaseInvoiceList: () => void;
  onNavigateToPurchaseReceiptList: () => void;
  onNavigateToPurchaseOrderList: () => void;
  onNavigateToPurchaseRequisitionList: () => void;
}

type SortKey =
  | 'number'
  | 'poDate'
  | 'requisitionNumber'
  | 'requisitionDate'
  | 'supplierName'
  | 'department'
  | 'priority'
  | 'status'
  | 'taxableAmount'
  | 'totalDiscount'
  | 'totalTaxes'
  | 'totalAmount'
  | 'createdBy'
  | 'createdOn';

function validatePurchaseOrderDateRanges(filters: CatalogueFilters): string {
  if (filters.poDateFrom && filters.poDateTo && filters.poDateTo < filters.poDateFrom) {
    return 'PO Date To cannot be earlier than PO Date From.';
  }

  if (filters.prDateFrom && filters.prDateTo && filters.prDateTo < filters.prDateFrom) {
    return 'PR Date To cannot be earlier than PR Date From.';
  }

  return '';
}

function matchesPurchaseOrderPriority(filterPriority: string, documentPriority: RequisitionPriority): boolean {
  if (!filterPriority) {
    return true;
  }

  if (filterPriority === 'Urgent') {
    return documentPriority === 'Critical';
  }

  return documentPriority === filterPriority;
}

const FilterDrawer: React.FC<{
  isOpen: boolean;
  draftFilters: CatalogueFilters;
  supplierOptions: string[];
  createdByOptions: string[];
  dateRangeError: string;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  onFilterChange: (field: keyof CatalogueFilters, value: string) => void;
  onStatusToggle: (status: RequisitionStatus) => void;
}> = ({
  isOpen,
  draftFilters,
  supplierOptions,
  createdByOptions,
  dateRangeError,
  onClose,
  onApply,
  onReset,
  onFilterChange,
  onStatusToggle,
}) => {
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const poDateError = dateRangeError.includes('PO Date') ? dateRangeError : '';
  const prDateError = dateRangeError.includes('PR Date') ? dateRangeError : '';

  return (
    <SideDrawer
      isOpen={isOpen}
      title="Filters"
      subtitle="Refine purchase invoices using date, status, supplier, priority, and creator criteria."
      onClose={onClose}
      initialFocusRef={firstFieldRef}
      panelClassName="side-drawer__panel--narrow"
      footer={
        <>
          <button type="button" onClick={onReset} className="btn btn--outline">
            Reset
          </button>
          <button type="button" onClick={onApply} className="btn btn--primary">
            Apply
          </button>
        </>
      }
    >
      <div className="drawer-form">
        <div className="drawer-form__date-grid">
          <label className="drawer-form__field">
            <span className="field-label">PO Date From</span>
            <Input
              ref={firstFieldRef}
              type="date"
              value={draftFilters.poDateFrom}
              onChange={(event) => onFilterChange('poDateFrom', event.target.value)}
              max={draftFilters.poDateTo || undefined}
            />
          </label>

          <label className="drawer-form__field">
            <span className="field-label">PO Date To</span>
            <Input
              type="date"
              value={draftFilters.poDateTo}
              onChange={(event) => onFilterChange('poDateTo', event.target.value)}
              min={draftFilters.poDateFrom || undefined}
              error={poDateError}
            />
          </label>
        </div>

        {poDateError && <p className="field-error">{poDateError}</p>}

        <div className="drawer-form__date-grid">
          <label className="drawer-form__field">
            <span className="field-label">PR Date From</span>
            <Input
              type="date"
              value={draftFilters.prDateFrom}
              onChange={(event) => onFilterChange('prDateFrom', event.target.value)}
              max={draftFilters.prDateTo || undefined}
            />
          </label>

          <label className="drawer-form__field">
            <span className="field-label">PR Date To</span>
            <Input
              type="date"
              value={draftFilters.prDateTo}
              onChange={(event) => onFilterChange('prDateTo', event.target.value)}
              min={draftFilters.prDateFrom || undefined}
              error={prDateError}
            />
          </label>
        </div>

        {prDateError && <p className="field-error">{prDateError}</p>}

        <div className="drawer-form__field">
          <span className="field-label">Status</span>
          <div className="drawer-multiselect" role="group" aria-label="Select purchase invoice status filters">
            {(['Draft', 'Pending Approval', 'Approved', 'Rejected', 'Cancelled'] as RequisitionStatus[]).map((status) => {
              const isSelected = draftFilters.statuses.includes(status);

              return (
                <label
                  key={status}
                  className={cn('drawer-multiselect__option', isSelected && 'drawer-multiselect__option--selected')}
                >
                  <input
                    type="checkbox"
                    className="drawer-multiselect__checkbox"
                    checked={isSelected}
                    onChange={() => onStatusToggle(status)}
                  />
                  <span>{status}</span>
                </label>
              );
            })}
          </div>
        </div>

        <label className="drawer-form__field">
          <span className="field-label">Supplier</span>
          <Select
            value={draftFilters.supplier}
            onChange={(event) => onFilterChange('supplier', event.target.value)}
            options={[
              { value: '', label: 'All suppliers' },
              ...supplierOptions.map((supplier) => ({ value: supplier, label: supplier })),
            ]}
          />
        </label>

        <label className="drawer-form__field">
          <span className="field-label">Priority</span>
          <Select
            value={draftFilters.priority}
            onChange={(event) => onFilterChange('priority', event.target.value)}
            options={[
              { value: '', label: 'All priorities' },
              { value: 'Urgent', label: 'Urgent' },
              { value: 'High', label: 'High' },
              { value: 'Medium', label: 'Medium' },
              { value: 'Low', label: 'Low' },
            ]}
          />
        </label>

        <label className="drawer-form__field">
          <span className="field-label">Created By</span>
          <Select
            value={draftFilters.createdBy}
            onChange={(event) => onFilterChange('createdBy', event.target.value)}
            options={[
              { value: '', label: 'All creators' },
              ...createdByOptions.map((createdBy) => ({ value: createdBy, label: createdBy })),
            ]}
          />
        </label>
      </div>
    </SideDrawer>
  );
};

const PurchaseInvoicePreviewDrawer: React.FC<{
  document: PurchaseInvoiceDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (document: PurchaseInvoiceDocument) => void;
  onCancel: (document: PurchaseInvoiceDocument) => void;
  canEdit: boolean;
  canCancel: boolean;
}> = ({ document, isOpen, onClose, onEdit, onCancel, canEdit, canCancel }) => (
  <DocumentPreviewDrawer
    document={document}
    isOpen={isOpen}
    documentTypeLabel="Purchase Invoice"
    subtitle="Purchase Invoice preview"
    onClose={onClose}
    onEdit={onEdit}
    onCancel={onCancel}
    canEdit={document?.status !== 'Cancelled' && canEdit}
    canCancel={document?.status !== 'Cancelled' && canCancel}
  />
);

const PurchaseInvoiceList: React.FC<PurchaseInvoiceListProps> = ({
  filters,
  onFiltersChange,
  onNew,
  onEdit,
  onNavigateToPurchaseInvoiceList,
  onNavigateToPurchaseReceiptList,
  onNavigateToPurchaseOrderList,
  onNavigateToPurchaseRequisitionList,
}) => {
  const [documents, setDocuments] = useState<PurchaseInvoiceDocument[]>(extendedPurchaseInvoiceDocuments);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [previewDocumentId, setPreviewDocumentId] = useState<string | null>(null);
  const [draftFilters, setDraftFilters] = useState<CatalogueFilters>(filters);
  const [tableSearch, setTableSearch] = useState('');
  const [catalogueViewMode, setCatalogueViewMode] = useState<'list' | 'grid'>('list');
  const [dateRangeError, setDateRangeError] = useState('');
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [activeInsightKey, setActiveInsightKey] = useState<string | null>(null);
  const [sortState, setSortState] = useState<SortState<SortKey>>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const businessSettings = useBusinessSettings();
  const actionSettings = businessSettings.actions.purchaseInvoice;
  const actionMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (loadState !== 'loading') {
      return;
    }

    const timer = window.setTimeout(() => {
      setLoadState('ready');
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loadState]);

  useEffect(() => {
    if (!openActionMenuId) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const menuNode = actionMenuRefs.current[openActionMenuId];
      if (menuNode && !menuNode.contains(event.target as Node)) {
        setOpenActionMenuId(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenActionMenuId(null);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [openActionMenuId]);

  const supplierOptions = useMemo(
    () => Array.from(new Set(documents.map((item) => item.supplierName))).sort(),
    [documents]
  );

  const createdByOptions = useMemo(
    () => Array.from(new Set(documents.map((item) => item.createdBy))).sort(),
    [documents]
  );

  const baseFilteredRows = useMemo(() => {
    const normalizedSearch = tableSearch.trim().toLowerCase();

    return documents.filter((item) => {
      const matchesSupplier = !filters.supplier || item.supplierName === filters.supplier;
      const matchesPriority = matchesPurchaseOrderPriority(filters.priority, item.priority);
      const matchesStatuses = filters.statuses.length === 0 || filters.statuses.includes(item.status);
      const matchesCreatedBy = !filters.createdBy || item.createdBy === filters.createdBy;
      const matchesPoDateFrom = !filters.poDateFrom || item.orderDateTime.slice(0, 10) >= filters.poDateFrom;
      const matchesPoDateTo = !filters.poDateTo || item.orderDateTime.slice(0, 10) <= filters.poDateTo;
      const matchesPrDateFrom = !filters.prDateFrom || item.requisitionDate >= filters.prDateFrom;
      const matchesPrDateTo = !filters.prDateTo || item.requisitionDate <= filters.prDateTo;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        item.number.toLowerCase().includes(normalizedSearch) ||
        item.requisitionNumber.toLowerCase().includes(normalizedSearch) ||
        item.supplierName.toLowerCase().includes(normalizedSearch) ||
        item.department.toLowerCase().includes(normalizedSearch) ||
        item.createdBy.toLowerCase().includes(normalizedSearch) ||
        item.status.toLowerCase().includes(normalizedSearch) ||
        item.priority.toLowerCase().includes(normalizedSearch);

      return (
        matchesSupplier &&
        matchesPriority &&
        matchesStatuses &&
        matchesCreatedBy &&
        matchesPoDateFrom &&
        matchesPoDateTo &&
        matchesPrDateFrom &&
        matchesPrDateTo &&
        matchesSearch
      );
    });
  }, [documents, filters, tableSearch]);

  const sortedRows = useMemo(() => {
    const totalValue = sumNumericValues(baseFilteredRows, (item) => item.totalAmount);
    const averageValue = baseFilteredRows.length ? totalValue / baseFilteredRows.length : 0;
    const insightFilteredRows = baseFilteredRows.filter((item) => {
      if (!activeInsightKey || activeInsightKey === 'all') {
        return true;
      }

      if (activeInsightKey === 'pending') {
        return item.status === 'Pending Approval';
      }

      if (activeInsightKey === 'approved') {
        return item.status === 'Approved';
      }

      if (activeInsightKey === 'high-value') {
        return Number.parseFloat(item.totalAmount || '0') >= averageValue;
      }

      return true;
    });

    if (!sortState) {
      return insightFilteredRows;
    }

    const priorityOrder: Record<RequisitionPriority, number> = {
      Low: 1,
      Medium: 2,
      High: 3,
      Critical: 4,
    };

    const statusOrder: Record<RequisitionStatus, number> = {
      Draft: 1,
      'Pending Approval': 2,
      Approved: 3,
      Rejected: 4,
      Cancelled: 5,
    };

    const directionFactor = sortState.direction === 'asc' ? 1 : -1;
    const rows = [...insightFilteredRows];

    rows.sort((left, right) => {
      let comparison = 0;

      switch (sortState.key) {
        case 'number':
          comparison = left.number.localeCompare(right.number, undefined, { numeric: true });
          break;
        case 'poDate':
          comparison = new Date(left.orderDateTime).getTime() - new Date(right.orderDateTime).getTime();
          break;
        case 'requisitionNumber':
          comparison = left.requisitionNumber.localeCompare(right.requisitionNumber, undefined, { numeric: true });
          break;
        case 'requisitionDate':
          comparison = new Date(left.requisitionDate).getTime() - new Date(right.requisitionDate).getTime();
          break;
        case 'supplierName':
          comparison = left.supplierName.localeCompare(right.supplierName);
          break;
        case 'department':
          comparison = left.department.localeCompare(right.department);
          break;
        case 'priority':
          comparison = priorityOrder[left.priority] - priorityOrder[right.priority];
          break;
        case 'status':
          comparison = statusOrder[left.status] - statusOrder[right.status];
          break;
        case 'taxableAmount':
          comparison = Number.parseFloat(left.taxableAmount) - Number.parseFloat(right.taxableAmount);
          break;
        case 'totalDiscount':
          comparison = Number.parseFloat(left.totalDiscount) - Number.parseFloat(right.totalDiscount);
          break;
        case 'totalTaxes':
          comparison = Number.parseFloat(left.totalTaxes) - Number.parseFloat(right.totalTaxes);
          break;
        case 'totalAmount':
          comparison = Number.parseFloat(left.totalAmount) - Number.parseFloat(right.totalAmount);
          break;
        case 'createdBy':
          comparison = left.createdBy.localeCompare(right.createdBy);
          break;
        case 'createdOn':
          comparison = new Date(left.createdOn).getTime() - new Date(right.createdOn).getTime();
          break;
      }

      if (comparison === 0) {
        comparison = left.number.localeCompare(right.number, undefined, { numeric: true });
      }

      return comparison * directionFactor;
    });

    return rows;
  }, [activeInsightKey, baseFilteredRows, sortState]);

  const insightItems = useMemo(() => {
    const total = baseFilteredRows.length;
    const pending = baseFilteredRows.filter((item) => item.status === 'Pending Approval').length;
    const approved = baseFilteredRows.filter((item) => item.status === 'Approved').length;
    const totalValue = sumNumericValues(baseFilteredRows, (item) => item.totalAmount);
    const averageValue = total ? totalValue / total : 0;
    const highValue = baseFilteredRows.filter((item) => Number.parseFloat(item.totalAmount || '0') >= averageValue).length;

    return [
      buildCountInsight({
        key: 'all',
        label: 'Visible invoices',
        count: total,
        total,
        support: `${formatInsightCount(total)} purchase invoices`,
        hint: `${formatInsightAmount(totalValue)} visible value`,
        tone: 'neutral',
      }),
      buildCountInsight({
        key: 'pending',
        label: 'Pending approval',
        count: pending,
        total,
        support: `${pending} invoices need review`,
        hint: `${getInsightPercent(pending, total)}% pending`,
        tone: 'warning',
      }),
      buildCountInsight({
        key: 'approved',
        label: 'Approved',
        count: approved,
        total,
        support: `${approved} invoices cleared`,
        hint: `${getInsightPercent(approved, total)}% approved`,
        tone: 'success',
      }),
      buildCountInsight({
        key: 'high-value',
        label: 'High value invoices',
        count: highValue,
        total,
        support: `${highValue} above average value`,
        hint: `Average ${formatInsightAmount(averageValue)}`,
        tone: 'primary',
      }),
    ];
  }, [baseFilteredRows]);

  const activeFilterCount = useMemo(() => getActiveFilterCount(filters), [filters]);
  const hasActiveFilters = activeFilterCount > 0;
  const taxableAmountAggregation = useMemo(
    () =>
      buildNumberColumnAggregation(sortedRows, {
        selector: (item) => item.taxableAmount,
        formatter: formatTableAggregationNumber,
      }),
    [sortedRows]
  );
  const totalDiscountAggregation = useMemo(
    () =>
      buildNumberColumnAggregation(sortedRows, {
        selector: (item) => item.totalDiscount,
        formatter: formatTableAggregationNumber,
      }),
    [sortedRows]
  );
  const totalTaxesAggregation = useMemo(
    () =>
      buildNumberColumnAggregation(sortedRows, {
        selector: (item) => item.totalTaxes,
        formatter: formatTableAggregationNumber,
      }),
    [sortedRows]
  );
  const totalAmountAggregation = useMemo(
    () =>
      buildNumberColumnAggregation(sortedRows, {
        selector: (item) => item.totalAmount,
        formatter: formatTableAggregationNumber,
      }),
    [sortedRows]
  );
  const previewDocument = useMemo(
    () => documents.find((document) => document.id === previewDocumentId) ?? null,
    [documents, previewDocumentId]
  );

  const openFilterDrawer = () => {
    setDraftFilters(filters);
    setDateRangeError('');
    setIsFilterDrawerOpen(true);
  };

  const handleFilterChange = (field: keyof CatalogueFilters, value: string) => {
    const nextFilters = {
      ...draftFilters,
      [field]: value,
    };

    setDraftFilters(nextFilters);
    setDateRangeError(validatePurchaseOrderDateRanges(nextFilters));
  };

  const handleStatusToggle = (status: RequisitionStatus) => {
    const nextStatuses = draftFilters.statuses.includes(status)
      ? draftFilters.statuses.filter((value) => value !== status)
      : [...draftFilters.statuses, status];

    const nextFilters = {
      ...draftFilters,
      statuses: nextStatuses,
    };

    setDraftFilters(nextFilters);
    setDateRangeError(validatePurchaseOrderDateRanges(nextFilters));
  };

  const handleApplyFilters = () => {
    const validationError = validatePurchaseOrderDateRanges(draftFilters);
    if (validationError) {
      setDateRangeError(validationError);
      return;
    }

    onFiltersChange(draftFilters);
    setIsFilterDrawerOpen(false);
  };

  const handleResetFilters = () => {
    setDraftFilters(emptyCatalogueFilters);
    setDateRangeError('');
    setActiveInsightKey(null);
    onFiltersChange(emptyCatalogueFilters);
    setIsFilterDrawerOpen(false);
  };

  const handleSortChange = (key: SortKey, direction: 'asc' | 'desc' | null) => {
    setSortState(direction ? { key, direction } : null);
  };

  const handleViewDocument = (documentId: string) => {
    setPreviewDocumentId(documentId);
    setOpenActionMenuId(null);
  };

  const handleEditDocument = (documentId: string) => {
    if (!actionSettings.allowEdit) {
      return;
    }

    setOpenActionMenuId(null);
    onEdit(documentId);
  };

  const handleCancelDocument = (documentId: string) => {
    if (!actionSettings.allowCancel) {
      return;
    }

    const document = documents.find((item) => item.id === documentId);
    if (!document) {
      return;
    }

    setOpenActionMenuId(null);

    if (!window.confirm(`Cancel purchase invoice ${document.number}?`)) {
      return;
    }

    setDocuments((currentDocuments) =>
      currentDocuments.map((item) =>
        item.id === documentId
          ? {
              ...item,
              status: 'Cancelled',
            }
          : item
      )
    );
  };

  return (
    <AppShell
      activeLeaf="purchase-invoice"
      onPurchaseOrderClick={onNavigateToPurchaseOrderList}
      onPurchaseReceiptClick={onNavigateToPurchaseReceiptList}
      onPurchaseInvoiceClick={onNavigateToPurchaseInvoiceList}
      onPurchaseRequisitionClick={onNavigateToPurchaseRequisitionList}
    >
      <div className="catalogue-toolbar">
        <div className="catalogue-toolbar__inner catalogue-toolbar__inner--stacked">
          <div className="catalogue-toolbar__top">
            <div className="catalogue-toolbar__heading">
              <div className="catalogue-toolbar__title-row">
                <button type="button" className="catalogue-toolbar__title-button" aria-label="Purchase invoice views">
                  <h2 className="brand-page-title">My Purchase Invoice</h2>
                  <ChevronDown size={16} />
                </button>
                <span className="catalogue-toolbar__count">{sortedRows.length}</span>
              </div>
            </div>

            <div className="catalogue-toolbar__actions">
              <div className="catalogue-toolbar__utility-group">
                <div className="catalogue-toolbar__search">
                  <Search size={16} className="catalogue-toolbar__search-icon" />
                  <input
                    type="search"
                    value={tableSearch}
                    onChange={(event) => setTableSearch(event.target.value)}
                    placeholder="Search..."
                    className="search-input catalogue-toolbar__search-input"
                    aria-label="Search purchase invoices"
                  />
                </div>

                <div className="catalogue-view-toggle" role="group" aria-label="Catalogue view mode">
                  <button
                    type="button"
                    onClick={() => setCatalogueViewMode('list')}
                    className={cn('catalogue-view-toggle__button', catalogueViewMode === 'list' && 'catalogue-view-toggle__button--active')}
                    aria-pressed={catalogueViewMode === 'list'}
                  >
                    <List size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogueViewMode('grid')}
                    className={cn('catalogue-view-toggle__button', catalogueViewMode === 'grid' && 'catalogue-view-toggle__button--active')}
                    aria-pressed={catalogueViewMode === 'grid'}
                  >
                    <LayoutGrid size={16} />
                  </button>
                </div>
              </div>

              <div className="catalogue-toolbar__primary-group">
                <button
                  type="button"
                  onClick={openFilterDrawer}
                  className={cn('btn btn--outline btn--icon-left catalogue-filter-button', hasActiveFilters && 'catalogue-filter-button--active')}
                  aria-label={hasActiveFilters ? `Filter purchase invoices. ${activeFilterCount} filters applied.` : 'Filter purchase invoices'}
                >
                  <Filter size={16} />
                  Filters
                  {hasActiveFilters && <span className="catalogue-filter-button__badge">{activeFilterCount}</span>}
                </button>

                <button type="button" onClick={onNew} className="btn btn--primary btn--icon-left catalogue-toolbar__primary-button">
                  <Plus size={16} />
                  New
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-4 px-4 py-4">
        {loadState === 'ready' && (
          <CatalogueInsightCards
            items={insightItems}
            activeKey={activeInsightKey}
            ariaLabel="Purchase invoice insights"
            onSelect={(key) => setActiveInsightKey((current) => (current === key || key === 'all' ? null : key))}
          />
        )}

        <section>
          {loadState === 'loading' && (
            <div className="space-y-3" aria-live="polite">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-14 animate-pulse rounded bg-slate-100" />
              ))}
            </div>
          )}

          {loadState === 'error' && (
            <div className="rounded border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
              Purchase invoices could not be loaded right now.
              <button type="button" onClick={() => setLoadState('loading')} className="btn btn--outline ml-3">
                Retry
              </button>
            </div>
          )}

          {loadState === 'ready' && sortedRows.length === 0 && (
            <div className="flex flex-col items-center rounded border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
                <FileText size={28} className="text-slate-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">No purchase invoices found</h2>
              <p className="mt-2 max-w-xl text-sm text-slate-500">
                Adjust your filters or start a new order to populate this catalogue.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                {hasActiveFilters && (
                  <button type="button" onClick={handleResetFilters} className="btn btn--outline">
                    Clear filters
                  </button>
                )}
                <button type="button" onClick={onNew} className="btn btn--primary">
                  Create New Invoice
                </button>
              </div>
            </div>
          )}

          {loadState === 'ready' && sortedRows.length > 0 && (
            <div className="catalogue-table-scroll">
              <table className="catalogue-table">
                <thead>
                  <tr>
                    <SortableTableHeader label="PO No." sortKey="number" sortState={sortState} onSortChange={handleSortChange} />
                    <SortableTableHeader label="PO Date" sortKey="poDate" sortState={sortState} onSortChange={handleSortChange} dataType="date" />
                    <SortableTableHeader label="PR No." sortKey="requisitionNumber" sortState={sortState} onSortChange={handleSortChange} />
                    <SortableTableHeader label="PR Date" sortKey="requisitionDate" sortState={sortState} onSortChange={handleSortChange} dataType="date" />
                    <SortableTableHeader label="Supplier name" sortKey="supplierName" sortState={sortState} onSortChange={handleSortChange} />
                    <SortableTableHeader label="Department" sortKey="department" sortState={sortState} onSortChange={handleSortChange} />
                    <SortableTableHeader label="Priority" sortKey="priority" sortState={sortState} onSortChange={handleSortChange} dataType="status" />
                    <SortableTableHeader label="Status" sortKey="status" sortState={sortState} onSortChange={handleSortChange} dataType="status" />
                    <SortableTableHeader label="Taxable amount" sortKey="taxableAmount" sortState={sortState} onSortChange={handleSortChange} dataType="number" aggregation={taxableAmountAggregation} />
                    <SortableTableHeader label="Total Discount" sortKey="totalDiscount" sortState={sortState} onSortChange={handleSortChange} dataType="number" aggregation={totalDiscountAggregation} />
                    <SortableTableHeader label="Total taxes" sortKey="totalTaxes" sortState={sortState} onSortChange={handleSortChange} dataType="number" aggregation={totalTaxesAggregation} />
                    <SortableTableHeader label="Total amount" sortKey="totalAmount" sortState={sortState} onSortChange={handleSortChange} dataType="number" aggregation={totalAmountAggregation} />
                    <SortableTableHeader label="Created By" sortKey="createdBy" sortState={sortState} onSortChange={handleSortChange} />
                    <SortableTableHeader label="Created On" sortKey="createdOn" sortState={sortState} onSortChange={handleSortChange} dataType="date" />
                    <th className="catalogue-table__action-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((item) => {
                    const createdOn = formatDateTime(item.createdOn);

                    return (
                      <tr key={item.id}>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleViewDocument(item.id)}
                            className="catalogue-table__document-link"
                          >
                            {item.number}
                          </button>
                        </td>
                        <td>
                          <div className="catalogue-table__datetime">{formatDate(item.orderDateTime)}</div>
                        </td>
                        <td>
                          <div className="catalogue-table__truncate" title={item.requisitionNumber || 'Not linked'}>
                            {item.requisitionNumber || '-'}
                          </div>
                        </td>
                        <td>
                          <div className="catalogue-table__datetime">{formatDate(item.requisitionDate)}</div>
                        </td>
                        <td>
                          <div className="catalogue-table__truncate" title={item.supplierName}>
                            {item.supplierName}
                          </div>
                        </td>
                        <td>{item.department}</td>
                        <td>
                          <StatusBadge kind="priority" value={item.priority} />
                        </td>
                        <td>
                          <StatusBadge kind="requisition-status" value={item.status} />
                        </td>
                        <td>{item.currency} {item.taxableAmount}</td>
                        <td>{item.currency} {item.totalDiscount}</td>
                        <td>{item.currency} {item.totalTaxes}</td>
                        <td>{item.currency} {item.totalAmount}</td>
                        <td>{item.createdBy}</td>
                        <td>
                          <div className="catalogue-table__datetime">
                            {createdOn.dateLabel}, {createdOn.timeLabel}
                          </div>
                        </td>
                        <td className="catalogue-table__action-cell">
                          <div
                            ref={(element) => {
                              actionMenuRefs.current[item.id] = element;
                            }}
                            className="catalogue-action-menu"
                          >
                            <button
                              type="button"
                              onClick={() => setOpenActionMenuId((current) => (current === item.id ? null : item.id))}
                              className="catalogue-action-menu__trigger"
                              aria-label={`Open actions for ${item.number}`}
                              aria-expanded={openActionMenuId === item.id}
                            >
                              <MoreVertical size={15} />
                            </button>

                            {openActionMenuId === item.id && (
                              <div className="catalogue-action-menu__panel" role="menu" aria-label={`Actions for ${item.number}`}>
                                <button type="button" className="catalogue-action-menu__item" role="menuitem" onClick={() => handleViewDocument(item.id)}>
                                  <Eye size={16} />
                                  View
                                </button>
                                <button
                                  type="button"
                                  className="catalogue-action-menu__item"
                                  role="menuitem"
                                  disabled={!actionSettings.allowEdit}
                                  onClick={() => handleEditDocument(item.id)}
                                >
                                  <PencilLine size={16} />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="catalogue-action-menu__item catalogue-action-menu__item--danger"
                                  role="menuitem"
                                  disabled={item.status === 'Cancelled' || !actionSettings.allowCancel}
                                  onClick={() => handleCancelDocument(item.id)}
                                >
                                  <Ban size={16} />
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        draftFilters={draftFilters}
        supplierOptions={supplierOptions}
        createdByOptions={createdByOptions}
        dateRangeError={dateRangeError}
        onClose={() => setIsFilterDrawerOpen(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        onFilterChange={handleFilterChange}
        onStatusToggle={handleStatusToggle}
      />

      <PurchaseInvoicePreviewDrawer
        document={previewDocument}
        isOpen={Boolean(previewDocument)}
        onClose={() => setPreviewDocumentId(null)}
        onEdit={(document) => handleEditDocument(document.id)}
        onCancel={(document) => {
          setPreviewDocumentId(null);
          handleCancelDocument(document.id);
        }}
        canEdit={actionSettings.allowEdit}
        canCancel={actionSettings.allowCancel}
      />
    </AppShell>
  );
};

export default PurchaseInvoiceList;
