import React, { useCallback, useEffect, useMemo, useState } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Ban, CarFront, Check, ChevronRight, Circle, Columns3, Eye, FileText, Filter, LayoutGrid, List, PencilLine, Plus, Search, X } from 'lucide-react';
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
import JobCardPreviewDrawer from '../../components/common/JobCardPreviewDrawer';
import StatusBadge from '../../components/common/StatusBadge';
import TourInvitePopup from '../../components/common/TourInvitePopup';
import { Input } from '../../components/common/FormControls';
import JobCardNewIntakeDialog from './JobCardNewIntakeDialog';
import { JOB_CARD_INTAKE_DRAFT_STORAGE_KEY, type JobCardIntakeDraft } from './jobCardIntakeData';
import { emptyCatalogueFilters, getActiveFilterCount, validateDateRange } from '../../utils/catalogueFilters';
import type { CatalogueFilters } from '../../utils/catalogueFilters';
import {
  extendedJobCardDocuments,
} from './jobCardCatalogueData';
import type {
  JobCardDocument,
  JobCardPriority,
  JobCardStatus,
} from './jobCardCatalogueData';
import {
  filterJobCardDocumentsByView,
  getJobCardSystemViews,
  JOB_CARD_ALL_VIEW_ID,
  JOB_CARD_CATALOGUE_VIEW_ENTITY,
} from './jobCardViews';
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

interface JobCardCatalogueViewProps {
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
  | 'vehicleRegistration'
  | 'customerName'
  | 'jobType'
  | 'odometerReading'
  | 'serviceBay'
  | 'serviceAdvisor'
  | 'openedAt'
  | 'workshopStatus'
  | 'documentDateTime'
  | 'supplierName'
  | 'requesterName'
  | 'priority'
  | 'requirementDate'
  | 'validTillDate'
  | 'status';

let isJobCardTourDismissedForSession = false;
const currentUserName = 'Alex Kumar';

const jobCardCatalogueTourSteps: GuidedTourStep[] = [
  {
    id: 'catalogue-overview',
    target: '[data-tour="job-card-catalogue-title"]',
    title: 'Start with your Job Card catalogue',
    body: 'This is where job cards are tracked, searched, filtered, and opened for quick review.',
  },
  {
    id: 'catalogue-insights',
    target: '[data-tour="job-card-insight-cards"]',
    title: 'Scan key Job Card health',
    body: 'Use these compact insights to quickly filter by important states like open, approval, or high-priority requests.',
  },
  {
    id: 'catalogue-table',
    target: '[data-tour="job-card-catalogue-table"]',
    title: 'Review records in the list',
    body: 'Document numbers open a read-only preview drawer, while row actions let you view, edit, or cancel where allowed.',
  },
  {
    id: 'catalogue-new',
    target: '[data-tour="job-card-new-button"]',
    title: 'Create a new Job Card',
    body: 'Click New when you are ready to create a service Job Card.',
  },
];

const jobCardPriorityOptions = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' },
];

const jobCardSortOptions = [
  { value: 'number', label: 'Job Card' },
  { value: 'vehicleRegistration', label: 'Vehicle' },
  { value: 'customerName', label: 'Customer' },
  { value: 'jobType', label: 'Type' },
  { value: 'odometerReading', label: 'Odometer' },
  { value: 'serviceBay', label: 'Bay' },
  { value: 'serviceAdvisor', label: 'Advisor' },
  { value: 'openedAt', label: 'Opened' },
  { value: 'workshopStatus', label: 'Status' },
];

const jobCardCatalogueDocumentType = 'job-card';

type MultiSelectCatalogueFilterField = 'suppliers' | 'statuses' | 'branches';
type LegacySingleCatalogueFilterField = 'supplier' | 'branch';

const multiSelectFilterFieldMap: Partial<Record<MultiSelectCatalogueFilterField, LegacySingleCatalogueFilterField>> = {
  suppliers: 'supplier',
  branches: 'branch',
};
type FilterChoiceOption = {
  value: string;
  label: string;
  helper?: string;
};

