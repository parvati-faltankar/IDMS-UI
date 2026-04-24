import { roundToTwo } from '../../utils/round.js';

function amount(value: number): string {
  return roundToTwo(value).toFixed(2);
}

type SerializableRecord = { toJSON?: () => Record<string, unknown> } & Record<string, unknown>;

export function mapPurchaseOrder(document: SerializableRecord) {
  const source = document.toJSON ? document.toJSON() : document;
  const lines = (source.lines as Array<Record<string, unknown>>) ?? [];

  return {
    id: source.id,
    number: source.number,
    orderDateTime: source.orderDateTime,
    requisitionNumber: source.requisitionNumber,
    requisitionDate: source.requisitionDate,
    sourceRequisitionId: source.sourceRequisitionId,
    supplierName: source.supplierName,
    buyerName: source.buyerName,
    createdBy: source.createdBy,
    createdOn: source.createdOn,
    buyerEmail: source.buyerEmail,
    branch: source.branch,
    department: source.department,
    priority: source.priority,
    status: source.status,
    lifecycleStatus: source.lifecycleStatus,
    expectedDeliveryDate: source.expectedDeliveryDate,
    paymentMode: source.paymentMode,
    paymentTerms: source.paymentTerms,
    validTillDate: source.validTillDate,
    incoterm: source.incoterm,
    placeOfSupply: source.placeOfSupply,
    shipToLocation: source.shippingDetails?.shipToLocation ?? '',
    shippingTerm: source.shippingDetails?.shippingTerm ?? '',
    shippingMethod: source.shippingDetails?.shippingMethod ?? '',
    shippingInstructions: source.shippingDetails?.shippingInstructions ?? '',
    insuranceProvider: source.insuranceDetails?.insuranceProvider ?? '',
    insuranceContactPerson: source.insuranceDetails?.insuranceContactPerson ?? '',
    insuranceType: source.insuranceDetails?.insuranceType ?? '',
    insuranceNumber: source.insuranceDetails?.insuranceNumber ?? '',
    insuranceAddress: source.insuranceDetails?.insuranceAddress ?? '',
    taxableAmount: amount(source.taxableAmount),
    totalDiscount: amount(source.totalDiscount),
    totalTaxes: amount(source.totalTaxes),
    totalAmount: amount(source.totalAmount),
    currency: source.currency,
    notes: source.notes,
    lines: lines.map((line) => ({
      id: typeof line.id === 'string' ? line.id : String(line._id ?? ''),
      lineNumber: line.lineNumber,
      sourceRequisitionLineId: line.sourceRequisitionLineId,
      itemCode: line.itemCode,
      itemName: line.itemName,
      description: line.description,
      hsnSac: line.hsnSac,
      uom: line.uom,
      priority: line.priority,
      requirementDate: line.requirementDate,
      purchaseRate: amount(Number(line.purchaseRate ?? 0)),
      availableQty: amount(Number(line.availableQty ?? 0)),
      requestedQty: amount(Number(line.requestedQty ?? 0)),
      orderQty: amount(Number(line.orderQty ?? 0)),
      cancelledQty: amount(Number(line.cancelledQty ?? 0)),
      receivedQty: amount(Number(line.receivedQty ?? 0)),
      pendingReceiptQty: amount(Number(line.pendingReceiptQty ?? 0)),
      invoicedQty: amount(Number(line.invoicedQty ?? 0)),
      pendingInvoiceQty: amount(Number(line.pendingInvoiceQty ?? 0)),
      discountPercent: amount(Number(line.discountPercent ?? 0)),
      discountAmount: amount(Number(line.discountAmount ?? 0)),
      taxableAmount: amount(Number(line.taxableAmount ?? 0)),
      taxColumns: line.taxColumns,
      totalAmount: amount(Number(line.totalAmount ?? 0)),
      remarks: line.remarks,
      quantity: amount(Number(line.orderQty ?? 0)),
      unitPrice: amount(Number(line.purchaseRate ?? 0)),
      expectedDate: line.requirementDate,
      amount: amount(Number(line.totalAmount ?? 0)),
    })),
  };
}
