import type { Meta, StoryObj } from '@storybook/react';
import { ValidationChecklist } from './ValidationChecklist';
import type { ValidationChecklistItem } from './ValidationChecklist.types';

// ─── Shared item sets ─────────────────────────────────────────────────────────

const KYC_ITEMS: ValidationChecklistItem[] = [
  {
    key: 'overview',
    label: 'Overview complete',
    detail: 'Entity type, name, and configuration basis are filled.',
    status: 'ok',
    sectionKey: 'overview',
  },
  {
    key: 'proof-rules',
    label: 'At least one active proof rule',
    detail: 'Add at least one proof document rule before activating.',
    status: 'error',
    sectionKey: 'proof-rules',
    errors: ['No proof rules defined for Customer / India', 'No proof rules defined for Supplier / India'],
  },
  {
    key: 'no-conflicts',
    label: 'No conflicting proof rules',
    detail: 'Country-specific rules must not overlap with global fallback rules.',
    status: 'warn',
    sectionKey: 'proof-rules',
  },
  {
    key: 'verification',
    label: 'Verification mode set',
    detail: 'Select a verification mode (strict or lenient) before activating.',
    status: 'error',
    sectionKey: 'verification',
    errors: ['Verification mode is required'],
  },
];

const ORG_ITEMS: ValidationChecklistItem[] = [
  {
    key: 'identity',
    label: 'Legal name and registration',
    detail: 'Company name and registration number are filled.',
    status: 'ok',
    sectionKey: 'identity',
  },
  {
    key: 'contact',
    label: 'Contact details',
    detail: 'Primary address, phone, and email are provided.',
    status: 'ok',
    sectionKey: 'contact',
  },
  {
    key: 'tax',
    label: 'Tax identifiers',
    detail: 'At least one tax registration number is required.',
    status: 'warn',
    sectionKey: 'tax',
  },
  {
    key: 'branches',
    label: 'Branch configuration',
    detail: 'At least one branch location is required.',
    status: 'ok',
    sectionKey: 'branches',
  },
];

const meta: Meta<typeof ValidationChecklist> = {
  title: 'Experience/ValidationChecklist',
  component: ValidationChecklist,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof ValidationChecklist>;

// ─── Stories ─────────────────────────────────────────────────────────────────

export const MixedStatuses: Story = {
  name: 'KYC Setup — errors and warnings',
  args: {
    items: KYC_ITEMS,
    onNavigateToSection: (key) => console.log('Navigate to section:', key),
  },
};

export const AllPassing: Story = {
  name: 'All checks passing',
  args: {
    items: ORG_ITEMS.map((item) => ({ ...item, status: 'ok' as const })),
    onNavigateToSection: (key) => console.log('Navigate to section:', key),
  },
};

export const CanActivate: Story = {
  name: 'All passing — can activate',
  args: {
    items: ORG_ITEMS.map((item) => ({ ...item, status: 'ok' as const })),
    canActivate: true,
    onNavigateToSection: (key) => console.log('Navigate to section:', key),
    onActivate: () => console.log('Activate clicked'),
  },
};

export const WithErrors: Story = {
  name: 'Organisation Master — with warnings',
  args: {
    items: ORG_ITEMS,
    onNavigateToSection: (key) => console.log('Navigate to section:', key),
  },
};

export const ReadOnly: Story = {
  name: 'Read-only view (activated record)',
  args: {
    items: ORG_ITEMS.map((item) => ({ ...item, status: 'ok' as const })),
    isReadOnly: true,
  },
};

export const CriticalErrors: Story = {
  name: 'Critical errors — cannot activate',
  args: {
    items: KYC_ITEMS,
    canActivate: false,
    onNavigateToSection: (key) => console.log('Navigate to section:', key),
    onActivate: () => console.log('Activate clicked'),
  },
};
