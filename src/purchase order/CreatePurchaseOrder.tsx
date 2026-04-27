import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, MoreVertical, PencilLine, Plus, Search, Trash2, X, ChevronUp } from 'lucide-react';
import AppShell from '../components/AppShell';
import AmountBreakdownDrawer from '../components/common/AmountBreakdownDrawer';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import { FormField, Input, Select } from '../components/common/FormControls';
import { handleGridLastCellTab, hasRequiredGridValues } from '../components/common/gridKeyboard';
import PurchaseRequisitionPreviewDrawer from '../components/common/PurchaseRequisitionPreviewDrawer';
import SuccessSummaryDialog from '../components/common/SuccessSummaryDialog';
import { formatDate } from '../utils/dateFormat';
import { cn } from '../utils/classNames';
import { useBusinessSettings } from '../utils/businessSettings';
import type { PurchaseOrderDocument } from './purchaseOrderData';
import {
  extendedPurchaseRequisitionDocuments,
  type PurchaseRequisitionDocument,
} from '../purchaseRequisitionCatalogueData';

interface CreatePurchaseOrderProps {
  editingDocument?: PurchaseOrderDocument;
  onBack: () => void;
  onNavigateToPurchaseOrderList: () => void;
  onNavigateToPurchaseRequisitionList: () => void;
}

interface PurchaseOrderLineForm {
  id: string;
  sourceRequisitionId: string | null;
  sourceRequisitionNumber: string;
  sourceRequisitionTitle: string;
  sourceRequisitionSupplier: string;
  sourceRequisitionRequester: string;
  sourceRequisitionStatus: string;
  productCode: string;
  productName: string;
  hsnSac: string;
  uom: string;
  priority: '' | 'Low' | 'Medium' | 'High';
  requirementDate: string;
  purchaseRate: string;
  availableQty: string;
  requestedQty: string;
  orderQty: string;
  cancelledQty: string;
  receivedQty: string;
  invoicedQty: string;
  discountPercent: string;
  discountAmount: string;
  taxationColumns: string;
  remarks: string;
}

interface ProductLookupOption {
  code: string;
  name: string;
  hsnSac: string;
  uoms: string[];
  purchaseRates: string[];
  availableQty: string;
  taxLabel: string;
  taxRate: number;
}

interface PurchaseOrderFormData {
  number: string;
  linkedRequisitionNumber: string;
  supplierName: string;
  buyerName: string;
  placeOfSupply: string;
  branch: string;
  department: string;
  priority: '' | 'Low' | 'Medium' | 'High';
  orderDate: string;
  expectedDeliveryDate: string;
  paymentMode: '' | 'Cash' | 'Credit';
  paymentTerms: string;
  validTillDate: string;
  incoterm: string;
  notes: string;
  shipToLocation: string;
  shippingTerm: string;
  shippingMethod: string;
  shippingInstructions: string;
  insuranceProvider: string;
  insuranceContactPerson: string;
  insuranceType: string;
  insuranceNumber: string;
  insuranceAddress: string;
}

const supplierOptions = [
  { value: '', label: 'Select supplier' },
  { value: 'Techsupply Corp', label: 'Techsupply Corp' },
  { value: 'Apex Industries', label: 'Apex Industries' },
  { value: 'Global Supplies Ltd', label: 'Global Supplies Ltd' },
  { value: 'SafeWorks Trading', label: 'SafeWorks Trading' },
];

