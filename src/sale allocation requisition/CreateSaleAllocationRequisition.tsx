import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
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
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import SuccessSummaryDialog from '../components/common/SuccessSummaryDialog';
import { FormField, Input, Select } from '../components/common/FormControls';
import { handleGridLastCellTab, hasRequiredGridValues } from '../components/common/gridKeyboard';
import { cn } from '../utils/classNames';
import { formatDate } from '../utils/dateFormat';
import type { SaleAllocationRequisitionDocument } from './saleAllocationRequisitionData';
import {
  extendedSaleOrderDocuments,
  type SaleOrderDocument,
} from '../sale order/saleOrderData';

type SaleAllocationTabKey = 'customer-request' | 'product-detail';
type SalePriority = '' | 'Low' | 'Medium' | 'High';
type SaleAllocationStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Cancelled';
type SaleAllocationLineType = 'Serialized' | 'Non-serialized';

interface SaleAllocationLineForm {
  id: string;
  itemType: SaleAllocationLineType;
  productCode: string;
  productName: string;
  hsnSac: string;
  category: string;
  uom: string;
  serialNumber: string;
  requirementDate: string;
  requestedQty: string;
  allocatedQty: string;
  allocationQty: string;
  location: string;
  secondarySerialNumber: string;
  requestedAllocationDate: string;
  priority: SalePriority;
  remark: string;
  amount: string;
}

interface SaleAllocationFormData {
  number: string;
  documentDate: string;
  customer: string;
  department: string;
  orderSource: string;
  salesExecutive: string;
  requestedDeliveryDate: string;
  validTillDate: string;
  warehouse: string;
  allocationMode: string;
  priority: SalePriority;
  status: SaleAllocationStatus;
}

interface CreateSaleAllocationRequisitionProps {
  editingDocument?: SaleAllocationRequisitionDocument;
  onBack: () => void;
  onNavigateToSaleAllocationRequisitionList: () => void;
}

type SearchMode = 'sale-order' | 'customer';

