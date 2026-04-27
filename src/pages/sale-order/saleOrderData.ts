import type { RequisitionPriority, RequisitionStatus } from '../purchase-requisition/purchaseRequisitionCatalogueData';

export interface SaleOrderLineDocument {
  productCode: string;
  productName: string;
  hsnSac: string;
  uom: string;
  requestedDate: string;
  fulfillmentDate: string;
  priority: Exclude<RequisitionPriority, 'Critical'>;
  rate: string;
  orderQuantity: string;
  baseAmount: string;
  discountPercent: string;
  discountAmount: string;
  taxableAmount: string;
  taxationColumn: string;
  lineAmount: string;
  convertedQuantity: string;
  pendingQuantity: string;
  status: 'Open' | 'Partially Ordered' | 'Fully Ordered';
  remark: string;
}

export interface SaleOrderDocument {
  id: string;
  number: string;
  orderDateTime: string;
  customerName: string;
  orderSource: string;
  salesExecutive: string;
  requestedDeliveryDate: string;
  validTillDate: string;
  placeOfSupply: string;
  promisedDeliveryDate: string;
  priority: Exclude<RequisitionPriority, 'Critical'>;
  status: RequisitionStatus;
  paymentMode: string;
  paymentMethod: string;
  paymentTerm: string;
  advancePayment: string;
  paymentRemarks: string;
  financer: string;
  downPayment: string;
  financeAmount: string;
  emiAmount: string;
  balanceAmount: string;
  tenure: string;
  emiInterestRate: string;
  deliveryTerm: string;
  deliveryType: string;
  deliverySlot: string;
  deliveryAddress: string;
  deliveryInstruction: string;
  shippingAddress: string;
  shippingTerm: string;
  shippingMethod: string;
  shippingInstructions: string;
  totalAmount: string;
  lines: SaleOrderLineDocument[];
}