function getFilterChoiceId(sectionId: string, value: string): string {
  const normalizedValue = value || 'all';

  return `job-card-filter-${sectionId}-${normalizedValue.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`;
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

const jobCardWorkshopStatusOptions = [
  { value: 'Open', label: 'Open' },
  { value: 'In progress', label: 'In progress' },
  { value: 'Waiting parts', label: 'Waiting parts' },
  { value: 'Ready', label: 'Ready' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const jobCardOdometerFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

function getReadableValue(value: string | undefined, fallback: string): string {
  const trimmedValue = value?.trim();
  return trimmedValue && trimmedValue.length > 0 ? trimmedValue : fallback;
}

function getJobCardServiceMeta(item: JobCardDocument) {
  return {
    vehicleRegistration: getReadableValue(item.vehicleRegistration, 'Unassigned vehicle'),
    vehicleModel: getReadableValue(item.vehicleModel, 'Vehicle model pending'),
    customerName: getReadableValue(item.customerName, item.supplierName),
    jobType: getReadableValue(item.jobType, item.spendCategory || 'Service job'),
    odometerReading: Number.isFinite(item.odometerReading) ? item.odometerReading ?? null : null,
    serviceBay: getReadableValue(item.serviceBay, item.branch),
    serviceAdvisor: getReadableValue(item.serviceAdvisor, item.requesterName),
    openedAt: getReadableValue(item.openedAt, item.documentDateTime),
    workshopStatus: getReadableValue(item.workshopStatus, item.status),
  };
}

function getIsoDatePart(value: string): string {
  return value.length >= 10 ? value.slice(0, 10) : value;
}

function formatOdometer(value: number | null): string {
  return value === null ? '-' : jobCardOdometerFormatter.format(value);
}

function getWorkshopStatusTone(status: string): string {
  switch (status) {
    case 'Delivered':
      return 'delivered';
    case 'Ready':
    case 'Approved':
      return 'ready';
    case 'Waiting parts':
    case 'Pending Approval':
      return 'waiting';
    case 'In progress':
      return 'progress';
    case 'Cancelled':
    case 'Rejected':
      return 'cancelled';
    default:
      return 'open';
  }
}

function renderVehicleCell(item: JobCardDocument) {
  const serviceMeta = getJobCardServiceMeta(item);
  const hasRegistration = serviceMeta.vehicleRegistration !== 'Unassigned vehicle';

  return (
    <div className="job-card-vehicle-cell" title={`${serviceMeta.vehicleRegistration} - ${serviceMeta.vehicleModel}`}>
      <span className="job-card-vehicle-cell__icon" aria-hidden="true">
        <CarFront size={14} />
      </span>
      <span className="job-card-vehicle-cell__copy">
        <span className={cn('job-card-vehicle-cell__plate', !hasRegistration && 'job-card-vehicle-cell__plate--empty')}>
          {serviceMeta.vehicleRegistration}
        </span>
        <span className="job-card-vehicle-cell__model">{serviceMeta.vehicleModel}</span>
      </span>
    </div>
  );
}

function renderWorkshopStatusCell(item: JobCardDocument) {
  const status = getJobCardServiceMeta(item).workshopStatus;

  return (
    <span className={cn('job-card-workshop-status', `job-card-workshop-status--${getWorkshopStatusTone(status)}`)}>
      {status}
    </span>
  );
}

function renderOpenedCell(item: JobCardDocument) {
  const openedDateTime = formatDateTime(getJobCardServiceMeta(item).openedAt);

  return (
    <div className="catalogue-table__datetime job-card-opened-cell">
      {openedDateTime.dateLabel}, {openedDateTime.timeLabel}
    </div>
  );
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

  const customerChoiceOptions: FilterChoiceOption[] = [
    { value: '', label: 'All customers' },
    ...supplierOptions.map((customer) => ({ value: customer, label: customer })),
  ];
  const statusChoiceOptions: FilterChoiceOption[] = [
    { value: '', label: 'All statuses' },
    ...jobCardWorkshopStatusOptions,
  ];
  const bayChoiceOptions: FilterChoiceOption[] = [
    { value: '', label: 'All bays' },
    ...branchOptions.map((bay) => ({ value: bay, label: bay })),
  ];
  const selectedCustomers = getSelectedFilterValues(draftFilters.suppliers, draftFilters.supplier);
  const selectedStatuses = draftFilters.statuses ?? [];
  const selectedBays = getSelectedFilterValues(draftFilters.branches, draftFilters.branch);
  const dateBadgeCount = Number(Boolean(draftFilters.startDate)) + Number(Boolean(draftFilters.endDate));
  const dateSummary = dateBadgeCount
    ? `${draftFilters.startDate || 'Any start'} to ${draftFilters.endDate || 'Any end'}`
    : 'Any opened date';

  const sections: EnterpriseFilterSection[] = [
    {
      id: 'customer',
      label: 'Customer',
      summary: getActiveChoicesSummary(selectedCustomers, 'All customers'),
      badgeCount: selectedCustomers.length || undefined,
      render: () => (
        <FilterChoiceGroup
          sectionId="customer"
          name="job-card-customer-filter"
          ariaLabel="Customer filter"
          selectionMode="multiple"
          values={selectedCustomers}
          options={customerChoiceOptions}
          searchValue={getChoiceSearchValue('customer')}
          searchPlaceholder="Search customers"
          emptyLabel="No customers found."
          onSearchChange={(value) => handleChoiceSearchChange('customer', value)}
          onValuesChange={(values) => onFilterValuesChange('suppliers', values)}
        />
      ),
    },
    {
      id: 'status',
      label: 'Status',
      summary: getActiveChoicesSummary(selectedStatuses, 'All statuses'),
      badgeCount: selectedStatuses.length || undefined,
      render: () => (
        <FilterChoiceGroup
          sectionId="status"
          name="job-card-status-filter"
          ariaLabel="Status filter"
          selectionMode="multiple"
          values={selectedStatuses}
          options={statusChoiceOptions}
          searchValue={getChoiceSearchValue('status')}
          searchPlaceholder="Search statuses"
          emptyLabel="No statuses found."
          onSearchChange={(value) => handleChoiceSearchChange('status', value)}
          onValuesChange={(values) => onFilterValuesChange('statuses', values)}
        />
      ),
    },
    {
      id: 'bay',
      label: 'Bay',
      summary: getActiveChoicesSummary(selectedBays, 'All bays'),
      badgeCount: selectedBays.length || undefined,
      render: () => (
        <FilterChoiceGroup
          sectionId="bay"
          name="job-card-bay-filter"
          ariaLabel="Bay filter"
          selectionMode="multiple"
          values={selectedBays}
          options={bayChoiceOptions}
          searchValue={getChoiceSearchValue('bay')}
          searchPlaceholder="Search bays"
          emptyLabel="No bays found."
          onSearchChange={(value) => handleChoiceSearchChange('bay', value)}
          onValuesChange={(values) => onFilterValuesChange('branches', values)}
        />
      ),
    },
    {
      id: 'opened-date',
      label: 'Opened date',
      summary: dateSummary,
      badgeCount: dateBadgeCount || undefined,
      render: () => (
        <div className="enterprise-filter-dialog__date-section">
          <div className="enterprise-filter-dialog__date-grid">
            <label className="enterprise-filter-dialog__field">
              <span className="field-label">Opened From</span>
              <Input
                type="date"
                value={draftFilters.startDate}
                onChange={(event) => onFilterChange('startDate', event.target.value)}
                max={draftFilters.endDate || undefined}
              />
            </label>

            <label className="enterprise-filter-dialog__field">
              <span className="field-label">Opened To</span>
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
      subtitle="Narrow down Job Cards by customer, bay, and workshop progress."
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

function getRequisitionPrimaryLineSummary(document: JobCardDocument): string {
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
  item: JobCardDocument;
  onView: () => void;
}> = ({ item, onView }) => {
  const documentDateTime = formatDateTime(item.documentDateTime);
  const totalAmount = formatRequisitionAmount(item.totalAmount, item.currency);
  const primaryLineSummary = getRequisitionPrimaryLineSummary(item);

  return (
    <article className="purchase-requisition-feed-card" aria-label={`Job card ${item.number}`}>
      <div className="purchase-requisition-feed-card__top-row">
        <div className="purchase-requisition-feed-card__badges" aria-label="Job Card state">
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

type JobCardSplitFieldId =
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

const defaultJobCardSplitFieldIds: JobCardSplitFieldId[] = [
  'number',
  'supplierName',
  'priority',
  'requirementDate',
];

const jobCardPreviewSections: CatalogueConfigurableSection[] = [
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
    id: 'job-card-timeline',
    title: 'Job Card timeline',
    description: 'Progress based on Job Card status.',
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

const defaultJobCardPreviewSectionOrder = jobCardPreviewSections.map((section) => section.id);

const jobCardSplitFields: CatalogueDisplayField<JobCardDocument>[] = [
  {
    id: 'number',
    label: 'Document no.',
    description: 'Primary Job Card number.',
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

function getRequisitionTimelineSteps(item: JobCardDocument) {
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
  rows: JobCardDocument[];
  canEdit: boolean;
  canCancel: boolean;
  onView: (documentId: string) => void;
  onEdit: (documentId: string) => void;
  onCancel: (documentId: string) => void;
}> = ({ rows, canEdit, canCancel, onView, onEdit, onCancel }) => {
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null);
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>(defaultJobCardSplitFieldIds);
  const [previewSectionOrder, setPreviewSectionOrder] = useState<string[]>(defaultJobCardPreviewSectionOrder);
  const [previewLayoutMode, setPreviewLayoutMode] = useState<CatalogueSectionLayoutMode>('single');
  const selectedItem = useMemo(
    () => rows.find((item) => item.id === selectedId) ?? rows[0] ?? null,
    [rows, selectedId]
  );
  const selectedFields = useMemo(
    () => jobCardSplitFields.filter((field) => selectedFieldIds.includes(field.id)),
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
        'job-card-timeline',
        {
          id: 'job-card-timeline',
          title: 'Job Card timeline',
          isWide: true,
          content: (
            <div className="catalogue-split-view__timeline" aria-label={`Job Card timeline for ${selectedItem.number}`}>
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
      <div className="catalogue-split-view__list" aria-label="Job card compact list">
        <div className="catalogue-split-view__list-header">
          <span>{selectedFieldIds.length} fields</span>
          <CatalogueFieldDisplaySettings
            title="Compact List Fields"
            fields={jobCardSplitFields}
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
                  sections={jobCardPreviewSections}
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
            <span>Select a Job Card to preview it here.</span>
          </div>
        )}
      </div>
    </div>
  );
};

const JobCardCatalogueView: React.FC<JobCardCatalogueViewProps> = ({
  filters,
  onFiltersChange,
  onNew,
  onStartCreateTour,
  onEdit,
  onNavigateToList,
  onNavigateToPurchaseOrderList,
}) => {
  const [documents, setDocuments] = useState<JobCardDocument[]>(extendedJobCardDocuments);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [previewDocumentId, setPreviewDocumentId] = useState<string | null>(null);
  const [draftFilters, setDraftFilters] = useState<CatalogueFilters>(filters);
  const [tableSearch, setTableSearch] = useState('');
  const [catalogueViewMode, setCatalogueViewMode] = useState<CatalogueViewModeId>(() =>
    resolveCatalogueViewMode(
      jobCardCatalogueDocumentType,
      loadCatalogueDisplayViewMode(jobCardCatalogueDocumentType)
    )
  );
  const [dateRangeError, setDateRangeError] = useState('');
  const [cancelDocumentId, setCancelDocumentId] = useState<string | null>(null);
  const [isNewIntakeOpen, setIsNewIntakeOpen] = useState(false);
  const [activeInsightKey, setActiveInsightKey] = useState<string | null>(null);
  const [isTourInviteVisible, setIsTourInviteVisible] = useState(() => !isJobCardTourDismissedForSession);
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [sortState, setSortState] = useState<SortState<SortKey>>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [customViews, setCustomViews] = useState<CatalogueViewDefinition[]>(() =>
    loadCustomCatalogueViews(JOB_CARD_CATALOGUE_VIEW_ENTITY)
  );
  const [recentlyViewedEntries, setRecentlyViewedEntries] = useState(() =>
    loadRecentlyViewedEntries(JOB_CARD_CATALOGUE_VIEW_ENTITY)
  );
  const [viewState, setViewState] = useState(() =>
    loadCatalogueViewState(JOB_CARD_CATALOGUE_VIEW_ENTITY)
  );
  const [activeViewId, setActiveViewId] = useState(() =>
    resolveCatalogueViewId(
      [
        ...getJobCardSystemViews(currentUserName),
        ...loadCustomCatalogueViews(JOB_CARD_CATALOGUE_VIEW_ENTITY),
      ],
      loadCatalogueViewState(JOB_CARD_CATALOGUE_VIEW_ENTITY),
      JOB_CARD_ALL_VIEW_ID
    )
  );
  const [isViewConfiguratorOpen, setIsViewConfiguratorOpen] = useState(false);
  const businessSettings = useBusinessSettings();
  const actionSettings = businessSettings.actions.jobCard;
  const isCompactCatalogueViewport = useMediaQuery('(max-width: 1024px)', { noSsr: true });
  const viewModeConfig = useMemo(
    () => getCatalogueViewModeConfig(jobCardCatalogueDocumentType),
    []
  );
  const availableCatalogueViewModes = useMemo(
    () => viewModeConfig.enabledViews
      .filter((viewMode) => isCompactCatalogueViewport || viewMode !== 'grid')
      .map((viewMode) => catalogueViewModeRegistry[viewMode]),
    [isCompactCatalogueViewport, viewModeConfig.enabledViews]
  );
  const resolvedCatalogueViewMode = resolveCatalogueViewMode(jobCardCatalogueDocumentType, catalogueViewMode);
  const activeCatalogueViewMode: CatalogueViewModeId = !isCompactCatalogueViewport && resolvedCatalogueViewMode === 'grid'
    ? 'list'
    : resolvedCatalogueViewMode;

  const systemViews = useMemo(
    () => getJobCardSystemViews(currentUserName),
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

    saveCatalogueViewState(JOB_CARD_CATALOGUE_VIEW_ENTITY, effectiveViewState);
  }, [effectiveViewState, viewState]);

  const effectiveActiveViewId = useMemo(() => {
    if (availableViews.some((view) => view.id === activeViewId)) {
      return activeViewId;
    }

    return resolveCatalogueViewId(availableViews, effectiveViewState, JOB_CARD_ALL_VIEW_ID);
  }, [activeViewId, availableViews, effectiveViewState]);

  const activeView = useMemo(
    () =>
      availableViews.find((view) => view.id === effectiveActiveViewId) ??
      availableViews.find((view) => view.id === JOB_CARD_ALL_VIEW_ID) ??
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
    () => filterJobCardDocumentsByView(documents, activeView, viewContext),
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
    () => Array.from(new Set(viewFilteredRows.map((item) => getJobCardServiceMeta(item).customerName))).sort(),
    [viewFilteredRows]
  );
  const allSupplierOptions = useMemo(
    () => Array.from(new Set(documents.map((item) => getJobCardServiceMeta(item).customerName))).sort(),
    [documents]
  );

  const branchOptions = useMemo(
    () => Array.from(new Set(viewFilteredRows.map((item) => getJobCardServiceMeta(item).serviceBay))).sort(),
    [viewFilteredRows]
  );
  const allBranchOptions = useMemo(
    () => Array.from(new Set(documents.map((item) => getJobCardServiceMeta(item).serviceBay))).sort(),
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
      const serviceMeta = getJobCardServiceMeta(item);
      const selectedCustomers = getSelectedFilterValues(filters.suppliers, filters.supplier);
      const selectedStatuses = filters.statuses ?? [];
      const selectedBays = getSelectedFilterValues(filters.branches, filters.branch);
      const openedDate = getIsoDatePart(serviceMeta.openedAt);
      const openedDateTime = formatDateTime(serviceMeta.openedAt);
      const matchesCustomer = selectedCustomers.length === 0 || selectedCustomers.includes(serviceMeta.customerName);
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(serviceMeta.workshopStatus) || selectedStatuses.includes(item.status);
      const matchesBay = selectedBays.length === 0 || selectedBays.includes(serviceMeta.serviceBay);
      const matchesStartDate = !startDate || openedDate >= startDate;
      const matchesEndDate = !endDate || openedDate <= endDate;
      const searchableValues = [
        item.number,
        serviceMeta.vehicleRegistration,
        serviceMeta.vehicleModel,
        serviceMeta.customerName,
        serviceMeta.jobType,
        formatOdometer(serviceMeta.odometerReading),
        serviceMeta.serviceBay,
        serviceMeta.serviceAdvisor,
        serviceMeta.workshopStatus,
        item.status,
        openedDateTime.dateLabel,
        openedDateTime.timeLabel,
      ];
      const matchesSearch =
        normalizedSearch.length === 0 ||
        searchableValues.some((value) => value.toLowerCase().includes(normalizedSearch));

      return matchesCustomer && matchesStatus && matchesBay && matchesStartDate && matchesEndDate && matchesSearch;
    });
  }, [filters, tableSearch, viewFilteredRows]);

  const sortedRows = useMemo(() => {
    const insightFilteredRows = baseFilteredRows.filter((item) => {
      if (!activeInsightKey || activeInsightKey === 'all') {
        return true;
      }

      const workshopStatus = getJobCardServiceMeta(item).workshopStatus;

      if (activeInsightKey === 'in-progress') {
        return workshopStatus === 'In progress';
      }

      if (activeInsightKey === 'waiting-parts') {
        return workshopStatus === 'Waiting parts';
      }

      if (activeInsightKey === 'ready') {
        return workshopStatus === 'Ready';
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

    const priorityOrder: Record<JobCardPriority, number> = {
      Low: 1,
      Medium: 2,
      High: 3,
      Critical: 4,
    };

    const statusOrder: Record<JobCardStatus, number> = {
      Draft: 1,
      'Pending Approval': 2,
      Approved: 3,
      Rejected: 4,
      Cancelled: 5,
    };

    const workshopStatusOrder: Record<string, number> = {
      Open: 1,
      'In progress': 2,
      'Waiting parts': 3,
      Ready: 4,
      Delivered: 5,
      Cancelled: 6,
    };

    const directionFactor = effectiveSortState.direction === 'asc' ? 1 : -1;
    const rows = [...insightFilteredRows];

    rows.sort((left, right) => {
      const leftServiceMeta = getJobCardServiceMeta(left);
      const rightServiceMeta = getJobCardServiceMeta(right);
      let comparison = 0;

      switch (effectiveSortState.key) {
        case 'number':
          comparison = left.number.localeCompare(right.number, undefined, { numeric: true });
          break;
        case 'vehicleRegistration':
          comparison = leftServiceMeta.vehicleRegistration.localeCompare(rightServiceMeta.vehicleRegistration, undefined, { numeric: true });
          break;
        case 'customerName':
          comparison = leftServiceMeta.customerName.localeCompare(rightServiceMeta.customerName);
          break;
        case 'jobType':
          comparison = leftServiceMeta.jobType.localeCompare(rightServiceMeta.jobType);
          break;
        case 'odometerReading':
          comparison = (leftServiceMeta.odometerReading ?? -1) - (rightServiceMeta.odometerReading ?? -1);
          break;
        case 'serviceBay':
          comparison = leftServiceMeta.serviceBay.localeCompare(rightServiceMeta.serviceBay, undefined, { numeric: true });
          break;
        case 'serviceAdvisor':
          comparison = leftServiceMeta.serviceAdvisor.localeCompare(rightServiceMeta.serviceAdvisor);
          break;
        case 'openedAt':
          comparison = new Date(leftServiceMeta.openedAt).getTime() - new Date(rightServiceMeta.openedAt).getTime();
          break;
        case 'workshopStatus':
          comparison = (workshopStatusOrder[leftServiceMeta.workshopStatus] ?? 99) - (workshopStatusOrder[rightServiceMeta.workshopStatus] ?? 99);
          if (comparison === 0) {
            comparison = leftServiceMeta.workshopStatus.localeCompare(rightServiceMeta.workshopStatus);
          }
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
    const inProgress = baseFilteredRows.filter((item) => getJobCardServiceMeta(item).workshopStatus === 'In progress').length;
    const waitingParts = baseFilteredRows.filter((item) => getJobCardServiceMeta(item).workshopStatus === 'Waiting parts').length;
    const ready = baseFilteredRows.filter((item) => getJobCardServiceMeta(item).workshopStatus === 'Ready').length;

    return [
      buildCountInsight({
        key: 'all',
        label: 'Visible Job Cards',
        count: total,
        total,
        support: `${formatInsightCount(total)} job cards in current view`,
        hint: 'All searchable Job Cards',
        tone: 'neutral',
      }),
      buildCountInsight({
        key: 'in-progress',
        label: 'In progress',
        count: inProgress,
        total,
        support: `${inProgress} active workshop jobs`,
        hint: `${getInsightPercent(inProgress, total)}% currently moving`,
        tone: 'primary',
      }),
      buildCountInsight({
        key: 'waiting-parts',
        label: 'Waiting parts',
        count: waitingParts,
        total,
        support: `${waitingParts} awaiting parts`,
        hint: `${getInsightPercent(waitingParts, total)}% parts constrained`,
        tone: 'warning',
      }),
      buildCountInsight({
        key: 'ready',
        label: 'Ready',
        count: ready,
        total,
        support: `${ready} ready for delivery`,
        hint: `${getInsightPercent(ready, total)}% ready`,
        tone: 'success',
      }),
    ];
  }, [baseFilteredRows]);

  const activeFilterCount = useMemo(() => getActiveFilterCount({
    ...emptyCatalogueFilters,
    supplier: filters.supplier,
    suppliers: filters.suppliers,
    branch: filters.branch,
    branches: filters.branches,
    statuses: filters.statuses,
    startDate: filters.startDate,
    endDate: filters.endDate,
  }), [filters]);
  const hasActiveFilters = activeFilterCount > 0;
  const viewCounts = useMemo(
    () =>
      Object.fromEntries(
        availableViews.map((view) => [
          view.id,
          filterJobCardDocumentsByView(documents, view, viewContext).length,
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
      ...(legacyField ? { [legacyField]: '' } : {}),
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
    const nextViewMode = resolveCatalogueViewMode(jobCardCatalogueDocumentType, requestedViewMode);
    setCatalogueViewMode(nextViewMode);
    saveCatalogueDisplayViewMode(jobCardCatalogueDocumentType, nextViewMode);
  };

  const handleSelectCatalogueView = (viewId: string) => {
    const nextView = availableViews.find((view) => view.id === viewId);
    if (!nextView) {
      return;
    }

    setActiveViewId(viewId);
    setViewState(setLastSelectedCatalogueViewId(JOB_CARD_CATALOGUE_VIEW_ENTITY, viewId));
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
    setViewState(setPinnedCatalogueViewId(JOB_CARD_CATALOGUE_VIEW_ENTITY, nextPinnedViewId));
  };

  const handleSaveView = (
    draft: EditableCatalogueViewDefinition,
    options: { viewId?: string; pinAsDefault: boolean }
  ) => {
    const nextCustomViews = options.viewId
      ? customViews.map((view) =>
          view.id === options.viewId ? updateCustomCatalogueView(view, draft) : view
        )
      : [...customViews, createCustomCatalogueView(JOB_CARD_CATALOGUE_VIEW_ENTITY, draft)];
    const savedViewId = options.viewId ?? nextCustomViews[nextCustomViews.length - 1]?.id ?? '';

    setCustomViews(nextCustomViews);
    saveCustomCatalogueViews(JOB_CARD_CATALOGUE_VIEW_ENTITY, nextCustomViews);

    if (savedViewId) {
      const nextState = options.pinAsDefault
        ? setPinnedCatalogueViewId(JOB_CARD_CATALOGUE_VIEW_ENTITY, savedViewId)
        : viewState.pinnedViewId === savedViewId
          ? setPinnedCatalogueViewId(JOB_CARD_CATALOGUE_VIEW_ENTITY, null)
          : viewState;

      if (nextState !== viewState) {
        setViewState(nextState);
      }

      setActiveViewId(savedViewId);
      setViewState(setLastSelectedCatalogueViewId(JOB_CARD_CATALOGUE_VIEW_ENTITY, savedViewId));

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
      saveCustomCatalogueViews(JOB_CARD_CATALOGUE_VIEW_ENTITY, nextViews);
      return nextViews;
    });

    const nextState = {
      pinnedViewId: viewState.pinnedViewId === viewId ? null : viewState.pinnedViewId,
      lastSelectedViewId: viewState.lastSelectedViewId === viewId ? null : viewState.lastSelectedViewId,
    };
    saveCatalogueViewState(JOB_CARD_CATALOGUE_VIEW_ENTITY, nextState);
    setViewState(nextState);

    if (activeViewId === viewId) {
      setActiveViewId(JOB_CARD_ALL_VIEW_ID);
    }
  };

  const registerRecentlyViewedDocument = useCallback((documentId: string) => {
    const document = documents.find((item) => item.id === documentId);
    setRecentlyViewedEntries(recordRecentlyViewedDocument(JOB_CARD_CATALOGUE_VIEW_ENTITY, documentId));

    if (document) {
      recordSidebarRecentDocument({
        documentId: document.id,
        documentNumber: document.number,
        moduleKey: 'job-card',
        moduleLabel: 'Job Card',
        partyLabel: getJobCardServiceMeta(document).customerName,
        status: document.status,
        route: '/job-card',
      });
    }
  }, [documents]);

  const handleViewDocument = useCallback((documentId: string) => {
    registerRecentlyViewedDocument(documentId);
    setPreviewDocumentId(documentId);
  }, [registerRecentlyViewedDocument]);

  const handleOpenNewIntake = useCallback(() => {
    setIsNewIntakeOpen(true);
  }, []);

  const handleProceedFromIntake = useCallback((draft: JobCardIntakeDraft) => {
    try {
      window.sessionStorage.setItem(JOB_CARD_INTAKE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Continue with normal create if storage is blocked by the browser.
    }

    onNew();
  }, [onNew]);

  const handleOpenExistingFromIntake = useCallback((documentId: string) => {
    handleViewDocument(documentId);
  }, [handleViewDocument]);

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

  const renderActionMenu = useCallback((item: JobCardDocument) => (
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

  const gridColumns = useMemo<DataGridColumn<JobCardDocument>[]>(() => [
    {
      id: 'number',
      label: 'Job Card',
      type: 'text',
      width: 124,
      minWidth: 116,
      getValue: (item) => item.number,
      renderCell: (item) => (
        <div className="job-card-document-cell">
          <span className="job-card-document-cell__accent" aria-hidden="true" />
          <button
            type="button"
            onClick={() => handleViewDocument(item.id)}
            className="catalogue-table__document-link job-card-document-cell__link"
          >
            {item.number}
          </button>
        </div>
      ),
    },
    {
      id: 'vehicleRegistration',
      label: 'Vehicle',
      type: 'text',
      width: 178,
      minWidth: 168,
      getValue: (item) => getJobCardServiceMeta(item).vehicleRegistration,
      getExportValue: (item) => {
        const serviceMeta = getJobCardServiceMeta(item);
        return `${serviceMeta.vehicleRegistration} - ${serviceMeta.vehicleModel}`;
      },
      renderCell: renderVehicleCell,
    },
    {
      id: 'customerName',
      label: 'Customer',
      type: 'text',
      width: 150,
      minWidth: 140,
      getValue: (item) => getJobCardServiceMeta(item).customerName,
      renderCell: (item) => {
        const customerName = getJobCardServiceMeta(item).customerName;
        return <div className="catalogue-table__truncate" title={customerName}>{customerName}</div>;
      },
    },
    {
      id: 'jobType',
      label: 'Type',
      type: 'text',
      width: 132,
      minWidth: 124,
      getValue: (item) => getJobCardServiceMeta(item).jobType,
      renderCell: (item) => <div className="catalogue-table__primary">{getJobCardServiceMeta(item).jobType}</div>,
    },
    {
      id: 'odometerReading',
      label: 'Odometer',
      type: 'number',
      width: 104,
      minWidth: 96,
      className: 'job-card-catalogue__numeric-cell',
      getValue: (item) => getJobCardServiceMeta(item).odometerReading ?? '',
      getExportValue: (item) => formatOdometer(getJobCardServiceMeta(item).odometerReading),
      renderCell: (item) => <span className="job-card-odometer-cell">{formatOdometer(getJobCardServiceMeta(item).odometerReading)}</span>,
    },
    {
      id: 'serviceBay',
      label: 'Bay',
      type: 'text',
      width: 74,
      minWidth: 72,
      getValue: (item) => getJobCardServiceMeta(item).serviceBay,
      renderCell: (item) => <span className="job-card-bay-cell">{getJobCardServiceMeta(item).serviceBay}</span>,
    },
    {
      id: 'serviceAdvisor',
      label: 'Advisor',
      type: 'text',
      width: 110,
      minWidth: 100,
      getValue: (item) => getJobCardServiceMeta(item).serviceAdvisor,
      renderCell: (item) => <div className="catalogue-table__truncate" title={getJobCardServiceMeta(item).serviceAdvisor}>{getJobCardServiceMeta(item).serviceAdvisor}</div>,
    },
    {
      id: 'openedAt',
      label: 'Opened',
      type: 'date',
      width: 132,
      minWidth: 124,
      getValue: (item) => getJobCardServiceMeta(item).openedAt,
      renderCell: renderOpenedCell,
    },
    {
      id: 'workshopStatus',
      label: 'Status',
      type: 'status',
      width: 112,
      minWidth: 104,
      getValue: (item) => getJobCardServiceMeta(item).workshopStatus,
      options: jobCardWorkshopStatusOptions,
      renderCell: renderWorkshopStatusCell,
    },
    {
      id: 'actions',
      label: 'Action',
      type: 'actions',
      width: 68,
      minWidth: 64,
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
    isJobCardTourDismissedForSession = true;
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
    const currentStep = jobCardCatalogueTourSteps[tourStepIndex];
    if (currentStep?.id === 'catalogue-new') {
      isJobCardTourDismissedForSession = true;
      setIsTourActive(false);
      onStartCreateTour?.();
      return;
    }

    setTourStepIndex((current) =>
      Math.min(current + 1, jobCardCatalogueTourSteps.length - 1)
    );
  };

  return (
    <AppShell
      activeLeaf="job-card"
      onJobCardClick={onNavigateToList}
      onPurchaseOrderClick={onNavigateToPurchaseOrderList}
      bottomBar={
        <div className="purchase-requisition-mobile-cta">
          <button type="button" className="purchase-requisition-mobile-cta__button" onClick={handleOpenNewIntake} data-tour="job-card-new-button-mobile">
            <Plus size={18} />
            New Job Card
          </button>
        </div>
      }
    >
      <TransactionCatalogueHeader
        titleDataTour="job-card-catalogue-title"
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
          ariaLabel: 'Search job cards',
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
          ariaLabel: hasActiveFilters ? `Filter job cards. ${activeFilterCount} filters applied.` : 'Filter job cards',
          activeCount: activeFilterCount,
          icon: Filter,
          onClick: openFilterDrawer,
        }}
        primaryAction={{
          label: 'New',
          icon: Plus,
          onClick: handleOpenNewIntake,
          dataTour: 'job-card-new-button',
          hideOnMobile: true,
          moveToBottomBarOnCompact: true,
        }}
      />
      <div className="purchase-requisition-catalogue-content job-card-catalogue-content mx-auto flex w-full max-w-[1800px] flex-col gap-4 px-4 py-4">
        {loadState === 'ready' && (
          <div data-tour="job-card-insight-cards">
            <CatalogueInsightCards
              items={insightItems}
              activeKey={activeInsightKey}
              ariaLabel="Job Card insights"
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
                Job cards could not be loaded right now.
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
                <h2 className="text-lg font-bold text-slate-900">No job cards found</h2>
                <p className="mt-2 max-w-xl text-sm text-slate-500">
                  Adjust your filters or start a new Job Card to populate this catalogue.
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  {hasActiveFilters && (
                    <button type="button" onClick={handleResetFilters} className="btn btn--outline">
                      Clear filters
                    </button>
                  )}
                  <button type="button" onClick={handleOpenNewIntake} className="btn btn--primary">
                    Create New Job Card
                  </button>
                </div>
              </div>
            )}

            {loadState === 'ready' && sortedRows.length > 0 && activeCatalogueViewMode === 'list' && (
              <div data-tour="job-card-catalogue-table">
                <CommonDataGrid
                  gridId="job-card-catalogue-service-v1"
                  rows={sortedRows}
                  columns={gridColumns}
                  rowId={(item) => item.id}
                  ariaLabel="Job cards table"
                  sortState={sortState}
                  onSortChange={handleSortChange}
                  chartTitle="Job Card"
                  exportFileName="job-cards.csv"
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
        title="Job Card Views"
        documentTypeLabel="Job Card"
        labels={{
          ownerMine: 'My Job Cards',
          primaryEntityField: 'Customer',
          primaryEntityAll: 'All customers',
          primaryEntityTag: 'Customer',
          secondaryEntityField: 'Bay',
          secondaryEntityAll: 'All bays',
          secondaryEntityTag: 'Bay',
        }}
        views={availableViews}
        activeViewId={activeView.id}
        pinnedViewId={effectiveViewState.pinnedViewId}
        viewCounts={viewCounts}
        currentUserName={currentUserName}
        requesterOptions={requesterOptions}
        supplierOptions={allSupplierOptions.map((customer) => ({ value: customer, label: customer }))}
        branchOptions={allBranchOptions.map((bay) => ({ value: bay, label: bay }))}
        statusOptions={jobCardWorkshopStatusOptions}
        priorityOptions={jobCardPriorityOptions}
        sortOptions={jobCardSortOptions}
        onClose={() => setIsViewConfiguratorOpen(false)}
        onSave={handleSaveView}
        onDelete={handleDeleteView}
        onPin={(viewId) =>
          setViewState(setPinnedCatalogueViewId(JOB_CARD_CATALOGUE_VIEW_ENTITY, viewId))
        }
      />

      <JobCardNewIntakeDialog
        isOpen={isNewIntakeOpen}
        onClose={() => setIsNewIntakeOpen(false)}
        onProceed={handleProceedFromIntake}
        onOpenExistingJobCard={handleOpenExistingFromIntake}
      />

      <JobCardPreviewDrawer
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
        documentTypeLabel="job card"
        documentNumber={cancelDocument?.number ?? ''}
        onClose={() => setCancelDocumentId(null)}
        onConfirm={() => handleConfirmCancelDocument()}
      />

      {isTourInviteVisible && !isTourActive && (
        <TourInvitePopup
          title="Job Card"
          description="Create, track, and manage service Job Cards from one catalogue."
          onTakeTour={handleTakeTour}
          onSkip={dismissTourForSession}
        />
      )}
      <GuidedTour
        isOpen={isTourActive}
        steps={jobCardCatalogueTourSteps}
        currentStepIndex={tourStepIndex}
        onNext={handleTourNext}
        onBack={() => setTourStepIndex((current) => Math.max(current - 1, 0))}
        onSkip={dismissTourForSession}
      />
    </AppShell>
  );
};

export default JobCardCatalogueView;