interface ProductLookupOption {
  code: string;
  name: string;
  hsnSac: string;
  category: string;
  itemType: SaleAllocationLineType;
  uoms: string[];
  unitValue: string;
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

const departmentOptions = [
  { value: '', label: 'Select department' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Engineering', label: 'Engineering' },
];

const warehouseOptions = [
  { value: '', label: 'Select warehouse' },
  { value: 'Pune Central Warehouse', label: 'Pune Central Warehouse' },
  { value: 'North Regional Hub', label: 'North Regional Hub' },
  { value: 'Bengaluru Distribution Centre', label: 'Bengaluru Distribution Centre' },
];

const warehouseLocationOptions: Record<string, string[]> = {
  'Pune Central Warehouse': ['Pune Aisle A1', 'Pune Aisle B2', 'Pune Secure Bay'],
  'North Regional Hub': ['North Rack N1', 'North Rack N2', 'North Dispatch Zone'],
  'Bengaluru Distribution Centre': ['Bengaluru Bin B1', 'Bengaluru Bin C2', 'Bengaluru Secure Bay'],
};

const serialInventoryOptions = [
  { warehouse: 'Pune Central Warehouse', location: 'Pune Aisle A1', productCode: 'SP-1001', serialNumber: 'BRK-PUN-0001' },
  { warehouse: 'Pune Central Warehouse', location: 'Pune Aisle A1', productCode: 'SP-1001', serialNumber: 'BRK-PUN-0002' },
  { warehouse: 'Pune Central Warehouse', location: 'Pune Aisle B2', productCode: 'SP-1001', serialNumber: 'BRK-PUN-0003' },
  { warehouse: 'Pune Central Warehouse', location: 'Pune Secure Bay', productCode: 'SP-1003', serialNumber: 'ALT-PUN-0001' },
  { warehouse: 'North Regional Hub', location: 'North Rack N1', productCode: 'SP-1001', serialNumber: 'BRK-NOR-0001' },
  { warehouse: 'North Regional Hub', location: 'North Rack N2', productCode: 'SP-1003', serialNumber: 'ALT-NOR-0001' },
  { warehouse: 'Bengaluru Distribution Centre', location: 'Bengaluru Bin B1', productCode: 'SP-1001', serialNumber: 'BRK-BLR-0001' },
  { warehouse: 'Bengaluru Distribution Centre', location: 'Bengaluru Bin C2', productCode: 'SP-1003', serialNumber: 'ALT-BLR-0001' },
];

const allocationModeOptions = [
  { value: '', label: 'Select allocation mode' },
  { value: 'Priority-based', label: 'Priority-based' },
  { value: 'Demand-based', label: 'Demand-based' },
  { value: 'Confirmed order pool', label: 'Confirmed order pool' },
];

const priorityOptions = [
  { value: '', label: 'Select priority' },
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
];

const productLookupOptions: ProductLookupOption[] = [
  { code: 'SP-1001', name: 'Front Brake Assembly', hsnSac: '870830', category: 'Braking', itemType: 'Serialized', uoms: ['Unit'], unitValue: '12500.00' },
  { code: 'SP-1002', name: 'Clutch Master Cylinder', hsnSac: '870893', category: 'Transmission', itemType: 'Non-serialized', uoms: ['Unit'], unitValue: '8800.00' },
  { code: 'SP-1003', name: 'Alternator Kit', hsnSac: '851150', category: 'Electrical', itemType: 'Serialized', uoms: ['Set'], unitValue: '21600.00' },
  { code: 'SP-1004', name: 'Steering Rack Kit', hsnSac: '870894', category: 'Steering', itemType: 'Non-serialized', uoms: ['Unit'], unitValue: '15000.00' },
];

function parseDecimal(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDecimal(value: number): string {
  return value.toFixed(2);
}

function formatReadOnlyQuantity(value: string | number): string {
  return formatDecimal(parseDecimal(String(value)));
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function createEmptyLine(index: number, itemType: SaleAllocationLineType = 'Serialized'): SaleAllocationLineForm {
  return {
    id: `sar-line-${Date.now()}-${index}`,
    itemType,
    productCode: '',
    productName: '',
    hsnSac: '',
    category: '',
    uom: '',
    serialNumber: '',
    requirementDate: '',
    requestedQty: '',
    allocatedQty: '0.00',
    allocationQty: '',
    location: '',
    secondarySerialNumber: '',
    requestedAllocationDate: '',
    priority: '',
    remark: '',
    amount: '0.00',
  };
}

function getProductOption(code: string): ProductLookupOption | undefined {
  return productLookupOptions.find((product) => product.code === code);
}

function getLocationOptions(warehouse: string): string[] {
  return warehouseLocationOptions[warehouse] ?? [];
}

function getSerialNumberOptions(warehouse: string, location: string, productCode: string): string[] {
  return serialInventoryOptions
    .filter(
      (item) =>
        item.warehouse === warehouse &&
        item.location === location &&
        item.productCode === productCode
    )
    .map((item) => item.serialNumber);
}

function createLineFromSaleOrder(
  saleOrderId: string,
  line: SaleOrderDocument['lines'][number],
  index: number,
  itemIndex = 0
): SaleAllocationLineForm {
  const product = getProductOption(line.productCode);
  const itemType = product?.itemType ?? 'Non-serialized';
  const allocatedQuantity = Math.floor(parseDecimal(line.convertedQuantity));
  const isAllocatedSerializedUnit = itemType === 'Serialized' && itemIndex > 0 && itemIndex <= allocatedQuantity;

  return {
    id: `sar-so-line-${saleOrderId}-${index}-${itemIndex}`,
    itemType,
    productCode: line.productCode,
    productName: line.productName,
    hsnSac: line.hsnSac,
    category: product?.category ?? 'Product',
    uom: line.uom,
    serialNumber: '',
    requirementDate: line.requestedDate,
    requestedQty: itemType === 'Serialized' ? formatDecimal(1) : line.orderQuantity,
    allocatedQty: itemType === 'Serialized'
      ? isAllocatedSerializedUnit
        ? formatDecimal(1)
        : ''
      : line.convertedQuantity,
    allocationQty: '',
    location: '',
    secondarySerialNumber: '',
    requestedAllocationDate: line.requestedDate,
    priority: line.priority,
    remark: line.remark,
    amount: line.lineAmount,
  };
}

function createAllocationLinesFromSaleOrder(saleOrder: SaleOrderDocument): SaleAllocationLineForm[] {
  return saleOrder.lines.flatMap((line, index) => {
    const product = getProductOption(line.productCode);
    if (product?.itemType !== 'Serialized') {
      return [createLineFromSaleOrder(saleOrder.id, line, index)];
    }

    const orderQuantity = Math.max(0, Math.floor(parseDecimal(line.orderQuantity)));
    return Array.from({ length: orderQuantity }, (_, itemIndex) =>
      createLineFromSaleOrder(saleOrder.id, line, index, itemIndex + 1)
    );
  });
}

function mapDocumentToForm(document?: SaleAllocationRequisitionDocument): SaleAllocationFormData {
  if (!document) {
    return {
      number: 'SAR-2026-00021',
      documentDate: new Date().toISOString().slice(0, 10),
      customer: '',
      department: '',
      orderSource: '',
      salesExecutive: '',
      requestedDeliveryDate: '',
      validTillDate: '',
      warehouse: '',
      allocationMode: '',
      priority: '',
      status: 'Draft',
    };
  }

  return {
    number: document.number,
    documentDate: document.requestDateTime.slice(0, 10),
    customer: document.customerName,
    department: document.department,
    orderSource: document.orderSource,
    salesExecutive: document.salesExecutive,
    requestedDeliveryDate: document.requestedDeliveryDate,
    validTillDate: document.validTillDate,
    warehouse: document.warehouse,
    allocationMode: document.allocationMode,
    priority: document.priority,
    status: document.status,
  };
}

function mapDocumentLines(document?: SaleAllocationRequisitionDocument): SaleAllocationLineForm[] {
  if (!document) {
    return [createEmptyLine(0)];
  }

  return document.lines.map((line, index) => ({
    id: `sar-edit-line-${index}`,
    itemType: getProductOption(line.productCode)?.itemType ?? 'Non-serialized',
    productCode: line.productCode,
    productName: line.productName,
    hsnSac: getProductOption(line.productCode)?.hsnSac ?? '',
    category: line.category,
    uom: line.uom,
    serialNumber: '',
    requirementDate: line.requirementDate,
    requestedQty: line.requestedQty,
    allocatedQty: line.allocatedQty,
    allocationQty: '',
    location: '',
    secondarySerialNumber: '',
    requestedAllocationDate: line.requirementDate,
    priority: line.priority,
    remark: line.remark,
    amount: line.amount,
  }));
}

const CreateSaleAllocationRequisition: React.FC<CreateSaleAllocationRequisitionProps> = ({
  editingDocument,
  onBack,
  onNavigateToSaleAllocationRequisitionList,
}) => {
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const [formData, setFormData] = useState<SaleAllocationFormData>(() => mapDocumentToForm(editingDocument));
  const [lines, setLines] = useState<SaleAllocationLineForm[]>(() => mapDocumentLines(editingDocument));
  const [activeTab, setActiveTab] = useState<SaleAllocationTabKey>('customer-request');
  const [activeProductLineTab, setActiveProductLineTab] = useState<SaleAllocationLineType>('Serialized');
  const [searchMode, setSearchMode] = useState<SearchMode>('sale-order');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchResultsOpen, setIsSearchResultsOpen] = useState(false);
  const [selectedSaleOrderId, setSelectedSaleOrderId] = useState<string | null>(null);
  const [selectedCustomerCode, setSelectedCustomerCode] = useState<string | null>(null);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isSaveSuccessDialogOpen, setIsSaveSuccessDialogOpen] = useState(false);

  const tabs: Array<{ id: SaleAllocationTabKey; label: string }> = [
    { id: 'customer-request', label: 'General Details' },
    { id: 'product-detail', label: 'Product Details' },
  ];

  const matchingCustomers = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    if (!normalizedSearch) {
      return customerOptions;
    }

    return customerOptions.filter(
      (customer) =>
        customer.code.toLowerCase().includes(normalizedSearch) ||
        customer.label.toLowerCase().includes(normalizedSearch) ||
        customer.email.toLowerCase().includes(normalizedSearch) ||
        customer.mobileNumber.toLowerCase().includes(normalizedSearch) ||
        customer.gstin.toLowerCase().includes(normalizedSearch)
    );
  }, [searchQuery]);

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

