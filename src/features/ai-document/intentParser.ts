import type { IntentResult } from './types';

const saleOrderPatterns = [
  /\bcreate\b.*\bsale order\b/i,
  /\bnew\b.*\bsale order\b/i,
  /\bmake\b.*\bso\b/i,
  /\bcreate\b.*\bso\b/i,
];

const purchaseOrderPatterns = [
  /\bcreate\b.*\bpurchase order\b/i,
  /\bnew\b.*\bpurchase order\b/i,
  /\bmake\b.*\bpo\b/i,
  /\bcreate\b.*\bpo\b/i,
];

export function parseIntent(text: string): IntentResult {
  const value = text.trim();
  if (!value) {
    return { type: 'unknown', confidence: 0, text: value };
  }

  if (saleOrderPatterns.some((pattern) => pattern.test(value))) {
    return { type: 'create_sale_order', confidence: 0.95, text: value };
  }

  if (purchaseOrderPatterns.some((pattern) => pattern.test(value))) {
    return { type: 'create_purchase_order', confidence: 0.95, text: value };
  }

  return { type: 'unknown', confidence: 0.35, text: value };
}
