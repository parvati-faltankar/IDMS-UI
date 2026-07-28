import type { Meta, StoryObj } from '@storybook/react';
import CommonDataGrid from './CommonDataGrid';
import type { DataGridColumn } from './dataGridTypes';

type MockTransactionRow = {
  id: string;
  documentNumber: string;
  partyName: string;
  status: 'Draft' | 'Approved' | 'Cancelled';
  amount: number;
  owner: string;
};

const rows: MockTransactionRow[] = [
  { id: '1', documentNumber: 'PR-2025-00847', partyName: 'Techsupply Corp', status: 'Draft', amount: 128400, owner: 'Alex Kumar' },
  { id: '2', documentNumber: 'PO-2025-00021', partyName: 'Apex Industries', status: 'Approved', amount: 86400, owner: 'Neha Sharma' },
  { id: '3', documentNumber: 'SO-2025-00412', partyName: 'Global Supplies Ltd', status: 'Cancelled', amount: 42150, owner: 'Rohit Menon' },
];

const columns: DataGridColumn<MockTransactionRow>[] = [
  {
    id: 'documentNumber',
    label: 'Document No.',
    type: 'text',
    width: 160,
    hideable: false,
    getValue: (row) => row.documentNumber,
    renderCell: (row) => (
      <button type="button" className="catalogue-table__document-link">
        {row.documentNumber}
      </button>
    ),
  },
  {
    id: 'partyName',
    label: 'Party name',
    type: 'text',
    width: 200,
    getValue: (row) => row.partyName,
    renderCell: (row) => <span className="catalogue-table__truncate">{row.partyName}</span>,
  },
  {
    id: 'status',
    label: 'Status',
    type: 'status',
    width: 140,
    options: [
      { value: 'Draft', label: 'Draft' },
      { value: 'Approved', label: 'Approved' },
      { value: 'Cancelled', label: 'Cancelled' },
    ],
    getValue: (row) => row.status,
    renderCell: (row) => row.status,
  },
  {
    id: 'amount',
    label: 'Amount',
    type: 'number',
    width: 140,
    minWidth: 120,
    maxWidth: 180,
    getValue: (row) => row.amount,
    getExportValue: (row) => String(row.amount),
    renderCell: (row) => row.amount.toLocaleString('en-IN'),
  },
  {
    id: 'owner',
    label: 'Owner',
    type: 'text',
    width: 156,
    getValue: (row) => row.owner,
    renderCell: (row) => row.owner,
  },
];

const meta: Meta = {
  title: 'Common/CommonDataGrid',
  component: CommonDataGrid,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj;

export const TransactionCatalogueFoundation: Story = {
  render: () => (
    <div style={{ padding: '24px', background: 'var(--color-surface-subtle)' }}>
      <CommonDataGrid
        gridId="storybook-common-data-grid"
        rows={rows}
        columns={columns}
        rowId={(row) => row.id}
        ariaLabel="Example transaction catalogue table"
        chartTitle="Example transactions"
      />
    </div>
  ),
};