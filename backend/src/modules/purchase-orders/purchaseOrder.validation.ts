import { z } from 'zod';
import { APPROVAL_STATUS_VALUES, PAYMENT_MODE_VALUES, PRIORITY_VALUES } from '../../constants/domain.js';

const lineSchema = z.object({
  id: z.string().optional(),
  lineNumber: z.number().int().positive().optional(),
  sourceRequisitionLineId: z.string().optional(),
  itemCode: z.string().trim().min(1),
  itemName: z.string().trim().min(1),
  description: z.string().trim().max(1000).optional().default(''),
  hsnSac: z.string().trim().max(50).optional().default(''),
  uom: z.string().trim().min(1),
  priority: z.enum(PRIORITY_VALUES).optional().default('Medium'),
  requirementDate: z.string().datetime().or(z.string().date()).optional(),
  purchaseRate: z.coerce.number().min(0).optional().default(0),
  availableQty: z.coerce.number().min(0).optional().default(0),
  requestedQty: z.coerce.number().min(0).optional().default(0),
  orderQty: z.coerce.number().positive(),
  cancelledQty: z.coerce.number().min(0).optional().default(0),
  receivedQty: z.coerce.number().min(0).optional().default(0),
  invoicedQty: z.coerce.number().min(0).optional().default(0),
  discountPercent: z.coerce.number().min(0).optional().default(0),
  discountAmount: z.coerce.number().min(0).optional().default(0),
  taxRate: z.coerce.number().min(0).optional().default(0),
  taxColumns: z.string().trim().max(100).optional().default(''),
  remarks: z.string().trim().max(500).optional().default(''),
});

export const purchaseOrderBodySchema = z.object({
  number: z.string().trim().optional(),
  sourceRequisitionId: z.string().optional(),
  requisitionNumber: z.string().trim().optional().default(''),
  requisitionDate: z.string().datetime().or(z.string().date()).optional(),
  supplierId: z.string().optional(),
  supplierName: z.string().trim().min(1),
  buyerId: z.string().optional(),
  buyerName: z.string().trim().min(1),
  buyerEmail: z.string().email().optional().or(z.literal('')).default(''),
  createdBy: z.string().trim().optional().default(''),
  branch: z.string().trim().optional().default(''),
  department: z.string().trim().min(1),
  priority: z.enum(PRIORITY_VALUES),
  status: z.enum(APPROVAL_STATUS_VALUES).optional().default('Draft'),
  orderDateTime: z.string().datetime().or(z.string().date()).optional(),
  expectedDeliveryDate: z.string().datetime().or(z.string().date()).optional(),
  paymentMode: z.enum(PAYMENT_MODE_VALUES).optional(),
  paymentTerms: z.string().trim().max(100).optional().default(''),
  validTillDate: z.string().datetime().or(z.string().date()).optional(),
  incoterm: z.string().trim().max(50).optional().default(''),
  placeOfSupply: z.string().trim().max(150).optional().default(''),
  notes: z.string().trim().max(2000).optional().default(''),
  currency: z.string().trim().max(10).optional().default('USD'),
  shipToLocation: z.string().trim().max(150).optional().default(''),
  shippingTerm: z.string().trim().max(100).optional().default(''),
  shippingMethod: z.string().trim().max(100).optional().default(''),
  shippingInstructions: z.string().trim().max(500).optional().default(''),
  insuranceProvider: z.string().trim().max(150).optional().default(''),
  insuranceContactPerson: z.string().trim().max(150).optional().default(''),
  insuranceType: z.string().trim().max(150).optional().default(''),
  insuranceNumber: z.string().trim().max(100).optional().default(''),
  insuranceAddress: z.string().trim().max(250).optional().default(''),
  actorName: z.string().trim().optional(),
  actorEmail: z.string().email().optional().or(z.literal('')),
  lines: z.array(lineSchema).min(1),
});

export const purchaseOrderUpdateSchema = purchaseOrderBodySchema.partial().extend({
  lines: z.array(lineSchema).min(1).optional(),
});

export const purchaseOrderListQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  sortBy: z
    .enum([
      'createdAt',
      'updatedAt',
      'number',
      'supplierName',
      'buyerName',
      'department',
      'priority',
      'status',
      'lifecycleStatus',
      'orderDateTime',
      'requisitionDate',
      'totalAmount',
      'createdOn',
    ])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  supplier: z.string().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
  lifecycleStatus: z.string().optional(),
  department: z.string().optional(),
  branch: z.string().optional(),
  createdBy: z.string().optional(),
  requisitionNumber: z.string().optional(),
  poDateFrom: z.string().optional(),
  poDateTo: z.string().optional(),
  prDateFrom: z.string().optional(),
  prDateTo: z.string().optional(),
});

export const documentIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const statusUpdateBodySchema = z.object({
  status: z.enum(APPROVAL_STATUS_VALUES),
  actorName: z.string().trim().optional(),
  actorEmail: z.string().email().optional().or(z.literal('')),
  comment: z.string().trim().max(1000).optional(),
});
