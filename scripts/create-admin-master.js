#!/usr/bin/env node
/**
 * create-admin-master.js
 *
 * Scaffolds a new admin master entry in IDMS-UI.
 *
 * Usage:
 *   node scripts/create-admin-master.js --key tax-master --label "Tax Master" \
 *     --group finance --description "Define tax types and applicable rates" \
 *     --type generic
 *
 * For specialized masters the script writes a ready-to-use page template at
 * src/admin/masters/{PascalKey}Page.tsx and prints route + help topic steps.
 * For generic masters it prints only the required manual edits (no page file
 * is created because MasterListPage / MasterFormPage handle the layout).
 */

import fs from 'node:fs';
import path from 'node:path';

// ─── CLI argument parsing ─────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {};
  let i = 2;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i += 2;
      } else {
        args[key] = true;
        i += 1;
      }
    } else {
      i += 1;
    }
  }
  return args;
}

// ─── Help text ────────────────────────────────────────────────────────────────

const HELP_TEXT = `
create-admin-master.js
======================
Scaffolds a new admin master for IDMS-UI.

REQUIRED ARGUMENTS
  --key         <kebab-key>    Unique master key (kebab-case).  e.g. tax-master
  --label       <string>       Display label (Title Case).      e.g. "Tax Master"
  --group       <group-key>    Admin nav group key.             e.g. finance
  --description <string>       One-sentence description.        e.g. "Define tax types and rates"
  --type        generic|specialized

OPTIONAL ARGUMENTS
  --help        Show this help message and exit.

MASTER TYPES
  generic
      • No page file created — MasterListPage and MasterFormPage handle the
        full list + form experience automatically.
      • You only need to: add an adminNavConfig.ts entry, add a help topic, and
        add the topic id to check-help-topics.js.

  specialized
      • Creates src/admin/masters/{PascalKey}Page.tsx with AdminPageShell wired.
      • Use for custom list/form pages that need custom columns or section tabs.
      • You additionally need to: add a route to src/routes/adminRoutes.tsx
        before the generic /:masterKey wildcard, and register the lazy import.

  guided
      • Creates src/admin/masters/{PascalKey}Page.tsx with the Compact Form Workspace
        layout (see docs/admin-page-structure-standard.md §10).
      • Use for forms with 4+ dependent steps and a Draft → Active lifecycle
        that locks generation-critical fields on activation.
      • Generates: compact header, workflow bar, scrollable body, fixed footer,
        stepStepState() gating, computeActivationChecklist(), activation confirm dialog.
      • You additionally need to: add a route to src/routes/adminRoutes.tsx
        before the generic /:masterKey wildcard, and register the lazy import.

AVAILABLE GROUPS
  organisation       business-partners  service        finance
  user-access        product-catalogue  complaint      document-code
  location           warehouse          process-checklist  workshop

EXAMPLES
  # Generic master (no page file)
  node scripts/create-admin-master.js \\
    --key tax-master --label "Tax Master" \\
    --group finance --description "Define tax types and applicable rates" \\
    --type generic

  # Specialized master (page template created)
  node scripts/create-admin-master.js \\
    --key warranty-policy --label "Warranty Policy" \\
    --group service --description "Configure warranty coverage rules for products" \\
    --type specialized
`;

// ─── Valid groups (from adminNavConfig.ts) ─────────────────────────────────────

