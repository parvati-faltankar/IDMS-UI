import type { Meta, StoryObj } from '@storybook/react';
import { PageHeader } from './PageHeader';

const meta: Meta<typeof PageHeader> = {
  title: 'Experience/PageHeader',
  component: PageHeader,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

// ─── Stories ─────────────────────────────────────────────────────────────────

export const TitleOnly: Story = {
  name: 'Title only',
  args: {
    title: 'Organisation Master',
  },
};

export const WithDescription: Story = {
  name: 'With description',
  args: {
    title: 'KYC Setup',
    description: 'Configure proof document requirements by entity type and country.',
  },
};

export const WithBreadcrumbs: Story = {
  name: 'With breadcrumbs',
  args: {
    title: 'KYC Setup',
    description: 'Configure proof document requirements by entity type and country.',
    breadcrumbs: ['Admin', 'Masters', 'KYC Setup'],
  },
};

export const ActiveStatus: Story = {
  name: 'Active status badge',
  args: {
    title: 'Organisation Master',
    description: 'Legal entity and branch configuration.',
    breadcrumbs: ['Admin', 'Masters'],
    statusLabel: 'Active',
    statusTone: 'active',
  },
};

export const DraftStatus: Story = {
  name: 'Draft status badge',
  args: {
    title: 'Code Generation Policy',
    description: 'Automatic ID generation rules for all entity types.',
    breadcrumbs: ['Admin', 'Masters'],
    statusLabel: 'Draft',
    statusTone: 'draft',
  },
};

export const WarningStatus: Story = {
  name: 'Warning status — attention needed',
  args: {
    title: 'Picklist Master',
    description: 'Manage dropdown values and enumeration options.',
    breadcrumbs: ['Admin', 'Masters'],
    statusLabel: 'Needs attention',
    statusTone: 'warning',
  },
};

export const DangerStatus: Story = {
  name: 'Danger status — blocked',
  args: {
    title: 'Code Generation Policy',
    description: 'Automatic ID generation rules for all entity types.',
    breadcrumbs: ['Admin', 'Masters'],
    statusLabel: 'Blocked',
    statusTone: 'danger',
  },
};

export const NeutralStatus: Story = {
  name: 'Neutral status — inactive',
  args: {
    title: 'Tax Master',
    description: 'GST slabs, TDS, and other tax registrations.',
    breadcrumbs: ['Admin', 'Finance'],
    statusLabel: 'Inactive',
    statusTone: 'neutral',
  },
};

export const WithPrimaryAction: Story = {
  name: 'With primary action',
  args: {
    title: 'KYC Setup',
    description: 'Configure proof document requirements by entity type and country.',
    breadcrumbs: ['Admin', 'Masters'],
    statusLabel: 'Draft',
    statusTone: 'draft',
    primaryAction: { label: 'Activate', tone: 'primary', onClick: () => {} },
  },
};

export const FullFeatured: Story = {
  name: 'Full featured — breadcrumbs, status, and actions',
  args: {
    title: 'Organisation Master',
    description: 'Configure the legal entity, branch locations, tax identifiers, and branding assets.',
    breadcrumbs: ['Admin', 'Masters', 'Organisation Master'],
    statusLabel: 'Active',
    statusTone: 'active',
    primaryAction: { label: 'Edit', tone: 'primary', onClick: () => {} },
    secondaryActions: [
      { label: 'View History', tone: 'secondary', onClick: () => {} },
      { label: 'Help', tone: 'ghost', onClick: () => {} },
    ],
    helpTopicId: 'organisation-master',
    onHelpClick: (id) => console.log('Help clicked:', id),
  },
};
