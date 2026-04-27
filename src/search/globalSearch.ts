import {
  extendedPurchaseRequisitionDocuments,
  type PurchaseRequisitionDocument,
} from '../pages/purchase-requisition/purchaseRequisitionCatalogueData';
import {
  extendedPurchaseOrderDocuments,
  type PurchaseOrderDocument,
} from '../pages/purchase-order/purchaseOrderData';
import {
  extendedPurchaseOrderDocuments as extendedPurchaseReceiptDocuments,
  type PurchaseOrderDocument as PurchaseReceiptDocument,
} from '../pages/purchase-receipt/purchaseReceiptData';
import {
  extendedPurchaseOrderDocuments as extendedPurchaseInvoiceDocuments,
  type PurchaseOrderDocument as PurchaseInvoiceDocument,
} from '../pages/purchase-invoice/purchaseInvoiceData';
import {
  extendedSaleOrderDocuments,
  type SaleOrderDocument,
} from '../pages/sale-order/saleOrderData';
import {
  extendedSaleAllocationRequisitionDocuments,
  type SaleAllocationRequisitionDocument,
} from '../pages/sale-allocation-requisition/saleAllocationRequisitionData';
import {
  extendedSaleAllocationDocuments,
  type SaleAllocationDocument,
} from '../pages/sale-allocation/saleAllocationData';
import {
  extendedSaleInvoiceDocuments,
  type SaleInvoiceDocument,
} from '../pages/sale-invoice/saleInvoiceData';
import {
  extendedDeliveryDocuments,
  type DeliveryDocument,
} from '../pages/delivery/deliveryData';
import { formatDate } from '../utils/dateFormat';

export type GlobalSearchEntity =
  | 'purchase-requisition'
  | 'purchase-order'
  | 'purchase-receipt'
  | 'purchase-invoice'
  | 'sale-order'
  | 'sale-allocation-requisition'
  | 'sale-allocation'
  | 'sale-invoice'
  | 'delivery';

export interface GlobalSearchRecord {
  id: string;
  entity: GlobalSearchEntity;
  groupLabel: string;
  title: string;
  subtitle: string;
  description: string;
  status?: string;
  priority?: string;
  amount?: string;
  date?: string;
  href: string;
  exactFields: string[];
  primaryFields: string[];
  secondaryFields: string[];
  keywords: string[];
}

export interface GlobalSearchResult extends GlobalSearchRecord {
  score: number;
  matchedField: string;
  matchType: 'exact' | 'startsWith' | 'contains' | 'token';
}

export interface GlobalSearchGroup {
  entity: GlobalSearchEntity;
  label: string;
  results: GlobalSearchResult[];
}

export interface GlobalSearchOptions {
  entities?: GlobalSearchEntity[];
}

const MAX_RESULTS = 18;

function valueOf(value: unknown): string {
  return String(value ?? '').trim();
}

function normalize(value: unknown): string {
  return valueOf(value).toLowerCase().replace(/\s+/g, ' ');
}

function compact(value: unknown): string {
  return normalize(value).replace(/[^a-z0-9]/g, '');
}

function lineKeywords(lines: object[] | undefined, fields: string[]): string[] {
  return (lines ?? [])
    .flatMap((line) => {
      const lineRecord = line as Record<string, unknown>;
      return fields.map((field) => valueOf(lineRecord[field]));
    })
    .filter(Boolean);
}

function scoreField(
  fieldValue: string,
  query: string,
  compactQuery: string,
  weight: number
): Pick<GlobalSearchResult, 'score' | 'matchedField' | 'matchType'> | null {
  const normalizedValue = normalize(fieldValue);
  const compactValue = compact(fieldValue);

  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue === query || compactValue === compactQuery) {
    return { score: 120 * weight, matchedField: fieldValue, matchType: 'exact' };
  }

  if (normalizedValue.startsWith(query) || compactValue.startsWith(compactQuery)) {
    return { score: 78 * weight, matchedField: fieldValue, matchType: 'startsWith' };
  }

  if (normalizedValue.includes(query) || compactValue.includes(compactQuery)) {
    return { score: 45 * weight, matchedField: fieldValue, matchType: 'contains' };
  }

  const queryTokens = query.split(' ').filter(Boolean);
  if (queryTokens.length > 1 && queryTokens.every((token) => normalizedValue.includes(token))) {
    return { score: 28 * weight, matchedField: fieldValue, matchType: 'token' };
  }

  return null;
}

