import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { CheckCircle2, ChevronRight, Copy, Eye, Plus, Trash2, Upload, FileText, PencilLine, GripVertical, RotateCcw, Save, X } from 'lucide-react';
import AppShell from '../../components/common/AppShell';
import AmountBreakdownDrawer from '../../components/common/AmountBreakdownDrawer';
import CompactFormDialog from '../../components/common/CompactFormDialog';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import FormLayoutPreviewOverlay from '../../components/common/FormLayoutPreviewOverlay';
import GridColumnConfigurator from '../../components/common/GridColumnConfigurator';
import GuidedTour, { type GuidedTourStep } from '../../components/common/GuidedTour';
import SuccessSummaryDialog from '../../components/common/SuccessSummaryDialog';
import { FormField, Input, Select, Textarea } from '../../components/common/FormControls';
import EditableTransactionGrid from '../../components/common/EditableTransactionGrid';
import TransactionCreateHeader, { transactionCreateCompactActionsMediaQuery } from '../../components/common/TransactionCreateHeader';
import { MasterFormAccordionSection, MasterFormSectionSummary, type MasterFormAccordionSectionState } from '../../experience/components';
import type { EditableGridAddRowContext, EditableGridBulkAction, EditableGridCellElement, EditableGridColumn, EditableGridMobileFieldGroup, EditableGridViewPreset } from '../../components/common/editableTransactionGridTypes';
import StatusBadge from '../../components/common/StatusBadge';
import { useDocumentPrint } from '../../print-builder/useDocumentPrint';
import { JOB_CARD_LAYOUT, jobCardFieldLabels } from '../../utils/formLayoutRegistry';
import type { JobCardDocument } from './jobCardCatalogueData';
import { cn } from '../../utils/classNames';
import { formatDate, formatDateTime } from '../../utils/dateFormat'
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
  type FormLayoutSection,
  getVisibleGridColumns,
  updateSectionFieldsPerRow,
} from '../../utils/formLayoutConfig';

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

interface JobCardData {
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
  [fieldId: string]: string | undefined;
  productCode?: string;
  uom?: string;
  requestedQty?: string;
  cancelledQty?: string;
  cancellationReason?: string;
  remarks?: string;
}

