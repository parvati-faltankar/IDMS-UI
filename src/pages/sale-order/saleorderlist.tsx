import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Ban,
  Columns3,
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
import AppShell from '../../components/common/AppShell';
import CancelDocumentDialog from '../../components/common/CancelDocumentDialog';
import CatalogueFieldDisplaySettings from '../../components/common/CatalogueFieldDisplaySettings';
import type { CatalogueDisplayField } from '../../components/common/CatalogueFieldDisplaySettings';
import CatalogueInsightCards from '../../components/common/CatalogueInsightCards';
import CatalogueViewConfigurator from '../../components/common/CatalogueViewConfigurator';
import CatalogueViewSelector from '../../components/common/CatalogueViewSelector';
import CatalogueSectionLayoutSettings from '../../components/common/CatalogueSectionLayoutSettings';
import type { CatalogueConfigurableSection, CatalogueSectionLayoutMode } from '../../components/common/CatalogueSectionLayoutSettings';
import CommonDataGrid from '../../components/common/CommonDataGrid';
import type { DataGridColumn } from '../../components/common/dataGridTypes';
import DocumentPreviewDrawer from '../../components/common/DocumentPreviewDrawer';
import { Input, Select } from '../../components/common/FormControls';
import SideDrawer from '../../components/common/SideDrawer';
import StatusBadge from '../../components/common/StatusBadge';
import type { RequisitionPriority, RequisitionStatus } from '../purchase-requisition/purchaseRequisitionCatalogueData';
import { cn } from '../../utils/classNames';
import { recordSidebarRecentDocument } from '../../utils/sidebarRecentDocuments';
import { formatDate, formatDateTime } from '../../utils/dateFormat';
import type { SortState } from '../../utils/sortState';
import type { CatalogueViewDefinition, EditableCatalogueViewDefinition } from '../../utils/catalogueViews';
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
import { extendedSaleOrderDocuments, type SaleOrderDocument } from './saleOrderData';
import { DOCUMENT_STORE_EVENTS, getSaleOrders } from '../../stores/documentStore';
import {
  filterSaleOrdersByView,
  getSaleOrderSystemViews,
  SALE_ORDER_ALL_VIEW_ID,
  SALE_ORDER_CATALOGUE_VIEW_ENTITY,
} from './saleOrderViews';

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
  | 'promisedDeliveryDate'
  | 'paymentMode'
  | 'paymentMethod'
  | 'totalQuantity'
  | 'totalTaxAmount'
  | 'netAmount'
  | 'allocationStatus'
  | 'invoiceStatus'
  | 'deliveryStatus'
  | 'returnStatus'
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

type SaleOrderSplitFieldId =
  | 'number'
  | 'customerName'
  | 'priority'
  | 'requestedDeliveryDate'
  | 'status'
  | 'salesExecutive'
  | 'totalAmount';

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
const currentUserName = 'Alex Kumar';

const saleOrderStatusOptions = saleOrderStatuses.map((status) => ({
  value: status,
  label: status,
}));

const saleOrderPriorityOptions = saleOrderPriorities.map((priority) => ({
  value: priority,
  label: priority,
}));

