import type { RequisitionPriority, RequisitionStatus } from '../purchaseRequisitionCatalogueData';

export interface SaleAllocationRequisitionLineDocument {
  productCode: string;
  productName: string;
  category: string;
  uom: string;
  requirementDate: string;
  requestedQty: string;
  allocatedQty: string;
  pendingQty: string;
  priority: Exclude<RequisitionPriority, 'Critical'>;
  remark: string;
  amount: string;
}

export interface SaleAllocationRequisitionDocument {
  id: string;
  number: string;
  requestDateTime: string;
  customerName: string;
  department: string;
  orderSource: string;
  salesExecutive: string;
  requestedDeliveryDate: string;
  validTillDate: string;
  warehouse: string;
  allocationMode: string;
  priority: Exclude<RequisitionPriority, 'Critical'>;
  status: RequisitionStatus;
  sourceLocation: string;
  destinationLocation: string;
  dispatchMode: string;
  deliverySlot: string;
  instructions: string;
  totalAmount: string;
  lines: SaleAllocationRequisitionLineDocument[];
}

export const saleAllocationRequisitionDocuments: SaleAllocationRequisitionDocument[] = [
  {
    id: 'sar-1001',
    number: 'SAR-2026-00011',
    requestDateTime: '2026-04-17T10:30:00',
    customerName: 'Galaxy Motors',
    department: 'Manufacturing',
    orderSource: 'Dealer Portal',
    salesExecutive: 'Aarav Sharma',
    requestedDeliveryDate: '2026-04-25',
    validTillDate: '2026-04-30',
    warehouse: 'Pune Central Warehouse',
    allocationMode: 'Priority-based',
    priority: 'High',
    status: 'Draft',
    sourceLocation: 'Pune Central Warehouse',
    destinationLocation: 'Galaxy Motors, Pune',
    dispatchMode: 'Road Transport',
    deliverySlot: 'Morning',
    instructions: 'Allocate campaign stock first.',
    totalAmount: '124500.00',
    lines: [
      {
        productCode: 'SP-1001',
        productName: 'Front Brake Assembly',
        category: 'Braking',
        uom: 'Unit',
        requirementDate: '2026-04-22',
        requestedQty: '6.00',
        allocatedQty: '2.00',
        pendingQty: '4.00',
        priority: 'High',
        remark: 'Workshop campaign requirement.',
        amount: '75000.00',
      },
      {
        productCode: 'SP-1002',
        productName: 'Clutch Master Cylinder',
        category: 'Transmission',
        uom: 'Unit',
        requirementDate: '2026-04-23',
        requestedQty: '4.00',
        allocatedQty: '1.00',
        pendingQty: '3.00',
        priority: 'Medium',
        remark: 'Counter stock refill.',
        amount: '49500.00',
      },
    ],
  },
  {
    id: 'sar-1002',
    number: 'SAR-2026-00012',
    requestDateTime: '2026-04-16T15:05:00',
    customerName: 'Velocity Auto Hub',
    department: 'Operations',
    orderSource: 'Field Sales',
    salesExecutive: 'Neha Kapoor',
    requestedDeliveryDate: '2026-04-28',
    validTillDate: '2026-05-02',
    warehouse: 'North Regional Hub',
    allocationMode: 'Demand-based',
    priority: 'Medium',
    status: 'Pending Approval',
    sourceLocation: 'North Regional Hub',
    destinationLocation: 'Velocity Auto Hub, Delhi',
    dispatchMode: 'Pickup',
    deliverySlot: 'Evening',
    instructions: 'Hold until branch confirms slot.',
    totalAmount: '86400.00',
    lines: [
      {
        productCode: 'SP-1003',
        productName: 'Alternator Kit',
        category: 'Electrical',
        uom: 'Set',
        requirementDate: '2026-04-25',
        requestedQty: '4.00',
        allocatedQty: '0.00',
        pendingQty: '4.00',
        priority: 'Medium',
        remark: 'Retail counter requirement.',
        amount: '86400.00',
      },
    ],
  },
  {
    id: 'sar-1003',
    number: 'SAR-2026-00013',
    requestDateTime: '2026-04-14T11:40:00',
    customerName: 'Prime Wheels',
    department: 'Engineering',
    orderSource: 'Marketplace',
    salesExecutive: 'Rohit Mehta',
    requestedDeliveryDate: '2026-04-24',
    validTillDate: '2026-04-27',
    warehouse: 'Bengaluru Distribution Centre',
    allocationMode: 'Confirmed order pool',
    priority: 'Low',
    status: 'Approved',
    sourceLocation: 'Bengaluru Distribution Centre',
    destinationLocation: 'Prime Wheels, Bengaluru',
    dispatchMode: 'Courier',
    deliverySlot: 'Afternoon',
    instructions: 'Allocate only approved lot.',
    totalAmount: '53100.00',
    lines: [
      {
        productCode: 'SP-1004',
        productName: 'Steering Rack Kit',
        category: 'Steering',
        uom: 'Unit',
        requirementDate: '2026-04-20',
        requestedQty: '3.00',
        allocatedQty: '3.00',
        pendingQty: '0.00',
        priority: 'Low',
        remark: 'Approved and fully allocated.',
        amount: '53100.00',
      },
    ],
  },
];

export const extendedSaleAllocationRequisitionDocuments: SaleAllocationRequisitionDocument[] = Array.from(
  { length: 2 },
  (_, cycle) =>
    saleAllocationRequisitionDocuments.map((document, index) => {
      const sequence = cycle * saleAllocationRequisitionDocuments.length + index + 1;
      const paddedSequence = String(sequence + 10).padStart(5, '0');

      return {
        ...document,
        id: `${document.id}-${sequence}`,
        number: `SAR-2026-${paddedSequence}`,
      };
    })
).flat();

export function getSaleAllocationRequisitionById(
  id: string | null
): SaleAllocationRequisitionDocument | undefined {
  if (!id) {
    return undefined;
  }

  return extendedSaleAllocationRequisitionDocuments.find((document) => document.id === id);
}
