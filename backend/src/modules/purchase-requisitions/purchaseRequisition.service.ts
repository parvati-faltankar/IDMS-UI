import type { ClientSession, FilterQuery } from 'mongoose';
import { Types } from 'mongoose';
import { generateDocumentNumber } from '../../services/documentNumber.service.js';
import { PurchaseRequisitionModel } from './purchaseRequisition.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/pagination.js';
import { roundToTwo } from '../../utils/round.js';

type RequisitionInput = Record<string, unknown>;
type GenericLineInput = Record<string, unknown>;

const allowedStatusTransitions: Record<string, string[]> = {
  Draft: ['Pending Approval', 'Cancelled'],
  'Pending Approval': ['Approved', 'Rejected', 'Cancelled'],
  Approved: ['Cancelled'],
  Rejected: [],
  Cancelled: [],
};

function deriveLineStatus(requestedQty: number, orderedQty: number, cancelledQty: number) {
  const pendingQty = roundToTwo(Math.max(requestedQty - orderedQty - cancelledQty, 0));

  if (requestedQty <= 0) {
    return 'Open' as const;
  }

  if (orderedQty === 0 && cancelledQty === 0) {
    return 'Open' as const;
  }

  if (orderedQty === requestedQty && cancelledQty === 0 && pendingQty === 0) {
    return 'Fully Ordered' as const;
  }

  if (orderedQty === 0 && cancelledQty === requestedQty && pendingQty === 0) {
    return 'Cancelled' as const;
  }

  if (orderedQty === 0 && cancelledQty > 0) {
    return 'Partially Cancelled' as const;
  }

  return 'Partially Ordered' as const;
}

function normalizeRequisitionPayload(payload: RequisitionInput) {
  const sourceLines = Array.isArray(payload.productLines) ? (payload.productLines as GenericLineInput[]) : [];
  const productLines = sourceLines.map((line, index: number) => {
    const requestedQty = roundToTwo(Number(line.requestedQty ?? 0));
    const orderedQty = roundToTwo(Number(line.orderedQty ?? 0));
    const cancelledQty = roundToTwo(Number(line.cancelledQty ?? 0));

    if (cancelledQty > requestedQty - orderedQty) {
      throw new ApiError(400, `Cancelled quantity cannot exceed remaining quantity for line ${index + 1}`);
    }

    const pendingQty = roundToTwo(Math.max(requestedQty - orderedQty - cancelledQty, 0));
    const status = deriveLineStatus(requestedQty, orderedQty, cancelledQty);

    if (cancelledQty > 0 && !line.cancellationReason) {
      throw new ApiError(400, `Cancellation reason is required for line ${index + 1}`);
    }

    return {
      _id: line.id && Types.ObjectId.isValid(line.id) ? new Types.ObjectId(line.id) : new Types.ObjectId(),
      lineNumber: index + 1,
      sourceProductId: line.sourceProductId && Types.ObjectId.isValid(line.sourceProductId)
        ? new Types.ObjectId(line.sourceProductId)
        : undefined,
      productCode: line.productCode,
      productName: line.productName,
      description: line.description ?? '',
      uom: line.uom,
      priority: line.priority ?? payload.priority,
      requirementDate: line.requirementDate ? new Date(line.requirementDate) : undefined,
      requestedQty,
      orderedQty,
      cancelledQty,
      pendingQty,
      status,
      cancellationReason: line.cancellationReason ?? '',
      remarks: line.remarks ?? '',
      attachments: [],
    };
  });

  const totalRequestedQty = roundToTwo(productLines.reduce((sum, line) => sum + line.requestedQty, 0));
  const totalOrderedQty = roundToTwo(productLines.reduce((sum, line) => sum + line.orderedQty, 0));
  const totalCancelledQty = roundToTwo(productLines.reduce((sum, line) => sum + line.cancelledQty, 0));

  let lifecycleStatus: string = 'Open';
  if (payload.status === 'Cancelled') {
    lifecycleStatus = 'Cancelled';
  } else if (productLines.length > 0 && productLines.every((line) => line.pendingQty === 0 && line.status === 'Fully Ordered')) {
    lifecycleStatus = 'Ordered';
  } else if (productLines.some((line) => line.orderedQty > 0)) {
    lifecycleStatus = 'Partially Ordered';
  } else if (productLines.some((line) => line.cancelledQty > 0)) {
    lifecycleStatus = 'Partially Cancelled';
  }

  return {
    number: payload.number,
    title: payload.title ?? '',
    requesterId: payload.requesterId && Types.ObjectId.isValid(payload.requesterId)
      ? new Types.ObjectId(payload.requesterId)
      : undefined,
    requesterName: payload.requesterName,
    requesterEmail: payload.requesterEmail ?? '',
    supplierId: payload.supplierId && Types.ObjectId.isValid(payload.supplierId)
      ? new Types.ObjectId(payload.supplierId)
      : undefined,
    supplierName: payload.supplierName,
    supplierContact: payload.supplierContact ?? '',
    department: payload.department,
    branch: payload.branch ?? '',
    legalEntity: payload.legalEntity ?? '',
    costCenter: payload.costCenter ?? '',
    deliveryLocation: payload.deliveryLocation ?? '',
    requirementDate: new Date(payload.requirementDate),
    validTillDate: new Date(payload.validTillDate),
    priority: payload.priority,
    status: payload.status ?? 'Draft',
    lifecycleStatus,
    currency: payload.currency ?? 'USD',
    lineCount: productLines.length,
    totalRequestedQty,
    totalOrderedQty,
    totalCancelledQty,
    spendCategory: payload.spendCategory ?? '',
    contractReference: payload.contractReference ?? '',
    budgetCode: payload.budgetCode ?? '',
    notes: payload.notes ?? '',
    productLines,
    attachments: [],
    audit: {
      createdBy: payload.actorName ?? payload.requesterName,
      createdByEmail: payload.actorEmail ?? payload.requesterEmail ?? '',
      updatedBy: payload.actorName ?? payload.requesterName,
      updatedByEmail: payload.actorEmail ?? payload.requesterEmail ?? '',
    },
    statusHistory: [
      {
        toStatus: payload.status ?? 'Draft',
        changedBy: payload.actorName ?? payload.requesterName,
        comment: 'Document created',
      },
    ],
  };
}

