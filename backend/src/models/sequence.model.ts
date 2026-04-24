import { Schema, model } from 'mongoose';

const sequenceSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: Number, required: true, default: 0 },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const SequenceModel = model('Sequence', sequenceSchema);
