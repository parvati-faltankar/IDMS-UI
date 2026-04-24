import { Types, type FilterQuery } from 'mongoose';
import { generateDocumentNumber } from '../../services/documentNumber.service.js';
import { syncRequisitionFromOrders } from '../../services/procurementSync.service.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/pagination.js';
import { roundToTwo } from '../../utils/round.js';
import { withSession } from '../../utils/session.js';
import { PurchaseRequisitionModel } from '../purchase-requisitions/purchaseRequisition.model.js';
import { PurchaseOrderModel } from './purchaseOrder.model.js';

type PurchaseOrderInput = Record<string, unknown>;
type GenericOrderLineInput = Record<string, unknown>;

const allowedStatusTransitions: Record<string, string[]> = {
  Draft: ['Pending Approval', 'Cancelled'],
  'Pending Approval': ['Approved', 'Rejected', 'Cancelled'],
  Approved: ['Cancelled'],
  Rejected: [],
  Cancelled: [],
};

function normalizeOrderLines(lines: GenericOrderLineInput[]) {
  return lines.map((line, index) => {
    const orderQty = roundToTwo(Number(line.orderQty ?? 0));
    const cancelledQty = roundToTwo(Number(line.cancelledQty ?? 0));
    const receivedQty = roundToTwo(Number(line.receivedQty ?? 0));
    const invoicedQty = roundToTwo(Number(line.invoicedQty ?? 0));
    const purchaseRate = roundToTwo(Number(line.purchaseRate ?? 0));
    const requestedQty = roundToTwo(Number(line.requestedQty ?? 0));
    const discountPercent = roundToTwo(Number(line.discountPercent ?? 0));
    const suppliedDiscountAmount = roundToTwo(Number(line.discountAmount ?? 0));
    const taxableBase = roundToTwo(orderQty * purchaseRate);
    const derivedDiscountAmount = suppliedDiscountAmount > 0
      ? suppliedDiscountAmount
      : roundToTwo((taxableBase * discountPercent) / 100);
    const taxableAmount = roundToTwo(Math.max(taxableBase - derivedDiscountAmount, 0));
    const taxRate = roundToTwo(Number(line.taxRate ?? 0));
    const totalAmount = roundToTwo(taxableAmount + (taxableAmount * taxRate) / 100);
    const pendingReceiptQty = roundToTwo(Math.max(orderQty - receivedQty - cancelledQty, 0));
    const pendingInvoiceQty = roundToTwo(Math.max(receivedQty - invoicedQty, 0));

    return {
      _id: line.id && Types.ObjectId.isValid(line.id) ? new Types.ObjectId(line.id) : new Types.ObjectId(),
      lineNumber: index + 1,
      sourceRequisitionLineId: line.sourceRequisitionLineId && Types.ObjectId.isValid(line.sourceRequisitionLineId)
        ? new Types.ObjectId(line.sourceRequisitionLineId)
        : undefined,
      itemCode: line.itemCode,
      itemName: line.itemName,
      description: line.description ?? '',
      hsnSac: line.hsnSac ?? '',
      uom: line.uom,
      priority: line.priority,
      requirementDate: line.requirementDate ? new Date(line.requirementDate) : undefined,
      purchaseRate,
      availableQty: roundToTwo(Number(line.availableQty ?? 0)),
      requestedQty,
      orderQty,
      cancelledQty,
      receivedQty,
      pendingReceiptQty,
      invoicedQty,
      pendingInvoiceQty,
      discountPercent,
      discountAmount: derivedDiscountAmount,
      taxableAmount,
      taxRate,
      taxColumns: line.taxColumns ?? '',
      totalAmount,
      status: pendingReceiptQty === 0 && orderQty > 0 ? 'Received' : receivedQty > 0 ? 'Partially Received' : 'Open',
      remarks: line.remarks ?? '',
      attachments: [],
    };
  });
}

async function validateAgainstSourceRequisition(
  sourceRequisitionId: string | undefined,
  lines: Array<Record<string, unknown>>,
  currentOrderId?: string
) {
  if (!sourceRequisitionId) {
    return;
  }

  const requisition = await PurchaseRequisitionModel.findOne({ _id: sourceRequisitionId, isDeleted: false });
  if (!requisition) {
    throw new ApiError(404, 'Source purchase requisition not found');
  }

  for (const line of lines) {
    if (!line.sourceRequisitionLineId) {
      continue;
    }

    const requisitionLine = requisition.productLines.id(line.sourceRequisitionLineId);
    if (!requisitionLine) {
      throw new ApiError(400, `Source requisition line not found for item ${line.itemCode}`);
    }

    const relatedOrders = await PurchaseOrderModel.find({
      sourceRequisitionId,
      isDeleted: false,
      status: { $nin: ['Rejected', 'Cancelled'] },
      ...(currentOrderId ? { _id: { $ne: currentOrderId } } : {}),
    }).select('lines');

    const alreadyOrdered = relatedOrders.reduce((sum, order) => {
      const matching = order.lines.find((orderLine) => orderLine.sourceRequisitionLineId?.toString() === line.sourceRequisitionLineId.toString());
      return sum + (matching?.orderQty ?? 0);
    }, 0);

    const remainingQty = requisitionLine.requestedQty - requisitionLine.cancelledQty - alreadyOrdered;
    if (line.orderQty > remainingQty) {
      throw new ApiError(
        409,
        `Ordered quantity for item ${line.itemCode} exceeds requisition remaining quantity (${remainingQty})`
      );
    }
  }
}

