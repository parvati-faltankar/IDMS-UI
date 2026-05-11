import { describe, expect, it } from 'vitest';
import { extractEntities } from './entityExtractor';

describe('entityExtractor', () => {
  it('extracts quantity, discount and charges', () => {
    const extracted = extractEntities('quantity 5 discount 10% charges 250');
    expect(extracted.quantity).toBe('5');
    expect(extracted.discountPercent).toBe('10');
    expect(extracted.charges).toBe('250');
  });
});
