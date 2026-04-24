export type RequisitionStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Cancelled';
export type RequisitionPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface PurchaseRequisitionLinePreview {
  productCode: string;
  productName: string;
  description: string;
  uom: string;
  priority: RequisitionPriority;
  requirementDate: string;
  requestedQty: string;
  orderedQty: string;
  cancelledQty: string;
  pendingQty: string;
  status: 'Open' | 'Partially Cancelled' | 'Partially Ordered' | 'Fully Ordered' | 'Cancelled';
  cancellationReason: string;
  remarks: string;
}

export interface PurchaseRequisitionDocument {
  id: string;
  number: string;
  title: string;
  documentDateTime: string;
  supplierName: string;
  supplierContact: string;
  requesterName: string;
  requesterEmail: string;
  department: string;
  branch: string;
  legalEntity: string;
  costCenter: string;
  requirementDate: string;
  validTillDate: string;
  priority: RequisitionPriority;
  status: RequisitionStatus;
  currency: string;
  lineCount: number;
  spendCategory: string;
  contractReference: string;
  budgetCode: string;
  notes: string;
  productLines: PurchaseRequisitionLinePreview[];
}

export const purchaseRequisitionDocuments: PurchaseRequisitionDocument[] = [
  {
    id: 'pr-1001',
    number: 'PR-2025-00847',
    title: 'Industrial Components & Hardware - Q1 2025',
    documentDateTime: '2025-02-06T10:15:00',
    supplierName: 'Techsupply Corp',
    supplierContact: 'john.smith@techsupply.com',
    requesterName: 'Alex Kumar',
    requesterEmail: 'alex.kumar@excellonsoft.com',
    department: 'Manufacturing',
    branch: 'Head Office',
    legalEntity: 'Global Operations Inc.',
    costCenter: 'CC-2025-001',
    requirementDate: '2025-03-15',
    validTillDate: '2025-03-31',
    priority: 'High',
    status: 'Draft',
    currency: 'USD',
    lineCount: 2,
    spendCategory: 'Direct Materials',
    contractReference: 'CONTR-2024-001',
    budgetCode: 'BUDGET-MFG-Q1',
    notes: 'Bulk procurement for planned manufacturing output ramp-up.',
    productLines: [
      {
        productCode: 'P-1001',
        productName: 'Industrial Bearing Assembly',
        description: 'Precision grade bearing assembly for conveyor equipment',
        uom: 'Unit',
        priority: 'High',
        requirementDate: '2025-03-15',
        requestedQty: '150.00',
        orderedQty: '0.00',
        cancelledQty: '0.00',
        pendingQty: '150.00',
        status: 'Open',
        cancellationReason: '',
        remarks: 'Premium quality, OEM certified',
      },
      {
        productCode: 'P-1002',
        productName: 'Stainless Steel Fasteners Kit',
        description: 'Fasteners kit covering M10 to M20 sizes',
        uom: 'Box',
        priority: 'Medium',
        requirementDate: '2025-03-10',
        requestedQty: '5000.00',
        orderedQty: '0.00',
        cancelledQty: '250.00',
        pendingQty: '4750.00',
        status: 'Partially Cancelled',
        cancellationReason: 'Demand Reduced',
        remarks: 'ISO 16130:2 certified',
      },
    ],
  },
  {
    id: 'pr-1002',
    number: 'PR-2025-00821',
    title: 'Hydraulic Seal Kits for Shutdown Window',
    documentDateTime: '2025-02-04T14:40:00',
    supplierName: 'Apex Industries',
    supplierContact: 'sales@apexindustries.com',
    requesterName: 'Neha Sharma',
    requesterEmail: 'neha.sharma@excellonsoft.com',
    department: 'Operations',
    branch: 'North Hub',
    legalEntity: 'North Industrial Services',
    costCenter: 'CC-OPS-118',
    requirementDate: '2025-03-10',
    validTillDate: '2025-03-24',
    priority: 'Critical',
    status: 'Pending Approval',
    currency: 'USD',
    lineCount: 12,
    spendCategory: 'Shutdown Maintenance',
    contractReference: 'CONTR-2024-114',
    budgetCode: 'BUDGET-OPS-SHUT',
    notes: 'Required before the planned shutdown maintenance begins.',
    productLines: [
      {
        productCode: 'P-1003',
        productName: 'Hydraulic Seal Pack',
        description: 'High-pressure seal pack for maintenance shutdowns',
        uom: 'Pack',
        priority: 'Critical',
        requirementDate: '2025-03-10',
        requestedQty: '36.00',
        orderedQty: '12.00',
        cancelledQty: '0.00',
        pendingQty: '24.00',
        status: 'Partially Ordered',
        cancellationReason: '',
        remarks: 'For shutdown maintenance window',
      },
      {
        productCode: 'P-1002',
        productName: 'Stainless Steel Fasteners Kit',
        description: 'Fasteners kit covering M10 to M20 sizes',
        uom: 'Box',
        priority: 'High',
        requirementDate: '2025-03-10',
        requestedQty: '18.00',
        orderedQty: '0.00',
        cancelledQty: '0.00',
        pendingQty: '18.00',
        status: 'Open',
        cancellationReason: '',
        remarks: 'Backup kit for shutdown scope',
      },
    ],
  },
  {
    id: 'pr-1003',
    number: 'PR-2025-00798',
    title: 'Fastener Restock for Plant Maintenance',
    documentDateTime: '2025-01-30T09:05:00',
    supplierName: 'Global Supplies Ltd',
    supplierContact: 'service@globalsupplies.com',
    requesterName: 'Rohit Menon',
    requesterEmail: 'rohit.menon@excellonsoft.com',
    department: 'Engineering',
    branch: 'South Hub',
    legalEntity: 'South Engineering Services',
    costCenter: 'CC-ENG-032',
    requirementDate: '2025-02-28',
    validTillDate: '2025-03-08',
    priority: 'Medium',
    status: 'Approved',
    currency: 'USD',
    lineCount: 8,
    spendCategory: 'Indirect Materials',
    contractReference: 'CONTR-2023-992',
    budgetCode: 'BUDGET-ENG-MRO',
    notes: 'Routine replenishment for ongoing plant maintenance activities.',
    productLines: [
      {
        productCode: 'P-1002',
        productName: 'Stainless Steel Fasteners Kit',
        description: 'Fasteners kit covering M10 to M20 sizes',
        uom: 'Box',
        priority: 'Medium',
        requirementDate: '2025-02-28',
        requestedQty: '40.00',
        orderedQty: '40.00',
        cancelledQty: '0.00',
        pendingQty: '0.00',
        status: 'Fully Ordered',
        cancellationReason: '',
        remarks: 'Approved for planned maintenance cycle',
      },
    ],
  },
  {
    id: 'pr-1004',
    number: 'PR-2025-00774',
    title: 'Safety Consumables and PPE Replenishment',
    documentDateTime: '2025-01-24T16:20:00',
    supplierName: 'SafeWorks Trading',
    supplierContact: 'support@safeworks.com',
    requesterName: 'Priya Nair',
    requesterEmail: 'priya.nair@excellonsoft.com',
    department: 'Operations',
    branch: 'East Depot',
    legalEntity: 'East Warehouse Operations',
    costCenter: 'CC-EHS-204',
    requirementDate: '2025-02-21',
    validTillDate: '2025-02-27',
    priority: 'Low',
    status: 'Rejected',
    currency: 'USD',
    lineCount: 5,
    spendCategory: 'Safety & Compliance',
    contractReference: 'CONTR-2024-217',
    budgetCode: 'BUDGET-EHS-Q1',
    notes: 'Restock request for safety consumables across the depot.',
    productLines: [
      {
        productCode: 'P-1002',
        productName: 'Stainless Steel Fasteners Kit',
        description: 'Fasteners kit covering M10 to M20 sizes',
        uom: 'Unit',
        priority: 'Low',
        requirementDate: '2025-02-21',
        requestedQty: '10.00',
        orderedQty: '0.00',
        cancelledQty: '10.00',
        pendingQty: '0.00',
        status: 'Cancelled',
        cancellationReason: 'Requirement Withdrawn',
        remarks: 'Replaced by alternate sourcing plan',
      },
    ],
  },
  {
    id: 'pr-1005',
    number: 'PR-2025-00742',
    title: 'Conveyor Belt Spare Assemblies',
    documentDateTime: '2025-01-18T11:50:00',
    supplierName: 'MotionCore Systems',
    supplierContact: 'orders@motioncore.com',
    requesterName: 'Arjun Patel',
    requesterEmail: 'arjun.patel@excellonsoft.com',
    department: 'Manufacturing',
    branch: 'Head Office',
    legalEntity: 'Global Operations Inc.',
    costCenter: 'CC-MFG-402',
    requirementDate: '2025-02-18',
    validTillDate: '2025-02-26',
    priority: 'High',
    status: 'Pending Approval',
    currency: 'USD',
    lineCount: 21,
    spendCategory: 'Direct Materials',
    contractReference: 'CONTR-2024-145',
    budgetCode: 'BUDGET-MFG-SPARES',
    notes: 'Urgent replenishment to protect assembly line uptime.',
    productLines: [
      {
        productCode: 'P-1001',
        productName: 'Industrial Bearing Assembly',
        description: 'Precision grade bearing assembly for conveyor equipment',
        uom: 'Set',
        priority: 'High',
        requirementDate: '2025-02-18',
        requestedQty: '24.00',
        orderedQty: '8.00',
        cancelledQty: '0.00',
        pendingQty: '16.00',
        status: 'Partially Ordered',
        cancellationReason: '',
        remarks: 'Critical spare for main line conveyor',
      },
      {
        productCode: 'P-1003',
        productName: 'Hydraulic Seal Pack',
        description: 'High-pressure seal pack for maintenance shutdowns',
        uom: 'Unit',
        priority: 'High',
        requirementDate: '2025-02-18',
        requestedQty: '12.00',
        orderedQty: '0.00',
        cancelledQty: '0.00',
        pendingQty: '12.00',
        status: 'Open',
        cancellationReason: '',
        remarks: 'Needed to support spare assembly installation',
      },
    ],
  },
];

