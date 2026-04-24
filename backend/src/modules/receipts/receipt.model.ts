import { Schema, model, type InferSchemaType } from 'mongoose';
import {
  APPROVAL_STATUS_VALUES,
  PAYMENT_MODE_VALUES,
  PRIORITY_VALUES,
  RECEIPT_LIFECYCLE_VALUES,
  RECEIPT_LINE_STATUS_VALUES,
} from '../../constants/domain.js';
import { attachmentSchema, auditSchema, statusHistorySchema } from '../../models/shared.js';

const transportDetailsSchema = new Schema(
  {
    transporterName: { type: String, trim: true, maxlength: 150, default: '' },
    vehicleNumber: { type: String, trim: true, maxlength: 100, default: '' },
    consignmentNumber: { type: String, trim: true, maxlength: 100, default: '' },
    consignmentDate: { type: Date },
  },
  { _id: false }
);

const insuranceDetailsSchema = new Schema(
  {
    insuranceProvider: { type: String, trim: true, maxlength: 150, default: '' },
    insuranceContactPerson: { type: String, trim: true, maxlength: 150, default: '' },
    insuranceType: { type: String, trim: true, maxlength: 150, default: '' },
    insuranceNumber: { type: String, trim: true, maxlength: 100, default: '' },
    insuranceAddress: { type: String, trim: true, maxlength: 250, default: '' },
  },
  { _id: false }
);

const receiptLineSchema = new Schema(
  {
    lineNumber: { type: Number, required: true, min: 1 },
    sourceOrderLineId: { type: Schema.Types.ObjectId },
    itemCode: { type: String, required: true, trim: true, maxlength: 100 },
    itemName: { type: String, required: true, trim: true, maxlength: 250 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    hsnSac: { type: String, trim: true, maxlength: 50, default: '' },
    uom: { type: String, required: true, trim: true, maxlength: 50 },
    priority: { type: String, enum: PRIORITY_VALUES, default: 'Medium' },
    purchaseRate: { type: Number, default: 0, min: 0 },
    orderedQty: { type: Number, default: 0, min: 0 },
    previouslyReceivedQty: { type: Number, default: 0, min: 0 },
    supplierInvoiceQty: { type: Number, default: 0, min: 0 },
    receivedQty: { type: Number, required: true, min: 0 },
    shortageQty: { type: Number, default: 0, min: 0 },
    excessQty: { type: Number, default: 0, min: 0 },
    damageQty: { type: Number, default: 0, min: 0 },
    damageReason: { type: String, trim: true, maxlength: 200, default: '' },
    batchNo: { type: String, trim: true, maxlength: 100, default: '' },
    serialNo: { type: String, trim: true, maxlength: 100, default: '' },
    manufacturingDate: { type: Date },
    storageLocation: { type: String, trim: true, maxlength: 150, default: '' },
    boxCount: { type: Number, default: 0, min: 0 },
    remarks: { type: String, trim: true, maxlength: 500, default: '' },
    attachments: { type: [attachmentSchema], default: [] },
    discountPercent: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    taxableAmount: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0 },
    taxColumns: { type: String, trim: true, maxlength: 100, default: '' },
    totalAmount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: RECEIPT_LINE_STATUS_VALUES, default: 'Open' },
  },
  { timestamps: false }
);

const receiptSchema = new Schema(
  {
    number: { type: String, required: true, unique: true, trim: true, maxlength: 50 },
    sourceOrderId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder' },
    sourceRequisitionId: { type: Schema.Types.ObjectId, ref: 'PurchaseRequisition' },
    purchaseOrderNumber: { type: String, trim: true, maxlength: 50, default: '' },
    requisitionNumber: { type: String, trim: true, maxlength: 50, default: '' },
    requisitionDate: { type: Date },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    supplierName: { type: String, required: true, trim: true, maxlength: 150 },
    department: { type: String, required: true, trim: true, maxlength: 120 },
    priority: { type: String, enum: PRIORITY_VALUES, required: true },
    status: { type: String, enum: APPROVAL_STATUS_VALUES, default: 'Draft' },
    lifecycleStatus: { type: String, enum: RECEIPT_LIFECYCLE_VALUES, default: 'Open' },
    placeOfSupply: { type: String, trim: true, maxlength: 150, default: '' },
    receivingLocation: { type: String, trim: true, maxlength: 150, default: '' },
    receiveDate: { type: Date, required: true, default: Date.now },
    receivedBy: { type: String, trim: true, maxlength: 150, default: '' },
    paymentMode: { type: String, enum: PAYMENT_MODE_VALUES },
    paymentTerm: { type: String, trim: true, maxlength: 100, default: '' },
    supplierInvoiceNumber: { type: String, trim: true, maxlength: 100, default: '' },
    supplierInvoiceDate: { type: Date },
    createdBy: { type: String, trim: true, maxlength: 150, default: '' },
    createdOn: { type: Date, default: Date.now },
    orderDateTime: { type: Date, default: Date.now },
    expectedDeliveryDate: { type: Date },
    buyerName: { type: String, trim: true, maxlength: 150, default: '' },
    buyerEmail: { type: String, trim: true, lowercase: true, maxlength: 150, default: '' },
    branch: { type: String, trim: true, maxlength: 120, default: '' },
    taxableAmount: { type: Number, default: 0, min: 0 },
    totalDiscount: { type: Number, default: 0, min: 0 },
    totalTaxes: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, trim: true, maxlength: 10, default: 'USD' },
    notes: { type: String, trim: true, maxlength: 2000, default: '' },
    transportDetails: { type: transportDetailsSchema, default: {} },
    insuranceDetails: { type: insuranceDetailsSchema, default: {} },
    lines: { type: [receiptLineSchema], default: [] },
    statusHistory: { type: [statusHistorySchema], default: [] },
    audit: { type: auditSchema, default: {} },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

receiptSchema.index({ number: 1 }, { unique: true });
receiptSchema.index({ sourceOrderId: 1, status: 1, lifecycleStatus: 1, isDeleted: 1 });
receiptSchema.index({ supplierName: 1, department: 1, createdBy: 1 });
receiptSchema.index({ receiveDate: 1, requisitionDate: 1 });
receiptSchema.index(
  {
    number: 'text',
    purchaseOrderNumber: 'text',
    requisitionNumber: 'text',
    supplierName: 'text',
    receivedBy: 'text',
    notes: 'text',
  },
  {
    weights: {
      number: 8,
      purchaseOrderNumber: 5,
      requisitionNumber: 4,
      supplierName: 3,
      receivedBy: 2,
      notes: 1,
    },
  }
);

export type ReceiptModel = InferSchemaType<typeof receiptSchema>;
export type ReceiptLineModel = InferSchemaType<typeof receiptLineSchema>;

export const ReceiptModel = model('Receipt', receiptSchema);
