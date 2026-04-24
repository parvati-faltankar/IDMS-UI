import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  ChevronRight,
  ChevronDown,
  FileText,
  Mail,
  MapPin,
  MoreVertical,
  PencilLine,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import AmountBreakdownDrawer from '../components/common/AmountBreakdownDrawer';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import SuccessSummaryDialog from '../components/common/SuccessSummaryDialog';
import { FormField, Input, Select } from '../components/common/FormControls';
import { handleGridLastCellTab, hasRequiredGridValues } from '../components/common/gridKeyboard';
import { cn } from '../utils/classNames';
import { formatDate } from '../utils/dateFormat';
import type { SaleOrderDocument } from './saleOrderData';

type SaleOrderTabKey =
  | 'customer-order'
  | 'product-detail'
  | 'payment-finance'
  | 'delivery-shipping';
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
  rate: string;
  orderQuantity: string;
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
    rate: '',
    orderQuantity: '',
    discountPercent: '',
    discountAmount: '',
    convertedQuantity: '0.00',
    remark: '',
  };
}

function getProductOption(code: string): ProductLookupOption | undefined {
  return productLookupOptions.find((product) => product.code === code);
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

function mapDocumentToForm(document?: SaleOrderDocument): SaleOrderFormData {
  if (!document) {
    return {
      number: 'SO-2026-00021',
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
    balanceAmount: formatDecimal(Math.max(parseDecimal(document.financeAmount) - parseDecimal(document.downPayment), 0)),
    tenure: document.tenure,
    emiInterestRate: document.emiInterestRate,
    insuranceProvider: '',
    policyNumber: '',
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
    rate: line.rate,
    orderQuantity: line.orderQuantity,
    discountPercent: line.discountPercent,
    discountAmount: line.discountAmount,
    convertedQuantity: line.convertedQuantity,
    remark: line.remark,
  }));
}

