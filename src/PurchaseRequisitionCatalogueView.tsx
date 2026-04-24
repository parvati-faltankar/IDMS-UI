import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Ban, ChevronDown, ChevronUp, Eye, FileText, Filter, LayoutGrid, List, MoreVertical, PencilLine, Plus, Search } from 'lucide-react';
import AppShell from './components/AppShell';
import CatalogueInsightCards from './components/common/CatalogueInsightCards';
import GuidedTour, { type GuidedTourStep } from './components/common/GuidedTour';
import SideDrawer from './components/common/SideDrawer';
import CancelDocumentDialog from './components/common/CancelDocumentDialog';
import PurchaseRequisitionPreviewDrawer from './components/common/PurchaseRequisitionPreviewDrawer';
import SortableTableHeader from './components/common/SortableTableHeader';
import StatusBadge from './components/common/StatusBadge';
import TourInvitePopup from './components/common/TourInvitePopup';
import { Input, Select } from './components/common/FormControls';
import { emptyCatalogueFilters, getActiveFilterCount, validateDateRange } from './catalogueFilters';
import type { CatalogueFilters } from './catalogueFilters';
import {
  extendedPurchaseRequisitionDocuments,
} from './purchaseRequisitionCatalogueData';
import type {
  PurchaseRequisitionDocument,
  RequisitionPriority,
  RequisitionStatus,
} from './purchaseRequisitionCatalogueData';
import { cn } from './utils/classNames';
import { buildCountInsight, formatInsightCount, getInsightPercent } from './utils/catalogueInsights';
import { formatDate, formatDateTime } from './utils/dateFormat';
import type { SortState } from './utils/sortState';

interface PurchaseRequisitionCatalogueViewProps {
  filters: CatalogueFilters;
  onFiltersChange: (value: CatalogueFilters) => void;
  onNew: () => void;
  onStartCreateTour?: () => void;
  onEdit: (documentId: string) => void;
  onNavigateToList: () => void;
  onNavigateToPurchaseOrderList?: () => void;
}

type SortKey =
  | 'number'
  | 'documentDateTime'
  | 'supplierName'
  | 'requesterName'
  | 'priority'
  | 'requirementDate'
  | 'validTillDate'
  | 'status';

let isPurchaseRequisitionTourDismissedForSession = false;

const purchaseRequisitionCatalogueTourSteps: GuidedTourStep[] = [
  {
    id: 'catalogue-overview',
    target: '[data-tour="pr-catalogue-title"]',
    title: 'Start with your requisition catalogue',
    body: 'This is where purchase requisitions are tracked, searched, filtered, and opened for quick review.',
  },
  {
    id: 'catalogue-insights',
    target: '[data-tour="pr-insight-cards"]',
    title: 'Scan key requisition health',
    body: 'Use these compact insights to quickly filter by important states like open, approval, or high-priority requests.',
  },
  {
    id: 'catalogue-table',
    target: '[data-tour="pr-catalogue-table"]',
    title: 'Review records in the list',
    body: 'Document numbers open a read-only preview drawer, while row actions let you view, edit, or cancel where allowed.',
  },
  {
    id: 'catalogue-new',
    target: '[data-tour="pr-new-button"]',
    title: 'Create a new requisition',
    body: 'Click New when you are ready to raise an internal request for items before procurement.',
  },
];

