import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import AppShell from '../../components/common/AppShell';
import AmountBreakdownDrawer from '../../components/common/AmountBreakdownDrawer';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import SuccessSummaryDialog from '../../components/common/SuccessSummaryDialog';
import StatusBadge from '../../components/common/StatusBadge';
import { FormField, Input, Select } from '../../components/common/FormControls';
import { handleGridLastCellTab, hasRequiredGridValues } from '../../components/common/gridKeyboard';
import { cn } from '../../utils/classNames';
import { formatDate } from '../../utils/dateFormat';
import { useDocumentPrint } from '../../print-builder/useDocumentPrint';
import type { SaleOrderDocument } from './saleOrderV2Data';
import { createSaleOrderId, createSaleOrderNumber, upsertSaleOrder } from '../../stores/documentStore';
import { useRuleEngine } from '../../engine/hooks/useRuleEngine';
import { useSaleOrderWorkflow } from '../../engine/hooks/useSaleOrderWorkflow';
import { useWorkflowHistory } from '../../engine/hooks/useWorkflowHistory';
import {
  WorkflowStatusBar,
  RuleEngineErrorSummary,
  EngineOfflineBanner,
  WorkflowHistoryDrawer,
  AuditTrailPanel,
  ApprovalActionPanel,
  HoldDialog,
  ReleaseDialog,
  CancelDialog,
  AmendDialog,
} from '../../engine/components';

type SaleOrderTabKey =
  | 'customer-order'
  | 'product-detail'
  | 'payment-finance'
  | 'delivery-shipping'
  | 'workflow-history';
type SalePriority = '' | 'Low' | 'Medium' | 'High';
type SaleOrderStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Cancelled';
type SalePaymentMode = '' | 'Cash' | 'Finance';

interface SaleOrderLineForm {
  id: string;
  productCode: string;
  productName: string;
  hsnSac: string;
  uom: string;
  requestedDate: string;
  fulfillmentDate: string;
  priority: SalePriority;
  warehouse: string;
  locationBin: string;
  serialNumber: string;
  batchLotNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  rate: string;
  orderQuantity: string;
  cancelledQuantity: string;
  allocatedQuantity: string;
  invoicedQuantity: string;
  deliveryQuantity: string;
  returnedQuantity: string;
  discountPercent: string;
  discountAmount: string;
  convertedQuantity: string;
  remark: string;
}

interface SaleOrderFormData {
  number: string;
  documentDate: string;
  customer: string;
  orderSource: string;
  salesExecutive: string;
  requestedDeliveryDate: string;
  validTillDate: string;
  placeOfSupply: string;
  promisedDeliveryDate: string;
  priority: SalePriority;
  status: SaleOrderStatus;
  paymentMode: SalePaymentMode;
  paymentMethod: string;
  paymentTerm: string;
  advancePayment: string;
  paymentRemarks: string;
  financer: string;
  downPayment: string;
  financeAmount: string;
  emiAmount: string;
  balanceAmount: string;
  tenure: string;
  emiInterestRate: string;
  insuranceProvider: string;
  policyNumber: string;
  policyDate: string;
  insuranceRemarks: string;
  deliveryTerm: string;
  deliveryType: string;
  deliverySlot: string;
  deliveryAddress: string;
  deliveryInstruction: string;
  shippingAddress: string;
  shippingTerm: string;
  shippingMethod: string;
  shippingInstructions: string;
  exchangeCategory: string;
  exchangeProductCode: string;
  exchangeProductName: string;
  exchangeBrand: string;
  exchangeModel: string;
  exchangeVariant: string;
  exchangeSerialNumber: string;
  exchangeCondition: string;
  exchangeQuantity: string;
  exchangeInspectionDate: string;
  exchangeAssessedBy: string;
  exchangeExpectedValue: string;
  exchangeApprovedValue: string;
  exchangePickupLocation: string;
  exchangePickupDate: string;
  exchangeSettlementMode: string;
  exchangeReferenceNotes: string;
  exchangeRemarks: string;
}

interface CreateSaleOrderProps {
  editingDocument?: SaleOrderDocument;
  onBack: () => void;
  onNavigateToSaleOrderList: () => void;
}

interface ProductLookupOption {
  code: string;
  name: string;
  hsnSac: string;
  uoms: string[];
  rate: string;
  taxLabel: string;
  taxRate: number;
}

interface CustomerLookupOption {
  code: string;
  value: string;
  label: string;
  email: string;
  mobileNumber: string;
  secondaryNumber: string;
  address: string;
  customerType: string;
  gstin: string;
  isPrimaryVerified: boolean;
}

const customerOptions: CustomerLookupOption[] = [
  {
    code: 'CUST-1001',
    value: 'Galaxy Motors',
    label: 'Galaxy Motors',
    email: 'procurement@galaxymotors.com',
    mobileNumber: '+91 98765 41001',
    secondaryNumber: '+91 91234 51001',
    address: 'Plot 18, MIDC Auto Cluster, Pimpri-Chinchwad, Pune, Maharashtra - 411019',
    customerType: 'OEM Dealer',
    gstin: '27AABCG1100R1Z8',
    isPrimaryVerified: true,
  },
  {
    code: 'CUST-1002',
    value: 'Velocity Auto Hub',
    label: 'Velocity Auto Hub',
    email: 'orders@velocityautohub.com',
    mobileNumber: '+91 98765 41002',
    secondaryNumber: '+91 91234 51002',
    address: 'B-24, Sector 9 Industrial Lane, Dwarka, New Delhi - 110077',
    customerType: 'Retail Network',
    gstin: '07AAECV2210B1Z4',
    isPrimaryVerified: true,
  },
  {
    code: 'CUST-1003',
    value: 'Prime Wheels',
    label: 'Prime Wheels',
    email: 'sourcing@primewheels.com',
    mobileNumber: '+91 98765 41003',
    secondaryNumber: '+91 91234 51003',
    address: '52, Outer Ring Road, Yelahanka Trade Zone, Bengaluru, Karnataka - 560064',
    customerType: 'Distribution Partner',
    gstin: '29AAECP5524N1Z6',
    isPrimaryVerified: true,
  },
  {
    code: 'CUST-1004',
    value: 'Metro Drive',
    label: 'Metro Drive',
    email: 'supply@metrodrive.com',
    mobileNumber: '+91 98765 41004',
    secondaryNumber: '+91 91234 51004',
    address: '14, GST Service Corridor, Ambattur Estate, Chennai, Tamil Nadu - 600058',
    customerType: 'Fleet Customer',
    gstin: '33AAFCM7782K1Z2',
    isPrimaryVerified: false,
  },
];

const orderSourceOptions = [
  { value: '', label: 'Select order source' },
  { value: 'Dealer Portal', label: 'Dealer Portal' },
  { value: 'Field Sales', label: 'Field Sales' },
  { value: 'Marketplace', label: 'Marketplace' },
  { value: 'Walk-in', label: 'Walk-in' },
];

const salesExecutiveOptions = [
  { value: '', label: 'Select sales executive' },
  { value: 'Aarav Sharma', label: 'Aarav Sharma' },
  { value: 'Neha Kapoor', label: 'Neha Kapoor' },
  { value: 'Rohit Mehta', label: 'Rohit Mehta' },
  { value: 'Ishita Jain', label: 'Ishita Jain' },
];

const placeOfSupplyOptions = [
  { value: '', label: 'Select place of supply' },
  { value: 'Maharashtra', label: 'Maharashtra' },
  { value: 'Delhi', label: 'Delhi' },
  { value: 'Karnataka', label: 'Karnataka' },
  { value: 'Tamil Nadu', label: 'Tamil Nadu' },
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
  { value: 'Finance', label: 'Finance' },
];

const paymentMethodOptions = [
  { value: '', label: 'Select payment method' },
  { value: 'Bank Transfer', label: 'Bank Transfer' },
  { value: 'UPI', label: 'UPI' },
  { value: 'Cheque', label: 'Cheque' },
];

const paymentTermOptions = [
  { value: '', label: 'Select payment term' },
  { value: 'Immediate', label: 'Immediate' },
  { value: 'Net 15', label: 'Net 15' },
  { value: 'Net 30', label: 'Net 30' },
];

const financerOptions = [
  { value: '', label: 'Select financer' },
  { value: 'Axis Finance', label: 'Axis Finance' },
  { value: 'HDFC Finance', label: 'HDFC Finance' },
  { value: 'Mahindra Finance', label: 'Mahindra Finance' },
];

const tenureOptions = [
  { value: '', label: 'Select tenure' },
  { value: '3 Months', label: '3 Months' },
  { value: '6 Months', label: '6 Months' },
  { value: '9 Months', label: '9 Months' },
  { value: '12 Months', label: '12 Months' },
  { value: '18 Months', label: '18 Months' },
  { value: '24 Months', label: '24 Months' },
  { value: '36 Months', label: '36 Months' },
];

const insuranceProviderOptions = [
  { value: '', label: 'Select insurance provider' },
  { value: 'ICICI Lombard', label: 'ICICI Lombard' },
  { value: 'HDFC ERGO', label: 'HDFC ERGO' },
  { value: 'Tata AIG', label: 'Tata AIG' },
  { value: 'Bajaj Allianz', label: 'Bajaj Allianz' },
];

const deliveryTermOptions = [
  { value: '', label: 'Select delivery term' },
  { value: 'Door Delivery', label: 'Door Delivery' },
  { value: 'Branch Delivery', label: 'Branch Delivery' },
  { value: 'Pickup', label: 'Pickup' },
];

const deliveryTypeOptions = [
  { value: '', label: 'Select delivery type' },
  { value: 'Standard', label: 'Standard' },
  { value: 'Express', label: 'Express' },
];

const deliverySlotOptions = [
  { value: '', label: 'Select delivery slot' },
  { value: 'Morning', label: 'Morning' },
  { value: 'Afternoon', label: 'Afternoon' },
  { value: 'Evening', label: 'Evening' },
];

const addressOptions = [
  { value: '', label: 'Select address' },
  { value: 'Galaxy Motors, Pune', label: 'Galaxy Motors, Pune' },
  { value: 'Velocity Auto Hub, Delhi', label: 'Velocity Auto Hub, Delhi' },
  { value: 'Prime Wheels, Bengaluru', label: 'Prime Wheels, Bengaluru' },
];

const shippingTermOptions = [
  { value: '', label: 'Select shipping term' },
  { value: 'FOB', label: 'FOB' },
  { value: 'Ex Works', label: 'Ex Works' },
  { value: 'CIF', label: 'CIF' },
];

const shippingMethodOptions = [
  { value: '', label: 'Select shipping method' },
  { value: 'Road Transport', label: 'Road Transport' },
  { value: 'Courier', label: 'Courier' },
  { value: 'Pickup', label: 'Pickup' },
];

