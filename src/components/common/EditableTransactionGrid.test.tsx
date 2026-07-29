import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import EditableTransactionGrid, { getLastEditableGridColumn, getNextEditableGridColumn, resolveEditableGridColumns } from './EditableTransactionGrid';
import type { EditableGridColumn } from './editableTransactionGridTypes';

type TestLine = {
  id: string;
  productCode: string;
  uom: string;
  requestedQty: string;
  pendingQty: string;
  status: string;
};

const rows: TestLine[] = [
  {
    id: 'line-1',
    productCode: 'P-1001',
    uom: 'Unit',
    requestedQty: '3.00',
    pendingQty: '2.00',
    status: 'Open',
  },
];

const columns: EditableGridColumn<TestLine>[] = [
  { id: 'action', label: 'Action', kind: 'actions', pinned: 'left', locked: true, width: 72 },
  { id: 'productCode', label: 'Product Code', kind: 'lookup', pinned: 'left', locked: true, getValue: (row) => row.productCode },
  { id: 'uom', label: 'UOM', kind: 'select', getValue: (row) => row.uom, options: [{ value: 'Unit', label: 'Unit' }] },
  { id: 'requestedQty', label: 'Requested Qty', kind: 'number', getValue: (row) => row.requestedQty },
  { id: 'pendingQty', label: 'Pending Qty', kind: 'computed', readOnly: true, getValue: (row) => row.pendingQty },
  { id: 'status', label: 'Status', kind: 'status', readOnly: true, getValue: (row) => row.status, renderDisplay: (row) => row.status },
];

describe('EditableTransactionGrid column layout', () => {
  it('filters and orders visible columns from layout config while keeping locked columns visible', () => {
    const resolved = resolveEditableGridColumns(columns, [
      { key: 'requestedQty', label: 'Qty', visible: true },
      { key: 'uom', visible: false },
      { key: 'productCode', visible: false, locked: true },
      { key: 'action', visible: false, locked: true },
      { key: 'status', visible: true },
      { key: 'pendingQty', visible: true },
    ]);

    expect(resolved.map((column) => column.id)).toEqual(['requestedQty', 'productCode', 'action', 'status', 'pendingQty']);
    expect(resolved[0].label).toBe('Qty');
  });

  it('keeps default columns that are omitted by a partial layout configuration', () => {
    const resolved = resolveEditableGridColumns(columns, [
      { key: 'productCode', visible: true },
      { key: 'requestedQty', visible: true },
    ]);

    expect(resolved.map((column) => column.id)).toEqual(['productCode', 'requestedQty', 'action', 'uom', 'pendingQty', 'status']);
  });
});

describe('EditableTransactionGrid keyboard tab order', () => {
  it('uses the logical final editable column instead of the last visible viewport cell', () => {
    const transactionColumns: EditableGridColumn<TestLine>[] = [
      { id: 'productCode', label: 'Product Code', kind: 'lookup', getValue: (row) => row.productCode },
      { id: 'uom', label: 'UOM', kind: 'select', getValue: (row) => row.uom },
      { id: 'requestedQty', label: 'Requested Qty', kind: 'number', getValue: (row) => row.requestedQty },
      { id: 'orderedQty', label: 'Ordered Qty', kind: 'computed', readOnly: true, getValue: () => '0.00' },
      { id: 'pendingQty', label: 'Pending Qty', kind: 'computed', readOnly: true, getValue: (row) => row.pendingQty },
      { id: 'status', label: 'Status', kind: 'status', readOnly: true, getValue: (row) => row.status },
      { id: 'cancellationReason', label: 'Cancellation Reason', kind: 'select', disabled: true, getValue: () => '' },
      { id: 'remarks', label: 'Remarks', kind: 'remarks', getValue: () => '' },
    ];

    expect(getNextEditableGridColumn(transactionColumns, 'requestedQty')?.id).toBe('remarks');
    expect(getLastEditableGridColumn(transactionColumns)?.id).toBe('remarks');
    expect(getLastEditableGridColumn(transactionColumns)?.id).not.toBe('requestedQty');
  });
});