const departmentOptions = [
  { value: '', label: 'Select department' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Engineering', label: 'Engineering' },
];

const priorityOptions = [
  { value: '', label: 'Select priority' },
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
];

const paymentModeOptions = [
  { value: '', label: 'Select payment mode' },
  { value: 'Cash', label: 'Cash' },
  { value: 'Credit', label: 'Credit' },
];

const paymentTermsOptions = [
  { value: '', label: 'Select terms' },
  { value: 'Net 15', label: 'Net 15' },
  { value: 'Net 30', label: 'Net 30' },
  { value: 'Net 45', label: 'Net 45' },
];

const shipToLocationOptions = [
  { value: '', label: 'Select location' },
  { value: 'Head Office Warehouse', label: 'Head Office Warehouse' },
  { value: 'North Hub Stores', label: 'North Hub Stores' },
  { value: 'South Hub Stores', label: 'South Hub Stores' },
  { value: 'East Depot Receiving', label: 'East Depot Receiving' },
];

const shippingTermOptions = [
  { value: '', label: 'Select shipping term' },
  { value: 'Door Delivery', label: 'Door Delivery' },
  { value: 'Ex Works', label: 'Ex Works' },
  { value: 'FOB', label: 'FOB' },
  { value: 'CIF', label: 'CIF' },
];

const shippingMethodOptions = [
  { value: '', label: 'Select shipping method' },
  { value: 'Road Transport', label: 'Road Transport' },
  { value: 'Air Freight', label: 'Air Freight' },
  { value: 'Courier', label: 'Courier' },
  { value: 'Pickup', label: 'Pickup' },
];

const insuranceProviderOptions = [
  { value: '', label: 'Select insurance provider' },
  { value: 'SafeCover Insurance', label: 'SafeCover Insurance' },
  { value: 'Reliance General', label: 'Reliance General' },
  { value: 'ICICI Lombard', label: 'ICICI Lombard' },
];

const insuranceTypeOptions = [
  { value: '', label: 'Select insurance type' },
  { value: 'Transit Insurance', label: 'Transit Insurance' },
  { value: 'Marine Cargo', label: 'Marine Cargo' },
  { value: 'Warehouse to Warehouse', label: 'Warehouse to Warehouse' },
];

const insuranceAddressOptions = [
  { value: '', label: 'Select insurance address' },
  { value: 'Mumbai Regional Office', label: 'Mumbai Regional Office' },
  { value: 'Delhi Service Office', label: 'Delhi Service Office' },
  { value: 'Bengaluru Operations Office', label: 'Bengaluru Operations Office' },
];

const productLookupOptions: ProductLookupOption[] = [
  {
    code: 'P-1001',
    name: 'Industrial Bearing Assembly',
    hsnSac: '8482',
    uoms: ['Unit', 'Set'],
    purchaseRates: ['95.00', '102.50'],
    availableQty: '48.00',
    taxLabel: 'GST 18%',
    taxRate: 18,
  },
  {
    code: 'P-1002',
    name: 'Stainless Steel Fasteners Kit',
    hsnSac: '7318',
    uoms: ['Box', 'Unit'],
    purchaseRates: ['235.00', '265.00'],
    availableQty: '125.00',
    taxLabel: 'GST 12%',
    taxRate: 12,
  },
  {
    code: 'P-1003',
    name: 'Hydraulic Seal Pack',
    hsnSac: '4016',
    uoms: ['Pack', 'Unit'],
    purchaseRates: ['180.00', '192.00'],
    availableQty: '18.00',
    taxLabel: 'GST 18%',
    taxRate: 18,
  },
  {
    code: 'P-1004',
    name: 'Maintenance Lubricant Drum',
    hsnSac: '2710',
    uoms: ['Drum', 'Unit'],
    purchaseRates: ['395.00', '420.00'],
    availableQty: '9.00',
    taxLabel: 'GST 18%',
    taxRate: 18,
  },
];

function createEmptyLine(index: number): PurchaseOrderLineForm {
  return {
    id: `po-line-${Date.now()}-${index}`,
    sourceRequisitionId: null,
    sourceRequisitionNumber: 'Manual line items',
    sourceRequisitionTitle: 'Items added directly in the purchase order',
    sourceRequisitionSupplier: '',
    sourceRequisitionRequester: '',
    sourceRequisitionStatus: 'Manual',
    productCode: '',
    productName: '',
    hsnSac: '',
    uom: '',
    priority: '',
    requirementDate: '',
    purchaseRate: '',
    availableQty: '0.00',
    requestedQty: '0.00',
    orderQty: '',
    cancelledQty: '0.00',
    receivedQty: '0.00',
    invoicedQty: '0.00',
    discountPercent: '',
    discountAmount: '',
    taxationColumns: '',
    remarks: '',
  };
}

function parseDecimal(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDecimal(value: number): string {
  return value.toFixed(2);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCount(value: number): string {
  return Number.isInteger(value)
    ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)
    : new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function getRequisitionConversionStatus(
  requisition: PurchaseRequisitionDocument
): 'Open' | 'Partial Converted' | 'Converted' | 'Cancelled' {
  const lineStatuses = requisition.productLines.map((line) => line.status);
  const hasPartialOrdered = lineStatuses.includes('Partially Ordered');
  const hasOpenBalance = lineStatuses.some((status) => status === 'Open' || status === 'Partially Cancelled');
  const hasCancelledOnly = lineStatuses.every((status) => status === 'Cancelled');
  const hasFullyConvertedOnly = lineStatuses.every(
    (status) => status === 'Fully Ordered' || status === 'Cancelled'
  );

  if (hasCancelledOnly) {
    return 'Cancelled';
  }

  if (hasPartialOrdered) {
    return 'Partial Converted';
  }

  if (hasOpenBalance) {
    return 'Open';
  }

  if (hasFullyConvertedOnly) {
    return 'Converted';
  }

  return 'Open';
}

function getAgingInDays(documentDateTime: string): number {
  const currentDate = new Date();
  const createdDate = new Date(documentDateTime);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const currentDateFloor = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).getTime();
  const createdDateFloor = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate()).getTime();

  return Math.max(Math.floor((currentDateFloor - createdDateFloor) / millisecondsPerDay), 0);
}

function normalizePriority(value: string): '' | 'Low' | 'Medium' | 'High' {
  if (value === 'Critical') {
    return 'High';
  }

  if (value === 'High' || value === 'Medium' || value === 'Low') {
    return value;
  }

  return '';
}

function getProductLookupOption(code: string): ProductLookupOption | undefined {
  return productLookupOptions.find((product) => product.code === code);
}

function getTaxRate(line: PurchaseOrderLineForm): number {
  return getProductLookupOption(line.productCode)?.taxRate ?? 0;
}

function getDiscountAmount(line: PurchaseOrderLineForm): number {
  const baseAmount = parseDecimal(line.orderQty) * parseDecimal(line.purchaseRate);
  const manualDiscountAmount = parseDecimal(line.discountAmount);

  if (manualDiscountAmount > 0) {
    return manualDiscountAmount;
  }

  const percent = parseDecimal(line.discountPercent);
  if (percent > 0) {
    return (baseAmount * percent) / 100;
  }

  return 0;
}

function getTaxableAmount(line: PurchaseOrderLineForm): number {
  const baseAmount = parseDecimal(line.orderQty) * parseDecimal(line.purchaseRate);
  return Math.max(baseAmount - getDiscountAmount(line), 0);
}

function getPendingReceiptQty(line: PurchaseOrderLineForm): number {
  return Math.max(parseDecimal(line.orderQty) - parseDecimal(line.receivedQty) - parseDecimal(line.cancelledQty), 0);
}

function getPendingInvoiceQty(line: PurchaseOrderLineForm): number {
  return Math.max(parseDecimal(line.receivedQty) - parseDecimal(line.invoicedQty), 0);
}

function getLineAmount(line: PurchaseOrderLineForm): number {
  const taxableAmount = getTaxableAmount(line);
  return taxableAmount + (taxableAmount * getTaxRate(line)) / 100;
}

function getGrossOrderAmount(line: PurchaseOrderLineForm): number {
  const baseAmount = parseDecimal(line.orderQty) * parseDecimal(line.purchaseRate);
  return baseAmount + (baseAmount * getTaxRate(line)) / 100;
}

function mapRequisitionLinesToOrderLines(requisition: PurchaseRequisitionDocument): PurchaseOrderLineForm[] {
  return requisition.productLines.map((line, index) => {
    const productOption = getProductLookupOption(line.productCode);

    return {
      id: `po-line-from-pr-${requisition.id}-${index}`,
      sourceRequisitionId: requisition.id,
      sourceRequisitionNumber: requisition.number,
      sourceRequisitionTitle: requisition.title,
      sourceRequisitionSupplier: requisition.supplierName,
      sourceRequisitionRequester: requisition.requesterName,
      sourceRequisitionStatus: getRequisitionConversionStatus(requisition),
      productCode: line.productCode,
      productName: line.productName,
      hsnSac: productOption?.hsnSac ?? '',
      uom: line.uom || productOption?.uoms[0] || '',
      priority: normalizePriority(line.priority),
      requirementDate: line.requirementDate,
      purchaseRate: productOption?.purchaseRates[0] ?? '',
      availableQty: productOption?.availableQty ?? '0.00',
      requestedQty: line.requestedQty || '0.00',
      orderQty: line.requestedQty || '',
      cancelledQty: '0.00',
      receivedQty: '0.00',
      invoicedQty: '0.00',
      discountPercent: '',
      discountAmount: '',
      taxationColumns: productOption?.taxLabel ?? '',
      remarks: line.remarks || '',
    };
  });
}

function getCommonFieldValue(
  requisitions: PurchaseRequisitionDocument[],
  selector: (requisition: PurchaseRequisitionDocument) => string
): string {
  if (requisitions.length === 0) {
    return '';
  }

  const [firstValue, ...remainingValues] = requisitions.map(selector);
  return remainingValues.every((value) => value === firstValue) ? firstValue : '';
}

function getHighestPriorityFromRequisitions(
  requisitions: PurchaseRequisitionDocument[]
): '' | 'Low' | 'Medium' | 'High' {
  if (requisitions.length === 0) {
    return '';
  }

  const priorityRank: Record<string, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 };
  const highestPriority = requisitions.reduce<PurchaseRequisitionDocument['priority']>((currentHighest, requisition) => {
    return priorityRank[requisition.priority] > priorityRank[currentHighest] ? requisition.priority : currentHighest;
  }, requisitions[0].priority);

  return normalizePriority(highestPriority);
}

