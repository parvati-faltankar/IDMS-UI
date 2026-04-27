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
import CancelDocumentDialog from '../components/common/CancelDocumentDialog';
import CatalogueInsightCards from '../components/common/CatalogueInsightCards';
import CommonDataGrid from '../components/common/CommonDataGrid';
import type { DataGridColumn } from '../components/common/dataGridTypes';
import DocumentPreviewDrawer from '../components/common/DocumentPreviewDrawer';
import { Input, Select } from '../components/common/FormControls';
import SideDrawer from '../components/common/SideDrawer';
import StatusBadge from '../components/common/StatusBadge';
import type { RequisitionPriority, RequisitionStatus } from '../purchaseRequisitionCatalogueData';
import { cn } from '../utils/classNames';
import { formatDate, formatDateTime } from '../utils/dateFormat';
import type { SortState } from '../utils/sortState';
import { extendedSaleOrderDocuments, type SaleOrderDocument } from './saleOrderData';

interface SaleOrderListProps {
  onNew: () => void;
  onEdit: (documentId: string) => void;
  onNavigateToSaleOrderList: () => void;
}

interface SaleOrderFilters {
  customer: string;
  orderSource: string;
  salesExecutive: string;
  priority: string;
  statuses: RequisitionStatus[];
  documentDateFrom: string;
  documentDateTo: string;
  requestedDateFrom: string;
  requestedDateTo: string;
}

type SortKey =
  | 'number'
  | 'orderDateTime'
  | 'customerName'
  | 'orderSource'
  | 'salesExecutive'
  | 'requestedDeliveryDate'
  | 'validTillDate'
  | 'priority'
  | 'status'
  | 'totalAmount';

type AnalyticsFilterKey =
  | 'approval-health'
  | 'delivery-confidence'
  | 'priority-exposure'
  | 'value-realization'
  | 'finance-mix';

type AnalyticsInsightTone = 'success' | 'primary' | 'warning' | 'neutral';

interface AnalyticsInsightItem {
  key: AnalyticsFilterKey;
  label: string;
  value: string;
  support: string;
  hint: string;
  progress: number;
  tone: AnalyticsInsightTone;
}

const emptySaleOrderFilters: SaleOrderFilters = {
  customer: '',
  orderSource: '',
  salesExecutive: '',
  priority: '',
  statuses: [],
  documentDateFrom: '',
  documentDateTo: '',
  requestedDateFrom: '',
  requestedDateTo: '',
};

const saleOrderStatuses: RequisitionStatus[] = [
  'Draft',
  'Pending Approval',
  'Approved',
  'Rejected',
  'Cancelled',
];

const saleOrderPriorities: Array<Exclude<RequisitionPriority, 'Critical'>> = ['High', 'Medium', 'Low'];

function getActiveFilterCount(filters: SaleOrderFilters): number {
  return Object.values(filters).filter((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return value.trim().length > 0;
  }).length;
}