export async function listPurchaseRequisitions(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const sortBy = String(query.sortBy ?? 'createdAt');
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  const search = String(query.search ?? '').trim();

  const filter: FilterQuery<Record<string, unknown>> = { isDeleted: false };

  if (query.supplier) filter.supplierName = query.supplier;
  if (query.priority) filter.priority = query.priority;
  if (query.status) filter.status = query.status;
  if (query.lifecycleStatus) filter.lifecycleStatus = query.lifecycleStatus;
  if (query.branch) filter.branch = query.branch;
  if (query.department) filter.department = query.department;
  if (query.createdBy) filter['audit.createdBy'] = query.createdBy;

  if (query.requirementDateFrom || query.requirementDateTo) {
    filter.requirementDate = {};
    if (query.requirementDateFrom) filter.requirementDate.$gte = new Date(String(query.requirementDateFrom));
    if (query.requirementDateTo) filter.requirementDate.$lte = new Date(String(query.requirementDateTo));
  }

  if (query.validTillDateFrom || query.validTillDateTo) {
    filter.validTillDate = {};
    if (query.validTillDateFrom) filter.validTillDate.$gte = new Date(String(query.validTillDateFrom));
    if (query.validTillDateTo) filter.validTillDate.$lte = new Date(String(query.validTillDateTo));
  }

  if (search) {
    filter.$or = [
      { number: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
      { supplierName: { $regex: search, $options: 'i' } },
      { requesterName: { $regex: search, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    PurchaseRequisitionModel.find(filter).sort({ [sortBy]: sortOrder }).skip(skip).limit(limit),
    PurchaseRequisitionModel.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getPurchaseRequisitionById(id: string) {
  const document = await PurchaseRequisitionModel.findOne({ _id: id, isDeleted: false });
  if (!document) {
    throw new ApiError(404, 'Purchase requisition not found');
  }

  return document;
}

export async function createPurchaseRequisition(payload: RequisitionInput, session?: ClientSession) {
  const normalized = normalizeRequisitionPayload(payload);
  normalized.number = normalized.number || (await generateDocumentNumber('requisition', session));

  const document = await PurchaseRequisitionModel.create([normalized], session ? { session } : undefined);
  return document[0];
}

export async function updatePurchaseRequisition(id: string, payload: RequisitionInput) {
  const existing = await getPurchaseRequisitionById(id);
  const normalized = normalizeRequisitionPayload({
    ...existing.toJSON(),
    ...payload,
    productLines: payload.productLines ?? existing.productLines,
    actorName: payload.actorName ?? existing.audit?.updatedBy ?? existing.requesterName,
    actorEmail: payload.actorEmail ?? existing.audit?.updatedByEmail ?? existing.requesterEmail,
  });

  normalized.audit.createdBy = existing.audit?.createdBy ?? existing.requesterName;
  normalized.audit.createdByEmail = existing.audit?.createdByEmail ?? existing.requesterEmail;
  normalized.audit.updatedBy = payload.actorName ?? existing.audit?.updatedBy ?? existing.requesterName;
  normalized.audit.updatedByEmail = payload.actorEmail ?? existing.audit?.updatedByEmail ?? existing.requesterEmail;
  normalized.statusHistory = [
    ...(existing.statusHistory ?? []),
    {
      fromStatus: existing.status,
      toStatus: normalized.status,
      changedBy: normalized.audit.updatedBy,
      comment: 'Document updated',
    },
  ];

  await PurchaseRequisitionModel.updateOne({ _id: id }, normalized);
  return getPurchaseRequisitionById(id);
}

export async function deletePurchaseRequisition(id: string, actorName?: string) {
  const existing = await getPurchaseRequisitionById(id);
  existing.isDeleted = true;
  existing.audit.deletedBy = actorName ?? existing.audit.updatedBy ?? existing.requesterName;
  existing.audit.deletedAt = new Date();
  await existing.save();
}

export async function updatePurchaseRequisitionStatus(id: string, payload: RequisitionInput) {
  const document = await getPurchaseRequisitionById(id);
  const previousStatus = document.status;
  const nextStatus = payload.status;

  if (!allowedStatusTransitions[previousStatus]?.includes(nextStatus)) {
    throw new ApiError(409, `Invalid status transition from ${previousStatus} to ${nextStatus}`);
  }

  document.status = nextStatus;
  document.audit.updatedBy = payload.actorName ?? document.audit.updatedBy ?? document.requesterName;
  document.audit.updatedByEmail = payload.actorEmail ?? document.audit.updatedByEmail ?? document.requesterEmail;

  if (nextStatus === 'Approved') {
    document.audit.approvedBy = payload.actorName ?? document.requesterName;
    document.audit.approvedAt = new Date();
  }

  if (nextStatus === 'Cancelled') {
    document.lifecycleStatus = 'Cancelled';
  }

  document.statusHistory.push({
    fromStatus: previousStatus,
    toStatus: nextStatus,
    changedBy: payload.actorName ?? document.requesterName,
    comment: payload.comment ?? '',
  });

  await document.save();
  return document;
}
