import type { Meta, StoryObj } from '@storybook/react';
import { SmartSidebar } from './index';
import type { SmartSidebarGroup } from './SmartSidebar.types';

// ─── Shared nav data ─────────────────────────────────────────────────────────

const ADMIN_GROUPS: SmartSidebarGroup[] = [
  {
    key: 'masters',
    label: 'Masters',
    dotColor: '#eb6a2c',
    collapsedIcon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
    items: [
      {
        key: 'org-master',
        label: 'Organisation Master',
        description: 'Legal entity, branches, and tax identifiers',
        path: '/admin/master/organisation-master',
      },
      {
        key: 'numbering-code-setup',
        label: 'Numbering & Code Setup',
        description: 'Document number sequences and prefixes',
        path: '/admin/master/numbering-code-setup',
      },
      {
        key: 'picklist-master',
        label: 'Picklist Master',
        description: 'Dropdown values and enumeration options',
        path: '/admin/master/picklist-master',
      },
      {
        key: 'kyc-setup',
        label: 'KYC Setup',
        description: 'Proof document verification rules',
        path: '/admin/master/kyc-setup',
      },
      {
        key: 'code-generation-policy',
        label: 'Code Generation Policy',
        description: 'Automatic ID generation configuration',
        path: '/admin/master/code-generation-policy',
      },
    ],
  },
  {
    key: 'finance',
    label: 'Finance & Pricing',
    dotColor: '#3b82f6',
    collapsedIcon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    items: [
      {
        key: 'tax-master',
        label: 'Tax Master',
        description: 'GST slabs, TDS, and tax rules',
        path: '/admin/finance/tax-master',
      },
      {
        key: 'currency-master',
        label: 'Currency Master',
        description: 'Supported currencies and exchange rates',
        path: '/admin/finance/currency-master',
      },
    ],
  },
];

const TOP_ITEM = {
  key: 'dashboard',
  label: 'Admin Dashboard',
  path: '/admin',
  icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  ),
};

const meta: Meta<typeof SmartSidebar> = {
  title: 'Experience/SmartSidebar',
  component: SmartSidebar,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', height: '600px', background: 'var(--color-surface-subtle)' }}>
        <Story />
        <div style={{ flex: 1, padding: '24px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
          Main content area
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SmartSidebar>;

// ─── Stories ─────────────────────────────────────────────────────────────────

export const Default: Story = {
  name: 'Default — expanded, no active path',
  args: {
    groups: ADMIN_GROUPS,
    topItem: TOP_ITEM,
    isCollapsed: false,
    onNavigate: (path, key) => console.log('Navigate:', path, key),
    onFavoriteToggle: (key) => console.log('Favorite toggle:', key),
  },
};

export const WithActivePath: Story = {
  name: 'With active route — KYC Setup',
  args: {
    groups: ADMIN_GROUPS,
    topItem: TOP_ITEM,
    activePath: '/admin/master/kyc-setup',
    isCollapsed: false,
    onNavigate: (path, key) => console.log('Navigate:', path, key),
  },
};

export const WithFavorites: Story = {
  name: 'With favourites pre-selected',
  args: {
    groups: ADMIN_GROUPS,
    topItem: TOP_ITEM,
    activePath: '/admin/master/organisation-master',
    isCollapsed: false,
    favoriteKeys: ['org-master', 'kyc-setup'],
    onNavigate: (path, key) => console.log('Navigate:', path, key),
    onFavoriteToggle: (key) => console.log('Favorite toggle:', key),
  },
};

export const WithRecentItems: Story = {
  name: 'With recently visited items',
  args: {
    groups: ADMIN_GROUPS,
    topItem: TOP_ITEM,
    activePath: '/admin/master/picklist-master',
    isCollapsed: false,
    recentItems: [
      { key: 'org-master', label: 'Organisation Master', path: '/admin/master/organisation-master' },
      { key: 'numbering-code-setup', label: 'Numbering & Code Setup', path: '/admin/master/numbering-code-setup' },
      { key: 'kyc-setup', label: 'KYC Setup', path: '/admin/master/kyc-setup' },
    ],
    onNavigate: (path, key) => console.log('Navigate:', path, key),
  },
};

export const Collapsed: Story = {
  name: 'Collapsed — icon-only mode',
  args: {
    groups: ADMIN_GROUPS,
    topItem: TOP_ITEM,
    activePath: '/admin/master/kyc-setup',
    isCollapsed: true,
    onNavigate: (path, key) => console.log('Navigate:', path, key),
  },
};
