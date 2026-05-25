import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { AdminConfigShell } from './AdminConfigShell';
import type { AdminConfigSectionItem } from './AdminConfigShell.types';

// ─── Shared section data ────────────────────────────────────────────────────

const KYC_SECTIONS: AdminConfigSectionItem[] = [
  {
    key: 'overview',
    label: 'Overview',
    description: 'Entity type, name, and configuration basis',
    completionStatus: 'complete',
  },
  {
    key: 'proof-rules',
    label: 'Proof Rules',
    description: 'Country-wise required proof documents',
    completionStatus: 'partial',
  },
  {
    key: 'verification',
    label: 'Verification',
    description: 'Verification mode and expiry handling',
    completionStatus: 'empty',
  },
  {
    key: 'history',
    label: 'History',
    description: 'Configuration change log',
    completionStatus: 'empty',
  },
];

const ORG_SECTIONS: AdminConfigSectionItem[] = [
  { key: 'identity', label: 'Identity', description: 'Legal name, registration, and entity type', completionStatus: 'complete' },
  { key: 'contact', label: 'Contact & Address', description: 'Primary address, phone, and email', completionStatus: 'complete' },
  { key: 'tax', label: 'Tax Identifiers', description: 'GST, VAT, and other tax registrations', completionStatus: 'partial' },
  { key: 'branches', label: 'Branches', description: 'Physical locations and virtual sites', completionStatus: 'empty' },
  { key: 'branding', label: 'Branding', description: 'Company logo and document header assets', completionStatus: 'empty' },
];

// ─── Wrapper with interactive section switching ──────────────────────────────

function ShellDemo({
  sections,
  initialSection,
  progress,
}: {
  sections: AdminConfigSectionItem[];
  initialSection: string;
  progress?: { completed: number; total: number };
}) {
  const [active, setActive] = useState(initialSection);
  const current = sections.find((s) => s.key === active);

  return (
    <div
      style={{
        height: '480px',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      <AdminConfigShell
        sections={sections}
        activeSection={active}
        onSectionChange={setActive}
        progress={progress}
      >
        <div
          style={{
            padding: '24px',
            background: 'var(--color-surface-subtle)',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            minHeight: '200px',
          }}
        >
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
            {current?.label ?? active}
          </p>
          {current?.description && (
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {current.description}
            </p>
          )}
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '12px', fontStyle: 'italic' }}>
            Section form content renders here. Click the nav to switch sections.
          </p>
        </div>
      </AdminConfigShell>
    </div>
  );
}

// ─── Meta ────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'Experience/AdminConfigShell',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

// ─── Stories ─────────────────────────────────────────────────────────────────

export const KycSetupMixed: Story = {
  name: 'KYC Setup — mixed completion',
  render: () => (
    <ShellDemo sections={KYC_SECTIONS} initialSection="overview" progress={{ completed: 1, total: 4 }} />
  ),
};

export const OrgMasterInProgress: Story = {
  name: 'Organisation Master — in progress',
  render: () => (
    <ShellDemo sections={ORG_SECTIONS} initialSection="tax" progress={{ completed: 2, total: 5 }} />
  ),
};

export const AllSectionsComplete: Story = {
  name: 'All sections complete',
  render: () => (
    <ShellDemo
      sections={KYC_SECTIONS.map((s) => ({ ...s, completionStatus: 'complete' as const }))}
      initialSection="overview"
      progress={{ completed: 4, total: 4 }}
    />
  ),
};

export const FreshConfiguration: Story = {
  name: 'Fresh configuration — nothing started',
  render: () => (
    <ShellDemo
      sections={ORG_SECTIONS.map((s) => ({ ...s, completionStatus: 'empty' as const }))}
      initialSection="identity"
      progress={{ completed: 0, total: 5 }}
    />
  ),
};

export const TwoSectionsNoProgress: Story = {
  name: 'Two sections — no progress bar',
  render: () => (
    <ShellDemo
      sections={[
        { key: 'prefixes', label: 'Code Prefixes', description: 'Numbering prefix configuration', completionStatus: 'complete' },
        { key: 'policy', label: 'Code Policy', description: 'Auto-generation and sequence rules', completionStatus: 'partial' },
      ]}
      initialSection="prefixes"
    />
  ),
};

export const WithAttentionBadge: Story = {
  name: 'Section with attention badge',
  render: () => (
    <ShellDemo
      sections={[
        { key: 'overview', label: 'Overview', description: 'Entity details', completionStatus: 'complete' },
        { key: 'proof-rules', label: 'Proof Rules', description: 'Document requirements', completionStatus: 'partial', badgeCount: 3 },
        { key: 'verification', label: 'Verification', description: 'Expiry and mode rules', completionStatus: 'empty' },
      ]}
      initialSection="proof-rules"
      progress={{ completed: 1, total: 3 }}
    />
  ),
};