function buildOrderDocument(payload: PurchaseOrderInput) {
  const lines = normalizeOrderLines(payload.lines ?? []);
  const taxableAmount = roundToTwo(lines.reduce((sum, line) => sum + line.taxableAmount, 0));
  const totalDiscount = roundToTwo(lines.reduce((sum, line) => sum + line.discountAmount, 0));
  const totalAmount = roundToTwo(lines.reduce((sum, line) => sum + line.totalAmount, 0));
  const totalTaxes = roundToTwo(totalAmount - taxableAmount);

  return {
    number: payload.number,
    sourceRequisitionId: payload.sourceRequisitionId && Types.ObjectId.isValid(payload.sourceRequisitionId)
      ? new Types.ObjectId(payload.sourceRequisitionId)
      : undefined,
    requisitionNumber: payload.requisitionNumber ?? '',
    requisitionDate: payload.requisitionDate ? new Date(payload.requisitionDate) : undefined,
    supplierId: payload.supplierId && Types.ObjectId.isValid(payload.supplierId)
      ? new Types.ObjectId(payload.supplierId)
      : undefined,
    supplierName: payload.supplierName,
    buyerId: payload.buyerId && Types.ObjectId.isValid(payload.buyerId)
      ? new Types.ObjectId(payload.buyerId)
      : undefined,
    buyerName: payload.buyerName,
    buyerEmail: payload.buyerEmail ?? '',
    createdBy: payload.createdBy ?? payload.actorName ?? payload.buyerName,
    createdOn: payload.createdOn ? new Date(payload.createdOn) : new Date(),
    branch: payload.branch ?? '',
    department: payload.department,
    priority: payload.priority,
    status: payload.status ?? 'Draft',
    lifecycleStatus: lines.some((line) => line.receivedQty > 0) ? 'Partially Received' : 'Open',
    orderDateTime: payload.orderDateTime ? new Date(payload.orderDateTime) : new Date(),
    expectedDeliveryDate: payload.expectedDeliveryDate ? new Date(payload.expectedDeliveryDate) : undefined,
    paymentMode: payload.paymentMode,
    paymentTerms: payload.paymentTerms ?? '',
    validTillDate: payload.validTillDate ? new Date(payload.validTillDate) : undefined,
    incoterm: payload.incoterm ?? '',
    placeOfSupply: payload.placeOfSupply ?? '',
    notes: payload.notes ?? '',
    taxableAmount,
    totalDiscount,
    totalTaxes,
    totalAmount,
    currency: payload.currency ?? 'USD',
    shippingDetails: {
      shipToLocation: payload.shipToLocation ?? '',
      shippingTerm: payload.shippingTerm ?? '',
      shippingMethod: payload.shippingMethod ?? '',
      shippingInstructions: payload.shippingInstructions ?? '',
    },
    insuranceDetails: {
      insuranceProvider: payload.insuranceProvider ?? '',
      insuranceContactPerson: payload.insuranceContactPerson ?? '',
      insuranceType: payload.insuranceType ?? '',
      insuranceNumber: payload.insuranceNumber ?? '',
      insuranceAddress: payload.insuranceAddress ?? '',
    },
    lines,
    audit: {
      createdBy: payload.actorName ?? payload.createdBy ?? payload.buyerName,
      createdByEmail: payload.actorEmail ?? payload.buyerEmail ?? '',
      updatedBy: payload.actorName ?? payload.createdBy ?? payload.buyerName,
      updatedByEmail: payload.actorEmail ?? payload.buyerEmail ?? '',
    },
    statusHistory: [
      {
        toStatus: payload.status ?? 'Draft',
        changedBy: payload.actorName ?? payload.createdBy ?? payload.buyerName,
        comment: 'Document created',
      },
    ],
  };
}

