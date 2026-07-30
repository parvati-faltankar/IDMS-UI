import { extendedDeliveryDocuments, type DeliveryDocument } from '../pages/delivery/deliveryData';
import { extendedJobCardDocuments, type JobCardDocument } from '../pages/job-card/jobCardCatalogueData';
import {
  extendedPurchaseOrderDocuments as extendedPurchaseInvoiceDocuments,
  type PurchaseOrderDocument as PurchaseInvoiceDocument,
} from '../pages/purchase-invoice/purchaseInvoiceData';
import { extendedPurchaseOrderDocuments, type PurchaseOrderDocument } from '../pages/purchase-order/purchaseOrderData';
import {
  extendedPurchaseOrderDocuments as extendedPurchaseReceiptDocuments,
  type PurchaseOrderDocument as PurchaseReceiptDocument,
} from '../pages/purchase-receipt/purchaseReceiptData';
import {
  extendedPurchaseRequisitionDocuments,
  type PurchaseRequisitionDocument,
} from '../pages/purchase-requisition/purchaseRequisitionCatalogueData';
import { extendedSaleAllocationDocuments, type SaleAllocationDocument } from '../pages/sale-allocation/saleAllocationData';
import {
  extendedSaleAllocationRequisitionDocuments,
  type SaleAllocationRequisitionDocument,
} from '../pages/sale-allocation-requisition/saleAllocationRequisitionData';
import { extendedSaleInvoiceDocuments, type SaleInvoiceDocument } from '../pages/sale-invoice/saleInvoiceData';
import { extendedSaleOrderDocuments, type SaleOrderDocument } from '../pages/sale-order/saleOrderData';
import type { PrintEntityRegistryItem, PrintFieldGroup, PrintFieldToken, PrintTableCollection, PrintEntityType } from './types';

type RegistryDocument =
  | PurchaseRequisitionDocument
  | JobCardDocument
  | PurchaseOrderDocument
  | PurchaseReceiptDocument
  | PurchaseInvoiceDocument
  | SaleOrderDocument
  | SaleAllocationRequisitionDocument
  | SaleAllocationDocument
  | SaleInvoiceDocument
  | DeliveryDocument;

const KEY_LABEL_OVERRIDES: Record<string, string> = {
  hsnSac: 'HSN/SAC',
  uom: 'UOM',
  id: 'ID',
  gstin: 'GSTIN',
  poDate: 'PO Date',
  prDate: 'PR Date',
};

function labelize(key: string) {
  if (KEY_LABEL_OVERRIDES[key]) {
    return KEY_LABEL_OVERRIDES[key];
  }

  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isScalarValue(value: unknown) {
  return value === null || value === undefined || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function isObjectArray(value: unknown): value is Array<Record<string, unknown>> {
  return Array.isArray(value) && value.every((item) => item && typeof item === 'object' && !Array.isArray(item));
}

function buildFieldGroups(sample: RegistryDocument): PrintFieldGroup[] {
  const scalarEntries = Object.entries(sample).filter(([, value]) => isScalarValue(value));
  const buckets: Array<{ id: string; label: string; match: (key: string) => boolean }> = [
    {
      id: 'identity',
      label: 'Document Identity',
      match: (key) => /number|date|time|status|priority|title/i.test(key),
    },
    {
      id: 'party',
      label: 'Party Details',
      match: (key) => /supplier|customer|buyer|requester|executive|contact|email/i.test(key),
    },
    {
      id: 'fulfilment',
      label: 'Delivery and Reference',
      match: (key) => /delivery|warehouse|location|source|destination|branch|department|term|method|mode|slot|transport|vehicle|incoterm/i.test(key),
    },
    {
      id: 'commercial',
      label: 'Commercial Summary',
      match: (key) => /amount|tax|discount|currency|payment|balance|finance|emi|package|linecount|count/i.test(key),
    },
  ];

  const used = new Set<string>();
  const groups = buckets
    .map((bucket) => {
      const fields = scalarEntries
        .filter(([key]) => !used.has(key) && bucket.match(key))
        .map(([key]) => {
          used.add(key);
          return { token: key, label: labelize(key) };
        });
      return { id: bucket.id, label: bucket.label, fields };
    })
    .filter((group) => group.fields.length > 0);

  const additionalFields = scalarEntries
    .filter(([key]) => !used.has(key))
    .map(([key]) => ({ token: key, label: labelize(key) }));

  if (additionalFields.length > 0) {
    groups.push({
      id: 'additional',
      label: 'Additional Details',
      fields: additionalFields,
    });
  }

  return groups;
}

function buildTableCollections(sample: RegistryDocument): PrintTableCollection[] {
  return Object.entries(sample)
    .filter(([, value]) => isObjectArray(value))
    .map(([key, rows]) => {
      const firstRow = rows[0] ?? {};
      const columns: PrintFieldToken[] = Object.keys(firstRow).map((columnKey) => ({
        token: columnKey,
        label: labelize(columnKey),
      }));

      return {
        key,
        label: labelize(key),
        columns,
      };
    });
}

function buildItem<TDocument extends RegistryDocument>(
  id: PrintEntityType,
  label: string,
  route: string,
  sampleDocuments: TDocument[]
): PrintEntityRegistryItem<TDocument> {
  const sample = sampleDocuments[0];
  return {
    id,
    label,
    route,
    sampleDocuments,
    fieldGroups: sample ? buildFieldGroups(sample) : [],
    tableCollections: sample ? buildTableCollections(sample) : [],
  };
}

export const printEntityRegistry = [
  buildItem('purchase-requisition', 'Purchase Requisition', '#/purchase-requisition', extendedPurchaseRequisitionDocuments),
  buildItem('job-card', 'Job Card', '#/job-card', extendedJobCardDocuments),
  buildItem('purchase-order', 'Purchase Order', '#/purchase-order', extendedPurchaseOrderDocuments),
  buildItem('purchase-receipt', 'Purchase Receipt', '#/purchase-receipt', extendedPurchaseReceiptDocuments),
  buildItem('purchase-invoice', 'Purchase Invoice', '#/purchase-invoice', extendedPurchaseInvoiceDocuments),
  buildItem('sale-order', 'Sale Order', '#/sale-order', extendedSaleOrderDocuments),
  buildItem('sale-allocation-requisition', 'Sale Allocation Requisition', '#/sale-allocation-requisition', extendedSaleAllocationRequisitionDocuments),
  buildItem('sale-allocation', 'Sale Allocation', '#/sale-allocation', extendedSaleAllocationDocuments),
  buildItem('sale-invoice', 'Sale Invoice', '#/sale-invoice', extendedSaleInvoiceDocuments),
  buildItem('delivery', 'Delivery', '#/delivery', extendedDeliveryDocuments),
] satisfies PrintEntityRegistryItem<object>[];

export function getPrintEntityRegistryItem(entityType: PrintEntityType) {
  return printEntityRegistry.find((item) => item.id === entityType) ?? null;
}
