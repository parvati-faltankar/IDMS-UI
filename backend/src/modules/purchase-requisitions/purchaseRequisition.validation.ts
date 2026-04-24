import { z } from 'zod';
import { APPROVAL_STATUS_VALUES, PRIORITY_VALUES } from '../../constants/domain.js';

const lineSchema = z.object({
  id: z.string().optional(),
  lineNumber: z.number().int().positive().optional(),
  sourceProductId: z.string().optional(),
  productCode: z.string().trim().min(1),
  productName: z.string().trim().min(1),
  description: z.string().trim().max(1000).optional().default(''),
  uom: z.string().trim().min(1),
  priority: z.enum(PRIORITY_VALUES).optional().default('Medium'),
  requirementDate: z.string().datetime().or(z.string().date()).optional(),
  requestedQty: z.coerce.number().positive(),
  orderedQty: z.coerce.number().min(0).optional().default(0),
  cancelledQty: z.coerce.number().min(0).optional().default(0),
  cancellationReason: z.string().trim().max(250).optional().default(''),
  remarks: z.string().trim().max(500).optional().default(''),
});

export const purchaseRequisitionBodySchema = z.object({
  number: z.string().trim().min(1).optional(),
  title: z.string().trim().max(250).optional().default(''),
  requesterId: z.string().optional(),
  requesterName: z.string().trim().min(1),
  requesterEmail: z.string().email().optional().or(z.literal('')).default(''),
  supplierId: z.string().optional(),
  supplierName: z.string().trim().min(1),
  supplierContact: z.string().trim().max(150).optional().default(''),
  department: z.string().trim().min(1),
  branch: z.string().trim().max(120).optional().default(''),
  legalEntity: z.string().trim().max(150).optional().default(''),
  costCenter: z.string().trim().max(100).optional().default(''),
  deliveryLocation: z.string().trim().max(200).optional().default(''),
  requirementDate: z.string().datetime().or(z.string().date()),
  validTillDate: z.string().datetime().or(z.string().date()),
  priority: z.enum(PRIORITY_VALUES),
  status: z.enum(APPROVAL_STATUS_VALUES).optional().default('Draft'),
  currency: z.string().trim().max(10).optional().default('USD'),
  spendCategory: z.string().trim().max(150).optional().default(''),
  contractReference: z.string().trim().max(100).optional().default(''),
  budgetCode: z.string().trim().max(100).optional().default(''),
  notes: z.string().trim().max(2000).optional().default(''),
  productLines: z.array(lineSchema).min(1),
  actorName: z.string().trim().optional(),
  actorEmail: z.string().email().optional().or(z.literal('')),
});

export const purchaseRequisitionUpdateSchema = purchaseRequisitionBodySchema.partial().extend({
  productLines: z.array(lineSchema).min(1).optional(),
});

export const purchaseRequisitionListQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  sortBy: z
    .enum([
      'createdAt',
      'updatedAt',
      'number',
      'supplierName',
      'requesterName',
      'priority',
      'status',
      'lifecycleStatus',
      'requirementDate',
      'validTillDate',
    ])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  supplier: z.string().optional(),
  priority: z.enum(PRIORITY_VALUES).optional(),
  status: z.enum(APPROVAL_STATUS_VALUES).optional(),
  lifecycleStatus: z.enum(['Open', 'Partially Ordered', 'Ordered', 'Partially Cancelled', 'Cancelled', 'Closed']).optional(),
  branch: z.string().optional(),
  department: z.string().optional(),
  requirementDateFrom: z.string().optional(),
  requirementDateTo: z.string().optional(),
  validTillDateFrom: z.string().optional(),
  validTillDateTo: z.string().optional(),
  createdBy: z.string().optional(),
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
