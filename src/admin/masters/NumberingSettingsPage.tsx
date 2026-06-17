import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Edit2, Hash, Plus, Save, Trash2, X } from 'lucide-react';
import AdminShell from '../AdminShell';
import { findGroupForMasterKey, findMasterByKey } from '../adminNavConfig';
import { recordRecentAdminMaster } from '../adminStorage';
import { AdminListPageShell } from '../../experience/components/AdminListPageShell';
import { HelpDrawer } from '../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../experience/help/helpTopics';

// ─── Constants ────────────────────────────────────────────────────────────────

const MASTER_KEY = 'numbering-code-setup';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PrefixEntry {
  id: string;
  prefixCode: string;
  prefixName: string;
  displayName: string;
  applicableFor: string;
  module: string;
  entity: string;
  entityType: string;
  prefixValue: string;
  defaultPrefix: boolean;
  activeStatus: boolean;
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
}

interface CodeGenEntry {
  id: string;
  // Identity
  settingCode: string;
  settingName: string;
  displayName: string;
  description: string;
  applicableFor: string;
  module: string;
  entity: string;
  entityType: string;
  prefix: string;
  // Series
  seriesType: string;
  seriesYearBasis: string;
  seriesYearLength: string;
  // Number
  numberLength: string;
  startingNumber: string;
  currentNumber: string;
  nextNumber: string;
  incrementBy: string;
  // Formatting
  paddingRequired: boolean;
  paddingCharacter: string;
  alignmentType: string;
  concatenationCharacter: string;
  // Reset
  resetRequired: boolean;
  resetFrequency: string;
  resetNumberTo: string;
  numberConsumptionEvent: string;
  // Validity
  activeStatus: boolean;
  effectiveFrom: string;
  effectiveTo: string;
  // System
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
}

type SectionKey = 'numbering' | 'codegen';

// ─── Section config ────────────────────────────────────────────────────────────

const SECTIONS: Array<{ key: SectionKey; label: string; description: string }> = [
  { key: 'numbering', label: 'Code Prefix Master',      description: 'Numbering format per document type' },
  { key: 'codegen',   label: 'Code Generation Policy', description: 'Auto-code rules per entity type' },
];

// ─── Mock initial data ─────────────────────────────────────────────────────────

const INITIAL_ENTRIES: PrefixEntry[] = [
  { id: '1', prefixCode: 'PFX-001', prefixName: 'Sales Order Prefix', displayName: 'Sales Order',
    applicableFor: 'Transaction', module: 'Sales', entity: 'Sales Order', entityType: 'Standard',
    prefixValue: 'SO', defaultPrefix: true, activeStatus: true,
    createdBy: 'Admin', createdDate: '2026-01-10 09:00', lastModifiedBy: 'Admin', lastModifiedDate: '2026-01-10 09:00' },
  { id: '2', prefixCode: 'PFX-002', prefixName: 'Purchase Order Prefix', displayName: 'Purchase Order',
    applicableFor: 'Transaction', module: 'Purchase', entity: 'Purchase Order', entityType: 'Standard',
    prefixValue: 'PO', defaultPrefix: true, activeStatus: true,
    createdBy: 'Admin', createdDate: '2026-01-10 09:05', lastModifiedBy: 'Admin', lastModifiedDate: '2026-01-10 09:05' },
  { id: '3', prefixCode: 'PFX-003', prefixName: 'Sales Invoice Prefix', displayName: 'Sales Invoice',
    applicableFor: 'Transaction', module: 'Finance', entity: 'Sales Invoice', entityType: 'Standard',
    prefixValue: 'INV', defaultPrefix: false, activeStatus: true,
    createdBy: 'Admin', createdDate: '2026-01-10 09:10', lastModifiedBy: 'Admin', lastModifiedDate: '2026-01-10 09:10' },
];

const EMPTY_ENTRY: Omit<PrefixEntry, 'id'> = {
  prefixCode: '', prefixName: '', displayName: '',
  applicableFor: '', module: '', entity: '', entityType: '',
  prefixValue: '', defaultPrefix: false, activeStatus: true,
  createdBy: '', createdDate: '', lastModifiedBy: '', lastModifiedDate: '',
};

// ─── Applicable-for colour palette ───────────────────────────────────────────

const APPLICABLE_COLORS: Record<string, { bg: string; text: string }> = {
  'Master':      {
    bg: 'color-mix(in srgb, #3b82f6 10%, var(--color-surface))',
    text: 'color-mix(in srgb, #3b82f6 85%, var(--color-text))'
  },
  'Transaction': {
    bg: 'color-mix(in srgb, #10b981 10%, var(--color-surface))',
    text: 'color-mix(in srgb, #10b981 85%, var(--color-text))'
  },
};
const getApplicableColor = (t: string) => APPLICABLE_COLORS[t] ?? {
  bg: 'var(--color-surface-subtle)',
  text: 'var(--color-text-muted)'
};

// ─── Preview helper ────────────────────────────────────────────────────────────

function buildPreview(entry: Omit<PrefixEntry, 'id'>): string {
  return `${entry.prefixValue || 'PREFIX'}-001`;
}

// ─── Code-gen initial data ────────────────────────────────────────────────────