function formatInsightAmount(value: number): string {
  return `Rs ${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function formatInsightPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

function getInsightPercent(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }

  return (numerator / denominator) * 100;
}

function isCommitmentAligned(item: SaleOrderDocument): boolean {
  return item.promisedDeliveryDate <= item.requestedDeliveryDate;
}

function validateSaleOrderDateRanges(filters: SaleOrderFilters): string {
  if (
    filters.documentDateFrom &&
    filters.documentDateTo &&
    filters.documentDateTo < filters.documentDateFrom
  ) {
    return 'Document Date To cannot be earlier than Document Date From.';
  }

  if (
    filters.requestedDateFrom &&
    filters.requestedDateTo &&
    filters.requestedDateTo < filters.requestedDateFrom
  ) {
    return 'Requested Delivery To cannot be earlier than Requested Delivery From.';
  }

  return '';
}

const FilterDrawer: React.FC<{
  isOpen: boolean;
  draftFilters: SaleOrderFilters;
  customerOptions: string[];
  orderSourceOptions: string[];
  salesExecutiveOptions: string[];
  dateRangeError: string;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  onFilterChange: (field: keyof SaleOrderFilters, value: string) => void;
  onStatusToggle: (status: RequisitionStatus) => void;
}> = ({
  isOpen,
  draftFilters,
  customerOptions,
  orderSourceOptions,
  salesExecutiveOptions,
  dateRangeError,
  onClose,
  onApply,
  onReset,
  onFilterChange,
  onStatusToggle,
}) => {
  const firstFieldRef = useRef<HTMLSelectElement | null>(null);
  const documentDateError = dateRangeError.includes('Document Date') ? dateRangeError : '';
  const requestedDateError = dateRangeError.includes('Requested Delivery') ? dateRangeError : '';

  return (
    <SideDrawer
      isOpen={isOpen}
      title="Filters"
      subtitle="Refine sale orders by customer, source, executive, priority, status, and date ranges."
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
          <span className="field-label">Customer</span>
          <Select
            ref={firstFieldRef}
            value={draftFilters.customer}
            onChange={(event) => onFilterChange('customer', event.target.value)}
            options={[
              { value: '', label: 'All customers' },
              ...customerOptions.map((customer) => ({ value: customer, label: customer })),
            ]}
          />
        </label>

        <label className="drawer-form__field">
          <span className="field-label">Order Source</span>
          <Select
            value={draftFilters.orderSource}
            onChange={(event) => onFilterChange('orderSource', event.target.value)}
            options={[
              { value: '', label: 'All sources' },
              ...orderSourceOptions.map((orderSource) => ({
                value: orderSource,
                label: orderSource,
              })),
            ]}
          />
        </label>

        <label className="drawer-form__field">
          <span className="field-label">Sales Executive</span>
          <Select
            value={draftFilters.salesExecutive}
            onChange={(event) => onFilterChange('salesExecutive', event.target.value)}
            options={[
              { value: '', label: 'All executives' },
              ...salesExecutiveOptions.map((salesExecutive) => ({
                value: salesExecutive,
                label: salesExecutive,
              })),
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
              ...saleOrderPriorities.map((priority) => ({
                value: priority,
                label: priority,
              })),
            ]}
          />
        </label>

        <div className="drawer-form__field">
          <span className="field-label">Status</span>
          <div className="drawer-multiselect" role="group" aria-label="Select sale order status filters">
            {saleOrderStatuses.map((status) => {
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

        <div className="drawer-form__date-grid">
          <label className="drawer-form__field">
            <span className="field-label">Document Date From</span>
            <Input
              type="date"
              value={draftFilters.documentDateFrom}
              onChange={(event) => onFilterChange('documentDateFrom', event.target.value)}
              max={draftFilters.documentDateTo || undefined}
            />
          </label>

          <label className="drawer-form__field">
            <span className="field-label">Document Date To</span>
            <Input
              type="date"
              value={draftFilters.documentDateTo}
              onChange={(event) => onFilterChange('documentDateTo', event.target.value)}
              min={draftFilters.documentDateFrom || undefined}
              error={documentDateError}
            />
          </label>
        </div>

        {documentDateError && <p className="field-error">{documentDateError}</p>}

        <div className="drawer-form__date-grid">
          <label className="drawer-form__field">
            <span className="field-label">Requested Delivery From</span>
            <Input
              type="date"
              value={draftFilters.requestedDateFrom}
              onChange={(event) => onFilterChange('requestedDateFrom', event.target.value)}
              max={draftFilters.requestedDateTo || undefined}
            />
          </label>

          <label className="drawer-form__field">
            <span className="field-label">Requested Delivery To</span>
            <Input
              type="date"
              value={draftFilters.requestedDateTo}
              onChange={(event) => onFilterChange('requestedDateTo', event.target.value)}
              min={draftFilters.requestedDateFrom || undefined}
              error={requestedDateError}
            />
          </label>
        </div>

        {requestedDateError && <p className="field-error">{requestedDateError}</p>}
      </div>
    </SideDrawer>
  );
};

const SaleOrderList: React.FC<SaleOrderListProps> = ({
  onNew,
  onEdit,
  onNavigateToSaleOrderList,
}) => {
  const [documents, setDocuments] = useState<SaleOrderDocument[]>(extendedSaleOrderDocuments);
  const [filters, setFilters] = useState<SaleOrderFilters>(emptySaleOrderFilters);
  const [draftFilters, setDraftFilters] = useState<SaleOrderFilters>(emptySaleOrderFilters);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [catalogueViewMode, setCatalogueViewMode] = useState<'list' | 'grid'>('list');
  const [dateRangeError, setDateRangeError] = useState('');
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [previewDocumentId, setPreviewDocumentId] = useState<string | null>(null);
  const [cancelDocumentId, setCancelDocumentId] = useState<string | null>(null);
  const [sortState, setSortState] = useState<SortState<SortKey>>(null);
  const [activeAnalyticsFilter, setActiveAnalyticsFilter] = useState<AnalyticsFilterKey | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready'>('loading');
  const actionMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (loadState !== 'loading') {
      return;
    }

    const timer = window.setTimeout(() => setLoadState('ready'), 220);
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

  const customerOptions = useMemo(
    () => Array.from(new Set(documents.map((item) => item.customerName))).sort(),
    [documents]
  );

  const orderSourceOptions = useMemo(
    () => Array.from(new Set(documents.map((item) => item.orderSource))).sort(),
    [documents]
  );

  const salesExecutiveOptions = useMemo(
    () => Array.from(new Set(documents.map((item) => item.salesExecutive))).sort(),
    [documents]
  );

  const baseFilteredRows = useMemo(() => {
    const normalizedSearch = tableSearch.trim().toLowerCase();

    return documents.filter((item) => {
      const orderDate = item.orderDateTime.slice(0, 10);
      const matchesCustomer = !filters.customer || item.customerName === filters.customer;
      const matchesOrderSource = !filters.orderSource || item.orderSource === filters.orderSource;
      const matchesSalesExecutive =
        !filters.salesExecutive || item.salesExecutive === filters.salesExecutive;
      const matchesPriority = !filters.priority || item.priority === filters.priority;
      const matchesStatuses =
        filters.statuses.length === 0 || filters.statuses.includes(item.status);
      const matchesDocumentDateFrom =
        !filters.documentDateFrom || orderDate >= filters.documentDateFrom;
      const matchesDocumentDateTo =
        !filters.documentDateTo || orderDate <= filters.documentDateTo;
      const matchesRequestedDateFrom =
        !filters.requestedDateFrom ||
        item.requestedDeliveryDate >= filters.requestedDateFrom;
      const matchesRequestedDateTo =
        !filters.requestedDateTo ||
        item.requestedDeliveryDate <= filters.requestedDateTo;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        item.number.toLowerCase().includes(normalizedSearch) ||
        item.customerName.toLowerCase().includes(normalizedSearch) ||
        item.salesExecutive.toLowerCase().includes(normalizedSearch) ||
        item.orderSource.toLowerCase().includes(normalizedSearch) ||
        item.status.toLowerCase().includes(normalizedSearch) ||
        item.priority.toLowerCase().includes(normalizedSearch);

      return (
        matchesCustomer &&
        matchesOrderSource &&
        matchesSalesExecutive &&
        matchesPriority &&
        matchesStatuses &&
        matchesDocumentDateFrom &&
        matchesDocumentDateTo &&
        matchesRequestedDateFrom &&
        matchesRequestedDateTo &&
        matchesSearch
      );
    });
  }, [documents, filters, tableSearch]);

  const analyticsFilteredRows = useMemo(() => {
    if (!activeAnalyticsFilter) {
      return baseFilteredRows;
    }

    switch (activeAnalyticsFilter) {
      case 'approval-health':
        return baseFilteredRows.filter(
          (item) => item.status === 'Approved' || item.status === 'Pending Approval'
        );
      case 'delivery-confidence':
        return baseFilteredRows.filter((item) => isCommitmentAligned(item));
      case 'priority-exposure':
        return baseFilteredRows.filter((item) => item.priority === 'High');
      case 'value-realization':
        return baseFilteredRows.filter((item) => item.status === 'Approved');
      case 'finance-mix':
        return baseFilteredRows.filter(
          (item) => item.paymentMode === 'Finance' || item.paymentMode === 'Credit'
        );
      default:
        return baseFilteredRows;
    }
  }, [activeAnalyticsFilter, baseFilteredRows]);

  const sortedRows = useMemo(() => {
    if (!sortState) {
      return analyticsFilteredRows;
    }

    const priorityOrder: Record<Exclude<RequisitionPriority, 'Critical'>, number> = {
      Low: 1,
      Medium: 2,
      High: 3,
    };

    const statusOrder: Record<RequisitionStatus, number> = {
      Draft: 1,
      'Pending Approval': 2,
      Approved: 3,
      Rejected: 4,
      Cancelled: 5,
    };

    const directionFactor = sortState.direction === 'asc' ? 1 : -1;
    const rows = [...analyticsFilteredRows];

    rows.sort((left, right) => {
      let comparison = 0;

      switch (sortState.key) {
        case 'number':
          comparison = left.number.localeCompare(right.number, undefined, { numeric: true });
          break;
        case 'orderDateTime':
          comparison = new Date(left.orderDateTime).getTime() - new Date(right.orderDateTime).getTime();
          break;
        case 'customerName':
          comparison = left.customerName.localeCompare(right.customerName);
          break;
        case 'orderSource':
          comparison = left.orderSource.localeCompare(right.orderSource);
          break;
        case 'salesExecutive':
          comparison = left.salesExecutive.localeCompare(right.salesExecutive);
          break;
        case 'requestedDeliveryDate':
          comparison =
            new Date(left.requestedDeliveryDate).getTime() -
            new Date(right.requestedDeliveryDate).getTime();
          break;
        case 'validTillDate':
          comparison =
            new Date(left.validTillDate).getTime() -
            new Date(right.validTillDate).getTime();
          break;
        case 'priority':
          comparison = priorityOrder[left.priority] - priorityOrder[right.priority];
          break;
        case 'status':
          comparison = statusOrder[left.status] - statusOrder[right.status];
          break;
        case 'totalAmount':
          comparison =
            Number.parseFloat(left.totalAmount) - Number.parseFloat(right.totalAmount);
          break;
      }

      if (comparison === 0) {
        comparison = left.number.localeCompare(right.number, undefined, { numeric: true });
      }

      return comparison * directionFactor;
    });

    return rows;
  }, [analyticsFilteredRows, sortState]);

  const analyticsItems = useMemo<AnalyticsInsightItem[]>(() => {
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const nextSevenDays = new Date(todayDate);
    nextSevenDays.setDate(todayDate.getDate() + 7);

    const totalVisibleOrders = baseFilteredRows.length;
    const totalBookedValue = baseFilteredRows.reduce(
      (sum, item) => sum + Number.parseFloat(item.totalAmount || '0'),
      0
    );
    const approvedValue = baseFilteredRows
      .filter((item) => item.status === 'Approved')
      .reduce((sum, item) => sum + Number.parseFloat(item.totalAmount || '0'), 0);
    const pendingApprovalCount = baseFilteredRows.filter((item) => item.status === 'Pending Approval').length;
    const approvedCount = baseFilteredRows.filter((item) => item.status === 'Approved').length;
    const highPriorityCount = baseFilteredRows.filter((item) => item.priority === 'High').length;
    const mediumPriorityCount = baseFilteredRows.filter((item) => item.priority === 'Medium').length;
    const commitmentAlignedCount = baseFilteredRows.filter((item) => isCommitmentAligned(item)).length;
    const dueThisWeekCount = baseFilteredRows.filter((item) => {
      const requestedDate = new Date(item.requestedDeliveryDate);
      if (Number.isNaN(requestedDate.getTime())) {
        return false;
      }

      const normalizedRequestedDate = new Date(
        requestedDate.getFullYear(),
        requestedDate.getMonth(),
        requestedDate.getDate()
      );

      return normalizedRequestedDate >= todayDate && normalizedRequestedDate <= nextSevenDays;
    }).length;

    const approvalRate = getInsightPercent(approvedCount, totalVisibleOrders);
    const commitmentAlignedRate = getInsightPercent(commitmentAlignedCount, totalVisibleOrders);
    const highPriorityRate = getInsightPercent(highPriorityCount, totalVisibleOrders);
    const approvedValueShare = getInsightPercent(approvedValue, totalBookedValue);
    return [
      {
        key: 'approval-health',
        label: 'Approval health',
        value: formatInsightPercentage(approvalRate),
        support: `${approvedCount} of ${totalVisibleOrders || 0} orders approved`,
        hint: pendingApprovalCount > 0 ? `${pendingApprovalCount} pending approval` : 'No orders waiting for approval',
        progress: approvalRate,
        tone: 'success',
      },
      {
        key: 'delivery-confidence',
        label: 'Delivery confidence',
        value: formatInsightPercentage(commitmentAlignedRate),
        support: `${commitmentAlignedCount} orders promised on or before requested date`,
        hint: dueThisWeekCount > 0 ? `${dueThisWeekCount} orders due in the next 7 days` : 'No near-term delivery pressure',
        progress: commitmentAlignedRate,
        tone: 'primary',
      },
      {
        key: 'priority-exposure',
        label: 'Priority exposure',
        value: formatInsightPercentage(highPriorityRate),
        support: `${highPriorityCount} high-priority orders in focus`,
        hint: mediumPriorityCount > 0 ? `${mediumPriorityCount} medium-priority orders also need review` : 'Low operational escalation right now',
        progress: highPriorityRate,
        tone: 'warning',
      },
      {
        key: 'value-realization',
        label: 'Value realization',
        value: formatInsightPercentage(approvedValueShare),
        support: `${formatInsightAmount(approvedValue)} approved value share`,
        hint: `${formatInsightAmount(totalBookedValue)} booked across visible orders`,
        progress: approvedValueShare,
        tone: 'neutral',
      },
    ];
  }, [baseFilteredRows]);

  const activeFilterCount = useMemo(() => getActiveFilterCount(filters), [filters]);
  const hasActiveFilters = activeFilterCount > 0;

  const cancelDocument = useMemo(
    () => documents.find((document) => document.id === cancelDocumentId) ?? null,
    [cancelDocumentId, documents]
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

  const handleFilterChange = (field: keyof SaleOrderFilters, value: string) => {
    const nextFilters = {
      ...draftFilters,
      [field]: value,
    };

    setDraftFilters(nextFilters);
    setDateRangeError(validateSaleOrderDateRanges(nextFilters));
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
    setDateRangeError(validateSaleOrderDateRanges(nextFilters));
  };

  const handleApplyFilters = () => {
    const validationError = validateSaleOrderDateRanges(draftFilters);
    if (validationError) {
      setDateRangeError(validationError);
      return;
    }

    setFilters(draftFilters);
    setIsFilterDrawerOpen(false);
  };

  const handleResetFilters = () => {
    setDraftFilters(emptySaleOrderFilters);
    setFilters(emptySaleOrderFilters);
    setActiveAnalyticsFilter(null);
    setDateRangeError('');
    setIsFilterDrawerOpen(false);
  };

  const handleSortChange = (key: SortKey, direction: 'asc' | 'desc' | null) => {
    setSortState(direction ? { key, direction } : null);
  };

  const handleOpenCancelDialog = (documentId: string) => {
    setOpenActionMenuId(null);
    setCancelDocumentId(documentId);
  };

  const handlePreviewDocument = (documentId: string) => {
    setPreviewDocumentId(documentId);
    setOpenActionMenuId(null);
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

  const renderActionMenu = (item: SaleOrderDocument) => (
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
          <button type="button" className="catalogue-action-menu__item" role="menuitem" onClick={() => handlePreviewDocument(item.id)}>
            <Eye size={16} />
            View
          </button>
          <button type="button" className="catalogue-action-menu__item" role="menuitem" onClick={() => onEdit(item.id)}>
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
  );

  const gridColumns: DataGridColumn<SaleOrderDocument>[] = [
      {
        id: 'number',
        label: 'SO No.',
        type: 'text',
        width: 146,
        getValue: (item) => item.number,
        renderCell: (item) => (
          <button
            type="button"
            onClick={() => handlePreviewDocument(item.id)}
            className="catalogue-table__document-link"
          >
            {item.number}
          </button>
        ),
      },
      {
        id: 'orderDateTime',
        label: 'Document date & time',
        type: 'date',
        width: 196,
        getValue: (item) => item.orderDateTime,
        renderCell: (item) => {
          const documentDateTime = formatDateTime(item.orderDateTime);
          return (
            <div className="catalogue-table__datetime">
              {documentDateTime.dateLabel}, {documentDateTime.timeLabel}
            </div>
          );
        },
      },
      {
        id: 'customerName',
        label: 'Customer',
        type: 'text',
        width: 188,
        getValue: (item) => item.customerName,
        renderCell: (item) => (
          <div className="catalogue-table__truncate" title={item.customerName}>
            {item.customerName}
          </div>
        ),
      },
      {
        id: 'orderSource',
        label: 'Order source',
        type: 'text',
        width: 148,
        getValue: (item) => item.orderSource,
        renderCell: (item) => item.orderSource,
      },
      {
        id: 'salesExecutive',
        label: 'Sales executive',
        type: 'text',
        width: 164,
        getValue: (item) => item.salesExecutive,
        renderCell: (item) => item.salesExecutive,
      },
      {
        id: 'requestedDeliveryDate',
        label: 'Requested delivery',
        type: 'date',
        width: 154,
        getValue: (item) => item.requestedDeliveryDate,
        renderCell: (item) => formatDate(item.requestedDeliveryDate),
      },
      {
        id: 'validTillDate',
        label: 'Valid till',
        type: 'date',
        width: 142,
        getValue: (item) => item.validTillDate,
        renderCell: (item) => formatDate(item.validTillDate),
      },
      {
        id: 'priority',
        label: 'Priority',
        type: 'status',
        width: 116,
        getValue: (item) => item.priority,
        options: [
          { value: 'Low', label: 'Low' },
          { value: 'Medium', label: 'Medium' },
          { value: 'High', label: 'High' },
        ],
        renderCell: (item) => <StatusBadge kind="priority" value={item.priority} />,
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
        id: 'totalAmount',
        label: 'Total amount',
        type: 'number',
        width: 154,
        getValue: (item) => item.totalAmount,
        renderCell: (item) => item.totalAmount,
      },
      {
        id: 'actions',
        label: 'Action',
        type: 'actions',
        width: 86,
        sortable: false,
        filterable: false,
        groupable: false,
        hideable: false,
        defaultPin: 'right',
        getValue: () => '',
        renderCell: (item) => renderActionMenu(item),
      },
    ];

  return (
    <AppShell activeLeaf="sale-order" onSaleOrderClick={onNavigateToSaleOrderList}>
      <div className="catalogue-toolbar">
        <div className="catalogue-toolbar__inner catalogue-toolbar__inner--stacked">
          <div className="catalogue-toolbar__top">
            <div className="catalogue-toolbar__heading">
              <div className="catalogue-toolbar__title-row">
                <button type="button" className="catalogue-toolbar__title-button" aria-label="Sale order views">
                  <h2 className="brand-page-title">My Sale Order</h2>
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
                    aria-label="Search sale orders"
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
                  aria-label={hasActiveFilters ? `Filter sale orders. ${activeFilterCount} filters applied.` : 'Filter sale orders'}
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
            items={analyticsItems}
            activeKey={activeAnalyticsFilter}
            ariaLabel="Sale order insights"
            onSelect={(key) => {
              const insightKey = key as AnalyticsFilterKey;
              setActiveAnalyticsFilter((current) => (current === insightKey ? null : insightKey));
            }}
          />
        )}

        {loadState === 'loading' && (
          <div className="space-y-3" aria-live="polite">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        )}

        {loadState === 'ready' && sortedRows.length === 0 && (
          <div className="flex flex-col items-center rounded border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
              <FileText size={28} className="text-slate-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">No sale orders found</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-500">
              Adjust your search or filters, or create a new sale order to populate this catalogue.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {hasActiveFilters && (
                <button type="button" onClick={handleResetFilters} className="btn btn--outline">
                  Clear filters
                </button>
              )}
              <button type="button" onClick={onNew} className="btn btn--primary">
                Create New Sale Order
              </button>
            </div>
          </div>
        )}

        {loadState === 'ready' && sortedRows.length > 0 && catalogueViewMode === 'list' && (
          <div className="catalogue-table-scroll">
            <CommonDataGrid
              gridId="sale-order-catalogue"
              rows={sortedRows}
              columns={gridColumns}
              rowId={(item) => item.id}
              sortState={sortState}
              onSortChange={handleSortChange}
              chartTitle="Sale Order"
            />
          </div>
        )}

        {loadState === 'ready' && sortedRows.length > 0 && catalogueViewMode === 'grid' && (
          <div className="catalogue-card-grid">
            {sortedRows.map((item) => (
              <article key={item.id} className="catalogue-card">
                <div className="catalogue-card__top">
                  <div className="catalogue-card__identity">
                    <button
                      type="button"
                      onClick={() => handlePreviewDocument(item.id)}
                      className="catalogue-card__number"
                    >
                      {item.number}
                    </button>
                    <div className="catalogue-card__date">{formatDate(item.orderDateTime)}</div>
                  </div>

                  <div className="catalogue-card__top-actions">
                    <StatusBadge kind="priority" value={item.priority} />
                    <StatusBadge kind="requisition-status" value={item.status} />
                    {renderActionMenu(item)}
                  </div>
                </div>

                <div className="catalogue-card__body">
                  <div className="catalogue-card__info-grid">
                    <span className="catalogue-card__label">Customer</span>
                    <span className="catalogue-card__value">{item.customerName}</span>
                    <span className="catalogue-card__label">Order source</span>
                    <span className="catalogue-card__value">{item.orderSource}</span>
                    <span className="catalogue-card__label">Sales executive</span>
                    <span className="catalogue-card__value">{item.salesExecutive}</span>
                    <span className="catalogue-card__label">Requested delivery</span>
                    <span className="catalogue-card__value">{formatDate(item.requestedDeliveryDate)}</span>
                    <span className="catalogue-card__label">Valid till</span>
                    <span className="catalogue-card__value">{formatDate(item.validTillDate)}</span>
                    <span className="catalogue-card__label">Amount</span>
                    <span className="catalogue-card__value catalogue-card__value--accent">
                      {item.totalAmount}
                    </span>
                  </div>
                </div>

              </article>
            ))}
          </div>
        )}
      </div>

      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        draftFilters={draftFilters}
        customerOptions={customerOptions}
        orderSourceOptions={orderSourceOptions}
        salesExecutiveOptions={salesExecutiveOptions}
        dateRangeError={dateRangeError}
        onClose={() => setIsFilterDrawerOpen(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        onFilterChange={handleFilterChange}
        onStatusToggle={handleStatusToggle}
      />

      <DocumentPreviewDrawer
        document={previewDocument}
        isOpen={Boolean(previewDocument)}
        documentTypeLabel="Sale Order"
        subtitle="Sale Order preview"
        onClose={() => setPreviewDocumentId(null)}
        onEdit={(document) => onEdit(document.id)}
        onCancel={(document) => {
          setPreviewDocumentId(null);
          handleOpenCancelDialog(document.id);
        }}
        canEdit={previewDocument?.status !== 'Cancelled'}
        canCancel={previewDocument?.status !== 'Cancelled'}
      />

      <CancelDocumentDialog
        isOpen={Boolean(cancelDocument)}
        documentTypeLabel="sale order"
        documentNumber={cancelDocument?.number ?? ''}
        onClose={() => setCancelDocumentId(null)}
        onConfirm={() => handleConfirmCancelDocument()}
      />
    </AppShell>
  );
};

export default SaleOrderList;