const CreateSaleOrder: React.FC<CreateSaleOrderProps> = ({
  editingDocument,
  onBack,
  onNavigateToSaleOrderList,
}) => {
  const customerSearchInputRef = useRef<HTMLInputElement | null>(null);
  const quickLinkMenuRef = useRef<HTMLDivElement | null>(null);
  const voicePrefillAppliedRef = useRef<string | null>(null);
  const [formData, setFormData] = useState<SaleOrderFormData>(() => mapDocumentToForm(editingDocument));
  const [lines, setLines] = useState<SaleOrderLineForm[]>(() => mapDocumentLines(editingDocument));
  const [activeTab, setActiveTab] = useState<SaleOrderTabKey>('customer-order');
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerResultsOpen, setIsCustomerResultsOpen] = useState(false);
  const [isQuickLinkMenuOpen, setIsQuickLinkMenuOpen] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isSaveSuccessDialogOpen, setIsSaveSuccessDialogOpen] = useState(false);
  const [isAmountDrawerOpen, setIsAmountDrawerOpen] = useState(false);

  const tabs: Array<{ id: SaleOrderTabKey; label: string }> = [
    { id: 'customer-order', label: 'Customer & Order' },
    { id: 'product-detail', label: 'Product detail' },
    { id: 'payment-finance', label: 'Payment and Finance' },
    { id: 'delivery-shipping', label: 'Delivery and Shipping' },
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
  const isSaleOrderLineComplete = (line: SaleOrderLineForm) =>
    hasRequiredGridValues(line, ['productCode', 'rate', 'orderQuantity']);
  const canAddProductLine = lines.length === 0 || isSaleOrderLineComplete(lines[lines.length - 1]);

  const handleFieldChange = <K extends keyof SaleOrderFormData>(field: K, value: SaleOrderFormData[K]) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSelectCustomer = (customer: string) => {
    handleFieldChange('customer', customer);
    setCustomerSearch('');
    setIsCustomerResultsOpen(false);
  };
  const handleSelectCustomerRef = useRef(handleSelectCustomer);

  React.useEffect(() => {
    handleSelectCustomerRef.current = handleSelectCustomer;
  });

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

  const handleEditCustomerCard = () => {
    setIsCustomerResultsOpen(true);
    customerSearchInputRef.current?.focus();
  };

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
    setLines((current) =>
      current.map((line) => {
        if (line.id !== lineId) {
          return line;
        }

        if (field === 'productCode') {
          const product = getProductOption(value);
          return {
            ...line,
            productCode: value,
            productName: product?.name ?? '',
            hsnSac: product?.hsnSac ?? '',
            uom: product?.uoms[0] ?? '',
            rate: product?.rate ?? '',
          };
        }

        return {
          ...line,
          [field]: value,
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
    setIsSaveSuccessDialogOpen(true);
  };

  const handlePrintSummary = () => {
    window.print();
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
      activeLeaf="sale-order"
      onSaleOrderClick={onNavigateToSaleOrderList}
      contentClassName="create-pr-shell"
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
                  onClick={() => setIsAmountDrawerOpen(true)}
                  className="po-create__summary-trigger"
                  aria-label="Open sale order amount breakdown"
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
                <span className="create-pr-header__status">{formData.status}</span>
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
              <span className="create-pr-header__meta-value">{formatDate(formData.documentDate)}</span>
            </div>
            <button type="button" className="create-pr-header__icon-button" aria-label="Edit sale order header">
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
                {formData.customer && (
                  <span className="po-create__selected-chip">
                    <span className="po-create__selected-chip-text">{formData.customer}</span>
                    <button
                      type="button"
                      className="po-create__selected-chip-remove"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        handleFieldChange('customer', '');
                        setCustomerSearch('');
                      }}
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
                  aria-label="Search customers"
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
                        onClick={() => handleSelectCustomer(customer.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleSelectCustomer(customer.value);
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

          <div ref={quickLinkMenuRef} className="so-create__quick-link">
            <button
              type="button"
              onClick={() => setIsQuickLinkMenuOpen((current) => !current)}
              className="so-create__quick-link-trigger"
              aria-expanded={isQuickLinkMenuOpen}
              aria-label="Open quick links"
            >
              <span>Quick links</span>
              <ChevronDown size={16} className={cn('so-create__quick-link-chevron', isQuickLinkMenuOpen && 'so-create__quick-link-chevron--open')} />
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
          <button type="button" onClick={handleSave} className="btn btn--primary">
            Save
          </button>
        </div>
      </div>

      <div className="create-pr-page mx-auto w-full max-w-[1800px] px-6 py-6 space-y-6">
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
            {selectedCustomer && (
              <div className="so-create__customer-card">
                <div className="so-create__customer-card__section-title">Customer details</div>
                <div className="so-create__customer-card__header">
                  <div className="so-create__customer-card__summary">
                    <div className="so-create__customer-card__avatar" aria-hidden="true">
                      <UserRound size={24} />
                    </div>

                    <div className="so-create__customer-card__identity">
                      <div className="so-create__customer-card__title-row">
                        <h3 className="so-create__customer-card__title">
                          {selectedCustomer.label} ({selectedCustomer.code})
                        </h3>
                      </div>

                      <div className="so-create__customer-card__phone-row">
                        <span className="so-create__customer-card__phone">
                          {selectedCustomer.mobileNumber}
                        </span>
                        {selectedCustomer.isPrimaryVerified && (
                          <span className="so-create__customer-card__verified" aria-label="Primary number verified">
                            <BadgeCheck size={14} />
                          </span>
                        )}
                        <span className="so-create__customer-card__secondary-phone">
                          {selectedCustomer.secondaryNumber}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleEditCustomerCard}
                    className="so-create__customer-card__edit"
                    aria-label="Edit selected customer"
                  >
                    <PencilLine size={15} />
                  </button>
                </div>

                  <div className="so-create__customer-card__details">
                    <div className="so-create__customer-card__detail-row">
                      <Mail size={16} className="so-create__customer-card__detail-icon" />
                      <span className="so-create__customer-card__detail-text">{selectedCustomer.email}</span>
                  </div>

                  <div className="so-create__customer-card__detail-row">
                    <Building2 size={16} className="so-create__customer-card__detail-icon" />
                    <span className="so-create__customer-card__detail-text">{selectedCustomer.customerType}</span>
                  </div>

                  <div className="so-create__customer-card__detail-row">
                    <FileText size={16} className="so-create__customer-card__detail-icon" />
                    <span className="so-create__customer-card__detail-text">{selectedCustomer.gstin}</span>
                  </div>

                    <div className="so-create__customer-card__detail-row">
                      <MapPin size={16} className="so-create__customer-card__detail-icon" />
                      <span className="so-create__customer-card__detail-text">{selectedCustomer.address}</span>
                    </div>
                  </div>
                </div>
              )}

            <div className="rounded border border-slate-200 bg-white p-4 space-y-4">
              <div className="brand-section-title font-semibold">Order Details</div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <FormField label="Order Source">
                  <Select value={formData.orderSource} onChange={(event) => handleFieldChange('orderSource', event.target.value)} options={orderSourceOptions} />
                </FormField>
                <FormField label="Sales Executive">
                  <Select value={formData.salesExecutive} onChange={(event) => handleFieldChange('salesExecutive', event.target.value)} options={salesExecutiveOptions} />
                </FormField>
                <FormField label="Requested Delivery Date">
                  <Input type="date" value={formData.requestedDeliveryDate} onChange={(event) => handleFieldChange('requestedDeliveryDate', event.target.value)} />
                </FormField>
                <FormField label="Valid Till Date">
                  <Input type="date" value={formData.validTillDate} onChange={(event) => handleFieldChange('validTillDate', event.target.value)} />
                </FormField>
                <FormField label="Place of Supply" required>
                  <Select value={formData.placeOfSupply} onChange={(event) => handleFieldChange('placeOfSupply', event.target.value)} options={placeOfSupplyOptions} />
                </FormField>
                <FormField label="Promised Delivery Date">
                  <Input type="date" value={formData.promisedDeliveryDate} onChange={(event) => handleFieldChange('promisedDeliveryDate', event.target.value)} />
                </FormField>
                <FormField label="Priority">
                  <Select value={formData.priority} onChange={(event) => handleFieldChange('priority', event.target.value as SalePriority)} options={priorityOptions} />
                </FormField>
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
                </div>
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
                      <th className="create-pr-grid__cell create-pr-grid__cell--number">Rate</th>
                      <th className="create-pr-grid__cell create-pr-grid__cell--number">Order Qty</th>
                      <th className="create-pr-grid__cell create-pr-grid__cell--number">Converted Qty</th>
                      <th className="create-pr-grid__cell create-pr-grid__cell--number">Pending Qty</th>
                      <th className="create-pr-grid__cell create-pr-grid__cell--number">Base Amount</th>
                      <th className="create-pr-grid__cell create-pr-grid__cell--number">Discount %</th>
                      <th className="create-pr-grid__cell create-pr-grid__cell--number">Discount Amount</th>
                      <th className="create-pr-grid__cell create-pr-grid__cell--number">Taxable Amount</th>
                      <th className="create-pr-grid__cell">Taxation Column</th>
                      <th className="create-pr-grid__cell create-pr-grid__cell--number">Total Amount</th>
                      <th className="create-pr-grid__cell">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, index) => {
                      const product = getProductOption(line.productCode);
                      const baseAmount = getBaseAmount(line);
                      const taxableAmount = getTaxableAmount(line);
                      const lineAmount = getLineAmount(line);
                      const pendingQuantity = getPendingQuantity(line);

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
                          <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number">
                            <Input value={line.rate} onChange={(event) => handleLineChange(line.id, 'rate', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input create-pr-grid__control--number min-w-24" />
                          </td>
                          <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number">
                            <Input value={line.orderQuantity} onChange={(event) => handleLineChange(line.id, 'orderQuantity', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input create-pr-grid__control--number min-w-24" />
                          </td>
                          <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number">
                            <Input value={line.convertedQuantity} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number min-w-20" />
                          </td>
                          <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number">
                            <Input value={formatDecimal(pendingQuantity)} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number min-w-20" />
                          </td>
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
                <FormField label="Balance Amount">
                  <Input value={formData.balanceAmount} onChange={(event) => handleFieldChange('balanceAmount', event.target.value)} placeholder="0.00" />
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
        totalLabel="Net order amount"
        totalValue={formatCount(totalAmount)}
        primaryActionLabel="Go to homepage"
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
        title="Order amount details"
        subtitle="Review the amount summary for this sale order."
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
    </AppShell>
  );
};

export default CreateSaleOrder;