const INITIAL_CODEGEN_ENTRIES: CodeGenEntry[] = [
  { id: '1', settingCode: 'CGS-001', settingName: 'Customer Code', displayName: 'Customer Code', description: 'Auto-generated code for customer records', applicableFor: 'Master', module: 'CRM', entity: 'Customer', entityType: 'Standard', prefix: 'CUST', seriesType: 'Sequential', seriesYearBasis: 'None', seriesYearLength: '4', numberLength: '4', startingNumber: '1', currentNumber: '3', nextNumber: '4', incrementBy: '1', paddingRequired: true, paddingCharacter: '0', alignmentType: 'Right', concatenationCharacter: '-', resetRequired: false, resetFrequency: '', resetNumberTo: '', numberConsumptionEvent: 'On Save', activeStatus: true, effectiveFrom: '2026-01-01', effectiveTo: '', createdBy: 'Admin', createdDate: '2026-01-10 09:00', lastModifiedBy: 'Admin', lastModifiedDate: '2026-01-10 09:00' },
  { id: '2', settingCode: 'CGS-002', settingName: 'Sales Order Number', displayName: 'Sales Order', description: 'Sequential numbering with annual reset', applicableFor: 'Transaction', module: 'Sales', entity: 'Sales Order', entityType: 'Standard', prefix: 'SO', seriesType: 'Sequential', seriesYearBasis: 'Calendar Year', seriesYearLength: '4', numberLength: '4', startingNumber: '1', currentNumber: '12', nextNumber: '13', incrementBy: '1', paddingRequired: true, paddingCharacter: '0', alignmentType: 'Right', concatenationCharacter: '-', resetRequired: true, resetFrequency: 'Yearly', resetNumberTo: '1', numberConsumptionEvent: 'On Submit', activeStatus: true, effectiveFrom: '2026-01-01', effectiveTo: '', createdBy: 'Admin', createdDate: '2026-01-10 09:05', lastModifiedBy: 'Admin', lastModifiedDate: '2026-01-10 09:05' },
  { id: '3', settingCode: 'CGS-003', settingName: 'Product Code', displayName: 'Product Code', description: 'Code generation for product catalogue', applicableFor: 'Master', module: 'Inventory', entity: 'Product', entityType: 'Standard', prefix: 'PROD', seriesType: 'Sequential', seriesYearBasis: 'None', seriesYearLength: '4', numberLength: '3', startingNumber: '1', currentNumber: '45', nextNumber: '46', incrementBy: '1', paddingRequired: true, paddingCharacter: '0', alignmentType: 'Right', concatenationCharacter: '-', resetRequired: false, resetFrequency: '', resetNumberTo: '', numberConsumptionEvent: 'On Save', activeStatus: true, effectiveFrom: '2026-01-01', effectiveTo: '', createdBy: 'Admin', createdDate: '2026-01-10 09:10', lastModifiedBy: 'Admin', lastModifiedDate: '2026-01-10 09:10' },
];

const EMPTY_CODEGEN_ENTRY: Omit<CodeGenEntry, 'id'> = {
  settingCode: '', settingName: '', displayName: '', description: '',
  applicableFor: '', module: '', entity: '', entityType: '', prefix: '',
  seriesType: 'Sequential', seriesYearBasis: 'None', seriesYearLength: '4',
  numberLength: '4', startingNumber: '1', currentNumber: '', nextNumber: '', incrementBy: '1',
  paddingRequired: true, paddingCharacter: '0', alignmentType: 'Right', concatenationCharacter: '-',
  resetRequired: false, resetFrequency: '', resetNumberTo: '', numberConsumptionEvent: 'On Save',
  activeStatus: true, effectiveFrom: '', effectiveTo: '',
  createdBy: '', createdDate: '', lastModifiedBy: '', lastModifiedDate: '',
};

function buildCodePreview(entry: Omit<CodeGenEntry, 'id'>): string {
  const parts: string[] = [];
  if (entry.prefix) parts.push(entry.prefix);
  if (entry.seriesYearBasis && entry.seriesYearBasis !== 'None') {
    const year = new Date().getFullYear();
    parts.push(entry.seriesYearLength === '2' ? String(year).slice(-2) : String(year));
  }
  const num = parseInt(entry.nextNumber || entry.startingNumber || '1', 10);
  const numLen = parseInt(entry.numberLength || '3', 10);
  const numStr = entry.paddingRequired
    ? String(num).padStart(numLen, entry.paddingCharacter || '0')
    : String(num);
  parts.push(numStr);
  const sep = entry.concatenationCharacter === 'Space' ? ' ' : (entry.concatenationCharacter || '-');
  return parts.join(sep) || 'CODE-001';
}

// ─── Component ────────────────────────────────────────────────────────────────

