import type { Meta, StoryObj } from '@storybook/react';
import { SmartDrawer } from './SmartDrawer';

const meta: Meta<typeof SmartDrawer> = {
  title: 'Experience/SmartDrawer',
  component: SmartDrawer,
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    title: 'SmartDrawer',
    onClose: () => {},
  },
};
export default meta;

type Story = StoryObj<typeof SmartDrawer>;

export const Default: Story = {
  args: {
    title: 'Record Details',
    subtitle: 'Alpha Corp — generic master',
    statusLabel: 'Active',
    statusTone: 'active',
    width: 'lg',
    footerActions: [
      { label: 'Close',   tone: 'outline',  onClick: () => {} },
      { label: 'Edit',    tone: 'primary',  onClick: () => {} },
    ],
    children: (
      <div style={{ padding: '20px' }}>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Drawer body content goes here.</p>
      </div>
    ),
  },
};

export const LoadingState: Story = {
  args: {
    title: 'Loading Record…',
    subtitle: 'Fetching details',
    loading: true,
    width: 'lg',
    footerActions: [{ label: 'Close', tone: 'outline', onClick: () => {} }],
  },
};

export const DirtyState: Story = {
  args: {
    title: 'Edit Master',
    subtitle: 'Unsaved changes present',
    isDirty: true,
    width: 'md',
    footerActions: [
      { label: 'Cancel', tone: 'outline', onClick: () => {} },
      { label: 'Save',   tone: 'primary', onClick: () => {} },
    ],
    children: (
      <div style={{ padding: '20px' }}>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
          Close this drawer to trigger the dirty-state confirmation.
        </p>
      </div>
    ),
  },
};

export const NarrowSm: Story = {
  args: {
    title: 'Quick Filters',
    subtitle: 'Filter results',
    width: 'sm',
    footerActions: [
      { label: 'Reset',  tone: 'outline', onClick: () => {} },
      { label: 'Apply',  tone: 'primary', onClick: () => {} },
    ],
    children: (
      <div style={{ padding: '20px' }}>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Filter form fields here.</p>
      </div>
    ),
  },
};
