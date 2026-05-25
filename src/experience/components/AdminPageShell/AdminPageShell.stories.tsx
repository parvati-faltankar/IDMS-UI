import type { Meta, StoryObj } from '@storybook/react';
import { AdminPageShell } from './AdminPageShell';

// ─── Mock toolbar used in multiple stories ────────────────────────────────────

const chipStyle = (active: boolean): React.CSSProperties => ({
  padding: '5px 12px',
  borderRadius: '999px',
  border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
  background: active ? 'color-mix(in srgb, var(--color-primary) 10%, var(--color-surface))' : 'var(--color-surface)',
  color: active ? 'var(--color-primary)' : 'var(--color-text)',
  fontSize: '12px',
  fontWeight: active ? 600 : 400,
  cursor: 'pointer',
});

const searchStyle: React.CSSProperties = {
  flex: '1 1 240px',
  maxWidth: '320px',
  height: '34px',
  padding: '0 12px',
  fontSize: '13px',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  outline: 'none',
};

function MockToolbar() {
  return (
    <>
      <input style={searchStyle} placeholder="Search records…" readOnly />
      <button type="button" style={chipStyle(true)}>All</button>
      <button type="button" style={chipStyle(false)}>Active</button>
      <button type="button" style={chipStyle(false)}>Draft</button>
      <button type="button" style={chipStyle(false)}>Inactive</button>
    </>
  );
}

function MockTableRow({ label }: { label: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 120px 80px 80px',
        gap: '12px',
        padding: '12px 16px',
        borderBottom: '1px solid var(--color-border)',
        fontSize: '13px',
        color: 'var(--color-text)',
        alignItems: 'center',
        cursor: 'pointer',
      }}
    >
      <span>{label}</span>
      <span style={{ color: 'var(--color-text-muted)' }}>Finance & Pricing</span>
      <span
        style={{
          padding: '2px 10px',
          borderRadius: '999px',
          background: 'color-mix(in srgb, #10b981 12%, var(--color-surface))',
          color: 'color-mix(in srgb, #10b981 85%, var(--color-text))',
          fontSize: '11px',
          fontWeight: 600,
          textAlign: 'center',
        }}
      >
        Active
      </span>
      <span style={{ color: 'var(--color-text-muted)', textAlign: 'right' }}>···</span>
    </div>
  );
}

function MockTable() {
  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 120px 80px 80px',
          gap: '12px',
          padding: '10px 16px',
          background: 'var(--color-surface-subtle)',
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        <span>Name</span>
        <span>Group</span>
        <span>Status</span>
        <span />
      </div>
      <MockTableRow label="Currency Master" />
      <MockTableRow label="KYC Setup" />
      <MockTableRow label="Charge Master" />
      <MockTableRow label="Pricing Module" />
    </div>
  );
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof AdminPageShell> = {
  title: 'Experience/AdminPageShell',
  component: AdminPageShell,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof AdminPageShell>;

// ─── Stories ─────────────────────────────────────────────────────────────────

/** Generic master list — the most common admin page pattern. */
export const GenericMasterList: Story = {
  name: 'Generic master list',
  args: {
    title: 'Currency Master',
    description: 'Define currencies and exchange rates used in pricing and transactions.',
    breadcrumbs: ['Finance & Pricing'],
    primaryAction: { label: 'New Currency', tone: 'primary', onClick: () => {} },
    secondaryActions: [{ label: 'Import', onClick: () => {} }],
    summaryItems: [
      { label: 'Total', value: 14 },
      { label: 'Active', value: 11 },
      { label: 'Inactive', value: 3 },
    ],
    toolbar: <MockToolbar />,
    children: <MockTable />,
  },
};

/** Configuration page — long form, no table, no summary strip. */
export const ConfigurationPage: Story = {
  name: 'Configuration page',
  args: {
    title: 'Numbering & Code Setup',
    description: 'Configure document numbering and auto-code generation rules.',
    breadcrumbs: ['Documents & Templates'],
    statusLabel: 'Draft',
    statusTone: 'draft',
    primaryAction: { label: 'Save Draft', tone: 'primary', onClick: () => {} },
    maxContentWidth: 780,
    children: (
      <div
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: '10px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: '6px' }}>
            Prefix
          </label>
          <input
            style={searchStyle}
            defaultValue="INV"
            readOnly
          />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: '6px' }}>
            Series type
          </label>
          <input style={searchStyle} defaultValue="Financial Year" readOnly />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: '6px' }}>
            Starting number
          </label>
          <input style={searchStyle} defaultValue="1001" readOnly />
        </div>
      </div>
    ),
  },
};