const FilterDrawer: React.FC<{
  isOpen: boolean;
  draftFilters: CatalogueFilters;
  supplierOptions: string[];
  branchOptions: string[];
  dateRangeError: string;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  onFilterChange: (field: keyof CatalogueFilters, value: string) => void;
}> = ({
  isOpen,
  draftFilters,
  supplierOptions,
  branchOptions,
  dateRangeError,
  onClose,
  onApply,
  onReset,
  onFilterChange,
}) => {
  const firstFieldRef = useRef<HTMLSelectElement | null>(null);

  return (
    <SideDrawer
      isOpen={isOpen}
      title="Filters"
      subtitle="Narrow down purchase requisitions using business-ready criteria."
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
        <label className="drawer-form__field">
          <span className="field-label">Supplier</span>
          <Select
            ref={firstFieldRef}
            value={draftFilters.supplier}
            onChange={(event) => onFilterChange('supplier', event.target.value)}
            className="field-select"
            options={[
              { value: '', label: 'All suppliers' },
              ...supplierOptions.map((supplier) => ({ value: supplier, label: supplier })),
            ]}
          >
          </Select>
        </label>

        <label className="drawer-form__field">
          <span className="field-label">Priority</span>
          <Select
            value={draftFilters.priority}
            onChange={(event) => onFilterChange('priority', event.target.value)}
            className="field-select"
            options={[
              { value: '', label: 'All priorities' },
              { value: 'Low', label: 'Low' },
              { value: 'Medium', label: 'Medium' },
              { value: 'High', label: 'High' },
              { value: 'Critical', label: 'Critical' },
            ]}
          >
          </Select>
        </label>

        <label className="drawer-form__field">
          <span className="field-label">Branch</span>
          <Select
            value={draftFilters.branch}
            onChange={(event) => onFilterChange('branch', event.target.value)}
            className="field-select"
            options={[
              { value: '', label: 'All branches' },
              ...branchOptions.map((branch) => ({ value: branch, label: branch })),
            ]}
          >
          </Select>
        </label>

        <div className="drawer-form__date-grid">
          <label className="drawer-form__field">
            <span className="field-label">Start Date</span>
            <Input
              type="date"
              value={draftFilters.startDate}
              onChange={(event) => onFilterChange('startDate', event.target.value)}
              max={draftFilters.endDate || undefined}
            />
          </label>

          <label className="drawer-form__field">
            <span className="field-label">End Date</span>
            <Input
              type="date"
              value={draftFilters.endDate}
              onChange={(event) => onFilterChange('endDate', event.target.value)}
              min={draftFilters.startDate || undefined}
              error={dateRangeError}
            />
          </label>
        </div>

        {dateRangeError && <p className="field-error">{dateRangeError}</p>}
      </div>
    </SideDrawer>
  );
};

function getRequisitionCardAmount(document: PurchaseRequisitionDocument): string {
  const totalRequestedQty = document.productLines.reduce(
    (sum, line) => sum + Number.parseFloat(line.requestedQty || '0'),
    0
  );

  return totalRequestedQty.toFixed(2);
}

const RequisitionCard: React.FC<{
  item: PurchaseRequisitionDocument;
  isExpanded: boolean;
  isMenuOpen: boolean;
  setActionMenuRef: (element: HTMLDivElement | null) => void;
  onToggleExpand: () => void;
  onToggleMenu: () => void;
  onView: () => void;
  onEdit: () => void;
  onCancel: () => void;
}> = ({
  item,
  isExpanded,
  isMenuOpen,
  setActionMenuRef,
  onToggleExpand,
  onToggleMenu,
  onView,
  onEdit,
  onCancel,
}) => {
  const isCancelled = item.status === 'Cancelled';
  const documentDate = formatDate(item.documentDateTime.slice(0, 10));
  const createdDate = formatDate(item.documentDateTime.slice(0, 10));
  const displayAmount = getRequisitionCardAmount(item);

  return (
    <article className="catalogue-card">
      <div className="catalogue-card__top">
        <div className="catalogue-card__identity">
          <button type="button" onClick={onView} className="catalogue-card__number">
            {item.number}
          </button>
          <div className="catalogue-card__date">{documentDate}</div>
        </div>

        <div className="catalogue-card__top-actions">
          <StatusBadge kind="requisition-status" value={item.status} />
          <div ref={setActionMenuRef} className="catalogue-action-menu">
            <button
              type="button"
              onClick={onToggleMenu}
              className="catalogue-action-menu__trigger"
              aria-label={`Open actions for ${item.number}`}
              aria-expanded={isMenuOpen}
            >
              <MoreVertical size={15} />
            </button>

            {isMenuOpen && (
              <div className="catalogue-action-menu__panel" role="menu" aria-label={`Actions for ${item.number}`}>
                <button type="button" className="catalogue-action-menu__item" role="menuitem" onClick={onView}>
                  <Eye size={16} />
                  View
                </button>
                <button type="button" className="catalogue-action-menu__item" role="menuitem" onClick={onEdit}>
                  <PencilLine size={16} />
                  Edit
                </button>
                <button
                  type="button"
                  className="catalogue-action-menu__item catalogue-action-menu__item--danger"
                  role="menuitem"
                  disabled={isCancelled}
                  onClick={onCancel}
                >
                  <Ban size={16} />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="catalogue-card__body">
          <div className="catalogue-card__info-grid">
            <div className="catalogue-card__label">Supplier:</div>
            <div className="catalogue-card__value">
              <span>{item.supplierName}</span>
            </div>

            <div className="catalogue-card__label">Department:</div>
            <div className="catalogue-card__value">{item.department}</div>

            <div className="catalogue-card__label">Requirement date:</div>
            <div className="catalogue-card__value">{formatDate(item.requirementDate)}</div>

            <div className="catalogue-card__label">Created by:</div>
            <div className="catalogue-card__value">{item.requesterName}</div>

            <div className="catalogue-card__label">Created date:</div>
            <div className="catalogue-card__value">{createdDate}</div>

            <div className="catalogue-card__label">Amount (₹):</div>
            <div className="catalogue-card__value">{displayAmount}</div>
          </div>
        </div>
      )}

      <div className="catalogue-card__footer">
        <StatusBadge kind="priority" value={item.priority} />
        <button type="button" onClick={onToggleExpand} className="catalogue-card__expand-toggle">
          {isExpanded ? 'Close' : 'Open'}
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>
    </article>
  );
};

