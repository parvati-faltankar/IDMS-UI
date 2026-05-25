import type { Meta, StoryObj } from '@storybook/react';
import { HelpDrawer } from './HelpDrawer';
import type { HelpTopic } from '../../help/helpTypes';

// ─── Inline help topic data ───────────────────────────────────────────────────
// Uses real IDMS domain content matching the production helpTopics.ts entries.

const ADMIN_DASHBOARD_TOPIC: HelpTopic = {
  id: 'admin-dashboard',
  title: 'How Admin Setup Works',
  summary:
    'Use Admin Setup to configure the foundation of the application before business users start working with transactions.',
  steps: [
    {
      title: 'Start with organisation setup',
      description: 'Confirm the legal entity, branch, contact, tax, and branding information first.',
    },
    {
      title: 'Configure numbering',
      description:
        'Set prefixes and numbering policies before users create documents or master records.',
    },
    {
      title: 'Prepare picklists',
      description: 'Define dropdown values and dependent selections used across forms.',
    },
    {
      title: 'Configure KYC rules',
      description:
        'Define country-wise proof requirements for customers, suppliers, employees, and partners.',
    },
    {
      title: 'Review roles and templates',
      description: 'Set access roles and print templates after the core setup is ready.',
    },
  ],
  tips: [
    'Use Save as Draft when a configuration is incomplete.',
    'Activate only after validation checks pass.',
    'Use Recently Visited to resume configuration quickly.',
  ],
  commonMistakes: [
    'Activating code policies before selecting a valid prefix.',
    'Creating transaction data before required picklists are ready.',
    'Leaving KYC proof rules inactive after configuration.',
  ],
  relatedTopics: ['organisation-master', 'numbering-code-setup', 'picklist-master', 'kyc-setup'],
};

const KYC_TOPIC: HelpTopic = {
  id: 'kyc-setup',
  title: 'How KYC Setup Works',
  summary:
    'KYC Setup lets you define which proof documents are required per entity type and country before a party record can be marked as verified.',
  steps: [
    {
      title: 'Select the entity type',
      description:
        'Choose whether these rules apply to customers, suppliers, employees, vendors, or partners.',
    },
    {
      title: 'Choose the country scope',
      description: 'Each rule set applies to a specific country or globally as a fallback.',
    },
    {
      title: 'Add required proof types',
      description: 'Define one or more document types such as PAN, Aadhaar, GST certificate, or passport.',
    },
    {
      title: 'Set expiry handling',
      description: 'Choose whether expired proofs block verification or trigger a warning.',
    },
    {
      title: 'Activate the configuration',
      description: 'Once all rules pass validation, activate the KYC configuration to make it live.',
    },
  ],
  tips: [
    'Test rules with a sample party record before activating.',
    'Keep at least one active proof rule per entity type.',
  ],
  commonMistakes: [
    'Leaving proof rules in draft state — they are ignored during verification.',
    'Overlapping country rules with conflicting requirements.',
  ],
  relatedTopics: ['organisation-master', 'admin-dashboard'],
};

const meta: Meta<typeof HelpDrawer> = {
  title: 'Experience/HelpDrawer',
  component: HelpDrawer,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof HelpDrawer>;

// ─── Stories ─────────────────────────────────────────────────────────────────

export const AdminDashboardHelp: Story = {
  name: 'Open — admin dashboard topic',
  args: {
    open: true,
    topic: ADMIN_DASHBOARD_TOPIC,
    onClose: () => {},
    onTopicChange: (id) => console.log('Navigate to topic:', id),
  },
};

export const KycSetupHelp: Story = {
  name: 'Open — KYC setup topic',
  args: {
    open: true,
    topic: KYC_TOPIC,
    onClose: () => {},
    onTopicChange: (id) => console.log('Navigate to topic:', id),
  },
};

export const NoTopicFallback: Story = {
  name: 'Open — no topic, fallback title',
  args: {
    open: true,
    topic: undefined,
    titleFallback: 'Help & Guidance',
    onClose: () => {},
  },
};

export const CustomFallbackTitle: Story = {
  name: 'Open — custom fallback title',
  args: {
    open: true,
    topic: undefined,
    titleFallback: 'KYC Setup Guide',
    onClose: () => {},
  },
};

export const MinimalTopic: Story = {
  name: 'Open — steps only, no tips or mistakes',
  args: {
    open: true,
    topic: {
      id: 'numbering-code-setup',
      title: 'How Numbering Setup Works',
      summary:
        'Numbering Setup defines document number sequences and prefix formats. ' +
        'Configure prefixes before users start creating transaction documents.',
      steps: [
        {
          title: 'Add a prefix',
          description: 'Define a short alphabetic code such as PO, SO, or GRN.',
        },
        {
          title: 'Set the series type',
          description: 'Choose Annual (resets yearly) or Perpetual (never resets).',
        },
        {
          title: 'Activate the prefix',
          description: 'Activate to make it available for document creation.',
        },
      ],
      relatedTopics: ['admin-dashboard'],
    },
    onClose: () => {},
    onTopicChange: (id) => console.log('Navigate to topic:', id),
  },
};

export const Closed: Story = {
  name: 'Closed — drawer not rendered',
  args: {
    open: false,
    topic: undefined,
    titleFallback: 'Help & Guidance',
    onClose: () => {},
  },
};
