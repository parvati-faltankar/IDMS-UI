import { describe, expect, it } from 'vitest';
import type { DataGridColumn } from '../components/common/dataGridTypes';
import { sanitizeDataGridPreferences } from './dataGridPreferences';

type TestRow = {
  number: string;
  amount: number;
  locked: string;
};

const columns: DataGridColumn<TestRow>[] = [
  {
    id: 'number',
    label: 'Number',
    type: 'text',
    width: 120,
    minWidth: 90,
    maxWidth: 150,
    getValue: (row) => row.number,
    renderCell: (row) => row.number,
  },
  {
    id: 'amount',
    label: 'Amount',
    type: 'number',
    width: 120,
    minWidth: 100,
    maxWidth: 160,
    getValue: (row) => row.amount,
    renderCell: (row) => row.amount,
  },
  {
    id: 'locked',
    label: 'Locked',
    type: 'text',
    width: 120,
    locked: true,
    getValue: (row) => row.locked,
    renderCell: (row) => row.locked,
  },
  {
    id: 'actions',
    label: 'Actions',
    type: 'actions',
    width: 84,
    groupable: false,
    pinnable: false,
    hideable: false,
    getValue: () => '',
    renderCell: () => null,
  },
];

describe('sanitizeDataGridPreferences', () => {
  it('preserves valid stored settings and removes invalid column references', () => {
    const result = sanitizeDataGridPreferences(
      {
        version: 2,
        columnOrder: ['missing', 'amount', 'number', 'amount'],
        hiddenColumnIds: ['missing', 'number', 'locked', 'actions'],
        pinnedLeftColumnIds: ['missing', 'amount'],
        pinnedRightColumnIds: ['amount', 'locked', 'actions'],
        columnWidths: {
          number: 999,
          amount: 20,
          missing: 130,
        },
        columnFilters: {},
        groupByColumnId: 'actions',
        density: 'comfortable',
      },
      columns,
      'compact'
    );

    expect(result.columnOrder).toEqual(['amount', 'number', 'locked', 'actions']);
    expect(result.hiddenColumnIds).toEqual(['number']);
    expect(result.pinnedLeftColumnIds).toEqual(['amount']);
    expect(result.pinnedRightColumnIds).toEqual(['locked']);
    expect(result.columnWidths).toEqual({ number: 150, amount: 100 });
    expect(result.groupByColumnId).toBeNull();
    expect(result.density).toBe('comfortable');
  });
});