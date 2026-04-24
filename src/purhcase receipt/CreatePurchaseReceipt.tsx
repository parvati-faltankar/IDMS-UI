import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, ChevronUp, MoreVertical, Paperclip, PencilLine, Plus, Search, Trash2, X } from 'lucide-react';
import AppShell from '../components/AppShell';
import AmountBreakdownDrawer from '../components/common/AmountBreakdownDrawer';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import SuccessSummaryDialog from '../components/common/SuccessSummaryDialog';
import { FormField, Input, Select } from '../components/common/FormControls';
import { handleGridLastCellTab, hasRequiredGridValues } from '../components/common/gridKeyboard';
import { formatDate } from '../utils/dateFormat';
import { cn } from '../utils/classNames';
import type { PurchaseOrderDocument as PurchaseReceiptDocument } from './purchaseReceiptData';
import {
  extendedPurchaseOrderDocuments,
  type PurchaseOrderDocument as SourcePurchaseOrderDocument,
} from '../purchase order/purchaseOrderData';

interface CreatePurchaseReceiptProps {
  editingDocument?: PurchaseReceiptDocument;
  onBack: () => void;
  onNavigateToPurchaseReceiptList: () => void;
  onNavigateToPurchaseInvoiceList: () => void;
  onNavigateToPurchaseOrderList: () => void;
  onNavigateToPurchaseRequisitionList: () => void;
}

type PriorityValue = '' | 'Low' | 'Medium' | 'High';
type PaymentModeValue = '' | 'Cash' | 'Credit';
type TabKey = 'general' | 'product' | 'delivery';

interface PurchaseReceiptLineForm {
  id: string;
  sourceOrderId: string | null;
  sourceOrderNumber: string;
  sourceOrderSupplier: string;
  sourceOrderDepartment: string;
  sourceOrderStatus: string;
  productCode: string;
  productName: string;
  hsnSac: string;
  uom: string;
  priority: PriorityValue;
  purchaseRate: string;
  orderedQty: string;
  previouslyReceivedQty: string;
  supplierInvoiceQty: string;
  receivedQty: string;
  damageQty: string;
  damageReason: string;
  batchNo: string;
  serialNo: string;
  manufacturingDate: string;
  storageLocation: string;
  boxCount: string;
  remarks: string;
  attachmentName: string;
  discountPercent: string;
  discountAmount: string;
  taxColumns: string;
}

interface ProductLookupOption {
  code: string;
  name: string;
  hsnSac: string;
  uoms: string[];
  purchaseRates: string[];
  taxLabel: string;
  taxRate: number;
  damageReasons: string[];
  storageLocations: string[];
}

interface PurchaseReceiptFormData {
  number: string;
  supplierName: string;
  department: string;
  priority: PriorityValue;
  placeOfSupply: string;
  receivingLocation: string;
  receiveDate: string;
  receivedBy: string;
  paymentMode: PaymentModeValue;
  paymentTerm: string;
  supplierInvoiceNumber: string;
  supplierInvoiceDate: string;
  transporterName: string;
  vehicleNumber: string;
  consignmentNumber: string;
  consignmentDate: string;
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

const paymentTermOptions = [
  { value: '', label: 'Select payment term' },
  { value: 'Net 15', label: 'Net 15' },
  { value: 'Net 30', label: 'Net 30' },
  { value: 'Net 45', label: 'Net 45' },
];

const receivingLocationOptions = [
  { value: '', label: 'Select receiving location' },
  { value: 'Head Office Receiving', label: 'Head Office Receiving' },
  { value: 'North Hub Receiving', label: 'North Hub Receiving' },
  { value: 'South Hub Receiving', label: 'South Hub Receiving' },
  { value: 'East Depot Receiving', label: 'East Depot Receiving' },
];

const receivedByOptions = [
  { value: '', label: 'Select receiver' },
  { value: 'Alex Kumar', label: 'Alex Kumar' },
  { value: 'Neha Sharma', label: 'Neha Sharma' },
  { value: 'Rohit Menon', label: 'Rohit Menon' },
  { value: 'Priya Nair', label: 'Priya Nair' },
];

const transporterOptions = [
  { value: '', label: 'Select transporter' },
  { value: 'Blue Dart Logistics', label: 'Blue Dart Logistics' },
  { value: 'SafeMove Transport', label: 'SafeMove Transport' },
  { value: 'RapidLine Carriers', label: 'RapidLine Carriers' },
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
    taxLabel: 'GST 18%',
    taxRate: 18,
    damageReasons: ['Packing damage', 'Transit damage', 'Surface dent'],
    storageLocations: ['Aisle A-01', 'Aisle A-02'],
  },
  {
    code: 'P-1002',
    name: 'Stainless Steel Fasteners Kit',
    hsnSac: '7318',
    uoms: ['Box', 'Unit'],
    purchaseRates: ['235.00', '265.00'],
    taxLabel: 'GST 12%',
    taxRate: 12,
    damageReasons: ['Seal broken', 'Missing quantity', 'Transit damage'],
    storageLocations: ['Rack B-04', 'Rack B-05'],
  },
  {
    code: 'P-1003',
    name: 'Hydraulic Seal Pack',
    hsnSac: '4016',
    uoms: ['Pack', 'Unit'],
    purchaseRates: ['180.00', '192.00'],
    taxLabel: 'GST 18%',
    taxRate: 18,
    damageReasons: ['Leakage', 'Damaged seal', 'Transit damage'],
    storageLocations: ['Bin C-07', 'Bin C-08'],
  },
  {
    code: 'P-1004',
    name: 'Maintenance Lubricant Drum',
    hsnSac: '2710',
    uoms: ['Drum', 'Unit'],
    purchaseRates: ['395.00', '420.00'],
    taxLabel: 'GST 18%',
    taxRate: 18,
    damageReasons: ['Leakage', 'Seal broken', 'Transit damage'],
    storageLocations: ['Yard D-01', 'Yard D-02'],
  },
  {
    code: 'P-1005',
    name: 'Safety Gloves Pack',
    hsnSac: '6116',
    uoms: ['Pack', 'Unit'],
    purchaseRates: ['32.50', '34.00'],
    taxLabel: 'GST 12%',
    taxRate: 12,
    damageReasons: ['Wet carton', 'Torn packaging', 'Transit damage'],
    storageLocations: ['Rack E-01', 'Rack E-03'],
  },
  {
    code: 'P-1006',
    name: 'Protective Glasses',
    hsnSac: '9004',
    uoms: ['Unit', 'Box'],
    purchaseRates: ['24.67', '26.10'],
    taxLabel: 'GST 12%',
    taxRate: 12,
    damageReasons: ['Lens scratch', 'Broken frame', 'Transit damage'],
    storageLocations: ['Shelf F-02', 'Shelf F-04'],
  },
];

