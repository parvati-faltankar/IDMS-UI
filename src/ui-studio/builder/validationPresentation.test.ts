import { describe, expect, it } from 'vitest';
import { groupValidationIssues } from './validationPresentation';

describe('validation presentation grouping', () => {
  it('groups blocking, warning, and info issues deterministically', () => {
    const grouped = groupValidationIssues([
      { id: '1', code: 'E1', message: 'Error', severity: 'error', blocking: true },
      { id: '2', code: 'W1', message: 'Warn', severity: 'warning', blocking: false },
      { id: '3', code: 'I1', message: 'Info', severity: 'info', blocking: false },
    ]);

    expect(grouped.blocking).toHaveLength(1);
    expect(grouped.warning).toHaveLength(1);
    expect(grouped.info).toHaveLength(1);
  });
});
