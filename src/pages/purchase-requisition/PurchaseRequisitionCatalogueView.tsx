import React, { useCallback, useEffect, useMemo, useState } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Ban, Check, ChevronRight, Circle, Columns3, Eye, FileText, Filter, LayoutGrid, List, PencilLine, Plus, Search, X } from 'lucide-react';
import AppShell from '../../components/common/AppShell';
import CatalogueInsightCards from '../../components/common/CatalogueInsightCards';
import CatalogueFieldDisplaySettings from '../../components/common/CatalogueFieldDisplaySettings';
import type { CatalogueDisplayField } from '../../components/common/CatalogueFieldDisplaySettings';
import CatalogueSectionLayoutSettings from '../../components/common/CatalogueSectionLayoutSettings';
import type { CatalogueConfigurableSection, CatalogueSectionLayoutMode } from '../../components/common/CatalogueSectionLayoutSettings';
import CatalogueViewConfigurator from '../../components/common/CatalogueViewConfigurator';
import TransactionCatalogueHeader from '../../components/common/TransactionCatalogueHeader';
import CommonDataGrid from '../../components/common/CommonDataGrid';
import DataGridRowActionMenu from '../../components/common/DataGridRowActionMenu';
import type { DataGridColumn } from '../../components/common/dataGridTypes';
import GuidedTour, { type GuidedTourStep } from '../../components/common/GuidedTour';
import EnterpriseFilterDialog, { type EnterpriseFilterSection } from '../../components/common/EnterpriseFilterDialog';
import CancelDocumentDialog from '../../components/common/CancelDocumentDialog';
import PurchaseRequisitionPreviewDrawer from '../../components/common/PurchaseRequisitionPreviewDrawer';
import StatusBadge from '../../components/common/StatusBadge';
import TourInvitePopup from '../../components/common/TourInvitePopup';
import { Input } from '../../components/common/FormControls';
import { emptyCatalogueFilters, getActiveFilterCount, validateDateRange } from '../../utils/catalogueFilters';
import type { CatalogueFilters } from '../../utils/catalogueFilters';
import {
  extendedPurchaseRequisitionDocuments,
} from './purchaseRequisitionCatalogueData';
import type {
  PurchaseRequisitionDocument,
  RequisitionPriority,
  RequisitionStatus,
} from './purchaseRequisitionCatalogueData';
import {
  filterPurchaseRequisitionDocumentsByView,
  getPurchaseRequisitionSystemViews,
  PURCHASE_REQUISITION_ALL_VIEW_ID,
  PURCHASE_REQUISITION_CATALOGUE_VIEW_ENTITY,
} from './purchaseRequisitionViews';
import { cn } from '../../utils/classNames';
import { buildCountInsight, formatInsightCount, getInsightPercent } from '../../utils/catalogueInsights';
import { formatDate, formatDateTime } from '../../utils/dateFormat';
import type { SortState } from '../../utils/sortState';
import type { CatalogueViewDefinition, EditableCatalogueViewDefinition } from '../../utils/catalogueViews';
import type { CatalogueViewModeId } from '../../utils/catalogueViewModes';
import {
  catalogueViewModeRegistry,
  getCatalogueViewModeConfig,
  loadCatalogueDisplayViewMode,
  resolveCatalogueViewMode,
  saveCatalogueDisplayViewMode,
} from '../../utils/catalogueViewModes';
import { useBusinessSettings } from '../../utils/businessSettings';
import { recordSidebarRecentDocument } from '../../utils/sidebarRecentDocuments';
import {
  createCustomCatalogueView,
  loadCatalogueViewState,
  loadCustomCatalogueViews,
  loadRecentlyViewedEntries,
  recordRecentlyViewedDocument,
  resolveCatalogueViewId,
  saveCatalogueViewState,
  saveCustomCatalogueViews,
  setLastSelectedCatalogueViewId,
  setPinnedCatalogueViewId,
  updateCustomCatalogueView,
} from '../../utils/catalogueViews';

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
const currentUserName = 'Alex Kumar';

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

const purchaseRequisitionStatusOptions = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Pending Approval', label: 'Pending Approval' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const purchaseRequisitionPriorityOptions = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' },
];

const purchaseRequisitionSortOptions = [
  { value: 'number', label: 'Document No.' },
  { value: 'documentDateTime', label: 'Document date & time' },
  { value: 'supplierName', label: 'Supplier name' },
  { value: 'requesterName', label: 'Requester name' },
  { value: 'priority', label: 'Priority' },
  { value: 'requirementDate', label: 'Requirement date' },
  { value: 'validTillDate', label: 'Valid till date' },
  { value: 'status', label: 'Status' },
];

const purchaseRequisitionCatalogueDocumentType = 'purchase-requisition';

type MultiSelectCatalogueFilterField = 'suppliers' | 'priorities' | 'branches';
type LegacySingleCatalogueFilterField = 'supplier' | 'priority' | 'branch';

const multiSelectFilterFieldMap: Record<MultiSelectCatalogueFilterField, LegacySingleCatalogueFilterField> = {
  suppliers: 'supplier',
  priorities: 'priority',
  branches: 'branch',
};
type FilterChoiceOption = {
  value: string;
  label: string;
  helper?: string;
};

function getFilterChoiceId(sectionId: string, value: string): string {
  const normalizedValue = value || 'all';

  return `pr-filter-${sectionId}-${normalizedValue.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`;
}

function getActiveChoicesSummary(values: string[], fallback: string): string {
  if (values.length === 0) {
    return fallback;
  }

  if (values.length === 1) {
    return values[0];
  }

  return `${values.length} selected`;
}

function getSelectedFilterValues(values: string[] | undefined, legacyValue: string): string[] {
  return values && values.length > 0 ? values : legacyValue ? [legacyValue] : [];
}

