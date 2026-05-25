import type { Meta, StoryObj } from '@storybook/react';
import { AdminSetupAssistant } from './AdminSetupAssistant';
import type { AdminSetupItem } from './AdminSetupAssistant.types';

// ─── Shared data ─────────────────────────────────────────────────────────────

const FULL_SETUP_ITEMS: AdminSetupItem[] = [
  {
    id: 'organisation-master',
    label: 'Organisation Master',
    description: 'Configure legal entity, branches, tax identifiers, and branding assets.',
    status: 'complete',
    path: '/admin/master/organisation-master',
  },
  {
    id: 'numbering-code-setup',
    label: 'Numbering & Code Setup',
    description: 'Define document number sequences and code prefixes before users create records.',
    status: 'complete',
    path: '/admin/master/numbering-code-setup',
  },
  {
    id: 'picklist-master',
    label: 'Picklist Master',
    description: 'Prepare dropdown values and dependent selections used across transaction forms.',
    status: 'in-progress',
    path: '/admin/master/picklist-master',
  },
  {
    id: 'kyc-setup',
    label: 'KYC Setup',
    description: 'Set country-wise document verification requirements for parties and employees.',
    status: 'not-started',
    path: '/admin/master/kyc-setup',
  },
  {
    id: 'code-generation-policy',
    label: 'Code Generation Policy',
    description: 'Configure rules for automatic code and ID generation across entity types.',
    status: 'not-started',
    path: '/admin/master/code-generation-policy',
  },
];

const meta: Meta<typeof AdminSetupAssistant> = {
  title: 'Experience/AdminSetupAssistant',
  component: AdminSetupAssistant,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof AdminSetupAssistant>;

// ─── Stories ─────────────────────────────────────────────────────────────────

export const Default: Story = {
  name: 'Default — setup in progress',
  args: {
    title: 'Admin setup assistant',
    description: 'Complete the essential setup areas before users begin transaction work.',
    items: FULL_SETUP_ITEMS,
    onOpenItem: (item) => console.log('Open item:', item.id),
  },
};

export const FreshInstall: Story = {
  name: 'Fresh install — nothing started',
  args: {
    title: 'Admin setup assistant',
    description: 'Nothing has been configured yet. Start with Organisation Master.',
    items: FULL_SETUP_ITEMS.map((item) => ({ ...item, status: 'not-started' as const })),
    onOpenItem: (item) => console.log('Open item:', item.id),
  },
};

export const AllComplete: Story = {
  name: 'All complete — ready to activate',
  args: {
    title: 'Admin setup assistant',
    description: 'All setup areas are complete. You can now activate the configuration.',
    items: FULL_SETUP_ITEMS.map((item) => ({ ...item, status: 'complete' as const })),
    onOpenItem: (item) => console.log('Open item:', item.id),
  },
};

export const NeedsAttention: Story = {
  name: 'Needs attention — blockers present',
  args: {
    title: 'Admin setup assistant',
    description: 'Some areas need your attention before the setup can be activated.',
    items: [
      { ...FULL_SETUP_ITEMS[0], status: 'complete' },
      { ...FULL_SETUP_ITEMS[1], status: 'needs-attention' },
      { ...FULL_SETUP_ITEMS[2], status: 'needs-attention' },
      { ...FULL_SETUP_ITEMS[3], status: 'in-progress' },
      { ...FULL_SETUP_ITEMS[4], status: 'not-started' },
    ],
    onOpenItem: (item) => console.log('Open item:', item.id),
  },
};

export const MinimalItems: Story = {
  name: 'Minimal — two items only',
  args: {
    title: 'Quick setup',
    description: 'Configure these two items to get started.',
    items: [
      {
        id: 'org',
        label: 'Organisation Master',
        description: 'Legal entity name, GST number, and primary address.',
        status: 'complete',
        path: '/admin/master/organisation-master',
      },
      {
        id: 'numbering',
        label: 'Numbering Setup',
        description: 'Document number sequences and prefix format.',
        status: 'in-progress',
        path: '/admin/master/numbering-code-setup',
      },
    ],
    onOpenItem: (item) => console.log('Open item:', item.id),
  },
};
