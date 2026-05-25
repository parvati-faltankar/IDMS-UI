import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Edit2, Eye, Hash, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import AdminShell from '../AdminShell';
import { findGroupForMasterKey, findMasterByKey } from '../adminNavConfig';
import { recordRecentAdminMaster } from '../adminStorage';
import { AdminListPageShell } from '../../experience/components/AdminListPageShell';
import { SmartPreviewDrawer } from '../../experience/components/SmartPreviewDrawer';
import { SmartFormDrawer } from '../../experience/components/SmartFormDrawer';
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

type SectionKey  = 'numbering' | 'codegen';
type QuickFilter = 'all' | 'active' | 'inactive';

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
  const navigate = useNavigate();
  const master = findMasterByKey(MASTER_KEY);
  const group  = findGroupForMasterKey(MASTER_KEY);

  // ── Section ──────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState<SectionKey>('numbering');

  // ── Search / filter (prefix section) ────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');

  // ── Prefix entries ───────────────────────────────────────────────
  const [entries, setEntries] = useState<PrefixEntry[]>(INITIAL_ENTRIES);

  // ── Code gen entries (read-only — managed by CodeGenerationPolicyPage) ──
  const [codeGenEntries] = useState<CodeGenEntry[]>(INITIAL_CODEGEN_ENTRIES);

  // ── Preview drawer ───────────────────────────────────────────────
  const [previewEntry, setPreviewEntry] = useState<PrefixEntry | null>(null);
  const [previewOpen,  setPreviewOpen]  = useState(false);

  // ── Form drawer ──────────────────────────────────────────────────
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingEntry,   setEditingEntry]   = useState<PrefixEntry | null>(null);
  const [formData,       setFormData]       = useState<Omit<PrefixEntry, 'id'>>(EMPTY_ENTRY);
  const [formDirty,      setFormDirty]      = useState(false);

  // ── Row more menu ────────────────────────────────────────────────
  const [openRowMenu, setOpenRowMenu] = useState<string | null>(null);

  // ── Help drawer ──────────────────────────────────────────────────
  const [helpOpen,    setHelpOpen]    = useState(false);
  const [helpTopicId, setHelpTopicId] = useState('numbering-code-setup');

  useEffect(() => {
    if (master && group) {
      recordRecentAdminMaster({
        key: master.key, label: master.label, path: master.path,
        groupLabel: group.label, groupIconBg: group.iconBg, groupIconColor: group.iconColor,
      });
    }
  }, [master, group]);


  // ── Computed ─────────────────────────────────────────────────────
  const filteredEntries = useMemo(() => {
    let result = entries;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.prefixName.toLowerCase().includes(q) ||
        e.prefixValue.toLowerCase().includes(q) ||
        e.prefixCode.toLowerCase().includes(q) ||
        e.entity.toLowerCase().includes(q)
      );
    }
    if (quickFilter === 'active')   result = result.filter(e => e.activeStatus);
    if (quickFilter === 'inactive') result = result.filter(e => !e.activeStatus);
    return result;
  }, [entries, searchQuery, quickFilter]);

  const summaryItems = useMemo(() => {
    if (activeSection === 'numbering') {
      const activeCount   = entries.filter(e => e.activeStatus).length;
      const inactiveCount = entries.filter(e => !e.activeStatus).length;
      return [
        { label: 'Total',    value: entries.length },
        { label: 'Active',   value: activeCount,   tone: 'success'  as const },
        ...(inactiveCount > 0 ? [{ label: 'Inactive', value: inactiveCount, tone: 'danger' as const }] : []),
      ];
    }
    return [
      { label: 'Policies', value: codeGenEntries.length },
      { label: 'Active',   value: codeGenEntries.filter(e => e.activeStatus).length, tone: 'success' as const },
    ];
  }, [activeSection, entries, codeGenEntries]);

  const helpTopic   = useMemo(() => getHelpTopic(helpTopicId), [helpTopicId]);
  const canSaveForm = !!formData.prefixName && !!formData.prefixValue && !!formData.applicableFor;

  // ── Handlers ─────────────────────────────────────────────────────
  const openPreview  = (entry: PrefixEntry) => { setPreviewEntry(entry); setPreviewOpen(true); };
  const closePreview = () => setPreviewOpen(false);

  const openFormDrawer = (entry?: PrefixEntry) => {
    if (entry) {
      setEditingEntry(entry);
      const { id: _id, ...rest } = entry;
      setFormData({ ...rest });
    } else {
      setEditingEntry(null);
      setFormData({ ...EMPTY_ENTRY });
    }
    setFormDirty(false);
    setFormDrawerOpen(true);
    setPreviewOpen(false);
  };

  const closeFormDrawer = () => { setFormDrawerOpen(false); setFormDirty(false); };

  const handleFormSave = () => {
    if (!formData.prefixName || !formData.prefixValue || !formData.applicableFor) return;
    if (editingEntry) {
      setEntries(prev => prev.map(e => e.id === editingEntry.id ? { ...formData, id: editingEntry.id } : e));
    } else {
      setEntries(prev => [...prev, { ...formData, id: Date.now().toString() }]);
    }
    closeFormDrawer();
  };

  const deleteEntry  = (id: string) => setEntries(prev => prev.filter(e => e.id !== id));
  const toggleStatus = (id: string) => setEntries(prev =>
    prev.map(e => e.id === id ? { ...e, activeStatus: !e.activeStatus } : e)
  );

  const setFormField = (field: keyof Omit<PrefixEntry, 'id'>, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormDirty(true);
  };

  // ── Section switcher ─────────────────────────────────────────────
  const sectionSwitcher = (
    <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
      {(['numbering', 'codegen'] as SectionKey[]).map((key, i) => {
        const label    = key === 'numbering' ? 'Code Prefix Master' : 'Code Generation Policy';
        const isActive = activeSection === key;
        return (
          <button key={key} type="button" onClick={() => setActiveSection(key)}
            style={{
              padding: '5px 14px', fontSize: '12px', fontWeight: isActive ? 600 : 400,
              border: 'none', borderRight: i === 0 ? '1px solid var(--color-border)' : 'none',
              background: isActive ? 'var(--color-primary)' : 'transparent',
              color: isActive ? 'white' : 'var(--color-text)',
              cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}>
            {label}
          </button>
        );
      })}
    </div>
  );

  if (!master || !group) return null;

  return (
    <AdminShell>
      <AdminListPageShell
        title={master.label}
        description={master.description ?? 'Configure document prefixes and auto-numbering rules.'}
        breadcrumbs={['Admin', group.label]}
        primaryAction={
          activeSection === 'numbering'
            ? { label: 'New Prefix',       tone: 'primary', onClick: () => openFormDrawer() }
            : { label: 'Open Policy List', tone: 'primary', onClick: () => navigate('/admin/master/code-generation-policy') }
        }
        secondaryActions={[{ label: 'How this works', tone: 'secondary', onClick: () => { setHelpTopicId('numbering-code-setup'); setHelpOpen(true); } }]}
        helpTopicId="numbering-code-setup"
        onHelpClick={(id) => { setHelpTopicId(id); setHelpOpen(true); }}
        summaryItems={summaryItems}
        searchValue={activeSection === 'numbering' ? searchQuery : undefined}
        searchPlaceholder="Search prefixes…"
        onSearchChange={activeSection === 'numbering' ? setSearchQuery : undefined}
        quickFilterItems={activeSection === 'numbering' ? [
          { key: 'all',      label: 'All',      count: entries.length },
          { key: 'active',   label: 'Active',   count: entries.filter(e => e.activeStatus).length },
          { key: 'inactive', label: 'Inactive', count: entries.filter(e => !e.activeStatus).length },
        ] : undefined}
        activeQuickFilter={activeSection === 'numbering' ? quickFilter : undefined}
        onQuickFilterChange={activeSection === 'numbering' ? (k) => setQuickFilter(k as QuickFilter) : undefined}
        toolbarActions={sectionSwitcher}
      >
        {/* ── Code Prefix Master ────────────────────────────────────── */}
        {activeSection === 'numbering' && (
          filteredEntries.length === 0 ? (
            <div style={{ padding: '64px 28px', textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Hash size={22} style={{ color: 'var(--color-text-muted)' }} />
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
                {searchQuery || quickFilter !== 'all' ? 'No matching prefixes' : 'No prefix configurations yet'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '24px', maxWidth: '320px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                {searchQuery || quickFilter !== 'all'
                  ? 'Try adjusting your search or filter.'
                  : 'Create a prefix for each document type to control how document numbers are generated.'}
              </div>
              {!searchQuery && quickFilter === 'all' && (
                <button type="button" onClick={() => openFormDrawer()} style={{ ...btnPrimary, border: 'none', cursor: 'pointer' }}>
                  <Plus size={13} />
                  Create First Prefix
                </button>
              )}
            </div>
          ) : (
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
              {/* Column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 140px 140px 80px 100px 88px', alignItems: 'center', padding: '10px 20px', background: 'var(--color-surface-subtle)', borderBottom: '1.5px solid var(--color-border)' }}>
                {[
                  { label: 'Format Preview', align: 'left'  },
                  { label: 'Prefix Name',    align: 'left'  },
                  { label: 'Type / Module',  align: 'left'  },
                  { label: 'Entity',         align: 'left'  },
                  { label: 'Default',        align: 'left'  },
                  { label: 'Status',         align: 'left'  },
                  { label: 'Actions',        align: 'right' },
                ].map(({ label, align }) => (
                  <div key={label} style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', textAlign: align as React.CSSProperties['textAlign'] }}>{label}</div>
                ))}
              </div>
              {/* Data rows */}
              {filteredEntries.map((entry, idx) => {
                const color  = getApplicableColor(entry.applicableFor);
                const isLast = idx === filteredEntries.length - 1;
                return (
                  <div
                    key={entry.id}
                    style={{ display: 'grid', gridTemplateColumns: '130px 1fr 140px 140px 80px 100px 88px', alignItems: 'center', padding: '14px 20px', borderBottom: isLast ? 'none' : '1px solid var(--color-border)', transition: 'background 0.1s', cursor: 'pointer' }}
                    onClick={() => openPreview(entry)}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Format Preview */}
                    <div>
                      <span style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '0.03em' }}>
                        {buildPreview(entry)}
                      </span>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
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
                    {/* Type / Module */}
                    <div>
                      <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: color.bg, color: color.text, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                        {(entry.applicableFor || '—').toUpperCase()}
                      </span>
                      {entry.module && (
                        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '3px' }}>{entry.module}</div>
                      )}
                    </div>
                    {/* Entity */}
                    <div style={{ fontSize: '13px', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
                      {entry.entity || '—'}
                    </div>
                    {/* Default */}
                    <div>
                      {entry.defaultPrefix ? (
                        <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '6px', background: '#EFF6FF', color: '#1D4ED8' }}>Yes</span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>—</span>
                      )}
                    </div>
                    {/* Status */}
                    <div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '9999px', background: entry.activeStatus ? 'color-mix(in srgb, #10b981 15%, var(--color-surface))' : 'var(--color-surface-subtle)', color: entry.activeStatus ? 'color-mix(in srgb, #10b981 85%, var(--color-text))' : 'var(--color-text-muted)' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: entry.activeStatus ? 'color-mix(in srgb, #10b981 90%, var(--color-text))' : 'var(--color-border)', flexShrink: 0 }} />
                        {entry.activeStatus ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                      <button type="button" onClick={(e) => { e.stopPropagation(); openPreview(entry); }} title="Preview"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: 'none', borderRadius: '8px', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-subtle)'; e.currentTarget.style.color = 'var(--color-text)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}>
                        <Eye size={14} />
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); openFormDrawer(entry); }} title="Edit"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: 'none', borderRadius: '8px', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-subtle)'; e.currentTarget.style.color = 'var(--color-text)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}>
                        <Edit2 size={14} />
                      </button>
                      <div style={{ position: 'relative' }}>
                        <button type="button"
                          onClick={(e) => { e.stopPropagation(); setOpenRowMenu(openRowMenu === entry.id ? null : entry.id); }}
                          title="More"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: 'none', borderRadius: '8px', background: openRowMenu === entry.id ? 'var(--color-surface-subtle)' : 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-subtle)'; }}
                          onMouseLeave={(e) => { if (openRowMenu !== entry.id) e.currentTarget.style.background = 'transparent'; }}>
                          <MoreHorizontal size={14} />
                        </button>
                        {openRowMenu === entry.id && (
                          <>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={(e) => { e.stopPropagation(); setOpenRowMenu(null); }} />
                            <div style={{ position: 'absolute', right: 0, top: '36px', zIndex: 51, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: '160px', padding: '4px' }}>
                              <button type="button"
                                onClick={(e) => { e.stopPropagation(); toggleStatus(entry.id); setOpenRowMenu(null); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text)', borderRadius: '7px', textAlign: 'left' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-subtle)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                                {entry.activeStatus ? 'Deactivate' : 'Activate'}
                              </button>
                              <button type="button"
                                onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); setOpenRowMenu(null); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', color: 'var(--color-danger)', borderRadius: '7px', textAlign: 'left' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'color-mix(in srgb, var(--color-danger) 10%, var(--color-surface))'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ── Code Generation Policy (summary) ─────────────────────── */}
        {activeSection === 'codegen' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Description card */}
            <div style={{ background: 'color-mix(in srgb, var(--color-primary) 6%, var(--color-surface))', border: '1px solid color-mix(in srgb, var(--color-primary) 20%, var(--color-border))', borderRadius: '12px', padding: '20px 24px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '6px' }}>
                Code Generation Policies are managed separately
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>
                While <strong>Code Prefix Master</strong> controls the prefix segment of a document number (e.g.{' '}
                <code style={{ fontFamily: 'monospace', fontSize: '12px', background: 'var(--color-surface-subtle)', padding: '1px 5px', borderRadius: '4px' }}>SO-</code>),
                the <strong>Code Generation Policy</strong> controls the full numbering sequence — including series type, year basis, padding, and reset rules.
                Policies are configured and managed on the dedicated Code Generation Policy page.
              </div>
              <button
                type="button"
                onClick={() => navigate('/admin/master/code-generation-policy')}
                style={{ ...btnPrimary, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Open Code Generation Policy
                <ArrowRight size={13} />
              </button>
            </div>
            {/* Compact summary table */}
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Configured Policies</span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{codeGenEntries.length} {codeGenEntries.length === 1 ? 'policy' : 'policies'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 120px 100px', alignItems: 'center', padding: '8px 20px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                {[
                  { label: 'Sample Code',    align: 'left' },
                  { label: 'Setting Name',   align: 'left' },
                  { label: 'Applicable For', align: 'left' },
                  { label: 'Status',         align: 'left' },
                ].map(({ label, align }) => (
                  <div key={label} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: align as React.CSSProperties['textAlign'] }}>{label}</div>
                ))}
              </div>
              {codeGenEntries.map((entry, idx) => {
                const appColor = getApplicableColor(entry.applicableFor);
                const isLast   = idx === codeGenEntries.length - 1;
                return (
                  <div key={entry.id} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 120px 100px', alignItems: 'center', padding: '12px 20px', borderBottom: isLast ? 'none' : '1px solid var(--color-border)' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)' }}>{buildCodePreview(entry)}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.settingName}</div>
                    <div>
                      <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '6px', background: appColor.bg, color: appColor.text }}>{(entry.applicableFor || '—').toUpperCase()}</span>
                    </div>
                    <div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '9999px', background: entry.activeStatus ? 'color-mix(in srgb, #10b981 15%, var(--color-surface))' : 'var(--color-surface-subtle)', color: entry.activeStatus ? 'color-mix(in srgb, #10b981 85%, var(--color-text))' : 'var(--color-text-muted)' }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: entry.activeStatus ? '#10b981' : 'var(--color-border)' }} />
                        {entry.activeStatus ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </AdminListPageShell>

      {/* ── Preview Drawer ────────────────────────────────────────── */}
      <SmartPreviewDrawer
        open={previewOpen && !!previewEntry}
        onClose={closePreview}
        title={previewEntry?.prefixName ?? ''}
        subtitle={previewEntry ? `${previewEntry.prefixCode} · ${previewEntry.applicableFor}` : undefined}
        statusLabel={previewEntry?.activeStatus ? 'Active' : 'Inactive'}
        statusTone={previewEntry?.activeStatus ? 'active' : 'inactive'}
        summaryFields={previewEntry ? [
          { label: 'Prefix Code',    value: previewEntry.prefixCode,   mono: true },
          { label: 'Prefix Value',   value: previewEntry.prefixValue,  mono: true },
          { label: 'Default',        value: previewEntry.defaultPrefix ? 'Yes' : 'No' },
          { label: 'Format Preview', value: buildPreview(previewEntry), mono: true },
        ] : []}
        sections={previewEntry ? [
          {
            title: 'Identity',
            fields: [
              { label: 'Prefix Name',    value: previewEntry.prefixName },
              { label: 'Display Name',   value: previewEntry.displayName || '—' },
              { label: 'Applicable For', value: previewEntry.applicableFor },
              { label: 'Module',         value: previewEntry.module || '—' },
            ],
          },
          {
            title: 'Entity',
            fields: [
              { label: 'Entity',      value: previewEntry.entity || '—' },
              { label: 'Entity Type', value: previewEntry.entityType || '—' },
            ],
          },
          {
            title: 'System Information',
            fields: [
              { label: 'Created By',       value: previewEntry.createdBy || '—' },
              { label: 'Created Date',     value: previewEntry.createdDate || '—' },
              { label: 'Last Modified By', value: previewEntry.lastModifiedBy || '—' },
              { label: 'Last Modified',    value: previewEntry.lastModifiedDate || '—' },
            ],
          },
        ] : []}
        primaryAction={{ label: 'Edit Prefix', onClick: () => previewEntry && openFormDrawer(previewEntry) }}
        dangerAction={
          previewEntry?.activeStatus
            ? { label: 'Deactivate', onClick: () => { if (previewEntry) { toggleStatus(previewEntry.id); closePreview(); } } }
            : { label: 'Activate',   onClick: () => { if (previewEntry) { toggleStatus(previewEntry.id); closePreview(); } } }
        }
      />

      {/* ── Form Drawer ──────────────────────────────────────────── */}
      <SmartFormDrawer
        open={formDrawerOpen}
        onClose={closeFormDrawer}
        title={editingEntry ? 'Edit Code Prefix' : 'New Code Prefix'}
        subtitle="Configure prefix identity and document scope."
        onSave={handleFormSave}
        saveDisabled={!canSaveForm}
        isDirty={formDirty}
        width="md"
      >
        {/* Live preview strip */}
        <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', background: 'color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))', border: '1.5px solid color-mix(in srgb, var(--color-primary) 25%, var(--color-border))' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Format Preview</div>
          <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 800, color: 'color-mix(in srgb, var(--color-primary) 85%, var(--color-text))', letterSpacing: '0.05em', lineHeight: 1 }}>
            {buildPreview(formData)}
          </div>
        </div>
        {/* Identity card */}
        <div style={{ background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px' }}>Identity</div>
          <DField label="Prefix Code">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: '10px' }}>
              <span style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8', fontWeight: 600, flexShrink: 0 }}>AUTO</span>
              <span style={{ fontSize: '13px', color: formData.prefixCode ? 'var(--color-text)' : 'var(--color-text-muted)', fontFamily: formData.prefixCode ? 'monospace' : undefined }}>
                {formData.prefixCode || 'System generated'}
              </span>
            </div>
          </DField>
          <DField label="Prefix Name" required mt>
            <DrawerInput value={formData.prefixName} onChange={(v) => setFormField('prefixName', v)} placeholder="e.g. Sales Order Prefix" />
          </DField>
          <DField label="Display Name" mt>
            <DrawerInput value={formData.displayName} onChange={(v) => setFormField('displayName', v)} placeholder="e.g. Sales Order" />
          </DField>
          <DField label="Applicable For" required mt>
            <SegmentedControl value={formData.applicableFor} onChange={(v) => setFormField('applicableFor', v)} options={['Master', 'Transaction']} />
          </DField>
          <DField label="Module" mt>
            <DrawerSelect value={formData.module} onChange={(v) => setFormField('module', v)} options={['Sales', 'Purchase', 'Finance', 'Inventory', 'HR', 'CRM', 'Operations']} />
          </DField>
          <DField label="Entity" mt>
            <DrawerSelect value={formData.entity} onChange={(v) => setFormField('entity', v)} options={['Customer', 'Supplier', 'Product', 'Employee', 'Asset', 'Sales Order', 'Purchase Order', 'Sales Invoice', 'Purchase Invoice', 'Delivery Note']} />
          </DField>
          <DField label="Entity Type" mt>
            <DrawerSelect value={formData.entityType} onChange={(v) => setFormField('entityType', v)} options={['Standard', 'Return', 'Credit', 'Debit', 'Internal', 'External']} />
          </DField>
        </div>
        {/* Format card */}
        <div style={{ background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px' }}>Format</div>
          <DField label="Prefix Value" required>
            <DrawerInput value={formData.prefixValue} onChange={(v) => setFormField('prefixValue', v)} placeholder="e.g. SO, PO, INV" />
          </DField>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', padding: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>Default Prefix</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Use as default for this entity type</div>
            </div>
            <Toggle checked={formData.defaultPrefix} onChange={(v) => setFormField('defaultPrefix', v)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', padding: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>Active Status</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Prefix is available for use</div>
            </div>
            <Toggle checked={formData.activeStatus} onChange={(v) => setFormField('activeStatus', v)} activeColor="#16a34a" />
          </div>
        </div>
        {/* System info (edit mode) */}
        {editingEntry && (
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px' }}>System Information</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <DField label="Created By"><div style={roStyle}>{formData.createdBy || '—'}</div></DField>
              <DField label="Created Date"><div style={roStyle}>{formData.createdDate || '—'}</div></DField>
              <DField label="Last Modified By"><div style={roStyle}>{formData.lastModifiedBy || '—'}</div></DField>
              <DField label="Last Modified"><div style={roStyle}>{formData.lastModifiedDate || '—'}</div></DField>
            </div>
          </div>
        )}
      </SmartFormDrawer>

      {/* ── Help Drawer ───────────────────────────────────────────── */}
      {helpTopic && (
        <HelpDrawer open={helpOpen} topic={helpTopic} onClose={() => setHelpOpen(false)} onTopicChange={(id) => setHelpTopicId(id)} />
      )}
    </AdminShell>
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
