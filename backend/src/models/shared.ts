import { Schema } from 'mongoose';

export const attachmentSchema = new Schema(
  {
    fileName: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true, trim: true },
    mimeType: { type: String, trim: true },
    sizeInBytes: { type: Number, min: 0 },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: String, trim: true },
  },
  { _id: false }
);

export const statusHistorySchema = new Schema(
  {
    fromStatus: { type: String, trim: true },
    toStatus: { type: String, required: true, trim: true },
    changedBy: { type: String, trim: true },
    changedAt: { type: Date, default: Date.now },
    comment: { type: String, trim: true, maxlength: 1000 },
  },
  { _id: false }
);

export const auditSchema = new Schema(
  {
    createdBy: { type: String, trim: true },
    createdByEmail: { type: String, trim: true, lowercase: true },
    updatedBy: { type: String, trim: true },
    updatedByEmail: { type: String, trim: true, lowercase: true },
    approvedBy: { type: String, trim: true },
    approvedAt: { type: Date },
    deletedBy: { type: String, trim: true },
    deletedAt: { type: Date },
  },
  { _id: false }
);
