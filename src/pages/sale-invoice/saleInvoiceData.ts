import type { RequisitionPriority, RequisitionStatus } from '../purchase-requisition/purchaseRequisitionCatalogueData';
import type { SaleOrderLineDocument } from '../sale-order/saleOrderData';

export interface SaleInvoiceDocument {
  id: string;
  number: string;
  invoiceDateTime: string;
  saleOrderNumber: string;
  orderDate: string;
  customerName: string;
  orderSource: string;
  salesExecutive: string;
  priority: Exclude<RequisitionPriority, 'Critical'>;
  status: RequisitionStatus;
  paymentMode: string;
  paymentTerm: string;
  placeOfSupply: string;
  taxableAmount: string;
  discountAmount: string;
  taxAmount: string;
  totalAmount: string;
  remarks: string;
  lines: SaleOrderLineDocument[];
}

const baseLines: SaleOrderLineDocument[] = [
  {
    productCode: 'SP-1001',
    productName: 'Front Brake Assembly',
    hsnSac: '870830',
    uom: 'Unit',
    requestedDate: '2026-04-22',
    fulfillmentDate: '2026-04-24',
    priority: 'High',
    rate: '12500.00',
    orderQuantity: '4.00',
    baseAmount: '50000.00',
    discountPercent: '4.00',
    discountAmount: '2000.00',
    taxableAmount: '48000.00',
    taxationColumn: 'GST 18%',
    lineAmount: '56640.00',
    convertedQuantity: '0.00',
    pendingQuantity: '4.00',
    status: 'Open',
    remark: 'Invoice against confirmed dispatch.',
  },
  {
    productCode: 'SP-1003',
    productName: 'Alternator Kit',
    hsnSac: '851150',
    uom: 'Set',
    requestedDate: '2026-04-23',
    fulfillmentDate: '2026-04-25',
    priority: 'Medium',
    rate: '21600.00',
    orderQuantity: '2.00',
    baseAmount: '43200.00',
    discountPercent: '0.00',
    discountAmount: '0.00',
    taxableAmount: '43200.00',
    taxationColumn: 'GST 18%',
    lineAmount: '50976.00',
    convertedQuantity: '0.00',
    pendingQuantity: '2.00',
    status: 'Open',
    remark: '',
  },
];

export const saleInvoiceDocuments: SaleInvoiceDocument[] = [
  {
    id: 'si-1001',
    number: 'SI-2026-00011',
    invoiceDateTime: '2026-04-18T10:25:00',
    saleOrderNumber: 'SO-2026-00011',
    orderDate: '2026-04-17',
    customerName: 'Galaxy Motors',
    orderSource: 'Dealer Portal',
    salesExecutive: 'Aarav Sharma',
    priority: 'High',
    status: 'Draft',
    paymentMode: 'Credit',
    paymentTerm: 'Net 30',
    placeOfSupply: 'Maharashtra',
    taxableAmount: '91200.00',
    discountAmount: '2000.00',
    taxAmount: '16416.00',
    totalAmount: '107616.00',
    remarks: 'Draft invoice prepared for approved sale order.',
    lines: baseLines,
  },
  {
    id: 'si-1002',
    number: 'SI-2026-00012',
    invoiceDateTime: '2026-04-17T14:10:00',
    saleOrderNumber: 'SO-2026-00012',
    orderDate: '2026-04-16',
    customerName: 'Velocity Auto Hub',
    orderSource: 'Field Sales',
    salesExecutive: 'Neha Kapoor',
    priority: 'Medium',
    status: 'Pending Approval',
    paymentMode: 'Cash',
    paymentTerm: 'Immediate',
    placeOfSupply: 'Delhi',
    taxableAmount: '64800.00',
    discountAmount: '0.00',
    taxAmount: '11664.00',
    totalAmount: '76464.00',
    remarks: 'Approval pending before posting invoice.',
    lines: [baseLines[1]],
  },
  {
    id: 'si-1003',
    number: 'SI-2026-00013',
    invoiceDateTime: '2026-04-15T16:45:00',
    saleOrderNumber: 'SO-2026-00013',
    orderDate: '2026-04-14',
    customerName: 'Prime Wheels',
    orderSource: 'Marketplace',
    salesExecutive: 'Rohit Mehta',
    priority: 'Low',
    status: 'Approved',
    paymentMode: 'Credit',
    paymentTerm: 'Net 15',
    placeOfSupply: 'Karnataka',
    taxableAmount: '45000.00',
    discountAmount: '0.00',
    taxAmount: '8100.00',
    totalAmount: '53100.00',
    remarks: 'Invoice approved and ready for dispatch reconciliation.',
    lines: [
      {
        ...baseLines[0],
        productCode: 'SP-1004',
        productName: 'Steering Rack Kit',
        hsnSac: '870894',
        rate: '15000.00',
        orderQuantity: '3.00',
        baseAmount: '45000.00',
        taxableAmount: '45000.00',
        lineAmount: '53100.00',
        priority: 'Low',
      },
    ],
  },
];

export const extendedSaleInvoiceDocuments: SaleInvoiceDocument[] = Array.from(
  { length: 2 },
  (_, cycle) =>
    saleInvoiceDocuments.map((document, index) => {
      const sequence = cycle * saleInvoiceDocuments.length + index + 1;
      const paddedSequence = String(sequence + 10).padStart(5, '0');

      return {
        ...document,
        id: `${document.id}-${sequence}`,
        number: `SI-2026-${paddedSequence}`,
      };
    })
).flat();

export function getSaleInvoiceById(id: string | null): SaleInvoiceDocument | undefined {
  if (!id) {
    return undefined;
  }

  return extendedSaleInvoiceDocuments.find((document) => document.id === id);
}
