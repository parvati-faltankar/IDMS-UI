import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { AdminListPageShell } from './AdminListPageShell';
import type { AdminListQuickFilter, AdminListSummaryItem } from './AdminListPageShell.types';

// ─── Mock data ────────────────────────────────────────────────────────────────

const SUMMARY_ITEMS: AdminListSummaryItem[] = [
  { label: 'Total',    value: 24 },
  { label: 'Active',   value: 19, tone: 'success' },
  { label: 'Draft',    value: 3,  tone: 'warning' },
  { label: 'Inactive', value: 2,  tone: 'danger'  },
];

const QUICK_FILTERS: AdminListQuickFilter[] = [
  { key: '', label: 'All', count: 24 },
  { key: 'Active', label: 'Active', count: 19 },
  { key: 'Draft', label: 'Draft', count: 3 },
  { key: 'Inactive', label: 'Inactive', count: 2 },
];

// ─── Mock table ───────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  Active: {
    background: 'color-mix(in srgb, #10b981 12%, var(--color-surface))',
    color: 'color-mix(in srgb, #10b981 80%, var(--color-text))',
  },
  Draft: {
    background: 'color-mix(in srgb, #f59e0b 10%, var(--color-surface))',
    color: 'color-mix(in srgb, #f59e0b 75%, var(--color-text))',
  },
  Inactive: {
    background: 'color-mix(in srgb, var(--color-danger) 8%, var(--color-surface))',
    color: 'var(--color-danger)',
  },
};

type MockRow = { code: string; name: string; entity: string; status: 'Active' | 'Draft' | 'Inactive' };

const MOCK_ROWS: MockRow[] = [
  { code: 'CGP-001', name: 'Sales Invoice — Auto',  entity: 'Sales Invoice',     status: 'Active'   },
  { code: 'CGP-002', name: 'Purchase Order — Seq',  entity: 'Purchase Order',    status: 'Active'   },
  { code: 'CGP-003', name: 'Delivery Note — Prefix', entity: 'Delivery Note',   status: 'Active'   },
  { code: 'CGP-004', name: 'Customer KYC — Yearly', entity: 'Customer KYC',      status: 'Draft'    },
  { code: 'CGP-005', name: 'Credit Note — Manual',  entity: 'Credit Note',       status: 'Inactive' },
  { code: 'CGP-006', name: 'Receipt Voucher — Auto', entity: 'Receipt Voucher',  status: 'Active'   },
];

function MockTable({ rows = MOCK_ROWS }: { rows?: MockRow[] }) {
  const COLS: React.CSSProperties['gridTemplateColumns'] = '100px 1fr 160px 90px 80px';
  const headerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: COLS,
    gap: '12px',
    padding: '9px 16px',
    background: 'var(--color-surface-subtle)',
    borderBottom: '1px solid var(--color-border)',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };
  const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: COLS,
    gap: '12px',
    padding: '11px 16px',
    alignItems: 'center',
    borderBottom: '1px solid var(--color-border)',
    fontSize: '13px',
    color: 'var(--color-text)',
    cursor: 'pointer',
  };

  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: '10px',
        overflow: 'hidden',
        background: 'var(--color-surface)',
      }}
    >
      <div style={headerStyle}>
        <span>Code</span>
        <span>Policy Name</span>
        <span>Entity</span>
        <span>Status</span>
        <span />
      </div>
      {rows.length === 0 ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            fontSize: '13px',
          }}
        >
          No records match the current filters.
        </div>
      ) : (
        rows.map((row, i) => (
          <div
            key={row.code}
            style={{
              ...rowStyle,
              borderBottom: i < rows.length - 1 ? '1px solid var(--color-border)' : 'none',
            }}
          >
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--color-primary)',
              }}
            >
              {row.code}
            </span>
            <span style={{ fontWeight: 600 }}>{row.name}</span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>{row.entity}</span>
            <span>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 9px',
                  borderRadius: '9999px',
                  ...STATUS_STYLES[row.status],
                }}
              >
                {row.status}
              </span>
            </span>
            <span
              style={{
                textAlign: 'right',
                color: 'var(--color-text-muted)',
                fontSize: '16px',
                letterSpacing: '0.1em',
              }}
            >
              ···
            </span>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Interactive wrapper ──────────────────────────────────────────────────────