export async function listPurchaseOrders(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const sortBy = String(query.sortBy ?? 'createdAt');
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  const search = String(query.search ?? '').trim();
  const filter: FilterQuery<Record<string, unknown>> = { isDeleted: false };

  if (query.supplier) filter.supplierName = query.supplier;
  if (query.department) filter.department = query.department;
  if (query.branch) filter.branch = query.branch;
  if (query.createdBy) filter.createdBy = query.createdBy;
  if (query.requisitionNumber) filter.requisitionNumber = query.requisitionNumber;
  if (query.status) filter.status = query.status;
  if (query.lifecycleStatus) filter.lifecycleStatus = query.lifecycleStatus;
  if (query.priority && query.priority !== 'Urgent') filter.priority = query.priority;
  if (query.priority === 'Urgent') filter.priority = 'Critical';

  if (query.poDateFrom || query.poDateTo) {
    filter.orderDateTime = {};
    if (query.poDateFrom) filter.orderDateTime.$gte = new Date(String(query.poDateFrom));
    if (query.poDateTo) filter.orderDateTime.$lte = new Date(String(query.poDateTo));
  }

  if (query.prDateFrom || query.prDateTo) {
    filter.requisitionDate = {};
    if (query.prDateFrom) filter.requisitionDate.$gte = new Date(String(query.prDateFrom));
    if (query.prDateTo) filter.requisitionDate.$lte = new Date(String(query.prDateTo));
  }

  if (search) {
    filter.$or = [
      { number: { $regex: search, $options: 'i' } },
      { requisitionNumber: { $regex: search, $options: 'i' } },
      { supplierName: { $regex: search, $options: 'i' } },
      { buyerName: { $regex: search, $options: 'i' } },
      { createdBy: { $regex: search, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    PurchaseOrderModel.find(filter).sort({ [sortBy]: sortOrder }).skip(skip).limit(limit),
    PurchaseOrderModel.countDocuments(filter),
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

export async function getPurchaseOrderById(id: string) {
  const document = await PurchaseOrderModel.findOne({ _id: id, isDeleted: false });
  if (!document) {
    throw new ApiError(404, 'Purchase order not found');
  }

  return document;
}

export async function createPurchaseOrder(payload: PurchaseOrderInput) {
  return withSession(async (session) => {
    const normalized = buildOrderDocument(payload);
    normalized.number = normalized.number || (await generateDocumentNumber('order', session));

    await validateAgainstSourceRequisition(payload.sourceRequisitionId, normalized.lines);

    const created = await PurchaseOrderModel.create([normalized], { session });
    if (normalized.sourceRequisitionId) {
      await syncRequisitionFromOrders(normalized.sourceRequisitionId, session);
    }

    return created[0];
  });
}

export async function updatePurchaseOrder(id: string, payload: PurchaseOrderInput) {
  const existing = await getPurchaseOrderById(id);

  return withSession(async (session) => {
    const normalized = buildOrderDocument({
      ...existing.toJSON(),
      ...payload,
      lines: payload.lines ?? existing.lines,
    });

    await validateAgainstSourceRequisition(
      String(normalized.sourceRequisitionId ?? ''),
      normalized.lines,
      id
    );

    normalized.audit.createdBy = existing.audit?.createdBy ?? existing.buyerName;
    normalized.audit.createdByEmail = existing.audit?.createdByEmail ?? existing.buyerEmail;
    normalized.audit.updatedBy = payload.actorName ?? existing.audit.updatedBy ?? existing.buyerName;
    normalized.audit.updatedByEmail = payload.actorEmail ?? existing.audit.updatedByEmail ?? existing.buyerEmail;
    normalized.statusHistory = [
      ...(existing.statusHistory ?? []),
      {
        fromStatus: existing.status,
        toStatus: normalized.status,
        changedBy: normalized.audit.updatedBy,
        comment: 'Document updated',
      },
    ];

    await PurchaseOrderModel.updateOne({ _id: id }, normalized, { session });

    if (existing.sourceRequisitionId) {
      await syncRequisitionFromOrders(existing.sourceRequisitionId, session);
    }

    if (normalized.sourceRequisitionId) {
      await syncRequisitionFromOrders(normalized.sourceRequisitionId, session);
    }

    return getPurchaseOrderById(id);
  });
}

export async function deletePurchaseOrder(id: string, actorName?: string) {
  const existing = await getPurchaseOrderById(id);

  await withSession(async (session) => {
    existing.isDeleted = true;
    existing.audit.deletedBy = actorName ?? existing.audit.updatedBy ?? existing.buyerName;
    existing.audit.deletedAt = new Date();
    await existing.save({ session });

    if (existing.sourceRequisitionId) {
      await syncRequisitionFromOrders(existing.sourceRequisitionId, session);
    }
  });
}

export async function updatePurchaseOrderStatus(id: string, payload: PurchaseOrderInput) {
  const document = await getPurchaseOrderById(id);
  const previousStatus = document.status;
  const nextStatus = payload.status;

  if (!allowedStatusTransitions[previousStatus]?.includes(nextStatus)) {
    throw new ApiError(409, `Invalid status transition from ${previousStatus} to ${nextStatus}`);
  }

  document.status = nextStatus;
  document.audit.updatedBy = payload.actorName ?? document.audit.updatedBy ?? document.buyerName;
  document.audit.updatedByEmail = payload.actorEmail ?? document.audit.updatedByEmail ?? document.buyerEmail;
  document.statusHistory.push({
    fromStatus: previousStatus,
    toStatus: nextStatus,
    changedBy: payload.actorName ?? document.buyerName,
    comment: payload.comment ?? '',
  });

  if (nextStatus === 'Cancelled') {
    document.lifecycleStatus = 'Cancelled';
  }

  await document.save();

  if (document.sourceRequisitionId) {
    await syncRequisitionFromOrders(document.sourceRequisitionId);
  }

  return document;
}