const productLookupOptions: ProductLookupOption[] = [
  { code: 'SP-1001', name: 'Front Brake Assembly', hsnSac: '870830', uoms: ['Unit', 'Set'], rate: '12500.00', taxLabel: 'GST 18%', taxRate: 18 },
  { code: 'SP-1002', name: 'Clutch Master Cylinder', hsnSac: '870893', uoms: ['Unit'], rate: '8800.00', taxLabel: 'GST 18%', taxRate: 18 },
  { code: 'SP-1003', name: 'Alternator Kit', hsnSac: '851150', uoms: ['Set'], rate: '21600.00', taxLabel: 'GST 18%', taxRate: 18 },
  { code: 'SP-1004', name: 'Steering Rack Kit', hsnSac: '870894', uoms: ['Unit'], rate: '15000.00', taxLabel: 'GST 18%', taxRate: 18 },
];

const warehouseOptions = [
  { value: '', label: 'Select warehouse' },
  { value: 'Main Warehouse', label: 'Main Warehouse' },
  { value: 'Finished Goods Yard', label: 'Finished Goods Yard' },
  { value: 'Regional Depot', label: 'Regional Depot' },
];

const warehouseLocationMap: Record<string, Array<{ value: string; label: string }>> = {
  'Main Warehouse': [
    { value: 'A1-01', label: 'A1-01' },
    { value: 'A1-02', label: 'A1-02' },
    { value: 'B2-04', label: 'B2-04' },
  ],
  'Finished Goods Yard': [
    { value: 'FG-01', label: 'FG-01' },
    { value: 'FG-02', label: 'FG-02' },
  ],
  'Regional Depot': [
    { value: 'RD-11', label: 'RD-11' },
    { value: 'RD-12', label: 'RD-12' },
  ],
};

const productBatchCatalog: Record<string, Array<{
  warehouse: string;
  locationBin: string;
  batchLotNumber: string;
  manufacturingDate: string;
  expiryDate: string;
}>> = {
  'SP-1001': [
    { warehouse: 'Main Warehouse', locationBin: 'A1-01', batchLotNumber: 'FB-2401', manufacturingDate: '2026-01-12', expiryDate: '2028-01-11' },
    { warehouse: 'Regional Depot', locationBin: 'RD-11', batchLotNumber: 'FB-2402', manufacturingDate: '2026-02-05', expiryDate: '2028-02-04' },
  ],
  'SP-1002': [
    { warehouse: 'Main Warehouse', locationBin: 'A1-02', batchLotNumber: 'CM-1801', manufacturingDate: '2026-01-28', expiryDate: '2028-01-27' },
  ],
  'SP-1003': [
    { warehouse: 'Finished Goods Yard', locationBin: 'FG-01', batchLotNumber: 'AK-3205', manufacturingDate: '2026-03-14', expiryDate: '2028-03-13' },
  ],
  'SP-1004': [
    { warehouse: 'Regional Depot', locationBin: 'RD-12', batchLotNumber: 'SR-1108', manufacturingDate: '2026-02-20', expiryDate: '2028-02-19' },
  ],
};

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

function sanitizeDecimalInput(value: string): string {
  const sanitized = value.replace(/[^0-9.]/g, '');
  const [integerPart = '', ...decimalParts] = sanitized.split('.');
  if (decimalParts.length === 0) {
    return sanitized;
  }

  return `${integerPart}.${decimalParts.join('')}`;
}

