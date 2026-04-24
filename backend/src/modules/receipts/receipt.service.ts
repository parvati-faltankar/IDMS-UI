import { Types, type FilterQuery } from 'mongoose';
import { generateDocumentNumber } from '../../services/documentNumber.service.js';
import { syncOrderFromReceipts } from '../../services/procurementSync.service.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/pagination.js';
import { roundToTwo } from '../../utils/round.js';
import { withSession } from '../../utils/session.js';
import { PurchaseOrderModel } from '../purchase-orders/purchaseOrder.model.js';
import { ReceiptModel } from './receipt.model.js';

type ReceiptInput = Record<string, unknown>;
type GenericReceiptLineInput = Record<string, unknown>;

const allowedStatusTransitions: Record<string, string[]> = {
  Draft: ['Pending Approval', 'Cancelled'],
  'Pending Approval': ['Approved', 'Rejected', 'Cancelled'],
  Approved: ['Cancelled'],
  Rejected: [],
  Cancelled: [],
};

function normalizeReceiptLines(lines: GenericReceiptLineInput[]) {
  return lines.map((line, index) => {
    const purchaseRate = roundToTwo(Number(line.purchaseRate ?? 0));
    const supplierInvoiceQty = roundToTwo(Number(line.supplierInvoiceQty ?? 0));
    const receivedQty = roundToTwo(Number(line.receivedQty ?? 0));
    const discountPercent = roundToTwo(Number(line.discountPercent ?? 0));
    const providedDiscountAmount = roundToTwo(Number(line.discountAmount ?? 0));
    const taxableBase = roundToTwo(receivedQty * purchaseRate);
    const discountAmount = providedDiscountAmount > 0
      ? providedDiscountAmount
      : roundToTwo((taxableBase * discountPercent) / 100);
    const taxableAmount = roundToTwo(Math.max(taxableBase - discountAmount, 0));
    const taxRate = roundToTwo(Number(line.taxRate ?? 0));
    const totalAmount = roundToTwo(taxableAmount + (taxableAmount * taxRate) / 100);
    const shortageQty = roundToTwo(Math.max(supplierInvoiceQty - receivedQty, 0));
    const excessQty = roundToTwo(Math.max(receivedQty - supplierInvoiceQty, 0));

    return {
      _id: line.id && Types.ObjectId.isValid(line.id) ? new Types.ObjectId(line.id) : new Types.ObjectId(),
      lineNumber: index + 1,
      sourceOrderLineId: line.sourceOrderLineId && Types.ObjectId.isValid(line.sourceOrderLineId)
        ? new Types.ObjectId(line.sourceOrderLineId)
        : undefined,
      itemCode: line.itemCode,
      itemName: line.itemName,
      description: line.description ?? '',
      hsnSac: line.hsnSac ?? '',
      uom: line.uom,
      priority: line.priority,
      purchaseRate,
      orderedQty: roundToTwo(Number(line.orderedQty ?? 0)),
      previouslyReceivedQty: roundToTwo(Number(line.previouslyReceivedQty ?? 0)),
      supplierInvoiceQty,
      receivedQty,
      shortageQty,
      excessQty,
      damageQty: roundToTwo(Number(line.damageQty ?? 0)),
      damageReason: line.damageReason ?? '',
      batchNo: line.batchNo ?? '',
      serialNo: line.serialNo ?? '',
      manufacturingDate: line.manufacturingDate ? new Date(line.manufacturingDate) : undefined,
      storageLocation: line.storageLocation ?? '',
      boxCount: roundToTwo(Number(line.boxCount ?? 0)),
      remarks: line.remarks ?? '',
      attachments: [],
      discountPercent,
      discountAmount,
      taxableAmount,
      taxRate,
      taxColumns: line.taxColumns ?? '',
      totalAmount,
      status: excessQty > 0 ? 'Excess Received' : shortageQty > 0 ? 'Short Received' : 'Received',
    };
  });
}

async function validateAgainstSourceOrder(
  sourceOrderId: string | undefined,
  lines: Array<Record<string, unknown>>,
  allowOverReceipt = false,
  currentReceiptId?: string
) {
  if (!sourceOrderId) {
    return;
  }

  const purchaseOrder = await PurchaseOrderModel.findOne({ _id: sourceOrderId, isDeleted: false });
  if (!purchaseOrder) {
    throw new ApiError(404, 'Source purchase order not found');
  }

  for (const line of lines) {
    if (!line.sourceOrderLineId) {
      continue;
    }

    const orderLine = purchaseOrder.lines.id(line.sourceOrderLineId);
    if (!orderLine) {
      throw new ApiError(400, `Source purchase order line not found for item ${line.itemCode}`);
    }

    const relatedReceipts = await ReceiptModel.find({
      sourceOrderId,
      isDeleted: false,
      status: { $nin: ['Rejected', 'Cancelled'] },
      ...(currentReceiptId ? { _id: { $ne: currentReceiptId } } : {}),
    }).select('lines');

    const alreadyReceived = relatedReceipts.reduce((sum, receipt) => {
      const matching = receipt.lines.find((receiptLine) => receiptLine.sourceOrderLineId?.toString() === line.sourceOrderLineId.toString());
      return sum + (matching?.receivedQty ?? 0);
    }, 0);

    const remainingQty = orderLine.orderQty - orderLine.cancelledQty - alreadyReceived;
    if (!allowOverReceipt && line.receivedQty > remainingQty) {
      throw new ApiError(
        409,
        `Received quantity for item ${line.itemCode} exceeds remaining order quantity (${remainingQty})`
      );
    }
  }
}