/** With summary — specialist page with custom metric strip. */
export const WithSummary: Story = {
  name: 'With summary strip',
  args: {
    title: 'Code Generation Policy',
    description: 'Define how codes and numbers are generated for each entity type.',
    breadcrumbs: ['Documents & Templates'],
    primaryAction: { label: 'New Policy', tone: 'primary', onClick: () => {} },
    summaryItems: [
      { label: 'Total',    value: 18 },
      { label: 'Active',   value: 12 },
      { label: 'Draft',    value: 4 },
      { label: 'Inactive', value: 2 },
    ],
    toolbar: <MockToolbar />,
    children: <MockTable />,
  },
};

/** With help — shows "How this works" button in PageHeader. */
export const WithHelp: Story = {
  name: 'With help wired',
  args: {
    title: 'KYC Setup',
    description: 'Configure proof document requirements by entity type and country.',
    breadcrumbs: ['Finance & Pricing'],
    helpTopicId: 'kyc-setup',
    onHelpClick: (id) => alert(`Open help: ${id}`),
    primaryAction: { label: 'New KYC Config', tone: 'primary', onClick: () => {} },
    summaryItems: [
      { label: 'Total',  value: 5 },
      { label: 'Active', value: 3 },
      { label: 'Draft',  value: 2 },
    ],
    toolbar: <MockToolbar />,
    children: <MockTable />,
  },
};

/** Setup health — warning strip for incomplete configuration. */
export const WithSetupHealth: Story = {
  name: 'With setup health warning',
  args: {
    title: 'Picklist Master',
    description: 'Manage dropdown values and enumeration options used across transaction forms.',
    breadcrumbs: ['Process & Checklists'],
    primaryAction: { label: 'New Picklist', tone: 'primary', onClick: () => {} },
    setupHealth: {
      tone: 'warning',
      message: 'Payment Terms and Delivery Mode picklists are missing. These are required before creating Sale Orders.',
      actionLabel: 'Add now',
      onAction: () => {},
    },
    summaryItems: [
      { label: 'Total',  value: 7 },
      { label: 'Active', value: 4 },
      { label: 'Draft',  value: 3 },
    ],
    toolbar: <MockToolbar />,
    children: <MockTable />,
  },
};

/** Empty state — no records, filtered or first use. */
export const EmptyState: Story = {
  name: 'Empty state',
  args: {
    title: 'Area Master',
    description: 'Define geographic areas and regions for sales and service territories.',
    breadcrumbs: ['Location & Territory'],
    primaryAction: { label: 'New Area', tone: 'primary', onClick: () => {} },
    summaryItems: [
      { label: 'Total',  value: 0 },
      { label: 'Active', value: 0 },
    ],
    toolbar: <MockToolbar />,
    children: (
      <div style={{ textAlign: 'center', padding: '60px 24px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--color-surface-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '22px',
            opacity: 0.4,
          }}
        >
          📍
        </div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
          No areas configured yet
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '20px', maxWidth: '320px', margin: '0 auto 20px' }}>
          Create your first area to define geographic regions used for territory assignment and service routing.
        </div>
        <button
          type="button"
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            background: 'var(--color-primary)',
            color: 'var(--color-primary-contrast)',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          New Area
        </button>
      </div>
    ),
  },
};
