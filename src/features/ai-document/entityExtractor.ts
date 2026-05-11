import type { ExtractedEntities } from './types';

export function extractEntities(text: string): ExtractedEntities {
  const input = text.toLowerCase();

  const quantityMatch = input.match(/\bqty\s*(\d+(\.\d+)?)|\bquantity\s*(\d+(\.\d+)?)/i);
  const discountAmountMatch = input.match(/\bdiscount\s*(rs\.?|inr)?\s*(\d+(\.\d+)?)/i);
  const discountPercentMatch = input.match(/\bdiscount\s*(\d+(\.\d+)?)\s*%/i);
  const chargesMatch = input.match(/\bcharges?\s*(rs\.?|inr)?\s*(\d+(\.\d+)?)/i);

  return {
    quantity: quantityMatch?.[1] || quantityMatch?.[3],
    discountAmount: discountAmountMatch?.[2],
    discountPercent: discountPercentMatch?.[1],
    charges: chargesMatch?.[2],
  };
}
