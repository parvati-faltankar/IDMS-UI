import { Schema, model, type InferSchemaType } from 'mongoose';
import {
  APPROVAL_STATUS_VALUES,
  ORDER_LIFECYCLE_VALUES,
  ORDER_LINE_STATUS_VALUES,
  PAYMENT_MODE_VALUES,
  PRIORITY_VALUES,
} from '../../constants/domain.js';
import { attachmentSchema, auditSchema, statusHistorySchema } from '../../models/shared.js';

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

const shippingDetailsSchema = new Schema(
  {
    shipToLocation: { type: String, trim: true, maxlength: 150, default: '' },
    shippingTerm: { type: String, trim: true, maxlength: 100, default: '' },
    shippingMethod: { type: String, trim: true, maxlength: 100, default: '' },
    shippingInstructions: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { _id: false }
);

const purchaseOrderLineSchema = new Schema(
  {
    lineNumber: { type: Number, required: true, min: 1 },
    sourceRequisitionLineId: { type: Schema.Types.ObjectId },
    itemCode: { type: String, required: true, trim: true, maxlength: 100 },
    itemName: { type: String, required: true, trim: true, maxlength: 250 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    hsnSac: { type: String, trim: true, maxlength: 50, default: '' },
    uom: { type: String, required: true, trim: true, maxlength: 50 },
    priority: { type: String, enum: PRIORITY_VALUES, default: 'Medium' },
    requirementDate: { type: Date },
    purchaseRate: { type: Number, default: 0, min: 0 },
    availableQty: { type: Number, default: 0, min: 0 },
    requestedQty: { type: Number, default: 0, min: 0 },
    orderQty: { type: Number, required: true, min: 0.01 },
    cancelledQty: { type: Number, default: 0, min: 0 },
    receivedQty: { type: Number, default: 0, min: 0 },
    pendingReceiptQty: { type: Number, default: 0, min: 0 },
    invoicedQty: { type: Number, default: 0, min: 0 },
    pendingInvoiceQty: { type: Number, default: 0, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    taxableAmount: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0 },
    taxColumns: { type: String, trim: true, maxlength: 100, default: '' },
    totalAmount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ORDER_LINE_STATUS_VALUES, default: 'Open' },
    remarks: { type: String, trim: true, maxlength: 500, default: '' },
    attachments: { type: [attachmentSchema], default: [] },
  },
  { timestamps: false }
);

const purchaseOrderSchema = new Schema(
  {
    number: { type: String, required: true, unique: true, trim: true, maxlength: 50 },
    sourceRequisitionId: { type: Schema.Types.ObjectId, ref: 'PurchaseRequisition' },
    requisitionNumber: { type: String, trim: true, maxlength: 50, default: '' },
    requisitionDate: { type: Date },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    supplierName: { type: String, required: true, trim: true, maxlength: 150 },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User' },
    buyerName: { type: String, required: true, trim: true, maxlength: 150 },
    buyerEmail: { type: String, trim: true, lowercase: true, maxlength: 150, default: '' },
    createdBy: { type: String, trim: true, maxlength: 150, default: '' },
    createdOn: { type: Date, default: Date.now },
    branch: { type: String, trim: true, maxlength: 120, default: '' },
    department: { type: String, required: true, trim: true, maxlength: 120 },
    priority: { type: String, enum: PRIORITY_VALUES, required: true },
    status: { type: String, enum: APPROVAL_STATUS_VALUES, default: 'Draft' },
    lifecycleStatus: { type: String, enum: ORDER_LIFECYCLE_VALUES, default: 'Open' },
    orderDateTime: { type: Date, required: true, default: Date.now },
    expectedDeliveryDate: { type: Date },
    paymentMode: { type: String, enum: PAYMENT_MODE_VALUES },
    paymentTerms: { type: String, trim: true, maxlength: 100, default: '' },
    validTillDate: { type: Date },
    incoterm: { type: String, trim: true, maxlength: 50, default: '' },
    placeOfSupply: { type: String, trim: true, maxlength: 150, default: '' },
    notes: { type: String, trim: true, maxlength: 2000, default: '' },
    taxableAmount: { type: Number, default: 0, min: 0 },
    totalDiscount: { type: Number, default: 0, min: 0 },
    totalTaxes: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, trim: true, maxlength: 10, default: 'USD' },
    shippingDetails: { type: shippingDetailsSchema, default: {} },
    insuranceDetails: { type: insuranceDetailsSchema, default: {} },
    lines: { type: [purchaseOrderLineSchema], default: [] },
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

purchaseOrderSchema.index({ number: 1 }, { unique: true });
purchaseOrderSchema.index({ sourceRequisitionId: 1, status: 1, lifecycleStatus: 1, isDeleted: 1 });
purchaseOrderSchema.index({ supplierName: 1, department: 1, createdBy: 1 });
purchaseOrderSchema.index({ orderDateTime: 1, requisitionDate: 1 });
purchaseOrderSchema.index(
  {
    number: 'text',
    requisitionNumber: 'text',
    supplierName: 'text',
    buyerName: 'text',
    notes: 'text',
  },
  {
    weights: {
      number: 8,
      requisitionNumber: 5,
      supplierName: 3,
      buyerName: 2,
      notes: 1,
    },
  }
);

export type PurchaseOrderModel = InferSchemaType<typeof purchaseOrderSchema>;
export type PurchaseOrderLineModel = InferSchemaType<typeof purchaseOrderLineSchema>;

export const PurchaseOrderModel = model('PurchaseOrder', purchaseOrderSchema);
