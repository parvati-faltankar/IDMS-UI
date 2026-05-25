import type { Meta, StoryObj } from '@storybook/react';
import { SmartPreviewDrawer } from './SmartPreviewDrawer';

const meta: Meta<typeof SmartPreviewDrawer> = {
  title: 'Experience/SmartPreviewDrawer',
  component: SmartPreviewDrawer,
  parameters: { layout: 'fullscreen' },
  args: { open: true, onClose: () => {} },
};
export default meta;

type Story = StoryObj<typeof SmartPreviewDrawer>;

export const AdminMasterRecord: Story = {
  args: {
    title:       'Alpha Corp',
    subtitle:    'CUST-001 — Customer Master',
    statusLabel: 'Active',
    statusTone:  'active',
    summaryFields: [
      { label: 'Code',        value: 'CUST-001', mono: true },
      { label: 'Status',      value: 'Active' },
      { label: 'Created',     value: '01 Jan 2024' },
      { label: 'Updated',     value: '15 Mar 2024' },
    ],
    sections: [
      {
        title: 'Basic Information',
        fields: [
          { label: 'Name',        value: 'Alpha Corp', span: 2 },
          { label: 'Short Name',  value: 'ALPHA' },
          { label: 'Sort Order',  value: '1' },
          { label: 'Description', value: 'Primary customer — configured for system use', span: 2 },
        ],
      },
      {
        title: 'Group',
        fields: [
          { label: 'Group',       value: 'Organisation' },
          { label: 'Master Type', value: 'Customer Master' },
        ],
      },
    ],
    primaryAction:    { label: 'Edit', tone: 'primary', onClick: () => {} },
    secondaryActions: [{ label: 'Duplicate', tone: 'outline', onClick: () => {} }],
    dangerAction:     { label: 'Deactivate', tone: 'danger', onClick: () => {} },
  },
};

export const LoadingState: Story = {
  args: {
    title:   'Loading…',
    loading: true,
  },
};

export const EmptyState: Story = {
  args: {
    title:      'No Data',
    subtitle:   'Record not found',
    emptyLabel: 'No details are available for this record.',
  },
};