const PurchaseRequisitionCatalogueView: React.FC<PurchaseRequisitionCatalogueViewProps> = ({
  filters,
  onFiltersChange,
  onNew,
  onStartCreateTour,
  onEdit,
  onNavigateToList,
  onNavigateToPurchaseOrderList,
}) => {
  const [documents, setDocuments] = useState<PurchaseRequisitionDocument[]>(extendedPurchaseRequisitionDocuments);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [previewDocumentId, setPreviewDocumentId] = useState<string | null>(null);
  const [draftFilters, setDraftFilters] = useState<CatalogueFilters>(filters);
  const [tableSearch, setTableSearch] = useState('');
  const [catalogueViewMode, setCatalogueViewMode] = useState<'list' | 'grid'>('list');
  const [dateRangeError, setDateRangeError] = useState('');
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [cancelDocumentId, setCancelDocumentId] = useState<string | null>(null);
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});
  const [activeInsightKey, setActiveInsightKey] = useState<string | null>(null);
  const [isTourInviteVisible, setIsTourInviteVisible] = useState(() => !isPurchaseRequisitionTourDismissedForSession);
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [sortState, setSortState] = useState<SortState<SortKey>>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
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

  const branchOptions = useMemo(
    () => Array.from(new Set(documents.map((item) => item.branch))).sort(),
    [documents]
  );

  const baseFilteredRows = useMemo(() => {
    const startDate = filters.startDate;
    const endDate = filters.endDate;
    const normalizedSearch = tableSearch.trim().toLowerCase();

    return documents.filter((item) => {
      const matchesSupplier = !filters.supplier || item.supplierName === filters.supplier;
      const matchesPriority = !filters.priority || item.priority === filters.priority;
      const matchesBranch = !filters.branch || item.branch === filters.branch;
      const matchesStartDate = !startDate || item.requirementDate >= startDate;
      const matchesEndDate = !endDate || item.validTillDate <= endDate;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        item.number.toLowerCase().includes(normalizedSearch) ||
        item.supplierName.toLowerCase().includes(normalizedSearch) ||
        item.requesterName.toLowerCase().includes(normalizedSearch) ||
        item.priority.toLowerCase().includes(normalizedSearch) ||
        item.status.toLowerCase().includes(normalizedSearch) ||
        formatDate(item.requirementDate).toLowerCase().includes(normalizedSearch) ||
        formatDate(item.validTillDate).toLowerCase().includes(normalizedSearch);

      return matchesSupplier && matchesPriority && matchesBranch && matchesStartDate && matchesEndDate && matchesSearch;
    });
  }, [documents, filters, tableSearch]);

  const sortedRows = useMemo(() => {
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

      if (activeInsightKey === 'converted') {
        return item.productLines.some((line) => line.status === 'Partially Ordered' || line.status === 'Fully Ordered');
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
        case 'documentDateTime':
          comparison = new Date(left.documentDateTime).getTime() - new Date(right.documentDateTime).getTime();
          break;
        case 'supplierName':
          comparison = left.supplierName.localeCompare(right.supplierName);
          break;
        case 'requesterName':
          comparison = left.requesterName.localeCompare(right.requesterName);
          break;
        case 'priority':
          comparison = priorityOrder[left.priority] - priorityOrder[right.priority];
          break;
        case 'requirementDate':
          comparison = new Date(left.requirementDate).getTime() - new Date(right.requirementDate).getTime();
          break;
        case 'validTillDate':
          comparison = new Date(left.validTillDate).getTime() - new Date(right.validTillDate).getTime();
          break;
        case 'status':
          comparison = statusOrder[left.status] - statusOrder[right.status];
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
    const converted = baseFilteredRows.filter((item) =>
      item.productLines.some((line) => line.status === 'Partially Ordered' || line.status === 'Fully Ordered')
    ).length;

    return [
      buildCountInsight({
        key: 'all',
        label: 'Visible requisitions',
        count: total,
        total,
        support: `${formatInsightCount(total)} requisitions in current view`,
        hint: 'All searchable requisitions',
        tone: 'neutral',
      }),
      buildCountInsight({
        key: 'pending',
        label: 'Pending approval',
        count: pending,
        total,
        support: `${pending} awaiting approval`,
        hint: `${getInsightPercent(pending, total)}% of visible PRs`,
        tone: 'warning',
      }),
      buildCountInsight({
        key: 'approved',
        label: 'Approved',
        count: approved,
        total,
        support: `${approved} ready for conversion`,
        hint: `${getInsightPercent(approved, total)}% approval health`,
        tone: 'success',
      }),
      buildCountInsight({
        key: 'converted',
        label: 'Converted lines',
        count: converted,
        total,
        support: `${converted} PRs linked to ordering`,
        hint: 'Partially or fully ordered',
        tone: 'primary',
      }),
    ];
  }, [baseFilteredRows]);

  const activeFilterCount = useMemo(() => getActiveFilterCount(filters), [filters]);
  const hasActiveFilters = activeFilterCount > 0;
  const previewDocument = useMemo(
    () => documents.find((document) => document.id === previewDocumentId) ?? null,
    [documents, previewDocumentId]
  );
  const cancelDocument = useMemo(
    () => documents.find((document) => document.id === cancelDocumentId) ?? null,
    [cancelDocumentId, documents]
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
    setDateRangeError(validateDateRange(nextFilters));
  };

  const handleApplyFilters = () => {
    const validationError = validateDateRange(draftFilters);
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
    setOpenActionMenuId(null);
    onEdit(documentId);
  };

  const handleOpenCancelDialog = (documentId: string) => {
    const document = documents.find((item) => item.id === documentId);
    if (!document) {
      return;
    }

    setOpenActionMenuId(null);
    setCancelDocumentId(documentId);
  };

  const handleConfirmCancelDocument = () => {
    if (!cancelDocumentId) {
      return;
    }

    setDocuments((currentDocuments) =>
      currentDocuments.map((item) =>
        item.id === cancelDocumentId
          ? {
              ...item,
              status: 'Cancelled',
            }
          : item
      )
    );
    setCancelDocumentId(null);
  };

  const handleToggleCard = (documentId: string) => {
    setExpandedCardIds((current) => ({
      ...current,
      [documentId]: current[documentId] === false,
    }));
  };

  const dismissTourForSession = () => {
    isPurchaseRequisitionTourDismissedForSession = true;
    setIsTourInviteVisible(false);
    setIsTourActive(false);
  };

  const handleTakeTour = () => {
    setCatalogueViewMode('list');
    setIsTourInviteVisible(false);
    setIsTourActive(true);
    setTourStepIndex(0);
  };

  const handleTourNext = () => {
    const currentStep = purchaseRequisitionCatalogueTourSteps[tourStepIndex];
    if (currentStep?.id === 'catalogue-new') {
      isPurchaseRequisitionTourDismissedForSession = true;
      setIsTourActive(false);
      onStartCreateTour?.();
      return;
    }

    setTourStepIndex((current) =>
      Math.min(current + 1, purchaseRequisitionCatalogueTourSteps.length - 1)
    );
  };

  return (
    <AppShell
      activeLeaf="purchase-requisition"
      onPurchaseRequisitionClick={onNavigateToList}
      onPurchaseOrderClick={onNavigateToPurchaseOrderList}
    >
      <div className="catalogue-toolbar">
        <div className="catalogue-toolbar__inner catalogue-toolbar__inner--stacked">
          <div className="catalogue-toolbar__top">
            <div className="catalogue-toolbar__heading">
              <div className="catalogue-toolbar__title-row">
                <button type="button" className="catalogue-toolbar__title-button" aria-label="Purchase requisition views" data-tour="pr-catalogue-title">
                  <h2 className="brand-page-title">My Purchase Requisition</h2>
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
                    aria-label="Search purchase requisitions"
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
                  aria-label={hasActiveFilters ? `Filter purchase requisitions. ${activeFilterCount} filters applied.` : 'Filter purchase requisitions'}
                >
                  <Filter size={16} />
                  Filters
                  {hasActiveFilters && <span className="catalogue-filter-button__badge">{activeFilterCount}</span>}
                </button>

                <button type="button" onClick={onNew} className="btn btn--primary btn--icon-left catalogue-toolbar__primary-button" data-tour="pr-new-button">
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
          <div data-tour="pr-insight-cards">
            <CatalogueInsightCards
              items={insightItems}
              activeKey={activeInsightKey}
              ariaLabel="Purchase requisition insights"
              onSelect={(key) => setActiveInsightKey((current) => (current === key || key === 'all' ? null : key))}
            />
          </div>
        )}

        <section>
          <div>
            <div className="catalogue-table-toolbar">
            </div>

            {loadState === 'loading' && (
              <div className="space-y-3" aria-live="polite">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-14 animate-pulse rounded bg-slate-100" />
                ))}
              </div>
            )}

            {loadState === 'error' && (
              <div className="rounded border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
                Purchase requisitions could not be loaded right now.
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
                <h2 className="text-lg font-bold text-slate-900">No purchase requisitions found</h2>
                <p className="mt-2 max-w-xl text-sm text-slate-500">
                  Adjust your filters or start a new requisition to populate this catalogue.
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  {hasActiveFilters && (
                    <button type="button" onClick={handleResetFilters} className="btn btn--outline">
                      Clear filters
                    </button>
                  )}
                  <button type="button" onClick={onNew} className="btn btn--primary">
                    Create New Requisition
                  </button>
                </div>
              </div>
            )}

            {loadState === 'ready' && sortedRows.length > 0 && catalogueViewMode === 'list' && (
              <div className="catalogue-table-scroll" data-tour="pr-catalogue-table">
                <table className="catalogue-table">
                  <thead>
                    <tr>
                      <SortableTableHeader label="Document No." sortKey="number" sortState={sortState} onSortChange={handleSortChange} />
                      <SortableTableHeader label="Document date & time" sortKey="documentDateTime" sortState={sortState} onSortChange={handleSortChange} dataType="date" />
                      <SortableTableHeader label="Supplier name" sortKey="supplierName" sortState={sortState} onSortChange={handleSortChange} />
                      <SortableTableHeader label="Requester name" sortKey="requesterName" sortState={sortState} onSortChange={handleSortChange} />
                      <SortableTableHeader label="Priority" sortKey="priority" sortState={sortState} onSortChange={handleSortChange} dataType="status" />
                      <SortableTableHeader label="Requirement date" sortKey="requirementDate" sortState={sortState} onSortChange={handleSortChange} dataType="date" />
                      <SortableTableHeader label="Valid till date" sortKey="validTillDate" sortState={sortState} onSortChange={handleSortChange} dataType="date" />
                      <SortableTableHeader label="Status" sortKey="status" sortState={sortState} onSortChange={handleSortChange} dataType="status" />
                      <th className="catalogue-table__action-header">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((item) => {
                      const documentDateTime = formatDateTime(item.documentDateTime);

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
                            <div className="catalogue-table__datetime">
                              {documentDateTime.dateLabel}, {documentDateTime.timeLabel}
                            </div>
                          </td>
                          <td>
                            <div className="catalogue-table__truncate" title={item.supplierName}>
                              {item.supplierName}
                            </div>
                          </td>
                          <td>
                            <div className="catalogue-table__primary">{item.requesterName}</div>
                          </td>
                          <td>
                            <StatusBadge kind="priority" value={item.priority} />
                          </td>
                          <td>{formatDate(item.requirementDate)}</td>
                          <td>{formatDate(item.validTillDate)}</td>
                          <td>
                            <StatusBadge kind="requisition-status" value={item.status} />
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
                                  <button type="button" className="catalogue-action-menu__item" role="menuitem" onClick={() => handleEditDocument(item.id)}>
                                    <PencilLine size={16} />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="catalogue-action-menu__item catalogue-action-menu__item--danger"
                                    role="menuitem"
                                    disabled={item.status === 'Cancelled'}
                                    onClick={() => handleOpenCancelDialog(item.id)}
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

            {loadState === 'ready' && sortedRows.length > 0 && catalogueViewMode === 'grid' && (
              <div className="catalogue-card-grid">
                {sortedRows.map((item) => (
                  <RequisitionCard
                    key={item.id}
                    item={item}
                    isExpanded={expandedCardIds[item.id] !== false}
                    isMenuOpen={openActionMenuId === item.id}
                    setActionMenuRef={(element) => {
                      actionMenuRefs.current[item.id] = element;
                    }}
                    onToggleExpand={() => handleToggleCard(item.id)}
                    onToggleMenu={() => setOpenActionMenuId((current) => (current === item.id ? null : item.id))}
                    onView={() => handleViewDocument(item.id)}
                    onEdit={() => handleEditDocument(item.id)}
                    onCancel={() => handleOpenCancelDialog(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        draftFilters={draftFilters}
        supplierOptions={supplierOptions}
        branchOptions={branchOptions}
        dateRangeError={dateRangeError}
        onClose={() => setIsFilterDrawerOpen(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        onFilterChange={handleFilterChange}
      />

      <PurchaseRequisitionPreviewDrawer
        document={previewDocument}
        isOpen={Boolean(previewDocument)}
        onClose={() => setPreviewDocumentId(null)}
        onEdit={(document) => handleEditDocument(document.id)}
        onCancel={(document) => {
          setPreviewDocumentId(null);
          handleOpenCancelDialog(document.id);
        }}
        canEdit={previewDocument?.status !== 'Cancelled'}
        canCancel={previewDocument?.status !== 'Cancelled'}
      />

      <CancelDocumentDialog
        isOpen={Boolean(cancelDocument)}
        documentTypeLabel="purchase requisition"
        documentNumber={cancelDocument?.number ?? ''}
        onClose={() => setCancelDocumentId(null)}
        onConfirm={() => handleConfirmCancelDocument()}
      />

      {isTourInviteVisible && !isTourActive && (
        <TourInvitePopup
          title="Purchase Requisition"
          description="Raise internal item requests before procurement. Create, track, and manage required materials from one catalogue."
          onTakeTour={handleTakeTour}
          onSkip={dismissTourForSession}
        />
      )}
      <GuidedTour
        isOpen={isTourActive}
        steps={purchaseRequisitionCatalogueTourSteps}
        currentStepIndex={tourStepIndex}
        onNext={handleTourNext}
        onBack={() => setTourStepIndex((current) => Math.max(current - 1, 0))}
        onSkip={dismissTourForSession}
      />
    </AppShell>
  );
};

export default PurchaseRequisitionCatalogueView;