interface BulkEditDraft {
  priorityEnabled: boolean;
  priority: LineItem['priority'];
  requirementDateEnabled: boolean;
  requirementDate: string;
  remarksEnabled: boolean;
  remarks: string;
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
  ...Array.from({ length: 58 }, (_, index): LineItem => {
    const rowNumber = index + 3;
    const productIndex = index % 3;
    const product =
      productIndex === 0
        ? {
            code: 'P-1001',
            name: 'Industrial Bearing Assembly',
            description: 'Precision grade bearing assembly for conveyor equipment',
            uom: 'Unit',
          }
        : productIndex === 1
          ? {
              code: 'P-1002',
              name: 'Stainless Steel Fasteners Kit',
              description: 'Fasteners kit covering M10 to M20 sizes',
              uom: 'Box',
            }
          : {
              code: 'P-1003',
              name: 'Hydraulic Seal Pack',
              description: 'High-pressure seal pack for maintenance shutdowns',
              uom: 'Pack',
            };
    const requestedQty = product.uom === 'Box'
      ? 2500 + index * 25
      : product.uom === 'Pack'
        ? 90 + index * 3
        : 100 + index * 5;
    const cancelledQty = rowNumber % 8 === 0 ? Math.min(requestedQty / 10, 75) : 0;

    return {
      id: `line-${rowNumber}`,
      productCode: product.code,
      productName: product.name,
      description: product.description,
      uom: product.uom,
      priority: rowNumber % 11 === 0 ? 'Critical' : rowNumber % 5 === 0 ? 'High' : rowNumber % 3 === 0 ? 'Low' : 'Medium',
      requirementDate: `2025-03-${String(10 + (index % 18)).padStart(2, '0')}`,
      requestedQty: formatDecimal(requestedQty),
      orderedQty: '0.00',
      cancelledQty: formatDecimal(cancelledQty),
      cancellationReason: cancelledQty > 0 ? 'Demand Reduced' : '',
      remarks: `Default stress-test line ${rowNumber}`,
    };
  }),
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

const defaultBulkEditDraft: BulkEditDraft = {
  priorityEnabled: false,
  priority: '',
  requirementDateEnabled: false,
  requirementDate: '',
  remarksEnabled: false,
  remarks: '',
};

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

const jobCardCreateTourSteps: GuidedTourStep[] = [
  {
    id: 'supplier',
    target: '[data-tour="job-card-supplier-field"]',
    title: 'Choose the supplier',
    body: 'Use the supplier field when the requester already knows the preferred supplier for this Job Card.',
  },
  {
    id: 'priority',
    target: '[data-tour="job-card-priority-field"]',
    title: 'Set priority and dates',
    body: 'Priority and requirement dates help teams understand urgency and plan fulfilment.',
  },
  {
    id: 'product-grid',
    target: '[data-tour="job-card-product-grid"]',
    title: 'Add product details',
    body: 'The product grid captures requested items. Product code starts the line and related details populate automatically.',
  },
  {
    id: 'product-code',
    target: '[data-tour="job-card-product-code"]',
    title: 'Select a product',
    body: 'Start each line with a product code. The grid keeps keyboard-friendly entry for fast line creation.',
  },
  {
    id: 'requested-qty',
    target: '[data-tour="job-card-requested-qty"]',
    title: 'Enter requested quantity',
    body: 'Enter the quantity needed. Read-only columns show ordered, cancelled, and pending quantities.',
  },
  {
    id: 'save',
    target: '[data-tour="job-card-save-button"]',
    title: 'Save the Job Card',
    body: 'When required line details are complete, Save creates the Job Card and shows a confirmation summary.',
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

function isBlankDraftLine(line: LineItem): boolean {
  return (
    line.productCode === '' &&
    line.productName === '' &&
    line.description === '' &&
    line.uom === '' &&
    line.priority === '' &&
    line.requirementDate === '' &&
    line.requestedQty === '' &&
    parseDecimal(line.orderedQty) === 0 &&
    parseDecimal(line.cancelledQty) === 0 &&
    line.cancellationReason === '' &&
    line.remarks === ''
  );
}

// ============================================================================
// PAGE HEADER
// ============================================================================

function getHeaderStatusLabel(status: JobCardData['status']): string {
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

// ============================================================================
// LINE ITEMS TABLE
// ============================================================================

const LineItemsSection: React.FC<{
  items: LineItem[];
  lineErrors: Record<string, LineValidationErrors>;
  selectedLineIds: string[];
  onAddLine: (context?: EditableGridAddRowContext) => string | undefined;
  onMobileLineEditorClose: (lineId: string, line: LineItem) => void;
  onDuplicateLine: (lineId: string) => void;
  onDeleteLine: (lineId: string) => void;
  onSelectedLineIdsChange: (lineIds: string[]) => void;
  onOpenBulkEdit: () => void;
  onBulkDuplicateLines: () => void;
  onBulkDeleteLines: () => void;
  onFieldChange: (lineId: string, fieldName: keyof Pick<LineItem, 'productCode' | 'uom' | 'priority' | 'requirementDate' | 'requestedQty' | 'cancellationReason' | 'remarks'>, value: string) => void;
  onNumericBlur: (lineId: string, fieldName: 'requestedQty') => void;
  onLineBlur: (lineId: string) => void;
  onIncompleteLine: (line: LineItem) => void;
  isLineComplete: (line: LineItem) => boolean;
  setFieldRef: (
    lineId: string,
    fieldName: 'productCode' | 'uom' | 'priority' | 'requirementDate' | 'requestedQty' | 'cancellationReason' | 'remarks'
  ) => (element: EditableGridCellElement | null) => void;
  gridColumns: FormLayoutGridColumn[];
}> = ({
  items,
  lineErrors,
  selectedLineIds,
  onAddLine,
  onMobileLineEditorClose,
  onDuplicateLine,
  onDeleteLine,
  onSelectedLineIdsChange,
  onOpenBulkEdit,
  onBulkDuplicateLines,
  onBulkDeleteLines,
  onFieldChange,
  onNumericBlur,
  onLineBlur,
  onIncompleteLine,
  isLineComplete,
  setFieldRef,
  gridColumns,
}) => {
  const totalRequestedQty = items.reduce((sum, item) => sum + parseDecimal(item.requestedQty), 0);
  const totalOrderedQty = items.reduce((sum, item) => sum + parseDecimal(item.orderedQty), 0);
  const totalCancelledQty = items.reduce((sum, item) => sum + parseDecimal(item.cancelledQty), 0);
  const totalPendingQty = items.reduce((sum, item) => sum + Math.max(getPendingQty(item), 0), 0);

  const bulkActions = useMemo<EditableGridBulkAction<LineItem>[]>(() => [
    {
      id: 'bulk-edit',
      label: 'Bulk edit',
      icon: <PencilLine size={14} aria-hidden="true" />,
      tone: 'primary',
      onAction: onOpenBulkEdit,
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: <Copy size={14} aria-hidden="true" />,
      onAction: onBulkDuplicateLines,
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 size={14} aria-hidden="true" />,
      tone: 'danger',
      onAction: onBulkDeleteLines,
    },
  ], [onBulkDeleteLines, onBulkDuplicateLines, onOpenBulkEdit]);

  const editableColumns = useMemo<EditableGridColumn<LineItem>[]>(() => [
    {
      id: 'productCode',
      label: 'Product Code',
      kind: 'lookup',
      width: 228,
      minWidth: 196,
      locked: true,
      pinned: 'left',
      hideable: false,
      mobilePriority: 1,
      required: true,
      getValue: (line) => line.productCode,
      inputRef: (line, element) => setFieldRef(line.id, 'productCode')(element),
      dataTour: (_line, index) => index === 0 ? 'job-card-product-code' : undefined,
      lookupTitle: 'Select Product',
      searchPlaceholder: 'Search product code or name',
      searchable: true,
      options: [
        { value: '', label: 'Select product' },
        ...productOptions.map((option) => ({
          value: option.code,
          label: `${option.code} - ${option.name}`,
        })),
      ],
      onChange: (line, value) => onFieldChange(line.id, 'productCode', value),
      onBlur: (line) => onLineBlur(line.id),
    },
    {
      id: 'productName',
      label: 'Product Name',
      kind: 'computed',
      width: 210,
      minWidth: 180,
      mobilePriority: 2,
      readOnly: true,
      getValue: (line) => line.productName,
    },
    {
      id: 'description',
      label: 'Description',
      kind: 'computed',
      width: 260,
      minWidth: 220,
      readOnly: true,
      getValue: (line) => line.description,
    },
    {
      id: 'uom',
      label: 'UOM',
      kind: 'select',
      width: 128,
      minWidth: 112,
      locked: true,
      hideable: false,
      mobilePriority: 3,
      required: true,
      getValue: (line) => line.uom,
      inputRef: (line, element) => setFieldRef(line.id, 'uom')(element),
      options: (line) => {
        const product = getProductOption(line.productCode);
        return [
          { value: '', label: 'Select UOM' },
          ...((product?.uoms ?? []).map((uom) => ({ value: uom, label: uom }))),
        ];
      },
      onChange: (line, value) => onFieldChange(line.id, 'uom', value),
      onBlur: (line) => onLineBlur(line.id),
    },
    {
      id: 'priority',
      label: 'Priority',
      kind: 'select',
      width: 148,
      minWidth: 128,
      getValue: (line) => line.priority,
      inputRef: (line, element) => setFieldRef(line.id, 'priority')(element),
      options: linePriorityOptions,
      mobileControlPresentation: 'segmented',
      onChange: (line, value) => onFieldChange(line.id, 'priority', value),
    },
    {
      id: 'requirementDate',
      label: 'Requirement Date',
      kind: 'date',
      width: 168,
      minWidth: 148,
      getValue: (line) => line.requirementDate,
      inputRef: (line, element) => setFieldRef(line.id, 'requirementDate')(element),
      onChange: (line, value) => onFieldChange(line.id, 'requirementDate', value),
    },
    {
      id: 'requestedQty',
      label: 'Requested Qty.',
      kind: 'number',
      align: 'right',
      width: 148,
      minWidth: 124,
      locked: true,
      hideable: false,
      mobilePriority: 4,
      required: true,
      placeholder: '0.00',
      inputMode: 'decimal',
      getValue: (line) => line.requestedQty,
      inputRef: (line, element) => setFieldRef(line.id, 'requestedQty')(element),
      dataTour: (_line, index) => index === 0 ? 'job-card-requested-qty' : undefined,
      onChange: (line, value) => onFieldChange(line.id, 'requestedQty', value),
      onBlur: (line) => onNumericBlur(line.id, 'requestedQty'),
    },
    {
      id: 'orderedQty',
      label: 'Ordered Qty.',
      kind: 'computed',
      align: 'right',
      width: 148,
      minWidth: 124,
      locked: true,
      hideable: false,
      mobilePriority: 6,
      readOnly: true,
      className: 'editable-transaction-grid__control--number',
      getValue: (line) => parseDecimal(line.orderedQty),
      format: (value) => formatDecimal(Number(value) || 0),
    },
    {
      id: 'cancelledQty',
      label: 'Cancelled Qty.',
      kind: 'computed',
      align: 'right',
      width: 148,
      minWidth: 124,
      locked: true,
      hideable: false,
      mobilePriority: 7,
      readOnly: true,
      className: 'editable-transaction-grid__control--number',
      getValue: (line) => parseDecimal(line.cancelledQty),
      format: (value) => formatDecimal(Number(value) || 0),
    },
    {
      id: 'pendingQty',
      label: 'Pending Qty.',
      kind: 'computed',
      align: 'right',
      width: 148,
      minWidth: 124,
      locked: true,
      hideable: false,
      mobilePriority: 5,
      readOnly: true,
      className: 'editable-transaction-grid__control--number',
      getValue: (line) => Math.max(getPendingQty(line), 0),
      format: (value) => formatDecimal(Number(value) || 0),
    },
    {
      id: 'status',
      label: 'Status',
      kind: 'status',
      width: 168,
      minWidth: 148,
      mobilePriority: 8,
      readOnly: true,
      getValue: (line) => getLineStatus(line),
      renderDisplay: (line) => <StatusBadge kind="line-status" value={getLineStatus(line)} />,
    },
    {
      id: 'cancellationReason',
      label: 'Cancellation Reason',
      kind: 'select',
      width: 210,
      minWidth: 180,
      getValue: (line) => line.cancellationReason,
      inputRef: (line, element) => setFieldRef(line.id, 'cancellationReason')(element),
      options: cancellationReasonOptions,
      disabled: (line) => parseDecimal(line.cancelledQty) <= 0,
      onChange: (line, value) => onFieldChange(line.id, 'cancellationReason', value),
      onBlur: (line) => onLineBlur(line.id),
    },
    {
      id: 'remarks',
      label: 'Remarks',
      kind: 'remarks',
      width: 240,
      minWidth: 200,
      placeholder: 'Add remarks... (max 500 characters)',
      maxLength: 500,
      getValue: (line) => line.remarks,
      inputRef: (line, element) => setFieldRef(line.id, 'remarks')(element),
      onChange: (line, value) => onFieldChange(line.id, 'remarks', value),
      onBlur: (line) => onLineBlur(line.id),
    },
  ], [onFieldChange, onLineBlur, onNumericBlur, setFieldRef]);

  const gridViewPresets = useMemo<EditableGridViewPreset[]>(() => [
    {
      id: 'entry',
      label: 'Entry',
      columnIds: ['productCode', 'uom', 'requestedQty', 'requirementDate', 'priority', 'remarks'],
      description: 'Capture the required product line entry fields.',
    },
    {
      id: 'progress',
      label: 'Progress',
      columnIds: ['productCode', 'uom', 'requestedQty', 'orderedQty', 'cancelledQty', 'pendingQty', 'status', 'cancellationReason'],
      description: 'Review fulfilment, cancellation, pending quantity, and line status.',
    },
    {
      id: 'all',
      label: 'All',
      columnIds: editableColumns.map((column) => column.id),
      description: 'Show all layout-visible product line columns.',
    },
  ], [editableColumns]);

  const mobileFieldGroups = useMemo<EditableGridMobileFieldGroup<LineItem>[]>(() => [
    {
      id: 'product',
      label: 'Product',
      columnIds: ['productCode', 'uom', 'productName', 'description'],
    },
    {
      id: 'requirement',
      label: 'Requirement',
      columnIds: ['requestedQty', 'priority', 'requirementDate', 'remarks'],
    },
    {
      id: 'progress',
      label: 'Progress',
      columnIds: ['orderedQty', 'cancelledQty', 'pendingQty', 'status', 'cancellationReason'],
    },
  ], []);

  const renderedLayoutColumns = useMemo(
    () => gridColumns.filter((column) => column.key !== 'action'),
    [gridColumns]
  );

  const footerAggregates = useMemo(() => ({
    requestedQty: formatDecimal(totalRequestedQty),
    orderedQty: formatDecimal(totalOrderedQty),
    cancelledQty: formatDecimal(totalCancelledQty),
    pendingQty: formatDecimal(totalPendingQty),
  }), [totalCancelledQty, totalOrderedQty, totalPendingQty, totalRequestedQty]);

  return (
    <EditableTransactionGrid
      gridId="job-card-product-grid"
      title="Product lines"
      lineCountLabel={String(items.length)}
      hideHeaderIdentity
      primaryActionLabel="Add line"
      rows={items}
      columns={editableColumns}
      rowId={(line) => line.id}
      errors={lineErrors}
      validationDisplay="row-summary"
      selection={{
        selectedRowIds: selectedLineIds,
        onSelectionChange: (nextIds) => onSelectedLineIdsChange(nextIds),
        ariaLabel: 'Select all product lines',
      }}
      bulkActions={bulkActions}
      selectionColumnLabel="Select product lines"
      layoutColumns={renderedLayoutColumns}
      viewPresets={gridViewPresets}
      defaultViewId="entry"
      footerAggregates={footerAggregates}
      ariaLabel="Job Card product lines editable grid"
      mobileEditorTitle={(_line, index) => `Product line ${index + 1}`}
      mobileLayout={{
        breakpoint: 'tablet-portrait',
        presentation: 'compact-inline',
        stickyAddAction: true,
        stickyActionOffset: 'var(--create-pr-mobile-grid-action-offset, 0px)',
        inlineFieldIds: ['productCode', 'uom', 'requestedQty', 'requirementDate', 'priority', 'remarks'],
        showIssueSummary: true,
        editorPresentation: 'accordions',
        editorAccordionDefaults: {
          newRowOpenGroupIds: ['product'],
          existingRowOpenGroupIds: ['product'],
        },
        fieldGroups: mobileFieldGroups,
      }}
      emptyState="Add the first product line to start this Job Card."
      isRowComplete={isLineComplete}
      onAddRow={onAddLine}
      onMobileEditorClose={(lineId, line) => onMobileLineEditorClose(lineId, line)}
      onDuplicateRow={(lineId) => onDuplicateLine(lineId)}
      onDeleteRow={(lineId) => onDeleteLine(lineId)}
      onIncompleteRow={onIncompleteLine}
      getMobileRowSummary={(line, { rowIndex, firstError }) => {
        const status = getLineStatus(line);
        const productLabel = line.productCode
          ? `${line.productCode}${line.productName ? ` - ${line.productName}` : ''}`
          : `Line ${rowIndex + 1}`;

        return {
          title: productLabel,
          subtitle: line.uom ? `UOM ${line.uom}` : 'Select product and UOM',
          status: <StatusBadge kind="line-status" value={status} />,
          detail: firstError,
          metrics: [
            { label: 'Requested', value: line.requestedQty || '0.00' },
            { label: 'Pending', value: formatDecimal(Math.max(getPendingQty(line), 0)) },
          ],
        };
      }}
    />
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

interface CreateJobCardProps {
  onBack?: () => void;
  onNavigateToList?: () => void;
  onNavigateToPurchaseOrderList?: () => void;
  editingDocument?: JobCardDocument | null;
  tourMode?: 'job-card-create';
  configurationMode?: boolean;
}

function getInitialJobCard(editingDocument?: JobCardDocument | null): JobCardData {
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
    number: 'JC-2025-00847',
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

const CreateJobCard: React.FC<CreateJobCardProps> = ({
  onBack,
  onNavigateToList,
  onNavigateToPurchaseOrderList,
  editingDocument,
  tourMode,
  configurationMode = false,
}) => {
  const printTools = useDocumentPrint('job-card');
  type TabKey = string;

  const [requisition, setRequisition] = useState<JobCardData>(() => getInitialJobCard(editingDocument));

  const [lineItems, setLineItems] = useState<LineItem[]>(mockLineItems);
  const [lineErrors, setLineErrors] = useState<Record<string, LineValidationErrors>>({});
  const [selectedLineIds, setSelectedLineIds] = useState<string[]>([]);
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  const [bulkEditDraft, setBulkEditDraft] = useState<BulkEditDraft>(defaultBulkEditDraft);
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [layoutConfig, setLayoutConfig] = useState<FormLayoutConfig>(() =>
    configurationMode
      ? loadDraftFormLayoutConfig(JOB_CARD_LAYOUT)
      : loadPublishedFormLayoutConfig(JOB_CARD_LAYOUT)
  );
  const [isLayoutEditing, setIsLayoutEditing] = useState(configurationMode);
  const [dragPayload, setDragPayload] = useState<LayoutDragPayload | null>(null);
  const [layoutDialog, setLayoutDialog] = useState<LayoutDialogState>(null);
  const [formMessage, setFormMessage] = useState('');
  const [previewPayload, setPreviewPayload] = useState('');
  const [isProductHeaderCollapsed, setIsProductHeaderCollapsed] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isSaveSuccessDialogOpen, setIsSaveSuccessDialogOpen] = useState(false);
  const [isCreateTourActive, setIsCreateTourActive] = useState(tourMode === 'job-card-create');
  const [createTourStepIndex, setCreateTourStepIndex] = useState(0);
  const [isLayoutPreviewOpen, setIsLayoutPreviewOpen] = useState(false);
  const [isQuantityDrawerOpen, setIsQuantityDrawerOpen] = useState(false);
  const [quantitySummaryBarHeight, setQuantitySummaryBarHeight] = useState(0);
  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  const createPageRef = useRef<HTMLDivElement | null>(null);
  const quantitySummaryBarRef = useRef<HTMLDivElement | null>(null);
  const lastProductScrollTopRef = useRef(0);
  const focusLineIdRef = useRef<string | null>(null);
  const pendingMobileLineIdRef = useRef<string | null>(null);
  const fieldRefs = useRef<Record<string, EditableGridCellElement | null>>({});
  const isCompactCreateActionsViewport = useMediaQuery(transactionCreateCompactActionsMediaQuery, { noSsr: true });

  const handleTabChange = (nextTab: TabKey) => {
    setActiveTab(nextTab);
    setIsProductHeaderCollapsed(false);
    lastProductScrollTopRef.current = contentScrollRef.current?.scrollTop ?? 0;
  };

  const handleCreateTourNext = () => {
    const currentStep = jobCardCreateTourSteps[createTourStepIndex];

    if (currentStep?.id === 'priority') {
      handleTabChange('product');
    }

    if (createTourStepIndex >= jobCardCreateTourSteps.length - 1) {
      setIsCreateTourActive(false);
      return;
    }

    setCreateTourStepIndex((current) => current + 1);
  };

  const handleCreateTourBack = () => {
    const currentStep = jobCardCreateTourSteps[createTourStepIndex];

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
    const existingLineIds = new Set(lineItems.map((line) => line.id));
    setSelectedLineIds((currentIds) => {
      const nextIds = currentIds.filter((lineId) => existingLineIds.has(lineId));
      return nextIds.length === currentIds.length ? currentIds : nextIds;
    });
  }, [lineItems]);

  useEffect(() => {
    lastProductScrollTopRef.current = contentScrollRef.current?.scrollTop ?? 0;
  }, [activeTab]);

  const totalRequestedQty = useMemo(
    () => lineItems.reduce((sum, line) => sum + parseDecimal(line.requestedQty), 0),
    [lineItems]
  );

  const totalOrderedQty = useMemo(
    () => lineItems.reduce((sum, line) => sum + parseDecimal(line.orderedQty), 0),
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

  const lineAttentionCount = useMemo(
    () => Object.values(lineErrors).filter((errors) => Object.values(errors).some(Boolean)).length,
    [lineErrors]
  );

  const cancelledLineCount = useMemo(
    () => lineItems.filter((line) => parseDecimal(line.cancelledQty) > 0).length,
    [lineItems]
  );

  const quantityFooterState = useMemo(() => {
    if (lineAttentionCount > 0) {
      return {
        label: 'Needs attention',
        tone: 'warning' as const,
        context: `${formatCount(lineAttentionCount)} ${lineAttentionCount === 1 ? 'line needs' : 'lines need'} attention`,
      };
    }

    if (lineItems.length === 0) {
      return {
        label: 'No lines',
        tone: 'muted' as const,
        context: 'No product lines',
      };
    }

    if (cancelledLineCount > 0) {
      return {
        label: 'Partial cancellation',
        tone: 'caution' as const,
        context: `${formatCount(cancelledLineCount)} partially cancelled ${cancelledLineCount === 1 ? 'line' : 'lines'}`,
      };
    }

    return {
      label: 'Product lines ready',
      tone: 'success' as const,
      context: `${formatCount(lineItems.length)} ${lineItems.length === 1 ? 'product line' : 'product lines'}`,
    };
  }, [cancelledLineCount, lineAttentionCount, lineItems.length]);

  const quantityBreakdownItems = useMemo(() => [
    { label: 'Total line count', value: formatCount(lineItems.length) },
    { label: 'Total requested qty', value: formatCount(totalRequestedQty) },
    { label: 'Total ordered qty', value: formatCount(totalOrderedQty) },
    { label: 'Total cancelled qty', value: formatCount(totalCancelledQty) },
    { label: 'Total pending qty', value: formatCount(totalPendingQty), tone: 'accent' as const },
    ...(lineAttentionCount > 0
      ? [{ label: 'Lines needing attention', value: formatCount(lineAttentionCount), tone: 'accent' as const }]
      : []),
  ], [lineItems.length, lineAttentionCount, totalCancelledQty, totalOrderedQty, totalPendingQty, totalRequestedQty]);

  const selectedLineIdsInOrder = useMemo(() => {
    const selectedIdSet = new Set(selectedLineIds);
    return lineItems.filter((line) => selectedIdSet.has(line.id)).map((line) => line.id);
  }, [lineItems, selectedLineIds]);
  const createdOnLabel = useMemo(() => {
    const { dateLabel, timeLabel } = formatDateTime(requisition.createdOn);
    return `${dateLabel}, ${timeLabel}`;
  }, [requisition.createdOn]);
  const jobCardPreviewValues = useMemo(
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
    (element: EditableGridCellElement | null) => {
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

  const handleAddLine = (context?: EditableGridAddRowContext): string | undefined => {
    if (!validateAllLines()) {
      setFormMessage('Complete the current line details before adding another line.');
      handleTabChange('product');
      return undefined;
    }

    const nextLine = createEmptyLine(lineItems.length + 1);
    focusLineIdRef.current = nextLine.id;
    if (context?.source === 'mobile') {
      pendingMobileLineIdRef.current = nextLine.id;
    }
    setLineItems((currentLines) => [...currentLines, nextLine]);
    setFormMessage('');
    return nextLine.id;
  };

  const handleMobileLineEditorClose = (lineId: string, line: LineItem) => {
    if (pendingMobileLineIdRef.current !== lineId) {
      return;
    }

    pendingMobileLineIdRef.current = null;
    if (focusLineIdRef.current === lineId) {
      focusLineIdRef.current = null;
    }

    if (!isBlankDraftLine(line)) {
      return;
    }

    setLineItems((currentLines) => currentLines.filter((currentLine) => currentLine.id !== lineId));
    setLineErrors((currentErrors) => {
      if (!currentErrors[lineId]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[lineId];
      return nextErrors;
    });
    setSelectedLineIds((currentIds) => currentIds.filter((selectedLineId) => selectedLineId !== lineId));
    setFormMessage('');
  };

  const handleDuplicateLine = (lineId: string) => {
    const sourceIndex = lineItems.findIndex((line) => line.id === lineId);
    const sourceLine = lineItems[sourceIndex];
    if (!sourceLine) {
      return;
    }

    const duplicatedLine: LineItem = {
      ...sourceLine,
      id: `line-${Date.now()}-${lineItems.length + 1}`,
    };

    const nextLines = [...lineItems];
    nextLines.splice(sourceIndex + 1, 0, duplicatedLine);
    setLineItems(nextLines);
    setLineErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      const duplicatedErrors = validateLine(duplicatedLine);
      if (Object.keys(duplicatedErrors).length > 0) {
        nextErrors[duplicatedLine.id] = duplicatedErrors;
      }
      return nextErrors;
    });
    setSelectedLineIds([]);
    setFormMessage('Line duplicated. Review quantity and requirement date before submitting.');
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
    setSelectedLineIds((currentIds) => currentIds.filter((selectedLineId) => selectedLineId !== lineId));
    setFormMessage('');
  };

  const handleOpenBulkEdit = () => {
    if (selectedLineIdsInOrder.length === 0) {
      setFormMessage('Select one or more product lines before using bulk edit.');
      return;
    }

    setBulkEditDraft(defaultBulkEditDraft);
    setIsBulkEditDialogOpen(true);
    handleTabChange('product');
  };

  const handleCloseBulkEdit = () => {
    setIsBulkEditDialogOpen(false);
  };

  const handleApplyBulkEdit = () => {
    const selectedIdSet = new Set(selectedLineIdsInOrder);
    const selectedCount = selectedLineIdsInOrder.length;
    if (selectedCount === 0) {
      setIsBulkEditDialogOpen(false);
      setFormMessage('No product lines are selected.');
      return;
    }

    const hasBulkEditChange = bulkEditDraft.priorityEnabled || bulkEditDraft.requirementDateEnabled || bulkEditDraft.remarksEnabled;
    if (!hasBulkEditChange) {
      setFormMessage('Choose at least one field to update for selected lines.');
      return;
    }

    const nextLines = lineItems.map((line) => {
      if (!selectedIdSet.has(line.id)) {
        return line;
      }

      return {
        ...line,
        ...(bulkEditDraft.priorityEnabled ? { priority: bulkEditDraft.priority } : {}),
        ...(bulkEditDraft.requirementDateEnabled ? { requirementDate: bulkEditDraft.requirementDate } : {}),
        ...(bulkEditDraft.remarksEnabled ? { remarks: bulkEditDraft.remarks.slice(0, 500) } : {}),
      };
    });
    const updatedLines = nextLines.filter((line) => selectedIdSet.has(line.id));

    setLineItems(nextLines);
    setLineErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      updatedLines.forEach((line) => {
        const errors = validateLine(line);
        if (Object.keys(errors).length > 0) {
          nextErrors[line.id] = errors;
        } else {
          delete nextErrors[line.id];
        }
      });
      return nextErrors;
    });
    setSelectedLineIds([]);
    setIsBulkEditDialogOpen(false);
    setFormMessage(`Updated ${selectedCount} selected ${selectedCount === 1 ? 'line' : 'lines'}.`);
  };

  const handleBulkDuplicateLines = () => {
    if (selectedLineIdsInOrder.length === 0) {
      setFormMessage('Select one or more product lines to duplicate.');
      return;
    }

    const selectedIdSet = new Set(selectedLineIdsInOrder);
    const selectedSourceLines = lineItems.filter((line) => selectedIdSet.has(line.id));
    const lastSelectedIndex = lineItems.reduce(
      (latestIndex, line, index) => selectedIdSet.has(line.id) ? index : latestIndex,
      -1
    );
    const timestamp = Date.now();
    const duplicatedLines = selectedSourceLines.map((line, index) => ({
      ...line,
      id: `line-${timestamp}-bulk-${index + 1}`,
    }));

    if (lastSelectedIndex < 0 || duplicatedLines.length === 0) {
      setSelectedLineIds([]);
      setFormMessage('Selected lines are no longer available.');
      return;
    }

    const nextLines = [...lineItems];
    nextLines.splice(lastSelectedIndex + 1, 0, ...duplicatedLines);
    setLineItems(nextLines);
    setLineErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      duplicatedLines.forEach((line) => {
        const errors = validateLine(line);
        if (Object.keys(errors).length > 0) {
          nextErrors[line.id] = errors;
        }
      });
      return nextErrors;
    });
    setSelectedLineIds([]);
    setFormMessage(`Duplicated ${duplicatedLines.length} selected ${duplicatedLines.length === 1 ? 'line' : 'lines'}.`);
  };

  const handleBulkDeleteLines = () => {
    const selectedCount = selectedLineIdsInOrder.length;
    if (selectedCount === 0) {
      setFormMessage('Select one or more product lines to delete.');
      return;
    }

    if (!window.confirm(`Delete ${selectedCount} selected product ${selectedCount === 1 ? 'line' : 'lines'}?`)) {
      return;
    }

    const selectedIdSet = new Set(selectedLineIdsInOrder);
    setLineItems((currentLines) => currentLines.filter((line) => !selectedIdSet.has(line.id)));
    setLineErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      selectedLineIdsInOrder.forEach((lineId) => delete nextErrors[lineId]);
      return nextErrors;
    });
    setSelectedLineIds([]);
    setFormMessage(`Deleted ${selectedCount} selected ${selectedCount === 1 ? 'line' : 'lines'}.`);
  };
  const buildJobCardPayload = () => ({
    jobCard: {
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

    setPreviewPayload(JSON.stringify(buildJobCardPayload(), null, 2));
    setFormMessage(`Job Card payload is ready with ${lineItems.length} line(s).`);
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

  const buildJobCardPrintPreviewDocument = (): Record<string, unknown> => ({
    id: editingDocument?.id ?? `job-card-preview-${requisition.number}`,
    number: requisition.number,
    title: requisition.title,
    documentDateTime: requisition.documentDate ? `${requisition.documentDate}T09:00:00.000Z` : '',
    supplierName: requisition.supplier,
    requesterName: requisition.requestor,
    department: requisition.department,
    branch: requisition.deliveryLocation,
    legalEntity: requisition.legalEntity,
    costCenter: requisition.costCenter,
    requirementDate: requisition.neededByDate,
    validTillDate: requisition.validTillDate,
    priority: requisition.priority,
    status: getHeaderStatusLabel(requisition.status),
    currency: requisition.currency,
    lineCount: lineItems.length,
    contractReference: requisition.contractReference,
    budgetCode: requisition.budgetCode,
    notes: requisition.remarks,
    productLines: lineItems.map((line) => ({
      productCode: line.productCode,
      productName: line.productName,
      description: line.description,
      uom: line.uom,
      priority: line.priority || 'Low',
      requirementDate: line.requirementDate || '',
      requestedQty: formatDecimal(parseDecimal(line.requestedQty)),
      orderedQty: formatDecimal(parseDecimal(line.orderedQty)),
      cancelledQty: formatDecimal(parseDecimal(line.cancelledQty)),
      pendingQty: formatDecimal(Math.max(getPendingQty(line), 0)),
      status: getLineStatus(line),
      cancellationReason: line.cancellationReason,
      remarks: line.remarks,
    })),
  });

  const handlePrintSummary = () => {
    printTools.openPrintPreview(buildJobCardPrintPreviewDocument(), () => window.print());
  };

  const handleShareSummary = async () => {
    const summaryText = [
      'Job Card saved successfully',
      `Job Card No: ${requisition.number}`,
      `Total line count: ${formatCount(lineItems.length)}`,
      `Valid till date: ${requisition.validTillDate ? formatDate(requisition.validTillDate) : '-'}`,
      `Priority: ${requisition.priority || '-'}`,
      `Total cancelled qty: ${formatCount(totalCancelledQty)}`,
      `Total pending qty: ${formatCount(totalPendingQty)}`,
      `Total requested qty: ${formatCount(totalRequestedQty)}`,
    ].join('\n');

    if (navigator.share) {
      await navigator.share({
        title: 'Job Card summary',
        text: summaryText,
      });
      return;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(summaryText);
    }
  };

  const visibleLayoutTabs = useMemo(() => {
    if (configurationMode) {
      return layoutConfig.tabs;
    }

    const seenTabIds = new Set<string>();
    const seenTabLabels = new Set<string>();
    return layoutConfig.tabs.filter((tab) => {
      const tabLabel = tab.label.trim().toLowerCase();
      if (seenTabIds.has(tab.id) || seenTabLabels.has(tabLabel)) {
        return false;
      }

      seenTabIds.add(tab.id);
      seenTabLabels.add(tabLabel);
      return true;
    });
  }, [configurationMode, layoutConfig.tabs]);

  const effectiveActiveTab = visibleLayoutTabs.some((tab) => tab.id === activeTab)
    ? activeTab
    : visibleLayoutTabs[0]?.id ?? 'general';
  const isBottomFixedTabs = layoutConfig.tabPlacement === 'bottom-fixed';
  const isQuantitySummaryBarVisible = !configurationMode && !isCompactCreateActionsViewport;
  const isMobileSaveBarVisible = !configurationMode && isCompactCreateActionsViewport;
  const isCreatePrBottomBarVisible = isQuantitySummaryBarVisible || isMobileSaveBarVisible;
  const mobileGridActionOffset = isBottomFixedTabs
    ? 'calc(var(--create-pr-summary-bar-height, 0px) + 52px)'
    : 'var(--create-pr-summary-bar-height, 0px)';
  const [bottomTabsStyle, setBottomTabsStyle] = useState<React.CSSProperties>({});

  useLayoutEffect(() => {
    if (!isCreatePrBottomBarVisible) {
      setQuantitySummaryBarHeight(0);
      return;
    }

    const updateQuantitySummaryBarHeight = () => {
      const nextHeight = quantitySummaryBarRef.current?.getBoundingClientRect().height ?? 0;
      setQuantitySummaryBarHeight((currentHeight) => (currentHeight === nextHeight ? currentHeight : nextHeight));
    };

    updateQuantitySummaryBarHeight();
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateQuantitySummaryBarHeight)
      : null;

    if (quantitySummaryBarRef.current && resizeObserver) {
      resizeObserver.observe(quantitySummaryBarRef.current);
    }

    window.addEventListener('resize', updateQuantitySummaryBarHeight);
    return () => {
      window.removeEventListener('resize', updateQuantitySummaryBarHeight);
      resizeObserver?.disconnect();
    };
  }, [isCreatePrBottomBarVisible, isCompactCreateActionsViewport]);

  useLayoutEffect(() => {
    if (!isBottomFixedTabs) {
      return;
    }

    const updateBottomTabsBounds = () => {
      const pageElement = createPageRef.current;
      if (!pageElement) {
        return;
      }

      const pageBounds = pageElement.getBoundingClientRect();
      setBottomTabsStyle({
        bottom: `${isCreatePrBottomBarVisible ? quantitySummaryBarHeight : 0}px`,
        left: `${Math.max(0, pageBounds.left)}px`,
        width: `${Math.max(0, pageBounds.width)}px`,
      });
    };

    updateBottomTabsBounds();
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateBottomTabsBounds)
      : null;

    if (createPageRef.current && resizeObserver) {
      resizeObserver.observe(createPageRef.current);
    }

    window.addEventListener('resize', updateBottomTabsBounds);
    return () => {
      window.removeEventListener('resize', updateBottomTabsBounds);
      resizeObserver?.disconnect();
    };
  }, [isBottomFixedTabs, isCreatePrBottomBarVisible, quantitySummaryBarHeight]);

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
    setFormMessage('Layout published. The live Job Card create form now uses this layout.');
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
          <div data-tour="job-card-supplier-field">
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
          <div data-tour="job-card-priority-field">
          <FormField label="Priority">
            <Select
              value={requisition.priority}
              onChange={(e) => setRequisition({ ...requisition, priority: e.target.value as JobCardData['priority'] })}
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
          <div data-tour="job-card-product-grid">
            <LineItemsSection
              items={lineItems}
              lineErrors={lineErrors}
              selectedLineIds={selectedLineIds}
              gridColumns={getVisibleGridColumns(layoutConfig, 'productGrid')}
              onAddLine={handleAddLine}
              onMobileLineEditorClose={handleMobileLineEditorClose}
              onDuplicateLine={handleDuplicateLine}
              onDeleteLine={handleDeleteLine}
              onSelectedLineIdsChange={setSelectedLineIds}
              onOpenBulkEdit={handleOpenBulkEdit}
              onBulkDuplicateLines={handleBulkDuplicateLines}
              onBulkDeleteLines={handleBulkDeleteLines}
              onFieldChange={handleLineFieldChange}
              onNumericBlur={handleNumericBlur}
              onLineBlur={handleLineBlur}
              isLineComplete={(line) => Object.keys(validateLine(line)).length === 0}
              onIncompleteLine={(line) => {
                const nextErrors = validateLine(line);
                setLineErrors((currentErrors) => ({ ...currentErrors, [line.id]: nextErrors }));
                setFormMessage('Resolve the current row errors before adding another line.');
              }}
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

  const getSectionSummaryItems = (section: FormLayoutSection): Array<React.ReactNode | null | undefined | false> => {
    if (section.fieldIds.includes('productGrid')) {
      const issueLineCount = Object.values(lineErrors).filter((errors) => Object.values(errors).some(Boolean)).length;
      return [
        `${lineItems.length} ${lineItems.length === 1 ? 'line' : 'lines'}`,
        totalRequestedQty > 0 && `Requested: ${formatCount(totalRequestedQty)}`,
        totalPendingQty > 0 && `Pending: ${formatCount(totalPendingQty)}`,
        totalCancelledQty > 0 && `Cancelled: ${formatCount(totalCancelledQty)}`,
        issueLineCount > 0 && `${issueLineCount} ${issueLineCount === 1 ? 'line' : 'lines'} need attention`,
      ];
    }

    if (section.fieldIds.includes('attachments')) {
      return ['Product_Specifications.pdf'];
    }

    const summaryByField: Record<string, React.ReactNode | null> = {
      department: requisition.department ? `Department: ${requisition.department}` : null,
      supplier: requisition.supplier ? `Supplier: ${requisition.supplier}` : null,
      priority: requisition.priority ? `Priority: ${requisition.priority}` : null,
      requirementDate: requisition.neededByDate ? `Requirement: ${formatDate(requisition.neededByDate)}` : null,
      validTillDate: requisition.validTillDate ? `Valid till: ${formatDate(requisition.validTillDate)}` : null,
      referenceNumber: requisition.referenceNumber ? `Reference: ${requisition.referenceNumber}` : null,
      remarks: requisition.remarks.trim() ? 'Remarks added' : null,
    };

    return section.fieldIds.map((fieldId) => summaryByField[fieldId]);
  };

  const getSectionState = (section: FormLayoutSection): MasterFormAccordionSectionState => {
    if (section.fieldIds.includes('productGrid')) {
      const hasLineError = Object.values(lineErrors).some((errors) => Object.values(errors).some(Boolean));
      if (hasLineError) {
        return 'error';
      }

      const hasStartedLine = lineItems.some((line) =>
        Boolean(line.productCode || line.uom || line.requestedQty || line.priority || line.requirementDate || line.remarks)
      );
      const allLinesComplete = lineItems.length > 0 && lineItems.every((line) => Object.keys(validateLine(line)).length === 0);

      if (allLinesComplete) {
        return 'complete';
      }

      return hasStartedLine ? 'partial' : 'default';
    }

    if (section.fieldIds.includes('attachments')) {
      return 'complete';
    }

    const requiredGeneralFieldsComplete = Boolean(
      requisition.department &&
      requisition.supplier &&
      requisition.priority &&
      requisition.neededByDate &&
      requisition.validTillDate
    );
    const hasGeneralDetails = Boolean(
      requisition.department ||
      requisition.supplier ||
      requisition.priority ||
      requisition.neededByDate ||
      requisition.validTillDate ||
      requisition.referenceNumber ||
      requisition.remarks.trim()
    );

    if (requiredGeneralFieldsComplete) {
      return 'complete';
    }

    return hasGeneralDetails ? 'partial' : 'default';
  };

  const getSectionStateLabel = (section: FormLayoutSection) => {
    const state = getSectionState(section);
    if (state === 'complete') {
      return 'Complete';
    }
    if (state === 'error') {
      return 'Needs attention';
    }
    if (state === 'partial') {
      return 'In progress';
    }
    return undefined;
  };

  const getSectionTitle = (section: FormLayoutSection) => {
    if (section.fieldIds.includes('productGrid')) {
      return 'Products';
    }

    return section.label;
  };
  const getSectionDescription = (section: FormLayoutSection) => {
    if (section.fieldIds.includes('productGrid')) {
      return 'Add product lines, quantities, dates, and line remarks.';
    }
    if (section.fieldIds.includes('attachments')) {
      return 'Keep supporting files and notes with this Job Card.';
    }
    return 'Capture requester, supplier, priority, and validity details.';
  };

  const renderSectionBody = (sectionId: string, section: FormLayoutSection) => (
    <div
      className="form-layout-section__fields"
      style={{ '--form-layout-columns': section.fieldsPerRow ?? 3 } as React.CSSProperties}
    >
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
  );

  const renderLayoutEditSection = (sectionId: string, section: FormLayoutSection, sectionIndex: number, currentTabId: string) => (
    <section
      onDragOver={(event) => isLayoutEditing && event.preventDefault()}
      onDrop={(event) => handleDropOnSection(event, currentTabId, sectionId, sectionIndex)}
      className={cn(
        'form-layout-section',
        isLayoutEditing && 'form-layout-section--editable',
        dragPayload?.type === 'section' && dragPayload.id !== sectionId && 'form-layout-section--drop-target'
      )}
    >
      <div className="form-layout-section__header">
        <div className="form-layout-section__title-wrap">
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
          <h3 className="form-layout-section__title">{section.label}</h3>
          <span className="form-layout-section__count">{section.fieldIds.length} fields</span>
        </div>
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
      </div>
      {renderSectionBody(sectionId, section)}
    </section>
  );

  const renderConfiguredSections = () => {
    const currentTab = visibleLayoutTabs.find((tab) => tab.id === effectiveActiveTab) ?? visibleLayoutTabs[0];
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
              {isLayoutEditing ? (
                renderLayoutEditSection(sectionId, section, sectionIndex, currentTab.id)
              ) : (
                <div className="create-pr-master-section">
                  <MasterFormAccordionSection
                    title={getSectionTitle(section)}
                    description={getSectionDescription(section)}
                    defaultOpen
                    state={getSectionState(section)}
                    stateLabel={getSectionStateLabel(section)}
                    statePresentation="label"
                    summary={<MasterFormSectionSummary items={getSectionSummaryItems(section)} />}
                  >
                    {renderSectionBody(sectionId, section)}
                  </MasterFormAccordionSection>
                </div>
              )}
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
  const pageTitle = configurationMode
    ? 'Configure Job Card Layout'
    : editingDocument
      ? 'Edit Job Card'
      : 'New Job Card';
  const renderDocumentActions = () => (
    <div className="transaction-create-action-cluster">
      <button type="button" onClick={handleDiscardRequest} className="btn btn--outline">
        Discard
      </button>
      <button type="button" onClick={handleSave} className="btn btn--primary" data-tour="job-card-save-button">
        Save
      </button>
    </div>
  );

  const renderQuantitySummaryBar = () => (
    <div
      ref={quantitySummaryBarRef}
      className={cn(
        'create-pr-summary-bar',
        isCompactCreateActionsViewport && 'create-pr-summary-bar--with-actions',
        isBottomFixedTabs && 'create-pr-summary-bar--with-bottom-tabs'
      )}
    >
      <div className="create-pr-summary-shell">
        <div className="create-pr-summary-intelligence" aria-live="polite">
          <span
            className={cn(
              'create-pr-summary-status-chip',
              `create-pr-summary-status-chip--${quantityFooterState.tone}`
            )}
          >
            {quantityFooterState.label}
          </span>
          <span className="create-pr-summary-context">{quantityFooterState.context}</span>
        </div>

        <div className="create-pr-summary-metric create-pr-summary-metric--right">
          <span className="create-pr-summary-label">Total requested qty</span>
          <span className="create-pr-summary-value">{formatCount(totalRequestedQty)}</span>
        </div>

        <div className="create-pr-summary-divider" aria-hidden="true" />

        <div className="create-pr-summary-metric create-pr-summary-metric--emphasis create-pr-summary-metric--right">
          <span className="create-pr-summary-label">Total pending qty</span>
          <div className="create-pr-summary-net-row">
            <button
              type="button"
              className="create-pr-summary-trigger"
              onClick={() => setIsQuantityDrawerOpen(true)}
              aria-label={`Open quantity breakdown, total pending quantity ${formatCount(totalPendingQty)}`}
            >
              <span className="create-pr-summary-value create-pr-summary-value--accent">
                {formatCount(totalPendingQty)}
              </span>
              <ChevronRight size={18} className="create-pr-summary-chevron" aria-hidden="true" />
            </button>
          </div>
        </div>

        {isCompactCreateActionsViewport && (
          <div className="create-pr-summary-actions">
            {renderDocumentActions()}
          </div>
        )}
      </div>
    </div>
  );

  const renderMobileSaveBar = () => (
    <div ref={quantitySummaryBarRef} className="create-pr-mobile-save-bar">
      <button
        type="button"
        onClick={handleSave}
        className="btn btn--primary create-pr-mobile-save-bar__button"
        data-tour="job-card-save-button"
      >
        Save
      </button>
    </div>
  );
  const configuratorHeaderActions = configurationMode ? (
    <>
      <label className="form-layout-row-control">
        <span>Tab placement</span>
        <select
          className="form-layout-select"
          value={layoutConfig.tabPlacement ?? 'header'}
          onChange={(event) =>
            setLayoutConfig((currentConfig) => ({
              ...currentConfig,
              tabPlacement: event.target.value === 'bottom-fixed' ? 'bottom-fixed' : 'header',
            }))
          }
        >
          <option value="header">Header</option>
          <option value="bottom-fixed">Footer (Bottom fixed)</option>
        </select>
      </label>
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
          setLayoutConfig(resetFormLayoutConfig(JOB_CARD_LAYOUT));
          setActiveTab('general');
          setFormMessage('Draft layout reset to the default Job Card layout.');
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

  const renderTabs = (tabsClassName?: string) => (
    <div
      className={cn('create-pr-tabs', tabsClassName)}
      style={tabsClassName === 'create-pr-tabs--bottom-fixed' ? bottomTabsStyle : undefined}
    >
      <div className="create-pr-tabs__list" role="tablist" aria-label="Job Card sections">
        {visibleLayoutTabs.map((tab, tabIndex) => (
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
  );

  return (
    <AppShell
      activeLeaf="job-card"
      bottomBar={isQuantitySummaryBarVisible ? renderQuantitySummaryBar() : isMobileSaveBarVisible ? renderMobileSaveBar() : undefined}
      onJobCardClick={onNavigateToList}
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
        <TransactionCreateHeader
          title={pageTitle}
          statusLabel={getHeaderStatusLabel(requisition.status)}
          meta={[
            { label: 'Doc No', value: requisition.number },
            {
              label: 'Doc Date',
              value: (
                <span className="transaction-create-header__meta-inline">
                  <span>{formatDate(requisition.documentDate)}</span>
                  <PencilLine size={12} className="transaction-create-header__meta-icon" aria-hidden="true" />
                </span>
              ),
            },
          ]}
          onBack={onBack}
          backLabel="Back to Job Card list"
          primaryActions={configurationMode ? configuratorHeaderActions : !isCompactCreateActionsViewport ? renderDocumentActions() : undefined}
          hideMeta={configurationMode}
          hideStatus={configurationMode}
        />
      </div>

      <div
        ref={createPageRef}
        className={cn(
          'create-pr-page create-pr-page--structured mx-auto w-full max-w-[1800px]',
          isCreatePrBottomBarVisible && 'create-pr-page--with-summary-bar',
          isBottomFixedTabs && 'create-pr-page--tabs-bottom'
        )}
        style={{
          '--create-pr-summary-bar-height': `${quantitySummaryBarHeight}px`,
          '--create-pr-mobile-grid-action-offset': mobileGridActionOffset,
        } as React.CSSProperties}
      >
        {!isBottomFixedTabs && (
          <div
            className={cn(
              'create-pr-tab-row transition-all duration-300 ease-out',
              shouldCollapseProductHeader
                ? 'max-h-0 -translate-y-2 overflow-hidden opacity-0'
                : 'max-h-80 translate-y-0 overflow-visible opacity-100'
            )}
          >
            {renderTabs()}
          </div>
        )}

        <div className="create-pr-body space-y-6">
          {formMessage && (
            <div className="brand-message px-4 py-3 text-sm">
              {formMessage}
            </div>
          )}

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

        {isBottomFixedTabs && renderTabs('create-pr-tabs--bottom-fixed')}
      </div>
      {isBulkEditDialogOpen && (
        <div className="create-pr-bulk-edit" role="presentation">
          <div
            className="create-pr-bulk-edit__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-pr-bulk-edit-title"
          >
            <div className="create-pr-bulk-edit__header">
              <div>
                <h3 id="create-pr-bulk-edit-title">Bulk edit product lines</h3>
                <p>{selectedLineIdsInOrder.length} selected</p>
              </div>
              <button
                type="button"
                className="create-pr-bulk-edit__close"
                onClick={handleCloseBulkEdit}
                aria-label="Close bulk edit"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="create-pr-bulk-edit__body">
              <label className="create-pr-bulk-edit__field">
                <span className="create-pr-bulk-edit__field-toggle">
                  <input
                    type="checkbox"
                    checked={bulkEditDraft.priorityEnabled}
                    onChange={(event) => setBulkEditDraft((draft) => ({ ...draft, priorityEnabled: event.target.checked }))}
                  />
                  Priority
                </span>
                <Select
                  value={bulkEditDraft.priority}
                  disabled={!bulkEditDraft.priorityEnabled}
                  options={linePriorityOptions}
                  onChange={(event) => setBulkEditDraft((draft) => ({ ...draft, priority: event.target.value as LineItem['priority'] }))}
                />
              </label>

              <label className="create-pr-bulk-edit__field">
                <span className="create-pr-bulk-edit__field-toggle">
                  <input
                    type="checkbox"
                    checked={bulkEditDraft.requirementDateEnabled}
                    onChange={(event) => setBulkEditDraft((draft) => ({ ...draft, requirementDateEnabled: event.target.checked }))}
                  />
                  Requirement Date
                </span>
                <Input
                  type="date"
                  value={bulkEditDraft.requirementDate}
                  disabled={!bulkEditDraft.requirementDateEnabled}
                  onChange={(event) => setBulkEditDraft((draft) => ({ ...draft, requirementDate: event.target.value }))}
                />
              </label>

              <label className="create-pr-bulk-edit__field create-pr-bulk-edit__field--wide">
                <span className="create-pr-bulk-edit__field-toggle">
                  <input
                    type="checkbox"
                    checked={bulkEditDraft.remarksEnabled}
                    onChange={(event) => setBulkEditDraft((draft) => ({ ...draft, remarksEnabled: event.target.checked }))}
                  />
                  Remarks
                </span>
                <Textarea
                  rows={3}
                  maxLength={500}
                  value={bulkEditDraft.remarks}
                  placeholder="Add remarks... (max 500 characters)"
                  disabled={!bulkEditDraft.remarksEnabled}
                  onChange={(event) => setBulkEditDraft((draft) => ({ ...draft, remarks: event.target.value.slice(0, 500) }))}
                />
              </label>
            </div>

            <div className="create-pr-bulk-edit__footer">
              <button type="button" className="btn btn--outline" onClick={handleCloseBulkEdit}>
                Discard
              </button>
              <button type="button" className="btn btn--primary" onClick={handleApplyBulkEdit}>
                Apply to {selectedLineIdsInOrder.length}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmationDialog
        isOpen={isDiscardDialogOpen}
        title="Discard changes?"
        description="Are you sure you want to discard? All your entered information will be cleared."
        confirmLabel="Yes"
        cancelLabel="No"
        onConfirm={handleDiscardConfirm}
        onClose={handleDiscardClose}
        compactPresentation="bottom-sheet"
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
        documentLabel="Job Card No"
        documentNumber={requisition.number}
        sectionTitle="Job Card Summary"
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
      <AmountBreakdownDrawer
        isOpen={isQuantityDrawerOpen}
        title="Job Card quantity details"
        subtitle="Review the quantity summary for this Job Card."
        mainSectionTitle="Quantity breakdown"
        items={quantityBreakdownItems}
        totalLabel="Total requested qty"
        totalValue={formatCount(totalRequestedQty)}
        note={`This summary is calculated from ${lineItems.length} product line${lineItems.length === 1 ? '' : 's'} in the product details grid.`}
        onClose={() => setIsQuantityDrawerOpen(false)}
      />
      <GuidedTour
        isOpen={isCreateTourActive}
        steps={jobCardCreateTourSteps}
        currentStepIndex={createTourStepIndex}
        onNext={handleCreateTourNext}
        onBack={handleCreateTourBack}
        onSkip={() => setIsCreateTourActive(false)}
      />
      <FormLayoutPreviewOverlay
        isOpen={isLayoutPreviewOpen}
        config={layoutConfig}
        formName="Job Card Create"
        fieldLabels={jobCardFieldLabels}
        fieldValues={jobCardPreviewValues}
        onClose={() => setIsLayoutPreviewOpen(false)}
        onPublish={handlePublishLayout}
      />
      {printTools.printPreviewOverlay}
    </AppShell>
  );
};

export default CreateJobCard;
