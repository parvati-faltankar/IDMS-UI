import type { RequisitionPriority, RequisitionStatus } from '../purchase-requisition/purchaseRequisitionCatalogueData';

export interface DeliveryLineDocument {
  productCode: string;
  productName: string;
  uom: string;
  orderedQty: string;
  deliveredQty: string;
  pendingQty: string;
  status: 'Open' | 'Partially Delivered' | 'Delivered';
  remarks: string;
}

export interface DeliveryDocument {
  id: string;
  number: string;
  deliveryDateTime: string;
  saleInvoiceNumber: string;
  saleOrderNumber: string;
  customerName: string;
  deliveryLocation: string;
  deliveryMethod: string;
  transporterName: string;
  vehicleNumber: string;
  salesExecutive: string;
  priority: Exclude<RequisitionPriority, 'Critical'>;
  status: RequisitionStatus;
  totalPackages: string;
  totalAmount: string;
  lines: DeliveryLineDocument[];
}

export const deliveryDocuments: DeliveryDocument[] = [
  {
    id: 'delivery-1001',
    number: 'DL-2026-00011',
    deliveryDateTime: '2026-04-18T12:15:00',
    saleInvoiceNumber: 'SI-2026-00011',
    saleOrderNumber: 'SO-2026-00011',
    customerName: 'Galaxy Motors',
    deliveryLocation: 'Galaxy Motors, Pune',
    deliveryMethod: 'Road Transport',
    transporterName: 'BlueLine Logistics',
    vehicleNumber: 'MH 14 GT 4582',
    salesExecutive: 'Aarav Sharma',
    priority: 'High',
    status: 'Draft',
    totalPackages: '6',
    totalAmount: '107616.00',
    lines: [
      {
        productCode: 'SP-1001',
        productName: 'Front Brake Assembly',
        uom: 'Unit',
        orderedQty: '4.00',
        deliveredQty: '2.00',
        pendingQty: '2.00',
        status: 'Partially Delivered',
        remarks: 'Balance dispatch after gate pass.',
      },
      {
        productCode: 'SP-1003',
        productName: 'Alternator Kit',
        uom: 'Set',
        orderedQty: '2.00',
        deliveredQty: '0.00',
        pendingQty: '2.00',
        status: 'Open',
        remarks: '',
      },
    ],
  },
  {
    id: 'delivery-1002',
    number: 'DL-2026-00012',
    deliveryDateTime: '2026-04-17T16:40:00',
    saleInvoiceNumber: 'SI-2026-00012',
    saleOrderNumber: 'SO-2026-00012',
    customerName: 'Velocity Auto Hub',
    deliveryLocation: 'Velocity Auto Hub, Delhi',
    deliveryMethod: 'Customer Pickup',
    transporterName: 'Customer Vehicle',
    vehicleNumber: 'DL 01 CX 9834',
    salesExecutive: 'Neha Kapoor',
    priority: 'Medium',
    status: 'Pending Approval',
    totalPackages: '3',
    totalAmount: '76464.00',
    lines: [
      {
        productCode: 'SP-1003',
        productName: 'Alternator Kit',
        uom: 'Set',
        orderedQty: '3.00',
        deliveredQty: '0.00',
        pendingQty: '3.00',
        status: 'Open',
        remarks: 'Awaiting pickup confirmation.',
      },
    ],
  },
  {
    id: 'delivery-1003',
    number: 'DL-2026-00013',
    deliveryDateTime: '2026-04-15T18:05:00',
    saleInvoiceNumber: 'SI-2026-00013',
    saleOrderNumber: 'SO-2026-00013',
    customerName: 'Prime Wheels',
    deliveryLocation: 'Prime Wheels, Bengaluru',
    deliveryMethod: 'Courier',
    transporterName: 'ExpressRoad Couriers',
    vehicleNumber: 'KA 03 MN 1120',
    salesExecutive: 'Rohit Mehta',
    priority: 'Low',
    status: 'Approved',
    totalPackages: '2',
    totalAmount: '53100.00',
    lines: [
      {
        productCode: 'SP-1004',
        productName: 'Steering Rack Kit',
        uom: 'Unit',
        orderedQty: '3.00',
        deliveredQty: '3.00',
        pendingQty: '0.00',
        status: 'Delivered',
        remarks: 'Delivered successfully.',
      },
    ],
  },
];

export const extendedDeliveryDocuments: DeliveryDocument[] = Array.from(
  { length: 2 },
  (_, cycle) =>
    deliveryDocuments.map((document, index) => {
      const sequence = cycle * deliveryDocuments.length + index + 1;
      const paddedSequence = String(sequence + 10).padStart(5, '0');

      return {
        ...document,
        id: `${document.id}-${sequence}`,
        number: `DL-2026-${paddedSequence}`,
      };
    })
).flat();

export function getDeliveryById(id: string | null): DeliveryDocument | undefined {
  if (!id) {
    return undefined;
  }

  return extendedDeliveryDocuments.find((document) => document.id === id);
}
