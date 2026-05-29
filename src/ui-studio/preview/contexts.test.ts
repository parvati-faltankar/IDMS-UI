import { describe, expect, it } from 'vitest';
import { previewContexts } from './contexts';

describe('ui-studio preview contexts', () => {
  it('provides at least three role/device contexts', () => {
    expect(previewContexts.length).toBeGreaterThanOrEqual(3);
    expect(previewContexts.some((context) => context.roles.includes('sales'))).toBe(true);
    expect(previewContexts.some((context) => context.roles.includes('finance'))).toBe(true);
    expect(previewContexts.some((context) => context.roles.includes('warehouse'))).toBe(true);
    expect(previewContexts.some((context) => context.device === 'desktop')).toBe(true);
    expect(previewContexts.some((context) => context.device === 'mobile')).toBe(true);
  });
});