const VALID_GROUPS = new Set([
  'organisation', 'user-access', 'location', 'business-partners',
  'product-catalogue', 'warehouse', 'service', 'complaint',
  'finance', 'document-code', 'process-checklist', 'workshop',
]);

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Convert kebab-case to PascalCase. */
function toPascal(kebab) {
  return kebab
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

/** Validate inputs and return a list of error strings. */
function validate(args) {
  const errors = [];
  if (!args.key) errors.push('--key is required');
  if (!args.label) errors.push('--label is required');
  if (!args.group) errors.push('--group is required');
  if (!args.description) errors.push('--description is required');
  if (!args.type) errors.push('--type is required (generic or specialized)');

  if (args.key && !/^[a-z][a-z0-9-]*$/.test(args.key)) {
    errors.push(`--key must be lowercase kebab-case (got: ${args.key})`);
  }
  if (args.group && !VALID_GROUPS.has(args.group)) {
    errors.push(`--group "${args.group}" is not a valid group key. Valid groups: ${[...VALID_GROUPS].join(', ')}`);
  }
  if (args.type && args.type !== 'generic' && args.type !== 'specialized' && args.type !== 'guided') {
    errors.push(`--type must be "generic", "specialized", or "guided" (got: ${args.type})`);
  }
  return errors;
}

// ─── Specialized page template ────────────────────────────────────────────────

/**
 * Returns the full content of a specialized admin master page.
 * This template is production-ready:
 *   - AdminListPageShell wired: title, description, breadcrumbs, helpTopicId,
 *     summaryItems (with tone), search, quickFilterItems, children
 *   - Smart 4-column CSS grid table (Identity | Context | Status | Actions)
 *     following the Smart Admin Table Standard (docs/admin-page-structure-standard.md §7)
 *   - Empty state for zero records
 *   - More menu with backdrop div (closes on outside click)
 *   - Form with segmented section tabs (Overview / Settings / Advanced)
 *   - HelpDrawer wired
 *   - No duplicate header, no second command search, no TODO-only sections
 */
function buildSpecializedPageTemplate({ key, label, description, group, pascal }) {
  const upperPrefix = key.split('-').map((w) => w[0].toUpperCase()).join('').slice(0, 4);

  return `import React, { useMemo, useState } from 'react';
import { MoreHorizontal, Plus } from 'lucide-react';
import AdminShell from '../AdminShell';
import { findGroupForMasterKey, findMasterByKey } from '../adminNavConfig';
import { recordRecentAdminMaster } from '../adminStorage';
import { AdminListPageShell } from '../../experience/components/AdminListPageShell';
import { AdminPageShell } from '../../experience/components/AdminPageShell';
import { HelpDrawer } from '../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../experience/help/helpTopics';

// ─── Constants ────────────────────────────────────────────────────────────────

const MASTER_KEY = '${key}';

// ─── Sections (update labels to match actual config sections) ─────────────────

type SectionKey = 'overview' | 'settings' | 'advanced';

const SECTIONS: Array<{ key: SectionKey; label: string }> = [
  { key: 'overview',  label: 'Overview' },
  { key: 'settings',  label: 'Settings' },
  { key: 'advanced',  label: 'Advanced' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface ${pascal}Record {
  id: string;
  code: string;
  name: string;
  description: string;
  status: 'Active' | 'Draft' | 'Inactive';
  createdDate: string;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_RECORDS: ${pascal}Record[] = [
  {
    id: '1',
    code: '${upperPrefix}-001',
    name: 'Default ${label} Configuration',
    description: '${description}',
    status: 'Active',
    createdDate: '2026-01-15',
  },
  {
    id: '2',
    code: '${upperPrefix}-002',
    name: 'Secondary ${label}',
    description: 'Additional configuration for extended scenarios.',
    status: 'Draft',
    createdDate: '2026-02-10',
  },
];

// ─── Status colours ────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  Active:   { bg: 'color-mix(in srgb, #10b981 12%, var(--color-surface))', text: '#065f46' },
  Draft:    { bg: 'color-mix(in srgb, #f59e0b 12%, var(--color-surface))', text: '#92400e' },
  Inactive: { bg: 'color-mix(in srgb, #6b7280 12%, var(--color-surface))', text: '#374151' },
};

// ─── Component ────────────────────────────────────────────────────────────────

const ${pascal}Page: React.FC = () => {
  const master = findMasterByKey(MASTER_KEY);
  const group  = findGroupForMasterKey(MASTER_KEY);

  const [records, setRecords]               = useState<${pascal}Record[]>(SEED_RECORDS);
  const [search, setSearch]                 = useState('');
  const [statusFilter, setStatusFilter]     = useState<'all' | 'Active' | 'Draft' | 'Inactive'>('all');
  const [activeSection, setActiveSection]   = useState<SectionKey>('overview');
  const [viewMode, setViewMode]             = useState<'list' | 'form'>('list');
  const [editingRecord, setEditingRecord]   = useState<${pascal}Record | null>(null);
  const [moreMenuId, setMoreMenuId]         = useState<string | null>(null);
  const [helpOpen, setHelpOpen]             = useState(false);
  const [helpTopicId, setHelpTopicId]       = useState(MASTER_KEY);

  // ── Derived ────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let result = records;
    if (statusFilter !== 'all') result = result.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q));
    }
    return result;
  }, [records, search, statusFilter]);

  const totals = useMemo(() => ({
    total:    records.length,
    active:   records.filter((r) => r.status === 'Active').length,
    draft:    records.filter((r) => r.status === 'Draft').length,
    inactive: records.filter((r) => r.status === 'Inactive').length,
  }), [records]);

  // ── Callbacks ──────────────────────────────────────────────────────────────

  React.useEffect(() => {
    if (master) recordRecentAdminMaster(master.key);
  }, [master]);

  function openAddForm() {
    setEditingRecord(null);
    setViewMode('form');
    setActiveSection('overview');
  }

  function openEditForm(record: ${pascal}Record) {
    setEditingRecord(record);
    setViewMode('form');
    setActiveSection('overview');
    setMoreMenuId(null);
  }

  function handleDelete(id: string) {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setMoreMenuId(null);
  }

  function handleSave() {
    if (!editingRecord) return;
    setRecords((prev) =>
      prev.some((r) => r.id === editingRecord.id)
        ? prev.map((r) => (r.id === editingRecord.id ? editingRecord : r))
        : [...prev, { ...editingRecord, id: String(Date.now()) }],
    );
    setViewMode('list');
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  function renderStatusChip(s: string) {
    const { bg, text } = STATUS_STYLE[s] ?? STATUS_STYLE['Inactive'];
    return (
      <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '9999px', background: bg, color: text }}>
        {s}
      </span>
    );
  }

  function renderList() {
    return (
      <AdminListPageShell
        title={master?.label ?? '${label}'}
        description="${description}"
        breadcrumbs={['Admin', group?.label ?? '']}
        primaryAction={{ label: 'New ${label}', tone: 'primary', onClick: openAddForm }}
        helpTopicId={MASTER_KEY}
        onHelpClick={(id) => { setHelpTopicId(id); setHelpOpen(true); }}
        summaryItems={[
          { label: 'Total',    value: totals.total },
          { label: 'Active',   value: totals.active,   tone: 'success' as const },
          { label: 'Draft',    value: totals.draft },
          { label: 'Inactive', value: totals.inactive, tone: 'danger'  as const },
        ]}
        searchValue={search}
        searchPlaceholder="Search ${label.toLowerCase()}\u2026"
        onSearchChange={setSearch}
        quickFilterItems={[
          { key: '',         label: 'All',      count: records.length },
          { key: 'Active',   label: 'Active',   count: totals.active },
          { key: 'Draft',    label: 'Draft',    count: totals.draft },
          { key: 'Inactive', label: 'Inactive', count: totals.inactive },
        ]}
        activeQuickFilter={statusFilter === 'all' ? '' : statusFilter}
        onQuickFilterChange={(k) => setStatusFilter((k || 'all') as typeof statusFilter)}
      >
        {/* Smart table \u2014 4-column decision grid per admin-page-structure-standard.md \u00a77 */}
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '64px 24px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            <Plus size={32} style={{ opacity: 0.3 }} />
            <div style={{ fontWeight: 600, fontSize: '14px' }}>No {master?.label ?? '${label}'} records found</div>
            <div style={{ fontSize: '13px' }}>
              {search || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Click "New ${label}" to create the first one.'}
            </div>
          </div>
        ) : (
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(160px, 2fr) minmax(180px, 2fr) 120px 56px', alignItems: 'center', padding: '8px 20px', background: 'var(--color-surface-subtle)', borderBottom: '1.5px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 1 }}>
              {[
                { label: 'Identity',   align: 'left'  },
                { label: 'Context',    align: 'left'  },
                { label: 'Status',     align: 'left'  },
                { label: 'Actions',    align: 'right' },
              ].map(({ label, align }) => (
                <div key={label} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textAlign: align as React.CSSProperties['textAlign'], textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {label}
                </div>
              ))}
            </div>
            {/* Data rows */}
            {filtered.map((record, idx) => {
              const isLast = idx === filtered.length - 1;
              return (
                <div
                  key={record.id}
                  style={{ display: 'grid', gridTemplateColumns: 'minmax(160px, 2fr) minmax(180px, 2fr) 120px 56px', alignItems: 'center', padding: '10px 20px', borderBottom: isLast ? 'none' : '1px solid var(--color-border)', transition: 'background 0.1s', cursor: 'pointer', minHeight: '62px' }}
                  onClick={() => openEditForm(record)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Identity: code + name */}
                  <div style={{ minWidth: 0, paddingRight: '12px' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.03em', marginBottom: '2px' }}>
                      {record.code}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {record.name}
                    </div>
                  </div>
                  {/* Context: description + created date */}
                  <div style={{ minWidth: 0, paddingRight: '12px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {record.description || '\u2014'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {record.createdDate}
                    </div>
                  </div>
                  {/* Status */}
                  <div>{renderStatusChip(record.status)}</div>
                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => setMoreMenuId(moreMenuId === record.id ? null : record.id)}
                        style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', lineHeight: 1, display: 'flex', alignItems: 'center' }}
                      >
                        <MoreHorizontal size={15} />
                      </button>
                      {moreMenuId === record.id && (
                        <>
                          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setMoreMenuId(null)} />
                          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 100, minWidth: '150px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', padding: '4px', overflow: 'hidden' }}>
                            <button type="button" onClick={() => openEditForm(record)} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left', padding: '7px 10px', fontSize: '13px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text)', borderRadius: '6px' }}>Edit</button>
                            <div style={{ height: '1px', background: 'var(--color-border)', margin: '3px 0' }} />
                            <button type="button" onClick={() => handleDelete(record.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left', padding: '7px 10px', fontSize: '13px', border: 'none', background: 'none', cursor: 'pointer', color: '#DC2626', borderRadius: '6px' }}>Delete</button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Footer */}
            <div style={{ padding: '10px 20px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
              {filtered.length} of {records.length} record{records.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </AdminListPageShell>
    );
  }

  function renderForm() {
    const isNew    = !editingRecord || !records.some((r) => r.id === editingRecord.id);
    const isActive = editingRecord?.status === 'Active';
    const isDraft  = !editingRecord || editingRecord.status === 'Draft';
    const currentCode = editingRecord?.code ?? 'New';

    const formRecord: ${pascal}Record = editingRecord ?? {
      id: '',
      code: '',
      name: '',
      description: '',
      status: 'Draft',
      createdDate: new Date().toISOString().slice(0, 10),
    };

    function update<K extends keyof ${pascal}Record>(field: K, value: ${pascal}Record[K]) {
      setEditingRecord((prev) => ({ ...(prev ?? formRecord), [field]: value }));
    }

    return (
      <AdminPageShell
        title={currentCode}
        description={formRecord.name || '${description}'}
        breadcrumbs={[group?.label ?? '', master?.label ?? '${label}']}
        statusLabel={editingRecord?.status}
        statusTone={isActive ? 'active' : isDraft ? 'draft' : 'neutral'}
        helpTopicId={MASTER_KEY}
        onHelpClick={(id) => { setHelpTopicId(id); setHelpOpen(true); }}
        primaryAction={
          !isActive
            ? { label: isNew ? 'Create' : 'Save', tone: 'primary' as const, onClick: handleSave }
            : { label: 'Save', tone: 'primary' as const, onClick: handleSave }
        }
        secondaryActions={[
          ...(!isNew && !isActive ? [{ label: 'Save Draft', tone: 'ghost' as const, onClick: () => { update('status', 'Draft'); handleSave(); } }] : []),
          ...(!isNew && !isActive ? [{ label: 'Activate', tone: 'ghost' as const, onClick: () => { update('status', 'Active'); handleSave(); } }] : []),
          { label: '${label} List', tone: 'ghost' as const, onClick: () => setViewMode('list') },
        ]}
        toolbar={
          <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
            {SECTIONS.map((s, i) => {
              const isActiveSection = activeSection === s.key;
              return (
                <button key={s.key} type="button" onClick={() => setActiveSection(s.key)}
                  style={{ padding: '6px 20px', fontSize: '13px', fontWeight: isActiveSection ? 600 : 400, border: 'none',
                    borderRight: i < SECTIONS.length - 1 ? '1px solid var(--color-border)' : 'none',
                    background: isActiveSection ? 'var(--color-primary)' : 'transparent',
                    color: isActiveSection ? 'white' : 'var(--color-text)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        }
      >
        {/* ── Overview section ─────────────────────────────────────────── */}
        {activeSection === 'overview' && (
          <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Code
              </label>
              <input
                type="text"
                value={formRecord.code}
                onChange={(e) => update('code', e.target.value)}
                placeholder="${upperPrefix}-001"
                style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Name
              </label>
              <input
                type="text"
                value={formRecord.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Descriptive name"
                style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Description
              </label>
              <textarea
                value={formRecord.description}
                onChange={(e) => update('description', e.target.value)}
                rows={3}
                placeholder="${description}"
                style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none', resize: 'vertical' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Status
              </label>
              <select
                value={formRecord.status}
                onChange={(e) => update('status', e.target.value as ${pascal}Record['status'])}
                style={{ padding: '8px 12px', fontSize: '13px', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none' }}
              >
                <option value="Draft">Draft</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        )}

        {/* ── Settings section ─────────────────────────────────────────── */}
        {activeSection === 'settings' && (
          <div style={{ maxWidth: '640px' }}>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              Add domain-specific settings fields for <strong>${label}</strong> here.
              Remove this placeholder once real fields are added.
            </p>
          </div>
        )}

        {/* ── Advanced section ─────────────────────────────────────────── */}
        {activeSection === 'advanced' && (
          <div style={{ maxWidth: '640px' }}>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              Add advanced configuration fields here (effective dates, visibility rules, etc.).
              Remove this placeholder once real fields are added.
            </p>
          </div>
        )}
      </AdminPageShell>
    );
  }

  return (
    <AdminShell>
      {viewMode === 'list' ? renderList() : renderForm()}
      {helpTopicId && getHelpTopic(helpTopicId) && (
        <HelpDrawer
          open={helpOpen}
          topicId={helpTopicId}
          onClose={() => setHelpOpen(false)}
          onTopicChange={setHelpTopicId}
        />
      )}
    </AdminShell>
  );
};

export default ${pascal}Page;
`;
}

// ─── Guided page template ─────────────────────────────────────────────────────

/**
 * Returns a starter page template that uses the Compact Form Workspace layout
 * (Guided Admin Create/Edit Standard — docs/admin-page-structure-standard.md §10).
 * Reference implementation: src/admin/masters/CodeGenerationPolicyPage.tsx (renderForm).
 */
function buildGuidedPageTemplate({ key, label, description, group, pascal }) {
  const upperPrefix = key.split('-').map((w) => w[0].toUpperCase()).join('').slice(0, 4);

  return `import React, { useMemo, useState } from 'react';
import { AlertCircle, Check, CheckCircle2, ChevronRight, Info, Lock, X } from 'lucide-react';
import AdminShell from '../AdminShell';
import { findGroupForMasterKey, findMasterByKey } from '../adminNavConfig';
import { recordRecentAdminMaster } from '../adminStorage';
import { AdminListPageShell } from '../../experience/components/AdminListPageShell';
import { HelpDrawer } from '../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../experience/help/helpTopics';

// ─── Constants ────────────────────────────────────────────────────────────────

const MASTER_KEY = '${key}';

/** Ordered steps for the guided create/edit workflow. Update keys and labels. */
type StepKey = 'basic' | 'config' | 'review';
const FORM_STEPS: StepKey[] = ['basic', 'config', 'review'];
const STEP_LABELS: Record<StepKey, string> = {
  basic:  'Basic Details',
  config: 'Configuration',
  review: 'Review',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ${pascal}Record {
  id: string;
  code: string;
  name: string;
  description: string;
  status: 'Draft' | 'Active' | 'Inactive';
}

// ─── Empty form ───────────────────────────────────────────────────────────────

const EMPTY_FORM: ${pascal}Record = {
  id: '',
  code: '',
  name: '',
  description: '',
  status: 'Draft',
};

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_RECORDS: ${pascal}Record[] = [
  { id: '1', code: '${upperPrefix}-001', name: 'Default ${label}', description: '${description}', status: 'Active' },
  { id: '2', code: '${upperPrefix}-002', name: 'Secondary ${label}', description: 'Additional configuration.', status: 'Draft' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Validate the form for a draft save. Returns an array of error strings. */
function validateForDraftSave(form: ${pascal}Record): string[] {
  const errors: string[] = [];
  if (!form.name.trim()) errors.push('Name is required.');
  return errors;
}

/** Validate the form for activation. Returns an array of error strings. */
function validateForActivation(form: ${pascal}Record, existing: ${pascal}Record[], editingId: string | null): string[] {
  const errors = validateForDraftSave(form);
  if (!form.code.trim()) errors.push('Code is required for activation.');
  const duplicate = existing.find(
    (r) => r.code === form.code && r.status === 'Active' && r.id !== editingId,
  );
  if (duplicate) errors.push(\`An Active record with code "\${form.code}" already exists.\`);
  return errors;
}

/** Compute the activation checklist. All items must pass to enable Activate. */
function computeActivationChecklist(form: ${pascal}Record) {
  return [
    { id: 'name',   label: 'Name is provided',   passed: !!form.name.trim() },
    { id: 'code',   label: 'Code is provided',   passed: !!form.code.trim() },
    // TODO: add domain-specific checklist items here
  ];
}

// ─── Status styles ────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  Active:   { bg: 'color-mix(in srgb, #10b981 12%, var(--color-surface))', text: '#065f46' },
  Draft:    { bg: 'color-mix(in srgb, #f59e0b 12%, var(--color-surface))', text: '#92400e' },
  Inactive: { bg: 'color-mix(in srgb, #6b7280 12%, var(--color-surface))', text: '#374151' },
};

// ─── Shared button styles ─────────────────────────────────────────────────────

const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '5px',
  padding: '6px 14px', borderRadius: '8px',
  fontSize: '12px', fontWeight: 500, cursor: 'pointer',
  whiteSpace: 'nowrap', transition: 'opacity 0.15s', border: 'none',
};
const btnPrimary: React.CSSProperties = {
  ...btnBase, background: 'var(--color-primary)', border: '1px solid var(--color-primary)', color: 'white', fontWeight: 600,
};
const btnOutline: React.CSSProperties = {
  ...btnBase, background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)',
};

// ─── Component ────────────────────────────────────────────────────────────────

const ${pascal}Page: React.FC = () => {
  const master = findMasterByKey(MASTER_KEY);
  const group  = findGroupForMasterKey(MASTER_KEY);

  // ── State ─────────────────────────────────────────────────────────────────

  const [records, setRecords]                   = useState<${pascal}Record[]>(SEED_RECORDS);
  const [viewMode, setViewMode]                 = useState<'list' | 'form'>('list');
  const [formMode, setFormMode]                 = useState<'add' | 'edit' | 'view'>('add');
  const [editingId, setEditingId]               = useState<string | null>(null);
  const [form, setForm]                         = useState<${pascal}Record>(EMPTY_FORM);
  const [activeSection, setActiveSection]       = useState<StepKey>('basic');
  const [activationErrors, setActivationErrors] = useState<string[]>([]);
  const [activateConfirmOpen, setActivateConfirmOpen] = useState(false);
  const [helpOpen, setHelpOpen]                 = useState(false);
  const [helpTopicId, setHelpTopicId]           = useState(MASTER_KEY);
  const [search, setSearch]                     = useState('');
  const [statusFilter, setStatusFilter]         = useState('');

  // ── Derived ───────────────────────────────────────────────────────────────

  const editingPolicy = records.find((r) => r.id === editingId) ?? null;
  const isViewOnly = formMode === 'view';
  const isActiveLocked = !isViewOnly && editingPolicy?.status === 'Active';

  const cgpHelpTopic = useMemo(() => getHelpTopic(MASTER_KEY), []);

  const checklist = useMemo(() => computeActivationChecklist(form), [form]);
  const checklistAllPassed = useMemo(() => checklist.every((i) => i.passed), [checklist]);
  const checklistFailCount = useMemo(() => checklist.filter((i) => !i.passed).length, [checklist]);

  const filtered = useMemo(() => {
    let r = records;
    if (statusFilter) r = r.filter((x) => x.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((x) => x.name.toLowerCase().includes(q) || x.code.toLowerCase().includes(q));
    }
    return r;
  }, [records, search, statusFilter]);

  // ── Callbacks ─────────────────────────────────────────────────────────────

  React.useEffect(() => {
    if (master) recordRecentAdminMaster(master.key);
  }, [master]);

  function setField<K extends keyof ${pascal}Record>(field: K, value: ${pascal}Record[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function isLocked(field: keyof ${pascal}Record): boolean {
    return isActiveLocked && ['code'].includes(field as string);
  }

  function openAddForm() {
    setEditingId(null);
    setFormMode('add');
    setForm(EMPTY_FORM);
    setActiveSection('basic');
    setActivationErrors([]);
    setViewMode('form');
  }

  function openEditForm(record: ${pascal}Record) {
    setEditingId(record.id);
    setFormMode('edit');
    setForm({ ...record });
    setActiveSection('basic');
    setActivationErrors([]);
    setViewMode('form');
  }

  function goBackToList() {
    setViewMode('list');
    setEditingId(null);
    setActivationErrors([]);
  }

  function handleSaveDraft() {
    const errors = validateForDraftSave(form);
    if (errors.length) { setActivationErrors(errors); return; }
    if (editingId) {
      setRecords((prev) => prev.map((r) => (r.id === editingId ? { ...form, status: 'Draft' } : r)));
    } else {
      const newId = String(Date.now());
      setRecords((prev) => [...prev, { ...form, id: newId, status: 'Draft', code: \`${upperPrefix}-\${prev.length + 1}\` }]);
    }
    goBackToList();
  }

  function handleActivate() {
    const errors = validateForActivation(form, records, editingId);
    if (errors.length) { setActivationErrors(errors); return; }
    setActivateConfirmOpen(true);
  }

  function confirmActivate() {
    if (editingId) {
      setRecords((prev) => prev.map((r) => (r.id === editingId ? { ...form, status: 'Active' } : r)));
    } else {
      const newId = String(Date.now());
      setRecords((prev) => [...prev, { ...form, id: newId, status: 'Active' }]);
    }
    setActivateConfirmOpen(false);
    goBackToList();
  }

  // ── Step helpers ──────────────────────────────────────────────────────────

  const stepIdx    = FORM_STEPS.indexOf(activeSection);
  const isOnReview = activeSection === 'review';

  /** Gate-aware step state. Update prerequisites for your domain. */
  function stepStepState(key: StepKey): 'inprogress' | 'complete' | 'partial' | 'notstarted' {
    if (key === activeSection) return 'inprogress';
    if (key === 'review')      return 'notstarted';
    // Basic: requires name
    if (key === 'basic') return form.name.trim() ? 'complete' : 'partial';
    // Config: requires basic to be complete first
    if (key === 'config') {
      if (!form.name.trim()) return 'notstarted';
      return form.code.trim() ? 'complete' : 'partial';
    }
    return 'notstarted';
  }

  const stepStateColors: Record<string, { bg: string; text: string; dot: string }> = {
    inprogress: { bg: 'var(--color-primary)', text: 'white',                dot: 'white' },
    complete:   { bg: '#DCFCE7',              text: '#15803D',               dot: '#16A34A' },
    partial:    { bg: '#DBEAFE',              text: '#1D4ED8',               dot: '#3B82F6' },
    notstarted: { bg: 'var(--color-surface-subtle)', text: 'var(--color-text-muted)', dot: '#CBD5E1' },
  };

  // ─── Render: list ──────────────────────────────────────────────────────────

  const renderList = () => (
    <AdminListPageShell
      title={master?.label ?? '${label}'}
      description="${description}"
      breadcrumbs={['Admin', group?.label ?? '']}
      primaryAction={{ label: 'New ${label}', tone: 'primary', onClick: openAddForm }}
      helpTopicId={MASTER_KEY}
      onHelpClick={(id) => { setHelpTopicId(id); setHelpOpen(true); }}
      summaryItems={[
        { label: 'Total',    value: records.length },
        { label: 'Active',   value: records.filter((r) => r.status === 'Active').length,   tone: 'success' as const },
        { label: 'Draft',    value: records.filter((r) => r.status === 'Draft').length },
        { label: 'Inactive', value: records.filter((r) => r.status === 'Inactive').length, tone: 'danger' as const },
      ]}
      searchValue={search}
      searchPlaceholder="Search ${label.toLowerCase()}\\u2026"
      onSearchChange={setSearch}
      quickFilterItems={[
        { key: '',         label: 'All',      count: records.length },
        { key: 'Active',   label: 'Active',   count: records.filter((r) => r.status === 'Active').length },
        { key: 'Draft',    label: 'Draft',    count: records.filter((r) => r.status === 'Draft').length },
        { key: 'Inactive', label: 'Inactive', count: records.filter((r) => r.status === 'Inactive').length },
      ]}
      activeQuickFilter={statusFilter}
      onQuickFilterChange={setStatusFilter}
    >
      {filtered.length === 0 ? (
        <div style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
            {records.length === 0 ? 'No ${label} records yet' : 'No records match the current filters'}
          </div>
          {records.length === 0 && (
            <button type="button" onClick={openAddForm} style={btnPrimary}>New ${label}</button>
          )}
        </div>
      ) : (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
          {filtered.map((record, idx) => {
            const { bg, text } = STATUS_STYLE[record.status] ?? STATUS_STYLE['Inactive'];
            return (
              <div
                key={record.id}
                style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 2fr) 1fr 120px 56px', alignItems: 'center', padding: '10px 20px', borderBottom: idx < filtered.length - 1 ? '1px solid var(--color-border)' : 'none', cursor: 'pointer', minHeight: '56px' }}
                onClick={() => openEditForm(record)}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>{record.code}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>{record.name}</div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{record.description || '\\u2014'}</div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '9999px', background: bg, color: text }}>{record.status}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button type="button" onClick={(e) => { e.stopPropagation(); openEditForm(record); }} style={{ ...btnOutline, padding: '4px 10px', fontSize: '11px' }}>Edit</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminListPageShell>
  );

  // ─── Render: form ──────────────────────────────────────────────────────────

  const renderForm = () => {
    const pageTitle =
      formMode === 'add'  ? 'New ${label}' :
      formMode === 'edit' ? 'Edit ${label}' :
                            editingPolicy?.name || '${label}';
    const pageDescription =
      isViewOnly          ? 'Read-only view' :
      isActiveLocked      ? 'Active record — some fields are locked' :
      formMode === 'add'  ? '${description}' :
                            'Update this record and activate when ready.';

    return (
      /* ── Compact Form Workspace ─────────────────────────────── */
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-surface)' }}>

        {/* ── 1. Compact Form Header ── */}
        <div style={{ flexShrink: 0, padding: '10px 24px', borderBottom: '1px solid var(--color-border)', minHeight: '64px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '2px', userSelect: 'none' }}>
              Admin / {group?.label} / {master?.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}>{pageTitle}</span>
              {editingPolicy?.status && (
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', ...STATUS_STYLE[editingPolicy.status] }}>
                  {editingPolicy.status.toUpperCase()}
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{pageDescription}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button type="button" onClick={goBackToList} style={btnOutline}>
              \\u2190 Back to ${label} List
            </button>
            <button type="button" onClick={() => { setHelpTopicId(MASTER_KEY); setHelpOpen(true); }} style={{ ...btnOutline, color: 'var(--color-text-muted)', borderColor: 'transparent' }}>
              How this works
            </button>
          </div>
        </div>

        {/* ── 2. Workflow Bar ── */}
        <div style={{ flexShrink: 0, height: '44px', padding: '0 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
          {FORM_STEPS.map((step, i) => {
            const state  = stepStepState(step);
            const colors = stepStateColors[state];
            return (
              <React.Fragment key={step}>
                {i > 0 && <ChevronRight size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />}
                <button
                  type="button"
                  onClick={() => !isViewOnly && setActiveSection(step)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: state === 'inprogress' ? 700 : 500, border: 'none', background: colors.bg, color: colors.text, cursor: isViewOnly ? 'default' : 'pointer', whiteSpace: 'nowrap', transition: 'all 0.1s' }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors.dot, flexShrink: 0 }} />
                  {STEP_LABELS[step]}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* ── 3. Scrollable Form Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px 24px', background: 'var(--color-surface-subtle)' }}>
          {activationErrors.length > 0 && (
            <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <AlertCircle size={14} style={{ color: '#DC2626', flexShrink: 0 }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#DC2626' }}>Validation Failed</span>
                <button type="button" onClick={() => setActivationErrors([])} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', cursor: 'pointer', color: '#DC2626' }}>
                  <X size={13} />
                </button>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                {activationErrors.map((e, i) => <li key={i} style={{ fontSize: '11px', color: '#991B1B' }}>{e}</li>)}
              </ul>
            </div>
          )}
          {isActiveLocked && (
            <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', display: 'flex', gap: '10px' }}>
              <Lock size={14} style={{ color: '#D97706', marginTop: '1px', flexShrink: 0 }} />
              <div style={{ fontSize: '12px', color: '#92400E' }}>This record is Active. Some fields are locked.</div>
            </div>
          )}

          {/* ── Basic Details ── */}
          {activeSection === 'basic' && (
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '11px 20px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>Basic Details</span>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                    Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text" value={form.name} onChange={(e) => setField('name', e.target.value)}
                    placeholder="Descriptive name" disabled={isLocked('name')}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '13px', border: '1px solid var(--color-border)', borderRadius: '10px', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>Description</label>
                  <textarea
                    value={form.description} onChange={(e) => setField('description', e.target.value)}
                    rows={2} disabled={isLocked('description')}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '13px', border: '1px solid var(--color-border)', borderRadius: '10px', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Configuration ── (TODO: replace with your domain fields) */}
          {activeSection === 'config' && (
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '11px 20px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>Configuration</span>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ padding: '12px 14px', background: 'var(--color-surface-subtle)', border: '1px dashed var(--color-border)', borderRadius: '8px', display: 'flex', gap: '10px' }}>
                  <Info size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginTop: '1px' }} />
                  <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    Replace this section with your domain-specific configuration fields.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── Review ── */}
          {activeSection === 'review' && (
            <div>
              <div style={{ marginBottom: '16px', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Summary</span>
                </div>
                <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: '8px', columnGap: '12px', alignItems: 'baseline' }}>
                  {[
                    { label: 'Name',        value: form.name || '\\u2014',        missing: !form.name },
                    { label: 'Code',        value: form.code || 'AUTO',           mono: !!form.code },
                    { label: 'Description', value: form.description || '\\u2014' },
                  ].map((row) => (
                    <React.Fragment key={row.label}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'right' }}>{row.label}</span>
                      <span style={{ fontSize: '13px', fontFamily: row.mono ? 'monospace' : undefined, color: row.missing ? '#DC2626' : 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {row.missing && <AlertCircle size={11} style={{ color: '#DC2626' }} />}
                        {row.value}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activation Checklist</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: checklistAllPassed ? '#15803D' : '#D97706' }}>
                    {checklistAllPassed ? 'Ready to activate' : \`\${checklistFailCount} item\${checklistFailCount !== 1 ? 's' : ''} need attention\`}
                  </span>
                </div>
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {checklist.map((item) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{ flexShrink: 0, color: item.passed ? '#16A34A' : '#D97706' }}>
                        {item.passed ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 4. Fixed Footer ── */}
        {!isViewOnly && (
          <div style={{ flexShrink: 0, height: '60px', padding: '0 24px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 50 }}>
            {stepIdx > 0 && (
              <button type="button" onClick={() => setActiveSection(FORM_STEPS[stepIdx - 1])} style={btnOutline}>\\u2190 Previous</button>
            )}
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginLeft: stepIdx > 0 ? '8px' : '0' }}>
              Step {stepIdx + 1} of {FORM_STEPS.length}
            </span>
            <div style={{ flex: 1 }} />
            <button type="button" onClick={handleSaveDraft} style={btnOutline}>Save Draft</button>
            {!isOnReview ? (
              <button type="button" onClick={() => setActiveSection(FORM_STEPS[stepIdx + 1])} style={btnPrimary}>
                Continue \\u2192
              </button>
            ) : (
              <button type="button" onClick={handleActivate} disabled={!checklistAllPassed} style={{ ...btnPrimary, opacity: checklistAllPassed ? 1 : 0.5, cursor: checklistAllPassed ? 'pointer' : 'not-allowed' }}>
                <Check size={13} /> Activate
              </button>
            )}
          </div>
        )}
        {isViewOnly && (
          <div style={{ flexShrink: 0, height: '56px', padding: '0 24px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button type="button" onClick={goBackToList} style={btnOutline}>\\u2190 Back to ${label} List</button>
            <button type="button" onClick={() => setFormMode('edit')} style={btnPrimary}>Edit</button>
          </div>
        )}
      </div>
    );
  };

  // ─── Render: activation confirm ────────────────────────────────────────────

  const renderActivateConfirm = () => {
    if (!activateConfirmOpen) return null;
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div onClick={() => setActivateConfirmOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
        <div style={{ position: 'relative', width: '480px', maxHeight: '90vh', background: 'var(--color-surface)', borderRadius: '16px', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>Activate ${label}?</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Review the settings before activating.</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            <div style={{ marginBottom: '16px', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '16px', display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: '8px', columnGap: '12px', alignItems: 'baseline' }}>
              {[
                { label: 'Name',  value: form.name },
                { label: 'Code',  value: form.code || '(auto-generated)' },
              ].map(({ label: l, value }) => (
                <React.Fragment key={l}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'right' }}>{l}</span>
                  <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>{value}</span>
                </React.Fragment>
              ))}
            </div>
            <div style={{ padding: '12px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', display: 'flex', gap: '8px' }}>
              <AlertCircle size={14} style={{ color: '#D97706', flexShrink: 0, marginTop: '1px' }} />
              <div style={{ fontSize: '12px', color: '#92400E', lineHeight: 1.5 }}>
                Once activated, this record will be live. Locked fields cannot be changed.
              </div>
            </div>
          </div>
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '10px', justifyContent: 'flex-end', flexShrink: 0 }}>
            <button type="button" onClick={() => setActivateConfirmOpen(false)} style={btnOutline}>Cancel</button>
            <button type="button" onClick={confirmActivate} style={btnPrimary}><Check size={13} /> Activate</button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Main return ───────────────────────────────────────────────────────────

  return (
    <AdminShell>
      {viewMode === 'list' ? renderList() : renderForm()}
      {renderActivateConfirm()}
      {cgpHelpTopic && (
        <HelpDrawer open={helpOpen} topic={cgpHelpTopic} onClose={() => setHelpOpen(false)} onTopicChange={(id) => setHelpTopicId(id)} />
      )}
    </AdminShell>
  );
};

export default ${pascal}Page;
`;
}

// ─── Step printer ─────────────────────────────────────────────────────────────

function printNextSteps({ key, label, group, description, pascal, type }) {
  const navEntry = `      m('${key}', '${label}', '${description}'),`;
  const helpEntry = `  {
    id: '${key}',
    title: '${label}',
    summary: '${description}.',
    steps: [
      {
        title: 'Navigate to the ${label} list',
        description: 'Open Admin → ${group.charAt(0).toUpperCase() + group.slice(1)} → ${label}.',
      },
      {
        title: 'Create a new record',
        description: 'Click "New ${label}" and fill in the required fields.',
      },
      {
        title: 'Activate the record',
        description: 'Set Status to Active once all fields are validated.',
      },
    ],
    tips: [
      'Save as Draft first if any required data is missing.',
      'Inactive records are hidden from transaction dropdowns.',
    ],
    commonMistakes: [
      'Activating a record before all required fields are set.',
    ],
    relatedTopics: ['admin-dashboard'],
  },`;

  console.log('');
  console.log('──────────────────────────────────────────────────────────────');
  console.log('  NEXT STEPS');
  console.log('──────────────────────────────────────────────────────────────');
  console.log('');

  console.log(`STEP 1 — Add to src/admin/adminNavConfig.ts`);
  console.log(`  Find the "${group}" group and add:`);
  console.log('');
  console.log(navEntry);
  console.log('');

  console.log(`STEP 2 — Add help topic to src/experience/help/helpTopics.ts`);
  console.log('  Append inside the helpTopics array:');
  console.log('');
  console.log(helpEntry);
  console.log('');

  console.log(`STEP 3 — Register help topic in scripts/check-help-topics.js`);
  console.log(`  Add '${key}' to the REQUIRED_TOPICS array.`);
  console.log('');

  if (type === 'specialized' || type === 'guided') {
    console.log(`STEP 4 — Register route in src/routes/adminRoutes.tsx`);
    console.log('  Add the lazy import near the top of the file:');
    console.log('');
    console.log(`    const ${pascal}Page = React.lazy(() => import('../admin/masters/${pascal}Page'));`);
    console.log('');
    console.log('  Add the route BEFORE the generic /:masterKey wildcard:');
    console.log('');
    console.log(`    {/* ${label} — ${type} master */}`);
    console.log(`    <Route path="/admin/master/${key}" element={<${pascal}Page />} />`);
    console.log('');
    if (type === 'guided') {
      console.log(`STEP 5 — Customise the generated guided form template:`);
      console.log(`  - Replace the placeholder 'config' step with your domain fields`);
      console.log(`  - Update computeActivationChecklist() with domain-specific validation`);
      console.log(`  - Update EMPTY_FORM with all required fields`);
      console.log(`  - Update buildSamplePreview() if the form generates an output code`);
      console.log('');
      console.log(`STEP 6 — Run governance to verify everything is wired:`);
    } else {
      console.log(`STEP 5 — Run governance to verify everything is wired:`);
    }
  } else {
    console.log(`STEP 4 — Run governance to verify everything is wired:`);
  }

  console.log('');
  console.log('    npm run ui:governance');
  console.log('');
  console.log('──────────────────────────────────────────────────────────────');
  console.log('');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const args = parseArgs(process.argv);

if (args.help) {
  console.log(HELP_TEXT);
  process.exit(0);
}

const errors = validate(args);
if (errors.length) {
  console.error('');
  console.error('✗ create-admin-master: invalid arguments');
  errors.forEach((e) => console.error(`  - ${e}`));
  console.error('');
  console.error('Run with --help for usage information.');
  console.error('');
  process.exit(1);
}

const { key, label, group, description, type } = args;
const pascal = toPascal(key);
const ROOT = process.cwd();

console.log('');
console.log(`  Admin Master Generator`);
console.log(`  ──────────────────────────────────────`);
console.log(`  Key:         ${key}`);
console.log(`  Label:       ${label}`);
console.log(`  Group:       ${group}`);
console.log(`  Type:        ${type}`);
console.log(`  PascalName:  ${pascal}Page`);
console.log('');

if (type === 'specialized' || type === 'guided') {
  const mastersDir = path.join(ROOT, 'src', 'admin', 'masters');
  const outFile    = path.join(mastersDir, `${pascal}Page.tsx`);

  if (fs.existsSync(outFile)) {
    console.error(`✗ File already exists: src/admin/masters/${pascal}Page.tsx`);
    console.error('  Delete it first if you want to regenerate.');
    console.error('');
    process.exit(1);
  }

  if (!fs.existsSync(mastersDir)) {
    fs.mkdirSync(mastersDir, { recursive: true });
  }

  const content =
    type === 'guided'
      ? buildGuidedPageTemplate({ key, label, description, group, pascal })
      : buildSpecializedPageTemplate({ key, label, description, group, pascal });
  fs.writeFileSync(outFile, content, 'utf8');

  console.log(`✓ Created: src/admin/masters/${pascal}Page.tsx`);
  if (type === 'guided') {
    console.log(`  Compact Form Workspace wired with:`);
    console.log(`    - Compact Form Header (breadcrumb, title, Back to List, How this works)`);
    console.log(`    - Workflow Bar with step pills (basic → config → review)`);
    console.log(`    - Scrollable Form Body (flex:1, overflow-y:auto)`);
    console.log(`    - Fixed Footer (flexShrink:0, height:60px) with Prev/Save Draft/Continue/Activate`);
    console.log(`    - stepStepState() gating function`);
    console.log(`    - computeActivationChecklist() + activation confirmation dialog`);
    console.log(`    - HelpDrawer wired`);
    console.log(`    - AdminListPageShell list view`);
    console.log(`  Next: replace placeholder 'config' section with your domain fields.`);
  } else {
    console.log(`  AdminPageShell wired with:`);
    console.log(`    - title, description, breadcrumbs`);
    console.log(`    - helpTopicId="${key}"`);
    console.log(`    - summaryItems (Total / Active / Draft / Inactive)`);
    console.log(`    - toolbar (search + status filter chips)`);
    console.log(`    - 3-section form toolbar (Overview / Settings / Advanced)`);
    console.log(`    - Record list table with More menu`);
    console.log(`    - Add / Edit form with status tracking`);
    console.log(`    - HelpDrawer wired`);
  }
  console.log('');
} else {
  console.log(`ℹ  Generic master — no page file created.`);
  console.log(`   MasterListPage and MasterFormPage handle the layout automatically.`);
  console.log('');
}

printNextSteps({ key, label, group, description, pascal, type });
