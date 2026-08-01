export type JobCardStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Cancelled';
export type JobCardPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type JobCardWorkshopStatus = 'Open' | 'In progress' | 'Waiting parts' | 'Ready' | 'Delivered' | 'Cancelled';

export interface JobCardLinePreview {
  productCode: string;
  productName: string;
  description: string;
  uom: string;
  priority: JobCardPriority;
  requirementDate: string;
  requestedQty: string;
  orderedQty: string;
  cancelledQty: string;
  pendingQty: string;
  status: 'Open' | 'Partially Cancelled' | 'Partially Ordered' | 'Fully Ordered' | 'Cancelled';
  cancellationReason: string;
  remarks: string;
}

export interface JobCardDocument {
  id: string;
  number: string;
  title: string;
  documentDateTime: string;
  supplierName: string;
  supplierContact: string;
  supplierGstin?: string;
  requesterName: string;
  requesterEmail: string;
  department: string;
  branch: string;
  legalEntity: string;
  costCenter: string;
  requirementDate: string;
  validTillDate: string;
  priority: JobCardPriority;
  status: JobCardStatus;
  currency: string;
  totalAmount?: string;
  lineCount: number;
  spendCategory: string;
  contractReference: string;
  budgetCode: string;
  notes: string;
  vehicleRegistration?: string;
  vehicleModel?: string;
  customerName?: string;
  jobType?: string;
  odometerReading?: number;
  serviceBay?: string;
  serviceAdvisor?: string;
  openedAt?: string;
  workshopStatus?: JobCardWorkshopStatus;
  productLines: JobCardLinePreview[];
}