describe('EditableTransactionGrid rendering', () => {
  it('renders an accessible editable table with errors and footer totals', () => {
    const markup = renderToStaticMarkup(
      <EditableTransactionGrid
        gridId="test-editable-grid"
        title="Product details"
        rows={rows}
        columns={columns}
        rowId={(row) => row.id}
        ariaLabel="Editable product lines"
        errors={{ 'line-1': { requestedQty: 'Requested quantity is required.' } }}
        footerAggregates={{ requestedQty: '3.00', pendingQty: '2.00' }}
        onAddRow={() => undefined}
        onDuplicateRow={() => undefined}
        onDeleteRow={() => undefined}
      />
    );

    expect(markup).toContain('aria-label="Editable product lines"');
    expect(markup).toContain('Line actions');
    expect(markup).toContain('class="editable-transaction-grid__count" aria-label="1 line">1</span>');
    expect(markup).toContain('Requested quantity is required.');
    expect(markup).toContain('3.00');
    expect(markup).toContain('2.00');
  });

  it('renders enterprise header labels, summaries, attention, and custom action copy', () => {
    const markup = renderToStaticMarkup(
      <EditableTransactionGrid
        gridId="test-editable-grid-header"
        title="Product lines"
        rows={rows}
        columns={columns}
        rowId={(row) => row.id}
        ariaLabel="Editable product lines"
        lineCountLabel="1"
        summaryItems={['Requested 3.00', 'Pending 2.00']}
        attentionMessage="1 line needs attention"
        headerHelp="Tab from the last editable cell adds another line."
        primaryActionLabel="Insert line"
        onAddRow={() => undefined}
      />
    );

    expect(markup).toContain('Product lines');
    expect(markup).toContain('aria-label="1 line"');
    expect(markup).toContain('Requested 3.00');
    expect(markup).toContain('Pending 2.00');
    expect(markup).toContain('1 line needs attention');
    expect(markup).toContain('Insert line');
    expect(markup).not.toContain('editable-transaction-grid__help-button');
    expect(markup).not.toContain('Tab from the last editable cell adds another line.');
  });

  it('renders optional instructional help control only when explicitly enabled', () => {
    const markup = renderToStaticMarkup(
      <EditableTransactionGrid
        gridId="test-editable-grid-header-help"
        title="Product lines"
        rows={rows}
        columns={columns}
        rowId={(row) => row.id}
        ariaLabel="Editable product lines"
        headerHelp="Tab from the last editable cell adds another line."
        showInstructionalHint
      />
    );

    expect(markup).toContain('editable-transaction-grid__help-button');
  });

  it('renders compact mobile row summaries when mobile layout is forced', () => {
    const markup = renderToStaticMarkup(
      <EditableTransactionGrid
        gridId="test-editable-grid-mobile"
        title="Product details"
        rows={rows}
        columns={columns}
        rowId={(row) => row.id}
        ariaLabel="Editable product lines"
        forceMobileLayout
        getMobileRowSummary={(row) => ({
          title: row.productCode,
          subtitle: `UOM ${row.uom}`,
          metrics: [{ label: 'Pending', value: row.pendingQty }],
          status: row.status,
        })}
      />
    );

    expect(markup).toContain('editable-transaction-grid__mobile-card');
    expect(markup).toContain('P-1001');
    expect(markup).toContain('UOM Unit');
    expect(markup).toContain('Pending');
  });


  it('keeps selection off by default so existing transaction grids do not change structure', () => {
    const markup = renderToStaticMarkup(
      <EditableTransactionGrid
        gridId="test-editable-grid-no-selection"
        title="Product details"
        rows={rows}
        columns={columns}
        rowId={(row) => row.id}
        ariaLabel="Editable product lines"
      />
    );

    expect(markup).not.toContain('editable-transaction-grid__cell--selection');
    expect(markup).not.toContain('editable-transaction-grid__bulk-toolbar');
    expect(markup).not.toContain('Select all product lines');
  });

  it('renders opt-in selection column and contextual bulk toolbar', () => {
    const markup = renderToStaticMarkup(
      <EditableTransactionGrid
        gridId="test-editable-grid-selection"
        title="Product details"
        rows={rows}
        columns={columns}
        rowId={(row) => row.id}
        ariaLabel="Editable product lines"
        selection={{
          selectedRowIds: ['line-1'],
          onSelectionChange: () => undefined,
          ariaLabel: 'Select all product lines',
        }}
        bulkActions={[
          { id: 'bulk-edit', label: 'Bulk edit', onAction: () => undefined },
          { id: 'delete', label: 'Delete', tone: 'danger', onAction: () => undefined },
        ]}
        selectionColumnLabel="Select product lines"
      />
    );

    expect(markup).toContain('editable-transaction-grid__cell--selection');
    expect(markup).toContain('Select all product lines');
    expect(markup).toContain('1 selected');
    expect(markup).toContain('Bulk edit');
    expect(markup).toContain('Delete');
  });

  it('disables selection and hides bulk actions in read-only mode', () => {
    const markup = renderToStaticMarkup(
      <EditableTransactionGrid
        gridId="test-editable-grid-readonly-selection"
        title="Product details"
        rows={rows}
        columns={columns}
        rowId={(row) => row.id}
        ariaLabel="Editable product lines"
        readOnly
        selection={{
          selectedRowIds: ['line-1'],
          onSelectionChange: () => undefined,
          ariaLabel: 'Select all product lines',
        }}
        bulkActions={[
          { id: 'bulk-edit', label: 'Bulk edit', onAction: () => undefined },
        ]}
      />
    );

    expect(markup).toContain('editable-transaction-grid__cell--selection');
    expect(markup).toContain('disabled=""');
    expect(markup).not.toContain('editable-transaction-grid__bulk-toolbar');
  });

  it('disables row actions and add line in read-only mode', () => {
    const markup = renderToStaticMarkup(
      <EditableTransactionGrid
        gridId="test-editable-grid-readonly"
        title="Product details"
        rows={rows}
        columns={columns}
        rowId={(row) => row.id}
        ariaLabel="Editable product lines"
        readOnly
        onAddRow={() => undefined}
        onDuplicateRow={() => undefined}
        onDeleteRow={() => undefined}
      />
    );

    expect(markup).toContain('disabled=""');
  });
});