function buildReceiptDocument(payload: ReceiptInput) {
  const lines = normalizeReceiptLines(payload.lines ?? []);
  const taxableAmount = roundToTwo(lines.reduce((sum, line) => sum + line.taxableAmount, 0));
  const totalDiscount = roundToTwo(lines.reduce((sum, line) => sum + line.discountAmount, 0));
  const totalAmount = roundToTwo(lines.reduce((sum, line) => sum + line.totalAmount, 0));
  const totalTaxes = roundToTwo(totalAmount - taxableAmount);

  let lifecycleStatus = 'Open';
  if (lines.length > 0 && lines.every((line) => line.status === 'Received')) {
    lifecycleStatus = 'Received';
  } else if (lines.some((line) => line.receivedQty > 0)) {
    lifecycleStatus = 'Partially Received';
  }

  return {
    number: payload.number,
    sourceOrderId: payload.sourceOrderId && Types.ObjectId.isValid(payload.sourceOrderId)
      ? new Types.ObjectId(payload.sourceOrderId)
      : undefined,
    sourceRequisitionId: payload.sourceRequisitionId && Types.ObjectId.isValid(payload.sourceRequisitionId)
      ? new Types.ObjectId(payload.sourceRequisitionId)
      : undefined,
    purchaseOrderNumber: payload.purchaseOrderNumber ?? '',
    requisitionNumber: payload.requisitionNumber ?? '',
    requisitionDate: payload.requisitionDate ? new Date(payload.requisitionDate) : undefined,
    supplierId: payload.supplierId && Types.ObjectId.isValid(payload.supplierId)
      ? new Types.ObjectId(payload.supplierId)
      : undefined,
    supplierName: payload.supplierName,
    department: payload.department,
    priority: payload.priority,
    status: payload.status ?? 'Draft',
    lifecycleStatus,
    placeOfSupply: payload.placeOfSupply ?? '',
    receivingLocation: payload.receivingLocation ?? '',
    receiveDate: payload.receiveDate ? new Date(payload.receiveDate) : new Date(),
    receivedBy: payload.receivedBy ?? '',
    paymentMode: payload.paymentMode,
    paymentTerm: payload.paymentTerm ?? '',
    supplierInvoiceNumber: payload.supplierInvoiceNumber ?? '',
    supplierInvoiceDate: payload.supplierInvoiceDate ? new Date(payload.supplierInvoiceDate) : undefined,
    createdBy: payload.createdBy ?? payload.actorName ?? payload.receivedBy,
    createdOn: payload.createdOn ? new Date(payload.createdOn) : new Date(),
    orderDateTime: payload.orderDateTime ? new Date(payload.orderDateTime) : new Date(),
    expectedDeliveryDate: payload.expectedDeliveryDate ? new Date(payload.expectedDeliveryDate) : undefined,
    buyerName: payload.buyerName ?? '',
    buyerEmail: payload.buyerEmail ?? '',
    branch: payload.branch ?? '',
    taxableAmount,
    totalDiscount,
    totalTaxes,
    totalAmount,
    currency: payload.currency ?? 'USD',
    notes: payload.notes ?? '',
    transportDetails: {
      transporterName: payload.transporterName ?? '',
      vehicleNumber: payload.vehicleNumber ?? '',
      consignmentNumber: payload.consignmentNumber ?? '',
      consignmentDate: payload.consignmentDate ? new Date(payload.consignmentDate) : undefined,
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
      createdBy: payload.actorName ?? payload.createdBy ?? payload.receivedBy,
      createdByEmail: payload.actorEmail ?? payload.buyerEmail ?? '',
      updatedBy: payload.actorName ?? payload.createdBy ?? payload.receivedBy,
      updatedByEmail: payload.actorEmail ?? payload.buyerEmail ?? '',
    },
    statusHistory: [
      {
        toStatus: payload.status ?? 'Draft',
        changedBy: payload.actorName ?? payload.createdBy ?? payload.receivedBy,
        comment: 'Document created',
      },
    ],
  };
}