export const jobCardDocuments: JobCardDocument[] = [
  {
    id: 'jc-1001',
    number: 'JC-2025-00847',
    title: 'Industrial Components & Hardware - Q1 2025',
    documentDateTime: '2025-02-06T10:15:00',
    supplierName: 'Techsupply Corp',
    supplierContact: 'john.smith@techsupply.com',
    supplierGstin: '27AAACT1111A1Z1',
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
    totalAmount: '5150.00',
    lineCount: 2,
    spendCategory: 'Direct Materials',
    contractReference: 'CONTR-2024-001',
    budgetCode: 'BUDGET-MFG-Q1',
    notes: 'Bulk procurement for planned manufacturing output ramp-up.',
    vehicleRegistration: 'MH 14 CD 5678',
    vehicleModel: 'Harrier XZ+',
    customerName: 'Rajesh Kumar',
    jobType: 'Running repair',
    odometerReading: 61240,
    serviceBay: 'Bay 3',
    serviceAdvisor: 'M. Pawar',
    openedAt: '2025-02-06T10:15:00',
    workshopStatus: 'In progress',
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
    id: 'jc-1002',
    number: 'JC-2025-00821',
    title: 'Hydraulic Seal Kits for Shutdown Window',
    documentDateTime: '2025-02-04T14:40:00',
    supplierName: 'Apex Industries',
    supplierContact: 'sales@apexindustries.com',
    supplierGstin: '27AAAAP2222A1Z2',
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
    totalAmount: '42800.00',
    lineCount: 12,
    spendCategory: 'Shutdown Maintenance',
    contractReference: 'CONTR-2024-114',
    budgetCode: 'BUDGET-OPS-SHUT',
    notes: 'Required before the planned shutdown maintenance begins.',
    vehicleRegistration: 'MH 12 KT 9081',
    vehicleModel: 'Nexon EV Max',
    customerName: 'Neha Sharma',
    jobType: 'Scheduled service',
    odometerReading: 24580,
    serviceBay: 'Bay 1',
    serviceAdvisor: 'S. Kulkarni',
    openedAt: '2025-02-04T14:40:00',
    workshopStatus: 'Waiting parts',
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
    id: 'jc-1003',
    number: 'JC-2025-00798',
    title: 'Fastener Restock for Plant Maintenance',
    documentDateTime: '2025-01-30T09:05:00',
    supplierName: 'Global Supplies Ltd',
    supplierContact: 'service@globalsupplies.com',
    supplierGstin: '27AAAAG3333A1Z3',
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
    totalAmount: '9600.00',
    lineCount: 8,
    spendCategory: 'Indirect Materials',
    contractReference: 'CONTR-2023-992',
    budgetCode: 'BUDGET-ENG-MRO',
    notes: 'Routine replenishment for ongoing plant maintenance activities.',
    vehicleRegistration: 'KA 05 MQ 7742',
    vehicleModel: 'Safari Adventure',
    customerName: 'Rohit Menon',
    jobType: 'Diagnosis',
    odometerReading: 88420,
    serviceBay: 'Bay 5',
    serviceAdvisor: 'A. Singh',
    openedAt: '2025-01-30T09:05:00',
    workshopStatus: 'Ready',
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
    id: 'jc-1004',
    number: 'JC-2025-00774',
    title: 'Safety Consumables and PPE Replenishment',
    documentDateTime: '2025-01-24T16:20:00',
    supplierName: 'SafeWorks Trading',
    supplierContact: 'support@safeworks.com',
    supplierGstin: '27AAACS4444A1Z4',
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
    totalAmount: '1250.00',
    lineCount: 5,
    spendCategory: 'Safety & Compliance',
    contractReference: 'CONTR-2024-217',
    budgetCode: 'BUDGET-EHS-Q1',
    notes: 'Restock request for safety consumables across the depot.',
    vehicleRegistration: 'GJ 01 RL 3099',
    vehicleModel: 'Punch Accomplished',
    customerName: 'Priya Nair',
    jobType: 'Body repair',
    odometerReading: 31200,
    serviceBay: 'Bay 2',
    serviceAdvisor: 'P. Mehta',
    openedAt: '2025-01-24T16:20:00',
    workshopStatus: 'Cancelled',
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
    id: 'jc-1005',
    number: 'JC-2025-00742',
    title: 'Conveyor Belt Spare Assemblies',
    documentDateTime: '2025-01-18T11:50:00',
    supplierName: 'MotionCore Systems',
    supplierContact: 'orders@motioncore.com',
    supplierGstin: '27AAACM5555A1Z5',
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
    totalAmount: '31200.00',
    lineCount: 21,
    spendCategory: 'Direct Materials',
    contractReference: 'CONTR-2024-145',
    budgetCode: 'BUDGET-MFG-SPARES',
    notes: 'Urgent replenishment to protect assembly line uptime.',
    vehicleRegistration: 'DL 8C AX 2210',
    vehicleModel: 'Altroz XZ+',
    customerName: 'Arjun Patel',
    jobType: 'Breakdown repair',
    odometerReading: 105860,
    serviceBay: 'Bay 4',
    serviceAdvisor: 'D. Rao',
    openedAt: '2025-01-18T11:50:00',
    workshopStatus: 'Open',
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

const generatedVehicleProfiles = [
  { registration: 'MH 14 CD 5678', model: 'Harrier XZ+', customer: 'Rajesh Kumar' },
  { registration: 'MH 12 KT 9081', model: 'Nexon EV Max', customer: 'Neha Sharma' },
  { registration: 'KA 05 MQ 7742', model: 'Safari Adventure', customer: 'Rohit Menon' },
  { registration: 'GJ 01 RL 3099', model: 'Punch Accomplished', customer: 'Priya Nair' },
  { registration: 'DL 8C AX 2210', model: 'Altroz XZ+', customer: 'Arjun Patel' },
  { registration: 'TN 09 BR 4451', model: 'Tiago NRG', customer: 'Karthik Raman' },
  { registration: 'RJ 14 PX 7788', model: 'Tigor XZ+', customer: 'Meera Bansal' },
  { registration: 'UP 16 CQ 9024', model: 'Nexon XZA+', customer: 'Amit Verma' },
];

const generatedJobTypes = ['Running repair', 'Scheduled service', 'Diagnosis', 'Body repair', 'Breakdown repair'];
const generatedServiceBays = ['Bay 1', 'Bay 2', 'Bay 3', 'Bay 4', 'Bay 5', 'Express Bay'];
const generatedServiceAdvisors = ['M. Pawar', 'S. Kulkarni', 'A. Singh', 'P. Mehta', 'D. Rao', 'R. Iyer'];
const generatedWorkshopStatuses: JobCardWorkshopStatus[] = ['Open', 'In progress', 'Waiting parts', 'Ready', 'Delivered', 'Cancelled'];
export const extendedJobCardDocuments: JobCardDocument[] = [
  ...jobCardDocuments,
  ...Array.from({ length: 100 }, (_, index) => {
    const template = jobCardDocuments[index % jobCardDocuments.length];
    const sequence = index + 1;
    const suffix = String(9000 + sequence).padStart(5, '0');
    const statusRotation: JobCardStatus[] = ['Draft', 'Pending Approval', 'Approved', 'Rejected', 'Cancelled'];
    const priorityRotation: JobCardPriority[] = ['Low', 'Medium', 'High', 'Critical'];
    const status = statusRotation[index % statusRotation.length];
    const priority = priorityRotation[index % priorityRotation.length];
    const vehicleProfile = generatedVehicleProfiles[index % generatedVehicleProfiles.length];

    return {
      ...template,
      id: `generated-jc-${sequence}`,
      number: `JC-2025-${suffix}`,
      title: `${template.title} Batch ${sequence}`,
      documentDateTime: shiftIsoDateTime(template.documentDateTime, sequence),
      requirementDate: shiftIsoDate(template.requirementDate, sequence),
      validTillDate: shiftIsoDate(template.validTillDate, Math.max(sequence - 3, 0)),
      status,
      priority,
      vehicleRegistration: vehicleProfile.registration,
      vehicleModel: vehicleProfile.model,
      customerName: vehicleProfile.customer,
      jobType: generatedJobTypes[index % generatedJobTypes.length],
      odometerReading: (template.odometerReading ?? 18000) + sequence * 175,
      serviceBay: generatedServiceBays[index % generatedServiceBays.length],
      serviceAdvisor: generatedServiceAdvisors[index % generatedServiceAdvisors.length],
      openedAt: shiftIsoDateTime(template.openedAt ?? template.documentDateTime, sequence),
      workshopStatus: status === 'Cancelled'
        ? 'Cancelled'
        : generatedWorkshopStatuses[index % (generatedWorkshopStatuses.length - 1)],
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

export function getJobCardById(id: string | null | undefined): JobCardDocument | null {
  if (!id) {
    return null;
  }

  return extendedJobCardDocuments.find((document) => document.id === id) ?? null;
}
