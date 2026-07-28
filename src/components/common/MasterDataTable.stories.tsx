import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  createMasterActionsColumn,
  createMasterIdentifierColumn,
  createMasterStatusColumn,
  createMasterTextColumn,
  MasterDataTable,
  MasterTableBooleanValue,
  MasterTableMetric,
  MasterTablePill,
  MasterTableTruncate,
} from './MasterDataTable';
import type { DataGridColumn } from './dataGridTypes';

type MockMasterRow = {
  id: string;
  code: string;
  name: string;
  subtitle?: string;
  category: string;
  count: number;
  enabled: boolean;
  status: 'Draft' | 'Active' | 'Inactive';
};

const rows: MockMasterRow[] = [
  { id: '1', code: 'SRV-001', name: 'Installation Service', subtitle: 'Workshop service', category: 'Labour', count: 184, enabled: true, status: 'Active' },
  { id: '2', code: 'SRV-002', name: 'Roadside Assistance', subtitle: 'Warranty support', category: 'Support', count: 42, enabled: true, status: 'Draft' },
  { id: '3', code: 'SRV-003', name: 'Extended Protection Plan', subtitle: 'Subscription package', category: 'Subscription', count: 9, enabled: false, status: 'Inactive' },
];

const columns: DataGridColumn<MockMasterRow>[] = [
  createMasterIdentifierColumn<MockMasterRow>({
    id: 'code',
    label: 'Code',
    getValue: (row) => row.code,
    onClick: () => {},
  }),
  createMasterTextColumn<MockMasterRow>({
    id: 'name',
    label: 'Name',
    primary: (row) => row.name,
    secondary: (row) => row.subtitle,
    width: 260,
    minWidth: 220,
    hideable: false,
  }),
  {
    id: 'category',
    label: 'Category',
    type: 'text',
    width: 150,
    minWidth: 130,
    getValue: (row) => row.category,
    renderCell: (row) => <MasterTablePill label={row.category} tone="info" />,
  },
  {
    id: 'count',
    label: 'Count',
    type: 'number',
    width: 120,
    minWidth: 110,
    getValue: (row) => row.count,
    renderCell: (row) => (
      <MasterTableMetric
        value={row.count.toLocaleString()}
        tone={row.count > 100 ? 'success' : 'default'}
      />
    ),
  },
  {
    id: 'enabled',
    label: 'Enabled',
    type: 'boolean',
    width: 128,
    minWidth: 118,
    getValue: (row) => row.enabled,
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ],
    renderCell: (row) => <MasterTableBooleanValue value={row.enabled} />,
  },
  {
    id: 'notes',
    label: 'Notes',
    type: 'text',
    width: 200,
    minWidth: 160,
    getValue: (row) => row.subtitle || '',
    renderCell: (row) => <MasterTableTruncate value={row.subtitle || '-'} />,
  },
  createMasterStatusColumn<MockMasterRow>({
    getStatus: (row) => row.status,
  }),
  createMasterActionsColumn<MockMasterRow>({
    rowLabel: (row) => row.code,
    menuActions: () => [
      { label: 'Preview details', onSelect: () => {} },
      { label: 'Edit record', onSelect: () => {} },
    ],
  }),
];

const meta: Meta = {
  title: 'Common/MasterDataTable',
  component: MasterDataTable,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj;

export const DefaultMasterCatalogue: Story = {
  render: () => (
    <div style={{ padding: '24px', background: 'var(--color-surface-subtle)' }}>
      <MasterDataTable
        gridId="storybook-master-data-table"
        ariaLabel="Master records table"
        rows={rows}
        columns={columns}
        rowId={(row) => row.id}
        totalCount={rows.length}
        emptyState={{
          title: 'No records',
          description: 'Add your first master record to get started.',
          action: { label: 'Create Record', onClick: () => {} },
        }}
      />
    </div>
  ),
};