export const saleOrderDocuments: SaleOrderDocument[] = [
  {
    id: 'so-1001',
    number: 'SO-2026-00011',
    orderDateTime: '2026-04-17T11:20:00',
    customerName: 'Galaxy Motors',
    orderSource: 'Dealer Portal',
    salesExecutive: 'Aarav Sharma',
    requestedDeliveryDate: '2026-04-26',
    validTillDate: '2026-04-30',
    placeOfSupply: 'Maharashtra',
    promisedDeliveryDate: '2026-04-25',
    priority: 'High',
    status: 'Draft',
    paymentMode: 'Credit',
    paymentMethod: 'Bank Transfer',
    paymentTerm: 'Net 30',
    advancePayment: '15000.00',
    paymentRemarks: 'Customer requested invoice-backed dispatch.',
    financer: 'Axis Finance',
    downPayment: '50000.00',
    financeAmount: '250000.00',
    emiAmount: '14250.00',
    balanceAmount: '185000.00',
    tenure: '24 Months',
    emiInterestRate: '8.50',
    deliveryTerm: 'Door Delivery',
    deliveryType: 'Standard',
    deliverySlot: 'Morning',
    deliveryAddress: 'Galaxy Motors, Pune',
    deliveryInstruction: 'Share dispatch call before arrival.',
    shippingAddress: 'Galaxy Motors, Pune',
    shippingTerm: 'FOB',
    shippingMethod: 'Road Transport',
    shippingInstructions: 'Handle painted panels with care.',
    totalAmount: '182450.00',
    lines: [
      {
        productCode: 'SP-1001',
        productName: 'Front Brake Assembly',
        hsnSac: '870830',
        uom: 'Unit',
        requestedDate: '2026-04-22',
        fulfillmentDate: '2026-04-24',
        priority: 'High',
        rate: '12500.00',
        orderQuantity: '8.00',
        baseAmount: '100000.00',
        discountPercent: '5.00',
        discountAmount: '5000.00',
        taxableAmount: '95000.00',
        taxationColumn: 'GST 18%',
        lineAmount: '112100.00',
        convertedQuantity: '2.00',
        pendingQuantity: '6.00',
        status: 'Partially Ordered',
        remark: 'Urgent for workshop campaign.',
      },
      {
        productCode: 'SP-1002',
        productName: 'Clutch Master Cylinder',
        hsnSac: '870893',
        uom: 'Unit',
        requestedDate: '2026-04-23',
        fulfillmentDate: '2026-04-25',
        priority: 'Medium',
        rate: '8800.00',
        orderQuantity: '6.00',
        baseAmount: '52800.00',
        discountPercent: '0.00',
        discountAmount: '0.00',
        taxableAmount: '52800.00',
        taxationColumn: 'GST 18%',
        lineAmount: '62304.00',
        convertedQuantity: '0.00',
        pendingQuantity: '6.00',
        status: 'Open',
        remark: 'Dispatch together with brake kit.',
      },
    ],
  },
  {
    id: 'so-1002',
    number: 'SO-2026-00012',
    orderDateTime: '2026-04-16T15:05:00',
    customerName: 'Velocity Auto Hub',
    orderSource: 'Field Sales',
    salesExecutive: 'Neha Kapoor',
    requestedDeliveryDate: '2026-04-28',
    validTillDate: '2026-05-02',
    placeOfSupply: 'Delhi',
    promisedDeliveryDate: '2026-04-29',
    priority: 'Medium',
    status: 'Pending Approval',
    paymentMode: 'Cash',
    paymentMethod: 'UPI',
    paymentTerm: 'Immediate',
    advancePayment: '5000.00',
    paymentRemarks: '',
    financer: '',
    downPayment: '0.00',
    financeAmount: '0.00',
    emiAmount: '0.00',
    balanceAmount: '0.00',
    tenure: '',
    emiInterestRate: '0.00',
    deliveryTerm: 'Pickup',
    deliveryType: 'Express',
    deliverySlot: 'Evening',
    deliveryAddress: 'Velocity Auto Hub, Delhi',
    deliveryInstruction: 'Customer will collect from branch.',
    shippingAddress: 'Velocity Auto Hub, Delhi',
    shippingTerm: 'Ex Works',
    shippingMethod: 'Pickup',
    shippingInstructions: '',
    totalAmount: '76464.00',
    lines: [
      {
        productCode: 'SP-1003',
        productName: 'Alternator Kit',
        hsnSac: '851150',
        uom: 'Set',
        requestedDate: '2026-04-25',
        fulfillmentDate: '2026-04-28',
        priority: 'Medium',
        rate: '21600.00',
        orderQuantity: '3.00',
        baseAmount: '64800.00',
        discountPercent: '0.00',
        discountAmount: '0.00',
        taxableAmount: '64800.00',
        taxationColumn: 'GST 18%',
        lineAmount: '76464.00',
        convertedQuantity: '0.00',
        pendingQuantity: '3.00',
        status: 'Open',
        remark: 'Retail counter requirement.',
      },
    ],
  },
  {
    id: 'so-1003',
    number: 'SO-2026-00013',
    orderDateTime: '2026-04-14T10:10:00',
    customerName: 'Prime Wheels',
    orderSource: 'Marketplace',
    salesExecutive: 'Rohit Mehta',
    requestedDeliveryDate: '2026-04-24',
    validTillDate: '2026-04-27',
    placeOfSupply: 'Karnataka',
    promisedDeliveryDate: '2026-04-23',
    priority: 'Low',
    status: 'Approved',
    paymentMode: 'Credit',
    paymentMethod: 'Cheque',
    paymentTerm: 'Net 15',
    advancePayment: '0.00',
    paymentRemarks: 'Corporate account credit terms applied.',
    financer: 'HDFC Finance',
    downPayment: '10000.00',
    financeAmount: '100000.00',
    emiAmount: '8950.00',
    balanceAmount: '90000.00',
    tenure: '12 Months',
    emiInterestRate: '7.90',
    deliveryTerm: 'Branch Delivery',
    deliveryType: 'Standard',
    deliverySlot: 'Afternoon',
    deliveryAddress: 'Prime Wheels, Bengaluru',
    deliveryInstruction: '',
    shippingAddress: 'Prime Wheels, Bengaluru',
    shippingTerm: 'CIF',
    shippingMethod: 'Courier',
    shippingInstructions: 'Use insured carrier.',
    totalAmount: '53100.00',
    lines: [
      {
        productCode: 'SP-1004',
        productName: 'Steering Rack Kit',
        hsnSac: '870894',
        uom: 'Unit',
        requestedDate: '2026-04-20',
        fulfillmentDate: '2026-04-22',
        priority: 'Low',
        rate: '15000.00',
        orderQuantity: '3.00',
        baseAmount: '45000.00',
        discountPercent: '0.00',
        discountAmount: '0.00',
        taxableAmount: '45000.00',
        taxationColumn: 'GST 18%',
        lineAmount: '53100.00',
        convertedQuantity: '3.00',
        pendingQuantity: '0.00',
        status: 'Fully Ordered',
        remark: 'Approved and allocated.',
      },
    ],
  },
];

export const extendedSaleOrderDocuments: SaleOrderDocument[] = Array.from({ length: 2 }, (_, cycle) =>
  saleOrderDocuments.map((document, index) => {
    const sequence = cycle * saleOrderDocuments.length + index + 1;
    const paddedSequence = String(sequence + 10).padStart(5, '0');

    return {
      ...document,
      id: `${document.id}-${sequence}`,
      number: `SO-2026-${paddedSequence}`,
    };
  })
).flat();

export function getSaleOrderById(id: string | null): SaleOrderDocument | undefined {
  if (!id) {
    return undefined;
  }

  return extendedSaleOrderDocuments.find((document) => document.id === id);
}
