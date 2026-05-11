import { describe, expect, it } from 'vitest';
import { parseIntent } from './intentParser';

describe('intentParser', () => {
  it('detects sale order intent aliases', () => {
    expect(parseIntent('create sale order').type).toBe('create_sale_order');
    expect(parseIntent('make SO').type).toBe('create_sale_order');
  });

  it('detects purchase order intent aliases', () => {
    expect(parseIntent('create purchase order').type).toBe('create_purchase_order');
    expect(parseIntent('new po').type).toBe('create_purchase_order');
  });

  it('returns unknown for unrelated text', () => {
    expect(parseIntent('hello there').type).toBe('unknown');
  });
});
