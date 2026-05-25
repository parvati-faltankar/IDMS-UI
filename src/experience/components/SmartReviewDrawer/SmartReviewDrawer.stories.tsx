import type { Meta, StoryObj } from '@storybook/react';
import { SmartReviewDrawer } from './SmartReviewDrawer';

const meta: Meta<typeof SmartReviewDrawer> = {
  title: 'Experience/SmartReviewDrawer',
  component: SmartReviewDrawer,
  parameters: { layout: 'fullscreen' },
  args: { open: true, onClose: () => {}, onConfirm: () => {} },
};
export default meta;

type Story = StoryObj<typeof SmartReviewDrawer>;

export const ActivationReview: Story = {
  args: {
    title:       'Activate Policy',
    subtitle:    'Review before activating Customer Master Code',
    description: 'Confirm all settings are correct before activating. Once active, critical fields will be locked.',
    summaryFields: [
      { label: 'Policy',   value: 'Customer Master Code' },
      { label: 'Code',     value: 'CGP-001' },
      { label: 'Module',   value: 'CRM' },
      { label: 'Entity',   value: 'Customer' },
      { label: 'Prefix',   value: 'CUST' },
      { label: 'Sample',   value: 'CUST-000001' },
    ],
    checklist: [
      { id: 'basic',   label: 'Policy name and display name filled', passed: true },
      { id: 'scope',   label: 'Module and entity specified',         passed: true },
      { id: 'prefix',  label: 'Prefix assigned',                     passed: true },
      { id: 'series',  label: 'Series type selected',                passed: true },
      { id: 'format',  label: 'Number format is complete',           passed: true },
      { id: 'preview', label: 'Sample code generates successfully',  passed: true },
    ],
    consequenceNote: 'Once activated, critical fields (prefix, series type, module, entity) will be locked to preserve code integrity.',
    confirmLabel:    'Confirm & Activate',
  },
};

export const WithFailedItems: Story = {
  args: {
    title: 'Activate Policy',
    subtitle: 'Not ready yet',
    checklist: [
      { id: 'basic',   label: 'Policy name filled',   passed: true },
      { id: 'prefix',  label: 'Prefix assigned',      passed: false, detail: 'Select a prefix in the Prefix Selection step.' },
      { id: 'format',  label: 'Number format complete', passed: false, detail: 'Sequence length and padding character are required.' },
    ],
    warningText:     'Complete the required fields before activating this policy.',
    confirmDisabled: false,
  },
};