function rankRecord(record: GlobalSearchRecord, rawQuery: string): GlobalSearchResult | null {
  const query = normalize(rawQuery);
  const compactQuery = compact(rawQuery);

  if (!query || !compactQuery) {
    return null;
  }

  const fieldBuckets: Array<[string[], number]> = [
    [record.exactFields, 4.2],
    [record.primaryFields, 2.4],
    [record.secondaryFields, 1.5],
    [record.keywords, 1],
  ];

  const bestMatch = fieldBuckets
    .flatMap(([fields, weight]) =>
      fields
        .map((field) => scoreField(field, query, compactQuery, weight))
        .filter((result): result is Pick<GlobalSearchResult, 'score' | 'matchedField' | 'matchType'> => Boolean(result))
    )
    .sort((a, b) => b.score - a.score)[0];

  if (!bestMatch) {
    return null;
  }

  const dateBoost = record.date ? Math.max(0, Date.parse(record.date) / 1_000_000_000_000) : 0;

  return {
    ...record,
    ...bestMatch,
    score: bestMatch.score + dateBoost,
  };
}

function makeHref(route: string, id: string) {
  return `${route}?id=${encodeURIComponent(id)}&mode=view`;
}

function purchaseRequisitionRecord(document: PurchaseRequisitionDocument): GlobalSearchRecord {
  return {
    id: document.id,
    entity: 'purchase-requisition',
    groupLabel: 'Purchase Requisitions',
    title: document.number,
    subtitle: `${document.supplierName} | ${document.requesterName}`,
    description: document.title,
    status: document.status,
    priority: document.priority,
    amount: document.productLines.reduce((sum, line) => sum + Number(line.requestedQty || 0), 0).toFixed(2),
    date: document.documentDateTime,
    href: makeHref('#/purchase-requisition/new', document.id),
    exactFields: [document.number, document.id],
    primaryFields: [
      document.title,
      document.supplierName,
      document.requesterName,
      document.department,
      document.status,
      document.priority,
      document.branch,
    ],
    secondaryFields: [
      document.documentDateTime,
      formatDate(document.documentDateTime),
      document.requirementDate,
      document.validTillDate,
      document.supplierContact,
      document.requesterEmail,
      document.costCenter,
      document.contractReference,
      document.budgetCode,
      document.notes,
    ],
    keywords: lineKeywords(document.productLines, [
      'productCode',
      'productName',
      'description',
      'uom',
      'status',
      'remarks',
    ]),
  };
}

function purchaseDocumentRecord(
  document: PurchaseOrderDocument | PurchaseReceiptDocument | PurchaseInvoiceDocument,
  entity: Extract<GlobalSearchEntity, 'purchase-order' | 'purchase-receipt' | 'purchase-invoice'>,
  groupLabel: string,
  route: string
): GlobalSearchRecord {
  return {
    id: document.id,
    entity,
    groupLabel,
    title: document.number,
    subtitle: `${document.supplierName} | ${document.department}`,
    description: document.requisitionNumber ? `Linked PR ${document.requisitionNumber}` : document.notes,
    status: document.status,
    priority: document.priority,
    amount: document.totalAmount,
    date: document.orderDateTime,
    href: makeHref(route, document.id),
    exactFields: [document.number, document.id, document.requisitionNumber],
    primaryFields: [
      document.supplierName,
      document.buyerName,
      document.createdBy,
      document.department,
      document.status,
      document.priority,
      document.paymentTerms,
      document.totalAmount,
      document.taxableAmount,
    ],
    secondaryFields: [
      document.orderDateTime,
      formatDate(document.orderDateTime),
      document.requisitionDate,
      document.expectedDeliveryDate,
      document.buyerEmail,
      document.branch,
      document.incoterm,
      document.notes,
      document.totalDiscount,
      document.totalTaxes,
    ],
    keywords: lineKeywords(document.lines, ['itemCode', 'itemName', 'description', 'uom', 'quantity', 'amount']),
  };
}

