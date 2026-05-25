import type { Meta, StoryObj } from '@storybook/react';
import { CommandPalette } from './index';
import type { CommandItem } from '../../navigation/navigationTypes';

// ─── Realistic command data ───────────────────────────────────────────────────

const ADMIN_COMMANDS: CommandItem[] = [
  {
    id: 'open-admin-dashboard',
    label: 'Open Admin Dashboard',
    description: 'Go to the admin overview and setup assistant.',
    actionType: 'navigate',
    path: '/admin',
    keywords: ['admin', 'dashboard', 'home', 'overview'],
  },
  {
    id: 'open-organisation-master',
    label: 'Open Organisation Master',
    description: 'Configure legal entity, branches, and tax details.',
    actionType: 'navigate',
    path: '/admin/master/organisation-master',
    keywords: ['organisation', 'company', 'entity', 'branch', 'tax'],
  },
  {
    id: 'open-kyc-setup',
    label: 'Open KYC Setup',
    description: 'Configure KYC document types and verification rules.',
    actionType: 'navigate',
    path: '/admin/master/kyc-setup',
    keywords: ['kyc', 'verification', 'identity', 'document'],
  },
  {
    id: 'open-picklist-master',
    label: 'Open Picklist Master',
    description: 'Manage dropdown options and enumeration values.',
    actionType: 'navigate',
    path: '/admin/master/picklist-master',
    keywords: ['picklist', 'dropdown', 'enum', 'values'],
  },
  {
    id: 'open-numbering-code-setup',
    label: 'Open Numbering & Code Setup',
    description: 'Configure document numbering sequences and prefixes.',
    actionType: 'navigate',
    path: '/admin/master/numbering-code-setup',
    keywords: ['numbering', 'code', 'sequence', 'prefix'],
  },
  {
    id: 'open-code-generation-policy',
    label: 'Open Code Generation Policy',
    description: 'Define rules for automatic code and ID generation.',
    actionType: 'navigate',
    path: '/admin/master/code-generation-policy',
    keywords: ['code generation', 'policy', 'auto', 'id'],
  },
  {
    id: 'help-admin-dashboard',
    label: 'Help: Admin Setup',
    description: 'Open the help guide for the admin dashboard.',
    actionType: 'open-help',
    helpTopicId: 'admin-dashboard',
    keywords: ['help', 'guide', 'admin'],
  },
  {
    id: 'help-organisation-master',
    label: 'Help: Organisation Master',
    description: 'Learn how to configure the organisation master record.',
    actionType: 'open-help',
    helpTopicId: 'organisation-master',
    keywords: ['help', 'guide', 'organisation'],
  },
];

const meta: Meta<typeof CommandPalette> = {
  title: 'Experience/CommandPalette',
  component: CommandPalette,
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    commands: ADMIN_COMMANDS,
    onClose: () => {},
    onExecute: (cmd) => console.log('Execute:', cmd.id),
  },
};

export default meta;
type Story = StoryObj<typeof CommandPalette>;

// ─── Stories ─────────────────────────────────────────────────────────────────

/** Full command list — navigate and help entries mixed. */
export const Open: Story = {
  name: 'Open — full command list',
};

/** Navigate commands only — no help entries. */
export const NavigateOnly: Story = {
  name: 'Open — navigate commands only',
  args: {
    commands: ADMIN_COMMANDS.filter((c) => c.actionType === 'navigate'),
  },
};

/** Help commands only — useful when wired to a page-level help button. */
export const HelpCommandsOnly: Story = {
  name: 'Open — help commands only',
  args: {
    commands: ADMIN_COMMANDS.filter((c) => c.actionType === 'open-help'),
  },
};

/** Short list — three commands, tests layout at minimum content. */
export const FewCommands: Story = {
  name: 'Open — three commands only',
  args: {
    commands: ADMIN_COMMANDS.slice(0, 3),
  },
};

/**
 * Empty — no commands registered. Shows the "No matching command found"
 * fallback. Useful to verify the empty state layout.
 */
export const EmptyState: Story = {
  name: 'Open — no commands registered',
  args: {
    commands: [],
  },
};

