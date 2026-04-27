import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Eye, Plus, Trash2, Upload, FileText, ArrowLeft, MoreVertical, PencilLine, ChevronDown, GripVertical, RotateCcw, Save } from 'lucide-react';
import AppShell from '../components/AppShell';
import CompactFormDialog from '../components/common/CompactFormDialog';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import FormLayoutPreviewOverlay from '../components/common/FormLayoutPreviewOverlay';
import GridColumnConfigurator from '../components/common/GridColumnConfigurator';
import GuidedTour, { type GuidedTourStep } from '../components/common/GuidedTour';
import SuccessSummaryDialog from '../components/common/SuccessSummaryDialog';
import { FormField, Input, Select, Textarea } from '../components/common/FormControls';
import { handleGridLastCellTab } from '../components/common/gridKeyboard';
import StatusBadge from '../components/common/StatusBadge';
import { PURCHASE_REQUISITION_LAYOUT, purchaseRequisitionFieldLabels } from '../formLayoutRegistry';
import type { PurchaseRequisitionDocument } from './purchaseRequisitionCatalogueData';
import { cn } from '../utils/classNames';
import { formatDate, formatDateTime } from '../utils/dateFormat'
import {
  loadDraftFormLayoutConfig,
  loadPublishedFormLayoutConfig,
  mergeSections,
  moveArrayItem,
  moveField,
  moveSection,
  publishFormLayoutConfig,
  renameSection,
  renameTab,
  resetFormLayoutConfig,
  saveDraftFormLayoutConfig,
  type FormLayoutConfig,
  type FormLayoutGridColumn,
  getVisibleGridColumns,
  updateSectionFieldsPerRow,
} from '../utils/formLayoutConfig';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface LineItem {
  id: string;
  productCode: string;
  productName: string;
  description: string;
  uom: string;
  priority: '' | 'Low' | 'Medium' | 'High' | 'Critical';
  requirementDate: string;
  requestedQty: string;
  orderedQty: string;
  cancelledQty: string;
  cancellationReason: string;
  remarks: string;
}

interface RequisitionData {
  number: string;
  documentDate: string;
  title: string;
  requestor: string;
  department: string;
  costCenter: string;
  legalEntity: string;
  deliveryLocation: string;
  currency: string;
  neededByDate: string;
  validTillDate: string;
  priority: '' | 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected' | 'Cancelled';
  supplier?: string;
  supplierContact?: string;
  referenceNumber: string;
  remarks: string;
  createdBy: string;
  createdOn: string;
  contractReference: string;
  budgetCode: string;
  glAccount: string;
  spendCategory: string;
  internalNotes: string;
  externalNotes: string;
}

interface LineValidationErrors {
  productCode?: string;
  uom?: string;
  requestedQty?: string;
  cancelledQty?: string;
  cancellationReason?: string;
  remarks?: string;
}

