import type { ClientSession } from 'mongoose';
import { DOCUMENT_PREFIX } from '../constants/domain.js';
import { SequenceModel } from '../models/sequence.model.js';

export async function generateDocumentNumber(
  documentType: keyof typeof DOCUMENT_PREFIX,
  session?: ClientSession
): Promise<string> {
  const year = new Date().getFullYear();
  const key = `${documentType}:${year}`;

  const sequence = await SequenceModel.findOneAndUpdate(
    { key },
    { $inc: { value: 1 } },
    {
      new: true,
      upsert: true,
      session,
      setDefaultsOnInsert: true,
    }
  );

  return `${DOCUMENT_PREFIX[documentType]}-${year}-${String(sequence.value).padStart(5, '0')}`;
}