function saleOrderRecord(document: SaleOrderDocument): GlobalSearchRecord {
  return {
    id: document.id,
    entity: 'sale-order',
    groupLabel: 'Sale Orders',
    title: document.number,
    subtitle: `${document.customerName} | ${document.salesExecutive}`,
    description: `${document.orderSource} order`,
    status: document.status,
    priority: document.priority,
    amount: document.totalAmount,
    date: document.orderDateTime,
    href: makeHref('#/sale-order/new', document.id),
    exactFields: [document.number, document.id],
    primaryFields: [
      document.customerName,
      document.orderSource,
      document.salesExecutive,
      document.status,
      document.priority,
      document.paymentMode,
      document.paymentMethod,
      document.totalAmount,
    ],
    secondaryFields: [
      document.orderDateTime,
      formatDate(document.orderDateTime),
      document.requestedDeliveryDate,
      document.promisedDeliveryDate,
      document.validTillDate,
      document.placeOfSupply,
      document.deliveryAddress,
      document.shippingAddress,
      document.paymentRemarks,
    ],
    keywords: lineKeywords(document.lines, [
      'productCode',
      'productName',
      'hsnSac',
      'uom',
      'status',
      'remark',
      'lineAmount',
    ]),
  };
}

function saleAllocationRecord(
  document: SaleAllocationDocument | SaleAllocationRequisitionDocument,
  entity: Extract<GlobalSearchEntity, 'sale-allocation' | 'sale-allocation-requisition'>,
  groupLabel: string,
  route: string
): GlobalSearchRecord {
  return {
    id: document.id,
    entity,
    groupLabel,
    title: document.number,
    subtitle: `${document.customerName} | ${document.warehouse}`,
    description: `${document.allocationMode} allocation`,
    status: document.status,
    priority: document.priority,
    amount: document.totalAmount,
    date: document.requestDateTime,
    href: makeHref(route, document.id),
    exactFields: [document.number, document.id],
    primaryFields: [
      document.customerName,
      document.department,
      document.orderSource,
      document.salesExecutive,
      document.warehouse,
      document.allocationMode,
      document.status,
      document.priority,
      document.totalAmount,
    ],
    secondaryFields: [
      document.requestDateTime,
      formatDate(document.requestDateTime),
      document.requestedDeliveryDate,
      document.validTillDate,
      document.sourceLocation,
      document.destinationLocation,
      document.dispatchMode,
      document.instructions,
    ],
    keywords: lineKeywords(document.lines, [
      'productCode',
      'productName',
      'category',
      'uom',
      'priority',
      'remark',
      'amount',
    ]),
  };
}

function saleInvoiceRecord(document: SaleInvoiceDocument): GlobalSearchRecord {
  return {
    id: document.id,
    entity: 'sale-invoice',
    groupLabel: 'Sale Invoices',
    title: document.number,
    subtitle: `${document.customerName} | ${document.salesExecutive}`,
    description: document.saleOrderNumber ? `Linked SO ${document.saleOrderNumber}` : document.remarks,
    status: document.status,
    priority: document.priority,
    amount: document.totalAmount,
    date: document.invoiceDateTime,
    href: makeHref('#/sale-invoice/new', document.id),
    exactFields: [document.number, document.id, document.saleOrderNumber],
    primaryFields: [
      document.customerName,
      document.orderSource,
      document.salesExecutive,
      document.status,
      document.priority,
      document.paymentMode,
      document.paymentTerm,
      document.totalAmount,
      document.taxableAmount,
    ],
    secondaryFields: [
      document.invoiceDateTime,
      formatDate(document.invoiceDateTime),
      document.orderDate,
      document.placeOfSupply,
      document.discountAmount,
      document.taxAmount,
      document.remarks,
    ],
    keywords: lineKeywords(document.lines, [
      'productCode',
      'productName',
      'hsnSac',
      'uom',
      'status',
      'remark',
      'lineAmount',
    ]),
  };
}

function deliveryRecord(document: DeliveryDocument): GlobalSearchRecord {
  return {
    id: document.id,
    entity: 'delivery',
    groupLabel: 'Deliveries',
    title: document.number,
    subtitle: `${document.customerName} | ${document.deliveryMethod}`,
    description: document.saleInvoiceNumber ? `Linked invoice ${document.saleInvoiceNumber}` : document.deliveryLocation,
    status: document.status,
    priority: document.priority,
    amount: document.totalAmount,
    date: document.deliveryDateTime,
    href: makeHref('#/delivery/new', document.id),
    exactFields: [document.number, document.id, document.saleInvoiceNumber, document.saleOrderNumber, document.vehicleNumber],
    primaryFields: [
      document.customerName,
      document.deliveryLocation,
      document.deliveryMethod,
      document.transporterName,
      document.salesExecutive,
      document.status,
      document.priority,
      document.totalAmount,
    ],
    secondaryFields: [
      document.deliveryDateTime,
      formatDate(document.deliveryDateTime),
      document.totalPackages,
      document.vehicleNumber,
    ],
    keywords: lineKeywords(document.lines, ['productCode', 'productName', 'uom', 'status', 'remarks']),
  };
}

