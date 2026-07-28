import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import CommonDataGrid, { escapeCsvCell, sanitizeCsvCellValue } from './CommonDataGrid';
import type { DataGridColumn } from './dataGridTypes';

describe('CommonDataGrid CSV export safety', () => {
  it('neutralizes spreadsheet formula trigger values', () => {
    expect(sanitizeCsvCellValue('=SUM(A1:A2)')).toBe("'=SUM(A1:A2)");
    expect(sanitizeCsvCellValue('+SUM(A1:A2)')).toBe("'+SUM(A1:A2)");
    expect(sanitizeCsvCellValue('-10+20')).toBe("'-10+20");
    expect(sanitizeCsvCellValue('@malicious')).toBe("'@malicious");
    expect(sanitizeCsvCellValue('\t=SUM(A1:A2)')).toBe("'\t=SUM(A1:A2)");
    expect(sanitizeCsvCellValue('\r=SUM(A1:A2)')).toBe("'\r=SUM(A1:A2)");
    expect(sanitizeCsvCellValue('\n=SUM(A1:A2)')).toBe("'\n=SUM(A1:A2)");
    expect(sanitizeCsvCellValue('  =SUM(A1:A2)')).toBe("'  =SUM(A1:A2)");
    expect(sanitizeCsvCellValue('  @malicious')).toBe("'  @malicious");
    expect(sanitizeCsvCellValue('\uFEFF=SUM(A1:A2)')).toBe("'\uFEFF=SUM(A1:A2)");
  });

  it('keeps normal text unchanged and preserves CSV quote escaping', () => {
    expect(sanitizeCsvCellValue('PR-2025-00847')).toBe('PR-2025-00847');
    expect(escapeCsvCell('Supplier "A"')).toBe('"Supplier ""A"""');
  });
});

type RenderTestRow = {
  id: string;
  documentNumber: string;
};

const renderTestColumns: DataGridColumn<RenderTestRow>[] = [
  {
    id: 'documentNumber',
    label: 'Document',
    type: 'text',
    width: 160,
    getValue: (row) => row.documentNumber,
    renderCell: (row) => row.documentNumber,
  },
];

describe('CommonDataGrid semantic rendering', () => {
  it('renders a named table and accessible resize controls', () => {
    const Grid = CommonDataGrid<RenderTestRow>;
    const markup = renderToStaticMarkup(
      React.createElement(Grid, {
        gridId: 'test-common-data-grid',
        rows: [{ id: '1', documentNumber: 'PR-2025-00847' }],
        columns: renderTestColumns,
        rowId: (row) => row.id,
        ariaLabel: 'Transaction documents table',
        showToolbar: false,
      })
    );

    expect(markup).toContain('aria-label="Transaction documents table"');
    expect(markup).toContain('aria-label="Resize Document column"');
  });
});
