import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import EditableTransactionGrid, {
  getLastEditableGridColumn,
  getNextEditableGridColumn,
  resolveEditableGridColumns,
  resolveEditableGridMobileFieldGroups,
  resolveEditableGridMobileLayout,
  resolveEditableGridAddedRowId,
  formatEditableGridMobileFieldCount,
  resolveEditableGridMobileEditorOpenGroupIds,
} from './EditableTransactionGrid';
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

describe('EditableTransactionGrid add row contract', () => {
  it('resolves only valid added row ids for mobile drawer opening', () => {
    expect(resolveEditableGridAddedRowId('line-2')).toBe('line-2');
    expect(resolveEditableGridAddedRowId({ rowId: 'line-3' })).toBe('line-3');
    expect(resolveEditableGridAddedRowId({})).toBeUndefined();
    expect(resolveEditableGridAddedRowId(undefined)).toBeUndefined();
  });
});

describe('EditableTransactionGrid mobile layout contract', () => {
  it('keeps the default breakpoint phone-only and lets forceMobileLayout override media queries', () => {
    expect(resolveEditableGridMobileLayout({ isPhoneViewport: true, isTabletPortraitViewport: false })).toBe(true);
    expect(resolveEditableGridMobileLayout({ isPhoneViewport: false, isTabletPortraitViewport: true })).toBe(false);
    expect(resolveEditableGridMobileLayout({ breakpoint: 'tablet-portrait', isPhoneViewport: false, isTabletPortraitViewport: true })).toBe(true);
    expect(resolveEditableGridMobileLayout({ forceMobileLayout: false, breakpoint: 'tablet-portrait', isPhoneViewport: true, isTabletPortraitViewport: true })).toBe(false);
    expect(resolveEditableGridMobileLayout({ forceMobileLayout: true, isPhoneViewport: false, isTabletPortraitViewport: false })).toBe(true);
  });

  it('resolves grouped mobile editor fields and appends ungrouped columns to Other details', () => {
    const groupedColumns = resolveEditableGridMobileFieldGroups(
      columns.filter((column) => column.kind !== 'actions'),
      [
        { id: 'product', label: 'Product', columnIds: ['productCode', 'uom'] },
        { id: 'quantity', label: 'Quantity', columnIds: ['requestedQty'] },
      ]
    );

    expect(groupedColumns.map((group) => [group.id, group.columns.map((column) => column.id)])).toEqual([
      ['product', ['productCode', 'uom']],
      ['quantity', ['requestedQty']],
      ['other-details', ['pendingQty', 'status']],
    ]);
  });

  it('formats mobile editor field counts', () => {
    expect(formatEditableGridMobileFieldCount(0)).toBe('0 fields');
    expect(formatEditableGridMobileFieldCount(1)).toBe('1 field');
    expect(formatEditableGridMobileFieldCount(4)).toBe('4 fields');
  });

  it('resolves mobile editor accordion defaults and first-error override', () => {
    const groupIds = ['product', 'requirement', 'progress'];

    expect(resolveEditableGridMobileEditorOpenGroupIds({
      groupIds,
      isNewRow: true,
      newRowOpenGroupIds: ['product'],
      existingRowOpenGroupIds: ['product'],
      fallbackGroupId: 'product',
    })).toEqual(['product']);

    expect(resolveEditableGridMobileEditorOpenGroupIds({
      groupIds,
      isNewRow: false,
      newRowOpenGroupIds: ['product'],
      existingRowOpenGroupIds: ['product'],
      fallbackGroupId: 'product',
    })).toEqual(['product']);

    expect(resolveEditableGridMobileEditorOpenGroupIds({
      groupIds,
      isNewRow: true,
      firstErrorGroupId: 'requirement',
      newRowOpenGroupIds: ['product'],
      fallbackGroupId: 'product',
    })).toEqual(['requirement']);

    expect(resolveEditableGridMobileEditorOpenGroupIds({
      groupIds,
      isNewRow: true,
      newRowOpenGroupIds: ['unknown'],
      fallbackGroupId: 'product',
    })).toEqual(['product']);
  });
});