const globalSearchIndex: GlobalSearchRecord[] = [
  ...extendedPurchaseRequisitionDocuments.map(purchaseRequisitionRecord),
  ...extendedPurchaseOrderDocuments.map((document) =>
    purchaseDocumentRecord(document, 'purchase-order', 'Purchase Orders', '#/purchase-order/new')
  ),
  ...extendedPurchaseReceiptDocuments.map((document) =>
    purchaseDocumentRecord(document, 'purchase-receipt', 'Purchase Receipts', '#/purchase-receipt/new')
  ),
  ...extendedPurchaseInvoiceDocuments.map((document) =>
    purchaseDocumentRecord(document, 'purchase-invoice', 'Purchase Invoices', '#/purchase-invoice/new')
  ),
  ...extendedSaleOrderDocuments.map(saleOrderRecord),
  ...extendedSaleAllocationRequisitionDocuments.map((document) =>
    saleAllocationRecord(
      document,
      'sale-allocation-requisition',
      'Sale Allocation Requisitions',
      '#/sale-allocation-requisition/new'
    )
  ),
  ...extendedSaleAllocationDocuments.map((document) =>
    saleAllocationRecord(document, 'sale-allocation', 'Sale Allocations', '#/sale-allocation/new')
  ),
  ...extendedSaleInvoiceDocuments.map(saleInvoiceRecord),
  ...extendedDeliveryDocuments.map(deliveryRecord),
];

export const globalSearchEntityLabels: Record<GlobalSearchEntity, string> = {
  'purchase-requisition': 'Purchase Requisition',
  'purchase-order': 'Purchase Order',
  'purchase-receipt': 'Purchase Receipt',
  'purchase-invoice': 'Purchase Invoice',
  'sale-order': 'Sale Order',
  'sale-allocation-requisition': 'Sale Allocation Requisition',
  'sale-allocation': 'Sale Allocation',
  'sale-invoice': 'Sale Invoice',
  delivery: 'Delivery',
};

export function searchGlobalRecords(
  rawQuery: string,
  maxResults = MAX_RESULTS,
  options?: GlobalSearchOptions
): GlobalSearchGroup[] {
  const query = rawQuery.trim();

  if (!query) {
    return [];
  }

  const allowedEntities = options?.entities ? new Set(options.entities) : null;

  const rankedResults = globalSearchIndex
    .filter((record) => !allowedEntities || allowedEntities.has(record.entity))
    .map((record) => rankRecord(record, query))
    .filter((result): result is GlobalSearchResult => Boolean(result))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return rankedResults.reduce<GlobalSearchGroup[]>((groups, result) => {
    const existingGroup = groups.find((group) => group.entity === result.entity);

    if (existingGroup) {
      existingGroup.results.push(result);
      return groups;
    }

    groups.push({
      entity: result.entity,
      label: result.groupLabel,
      results: [result],
    });

    return groups;
  }, []);
}

export const globalSearchCriteria = [
  {
    entity: 'Purchase Requisition',
    fields: ['PR number/id', 'supplier', 'requester', 'department', 'status', 'priority', 'dates', 'product lines'],
  },
  {
    entity: 'Purchase Order / Receipt / Invoice',
    fields: ['document number/id', 'linked PR number', 'supplier', 'buyer/creator', 'amounts', 'status', 'line items'],
  },
  {
    entity: 'Sale Order / Invoice / Delivery',
    fields: ['document number/id', 'linked SO/SI numbers', 'customer', 'sales executive', 'amounts', 'status', 'products'],
  },
  {
    entity: 'Sale Allocation Requisition / Allocation',
    fields: ['document number/id', 'customer', 'warehouse', 'allocation mode', 'status', 'priority', 'product lines'],
  },
];