function getEarliestDateFromRequisitions(
  requisitions: PurchaseRequisitionDocument[],
  selector: (requisition: PurchaseRequisitionDocument) => string
): string {
  const availableDates = requisitions.map(selector).filter(Boolean);
  if (availableDates.length === 0) {
    return '';
  }

  return [...availableDates].sort()[0];
}

const CreatePurchaseOrder: React.FC<CreatePurchaseOrderProps> = ({
  editingDocument,
  onBack,
  onNavigateToPurchaseOrderList,
  onNavigateToPurchaseRequisitionList,
}) => {
  type TabKey = 'general' | 'product' | 'delivery';
  const todayIso = new Date().toISOString().slice(0, 10);

  const initialData: PurchaseOrderFormData = editingDocument
      ? {
          number: editingDocument.number,
          linkedRequisitionNumber: '',
          supplierName: editingDocument.supplierName,
        buyerName: editingDocument.buyerName,
        placeOfSupply: editingDocument.branch,
        branch: editingDocument.branch,
        department: editingDocument.department,
        priority: normalizePriority(editingDocument.priority),
        orderDate: editingDocument.orderDateTime.slice(0, 10),
        expectedDeliveryDate: editingDocument.expectedDeliveryDate,
        paymentMode: 'Credit',
          paymentTerms: editingDocument.paymentTerms,
          validTillDate: editingDocument.expectedDeliveryDate,
          incoterm: editingDocument.incoterm,
          notes: editingDocument.notes,
          shipToLocation: editingDocument.branch ? `${editingDocument.branch} Stores` : '',
          shippingTerm: editingDocument.incoterm,
          shippingMethod: '',
          shippingInstructions: editingDocument.notes,
          insuranceProvider: '',
          insuranceContactPerson: editingDocument.buyerName,
          insuranceType: '',
          insuranceNumber: '',
          insuranceAddress: '',
        }
    : {
        number: `PO-${new Date().getFullYear()}-00001`,
        linkedRequisitionNumber: '',
        supplierName: '',
        buyerName: '',
        placeOfSupply: '',
        branch: '',
        department: '',
        priority: '',
        orderDate: '2026-04-13',
        expectedDeliveryDate: '',
        paymentMode: '',
        paymentTerms: '',
        validTillDate: '',
        incoterm: '',
        notes: '',
        shipToLocation: '',
        shippingTerm: '',
        shippingMethod: '',
        shippingInstructions: '',
        insuranceProvider: '',
        insuranceContactPerson: '',
        insuranceType: '',
        insuranceNumber: '',
        insuranceAddress: '',
      };

  const [formData, setFormData] = useState<PurchaseOrderFormData>(initialData);
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [requisitionSearch, setRequisitionSearch] = useState('');
  const [selectedRequisitionIds, setSelectedRequisitionIds] = useState<string[]>([]);
  const [isRequisitionResultsOpen, setIsRequisitionResultsOpen] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isSaveSuccessDialogOpen, setIsSaveSuccessDialogOpen] = useState(false);
  const [isAmountDrawerOpen, setIsAmountDrawerOpen] = useState(false);
  const [previewRequisitionId, setPreviewRequisitionId] = useState<string | null>(null);
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Record<string, boolean>>({});
  const [workflowError, setWorkflowError] = useState('');
  const focusLineIdRef = useRef<string | null>(null);
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | null>>({});
  const voicePrefillAppliedRef = useRef<string | null>(null);
  const businessSettings = useBusinessSettings();
  const purchaseOrderSettings = businessSettings.procurement.purchaseOrder;
  const canConvertRequisitionToOrder = businessSettings.procurement.conversions.purchaseRequisitionToPurchaseOrder;
  const [lines, setLines] = useState<PurchaseOrderLineForm[]>(
    editingDocument?.lines.map((line, index) => {
      const productOption = getProductLookupOption(line.itemCode);

      return {
        id: `po-line-edit-${index}`,
        sourceRequisitionId: null,
        sourceRequisitionNumber: 'Manual line items',
        sourceRequisitionTitle: 'Items added directly in the purchase order',
        sourceRequisitionSupplier: '',
        sourceRequisitionRequester: '',
        sourceRequisitionStatus: 'Manual',
        productCode: line.itemCode,
        productName: line.itemName,
        hsnSac: productOption?.hsnSac ?? '',
        uom: line.uom,
        priority: '',
        requirementDate: line.expectedDate,
        purchaseRate: line.unitPrice,
        availableQty: productOption?.availableQty ?? '0.00',
        requestedQty: line.quantity,
        orderQty: line.quantity,
        cancelledQty: '0.00',
        receivedQty: '0.00',
        invoicedQty: '0.00',
        discountPercent: '',
        discountAmount: '',
        taxationColumns: productOption?.taxLabel ?? '',
        remarks: '',
      };
    }) ?? [createEmptyLine(0)]
  );

  const matchingRequisitions = useMemo(() => {
    if (!canConvertRequisitionToOrder || (!purchaseOrderSettings.allowMultiplePurchaseRequisitions && selectedRequisitionIds.length > 0)) {
      return [];
    }

    const normalizedSearch = requisitionSearch.trim().toLowerCase();
    const eligibleRequisitions = extendedPurchaseRequisitionDocuments.filter((document) => {
      const conversionStatus = getRequisitionConversionStatus(document);
      return (
        (conversionStatus === 'Open' || conversionStatus === 'Partial Converted') &&
        !selectedRequisitionIds.includes(document.id)
      );
    });

    if (!normalizedSearch) {
      return eligibleRequisitions.slice(0, 6);
    }

    return eligibleRequisitions
      .filter((document) =>
        document.number.toLowerCase().includes(normalizedSearch) ||
        document.title.toLowerCase().includes(normalizedSearch) ||
        document.supplierName.toLowerCase().includes(normalizedSearch) ||
        document.requesterName.toLowerCase().includes(normalizedSearch)
      )
      .slice(0, 8);
  }, [
    canConvertRequisitionToOrder,
    purchaseOrderSettings.allowMultiplePurchaseRequisitions,
    requisitionSearch,
    selectedRequisitionIds,
  ]);

  const selectedRequisitions = useMemo(
    () =>
      selectedRequisitionIds
        .map((id) => extendedPurchaseRequisitionDocuments.find((document) => document.id === id) ?? null)
        .filter((document): document is PurchaseRequisitionDocument => document !== null),
    [selectedRequisitionIds]
  );

  const groupedLines = useMemo(() => {
    const groups = new Map<
      string,
      {
        id: string;
        number: string;
        title: string;
        supplier: string;
        requester: string;
        status: string;
        lines: PurchaseOrderLineForm[];
      }
    >();

    lines.forEach((line) => {
      const groupKey = line.sourceRequisitionId ?? 'manual';
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          id: groupKey,
          number: line.sourceRequisitionNumber || 'Manual line items',
          title: line.sourceRequisitionTitle || 'Items added directly in the purchase order',
          supplier: line.sourceRequisitionSupplier,
          requester: line.sourceRequisitionRequester,
          status: line.sourceRequisitionStatus,
          lines: [],
        });
      }

      groups.get(groupKey)?.lines.push(line);
    });

    return Array.from(groups.values());
  }, [lines]);

  const previewRequisition = useMemo(
    () => selectedRequisitions.find((requisition) => requisition.id === previewRequisitionId) ?? null,
    [previewRequisitionId, selectedRequisitions]
  );

  const totalAmount = useMemo(() => lines.reduce((sum, line) => sum + getLineAmount(line), 0), [lines]);
  const grossOrderAmount = useMemo(
    () => lines.reduce((sum, line) => sum + getGrossOrderAmount(line), 0),
    [lines]
  );
  const totalDiscountAmount = useMemo(
    () => lines.reduce((sum, line) => sum + getDiscountAmount(line), 0),
    [lines]
  );
  const totalTaxableAmount = useMemo(
    () => lines.reduce((sum, line) => sum + getTaxableAmount(line), 0),
    [lines]
  );
  const totalTaxAmount = useMemo(
    () => Math.max(totalAmount - totalTaxableAmount, 0),
    [totalAmount, totalTaxableAmount]
  );
  const totalPartCount = useMemo(
    () => lines.reduce((sum, line) => sum + parseDecimal(line.orderQty), 0),
    [lines]
  );

  const tabs: Array<{ id: TabKey; label: string }> = [
    { id: 'general', label: 'General Details' },
    { id: 'product', label: 'Product Details' },
    { id: 'delivery', label: 'Delivery Details' },
  ];
  const isPurchaseOrderLineComplete = (line: PurchaseOrderLineForm) =>
    hasRequiredGridValues(line, ['productCode', 'uom', 'purchaseRate', 'orderQty']);
  const canAddProductLine =
    (purchaseOrderSettings.allowManualLines || selectedRequisitionIds.length > 0) &&
    (lines.length === 0 || isPurchaseOrderLineComplete(lines[lines.length - 1]));

  useEffect(() => {
    if (!focusLineIdRef.current) {
      return;
    }

    const field = fieldRefs.current[`${focusLineIdRef.current}:productCode`];
    if (field) {
      field.focus();
      focusLineIdRef.current = null;
    }
  }, [lines]);

  const setFieldRef =
    (lineId: string, fieldName: 'productCode') =>
    (element: HTMLInputElement | HTMLSelectElement | null) => {
      fieldRefs.current[`${lineId}:${fieldName}`] = element;
    };

  const handleFieldChange = (field: keyof PurchaseOrderFormData, value: string) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleLineChange = (lineId: string, field: keyof PurchaseOrderLineForm, value: string) => {
    setLines((currentLines) =>
      currentLines.map((line) =>
        line.id === lineId
          ? (() => {
              const nextLine: PurchaseOrderLineForm = {
                ...line,
                [field]: value,
              };

              if (field === 'productCode') {
                const selectedProduct = getProductLookupOption(value);
                const parentRequisition = line.sourceRequisitionId
                  ? selectedRequisitions.find((requisition) => requisition.id === line.sourceRequisitionId) ?? null
                  : null;
                const linkedRequisitionLine = parentRequisition?.productLines.find((productLine) => productLine.productCode === value);

                nextLine.productName = selectedProduct?.name ?? '';
                nextLine.hsnSac = selectedProduct?.hsnSac ?? '';
                nextLine.uom = selectedProduct?.uoms[0] ?? '';
                nextLine.purchaseRate = selectedProduct?.purchaseRates[0] ?? '';
                nextLine.availableQty = selectedProduct?.availableQty ?? '0.00';
                nextLine.taxationColumns = selectedProduct?.taxLabel ?? '';
                nextLine.requestedQty = linkedRequisitionLine?.requestedQty ?? '0.00';
                nextLine.priority = normalizePriority(linkedRequisitionLine?.priority ?? formData.priority);
                nextLine.requirementDate = linkedRequisitionLine?.requirementDate ?? parentRequisition?.requirementDate ?? formData.expectedDeliveryDate;
                nextLine.remarks = linkedRequisitionLine?.remarks ?? '';
              }

              if (field === 'uom' || field === 'priority' || field === 'requirementDate' || field === 'remarks') {
                return nextLine;
              }

              if (field === 'discountPercent') {
                const baseAmount = parseDecimal(nextLine.orderQty) * parseDecimal(nextLine.purchaseRate);
                nextLine.discountAmount = value ? formatDecimal((baseAmount * parseDecimal(value)) / 100) : '';
              }

              return nextLine;
            })()
          : line
      )
    );
  };

  const handleAddLine = () => {
    if (!canAddProductLine) {
      return;
    }

    const nextLine = createEmptyLine(lines.length);
    focusLineIdRef.current = nextLine.id;
    setLines((currentLines) => [...currentLines, nextLine]);
  };

  const handleDeleteLine = (lineId: string) => {
    setLines((currentLines) => {
      if (currentLines.length === 1) {
        return currentLines;
      }

      return currentLines.filter((line) => line.id !== lineId);
    });
  };

  const handleRemarksKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, lineId: string) => {
    const lineIndex = lines.findIndex((line) => line.id === lineId);
    const line = lines[lineIndex];
    if (!line) {
      return;
    }

    handleGridLastCellTab({
      event,
      line,
      lineIndex,
      lines,
      isLineComplete: isPurchaseOrderLineComplete,
      onAddLine: handleAddLine,
    });
  };

  const handleSave = () => {
    if (purchaseOrderSettings.purchaseRequisitionMandatory && selectedRequisitionIds.length === 0) {
      setWorkflowError('Select a purchase requisition before saving this purchase order.');
      return;
    }

    if (!canConvertRequisitionToOrder && selectedRequisitionIds.length > 0) {
      setWorkflowError('Purchase Requisition to Purchase Order conversion is disabled in Business Settings.');
      return;
    }

    if (!purchaseOrderSettings.allowManualLines && lines.some((line) => !line.sourceRequisitionId)) {
      setWorkflowError('Manual purchase order lines are disabled in Business Settings. Remove manual lines or select a requisition.');
      return;
    }

    if (!businessSettings.actions.purchaseOrder.allowSubmit) {
      setWorkflowError('Submitting purchase orders is disabled in Business Settings.');
      return;
    }

    setWorkflowError('');
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
    onNavigateToPurchaseOrderList();
  };

  const handleSaveSuccessClose = () => {
    setIsSaveSuccessDialogOpen(false);
  };

  const handleSaveSuccessPrimaryAction = () => {
    setIsSaveSuccessDialogOpen(false);
    onNavigateToPurchaseOrderList();
  };

  const handlePrintSummary = () => {
    window.print();
  };

  const handleShareSummary = async () => {
    const summaryText = [
      'Purchase order saved successfully',
      `Purchase order No: ${formData.number}`,
      `Total part count: ${formatCount(totalPartCount)}`,
      `Valid till date: ${formData.validTillDate ? formatDate(formData.validTillDate) : '-'}`,
      `Priority: ${formData.priority || '-'}`,
      `Total discount: Rs ${formatCurrency(totalDiscountAmount)}`,
      `Total tax: Rs ${formatCurrency(totalTaxAmount)}`,
      `Net order amount: Rs ${formatCurrency(totalAmount)}`,
    ].join('\n');

    if (navigator.share) {
      await navigator.share({
        title: 'Purchase order summary',
        text: summaryText,
      });
      return;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(summaryText);
    }
  };

  const syncFormDataFromRequisitions = (
    requisitions: PurchaseRequisitionDocument[],
    fallback: PurchaseOrderFormData
  ): PurchaseOrderFormData => {
    if (requisitions.length === 0) {
      return {
        ...fallback,
        linkedRequisitionNumber: '',
      };
    }

    return {
      ...fallback,
      linkedRequisitionNumber: requisitions.map((requisition) => requisition.number).join(', '),
      supplierName: getCommonFieldValue(requisitions, (requisition) => requisition.supplierName),
      buyerName: getCommonFieldValue(requisitions, (requisition) => requisition.requesterName),
      placeOfSupply: getCommonFieldValue(requisitions, (requisition) => requisition.branch),
      branch: getCommonFieldValue(requisitions, (requisition) => requisition.branch),
      department: getCommonFieldValue(requisitions, (requisition) => requisition.department),
      priority: getHighestPriorityFromRequisitions(requisitions),
      expectedDeliveryDate: getEarliestDateFromRequisitions(requisitions, (requisition) => requisition.requirementDate),
      validTillDate: getEarliestDateFromRequisitions(requisitions, (requisition) => requisition.validTillDate),
      notes: requisitions.length === 1 ? requisitions[0].notes : '',
    };
  };

  const handleSelectRequisition = (requisition: PurchaseRequisitionDocument) => {
    if (!canConvertRequisitionToOrder) {
      setWorkflowError('Purchase Requisition to Purchase Order conversion is disabled in Business Settings.');
      return;
    }

    if (selectedRequisitionIds.includes(requisition.id)) {
      return;
    }

    if (!purchaseOrderSettings.allowMultiplePurchaseRequisitions && selectedRequisitionIds.length > 0) {
      setWorkflowError('Multiple purchase requisitions are disabled in Business Settings.');
      return;
    }

    const nextSelectedRequisitions = [...selectedRequisitions, requisition];
    setSelectedRequisitionIds(nextSelectedRequisitions.map((document) => document.id));
    setRequisitionSearch('');
    setIsRequisitionResultsOpen(true);
    setWorkflowError('');

    setFormData((current) => syncFormDataFromRequisitions(nextSelectedRequisitions, current));

    setLines((currentLines) => {
      const baseLines =
        currentLines.length === 1 &&
        currentLines[0].sourceRequisitionId === null &&
        !currentLines[0].productCode &&
        !currentLines[0].productName
          ? []
          : currentLines;

      return [...baseLines, ...mapRequisitionLinesToOrderLines(requisition)];
    });
  };

  const handleRemoveRequisition = (requisitionId: string) => {
    const nextSelectedRequisitions = selectedRequisitions.filter((requisition) => requisition.id !== requisitionId);
    setSelectedRequisitionIds(nextSelectedRequisitions.map((requisition) => requisition.id));
    setFormData((current) => syncFormDataFromRequisitions(nextSelectedRequisitions, current));
    setLines((currentLines) => {
      const remainingLines = currentLines.filter((line) => line.sourceRequisitionId !== requisitionId);
      return remainingLines.length > 0 ? remainingLines : [createEmptyLine(0)];
    });
    setWorkflowError('');
  };
  const handleSelectRequisitionRef = useRef(handleSelectRequisition);

  useEffect(() => {
    handleSelectRequisitionRef.current = handleSelectRequisition;
  });

  useEffect(() => {
    if (editingDocument) {
      return;
    }

    const applyVoicePrefill = () => {
      const hashQuery = window.location.hash.split('?')[1] ?? '';
      const params = new URLSearchParams(hashQuery);
      const source = params.get('source');
      const sourceId = params.get('sourceId');
      const supplierValue = params.get('supplier') ?? params.get('supplierQuery');
      const prefillKey = params.toString();

      if (voicePrefillAppliedRef.current === prefillKey) {
        return;
      }

      voicePrefillAppliedRef.current = prefillKey;

      if (source === 'purchase-requisition' && sourceId) {
        const requisition = extendedPurchaseRequisitionDocuments.find((document) => document.id === sourceId);
        if (requisition) {
          handleSelectRequisitionRef.current(requisition);
          return;
        }
      }

      if (!supplierValue) {
        return;
      }

      const normalizedSupplier = supplierValue.trim().toLowerCase();
      const matchedSupplier = supplierOptions.find(
        (supplier) =>
          supplier.value.toLowerCase() === normalizedSupplier ||
          supplier.label.toLowerCase() === normalizedSupplier
      );

      setFormData((current) => ({
        ...current,
        supplierName: matchedSupplier?.value ?? current.supplierName,
      }));
      setRequisitionSearch(supplierValue);
      setIsRequisitionResultsOpen(true);
    };

    applyVoicePrefill();
    window.addEventListener('hashchange', applyVoicePrefill);
    return () => window.removeEventListener('hashchange', applyVoicePrefill);
  }, [editingDocument]);

  const handleToggleGroup = (groupId: string) => {
    setCollapsedGroupIds((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }));
  };

  return (
    <AppShell
      activeLeaf="purchase-order"
      bottomBar={
        <div className="po-create__summary-bar">
          <div className="po-create__summary-shell">
            <div className="po-create__summary-metric po-create__summary-metric--right">
              <span className="po-create__summary-label">Total amount</span>
              <span className="po-create__summary-value">Rs {formatCurrency(grossOrderAmount)}</span>
            </div>

            <div className="po-create__summary-divider" aria-hidden="true" />

            <div className="po-create__summary-metric po-create__summary-metric--emphasis po-create__summary-metric--right">
              <span className="po-create__summary-label">Net order amount</span>

              <div className="po-create__summary-net-row">
                <button
                  type="button"
                  className="po-create__summary-trigger"
                  onClick={() => setIsAmountDrawerOpen(true)}
                  aria-label="Open order amount breakdown"
                >
                  <span className="po-create__summary-value po-create__summary-value--accent">
                    Rs {formatCurrency(totalAmount)}
                  </span>
                  <ChevronRight size={18} className="po-create__summary-chevron" />
                </button>
              </div>

              {totalDiscountAmount > 0 && (
                <div className="po-create__summary-subrow">
                  <span className="po-create__summary-badge">
                    Discount Rs {formatCurrency(totalDiscountAmount)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      }
      onPurchaseOrderClick={onNavigateToPurchaseOrderList}
      onPurchaseRequisitionClick={onNavigateToPurchaseRequisitionList}
    >
      <div className="create-pr-page">
        <div className="create-pr-header">
          <div className="create-pr-header__top">
            <div className="create-pr-header__title-group">
              <a
                href="#/purchase-order"
                onClick={(event) => {
                  event.preventDefault();
                  onBack();
                }}
                className="page-back-button create-pr-header__back"
                aria-label="Back to purchase order list"
              >
                <ArrowLeft size={18} />
              </a>
              <div className="create-pr-header__title-wrap">
                <div className="create-pr-header__title-row">
                  <h2 className="brand-page-title create-pr-header__title">
                    {editingDocument ? 'Edit Purchase Order' : 'New Purchase Order'}
                  </h2>
                  <span className="create-pr-header__status">{editingDocument?.status ?? 'Open'}</span>
                </div>
              </div>
            </div>

            <div className="create-pr-header__meta">
              <div className="create-pr-header__meta-item">
                <span className="create-pr-header__meta-label">Doc no:</span>
                <span className="create-pr-header__meta-value">{formData.number}</span>
              </div>
              <div className="create-pr-header__meta-item">
                <span className="create-pr-header__meta-label">Doc date:</span>
                <span className="create-pr-header__meta-value">{formatDate(formData.orderDate)}</span>
              </div>
              <button type="button" className="create-pr-header__icon-button" aria-label="Edit purchase order metadata">
                <PencilLine size={16} />
              </button>
              <button type="button" className="create-pr-header__icon-button" aria-label="More options">
                <MoreVertical size={16} />
              </button>
            </div>
          </div>

          <div className="create-pr-header__actions">
            <div className="po-create__requisition-picker">
              <div className="po-create__requisition-search">
                <div className="po-create__requisition-search-shell">
                  <Search size={16} className="po-create__requisition-search-icon" />
                  {selectedRequisitions.map((requisition) => (
                    <span key={requisition.id} className="po-create__selected-chip">
                      <span className="po-create__selected-chip-text">{requisition.number}</span>
                      <button
                        type="button"
                        className="po-create__selected-chip-remove"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleRemoveRequisition(requisition.id)}
                        aria-label={`Remove ${requisition.number}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="search"
                    value={requisitionSearch}
                    onChange={(event) => {
                      setRequisitionSearch(event.target.value);
                      setIsRequisitionResultsOpen(true);
                    }}
                    onFocus={() => setIsRequisitionResultsOpen(true)}
                    onBlur={() => {
                      window.setTimeout(() => {
                        setIsRequisitionResultsOpen(false);
                      }, 120);
                    }}
                    className="search-input po-create__requisition-search-input"
                    placeholder={
                      !canConvertRequisitionToOrder
                        ? 'PR to PO conversion disabled'
                        : selectedRequisitions.length > 0
                          ? ''
                          : 'Search purchase requisition'
                    }
                    aria-label="Search purchase requisitions"
                    disabled={
                      !canConvertRequisitionToOrder ||
                      (!purchaseOrderSettings.allowMultiplePurchaseRequisitions && selectedRequisitions.length > 0)
                    }
                  />
                </div>
              </div>

              {isRequisitionResultsOpen && matchingRequisitions.length > 0 && (
                <div className="po-create__requisition-results" role="listbox" aria-label="Purchase requisition results">
                  <table className="po-create__requisition-results-table">
                    <thead>
                      <tr>
                        <th>PR No.</th>
                        <th>Supplier</th>
                        <th>Requester</th>
                        <th>Created Date</th>
                        <th>Aging</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchingRequisitions.map((requisition) => {
                        const conversionStatus = getRequisitionConversionStatus(requisition);
                        const agingInDays = getAgingInDays(requisition.documentDateTime);

                        return (
                          <tr
                            key={requisition.id}
                            className="po-create__requisition-results-row"
                            role="option"
                            tabIndex={0}
                            aria-label={`Select ${requisition.number}`}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleSelectRequisition(requisition)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                handleSelectRequisition(requisition);
                              }
                            }}
                          >
                            <td className="po-create__requisition-results-number">{requisition.number}</td>
                            <td title={requisition.supplierName}>{requisition.supplierName}</td>
                            <td title={requisition.requesterName}>{requisition.requesterName}</td>
                            <td>{formatDate(requisition.documentDateTime)}</td>
                            <td>{agingInDays} day{agingInDays === 1 ? '' : 's'}</td>
                            <td>
                              <span
                                className={cn(
                                  'brand-badge po-create__requisition-option-status',
                                  conversionStatus === 'Partial Converted'
                                    ? 'brand-badge--pending'
                                    : 'brand-badge--draft'
                                )}
                              >
                                {conversionStatus}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {workflowError && <p className="field-error po-create__selection-message">{workflowError}</p>}

            <button type="button" onClick={handleDiscardRequest} className="btn btn--outline">
              Discard
            </button>
            <button type="button" onClick={handleSave} className="btn btn--primary">
              Save
            </button>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-6 px-6 py-3">
          <div className="create-pr-tabs">
            <div className="create-pr-tabs__list" role="tablist" aria-label="Purchase order sections">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'create-pr-tab',
                    activeTab === tab.id ? 'create-pr-tab--active' : 'create-pr-tab--inactive'
                  )}
                >
                  <span className="create-pr-tab__label">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="rounded border border-slate-200 bg-white p-4 space-y-4">
                <div className="brand-section-title font-semibold">Basic Details</div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <FormField label="Linked Requisition">
                    <Input value={formData.linkedRequisitionNumber} readOnly />
                  </FormField>
                  <FormField label="Supplier Name" required>
                    <Select value={formData.supplierName} onChange={(event) => handleFieldChange('supplierName', event.target.value)} options={supplierOptions} />
                  </FormField>
                  <FormField label="Department" required>
                    <Select value={formData.department} onChange={(event) => handleFieldChange('department', event.target.value)} options={departmentOptions} />
                  </FormField>
                  <FormField label="Priority" required>
                    <Select value={formData.priority} onChange={(event) => handleFieldChange('priority', event.target.value)} options={priorityOptions} />
                  </FormField>
                  <FormField label="Place of Supply">
                    <Input value={formData.placeOfSupply} readOnly />
                  </FormField>
                  <FormField label="Payment Mode" required>
                    <Select value={formData.paymentMode} onChange={(event) => handleFieldChange('paymentMode', event.target.value)} options={paymentModeOptions} />
                  </FormField>
                  <FormField label="Payment Terms" required>
                    <Select value={formData.paymentTerms} onChange={(event) => handleFieldChange('paymentTerms', event.target.value)} options={paymentTermsOptions} />
                  </FormField>
                  <FormField label="Valid Till Date" required>
                    <Input
                      type="date"
                      value={formData.validTillDate}
                      min={todayIso}
                      onChange={(event) => handleFieldChange('validTillDate', event.target.value)}
                    />
                  </FormField>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'product' && (
            <div className="create-pr-grid">
              <div className="create-pr-grid__header">
                <div className="create-pr-grid__title-wrap">
                  <div className="create-pr-grid__title-row">
                    <div className="create-pr-grid__title">Order line details</div>
                    <span className="create-pr-grid__count">{lines.length}</span>
                  </div>
                  <p className="create-pr-grid__subtitle">Capture item, quantity, price, and delivery timing in one place.</p>
                </div>

                <button
                  type="button"
                  onClick={handleAddLine}
                  disabled={!canAddProductLine}
                  title={
                    canAddProductLine
                      ? 'Add line'
                      : purchaseOrderSettings.allowManualLines
                        ? 'Complete the current line before adding another line'
                        : 'Manual PO lines are disabled in Business Settings'
                  }
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
                      <th className="create-pr-grid__cell">Action</th>
                      <th className="create-pr-grid__cell">Product Code</th>
                      <th className="create-pr-grid__cell">Product Name</th>
                      <th className="create-pr-grid__cell">HSN/SAC</th>
                      <th className="create-pr-grid__cell">UOM</th>
                      <th className="create-pr-grid__cell">Priority</th>
                      <th className="create-pr-grid__cell">Requirement Date</th>
                      <th className="create-pr-grid__cell">Purchase Rate</th>
                      <th className="create-pr-grid__cell">Available Qty</th>
                      <th className="create-pr-grid__cell">Requested Qty</th>
                      <th className="create-pr-grid__cell">Order Qty</th>
                      <th className="create-pr-grid__cell">Cancelled Qty</th>
                      <th className="create-pr-grid__cell">Received Qty</th>
                      <th className="create-pr-grid__cell">Pending Receipt Qty</th>
                      <th className="create-pr-grid__cell">Invoiced Qty</th>
                      <th className="create-pr-grid__cell">Pending Invoice Qty</th>
                      <th className="create-pr-grid__cell">Discount %</th>
                      <th className="create-pr-grid__cell">Discount Amount</th>
                      <th className="create-pr-grid__cell">Taxable Amount</th>
                      <th className="create-pr-grid__cell">Taxation Columns</th>
                      <th className="create-pr-grid__cell">Remarks</th>
                      <th className="create-pr-grid__cell create-pr-grid__cell--sticky-last create-pr-grid__cell--number">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedLines.map((group) => (
                      <React.Fragment key={group.id}>
                        <tr className="create-pr-grid__group-row">
                          <td className="create-pr-grid__group-cell" colSpan={22}>
                            <div className="create-pr-grid__group-header">
                              <button
                                type="button"
                                className="create-pr-grid__group-title-button"
                                onClick={() => {
                                  if (group.id !== 'manual') {
                                    setPreviewRequisitionId(group.id);
                                  }
                                }}
                                disabled={group.id === 'manual'}
                              >
                                <span className="create-pr-grid__group-title">{group.number}</span>
                              </button>
                              <button
                                type="button"
                                className="create-pr-grid__group-toggle"
                                onClick={() => handleToggleGroup(group.id)}
                                aria-expanded={!collapsedGroupIds[group.id]}
                                aria-label={`${collapsedGroupIds[group.id] ? 'Expand' : 'Collapse'} ${group.number}`}
                              >
                                <span className="create-pr-grid__group-count">{group.lines.length} line(s)</span>
                                {collapsedGroupIds[group.id] ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {!collapsedGroupIds[group.id] && group.lines.map((line, index) => {
                          const productOption = getProductLookupOption(line.productCode);
                          const pendingReceiptQty = getPendingReceiptQty(line);
                          const pendingInvoiceQty = getPendingInvoiceQty(line);
                          const taxableAmount = getTaxableAmount(line);
                          const lineAmount = getLineAmount(line);

                          return (
                            <tr key={line.id}>
                              <td className="create-pr-grid__body-cell">
                                <button type="button" onClick={() => handleDeleteLine(line.id)} className="create-pr-grid__delete" aria-label={`Delete purchase order line ${index + 1}`}>
                                  <Trash2 size={15} />
                                </button>
                              </td>
                              <td className="create-pr-grid__body-cell">
                                <Select
                                  ref={setFieldRef(line.id, 'productCode')}
                                  value={line.productCode}
                                  onChange={(event) => handleLineChange(line.id, 'productCode', event.target.value)}
                                  className="create-pr-grid__control create-pr-grid__control--select"
                                  options={[
                                    { value: '', label: 'Select product' },
                                    ...productLookupOptions.map((product) => ({
                                      value: product.code,
                                      label: product.code,
                                    })),
                                  ]}
                                />
                              </td>
                              <td className="create-pr-grid__body-cell">
                                <Input value={line.productName} readOnly className="create-pr-grid__control create-pr-grid__control--readonly" />
                              </td>
                              <td className="create-pr-grid__body-cell">
                                <Input value={line.hsnSac} readOnly className="create-pr-grid__control create-pr-grid__control--readonly" />
                              </td>
                              <td className="create-pr-grid__body-cell">
                                <Select
                                  value={line.uom}
                                  onChange={(event) => handleLineChange(line.id, 'uom', event.target.value)}
                                  className="create-pr-grid__control create-pr-grid__control--select"
                                  options={[
                                    { value: '', label: 'Select UOM' },
                                    ...(productOption?.uoms.map((uom) => ({ value: uom, label: uom })) ?? []),
                                  ]}
                                />
                              </td>
                              <td className="create-pr-grid__body-cell">
                                <Select
                                  value={line.priority}
                                  onChange={(event) => handleLineChange(line.id, 'priority', event.target.value)}
                                  className="create-pr-grid__control create-pr-grid__control--select"
                                  options={priorityOptions}
                                />
                              </td>
                              <td className="create-pr-grid__body-cell">
                                <Input type="date" value={line.requirementDate} onChange={(event) => handleLineChange(line.id, 'requirementDate', event.target.value)} className="create-pr-grid__control create-pr-grid__control--date" />
                              </td>
                              <td className="create-pr-grid__body-cell">
                                <Select
                                  value={line.purchaseRate}
                                  onChange={(event) => handleLineChange(line.id, 'purchaseRate', event.target.value)}
                                  className="create-pr-grid__control create-pr-grid__control--select"
                                  options={[
                                    { value: '', label: 'Select rate' },
                                    ...(productOption?.purchaseRates.map((rate) => ({ value: rate, label: rate })) ?? []),
                                  ]}
                                />
                              </td>
                              <td className="create-pr-grid__body-cell">
                                <Input value={line.availableQty} readOnly className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number" />
                              </td>
                              <td className="create-pr-grid__body-cell">
                                <Input value={line.requestedQty} readOnly className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number" />
                              </td>
                              <td className="create-pr-grid__body-cell">
                                <Input value={line.orderQty} onChange={(event) => handleLineChange(line.id, 'orderQty', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input create-pr-grid__control--number" placeholder="0.00" />
                              </td>
                              <td className="create-pr-grid__body-cell">
                                <Input value={line.cancelledQty} readOnly className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number" />
                              </td>
                              <td className="create-pr-grid__body-cell">
                                <Input value={line.receivedQty} readOnly className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number" />
                              </td>
                              <td className="create-pr-grid__body-cell">
                                <Input value={formatDecimal(pendingReceiptQty)} readOnly className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number" />
                              </td>
                              <td className="create-pr-grid__body-cell">
                                <Input value={line.invoicedQty} readOnly className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number" />
                              </td>
                              <td className="create-pr-grid__body-cell">
                                <Input value={formatDecimal(pendingInvoiceQty)} readOnly className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number" />
                              </td>
                              <td className="create-pr-grid__body-cell">
                                <Input value={line.discountPercent} onChange={(event) => handleLineChange(line.id, 'discountPercent', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input create-pr-grid__control--number" placeholder="0.00" />
                              </td>
                              <td className="create-pr-grid__body-cell">
                                <Input value={line.discountAmount} onChange={(event) => handleLineChange(line.id, 'discountAmount', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input create-pr-grid__control--number" placeholder="0.00" />
                              </td>
                              <td className="create-pr-grid__body-cell">
                                <Input value={formatDecimal(taxableAmount)} readOnly className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number" />
                              </td>
                              <td className="create-pr-grid__body-cell">
                                <Input value={line.taxationColumns} readOnly className="create-pr-grid__control create-pr-grid__control--readonly" />
                              </td>
                              <td className="create-pr-grid__body-cell">
                                <Input
                                  value={line.remarks}
                                  onChange={(event) => handleLineChange(line.id, 'remarks', event.target.value)}
                                  onKeyDown={(event) => handleRemarksKeyDown(event, line.id)}
                                  className="create-pr-grid__control create-pr-grid__control--input"
                                  placeholder="Remarks"
                                />
                              </td>
                              <td className="create-pr-grid__body-cell create-pr-grid__body-cell--sticky-last create-pr-grid__body-cell--number">
                                <Input value={formatDecimal(lineAmount)} readOnly className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number" />
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="create-pr-grid__footer-cell" colSpan={17}>Total</td>
                      <td className="create-pr-grid__footer-cell create-pr-grid__footer-cell--number">
                        <Input value={formatDecimal(totalDiscountAmount)} readOnly className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number" />
                      </td>
                      <td className="create-pr-grid__footer-cell create-pr-grid__footer-cell--number">
                        <Input value={formatDecimal(totalTaxableAmount)} readOnly className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number" />
                      </td>
                      <td className="create-pr-grid__footer-cell" />
                      <td className="create-pr-grid__footer-cell" />
                      <td className="create-pr-grid__footer-cell create-pr-grid__footer-cell--sticky-last create-pr-grid__footer-cell--number">
                        <Input value={formatDecimal(totalAmount)} readOnly className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number" />
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="brand-section-title font-semibold">Shipping details</div>
                  <ChevronDown size={18} className="text-slate-500" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <FormField label="Ship-to location">
                    <Select
                      value={formData.shipToLocation}
                      onChange={(event) => handleFieldChange('shipToLocation', event.target.value)}
                      options={shipToLocationOptions}
                    />
                  </FormField>
                  <FormField label="Shipping term">
                    <Select
                      value={formData.shippingTerm}
                      onChange={(event) => handleFieldChange('shippingTerm', event.target.value)}
                      options={shippingTermOptions}
                    />
                  </FormField>
                  <FormField label="Shipping method">
                    <Select
                      value={formData.shippingMethod}
                      onChange={(event) => handleFieldChange('shippingMethod', event.target.value)}
                      options={shippingMethodOptions}
                    />
                  </FormField>
                  <FormField label="Shipping instructions">
                    <Input
                      value={formData.shippingInstructions}
                      onChange={(event) => handleFieldChange('shippingInstructions', event.target.value)}
                      placeholder="Enter shipping instructions"
                    />
                  </FormField>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="brand-section-title font-semibold">Insurance details</div>
                  <ChevronDown size={18} className="text-slate-500" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <FormField label="Insurance provider">
                    <Select
                      value={formData.insuranceProvider}
                      onChange={(event) => handleFieldChange('insuranceProvider', event.target.value)}
                      options={insuranceProviderOptions}
                    />
                  </FormField>
                  <FormField label="Contact person">
                    <Input
                      value={formData.insuranceContactPerson}
                      onChange={(event) => handleFieldChange('insuranceContactPerson', event.target.value)}
                      placeholder="Enter contact person"
                    />
                  </FormField>
                  <FormField label="Insurance type">
                    <Select
                      value={formData.insuranceType}
                      onChange={(event) => handleFieldChange('insuranceType', event.target.value)}
                      options={insuranceTypeOptions}
                    />
                  </FormField>
                  <FormField label="Insurance No.">
                    <Input
                      value={formData.insuranceNumber}
                      onChange={(event) => handleFieldChange('insuranceNumber', event.target.value)}
                      placeholder="Enter insurance No."
                    />
                  </FormField>
                  <FormField label="Insurance address">
                    <Select
                      value={formData.insuranceAddress}
                      onChange={(event) => handleFieldChange('insuranceAddress', event.target.value)}
                      options={insuranceAddressOptions}
                    />
                  </FormField>
                </div>
              </div>
            </div>
          )}
        </div>

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
      <SuccessSummaryDialog
        isOpen={isSaveSuccessDialogOpen}
        title="Saved successfully!"
        documentLabel="Purchase order No"
        documentNumber={formData.number}
        sectionTitle="Order Summary"
        items={[
          { label: 'Total part count', value: formatCount(totalPartCount) },
          { label: 'Valid till date', value: formData.validTillDate ? formatDate(formData.validTillDate) : '-' },
          { label: 'Priority', value: formData.priority || '-' },
          { label: 'Total discount', value: `Rs ${formatCurrency(totalDiscountAmount)}` },
          { label: 'Total tax', value: `Rs ${formatCurrency(totalTaxAmount)}` },
        ]}
        totalLabel="Net order amount"
        totalValue={`Rs ${formatCurrency(totalAmount)}`}
        primaryActionLabel="Go to homepage"
        onPrimaryAction={handleSaveSuccessPrimaryAction}
        onPrint={handlePrintSummary}
        onShare={handleShareSummary}
        onClose={handleSaveSuccessClose}
      />
      <AmountBreakdownDrawer
        isOpen={isAmountDrawerOpen}
        title="Order amount details"
        subtitle="Review the amount summary for this purchase order."
        items={[
          { label: 'Gross order amount', value: `Rs ${formatCurrency(grossOrderAmount)}` },
          { label: 'Total discount', value: `Rs ${formatCurrency(totalDiscountAmount)}` },
          { label: 'Taxable amount', value: `Rs ${formatCurrency(totalTaxableAmount)}` },
          { label: 'Total tax', value: `Rs ${formatCurrency(totalTaxAmount)}` },
        ]}
        totalLabel="Net order amount"
        totalValue={`Rs ${formatCurrency(totalAmount)}`}
        note={`This summary is calculated from ${lines.length} line item${lines.length === 1 ? '' : 's'} in the product details grid.`}
        onClose={() => setIsAmountDrawerOpen(false)}
      />
      <PurchaseRequisitionPreviewDrawer
        document={previewRequisition}
        isOpen={Boolean(previewRequisition)}
        onClose={() => setPreviewRequisitionId(null)}
      />
    </AppShell>
  );
};

export default CreatePurchaseOrder;