export async function listReceipts(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const sortBy = String(query.sortBy ?? 'createdAt');
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  const search = String(query.search ?? '').trim();
  const filter: FilterQuery<Record<string, unknown>> = { isDeleted: false };

  if (query.supplier) filter.supplierName = query.supplier;
  if (query.department) filter.department = query.department;
  if (query.createdBy) filter.createdBy = query.createdBy;
  if (query.purchaseOrderNumber) filter.purchaseOrderNumber = query.purchaseOrderNumber;
  if (query.requisitionNumber) filter.requisitionNumber = query.requisitionNumber;
  if (query.status) filter.status = query.status;
  if (query.lifecycleStatus) filter.lifecycleStatus = query.lifecycleStatus;
  if (query.priority && query.priority !== 'Urgent') filter.priority = query.priority;
  if (query.priority === 'Urgent') filter.priority = 'Critical';

  if (query.receiveDateFrom || query.receiveDateTo) {
    filter.receiveDate = {};
    if (query.receiveDateFrom) filter.receiveDate.$gte = new Date(String(query.receiveDateFrom));
    if (query.receiveDateTo) filter.receiveDate.$lte = new Date(String(query.receiveDateTo));
  }

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
      { purchaseOrderNumber: { $regex: search, $options: 'i' } },
      { requisitionNumber: { $regex: search, $options: 'i' } },
      { supplierName: { $regex: search, $options: 'i' } },
      { receivedBy: { $regex: search, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    ReceiptModel.find(filter).sort({ [sortBy]: sortOrder }).skip(skip).limit(limit),
    ReceiptModel.countDocuments(filter),
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

export async function getReceiptById(id: string) {
  const document = await ReceiptModel.findOne({ _id: id, isDeleted: false });
  if (!document) {
    throw new ApiError(404, 'Receipt not found');
  }

  return document;
}

export async function createReceipt(payload: ReceiptInput) {
  return withSession(async (session) => {
    const normalized = buildReceiptDocument(payload);
    normalized.number = normalized.number || (await generateDocumentNumber('receipt', session));

    await validateAgainstSourceOrder(payload.sourceOrderId, normalized.lines, Boolean(payload.allowOverReceipt));

    const created = await ReceiptModel.create([normalized], { session });
    if (normalized.sourceOrderId) {
      await syncOrderFromReceipts(normalized.sourceOrderId, session);
    }

    return created[0];
  });
}

export async function updateReceipt(id: string, payload: ReceiptInput) {
  const existing = await getReceiptById(id);

  return withSession(async (session) => {
    const normalized = buildReceiptDocument({
      ...existing.toJSON(),
      ...payload,
      lines: payload.lines ?? existing.lines,
    });

    await validateAgainstSourceOrder(
      String(normalized.sourceOrderId ?? ''),
      normalized.lines,
      Boolean(payload.allowOverReceipt),
      id
    );

    normalized.audit.createdBy = existing.audit?.createdBy ?? existing.receivedBy;
    normalized.audit.createdByEmail = existing.audit?.createdByEmail ?? existing.buyerEmail;
    normalized.audit.updatedBy = payload.actorName ?? existing.audit.updatedBy ?? existing.receivedBy;
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

    await ReceiptModel.updateOne({ _id: id }, normalized, { session });

    if (existing.sourceOrderId) {
      await syncOrderFromReceipts(existing.sourceOrderId, session);
    }

    if (normalized.sourceOrderId) {
      await syncOrderFromReceipts(normalized.sourceOrderId, session);
    }

    return getReceiptById(id);
  });
}

export async function deleteReceipt(id: string, actorName?: string) {
  const existing = await getReceiptById(id);

  await withSession(async (session) => {
    existing.isDeleted = true;
    existing.audit.deletedBy = actorName ?? existing.audit.updatedBy ?? existing.receivedBy;
    existing.audit.deletedAt = new Date();
    await existing.save({ session });

    if (existing.sourceOrderId) {
      await syncOrderFromReceipts(existing.sourceOrderId, session);
    }
  });
}

export async function updateReceiptStatus(id: string, payload: ReceiptInput) {
  const document = await getReceiptById(id);
  const previousStatus = document.status;
  const nextStatus = payload.status;

  if (!allowedStatusTransitions[previousStatus]?.includes(nextStatus)) {
    throw new ApiError(409, `Invalid status transition from ${previousStatus} to ${nextStatus}`);
  }

  document.status = nextStatus;
  document.audit.updatedBy = payload.actorName ?? document.audit.updatedBy ?? document.receivedBy;
  document.audit.updatedByEmail = payload.actorEmail ?? document.audit.updatedByEmail ?? document.buyerEmail;
  document.statusHistory.push({
    fromStatus: previousStatus,
    toStatus: nextStatus,
    changedBy: payload.actorName ?? document.receivedBy,
    comment: payload.comment ?? '',
  });

  if (nextStatus === 'Cancelled') {
    document.lifecycleStatus = 'Cancelled';
  }

  await document.save();

  if (document.sourceOrderId) {
    await syncOrderFromReceipts(document.sourceOrderId);
  }

  return document;
}
