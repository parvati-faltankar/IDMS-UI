import { extendedPurchaseOrderDocuments, type PurchaseOrderDocument } from '../pages/purchase-order/purchaseOrderData';
import { extendedSaleOrderDocuments, type SaleOrderDocument } from '../pages/sale-order/saleOrderData';

const SO_STORAGE_KEY = 'documents:so:v1';
const PO_STORAGE_KEY = 'documents:po:v1';

export const DOCUMENT_STORE_EVENTS = {
  saleOrderUpdated: 'documents:so:updated',
  purchaseOrderUpdated: 'documents:po:updated',
} as const;

function readFromStorage<T>(key: string): T[] | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as T[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeToStorage<T>(key: string, value: T[]) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Keep catalogue screens usable even if browser storage is unavailable or full.
  }
}

function dispatchStoreEvent(name: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(name));
}

function generateNextNumber(prefix: string, documents: Array<{ number: string }>): string {
  const maxSequence = documents.reduce((max, document) => {
    const parts = document.number.split('-');
    const tail = parts[parts.length - 1] ?? '';
    const parsed = Number.parseInt(tail, 10);
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
  }, 0);

  const next = String(maxSequence + 1).padStart(5, '0');
  return `${prefix}-${next}`;
}

function generateDocumentId(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowDateTime(): string {
  return new Date().toISOString();
}

function safeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function safeDateString(value: unknown, fallback: string): string {
  const candidate = safeString(value, fallback);
  return Number.isNaN(new Date(candidate).getTime()) ? fallback : candidate;
}

function normalizeSaleOrderLine(line: Partial<SaleOrderDocument['lines'][number]> | undefined): SaleOrderDocument['lines'][number] {
  return {
    productCode: safeString(line?.productCode, 'AI-ITEM'),
    productName: safeString(line?.productName, 'AI item'),
    hsnSac: safeString(line?.hsnSac),
    uom: safeString(line?.uom, 'Unit'),
    requestedDate: safeDateString(line?.requestedDate, todayDate()),
    fulfillmentDate: safeDateString(line?.fulfillmentDate, todayDate()),
    priority: line?.priority ?? 'Medium',
    rate: safeString(line?.rate, '0.00'),
    orderQuantity: safeString(line?.orderQuantity, '0'),
    baseAmount: safeString(line?.baseAmount, '0.00'),
    discountPercent: safeString(line?.discountPercent, '0.00'),
    discountAmount: safeString(line?.discountAmount, '0.00'),
    taxableAmount: safeString(line?.taxableAmount, '0.00'),
    taxationColumn: safeString(line?.taxationColumn),
    lineAmount: safeString(line?.lineAmount, '0.00'),
    convertedQuantity: safeString(line?.convertedQuantity, '0.00'),
    pendingQuantity: safeString(line?.pendingQuantity, safeString(line?.orderQuantity, '0')),
    status: line?.status ?? 'Open',
    remark: safeString(line?.remark),
  };
}

function normalizeSaleOrder(document: Partial<SaleOrderDocument>): SaleOrderDocument {
  const date = todayDate();
  return {
    id: safeString(document.id, createSaleOrderId()),
    number: safeString(document.number, 'SO-DRAFT'),
    orderDateTime: safeDateString(document.orderDateTime, nowDateTime()),
    customerName: safeString(document.customerName, 'Unknown customer'),
    orderSource: safeString(document.orderSource, 'AI Drawer'),
    salesExecutive: safeString(document.salesExecutive, 'Alex Kumar'),
    requestedDeliveryDate: safeDateString(document.requestedDeliveryDate, date),
    validTillDate: safeDateString(document.validTillDate, date),
    placeOfSupply: safeString(document.placeOfSupply),
    promisedDeliveryDate: safeDateString(document.promisedDeliveryDate, date),
    priority: document.priority ?? 'Medium',
    status: document.status ?? 'Draft',
    paymentMode: safeString(document.paymentMode),
    paymentMethod: safeString(document.paymentMethod),
    paymentTerm: safeString(document.paymentTerm),
    advancePayment: safeString(document.advancePayment, '0.00'),
    paymentRemarks: safeString(document.paymentRemarks),
    financer: safeString(document.financer),
    downPayment: safeString(document.downPayment, '0.00'),
    financeAmount: safeString(document.financeAmount, '0.00'),
    emiAmount: safeString(document.emiAmount, '0.00'),
    balanceAmount: safeString(document.balanceAmount, '0.00'),
    tenure: safeString(document.tenure),
    emiInterestRate: safeString(document.emiInterestRate, '0.00'),
    deliveryTerm: safeString(document.deliveryTerm),
    deliveryType: safeString(document.deliveryType),
    deliverySlot: safeString(document.deliverySlot),
    deliveryAddress: safeString(document.deliveryAddress),
    deliveryInstruction: safeString(document.deliveryInstruction),
    shippingAddress: safeString(document.shippingAddress),
    shippingTerm: safeString(document.shippingTerm),
    shippingMethod: safeString(document.shippingMethod),
    shippingInstructions: safeString(document.shippingInstructions),
    totalAmount: safeString(document.totalAmount, '0.00'),
    insuranceProvider: safeString(document.insuranceProvider),
    policyNumber: safeString(document.policyNumber),
    policyDate: safeString(document.policyDate),
    insuranceRemarks: safeString(document.insuranceRemarks),
    lines: Array.isArray(document.lines) ? document.lines.map((line) => normalizeSaleOrderLine(line)) : [],
  };
}

function normalizePurchaseOrder(document: Partial<PurchaseOrderDocument>): PurchaseOrderDocument {
  const date = todayDate();
  return {
    ...document,
    id: safeString(document.id, createPurchaseOrderId()),
    number: safeString(document.number, 'PO-DRAFT'),
    orderDateTime: safeDateString(document.orderDateTime, nowDateTime()),
    requisitionNumber: safeString(document.requisitionNumber),
    requisitionDate: safeDateString(document.requisitionDate, date),
    supplierName: safeString(document.supplierName, 'Unknown supplier'),
    buyerName: safeString(document.buyerName, 'Alex Kumar'),
    createdBy: safeString(document.createdBy, 'Alex Kumar'),
    createdOn: safeDateString(document.createdOn, nowDateTime()),
    buyerEmail: safeString(document.buyerEmail),
    branch: safeString(document.branch),
    department: safeString(document.department),
    priority: document.priority ?? 'Medium',
    status: document.status ?? 'Draft',
    expectedDeliveryDate: safeDateString(document.expectedDeliveryDate, date),
    paymentTerms: safeString(document.paymentTerms),
    incoterm: safeString(document.incoterm),
    taxableAmount: safeString(document.taxableAmount, '0.00'),
    totalDiscount: safeString(document.totalDiscount, '0.00'),
    totalTaxes: safeString(document.totalTaxes, '0.00'),
    totalAmount: safeString(document.totalAmount, '0.00'),
    currency: safeString(document.currency, 'INR'),
    notes: safeString(document.notes),
    lines: Array.isArray(document.lines) ? document.lines : [],
  } as PurchaseOrderDocument;
}

export function seedDocumentStoreIfEmpty() {
  const saleOrders = readFromStorage<SaleOrderDocument>(SO_STORAGE_KEY);
  if (!saleOrders || saleOrders.length === 0) {
    writeToStorage(SO_STORAGE_KEY, extendedSaleOrderDocuments);
  } else {
    const existingIds = new Set(saleOrders.map((document) => document.id));
    const missingSeedOrders = extendedSaleOrderDocuments.filter(
      (document) => !existingIds.has(document.id)
    );

    if (missingSeedOrders.length > 0) {
      writeToStorage(SO_STORAGE_KEY, [...saleOrders, ...missingSeedOrders]);
    }
  }

  const purchaseOrders = readFromStorage<PurchaseOrderDocument>(PO_STORAGE_KEY);
  if (!purchaseOrders || purchaseOrders.length === 0) {
    writeToStorage(PO_STORAGE_KEY, extendedPurchaseOrderDocuments);
  }
}

export function getSaleOrders(): SaleOrderDocument[] {
  seedDocumentStoreIfEmpty();
  return (readFromStorage<Partial<SaleOrderDocument> | null>(SO_STORAGE_KEY) ?? extendedSaleOrderDocuments).map((document) =>
    normalizeSaleOrder(document ?? {})
  );
}

export function getPurchaseOrders(): PurchaseOrderDocument[] {
  seedDocumentStoreIfEmpty();
  return (readFromStorage<Partial<PurchaseOrderDocument> | null>(PO_STORAGE_KEY) ?? extendedPurchaseOrderDocuments).map((document) =>
    normalizePurchaseOrder(document ?? {})
  );
}

export function getSaleOrderByIdFromStore(id: string | null): SaleOrderDocument | undefined {
  if (!id) {
    return undefined;
  }

  return getSaleOrders().find((document) => document.id === id);
}

export function getPurchaseOrderByIdFromStore(id: string | null): PurchaseOrderDocument | undefined {
  if (!id) {
    return undefined;
  }

  return getPurchaseOrders().find((document) => document.id === id);
}

export function upsertSaleOrder(document: SaleOrderDocument): SaleOrderDocument {
  const currentDocuments = getSaleOrders();
  const existingIndex = currentDocuments.findIndex((item) => item.id === document.id);
  const nextDocuments = [...currentDocuments];

  if (existingIndex >= 0) {
    nextDocuments[existingIndex] = document;
  } else {
    nextDocuments.unshift(document);
  }

  writeToStorage(SO_STORAGE_KEY, nextDocuments);
  dispatchStoreEvent(DOCUMENT_STORE_EVENTS.saleOrderUpdated);
  return document;
}

export function upsertPurchaseOrder(document: PurchaseOrderDocument): PurchaseOrderDocument {
  const currentDocuments = getPurchaseOrders();
  const existingIndex = currentDocuments.findIndex((item) => item.id === document.id);
  const nextDocuments = [...currentDocuments];

  if (existingIndex >= 0) {
    nextDocuments[existingIndex] = document;
  } else {
    nextDocuments.unshift(document);
  }

  writeToStorage(PO_STORAGE_KEY, nextDocuments);
  dispatchStoreEvent(DOCUMENT_STORE_EVENTS.purchaseOrderUpdated);
  return document;
}

export function createSaleOrderNumber(): string {
  return generateNextNumber('SO-2026', getSaleOrders());
}

export function createPurchaseOrderNumber(): string {
  return generateNextNumber('PO-2026', getPurchaseOrders());
}

export function createSaleOrderId(): string {
  return generateDocumentId('so');
}

export function createPurchaseOrderId(): string {
  return generateDocumentId('po');
}