function InteractiveShell(
  props: Omit<
    React.ComponentProps<typeof AdminListPageShell>,
    'searchValue' | 'onSearchChange' | 'activeQuickFilter' | 'onQuickFilterChange' | 'children'
  > & {
    withSearch?: boolean;
    withFilters?: boolean;
  },
) {
  const { withSearch, withFilters, ...rest } = props;
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');

  const filteredRows = MOCK_ROWS.filter((r) => {
    const matchSearch =
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase());
    const matchFilter = !filter || r.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <AdminListPageShell
      {...rest}
      searchValue={withSearch ? search : undefined}
      searchPlaceholder="Search code, name, entity…"
      onSearchChange={withSearch ? setSearch : undefined}
      quickFilterItems={withFilters ? QUICK_FILTERS : undefined}
      activeQuickFilter={withFilters ? filter : undefined}
      onQuickFilterChange={withFilters ? setFilter : undefined}
    >
      <MockTable rows={filteredRows} />
    </AdminListPageShell>
  );
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof AdminListPageShell> = {
  title: 'Experience/AdminListPageShell',
  component: AdminListPageShell,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof AdminListPageShell>;

// ─── Stories ─────────────────────────────────────────────────────────────────

/**
 * Default admin list: title, breadcrumb, primary action, and a table.
 * No summary stats or filter chips. Use this for simple lists.
 */
export const Default: Story = {
  name: 'Default admin list',
  render: () => (
    <InteractiveShell
      title="Currency Master"
      breadcrumbs={['Finance & Pricing']}
      primaryAction={{ label: 'New Currency', tone: 'primary', onClick: () => {} }}
      helpTopicId="admin-dashboard"
      onHelpClick={() => {}}
    />
  ),
};

/**
 * With summary stats: total, active, draft, inactive shown inline in the
 * SmartToolbar left segment. Compact numbers — not a large stats block.
 */
export const WithSummaryStats: Story = {
  name: 'With summary stats',
  render: () => (
    <InteractiveShell
      title="Code Generation Policy"
      description="Define how codes and numbers are auto-generated for each entity."
      breadcrumbs={['Documents & Templates']}
      primaryAction={{ label: 'New Policy', tone: 'primary', onClick: () => {} }}
      secondaryActions={[{ label: 'Export', onClick: () => {} }]}
      helpTopicId="code-generation-policy"
      onHelpClick={() => {}}
      summaryItems={SUMMARY_ITEMS}
      withSearch
    />
  ),
};

/**
 * With filters: quick-filter chips and an advanced filter button.
 * Chips and search sit in the same compact toolbar row as the summary stats.
 */
export const WithFilters: Story = {
  name: 'With filters',
  render: () => (
    <InteractiveShell
      title="Code Generation Policy"
      description="Define how codes and numbers are auto-generated for each entity."
      breadcrumbs={['Documents & Templates']}
      primaryAction={{ label: 'New Policy', tone: 'primary', onClick: () => {} }}
      secondaryActions={[{ label: 'Export', onClick: () => {} }]}
      helpTopicId="code-generation-policy"
      onHelpClick={() => {}}
      summaryItems={SUMMARY_ITEMS}
      withSearch
      withFilters
      advancedFilterActive={false}
      onAdvancedFilterClick={() => {}}
    />
  ),
};

/**
 * Empty state: no data rows. The table area renders a "no records" message.
 * Shows the full page structure with toolbar visible even when empty.
 */
export const EmptyState: Story = {
  name: 'Empty state',
  render: () => (
    <AdminListPageShell
      title="Charge Master"
      description="Configure surcharges and fees applied at the transaction level."
      breadcrumbs={['Finance & Pricing']}
      primaryAction={{ label: 'Add Charge', tone: 'primary', onClick: () => {} }}
      helpTopicId="admin-dashboard"
      onHelpClick={() => {}}
      summaryItems={[
        { label: 'Total', value: 0 },
        { label: 'Active', value: 0, tone: 'success' },
      ]}
      searchValue=""
      searchPlaceholder="Search charges…"
      onSearchChange={() => {}}
      quickFilterItems={[
        { key: '', label: 'All', count: 0 },
        { key: 'Active', label: 'Active', count: 0 },
      ]}
      activeQuickFilter=""
      onQuickFilterChange={() => {}}
    >
      <MockTable rows={[]} />
    </AdminListPageShell>
  ),
};

/**
 * Compact density: reduced padding in both the PageBar and SmartToolbar.
 * Use when vertical real estate is critical.
 */
export const CompactDensity: Story = {
  name: 'Compact density',
  render: () => (
    <InteractiveShell
      title="KYC Setup"
      description="Manage country-wise KYC document requirements per entity type."
      breadcrumbs={['Compliance']}
      density="compact"
      primaryAction={{ label: 'Add KYC Config', tone: 'primary', onClick: () => {} }}
      helpTopicId="kyc-setup"
      onHelpClick={() => {}}
      summaryItems={SUMMARY_ITEMS}
      withSearch
      withFilters
      onAdvancedFilterClick={() => {}}
    />
  ),
};

/**
 * Long title and multiple actions wrapping: verifies the title row
 * wraps gracefully without breaking the layout at desktop widths.
 */
export const LongTitleActionsWrapping: Story = {
  name: 'Long title and actions wrapping',
  render: () => (
    <InteractiveShell
      title="Numbering & Code Setup — Organisation-Level Configuration"
      description="Define prefix, suffix, padding, and reset cycle for each document type in the organisation."
      breadcrumbs={['Documents & Templates', 'Numbering']}
      primaryAction={{ label: 'Save Configuration', tone: 'primary', onClick: () => {} }}
      secondaryActions={[
        { label: 'Reset to Defaults', onClick: () => {} },
        { label: 'Export', onClick: () => {} },
        { label: 'Import', onClick: () => {} },
      ]}
      helpTopicId="numbering-code-setup"
      onHelpClick={() => {}}
      summaryItems={[
        { label: 'Configured', value: 12, tone: 'success' },
        { label: 'Pending',    value: 5,  tone: 'warning' },
        { label: 'Total',      value: 17 },
      ]}
      withSearch
      withFilters
      onAdvancedFilterClick={() => {}}
    />
  ),
};
