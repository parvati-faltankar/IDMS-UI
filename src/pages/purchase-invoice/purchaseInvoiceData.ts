import type { RequisitionPriority, RequisitionStatus } from '../purchase-requisition/purchaseRequisitionCatalogueData';

export interface PurchaseOrderLine {
  itemCode: string;
  itemName: string;
  description: string;
  uom: string;
  quantity: string;
  unitPrice: string;
  expectedDate: string;
  amount: string;
}

export interface PurchaseOrderDocument {
  id: string;
  number: string;
  orderDateTime: string;
  requisitionNumber: string;
  requisitionDate: string;
  supplierName: string;
  buyerName: string;
  createdBy: string;
  createdOn: string;
  buyerEmail: string;
  branch: string;
  department: string;
  priority: RequisitionPriority;
  status: RequisitionStatus;
  expectedDeliveryDate: string;
  paymentTerms: string;
  incoterm: string;
  taxableAmount: string;
  totalDiscount: string;
  totalTaxes: string;
  totalAmount: string;
  currency: string;
  notes: string;
  lines: PurchaseOrderLine[];
}

export const purchaseOrderDocuments: PurchaseOrderDocument[] = [
  {
    id: 'pinv-1001',
    number: 'PI-2025-00418',
    orderDateTime: '2025-03-18T11:10:00',
    requisitionNumber: 'PR-2025-00721',
    requisitionDate: '2025-03-12',
    supplierName: 'Techsupply Corp',
    buyerName: 'Alex Kumar',
    createdBy: 'Alex Kumar',
    createdOn: '2025-03-18T11:10:00',
    buyerEmail: 'alex.kumar@excellonsoft.com',
    branch: 'Head Office',
    department: 'Manufacturing',
    priority: 'High',
    status: 'Draft',
    expectedDeliveryDate: '2025-04-12',
    paymentTerms: 'Net 30',
    incoterm: 'FOB',
    taxableAmount: '17000.00',
    totalDiscount: '400.00',
    totalTaxes: '1850.00',
    totalAmount: '18450.00',
    currency: 'USD',
    notes: 'Created against approved spare parts sourcing plan for April demand.',
    lines: [
      {
        itemCode: 'P-1001',
        itemName: 'Industrial Bearing Assembly',
        description: 'Precision grade bearing assembly for conveyor equipment',
        uom: 'Unit',
        quantity: '120.00',
        unitPrice: '95.00',
        expectedDate: '2025-04-10',
        amount: '11400.00',
      },
      {
        itemCode: 'P-1002',
        itemName: 'Stainless Steel Fasteners Kit',
        description: 'Fasteners kit covering M10 to M20 sizes',
        uom: 'Box',
        quantity: '30.00',
        unitPrice: '235.00',
        expectedDate: '2025-04-12',
        amount: '7050.00',
      },
    ],
  },
  {
    id: 'pinv-1002',
    number: 'PI-2025-00394',
    orderDateTime: '2025-03-11T16:25:00',
    requisitionNumber: 'PR-2025-00694',
    requisitionDate: '2025-03-07',
    supplierName: 'Apex Industries',
    buyerName: 'Neha Sharma',
    createdBy: 'Neha Sharma',
    createdOn: '2025-03-11T16:25:00',
    buyerEmail: 'neha.sharma@excellonsoft.com',
    branch: 'North Hub',
    department: 'Operations',
    priority: 'Critical',
    status: 'Pending Approval',
    expectedDeliveryDate: '2025-03-28',
    paymentTerms: 'Net 15',
    incoterm: 'EXW',
    taxableAmount: '8900.00',
    totalDiscount: '300.00',
    totalTaxes: '1020.00',
    totalAmount: '9620.00',
    currency: 'USD',
    notes: 'Urgent service order for shutdown material consumption.',
    lines: [
      {
        itemCode: 'P-1003',
        itemName: 'Hydraulic Seal Pack',
        description: 'High-pressure seal pack for maintenance shutdowns',
        uom: 'Pack',
        quantity: '24.00',
        unitPrice: '180.00',
        expectedDate: '2025-03-26',
        amount: '4320.00',
      },
      {
        itemCode: 'P-1002',
        itemName: 'Stainless Steel Fasteners Kit',
        description: 'Fasteners kit covering M10 to M20 sizes',
        uom: 'Box',
        quantity: '20.00',
        unitPrice: '265.00',
        expectedDate: '2025-03-28',
        amount: '5300.00',
      },
    ],
  },
  {
    id: 'pinv-1003',
    number: 'PI-2025-00352',
    orderDateTime: '2025-03-03T09:05:00',
    requisitionNumber: 'PR-2025-00641',
    requisitionDate: '2025-02-26',
    supplierName: 'Global Supplies Ltd',
    buyerName: 'Rohit Menon',
    createdBy: 'Rohit Menon',
    createdOn: '2025-03-03T09:05:00',
    buyerEmail: 'rohit.menon@excellonsoft.com',
    branch: 'South Hub',
    department: 'Engineering',
    priority: 'Medium',
    status: 'Approved',
    expectedDeliveryDate: '2025-03-24',
    paymentTerms: 'Net 45',
    incoterm: 'CIF',
    taxableAmount: '4800.00',
    totalDiscount: '90.00',
    totalTaxes: '500.00',
    totalAmount: '5210.00',
    currency: 'USD',
    notes: 'Approved maintenance replenishment order for March cycle.',
    lines: [
      {
        itemCode: 'P-1002',
        itemName: 'Stainless Steel Fasteners Kit',
        description: 'Fasteners kit covering M10 to M20 sizes',
        uom: 'Box',
        quantity: '22.00',
        unitPrice: '165.00',
        expectedDate: '2025-03-24',
        amount: '3630.00',
      },
      {
        itemCode: 'P-1004',
        itemName: 'Maintenance Lubricant Drum',
        description: 'High temperature lubricant drum for plant assets',
        uom: 'Drum',
        quantity: '4.00',
        unitPrice: '395.00',
        expectedDate: '2025-03-24',
        amount: '1580.00',
      },
    ],
  },
  {
    id: 'pinv-1004',
    number: 'PI-2025-00308',
    orderDateTime: '2025-02-24T13:40:00',
    requisitionNumber: '',
    requisitionDate: '2025-02-18',
    supplierName: 'SafeWorks Trading',
    buyerName: 'Priya Nair',
    createdBy: 'Priya Nair',
    createdOn: '2025-02-24T13:40:00',
    buyerEmail: 'priya.nair@excellonsoft.com',
    branch: 'East Depot',
    department: 'Operations',
    priority: 'Low',
    status: 'Cancelled',
    expectedDeliveryDate: '2025-03-17',
    paymentTerms: 'Net 30',
    incoterm: 'FOB',
    taxableAmount: '2500.00',
    totalDiscount: '120.00',
    totalTaxes: '400.00',
    totalAmount: '2780.00',
    currency: 'USD',
    notes: 'Cancelled after budget freeze and sourcing realignment.',
    lines: [
      {
        itemCode: 'P-1005',
        itemName: 'Safety Gloves Pack',
        description: 'Warehouse-ready safety glove packs',
        uom: 'Pack',
        quantity: '40.00',
        unitPrice: '32.50',
        expectedDate: '2025-03-17',
        amount: '1300.00',
      },
      {
        itemCode: 'P-1006',
        itemName: 'Protective Glasses',
        description: 'Protective eyewear for floor operations',
        uom: 'Unit',
        quantity: '60.00',
        unitPrice: '24.67',
        expectedDate: '2025-03-17',
        amount: '1480.00',
      },
    ],
  },
];

export const extendedPurchaseOrderDocuments: PurchaseOrderDocument[] = Array.from({ length: 4 }, (_, cycle) =>
  purchaseOrderDocuments.map((document, index) => {
    const sequence = cycle * purchaseOrderDocuments.length + index + 1;
    const paddedSequence = String(sequence).padStart(5, '0');

    return {
      ...document,
      id: `${document.id}-${sequence}`,
      number: `PI-2025-${paddedSequence}`,
    };
  })
).flat();

export function getPurchaseOrderById(id: string | null): PurchaseOrderDocument | undefined {
  if (!id) {
    return undefined;
  }

  return extendedPurchaseOrderDocuments.find((document) => document.id === id);
}