  const selectedSaleOrder = useMemo(
    () =>
      extendedSaleOrderDocuments.find((saleOrder) => saleOrder.id === selectedSaleOrderId) ?? null,
    [selectedSaleOrderId]
  );

  const selectedCustomer = useMemo(
    () => customerOptions.find((customer) => customer.code === selectedCustomerCode) ?? null,
    [selectedCustomerCode]
  );

  const totalAmount = useMemo(
    () => lines.reduce((sum, line) => sum + parseDecimal(line.amount), 0),
    [lines]
  );
  const serializedCount = useMemo(
    () => lines.filter((line) => line.itemType === 'Serialized').length,
    [lines]
  );
  const nonSerializedCount = useMemo(
    () => lines.filter((line) => line.itemType === 'Non-serialized').length,
    [lines]
  );
  const filteredProductLines = useMemo(
    () => lines.filter((line) => line.itemType === activeProductLineTab),
    [activeProductLineTab, lines]
  );
  const canManuallyAddProductLine = Boolean(selectedCustomer && !selectedSaleOrder);
  const isSaleAllocationLineComplete = (line: SaleAllocationLineForm) =>
    line.itemType === 'Serialized'
      ? hasRequiredGridValues(line, ['productCode', 'uom', 'allocationQty', 'location', 'secondarySerialNumber'])
      : hasRequiredGridValues(line, ['productCode', 'uom', 'requestedQty']);
  const canAddProductLine =
    canManuallyAddProductLine &&
    (filteredProductLines.length === 0 ||
      isSaleAllocationLineComplete(filteredProductLines[filteredProductLines.length - 1]));
  const productLineTotals = useMemo(
    () =>
      filteredProductLines.reduce(
        (totals, line) => {
          const requestedQty = parseDecimal(line.requestedQty);
          const allocatedQty = parseDecimal(line.allocatedQty);

          return {
            requestedQty: totals.requestedQty + requestedQty,
            allocatedQty: totals.allocatedQty + allocatedQty,
            allocationQty: totals.allocationQty + parseDecimal(line.allocationQty),
            pendingQty: totals.pendingQty + Math.max(requestedQty - allocatedQty, 0),
            amount: totals.amount + parseDecimal(line.amount),
          };
        },
        {
          requestedQty: 0,
          allocatedQty: 0,
          allocationQty: 0,
          pendingQty: 0,
          amount: 0,
        }
      ),
    [filteredProductLines]
  );

  const handleFieldChange = <K extends keyof SaleAllocationFormData>(
    field: K,
    value: SaleAllocationFormData[K]
  ) => {
    setFormData((current) => ({ ...current, [field]: value }));
    if (field === 'warehouse') {
      setLines((current) =>
        current.map((line) =>
          line.itemType === 'Serialized'
            ? { ...line, location: '', secondarySerialNumber: '' }
            : line
        )
      );
    }
  };

