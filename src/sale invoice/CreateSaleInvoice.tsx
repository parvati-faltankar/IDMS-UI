import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  ChevronDown,
  ChevronRight,
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
import { FormField, Input, Select, Textarea } from '../components/common/FormControls';
import { handleGridLastCellTab, hasRequiredGridValues } from '../components/common/gridKeyboard';
import SideDrawer from '../components/common/SideDrawer';
import SuccessSummaryDialog from '../components/common/SuccessSummaryDialog';
import { cn } from '../utils/classNames';
import { formatDate } from '../utils/dateFormat';
import type { SaleInvoiceDocument } from './saleInvoiceData';
import {
  extendedSaleAllocationDocuments,
  type SaleAllocationDocument,
} from '../sale allocation/saleAllocationData';
import {
  extendedSaleOrderDocuments,
  type SaleOrderDocument,
} from '../sale order/saleOrderData';

type SaleInvoiceTabKey = 'general-details' | 'product-details' | 'payment-details';
type SearchMode = 'sale-order' | 'allocation' | 'customer';
type QuickPreviewTarget = 'sale-order' | 'allocation' | null;

interface SaleInvoiceLineForm {
  id: string;
  productCode: string;
  productName: string;
  hsnSac: string;
  uom: string;
  rate: string;
  orderQty: string;
  allocationQty: string;
  invoiceQty: string;
  serialNumber: string;
  location: string;
  discountPercent: string;
  discountAmount: string;
  taxableAmount: string;
  taxColumn: string;
  totalAmount: string;
  remarks: string;
}

interface SaleInvoiceFormData {
  number: string;
  documentDate: string;
  customer: string;
  saleOrderNumber: string;
  salesExecutive: string;
  priority: '' | 'Low' | 'Medium' | 'High';
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Cancelled';
  paymentMode: string;
  paymentMethod: string;
  paymentTerm: string;
  placeOfSupply: string;
  invoiceReference: string;
  remarks: string;
}

interface CreateSaleInvoiceProps {
  editingDocument?: SaleInvoiceDocument;
  onBack: () => void;
  onNavigateToSaleInvoiceList: () => void;
}

const customerOptions = [
  {
    code: '',
    value: '',
    label: 'Select customer',
    email: '',
    mobileNumber: '',
    secondaryNumber: '',
    address: '',
    customerType: '',
    gstin: '',
    isPrimaryVerified: false,
  },
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

const customerSearchOptions = customerOptions.filter((customer) => customer.value);

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
  { value: 'Cash', label: 'Cash' },
];

const paymentTermOptions = [
  { value: '', label: 'Select payment term' },
  { value: 'Immediate', label: 'Immediate' },
  { value: 'Net 15', label: 'Net 15' },
  { value: 'Net 30', label: 'Net 30' },
];

const placeOfSupplyOptions = [
  { value: '', label: 'Select place of supply' },
  { value: 'Maharashtra', label: 'Maharashtra' },
  { value: 'Delhi', label: 'Delhi' },
  { value: 'Karnataka', label: 'Karnataka' },
];