const saleOrderSortOptions = [
  { value: 'number', label: 'Document Number' },
  { value: 'orderDateTime', label: 'Document Date' },
  { value: 'customerName', label: 'Customer' },
  { value: 'orderSource', label: 'Order Source' },
  { value: 'salesExecutive', label: 'Sales Executive' },
  { value: 'requestedDeliveryDate', label: 'Requested Delivery Date' },
  { value: 'validTillDate', label: 'Valid Till Date' },
  { value: 'promisedDeliveryDate', label: 'Promised Delivery Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
  { value: 'paymentMode', label: 'Payment Mode' },
  { value: 'paymentMethod', label: 'Payment Method' },
  { value: 'totalQuantity', label: 'Total Quantity' },
  { value: 'totalTaxAmount', label: 'Total Tax Amount' },
  { value: 'netAmount', label: 'Net Amount' },
  { value: 'totalAmount', label: 'Total Amount' },
];

const defaultSaleOrderSplitFieldIds: SaleOrderSplitFieldId[] = [
  'number',
  'customerName',
  'priority',
  'requestedDeliveryDate',
];

const saleOrderPreviewSections: CatalogueConfigurableSection[] = [
  {
    id: 'document-information',
    title: 'Document information',
    description: 'Number, status, priority, dates, and document timing.',
  },
  {
    id: 'party-details',
    title: 'Party details',
    description: 'Customer, sales executive, and place of supply.',
  },
  {
    id: 'commercial-summary',
    title: 'Commercial summary',
    description: 'Order source, payment, taxes, and totals.',
  },
  {
    id: 'delivery-fulfilment',
    title: 'Delivery and fulfilment',
    description: 'Requested, promised, delivery, and shipping details.',
  },
  {
    id: 'notes',
    title: 'Notes',
    description: 'Payment, delivery, shipping, and insurance remarks.',
  },
  {
    id: 'product-lines',
    title: 'Product lines',
    description: 'Line item table.',
  },
];

const defaultSaleOrderPreviewSectionOrder = saleOrderPreviewSections.map((section) => section.id);

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

function parseAmount(value: string): number {
  const parsed = Number.parseFloat(value || '0');
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number): string {
  return `Rs ${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function getTotalQuantity(document: SaleOrderDocument): number {
  return document.lines.reduce((sum, line) => sum + parseAmount(line.orderQuantity), 0);
}

function getTotalTaxAmount(document: SaleOrderDocument): number {
  return document.lines.reduce(
    (sum, line) => sum + Math.max(parseAmount(line.lineAmount) - parseAmount(line.taxableAmount), 0),
    0
  );
}

function getNetAmount(document: SaleOrderDocument): number {
  return document.lines.reduce((sum, line) => sum + parseAmount(line.taxableAmount), 0);
}

function getProgressStatus(completed: number, total: number): string {
  if (total <= 0) {
    return '-';
  }

  if (completed <= 0) {
    return 'Not Started';
  }

  if (completed >= total) {
    return 'Completed';
  }

  return 'Partial';
}

function getAllocationStatus(document: SaleOrderDocument): string {
  const total = getTotalQuantity(document);
  const allocated = document.lines.reduce((sum, line) => sum + parseAmount(line.allocatedQuantity ?? '0'), 0);
  return getProgressStatus(allocated, total);
}

function getInvoiceStatus(document: SaleOrderDocument): string {
  const total = getTotalQuantity(document);
  const invoiced = document.lines.reduce((sum, line) => sum + parseAmount(line.invoicedQuantity ?? '0'), 0);
  return getProgressStatus(invoiced, total);
}

function getDeliveryStatus(document: SaleOrderDocument): string {
  const total = getTotalQuantity(document);
  const delivered = document.lines.reduce((sum, line) => sum + parseAmount(line.deliveryQuantity ?? '0'), 0);
  return getProgressStatus(delivered, total);
}

function getReturnStatus(document: SaleOrderDocument): string {
  const returned = document.lines.reduce((sum, line) => sum + parseAmount(line.returnedQuantity ?? '0'), 0);
  return returned > 0 ? 'Returned' : 'No Return';
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

const saleOrderSplitFields: CatalogueDisplayField<SaleOrderDocument>[] = [
  {
    id: 'number',
    label: 'Document no.',
    description: 'Primary sale order number.',
    render: (item) => item.number,
  },
  {
    id: 'customerName',
    label: 'Customer',
    description: 'Customer name.',
    render: (item) => item.customerName,
  },
  {
    id: 'priority',
    label: 'Priority',
    description: 'Priority value.',
    render: (item) => item.priority,
  },
  {
    id: 'requestedDeliveryDate',
    label: 'Requested delivery',
    description: 'Requested delivery date.',
    render: (item) => formatDate(item.requestedDeliveryDate),
  },
  {
    id: 'status',
    label: 'Status',
    description: 'Document status.',
    render: (item) => item.status,
  },
  {
    id: 'salesExecutive',
    label: 'Sales executive',
    description: 'Assigned sales executive.',
    render: (item) => item.salesExecutive || '-',
  },
  {
    id: 'totalAmount',
    label: 'Total amount',
    description: 'Document total amount.',
    render: (item) => formatCurrency(parseAmount(item.totalAmount)),
  },
];

const CatalogueSplitView: React.FC<{
  rows: SaleOrderDocument[];
  onView: (documentId: string) => void;
  onEdit: (documentId: string) => void;
  onCancel: (documentId: string) => void;
}> = ({ rows, onView, onEdit, onCancel }) => {
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null);
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>(defaultSaleOrderSplitFieldIds);
  const [previewSectionOrder, setPreviewSectionOrder] = useState<string[]>(defaultSaleOrderPreviewSectionOrder);
  const [previewLayoutMode, setPreviewLayoutMode] = useState<CatalogueSectionLayoutMode>('single');

  const selectedItem = useMemo(
    () => rows.find((item) => item.id === selectedId) ?? rows[0] ?? null,
    [rows, selectedId]
  );

  const selectedFields = useMemo(
    () => saleOrderSplitFields.filter((field) => selectedFieldIds.includes(field.id)),
    [selectedFieldIds]
  );

  const notesSummary = useMemo(() => {
    if (!selectedItem) {
      return [];
    }

    return [
      selectedItem.paymentRemarks && { label: 'Payment remarks', value: selectedItem.paymentRemarks },
      selectedItem.deliveryInstruction && { label: 'Delivery instruction', value: selectedItem.deliveryInstruction },
      selectedItem.shippingInstructions && { label: 'Shipping instructions', value: selectedItem.shippingInstructions },
      selectedItem.insuranceRemarks && { label: 'Insurance remarks', value: selectedItem.insuranceRemarks },
    ].filter(Boolean) as Array<{ label: string; value: string }>;
  }, [selectedItem]);

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
              <div><span>Status</span><strong>{selectedItem.status}</strong></div>
              <div><span>Priority</span><strong>{selectedItem.priority}</strong></div>
              <div><span>Document date</span><strong>{formatDateTime(selectedItem.orderDateTime).dateLabel}</strong></div>
              <div><span>Document time</span><strong>{formatDateTime(selectedItem.orderDateTime).timeLabel}</strong></div>
              <div><span>Requested delivery</span><strong>{formatDate(selectedItem.requestedDeliveryDate)}</strong></div>
              <div><span>Promised delivery</span><strong>{formatDate(selectedItem.promisedDeliveryDate)}</strong></div>
              <div><span>Valid till</span><strong>{formatDate(selectedItem.validTillDate)}</strong></div>
              <div><span>Lines</span><strong>{selectedItem.lines.length}</strong></div>
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
              <div><span>Customer</span><strong>{selectedItem.customerName}</strong></div>
              <div><span>Sales executive</span><strong>{selectedItem.salesExecutive || '-'}</strong></div>
              <div><span>Order source</span><strong>{selectedItem.orderSource || '-'}</strong></div>
              <div><span>Place of supply</span><strong>{selectedItem.placeOfSupply || '-'}</strong></div>
            </div>
          ),
        },
      ],
      [
        'commercial-summary',
        {
          id: 'commercial-summary',
          title: 'Commercial summary',
          content: (
            <div className="catalogue-split-view__compact-grid">
              <div><span>Payment mode</span><strong>{selectedItem.paymentMode || '-'}</strong></div>
              <div><span>Payment method</span><strong>{selectedItem.paymentMethod || '-'}</strong></div>
              <div><span>Payment term</span><strong>{selectedItem.paymentTerm || '-'}</strong></div>
              <div><span>Advance payment</span><strong>{formatCurrency(parseAmount(selectedItem.advancePayment))}</strong></div>
              <div><span>Total quantity</span><strong>{getTotalQuantity(selectedItem)}</strong></div>
              <div><span>Total tax amount</span><strong>{formatCurrency(getTotalTaxAmount(selectedItem))}</strong></div>
              <div><span>Net amount</span><strong>{formatCurrency(getNetAmount(selectedItem))}</strong></div>
              <div><span>Total amount</span><strong>{formatCurrency(parseAmount(selectedItem.totalAmount))}</strong></div>
            </div>
          ),
        },
      ],
      [
        'delivery-fulfilment',
        {
          id: 'delivery-fulfilment',
          title: 'Delivery and fulfilment',
          content: (
            <div className="catalogue-split-view__compact-grid">
              <div><span>Delivery term</span><strong>{selectedItem.deliveryTerm || '-'}</strong></div>
              <div><span>Delivery type</span><strong>{selectedItem.deliveryType || '-'}</strong></div>
              <div><span>Delivery slot</span><strong>{selectedItem.deliverySlot || '-'}</strong></div>
              <div><span>Delivery address</span><strong>{selectedItem.deliveryAddress || '-'}</strong></div>
              <div><span>Shipping term</span><strong>{selectedItem.shippingTerm || '-'}</strong></div>
              <div><span>Shipping method</span><strong>{selectedItem.shippingMethod || '-'}</strong></div>
              <div><span>Shipping address</span><strong>{selectedItem.shippingAddress || '-'}</strong></div>
              <div><span>Allocation status</span><strong>{getAllocationStatus(selectedItem)}</strong></div>
              <div><span>Invoice status</span><strong>{getInvoiceStatus(selectedItem)}</strong></div>
              <div><span>Delivery status</span><strong>{getDeliveryStatus(selectedItem)}</strong></div>
              <div><span>Return status</span><strong>{getReturnStatus(selectedItem)}</strong></div>
            </div>
          ),
        },
      ],
      [
        'notes',
        {
          id: 'notes',
          title: 'Notes',
          isWide: true,
          content: notesSummary.length > 0 ? (
            <div className="catalogue-split-view__compact-grid">
              {notesSummary.map((note) => (
                <div key={note.label}>
                  <span>{note.label}</span>
                  <strong>{note.value}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p>No notes added.</p>
          ),
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
                    <th>Requested</th>
                    <th className="catalogue-split-view__number-cell">Rate</th>
                    <th className="catalogue-split-view__number-cell">Order Qty</th>
                    <th className="catalogue-split-view__number-cell">Taxable</th>
                    <th className="catalogue-split-view__number-cell">Line Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItem.lines.map((line) => (
                    <tr key={`${line.productCode}-${line.requestedDate}-${line.productName}`}>
                      <td>{line.productCode}</td>
                      <td>
                        <strong>{line.productName}</strong>
                        <span>{line.remark || '-'}</span>
                      </td>
                      <td>{line.uom}</td>
                      <td>{line.priority}</td>
                      <td>{formatDate(line.requestedDate)}</td>
                      <td className="catalogue-split-view__number-cell">{formatCurrency(parseAmount(line.rate))}</td>
                      <td className="catalogue-split-view__number-cell">{line.orderQuantity}</td>
                      <td className="catalogue-split-view__number-cell">{formatCurrency(parseAmount(line.taxableAmount))}</td>
                      <td className="catalogue-split-view__number-cell">{formatCurrency(parseAmount(line.lineAmount))}</td>
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
  }, [notesSummary, selectedItem]);

  const orderedPreviewSections = useMemo(
    () =>
      previewSectionOrder
        .map((sectionId) => previewSectionMap.get(sectionId))
        .filter((section): section is { id: string; title: string; isWide?: boolean; content: React.ReactNode } => Boolean(section)),
    [previewSectionMap, previewSectionOrder]
  );

  return (
    <div className="catalogue-split-view">
      <div className="catalogue-split-view__list" aria-label="Sale order compact list">
        <div className="catalogue-split-view__list-header">
          <span>{selectedFieldIds.length} fields</span>
          <CatalogueFieldDisplaySettings
            title="Compact List Fields"
            fields={saleOrderSplitFields}
            selectedFieldIds={selectedFieldIds}
            maxFields={7}
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
                <h2>{selectedItem.customerName}</h2>
                <p>{selectedItem.orderSource || '-'} - {selectedItem.salesExecutive || '-'}</p>
              </div>
              <div className="catalogue-split-view__preview-actions" aria-label={`${selectedItem.number} actions`}>
                <CatalogueSectionLayoutSettings
                  title="Detail Section Layout"
                  sections={saleOrderPreviewSections}
                  sectionOrder={previewSectionOrder}
                  layoutMode={previewLayoutMode}
                  onSectionOrderChange={setPreviewSectionOrder}
                  onLayoutModeChange={setPreviewLayoutMode}
                />
                <button
                  type="button"
                  onClick={() => onView(selectedItem.id)}
                  className="catalogue-split-view__icon-action"
                  aria-label={`View ${selectedItem.number}`}
                  title="View"
                >
                  <Eye size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(selectedItem.id)}
                  className="catalogue-split-view__icon-action"
                  disabled={selectedItem.status === 'Cancelled'}
                  aria-label={`Edit ${selectedItem.number}`}
                  title={selectedItem.status !== 'Cancelled' ? 'Edit' : 'Edit is not available'}
                >
                  <PencilLine size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => onCancel(selectedItem.id)}
                  className="catalogue-split-view__icon-action catalogue-split-view__icon-action--danger"
                  disabled={selectedItem.status === 'Cancelled'}
                  aria-label={`Cancel ${selectedItem.number}`}
                  title={selectedItem.status !== 'Cancelled' ? 'Cancel' : 'Cancel is not available'}
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
            <span>Select a sale order to preview it here.</span>
          </div>
        )}
      </div>
    </div>
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
  const [catalogueViewMode, setCatalogueViewMode] = useState<'list' | 'grid' | 'split'>('list');
  const [dateRangeError, setDateRangeError] = useState('');
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [previewDocumentId, setPreviewDocumentId] = useState<string | null>(null);
  const [cancelDocumentId, setCancelDocumentId] = useState<string | null>(null);
  const [sortState, setSortState] = useState<SortState<SortKey>>(null);
  const [activeAnalyticsFilter, setActiveAnalyticsFilter] = useState<AnalyticsFilterKey | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready'>('loading');
  const [customViews, setCustomViews] = useState<CatalogueViewDefinition[]>(() =>
    loadCustomCatalogueViews(SALE_ORDER_CATALOGUE_VIEW_ENTITY)
  );
  const [recentlyViewedEntries, setRecentlyViewedEntries] = useState(() =>
    loadRecentlyViewedEntries(SALE_ORDER_CATALOGUE_VIEW_ENTITY)
  );
  const [viewState, setViewState] = useState(() =>
    loadCatalogueViewState(SALE_ORDER_CATALOGUE_VIEW_ENTITY)
  );
  const [activeViewId, setActiveViewId] = useState(() =>
    resolveCatalogueViewId(
      [
        ...getSaleOrderSystemViews(currentUserName),
        ...loadCustomCatalogueViews(SALE_ORDER_CATALOGUE_VIEW_ENTITY),
      ],
      loadCatalogueViewState(SALE_ORDER_CATALOGUE_VIEW_ENTITY),
      SALE_ORDER_ALL_VIEW_ID
    )
  );
  const [isViewConfiguratorOpen, setIsViewConfiguratorOpen] = useState(false);
  const actionMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const systemViews = useMemo(() => getSaleOrderSystemViews(currentUserName), []);
  const availableViews = useMemo(() => [...systemViews, ...customViews], [customViews, systemViews]);
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
  const effectiveActiveViewId = useMemo(() => {
    if (availableViews.some((view) => view.id === activeViewId)) {
      return activeViewId;
    }

    return resolveCatalogueViewId(availableViews, effectiveViewState, SALE_ORDER_ALL_VIEW_ID);
  }, [activeViewId, availableViews, effectiveViewState]);
  const activeView = useMemo(
    () =>
      availableViews.find((view) => view.id === effectiveActiveViewId) ??
      availableViews.find((view) => view.id === SALE_ORDER_ALL_VIEW_ID) ??
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
    () => filterSaleOrdersByView(documents, activeView, viewContext),
    [activeView, documents, viewContext]
  );

  useEffect(() => {
    setDocuments(getSaleOrders());
  }, []);

  useEffect(() => {
    const refreshDocuments = () => setDocuments(getSaleOrders());
    window.addEventListener(DOCUMENT_STORE_EVENTS.saleOrderUpdated, refreshDocuments);
    window.addEventListener('storage', refreshDocuments);
    return () => {
      window.removeEventListener(DOCUMENT_STORE_EVENTS.saleOrderUpdated, refreshDocuments);
      window.removeEventListener('storage', refreshDocuments);
    };
  }, []);

  useEffect(() => {
    if (
      effectiveViewState.pinnedViewId === viewState.pinnedViewId &&
      effectiveViewState.lastSelectedViewId === viewState.lastSelectedViewId
    ) {
      return;
    }

    saveCatalogueViewState(SALE_ORDER_CATALOGUE_VIEW_ENTITY, effectiveViewState);
    setViewState(effectiveViewState);
  }, [effectiveViewState, viewState]);

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

    return viewFilteredRows.filter((item) => {
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
  }, [filters, tableSearch, viewFilteredRows]);

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
    const effectiveSortState =
      sortState ??
      (activeView.sort
        ? {
            key: activeView.sort.key as SortKey,
            direction: activeView.sort.direction,
          }
        : null);

    if (!effectiveSortState) {
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

    const directionFactor = effectiveSortState.direction === 'asc' ? 1 : -1;
    const rows = [...analyticsFilteredRows];

    rows.sort((left, right) => {
      let comparison = 0;

      switch (effectiveSortState.key) {
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
        case 'promisedDeliveryDate':
          comparison =
            new Date(left.promisedDeliveryDate).getTime() -
            new Date(right.promisedDeliveryDate).getTime();
          break;
        case 'paymentMode':
          comparison = left.paymentMode.localeCompare(right.paymentMode);
          break;
        case 'paymentMethod':
          comparison = left.paymentMethod.localeCompare(right.paymentMethod);
          break;
        case 'totalQuantity':
          comparison = getTotalQuantity(left) - getTotalQuantity(right);
          break;
        case 'totalTaxAmount':
          comparison = getTotalTaxAmount(left) - getTotalTaxAmount(right);
          break;
        case 'netAmount':
          comparison = getNetAmount(left) - getNetAmount(right);
          break;
        case 'allocationStatus':
          comparison = getAllocationStatus(left).localeCompare(getAllocationStatus(right));
          break;
        case 'invoiceStatus':
          comparison = getInvoiceStatus(left).localeCompare(getInvoiceStatus(right));
          break;
        case 'deliveryStatus':
          comparison = getDeliveryStatus(left).localeCompare(getDeliveryStatus(right));
          break;
        case 'returnStatus':
          comparison = getReturnStatus(left).localeCompare(getReturnStatus(right));
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
  }, [activeView.sort, analyticsFilteredRows, sortState]);

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
  const viewCounts = useMemo(
    () =>
      Object.fromEntries(
        availableViews.map((view) => [
          view.id,
          filterSaleOrdersByView(documents, view, viewContext).length,
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

  const handleSelectCatalogueView = (viewId: string) => {
    const nextView = availableViews.find((view) => view.id === viewId);
    if (!nextView) {
      return;
    }

    setActiveViewId(viewId);
    setViewState(setLastSelectedCatalogueViewId(SALE_ORDER_CATALOGUE_VIEW_ENTITY, viewId));
    setActiveAnalyticsFilter(null);
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
    setViewState(setPinnedCatalogueViewId(SALE_ORDER_CATALOGUE_VIEW_ENTITY, nextPinnedViewId));
  };

  const handleSaveView = (
    draft: EditableCatalogueViewDefinition,
    options: { viewId?: string; pinAsDefault: boolean }
  ) => {
    const nextCustomViews = options.viewId
      ? customViews.map((view) =>
          view.id === options.viewId ? updateCustomCatalogueView(view, draft) : view
        )
      : [...customViews, createCustomCatalogueView(SALE_ORDER_CATALOGUE_VIEW_ENTITY, draft)];
    const savedViewId = options.viewId ?? nextCustomViews[nextCustomViews.length - 1]?.id ?? '';

    setCustomViews(nextCustomViews);
    saveCustomCatalogueViews(SALE_ORDER_CATALOGUE_VIEW_ENTITY, nextCustomViews);

    if (savedViewId) {
      const nextState = options.pinAsDefault
        ? setPinnedCatalogueViewId(SALE_ORDER_CATALOGUE_VIEW_ENTITY, savedViewId)
        : viewState.pinnedViewId === savedViewId
          ? setPinnedCatalogueViewId(SALE_ORDER_CATALOGUE_VIEW_ENTITY, null)
          : viewState;

      if (nextState !== viewState) {
        setViewState(nextState);
      }

      setActiveViewId(savedViewId);
      setViewState(setLastSelectedCatalogueViewId(SALE_ORDER_CATALOGUE_VIEW_ENTITY, savedViewId));

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
      saveCustomCatalogueViews(SALE_ORDER_CATALOGUE_VIEW_ENTITY, nextViews);
      return nextViews;
    });

    const nextState = {
      pinnedViewId: viewState.pinnedViewId === viewId ? null : viewState.pinnedViewId,
      lastSelectedViewId: viewState.lastSelectedViewId === viewId ? null : viewState.lastSelectedViewId,
    };
    saveCatalogueViewState(SALE_ORDER_CATALOGUE_VIEW_ENTITY, nextState);
    setViewState(nextState);

    if (activeViewId === viewId) {
      setActiveViewId(SALE_ORDER_ALL_VIEW_ID);
    }
  };

  const registerRecentlyViewedDocument = useCallback((documentId: string) => {
    const document = documents.find((item) => item.id === documentId);
    setRecentlyViewedEntries(recordRecentlyViewedDocument(SALE_ORDER_CATALOGUE_VIEW_ENTITY, documentId));

    if (document) {
      recordSidebarRecentDocument({
        documentId: document.id,
        documentNumber: document.number,
        moduleKey: 'sale-order',
        moduleLabel: 'Sale Order',
        partyLabel: document.customerName,
        status: document.status,
        route: '/sale-order',
      });
    }
  }, [documents]);

  const handleOpenCancelDialog = useCallback((documentId: string) => {
    setOpenActionMenuId(null);
    setCancelDocumentId(documentId);
  }, []);

  const handlePreviewDocument = useCallback((documentId: string) => {
    registerRecentlyViewedDocument(documentId);
    setPreviewDocumentId(documentId);
    setOpenActionMenuId(null);
  }, [registerRecentlyViewedDocument]);

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

  const renderActionMenu = useCallback((item: SaleOrderDocument) => (
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
  ), [handleOpenCancelDialog, handlePreviewDocument, onEdit, openActionMenuId]);

  const gridColumns = useMemo<DataGridColumn<SaleOrderDocument>[]>(() => [
    {
      id: 'number',
      label: 'Document Number',
      type: 'text',
      width: 156,
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
      label: 'Document Date',
      type: 'date',
      width: 150,
      getValue: (item) => item.orderDateTime,
      renderCell: (item) => formatDate(item.orderDateTime.slice(0, 10)),
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
      id: 'salesExecutive',
      label: 'Sales Executive',
      type: 'text',
      width: 164,
      getValue: (item) => item.salesExecutive,
      renderCell: (item) => item.salesExecutive,
    },
    {
      id: 'orderSource',
      label: 'Order Source',
      type: 'text',
      width: 148,
      getValue: (item) => item.orderSource,
      renderCell: (item) => item.orderSource,
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
      id: 'requestedDeliveryDate',
      label: 'Requested Delivery Date',
      type: 'date',
      width: 178,
      getValue: (item) => item.requestedDeliveryDate,
      renderCell: (item) => formatDate(item.requestedDeliveryDate),
    },
    {
      id: 'promisedDeliveryDate',
      label: 'Promised Delivery Date',
      type: 'date',
      width: 178,
      getValue: (item) => item.promisedDeliveryDate,
      renderCell: (item) => formatDate(item.promisedDeliveryDate),
    },
    {
      id: 'validTillDate',
      label: 'Valid Till Date',
      type: 'date',
      width: 160,
      getValue: (item) => item.validTillDate,
      renderCell: (item) => formatDate(item.validTillDate),
    },
    {
      id: 'paymentMode',
      label: 'Payment Mode',
      type: 'text',
      width: 146,
      getValue: (item) => item.paymentMode,
      renderCell: (item) => item.paymentMode || '-',
    },
    {
      id: 'paymentMethod',
      label: 'Payment Method',
      type: 'text',
      width: 158,
      getValue: (item) => item.paymentMethod,
      renderCell: (item) => item.paymentMethod || '-',
    },
    {
      id: 'totalQuantity',
      label: 'Total Quantity',
      type: 'number',
      width: 132,
      getValue: (item) => String(getTotalQuantity(item)),
      renderCell: (item) => getTotalQuantity(item).toString(),
    },
    {
      id: 'totalTaxAmount',
      label: 'Total Tax Amount',
      type: 'number',
      width: 156,
      getValue: (item) => String(getTotalTaxAmount(item)),
      renderCell: (item) => formatCurrency(getTotalTaxAmount(item)),
    },
    {
      id: 'totalAmount',
      label: 'Total Amount',
      type: 'number',
      width: 154,
      getValue: (item) => item.totalAmount,
      renderCell: (item) => formatCurrency(parseAmount(item.totalAmount)),
    },
    {
      id: 'netAmount',
      label: 'Net Amount',
      type: 'number',
      width: 154,
      getValue: (item) => String(getNetAmount(item)),
      renderCell: (item) => formatCurrency(getNetAmount(item)),
    },
    {
      id: 'allocationStatus',
      label: 'Allocation Status',
      type: 'text',
      width: 150,
      getValue: (item) => getAllocationStatus(item),
      renderCell: (item) => getAllocationStatus(item),
    },
    {
      id: 'invoiceStatus',
      label: 'Invoice Status',
      type: 'text',
      width: 138,
      getValue: (item) => getInvoiceStatus(item),
      renderCell: (item) => getInvoiceStatus(item),
    },
    {
      id: 'deliveryStatus',
      label: 'Delivery Status',
      type: 'text',
      width: 142,
      getValue: (item) => getDeliveryStatus(item),
      renderCell: (item) => getDeliveryStatus(item),
    },
    {
      id: 'returnStatus',
      label: 'Return Status',
      type: 'text',
      width: 132,
      getValue: (item) => getReturnStatus(item),
      renderCell: (item) => getReturnStatus(item),
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
  ], [handlePreviewDocument, renderActionMenu]);

  return (
    <AppShell activeLeaf="sale-order" onSaleOrderClick={onNavigateToSaleOrderList}>
      <div className="catalogue-toolbar">
        <div className="catalogue-toolbar__inner catalogue-toolbar__inner--stacked">
          <div className="catalogue-toolbar__top">
            <div className="catalogue-toolbar__heading">
              <div>
                <CatalogueViewSelector
                  items={catalogueViewItems}
                  activeViewId={activeView.id}
                  activeCount={sortedRows.length}
                  onSelect={handleSelectCatalogueView}
                  onTogglePin={handleTogglePinnedView}
                  onOpenConfigurator={() => setIsViewConfiguratorOpen(true)}
                />
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
                  <button
                    type="button"
                    onClick={() => setCatalogueViewMode('split')}
                    className={cn('catalogue-view-toggle__button', catalogueViewMode === 'split' && 'catalogue-view-toggle__button--active')}
                    aria-pressed={catalogueViewMode === 'split'}
                  >
                    <Columns3 size={16} />
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
          <CommonDataGrid
            gridId="sale-order-catalogue"
            ariaLabel="Sale orders table"
            rows={sortedRows}
            columns={gridColumns}
            rowId={(item) => item.id}
            sortState={sortState}
            onSortChange={handleSortChange}
            chartTitle="Sale Order"
          />
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

        {loadState === 'ready' && sortedRows.length > 0 && catalogueViewMode === 'split' && (
          <CatalogueSplitView
            rows={sortedRows}
            onView={handlePreviewDocument}
            onEdit={onEdit}
            onCancel={handleOpenCancelDialog}
          />
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

      <CatalogueViewConfigurator
        key={`${isViewConfiguratorOpen}-${activeView.id}-${effectiveViewState.pinnedViewId ?? 'none'}-${availableViews.length}`}
        isOpen={isViewConfiguratorOpen}
        title="Sale Order Views"
        views={availableViews}
        activeViewId={activeView.id}
        pinnedViewId={effectiveViewState.pinnedViewId}
        viewCounts={viewCounts}
        currentUserName={currentUserName}
        requesterOptions={salesExecutiveOptions.map((salesExecutive) => ({
          value: salesExecutive,
          label: salesExecutive,
        }))}
        supplierOptions={customerOptions.map((customer) => ({
          value: customer,
          label: customer,
        }))}
        branchOptions={orderSourceOptions.map((orderSource) => ({
          value: orderSource,
          label: orderSource,
        }))}
        statusOptions={saleOrderStatusOptions}
        priorityOptions={saleOrderPriorityOptions}
        sortOptions={saleOrderSortOptions}
        labels={{
          ownerScope: 'Sales executive scope',
          ownerAll: 'All sales executives',
          ownerMine: 'My sale orders',
          ownerSpecific: 'Specific sales executive',
          ownerField: 'Sales Executive',
          ownerTag: 'Sales Executive',
          primaryEntityField: 'Customer',
          primaryEntityAll: 'All customers',
          primaryEntityTag: 'Customer',
          secondaryEntityField: 'Order Source',
          secondaryEntityAll: 'All order sources',
          secondaryEntityTag: 'Order Source',
        }}
        onClose={() => setIsViewConfiguratorOpen(false)}
        onSave={handleSaveView}
        onDelete={handleDeleteView}
        onPin={(viewId) => setViewState(setPinnedCatalogueViewId(SALE_ORDER_CATALOGUE_VIEW_ENTITY, viewId))}
      />

      <DocumentPreviewDrawer
        document={previewDocument}
        isOpen={Boolean(previewDocument)}
        documentTypeLabel="Sale Order"
        subtitle="Sale Order preview"
        printEntityType="sale-order"
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