const NumberingSettingsPage: React.FC = () => {

  const master = findMasterByKey(MASTER_KEY);
  const group  = findGroupForMasterKey(MASTER_KEY);

  const [helpOpen, setHelpOpen] = useState(false);
  const [helpTopicId, setHelpTopicId] = useState('numbering-code-setup');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Prefix entries ─────────────────────────────────────────────
  const [entries,       setEntries]       = useState<PrefixEntry[]>(INITIAL_ENTRIES);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingEntry,  setEditingEntry]  = useState<PrefixEntry | null>(null);
  const [drawerForm,    setDrawerForm]    = useState<Omit<PrefixEntry, 'id'>>(EMPTY_ENTRY);

  // ── Code generation entries ─────────────────────────────────────
  const [codeGenEntries,        setCodeGenEntries]        = useState<CodeGenEntry[]>(INITIAL_CODEGEN_ENTRIES);
  const [codeGenDrawerOpen,     setCodeGenDrawerOpen]     = useState(false);
  const [codeGenDrawerVisible,  setCodeGenDrawerVisible]  = useState(false);
  const [editingCodeGen,        setEditingCodeGen]        = useState<CodeGenEntry | null>(null);
  const [codeGenDrawerForm,     setCodeGenDrawerForm]     = useState<Omit<CodeGenEntry, 'id'>>(EMPTY_CODEGEN_ENTRY);
  useEffect(() => {
    if (master && group) {
      recordRecentAdminMaster({
        key: master.key, label: master.label, path: master.path,
        groupLabel: group.label, groupIconBg: group.iconBg, groupIconColor: group.iconColor,
      });
    }
  }, [master, group]);

  // ── Drawer helpers ───────────────────────────────────────────────
  const openDrawerForCreate = () => {
    setEditingEntry(null);
    setDrawerForm({ ...EMPTY_ENTRY });
    setDrawerOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setDrawerVisible(true)));
  };

  const openDrawerForEdit = (entry: PrefixEntry) => {
    setEditingEntry(entry);
    const { id: _id, ...rest } = entry;
    setDrawerForm({ ...rest });
    setDrawerOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setDrawerVisible(true)));
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    window.setTimeout(() => setDrawerOpen(false), 250);
  };

  const saveDrawerEntry = () => {
    if (!drawerForm.prefixName || !drawerForm.prefixValue || !drawerForm.applicableFor) return;
    if (editingEntry) {
      setEntries((prev) => prev.map((e) => e.id === editingEntry.id ? { ...drawerForm, id: editingEntry.id } : e));
    } else {
      setEntries((prev) => [...prev, { ...drawerForm, id: Date.now().toString() }]);
    }
    closeDrawer();
  };

  const deleteEntry = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  // ── Code gen helpers ─────────────────────────────────────────────
  const openCodeGenDrawerForCreate = () => {
    setEditingCodeGen(null);
    setCodeGenDrawerForm({ ...EMPTY_CODEGEN_ENTRY });
    setCodeGenDrawerOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setCodeGenDrawerVisible(true)));
  };

  const openCodeGenDrawerForEdit = (entry: CodeGenEntry) => {
    setEditingCodeGen(entry);
    const { id: _id, ...rest } = entry;
    setCodeGenDrawerForm({ ...rest });
    setCodeGenDrawerOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setCodeGenDrawerVisible(true)));
  };

  const closeCodeGenDrawer = () => {
    setCodeGenDrawerVisible(false);
    window.setTimeout(() => setCodeGenDrawerOpen(false), 250);
  };

  const saveCodeGenEntry = () => {
    if (!codeGenDrawerForm.settingName || !codeGenDrawerForm.applicableFor) return;
    if (editingCodeGen) {
      setCodeGenEntries((prev) => prev.map((e) => e.id === editingCodeGen.id ? { ...codeGenDrawerForm, id: editingCodeGen.id } : e));
    } else {
      setCodeGenEntries((prev) => [...prev, { ...codeGenDrawerForm, id: Date.now().toString() }]);
    }
    closeCodeGenDrawer();
  };

  const deleteCodeGenEntry = (id: string) => setCodeGenEntries((prev) => prev.filter((e) => e.id !== id));

  if (!master || !group) return null;

  const numberingHelpTopic = useMemo(() => getHelpTopic(helpTopicId), [helpTopicId]);
  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return entries;
    return entries.filter((entry) =>
      [
        entry.prefixCode,
        entry.prefixName,
        entry.displayName,
        entry.applicableFor,
        entry.entity,
        entry.prefixValue,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [entries, searchQuery]);

  return (
    <AdminShell>
      <AdminListPageShell
        title={master.label}
        description="Configure document numbering prefixes for each entity."
        breadcrumbs={['Admin', group.label]}
        primaryAction={{ label: 'New Prefix', tone: 'primary', onClick: openDrawerForCreate }}
        helpTopicId="numbering-code-setup"
        onHelpClick={(id) => { setHelpTopicId(id); setHelpOpen(true); }}
        searchValue={searchQuery}
        searchPlaceholder="Search prefix, entity, code…"
        onSearchChange={setSearchQuery}
      >
            {filteredEntries.length === 0 ? (
                  <div style={{ padding: '64px 28px', textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <Hash size={22} style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
                      {entries.length === 0 ? 'No prefix configurations yet' : 'No prefixes match the current search'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '24px', maxWidth: '320px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                      {entries.length === 0
                        ? 'Create a prefix for each document type to control how document numbers are generated.'
                        : 'Try adjusting your search to find the prefix configuration you are looking for.'}
                    </div>
                    {entries.length === 0 && (
                      <button type="button" onClick={openDrawerForCreate} style={btnPrimary}>
                        <Plus size={13} />
                        Create First Prefix
                      </button>
                    )}
                  </div>
                ) : (
                  /* ── Table ── */
                  <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>

                    {/* Column headers — white bg, bold dark labels like reference */}
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 120px 150px 120px 88px', alignItems: 'center', padding: '10px 20px', background: 'var(--color-surface-subtle)', borderBottom: '1.5px solid var(--color-border)' }}>
                      {[
                        { label: 'Number Format', align: 'left' },
                        { label: 'Prefix Name',   align: 'left' },
                        { label: 'Type',          align: 'left' },
                        { label: 'Entity',        align: 'left' },
                        { label: 'Status',        align: 'left' },
                        { label: 'Actions',       align: 'right' },
                      ].map(({ label, align }) => (
                        <div key={label} style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', textAlign: align as React.CSSProperties['textAlign'] }}>{label}</div>
                      ))}
                    </div>

                    {/* Data rows */}
                    {filteredEntries.map((entry, idx) => {
                      const color = getApplicableColor(entry.applicableFor);
                      const isLast = idx === filteredEntries.length - 1;
                      return (
                        <div
                          key={entry.id}
                          style={{ display: 'grid', gridTemplateColumns: '140px 1fr 120px 150px 120px 88px', alignItems: 'center', padding: '14px 20px', borderBottom: isLast ? 'none' : '1px solid var(--color-border)', transition: 'background 0.1s', cursor: 'default' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          {/* Number Format — primary column, bold & prominent */}
                          <div>
                            <span style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '0.03em' }}>
                              {buildPreview(entry)}
                            </span>
                            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px', fontFamily: 'inherit' }}>
                              Prefix: <strong style={{ color: 'var(--color-text)' }}>{entry.prefixValue || '—'}</strong>
                            </div>
                          </div>

                          {/* Prefix Name */}
                          <div style={{ minWidth: 0, paddingRight: '16px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {entry.prefixName}
                            </div>
                            {entry.displayName && (
                              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {entry.displayName}
                              </div>
                            )}
                          </div>

                          {/* Type — styled like reference status badges */}
                          <div>
                            <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: color.bg, color: color.text, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                              {(entry.applicableFor || '—').toUpperCase()}
                            </span>
                          </div>

                          {/* Entity */}
                          <div style={{ fontSize: '13px', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
                            {entry.entity || '—'}
                          </div>

                          {/* Status — pill badge inspired by reference */}
                          <div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '9999px', background: entry.activeStatus ? 'color-mix(in srgb, #10b981 15%, var(--color-surface))' : 'var(--color-surface-subtle)', color: entry.activeStatus ? 'color-mix(in srgb, #10b981 85%, var(--color-text))' : 'var(--color-text-muted)', letterSpacing: '0.01em' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: entry.activeStatus ? 'color-mix(in srgb, #10b981 90%, var(--color-text))' : 'var(--color-border)', flexShrink: 0 }} />
                              {entry.activeStatus ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          {/* Actions — borderless icons like reference */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => openDrawerForEdit(entry)}
                              title="Edit"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', border: 'none', borderRadius: '8px', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', transition: 'background 0.1s, color 0.1s' }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-subtle)'; e.currentTarget.style.color = 'var(--color-text)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteEntry(entry.id)}
                              title="Delete"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', border: 'none', borderRadius: '8px', background: 'transparent', color: 'var(--color-danger)', cursor: 'pointer', transition: 'background 0.1s' }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'color-mix(in srgb, var(--color-danger) 10%, var(--color-surface))'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Footer — "Showing X of Y records" like reference */}
                    <div style={{ padding: '10px 20px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        Showing <strong style={{ color: 'var(--color-text)', fontWeight: 600 }}>1–{filteredEntries.length}</strong> of <strong style={{ color: 'var(--color-text)', fontWeight: 600 }}>{entries.length}</strong> {entries.length === 1 ? 'record' : 'records'}
                      </span>
                    </div>
                  </div>
                )}
      </AdminListPageShell>

      {/* ── Drawer ──────────────────────────────────────────────── */}
      {drawerOpen && (
        <PrefixDrawer
          visible={drawerVisible}
          isEdit={!!editingEntry}
          formData={drawerForm}
          onClose={closeDrawer}
          onChangeField={(field, value) => setDrawerForm((prev) => ({ ...prev, [field]: value } as Omit<PrefixEntry, 'id'>))}
          onSave={saveDrawerEntry}
        />
      )}

      {numberingHelpTopic && (
        <HelpDrawer open={helpOpen} topic={numberingHelpTopic} onClose={() => setHelpOpen(false)} onTopicChange={(id) => setHelpTopicId(id)} />
      )}
    </AdminShell>
  );
};

// ─── PrefixDrawer ─────────────────────────────────────────────────────────────

interface PrefixDrawerProps {
  visible: boolean;
  isEdit: boolean;
  formData: Omit<PrefixEntry, 'id'>;
  onClose: () => void;
  onChangeField: (field: keyof Omit<PrefixEntry, 'id'>, value: string | boolean) => void;
  onSave: () => void;
}

const PrefixDrawer: React.FC<PrefixDrawerProps> = ({ visible, isEdit, formData, onClose, onChangeField, onSave }) => {
  const canSave = !!formData.prefixName && !!formData.prefixValue && !!formData.applicableFor;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200 }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${visible ? 0.35 : 0})`, transition: 'background 0.25s ease' }} />
      {/* Panel */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: '480px',
        background: 'var(--color-surface-subtle)', borderLeft: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column',
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s ease',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
      }}>
        {/* ── Header ──────────────────────────────────────────────── */}
        <div style={{
          flexShrink: 0, background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', height: '52px', padding: '0 4px',
        }}>
          <button type="button" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)', flexShrink: 0, borderRadius: '8px' }}>
            <ArrowLeft size={20} strokeWidth={2} />
          </button>
          <span style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', paddingLeft: '4px' }}>
            {isEdit ? 'Edit Code Prefix Master' : 'New Code Prefix Master'}
          </span>
          <button type="button" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)', flexShrink: 0, borderRadius: '8px' }}>
            <X size={16} />
          </button>
        </div>

        {/* ── Scrollable Body ──────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

          {/* Card 1 — Identity */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>

            {/* Prefix Code — read-only auto badge */}
            <DField label="Prefix Code">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8', fontWeight: 600, flexShrink: 0 }}>AUTO</span>
                <span style={{ fontSize: '13px', color: formData.prefixCode ? 'var(--color-text)' : 'var(--color-text-muted)', fontFamily: formData.prefixCode ? 'monospace' : undefined }}>
                  {formData.prefixCode || 'System generated'}
                </span>
              </div>
            </DField>

            <DField label="Prefix Name" required mt>
              <DrawerInput value={formData.prefixName} onChange={(v) => onChangeField('prefixName', v)} placeholder="e.g. Sales Order Prefix" />
            </DField>

            <DField label="Display Name" mt>
              <DrawerInput value={formData.displayName} onChange={(v) => onChangeField('displayName', v)} placeholder="e.g. Sales Order" />
            </DField>

            <DField label="Applicable For" required mt>
              <SegmentedControl value={formData.applicableFor} onChange={(v) => onChangeField('applicableFor', v)} options={['Master', 'Transaction']} />
            </DField>

            <DField label="Module" mt>
              <DrawerSelect value={formData.module} onChange={(v) => onChangeField('module', v)} options={['Sales', 'Purchase', 'Finance', 'Inventory', 'HR', 'CRM', 'Operations']} />
            </DField>

            <DField label="Entity" mt>
              <DrawerSelect value={formData.entity} onChange={(v) => onChangeField('entity', v)} options={['Sales Order', 'Purchase Order', 'Sales Invoice', 'Purchase Invoice', 'Delivery Note', 'Credit Note', 'Debit Note', 'Quotation', 'Stock Transfer']} />
            </DField>

            <DField label="Entity Type / Subtype" mt>
              <DrawerSelect value={formData.entityType} onChange={(v) => onChangeField('entityType', v)} options={['Standard', 'Return', 'Credit', 'Debit', 'Internal', 'External']} />
            </DField>

            <DField label="Prefix Value" required mt>
              <DrawerInput value={formData.prefixValue} onChange={(v) => onChangeField('prefixValue', v)} placeholder="e.g. SO, PO, INV" />
            </DField>

            {/* Default Prefix toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '18px', padding: '12px 0', borderTop: '1px solid var(--color-border)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>Default Prefix</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Use as default for this entity</div>
              </div>
              <Toggle checked={formData.defaultPrefix} onChange={(v) => onChangeField('defaultPrefix', v)} />
            </div>

            {/* Active Status toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--color-border)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>Active Status</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Enable this prefix configuration</div>
              </div>
              <Toggle checked={formData.activeStatus} onChange={(v) => onChangeField('activeStatus', v)} activeColor="#16a34a" />
            </div>
          </div>

          {/* Card 2 — System Info (edit mode only) */}
          {isEdit && (
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '18px' }}>System Information</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <DField label="Created By">
                  <div style={roStyle}>{formData.createdBy || '—'}</div>
                </DField>
                <DField label="Created Date & Time">
                  <div style={roStyle}>{formData.createdDate || '—'}</div>
                </DField>
                <DField label="Last Modified By">
                  <div style={roStyle}>{formData.lastModifiedBy || '—'}</div>
                </DField>
                <DField label="Last Modified Date & Time">
                  <div style={roStyle}>{formData.lastModifiedDate || '—'}</div>
                </DField>
              </div>
            </div>
          )}

        </div>

        {/* ── Fixed bottom: Preview + Save ─────────────────────────── */}
        <div style={{ flexShrink: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: '12px 16px' }}>
          {/* Preview card */}
          <div style={{ borderRadius: '10px', background: 'color-mix(in srgb, #10b981 10%, var(--color-surface))', border: '1.5px solid color-mix(in srgb, #10b981 35%, var(--color-border))', padding: '12px 16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Left: generated code */}
            <div style={{ flexShrink: 0, paddingInlineEnd: '16px', borderInlineEnd: '1.5px solid color-mix(in srgb, #10b981 35%, var(--color-border))' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'color-mix(in srgb, #10b981 85%, var(--color-text))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Preview</div>
              <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 800, color: 'color-mix(in srgb, #10b981 85%, var(--color-text))', letterSpacing: '0.05em', lineHeight: 1 }}>
                {buildPreview(formData)}
              </div>
            </div>
            {/* Right: status text */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'color-mix(in srgb, #10b981 85%, var(--color-text))', marginBottom: '2px' }}>
                {formData.prefixValue ? 'Format looks good' : 'Enter a prefix value'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                {formData.prefixValue
                  ? 'This format will be applied to new documents'
                  : 'Preview will update as you fill in the fields'}
              </div>
            </div>
          </div>
          <button type="button" onClick={onSave} disabled={!canSave} style={{ ...btnPrimary, width: '100%', justifyContent: 'center', opacity: canSave ? 1 : 0.5, cursor: canSave ? 'pointer' : 'not-allowed' }}>
            <Save size={13} />
            Save
          </button>
        </div>

      </div>
    </div>
  );
};

// ─── Shared button styles ─────────────────────────────────────────────────────

const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '5px',
  padding: '6px 14px', borderRadius: '8px',
  fontSize: '12px', fontWeight: 500, cursor: 'pointer',
  whiteSpace: 'nowrap', transition: 'opacity 0.15s',
};
const btnPrimary: React.CSSProperties = { ...btnBase, background: 'var(--color-primary)', border: '1px solid var(--color-primary)', color: 'white', fontWeight: 600 };

export default NumberingSettingsPage;

// ─── Drawer-specific input primitives (larger padding, more rounded) ──────────

const drawerInputBase: React.CSSProperties = {
  width: '100%', padding: '11px 14px', fontSize: '14px',
  border: '1px solid var(--color-border)', borderRadius: '10px',
  background: 'var(--color-surface)', color: 'var(--color-text)',
  outline: 'none', boxSizing: 'border-box',
};

interface DrawerInputProps { value: string; onChange: (v: string) => void; placeholder?: string; }
const DrawerInput: React.FC<DrawerInputProps> = ({ value, onChange, placeholder }) => (
  <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={drawerInputBase} />
);

interface DrawerSelectProps { value: string; onChange: (v: string) => void; options: string[]; }
const DrawerSelect: React.FC<DrawerSelectProps> = ({ value, onChange, options }) => (
  <div style={{ position: 'relative' }}>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...drawerInputBase, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', paddingRight: '38px' }}
    >
      <option value="">— Select —</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
    <span style={{ position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  </div>
);

// ─── SegmentedControl ─────────────────────────────────────────────────────────

interface SegmentedControlProps { value: string; onChange: (v: string) => void; options: string[]; }
const SegmentedControl: React.FC<SegmentedControlProps> = ({ value, onChange, options }) => (
  <div style={{ display: 'flex', gap: '8px' }}>
    {options.map((opt) => {
      const active = value === opt;
      return (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          style={{
            flex: 1, padding: '10px 14px', fontSize: '13px',
            fontWeight: active ? 600 : 500,
            border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
            borderRadius: '10px',
            background: active ? 'var(--color-primary)' : 'var(--color-surface)',
            color: active ? 'white' : 'var(--color-text)',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {opt}
        </button>
      );
    })}
  </div>
);

// ─── DField ────────────────────────────────────────────────────────────────────

interface DFieldProps { label: string; required?: boolean; mt?: boolean; children: React.ReactNode; }
const DField: React.FC<DFieldProps> = ({ label, required, mt, children }) => (
  <div style={{ marginTop: mt ? '16px' : undefined }}>
    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
      {label}{required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
    </label>
    {children}
  </div>
);

// ─── Toggle ────────────────────────────────────────────────────────────────────

interface ToggleProps { checked: boolean; onChange: (v: boolean) => void; activeColor?: string; }
const Toggle: React.FC<ToggleProps> = ({ checked, onChange, activeColor = '#2563EB' }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    style={{
      width: '44px', height: '24px', borderRadius: '12px',
      background: checked ? activeColor : '#D1D5DB',
      border: 'none', cursor: 'pointer', position: 'relative',
      transition: 'background 0.2s', flexShrink: 0,
    }}
  >
    <span style={{
      position: 'absolute', top: '2px',
      left: checked ? '22px' : '2px', width: '20px', height: '20px',
      borderRadius: '50%', background: 'white',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      transition: 'left 0.2s',
    }} />
  </button>
);

// ─── Read-only field style ─────────────────────────────────────────────────────

const roStyle: React.CSSProperties = {
  padding: '9px 14px', fontSize: '13px', color: 'var(--color-text)',
  background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)',
  borderRadius: '10px', minHeight: '42px', display: 'flex', alignItems: 'center',
};

// ─── CodeGenDrawer ────────────────────────────────────────────────────────────

interface CodeGenDrawerProps {
  visible: boolean;
  isEdit: boolean;
  formData: Omit<CodeGenEntry, 'id'>;
  onClose: () => void;
  onChangeField: (field: keyof Omit<CodeGenEntry, 'id'>, value: string | boolean) => void;
  onSave: () => void;
}

const CodeGenDrawer: React.FC<CodeGenDrawerProps> = ({ visible, isEdit, formData, onClose, onChangeField, onSave }) => {
  const canSave = !!formData.settingName && !!formData.applicableFor;
  const subHead: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px' };
  const divider: React.CSSProperties = { borderTop: '1px solid var(--color-border)', margin: '16px 0 14px' };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${visible ? 0.35 : 0})`, transition: 'background 0.25s ease' }} />
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: '520px',
        background: 'var(--color-surface-subtle)', borderLeft: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column',
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s ease',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
      }}>
        {/* Header */}
        <div style={{ flexShrink: 0, background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', height: '52px', padding: '0 4px' }}>
          <button type="button" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)', flexShrink: 0, borderRadius: '8px' }}>
            <ArrowLeft size={20} strokeWidth={2} />
          </button>
          <span style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', paddingLeft: '4px' }}>
            {isEdit ? 'Edit Code Generation Policy' : 'New Code Generation Policy'}
          </span>
          <button type="button" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)', flexShrink: 0, borderRadius: '8px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

          {/* ── Card 1: Identification ── */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
            <div style={subHead}>Identification</div>

            <DField label="Setting Code">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8', fontWeight: 600, flexShrink: 0 }}>AUTO</span>
                <span style={{ fontSize: '13px', color: formData.settingCode ? 'var(--color-text)' : 'var(--color-text-muted)', fontFamily: formData.settingCode ? 'monospace' : undefined }}>
                  {formData.settingCode || 'System generated'}
                </span>
              </div>
            </DField>

            <DField label="Setting Name" required mt>
              <DrawerInput value={formData.settingName} onChange={(v) => onChangeField('settingName', v)} placeholder="e.g. Customer Code, Sales Order Number" />
            </DField>

            <DField label="Display Name" mt>
              <DrawerInput value={formData.displayName} onChange={(v) => onChangeField('displayName', v)} placeholder="e.g. Customer Code" />
            </DField>

            <DField label="Description" mt>
              <textarea
                value={formData.description}
                onChange={(e) => onChangeField('description', e.target.value)}
                placeholder="Briefly describe this code generation rule…"
                rows={2}
                style={{ ...drawerInputBase, resize: 'none', lineHeight: 1.5 }}
              />
            </DField>

            <div style={divider} />
            <div style={{ ...subHead, marginTop: 0, marginBottom: '14px' }}>Scope</div>

            <DField label="Applicable For" required>
              <SegmentedControl value={formData.applicableFor} onChange={(v) => onChangeField('applicableFor', v)} options={['Master', 'Transaction']} />
            </DField>

            <DField label="Module" mt>
              <DrawerSelect value={formData.module} onChange={(v) => onChangeField('module', v)} options={['Sales', 'Purchase', 'Finance', 'Inventory', 'HR', 'CRM', 'Operations']} />
            </DField>

            <DField label="Entity" mt>
              <DrawerSelect value={formData.entity} onChange={(v) => onChangeField('entity', v)} options={['Customer', 'Supplier', 'Product', 'Employee', 'Asset', 'Sales Order', 'Purchase Order', 'Sales Invoice', 'Purchase Invoice', 'Delivery Note']} />
            </DField>

            <DField label="Entity Type / Subtype" mt>
              <DrawerSelect value={formData.entityType} onChange={(v) => onChangeField('entityType', v)} options={['Standard', 'Return', 'Credit', 'Debit', 'Internal', 'External']} />
            </DField>

            <DField label="Prefix" mt>
              <DrawerSelect value={formData.prefix} onChange={(v) => onChangeField('prefix', v)} options={['SO', 'PO', 'INV', 'CUST', 'PROD', 'SUP', 'EMP', 'AST', 'WH', 'RTR']} />
            </DField>
          </div>

          {/* ── Card 2: Series & Number ── */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
            <div style={subHead}>Series Configuration</div>

            <DField label="Series Type">
              <DrawerSelect value={formData.seriesType} onChange={(v) => onChangeField('seriesType', v)} options={['Sequential', 'Custom', 'Manual']} />
            </DField>

            <DField label="Series Year Basis" mt>
              <DrawerSelect value={formData.seriesYearBasis} onChange={(v) => onChangeField('seriesYearBasis', v)} options={['None', 'Calendar Year', 'Fiscal Year']} />
            </DField>

            {formData.seriesYearBasis && formData.seriesYearBasis !== 'None' && (
              <DField label="Series Year Length" mt>
                <DrawerSelect value={formData.seriesYearLength} onChange={(v) => onChangeField('seriesYearLength', v)} options={['2 Digits (26)', '4 Digits (2026)']} />
              </DField>
            )}

            <div style={divider} />
            <div style={{ ...subHead, marginTop: 0, marginBottom: '14px' }}>Number Configuration</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <DField label="Number Length">
                <DrawerInput value={formData.numberLength} onChange={(v) => onChangeField('numberLength', v)} placeholder="4" />
              </DField>
              <DField label="Increment By">
                <DrawerInput value={formData.incrementBy} onChange={(v) => onChangeField('incrementBy', v)} placeholder="1" />
              </DField>
              <DField label="Starting Number">
                <DrawerInput value={formData.startingNumber} onChange={(v) => onChangeField('startingNumber', v)} placeholder="1" />
              </DField>
              {isEdit && (
                <DField label="Current Number">
                  <div style={roStyle}>{formData.currentNumber || '—'}</div>
                </DField>
              )}
            </div>

            {isEdit && (
              <DField label="Next Number" mt>
                <div style={{ ...roStyle, background: '#EFF6FF', borderColor: '#BFDBFE' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1D4ED8' }}>{buildCodePreview(formData)}</span>
                </div>
              </DField>
            )}
          </div>

          {/* ── Card 3: Formatting ── */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
            <div style={subHead}>Padding & Formatting</div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: formData.paddingRequired ? '14px' : '0', marginBottom: formData.paddingRequired ? '14px' : '0', borderBottom: formData.paddingRequired ? '1px solid var(--color-border)' : 'none' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>Padding Required</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Pad numbers to a fixed length</div>
              </div>
              <Toggle checked={formData.paddingRequired} onChange={(v) => onChangeField('paddingRequired', v)} />
            </div>

            {formData.paddingRequired && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <DField label="Padding Character">
                  <DrawerInput value={formData.paddingCharacter} onChange={(v) => onChangeField('paddingCharacter', v)} placeholder="0" />
                </DField>
                <DField label="Alignment Type">
                  <DrawerSelect value={formData.alignmentType} onChange={(v) => onChangeField('alignmentType', v)} options={['Left', 'Right']} />
                </DField>
              </div>
            )}

            <DField label="Concatenation Character" mt={!formData.paddingRequired}>
              <DrawerSelect value={formData.concatenationCharacter} onChange={(v) => onChangeField('concatenationCharacter', v)} options={['-', '/', '_', '.', 'Space']} />
            </DField>
          </div>

          {/* ── Card 4: Behavior ── */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
            <div style={subHead}>Reset Behavior</div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: formData.resetRequired ? '14px' : '0', marginBottom: formData.resetRequired ? '14px' : '0', borderBottom: formData.resetRequired ? '1px solid var(--color-border)' : 'none' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>Reset Required</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Reset the counter at a defined frequency</div>
              </div>
              <Toggle checked={formData.resetRequired} onChange={(v) => onChangeField('resetRequired', v)} activeColor="#D97706" />
            </div>

            {formData.resetRequired && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <DField label="Reset Frequency">
                  <DrawerSelect value={formData.resetFrequency} onChange={(v) => onChangeField('resetFrequency', v)} options={['Daily', 'Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'Financial Year']} />
                </DField>
                <DField label="Reset Number To">
                  <DrawerInput value={formData.resetNumberTo} onChange={(v) => onChangeField('resetNumberTo', v)} placeholder="1" />
                </DField>
              </div>
            )}

            <div style={divider} />
            <div style={{ ...subHead, marginTop: 0, marginBottom: '14px' }}>Consumption</div>

            <DField label="Number Consumption Event">
              <DrawerSelect value={formData.numberConsumptionEvent} onChange={(v) => onChangeField('numberConsumptionEvent', v)} options={['On Save', 'On Submit', 'On Print', 'On Approval', 'On Dispatch']} />
            </DField>
          </div>

          {/* ── Card 5: Status & Validity ── */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
            <div style={subHead}>Status & Validity</div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>Active Status</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Enable this code generation policy</div>
              </div>
              <Toggle checked={formData.activeStatus} onChange={(v) => onChangeField('activeStatus', v)} activeColor="#16a34a" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <DField label="Effective From">
                <input type="date" value={formData.effectiveFrom} onChange={(e) => onChangeField('effectiveFrom', e.target.value)} style={{ ...drawerInputBase }} />
              </DField>
              <DField label="Effective To">
                <input type="date" value={formData.effectiveTo} onChange={(e) => onChangeField('effectiveTo', e.target.value)} style={{ ...drawerInputBase }} />
              </DField>
            </div>
          </div>

          {/* ── Card 6: System Info (edit only) ── */}
          {isEdit && (
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
              <div style={subHead}>System Information</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <DField label="Created By"><div style={roStyle}>{formData.createdBy || '—'}</div></DField>
                <DField label="Created Date & Time"><div style={roStyle}>{formData.createdDate || '—'}</div></DField>
                <DField label="Last Modified By"><div style={roStyle}>{formData.lastModifiedBy || '—'}</div></DField>
                <DField label="Last Modified Date & Time"><div style={roStyle}>{formData.lastModifiedDate || '—'}</div></DField>
              </div>
            </div>
          )}
        </div>

        {/* Fixed bottom: Sample Preview + Save */}
        <div style={{ flexShrink: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: '12px 16px' }}>
          <div style={{ borderRadius: '10px', background: 'color-mix(in srgb, #3b82f6 10%, var(--color-surface))', border: '1.5px solid color-mix(in srgb, #3b82f6 35%, var(--color-border))', padding: '12px 16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ flexShrink: 0, paddingInlineEnd: '16px', borderInlineEnd: '1.5px solid color-mix(in srgb, #3b82f6 35%, var(--color-border))' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'color-mix(in srgb, #3b82f6 85%, var(--color-text))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Sample Code</div>
              <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 800, color: 'color-mix(in srgb, #3b82f6 85%, var(--color-text))', letterSpacing: '0.05em', lineHeight: 1 }}>
                {buildCodePreview(formData)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'color-mix(in srgb, #3b82f6 85%, var(--color-text))', marginBottom: '2px' }}>
                {formData.prefix ? 'Format preview' : 'Configure to preview'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                {formData.prefix
                  ? 'Based on current settings above'
                  : 'Set a prefix to see the code preview'}
              </div>
            </div>
          </div>
          <button type="button" onClick={onSave} disabled={!canSave} style={{ ...btnPrimary, width: '100%', justifyContent: 'center', opacity: canSave ? 1 : 0.5, cursor: canSave ? 'pointer' : 'not-allowed' }}>
            <Save size={13} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