describe('EditableTransactionGrid rendering', () => {
  it('treats unsafe object cell values as blank instead of coercing them', () => {
    const unsafeValue = {
      [Symbol.toPrimitive]: () => {
        throw new TypeError('Cannot convert object to primitive value');
      },
    };
    const unsafeColumns: EditableGridColumn<TestLine>[] = [
      { id: 'productCode', label: 'Product Code', kind: 'text', getValue: () => unsafeValue },
    ];

    expect(() => renderToStaticMarkup(
      <EditableTransactionGrid
        gridId="test-editable-grid-unsafe-object-value"
        title="Product details"
        rows={rows}
        columns={unsafeColumns}
        rowId={(row) => row.id}
        ariaLabel="Editable product lines"
        forceMobileLayout
      />
    )).not.toThrow();
  });

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

  it('renders compact-inline mobile issue summaries and compact rows when opted in', () => {
    const markup = renderToStaticMarkup(
      <EditableTransactionGrid
        gridId="test-editable-grid-compact-mobile"
        title="Product details"
        rows={rows}
        columns={columns}
        rowId={(row) => row.id}
        ariaLabel="Editable product lines"
        forceMobileLayout
        mobileLayout={{
          presentation: 'compact-inline',
          showIssueSummary: true,
          inlineFieldIds: ['productCode', 'uom', 'requestedQty'],
        }}
        errors={{
          'line-1': {
            uom: 'UOM is required.',
            requestedQty: 'Requested quantity must be greater than 0.',
          },
        }}
        getMobileRowSummary={(row) => ({
          title: row.productCode,
          subtitle: `UOM ${row.uom}`,
          metrics: [{ label: 'Pending', value: row.pendingQty }],
          status: row.status,
        })}
      />
    );

    expect(markup).toContain('editable-transaction-grid__compact-mobile');
    expect(markup).toContain('editable-transaction-grid__compact-mobile-issues');
    expect(markup).toContain('editable-transaction-grid__compact-mobile-row--error');
    expect(markup).toContain('UOM is required.');
    expect(markup).toContain('1 line - UOM');
    expect(markup).not.toContain('editable-transaction-grid__mobile-card');
  });

  it('uses column order for deterministic compact mobile first-error priority', () => {
    const markup = renderToStaticMarkup(
      <EditableTransactionGrid
        gridId="test-editable-grid-compact-mobile-priority"
        title="Product details"
        rows={rows}
        columns={columns}
        rowId={(row) => row.id}
        ariaLabel="Editable product lines"
        forceMobileLayout
        mobileLayout={{ presentation: 'compact-inline', showIssueSummary: true }}
        errors={{
          'line-1': {
            requestedQty: 'Requested quantity must be greater than 0.',
            uom: 'UOM is required.',
          },
        }}
      />
    );

    expect(markup.indexOf('UOM is required.')).toBeGreaterThan(-1);
    expect(markup.indexOf('Requested quantity must be greater than 0.')).toBeGreaterThan(-1);
    expect(markup.indexOf('UOM is required.')).toBeLessThan(markup.indexOf('Requested quantity must be greater than 0.'));
  });

  it('hides compact mobile selection checkboxes until selection mode is active', () => {
    const markup = renderToStaticMarkup(
      <EditableTransactionGrid
        gridId="test-editable-grid-compact-mobile-selection-hidden"
        title="Product details"
        rows={rows}
        columns={columns}
        rowId={(row) => row.id}
        ariaLabel="Editable product lines"
        forceMobileLayout
        mobileLayout={{ presentation: 'compact-inline' }}
        selection={{ selectedRowIds: [], onSelectionChange: () => undefined }}
      />
    );

    expect(markup).not.toContain('editable-transaction-grid__compact-mobile-select');
    expect(markup).not.toContain('Select');
    expect(markup).not.toContain('editable-transaction-grid__mobile-selection-checkbox');
  });

  it('shows compact mobile bulk actions and row checkboxes once selection is active', () => {
    const markup = renderToStaticMarkup(
      <EditableTransactionGrid
        gridId="test-editable-grid-compact-mobile-selection-active"
        title="Product details"
        rows={rows}
        columns={columns}
        rowId={(row) => row.id}
        ariaLabel="Editable product lines"
        forceMobileLayout
        mobileLayout={{ presentation: 'compact-inline' }}
        selection={{ selectedRowIds: ['line-1'], onSelectionChange: () => undefined }}
        bulkActions={[{ id: 'bulk-edit', label: 'Bulk edit', onAction: () => undefined }]}
      />
    );

    expect(markup).toContain('editable-transaction-grid__bulk-toolbar--mobile');
    expect(markup).toContain('editable-transaction-grid__mobile-selection-checkbox');
    expect(markup).toContain('Bulk edit');
  });
  it('renders sticky mobile add action and hides the header add action only when opted in', () => {
    const markup = renderToStaticMarkup(
      <EditableTransactionGrid
        gridId="test-editable-grid-sticky-mobile-add"
        title="Product details"
        rows={rows}
        columns={columns}
        rowId={(row) => row.id}
        ariaLabel="Editable product lines"
        forceMobileLayout
        mobileLayout={{ stickyAddAction: true, stickyActionOffset: '42px' }}
        onAddRow={() => undefined}
      />
    );

    expect(markup).toContain('editable-transaction-grid__mobile-sticky-action');
    expect(markup).toContain('editable-transaction-grid__mobile-sticky-add-button');
    expect(markup).toContain('--editable-transaction-grid-mobile-sticky-offset:42px');
    expect(markup).not.toContain('editable-transaction-grid__add-button');
  });

  it('hides sticky mobile add action during mobile bulk selection', () => {
    const markup = renderToStaticMarkup(
      <EditableTransactionGrid
        gridId="test-editable-grid-sticky-mobile-selection"
        title="Product details"
        rows={rows}
        columns={columns}
        rowId={(row) => row.id}
        ariaLabel="Editable product lines"
        forceMobileLayout
        mobileLayout={{ stickyAddAction: true }}
        selection={{ selectedRowIds: ['line-1'], onSelectionChange: () => undefined }}
        bulkActions={[{ id: 'bulk-edit', label: 'Bulk edit', onAction: () => undefined }]}
        onAddRow={() => undefined}
      />
    );

    expect(markup).toContain('editable-transaction-grid__bulk-toolbar--mobile');
    expect(markup).not.toContain('editable-transaction-grid__mobile-sticky-action');
  });

  it('hides sticky mobile add action in read-only mode', () => {
    const markup = renderToStaticMarkup(
      <EditableTransactionGrid
        gridId="test-editable-grid-sticky-mobile-readonly"
        title="Product details"
        rows={rows}
        columns={columns}
        rowId={(row) => row.id}
        ariaLabel="Editable product lines"
        forceMobileLayout
        readOnly
        mobileLayout={{ stickyAddAction: true }}
        onAddRow={() => undefined}
      />
    );

    expect(markup).not.toContain('editable-transaction-grid__mobile-sticky-action');
  });

  it('keeps inline cell errors as the default validation display', () => {
    const markup = renderToStaticMarkup(
      <EditableTransactionGrid
        gridId="test-editable-grid-inline-errors"
        title="Product details"
        rows={rows}
        columns={columns}
        rowId={(row) => row.id}
        ariaLabel="Editable product lines"
        errors={{ 'line-1': { requestedQty: 'Requested quantity is required.' } }}
      />
    );

    expect(markup).toContain('editable-transaction-grid__meta-row');
    expect(markup).toContain('Requested quantity is required.');
    expect(markup).toContain('test-editable-grid-inline-errors-line-1-requestedQty-error');
    expect(markup).not.toContain('editable-transaction-grid__validation-row');
  });

  it('renders compact row validation summaries when explicitly enabled', () => {
    const markup = renderToStaticMarkup(
      <EditableTransactionGrid
        gridId="test-editable-grid-row-summary"
        title="Product details"
        rows={rows}
        columns={columns}
        rowId={(row) => row.id}
        ariaLabel="Editable product lines"
        validationDisplay="row-summary"
        maxRowValidationMessages={2}
        errors={{
          'line-1': {
            productCode: 'is required.',
            requestedQty: 'must be greater than 0.',
          },
        }}
        warnings={{
          'line-1': {
            uom: 'review the selected UOM.',
            status: 'review status.',
          },
        }}
      />
    );

    expect(markup).toContain('editable-transaction-grid__validation-row');
    expect(markup).toContain('editable-transaction-grid__validation-cell--error');
    expect(markup).toContain('Product Code - is required.');
    expect(markup).toContain('Requested Qty - must be greater than 0.');
    expect(markup).toContain('+2 more');
    expect(markup).toContain('UOM - review the selected UOM.');
    expect(markup).toContain('Status - review status.');
    expect(markup).toContain('class="sr-only"');
    expect(markup).toContain('aria-describedby="test-editable-grid-row-summary-line-1-requestedQty-error"');
    expect(markup).toContain('aria-describedby="test-editable-grid-row-summary-line-1-uom-warning"');
    expect(markup).not.toContain('editable-transaction-grid__meta-row');
  });

  it('uses warning styling for warning-only row validation summaries', () => {
    const markup = renderToStaticMarkup(
      <EditableTransactionGrid
        gridId="test-editable-grid-row-warning"
        title="Product details"
        rows={rows}
        columns={columns}
        rowId={(row) => row.id}
        ariaLabel="Editable product lines"
        validationDisplay="row-summary"
        warnings={{ 'line-1': { uom: 'review the selected UOM.' } }}
      />
    );

    expect(markup).toContain('editable-transaction-grid__validation-cell--warning');
    expect(markup).toContain('editable-transaction-grid__control--warning');
    expect(markup).toContain('UOM - review the selected UOM.');
    expect(markup).not.toContain('editable-transaction-grid__validation-cell--error');
  });
  it('lets errors win over warnings on the same cell', () => {
    const markup = renderToStaticMarkup(
      <EditableTransactionGrid
        gridId="test-editable-grid-error-wins"
        title="Product details"
        rows={rows}
        columns={columns}
        rowId={(row) => row.id}
        ariaLabel="Editable product lines"
        validationDisplay="row-summary"
        errors={{ 'line-1': { uom: 'is required.' } }}
        warnings={{ 'line-1': { uom: 'review the selected UOM.' } }}
      />
    );

    expect(markup).toContain('editable-transaction-grid__validation-cell--error');
    expect(markup).toContain('UOM - is required.');
    expect(markup).not.toContain('editable-transaction-grid__control--warning');
    expect(markup).not.toContain('UOM - review the selected UOM.');
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