interface ProductOption {
  code: string;
  name: string;
  description: string;
  uoms: string[];
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockLineItems: LineItem[] = [
  {
    id: 'line-1',
    productCode: 'P-1001',
    productName: 'Industrial Bearing Assembly',
    description: 'Precision grade bearing assembly for conveyor equipment',
    uom: 'Unit',
    priority: 'High',
    requirementDate: '2025-03-15',
    requestedQty: '150.00',
    orderedQty: '0.00',
    cancelledQty: '0.00',
    cancellationReason: '',
    remarks: 'Premium quality, OEM certified',
  },
  {
    id: 'line-2',
    productCode: 'P-1002',
    productName: 'Stainless Steel Fasteners Kit',
    description: 'Fasteners kit covering M10 to M20 sizes',
    uom: 'Box',
    priority: 'Medium',
    requirementDate: '2025-03-10',
    requestedQty: '5000.00',
    orderedQty: '0.00',
    cancelledQty: '250.00',
    cancellationReason: 'Demand Reduced',
    remarks: 'ISO 16130:2 certified',
  },
];

const productOptions: ProductOption[] = [
  {
    code: 'P-1001',
    name: 'Industrial Bearing Assembly',
    description: 'Precision grade bearing assembly for conveyor equipment',
    uoms: ['Unit', 'Set'],
  },
  {
    code: 'P-1002',
    name: 'Stainless Steel Fasteners Kit',
    description: 'Fasteners kit covering M10 to M20 sizes',
    uoms: ['Box', 'Unit'],
  },
  {
    code: 'P-1003',
    name: 'Hydraulic Seal Pack',
    description: 'High-pressure seal pack for maintenance shutdowns',
    uoms: ['Pack', 'Unit'],
  },
];

const linePriorityOptions = [
  { value: '', label: 'Select priority' },
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' },
];

const cancellationReasonOptions = [
  { value: '', label: 'Select reason' },
  { value: 'Scope Change', label: 'Scope Change' },
  { value: 'Demand Reduced', label: 'Demand Reduced' },
  { value: 'Supplier Constraint', label: 'Supplier Constraint' },
  { value: 'Requirement Withdrawn', label: 'Requirement Withdrawn' },
];

const prFieldLabels: Record<string, string> = {
  documentNumber: 'Document Number',
  documentDate: 'Document Date',
  requester: 'Requester',
  status: 'Status',
  createdBy: 'Created By',
  createdOn: 'Created On',
  department: 'Department',
  supplier: 'Supplier',
  priority: 'Priority',
  requirementDate: 'Requirement Date',
  validTillDate: 'Valid Till Date',
  referenceNumber: 'Reference Number',
  remarks: 'Remarks',
  productGrid: 'Product Details Grid',
  attachments: 'Attachments And Notes',
};

const widePrFieldIds = new Set(['remarks', 'productGrid', 'attachments']);

type LayoutDragPayload = {
  type: 'field' | 'section' | 'tab';
  id: string;
};

type LayoutDialogState =
  | { mode: 'create-tab'; initialValue: string }
  | { mode: 'create-section'; tabId: string; initialValue: string }
  | { mode: 'rename-tab'; tabId: string; initialValue: string }
  | { mode: 'rename-section'; sectionId: string; initialValue: string }
  | null;

const purchaseRequisitionCreateTourSteps: GuidedTourStep[] = [
  {
    id: 'supplier',
    target: '[data-tour="pr-supplier-field"]',
    title: 'Choose the supplier',
    body: 'Use the supplier field when the requester already knows the preferred supplier for this requisition.',
  },
  {
    id: 'priority',
    target: '[data-tour="pr-priority-field"]',
    title: 'Set priority and dates',
    body: 'Priority and requirement dates help procurement teams understand urgency and plan fulfilment.',
  },
  {
    id: 'product-grid',
    target: '[data-tour="pr-product-grid"]',
    title: 'Add product details',
    body: 'The product grid captures requested items. Product code starts the line and related details populate automatically.',
  },
  {
    id: 'product-code',
    target: '[data-tour="pr-product-code"]',
    title: 'Select a product',
    body: 'Start each line with a product code. The grid keeps keyboard-friendly entry for fast line creation.',
  },
  {
    id: 'requested-qty',
    target: '[data-tour="pr-requested-qty"]',
    title: 'Enter requested quantity',
    body: 'Enter the quantity needed. Read-only columns show ordered, cancelled, and pending quantities.',
  },
  {
    id: 'save',
    target: '[data-tour="pr-save-button"]',
    title: 'Save the requisition',
    body: 'When required line details are complete, Save creates the requisition and shows a confirmation summary.',
  },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function parseDecimal(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDecimal(value: number): string {
  return value.toFixed(2);
}

function formatCount(value: number): string {
  return Number.isInteger(value)
    ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)
    : new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function isValidDecimalInput(value: string): boolean {
  return /^(\d+(\.\d{0,2})?|\.\d{0,2})?$/.test(value);
}

function getProductOption(code: string): ProductOption | undefined {
  return productOptions.find((product) => product.code === code);
}

function getPendingQty(line: LineItem): number {
  return parseDecimal(line.requestedQty) - parseDecimal(line.orderedQty) - parseDecimal(line.cancelledQty);
}

function getLineStatus(line: LineItem): 'Open' | 'Partially Cancelled' | 'Partially Ordered' | 'Fully Ordered' | 'Cancelled' {
  const requestedQty = parseDecimal(line.requestedQty);
  const orderedQty = parseDecimal(line.orderedQty);
  const cancelledQty = parseDecimal(line.cancelledQty);
  const pendingQty = Math.max(getPendingQty(line), 0);

  if (requestedQty <= 0) {
    return 'Open';
  }

  if (orderedQty === 0 && cancelledQty === 0 && pendingQty > 0) {
    return 'Open';
  }

  if (orderedQty === 0 && cancelledQty > 0 && pendingQty > 0) {
    return 'Partially Cancelled';
  }

  if (orderedQty === requestedQty && cancelledQty === 0 && pendingQty === 0) {
    return 'Fully Ordered';
  }

  if (orderedQty === 0 && cancelledQty === requestedQty && pendingQty === 0) {
    return 'Cancelled';
  }

  return 'Partially Ordered';
}

function createEmptyLine(index: number): LineItem {
  return {
    id: `line-${Date.now()}-${index}`,
    productCode: '',
    productName: '',
    description: '',
    uom: '',
    priority: '',
    requirementDate: '',
    requestedQty: '',
    orderedQty: '0.00',
    cancelledQty: '0.00',
    cancellationReason: '',
    remarks: '',
  };
}

// ============================================================================
// PAGE HEADER
// ============================================================================

function getHeaderStatusLabel(status: RequisitionData['status']): string {
  switch (status) {
    case 'PendingApproval':
      return 'Pending Approval';
    case 'Approved':
      return 'Approved';
    case 'Cancelled':
      return 'Cancelled';
    case 'Rejected':
      return 'Rejected';
    default:
      return 'Open';
  }
}

const PageHeader: React.FC<{
  documentNumber: string;
  documentDate: string;
  title: string;
  status: string;
  onBack?: () => void;
  onCancel: () => void;
  onSave: () => void;
  hideDocumentMeta?: boolean;
  hideStatus?: boolean;
  actions?: React.ReactNode;
}> = ({ documentNumber, documentDate, title, status, onBack, onCancel, onSave, hideDocumentMeta = false, hideStatus = false, actions }) => {
  return (
    <div className="create-pr-header">
      <div className="create-pr-header__top">
        <div className="create-pr-header__title-group">
          {onBack && (
            <a
              href="#/purchase-requisition"
              onClick={(event) => {
                event.preventDefault();
                onBack();
              }}
              className="page-back-button create-pr-header__back"
              aria-label="Back to purchase requisition list"
            >
              <ArrowLeft size={18} />
            </a>
          )}
          <div className="create-pr-header__title-wrap">
            <div className="create-pr-header__title-row">
              <h2 className="brand-page-title create-pr-header__title">{title}</h2>
              {!hideStatus && <span className="create-pr-header__status">{status}</span>}
            </div>
          </div>
        </div>

        {!hideDocumentMeta && (
          <div className="create-pr-header__meta">
            <div className="create-pr-header__meta-item">
              <span className="create-pr-header__meta-label">Doc no:</span>
              <span className="create-pr-header__meta-value">{documentNumber}</span>
            </div>
            <div className="create-pr-header__meta-item">
              <span className="create-pr-header__meta-label">Doc date:</span>
              <span className="create-pr-header__meta-value">{documentDate}</span>
            </div>
            <button type="button" className="create-pr-header__icon-button" aria-label="Document details">
              <PencilLine size={16} />
            </button>
            <button type="button" className="create-pr-header__icon-button" aria-label="More options">
              <MoreVertical size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="create-pr-header__actions">
        {actions ?? (
          <>
            <button type="button" onClick={onCancel} className="btn btn--outline">
              Discard
            </button>
            <button type="button" onClick={onSave} className="btn btn--primary" data-tour="pr-save-button">
              Save
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// LINE ITEMS TABLE
// ============================================================================

const LineItemsSection: React.FC<{
  items: LineItem[];
  lineErrors: Record<string, LineValidationErrors>;
  onAddLine: () => void;
  onDeleteLine: (lineId: string) => void;
  onFieldChange: (lineId: string, fieldName: keyof Pick<LineItem, 'productCode' | 'uom' | 'priority' | 'requirementDate' | 'requestedQty' | 'cancellationReason' | 'remarks'>, value: string) => void;
  onNumericBlur: (lineId: string, fieldName: 'requestedQty') => void;
  onLineBlur: (lineId: string) => void;
  onRemarksKeyDown: (event: React.KeyboardEvent<HTMLElement>, lineId: string) => void;
  setFieldRef: (
    lineId: string,
    fieldName: 'productCode' | 'uom' | 'priority' | 'requirementDate' | 'requestedQty' | 'cancellationReason' | 'remarks'
  ) => (element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null) => void;
  gridColumns: FormLayoutGridColumn[];
}> = ({
  items,
  lineErrors,
  onAddLine,
  onDeleteLine,
  onFieldChange,
  onNumericBlur,
  onLineBlur,
  onRemarksKeyDown,
  setFieldRef,
  gridColumns,
}) => {
  const totalRequestedQty = items.reduce((sum, item) => sum + parseDecimal(item.requestedQty), 0);
  const totalOrderedQty = items.reduce((sum, item) => sum + parseDecimal(item.orderedQty), 0);
  const totalCancelledQty = items.reduce((sum, item) => sum + parseDecimal(item.cancelledQty), 0);
  const totalPendingQty = items.reduce((sum, item) => sum + Math.max(getPendingQty(item), 0), 0);
  const renderLineCell = (
    columnKey: string,
    item: LineItem,
    index: number,
    errors: LineValidationErrors,
    product: ProductOption | undefined,
    pendingQty: number,
    status: ReturnType<typeof getLineStatus>,
    cancellationRequired: boolean
  ) => {
    switch (columnKey) {
      case 'action':
        return (
          <td className="create-pr-grid__body-cell create-pr-grid__body-cell--action">
            <button
              type="button"
              onClick={() => onDeleteLine(item.id)}
              className="create-pr-grid__delete"
              aria-label={`Delete line ${index + 1}`}
            >
              <Trash2 size={14} />
            </button>
          </td>
        );
      case 'productCode':
        return (
          <td className="create-pr-grid__body-cell">
            <Select
              ref={setFieldRef(item.id, 'productCode')}
              data-tour={index === 0 ? 'pr-product-code' : undefined}
              value={item.productCode}
              error={errors.productCode}
              onChange={(event) => onFieldChange(item.id, 'productCode', event.target.value)}
              onBlur={() => onLineBlur(item.id)}
              options={[
                { value: '', label: 'Select product' },
                ...productOptions.map((option) => ({
                  value: option.code,
                  label: `${option.code} - ${option.name}`,
                })),
              ]}
              className="create-pr-grid__control create-pr-grid__control--select min-w-36"
            />
            {errors.productCode && <p className="create-pr-grid__error">{errors.productCode}</p>}
          </td>
        );
      case 'productName':
        return (
          <td className="create-pr-grid__body-cell">
            <Input value={item.productName} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly min-w-36" />
          </td>
        );
      case 'description':
        return (
          <td className="create-pr-grid__body-cell">
            <Input value={item.description} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly min-w-44" />
          </td>
        );
      case 'uom':
        return (
          <td className="create-pr-grid__body-cell">
            <Select
              ref={setFieldRef(item.id, 'uom')}
              value={item.uom}
              error={errors.uom}
              onChange={(event) => onFieldChange(item.id, 'uom', event.target.value)}
              onBlur={() => onLineBlur(item.id)}
              options={[
                { value: '', label: 'Select UOM' },
                ...((product?.uoms ?? []).map((uom) => ({ value: uom, label: uom }))),
              ]}
              className="create-pr-grid__control create-pr-grid__control--select min-w-24"
            />
            {errors.uom && <p className="create-pr-grid__error">{errors.uom}</p>}
          </td>
        );
      case 'priority':
        return (
          <td className="create-pr-grid__body-cell">
            <Select
              ref={setFieldRef(item.id, 'priority')}
              value={item.priority}
              onChange={(event) => onFieldChange(item.id, 'priority', event.target.value)}
              options={linePriorityOptions}
              className="create-pr-grid__control create-pr-grid__control--select min-w-28"
            />
          </td>
        );
      case 'requirementDate':
        return (
          <td className="create-pr-grid__body-cell">
            <Input
              ref={setFieldRef(item.id, 'requirementDate')}
              type="date"
              value={item.requirementDate}
              onChange={(event) => onFieldChange(item.id, 'requirementDate', event.target.value)}
              className="create-pr-grid__control create-pr-grid__control--date min-w-36"
            />
          </td>
        );
      case 'requestedQty':
        return (
          <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number">
            <Input
              ref={setFieldRef(item.id, 'requestedQty')}
              data-tour={index === 0 ? 'pr-requested-qty' : undefined}
              value={item.requestedQty}
              error={errors.requestedQty}
              onChange={(event) => onFieldChange(item.id, 'requestedQty', event.target.value)}
              onBlur={() => onNumericBlur(item.id, 'requestedQty')}
              inputMode="decimal"
              placeholder="0.00"
              className="create-pr-grid__control create-pr-grid__control--input create-pr-grid__control--number min-w-24"
            />
            {errors.requestedQty && <p className="create-pr-grid__error">{errors.requestedQty}</p>}
          </td>
        );
      case 'orderedQty':
        return (
          <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number">
            <Input value={formatDecimal(parseDecimal(item.orderedQty))} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number min-w-24" />
          </td>
        );
      case 'cancelledQty':
        return (
          <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number">
            <Input value={formatDecimal(parseDecimal(item.cancelledQty))} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number min-w-24" />
          </td>
        );
      case 'pendingQty':
        return (
          <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number">
            <Input value={formatDecimal(pendingQty)} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number min-w-24" />
          </td>
        );
      case 'status':
        return (
          <td className="create-pr-grid__body-cell">
            <StatusBadge kind="line-status" value={status} />
          </td>
        );
      case 'cancellationReason':
        return (
          <td className="create-pr-grid__body-cell">
            <Select
              ref={setFieldRef(item.id, 'cancellationReason')}
              value={item.cancellationReason}
              error={errors.cancellationReason}
              onChange={(event) => onFieldChange(item.id, 'cancellationReason', event.target.value)}
              onBlur={() => onLineBlur(item.id)}
              options={cancellationReasonOptions}
              disabled={!cancellationRequired}
              className={cn('create-pr-grid__control create-pr-grid__control--select min-w-36', !cancellationRequired && 'create-pr-grid__control--readonly')}
            />
            {errors.cancellationReason && <p className="create-pr-grid__error">{errors.cancellationReason}</p>}
          </td>
        );
      case 'remarks':
        return (
          <td className="create-pr-grid__body-cell">
            <div className="create-pr-grid__remarks">
              <Input
                ref={setFieldRef(item.id, 'remarks')}
                value={item.remarks}
                error={errors.remarks}
                onChange={(event) => onFieldChange(item.id, 'remarks', event.target.value)}
                onBlur={() => onLineBlur(item.id)}
                onKeyDown={(event) => onRemarksKeyDown(event, item.id)}
                maxLength={500}
                className="create-pr-grid__control create-pr-grid__control--input min-w-40"
                placeholder="Add remarks..."
              />
              <div className="create-pr-grid__remarks-meta">
                <span className="create-pr-grid__error">{errors.remarks ?? ''}</span>
                <span className="create-pr-grid__counter">{item.remarks.length}/500</span>
              </div>
            </div>
          </td>
        );
      default:
        return null;
    }
  };

  const renderFooterCell = (columnKey: string, index: number) => {
    const isNumberColumn = ['requestedQty', 'orderedQty', 'cancelledQty', 'pendingQty'].includes(columnKey);
    const valueByColumn: Record<string, string> = {
      requestedQty: formatDecimal(totalRequestedQty),
      orderedQty: formatDecimal(totalOrderedQty),
      cancelledQty: formatDecimal(totalCancelledQty),
      pendingQty: formatDecimal(totalPendingQty),
    };

    return (
      <td
        key={columnKey}
        className={cn('create-pr-grid__footer-cell', isNumberColumn && 'create-pr-grid__footer-cell--number')}
      >
        {index === 0 ? 'Total' : valueByColumn[columnKey] ?? ''}
      </td>
    );
  };

  return (
    <div className="create-pr-grid">
      <div className="create-pr-grid__header">
        <div className="create-pr-grid__title-wrap">
          <div className="create-pr-grid__title-row">
            <ChevronDown size={16} className="create-pr-grid__title-icon" />
            <h4 className="create-pr-grid__title">Product details</h4>
            <span className="create-pr-grid__count">{items.length}</span>
          </div>
          <p className="create-pr-grid__subtitle">
            Finish a row and press Tab from remarks to add the next line quickly.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddLine}
          className="btn btn--outline btn--icon-left create-pr-grid__add-button"
        >
          <Plus size={14} />
          Add line
        </button>
      </div>

      <div className="create-pr-grid__table-wrap">
        <table className="create-pr-grid__table">
          <thead>
            <tr>
              {gridColumns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'create-pr-grid__cell',
                    column.key === 'action' && 'create-pr-grid__cell--action',
                    ['requestedQty', 'orderedQty', 'cancelledQty', 'pendingQty'].includes(column.key) &&
                      'create-pr-grid__cell--number'
                  )}
                >
                  {column.key === 'action' ? '' : column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const errors = lineErrors[item.id] ?? {};
              const product = getProductOption(item.productCode);
              const pendingQty = Math.max(getPendingQty(item), 0);
              const status = getLineStatus(item);
              const cancellationRequired = parseDecimal(item.cancelledQty) > 0;

              return (
                <tr key={item.id}>
                  {gridColumns.map((column) => (
                    <React.Fragment key={column.key}>
                      {renderLineCell(column.key, item, index, errors, product, pendingQty, status, cancellationRequired)}
                    </React.Fragment>
                  ))}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              {gridColumns.map((column, index) => renderFooterCell(column.key, index))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

// ============================================================================
// ATTACHMENTS SECTION
// ============================================================================

const AttachmentsSection: React.FC = () => {
  const [files] = useState<Array<{ name: string; size: string }>>([{ name: 'Product_Specifications.pdf', size: '2.4 MB' }]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Attachments and Notes</h2>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-slate-300 rounded p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
        <Upload size={32} className="mx-auto text-slate-400 mb-2" />
        <p className="text-sm font-medium text-slate-900">Drop files here or click to upload</p>
        <p className="text-xs text-slate-500">PDF, DOC, XLS up to 10 MB</p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900">Uploaded Files</p>
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-500">{file.size}</p>
                </div>
              </div>
              <button className="text-slate-400 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Internal Notes" help="Only visible to internal users">
          <Textarea className="h-24 resize-none" placeholder="Add internal notes..." />
        </FormField>
        <FormField label="External Notes" help="Visible to suppliers and external parties">
          <Textarea className="h-24 resize-none" placeholder="Add notes for supplier..." />
        </FormField>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

interface CreatePurchaseRequisitionProps {
  onBack?: () => void;
  onNavigateToList?: () => void;
  onNavigateToPurchaseOrderList?: () => void;
  editingDocument?: PurchaseRequisitionDocument | null;
  tourMode?: 'pr-create';
  configurationMode?: boolean;
}

function getInitialRequisition(editingDocument?: PurchaseRequisitionDocument | null): RequisitionData {
  if (editingDocument) {
    return {
      number: editingDocument.number,
      documentDate: editingDocument.documentDateTime.slice(0, 10),
      title: editingDocument.title,
      requestor: editingDocument.requesterName,
      department: editingDocument.department,
      costCenter: editingDocument.costCenter,
      legalEntity: editingDocument.legalEntity,
      deliveryLocation: editingDocument.branch,
      currency: editingDocument.currency,
      neededByDate: editingDocument.requirementDate,
      validTillDate: editingDocument.validTillDate,
      priority: editingDocument.priority,
      status:
        editingDocument.status === 'Pending Approval'
          ? 'PendingApproval'
          : editingDocument.status === 'Approved'
            ? 'Approved'
            : editingDocument.status === 'Rejected'
              ? 'Rejected'
              : editingDocument.status === 'Cancelled'
                ? 'Cancelled'
              : 'Draft',
      supplier: editingDocument.supplierName,
      supplierContact: editingDocument.supplierContact,
      referenceNumber: editingDocument.contractReference,
      remarks: editingDocument.notes,
      createdBy: editingDocument.requesterName,
      createdOn: editingDocument.documentDateTime,
      contractReference: editingDocument.contractReference,
      budgetCode: editingDocument.budgetCode,
      glAccount: '5210-Manufacturing Supplies',
      spendCategory: editingDocument.spendCategory,
      internalNotes: editingDocument.notes,
      externalNotes: '',
    };
  }

  return {
    number: 'PR-2025-00847',
    documentDate: new Date().toISOString().slice(0, 10),
    title: 'Industrial Components & Hardware - Q1 2025',
    requestor: 'Alex Kumar',
    department: 'Manufacturing',
    costCenter: 'CC-2025-001',
    legalEntity: 'Global Operations Inc.',
    deliveryLocation: 'Warehouse B, Plant 1',
    currency: 'USD',
    neededByDate: '2025-03-15',
    validTillDate: '2025-03-31',
    priority: 'High',
    status: 'Draft',
    supplier: 'Techsupply Corp',
    supplierContact: 'john.smith@techsupply.com',
    referenceNumber: '',
    remarks: '',
    createdBy: 'Alex Kumar',
    createdOn: new Date().toISOString(),
    contractReference: 'CONTR-2024-001',
    budgetCode: 'BUDGET-MFG-Q1',
    glAccount: '5210-Manufacturing Supplies',
    spendCategory: 'Direct Materials',
    internalNotes: '',
    externalNotes: '',
  };
}

const CreatePurchaseRequisition: React.FC<CreatePurchaseRequisitionProps> = ({
  onBack,
  onNavigateToList,
  onNavigateToPurchaseOrderList,
  editingDocument,
  tourMode,
  configurationMode = false,
}) => {
  type TabKey = string;

  const [requisition, setRequisition] = useState<RequisitionData>(() => getInitialRequisition(editingDocument));

  const [lineItems, setLineItems] = useState<LineItem[]>(mockLineItems);
  const [lineErrors, setLineErrors] = useState<Record<string, LineValidationErrors>>({});
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [layoutConfig, setLayoutConfig] = useState<FormLayoutConfig>(() =>
    configurationMode
      ? loadDraftFormLayoutConfig(PURCHASE_REQUISITION_LAYOUT)
      : loadPublishedFormLayoutConfig(PURCHASE_REQUISITION_LAYOUT)
  );
  const [isLayoutEditing, setIsLayoutEditing] = useState(configurationMode);
  const [dragPayload, setDragPayload] = useState<LayoutDragPayload | null>(null);
  const [layoutDialog, setLayoutDialog] = useState<LayoutDialogState>(null);
  const [formMessage, setFormMessage] = useState('');
  const [previewPayload, setPreviewPayload] = useState('');
  const [isProductHeaderCollapsed, setIsProductHeaderCollapsed] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isSaveSuccessDialogOpen, setIsSaveSuccessDialogOpen] = useState(false);
  const [isCreateTourActive, setIsCreateTourActive] = useState(tourMode === 'pr-create');
  const [createTourStepIndex, setCreateTourStepIndex] = useState(0);
  const [isLayoutPreviewOpen, setIsLayoutPreviewOpen] = useState(false);
  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  const lastProductScrollTopRef = useRef(0);
  const focusLineIdRef = useRef<string | null>(null);
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null>>({});

  const handleTabChange = (nextTab: TabKey) => {
    setActiveTab(nextTab);
    setIsProductHeaderCollapsed(false);
    lastProductScrollTopRef.current = contentScrollRef.current?.scrollTop ?? 0;
  };

  const handleCreateTourNext = () => {
    const currentStep = purchaseRequisitionCreateTourSteps[createTourStepIndex];

    if (currentStep?.id === 'priority') {
      handleTabChange('product');
    }

    if (createTourStepIndex >= purchaseRequisitionCreateTourSteps.length - 1) {
      setIsCreateTourActive(false);
      return;
    }

    setCreateTourStepIndex((current) => current + 1);
  };

  const handleCreateTourBack = () => {
    const currentStep = purchaseRequisitionCreateTourSteps[createTourStepIndex];

    if (currentStep?.id === 'product-grid') {
      handleTabChange('general');
    }

    setCreateTourStepIndex((current) => Math.max(current - 1, 0));
  };

  useEffect(() => {
    if (!configurationMode) {
      return;
    }

    saveDraftFormLayoutConfig(layoutConfig);
  }, [configurationMode, layoutConfig]);

  useEffect(() => {
    if (!focusLineIdRef.current) {
      return;
    }

    const field = fieldRefs.current[`${focusLineIdRef.current}:productCode`];
    if (field) {
      field.focus();
      focusLineIdRef.current = null;
    }
  }, [lineItems]);

  useEffect(() => {
    lastProductScrollTopRef.current = contentScrollRef.current?.scrollTop ?? 0;
  }, [activeTab]);

  const totalRequestedQty = useMemo(
    () => lineItems.reduce((sum, line) => sum + parseDecimal(line.requestedQty), 0),
    [lineItems]
  );

  const totalCancelledQty = useMemo(
    () => lineItems.reduce((sum, line) => sum + parseDecimal(line.cancelledQty), 0),
    [lineItems]
  );

  const totalPendingQty = useMemo(
    () => lineItems.reduce((sum, line) => sum + Math.max(getPendingQty(line), 0), 0),
    [lineItems]
  );
  const createdOnLabel = useMemo(() => {
    const { dateLabel, timeLabel } = formatDateTime(requisition.createdOn);
    return `${dateLabel}, ${timeLabel}`;
  }, [requisition.createdOn]);
  const purchaseRequisitionPreviewValues = useMemo(
    () => ({
      department: requisition.department || '-',
      supplier: requisition.supplier || '-',
      priority: requisition.priority || '-',
      requirementDate: requisition.neededByDate ? formatDate(requisition.neededByDate) : '-',
      validTillDate: requisition.validTillDate ? formatDate(requisition.validTillDate) : '-',
      referenceNumber: requisition.referenceNumber || '-',
      remarks: requisition.remarks || '-',
      attachments: 'Product_Specifications.pdf',
    }),
    [
      requisition.department,
      requisition.neededByDate,
      requisition.priority,
      requisition.referenceNumber,
      requisition.remarks,
      requisition.supplier,
      requisition.validTillDate,
    ]
  );

  const handleContentScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const nextScrollTop = event.currentTarget.scrollTop;
    const delta = nextScrollTop - lastProductScrollTopRef.current;

    if (activeTab !== 'product') {
      lastProductScrollTopRef.current = nextScrollTop;
      return;
    }

    if (nextScrollTop <= 24) {
      setIsProductHeaderCollapsed(false);
      lastProductScrollTopRef.current = nextScrollTop;
      return;
    }

    if (Math.abs(delta) >= 8) {
      setIsProductHeaderCollapsed(delta < 0);
    }

    lastProductScrollTopRef.current = nextScrollTop;
  };

  const setFieldRef =
    (lineId: string, fieldName: 'productCode' | 'uom' | 'priority' | 'requirementDate' | 'requestedQty' | 'cancellationReason' | 'remarks') =>
    (element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null) => {
      fieldRefs.current[`${lineId}:${fieldName}`] = element;
    };

  const validateLine = (line: LineItem): LineValidationErrors => {
    const errors: LineValidationErrors = {};
    const requestedQty = parseDecimal(line.requestedQty);
    const orderedQty = parseDecimal(line.orderedQty);
    const cancelledQty = parseDecimal(line.cancelledQty);
    const pendingQty = getPendingQty(line);

    if (!line.productCode) {
      errors.productCode = 'Product code is required.';
    }

    if (!line.uom) {
      errors.uom = 'UOM is required.';
    }

    if (!line.requestedQty) {
      errors.requestedQty = 'Requested quantity is required.';
    } else if (!isValidDecimalInput(line.requestedQty)) {
      errors.requestedQty = 'Use up to 2 decimal places.';
    } else if (requestedQty <= 0) {
      errors.requestedQty = 'Requested quantity must be greater than 0.';
    }

    if (!line.cancelledQty) {
      errors.cancelledQty = 'Cancelled quantity is required.';
    } else if (!isValidDecimalInput(line.cancelledQty)) {
      errors.cancelledQty = 'Use up to 2 decimal places.';
    } else if (cancelledQty < 0) {
      errors.cancelledQty = 'Cancelled quantity cannot be negative.';
    } else if (cancelledQty > requestedQty - orderedQty) {
      errors.cancelledQty = 'Cancelled quantity cannot exceed the remaining quantity.';
    }

    if (pendingQty < 0) {
      errors.cancelledQty = 'Pending quantity cannot be negative.';
    }

    if (cancelledQty > 0 && !line.cancellationReason) {
      errors.cancellationReason = 'Cancellation reason is required.';
    }

    if (line.remarks.length > 500) {
      errors.remarks = 'Remarks cannot exceed 500 characters.';
    }

    return errors;
  };

  const validateAllLines = () => {
    const nextErrors = lineItems.reduce<Record<string, LineValidationErrors>>((accumulator, line) => {
      const errors = validateLine(line);
      if (Object.keys(errors).length > 0) {
        accumulator[line.id] = errors;
      }
      return accumulator;
    }, {});

    setLineErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateLine = (lineId: string, updater: (line: LineItem) => LineItem) => {
    setLineItems((currentLines) =>
      currentLines.map((line) => {
        if (line.id !== lineId) {
          return line;
        }
        return updater(line);
      })
    );
  };

  const handleLineFieldChange = (
    lineId: string,
    fieldName: 'productCode' | 'uom' | 'priority' | 'requirementDate' | 'requestedQty' | 'cancellationReason' | 'remarks',
    value: string
  ) => {
    if (fieldName === 'requestedQty' && !isValidDecimalInput(value)) {
      return;
    }

    updateLine(lineId, (line) => {
      if (fieldName === 'productCode') {
        const product = getProductOption(value);
        return {
          ...line,
          productCode: value,
          productName: product?.name ?? '',
          description: product?.description ?? '',
          uom: product?.uoms[0] ?? '',
          requestedQty: '',
          cancelledQty: '0.00',
          cancellationReason: '',
        };
      }

      if (fieldName === 'remarks') {
        return {
          ...line,
          remarks: value.slice(0, 500),
        };
      }

      return {
        ...line,
        [fieldName]: value,
      };
    });

    setLineErrors((currentErrors) => {
      if (!currentErrors[lineId]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[lineId];
      return nextErrors;
    });
  };

  const handleNumericBlur = (lineId: string, fieldName: 'requestedQty') => {
    const currentLine = lineItems.find((line) => line.id === lineId);
    if (!currentLine) {
      return;
    }

    const currentValue = currentLine[fieldName];
    const normalizedValue = currentValue === '' ? '' : formatDecimal(parseDecimal(currentValue));

    updateLine(lineId, (line) => ({ ...line, [fieldName]: normalizedValue }));
    setLineErrors((currentErrors) => ({
      ...currentErrors,
      [lineId]: validateLine({ ...currentLine, [fieldName]: normalizedValue }),
    }));
  };

  const handleLineBlur = (lineId: string) => {
    const currentLine = lineItems.find((line) => line.id === lineId);
    if (!currentLine) {
      return;
    }

    setLineErrors((currentErrors) => ({
      ...currentErrors,
      [lineId]: validateLine(currentLine),
    }));
  };

  const handleAddLine = () => {
    if (!validateAllLines()) {
      setFormMessage('Complete the current line details before adding another line.');
      handleTabChange('product');
      return;
    }

    const nextLine = createEmptyLine(lineItems.length + 1);
    focusLineIdRef.current = nextLine.id;
    setLineItems((currentLines) => [...currentLines, nextLine]);
    setFormMessage('');
  };

  const handleDeleteLine = (lineId: string) => {
    const lineNumber = lineItems.findIndex((line) => line.id === lineId) + 1;
    if (!window.confirm(`Delete line ${lineNumber}?`)) {
      return;
    }

    setLineItems((currentLines) => currentLines.filter((line) => line.id !== lineId));
    setLineErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[lineId];
      return nextErrors;
    });
    setFormMessage('');
  };

  const handleRemarksKeyDown = (event: React.KeyboardEvent<HTMLElement>, lineId: string) => {
    const currentLineIndex = lineItems.findIndex((line) => line.id === lineId);
    const currentLine = lineItems[currentLineIndex];
    if (!currentLine) {
      return;
    }

    handleGridLastCellTab({
      event,
      line: currentLine,
      lineIndex: currentLineIndex,
      lines: lineItems,
      isLineComplete: (line) => Object.keys(validateLine(line)).length === 0,
      onAddLine: handleAddLine,
      onIncompleteLine: (line) => {
        setLineErrors((currentErrors) => ({ ...currentErrors, [line.id]: validateLine(line) }));
        setFormMessage('Resolve the current row errors before adding another line.');
      },
    });
  };

  const buildRequisitionPayload = () => ({
    requisition: {
      ...requisition,
      documentNumber: requisition.number,
      documentDate: requisition.documentDate,
      requester: requisition.requestor,
      requirementDate: requisition.neededByDate || null,
      referenceNumber: requisition.referenceNumber || null,
      remarks: requisition.remarks || null,
      createdBy: requisition.createdBy,
      createdOn: requisition.createdOn,
      lineCount: lineItems.length,
    },
    lines: lineItems.map((line, index) => ({
      lineNumber: index + 1,
      productCode: line.productCode,
      productName: line.productName,
      description: line.description,
      uom: line.uom,
      priority: line.priority || null,
      requirementDate: line.requirementDate || null,
      requestedQty: parseDecimal(line.requestedQty),
      orderedQty: parseDecimal(line.orderedQty),
      cancelledQty: parseDecimal(line.cancelledQty),
      pendingQty: Math.max(getPendingQty(line), 0),
      status: getLineStatus(line),
      cancellationReason: line.cancellationReason || null,
      remarks: line.remarks,
    })),
  });

  const handleSave = () => {
    if (!validateAllLines()) {
      handleTabChange('product');
      setFormMessage('Save is blocked until all mandatory line fields are complete.');
      return;
    }

    setPreviewPayload(JSON.stringify(buildRequisitionPayload(), null, 2));
    setFormMessage(`Requisition payload is ready with ${lineItems.length} line(s).`);
    setIsSaveSuccessDialogOpen(true);
  };

  const handleDiscardRequest = () => {
    setIsDiscardDialogOpen(true);
  };

  const handleDiscardClose = () => {
    setIsDiscardDialogOpen(false);
  };

  const handleDiscardConfirm = () => {
    setIsDiscardDialogOpen(false);
    onNavigateToList?.();
    if (!onNavigateToList) {
      onBack?.();
    }
  };

  const handleSaveSuccessClose = () => {
    setIsSaveSuccessDialogOpen(false);
  };

  const handleSaveSuccessPrimaryAction = () => {
    setIsSaveSuccessDialogOpen(false);
    onNavigateToList?.();
    if (!onNavigateToList) {
      onBack?.();
    }
  };

  const handlePrintSummary = () => {
    window.print();
  };

  const handleShareSummary = async () => {
    const summaryText = [
      'Purchase requisition saved successfully',
      `Purchase requisition No: ${requisition.number}`,
      `Total line count: ${formatCount(lineItems.length)}`,
      `Valid till date: ${requisition.validTillDate ? formatDate(requisition.validTillDate) : '-'}`,
      `Priority: ${requisition.priority || '-'}`,
      `Total cancelled qty: ${formatCount(totalCancelledQty)}`,
      `Total pending qty: ${formatCount(totalPendingQty)}`,
      `Total requested qty: ${formatCount(totalRequestedQty)}`,
    ].join('\n');

    if (navigator.share) {
      await navigator.share({
        title: 'Purchase requisition summary',
        text: summaryText,
      });
      return;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(summaryText);
    }
  };

  const effectiveActiveTab = layoutConfig.tabs.some((tab) => tab.id === activeTab)
    ? activeTab
    : layoutConfig.tabs[0]?.id ?? 'general';

  const readDropPayload = (event: React.DragEvent<HTMLElement>): LayoutDragPayload | null => {
    const rawPayload = event.dataTransfer.getData('application/json');
    if (!rawPayload) {
      return dragPayload;
    }

    try {
      return JSON.parse(rawPayload) as LayoutDragPayload;
    } catch {
      return dragPayload;
    }
  };

  const startLayoutDrag = (event: React.DragEvent<HTMLElement>, payload: LayoutDragPayload) => {
    setDragPayload(payload);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/json', JSON.stringify(payload));
    event.dataTransfer.setData('text/plain', `${payload.type}:${payload.id}`);
  };

  const handleCreateTab = () => {
    setLayoutDialog({ mode: 'create-tab', initialValue: 'New tab' });
    setIsLayoutEditing(true);
  };

  const handleCreateSection = (tabId: string) => {
    setLayoutDialog({ mode: 'create-section', tabId, initialValue: 'New section' });
  };

  const handleRenameTab = (tabId: string, currentLabel: string) => {
    setLayoutDialog({ mode: 'rename-tab', tabId, initialValue: currentLabel });
  };

  const handleRenameSection = (sectionId: string, currentLabel: string) => {
    setLayoutDialog({ mode: 'rename-section', sectionId, initialValue: currentLabel });
  };

  const handleLayoutDialogSave = (value: string) => {
    if (!layoutDialog) {
      return;
    }

    if (layoutDialog.mode === 'create-tab') {
      const tabId = `custom-tab-${Date.now()}`;
      const sectionId = `custom-section-${Date.now()}`;
      setLayoutConfig((currentConfig) => ({
        ...currentConfig,
        tabs: [...currentConfig.tabs, { id: tabId, label: value, sectionIds: [sectionId] }],
        sections: {
          ...currentConfig.sections,
          [sectionId]: { id: sectionId, label: 'New section', fieldsPerRow: 3, fieldIds: [] },
        },
      }));
      setActiveTab(tabId);
    }

    if (layoutDialog.mode === 'create-section') {
      const sectionId = `custom-section-${Date.now()}`;
      setLayoutConfig((currentConfig) => ({
        ...currentConfig,
        tabs: currentConfig.tabs.map((tab) =>
          tab.id === layoutDialog.tabId ? { ...tab, sectionIds: [...tab.sectionIds, sectionId] } : tab
        ),
        sections: {
          ...currentConfig.sections,
          [sectionId]: { id: sectionId, label: value, fieldsPerRow: 3, fieldIds: [] },
        },
      }));
    }

    if (layoutDialog.mode === 'rename-tab') {
      setLayoutConfig((currentConfig) => renameTab(currentConfig, layoutDialog.tabId, value));
    }

    if (layoutDialog.mode === 'rename-section') {
      setLayoutConfig((currentConfig) => renameSection(currentConfig, layoutDialog.sectionId, value));
    }

    setLayoutDialog(null);
  };

  const handleDropOnField = (
    event: React.DragEvent<HTMLElement>,
    targetSectionId: string,
    targetIndex: number
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const payload = readDropPayload(event);
    if (!payload) {
      return;
    }

    if (payload.type === 'field') {
      setLayoutConfig((currentConfig) => moveField(currentConfig, payload.id, targetSectionId, targetIndex));
    }
    setDragPayload(null);
  };

  const handleDropOnSection = (
    event: React.DragEvent<HTMLElement>,
    targetTabId: string,
    targetSectionId: string,
    targetIndex: number
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const payload = readDropPayload(event);
    if (!payload) {
      return;
    }

    if (payload.type === 'section') {
      setLayoutConfig((currentConfig) => moveSection(currentConfig, payload.id, targetTabId, targetIndex));
      setDragPayload(null);
      return;
    }

    if (payload.type === 'field') {
      const targetSection = layoutConfig.sections[targetSectionId];
      setLayoutConfig((currentConfig) =>
        moveField(currentConfig, payload.id, targetSectionId, targetSection?.fieldIds.length ?? 0)
      );
      setDragPayload(null);
    }
  };

  const handleDropOnTab = (
    event: React.DragEvent<HTMLElement>,
    targetTabId: string,
    targetIndex: number
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const payload = readDropPayload(event);
    if (!payload) {
      return;
    }

    if (payload.type === 'tab') {
      setLayoutConfig((currentConfig) => {
        const sourceIndex = currentConfig.tabs.findIndex((tab) => tab.id === payload.id);
        if (sourceIndex < 0) {
          return currentConfig;
        }
        return {
          ...currentConfig,
          tabs: moveArrayItem(currentConfig.tabs, sourceIndex, targetIndex),
        };
      });
      setDragPayload(null);
      return;
    }

    if (payload.type === 'section') {
      setLayoutConfig((currentConfig) => {
        const targetTab = currentConfig.tabs.find((tab) => tab.id === targetTabId);
        return moveSection(currentConfig, payload.id, targetTabId, targetTab?.sectionIds.length ?? 0);
      });
      setActiveTab(targetTabId);
      setDragPayload(null);
      return;
    }

    if (payload.type === 'field') {
      setLayoutConfig((currentConfig) => {
        const targetTab = currentConfig.tabs.find((tab) => tab.id === targetTabId);
        const firstSectionId = targetTab?.sectionIds[0];
        if (firstSectionId) {
          return moveField(currentConfig, payload.id, firstSectionId, currentConfig.sections[firstSectionId]?.fieldIds.length ?? 0);
        }

        const sectionId = `custom-section-${Date.now()}`;
        const configWithSection: FormLayoutConfig = {
          ...currentConfig,
          tabs: currentConfig.tabs.map((tab) =>
            tab.id === targetTabId ? { ...tab, sectionIds: [sectionId] } : tab
          ),
          sections: {
            ...currentConfig.sections,
            [sectionId]: { id: sectionId, label: 'New section', fieldsPerRow: 3, fieldIds: [] },
          },
        };
        return moveField(configWithSection, payload.id, sectionId, 0);
      });
      setActiveTab(targetTabId);
      setDragPayload(null);
    }
  };

  const handleSaveDraftLayout = () => {
    saveDraftFormLayoutConfig(layoutConfig);
    setFormMessage('Draft layout saved. It will not affect the live form until published.');
  };

  const handlePublishLayout = () => {
    const fieldIds = Object.values(layoutConfig.sections).flatMap((section) => section.fieldIds);
    const duplicateFieldId = fieldIds.find((fieldId, index) => fieldIds.indexOf(fieldId) !== index);
    const hasMissingSection = layoutConfig.tabs.some((tab) =>
      tab.sectionIds.some((sectionId) => !layoutConfig.sections[sectionId])
    );

    if (duplicateFieldId || hasMissingSection) {
      setFormMessage('Layout cannot be published yet. Please resolve duplicated fields or missing sections.');
      return false;
    }

    publishFormLayoutConfig(layoutConfig);
    setFormMessage('Layout published. The live Purchase Requisition create form now uses this layout.');
    return true;
  };

  const renderFieldContent = (fieldId: string) => {
    switch (fieldId) {
      case 'documentNumber':
        return (
          <FormField label="Document Number" required>
            <Input value={requisition.number} readOnly disabled />
          </FormField>
        );
      case 'documentDate':
        return (
          <FormField label="Document Date" required>
            <Input value={formatDate(requisition.documentDate)} readOnly disabled />
          </FormField>
        );
      case 'requester':
        return (
          <FormField label="Requester" required>
            <Input value={requisition.requestor} readOnly disabled />
          </FormField>
        );
      case 'status':
        return (
          <FormField label="Status" required>
            <Input value={getHeaderStatusLabel(requisition.status)} readOnly disabled />
          </FormField>
        );
      case 'createdBy':
        return (
          <FormField label="Created By" required>
            <Input value={requisition.createdBy} readOnly disabled />
          </FormField>
        );
      case 'createdOn':
        return (
          <FormField label="Created On" required>
            <Input value={createdOnLabel} readOnly disabled />
          </FormField>
        );
      case 'department':
        return (
          <FormField label="Department">
            <Select
              value={requisition.department}
              onChange={(e) => setRequisition({ ...requisition, department: e.target.value })}
              options={[
                { value: 'Manufacturing', label: 'Manufacturing' },
                { value: 'Operations', label: 'Operations' },
                { value: 'Engineering', label: 'Engineering' },
              ]}
            />
          </FormField>
        );
      case 'supplier':
        return (
          <div data-tour="pr-supplier-field">
          <FormField label="Supplier">
            <Select
              options={[
                { value: '', label: 'Select supplier' },
                { value: 'Techsupply Corp', label: 'Techsupply Corp' },
                { value: 'Global Supplies Ltd', label: 'Global Supplies Ltd' },
                { value: 'Apex Industries', label: 'Apex Industries' },
              ]}
              value={requisition.supplier || ''}
              onChange={(e) => setRequisition({ ...requisition, supplier: e.target.value })}
            />
          </FormField>
          </div>
        );
      case 'priority':
        return (
          <div data-tour="pr-priority-field">
          <FormField label="Priority">
            <Select
              value={requisition.priority}
              onChange={(e) => setRequisition({ ...requisition, priority: e.target.value as RequisitionData['priority'] })}
              options={[
                { value: '', label: 'Select priority' },
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' },
                { value: 'Critical', label: 'Critical' },
              ]}
            />
          </FormField>
          </div>
        );
      case 'requirementDate':
        return (
          <FormField label="Requirement Date">
            <Input
              type="date"
              min={requisition.documentDate}
              value={requisition.neededByDate}
              onChange={(e) => setRequisition({ ...requisition, neededByDate: e.target.value })}
            />
          </FormField>
        );
      case 'validTillDate':
        return (
          <FormField label="Valid Till Date">
            <Input
              type="date"
              min={requisition.neededByDate || requisition.documentDate}
              value={requisition.validTillDate}
              onChange={(e) => setRequisition({ ...requisition, validTillDate: e.target.value })}
            />
          </FormField>
        );
      case 'referenceNumber':
        return (
          <FormField label="Reference Number">
            <Input
              value={requisition.referenceNumber}
              maxLength={50}
              placeholder="Enter reference number"
              onChange={(e) => setRequisition({ ...requisition, referenceNumber: e.target.value.slice(0, 50) })}
            />
          </FormField>
        );
      case 'remarks':
        return (
          <>
            <FormField label="Remarks">
              <Textarea
                rows={4}
                maxLength={1000}
                value={requisition.remarks}
                placeholder="Add remarks"
                onChange={(e) => setRequisition({ ...requisition, remarks: e.target.value.slice(0, 1000) })}
              />
            </FormField>
            <div className="form-layout-field__counter">{requisition.remarks.length}/1000</div>
          </>
        );
      case 'productGrid':
        return (
          <div data-tour="pr-product-grid">
          <LineItemsSection
            items={lineItems}
            lineErrors={lineErrors}
            gridColumns={getVisibleGridColumns(layoutConfig, 'productGrid')}
            onAddLine={handleAddLine}
            onDeleteLine={handleDeleteLine}
            onFieldChange={handleLineFieldChange}
            onNumericBlur={handleNumericBlur}
            onLineBlur={handleLineBlur}
            onRemarksKeyDown={handleRemarksKeyDown}
            setFieldRef={setFieldRef}
          />
          </div>
        );
      case 'attachments':
        return <AttachmentsSection />;
      default:
        return (
          <div className="form-layout-empty">
            Field unavailable. Reset the layout if this continues.
          </div>
        );
    }
  };

  const renderConfiguredField = (fieldId: string, sectionId: string, fieldIndex: number) => {
    const label = prFieldLabels[fieldId] ?? fieldId;

    return (
      <React.Fragment key={fieldId}>
        <div
          onDragOver={(event) => isLayoutEditing && event.preventDefault()}
          onDrop={(event) => handleDropOnField(event, sectionId, fieldIndex)}
          className={cn(
            'form-layout-field',
            widePrFieldIds.has(fieldId) && 'form-layout-field--wide',
            isLayoutEditing && 'form-layout-field--editable',
            dragPayload?.type === 'field' && dragPayload.id !== fieldId && 'form-layout-field--drop-target'
          )}
        >
          {isLayoutEditing && (
            <button
              type="button"
              draggable
              className="form-layout-field__handle"
              aria-label={`Drag ${label}`}
              onDragStart={(event) => startLayoutDrag(event, { type: 'field', id: fieldId })}
              onDragEnd={() => setDragPayload(null)}
            >
              <GripVertical size={14} aria-hidden="true" />
              <span>{label}</span>
            </button>
          )}
          {renderFieldContent(fieldId)}
        </div>
      </React.Fragment>
    );
  };

  const renderConfiguredSections = () => {
    const currentTab = layoutConfig.tabs.find((tab) => tab.id === effectiveActiveTab) ?? layoutConfig.tabs[0];
    if (!currentTab) {
      return null;
    }

    return (
      <div className="form-layout-sections">
        {currentTab.sectionIds.map((sectionId, sectionIndex) => {
          const section = layoutConfig.sections[sectionId];
          if (!section) {
            return null;
          }

          return (
            <React.Fragment key={sectionId}>
              {isLayoutEditing && (
                <div
                  className="form-layout-dropzone form-layout-dropzone--section"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDropOnSection(event, currentTab.id, sectionId, sectionIndex)}
                >
                  Drop section here
                </div>
              )}
              <section
                onDragOver={(event) => isLayoutEditing && event.preventDefault()}
                onDrop={(event) => handleDropOnSection(event, currentTab.id, sectionId, sectionIndex)}
                className={cn(
                  'form-layout-section',
                  isLayoutEditing && 'form-layout-section--editable',
                  dragPayload?.type === 'section' && dragPayload.id !== sectionId && 'form-layout-section--drop-target'
                )}
                style={{ '--form-layout-columns': section.fieldsPerRow ?? 3 } as React.CSSProperties}
              >
              <div className="form-layout-section__header">
                <div className="form-layout-section__title-wrap">
                  {isLayoutEditing && (
                    <button
                      type="button"
                      draggable
                      className="form-layout-section__handle"
                      aria-label={`Drag ${section.label}`}
                      onDragStart={(event) => startLayoutDrag(event, { type: 'section', id: sectionId })}
                      onDragEnd={() => setDragPayload(null)}
                    >
                      <GripVertical size={15} aria-hidden="true" />
                    </button>
                  )}
                  <h3 className="form-layout-section__title">{section.label}</h3>
                  {isLayoutEditing && <span className="form-layout-section__count">{section.fieldIds.length} fields</span>}
                </div>
                {isLayoutEditing && (
                  <div className="form-layout-section__actions">
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => handleRenameSection(sectionId, section.label)}>
                      Rename
                    </button>
                    <label className="form-layout-row-control">
                      <span>Fields/row</span>
                      <select
                        className="form-layout-select"
                        aria-label={`Fields per row for ${section.label}`}
                        value={section.fieldsPerRow ?? 3}
                        onChange={(event) => {
                          setLayoutConfig((currentConfig) =>
                            updateSectionFieldsPerRow(currentConfig, sectionId, Number(event.target.value))
                          );
                        }}
                      >
                        {[1, 2, 3, 4].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </label>
                    <select
                      className="form-layout-select"
                      aria-label={`Merge ${section.label} into another section`}
                      value=""
                      onChange={(event) => {
                        if (event.target.value) {
                          setLayoutConfig((currentConfig) => mergeSections(currentConfig, sectionId, event.target.value));
                        }
                      }}
                    >
                      <option value="">Merge into...</option>
                      {Object.values(layoutConfig.sections)
                        .filter((availableSection) => availableSection.id !== sectionId)
                        .map((availableSection) => (
                          <option key={availableSection.id} value={availableSection.id}>
                            {availableSection.label}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="form-layout-section__fields">
                {section.fieldIds.map((fieldId, fieldIndex) => renderConfiguredField(fieldId, sectionId, fieldIndex))}
                {isLayoutEditing && (
                  <div
                    className="form-layout-dropzone form-layout-dropzone--end"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleDropOnField(event, sectionId, section.fieldIds.length)}
                  >
                    Drop field here
                  </div>
                )}
              </div>
            </section>
            </React.Fragment>
          );
        })}
        {isLayoutEditing && currentTab.sectionIds.length > 0 && (
          <div
            className="form-layout-dropzone form-layout-dropzone--section"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDropOnSection(event, currentTab.id, currentTab.sectionIds[currentTab.sectionIds.length - 1], currentTab.sectionIds.length)}
          >
            Drop section at end
          </div>
        )}
      </div>
    );
  };

  const layoutDialogCopy = (() => {
    if (!layoutDialog) {
      return null;
    }

    if (layoutDialog.mode === 'create-tab') {
      return {
        title: 'Create tab',
        description: 'Add a new tab and move sections or fields into it.',
        label: 'Tab name',
        placeholder: 'Enter tab name',
      };
    }

    if (layoutDialog.mode === 'create-section') {
      return {
        title: 'Create section',
        description: 'Add a new section in the current tab.',
        label: 'Section name',
        placeholder: 'Enter section name',
      };
    }

    if (layoutDialog.mode === 'rename-tab') {
      return {
        title: 'Rename tab',
        description: 'Update the display name for this tab.',
        label: 'Tab name',
        placeholder: 'Enter tab name',
      };
    }

    return {
      title: 'Rename section',
      description: 'Update the display name for this section.',
      label: 'Section name',
      placeholder: 'Enter section name',
    };
  })();

  const shouldCollapseProductHeader = effectiveActiveTab === 'product' && isProductHeaderCollapsed;
  const configuratorHeaderActions = configurationMode ? (
    <>
      <button type="button" className="btn btn--outline btn--sm" onClick={handleCreateTab}>
        <Plus size={14} aria-hidden="true" />
        Tab
      </button>
      <button type="button" className="btn btn--outline btn--sm" onClick={() => handleCreateSection(effectiveActiveTab)}>
        <Plus size={14} aria-hidden="true" />
        Section
      </button>
      <button type="button" className="btn btn--outline btn--sm" onClick={handleSaveDraftLayout}>
        <Save size={14} aria-hidden="true" />
        Save draft
      </button>
      <button type="button" className="btn btn--outline btn--sm" onClick={() => setIsLayoutPreviewOpen(true)}>
        <Eye size={14} aria-hidden="true" />
        Preview
      </button>
      <button type="button" className="btn btn--primary btn--sm" onClick={handlePublishLayout}>
        <CheckCircle2 size={14} aria-hidden="true" />
        Publish
      </button>
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={() => {
          setLayoutConfig(resetFormLayoutConfig(PURCHASE_REQUISITION_LAYOUT));
          setActiveTab('general');
          setFormMessage('Draft layout reset to the default Purchase Requisition layout.');
        }}
      >
        <RotateCcw size={14} aria-hidden="true" />
        Reset draft
      </button>
      <button
        type="button"
        className={cn('btn btn--sm', isLayoutEditing ? 'btn--primary' : 'btn--outline')}
        onClick={() => setIsLayoutEditing((currentValue) => !currentValue)}
      >
        {isLayoutEditing ? 'Done editing' : 'Edit layout'}
      </button>
    </>
  ) : undefined;

  return (
    <AppShell
      activeLeaf="purchase-requisition"
      onPurchaseRequisitionClick={onNavigateToList}
      onPurchaseOrderClick={onNavigateToPurchaseOrderList}
      contentRef={contentScrollRef}
      onContentScroll={handleContentScroll}
      contentClassName="create-pr-shell"
    >
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-out',
          shouldCollapseProductHeader ? 'max-h-0 -translate-y-2 opacity-0' : 'max-h-64 translate-y-0 opacity-100'
        )}
      >
        <PageHeader
          documentNumber={requisition.number}
          documentDate={formatDate(requisition.documentDate)}
          title={
            configurationMode
              ? 'Configure Purchase Requisition Layout'
              : editingDocument
                ? 'Edit Purchase Requisition'
                : 'New Purchase Requisition'
          }
          status={getHeaderStatusLabel(requisition.status)}
          onBack={onBack}
          onCancel={handleDiscardRequest}
          onSave={handleSave}
          hideDocumentMeta={configurationMode}
          hideStatus={configurationMode}
          actions={configuratorHeaderActions}
        />
      </div>

      <div className="create-pr-page mx-auto w-full max-w-[1800px] px-6 py-6 space-y-6">
            {/* ============================================================================
            REQUISITION DETAILS SECTION
            ============================================================================ */}
            <div
              className={cn(
                'space-y-4 overflow-hidden transition-all duration-300 ease-out',
                shouldCollapseProductHeader ? 'max-h-0 -translate-y-2 opacity-0' : 'max-h-80 translate-y-0 opacity-100'
              )}
            >
              <div className="create-pr-tabs">
                <div className="create-pr-tabs__list" role="tablist" aria-label="Purchase requisition sections">
                  {layoutConfig.tabs.map((tab, tabIndex) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={effectiveActiveTab === tab.id}
                      draggable={isLayoutEditing}
                      onDragStart={(event) => startLayoutDrag(event, { type: 'tab', id: tab.id })}
                      onDragOver={(event) => isLayoutEditing && event.preventDefault()}
                      onDrop={(event) => handleDropOnTab(event, tab.id, tabIndex)}
                      onDragEnd={() => setDragPayload(null)}
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        'create-pr-tab',
                        effectiveActiveTab === tab.id
                          ? 'create-pr-tab--active'
                          : 'create-pr-tab--inactive'
                      )}
                    >
                      <span className="create-pr-tab__label">{tab.label}</span>
                      {isLayoutEditing && (
                        <span
                          role="button"
                          tabIndex={0}
                          className="create-pr-tab__rename"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRenameTab(tab.id, tab.label);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              event.stopPropagation();
                              handleRenameTab(tab.id, tab.label);
                            }
                          }}
                        >
                          Rename
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {formMessage && (
                <div className="brand-message px-4 py-3 text-sm">
                  {formMessage}
                </div>
              )}
            </div>

            {renderConfiguredSections()}

            {configurationMode && (
              <GridColumnConfigurator
                layoutConfig={layoutConfig}
                onChange={(updater) => setLayoutConfig((currentConfig) => updater(currentConfig))}
              />
            )}

            {previewPayload && (
              <div className="rounded border border-slate-200 bg-slate-950 p-4 text-sm text-slate-100 shadow-sm">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Payload Preview</div>
                <pre className="overflow-x-auto whitespace-pre-wrap break-words">{previewPayload}</pre>
              </div>
            )}
      </div>
      <ConfirmationDialog
        isOpen={isDiscardDialogOpen}
        title="Discard changes?"
        description="Are you sure you want to discard? All your entered information will be cleared."
        confirmLabel="Yes"
        cancelLabel="No"
        onConfirm={handleDiscardConfirm}
        onClose={handleDiscardClose}
      />
      {layoutDialogCopy && (
        <CompactFormDialog
          isOpen={Boolean(layoutDialog)}
          title={layoutDialogCopy.title}
          description={layoutDialogCopy.description}
          label={layoutDialogCopy.label}
          initialValue={layoutDialog?.initialValue ?? ''}
          placeholder={layoutDialogCopy.placeholder}
          saveLabel="Save"
          discardLabel="Discard"
          onSave={handleLayoutDialogSave}
          onClose={() => setLayoutDialog(null)}
        />
      )}
      <SuccessSummaryDialog
        isOpen={isSaveSuccessDialogOpen}
        title="Saved successfully!"
        documentLabel="Purchase requisition No"
        documentNumber={requisition.number}
        sectionTitle="Requisition Summary"
        items={[
          { label: 'Total line count', value: formatCount(lineItems.length) },
          { label: 'Valid till date', value: requisition.validTillDate ? formatDate(requisition.validTillDate) : '-' },
          { label: 'Priority', value: requisition.priority || '-' },
          { label: 'Total cancelled qty', value: formatCount(totalCancelledQty) },
          { label: 'Total pending qty', value: formatCount(totalPendingQty) },
        ]}
        totalLabel="Total requested qty"
        totalValue={formatCount(totalRequestedQty)}
        primaryActionLabel="Go to homepage"
        onPrimaryAction={handleSaveSuccessPrimaryAction}
        onPrint={handlePrintSummary}
        onShare={handleShareSummary}
        onClose={handleSaveSuccessClose}
      />
      <GuidedTour
        isOpen={isCreateTourActive}
        steps={purchaseRequisitionCreateTourSteps}
        currentStepIndex={createTourStepIndex}
        onNext={handleCreateTourNext}
        onBack={handleCreateTourBack}
        onSkip={() => setIsCreateTourActive(false)}
      />
      <FormLayoutPreviewOverlay
        isOpen={isLayoutPreviewOpen}
        config={layoutConfig}
        formName="Purchase Requisition Create"
        fieldLabels={purchaseRequisitionFieldLabels}
        fieldValues={purchaseRequisitionPreviewValues}
        onClose={() => setIsLayoutPreviewOpen(false)}
        onPublish={handlePublishLayout}
      />
    </AppShell>
  );
};

export default CreatePurchaseRequisition;