function getTodayDateString(): string {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function getNextDateString(value: string): string {
  if (!value) {
    return value;
  }

  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + 1);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function normalizePaymentMode(value: string): SalePaymentMode {
  if (value === 'Cash') {
    return 'Cash';
  }

  if (value === 'Finance' || value === 'Credit') {
    return 'Finance';
  }

  return '';
}

function createEmptyLine(index: number): SaleOrderLineForm {
  return {
    id: `so-line-${Date.now()}-${index}`,
    productCode: '',
    productName: '',
    hsnSac: '',
    uom: '',
    requestedDate: '',
    fulfillmentDate: '',
    priority: '',
    warehouse: '',
    locationBin: '',
    serialNumber: '',
    batchLotNumber: '',
    manufacturingDate: '',
    expiryDate: '',
    rate: '',
    orderQuantity: '',
    cancelledQuantity: '0.00',
    allocatedQuantity: '0.00',
    invoicedQuantity: '0.00',
    deliveryQuantity: '0.00',
    returnedQuantity: '0.00',
    discountPercent: '',
    discountAmount: '',
    convertedQuantity: '0.00',
    remark: '',
  };
}

function getProductOption(code: string): ProductLookupOption | undefined {
  return productLookupOptions.find((product) => product.code === code);
}

function getLocationOptions(warehouse: string) {
  return [
    { value: '', label: 'Select location/bin' },
    ...(warehouseLocationMap[warehouse] ?? []),
  ];
}

function getBatchMetadata(line: Pick<SaleOrderLineForm, 'productCode' | 'warehouse' | 'locationBin' | 'batchLotNumber'>) {
  const candidates = productBatchCatalog[line.productCode] ?? [];
  return candidates.find(
    (item) =>
      item.batchLotNumber === line.batchLotNumber &&
      (!line.warehouse || item.warehouse === line.warehouse) &&
      (!line.locationBin || item.locationBin === line.locationBin)
  );
}

function getBaseAmount(line: SaleOrderLineForm): number {
  return parseDecimal(line.rate) * parseDecimal(line.orderQuantity);
}

function getDiscountAmount(line: SaleOrderLineForm): number {
  const manualDiscount = parseDecimal(line.discountAmount);
  if (manualDiscount > 0) {
    return manualDiscount;
  }

  const percent = parseDecimal(line.discountPercent);
  if (percent > 0) {
    return (getBaseAmount(line) * percent) / 100;
  }

  return 0;
}

function getTaxableAmount(line: SaleOrderLineForm): number {
  return Math.max(getBaseAmount(line) - getDiscountAmount(line), 0);
}

function getLineAmount(line: SaleOrderLineForm): number {
  const product = getProductOption(line.productCode);
  const taxableAmount = getTaxableAmount(line);
  return taxableAmount + (taxableAmount * (product?.taxRate ?? 0)) / 100;
}

function getGrossOrderAmount(line: SaleOrderLineForm): number {
  const product = getProductOption(line.productCode);
  const baseAmount = getBaseAmount(line);
  return baseAmount + (baseAmount * (product?.taxRate ?? 0)) / 100;
}

function getPendingQuantity(line: SaleOrderLineForm): number {
  return Math.max(parseDecimal(line.orderQuantity) - parseDecimal(line.convertedQuantity), 0);
}

function getPendingAllocationQuantity(line: SaleOrderLineForm): number {
  return Math.max(parseDecimal(line.orderQuantity) - parseDecimal(line.allocatedQuantity), 0);
}

function getPendingInvoiceQuantity(line: SaleOrderLineForm): number {
  return Math.max(parseDecimal(line.orderQuantity) - parseDecimal(line.invoicedQuantity), 0);
}

function getPendingDeliveryQuantity(line: SaleOrderLineForm): number {
  return Math.max(parseDecimal(line.orderQuantity) - parseDecimal(line.deliveryQuantity), 0);
}

function lineHasCustomerDependentData(line: SaleOrderLineForm): boolean {
  return Boolean(
    line.productCode ||
      line.productName ||
      line.hsnSac ||
      line.uom ||
      line.requestedDate ||
      line.fulfillmentDate ||
      line.priority ||
      line.warehouse ||
      line.locationBin ||
      line.serialNumber ||
      line.batchLotNumber ||
      line.manufacturingDate ||
      line.expiryDate ||
      parseDecimal(line.rate) > 0 ||
      parseDecimal(line.orderQuantity) > 0 ||
      parseDecimal(line.cancelledQuantity) > 0 ||
      parseDecimal(line.allocatedQuantity) > 0 ||
      parseDecimal(line.invoicedQuantity) > 0 ||
      parseDecimal(line.deliveryQuantity) > 0 ||
      parseDecimal(line.returnedQuantity) > 0 ||
      parseDecimal(line.discountPercent) > 0 ||
      parseDecimal(line.discountAmount) > 0 ||
      parseDecimal(line.convertedQuantity) > 0 ||
      Boolean(line.remark)
  );
}

function mapDocumentToForm(document?: SaleOrderDocument): SaleOrderFormData {
  if (!document) {
    return {
      number: createSaleOrderNumber(),
      documentDate: new Date().toISOString().slice(0, 10),
      customer: '',
      orderSource: '',
      salesExecutive: '',
      requestedDeliveryDate: '',
      validTillDate: '',
      placeOfSupply: '',
      promisedDeliveryDate: '',
      priority: '',
      status: 'Draft',
      paymentMode: '',
      paymentMethod: '',
      paymentTerm: '',
      advancePayment: '',
      paymentRemarks: '',
      financer: '',
      downPayment: '',
      financeAmount: '',
      emiAmount: '',
      balanceAmount: '',
      tenure: '',
      emiInterestRate: '',
      insuranceProvider: '',
      policyNumber: '',
      policyDate: '',
      insuranceRemarks: '',
      deliveryTerm: '',
      deliveryType: '',
      deliverySlot: '',
      deliveryAddress: '',
      deliveryInstruction: '',
      shippingAddress: '',
      shippingTerm: '',
      shippingMethod: '',
      shippingInstructions: '',
      exchangeCategory: '',
      exchangeProductCode: '',
      exchangeProductName: '',
      exchangeBrand: '',
      exchangeModel: '',
      exchangeVariant: '',
      exchangeSerialNumber: '',
      exchangeCondition: '',
      exchangeQuantity: '',
      exchangeInspectionDate: '',
      exchangeAssessedBy: '',
      exchangeExpectedValue: '',
      exchangeApprovedValue: '',
      exchangePickupLocation: '',
      exchangePickupDate: '',
      exchangeSettlementMode: '',
      exchangeReferenceNotes: '',
      exchangeRemarks: '',
    };
  }

  return {
    number: document.number,
    documentDate: document.orderDateTime.slice(0, 10),
    customer: document.customerName,
    orderSource: document.orderSource,
    salesExecutive: document.salesExecutive,
    requestedDeliveryDate: document.requestedDeliveryDate,
    validTillDate: document.validTillDate,
    placeOfSupply: document.placeOfSupply,
    promisedDeliveryDate: document.promisedDeliveryDate,
    priority: document.priority,
    status: document.status,
    paymentMode: normalizePaymentMode(document.paymentMode),
    paymentMethod: document.paymentMethod,
    paymentTerm: document.paymentTerm,
    advancePayment: document.advancePayment,
    paymentRemarks: document.paymentRemarks,
    financer: document.financer,
    downPayment: document.downPayment,
    financeAmount: document.financeAmount,
    emiAmount: document.emiAmount,
    balanceAmount: document.balanceAmount,
    tenure: document.tenure,
    emiInterestRate: document.emiInterestRate,
    insuranceProvider: document.insuranceProvider,
    policyNumber: document.policyNumber,
    policyDate: document.policyDate,
    insuranceRemarks: document.insuranceRemarks,
    deliveryTerm: document.deliveryTerm,
    deliveryType: document.deliveryType,
    deliverySlot: document.deliverySlot,
    deliveryAddress: document.deliveryAddress,
    deliveryInstruction: document.deliveryInstruction,
    shippingAddress: document.shippingAddress,
    shippingTerm: document.shippingTerm,
    shippingMethod: document.shippingMethod,
    shippingInstructions: document.shippingInstructions,
    exchangeCategory: '',
    exchangeProductCode: '',
    exchangeProductName: '',
    exchangeBrand: '',
    exchangeModel: '',
    exchangeVariant: '',
    exchangeSerialNumber: '',
    exchangeCondition: '',
    exchangeQuantity: '',
    exchangeInspectionDate: '',
    exchangeAssessedBy: '',
    exchangeExpectedValue: '',
    exchangeApprovedValue: '',
    exchangePickupLocation: '',
    exchangePickupDate: '',
    exchangeSettlementMode: '',
    exchangeReferenceNotes: '',
    exchangeRemarks: '',
  };
}

function mapDocumentLines(document?: SaleOrderDocument): SaleOrderLineForm[] {
  if (!document) {
    return [createEmptyLine(0)];
  }

  return document.lines.map((line, index) => ({
    id: `so-edit-line-${index}`,
    productCode: line.productCode,
    productName: line.productName,
    hsnSac: line.hsnSac,
    uom: line.uom,
    requestedDate: line.requestedDate,
    fulfillmentDate: line.fulfillmentDate,
    priority: line.priority,
    warehouse: line.warehouse ?? '',
    locationBin: line.locationBin ?? '',
    serialNumber: line.serialNumber ?? '',
    batchLotNumber: line.batchLotNumber ?? '',
    manufacturingDate: line.manufacturingDate ?? '',
    expiryDate: line.expiryDate ?? '',
    rate: line.rate,
    orderQuantity: line.orderQuantity,
    cancelledQuantity: line.cancelledQuantity ?? '0.00',
    allocatedQuantity: line.allocatedQuantity ?? '0.00',
    invoicedQuantity: line.invoicedQuantity ?? '0.00',
    deliveryQuantity: line.deliveryQuantity ?? '0.00',
    returnedQuantity: line.returnedQuantity ?? '0.00',
    discountPercent: line.discountPercent,
    discountAmount: line.discountAmount,
    convertedQuantity: line.convertedQuantity,
    remark: line.remark,
  }));
}

const CreateSaleOrderV2: React.FC<CreateSaleOrderProps> = ({
  editingDocument,
  onBack,
  onNavigateToSaleOrderList,
}) => {
  const printTools = useDocumentPrint('sale-order');
  const numericFormFields: Array<keyof SaleOrderFormData> = [
    'advancePayment',
    'downPayment',
    'financeAmount',
    'emiAmount',
    'balanceAmount',
    'emiInterestRate',
  ];
  const numericLineFields: Array<keyof SaleOrderLineForm> = [
    'rate',
    'orderQuantity',
    'discountPercent',
    'discountAmount',
  ];
  const customerSearchInputRef = useRef<HTMLInputElement | null>(null);
  const quickLinkMenuRef = useRef<HTMLDivElement | null>(null);
  const voicePrefillAppliedRef = useRef<string | null>(null);
  const pendingCustomerChangeRef = useRef<string>('');
  const [formData, setFormData] = useState<SaleOrderFormData>(() => mapDocumentToForm(editingDocument));
  const [lines, setLines] = useState<SaleOrderLineForm[]>(() => mapDocumentLines(editingDocument));
  const [activeTab, setActiveTab] = useState<SaleOrderTabKey>('customer-order');
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerResultsOpen, setIsCustomerResultsOpen] = useState(false);
  const [isQuickLinkMenuOpen, setIsQuickLinkMenuOpen] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isCustomerChangeDialogOpen, setIsCustomerChangeDialogOpen] = useState(false);
  const [isSaveSuccessDialogOpen, setIsSaveSuccessDialogOpen] = useState(false);
  const [isAmountDrawerOpen, setIsAmountDrawerOpen] = useState(false);
  const [isHoldDialogOpen, setIsHoldDialogOpen] = useState(false);
  const [isReleaseDialogOpen, setIsReleaseDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isAmendDialogOpen, setIsAmendDialogOpen] = useState(false);
  const [savedDocumentId, setSavedDocumentId] = useState<string | undefined>(editingDocument?.id);

  const ruleEngine = useRuleEngine();
  const workflow = useSaleOrderWorkflow();
  const workflowHistory = useWorkflowHistory();

  const workflowStatus = workflow.state.workflowInstance?.status;
  const isWorkflowLoading = workflow.state.isLoading;
  const workflowError = workflow.state.workflowError;
  const approvalCaseId = workflow.state.workflowInstance?.approvalCaseId;
  const [showAdvancedProductColumns, setShowAdvancedProductColumns] = useState(false);
  const [orderLevelDiscountAmount, setOrderLevelDiscountAmount] = useState('');
  const [orderLevelDiscountPercent, setOrderLevelDiscountPercent] = useState('');
  const [chargesInputAmount, setChargesInputAmount] = useState('');
  const todayDate = useMemo(() => getTodayDateString(), []);
  const requestedDeliveryMinDate = useMemo(() => getNextDateString(todayDate), [todayDate]);
  const validTillMinDate = useMemo(() => {
    if (!formData.requestedDeliveryDate) {
      return todayDate;
    }

    return [todayDate, getNextDateString(formData.requestedDeliveryDate)].sort().slice(-1)[0];
  }, [formData.requestedDeliveryDate, todayDate]);

  const tabs: Array<{ id: SaleOrderTabKey; label: string }> = [
    { id: 'customer-order', label: 'Customer & Order' },
    { id: 'product-detail', label: 'Product detail' },
    { id: 'payment-finance', label: 'Payment and Finance' },
    { id: 'delivery-shipping', label: 'Delivery and Shipping' },
    { id: 'workflow-history', label: 'Workflow History' },
  ];

  const totalAmount = useMemo(
    () => lines.reduce((sum, line) => sum + getLineAmount(line), 0),
    [lines]
  );
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
  const totalOrderQuantity = useMemo(
    () => lines.reduce((sum, line) => sum + parseDecimal(line.orderQuantity), 0),
    [lines]
  );
  const totalDiscountPercent = useMemo(
    () => (grossOrderAmount > 0 ? (totalDiscountAmount / grossOrderAmount) * 100 : 0),
    [grossOrderAmount, totalDiscountAmount]
  );
  const taxBreakup = useMemo(() => {
    const breakupMap = new Map<string, number>();
    lines.forEach((line) => {
      if (!line.productCode) {
        return;
      }
      const product = getProductOption(line.productCode);
      const taxLabel = product?.taxLabel ?? 'Tax';
      const taxAmountForLine = Math.max(getLineAmount(line) - getTaxableAmount(line), 0);
      breakupMap.set(taxLabel, (breakupMap.get(taxLabel) ?? 0) + taxAmountForLine);
    });
    return Array.from(breakupMap.entries()).map(([label, amount]) => ({ label, amount }));
  }, [lines]);
  const baseNetOrderAmount = totalTaxableAmount;
  const orderDiscountAmount = parseDecimal(orderLevelDiscountAmount);
  const orderDiscountPercentValue = parseDecimal(orderLevelDiscountPercent);
  const orderLevelDiscountByPercent = (baseNetOrderAmount * orderDiscountPercentValue) / 100;
  const appliedOrderDiscountAmount = Math.min(
    Math.max(orderDiscountAmount > 0 ? orderDiscountAmount : orderLevelDiscountByPercent, 0),
    baseNetOrderAmount
  );
  const netOrderAmount = Math.max(baseNetOrderAmount - appliedOrderDiscountAmount, 0);
  const computedFinanceBalanceAmount = useMemo(() => {
    if (formData.paymentMode !== 'Finance') {
      return '';
    }

    return formatDecimal(
      Math.max(
        netOrderAmount - parseDecimal(formData.downPayment) - parseDecimal(formData.financeAmount),
        0
      )
    );
  }, [formData.downPayment, formData.financeAmount, formData.paymentMode, netOrderAmount]);
  const chargesAmount = parseDecimal(chargesInputAmount);
  const advancePaidAmount = parseDecimal(formData.advancePayment);
  const netPayableAmount = netOrderAmount + chargesAmount + (totalTaxAmount - advancePaidAmount);

  const totalLineCount = lines.filter((line) => Boolean(line.productCode)).length;

  const matchingCustomers = useMemo(() => {
    const normalizedSearch = customerSearch.trim().toLowerCase();
    if (!normalizedSearch) {
      return customerOptions.slice(0, 6);
    }

    return customerOptions.filter((option) =>
      option.code.toLowerCase().includes(normalizedSearch) ||
      option.label.toLowerCase().includes(normalizedSearch) ||
      option.email.toLowerCase().includes(normalizedSearch) ||
      option.mobileNumber.toLowerCase().includes(normalizedSearch) ||
      option.gstin.toLowerCase().includes(normalizedSearch)
    );
  }, [customerSearch]);

  const selectedCustomer = useMemo(
    () => customerOptions.find((option) => option.value === formData.customer) ?? null,
    [formData.customer]
  );
  const hasCustomerDependentDetails = useMemo(() => {
    const { number, documentDate, customer, status, ...customerDependentFormFields } = formData;
    const hasFormDetails = Object.values(customerDependentFormFields).some((value) => String(value).trim() !== '');
    const hasLineDetails = lines.some(lineHasCustomerDependentData);
    const hasSummaryDetails =
      orderLevelDiscountAmount.trim() !== '' ||
      orderLevelDiscountPercent.trim() !== '' ||
      chargesInputAmount.trim() !== '';

    return hasFormDetails || hasLineDetails || hasSummaryDetails;
  }, [chargesInputAmount, formData, lines, orderLevelDiscountAmount, orderLevelDiscountPercent]);
  const requestedDeliveryDateError = useMemo(() => {
    if (!formData.requestedDeliveryDate) {
      return '';
    }

    if (formData.requestedDeliveryDate <= todayDate) {
      return 'Requested delivery date must be a future date.';
    }

    return '';
  }, [formData.requestedDeliveryDate, todayDate]);
  const validTillDateError = useMemo(() => {
    if (!formData.validTillDate) {
      return '';
    }

    if (formData.validTillDate < todayDate) {
      return 'Valid till date must be today or a future date.';
    }

    if (formData.requestedDeliveryDate && formData.validTillDate <= formData.requestedDeliveryDate) {
      return 'Valid till date must be greater than requested delivery date.';
    }

    return '';
  }, [formData.requestedDeliveryDate, formData.validTillDate, todayDate]);
  const promisedDeliveryDateError = useMemo(() => {
    if (!formData.promisedDeliveryDate) {
      return '';
    }

    if (formData.promisedDeliveryDate < todayDate) {
      return 'Promised delivery date must be today or a future date.';
    }

    return '';
  }, [formData.promisedDeliveryDate, todayDate]);
  const isSaleOrderLineComplete = (line: SaleOrderLineForm) =>
    hasRequiredGridValues(line, ['productCode', 'rate', 'orderQuantity']);
  const canAddProductLine = lines.length === 0 || isSaleOrderLineComplete(lines[lines.length - 1]);

  const handleFieldChange = <K extends keyof SaleOrderFormData>(field: K, value: SaleOrderFormData[K]) => {
    const nextValue = numericFormFields.includes(field) ? sanitizeDecimalInput(String(value)) : value;
    setFormData((current) => ({ ...current, [field]: nextValue as SaleOrderFormData[K] }));
  };

  const handleDiscountAmountChange = (value: string) => {
    const normalizedValue = sanitizeDecimalInput(value);
    setOrderLevelDiscountAmount(normalizedValue);
    const amount = parseDecimal(normalizedValue);
    const percent = baseNetOrderAmount > 0 ? (amount / baseNetOrderAmount) * 100 : 0;
    setOrderLevelDiscountPercent(amount > 0 ? formatDecimal(percent) : '');
  };

  const handleDiscountPercentChange = (value: string) => {
    const normalizedValue = sanitizeDecimalInput(value);
    setOrderLevelDiscountPercent(normalizedValue);
    const percent = parseDecimal(normalizedValue);
    const amount = baseNetOrderAmount > 0 ? (baseNetOrderAmount * percent) / 100 : 0;
    setOrderLevelDiscountAmount(percent > 0 ? formatDecimal(amount) : '');
  };

  const handleChargesAmountChange = (value: string) => {
    setChargesInputAmount(sanitizeDecimalInput(value));
  };

  const resetDetailsForCustomerChange = (customer: string) => {
    setFormData((current) => {
      const blankForm = mapDocumentToForm(undefined);

      return {
        ...blankForm,
        number: current.number,
        documentDate: current.documentDate,
        status: current.status,
        customer,
      };
    });
    setLines([createEmptyLine(0)]);
    setOrderLevelDiscountAmount('');
    setOrderLevelDiscountPercent('');
    setChargesInputAmount('');
    setCustomerSearch('');
    setIsCustomerResultsOpen(false);
    setActiveTab('customer-order');
  };

  const applyCustomerSelection = (customer: string) => {
    handleFieldChange('customer', customer);
    setCustomerSearch('');
    setIsCustomerResultsOpen(false);
  };

  const requestCustomerSelection = (customer: string) => {
    if (customer === formData.customer) {
      setCustomerSearch('');
      setIsCustomerResultsOpen(false);
      return;
    }

    if (formData.customer && hasCustomerDependentDetails) {
      pendingCustomerChangeRef.current = customer;
      setIsCustomerResultsOpen(false);
      setIsCustomerChangeDialogOpen(true);
      return;
    }

    applyCustomerSelection(customer);
  };

  const requestCustomerRemoval = () => {
    if (!formData.customer) {
      return;
    }

    if (hasCustomerDependentDetails) {
      pendingCustomerChangeRef.current = '';
      setIsCustomerResultsOpen(false);
      setIsCustomerChangeDialogOpen(true);
      return;
    }

    applyCustomerSelection('');
  };

  const handleSelectCustomerRef = useRef(requestCustomerSelection);

  React.useEffect(() => {
    handleSelectCustomerRef.current = requestCustomerSelection;
  });

  React.useEffect(() => {
    setFormData((current) => {
      const nextBalanceAmount =
        current.paymentMode === 'Finance' ? computedFinanceBalanceAmount : current.balanceAmount;

      if (current.balanceAmount === nextBalanceAmount) {
        return current;
      }

      return {
        ...current,
        balanceAmount: nextBalanceAmount,
      };
    });
  }, [computedFinanceBalanceAmount]);

  React.useEffect(() => {
    if (editingDocument) {
      return;
    }

    const applyVoicePrefill = () => {
      const hashQuery = window.location.hash.split('?')[1] ?? '';
      const params = new URLSearchParams(hashQuery);
      const customerValue = params.get('customer') ?? params.get('customerQuery');
      const prefillKey = params.toString();

      if (!customerValue || voicePrefillAppliedRef.current === prefillKey) {
        return;
      }

      voicePrefillAppliedRef.current = prefillKey;
      const normalizedCustomer = customerValue.trim().toLowerCase();
      const matchedCustomer =
        customerOptions.find(
          (customer) =>
            customer.value.toLowerCase() === normalizedCustomer ||
            customer.label.toLowerCase() === normalizedCustomer ||
            customer.code.toLowerCase() === normalizedCustomer
        ) ??
        customerOptions.find(
          (customer) =>
            customer.value.toLowerCase().includes(normalizedCustomer) ||
            customer.label.toLowerCase().includes(normalizedCustomer)
        );

      if (matchedCustomer) {
        handleSelectCustomerRef.current(matchedCustomer.value);
        return;
      }

      setCustomerSearch(customerValue);
      setIsCustomerResultsOpen(true);
    };

    applyVoicePrefill();
    window.addEventListener('hashchange', applyVoicePrefill);
    return () => window.removeEventListener('hashchange', applyVoicePrefill);
  }, [editingDocument]);

  React.useEffect(() => {
    if (!isQuickLinkMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!quickLinkMenuRef.current?.contains(event.target as Node)) {
        setIsQuickLinkMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsQuickLinkMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isQuickLinkMenuOpen]);

  const handleLineChange = (lineId: string, field: keyof SaleOrderLineForm, value: string) => {
    const normalizedValue = numericLineFields.includes(field) ? sanitizeDecimalInput(value) : value;
    setLines((current) =>
      current.map((line) => {
        if (line.id !== lineId) {
          return line;
        }

        if (field === 'productCode') {
          const product = getProductOption(normalizedValue);
          return {
            ...line,
            productCode: normalizedValue,
            productName: product?.name ?? '',
            hsnSac: product?.hsnSac ?? '',
            uom: product?.uoms[0] ?? '',
            warehouse: '',
            locationBin: '',
            serialNumber: '',
            batchLotNumber: '',
            manufacturingDate: '',
            expiryDate: '',
            rate: product?.rate ?? '',
          };
        }

        if (field === 'warehouse') {
          return {
            ...line,
            warehouse: normalizedValue,
            locationBin: '',
            batchLotNumber: '',
            manufacturingDate: '',
            expiryDate: '',
          };
        }

        if (field === 'locationBin') {
          return {
            ...line,
            locationBin: normalizedValue,
            batchLotNumber: '',
            manufacturingDate: '',
            expiryDate: '',
          };
        }

        if (field === 'batchLotNumber') {
          const nextLine = {
            ...line,
            batchLotNumber: normalizedValue,
          };
          const batch = getBatchMetadata(nextLine);
          return {
            ...nextLine,
            manufacturingDate: batch?.manufacturingDate ?? '',
            expiryDate: batch?.expiryDate ?? '',
          };
        }

        if (field === 'discountPercent') {
          if (normalizedValue.trim() !== '' && parseDecimal(normalizedValue) >= 100) {
            return line;
          }

          const nextLine = {
            ...line,
            discountPercent: normalizedValue,
          };
          const baseAmount = getBaseAmount(nextLine);
          const percent = parseDecimal(normalizedValue);
          return {
            ...nextLine,
            discountAmount: percent > 0 && baseAmount > 0 ? formatDecimal((baseAmount * percent) / 100) : '',
          };
        }

        if (field === 'discountAmount') {
          const nextLine = {
            ...line,
            discountAmount: normalizedValue,
          };
          const baseAmount = getBaseAmount(nextLine);
          const amount = parseDecimal(normalizedValue);
          if (amount > 0 && baseAmount > 0 && amount >= baseAmount) {
            return line;
          }
          return {
            ...nextLine,
            discountPercent: amount > 0 && baseAmount > 0 ? formatDecimal((amount / baseAmount) * 100) : '',
          };
        }

        if (field === 'rate' || field === 'orderQuantity') {
          const nextLine = {
            ...line,
            [field]: normalizedValue,
          };
          const baseAmount = getBaseAmount(nextLine);

          if (parseDecimal(nextLine.discountPercent) > 0) {
            return {
              ...nextLine,
              discountAmount: formatDecimal((baseAmount * parseDecimal(nextLine.discountPercent)) / 100),
            };
          }

          if (parseDecimal(nextLine.discountAmount) > 0) {
            if (baseAmount <= 0 || parseDecimal(nextLine.discountAmount) >= baseAmount) {
              return {
                ...nextLine,
                discountAmount: '',
                discountPercent: '',
              };
            }

            return {
              ...nextLine,
              discountPercent: baseAmount > 0 ? formatDecimal((parseDecimal(nextLine.discountAmount) / baseAmount) * 100) : '',
            };
          }

          return nextLine;
        }

        return {
          ...line,
          [field]: normalizedValue,
        };
      })
    );
  };

  const handleAddLine = () => {
    if (!canAddProductLine) {
      return;
    }

    setLines((current) => [...current, createEmptyLine(current.length + 1)]);
  };

  const handleDeleteLine = (lineId: string) => {
    setLines((current) => current.filter((line) => line.id !== lineId));
  };

  const handleRemarkKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, lineId: string) => {
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
      isLineComplete: isSaleOrderLineComplete,
      onAddLine: handleAddLine,
    });
  };

  const handleSave = () => {
    if (requestedDeliveryDateError || validTillDateError || promisedDeliveryDateError) {
      setActiveTab('customer-order');
      return;
    }

    const persistedDocument: SaleOrderDocument = {
      id: editingDocument?.id ?? createSaleOrderId(),
      number: formData.number || createSaleOrderNumber(),
      orderDateTime: `${formData.documentDate || new Date().toISOString().slice(0, 10)}T00:00:00`,
      customerName: formData.customer,
      orderSource: formData.orderSource,
      salesExecutive: formData.salesExecutive,
      requestedDeliveryDate: formData.requestedDeliveryDate,
      validTillDate: formData.validTillDate,
      placeOfSupply: formData.placeOfSupply,
      promisedDeliveryDate: formData.promisedDeliveryDate,
      priority: (formData.priority || 'Medium') as SaleOrderDocument['priority'],
      status: formData.status,
      paymentMode: formData.paymentMode,
      paymentMethod: formData.paymentMethod,
      paymentTerm: formData.paymentTerm,
      advancePayment: formData.advancePayment || '0.00',
      paymentRemarks: formData.paymentRemarks,
      financer: formData.financer,
      downPayment: formData.downPayment || '0.00',
      financeAmount: formData.financeAmount || '0.00',
      emiAmount: formData.emiAmount || '0.00',
      balanceAmount:
        formData.paymentMode === 'Finance'
          ? computedFinanceBalanceAmount || '0.00'
          : formData.balanceAmount || '0.00',
      tenure: formData.tenure,
      emiInterestRate: formData.emiInterestRate || '0.00',
      insuranceProvider: formData.insuranceProvider,
      policyNumber: formData.policyNumber,
      policyDate: formData.policyDate,
      insuranceRemarks: formData.insuranceRemarks,
      deliveryTerm: formData.deliveryTerm,
      deliveryType: formData.deliveryType,
      deliverySlot: formData.deliverySlot,
      deliveryAddress: formData.deliveryAddress,
      deliveryInstruction: formData.deliveryInstruction,
      shippingAddress: formData.shippingAddress,
      shippingTerm: formData.shippingTerm,
      shippingMethod: formData.shippingMethod,
      shippingInstructions: formData.shippingInstructions,
      totalAmount: formatDecimal(totalAmount),
      lines: lines.map((line) => {
        const baseAmount = getBaseAmount(line);
        const discountAmount = getDiscountAmount(line);
        const taxableAmount = getTaxableAmount(line);
        const lineAmount = getLineAmount(line);
        const product = getProductOption(line.productCode);
        const pendingQuantity = getPendingQuantity(line);
        const pendingAllocationQuantity = getPendingAllocationQuantity(line);
        const pendingInvoiceQuantity = getPendingInvoiceQuantity(line);
        const pendingDeliveryQuantity = getPendingDeliveryQuantity(line);
        return {
          productCode: line.productCode,
          productName: line.productName,
          hsnSac: line.hsnSac,
          uom: line.uom,
          requestedDate: line.requestedDate,
          fulfillmentDate: line.fulfillmentDate,
          priority: (line.priority || 'Medium') as SaleOrderDocument['lines'][number]['priority'],
          warehouse: line.warehouse,
          locationBin: line.locationBin,
          serialNumber: line.serialNumber,
          batchLotNumber: line.batchLotNumber,
          manufacturingDate: line.manufacturingDate,
          expiryDate: line.expiryDate,
          rate: line.rate || '0.00',
          orderQuantity: line.orderQuantity || '0.00',
          cancelledQuantity: line.cancelledQuantity || '0.00',
          allocatedQuantity: line.allocatedQuantity || '0.00',
          pendingAllocationQuantity: formatDecimal(pendingAllocationQuantity),
          invoicedQuantity: line.invoicedQuantity || '0.00',
          pendingInvoiceQuantity: formatDecimal(pendingInvoiceQuantity),
          deliveryQuantity: line.deliveryQuantity || '0.00',
          pendingDeliveryQuantity: formatDecimal(pendingDeliveryQuantity),
          returnedQuantity: line.returnedQuantity || '0.00',
          baseAmount: formatDecimal(baseAmount),
          discountPercent: line.discountPercent || '0.00',
          discountAmount: formatDecimal(discountAmount),
          taxableAmount: formatDecimal(taxableAmount),
          taxationColumn: product?.taxLabel ?? '',
          lineAmount: formatDecimal(lineAmount),
          convertedQuantity: line.convertedQuantity || '0.00',
          pendingQuantity: formatDecimal(pendingQuantity),
          status: pendingQuantity <= 0 ? 'Fully Ordered' : Number.parseFloat(line.convertedQuantity || '0') > 0 ? 'Partially Ordered' : 'Open',
          remark: line.remark,
        };
      }),
    };
    upsertSaleOrder(persistedDocument);
    setSavedDocumentId(persistedDocument.id);
    void workflow.actions.executeDraftSave({ entityId: persistedDocument.id, tenantId: '', viewCode: 'SO_DETAIL', header: {}, lines: [] });
    setIsSaveSuccessDialogOpen(true);
  };

  const buildSaleOrderPrintPreviewDocument = (): Record<string, unknown> => ({
    id: editingDocument?.id ?? `sale-order-preview-${formData.number}`,
    number: formData.number,
    orderDateTime: formData.documentDate ? `${formData.documentDate}T09:00:00.000Z` : '',
    documentDate: formData.documentDate,
    customerName: formData.customer,
    orderSource: formData.orderSource,
    salesExecutive: formData.salesExecutive,
    requestedDeliveryDate: formData.requestedDeliveryDate,
    validTillDate: formData.validTillDate,
    placeOfSupply: formData.placeOfSupply,
    promisedDeliveryDate: formData.promisedDeliveryDate,
    priority: formData.priority,
    status: formData.status,
    paymentMode: formData.paymentMode,
    paymentMethod: formData.paymentMethod,
    paymentTerm: formData.paymentTerm,
    advancePayment: formData.advancePayment || '0.00',
    financeAmount: formData.financeAmount || '0.00',
    emiAmount: formData.emiAmount || '0.00',
    balanceAmount: formData.balanceAmount || '0.00',
    paymentRemarks: formData.paymentRemarks,
    deliveryTerm: formData.deliveryTerm,
    deliveryType: formData.deliveryType,
    deliverySlot: formData.deliverySlot,
    deliveryAddress: formData.deliveryAddress,
    deliveryInstruction: formData.deliveryInstruction,
    shippingAddress: formData.shippingAddress,
    shippingTerm: formData.shippingTerm,
    shippingMethod: formData.shippingMethod,
    shippingInstructions: formData.shippingInstructions,
    insuranceProvider: formData.insuranceProvider,
    policyNumber: formData.policyNumber,
    policyDate: formData.policyDate,
    insuranceRemarks: formData.insuranceRemarks,
    totalTaxAmount: formatDecimal(totalTaxAmount),
    totalAmount: formatDecimal(totalAmount),
    netAmount: formatDecimal(netPayableAmount),
    taxableAmount: formatDecimal(totalTaxableAmount),
    discountAmount: formatDecimal(totalDiscountAmount + appliedOrderDiscountAmount),
    lines: lines.map((line) => {
      const product = productLookupOptions.find((option) => option.code === line.productCode);
      const rate = parseDecimal(line.rate);
      const orderQuantity = parseDecimal(line.orderQuantity);
      const baseAmount = rate * orderQuantity;
      const discountAmount = parseDecimal(line.discountAmount);
      const taxableAmount = Math.max(baseAmount - discountAmount, 0);
      const taxAmount = taxableAmount * ((product?.taxRate ?? 0) / 100);

      return {
        productCode: line.productCode,
        productName: line.productName,
        hsnSac: line.hsnSac,
        uom: line.uom,
        warehouse: line.warehouse,
        locationBin: line.locationBin,
        requestedDate: line.requestedDate,
        fulfillmentDate: line.fulfillmentDate,
        orderQuantity: line.orderQuantity || '0.00',
        rate: line.rate || '0.00',
        discountPercent: line.discountPercent || '0.00',
        discountAmount: formatDecimal(discountAmount),
        taxableAmount: formatDecimal(taxableAmount),
        taxAmount: formatDecimal(taxAmount),
        lineAmount: formatDecimal(taxableAmount + taxAmount),
        remark: line.remark,
      };
    }),
  });

  const handlePrintSummary = () => {
    printTools.openPrintPreview(buildSaleOrderPrintPreviewDocument(), () => window.print());
  };

  const handleShareSummary = async () => {
    const summaryText = [
      'Sale order saved successfully',
      `Sale order No: ${formData.number}`,
      `Customer: ${formData.customer || '-'}`,
      `Total line count: ${formatCount(totalLineCount)}`,
      `Total amount: ${formatCount(totalAmount)}`,
    ].join('\n');

    if (navigator.share) {
      await navigator.share({
        title: 'Sale order summary',
        text: summaryText,
      });
      return;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(summaryText);
    }
  };

  return (
    <AppShell
      activeLeaf="sale-order-v2"
      onSaleOrderV2Click={onNavigateToSaleOrderList}
      contentClassName="create-pr-shell"
      bottomBar={
        <div className="po-create__summary-bar">
          <div className="po-create__summary-shell">
            <div className="po-create__summary-metric po-create__summary-metric--right">
              <span className="po-create__summary-label">Total qty</span>
              <span className="po-create__summary-value">{formatCount(totalOrderQuantity)}</span>
            </div>

            <div className="po-create__summary-divider" aria-hidden="true" />

            <div className="po-create__summary-metric po-create__summary-metric--right">
              <span className="po-create__summary-label">Gross order amount</span>
              <span className="po-create__summary-value">Rs {formatCurrency(grossOrderAmount)}</span>
            </div>

            <div className="po-create__summary-divider" aria-hidden="true" />

            <div className="po-create__summary-metric po-create__summary-metric--emphasis po-create__summary-metric--right">
              <span className="po-create__summary-label">Net payable amount</span>

              <div className="po-create__summary-net-row">
                <button
                  type="button"
                  onClick={() => setIsAmountDrawerOpen(true)}
                  className="po-create__summary-trigger"
                  aria-label="Open sale order amount breakdown"
                >
                  <span className="po-create__summary-value po-create__summary-value--accent">
                    Rs {formatCurrency(netPayableAmount)}
                  </span>
                  <ChevronRight size={18} className="po-create__summary-chevron" />
                </button>
              </div>

              {(appliedOrderDiscountAmount > 0 || chargesAmount > 0 || advancePaidAmount > 0) && (
                <div className="po-create__summary-subrow">
                  {appliedOrderDiscountAmount > 0 && (
                    <span className="po-create__summary-badge">
                      Order discount Rs {formatCurrency(appliedOrderDiscountAmount)}
                    </span>
                  )}
                  {chargesAmount > 0 && (
                    <span className="po-create__summary-badge po-create__summary-badge--neutral">
                      Charges Rs {formatCurrency(chargesAmount)}
                    </span>
                  )}
                  {advancePaidAmount > 0 && (
                    <span className="po-create__summary-badge po-create__summary-badge--neutral">
                      Advance paid Rs {formatCurrency(advancePaidAmount)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      }
    >
      <div className="create-pr-header">
        <div className="create-pr-header__top">
          <div className="create-pr-header__title-group">
            <a
              href="#/sale-order"
              onClick={(event) => {
                event.preventDefault();
                onBack();
              }}
              className="page-back-button create-pr-header__back"
              aria-label="Back to sale order list"
            >
              <ArrowLeft size={18} />
            </a>
            <div className="create-pr-header__title-wrap">
              <div className="create-pr-header__title-row">
                <h2 className="brand-page-title create-pr-header__title">
                  {editingDocument ? 'Edit Sale Order' : 'New Sale Order'}
                </h2>
                <StatusBadge kind="requisition-status" value={formData.status} className="sale-order-header__status-badge" />
              </div>
              <p className="sale-order-header__submeta">
                {formData.number}
                <span className="sale-order-header__submeta-separator">|</span>
                {formatDate(formData.documentDate)}
              </p>
            </div>
          </div>
          <div className="sale-order-header__top-actions">
            <div ref={quickLinkMenuRef} className="so-create__quick-link">
              <button
                type="button"
                onClick={() => setIsQuickLinkMenuOpen((current) => !current)}
                className="so-create__quick-link-trigger"
                aria-expanded={isQuickLinkMenuOpen}
                aria-label="Open quick links"
              >
                <span>Quick links</span>
                <ChevronDown
                  size={16}
                  className={cn('so-create__quick-link-chevron', isQuickLinkMenuOpen && 'so-create__quick-link-chevron--open')}
                />
              </button>

              {isQuickLinkMenuOpen && (
                <div className="so-create__quick-link-menu" role="menu" aria-label="Quick links">
                  <button
                    type="button"
                    className="so-create__quick-link-item"
                    role="menuitem"
                    onClick={() => setIsQuickLinkMenuOpen(false)}
                  >
                    New Customer
                  </button>
                </div>
              )}
            </div>

            <button type="button" onClick={() => setIsDiscardDialogOpen(true)} className="btn btn--outline">
              Discard
            </button>
            <button type="button" onClick={handleSave} className="btn btn--primary" disabled={isWorkflowLoading}>
              Save
            </button>
            {savedDocumentId && (
              <>
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={isWorkflowLoading}
                  onClick={() => {
                    if (savedDocumentId) {
                      void workflow.actions.executeSubmit({ entityId: savedDocumentId, tenantId: '', viewCode: 'SO_DETAIL', header: {}, lines: [] });
                    }
                  }}
                >
                  Submit
                </button>
                <button type="button" className="btn btn--outline" disabled={isWorkflowLoading} onClick={() => setIsHoldDialogOpen(true)}>
                  Hold
                </button>
                <button type="button" className="btn btn--outline" disabled={isWorkflowLoading} onClick={() => setIsReleaseDialogOpen(true)}>
                  Release
                </button>
                <button type="button" className="btn btn--outline" disabled={isWorkflowLoading} onClick={() => setIsCancelDialogOpen(true)}>
                  Cancel
                </button>
                <button type="button" className="btn btn--outline" disabled={isWorkflowLoading} onClick={() => setIsAmendDialogOpen(true)}>
                  Amend
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {workflowError?.code === 'NETWORK_ERROR' && (
        <EngineOfflineBanner message="Workflow engine is unreachable. Actions are temporarily unavailable." />
      )}

      {workflowStatus && (
        <div style={{ padding: '0 24px' }}>
          <WorkflowStatusBar
            status={workflowStatus}
            currentStepCode={workflow.state.workflowInstance?.currentStepCode}
            stepExecutions={workflow.state.workflowInstance?.stepExecutions}
          />
        </div>
      )}

      {workflowStatus === 'PendingApproval' && approvalCaseId && (
        <div style={{ padding: '0 24px' }}>
          <ApprovalActionPanel
            approvalCaseId={approvalCaseId}
            approvalRequests={[]}
            tasks={[]}
            currentUserId=""
            isLoading={isWorkflowLoading}
            onApprove={() => {}}
            onReject={() => {}}
            onReturn={() => {}}
          />
        </div>
      )}

      <div className="create-pr-page mx-auto w-full max-w-[1800px] px-6 py-6 space-y-6">
        {((ruleEngine.state.response?.errors.length ?? 0) > 0 || (ruleEngine.state.response?.warnings.length ?? 0) > 0) && (
          <RuleEngineErrorSummary
            errors={ruleEngine.state.response?.errors ?? []}
            warnings={ruleEngine.state.response?.warnings ?? []}
          />
        )}
        <div className="create-pr-tabs">
          <div className="create-pr-tabs__list" role="tablist" aria-label="Sale order sections">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn('create-pr-tab', activeTab === tab.id ? 'create-pr-tab--active' : 'create-pr-tab--inactive')}
              >
                <span className="create-pr-tab__label">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'customer-order' && (
          <div className="space-y-6">
            <div className="rounded border border-slate-200 bg-white p-4 space-y-4">
              <div className="sale-order-customer-section">
                <div className="sale-order-customer-field">
                  <FormField label="Select Customer" required>
                    <div className="po-create__requisition-picker">
                      <div className="po-create__requisition-search">
                        <div className="po-create__requisition-search-shell">
                          <Search size={16} className="po-create__requisition-search-icon" />
                          {formData.customer && (
                            <span className="po-create__selected-chip">
                              <span className="po-create__selected-chip-text">{formData.customer}</span>
                              <button
                                type="button"
                                className="po-create__selected-chip-remove"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={requestCustomerRemoval}
                                aria-label={`Remove ${formData.customer}`}
                              >
                                <X size={12} />
                              </button>
                            </span>
                          )}
                          <input
                            ref={customerSearchInputRef}
                            type="search"
                            value={customerSearch}
                            onChange={(event) => {
                              setCustomerSearch(event.target.value);
                              setIsCustomerResultsOpen(true);
                            }}
                            onFocus={() => setIsCustomerResultsOpen(true)}
                            onBlur={() => {
                              window.setTimeout(() => {
                                setIsCustomerResultsOpen(false);
                              }, 120);
                            }}
                            className="search-input po-create__requisition-search-input"
                            placeholder={formData.customer ? '' : 'Search customer by code, name, primary number, etc...'}
                            aria-label="Select customer"
                          />
                        </div>
                      </div>

                      {isCustomerResultsOpen && matchingCustomers.length > 0 && (
                        <div className="po-create__requisition-results so-create__customer-results" role="listbox" aria-label="Customer results">
                          <table className="po-create__requisition-results-table so-create__customer-results-table">
                            <thead>
                              <tr>
                                <th>Customer code</th>
                                <th>Customer name</th>
                                <th>Email</th>
                                <th>Primary mobile number</th>
                                <th>GSTIN</th>
                              </tr>
                            </thead>
                            <tbody>
                              {matchingCustomers.map((customer) => (
                                <tr
                                  key={customer.code}
                                  className="po-create__requisition-results-row"
                                  role="option"
                                  tabIndex={0}
                                  aria-label={`Select ${customer.label}`}
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => requestCustomerSelection(customer.value)}
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                      event.preventDefault();
                                      requestCustomerSelection(customer.value);
                                    }
                                  }}
                                >
                                  <td className="po-create__requisition-results-number">{customer.code}</td>
                                  <td>{customer.label}</td>
                                  <td>{customer.email}</td>
                                  <td>{customer.mobileNumber}</td>
                                  <td>{customer.gstin}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </FormField>
                </div>

                {selectedCustomer && (
                  <div className="sale-order-customer-context" aria-live="polite">
                    <div className="sale-order-customer-context__top">
                      <div className="sale-order-customer-context__identity">
                        <div className="sale-order-customer-context__name">{selectedCustomer.label}</div>
                        <div className="sale-order-customer-context__meta">
                          {selectedCustomer.code}
                          <span className="sale-order-customer-context__separator">|</span>
                          {selectedCustomer.customerType}
                        </div>
                      </div>
                      <span className="sale-order-customer-context__badge">GSTIN {selectedCustomer.gstin}</span>
                    </div>

                    <div className="sale-order-customer-context__details">
                      <span>{selectedCustomer.mobileNumber}</span>
                      <span>{selectedCustomer.email}</span>
                      <span>{selectedCustomer.address}</span>
                    </div>
                  </div>
                )}
              </div>

            </div>

            <div className="rounded border border-slate-200 bg-white p-4 space-y-4">
              <div className="brand-section-title font-semibold">Order Details</div>
              <div className="sale-order-order-panel">
                <div className="sale-order-order-panel__title">Commercial details</div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <FormField label="Order Source">
                    <Select value={formData.orderSource} onChange={(event) => handleFieldChange('orderSource', event.target.value)} options={orderSourceOptions} />
                  </FormField>
                  <FormField label="Sales Executive">
                    <Select value={formData.salesExecutive} onChange={(event) => handleFieldChange('salesExecutive', event.target.value)} options={salesExecutiveOptions} />
                  </FormField>
                  <FormField label="Place of Supply" required>
                    <Select value={formData.placeOfSupply} onChange={(event) => handleFieldChange('placeOfSupply', event.target.value)} options={placeOfSupplyOptions} />
                  </FormField>
                  <FormField label="Priority">
                    <Select value={formData.priority} onChange={(event) => handleFieldChange('priority', event.target.value as SalePriority)} options={priorityOptions} />
                  </FormField>
                </div>
              </div>

              <div className="sale-order-order-panel sale-order-order-panel--accent">
                <div className="sale-order-order-panel__title">Delivery commitments</div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <FormField label="Requested Delivery Date" help={requestedDeliveryDateError || 'Customer commitment date. Must be a future date.'}>
                    <Input
                      type="date"
                      value={formData.requestedDeliveryDate}
                      min={requestedDeliveryMinDate}
                      error={requestedDeliveryDateError || undefined}
                      onChange={(event) => handleFieldChange('requestedDeliveryDate', event.target.value)}
                    />
                  </FormField>
                  <FormField label="Promised Delivery Date" help={promisedDeliveryDateError || 'Internal promise date. Must be current or future.'}>
                    <Input
                      type="date"
                      value={formData.promisedDeliveryDate}
                      min={todayDate}
                      error={promisedDeliveryDateError || undefined}
                      onChange={(event) => handleFieldChange('promisedDeliveryDate', event.target.value)}
                    />
                  </FormField>
                  <FormField
                    label="Valid Till Date"
                    help={validTillDateError || 'Must be current or future, and later than requested delivery date when set.'}
                  >
                    <Input
                      type="date"
                      value={formData.validTillDate}
                      min={validTillMinDate}
                      error={validTillDateError || undefined}
                      onChange={(event) => handleFieldChange('validTillDate', event.target.value)}
                    />
                  </FormField>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'product-detail' && (
          <div className="bg-white rounded border border-slate-200 p-4">
            <div className="create-pr-grid">
              <div className="create-pr-grid__header">
                <div className="create-pr-grid__title-wrap">
                  <div className="create-pr-grid__title-row">
                    <h4 className="create-pr-grid__title">Product detail</h4>
                    <span className="create-pr-grid__count">{lines.length}</span>
                  </div>
                  <p className="create-pr-grid__helper">
                    Use the entry columns first. Inventory tracking and fulfilment columns can be expanded only when needed.
                  </p>
                </div>
                <div className="create-pr-grid__header-actions">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedProductColumns((current) => !current)}
                    className="btn btn--outline create-pr-grid__secondary-action"
                  >
                    {showAdvancedProductColumns ? 'Hide advanced columns' : 'Show advanced columns'}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    disabled={!canAddProductLine}
                    className="btn btn--outline btn--icon-left create-pr-grid__add-button"
                  >
                    <Plus size={14} />
                    Add line
                  </button>
                </div>
              </div>

              <div className="create-pr-grid__table-wrap">
                <table className="create-pr-grid__table">
                  <thead>
                    <tr>
                      <th className="create-pr-grid__cell create-pr-grid__cell--action"></th>
                      <th className="create-pr-grid__cell">Product Code</th>
                      <th className="create-pr-grid__cell">Product Name</th>
                      <th className="create-pr-grid__cell">HSN/SAC</th>
                      <th className="create-pr-grid__cell">UOM</th>
                      <th className="create-pr-grid__cell">Requested Date</th>
                      <th className="create-pr-grid__cell">Fulfillment Date</th>
                      <th className="create-pr-grid__cell">Priority</th>
                      <th className="create-pr-grid__cell">Warehouse</th>
                      <th className="create-pr-grid__cell">Location/bin</th>
                      {showAdvancedProductColumns && (
                        <>
                          <th className="create-pr-grid__cell">Serial Number</th>
                          <th className="create-pr-grid__cell">Batch/Lot Number</th>
                          <th className="create-pr-grid__cell">Manufacturing Date</th>
                          <th className="create-pr-grid__cell">Expiry Date</th>
                        </>
                      )}
                      <th className="create-pr-grid__cell create-pr-grid__cell--number">Rate</th>
                      <th className="create-pr-grid__cell create-pr-grid__cell--number">Order Qty</th>
                      {showAdvancedProductColumns && (
                        <>
                          <th className="create-pr-grid__cell create-pr-grid__cell--number">Cancelled Qty</th>
                          <th className="create-pr-grid__cell create-pr-grid__cell--number">Allocated Qty</th>
                          <th className="create-pr-grid__cell create-pr-grid__cell--number">Pending Allocation Qty</th>
                          <th className="create-pr-grid__cell create-pr-grid__cell--number">Invoiced Qty</th>
                          <th className="create-pr-grid__cell create-pr-grid__cell--number">Pending Invoice Qty</th>
                          <th className="create-pr-grid__cell create-pr-grid__cell--number">Delivery Qty</th>
                          <th className="create-pr-grid__cell create-pr-grid__cell--number">Pending Delivery Qty</th>
                          <th className="create-pr-grid__cell create-pr-grid__cell--number">Returned Qty</th>
                        </>
                      )}
                      <th className="create-pr-grid__cell create-pr-grid__cell--number">Base Amount</th>
                      <th className="create-pr-grid__cell create-pr-grid__cell--number">Discount %</th>
                      <th className="create-pr-grid__cell create-pr-grid__cell--number">Discount Amount</th>
                      <th className="create-pr-grid__cell create-pr-grid__cell--number">Taxable Amount</th>
                      <th className="create-pr-grid__cell">Tax</th>
                      <th className="create-pr-grid__cell create-pr-grid__cell--number">Total Amount</th>
                      <th className="create-pr-grid__cell">Item Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, index) => {
                      const product = getProductOption(line.productCode);
                      const baseAmount = getBaseAmount(line);
                      const taxableAmount = getTaxableAmount(line);
                      const lineAmount = getLineAmount(line);
                      const pendingAllocationQuantity = getPendingAllocationQuantity(line);
                      const pendingInvoiceQuantity = getPendingInvoiceQuantity(line);
                      const pendingDeliveryQuantity = getPendingDeliveryQuantity(line);

                      return (
                        <tr key={line.id}>
                          <td className="create-pr-grid__body-cell create-pr-grid__body-cell--action">
                            <button type="button" onClick={() => handleDeleteLine(line.id)} className="create-pr-grid__delete" aria-label={`Delete line ${index + 1}`}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                          <td className="create-pr-grid__body-cell">
                            <Select
                              value={line.productCode}
                              onChange={(event) => handleLineChange(line.id, 'productCode', event.target.value)}
                              className="create-pr-grid__control create-pr-grid__control--select min-w-32"
                              options={[
                                { value: '', label: 'Select product' },
                                ...productLookupOptions.map((option) => ({ value: option.code, label: option.code })),
                              ]}
                            />
                          </td>
                          <td className="create-pr-grid__body-cell">
                            <Input value={line.productName} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly min-w-36" />
                          </td>
                          <td className="create-pr-grid__body-cell">
                            <Input value={line.hsnSac} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly min-w-24" />
                          </td>
                          <td className="create-pr-grid__body-cell">
                            <Select
                              value={line.uom}
                              onChange={(event) => handleLineChange(line.id, 'uom', event.target.value)}
                              className="create-pr-grid__control create-pr-grid__control--select min-w-24"
                              options={[
                                { value: '', label: 'Select UOM' },
                                ...(product?.uoms.map((uom) => ({ value: uom, label: uom })) ?? []),
                              ]}
                            />
                          </td>
                          <td className="create-pr-grid__body-cell">
                            <Input type="date" value={line.requestedDate} onChange={(event) => handleLineChange(line.id, 'requestedDate', event.target.value)} className="create-pr-grid__control create-pr-grid__control--date min-w-32" />
                          </td>
                          <td className="create-pr-grid__body-cell">
                            <Input type="date" value={line.fulfillmentDate} onChange={(event) => handleLineChange(line.id, 'fulfillmentDate', event.target.value)} className="create-pr-grid__control create-pr-grid__control--date min-w-32" />
                          </td>
                          <td className="create-pr-grid__body-cell">
                            <Select value={line.priority} onChange={(event) => handleLineChange(line.id, 'priority', event.target.value)} className="create-pr-grid__control create-pr-grid__control--select min-w-24" options={priorityOptions} />
                          </td>
                          <td className="create-pr-grid__body-cell">
                            <Select
                              value={line.warehouse}
                              onChange={(event) => handleLineChange(line.id, 'warehouse', event.target.value)}
                              className="create-pr-grid__control create-pr-grid__control--select min-w-28"
                              options={warehouseOptions}
                            />
                          </td>
                          <td className="create-pr-grid__body-cell">
                            <Select
                              value={line.locationBin}
                              onChange={(event) => handleLineChange(line.id, 'locationBin', event.target.value)}
                              className="create-pr-grid__control create-pr-grid__control--select min-w-28"
                              options={getLocationOptions(line.warehouse)}
                            />
                          </td>
                          {showAdvancedProductColumns && (
                            <>
                              <td className="create-pr-grid__body-cell">
                                <Input
                                  value={line.serialNumber}
                                  onChange={(event) => handleLineChange(line.id, 'serialNumber', event.target.value)}
                                  className="create-pr-grid__control create-pr-grid__control--input min-w-28"
                                  placeholder="Enter serial no."
                                />
                              </td>
                              <td className="create-pr-grid__body-cell">
                                <Input
                                  value={line.batchLotNumber}
                                  onChange={(event) => handleLineChange(line.id, 'batchLotNumber', event.target.value)}
                                  className="create-pr-grid__control create-pr-grid__control--input min-w-28"
                                  placeholder="Enter batch/lot"
                                />
                              </td>
                              <td className="create-pr-grid__body-cell">
                                <Input
                                  type="date"
                                  value={line.manufacturingDate}
                                  readOnly
                                  disabled
                                  className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--date min-w-28"
                                />
                              </td>
                              <td className="create-pr-grid__body-cell">
                                <Input
                                  type="date"
                                  value={line.expiryDate}
                                  readOnly
                                  disabled
                                  className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--date min-w-28"
                                />
                              </td>
                            </>
                          )}
                          <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number">
                            <Input value={line.rate} onChange={(event) => handleLineChange(line.id, 'rate', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input create-pr-grid__control--number min-w-24" />
                          </td>
                          <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number">
                            <Input value={line.orderQuantity} onChange={(event) => handleLineChange(line.id, 'orderQuantity', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input create-pr-grid__control--number min-w-24" />
                          </td>
                          {showAdvancedProductColumns && (
                            <>
                              <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number">
                                <Input value={line.cancelledQuantity} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number min-w-20" />
                              </td>
                              <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number">
                                <Input value={line.allocatedQuantity} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number min-w-20" />
                              </td>
                              <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number">
                                <Input value={formatDecimal(pendingAllocationQuantity)} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number min-w-24" />
                              </td>
                              <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number">
                                <Input value={line.invoicedQuantity} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number min-w-20" />
                              </td>
                              <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number">
                                <Input value={formatDecimal(pendingInvoiceQuantity)} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number min-w-24" />
                              </td>
                              <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number">
                                <Input value={line.deliveryQuantity} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number min-w-20" />
                              </td>
                              <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number">
                                <Input value={formatDecimal(pendingDeliveryQuantity)} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number min-w-24" />
                              </td>
                              <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number">
                                <Input value={line.returnedQuantity} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number min-w-20" />
                              </td>
                            </>
                          )}
                          <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number">
                            <Input value={formatDecimal(baseAmount)} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number min-w-24" />
                          </td>
                          <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number">
                            <Input value={line.discountPercent} onChange={(event) => handleLineChange(line.id, 'discountPercent', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input create-pr-grid__control--number min-w-20" />
                          </td>
                          <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number">
                            <Input value={line.discountAmount} onChange={(event) => handleLineChange(line.id, 'discountAmount', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input create-pr-grid__control--number min-w-24" />
                          </td>
                          <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number">
                            <Input value={formatDecimal(taxableAmount)} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number min-w-24" />
                          </td>
                          <td className="create-pr-grid__body-cell">
                            <Input value={product?.taxLabel ?? ''} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly min-w-24" />
                          </td>
                          <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number">
                            <Input value={formatDecimal(lineAmount)} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number min-w-24" />
                          </td>
                          <td className="create-pr-grid__body-cell">
                            <Input
                              value={line.remark}
                              onChange={(event) => handleLineChange(line.id, 'remark', event.target.value)}
                              onKeyDown={(event) => handleRemarkKeyDown(event, line.id)}
                              className="create-pr-grid__control create-pr-grid__control--input min-w-32"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payment-finance' && (
          <div className="space-y-6">
            <div className="rounded border border-slate-200 bg-white p-4 space-y-4">
              <div className="brand-section-title font-semibold">Payment Detail</div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <FormField label="Payment Mode">
                  <Select
                    value={formData.paymentMode}
                    onChange={(event) => handleFieldChange('paymentMode', event.target.value as SalePaymentMode)}
                    options={paymentModeOptions}
                  />
                </FormField>
                <FormField label="Payment Method">
                  <Select value={formData.paymentMethod} onChange={(event) => handleFieldChange('paymentMethod', event.target.value)} options={paymentMethodOptions} />
                </FormField>
                <FormField label="Payment Term">
                  <Select value={formData.paymentTerm} onChange={(event) => handleFieldChange('paymentTerm', event.target.value)} options={paymentTermOptions} />
                </FormField>
                <FormField label="Advance Payment">
                  <Input value={formData.advancePayment} onChange={(event) => handleFieldChange('advancePayment', event.target.value)} placeholder="0.00" />
                </FormField>
                <div className="md:col-span-2 xl:col-span-4">
                  <FormField label="Payment Remarks">
                    <Input value={formData.paymentRemarks} onChange={(event) => handleFieldChange('paymentRemarks', event.target.value)} placeholder="Enter payment remarks" />
                  </FormField>
                </div>
              </div>
            </div>

            <div className="rounded border border-slate-200 bg-white p-4 space-y-4">
              <div className="brand-section-title font-semibold">Finance Details</div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <FormField label="Financier">
                  <Select value={formData.financer} onChange={(event) => handleFieldChange('financer', event.target.value)} options={financerOptions} />
                </FormField>
                <FormField label="Down Payment">
                  <Input value={formData.downPayment} onChange={(event) => handleFieldChange('downPayment', event.target.value)} placeholder="0.00" />
                </FormField>
                <FormField label="Finance Amount">
                  <Input value={formData.financeAmount} onChange={(event) => handleFieldChange('financeAmount', event.target.value)} placeholder="0.00" />
                </FormField>
                <FormField label="EMI amount">
                  <Input value={formData.emiAmount} onChange={(event) => handleFieldChange('emiAmount', event.target.value)} placeholder="0.00" />
                </FormField>
                <FormField label="EMI Interest Rate">
                  <Input value={formData.emiInterestRate} onChange={(event) => handleFieldChange('emiInterestRate', event.target.value)} placeholder="0.00" />
                </FormField>
                <FormField
                  label="Balance Amount"
                  help={formData.paymentMode === 'Finance' ? 'Auto-calculated as net order amount minus down payment and finance amount.' : undefined}
                >
                  <Input
                    value={formData.paymentMode === 'Finance' ? computedFinanceBalanceAmount : formData.balanceAmount}
                    onChange={(event) => handleFieldChange('balanceAmount', event.target.value)}
                    placeholder="0.00"
                    readOnly={formData.paymentMode === 'Finance'}
                    disabled={formData.paymentMode === 'Finance'}
                  />
                </FormField>
                <FormField label="Tenure">
                  <Select value={formData.tenure} onChange={(event) => handleFieldChange('tenure', event.target.value)} options={tenureOptions} />
                </FormField>
              </div>
            </div>

            <div className="rounded border border-slate-200 bg-white p-4 space-y-4">
              <div className="brand-section-title font-semibold">Insurance Details</div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <FormField label="Insurance Provider">
                  <Select
                    value={formData.insuranceProvider}
                    onChange={(event) => handleFieldChange('insuranceProvider', event.target.value)}
                    options={insuranceProviderOptions}
                  />
                </FormField>
                <FormField label="Policy Number">
                  <Input
                    value={formData.policyNumber}
                    onChange={(event) => handleFieldChange('policyNumber', event.target.value)}
                    placeholder="Enter policy number"
                  />
                </FormField>
                <FormField label="Policy Date">
                  <Input
                    type="date"
                    value={formData.policyDate}
                    onChange={(event) => handleFieldChange('policyDate', event.target.value)}
                  />
                </FormField>
                <FormField label="Insurance Remarks">
                  <Input
                    value={formData.insuranceRemarks}
                    onChange={(event) => handleFieldChange('insuranceRemarks', event.target.value)}
                    placeholder="Enter remarks"
                  />
                </FormField>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'delivery-shipping' && (
          <div className="space-y-6">
            <div className="rounded border border-slate-200 bg-white p-4 space-y-4">
              <div className="brand-section-title font-semibold">Delivery Detail</div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <FormField label="Delivery Term">
                  <Select value={formData.deliveryTerm} onChange={(event) => handleFieldChange('deliveryTerm', event.target.value)} options={deliveryTermOptions} />
                </FormField>
                <FormField label="Delivery Type">
                  <Select value={formData.deliveryType} onChange={(event) => handleFieldChange('deliveryType', event.target.value)} options={deliveryTypeOptions} />
                </FormField>
                <FormField label="Delivery Slot">
                  <Select value={formData.deliverySlot} onChange={(event) => handleFieldChange('deliverySlot', event.target.value)} options={deliverySlotOptions} />
                </FormField>
                <FormField label="Delivery Address">
                  <Select value={formData.deliveryAddress} onChange={(event) => handleFieldChange('deliveryAddress', event.target.value)} options={addressOptions} />
                </FormField>
                <div className="md:col-span-2 xl:col-span-4">
                  <FormField label="Delivery Instruction">
                    <Input value={formData.deliveryInstruction} onChange={(event) => handleFieldChange('deliveryInstruction', event.target.value)} placeholder="Enter delivery instruction" />
                  </FormField>
                </div>
              </div>
            </div>

            <div className="rounded border border-slate-200 bg-white p-4 space-y-4">
              <div className="brand-section-title font-semibold">Shipping Detail</div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <FormField label="Shipping Address">
                  <Select value={formData.shippingAddress} onChange={(event) => handleFieldChange('shippingAddress', event.target.value)} options={addressOptions} />
                </FormField>
                <FormField label="Shipping Term">
                  <Select value={formData.shippingTerm} onChange={(event) => handleFieldChange('shippingTerm', event.target.value)} options={shippingTermOptions} />
                </FormField>
                <FormField label="Shipping Method">
                  <Select value={formData.shippingMethod} onChange={(event) => handleFieldChange('shippingMethod', event.target.value)} options={shippingMethodOptions} />
                </FormField>
                <div className="md:col-span-2 xl:grid-cols-4 xl:col-span-4">
                  <FormField label="Shipping Instructions">
                    <Input value={formData.shippingInstructions} onChange={(event) => handleFieldChange('shippingInstructions', event.target.value)} placeholder="Enter shipping instructions" />
                  </FormField>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workflow-history' && (
          <div className="space-y-6">
            <WorkflowHistoryDrawer
              instance={workflow.state.workflowInstance ?? null}
              isLoading={workflowHistory.state.isLoading}
            />
            <AuditTrailPanel
              events={[]}
              isLoading={workflowHistory.state.isLoading}
            />
          </div>
        )}

      </div>

      <ConfirmationDialog
        isOpen={isDiscardDialogOpen}
        title="Discard changes?"
        description="Are you sure you want to discard? All your entered information will be cleared."
        confirmLabel="Yes"
        cancelLabel="No"
        onConfirm={() => {
          setIsDiscardDialogOpen(false);
          onNavigateToSaleOrderList();
        }}
        onClose={() => setIsDiscardDialogOpen(false)}
      />
      <ConfirmationDialog
        isOpen={isCustomerChangeDialogOpen}
        title="Change customer?"
        description="Changing or removing the customer will discard all entered details. Are you sure?"
        confirmLabel="Yes"
        cancelLabel="No"
        onConfirm={() => {
          const nextCustomer = pendingCustomerChangeRef.current;
          pendingCustomerChangeRef.current = '';
          setIsCustomerChangeDialogOpen(false);
          resetDetailsForCustomerChange(nextCustomer);
        }}
        onClose={() => {
          pendingCustomerChangeRef.current = '';
          setIsCustomerChangeDialogOpen(false);
        }}
      />

      <SuccessSummaryDialog
        isOpen={isSaveSuccessDialogOpen}
        title="Saved successfully!"
        documentLabel="Sale order No"
        documentNumber={formData.number}
        sectionTitle="Order Summary"
        items={[
          { label: 'Customer', value: formData.customer || '-' },
          { label: 'Requested delivery date', value: formData.requestedDeliveryDate ? formatDate(formData.requestedDeliveryDate) : '-' },
          { label: 'Priority', value: formData.priority || '-' },
          { label: 'Total line count', value: formatCount(totalLineCount) },
        ]}
        totalLabel="Net payable amount"
        totalValue={`Rs ${formatCurrency(netPayableAmount)}`}
        primaryActionLabel="Go to sale orders"
        onPrimaryAction={() => {
          setIsSaveSuccessDialogOpen(false);
          onNavigateToSaleOrderList();
        }}
        onPrint={handlePrintSummary}
        onShare={handleShareSummary}
        onClose={() => setIsSaveSuccessDialogOpen(false)}
      />
      <AmountBreakdownDrawer
        isOpen={isAmountDrawerOpen}
        title="Order summary"
        subtitle={formData.customer || 'Customer not selected'}
        panelClassName="side-drawer__panel--thirty"
        mainSectionTitle="Calculation summary"
        groupSectionTitle="Detailed sections"
        items={[
          { label: 'Net Order Amount (A)', value: `Rs ${formatCurrency(netOrderAmount)}` },
          { label: 'Gross order amount', value: `Rs ${formatCurrency(grossOrderAmount)}` },
          { label: 'Total qty', value: formatCount(totalOrderQuantity) },
          { label: 'Line discount amount', value: `Rs ${formatCurrency(totalDiscountAmount)}` },
          { label: 'Line discount percent', value: `${formatCount(totalDiscountPercent)}%` },
          { label: 'Taxable amount', value: `Rs ${formatCurrency(totalTaxableAmount)}` },
          { label: 'Advance Paid (D)', value: `Rs ${formatCurrency(advancePaidAmount)}` },
        ]}
        groups={[
          {
            id: 'discount-summary',
            title: 'Discount summary',
            defaultCollapsed: true,
            items: [
              {
                label: 'Order Discount Amount',
                value: '',
                editable: true,
                inputValue: orderLevelDiscountAmount,
                inputPlaceholder: 'Enter amount',
                onInputChange: handleDiscountAmountChange,
              },
              {
                label: 'Order Discount Percent',
                value: '',
                editable: true,
                inputValue: orderLevelDiscountPercent,
                inputPlaceholder: 'Enter percent',
                onInputChange: handleDiscountPercentChange,
              },
              {
                label: 'Applied Discount',
                value: `Rs ${formatCurrency(appliedOrderDiscountAmount)}`,
                tone: 'accent',
              },
            ],
          },
          {
            id: 'charges-summary',
            title: 'Charges summary',
            defaultCollapsed: true,
            items: [
              {
                label: 'Charges (B)',
                value: '',
                editable: true,
                inputValue: chargesInputAmount,
                inputPlaceholder: 'Enter charges',
                onInputChange: handleChargesAmountChange,
              },
            ],
          },
          {
            id: 'tax-breakup',
            title: `Tax summary (C) - Total Taxes: Rs ${formatCurrency(totalTaxAmount)}`,
            defaultCollapsed: true,
            items:
              taxBreakup.length > 0
                ? taxBreakup.map((tax, index) => ({
                    label: `${String.fromCharCode(69 + index)}. ${tax.label}`,
                    value: `Rs ${formatCurrency(tax.amount)}`,
                  }))
                : [{ label: 'No tax breakup available', value: 'Rs 0.00', tone: 'muted' }],
          },
        ]}
        totalLabel="Net Payable Amount (A + B + (C - D))"
        totalValue={`Rs ${formatCurrency(netPayableAmount)}`}
        note={`This summary is calculated from ${lines.length} line item${lines.length === 1 ? '' : 's'} in the product details grid.`}
        onClose={() => setIsAmountDrawerOpen(false)}
      />
      {printTools.printPreviewOverlay}

      <HoldDialog
        isOpen={isHoldDialogOpen}
        isLoading={isWorkflowLoading}
        onConfirm={(holdType, reason) => {
          setIsHoldDialogOpen(false);
          if (savedDocumentId) {
            void workflow.actions.executeHold(savedDocumentId, reason, holdType, '');
          }
        }}
        onCancel={() => setIsHoldDialogOpen(false)}
      />

      <ReleaseDialog
        isOpen={isReleaseDialogOpen}
        isLoading={isWorkflowLoading}
        onConfirm={(reason) => {
          setIsReleaseDialogOpen(false);
          if (savedDocumentId) {
            void workflow.actions.executeRelease(savedDocumentId, reason, '');
          }
        }}
        onCancel={() => setIsReleaseDialogOpen(false)}
      />

      <CancelDialog
        isOpen={isCancelDialogOpen}
        isLoading={isWorkflowLoading}
        hasProcessedScope={false}
        onConfirm={(reason) => {
          setIsCancelDialogOpen(false);
          if (savedDocumentId) {
            void workflow.actions.executeCancel(savedDocumentId, reason, '');
          }
        }}
        onCancel={() => setIsCancelDialogOpen(false)}
      />

      <AmendDialog
        isOpen={isAmendDialogOpen}
        isLoading={isWorkflowLoading}
        hasProcessedScope={false}
        onConfirm={(reason) => {
          setIsAmendDialogOpen(false);
          if (savedDocumentId) {
            void workflow.actions.executeAmend(savedDocumentId, reason, {}, '');
          }
        }}
        onCancel={() => setIsAmendDialogOpen(false)}
      />
    </AppShell>
  );
};

export default CreateSaleOrderV2;