const productOptions = [
  { code: 'SP-1001', name: 'Front Brake Assembly', hsnSac: '870830', uom: 'Unit', rate: '12500.00' },
  { code: 'SP-1002', name: 'Clutch Master Cylinder', hsnSac: '870893', uom: 'Unit', rate: '8800.00' },
  { code: 'SP-1003', name: 'Alternator Kit', hsnSac: '851150', uom: 'Set', rate: '21600.00' },
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

function createEmptyLine(index: number): SaleInvoiceLineForm {
  return {
    id: `sale-invoice-line-${Date.now()}-${index}`,
    productCode: '',
    productName: '',
    hsnSac: '',
    uom: '',
    rate: '',
    orderQty: '0.00',
    allocationQty: '0.00',
    invoiceQty: '',
    serialNumber: '',
    location: '',
    discountPercent: '0.00',
    discountAmount: '0.00',
    taxableAmount: '0.00',
    taxColumn: 'GST 18%',
    totalAmount: '0.00',
    remarks: '',
  };
}

function mapDocumentToForm(document?: SaleInvoiceDocument): SaleInvoiceFormData {
  if (!document) {
    return {
      number: 'SI-2026-00017',
      documentDate: new Date().toISOString().slice(0, 10),
      customer: '',
      saleOrderNumber: '',
      salesExecutive: '',
      priority: '',
      status: 'Draft',
      paymentMode: '',
      paymentMethod: '',
      paymentTerm: '',
      placeOfSupply: '',
      invoiceReference: '',
      remarks: '',
    };
  }

  return {
    number: document.number,
    documentDate: document.invoiceDateTime.slice(0, 10),
    customer: document.customerName,
    saleOrderNumber: document.saleOrderNumber,
    salesExecutive: document.salesExecutive,
    priority: document.priority,
    status: document.status,
    paymentMode: document.paymentMode,
    paymentMethod: '',
    paymentTerm: document.paymentTerm,
    placeOfSupply: document.placeOfSupply,
    invoiceReference: document.number,
    remarks: document.remarks,
  };
}

function mapDocumentLines(document?: SaleInvoiceDocument): SaleInvoiceLineForm[] {
  if (!document) {
    return [createEmptyLine(0)];
  }

  return document.lines.map((line, index) => ({
    id: `sale-invoice-edit-line-${index}`,
    productCode: line.productCode,
    productName: line.productName,
    hsnSac: line.hsnSac,
    uom: line.uom,
    rate: line.rate,
    orderQty: line.orderQuantity,
    allocationQty: line.convertedQuantity,
    invoiceQty: line.orderQuantity,
    serialNumber: '',
    location: '',
    discountPercent: line.discountPercent,
    discountAmount: line.discountAmount,
    taxableAmount: line.taxableAmount,
    taxColumn: line.taxationColumn,
    totalAmount: line.lineAmount,
    remarks: line.remark,
  }));
}

const CreateSaleInvoice: React.FC<CreateSaleInvoiceProps> = ({
  editingDocument,
  onBack,
  onNavigateToSaleInvoiceList,
}) => {
  const quickLinkMenuRef = useRef<HTMLDivElement | null>(null);
  const voicePrefillAppliedRef = useRef<string | null>(null);
  const [formData, setFormData] = useState<SaleInvoiceFormData>(() => mapDocumentToForm(editingDocument));
  const [lines, setLines] = useState<SaleInvoiceLineForm[]>(() => mapDocumentLines(editingDocument));
  const [activeTab, setActiveTab] = useState<SaleInvoiceTabKey>('general-details');
  const [searchMode, setSearchMode] = useState<SearchMode>('sale-order');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchResultsOpen, setIsSearchResultsOpen] = useState(false);
  const [selectedSaleOrderId, setSelectedSaleOrderId] = useState<string | null>(null);
  const [selectedAllocationId, setSelectedAllocationId] = useState<string | null>(null);
  const [selectedCustomerCode, setSelectedCustomerCode] = useState<string | null>(null);
  const [isQuickLinkMenuOpen, setIsQuickLinkMenuOpen] = useState(false);
  const [quickPreviewTarget, setQuickPreviewTarget] = useState<QuickPreviewTarget>(null);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isClearSearchDialogOpen, setIsClearSearchDialogOpen] = useState(false);
  const [isSaveSuccessDialogOpen, setIsSaveSuccessDialogOpen] = useState(false);
  const [isAmountDrawerOpen, setIsAmountDrawerOpen] = useState(false);

  const tabs: Array<{ id: SaleInvoiceTabKey; label: string }> = [
    { id: 'general-details', label: 'General Details' },
    { id: 'product-details', label: 'Product Details' },
    { id: 'payment-details', label: 'Payment Details' },
  ];

  const totalAmount = useMemo(
    () => lines.reduce((sum, line) => sum + parseDecimal(line.totalAmount), 0),
    [lines]
  );
  const taxableAmount = useMemo(
    () => lines.reduce((sum, line) => sum + parseDecimal(line.taxableAmount), 0),
    [lines]
  );
  const discountAmount = useMemo(
    () => lines.reduce((sum, line) => sum + parseDecimal(line.discountAmount), 0),
    [lines]
  );
  const grossInvoiceAmount = useMemo(
    () =>
      lines.reduce((sum, line) => {
        const baseAmount = parseDecimal(line.rate) * parseDecimal(line.invoiceQty);
        return sum + baseAmount + baseAmount * 0.18;
      }, 0),
    [lines]
  );
  const totalTaxAmount = useMemo(
    () => Math.max(totalAmount - taxableAmount, 0),
    [taxableAmount, totalAmount]
  );
  const matchingSaleOrders = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    if (!normalizedSearch) {
      return extendedSaleOrderDocuments;
    }

    return extendedSaleOrderDocuments.filter(
      (saleOrder) =>
        saleOrder.number.toLowerCase().includes(normalizedSearch) ||
        saleOrder.customerName.toLowerCase().includes(normalizedSearch) ||
        saleOrder.salesExecutive.toLowerCase().includes(normalizedSearch) ||
        saleOrder.status.toLowerCase().includes(normalizedSearch)
    );
  }, [searchQuery]);
  const matchingAllocations = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    if (!normalizedSearch) {
      return extendedSaleAllocationDocuments;
    }

    return extendedSaleAllocationDocuments.filter(
      (allocation) =>
        allocation.number.toLowerCase().includes(normalizedSearch) ||
        allocation.customerName.toLowerCase().includes(normalizedSearch) ||
        allocation.salesExecutive.toLowerCase().includes(normalizedSearch) ||
        allocation.status.toLowerCase().includes(normalizedSearch)
    );
  }, [searchQuery]);
  const matchingCustomers = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    if (!normalizedSearch) {
      return customerSearchOptions;
    }

    return customerSearchOptions.filter(
      (customer) =>
        customer.code.toLowerCase().includes(normalizedSearch) ||
        customer.label.toLowerCase().includes(normalizedSearch) ||
        customer.email.toLowerCase().includes(normalizedSearch) ||
        customer.mobileNumber.toLowerCase().includes(normalizedSearch) ||
        customer.gstin.toLowerCase().includes(normalizedSearch)
    );
  }, [searchQuery]);
  const selectedSaleOrder = useMemo(
    () => extendedSaleOrderDocuments.find((saleOrder) => saleOrder.id === selectedSaleOrderId) ?? null,
    [selectedSaleOrderId]
  );
  const selectedAllocation = useMemo(
    () => extendedSaleAllocationDocuments.find((allocation) => allocation.id === selectedAllocationId) ?? null,
    [selectedAllocationId]
  );
  const selectedCustomer = useMemo(
    () => customerSearchOptions.find((customer) => customer.code === selectedCustomerCode) ?? null,
    [selectedCustomerCode]
  );
  const hasSearchSelection = Boolean(selectedSaleOrder || selectedAllocation || selectedCustomer);
  const linkedSaleOrder = useMemo(() => {
    if (selectedSaleOrder) {
      return selectedSaleOrder;
    }

    if (!selectedAllocation?.customerName) {
      return null;
    }

    return (
      extendedSaleOrderDocuments.find(
        (saleOrder) => saleOrder.customerName === selectedAllocation.customerName
      ) ?? null
    );
  }, [selectedAllocation, selectedSaleOrder]);
  const isParentDocumentFlow = Boolean(selectedSaleOrder || selectedAllocation);
  const isSaleInvoiceLineComplete = (line: SaleInvoiceLineForm) =>
    hasRequiredGridValues(line, ['productCode', 'rate', 'invoiceQty']);
  const canAddProductLine = !isParentDocumentFlow && (lines.length === 0 || isSaleInvoiceLineComplete(lines[lines.length - 1]));
  const previewSaleOrder = quickPreviewTarget === 'sale-order' ? linkedSaleOrder : null;
  const previewAllocation = quickPreviewTarget === 'allocation' ? selectedAllocation : null;
  const previewDrawerTitle = previewSaleOrder?.number ?? previewAllocation?.number ?? 'Document preview';
  const previewDrawerSubtitle = previewSaleOrder
    ? 'Read-only sale order preview'
    : previewAllocation
      ? 'Read-only allocation preview'
      : undefined;

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

  const openQuickPreview = (target: Exclude<QuickPreviewTarget, null>) => {
    const hasDocument = target === 'sale-order' ? Boolean(linkedSaleOrder) : Boolean(selectedAllocation);
    if (!hasDocument) {
      return;
    }

    setQuickPreviewTarget(target);
    setIsQuickLinkMenuOpen(false);
  };

  const updateFormData = (field: keyof SaleInvoiceFormData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const updateLine = (lineId: string, field: keyof SaleInvoiceLineForm, value: string) => {
    if (isParentDocumentFlow && field === 'productCode') {
      return;
    }

    setLines((current) =>
      current.map((line) => {
        if (line.id !== lineId) {
          return line;
        }

        const nextLine = { ...line, [field]: value };

        if (field === 'productCode') {
          const product = productOptions.find((option) => option.code === value);
          nextLine.productName = product?.name ?? '';
          nextLine.hsnSac = product?.hsnSac ?? '';
          nextLine.uom = product?.uom ?? '';
          nextLine.rate = product?.rate ?? '';
        }

        const baseAmount = parseDecimal(nextLine.rate) * parseDecimal(nextLine.invoiceQty);
        if (field === 'discountPercent') {
          nextLine.discountAmount = formatDecimal(baseAmount * parseDecimal(nextLine.discountPercent) / 100);
        }
        if (field === 'discountAmount') {
          nextLine.discountPercent = baseAmount > 0 ? formatDecimal(parseDecimal(nextLine.discountAmount) / baseAmount * 100) : '0.00';
        }
        const taxable = Math.max(baseAmount - parseDecimal(nextLine.discountAmount), 0);
        nextLine.taxableAmount = formatDecimal(taxable);
        nextLine.totalAmount = formatDecimal(taxable + taxable * 0.18);

        return nextLine;
      })
    );
  };

  const addLine = () => {
    if (!canAddProductLine) {
      return;
    }

    setLines((current) => [...current, createEmptyLine(current.length)]);
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
      canAddLine: !isParentDocumentFlow,
      isLineComplete: isSaleInvoiceLineComplete,
      onAddLine: addLine,
    });
  };

  const createLinesFromSaleOrder = (saleOrder: SaleOrderDocument): SaleInvoiceLineForm[] =>
    saleOrder.lines.map((line, index) => ({
      id: `si-so-line-${saleOrder.id}-${index}`,
      productCode: line.productCode,
      productName: line.productName,
      hsnSac: line.hsnSac,
      uom: line.uom,
      rate: line.rate,
      orderQty: line.orderQuantity,
      allocationQty: line.convertedQuantity,
      invoiceQty: line.orderQuantity,
      serialNumber: '',
      location: '',
      discountPercent: line.discountPercent,
      discountAmount: line.discountAmount,
      taxableAmount: line.taxableAmount,
      taxColumn: line.taxationColumn,
      totalAmount: line.lineAmount,
      remarks: line.remark,
    }));

  const createLinesFromAllocation = (allocation: SaleAllocationDocument): SaleInvoiceLineForm[] =>
    allocation.lines.map((line, index) => {
      const product = productOptions.find((option) => option.code === line.productCode);
      const invoiceQty = parseDecimal(line.allocatedQty) > 0 ? line.allocatedQty : line.requestedQty;
      const inferredRate = parseDecimal(invoiceQty) > 0 ? formatDecimal(parseDecimal(line.amount) / parseDecimal(invoiceQty)) : '';

      return {
        id: `si-allocation-line-${allocation.id}-${index}`,
        productCode: line.productCode,
        productName: line.productName,
        hsnSac: product?.hsnSac ?? '',
        uom: line.uom,
        rate: product?.rate ?? inferredRate,
        orderQty: line.requestedQty,
        allocationQty: line.allocatedQty,
        invoiceQty,
        serialNumber: '',
        location: allocation.sourceLocation,
        discountPercent: '0.00',
        discountAmount: '0.00',
        taxableAmount: line.amount,
        taxColumn: 'GST 18%',
        totalAmount: formatDecimal(parseDecimal(line.amount) + parseDecimal(line.amount) * 0.18),
        remarks: line.remark,
      };
    });

  const handleSelectCustomer = (customerCode: string) => {
    const customer = customerSearchOptions.find((option) => option.code === customerCode);
    if (!customer) {
      return;
    }

    setSelectedCustomerCode(customer.code);
    setSelectedSaleOrderId(null);
    setSelectedAllocationId(null);
    setLines([createEmptyLine(0)]);
    updateFormData('customer', customer.value);
    setSearchQuery('');
    setIsSearchResultsOpen(false);
  };

  const handleSelectSaleOrder = (saleOrderId: string) => {
    const saleOrder = extendedSaleOrderDocuments.find((option) => option.id === saleOrderId);
    if (!saleOrder) {
      return;
    }

    const linkedCustomer = customerSearchOptions.find((option) => option.value === saleOrder.customerName) ?? null;
    setSelectedSaleOrderId(saleOrder.id);
    setSelectedAllocationId(null);
    setSelectedCustomerCode(linkedCustomer?.code ?? null);
    setFormData((current) => ({
      ...current,
      customer: saleOrder.customerName,
      saleOrderNumber: saleOrder.number,
      salesExecutive: saleOrder.salesExecutive,
      priority: saleOrder.priority,
      paymentMode: saleOrder.paymentMode,
      paymentMethod: saleOrder.paymentMethod,
      paymentTerm: saleOrder.paymentTerm,
      placeOfSupply: saleOrder.placeOfSupply,
      remarks: saleOrder.paymentRemarks,
    }));
    setLines(createLinesFromSaleOrder(saleOrder));
    setSearchQuery('');
    setIsSearchResultsOpen(false);
  };

  const handleSelectAllocation = (allocationId: string) => {
    const allocation = extendedSaleAllocationDocuments.find((option) => option.id === allocationId);
    if (!allocation) {
      return;
    }

    const linkedCustomer = customerSearchOptions.find((option) => option.value === allocation.customerName) ?? null;
    setSelectedAllocationId(allocation.id);
    setSelectedSaleOrderId(null);
    setSelectedCustomerCode(linkedCustomer?.code ?? null);
    setFormData((current) => ({
      ...current,
      customer: allocation.customerName,
      saleOrderNumber: allocation.number,
      salesExecutive: allocation.salesExecutive,
      priority: allocation.priority,
      placeOfSupply: allocation.destinationLocation,
      remarks: allocation.instructions,
    }));
    setLines(createLinesFromAllocation(allocation));
    setSearchQuery('');
    setIsSearchResultsOpen(false);
  };
  const handleSelectSaleOrderRef = useRef(handleSelectSaleOrder);
  const handleSelectAllocationRef = useRef(handleSelectAllocation);
  const handleSelectCustomerRef = useRef(handleSelectCustomer);

  React.useEffect(() => {
    handleSelectSaleOrderRef.current = handleSelectSaleOrder;
    handleSelectAllocationRef.current = handleSelectAllocation;
    handleSelectCustomerRef.current = handleSelectCustomer;
  });

  React.useEffect(() => {
    if (editingDocument) {
      return;
    }

    const applyVoicePrefill = () => {
      const hashQuery = window.location.hash.split('?')[1] ?? '';
      const params = new URLSearchParams(hashQuery);
      const source = params.get('source');
      const sourceId = params.get('sourceId');
      const customerValue = params.get('customer') ?? params.get('customerQuery');
      const prefillKey = params.toString();

      if (voicePrefillAppliedRef.current === prefillKey) {
        return;
      }

      voicePrefillAppliedRef.current = prefillKey;

      if (source === 'sale-order' && sourceId) {
        handleSelectSaleOrderRef.current(sourceId);
        return;
      }

      if (source === 'allocation' && sourceId) {
        handleSelectAllocationRef.current(sourceId);
        return;
      }

      if (!customerValue) {
        return;
      }

      const normalizedCustomer = customerValue.trim().toLowerCase();
      const matchedCustomer =
        customerSearchOptions.find(
          (customer) =>
            customer.code.toLowerCase() === normalizedCustomer ||
            customer.value.toLowerCase() === normalizedCustomer ||
            customer.label.toLowerCase() === normalizedCustomer
        ) ??
        customerSearchOptions.find(
          (customer) =>
            customer.value.toLowerCase().includes(normalizedCustomer) ||
            customer.label.toLowerCase().includes(normalizedCustomer)
        );

      if (matchedCustomer) {
        handleSelectCustomerRef.current(matchedCustomer.code);
        return;
      }

      setSearchMode('customer');
      setSearchQuery(customerValue);
      setIsSearchResultsOpen(true);
    };

    applyVoicePrefill();
    window.addEventListener('hashchange', applyVoicePrefill);
    return () => window.removeEventListener('hashchange', applyVoicePrefill);
  }, [editingDocument]);

  const clearSearchSelection = () => {
    setSelectedSaleOrderId(null);
    setSelectedAllocationId(null);
    setSelectedCustomerCode(null);
    setActiveTab('general-details');
    setIsQuickLinkMenuOpen(false);
    setQuickPreviewTarget(null);
    setIsAmountDrawerOpen(false);
    setSearchQuery('');
    setLines([createEmptyLine(0)]);
    setFormData((current) => ({
      ...current,
      customer: '',
      saleOrderNumber: '',
      salesExecutive: '',
      priority: '',
      paymentMode: '',
      paymentMethod: '',
      paymentTerm: '',
      placeOfSupply: '',
      remarks: '',
    }));
  };

  const requestClearSearchSelection = () => {
    if (!hasSearchSelection) {
      clearSearchSelection();
      return;
    }

    setIsClearSearchDialogOpen(true);
  };

  const selectedSearchLabel =
    selectedSaleOrder?.number ?? selectedAllocation?.number ?? selectedCustomer?.label;
  const hasSearchResults =
    searchMode === 'sale-order'
      ? matchingSaleOrders.length > 0
      : searchMode === 'allocation'
        ? matchingAllocations.length > 0
        : matchingCustomers.length > 0;

  return (
    <AppShell
      activeLeaf="sale-invoice"
      onSaleInvoiceClick={onNavigateToSaleInvoiceList}
      contentClassName="create-pr-shell"
      bottomBar={hasSearchSelection ? (
        <div className="po-create__summary-bar">
          <div className="po-create__summary-shell">
            <div className="po-create__summary-metric po-create__summary-metric--right">
              <span className="po-create__summary-label">Total amount</span>
              <span className="po-create__summary-value">Rs {formatCurrency(grossInvoiceAmount)}</span>
            </div>

            <div className="po-create__summary-divider" aria-hidden="true" />

            <div className="po-create__summary-metric po-create__summary-metric--emphasis po-create__summary-metric--right">
              <span className="po-create__summary-label">Net invoice amount</span>

              <div className="po-create__summary-net-row">
                <button
                  type="button"
                  onClick={() => setIsAmountDrawerOpen(true)}
                  className="po-create__summary-trigger"
                  aria-label="Open sale invoice amount breakdown"
                >
                  <span className="po-create__summary-value po-create__summary-value--accent">
                    Rs {formatCurrency(totalAmount)}
                  </span>
                  <ChevronRight size={18} className="po-create__summary-chevron" />
                </button>
              </div>

              {discountAmount > 0 && (
                <div className="po-create__summary-subrow">
                  <span className="po-create__summary-badge">
                    Discount Rs {formatCurrency(discountAmount)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : undefined}
    >
      <div className="create-pr-header">
        <div className="create-pr-header__top">
          <div className="create-pr-header__title-group">
            <button type="button" onClick={onBack} className="page-back-button create-pr-header__back" aria-label="Back to sale invoice catalogue">
              <ArrowLeft size={18} />
            </button>
            <div className="create-pr-header__title-wrap">
              <div className="create-pr-header__title-row">
                <h2 className="brand-page-title create-pr-header__title">
                  {editingDocument ? 'Edit Sale Invoice' : 'New Sale Invoice'}
                </h2>
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
            <button type="button" className="create-pr-header__icon-button" aria-label="Edit sale invoice header">
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
              <div className="po-create__requisition-search-shell sale-allocation-create__search-shell">
                <Search size={16} className="po-create__requisition-search-icon" />
                <select
                  value={searchMode}
                  onChange={(event) => {
                    setSearchMode(event.target.value as SearchMode);
                    setSearchQuery('');
                    setIsSearchResultsOpen(false);
                  }}
                  className="field-select po-create__search-mode-select"
                  aria-label="Search mode"
                  disabled={hasSearchSelection}
                >
                  <option value="sale-order">Sale Order</option>
                  <option value="allocation">Allocation</option>
                  <option value="customer">Customer</option>
                </select>
                {selectedSearchLabel && (
                  <span className="po-create__selected-chip">
                    <span className="po-create__selected-chip-text">{selectedSearchLabel}</span>
                    <button
                      type="button"
                      className="po-create__selected-chip-remove"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={requestClearSearchSelection}
                      aria-label="Remove selected value"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setIsSearchResultsOpen(true);
                  }}
                  onFocus={() => setIsSearchResultsOpen(true)}
                  onBlur={() => {
                    window.setTimeout(() => setIsSearchResultsOpen(false), 140);
                  }}
                  placeholder={
                    selectedSearchLabel
                      ? ''
                      : searchMode === 'sale-order'
                        ? 'Search sale order by number, customer, executive...'
                        : searchMode === 'allocation'
                          ? 'Search allocation by number, customer, executive...'
                          : 'Search customer by code, name, primary number...'
                  }
                  className="search-input po-create__requisition-search-input sale-allocation-create__search-input"
                  aria-label={
                    searchMode === 'sale-order'
                      ? 'Search sale orders'
                      : searchMode === 'allocation'
                        ? 'Search allocations'
                        : 'Search customers'
                  }
                />
              </div>
            </div>

            {isSearchResultsOpen && hasSearchResults && (
              <div
                className="po-create__requisition-results so-create__customer-results sale-allocation-create__search-results"
                role="listbox"
                aria-label={
                  searchMode === 'sale-order'
                    ? 'Sale order results'
                    : searchMode === 'allocation'
                      ? 'Allocation results'
                      : 'Customer results'
                }
              >
                <table className="po-create__requisition-results-table">
                  <thead>
                    {searchMode === 'sale-order' ? (
                      <tr>
                        <th>SO No.</th>
                        <th>Customer</th>
                        <th>Sales executive</th>
                        <th>Requested delivery</th>
                        <th>Status</th>
                        <th>Total amount</th>
                      </tr>
                    ) : searchMode === 'allocation' ? (
                      <tr>
                        <th>Allocation No.</th>
                        <th>Customer</th>
                        <th>Sales executive</th>
                        <th>Requested delivery</th>
                        <th>Status</th>
                        <th>Total amount</th>
                      </tr>
                    ) : (
                      <tr>
                        <th>Customer code</th>
                        <th>Customer name</th>
                        <th>Email</th>
                        <th>Primary number</th>
                        <th>GSTIN</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {searchMode === 'sale-order'
                      ? matchingSaleOrders.map((saleOrder) => (
                          <tr
                            key={saleOrder.id}
                            className="po-create__requisition-results-row"
                            role="option"
                            tabIndex={0}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleSelectSaleOrder(saleOrder.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                handleSelectSaleOrder(saleOrder.id);
                              }
                            }}
                          >
                            <td className="po-create__requisition-results-number">{saleOrder.number}</td>
                            <td>{saleOrder.customerName}</td>
                            <td>{saleOrder.salesExecutive}</td>
                            <td>{formatDate(saleOrder.requestedDeliveryDate)}</td>
                            <td>{saleOrder.status}</td>
                            <td>{saleOrder.totalAmount}</td>
                          </tr>
                        ))
                      : searchMode === 'allocation'
                        ? matchingAllocations.map((allocation) => (
                            <tr
                              key={allocation.id}
                              className="po-create__requisition-results-row"
                              role="option"
                              tabIndex={0}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => handleSelectAllocation(allocation.id)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  handleSelectAllocation(allocation.id);
                                }
                              }}
                            >
                              <td className="po-create__requisition-results-number">{allocation.number}</td>
                              <td>{allocation.customerName}</td>
                              <td>{allocation.salesExecutive}</td>
                              <td>{formatDate(allocation.requestedDeliveryDate)}</td>
                              <td>{allocation.status}</td>
                              <td>{allocation.totalAmount}</td>
                            </tr>
                          ))
                        : matchingCustomers.map((customer) => (
                            <tr
                              key={customer.code}
                              className="po-create__requisition-results-row"
                              role="option"
                              tabIndex={0}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => handleSelectCustomer(customer.code)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  handleSelectCustomer(customer.code);
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

          {hasSearchSelection && (
            <>
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
                      onClick={() => openQuickPreview('sale-order')}
                      disabled={!linkedSaleOrder}
                    >
                      Sale Order
                    </button>
                    <button
                      type="button"
                      className="so-create__quick-link-item"
                      role="menuitem"
                      onClick={() => openQuickPreview('allocation')}
                      disabled={!selectedAllocation}
                    >
                      Allocation
                    </button>
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
              <button type="button" onClick={() => setIsSaveSuccessDialogOpen(true)} className="btn btn--primary">
                Save
              </button>
            </>
          )}
        </div>
      </div>

      <div className="create-pr-page mx-auto w-full max-w-[1800px] px-6 py-6 space-y-6">
        {!hasSearchSelection ? (
          <section className="sale-invoice-create__empty-state">
            <div className="sale-invoice-create__empty-icon">
              <Search size={18} />
            </div>
            <div>
              <h3 className="sale-invoice-create__empty-title">Search to start sale invoice</h3>
              <p className="sale-invoice-create__empty-copy">
                Select a sale order, allocation, or customer from the search above to unlock invoice details.
              </p>
            </div>
          </section>
        ) : (
          <>
            <div className="create-pr-tabs">
              <div className="create-pr-tabs__list" role="tablist" aria-label="Sale invoice sections">
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
        {activeTab === 'general-details' && (
          <div className="space-y-4">
            {(selectedCustomer || linkedSaleOrder || selectedAllocation) && (
              <div className="sale-invoice-create__context-cards">
                {selectedCustomer && (
                  <div className="so-create__customer-card sale-invoice-create__context-card sale-invoice-create__customer-card">
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
                            <span className="so-create__customer-card__phone">{selectedCustomer.mobileNumber}</span>
                            {selectedCustomer.isPrimaryVerified && (
                              <span className="so-create__customer-card__verified" aria-label="Primary number verified">
                                <BadgeCheck size={14} />
                              </span>
                            )}
                            <span className="so-create__customer-card__secondary-phone">{selectedCustomer.secondaryNumber}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsSearchResultsOpen(true)}
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

                {linkedSaleOrder && (
                  <div className="sale-allocation-create__order-card sale-invoice-create__context-card sale-invoice-create__summary-card sale-invoice-create__order-summary-card">
                    <div className="sale-allocation-create__order-card-title sale-invoice-create__summary-title">Order Details</div>
                    <div className="sale-allocation-create__order-card-grid sale-invoice-create__summary-grid">
                      <div className="sale-allocation-create__order-card-item sale-invoice-create__summary-item">
                        <span className="sale-allocation-create__order-card-label">Sale Order Number</span>
                        <span className="sale-allocation-create__order-card-value">{linkedSaleOrder.number}</span>
                      </div>
                      <div className="sale-allocation-create__order-card-item sale-invoice-create__summary-item">
                        <span className="sale-allocation-create__order-card-label">Order Date</span>
                        <span className="sale-allocation-create__order-card-value">{formatDate(linkedSaleOrder.orderDateTime)}</span>
                      </div>
                      <div className="sale-allocation-create__order-card-item sale-invoice-create__summary-item">
                        <span className="sale-allocation-create__order-card-label">Amount</span>
                        <span className="sale-allocation-create__order-card-value">Rs {formatCurrency(parseDecimal(linkedSaleOrder.totalAmount))}</span>
                      </div>
                      <div className="sale-allocation-create__order-card-item sale-invoice-create__summary-item">
                        <span className="sale-allocation-create__order-card-label">Payment Mode</span>
                        <span className="sale-allocation-create__order-card-value">{linkedSaleOrder.paymentMode || '-'}</span>
                      </div>
                      <div className="sale-allocation-create__order-card-item sale-invoice-create__summary-item">
                        <span className="sale-allocation-create__order-card-label">Created by</span>
                        <span className="sale-allocation-create__order-card-value">{linkedSaleOrder.salesExecutive || '-'}</span>
                      </div>
                      <div className="sale-allocation-create__order-card-item sale-invoice-create__summary-item">
                        <span className="sale-allocation-create__order-card-label">Allocation Status</span>
                        <span className="sale-allocation-create__order-card-value">{selectedAllocation?.status ?? 'Not allocated'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedAllocation && (
                  <div className="sale-allocation-create__order-card sale-invoice-create__context-card sale-invoice-create__summary-card sale-invoice-create__allocation-summary-card">
                    <div className="sale-allocation-create__order-card-title sale-invoice-create__summary-title">Allocation Details</div>
                    <div className="sale-allocation-create__order-card-grid sale-invoice-create__summary-grid">
                      <div className="sale-allocation-create__order-card-item sale-invoice-create__summary-item">
                        <span className="sale-allocation-create__order-card-label">Allocation Number</span>
                        <span className="sale-allocation-create__order-card-value">{selectedAllocation.number}</span>
                      </div>
                      <div className="sale-allocation-create__order-card-item sale-invoice-create__summary-item">
                        <span className="sale-allocation-create__order-card-label">Allocation Date</span>
                        <span className="sale-allocation-create__order-card-value">{formatDate(selectedAllocation.requestDateTime)}</span>
                      </div>
                      <div className="sale-allocation-create__order-card-item sale-invoice-create__summary-item">
                        <span className="sale-allocation-create__order-card-label">Allocated by</span>
                        <span className="sale-allocation-create__order-card-value">{selectedAllocation.salesExecutive || '-'}</span>
                      </div>
                      <div className="sale-allocation-create__order-card-item sale-invoice-create__summary-item">
                        <span className="sale-allocation-create__order-card-label">Allocation Status</span>
                        <span className="sale-allocation-create__order-card-value">{selectedAllocation.status}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <section className="rounded border border-slate-200 bg-white p-4 space-y-4">
              <h3 className="brand-section-title font-semibold">Basic Details</h3>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <FormField label="Place of Supply" required>
                  <Select value={formData.placeOfSupply} onChange={(event) => updateFormData('placeOfSupply', event.target.value)} options={placeOfSupplyOptions} />
                </FormField>
                <FormField label="Payment Mode">
                  <Select value={formData.paymentMode} onChange={(event) => updateFormData('paymentMode', event.target.value)} options={paymentModeOptions} />
                </FormField>
                <FormField label="Payment Method">
                  <Select value={formData.paymentMethod} onChange={(event) => updateFormData('paymentMethod', event.target.value)} options={paymentMethodOptions} />
                </FormField>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'product-details' && (
          <div className="rounded border border-slate-200 bg-white p-4">
            <section className="create-pr-grid">
              <div className="create-pr-grid__header">
                <div className="create-pr-grid__title-wrap">
                  <div className="create-pr-grid__title-row">
                    <h4 className="create-pr-grid__title">Product Details</h4>
                    <span className="create-pr-grid__count">{lines.length}</span>
                  </div>
                </div>
                {!isParentDocumentFlow && (
                  <button
                    type="button"
                    onClick={addLine}
                    disabled={!canAddProductLine}
                    className="btn btn--outline btn--icon-left create-pr-grid__add-button"
                  >
                    <Plus size={14} />
                    Add line
                  </button>
                )}
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
                      <th className="create-pr-grid__cell create-pr-grid__cell--number">Rate</th>
                      <th className="create-pr-grid__cell create-pr-grid__cell--number">Order Qty</th>
                      <th className="create-pr-grid__cell create-pr-grid__cell--number">Allocation Qty</th>
                      <th className="create-pr-grid__cell create-pr-grid__cell--number">Invoice Quantity</th>
                      <th className="create-pr-grid__cell">Serial Number</th>
                      <th className="create-pr-grid__cell">Location</th>
                      <th className="create-pr-grid__cell create-pr-grid__cell--number">Discount %</th>
                      <th className="create-pr-grid__cell create-pr-grid__cell--number">Discount Amount</th>
                      <th className="create-pr-grid__cell create-pr-grid__cell--number">Taxable Amount</th>
                      <th className="create-pr-grid__cell">Taxation Column</th>
                      <th className="create-pr-grid__cell create-pr-grid__cell--number">Line Amount</th>
                      <th className="create-pr-grid__cell">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, index) => (
                      <tr key={line.id}>
                        <td className="create-pr-grid__body-cell create-pr-grid__body-cell--action">
                          {!isParentDocumentFlow && (
                            <button
                              type="button"
                              onClick={() => setLines((current) => current.filter((row) => row.id !== line.id))}
                              className="create-pr-grid__delete"
                              aria-label={`Delete line ${index + 1}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                        <td className="create-pr-grid__body-cell">
                          {isParentDocumentFlow ? (
                            <Input value={line.productCode} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly min-w-32" />
                          ) : (
                            <Select
                              value={line.productCode}
                              onChange={(event) => updateLine(line.id, 'productCode', event.target.value)}
                              className="create-pr-grid__control create-pr-grid__control--select min-w-32"
                              options={[{ value: '', label: 'Select product' }, ...productOptions.map((option) => ({ value: option.code, label: option.code }))]}
                            />
                          )}
                        </td>
                        <td className="create-pr-grid__body-cell"><Input value={line.productName} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly min-w-40" /></td>
                        <td className="create-pr-grid__body-cell"><Input value={line.hsnSac} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly min-w-24" /></td>
                        <td className="create-pr-grid__body-cell"><Input value={line.uom} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly min-w-20" /></td>
                        <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number"><Input value={line.rate} onChange={(event) => updateLine(line.id, 'rate', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input create-pr-grid__control--number min-w-24" /></td>
                        <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number"><Input value={line.orderQty} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number min-w-24" /></td>
                        <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number"><Input value={line.allocationQty} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number min-w-28" /></td>
                        <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number"><Input value={line.invoiceQty} onChange={(event) => updateLine(line.id, 'invoiceQty', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input create-pr-grid__control--number min-w-24" /></td>
                        <td className="create-pr-grid__body-cell"><Input value={line.serialNumber} onChange={(event) => updateLine(line.id, 'serialNumber', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input min-w-32" /></td>
                        <td className="create-pr-grid__body-cell"><Input value={line.location} onChange={(event) => updateLine(line.id, 'location', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input min-w-36" /></td>
                        <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number"><Input value={line.discountPercent} onChange={(event) => updateLine(line.id, 'discountPercent', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input create-pr-grid__control--number min-w-24" /></td>
                        <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number"><Input value={line.discountAmount} onChange={(event) => updateLine(line.id, 'discountAmount', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input create-pr-grid__control--number min-w-28" /></td>
                        <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number"><Input value={line.taxableAmount} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number min-w-28" /></td>
                        <td className="create-pr-grid__body-cell"><Input value={line.taxColumn} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly min-w-24" /></td>
                        <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number"><Input value={line.totalAmount} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number min-w-28" /></td>
                        <td className="create-pr-grid__body-cell">
                          <Input
                            value={line.remarks}
                            onChange={(event) => updateLine(line.id, 'remarks', event.target.value)}
                            onKeyDown={(event) => handleRemarksKeyDown(event, line.id)}
                            className="create-pr-grid__control create-pr-grid__control--input min-w-36"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="create-pr-grid__footer-cell" colSpan={12}>Total</td>
                      <td className="create-pr-grid__footer-cell create-pr-grid__footer-cell--number">{formatDecimal(discountAmount)}</td>
                      <td className="create-pr-grid__footer-cell create-pr-grid__footer-cell--number">{formatDecimal(taxableAmount)}</td>
                      <td className="create-pr-grid__footer-cell"></td>
                      <td className="create-pr-grid__footer-cell create-pr-grid__footer-cell--number">{formatDecimal(totalAmount)}</td>
                      <td className="create-pr-grid__footer-cell"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'payment-details' && (
          <section className="rounded border border-slate-200 bg-white p-4 space-y-4">
            <h3 className="brand-section-title font-semibold">Payment Details</h3>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <FormField label="Payment Term">
                  <Select value={formData.paymentTerm} onChange={(event) => updateFormData('paymentTerm', event.target.value)} options={paymentTermOptions} />
                </FormField>
                <FormField label="Remarks">
                  <Textarea value={formData.remarks} onChange={(event) => updateFormData('remarks', event.target.value)} rows={3} placeholder="Enter invoice remarks" />
                </FormField>
              </div>
            </section>
        )}
          </>
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
          onNavigateToSaleInvoiceList();
        }}
        onClose={() => setIsDiscardDialogOpen(false)}
      />

      <ConfirmationDialog
        isOpen={isClearSearchDialogOpen}
        title="Discard selected information?"
        description="Your entered or selected sale invoice information will be discarded. Are you sure you want to remove this selection?"
        confirmLabel="Yes"
        cancelLabel="No"
        onConfirm={() => {
          setIsClearSearchDialogOpen(false);
          clearSearchSelection();
        }}
        onClose={() => setIsClearSearchDialogOpen(false)}
      />

      <SuccessSummaryDialog
        isOpen={isSaveSuccessDialogOpen}
        title="Saved successfully!"
        documentLabel="Sale invoice No"
        documentNumber={formData.number}
        sectionTitle="Invoice Summary"
        items={[
          { label: 'Customer', value: formData.customer || '-' },
          { label: 'Sale order', value: formData.saleOrderNumber || '-' },
          { label: 'Priority', value: formData.priority || '-' },
          { label: 'Line count', value: `${lines.filter((line) => Boolean(line.productCode)).length}` },
          { label: 'Taxable amount', value: `Rs ${formatCurrency(taxableAmount)}` },
        ]}
        totalLabel="Invoice amount"
        totalValue={`Rs ${formatCurrency(totalAmount)}`}
        primaryActionLabel="Go to catalogue"
        onPrimaryAction={() => {
          setIsSaveSuccessDialogOpen(false);
          onNavigateToSaleInvoiceList();
        }}
        onClose={() => setIsSaveSuccessDialogOpen(false)}
      />

      <SideDrawer
        isOpen={Boolean(quickPreviewTarget)}
        title={previewDrawerTitle}
        subtitle={previewDrawerSubtitle}
        onClose={() => setQuickPreviewTarget(null)}
        contentClassName="sale-invoice-preview"
      >
        {previewSaleOrder && (
          <>
            <section className="sale-invoice-preview__section">
              <h3 className="sale-invoice-preview__section-title">Sale order details</h3>
              <div className="sale-invoice-preview__profile">
                <div className="sale-invoice-preview__row">
                  <span>Customer</span>
                  <strong>{previewSaleOrder.customerName}</strong>
                </div>
                <div className="sale-invoice-preview__row">
                  <span>Order date</span>
                  <strong>{formatDate(previewSaleOrder.orderDateTime)}</strong>
                </div>
                <div className="sale-invoice-preview__row">
                  <span>Sales executive</span>
                  <strong>{previewSaleOrder.salesExecutive}</strong>
                </div>
                <div className="sale-invoice-preview__row">
                  <span>Priority</span>
                  <strong>{previewSaleOrder.priority}</strong>
                </div>
                <div className="sale-invoice-preview__row">
                  <span>Status</span>
                  <strong>{previewSaleOrder.status}</strong>
                </div>
                <div className="sale-invoice-preview__row">
                  <span>Total amount</span>
                  <strong>Rs {formatCurrency(parseDecimal(previewSaleOrder.totalAmount))}</strong>
                </div>
              </div>
            </section>

            <section className="sale-invoice-preview__section">
              <h3 className="sale-invoice-preview__section-title">Product details</h3>
              <div className="sale-invoice-preview__table-wrap">
                <table className="sale-invoice-preview__table">
                  <thead>
                    <tr>
                      <th>Product Code</th>
                      <th>Product Name</th>
                      <th>UOM</th>
                      <th>Order Qty</th>
                      <th>Rate</th>
                      <th>Line Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewSaleOrder.lines.map((line) => (
                      <tr key={`${previewSaleOrder.id}-${line.productCode}`}>
                        <td>{line.productCode}</td>
                        <td>{line.productName}</td>
                        <td>{line.uom}</td>
                        <td>{line.orderQuantity}</td>
                        <td>{line.rate}</td>
                        <td>{line.lineAmount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {previewAllocation && (
          <>
            <section className="sale-invoice-preview__section">
              <h3 className="sale-invoice-preview__section-title">Allocation details</h3>
              <div className="sale-invoice-preview__profile">
                <div className="sale-invoice-preview__row">
                  <span>Customer</span>
                  <strong>{previewAllocation.customerName}</strong>
                </div>
                <div className="sale-invoice-preview__row">
                  <span>Allocation date</span>
                  <strong>{formatDate(previewAllocation.requestDateTime)}</strong>
                </div>
                <div className="sale-invoice-preview__row">
                  <span>Allocated by</span>
                  <strong>{previewAllocation.salesExecutive}</strong>
                </div>
                <div className="sale-invoice-preview__row">
                  <span>Source location</span>
                  <strong>{previewAllocation.sourceLocation}</strong>
                </div>
                <div className="sale-invoice-preview__row">
                  <span>Status</span>
                  <strong>{previewAllocation.status}</strong>
                </div>
                <div className="sale-invoice-preview__row">
                  <span>Total amount</span>
                  <strong>Rs {formatCurrency(parseDecimal(previewAllocation.totalAmount))}</strong>
                </div>
              </div>
            </section>

            <section className="sale-invoice-preview__section">
              <h3 className="sale-invoice-preview__section-title">Product details</h3>
              <div className="sale-invoice-preview__table-wrap">
                <table className="sale-invoice-preview__table">
                  <thead>
                    <tr>
                      <th>Product Code</th>
                      <th>Product Name</th>
                      <th>UOM</th>
                      <th>Requested Qty</th>
                      <th>Allocated Qty</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewAllocation.lines.map((line) => (
                      <tr key={`${previewAllocation.id}-${line.productCode}`}>
                        <td>{line.productCode}</td>
                        <td>{line.productName}</td>
                        <td>{line.uom}</td>
                        <td>{line.requestedQty}</td>
                        <td>{line.allocatedQty}</td>
                        <td>{line.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </SideDrawer>

      <AmountBreakdownDrawer
        isOpen={isAmountDrawerOpen}
        title="Invoice amount details"
        subtitle="Review the amount summary for this sale invoice."
        items={[
          { label: 'Gross invoice amount', value: `Rs ${formatCurrency(grossInvoiceAmount)}` },
          { label: 'Total discount', value: `Rs ${formatCurrency(discountAmount)}` },
          { label: 'Taxable amount', value: `Rs ${formatCurrency(taxableAmount)}` },
          { label: 'Total tax', value: `Rs ${formatCurrency(totalTaxAmount)}` },
        ]}
        totalLabel="Net invoice amount"
        totalValue={`Rs ${formatCurrency(totalAmount)}`}
        note={`This summary is calculated from ${lines.length} line item${lines.length === 1 ? '' : 's'} in the product details grid.`}
        onClose={() => setIsAmountDrawerOpen(false)}
      />
    </AppShell>
  );
};

export default CreateSaleInvoice;
