import { Schema, model, type InferSchemaType } from 'mongoose';
import {
  APPROVAL_STATUS_VALUES,
  PRIORITY_VALUES,
  REQUISITION_LIFECYCLE_VALUES,
  REQUISITION_LINE_STATUS_VALUES,
} from '../../constants/domain.js';
import { attachmentSchema, auditSchema, statusHistorySchema } from '../../models/shared.js';

const purchaseRequisitionLineSchema = new Schema(
  {
    lineNumber: { type: Number, required: true, min: 1 },
    sourceProductId: { type: Schema.Types.ObjectId, ref: 'Product' },
    productCode: { type: String, required: true, trim: true, maxlength: 100 },
    productName: { type: String, required: true, trim: true, maxlength: 250 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    uom: { type: String, required: true, trim: true, maxlength: 50 },
    priority: { type: String, enum: PRIORITY_VALUES, default: 'Medium' },
    requirementDate: { type: Date },
    requestedQty: { type: Number, required: true, min: 0.01 },
    orderedQty: { type: Number, default: 0, min: 0 },
    cancelledQty: { type: Number, default: 0, min: 0 },
    pendingQty: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: REQUISITION_LINE_STATUS_VALUES, default: 'Open' },
    cancellationReason: { type: String, trim: true, maxlength: 250, default: '' },
    remarks: { type: String, trim: true, maxlength: 500, default: '' },
    attachments: { type: [attachmentSchema], default: [] },
  },
  { timestamps: false }
);

const purchaseRequisitionSchema = new Schema(
  {
    number: { type: String, required: true, unique: true, trim: true, maxlength: 50 },
    title: { type: String, trim: true, maxlength: 250, default: '' },
    requesterId: { type: Schema.Types.ObjectId, ref: 'User' },
    requesterName: { type: String, required: true, trim: true, maxlength: 150 },
    requesterEmail: { type: String, trim: true, lowercase: true, maxlength: 150, default: '' },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    supplierName: { type: String, required: true, trim: true, maxlength: 150 },
    supplierContact: { type: String, trim: true, maxlength: 150, default: '' },
    department: { type: String, required: true, trim: true, maxlength: 120 },
    branch: { type: String, trim: true, maxlength: 120, default: '' },
    legalEntity: { type: String, trim: true, maxlength: 150, default: '' },
    costCenter: { type: String, trim: true, maxlength: 100, default: '' },
    deliveryLocation: { type: String, trim: true, maxlength: 200, default: '' },
    requirementDate: { type: Date, required: true },
    validTillDate: { type: Date, required: true },
    priority: { type: String, enum: PRIORITY_VALUES, required: true },
    status: { type: String, enum: APPROVAL_STATUS_VALUES, default: 'Draft' },
    lifecycleStatus: { type: String, enum: REQUISITION_LIFECYCLE_VALUES, default: 'Open' },
    currency: { type: String, trim: true, maxlength: 10, default: 'USD' },
    lineCount: { type: Number, default: 0, min: 0 },
    totalRequestedQty: { type: Number, default: 0, min: 0 },
    totalOrderedQty: { type: Number, default: 0, min: 0 },
    totalCancelledQty: { type: Number, default: 0, min: 0 },
    spendCategory: { type: String, trim: true, maxlength: 150, default: '' },
    contractReference: { type: String, trim: true, maxlength: 100, default: '' },
    budgetCode: { type: String, trim: true, maxlength: 100, default: '' },
    notes: { type: String, trim: true, maxlength: 2000, default: '' },
    productLines: { type: [purchaseRequisitionLineSchema], default: [] },
    attachments: { type: [attachmentSchema], default: [] },
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

purchaseRequisitionSchema.index({ number: 1 }, { unique: true });
purchaseRequisitionSchema.index({ status: 1, lifecycleStatus: 1, priority: 1, isDeleted: 1 });
purchaseRequisitionSchema.index({ supplierName: 1, department: 1, branch: 1 });
purchaseRequisitionSchema.index({ requirementDate: 1, validTillDate: 1 });
purchaseRequisitionSchema.index(
  {
    number: 'text',
    title: 'text',
    supplierName: 'text',
    requesterName: 'text',
    notes: 'text',
  },
  {
    weights: {
      number: 8,
      title: 4,
      supplierName: 3,
      requesterName: 2,
      notes: 1,
    },
  }
);

export type PurchaseRequisitionModel = InferSchemaType<typeof purchaseRequisitionSchema>;
export type PurchaseRequisitionLineModel = InferSchemaType<typeof purchaseRequisitionLineSchema>;

export const PurchaseRequisitionModel = model('PurchaseRequisition', purchaseRequisitionSchema);