const FilterChoiceGroup: React.FC<{
  sectionId: string;
  name: string;
  ariaLabel: string;
  options: FilterChoiceOption[];
  selectionMode?: 'single' | 'multiple';
  value?: string;
  values?: string[];
  onChange?: (value: string) => void;
  onValuesChange?: (values: string[]) => void;
  searchValue?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  onSearchChange?: (value: string) => void;
}> = ({
  sectionId,
  name,
  ariaLabel,
  options,
  selectionMode = 'single',
  value = '',
  values = [],
  onChange,
  onValuesChange,
  searchValue = '',
  searchPlaceholder = 'Search options',
  emptyLabel = 'No options found.',
  onSearchChange,
}) => {
  const normalizedSearchValue = searchValue.trim().toLowerCase();
  const visibleOptions = normalizedSearchValue
    ? options.filter((option) => option.label.toLowerCase().includes(normalizedSearchValue))
    : options;
  const isMultiple = selectionMode === 'multiple';
  const selectedValues = isMultiple ? values : value ? [value] : [];

  const handleSelectOption = (optionValue: string) => {
    if (!isMultiple) {
      onChange?.(optionValue);
      return;
    }

    if (!optionValue) {
      onValuesChange?.([]);
      return;
    }

    const nextValues = selectedValues.includes(optionValue)
      ? selectedValues.filter((selectedValue) => selectedValue !== optionValue)
      : [...selectedValues, optionValue];

    onValuesChange?.(nextValues);
  };

  return (
    <div className="enterprise-filter-dialog__choice-stack">
      {onSearchChange && (
        <label className="enterprise-filter-dialog__search">
          <Search size={16} className="enterprise-filter-dialog__search-icon" aria-hidden="true" />
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="enterprise-filter-dialog__search-input"
          />
        </label>
      )}

      <div className="enterprise-filter-dialog__choice-list" role={isMultiple ? 'group' : 'radiogroup'} aria-label={ariaLabel}>
        {visibleOptions.map((option) => {
          const isSelected = option.value ? selectedValues.includes(option.value) : selectedValues.length === 0;
          const optionId = getFilterChoiceId(sectionId, option.value);

          return (
            <label
              key={option.value || 'all'}
              htmlFor={optionId}
              className={cn(
                'enterprise-filter-dialog__choice',
                isSelected && 'enterprise-filter-dialog__choice--selected'
              )}
            >
              <input
                id={optionId}
                type={isMultiple ? 'checkbox' : 'radio'}
                name={name}
                value={option.value}
                checked={isSelected}
                onChange={() => handleSelectOption(option.value)}
                className="enterprise-filter-dialog__choice-input"
              />
              <span className="enterprise-filter-dialog__choice-control" aria-hidden="true">
                <Check size={13} />
              </span>
              <span className="enterprise-filter-dialog__choice-copy">
                <span className="enterprise-filter-dialog__choice-title">{option.label}</span>
                {option.helper && <span className="enterprise-filter-dialog__choice-helper">{option.helper}</span>}
              </span>
            </label>
          );
        })}

        {visibleOptions.length === 0 && (
          <div className="enterprise-filter-dialog__no-results">{emptyLabel}</div>
        )}
      </div>
    </div>
  );
};

const FilterDrawer: React.FC<{
  isOpen: boolean;
  draftFilters: CatalogueFilters;
  supplierOptions: string[];
  branchOptions: string[];
  dateRangeError: string;
  onClose: () => void;
  onApply: () => void;
  onClearAll: () => void;
  onFilterChange: (field: keyof CatalogueFilters, value: string) => void;
  onFilterValuesChange: (field: MultiSelectCatalogueFilterField, values: string[]) => void;
}> = ({
  isOpen,
  draftFilters,
  supplierOptions,
  branchOptions,
  dateRangeError,
  onClose,
  onApply,
  onClearAll,
  onFilterChange,
  onFilterValuesChange,
}) => {
  const [choiceSearchBySection, setChoiceSearchBySection] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setChoiceSearchBySection({});
    }
  }, [isOpen]);

  const getChoiceSearchValue = (sectionId: string) => choiceSearchBySection[sectionId] ?? '';
  const handleChoiceSearchChange = (sectionId: string, value: string) => {
    setChoiceSearchBySection((currentSearch) => ({
      ...currentSearch,
      [sectionId]: value,
    }));
  };

  const supplierChoiceOptions: FilterChoiceOption[] = [
    { value: '', label: 'All suppliers' },
    ...supplierOptions.map((supplier) => ({ value: supplier, label: supplier })),
  ];
  const priorityChoiceOptions: FilterChoiceOption[] = [
    { value: '', label: 'All priorities' },
    ...purchaseRequisitionPriorityOptions,
  ];
  const branchChoiceOptions: FilterChoiceOption[] = [
    { value: '', label: 'All branches' },
    ...branchOptions.map((branch) => ({ value: branch, label: branch })),
  ];
  const selectedSuppliers = getSelectedFilterValues(draftFilters.suppliers, draftFilters.supplier);
  const selectedPriorities = getSelectedFilterValues(draftFilters.priorities, draftFilters.priority);
  const selectedBranches = getSelectedFilterValues(draftFilters.branches, draftFilters.branch);
  const dateBadgeCount = Number(Boolean(draftFilters.startDate)) + Number(Boolean(draftFilters.endDate));
  const dateSummary = dateBadgeCount
    ? `${draftFilters.startDate || 'Any start'} to ${draftFilters.endDate || 'Any end'}`
    : 'Any document date';

  const sections: EnterpriseFilterSection[] = [
    {
      id: 'supplier',
      label: 'Supplier',
      summary: getActiveChoicesSummary(selectedSuppliers, 'All suppliers'),
      badgeCount: selectedSuppliers.length || undefined,
      render: () => (
        <FilterChoiceGroup
          sectionId="supplier"
          name="purchase-requisition-supplier-filter"
          ariaLabel="Supplier filter"
          selectionMode="multiple"
          values={selectedSuppliers}
          options={supplierChoiceOptions}
          searchValue={getChoiceSearchValue('supplier')}
          searchPlaceholder="Search suppliers"
          emptyLabel="No suppliers found."
          onSearchChange={(value) => handleChoiceSearchChange('supplier', value)}
          onValuesChange={(values) => onFilterValuesChange('suppliers', values)}
        />
      ),
    },
    {
      id: 'priority',
      label: 'Priority',
      summary: getActiveChoicesSummary(selectedPriorities, 'All priorities'),
      badgeCount: selectedPriorities.length || undefined,
      render: () => (
        <FilterChoiceGroup
          sectionId="priority"
          name="purchase-requisition-priority-filter"
          ariaLabel="Priority filter"
          selectionMode="multiple"
          values={selectedPriorities}
          options={priorityChoiceOptions}
          searchValue={getChoiceSearchValue('priority')}
          searchPlaceholder="Search priorities"
          emptyLabel="No priorities found."
          onSearchChange={(value) => handleChoiceSearchChange('priority', value)}
          onValuesChange={(values) => onFilterValuesChange('priorities', values)}
        />
      ),
    },
    {
      id: 'branch',
      label: 'Branch',
      summary: getActiveChoicesSummary(selectedBranches, 'All branches'),
      badgeCount: selectedBranches.length || undefined,
      render: () => (
        <FilterChoiceGroup
          sectionId="branch"
          name="purchase-requisition-branch-filter"
          ariaLabel="Branch filter"
          selectionMode="multiple"
          values={selectedBranches}
          options={branchChoiceOptions}
          searchValue={getChoiceSearchValue('branch')}
          searchPlaceholder="Search branches"
          emptyLabel="No branches found."
          onSearchChange={(value) => handleChoiceSearchChange('branch', value)}
          onValuesChange={(values) => onFilterValuesChange('branches', values)}
        />
      ),
    },
    {
      id: 'date-range',
      label: 'Date range',
      summary: dateSummary,
      badgeCount: dateBadgeCount || undefined,
      render: () => (
        <div className="enterprise-filter-dialog__date-section">
          <div className="enterprise-filter-dialog__date-grid">
            <label className="enterprise-filter-dialog__field">
              <span className="field-label">Start Date</span>
              <Input
                type="date"
                value={draftFilters.startDate}
                onChange={(event) => onFilterChange('startDate', event.target.value)}
                max={draftFilters.endDate || undefined}
              />
            </label>

            <label className="enterprise-filter-dialog__field">
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

          {dateRangeError && <p className="field-error enterprise-filter-dialog__date-error">{dateRangeError}</p>}
        </div>
      ),
    },
  ];

  return (
    <EnterpriseFilterDialog
      isOpen={isOpen}
      title="Filters"
      subtitle="Narrow down purchase requisitions using business-ready criteria."
      sections={sections}
      onClose={onClose}
      onApply={onApply}
      onClearAll={onClearAll}
    />
  );
};

const requisitionAmountNumberFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 2,
});

function formatRequisitionAmount(amount: string | undefined, currency: string): string {
  if (!amount) {
    return '-';
  }

  const numericAmount = Number.parseFloat(amount);
  if (!Number.isFinite(numericAmount)) {
    return '-';
  }

  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    return `${currency} ${requisitionAmountNumberFormatter.format(numericAmount)}`;
  }
}
function getRequisitionLineCountLabel(lineCount: number): string {
  return `${lineCount} ${lineCount === 1 ? 'line' : 'lines'}`;
}

function getRequisitionPrimaryLineSummary(document: PurchaseRequisitionDocument): string {
  const firstLine = document.productLines[0];
  if (!firstLine) {
    return `${getRequisitionLineCountLabel(document.lineCount)} requested`;
  }

  const additionalLineCount = Math.max(document.lineCount - 1, 0);
  return additionalLineCount > 0
    ? `${firstLine.productName} + ${additionalLineCount} more`
    : firstLine.productName;
}

const RequisitionCard: React.FC<{
  item: PurchaseRequisitionDocument;
  onView: () => void;
}> = ({ item, onView }) => {
  const documentDateTime = formatDateTime(item.documentDateTime);
  const totalAmount = formatRequisitionAmount(item.totalAmount, item.currency);
  const primaryLineSummary = getRequisitionPrimaryLineSummary(item);

  return (
    <article className="purchase-requisition-feed-card" aria-label={`Purchase requisition ${item.number}`}>
      <div className="purchase-requisition-feed-card__top-row">
        <div className="purchase-requisition-feed-card__badges" aria-label="Requisition state">
          <StatusBadge kind="requisition-status" value={item.status} />
          <StatusBadge kind="priority" value={item.priority} />
        </div>

        <div className="purchase-requisition-feed-card__actions">
          <button
            type="button"
            className="purchase-requisition-feed-card__icon-button"
            onClick={onView}
            aria-label={`Open ${item.number}`}
            title={`Open ${item.number}`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="purchase-requisition-feed-card__identity-row">
        <button type="button" onClick={onView} className="purchase-requisition-feed-card__number">
          {item.number}
        </button>
        <span className="purchase-requisition-feed-card__timestamp">
          {documentDateTime.dateLabel}, {documentDateTime.timeLabel}
        </span>
      </div>

      <div className="purchase-requisition-feed-card__context">
        <p className="purchase-requisition-feed-card__supplier">{item.supplierName}</p>
        <p className="purchase-requisition-feed-card__meta" aria-label={`GSTIN ${item.supplierGstin ?? 'not available'}`}>
          <span>GSTIN: {item.supplierGstin ?? 'Not available'}</span>
        </p>
      </div>

      <div className="purchase-requisition-feed-card__divider" aria-hidden="true" />
      <p className="purchase-requisition-feed-card__requester">Requested by {item.requesterName}</p>

      <div className="purchase-requisition-feed-card__summary-row">
        <p className="purchase-requisition-feed-card__summary-title">{primaryLineSummary}</p>
        <div className="purchase-requisition-feed-card__amount" aria-label={`${totalAmount} total amount`}>
          <span className="purchase-requisition-feed-card__amount-value">{totalAmount}</span>
          <span className="purchase-requisition-feed-card__amount-label">Amount</span>
        </div>
      </div>
    </article>
  );
};

const catalogueViewModeIconMap: Record<CatalogueViewModeId, React.ElementType> = {
  list: List,
  grid: LayoutGrid,
  split: Columns3,
};

type PurchaseRequisitionSplitFieldId =
  | 'number'
  | 'supplierName'
  | 'priority'
  | 'requirementDate'
  | 'status'
  | 'requesterName'
  | 'department'
  | 'branch'
  | 'lineCount'
  | 'validTillDate'
  | 'spendCategory'
  | 'budgetCode';

const defaultPurchaseRequisitionSplitFieldIds: PurchaseRequisitionSplitFieldId[] = [
  'number',
  'supplierName',
  'priority',
  'requirementDate',
];

const purchaseRequisitionPreviewSections: CatalogueConfigurableSection[] = [
  {
    id: 'document-information',
    title: 'Document information',
    description: 'Status, priority, document date, currency, and lines.',
  },
  {
    id: 'party-details',
    title: 'Party details',
    description: 'Supplier and requester information.',
  },
  {
    id: 'requisition-timeline',
    title: 'Requisition timeline',
    description: 'Progress based on requisition status.',
  },
  {
    id: 'reference-fulfilment',
    title: 'Reference and fulfilment',
    description: 'Department, branch, dates, budget, and contract details.',
  },
  {
    id: 'notes',
    title: 'Notes',
    description: 'Document notes and remarks.',
  },
  {
    id: 'product-lines',
    title: 'Product lines',
    description: 'Line item table.',
  },
];

const defaultPurchaseRequisitionPreviewSectionOrder = purchaseRequisitionPreviewSections.map((section) => section.id);

const purchaseRequisitionSplitFields: CatalogueDisplayField<PurchaseRequisitionDocument>[] = [
  {
    id: 'number',
    label: 'Document no.',
    description: 'Primary requisition number.',
    render: (item) => item.number,
  },
  {
    id: 'supplierName',
    label: 'Supplier',
    description: 'Supplier name.',
    render: (item) => item.supplierName,
  },
  {
    id: 'priority',
    label: 'Priority',
    description: 'Priority value.',
    render: (item) => item.priority,
  },
  {
    id: 'requirementDate',
    label: 'Requirement date',
    description: 'Needed-by date.',
    render: (item) => formatDate(item.requirementDate),
  },
  {
    id: 'status',
    label: 'Status',
    description: 'Document status.',
    render: (item) => item.status,
  },
  {
    id: 'requesterName',
    label: 'Requester',
    description: 'Person who raised the PR.',
    render: (item) => item.requesterName,
  },
  {
    id: 'department',
    label: 'Department',
    description: 'Requesting department.',
    render: (item) => item.department,
  },
  {
    id: 'branch',
    label: 'Branch',
    description: 'Branch or location.',
    render: (item) => item.branch,
  },
  {
    id: 'lineCount',
    label: 'Line count',
    description: 'Number of product lines.',
    render: (item) => `${item.lineCount} lines`,
  },
  {
    id: 'validTillDate',
    label: 'Valid till',
    description: 'Validity date.',
    render: (item) => formatDate(item.validTillDate),
  },
  {
    id: 'spendCategory',
    label: 'Spend category',
    description: 'Spend grouping.',
    render: (item) => item.spendCategory,
  },
  {
    id: 'budgetCode',
    label: 'Budget code',
    description: 'Budget reference.',
    render: (item) => item.budgetCode,
  },
];

function getRequisitionTimelineSteps(item: PurchaseRequisitionDocument) {
  const documentDateTime = formatDateTime(item.documentDateTime);
  const validTillDate = formatDate(item.validTillDate);
  const isCancelled = item.status === 'Cancelled';
  const isRejected = item.status === 'Rejected';
  const terminalState = isCancelled ? 'cancelled' : isRejected ? 'rejected' : 'ordered';
  const steps = [
    {
      key: 'Draft',
      label: 'Created',
      dateLabel: documentDateTime.dateLabel,
      timeLabel: documentDateTime.timeLabel,
      tone: 'success',
    },
    {
      key: 'Pending Approval',
      label: 'Approval review',
      dateLabel: item.status === 'Draft' ? 'Awaiting submission' : documentDateTime.dateLabel,
      timeLabel: item.status === 'Draft' ? '-' : documentDateTime.timeLabel,
      tone: 'approval',
    },
    {
      key: 'Approved',
      label: 'Approved',
      dateLabel: item.status === 'Approved' ? requirementDate : 'Pending approval',
      timeLabel: item.status === 'Approved' ? 'Ready for ordering' : '-',
      tone: 'success',
    },
    {
      key: terminalState,
      label: isCancelled ? 'Cancelled' : isRejected ? 'Rejected' : 'Ordering',
      dateLabel: isCancelled || isRejected ? validTillDate : 'Next workflow step',
      timeLabel: isCancelled ? 'Closed' : isRejected ? 'Approval stopped' : 'Pending conversion',
      tone: isCancelled || isRejected ? 'danger' : 'pending',
    },
  ];
  const currentKey = isCancelled || isRejected ? terminalState : item.status;
  const currentIndex = steps.findIndex((step) => step.key === currentKey);
  const completedIndex =
    currentIndex >= 0
      ? currentIndex
      : item.status === 'Approved'
        ? 2
        : 0;

  return steps.map((step, index) => ({
    ...step,
    state: index < completedIndex ? 'complete' : index === completedIndex ? 'current' : 'pending',
  }));
}

const CatalogueSplitView: React.FC<{
  rows: PurchaseRequisitionDocument[];
  canEdit: boolean;
  canCancel: boolean;
  onView: (documentId: string) => void;
  onEdit: (documentId: string) => void;
  onCancel: (documentId: string) => void;
}> = ({ rows, canEdit, canCancel, onView, onEdit, onCancel }) => {
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null);
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>(defaultPurchaseRequisitionSplitFieldIds);
  const [previewSectionOrder, setPreviewSectionOrder] = useState<string[]>(defaultPurchaseRequisitionPreviewSectionOrder);
  const [previewLayoutMode, setPreviewLayoutMode] = useState<CatalogueSectionLayoutMode>('single');
  const selectedItem = useMemo(
    () => rows.find((item) => item.id === selectedId) ?? rows[0] ?? null,
    [rows, selectedId]
  );
  const selectedFields = useMemo(
    () => purchaseRequisitionSplitFields.filter((field) => selectedFieldIds.includes(field.id)),
    [selectedFieldIds]
  );
  const previewSectionMap = useMemo(() => {
    if (!selectedItem) {
      return new Map<string, { id: string; title: string; isWide?: boolean; content: React.ReactNode }>();
    }

    return new Map<string, { id: string; title: string; isWide?: boolean; content: React.ReactNode }>([
              [
                'document-information',
                {
                  id: 'document-information',
                  title: 'Document information',
                  content: (
                    <div className="catalogue-split-view__compact-grid">
                      <div><span>Priority</span><strong>{selectedItem.priority}</strong></div>
                      <div><span>Document date</span><strong>{formatDateTime(selectedItem.documentDateTime).dateLabel}</strong></div>
                      <div><span>Document time</span><strong>{formatDateTime(selectedItem.documentDateTime).timeLabel}</strong></div>
              <div><span>Currency</span><strong>{selectedItem.currency}</strong></div>
              <div><span>Lines</span><strong>{selectedItem.lineCount}</strong></div>
            </div>
                  ),
                },
              ],
      [
        'requisition-timeline',
        {
          id: 'requisition-timeline',
          title: 'Requisition timeline',
          isWide: true,
          content: (
            <div className="catalogue-split-view__timeline" aria-label={`Requisition timeline for ${selectedItem.number}`}>
              {getRequisitionTimelineSteps(selectedItem).map((step) => (
                <div
                  key={step.key}
                  className={cn(
                    'catalogue-split-view__timeline-step',
                    `catalogue-split-view__timeline-step--${step.tone}`,
                    step.state === 'complete' && 'catalogue-split-view__timeline-step--complete',
                    step.state === 'current' && 'catalogue-split-view__timeline-step--current'
                  )}
                >
                  <span className="catalogue-split-view__timeline-marker">
                    {step.tone === 'danger' && step.state === 'current' ? (
                      <X size={14} />
                    ) : step.state === 'complete' || step.state === 'current' ? (
                      <Check size={14} />
                    ) : (
                      <Circle size={9} />
                    )}
                  </span>
                  <strong>{step.label}</strong>
                  <small>{step.dateLabel} {step.timeLabel}</small>
                </div>
              ))}
            </div>
          ),
        },
      ],
      [
        'party-details',
        {
          id: 'party-details',
          title: 'Party details',
          content: (
            <div className="catalogue-split-view__compact-grid">
              <div><span>Supplier</span><strong>{selectedItem.supplierName}</strong></div>
              <div><span>Supplier contact</span><strong>{selectedItem.supplierContact}</strong></div>
              <div><span>Requester</span><strong>{selectedItem.requesterName}</strong></div>
              <div><span>Requester email</span><strong>{selectedItem.requesterEmail}</strong></div>
            </div>
          ),
        },
      ],
      [
        'reference-fulfilment',
        {
          id: 'reference-fulfilment',
          title: 'Reference and fulfilment',
          content: (
            <div className="catalogue-split-view__compact-grid">
              <div><span>Department</span><strong>{selectedItem.department}</strong></div>
              <div><span>Branch</span><strong>{selectedItem.branch}</strong></div>
              <div><span>Legal entity</span><strong>{selectedItem.legalEntity}</strong></div>
              <div><span>Cost center</span><strong>{selectedItem.costCenter}</strong></div>
              <div><span>Requirement date</span><strong>{formatDate(selectedItem.requirementDate)}</strong></div>
              <div><span>Valid till</span><strong>{formatDate(selectedItem.validTillDate)}</strong></div>
              <div><span>Spend category</span><strong>{selectedItem.spendCategory}</strong></div>
              <div><span>Contract</span><strong>{selectedItem.contractReference || '-'}</strong></div>
              <div><span>Budget</span><strong>{selectedItem.budgetCode || '-'}</strong></div>
            </div>
          ),
        },
      ],
      [
        'notes',
        {
          id: 'notes',
          title: 'Notes',
          content: <p>{selectedItem.notes || 'No notes added.'}</p>,
        },
      ],
      [
        'product-lines',
        {
          id: 'product-lines',
          title: 'Product lines',
          isWide: true,
          content: (
            <div className="catalogue-split-view__line-table-wrap">
              <table className="catalogue-split-view__line-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Product</th>
                    <th>UOM</th>
                    <th>Priority</th>
                    <th>Required</th>
                    <th className="catalogue-split-view__number-cell">Requested</th>
                    <th className="catalogue-split-view__number-cell">Ordered</th>
                    <th className="catalogue-split-view__number-cell">Pending</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItem.productLines.map((line) => (
                    <tr key={`${line.productCode}-${line.productName}`}>
                      <td>{line.productCode}</td>
                      <td>
                        <strong>{line.productName}</strong>
                        <span>{line.description}</span>
                      </td>
                      <td>{line.uom}</td>
                      <td>{line.priority}</td>
                      <td>{formatDate(line.requirementDate)}</td>
                      <td className="catalogue-split-view__number-cell">{line.requestedQty}</td>
                      <td className="catalogue-split-view__number-cell">{line.orderedQty}</td>
                      <td className="catalogue-split-view__number-cell">{line.pendingQty}</td>
                      <td>{line.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ),
        },
      ],
    ]);
  }, [selectedItem]);
  const orderedPreviewSections = useMemo(
    () =>
      previewSectionOrder
        .map((sectionId) => previewSectionMap.get(sectionId))
        .filter((section): section is { id: string; title: string; isWide?: boolean; content: React.ReactNode } => Boolean(section)),
    [previewSectionMap, previewSectionOrder]
  );

  return (
    <div className="catalogue-split-view">
      <div className="catalogue-split-view__list" aria-label="Purchase requisition compact list">
        <div className="catalogue-split-view__list-header">
          <span>{selectedFieldIds.length} fields</span>
          <CatalogueFieldDisplaySettings
            title="Compact List Fields"
            fields={purchaseRequisitionSplitFields}
            selectedFieldIds={selectedFieldIds}
            maxFields={8}
            onChange={setSelectedFieldIds}
          />
        </div>

        {rows.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedId(item.id)}
            className={cn('catalogue-split-view__item', selectedItem?.id === item.id && 'catalogue-split-view__item--active')}
            aria-pressed={selectedItem?.id === item.id}
          >
            <span className="catalogue-split-view__field-grid">
              {selectedFields.map((field) => (
                <span key={field.id} className="catalogue-split-view__field-row">
                  <span className="catalogue-split-view__field-label">{field.label}</span>
                  <span className={cn('catalogue-split-view__field-value', field.id === 'number' && 'catalogue-split-view__field-value--title')}>
                    {field.render(item)}
                  </span>
                </span>
              ))}
            </span>
          </button>
        ))}
      </div>

      <div className="catalogue-split-view__preview" aria-live="polite">
        {selectedItem ? (
          <>
            <div className="catalogue-split-view__preview-header">
              <div>
                <button type="button" onClick={() => onView(selectedItem.id)} className="catalogue-split-view__number">
                  {selectedItem.number}
                </button>
                <h2>{selectedItem.title}</h2>
                <p>{selectedItem.supplierName} - {selectedItem.department}</p>
              </div>
              <div className="catalogue-split-view__preview-actions" aria-label={`${selectedItem.number} actions`}>
                <CatalogueSectionLayoutSettings
                  title="Detail Section Layout"
                  sections={purchaseRequisitionPreviewSections}
                  sectionOrder={previewSectionOrder}
                  layoutMode={previewLayoutMode}
                  onSectionOrderChange={setPreviewSectionOrder}
                  onLayoutModeChange={setPreviewLayoutMode}
                />
                <button
                  type="button"
                  onClick={() => onEdit(selectedItem.id)}
                  className="catalogue-split-view__icon-action"
                  disabled={!canEdit}
                  aria-label={`Edit ${selectedItem.number}`}
                  title={canEdit ? 'Edit' : 'Edit is not available'}
                >
                  <PencilLine size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => onCancel(selectedItem.id)}
                  className="catalogue-split-view__icon-action catalogue-split-view__icon-action--danger"
                  disabled={!canCancel || selectedItem.status === 'Cancelled'}
                  aria-label={`Cancel ${selectedItem.number}`}
                  title={canCancel && selectedItem.status !== 'Cancelled' ? 'Cancel' : 'Cancel is not available'}
                >
                  <Ban size={15} />
                </button>
              </div>
            </div>

            <div
              className={cn(
                'catalogue-split-view__configured-sections',
                previewLayoutMode === 'two-column' && 'catalogue-split-view__configured-sections--two'
              )}
            >
              {orderedPreviewSections.map((section) => (
                <section
                  key={section.id}
                  className={cn(
                    'catalogue-split-view__compact-section',
                    section.isWide && 'catalogue-split-view__compact-section--wide'
                  )}
                >
                  <h3>{section.title}</h3>
                  {section.content}
                </section>
              ))}
            </div>
          </>
        ) : (
          <div className="catalogue-split-view__empty">
            <FileText size={28} />
            <strong>No document selected</strong>
            <span>Select a requisition to preview it here.</span>
          </div>
        )}
      </div>
    </div>
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
  const [catalogueViewMode, setCatalogueViewMode] = useState<CatalogueViewModeId>(() =>
    resolveCatalogueViewMode(
      purchaseRequisitionCatalogueDocumentType,
      loadCatalogueDisplayViewMode(purchaseRequisitionCatalogueDocumentType)
    )
  );
  const [dateRangeError, setDateRangeError] = useState('');
  const [cancelDocumentId, setCancelDocumentId] = useState<string | null>(null);
  const [activeInsightKey, setActiveInsightKey] = useState<string | null>(null);
  const [isTourInviteVisible, setIsTourInviteVisible] = useState(() => !isPurchaseRequisitionTourDismissedForSession);
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [sortState, setSortState] = useState<SortState<SortKey>>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [customViews, setCustomViews] = useState<CatalogueViewDefinition[]>(() =>
    loadCustomCatalogueViews(PURCHASE_REQUISITION_CATALOGUE_VIEW_ENTITY)
  );
  const [recentlyViewedEntries, setRecentlyViewedEntries] = useState(() =>
    loadRecentlyViewedEntries(PURCHASE_REQUISITION_CATALOGUE_VIEW_ENTITY)
  );
  const [viewState, setViewState] = useState(() =>
    loadCatalogueViewState(PURCHASE_REQUISITION_CATALOGUE_VIEW_ENTITY)
  );
  const [activeViewId, setActiveViewId] = useState(() =>
    resolveCatalogueViewId(
      [
        ...getPurchaseRequisitionSystemViews(currentUserName),
        ...loadCustomCatalogueViews(PURCHASE_REQUISITION_CATALOGUE_VIEW_ENTITY),
      ],
      loadCatalogueViewState(PURCHASE_REQUISITION_CATALOGUE_VIEW_ENTITY),
      PURCHASE_REQUISITION_ALL_VIEW_ID
    )
  );
  const [isViewConfiguratorOpen, setIsViewConfiguratorOpen] = useState(false);
  const businessSettings = useBusinessSettings();
  const actionSettings = businessSettings.actions.purchaseRequisition;
  const isCompactCatalogueViewport = useMediaQuery('(max-width: 1024px)', { noSsr: true });
  const viewModeConfig = useMemo(
    () => getCatalogueViewModeConfig(purchaseRequisitionCatalogueDocumentType),
    []
  );
  const availableCatalogueViewModes = useMemo(
    () => viewModeConfig.enabledViews
      .filter((viewMode) => isCompactCatalogueViewport || viewMode !== 'grid')
      .map((viewMode) => catalogueViewModeRegistry[viewMode]),
    [isCompactCatalogueViewport, viewModeConfig.enabledViews]
  );
  const resolvedCatalogueViewMode = resolveCatalogueViewMode(purchaseRequisitionCatalogueDocumentType, catalogueViewMode);
  const activeCatalogueViewMode: CatalogueViewModeId = !isCompactCatalogueViewport && resolvedCatalogueViewMode === 'grid'
    ? 'list'
    : resolvedCatalogueViewMode;

  const systemViews = useMemo(
    () => getPurchaseRequisitionSystemViews(currentUserName),
    []
  );
  const availableViews = useMemo(
    () => [...systemViews, ...customViews],
    [customViews, systemViews]
  );
  const effectiveViewState = useMemo(() => {
    const availableViewIds = new Set(availableViews.map((view) => view.id));

    return {
      pinnedViewId:
        viewState.pinnedViewId && availableViewIds.has(viewState.pinnedViewId)
          ? viewState.pinnedViewId
          : null,
      lastSelectedViewId:
        viewState.lastSelectedViewId && availableViewIds.has(viewState.lastSelectedViewId)
          ? viewState.lastSelectedViewId
          : null,
    };
  }, [availableViews, viewState]);

  useEffect(() => {
    if (
      effectiveViewState.pinnedViewId === viewState.pinnedViewId &&
      effectiveViewState.lastSelectedViewId === viewState.lastSelectedViewId
    ) {
      return;
    }

    saveCatalogueViewState(PURCHASE_REQUISITION_CATALOGUE_VIEW_ENTITY, effectiveViewState);
  }, [effectiveViewState, viewState]);

  const effectiveActiveViewId = useMemo(() => {
    if (availableViews.some((view) => view.id === activeViewId)) {
      return activeViewId;
    }

    return resolveCatalogueViewId(availableViews, effectiveViewState, PURCHASE_REQUISITION_ALL_VIEW_ID);
  }, [activeViewId, availableViews, effectiveViewState]);

  const activeView = useMemo(
    () =>
      availableViews.find((view) => view.id === effectiveActiveViewId) ??
      availableViews.find((view) => view.id === PURCHASE_REQUISITION_ALL_VIEW_ID) ??
      availableViews[0],
    [availableViews, effectiveActiveViewId]
  );

  const viewContext = useMemo(
    () => ({
      currentUserName,
      recentlyViewedEntries,
    }),
    [recentlyViewedEntries]
  );

  const viewFilteredRows = useMemo(
    () => filterPurchaseRequisitionDocumentsByView(documents, activeView, viewContext),
    [activeView, documents, viewContext]
  );

  useEffect(() => {
    if (loadState !== 'loading') {
      return;
    }

    const timer = window.setTimeout(() => {
      setLoadState('ready');
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loadState]);


  const supplierOptions = useMemo(
    () => Array.from(new Set(viewFilteredRows.map((item) => item.supplierName))).sort(),
    [viewFilteredRows]
  );
  const allSupplierOptions = useMemo(
    () => Array.from(new Set(documents.map((item) => item.supplierName))).sort(),
    [documents]
  );

  const branchOptions = useMemo(
    () => Array.from(new Set(viewFilteredRows.map((item) => item.branch))).sort(),
    [viewFilteredRows]
  );
  const allBranchOptions = useMemo(
    () => Array.from(new Set(documents.map((item) => item.branch))).sort(),
    [documents]
  );

  const requesterOptions = useMemo(
    () =>
      Array.from(new Set(documents.map((item) => item.requesterName)))
        .sort()
        .map((requester) => ({ value: requester, label: requester })),
    [documents]
  );

  const baseFilteredRows = useMemo(() => {
    const startDate = filters.startDate;
    const endDate = filters.endDate;
    const normalizedSearch = tableSearch.trim().toLowerCase();

    return viewFilteredRows.filter((item) => {
      const selectedSuppliers = getSelectedFilterValues(filters.suppliers, filters.supplier);
      const selectedPriorities = getSelectedFilterValues(filters.priorities, filters.priority);
      const selectedBranches = getSelectedFilterValues(filters.branches, filters.branch);
      const matchesSupplier = selectedSuppliers.length === 0 || selectedSuppliers.includes(item.supplierName);
      const matchesPriority = selectedPriorities.length === 0 || selectedPriorities.includes(item.priority);
      const matchesBranch = selectedBranches.length === 0 || selectedBranches.includes(item.branch);
      const matchesStartDate = !startDate || item.requirementDate >= startDate;
      const matchesEndDate = !endDate || item.validTillDate <= endDate;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        item.number.toLowerCase().includes(normalizedSearch) ||
        item.supplierName.toLowerCase().includes(normalizedSearch) ||
        (item.supplierGstin ?? '').toLowerCase().includes(normalizedSearch) ||
        item.requesterName.toLowerCase().includes(normalizedSearch) ||
        item.priority.toLowerCase().includes(normalizedSearch) ||
        item.status.toLowerCase().includes(normalizedSearch) ||
        formatDate(item.requirementDate).toLowerCase().includes(normalizedSearch) ||
        formatDate(item.validTillDate).toLowerCase().includes(normalizedSearch);

      return matchesSupplier && matchesPriority && matchesBranch && matchesStartDate && matchesEndDate && matchesSearch;
    });
  }, [filters, tableSearch, viewFilteredRows]);

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

    const effectiveSortState =
      sortState ??
      (activeView.sort
        ? {
            key: activeView.sort.key as SortKey,
            direction: activeView.sort.direction,
          }
        : null);

    if (!effectiveSortState) {
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

    const directionFactor = effectiveSortState.direction === 'asc' ? 1 : -1;
    const rows = [...insightFilteredRows];

    rows.sort((left, right) => {
      let comparison = 0;

      switch (effectiveSortState.key) {
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
  }, [activeInsightKey, activeView.sort, baseFilteredRows, sortState]);

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
  const viewCounts = useMemo(
    () =>
      Object.fromEntries(
        availableViews.map((view) => [
          view.id,
          filterPurchaseRequisitionDocumentsByView(documents, view, viewContext).length,
        ])
      ),
    [availableViews, documents, viewContext]
  );
  const catalogueViewItems = useMemo(
    () =>
      availableViews.map((view) => ({
        id: view.id,
        name: view.name,
        kind: view.kind,
        count: viewCounts[view.id] ?? 0,
        isPinned: effectiveViewState.pinnedViewId === view.id,
      })),
    [availableViews, effectiveViewState.pinnedViewId, viewCounts]
  );
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

  const handleFilterValuesChange = (field: MultiSelectCatalogueFilterField, values: string[]) => {
    const legacyField = multiSelectFilterFieldMap[field];
    const nextFilters = {
      ...draftFilters,
      [field]: values,
      [legacyField]: '',
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

  const handleClearDraftFilters = () => {
    setDraftFilters(emptyCatalogueFilters);
    setDateRangeError('');
  };

  const handleSortChange = (key: SortKey, direction: 'asc' | 'desc' | null) => {
    setSortState(direction ? { key, direction } : null);
  };

  const handleCatalogueViewModeChange = (viewMode: CatalogueViewModeId) => {
    const requestedViewMode = !isCompactCatalogueViewport && viewMode === 'grid' ? 'list' : viewMode;
    const nextViewMode = resolveCatalogueViewMode(purchaseRequisitionCatalogueDocumentType, requestedViewMode);
    setCatalogueViewMode(nextViewMode);
    saveCatalogueDisplayViewMode(purchaseRequisitionCatalogueDocumentType, nextViewMode);
  };

  const handleSelectCatalogueView = (viewId: string) => {
    const nextView = availableViews.find((view) => view.id === viewId);
    if (!nextView) {
      return;
    }

    setActiveViewId(viewId);
    setViewState(setLastSelectedCatalogueViewId(PURCHASE_REQUISITION_CATALOGUE_VIEW_ENTITY, viewId));
    setActiveInsightKey(null);
    setSortState(
      nextView.sort
        ? {
            key: nextView.sort.key as SortKey,
            direction: nextView.sort.direction,
          }
        : null
    );
  };

  const handleTogglePinnedView = (viewId: string) => {
    const nextPinnedViewId = effectiveViewState.pinnedViewId === viewId ? null : viewId;
    setViewState(setPinnedCatalogueViewId(PURCHASE_REQUISITION_CATALOGUE_VIEW_ENTITY, nextPinnedViewId));
  };

  const handleSaveView = (
    draft: EditableCatalogueViewDefinition,
    options: { viewId?: string; pinAsDefault: boolean }
  ) => {
    const nextCustomViews = options.viewId
      ? customViews.map((view) =>
          view.id === options.viewId ? updateCustomCatalogueView(view, draft) : view
        )
      : [...customViews, createCustomCatalogueView(PURCHASE_REQUISITION_CATALOGUE_VIEW_ENTITY, draft)];
    const savedViewId = options.viewId ?? nextCustomViews[nextCustomViews.length - 1]?.id ?? '';

    setCustomViews(nextCustomViews);
    saveCustomCatalogueViews(PURCHASE_REQUISITION_CATALOGUE_VIEW_ENTITY, nextCustomViews);

    if (savedViewId) {
      const nextState = options.pinAsDefault
        ? setPinnedCatalogueViewId(PURCHASE_REQUISITION_CATALOGUE_VIEW_ENTITY, savedViewId)
        : viewState.pinnedViewId === savedViewId
          ? setPinnedCatalogueViewId(PURCHASE_REQUISITION_CATALOGUE_VIEW_ENTITY, null)
          : viewState;

      if (nextState !== viewState) {
        setViewState(nextState);
      }

      setActiveViewId(savedViewId);
      setViewState(setLastSelectedCatalogueViewId(PURCHASE_REQUISITION_CATALOGUE_VIEW_ENTITY, savedViewId));

      if (draft.sort) {
        setSortState({
          key: draft.sort.key as SortKey,
          direction: draft.sort.direction,
        });
      }
    }

    return savedViewId;
  };

  const handleDeleteView = (viewId: string) => {
    setCustomViews((currentViews) => {
      const nextViews = currentViews.filter((view) => view.id !== viewId);
      saveCustomCatalogueViews(PURCHASE_REQUISITION_CATALOGUE_VIEW_ENTITY, nextViews);
      return nextViews;
    });

    const nextState = {
      pinnedViewId: viewState.pinnedViewId === viewId ? null : viewState.pinnedViewId,
      lastSelectedViewId: viewState.lastSelectedViewId === viewId ? null : viewState.lastSelectedViewId,
    };
    saveCatalogueViewState(PURCHASE_REQUISITION_CATALOGUE_VIEW_ENTITY, nextState);
    setViewState(nextState);

    if (activeViewId === viewId) {
      setActiveViewId(PURCHASE_REQUISITION_ALL_VIEW_ID);
    }
  };

  const registerRecentlyViewedDocument = useCallback((documentId: string) => {
    const document = documents.find((item) => item.id === documentId);
    setRecentlyViewedEntries(recordRecentlyViewedDocument(PURCHASE_REQUISITION_CATALOGUE_VIEW_ENTITY, documentId));

    if (document) {
      recordSidebarRecentDocument({
        documentId: document.id,
        documentNumber: document.number,
        moduleKey: 'purchase-requisition',
        moduleLabel: 'Purchase Requisition',
        partyLabel: document.supplierName,
        status: document.status,
        route: '/purchase-requisition',
      });
    }
  }, [documents]);

  const handleViewDocument = useCallback((documentId: string) => {
    registerRecentlyViewedDocument(documentId);
    setPreviewDocumentId(documentId);
  }, [registerRecentlyViewedDocument]);

  const handleEditDocument = useCallback((documentId: string) => {
    if (!actionSettings.allowEdit) {
      return;
    }

    registerRecentlyViewedDocument(documentId);
    onEdit(documentId);
  }, [actionSettings.allowEdit, onEdit, registerRecentlyViewedDocument]);

  const handleOpenCancelDialog = useCallback((documentId: string) => {
    if (!actionSettings.allowCancel) {
      return;
    }

    const document = documents.find((item) => item.id === documentId);
    if (!document) {
      return;
    }
    setCancelDocumentId(documentId);
  }, [actionSettings.allowCancel, documents]);

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

  const renderActionMenu = useCallback((item: PurchaseRequisitionDocument) => (
    <DataGridRowActionMenu
      triggerLabel={'Open actions for ' + item.number}
      menuLabel={'Actions for ' + item.number}
      actions={[
        {
          id: 'view',
          label: 'View',
          icon: <Eye size={16} />,
          onSelect: () => handleViewDocument(item.id),
        },
        {
          id: 'edit',
          label: 'Edit',
          icon: <PencilLine size={16} />,
          disabled: !actionSettings.allowEdit,
          onSelect: () => handleEditDocument(item.id),
        },
        {
          id: 'cancel',
          label: 'Cancel',
          icon: <Ban size={16} />,
          tone: 'danger',
          disabled: item.status === 'Cancelled' || !actionSettings.allowCancel,
          onSelect: () => handleOpenCancelDialog(item.id),
        },
      ]}
    />
  ), [
    actionSettings.allowCancel,
    actionSettings.allowEdit,
    handleEditDocument,
    handleOpenCancelDialog,
    handleViewDocument,
  ]);

  const gridColumns = useMemo<DataGridColumn<PurchaseRequisitionDocument>[]>(() => [
    {
      id: 'number',
      label: 'Document No.',
      type: 'text',
      width: 164,
      getValue: (item) => item.number,
      renderCell: (item) => (
        <button
          type="button"
          onClick={() => handleViewDocument(item.id)}
          className="catalogue-table__document-link"
        >
          {item.number}
        </button>
      ),
    },
    {
      id: 'documentDateTime',
      label: 'Document date & time',
      type: 'date',
      width: 192,
      getValue: (item) => item.documentDateTime,
      renderCell: (item) => {
        const documentDateTime = formatDateTime(item.documentDateTime);
        return (
          <div className="catalogue-table__datetime">
            {documentDateTime.dateLabel}, {documentDateTime.timeLabel}
          </div>
        );
      },
    },
    {
      id: 'supplierName',
      label: 'Supplier name',
      type: 'text',
      width: 188,
      getValue: (item) => item.supplierName,
      renderCell: (item) => (
        <div className="catalogue-table__truncate" title={item.supplierName}>
          {item.supplierName}
        </div>
      ),
    },
    {
      id: 'requesterName',
      label: 'Requester name',
      type: 'text',
      width: 164,
      getValue: (item) => item.requesterName,
      renderCell: (item) => <div className="catalogue-table__primary">{item.requesterName}</div>,
    },
    {
      id: 'priority',
      label: 'Priority',
      type: 'status',
      width: 118,
      getValue: (item) => item.priority,
      options: [
        { value: 'Low', label: 'Low' },
        { value: 'Medium', label: 'Medium' },
        { value: 'High', label: 'High' },
        { value: 'Critical', label: 'Critical' },
      ],
      renderCell: (item) => <StatusBadge kind="priority" value={item.priority} />,
    },
    {
      id: 'requirementDate',
      label: 'Requirement date',
      type: 'date',
      width: 156,
      getValue: (item) => item.requirementDate,
      renderCell: (item) => formatDate(item.requirementDate),
    },
    {
      id: 'validTillDate',
      label: 'Valid till date',
      type: 'date',
      width: 148,
      getValue: (item) => item.validTillDate,
      renderCell: (item) => formatDate(item.validTillDate),
    },
    {
      id: 'status',
      label: 'Status',
      type: 'status',
      width: 154,
      getValue: (item) => item.status,
      options: [
        { value: 'Draft', label: 'Draft' },
        { value: 'Pending Approval', label: 'Pending Approval' },
        { value: 'Approved', label: 'Approved' },
        { value: 'Rejected', label: 'Rejected' },
        { value: 'Cancelled', label: 'Cancelled' },
      ],
      renderCell: (item) => <StatusBadge kind="requisition-status" value={item.status} />,
    },
    {
      id: 'actions',
      label: 'Action',
      type: 'actions',
      width: 86,
      sortable: false,
      filterable: false,
      groupable: false,
      defaultPin: 'right',
      hideable: false,
      getValue: () => '',
      renderCell: (item) => renderActionMenu(item),
    },
  ], [handleViewDocument, renderActionMenu]);

  const dismissTourForSession = () => {
    isPurchaseRequisitionTourDismissedForSession = true;
    setIsTourInviteVisible(false);
    setIsTourActive(false);
  };

  const handleTakeTour = () => {
    handleCatalogueViewModeChange('list');
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
      bottomBar={
        <div className="purchase-requisition-mobile-cta">
          <button type="button" className="purchase-requisition-mobile-cta__button" onClick={onNew} data-tour="pr-new-button-mobile">
            <Plus size={18} />
            New Purchase Requisition
          </button>
        </div>
      }
    >
      <TransactionCatalogueHeader
        titleDataTour="pr-catalogue-title"
        viewSelector={{
          items: catalogueViewItems,
          activeViewId: activeView.id,
          activeCount: sortedRows.length,
          onSelect: handleSelectCatalogueView,
          onTogglePin: handleTogglePinnedView,
          onOpenConfigurator: () => setIsViewConfiguratorOpen(true),
        }}
        search={{
          value: tableSearch,
          placeholder: 'Search...',
          ariaLabel: 'Search purchase requisitions',
          onChange: setTableSearch,
        }}
        viewModes={availableCatalogueViewModes.map((viewMode) => ({
          ...viewMode,
          icon: catalogueViewModeIconMap[viewMode.id],
        }))}
        activeViewMode={activeCatalogueViewMode}
        onViewModeChange={(viewModeId) => handleCatalogueViewModeChange(viewModeId as CatalogueViewModeId)}
        filter={{
          label: 'Filters',
          ariaLabel: hasActiveFilters ? `Filter purchase requisitions. ${activeFilterCount} filters applied.` : 'Filter purchase requisitions',
          activeCount: activeFilterCount,
          icon: Filter,
          onClick: openFilterDrawer,
        }}
        primaryAction={{
          label: 'New',
          icon: Plus,
          onClick: onNew,
          dataTour: 'pr-new-button',
          hideOnMobile: true,
          moveToBottomBarOnCompact: true,
        }}
      />
      <div className="purchase-requisition-catalogue-content mx-auto flex w-full max-w-[1800px] flex-col gap-4 px-4 py-4">
        {loadState === 'ready' && (
          <div data-tour="pr-insight-cards">
            <CatalogueInsightCards
              items={insightItems}
              activeKey={activeInsightKey}
              ariaLabel="Purchase requisition insights"
              variant="enterprise"
              density="compact"
              maxVisibleItems={4}
              badgeLabel=""
              activeBadgeLabel="Applied"
              onSelect={(key) => setActiveInsightKey((current) => (current === key || key === 'all' ? null : key))}
            />
          </div>
        )}

        <section>
          <div>

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

            {loadState === 'ready' && sortedRows.length > 0 && activeCatalogueViewMode === 'list' && (
              <div data-tour="pr-catalogue-table">
                <CommonDataGrid
                  gridId="purchase-requisition-catalogue"
                  rows={sortedRows}
                  columns={gridColumns}
                  rowId={(item) => item.id}
                  ariaLabel="Purchase requisitions table"
                  sortState={sortState}
                  onSortChange={handleSortChange}
                  chartTitle="Purchase Requisition"
                  exportFileName="purchase-requisitions.csv"
                />
              </div>
            )}

            {loadState === 'ready' && sortedRows.length > 0 && isCompactCatalogueViewport && activeCatalogueViewMode === 'grid' && (
              <div className="purchase-requisition-feed-grid">
                {sortedRows.map((item) => (
                  <RequisitionCard
                    key={item.id}
                    item={item}
                    onView={() => handleViewDocument(item.id)}
                  />
                ))}
              </div>
            )}

            {loadState === 'ready' && sortedRows.length > 0 && activeCatalogueViewMode === 'split' && (
              <CatalogueSplitView
                rows={sortedRows}
                canEdit={actionSettings.allowEdit}
                canCancel={actionSettings.allowCancel}
                onView={handleViewDocument}
                onEdit={handleEditDocument}
                onCancel={handleOpenCancelDialog}
              />
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
        onClearAll={handleClearDraftFilters}
        onFilterChange={handleFilterChange}
        onFilterValuesChange={handleFilterValuesChange}
      />

      <CatalogueViewConfigurator
        key={`${isViewConfiguratorOpen}-${activeView.id}-${effectiveViewState.pinnedViewId ?? 'none'}-${availableViews.length}`}
        isOpen={isViewConfiguratorOpen}
        title="Purchase Requisition Views"
        views={availableViews}
        activeViewId={activeView.id}
        pinnedViewId={effectiveViewState.pinnedViewId}
        viewCounts={viewCounts}
        currentUserName={currentUserName}
        requesterOptions={requesterOptions}
        supplierOptions={allSupplierOptions.map((supplier) => ({ value: supplier, label: supplier }))}
        branchOptions={allBranchOptions.map((branch) => ({ value: branch, label: branch }))}
        statusOptions={purchaseRequisitionStatusOptions}
        priorityOptions={purchaseRequisitionPriorityOptions}
        sortOptions={purchaseRequisitionSortOptions}
        onClose={() => setIsViewConfiguratorOpen(false)}
        onSave={handleSaveView}
        onDelete={handleDeleteView}
        onPin={(viewId) =>
          setViewState(setPinnedCatalogueViewId(PURCHASE_REQUISITION_CATALOGUE_VIEW_ENTITY, viewId))
        }
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
        canEdit={previewDocument?.status !== 'Cancelled' && actionSettings.allowEdit}
        canCancel={previewDocument?.status !== 'Cancelled' && actionSettings.allowCancel}
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