  useEffect(() => {
    if (!isSearchResultsOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!searchContainerRef.current?.contains(event.target as Node)) {
        setIsSearchResultsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchResultsOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isSearchResultsOpen]);

  const handleSelectCustomer = (customerCode: string) => {
    const customer = customerOptions.find((option) => option.code === customerCode);
    if (!customer) {
      return;
    }

    setSelectedCustomerCode(customer.code);
    handleFieldChange('customer', customer.value);
    setSearchQuery('');
    setIsSearchResultsOpen(false);
  };

  const handleSelectSaleOrder = (saleOrderId: string) => {
    const saleOrder = extendedSaleOrderDocuments.find((option) => option.id === saleOrderId);
    if (!saleOrder) {
      return;
    }

    const linkedCustomer =
      customerOptions.find((option) => option.value === saleOrder.customerName) ??
      customerOptions.find((option) => option.label === saleOrder.customerName) ??
      null;

    setSelectedSaleOrderId(saleOrder.id);
    setSelectedCustomerCode(linkedCustomer?.code ?? null);
    setFormData((current) => ({
      ...current,
      customer: saleOrder.customerName,
      orderSource: saleOrder.orderSource,
      salesExecutive: saleOrder.salesExecutive,
      requestedDeliveryDate: saleOrder.requestedDeliveryDate,
      validTillDate: saleOrder.validTillDate,
      priority: saleOrder.priority,
    }));
    const nextLines = createAllocationLinesFromSaleOrder(saleOrder);
    setLines(nextLines);
    setActiveProductLineTab(
      nextLines.some((line) => line.itemType === 'Serialized') ? 'Serialized' : 'Non-serialized'
    );
    setSearchQuery('');
    setIsSearchResultsOpen(false);
  };

  const clearSearchSelection = () => {
    if (searchMode === 'sale-order') {
      setSelectedSaleOrderId(null);
      setSelectedCustomerCode(null);
      setLines([createEmptyLine(0)]);
    } else {
      setSelectedCustomerCode(null);
      handleFieldChange('customer', '');
    }
    setSearchQuery('');
  };

  const handleLineChange = (lineId: string, field: keyof SaleAllocationLineForm, value: string) => {
    setLines((current) =>
      current.map((line) => {
        if (line.id !== lineId) {
          return line;
        }

        if (field === 'productCode') {
          const product = getProductOption(value);
          const isSerializedProduct = product?.itemType === 'Serialized';
          const nextRequestedQty = isSerializedProduct ? formatDecimal(1) : line.requestedQty;
          const requestedQty = parseDecimal(nextRequestedQty || '0');

          return {
            ...line,
            itemType: product?.itemType ?? line.itemType,
            productCode: value,
            productName: product?.name ?? '',
            hsnSac: product?.hsnSac ?? '',
            category: product?.category ?? '',
            uom: product?.uoms[0] ?? '',
            requestedQty: nextRequestedQty,
            allocatedQty: isSerializedProduct ? '' : line.allocatedQty,
            allocationQty: '',
            secondarySerialNumber: '',
            amount: formatDecimal((product ? parseDecimal(product.unitValue) : 0) * requestedQty),
          };
        }

        const nextLine = { ...line, [field]: value };
        if (field === 'location') {
          const validSerials = getSerialNumberOptions(formData.warehouse, value, line.productCode);
          if (!validSerials.includes(line.secondarySerialNumber)) {
            nextLine.secondarySerialNumber = '';
          }
        }
        if (field === 'requestedQty') {
          const product = getProductOption(nextLine.productCode);
          nextLine.amount = formatDecimal((product ? parseDecimal(product.unitValue) : 0) * parseDecimal(value));
        }

        return nextLine;
      })
    );
  };

  const handleAddProductLine = () => {
    if (!canAddProductLine) {
      return;
    }

    setLines((current) => [
      ...current,
      createEmptyLine(current.length + 1, activeProductLineTab),
    ]);
  };

  const handleLastEditableFieldKeyDown = (
    event: React.KeyboardEvent<HTMLElement>,
    line: SaleAllocationLineForm,
    lineIndex: number
  ) => {
    handleGridLastCellTab({
      event,
      line,
      lineIndex,
      lines: filteredProductLines,
      canAddLine: canManuallyAddProductLine,
      isLineComplete: isSaleAllocationLineComplete,
      onAddLine: handleAddProductLine,
    });
  };

  return (
    <AppShell
      activeLeaf="sale-allocation-requisition"
      onSaleAllocationRequisitionClick={onNavigateToSaleAllocationRequisitionList}
      contentClassName="create-pr-shell"
    >
      <div className="create-pr-header">
        <div className="create-pr-header__top">
          <div className="create-pr-header__title-group">
            <a
              href="#/sale-allocation-requisition"
              onClick={(event) => {
                event.preventDefault();
                onBack();
              }}
              className="page-back-button create-pr-header__back"
              aria-label="Back to sale allocation requisition list"
            >
              <ArrowLeft size={18} />
            </a>
            <div className="create-pr-header__title-wrap">
              <div className="create-pr-header__title-row">
                <h2 className="brand-page-title create-pr-header__title">
                  {editingDocument ? 'Edit Sale Allocation Requisition' : 'New Sale Allocation Requisition'}
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
            <button type="button" className="create-pr-header__icon-button" aria-label="Edit document header">
              <PencilLine size={16} />
            </button>
            <button type="button" className="create-pr-header__icon-button" aria-label="More options">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>

        <div className="create-pr-header__actions">
          <div
            ref={searchContainerRef}
            className="po-create__requisition-picker sale-allocation-create__search-picker"
          >
            <div className="po-create__requisition-search">
              <div className="po-create__requisition-search-shell sale-allocation-create__search-shell">
                <Search size={16} className="po-create__requisition-search-icon" />
                <select
                  value={searchMode}
                  onChange={(event) => {
                    const nextMode = event.target.value as SearchMode;
                    setSearchMode(nextMode);
                    setSearchQuery('');
                    setIsSearchResultsOpen(false);
                  }}
                  className="field-select po-create__search-mode-select"
                  aria-label="Search mode"
                >
                  <option value="sale-order">Sale Order</option>
                  <option value="customer">Customer</option>
                </select>
                {(searchMode === 'sale-order' ? selectedSaleOrder : selectedCustomer) && (
                  <span className="po-create__selected-chip">
                    <span className="po-create__selected-chip-text">
                      {searchMode === 'sale-order'
                        ? selectedSaleOrder?.number
                        : selectedCustomer?.label}
                    </span>
                    <button
                      type="button"
                      className="po-create__selected-chip-remove"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={clearSearchSelection}
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
                  className="search-input po-create__requisition-search-input sale-allocation-create__search-input"
                  placeholder={
                    (searchMode === 'sale-order' ? selectedSaleOrder : selectedCustomer)
                      ? ''
                      : searchMode === 'sale-order'
                      ? 'Search sale order by number, customer, executive...'
                      : 'Search customer by code or name...'
                  }
                  aria-label={
                    searchMode === 'sale-order' ? 'Search sale orders' : 'Search customers'
                  }
                />
              </div>
            </div>

            {isSearchResultsOpen &&
              (searchMode === 'sale-order'
                ? matchingSaleOrders.length > 0
                : matchingCustomers.length > 0) && (
                <div
                  className="po-create__requisition-results so-create__customer-results sale-allocation-create__search-results"
                  role="listbox"
                  aria-label={
                    searchMode === 'sale-order' ? 'Sale order results' : 'Customer results'
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
                        ? matchingSaleOrders.map((saleOrder: SaleOrderDocument) => (
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
                              <td className="po-create__requisition-results-number">
                                {saleOrder.number}
                              </td>
                              <td>{saleOrder.customerName}</td>
                              <td>{saleOrder.salesExecutive}</td>
                              <td>{formatDate(saleOrder.requestedDeliveryDate)}</td>
                              <td>{saleOrder.status}</td>
                              <td>{saleOrder.totalAmount}</td>
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
                              <td className="po-create__requisition-results-number">
                                {customer.code}
                              </td>
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

          <button type="button" onClick={() => setIsDiscardDialogOpen(true)} className="btn btn--outline">
            Discard
          </button>
          <button type="button" onClick={() => setIsSaveSuccessDialogOpen(true)} className="btn btn--primary">
            Save
          </button>
        </div>
      </div>

      <div className="create-pr-page mx-auto w-full max-w-[1800px] px-6 py-6 space-y-6">
        <div className="create-pr-tabs">
          <div className="create-pr-tabs__list" role="tablist" aria-label="Sale allocation requisition sections">
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

        {activeTab === 'customer-request' && (
          <div className="space-y-4">
            {(selectedSaleOrder || selectedCustomer) && (
              <div
                className={cn(
                  'sale-allocation-create__linked-cards',
                  !selectedSaleOrder && selectedCustomer
                    ? 'sale-allocation-create__linked-cards--customer-only'
                    : undefined
                )}
              >
                {selectedSaleOrder && (
                  <div className="sale-allocation-create__order-card">
                    <div className="sale-allocation-create__order-card-title">Sale order details</div>
                    <div className="sale-allocation-create__order-card-grid">
                      <div className="sale-allocation-create__order-card-item">
                        <span className="sale-allocation-create__order-card-label">Sale order number</span>
                        <span className="sale-allocation-create__order-card-value">{selectedSaleOrder.number}</span>
                      </div>
                      <div className="sale-allocation-create__order-card-item">
                        <span className="sale-allocation-create__order-card-label">Order date</span>
                        <span className="sale-allocation-create__order-card-value">
                          {formatDate(selectedSaleOrder.orderDateTime)}
                        </span>
                      </div>
                      <div className="sale-allocation-create__order-card-item">
                        <span className="sale-allocation-create__order-card-label">Created by</span>
                        <span className="sale-allocation-create__order-card-value">
                          {selectedSaleOrder.salesExecutive}
                        </span>
                      </div>
                      <div className="sale-allocation-create__order-card-item">
                        <span className="sale-allocation-create__order-card-label">Delivery promised date</span>
                        <span className="sale-allocation-create__order-card-value">
                          {formatDate(selectedSaleOrder.promisedDeliveryDate)}
                        </span>
                      </div>
                      <div className="sale-allocation-create__order-card-item">
                        <span className="sale-allocation-create__order-card-label">Total amount</span>
                        <span className="sale-allocation-create__order-card-value">
                          Rs {formatCurrency(parseDecimal(selectedSaleOrder.totalAmount))}
                        </span>
                      </div>
                      <div className="sale-allocation-create__order-card-item">
                        <span className="sale-allocation-create__order-card-label">Status</span>
                        <span className="sale-allocation-create__order-card-value">
                          {selectedSaleOrder.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedCustomer && (
                  <div className="so-create__customer-card sale-allocation-create__customer-card">
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
              </div>
            )}

            <div className="rounded border border-slate-200 bg-white p-4 space-y-4">
              <div className="brand-section-title font-semibold">Basic Details</div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <FormField label="Department">
                  <Select
                    value={formData.department}
                    onChange={(event) => handleFieldChange('department', event.target.value)}
                    options={departmentOptions}
                  />
                </FormField>
                <FormField label="Allocation By">
                  <Select
                    value={formData.allocationMode}
                    onChange={(event) => handleFieldChange('allocationMode', event.target.value)}
                    options={allocationModeOptions}
                  />
                </FormField>
                <FormField label="Priority">
                  <Select
                    value={formData.priority}
                    onChange={(event) => handleFieldChange('priority', event.target.value as SalePriority)}
                    options={priorityOptions}
                  />
                </FormField>
                <FormField label="Warehouse">
                  <Select
                    value={formData.warehouse}
                    onChange={(event) => handleFieldChange('warehouse', event.target.value)}
                    options={warehouseOptions}
                  />
                </FormField>
                <FormField label="Valid Till Date">
                  <Input
                    type="date"
                    value={formData.validTillDate}
                    onChange={(event) => handleFieldChange('validTillDate', event.target.value)}
                  />
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
                  <div className="sale-allocation-create__line-tabs" role="tablist" aria-label="Product detail types">
                    {([
                      { value: 'Serialized', count: serializedCount },
                      { value: 'Non-serialized', count: nonSerializedCount },
                    ] as Array<{ value: SaleAllocationLineType; count: number }>).map((tab) => (
                      <button
                        key={tab.value}
                        type="button"
                        role="tab"
                        aria-selected={activeProductLineTab === tab.value}
                        onClick={() => setActiveProductLineTab(tab.value)}
                        className={cn(
                          'sale-allocation-create__line-tab',
                          activeProductLineTab === tab.value
                            ? 'sale-allocation-create__line-tab--active'
                            : undefined
                        )}
                      >
                        <span className="sale-allocation-create__line-tab-label">{tab.value}</span>
                        <span className="sale-allocation-create__line-tab-count">{tab.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {selectedCustomer && !selectedSaleOrder && (
                  <button
                    type="button"
                    onClick={handleAddProductLine}
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
                    {activeProductLineTab === 'Serialized' ? (
                      <tr>
                        <th className="create-pr-grid__cell create-pr-grid__cell--action"></th>
                        <th className="create-pr-grid__cell">Product Code</th>
                        <th className="create-pr-grid__cell">Product Name</th>
                        <th className="create-pr-grid__cell">HSN/SAC</th>
                        <th className="create-pr-grid__cell">UOM</th>
                        <th className="create-pr-grid__cell create-pr-grid__cell--number">Order Qty</th>
                        <th className="create-pr-grid__cell create-pr-grid__cell--number">Allocated Qty</th>
                        <th className="create-pr-grid__cell create-pr-grid__cell--number">Allocation Qty</th>
                        <th className="create-pr-grid__cell">Priority</th>
                        <th className="create-pr-grid__cell">Location</th>
                        <th className="create-pr-grid__cell">Serial Number</th>
                        <th className="create-pr-grid__cell">Requested Allocation Date</th>
                        <th className="create-pr-grid__cell">Remarks</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="create-pr-grid__cell create-pr-grid__cell--action"></th>
                        <th className="create-pr-grid__cell">Product Code</th>
                        <th className="create-pr-grid__cell">Product Name</th>
                        <th className="create-pr-grid__cell">Category</th>
                        <th className="create-pr-grid__cell">UOM</th>
                        <th className="create-pr-grid__cell">Requirement Date</th>
                        <th className="create-pr-grid__cell create-pr-grid__cell--number">Requested Qty</th>
                        <th className="create-pr-grid__cell create-pr-grid__cell--number">Allocated Qty</th>
                        <th className="create-pr-grid__cell create-pr-grid__cell--number">Pending Qty</th>
                        <th className="create-pr-grid__cell">Priority</th>
                        <th className="create-pr-grid__cell">Remark</th>
                        <th className="create-pr-grid__cell create-pr-grid__cell--number">Amount</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {filteredProductLines.map((line, index) => {
                      const pendingQty = Math.max(parseDecimal(line.requestedQty) - parseDecimal(line.allocatedQty), 0);
                      const product = getProductOption(line.productCode);
                      const productOptionsForActiveTab = productLookupOptions.filter(
                        (option) => option.itemType === activeProductLineTab
                      );
                      const selectedSerialNumbers = lines
                        .filter((row) => row.id !== line.id && row.itemType === 'Serialized')
                        .map((row) => row.secondarySerialNumber)
                        .filter(Boolean);
                      const serialNumberOptions = getSerialNumberOptions(
                        formData.warehouse,
                        line.location,
                        line.productCode
                      ).filter(
                        (serialNumber) =>
                          serialNumber === line.secondarySerialNumber ||
                          !selectedSerialNumbers.includes(serialNumber)
                      );

                      return (
                        <tr key={line.id}>
                          <td className="create-pr-grid__body-cell create-pr-grid__body-cell--action">
                            <button type="button" onClick={() => setLines((current) => current.filter((row) => row.id !== line.id))} className="create-pr-grid__delete" aria-label={`Delete line ${index + 1}`}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                          {activeProductLineTab === 'Serialized' ? (
                            <>
                              <td className="create-pr-grid__body-cell">
                                {line.productCode ? (
                                  <Input
                                    value={line.productCode}
                                    readOnly
                                    disabled
                                    className="create-pr-grid__control create-pr-grid__control--readonly min-w-32"
                                  />
                                ) : (
                                  <Select
                                    value={line.productCode}
                                    onChange={(event) => handleLineChange(line.id, 'productCode', event.target.value)}
                                    className="create-pr-grid__control create-pr-grid__control--select min-w-32"
                                    options={[{ value: '', label: 'Select product' }, ...productOptionsForActiveTab.map((option) => ({ value: option.code, label: option.code }))]}
                                  />
                                )}
                              </td>
                              <td className="create-pr-grid__body-cell"><Input value={line.productName} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly min-w-36" /></td>
                              <td className="create-pr-grid__body-cell"><Input value={line.hsnSac} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly min-w-24" /></td>
                              <td className="create-pr-grid__body-cell">
                                <Select
                                  value={line.uom}
                                  onChange={(event) => handleLineChange(line.id, 'uom', event.target.value)}
                                  className="create-pr-grid__control create-pr-grid__control--select min-w-24"
                                  options={[{ value: '', label: 'Select UOM' }, ...(product?.uoms.map((uom) => ({ value: uom, label: uom })) ?? [])]}
                                />
                              </td>
                              <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number"><Input value={formatReadOnlyQuantity(line.requestedQty)} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number min-w-24" /></td>
                              <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number"><Input value={formatReadOnlyQuantity(line.allocatedQty)} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number min-w-24" /></td>
                              <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number"><Input value={line.allocationQty} onChange={(event) => handleLineChange(line.id, 'allocationQty', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input create-pr-grid__control--number min-w-24" /></td>
                              <td className="create-pr-grid__body-cell"><Select value={line.priority} onChange={(event) => handleLineChange(line.id, 'priority', event.target.value)} className="create-pr-grid__control create-pr-grid__control--select min-w-24" options={priorityOptions} /></td>
                              <td className="create-pr-grid__body-cell">
                                <Select
                                  value={line.location}
                                  onChange={(event) => handleLineChange(line.id, 'location', event.target.value)}
                                  className="create-pr-grid__control create-pr-grid__control--select min-w-40"
                                  options={[
                                    { value: '', label: formData.warehouse ? 'Select location' : 'Select warehouse first' },
                                    ...getLocationOptions(formData.warehouse).map((location) => ({ value: location, label: location })),
                                  ]}
                                />
                              </td>
                              <td className="create-pr-grid__body-cell">
                                <Select
                                  value={line.secondarySerialNumber}
                                  onChange={(event) => handleLineChange(line.id, 'secondarySerialNumber', event.target.value)}
                                  className="create-pr-grid__control create-pr-grid__control--select min-w-40"
                                  options={[
                                    {
                                      value: '',
                                      label:
                                        line.productCode && line.location
                                          ? 'Select serial number'
                                          : 'Select product and location',
                                    },
                                    ...serialNumberOptions.map((serialNumber) => ({
                                      value: serialNumber,
                                      label: serialNumber,
                                    })),
                                  ]}
                                />
                              </td>
                              <td className="create-pr-grid__body-cell"><Input type="date" value={line.requestedAllocationDate} onChange={(event) => handleLineChange(line.id, 'requestedAllocationDate', event.target.value)} className="create-pr-grid__control create-pr-grid__control--date min-w-40" /></td>
                              <td className="create-pr-grid__body-cell"><Input value={line.remark} onChange={(event) => handleLineChange(line.id, 'remark', event.target.value)} onKeyDown={(event) => handleLastEditableFieldKeyDown(event, line, index)} className="create-pr-grid__control create-pr-grid__control--input min-w-36" /></td>
                            </>
                          ) : (
                            <>
                              <td className="create-pr-grid__body-cell">
                                <Select
                                  value={line.productCode}
                                  onChange={(event) => handleLineChange(line.id, 'productCode', event.target.value)}
                                  className="create-pr-grid__control create-pr-grid__control--select min-w-32"
                                  options={[{ value: '', label: 'Select product' }, ...productOptionsForActiveTab.map((option) => ({ value: option.code, label: option.code }))]}
                                />
                              </td>
                              <td className="create-pr-grid__body-cell"><Input value={line.productName} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly min-w-36" /></td>
                              <td className="create-pr-grid__body-cell"><Input value={line.category} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly min-w-28" /></td>
                              <td className="create-pr-grid__body-cell">
                                <Select
                                  value={line.uom}
                                  onChange={(event) => handleLineChange(line.id, 'uom', event.target.value)}
                                  className="create-pr-grid__control create-pr-grid__control--select min-w-24"
                                  options={[{ value: '', label: 'Select UOM' }, ...(product?.uoms.map((uom) => ({ value: uom, label: uom })) ?? [])]}
                                />
                              </td>
                              <td className="create-pr-grid__body-cell"><Input type="date" value={line.requirementDate} onChange={(event) => handleLineChange(line.id, 'requirementDate', event.target.value)} className="create-pr-grid__control create-pr-grid__control--date min-w-32" /></td>
                              <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number"><Input value={line.requestedQty} onChange={(event) => handleLineChange(line.id, 'requestedQty', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input create-pr-grid__control--number min-w-24" /></td>
                              <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number"><Input value={formatReadOnlyQuantity(line.allocatedQty)} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number min-w-24" /></td>
                              <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number"><Input value={formatDecimal(pendingQty)} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number min-w-24" /></td>
                              <td className="create-pr-grid__body-cell"><Select value={line.priority} onChange={(event) => handleLineChange(line.id, 'priority', event.target.value)} className="create-pr-grid__control create-pr-grid__control--select min-w-24" options={priorityOptions} /></td>
                              <td className="create-pr-grid__body-cell"><Input value={line.remark} onChange={(event) => handleLineChange(line.id, 'remark', event.target.value)} onKeyDown={(event) => handleLastEditableFieldKeyDown(event, line, index)} className="create-pr-grid__control create-pr-grid__control--input min-w-32" /></td>
                              <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number"><Input value={line.amount} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number min-w-24" /></td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                    {filteredProductLines.length === 0 && (
                      <tr>
                        <td
                          className="create-pr-grid__body-cell sale-allocation-create__grid-empty"
                          colSpan={activeProductLineTab === 'Serialized' ? 13 : 12}
                        >
                          No {activeProductLineTab.toLowerCase()} lines added yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    {activeProductLineTab === 'Serialized' ? (
                      <tr>
                        <td className="create-pr-grid__footer-cell" colSpan={5}>Total</td>
                        <td className="create-pr-grid__footer-cell create-pr-grid__footer-cell--number">
                          {formatDecimal(productLineTotals.requestedQty)}
                        </td>
                        <td className="create-pr-grid__footer-cell create-pr-grid__footer-cell--number">
                          {formatDecimal(productLineTotals.allocatedQty)}
                        </td>
                        <td className="create-pr-grid__footer-cell create-pr-grid__footer-cell--number">
                          {formatDecimal(productLineTotals.allocationQty)}
                        </td>
                        <td className="create-pr-grid__footer-cell" colSpan={5}></td>
                      </tr>
                    ) : (
                      <tr>
                        <td className="create-pr-grid__footer-cell" colSpan={6}>Total</td>
                        <td className="create-pr-grid__footer-cell create-pr-grid__footer-cell--number">
                          {formatDecimal(productLineTotals.requestedQty)}
                        </td>
                        <td className="create-pr-grid__footer-cell create-pr-grid__footer-cell--number">
                          {formatDecimal(productLineTotals.allocatedQty)}
                        </td>
                        <td className="create-pr-grid__footer-cell create-pr-grid__footer-cell--number">
                          {formatDecimal(productLineTotals.pendingQty)}
                        </td>
                        <td className="create-pr-grid__footer-cell" colSpan={2}></td>
                        <td className="create-pr-grid__footer-cell create-pr-grid__footer-cell--number">
                          {formatDecimal(productLineTotals.amount)}
                        </td>
                      </tr>
                    )}
                  </tfoot>
                </table>
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
          onNavigateToSaleAllocationRequisitionList();
        }}
        onClose={() => setIsDiscardDialogOpen(false)}
      />

      <SuccessSummaryDialog
        isOpen={isSaveSuccessDialogOpen}
        title="Saved successfully!"
        documentLabel="Sale allocation requisition No"
        documentNumber={formData.number}
        sectionTitle="Allocation Summary"
        items={[
          { label: 'Customer', value: formData.customer || '-' },
          { label: 'Warehouse', value: formData.warehouse || '-' },
          { label: 'Priority', value: formData.priority || '-' },
          { label: 'Line count', value: `${lines.filter((line) => Boolean(line.productCode)).length}` },
        ]}
        totalLabel="Allocation value"
        totalValue={`Rs ${formatCurrency(totalAmount)}`}
        primaryActionLabel="Go to catalogue"
        onPrimaryAction={() => {
          setIsSaveSuccessDialogOpen(false);
          onNavigateToSaleAllocationRequisitionList();
        }}
        onClose={() => setIsSaveSuccessDialogOpen(false)}
      />
    </AppShell>
  );
};

export default CreateSaleAllocationRequisition;
