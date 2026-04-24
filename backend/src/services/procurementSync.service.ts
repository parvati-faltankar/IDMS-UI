import type { ClientSession, Types } from 'mongoose';
import { PurchaseOrderModel } from '../modules/purchase-orders/purchaseOrder.model.js';
import { PurchaseRequisitionModel } from '../modules/purchase-requisitions/purchaseRequisition.model.js';
import { ReceiptModel } from '../modules/receipts/receipt.model.js';
import { roundToTwo } from '../utils/round.js';

function deriveRequisitionLineStatus(requestedQty: number, orderedQty: number, cancelledQty: number) {
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

export async function syncRequisitionFromOrders(
  requisitionId: Types.ObjectId | string,
  session?: ClientSession
): Promise<void> {
  const requisition = await PurchaseRequisitionModel.findById(requisitionId).session(session ?? null);
  if (!requisition || requisition.isDeleted) {
    return;
  }

  const activeOrders = await PurchaseOrderModel.find({
    sourceRequisitionId: requisition._id,
    isDeleted: false,
    status: { $nin: ['Rejected', 'Cancelled'] },
  }).session(session ?? null);

  const orderedByLineId = new Map<string, number>();

  for (const order of activeOrders) {
    for (const line of order.lines) {
      if (!line.sourceRequisitionLineId) {
        continue;
      }

      const key = line.sourceRequisitionLineId.toString();
      const current = orderedByLineId.get(key) ?? 0;
      orderedByLineId.set(key, roundToTwo(current + line.orderQty));
    }
  }

  let totalOrderedQty = 0;
  let totalCancelledQty = 0;
  let anyOrdered = false;
  let allOrdered = requisition.productLines.length > 0;
  let anyCancelled = false;

  requisition.productLines.forEach((line) => {
    const orderedQty = roundToTwo(orderedByLineId.get(line._id.toString()) ?? 0);
    const cancelledQty = roundToTwo(line.cancelledQty ?? 0);
    const pendingQty = roundToTwo(Math.max(line.requestedQty - orderedQty - cancelledQty, 0));

    line.orderedQty = orderedQty;
    line.pendingQty = pendingQty;
    line.status = deriveRequisitionLineStatus(line.requestedQty, orderedQty, cancelledQty);

    totalOrderedQty += orderedQty;
    totalCancelledQty += cancelledQty;
    anyOrdered ||= orderedQty > 0;
    anyCancelled ||= cancelledQty > 0;
    allOrdered &&= pendingQty === 0 && orderedQty >= line.requestedQty - cancelledQty;
  });

  requisition.lineCount = requisition.productLines.length;
  requisition.totalRequestedQty = roundToTwo(
    requisition.productLines.reduce((sum, line) => sum + line.requestedQty, 0)
  );
  requisition.totalOrderedQty = roundToTwo(totalOrderedQty);
  requisition.totalCancelledQty = roundToTwo(totalCancelledQty);

  if (requisition.status === 'Cancelled') {
    requisition.lifecycleStatus = 'Cancelled';
  } else if (allOrdered) {
    requisition.lifecycleStatus = 'Ordered';
  } else if (anyOrdered) {
    requisition.lifecycleStatus = 'Partially Ordered';
  } else if (anyCancelled) {
    requisition.lifecycleStatus = 'Partially Cancelled';
  } else {
    requisition.lifecycleStatus = 'Open';
  }

  await requisition.save({ session });
}

function deriveOrderLineStatus(orderQty: number, receivedQty: number, cancelledQty: number) {
  const pendingQty = roundToTwo(Math.max(orderQty - receivedQty - cancelledQty, 0));

  if (orderQty === 0) {
    return 'Open' as const;
  }

  if (pendingQty === 0 && cancelledQty === 0) {
    return 'Received' as const;
  }

  if (cancelledQty >= orderQty && receivedQty === 0) {
    return 'Cancelled' as const;
  }

  if (receivedQty > 0) {
    return 'Partially Received' as const;
  }

  return 'Open' as const;
}

export async function syncOrderFromReceipts(
  purchaseOrderId: Types.ObjectId | string,
  session?: ClientSession
): Promise<void> {
  const purchaseOrder = await PurchaseOrderModel.findById(purchaseOrderId).session(session ?? null);
  if (!purchaseOrder || purchaseOrder.isDeleted) {
    return;
  }

  const activeReceipts = await ReceiptModel.find({
    sourceOrderId: purchaseOrder._id,
    isDeleted: false,
    status: { $nin: ['Rejected', 'Cancelled'] },
  }).session(session ?? null);

  const receivedByLineId = new Map<string, number>();

  for (const receipt of activeReceipts) {
    for (const line of receipt.lines) {
      if (!line.sourceOrderLineId) {
        continue;
      }

      const key = line.sourceOrderLineId.toString();
      const current = receivedByLineId.get(key) ?? 0;
      receivedByLineId.set(key, roundToTwo(current + line.receivedQty));
    }
  }

  let anyReceived = false;
  let allReceived = purchaseOrder.lines.length > 0;

  purchaseOrder.lines.forEach((line) => {
    const receivedQty = roundToTwo(receivedByLineId.get(line._id.toString()) ?? 0);
    line.receivedQty = receivedQty;
    line.pendingReceiptQty = roundToTwo(Math.max(line.orderQty - receivedQty - line.cancelledQty, 0));
    line.pendingInvoiceQty = roundToTwo(Math.max(line.receivedQty - line.invoicedQty, 0));
    line.status = deriveOrderLineStatus(line.orderQty, receivedQty, line.cancelledQty);

    anyReceived ||= receivedQty > 0;
    allReceived &&= line.pendingReceiptQty === 0 && receivedQty >= line.orderQty - line.cancelledQty;
  });

  if (purchaseOrder.status === 'Cancelled') {
    purchaseOrder.lifecycleStatus = 'Cancelled';
  } else if (allReceived) {
    purchaseOrder.lifecycleStatus = 'Received';
  } else if (anyReceived) {
    purchaseOrder.lifecycleStatus = 'Partially Received';
  } else {
    purchaseOrder.lifecycleStatus = 'Open';
  }

  await purchaseOrder.save({ session });
}
