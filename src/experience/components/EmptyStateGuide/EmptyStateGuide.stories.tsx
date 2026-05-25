import type { Meta, StoryObj } from '@storybook/react';
import { EmptyStateGuide } from './EmptyStateGuide';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof EmptyStateGuide> = {
  title: 'Experience/EmptyStateGuide',
  component: EmptyStateGuide,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EmptyStateGuide>;

// ─── Stories ─────────────────────────────────────────────────────────────────

/** Default — proof rules section is empty, user needs to act. */
export const Default: Story = {
  name: 'Default — KYC proof rules empty',
  args: {
    title: 'No proof rules configured',
    description:
      'Add at least one active proof rule before activating this KYC configuration. ' +
      'Each rule defines a required document type per country and entity type.',
    primaryActionLabel: 'Add proof rule',
    secondaryActionLabel: 'How this works',
    onPrimaryAction: () => console.log('Add proof rule'),
    onSecondaryAction: () => console.log('Open help'),
  },
};

/** First-use — fresh install, nothing configured at all. */
export const FreshInstall: Story = {
  name: 'First use — nothing configured',
  args: {
    title: 'No picklist values yet',
    description:
      'Picklist values define the dropdown options available across transaction forms. ' +
      'Start by adding values for the most commonly used fields such as Payment Terms and Delivery Mode.',
    primaryActionLabel: 'Add first value',
    onPrimaryAction: () => console.log('Add value'),
  },
};

/** In-progress — section has data elsewhere but this sub-section is empty. */
export const SectionEmpty: Story = {
  name: 'Section empty — branches not added',
  args: {
    title: 'No branches configured',
    description:
      'The organisation master requires at least one branch location before it can be activated. ' +
      'Branches are used to assign inventory sites, documents, and reporting regions.',
    primaryActionLabel: 'Add branch',
    secondaryActionLabel: 'Learn about branches',
    onPrimaryAction: () => console.log('Add branch'),
    onSecondaryAction: () => console.log('Open help'),
  },
};

/** Read-only / locked — user cannot add anything in this state. */
export const ReadOnly: Story = {
  name: 'Read-only — no actions available',
  args: {
    title: 'No numbering prefixes defined',
    description:
      'Numbering prefixes have not been configured for this document type. ' +
      'Contact your system administrator to define the prefix before creating documents.',
  },
};

/** Compact — used inside section tabs with limited vertical space. */
export const Compact: Story = {
  name: 'Compact — inside section panel',
  args: {
    title: 'No verification rules',
    description: 'Verification mode has not been set. Select a mode to continue.',
    primaryActionLabel: 'Set verification mode',
    onPrimaryAction: () => console.log('Set mode'),
    compact: true,
  },
};

/** With both actions — primary CTA and a contextual help link. */
export const WithBothActions: Story = {
  name: 'With both actions — currency master',
  args: {
    title: 'No currencies added',
    description:
      'Add the currencies your organisation transacts in. ' +
      'The base currency is used for all reporting and must be set first.',
    primaryActionLabel: 'Add currency',
    secondaryActionLabel: 'View currency guide',
    onPrimaryAction: () => console.log('Add currency'),
    onSecondaryAction: () => console.log('Open help'),
  },
};

/** Minimal — title and description only, no actions. */
export const Minimal: Story = {
  name: 'Minimal — description only',
  args: {
    title: 'No change history',
    description:
      'Changes to this configuration will appear here after the first save.',
  },
};