function createEmptyLine(index: number): PurchaseReceiptLineForm {
  return {
    id: `prc-line-${Date.now()}-${index}`,
    sourceOrderId: null,
    sourceOrderNumber: 'Manual line items',
    sourceOrderSupplier: '',
    sourceOrderDepartment: '',
    sourceOrderStatus: 'Manual',
    productCode: '',
    productName: '',
    hsnSac: '',
    uom: '',
    priority: '',
    purchaseRate: '',
    orderedQty: '0.00',
    previouslyReceivedQty: '0.00',
    supplierInvoiceQty: '',
    receivedQty: '',
    damageQty: '0.00',
    damageReason: '',
    batchNo: '',
    serialNo: '',
    manufacturingDate: '',
    storageLocation: '',
    boxCount: '',
    remarks: '',
    attachmentName: '',
    discountPercent: '',
    discountAmount: '',
    taxColumns: '',
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

function normalizePriority(value: string): PriorityValue {
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

function getTaxRate(line: PurchaseReceiptLineForm): number {
  return getProductLookupOption(line.productCode)?.taxRate ?? 0;
}

function getDiscountAmount(line: PurchaseReceiptLineForm): number {
  const taxableBase = parseDecimal(line.receivedQty) * parseDecimal(line.purchaseRate);
  const manualDiscountAmount = parseDecimal(line.discountAmount);

  if (manualDiscountAmount > 0) {
    return manualDiscountAmount;
  }

  const percent = parseDecimal(line.discountPercent);
  if (percent > 0) {
    return (taxableBase * percent) / 100;
  }

  return 0;
}

function getTaxableAmount(line: PurchaseReceiptLineForm): number {
  const taxableBase = parseDecimal(line.receivedQty) * parseDecimal(line.purchaseRate);
  return Math.max(taxableBase - getDiscountAmount(line), 0);
}

function getTotalAmount(line: PurchaseReceiptLineForm): number {
  const taxableAmount = getTaxableAmount(line);
  return taxableAmount + (taxableAmount * getTaxRate(line)) / 100;
}

function getGrossAmount(line: PurchaseReceiptLineForm): number {
  const taxableBase = parseDecimal(line.receivedQty) * parseDecimal(line.purchaseRate);
  return taxableBase + (taxableBase * getTaxRate(line)) / 100;
}

function getShortageQty(line: PurchaseReceiptLineForm): number {
  return Math.max(parseDecimal(line.supplierInvoiceQty) - parseDecimal(line.receivedQty), 0);
}

function getExcessQty(line: PurchaseReceiptLineForm): number {
  return Math.max(parseDecimal(line.receivedQty) - parseDecimal(line.supplierInvoiceQty), 0);
}

function mapSourceOrderLinesToReceiptLines(order: SourcePurchaseOrderDocument): PurchaseReceiptLineForm[] {
  return order.lines.map((line, index) => {
    const productOption = getProductLookupOption(line.itemCode);

    return {
      id: `prc-line-from-po-${order.id}-${index}`,
      sourceOrderId: order.id,
      sourceOrderNumber: order.number,
      sourceOrderSupplier: order.supplierName,
      sourceOrderDepartment: order.department,
      sourceOrderStatus: order.status,
      productCode: line.itemCode,
      productName: line.itemName,
      hsnSac: productOption?.hsnSac ?? '',
      uom: line.uom || productOption?.uoms[0] || '',
      priority: normalizePriority(order.priority),
      purchaseRate: line.unitPrice || productOption?.purchaseRates[0] || '',
      orderedQty: line.quantity || '0.00',
      previouslyReceivedQty: '0.00',
      supplierInvoiceQty: line.quantity || '0.00',
      receivedQty: line.quantity || '0.00',
      damageQty: '0.00',
      damageReason: '',
      batchNo: '',
      serialNo: '',
      manufacturingDate: '',
      storageLocation: productOption?.storageLocations[0] ?? '',
      boxCount: '',
      remarks: line.description ?? '',
      attachmentName: '',
      discountPercent: '',
      discountAmount: '',
      taxColumns: productOption?.taxLabel ?? '',
    };
  });
}

function mapEditingLinesToReceiptLines(document: PurchaseReceiptDocument): PurchaseReceiptLineForm[] {
  return document.lines.map((line, index) => {
    const productOption = getProductLookupOption(line.itemCode);

    return {
      id: `prc-line-edit-${index}`,
      sourceOrderId: null,
      sourceOrderNumber: document.number,
      sourceOrderSupplier: document.supplierName,
      sourceOrderDepartment: document.department,
      sourceOrderStatus: document.status,
      productCode: line.itemCode,
      productName: line.itemName,
      hsnSac: productOption?.hsnSac ?? '',
      uom: line.uom || productOption?.uoms[0] || '',
      priority: normalizePriority(document.priority),
      purchaseRate: line.unitPrice || productOption?.purchaseRates[0] || '',
      orderedQty: line.quantity || '0.00',
      previouslyReceivedQty: '0.00',
      supplierInvoiceQty: line.quantity || '0.00',
      receivedQty: line.quantity || '0.00',
      damageQty: '0.00',
      damageReason: '',
      batchNo: '',
      serialNo: '',
      manufacturingDate: line.expectedDate,
      storageLocation: productOption?.storageLocations[0] ?? '',
      boxCount: '',
      remarks: line.description ?? '',
      attachmentName: '',
      discountPercent: '',
      discountAmount: '',
      taxColumns: productOption?.taxLabel ?? '',
    };
  });
}

function getCommonFieldValue<T>(items: T[], selector: (item: T) => string): string {
  if (items.length === 0) {
    return '';
  }

  const [firstValue, ...restValues] = items.map(selector);
  return restValues.every((value) => value === firstValue) ? firstValue : '';
}

function getHighestPriorityFromOrders(
  orders: SourcePurchaseOrderDocument[]
): PriorityValue {
  if (orders.length === 0) {
    return '';
  }

  const priorityRank: Record<string, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 };
  const highestPriority = orders.reduce<SourcePurchaseOrderDocument['priority']>((currentHighest, order) => {
    return priorityRank[order.priority] > priorityRank[currentHighest] ? order.priority : currentHighest;
  }, orders[0].priority);

  return normalizePriority(highestPriority);
}

function getEarliestDateFromOrders(
  orders: SourcePurchaseOrderDocument[],
  selector: (order: SourcePurchaseOrderDocument) => string
): string {
  const availableDates = orders.map(selector).filter(Boolean);
  if (availableDates.length === 0) {
    return '';
  }

  return [...availableDates].sort()[0];
}

function getOrderConversionStatus(
  order: SourcePurchaseOrderDocument
): 'Open' | 'Partial Converted' | 'Converted' | 'Cancelled' {
  if (order.status === 'Cancelled') {
    return 'Cancelled';
  }

  if (order.status === 'Pending Approval') {
    return 'Partial Converted';
  }

  return 'Open';
}

function canMergeOrdersBySupplier(
  selectedOrders: SourcePurchaseOrderDocument[],
  nextOrder: SourcePurchaseOrderDocument
): boolean {
  if (selectedOrders.length === 0) {
    return true;
  }

  return selectedOrders.every((order) => order.supplierName === nextOrder.supplierName);
}

const CreatePurchaseReceipt: React.FC<CreatePurchaseReceiptProps> = ({
  editingDocument,
  onBack,
  onNavigateToPurchaseReceiptList,
  onNavigateToPurchaseInvoiceList,
  onNavigateToPurchaseOrderList,
  onNavigateToPurchaseRequisitionList,
}) => {
  const todayIso = new Date().toISOString().slice(0, 10);
  const initialFormData: PurchaseReceiptFormData = editingDocument
    ? {
        number: editingDocument.number,
        supplierName: editingDocument.supplierName,
        department: editingDocument.department,
        priority: normalizePriority(editingDocument.priority),
        placeOfSupply: editingDocument.branch,
        receivingLocation: `${editingDocument.branch} Receiving`,
        receiveDate: editingDocument.orderDateTime.slice(0, 10),
        receivedBy: editingDocument.createdBy || editingDocument.buyerName,
        paymentMode: 'Credit',
        paymentTerm: editingDocument.paymentTerms,
        supplierInvoiceNumber: editingDocument.number,
        supplierInvoiceDate: editingDocument.orderDateTime.slice(0, 10),
        transporterName: '',
        vehicleNumber: '',
        consignmentNumber: '',
        consignmentDate: editingDocument.orderDateTime.slice(0, 10),
        insuranceProvider: '',
        insuranceContactPerson: editingDocument.buyerName,
        insuranceType: '',
        insuranceNumber: '',
        insuranceAddress: '',
      }
    : {
        number: `PRC-${new Date().getFullYear()}-00001`,
        supplierName: '',
        department: '',
        priority: '',
        placeOfSupply: '',
        receivingLocation: '',
        receiveDate: todayIso,
        receivedBy: '',
        paymentMode: '',
        paymentTerm: '',
        supplierInvoiceNumber: '',
        supplierInvoiceDate: todayIso,
        transporterName: '',
        vehicleNumber: '',
        consignmentNumber: '',
        consignmentDate: '',
        insuranceProvider: '',
        insuranceContactPerson: '',
        insuranceType: '',
        insuranceNumber: '',
        insuranceAddress: '',
      };

  const [formData, setFormData] = useState<PurchaseReceiptFormData>(initialFormData);
  const [lines, setLines] = useState<PurchaseReceiptLineForm[]>(
    editingDocument ? mapEditingLinesToReceiptLines(editingDocument) : [createEmptyLine(0)]
  );
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [purchaseOrderSearch, setPurchaseOrderSearch] = useState('');
  const [productScanInput, setProductScanInput] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isOrderResultsOpen, setIsOrderResultsOpen] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isSaveSuccessDialogOpen, setIsSaveSuccessDialogOpen] = useState(false);
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Record<string, boolean>>({});
  const [isAmountDrawerOpen, setIsAmountDrawerOpen] = useState(false);
  const [selectionError, setSelectionError] = useState('');
  const focusLineIdRef = useRef<string | null>(null);
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | null>>({});

  const matchingOrders = useMemo(() => {
    const normalizedSearch = purchaseOrderSearch.trim().toLowerCase();
    const availableOrders = extendedPurchaseOrderDocuments.filter((document) => {
      const conversionStatus = getOrderConversionStatus(document);
      return (
        !selectedOrderIds.includes(document.id) &&
        (conversionStatus === 'Open' || conversionStatus === 'Partial Converted')
      );
    });

    if (!normalizedSearch) {
      return availableOrders.slice(0, 6);
    }

    return availableOrders
      .filter((document) =>
        document.number.toLowerCase().includes(normalizedSearch) ||
        document.requisitionNumber.toLowerCase().includes(normalizedSearch) ||
        document.supplierName.toLowerCase().includes(normalizedSearch) ||
        document.buyerName.toLowerCase().includes(normalizedSearch)
      )
      .slice(0, 8);
  }, [purchaseOrderSearch, selectedOrderIds]);

  const selectedOrders = useMemo(
    () =>
      selectedOrderIds
        .map((id) => extendedPurchaseOrderDocuments.find((document) => document.id === id) ?? null)
        .filter((document): document is SourcePurchaseOrderDocument => document !== null),
    [selectedOrderIds]
  );

  const groupedLines = useMemo(() => {
    const groups = new Map<
      string,
      {
        id: string;
        number: string;
        status: string;
        lines: PurchaseReceiptLineForm[];
      }
    >();

    lines.forEach((line) => {
      const groupKey = line.sourceOrderId ?? 'manual';
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          id: groupKey,
          number: line.sourceOrderNumber || 'Manual line items',
          status: line.sourceOrderStatus,
          lines: [],
        });
      }

      groups.get(groupKey)?.lines.push(line);
    });

    return Array.from(groups.values());
  }, [lines]);

  const grossReceiptAmount = useMemo(() => lines.reduce((sum, line) => sum + getGrossAmount(line), 0), [lines]);
  const totalDiscountAmount = useMemo(() => lines.reduce((sum, line) => sum + getDiscountAmount(line), 0), [lines]);
  const totalTaxableAmount = useMemo(() => lines.reduce((sum, line) => sum + getTaxableAmount(line), 0), [lines]);
  const totalAmount = useMemo(() => lines.reduce((sum, line) => sum + getTotalAmount(line), 0), [lines]);
  const totalTaxAmount = useMemo(() => Math.max(totalAmount - totalTaxableAmount, 0), [totalAmount, totalTaxableAmount]);
  const totalPartCount = useMemo(() => lines.reduce((sum, line) => sum + parseDecimal(line.receivedQty), 0), [lines]);
  const isPurchaseReceiptLineComplete = (line: PurchaseReceiptLineForm) =>
    hasRequiredGridValues(line, ['productCode', 'uom', 'purchaseRate', 'supplierInvoiceQty', 'receivedQty']);
  const canAddReceiptLine = lines.length === 0 || isPurchaseReceiptLineComplete(lines[lines.length - 1]);
  const orderSummaryGroups = useMemo(
    () =>
      groupedLines.map((group) => {
        const groupGrossAmount = group.lines.reduce((sum, line) => sum + getGrossAmount(line), 0);
        const groupDiscountAmount = group.lines.reduce((sum, line) => sum + getDiscountAmount(line), 0);
        const groupTaxableAmount = group.lines.reduce((sum, line) => sum + getTaxableAmount(line), 0);
        const groupTotalAmount = group.lines.reduce((sum, line) => sum + getTotalAmount(line), 0);
        const groupTotalTax = Math.max(groupTotalAmount - groupTaxableAmount, 0);
        const groupTotalQty = group.lines.reduce((sum, line) => sum + parseDecimal(line.receivedQty), 0);

        return {
          id: group.id,
          title: group.number,
          subtitle: `${group.lines.length} line(s) | Received qty ${formatCount(groupTotalQty)}`,
          items: [
            { label: 'Gross amount', value: `Rs ${formatCurrency(groupGrossAmount)}` },
            { label: 'Total discount', value: `Rs ${formatCurrency(groupDiscountAmount)}` },
            { label: 'Taxable amount', value: `Rs ${formatCurrency(groupTaxableAmount)}` },
            { label: 'Total tax', value: `Rs ${formatCurrency(groupTotalTax)}` },
            { label: 'Net amount', value: `Rs ${formatCurrency(groupTotalAmount)}`, tone: 'accent' as const },
          ],
        };
      }).filter((group) => group.id !== 'manual'),
    [groupedLines]
  );

  const tabs: Array<{ id: TabKey; label: string }> = [
    { id: 'general', label: 'General Details' },
    { id: 'product', label: 'Product Details' },
    { id: 'delivery', label: 'Delivery Details' },
  ];

  useEffect(() => {
    if (!focusLineIdRef.current) {
      return;
    }

    const field = fieldRefs.current[`${focusLineIdRef.current}:productCode`];
    if (field) {
      field.focus();
    }
    focusLineIdRef.current = null;
  }, [lines]);

  useEffect(() => {
    if (!selectionError) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSelectionError('');
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [selectionError]);

  const setFieldRef =
    (lineId: string, fieldName: 'productCode') =>
    (element: HTMLInputElement | HTMLSelectElement | null) => {
      fieldRefs.current[`${lineId}:${fieldName}`] = element;
    };

  const handleFieldChange = (field: keyof PurchaseReceiptFormData, value: string) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const buildLineFromProductCode = (line: PurchaseReceiptLineForm, value: string): PurchaseReceiptLineForm => {
    const selectedProduct = getProductLookupOption(value);
    const parentOrder = line.sourceOrderId
      ? selectedOrders.find((order) => order.id === line.sourceOrderId) ?? null
      : null;
    const linkedOrderLine = parentOrder?.lines.find((orderLine) => orderLine.itemCode === value);

    const nextLine: PurchaseReceiptLineForm = {
      ...line,
      productCode: value,
      productName: selectedProduct?.name ?? '',
      hsnSac: selectedProduct?.hsnSac ?? '',
      uom: linkedOrderLine?.uom || selectedProduct?.uoms[0] || '',
      priority: normalizePriority(parentOrder?.priority ?? formData.priority),
      purchaseRate: linkedOrderLine?.unitPrice || selectedProduct?.purchaseRates[0] || '',
      orderedQty: linkedOrderLine?.quantity || '0.00',
      supplierInvoiceQty: linkedOrderLine?.quantity || line.supplierInvoiceQty,
      receivedQty: linkedOrderLine?.quantity || line.receivedQty,
      remarks: linkedOrderLine?.description ?? line.remarks,
      storageLocation: selectedProduct?.storageLocations[0] ?? '',
      taxColumns: selectedProduct?.taxLabel ?? '',
    };

    const taxableBase = parseDecimal(nextLine.receivedQty) * parseDecimal(nextLine.purchaseRate);
    const percent = parseDecimal(nextLine.discountPercent);
    nextLine.discountAmount = percent > 0 ? formatDecimal((taxableBase * percent) / 100) : nextLine.discountAmount;

    return nextLine;
  };

  const handleLineChange = (lineId: string, field: keyof PurchaseReceiptLineForm, value: string) => {
    setLines((currentLines) =>
      currentLines.map((line) => {
        if (line.id !== lineId) {
          return line;
        }

        const nextLine: PurchaseReceiptLineForm = {
          ...line,
          [field]: value,
        };

        if (field === 'productCode') {
          return buildLineFromProductCode(nextLine, value);
        }

        if (field === 'damageQty' && parseDecimal(value) <= 0) {
          nextLine.damageReason = '';
        }

        if (
          field === 'discountPercent' ||
          field === 'purchaseRate' ||
          field === 'receivedQty'
        ) {
          const taxableBase = parseDecimal(nextLine.receivedQty) * parseDecimal(nextLine.purchaseRate);
          const percent = parseDecimal(nextLine.discountPercent);
          nextLine.discountAmount = percent > 0 ? formatDecimal((taxableBase * percent) / 100) : nextLine.discountAmount;
        }

        return nextLine;
      })
    );
  };

  const handleAttachmentChange = (lineId: string, fileList: FileList | null) => {
    const nextFileName = fileList?.[0]?.name ?? '';
    setLines((currentLines) =>
      currentLines.map((line) =>
        line.id === lineId
          ? {
              ...line,
              attachmentName: nextFileName,
            }
          : line
      )
    );
  };

  const handleAddLine = () => {
    if (!canAddReceiptLine) {
      return;
    }

    const nextLine = createEmptyLine(lines.length);
    focusLineIdRef.current = nextLine.id;
    setLines((currentLines) => [...currentLines, nextLine]);
  };

  const handleScanProduct = () => {
    const normalizedInput = productScanInput.trim().toLowerCase();
    if (!normalizedInput) {
      const firstBlankLine = lines.find((line) => !line.productCode);
      if (firstBlankLine) {
        focusLineIdRef.current = firstBlankLine.id;
        setLines((currentLines) => [...currentLines]);
        return;
      }

      handleAddLine();
      return;
    }

    const matchedProduct = productLookupOptions.find((product) => product.code.toLowerCase() === normalizedInput)
      ?? productLookupOptions.find((product) => product.code.toLowerCase().includes(normalizedInput))
      ?? productLookupOptions.find((product) => product.name.toLowerCase().includes(normalizedInput));

    if (!matchedProduct) {
      return;
    }

    setLines((currentLines) => {
      const firstBlankLine = currentLines.find((line) => !line.productCode);
      if (firstBlankLine) {
        return currentLines.map((line) =>
          line.id === firstBlankLine.id ? buildLineFromProductCode(line, matchedProduct.code) : line
        );
      }

      const nextLine = buildLineFromProductCode(createEmptyLine(currentLines.length), matchedProduct.code);
      return [...currentLines, nextLine];
    });

    setProductScanInput('');
  };

  const handleDeleteLine = (lineId: string) => {
    setLines((currentLines) => {
      if (currentLines.length === 1) {
        return currentLines;
      }

      return currentLines.filter((line) => line.id !== lineId);
    });
  };

  const handleLastEditableFieldKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, lineId: string) => {
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
      isLineComplete: isPurchaseReceiptLineComplete,
      onAddLine: handleAddLine,
    });
  };

  const handleSave = () => {
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
    onNavigateToPurchaseReceiptList();
  };

  const handleSaveSuccessClose = () => {
    setIsSaveSuccessDialogOpen(false);
  };

  const handleSaveSuccessPrimaryAction = () => {
    setIsSaveSuccessDialogOpen(false);
    onNavigateToPurchaseReceiptList();
  };

  const handlePrintSummary = () => {
    window.print();
  };

  const handleShareSummary = async () => {
    const summaryText = [
      'Purchase receipt saved successfully',
      `Purchase receipt No: ${formData.number}`,
      `Total part count: ${formatCount(totalPartCount)}`,
      `Receive date: ${formData.receiveDate ? formatDate(formData.receiveDate) : '-'}`,
      `Priority: ${formData.priority || '-'}`,
      `Total discount: Rs ${formatCurrency(totalDiscountAmount)}`,
      `Total tax: Rs ${formatCurrency(totalTaxAmount)}`,
      `Net receipt amount: Rs ${formatCurrency(totalAmount)}`,
    ].join('\n');

    if (navigator.share) {
      await navigator.share({
        title: 'Purchase receipt summary',
        text: summaryText,
      });
      return;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(summaryText);
    }
  };

  const syncFormDataFromOrders = (
    orders: SourcePurchaseOrderDocument[],
    fallback: PurchaseReceiptFormData
  ): PurchaseReceiptFormData => {
    if (orders.length === 0) {
      return fallback;
    }

    return {
      ...fallback,
      supplierName: getCommonFieldValue(orders, (order) => order.supplierName),
      department: getCommonFieldValue(orders, (order) => order.department),
      priority: getHighestPriorityFromOrders(orders),
      placeOfSupply: getCommonFieldValue(orders, (order) => order.branch),
      receivingLocation: getCommonFieldValue(orders, (order) => `${order.branch} Receiving`),
      receiveDate: fallback.receiveDate || todayIso,
      receivedBy: getCommonFieldValue(orders, (order) => order.createdBy || order.buyerName),
      paymentMode: getCommonFieldValue(orders, () => 'Credit') as PaymentModeValue,
      paymentTerm: getCommonFieldValue(orders, (order) => order.paymentTerms),
      supplierInvoiceNumber: orders.length === 1 ? fallback.supplierInvoiceNumber || orders[0].number : fallback.supplierInvoiceNumber,
      supplierInvoiceDate: fallback.supplierInvoiceDate || getEarliestDateFromOrders(orders, (order) => order.orderDateTime.slice(0, 10)),
      insuranceContactPerson: getCommonFieldValue(orders, (order) => order.buyerName),
    };
  };

  const handleSelectOrder = (order: SourcePurchaseOrderDocument) => {
    if (selectedOrderIds.includes(order.id)) {
      return;
    }

    if (!canMergeOrdersBySupplier(selectedOrders, order)) {
      const currentSupplier = selectedOrders[0]?.supplierName;
      setSelectionError(
        currentSupplier
          ? `Only purchase orders from ${currentSupplier} can be selected together in one receipt.`
          : 'Only purchase orders from the same supplier can be selected together in one receipt.'
      );
      setIsOrderResultsOpen(true);
      return;
    }

    const nextSelectedOrders = [...selectedOrders, order];
    setSelectedOrderIds(nextSelectedOrders.map((document) => document.id));
    setPurchaseOrderSearch('');
    setIsOrderResultsOpen(true);
    setSelectionError('');
    setFormData((current) => syncFormDataFromOrders(nextSelectedOrders, current));
    setLines((currentLines) => {
      const baseLines =
        currentLines.length === 1 &&
        currentLines[0].sourceOrderId === null &&
        !currentLines[0].productCode &&
        !currentLines[0].productName
          ? []
          : currentLines;

      return [...baseLines, ...mapSourceOrderLinesToReceiptLines(order)];
    });
  };

  const handleRemoveOrder = (orderId: string) => {
    const nextSelectedOrders = selectedOrders.filter((order) => order.id !== orderId);
    setSelectedOrderIds(nextSelectedOrders.map((order) => order.id));
    setFormData((current) => syncFormDataFromOrders(nextSelectedOrders, current));
    setLines((currentLines) => {
      const remainingLines = currentLines.filter((line) => line.sourceOrderId !== orderId);
      return remainingLines.length > 0 ? remainingLines : [createEmptyLine(0)];
    });
  };

  const handleToggleGroup = (groupId: string) => {
    setCollapsedGroupIds((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }));
  };

  const documentDate = formData.receiveDate ? formatDate(formData.receiveDate) : formatDate(todayIso);

  return (
    <AppShell
      activeLeaf="purchase-receipt"
      bottomBar={
        <div className="po-create__summary-bar">
          <div className="po-create__summary-shell">
            <div className="po-create__summary-metric po-create__summary-metric--right">
              <span className="po-create__summary-label">Total amount</span>
              <span className="po-create__summary-value">Rs {formatCurrency(grossReceiptAmount)}</span>
            </div>

            <div className="po-create__summary-divider" aria-hidden="true" />

            <div className="po-create__summary-metric po-create__summary-metric--emphasis po-create__summary-metric--right">
              <span className="po-create__summary-label">Net receipt amount</span>

              <div className="po-create__summary-net-row">
                <button
                  type="button"
                  className="po-create__summary-trigger"
                  onClick={() => setIsAmountDrawerOpen(true)}
                  aria-label="Open receipt amount breakdown"
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
      onPurchaseReceiptClick={onNavigateToPurchaseReceiptList}
      onPurchaseInvoiceClick={onNavigateToPurchaseInvoiceList}
      onPurchaseOrderClick={onNavigateToPurchaseOrderList}
      onPurchaseRequisitionClick={onNavigateToPurchaseRequisitionList}
    >
      <div className="create-pr-page">
        <div className="create-pr-header">
          <div className="create-pr-header__top">
            <div className="create-pr-header__title-group">
              <a
                href="#/purchasereceiptlist"
                onClick={(event) => {
                  event.preventDefault();
                  onBack();
                }}
                className="page-back-button create-pr-header__back"
                aria-label="Back to purchase receipt list"
              >
                <ArrowLeft size={18} />
              </a>
              <div className="create-pr-header__title-wrap">
                <div className="create-pr-header__title-row">
                  <h2 className="brand-page-title create-pr-header__title">
                    {editingDocument ? 'Edit Purchase Receipt' : 'New Purchase Receipt'}
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
                <span className="create-pr-header__meta-value">{documentDate}</span>
              </div>
              <button type="button" className="create-pr-header__icon-button" aria-label="Edit purchase receipt metadata">
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
                  {selectedOrders.map((order) => (
                    <span key={order.id} className="po-create__selected-chip">
                      <span className="po-create__selected-chip-text">{order.number}</span>
                      <button
                        type="button"
                        className="po-create__selected-chip-remove"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleRemoveOrder(order.id)}
                        aria-label={`Remove ${order.number}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="search"
                    value={purchaseOrderSearch}
                    onChange={(event) => {
                      setPurchaseOrderSearch(event.target.value);
                      setIsOrderResultsOpen(true);
                    }}
                    onFocus={() => setIsOrderResultsOpen(true)}
                    onBlur={() => {
                      window.setTimeout(() => {
                        setIsOrderResultsOpen(false);
                      }, 120);
                    }}
                    className="search-input po-create__requisition-search-input"
                    placeholder={selectedOrders.length > 0 ? '' : 'Search purchase order'}
                    aria-label="Search purchase orders"
                  />
                </div>
              </div>

              {selectionError && (
                <div className="brand-message brand-message--error po-create__selection-message" role="alert">
                  {selectionError}
                </div>
              )}

              {isOrderResultsOpen && matchingOrders.length > 0 && (
                <div className="po-create__requisition-results" role="listbox" aria-label="Purchase order results">
                  {matchingOrders.map((order) => (
                    (() => {
                      const conversionStatus = getOrderConversionStatus(order);

                      return (
                        <button
                          key={order.id}
                          type="button"
                          className="po-create__requisition-option"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSelectOrder(order)}
                        >
                          <span className="po-create__requisition-option-header">
                            <span className="po-create__requisition-option-title">{order.number}</span>
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
                          </span>
                          <span className="po-create__requisition-option-meta">
                            {order.supplierName} | {formatDate(order.orderDateTime.slice(0, 10))} | {order.lines.length} line(s)
                          </span>
                        </button>
                      );
                    })()
                  ))}
                </div>
              )}
            </div>

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
            <div className="create-pr-tabs__list" role="tablist" aria-label="Purchase receipt sections">
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
                  <FormField label="Receiving Location" required>
                    <Select value={formData.receivingLocation} onChange={(event) => handleFieldChange('receivingLocation', event.target.value)} options={receivingLocationOptions} />
                  </FormField>
                  <FormField label="Receive Date" required>
                    <Input type="date" value={formData.receiveDate} onChange={(event) => handleFieldChange('receiveDate', event.target.value)} />
                  </FormField>
                  <FormField label="Received By" required>
                    <Select value={formData.receivedBy} onChange={(event) => handleFieldChange('receivedBy', event.target.value)} options={receivedByOptions} />
                  </FormField>
                  <FormField label="Payment Mode" required>
                    <Select value={formData.paymentMode} onChange={(event) => handleFieldChange('paymentMode', event.target.value)} options={paymentModeOptions} />
                  </FormField>
                  <FormField label="Payment Term" required>
                    <Select value={formData.paymentTerm} onChange={(event) => handleFieldChange('paymentTerm', event.target.value)} options={paymentTermOptions} />
                  </FormField>
                  <FormField label="Supplier Invoice Number">
                    <Input value={formData.supplierInvoiceNumber} onChange={(event) => handleFieldChange('supplierInvoiceNumber', event.target.value)} placeholder="Enter supplier invoice number" />
                  </FormField>
                  <FormField label="Supplier Invoice Date">
                    <Input type="date" value={formData.supplierInvoiceDate} onChange={(event) => handleFieldChange('supplierInvoiceDate', event.target.value)} />
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
                    <div className="create-pr-grid__title">Receipt line details</div>
                    <span className="create-pr-grid__count">{lines.length}</span>
                  </div>
                  <p className="create-pr-grid__subtitle">Capture supplier invoice, received stock, and receipt-level adjustments in one compact grid.</p>
                </div>

                <div className="create-pr-grid__toolbar">
                  <div className="create-pr-grid__scan-search">
                    <Search size={15} className="create-pr-grid__scan-search-icon" />
                    <input
                      type="search"
                      value={productScanInput}
                      onChange={(event) => setProductScanInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleScanProduct();
                        }
                      }}
                      className="search-input create-pr-grid__scan-search-input"
                      placeholder="Scan or search product"
                      aria-label="Scan or search product"
                    />
                  </div>
                  <button type="button" onClick={handleAddLine} disabled={!canAddReceiptLine} className="btn btn--outline btn--icon-left create-pr-grid__add-button"><Plus size={14} />Add line</button>
                </div>
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
                      <th className="create-pr-grid__cell">Purchase Rate</th>
                      <th className="create-pr-grid__cell">Ordered Qty</th>
                      <th className="create-pr-grid__cell">Previously Received Qty</th>
                      <th className="create-pr-grid__cell">Supplier Invoice Qty</th>
                      <th className="create-pr-grid__cell">Received Qty</th>
                      <th className="create-pr-grid__cell">Shortage Qty</th>
                      <th className="create-pr-grid__cell">Excess Qty</th>
                      <th className="create-pr-grid__cell">Damage Qty</th>
                      <th className="create-pr-grid__cell">Damage Reason</th>
                      <th className="create-pr-grid__cell">Batch No</th>
                      <th className="create-pr-grid__cell">Serial No</th>
                      <th className="create-pr-grid__cell">Manufacturing Date</th>
                      <th className="create-pr-grid__cell">Storage Location</th>
                      <th className="create-pr-grid__cell">Box Count</th>
                      <th className="create-pr-grid__cell">Remarks</th>
                      <th className="create-pr-grid__cell">Attachment</th>
                      <th className="create-pr-grid__cell">Discount %</th>
                      <th className="create-pr-grid__cell">Discount Amount</th>
                      <th className="create-pr-grid__cell">Taxable Amount</th>
                      <th className="create-pr-grid__cell">Tax Columns</th>
                      <th className="create-pr-grid__cell create-pr-grid__cell--sticky-last create-pr-grid__cell--number">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedLines.map((group) => (
                      <React.Fragment key={group.id}>
                        <tr className="create-pr-grid__group-row">
                          <td className="create-pr-grid__group-cell" colSpan={27}>
                            <div className="create-pr-grid__group-header">
                              <span className="create-pr-grid__group-title">{group.number}</span>
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
                          const shortageQty = getShortageQty(line);
                          const excessQty = getExcessQty(line);
                          const taxableAmount = getTaxableAmount(line);
                          const lineAmount = getTotalAmount(line);

                          return (
                            <tr key={line.id}>
                              <td className="create-pr-grid__body-cell"><button type="button" onClick={() => handleDeleteLine(line.id)} className="create-pr-grid__delete" aria-label={`Delete purchase receipt line ${index + 1}`}><Trash2 size={15} /></button></td>
                              <td className="create-pr-grid__body-cell"><Select ref={setFieldRef(line.id, 'productCode')} value={line.productCode} onChange={(event) => handleLineChange(line.id, 'productCode', event.target.value)} className="create-pr-grid__control create-pr-grid__control--select" options={[{ value: '', label: 'Select product' }, ...productLookupOptions.map((product) => ({ value: product.code, label: product.code }))]} /></td>
                              <td className="create-pr-grid__body-cell"><Input value={line.productName} readOnly className="create-pr-grid__control create-pr-grid__control--readonly" /></td>
                              <td className="create-pr-grid__body-cell"><Input value={line.hsnSac} readOnly className="create-pr-grid__control create-pr-grid__control--readonly" /></td>
                              <td className="create-pr-grid__body-cell"><Select value={line.uom} onChange={(event) => handleLineChange(line.id, 'uom', event.target.value)} className="create-pr-grid__control create-pr-grid__control--select" options={[{ value: '', label: 'Select UOM' }, ...(productOption?.uoms.map((uom) => ({ value: uom, label: uom })) ?? [])]} /></td>
                              <td className="create-pr-grid__body-cell"><Select value={line.priority} onChange={(event) => handleLineChange(line.id, 'priority', event.target.value)} className="create-pr-grid__control create-pr-grid__control--select" options={priorityOptions} /></td>
                              <td className="create-pr-grid__body-cell"><Select value={line.purchaseRate} onChange={(event) => handleLineChange(line.id, 'purchaseRate', event.target.value)} className="create-pr-grid__control create-pr-grid__control--select" options={[{ value: '', label: 'Select rate' }, ...(productOption?.purchaseRates.map((rate) => ({ value: rate, label: rate })) ?? [])]} /></td>
                              <td className="create-pr-grid__body-cell"><Input value={line.orderedQty} readOnly className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number" /></td>
                              <td className="create-pr-grid__body-cell"><Input value={line.previouslyReceivedQty} readOnly className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number" /></td>
                              <td className="create-pr-grid__body-cell"><Input value={line.supplierInvoiceQty} onChange={(event) => handleLineChange(line.id, 'supplierInvoiceQty', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input create-pr-grid__control--number" placeholder="0.00" inputMode="decimal" /></td>
                              <td className="create-pr-grid__body-cell"><Input value={line.receivedQty} onChange={(event) => handleLineChange(line.id, 'receivedQty', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input create-pr-grid__control--number" placeholder="0.00" inputMode="decimal" /></td>
                              <td className="create-pr-grid__body-cell"><Input value={formatDecimal(shortageQty)} readOnly className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number" /></td>
                              <td className="create-pr-grid__body-cell"><Input value={formatDecimal(excessQty)} readOnly className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number" /></td>
                              <td className="create-pr-grid__body-cell"><Input value={line.damageQty} onChange={(event) => handleLineChange(line.id, 'damageQty', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input create-pr-grid__control--number" placeholder="0.00" inputMode="decimal" /></td>
                              <td className="create-pr-grid__body-cell"><Select value={line.damageReason} onChange={(event) => handleLineChange(line.id, 'damageReason', event.target.value)} disabled={parseDecimal(line.damageQty) <= 0} className="create-pr-grid__control create-pr-grid__control--select" options={[{ value: '', label: 'Select reason' }, ...(productOption?.damageReasons.map((reason) => ({ value: reason, label: reason })) ?? [])]} /></td>
                              <td className="create-pr-grid__body-cell"><Input value={line.batchNo} onChange={(event) => handleLineChange(line.id, 'batchNo', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input" placeholder="Batch No" /></td>
                              <td className="create-pr-grid__body-cell"><Input value={line.serialNo} onChange={(event) => handleLineChange(line.id, 'serialNo', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input" placeholder="Serial No" /></td>
                              <td className="create-pr-grid__body-cell"><Input type="date" value={line.manufacturingDate} onChange={(event) => handleLineChange(line.id, 'manufacturingDate', event.target.value)} className="create-pr-grid__control create-pr-grid__control--date" /></td>
                              <td className="create-pr-grid__body-cell"><Select value={line.storageLocation} onChange={(event) => handleLineChange(line.id, 'storageLocation', event.target.value)} className="create-pr-grid__control create-pr-grid__control--select" options={[{ value: '', label: 'Select location' }, ...(productOption?.storageLocations.map((location) => ({ value: location, label: location })) ?? [])]} /></td>
                              <td className="create-pr-grid__body-cell"><Input value={line.boxCount} onChange={(event) => handleLineChange(line.id, 'boxCount', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input create-pr-grid__control--number" placeholder="0" inputMode="numeric" /></td>
                              <td className="create-pr-grid__body-cell"><Input value={line.remarks} onChange={(event) => handleLineChange(line.id, 'remarks', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input" placeholder="Remarks" /></td>
                              <td className="create-pr-grid__body-cell">
                                <div className="create-pr-grid__attachment">
                                  <label
                                    className={cn(
                                      'create-pr-grid__attachment-trigger',
                                      line.attachmentName && 'create-pr-grid__attachment-trigger--active'
                                    )}
                                    aria-label={line.attachmentName ? `Replace attachment for line ${index + 1}` : `Add attachment for line ${index + 1}`}
                                  >
                                    <Paperclip size={15} />
                                    <input type="file" className="hidden" onChange={(event) => handleAttachmentChange(line.id, event.target.files)} />
                                  </label>
                                  <span className="create-pr-grid__attachment-name" title={line.attachmentName || 'No file attached'}>
                                    {line.attachmentName || 'No file'}
                                  </span>
                                </div>
                              </td>
                              <td className="create-pr-grid__body-cell"><Input value={line.discountPercent} onChange={(event) => handleLineChange(line.id, 'discountPercent', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input create-pr-grid__control--number" placeholder="0.00" inputMode="decimal" /></td>
                              <td className="create-pr-grid__body-cell"><Input value={line.discountAmount} onChange={(event) => handleLineChange(line.id, 'discountAmount', event.target.value)} onKeyDown={(event) => handleLastEditableFieldKeyDown(event, line.id)} className="create-pr-grid__control create-pr-grid__control--input create-pr-grid__control--number" placeholder="0.00" inputMode="decimal" /></td>
                              <td className="create-pr-grid__body-cell"><Input value={formatDecimal(taxableAmount)} readOnly className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number" /></td>
                              <td className="create-pr-grid__body-cell"><Input value={line.taxColumns} readOnly className="create-pr-grid__control create-pr-grid__control--readonly" /></td>
                              <td className="create-pr-grid__body-cell create-pr-grid__body-cell--sticky-last create-pr-grid__body-cell--number"><Input value={formatDecimal(lineAmount)} readOnly className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number" /></td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="create-pr-grid__footer-cell" colSpan={22}>Total</td>
                      <td className="create-pr-grid__footer-cell" />
                      <td className="create-pr-grid__footer-cell create-pr-grid__footer-cell--number"><Input value={formatDecimal(totalDiscountAmount)} readOnly tabIndex={-1} className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number" /></td>
                      <td className="create-pr-grid__footer-cell create-pr-grid__footer-cell--number"><Input value={formatDecimal(totalTaxableAmount)} readOnly tabIndex={-1} className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number" /></td>
                      <td className="create-pr-grid__footer-cell" />
                      <td className="create-pr-grid__footer-cell create-pr-grid__footer-cell--sticky-last create-pr-grid__footer-cell--number"><Input value={formatDecimal(totalAmount)} readOnly tabIndex={-1} className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number" /></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
                <div className="flex items-center justify-between gap-3"><div className="brand-section-title font-semibold">Transport details</div><ChevronDown size={18} className="text-slate-500" /></div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <FormField label="Transporter Name"><Select value={formData.transporterName} onChange={(event) => handleFieldChange('transporterName', event.target.value)} options={transporterOptions} /></FormField>
                  <FormField label="Vehicle Number"><Input value={formData.vehicleNumber} onChange={(event) => handleFieldChange('vehicleNumber', event.target.value)} placeholder="Enter vehicle number" /></FormField>
                  <FormField label="LR, AWB, Consignment Number"><Input value={formData.consignmentNumber} onChange={(event) => handleFieldChange('consignmentNumber', event.target.value)} placeholder="Enter reference number" /></FormField>
                  <FormField label="LR, AWB Date"><Input type="date" value={formData.consignmentDate} onChange={(event) => handleFieldChange('consignmentDate', event.target.value)} /></FormField>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
                <div className="flex items-center justify-between gap-3"><div className="brand-section-title font-semibold">Insurance details</div><ChevronDown size={18} className="text-slate-500" /></div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <FormField label="Insurance provider"><Select value={formData.insuranceProvider} onChange={(event) => handleFieldChange('insuranceProvider', event.target.value)} options={insuranceProviderOptions} /></FormField>
                  <FormField label="Contact person"><Input value={formData.insuranceContactPerson} onChange={(event) => handleFieldChange('insuranceContactPerson', event.target.value)} placeholder="Enter contact person" /></FormField>
                  <FormField label="Insurance type"><Select value={formData.insuranceType} onChange={(event) => handleFieldChange('insuranceType', event.target.value)} options={insuranceTypeOptions} /></FormField>
                  <FormField label="Insurance No."><Input value={formData.insuranceNumber} onChange={(event) => handleFieldChange('insuranceNumber', event.target.value)} placeholder="Enter insurance No." /></FormField>
                  <FormField label="Insurance address"><Select value={formData.insuranceAddress} onChange={(event) => handleFieldChange('insuranceAddress', event.target.value)} options={insuranceAddressOptions} /></FormField>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmationDialog isOpen={isDiscardDialogOpen} title="Discard changes?" description="Are you sure you want to discard? All your entered information will be cleared." confirmLabel="Yes" cancelLabel="No" onConfirm={handleDiscardConfirm} onClose={handleDiscardClose} />
      <SuccessSummaryDialog
        isOpen={isSaveSuccessDialogOpen}
        title="Saved successfully!"
        documentLabel="Purchase receipt No"
        documentNumber={formData.number}
        sectionTitle="Receipt Summary"
        items={[
          { label: 'Total part count', value: formatCount(totalPartCount) },
          { label: 'Receive date', value: formData.receiveDate ? formatDate(formData.receiveDate) : '-' },
          { label: 'Priority', value: formData.priority || '-' },
          { label: 'Total discount', value: `Rs ${formatCurrency(totalDiscountAmount)}` },
          { label: 'Total tax', value: `Rs ${formatCurrency(totalTaxAmount)}` },
        ]}
        totalLabel="Net receipt amount"
        totalValue={`Rs ${formatCurrency(totalAmount)}`}
        primaryActionLabel="Go to homepage"
        onPrimaryAction={handleSaveSuccessPrimaryAction}
        onPrint={handlePrintSummary}
        onShare={handleShareSummary}
        onClose={handleSaveSuccessClose}
      />
      <AmountBreakdownDrawer
        isOpen={isAmountDrawerOpen}
        title="Receipt amount details"
        subtitle="Review the amount summary for this purchase receipt."
        items={[
          { label: 'Total part count', value: formatCount(totalPartCount) },
          { label: 'Receive date', value: formData.receiveDate ? formatDate(formData.receiveDate) : '-' },
          { label: 'Priority', value: formData.priority || '-' },
          { label: 'Gross receipt amount', value: `Rs ${formatCurrency(grossReceiptAmount)}` },
          { label: 'Total discount', value: `Rs ${formatCurrency(totalDiscountAmount)}` },
          { label: 'Taxable amount', value: `Rs ${formatCurrency(totalTaxableAmount)}` },
          { label: 'Total tax', value: `Rs ${formatCurrency(totalTaxAmount)}` },
        ]}
        groups={orderSummaryGroups.length > 0 ? orderSummaryGroups : undefined}
        totalLabel="Net receipt amount"
        totalValue={`Rs ${formatCurrency(totalAmount)}`}
        note={`This summary is calculated from ${lines.length} line item${lines.length === 1 ? '' : 's'} in the product details grid.`}
        onClose={() => setIsAmountDrawerOpen(false)}
      />
    </AppShell>
  );
};

export default CreatePurchaseReceipt;