function shiftIsoDateTime(source: string, offsetDays: number): string {
  const date = new Date(source);
  date.setDate(date.getDate() - offsetDays);
  return date.toISOString().slice(0, 19);
}

function shiftIsoDate(source: string, offsetDays: number): string {
  const date = new Date(source);
  date.setDate(date.getDate() - offsetDays);
  return date.toISOString().slice(0, 10);
}

export const extendedPurchaseRequisitionDocuments: PurchaseRequisitionDocument[] = [
  ...purchaseRequisitionDocuments,
  ...Array.from({ length: 100 }, (_, index) => {
    const template = purchaseRequisitionDocuments[index % purchaseRequisitionDocuments.length];
    const sequence = index + 1;
    const suffix = String(9000 + sequence).padStart(5, '0');
    const statusRotation: RequisitionStatus[] = ['Draft', 'Pending Approval', 'Approved', 'Rejected', 'Cancelled'];
    const priorityRotation: RequisitionPriority[] = ['Low', 'Medium', 'High', 'Critical'];
    const status = statusRotation[index % statusRotation.length];
    const priority = priorityRotation[index % priorityRotation.length];

    return {
      ...template,
      id: `generated-pr-${sequence}`,
      number: `PR-2025-${suffix}`,
      title: `${template.title} Batch ${sequence}`,
      documentDateTime: shiftIsoDateTime(template.documentDateTime, sequence),
      requirementDate: shiftIsoDate(template.requirementDate, sequence),
      validTillDate: shiftIsoDate(template.validTillDate, Math.max(sequence - 3, 0)),
      status,
      priority,
      notes: `${template.notes} Auto-generated catalogue record ${sequence}.`,
      productLines: template.productLines.map((line, lineIndex) => ({
        ...line,
        priority,
        requirementDate: shiftIsoDate(line.requirementDate, sequence + lineIndex),
      })),
      lineCount: template.productLines.length,
    };
  }),
];

export function getPurchaseRequisitionById(id: string | null | undefined): PurchaseRequisitionDocument | null {
  if (!id) {
    return null;
  }

  return extendedPurchaseRequisitionDocuments.find((document) => document.id === id) ?? null;
}
