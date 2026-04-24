import { roundToTwo } from '../../utils/round.js';

function qty(value: number): string {
  return roundToTwo(value).toFixed(2);
}

type SerializableRecord = { toJSON?: () => Record<string, unknown> } & Record<string, unknown>;

export function mapPurchaseRequisition(document: SerializableRecord) {
  const source = document.toJSON ? document.toJSON() : document;
  const productLines = (source.productLines as Array<Record<string, unknown>>) ?? [];

  return {
    id: source.id,
    number: source.number,
    title: source.title,
    documentDateTime: source.createdAt,
    supplierName: source.supplierName,
    supplierContact: source.supplierContact,
    requesterName: source.requesterName,
    requesterEmail: source.requesterEmail,
    department: source.department,
    branch: source.branch,
    legalEntity: source.legalEntity,
    costCenter: source.costCenter,
    requirementDate: source.requirementDate,
    validTillDate: source.validTillDate,
    priority: source.priority,
    status: source.status,
    lifecycleStatus: source.lifecycleStatus,
    currency: source.currency,
    lineCount: source.lineCount,
    spendCategory: source.spendCategory,
    contractReference: source.contractReference,
    budgetCode: source.budgetCode,
    notes: source.notes,
    productLines: productLines.map((line) => ({
      id: typeof line.id === 'string' ? line.id : String(line._id ?? ''),
      lineNumber: line.lineNumber,
      productCode: line.productCode,
      productName: line.productName,
      description: line.description,
      uom: line.uom,
      priority: line.priority,
      requirementDate: line.requirementDate,
      requestedQty: qty(Number(line.requestedQty ?? 0)),
      orderedQty: qty(Number(line.orderedQty ?? 0)),
      cancelledQty: qty(Number(line.cancelledQty ?? 0)),
      pendingQty: qty(Number(line.pendingQty ?? 0)),
      status: line.status,
      cancellationReason: line.cancellationReason,
      remarks: line.remarks,
    })),
  };
}
