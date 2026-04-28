import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, MoreVertical, PencilLine, Plus, Search, Trash2 } from 'lucide-react';
import AppShell from '../../components/common/AppShell';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import { FormField, Input, Select } from '../../components/common/FormControls';
import { handleGridLastCellTab, hasRequiredGridValues } from '../../components/common/gridKeyboard';
import { formatDate } from '../../utils/dateFormat';
import { cn } from '../../utils/classNames';
import { useBusinessSettings } from '../../utils/businessSettings';
import type { PurchaseOrderDocument } from './purchaseInvoiceData';
import {
  extendedPurchaseRequisitionDocuments,
  type PurchaseRequisitionDocument,
} from '../purchase-requisition/purchaseRequisitionCatalogueData';

interface CreatePurchaseInvoiceProps {
  editingDocument?: PurchaseOrderDocument;
  onBack: () => void;
  onNavigateToPurchaseInvoiceList: () => void;
  onNavigateToPurchaseReceiptList: () => void;
  onNavigateToPurchaseOrderList: () => void;
  onNavigateToPurchaseRequisitionList: () => void;
}

interface PurchaseOrderLineForm {
  id: string;
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
  receivingLocation: string;
  receiveDate: string;
  receivedBy: string;
  branch: string;
  department: string;
  priority: '' | 'Low' | 'Medium' | 'High';
  orderDate: string;
  expectedDeliveryDate: string;
  paymentMode: '' | 'Cash' | 'Credit';
  paymentTerms: string;
  supplierInvoiceNumber: string;
  supplierInvoiceDate: string;
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

const CreatePurchaseInvoice: React.FC<CreatePurchaseInvoiceProps> = ({
  editingDocument,
  onBack,
  onNavigateToPurchaseInvoiceList,
  onNavigateToPurchaseReceiptList,
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
      receivingLocation: editingDocument.branch ? `${editingDocument.branch} Receiving` : '',
      receiveDate: editingDocument.orderDateTime.slice(0, 10),
      receivedBy: editingDocument.buyerName,
      branch: editingDocument.branch,
      department: editingDocument.department,
      priority: normalizePriority(editingDocument.priority),
      orderDate: editingDocument.orderDateTime.slice(0, 10),
      expectedDeliveryDate: editingDocument.expectedDeliveryDate,
      paymentMode: 'Credit',
      paymentTerms: editingDocument.paymentTerms,
      supplierInvoiceNumber: editingDocument.number,
      supplierInvoiceDate: editingDocument.orderDateTime.slice(0, 10),
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
      receivingLocation: '',
      receiveDate: todayIso,
      receivedBy: '',
      branch: '',
      department: '',
      priority: '',
      orderDate: '2026-04-13',
      expectedDeliveryDate: '',
      paymentMode: '',
      paymentTerms: '',
      supplierInvoiceNumber: '',
      supplierInvoiceDate: todayIso,
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
  const [selectedRequisitionId, setSelectedRequisitionId] = useState<string | null>(null);
  const [isRequisitionResultsOpen, setIsRequisitionResultsOpen] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [workflowError, setWorkflowError] = useState('');
  const focusLineIdRef = useRef<string | null>(null);
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | null>>({});
  const businessSettings = useBusinessSettings();
  const invoiceSettings = businessSettings.procurement.purchaseInvoice;
  const canUseRequisitionAsInvoiceSource =
    invoiceSettings.allowPurchaseRequisitionSource &&
    businessSettings.procurement.conversions.purchaseRequisitionToPurchaseInvoice;
  const [lines, setLines] = useState<PurchaseOrderLineForm[]>(
    editingDocument?.lines.map((line, index) => {
      const productOption = getProductLookupOption(line.itemCode);

      return {
        id: `po-line-edit-${index}`,
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
    if (!canUseRequisitionAsInvoiceSource) {
      return [];
    }

    const normalizedSearch = requisitionSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return extendedPurchaseRequisitionDocuments.slice(0, 6);
    }

    return extendedPurchaseRequisitionDocuments
      .filter((document) =>
        document.number.toLowerCase().includes(normalizedSearch) ||
        document.title.toLowerCase().includes(normalizedSearch) ||
        document.supplierName.toLowerCase().includes(normalizedSearch) ||
        document.requesterName.toLowerCase().includes(normalizedSearch)
      )
      .slice(0, 8);
  }, [canUseRequisitionAsInvoiceSource, requisitionSearch]);

  const selectedRequisition = useMemo(
    () => extendedPurchaseRequisitionDocuments.find((document) => document.id === selectedRequisitionId) ?? null,
    [selectedRequisitionId]
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

  const tabs: Array<{ id: TabKey; label: string }> = [
    { id: 'general', label: 'General Details' },
    { id: 'product', label: 'Product Details' },
    { id: 'delivery', label: 'Delivery Details' },
  ];
  const isPurchaseInvoiceLineComplete = (line: PurchaseOrderLineForm) =>
    hasRequiredGridValues(line, ['productCode', 'uom', 'purchaseRate', 'orderQty']);
  const canAddProductLine =
    (invoiceSettings.allowManualLines || Boolean(selectedRequisitionId)) &&
    (lines.length === 0 || isPurchaseInvoiceLineComplete(lines[lines.length - 1]));

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
              const linkedRequisitionLine = selectedRequisition?.productLines.find((productLine) => productLine.productCode === value);

              nextLine.productName = selectedProduct?.name ?? '';
              nextLine.hsnSac = selectedProduct?.hsnSac ?? '';
              nextLine.uom = selectedProduct?.uoms[0] ?? '';
              nextLine.purchaseRate = selectedProduct?.purchaseRates[0] ?? '';
              nextLine.availableQty = selectedProduct?.availableQty ?? '0.00';
              nextLine.taxationColumns = selectedProduct?.taxLabel ?? '';
              nextLine.requestedQty = linkedRequisitionLine?.requestedQty ?? '0.00';
              nextLine.priority = normalizePriority(linkedRequisitionLine?.priority ?? formData.priority);
              nextLine.requirementDate = linkedRequisitionLine?.requirementDate ?? formData.expectedDeliveryDate;
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
      isLineComplete: isPurchaseInvoiceLineComplete,
      onAddLine: handleAddLine,
    });
  };

  const handleSave = () => {
    if (invoiceSettings.sourceDocumentRequired && !selectedRequisitionId) {
      setWorkflowError('Select a source document before saving this purchase invoice.');
      return;
    }

    if (!canUseRequisitionAsInvoiceSource && selectedRequisitionId) {
      setWorkflowError('The selected invoice source conversion is disabled in Business Settings.');
      return;
    }

    if (!invoiceSettings.allowManualLines && !selectedRequisitionId) {
      setWorkflowError('Manual invoice lines are disabled in Business Settings. Select a source document first.');
      return;
    }

    if (invoiceSettings.requireSupplierInvoiceNumber && !formData.supplierInvoiceNumber.trim()) {
      setWorkflowError('Supplier invoice number is required by Business Settings.');
      return;
    }

    if (invoiceSettings.requireSupplierInvoiceDate && !formData.supplierInvoiceDate) {
      setWorkflowError('Supplier invoice date is required by Business Settings.');
      return;
    }

    if (!businessSettings.actions.purchaseInvoice.allowSubmit) {
      setWorkflowError('Submitting purchase invoices is disabled in Business Settings.');
      return;
    }

    setWorkflowError('');
    onNavigateToPurchaseInvoiceList();
  };

  const handleDiscardRequest = () => {
    setIsDiscardDialogOpen(true);
  };

  const handleDiscardClose = () => {
    setIsDiscardDialogOpen(false);
  };

  const handleDiscardConfirm = () => {
    setIsDiscardDialogOpen(false);
    onNavigateToPurchaseInvoiceList();
  };

  const handleSelectRequisition = (requisition: PurchaseRequisitionDocument) => {
    if (!canUseRequisitionAsInvoiceSource) {
      setWorkflowError('Purchase Requisition to Purchase Invoice conversion is disabled in Business Settings.');
      return;
    }

    setSelectedRequisitionId(requisition.id);
    setRequisitionSearch(requisition.number);
    setIsRequisitionResultsOpen(false);
    setWorkflowError('');

    setFormData((current) => ({
      ...current,
      linkedRequisitionNumber: requisition.number,
      supplierName: requisition.supplierName,
      buyerName: requisition.requesterName,
      placeOfSupply: requisition.branch,
      receivingLocation: `${requisition.branch} Receiving`,
      receiveDate: todayIso,
      receivedBy: requisition.requesterName,
      branch: requisition.branch,
      department: requisition.department,
      priority: normalizePriority(requisition.priority),
      expectedDeliveryDate: requisition.requirementDate,
      supplierInvoiceDate: todayIso,
      validTillDate: requisition.validTillDate,
      notes: requisition.notes,
    }));

    setLines(mapRequisitionLinesToOrderLines(requisition));
  };

  return (
    <AppShell
      activeLeaf="purchase-invoice"
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
                <span className="po-create__summary-value po-create__summary-value--accent">
                  Rs {formatCurrency(totalAmount)}
                </span>
                <ChevronRight size={18} className="po-create__summary-chevron" />
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
      onPurchaseReceiptClick={onNavigateToPurchaseReceiptList}
      onPurchaseInvoiceClick={onNavigateToPurchaseInvoiceList}
      onPurchaseRequisitionClick={onNavigateToPurchaseRequisitionList}
    >
      <div className="create-pr-page">
        <div className="create-pr-header">
          <div className="create-pr-header__top">
            <div className="create-pr-header__title-group">
              <a
                href="#/purchaseinvoicelist"
                onClick={(event) => {
                  event.preventDefault();
                  onBack();
                }}
                className="page-back-button create-pr-header__back"
                aria-label="Back to purchase invoice list"
              >
                <ArrowLeft size={18} />
              </a>
              <div className="create-pr-header__title-wrap">
                <div className="create-pr-header__title-row">
                  <h2 className="brand-page-title create-pr-header__title">
                    {editingDocument ? 'Edit Purchase Invoice' : 'New Purchase Invoice'}
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
              <button type="button" className="create-pr-header__icon-button" aria-label="Edit purchase invoice metadata">
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
                  placeholder={canUseRequisitionAsInvoiceSource ? 'Search source document' : 'Source conversion disabled'}
                  aria-label="Search source documents"
                  disabled={!canUseRequisitionAsInvoiceSource}
                />
              </div>
              </div>

              {isRequisitionResultsOpen && matchingRequisitions.length > 0 && (
                <div className="po-create__requisition-results" role="listbox" aria-label="Source document results">
                  {matchingRequisitions.map((requisition) => (
                    <button
                      key={requisition.id}
                      type="button"
                      className="po-create__requisition-option"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelectRequisition(requisition)}
                    >
                      <span className="po-create__requisition-option-title">{requisition.number}</span>
                      <span className="po-create__requisition-option-meta">
                        {requisition.supplierName} | {requisition.requesterName}
                      </span>
                    </button>
                  ))}
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
            <div className="create-pr-tabs__list" role="tablist" aria-label="Purchase invoice sections">
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
              {selectedRequisition && (
                <div className="po-create__selected-requisition">
                  <div className="po-create__selected-requisition-title">
                    Linked requisition: {selectedRequisition.number}
                  </div>
                  <div className="po-create__selected-requisition-meta">
                    {selectedRequisition.title} | {selectedRequisition.supplierName} | {selectedRequisition.lineCount} line(s)
                  </div>
                </div>
              )}

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
                    <Input
                      type="date"
                      value={formData.receiveDate}
                      onChange={(event) => handleFieldChange('receiveDate', event.target.value)}
                    />
                  </FormField>
                  <FormField label="Received By" required>
                    <Select value={formData.receivedBy} onChange={(event) => handleFieldChange('receivedBy', event.target.value)} options={receivedByOptions} />
                  </FormField>
                  <FormField label="Payment Mode" required>
                    <Select value={formData.paymentMode} onChange={(event) => handleFieldChange('paymentMode', event.target.value)} options={paymentModeOptions} />
                  </FormField>
                  <FormField label="Payment Term" required>
                    <Select value={formData.paymentTerms} onChange={(event) => handleFieldChange('paymentTerms', event.target.value)} options={paymentTermsOptions} />
                  </FormField>
                  <FormField label="Supplier Invoice Number" required={invoiceSettings.requireSupplierInvoiceNumber}>
                    <Input
                      value={formData.supplierInvoiceNumber}
                      onChange={(event) => handleFieldChange('supplierInvoiceNumber', event.target.value)}
                      placeholder="Enter supplier invoice number"
                      error={
                        invoiceSettings.requireSupplierInvoiceNumber && workflowError.includes('Supplier invoice number')
                          ? workflowError
                          : undefined
                      }
                    />
                  </FormField>
                  <FormField label="Supplier Invoice Date" required={invoiceSettings.requireSupplierInvoiceDate}>
                    <Input
                      type="date"
                      value={formData.supplierInvoiceDate}
                      onChange={(event) => handleFieldChange('supplierInvoiceDate', event.target.value)}
                      error={
                        invoiceSettings.requireSupplierInvoiceDate && workflowError.includes('Supplier invoice date')
                          ? workflowError
                          : undefined
                      }
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
                      : invoiceSettings.allowManualLines
                        ? 'Complete the current line before adding another line'
                        : 'Manual invoice lines are disabled in Business Settings'
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
                    {lines.map((line, index) => {
                      const productOption = getProductLookupOption(line.productCode);
                      const pendingReceiptQty = getPendingReceiptQty(line);
                      const pendingInvoiceQty = getPendingInvoiceQty(line);
                      const taxableAmount = getTaxableAmount(line);
                      const lineAmount = getLineAmount(line);

                      return (
                        <tr key={line.id}>
                          <td className="create-pr-grid__body-cell">
                            <button type="button" onClick={() => handleDeleteLine(line.id)} className="create-pr-grid__delete" aria-label={`Delete purchase invoice line ${index + 1}`}>
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
    </AppShell>
  );
};

export default CreatePurchaseInvoice;
