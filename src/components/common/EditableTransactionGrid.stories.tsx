import React, { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import EditableTransactionGrid from './EditableTransactionGrid';
import type { EditableGridColumn } from './editableTransactionGridTypes';

type StoryLine = {
  id: string;
  productCode: string;
  productName: string;
  uom: string;
  requestedQty: string;
  orderedQty: string;
  cancelledQty: string;
  pendingQty: string;
  status: 'Open' | 'Partially Cancelled' | 'Fully Ordered';
  warehouse: string;
  batchNo: string;
  remarks: string;
};

const initialRows: StoryLine[] = [
  {
    id: 'line-1',
    productCode: 'P-1001',
    productName: 'Industrial Bearing Assembly',
    uom: 'Unit',
    requestedQty: '150.00',
    orderedQty: '0.00',
    cancelledQty: '0.00',
    pendingQty: '150.00',
    status: 'Open',
    warehouse: 'Main Store',
    batchNo: '',
    remarks: 'OEM certified',
  },
  {
    id: 'line-2',
    productCode: 'P-1002',
    productName: 'Stainless Steel Fasteners Kit',
    uom: 'Box',
    requestedQty: '5000.00',
    orderedQty: '0.00',
    cancelledQty: '250.00',
    pendingQty: '4750.00',
    status: 'Partially Cancelled',
    warehouse: 'Central Stores',
    batchNo: 'B-2403',
    remarks: 'Demand reduced',
  },
];

const productOptions = [
  { value: '', label: 'Select product' },
  { value: 'P-1001', label: 'P-1001 - Industrial Bearing Assembly' },
  { value: 'P-1002', label: 'P-1002 - Stainless Steel Fasteners Kit' },
  { value: 'P-1003', label: 'P-1003 - Hydraulic Seal Pack' },
];

const uomOptions = [
  { value: '', label: 'Select UOM' },
  { value: 'Unit', label: 'Unit' },
  { value: 'Box', label: 'Box' },
  { value: 'Pack', label: 'Pack' },
];

type StoryEditableStringField = Exclude<keyof StoryLine, 'status'>;

function updateField(row: StoryLine, field: StoryEditableStringField, value: string): StoryLine {
  return {
    ...row,
    [field]: value,
  };
}

function buildColumns(extraColumns = false): EditableGridColumn<StoryLine>[] {
  const columns: EditableGridColumn<StoryLine>[] = [
    { id: 'action', label: 'Action', kind: 'actions', width: 78, pinned: 'left', locked: true },
    {
      id: 'productCode',
      label: 'Product Code',
      kind: 'lookup',
      width: 228,
      pinned: 'left',
      locked: true,
      mobilePriority: 1,
      required: true,
      getValue: (row) => row.productCode,
      setValue: (row, value) => updateField(row, 'productCode', value),
      options: productOptions,
      lookupTitle: 'Select Product',
      searchPlaceholder: 'Search product code or name',
      searchable: true,
    },
    { id: 'productName', label: 'Product Name', kind: 'computed', width: 220, getValue: (row) => row.productName, readOnly: true, mobilePriority: 2 },
    { id: 'uom', label: 'UOM', kind: 'select', width: 128, getValue: (row) => row.uom, setValue: (row, value) => updateField(row, 'uom', value), options: uomOptions, required: true, mobilePriority: 3 },
    { id: 'requestedQty', label: 'Requested Qty', kind: 'number', width: 148, getValue: (row) => row.requestedQty, setValue: (row, value) => updateField(row, 'requestedQty', value), required: true, mobilePriority: 4 },
    { id: 'orderedQty', label: 'Ordered Qty', kind: 'computed', width: 148, getValue: (row) => row.orderedQty, readOnly: true },
    { id: 'cancelledQty', label: 'Cancelled Qty', kind: 'computed', width: 148, getValue: (row) => row.cancelledQty, readOnly: true },
    { id: 'pendingQty', label: 'Pending Qty', kind: 'computed', width: 148, getValue: (row) => row.pendingQty, readOnly: true, mobilePriority: 5 },
    {
      id: 'status',
      label: 'Status',
      kind: 'status',
      width: 172,
      getValue: (row) => row.status,
      readOnly: true,
      renderDisplay: (row) => <span className="brand-badge brand-badge--draft">{row.status}</span>,
    },
    { id: 'remarks', label: 'Remarks', kind: 'remarks', width: 240, maxLength: 500, getValue: (row) => row.remarks, setValue: (row, value) => updateField(row, 'remarks', value), placeholder: 'Add remarks...' },
  ];

  if (extraColumns) {
    columns.splice(
      5,
      0,
      { id: 'warehouse', label: 'Warehouse', kind: 'select', width: 168, getValue: (row) => row.warehouse, setValue: (row, value) => updateField(row, 'warehouse', value), options: [{ value: 'Main Store', label: 'Main Store' }, { value: 'Central Stores', label: 'Central Stores' }] },
      { id: 'batchNo', label: 'Batch No', kind: 'text', width: 148, getValue: (row) => row.batchNo, setValue: (row, value) => updateField(row, 'batchNo', value), placeholder: 'Batch' }
    );
  }

  return columns;
}

function StatefulGrid({
  forceMobileLayout = false,
  readOnly = false,
  extraColumns = false,
  errors,
  empty = false,
  width,
  longSummary = false,
}: {
  forceMobileLayout?: boolean;
  readOnly?: boolean;
  extraColumns?: boolean;
  errors?: Record<string, Record<string, string>>;
  empty?: boolean;
  width?: number;
  longSummary?: boolean;
}) {
  const [rows, setRows] = useState<StoryLine[]>(empty ? [] : initialRows);
  const columns = buildColumns(extraColumns);
  const requestedTotal = rows.reduce((sum, row) => sum + Number(row.requestedQty || 0), 0).toFixed(2);
  const pendingTotal = rows.reduce((sum, row) => sum + Number(row.pendingQty || 0), 0).toFixed(2);
  const cancellationCount = rows.filter((row) => row.status === 'Partially Cancelled').length;
  const attentionCount = Object.values(errors ?? {}).filter((rowErrors) => Object.values(rowErrors).some(Boolean)).length;
  const summaryItems = useMemo<React.ReactNode[]>(() => {
    const items: React.ReactNode[] = [
      `Requested ${requestedTotal}`,
      `Pending ${pendingTotal}`,
    ];

    if (cancellationCount > 0) {
      items.push(`${cancellationCount} ${cancellationCount === 1 ? 'cancelled line' : 'cancelled lines'}`);
    }

    if (longSummary) {
      items.push('Supplier allocation review pending for imported components and priority warehouse confirmation');
    }

    return items;
  }, [cancellationCount, longSummary, pendingTotal, requestedTotal]);

  return (
    <div style={{ width: width ? `${width}px` : '100%', padding: 24, background: 'var(--color-surface-subtle)' }}>
      <EditableTransactionGrid
        gridId="storybook-editable-transaction-grid"
        title="Product lines"
        summaryItems={summaryItems}
        attentionMessage={attentionCount > 0 ? `${attentionCount} ${attentionCount === 1 ? 'line needs' : 'lines need'} attention` : undefined}
        headerHelp="Tab from the last editable cell adds another line."
        showInstructionalHint
        primaryActionLabel="Add line"
        rows={rows}
        columns={columns}
        rowId={(row) => row.id}
        ariaLabel="Storybook editable product lines"
        forceMobileLayout={forceMobileLayout}
        readOnly={readOnly}
        errors={errors}
        onRowsChange={setRows}
        onAddRow={() => setRows((current) => [...current, { ...initialRows[0], id: `line-${current.length + 1}`, productCode: '', productName: '', requestedQty: '', pendingQty: '0.00', remarks: '' }])}
        onDuplicateRow={(_id, row) => setRows((current) => [...current, { ...row, id: `line-${current.length + 1}` }])}
        onDeleteRow={(id) => setRows((current) => current.filter((row) => row.id !== id))}
        isRowComplete={(row) => Boolean(row.productCode && row.uom && Number(row.requestedQty) > 0)}
        footerAggregates={{
          requestedQty: rows.reduce((sum, row) => sum + Number(row.requestedQty || 0), 0).toFixed(2),
          pendingQty: rows.reduce((sum, row) => sum + Number(row.pendingQty || 0), 0).toFixed(2),
        }}
        getMobileRowSummary={(row, { rowIndex, firstError }) => ({
          title: row.productCode ? `${row.productCode} - ${row.productName}` : `Line ${rowIndex + 1}`,
          subtitle: row.uom ? `UOM ${row.uom}` : 'Select product and UOM',
          status: <span className="brand-badge brand-badge--draft">{row.status}</span>,
          detail: firstError,
          metrics: [
            { label: 'Requested', value: row.requestedQty || '0.00' },
            { label: 'Pending', value: row.pendingQty },
          ],
        })}
      />
    </div>
  );
}

const meta: Meta = {
  title: 'Common/EditableTransactionGrid',
  component: EditableTransactionGrid,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj;

export const DesktopDenseTable: Story = {
  render: () => <StatefulGrid />,
};

export const TabletLandscape: Story = {
  render: () => <StatefulGrid width={920} extraColumns />,
};

export const TabletPortrait: Story = {
  render: () => <StatefulGrid width={768} extraColumns />,
};

export const MobileAdaptiveEditor: Story = {
  render: () => <StatefulGrid forceMobileLayout width={390} />,
};

export const MobileLandscape: Story = {
  render: () => <StatefulGrid forceMobileLayout width={640} extraColumns />,
};

export const ManyColumnOverflow: Story = {
  render: () => <StatefulGrid extraColumns />,
};

export const LongHeaderSummary: Story = {
  render: () => <StatefulGrid width={760} longSummary errors={{ 'line-1': { requestedQty: 'Requested quantity is required.' } }} />,
};

export const RowErrors: Story = {
  render: () => <StatefulGrid errors={{ 'line-1': { requestedQty: 'Requested quantity is required.' } }} />,
};

export const ReadOnlyDocument: Story = {
  render: () => <StatefulGrid readOnly />,
};

export const EmptyGrid: Story = {
  render: () => <StatefulGrid empty />,
};
