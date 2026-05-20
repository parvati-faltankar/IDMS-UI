import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Edit2, Hash, Plus, Save, Trash2, X } from 'lucide-react';
import AdminShell from '../AdminShell';
import { findGroupForMasterKey, findMasterByKey } from '../adminNavConfig';
import { recordRecentAdminMaster } from '../adminStorage';

// ─── Constants ────────────────────────────────────────────────────────────────

const MASTER_KEY = 'numbering-code-setup';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PrefixEntry {
  id: string;
  documentType: string;
  prefix: string;
  separator: string;
  includeYear: string;
  counterFormat: string;
  paddingLength: string;
  resetFrequency: string;
  startingNumber: string;
}

interface CodeGenData {
  entityType: string;
  autoGenerate: string;
  codePrefix: string;
  codeStartNumber: string;
  codeIncrement: string;
  codeFormat: string;
  overrideAllowed: string;
}

type SectionKey = 'numbering' | 'codegen';

// ─── Section config ────────────────────────────────────────────────────────────

const SECTIONS: Array<{ key: SectionKey; label: string; description: string }> = [
  { key: 'numbering', label: 'Document Number Prefix', description: 'Numbering format per document type' },
  { key: 'codegen',   label: 'Code Generation',        description: 'Auto-code rules per entity type' },
];

// ─── Mock initial data ─────────────────────────────────────────────────────────

const INITIAL_ENTRIES: PrefixEntry[] = [
  { id: '1', documentType: 'Sales Order',    prefix: 'SO',  separator: '-', includeYear: 'Yes', counterFormat: '001 (3 digits)',  paddingLength: '3', resetFrequency: 'Yearly', startingNumber: '1' },
  { id: '2', documentType: 'Purchase Order', prefix: 'PO',  separator: '-', includeYear: 'Yes', counterFormat: '001 (3 digits)',  paddingLength: '3', resetFrequency: 'Yearly', startingNumber: '1' },
  { id: '3', documentType: 'Sales Invoice',  prefix: 'INV', separator: '/', includeYear: 'Yes', counterFormat: '0001 (4 digits)', paddingLength: '4', resetFrequency: 'Yearly', startingNumber: '1' },
];

const EMPTY_ENTRY: Omit<PrefixEntry, 'id'> = {
  documentType: '', prefix: '', separator: '-', includeYear: 'Yes',
  counterFormat: '', paddingLength: '3', resetFrequency: 'Yearly', startingNumber: '1',
};

// ─── Document type colour palette ─────────────────────────────────────────────

const DOC_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  'Sales Order':      { bg: '#EFF6FF', text: '#1D4ED8' },
  'Purchase Order':   { bg: '#F0FDF4', text: '#15803D' },
  'Sales Invoice':    { bg: '#FFF7ED', text: '#C2410C' },
  'Purchase Invoice': { bg: '#FDF4FF', text: '#7C3AED' },
  'Delivery Note':    { bg: '#ECFEFF', text: '#0E7490' },
  'Credit Note':      { bg: '#FFF1F2', text: '#BE123C' },
  'Debit Note':       { bg: '#FEF9C3', text: '#854D0E' },
  'Quotation':        { bg: '#F0FDF4', text: '#166534' },
  'Stock Transfer':   { bg: '#F8FAFC', text: '#475569' },
};
const getDocTypeColor = (t: string) => DOC_TYPE_COLORS[t] ?? { bg: '#F1F5F9', text: '#475569' };

// ─── Preview helper ────────────────────────────────────────────────────────────

function buildPreview(entry: Omit<PrefixEntry, 'id'>): string {
  const prefix = entry.prefix || 'DOC';
  const sep = entry.separator || '-';
  const year = entry.includeYear === 'Yes' ? `${sep}2024` : '';
  const pad = parseInt(entry.paddingLength || '3', 10);
  const counter = String(parseInt(entry.startingNumber || '1', 10)).padStart(pad, '0');
  return `${prefix}${year}${sep}${counter}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

const NumberingSettingsPage: React.FC = () => {
  const navigate = useNavigate();

  const master = findMasterByKey(MASTER_KEY);
  const group  = findGroupForMasterKey(MASTER_KEY);

  const [activeSection, setActiveSection] = useState<SectionKey>('numbering');

  // ── Prefix entries ─────────────────────────────────────────────
  const [entries,       setEntries]       = useState<PrefixEntry[]>(INITIAL_ENTRIES);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingEntry,  setEditingEntry]  = useState<PrefixEntry | null>(null);
  const [drawerForm,    setDrawerForm]    = useState<Omit<PrefixEntry, 'id'>>(EMPTY_ENTRY);

  // ── Code generation settings ────────────────────────────────────
  const [codeGen,        setCodeGen]        = useState<CodeGenData>({
    entityType: '', autoGenerate: 'Yes', codePrefix: '',
    codeStartNumber: '1', codeIncrement: '1', codeFormat: '', overrideAllowed: 'No',
  });
  const [codeGenDirty,   setCodeGenDirty]   = useState(false);
  const [codeGenSaving,  setCodeGenSaving]  = useState(false);
  const [codeGenSuccess, setCodeGenSuccess] = useState(false);

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
    if (!drawerForm.documentType || !drawerForm.prefix) return;
    if (editingEntry) {
      setEntries((prev) => prev.map((e) => e.id === editingEntry.id ? { ...drawerForm, id: editingEntry.id } : e));
    } else {
      setEntries((prev) => [...prev, { ...drawerForm, id: Date.now().toString() }]);
    }
    closeDrawer();
  };

  const deleteEntry = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  // ── Code gen helpers ─────────────────────────────────────────────
  const updateCodeGen = (field: keyof CodeGenData, value: string) => {
    setCodeGen((prev) => ({ ...prev, [field]: value }));
    setCodeGenDirty(true);
  };

  const saveCodeGen = () => {
    setCodeGenSaving(true);
    window.setTimeout(() => {
      setCodeGenSaving(false);
      setCodeGenDirty(false);
      setCodeGenSuccess(true);
      window.setTimeout(() => setCodeGenSuccess(false), 3000);
    }, 600);
  };

  // ── Section completion ───────────────────────────────────────────
  const sectionCompletion = (key: SectionKey): 'complete' | 'partial' | 'empty' => {
    if (key === 'numbering') return entries.length > 0 ? 'complete' : 'empty';
    if (codeGen.entityType && codeGen.autoGenerate) return 'complete';
    if (Object.values(codeGen).some((v) => !!v)) return 'partial';
    return 'empty';
  };

  if (!master || !group) return null;

  const GroupIcon = group.icon;
  const completedCount = SECTIONS.filter((s) => sectionCompletion(s.key) === 'complete').length;

  return (
    <AdminShell>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-surface-subtle)' }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, padding: '10px 24px 12px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', background: group.iconBg, flexShrink: 0 }}>
              <GroupIcon size={14} style={{ color: group.iconColor }} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.2 }}>
                {master.label}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '1px' }}>
                {master.description}
              </div>
            </div>
            <button type="button" onClick={() => navigate('/admin')} style={btnOutline}>Close</button>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* Left nav */}
          <aside style={{ width: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)', overflowY: 'auto' }}>
            <div style={{ flex: 1 }}>
              {SECTIONS.map((section, idx) => {
                const isActive = activeSection === section.key;
                const completion = sectionCompletion(section.key);
                const isLast = idx === SECTIONS.length - 1;
                return (
                  <button
                    key={section.key}
                    type="button"
                    onClick={() => setActiveSection(section.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      width: '100%', padding: '14px 16px 14px 14px',
                      background: isActive ? 'rgba(59,130,246,0.06)' : 'transparent',
                      borderWidth: '0 0 0 3px', borderStyle: 'solid',
                      borderColor: `transparent transparent transparent ${isActive ? 'var(--color-primary)' : 'transparent'}`,
                      borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'background 0.15s', outline: 'none',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--color-primary)' : 'var(--color-text)', lineHeight: 1.4 }}>
                        {section.label}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {section.description}
                      </div>
                    </div>
                    {completion === 'complete'
                      ? <CheckCircle2 size={16} style={{ flexShrink: 0, color: '#16a34a' }} />
                      : <ChevronRight size={16} style={{ flexShrink: 0, color: isActive ? 'var(--color-primary)' : 'var(--color-border)', strokeWidth: isActive ? 2.5 : 1.5 }} />
                    }
                  </button>
                );
              })}
            </div>

            {/* Progress */}
            <div style={{ padding: '14px 16px', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Progress</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-primary)' }}>{completedCount}/{SECTIONS.length}</span>
              </div>
              <div style={{ height: '3px', background: 'var(--color-border)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--color-primary)', borderRadius: '9999px', width: `${(completedCount / SECTIONS.length) * 100}%`, transition: 'width 0.3s ease' }} />
              </div>
            </div>
          </aside>

          {/* Right content */}
          <main style={{ flex: 1, overflowY: 'auto', padding: '28px 36px' }}>

            {/* ── Document Number Prefix — LIST VIEW ──────────── */}
            {activeSection === 'numbering' && (
              <div>
                {/* Toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)' }}>Document Number Prefix</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {entries.length} {entries.length === 1 ? 'configuration' : 'configurations'} defined
                    </div>
                  </div>
                  <button type="button" onClick={openDrawerForCreate} style={btnPrimary}>
                    <Plus size={13} />
                    New Prefix
                  </button>
                </div>

                {/* Empty state */}
                {entries.length === 0 ? (
                  <div style={{ border: '2px dashed var(--color-border)', borderRadius: '12px', padding: '56px 24px', textAlign: 'center' }}>
                    <Hash size={32} style={{ color: 'var(--color-border)', margin: '0 auto 12px' }} />
                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '4px' }}>No prefix configurations yet</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
                      Create a prefix for each document type to control how numbers are generated.
                    </div>
                    <button type="button" onClick={openDrawerForCreate} style={btnPrimary}>
                      <Plus size={13} />
                      Create First Prefix
                    </button>
                  </div>
                ) : (
                  /* Entry cards */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {entries.map((entry) => {
                      const color = getDocTypeColor(entry.documentType);
                      return (
                        <div
                          key={entry.id}
                          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '16px' }}
                          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                        >
                          <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '6px', background: color.bg, color: color.text, flexShrink: 0, whiteSpace: 'nowrap' }}>
                            {entry.documentType}
                          </span>
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)' }}>
                              {buildPreview(entry)}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>·</span>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Resets {entry.resetFrequency}</span>
                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>·</span>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{entry.counterFormat}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => openDrawerForEdit(entry)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 11px', fontSize: '12px', fontWeight: 500, border: '1px solid var(--color-border)', borderRadius: '7px', background: 'transparent', color: 'var(--color-text)', cursor: 'pointer' }}
                            >
                              <Edit2 size={12} />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteEntry(entry.id)}
                              style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 8px', border: '1px solid transparent', borderRadius: '7px', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Code Generation — settings form ──────────────── */}
            {activeSection === 'codegen' && (
              <SectionPanel
                title="Code Generation"
                filledCount={Object.values(codeGen).filter(Boolean).length}
                totalCount={Object.keys(codeGen).length}
                completion={sectionCompletion('codegen')}
              >
                <FormGrid>
                  <Field label="Entity Type" required>
                    <SelectInput value={codeGen.entityType} onChange={(v) => updateCodeGen('entityType', v)} options={['Customer', 'Supplier', 'Product', 'Employee', 'Asset', 'Warehouse', 'Route', 'Territory']} />
                  </Field>
                  <Field label="Auto Generate" required>
                    <SelectInput value={codeGen.autoGenerate} onChange={(v) => updateCodeGen('autoGenerate', v)} options={['Yes', 'No']} />
                  </Field>
                  <Field label="Code Prefix" hint="Prepended to every generated code">
                    <TextInput value={codeGen.codePrefix} onChange={(v) => updateCodeGen('codePrefix', v)} placeholder="e.g. CUST, PROD" />
                  </Field>
                  <Field label="Number Format">
                    <SelectInput value={codeGen.codeFormat} onChange={(v) => updateCodeGen('codeFormat', v)} options={['Numeric (001, 002…)', 'Alphanumeric (A001, B001…)']} />
                  </Field>
                  <Field label="Starting Number">
                    <TextInput type="number" value={codeGen.codeStartNumber} onChange={(v) => updateCodeGen('codeStartNumber', v)} placeholder="1" />
                  </Field>
                  <Field label="Increment By">
                    <TextInput type="number" value={codeGen.codeIncrement} onChange={(v) => updateCodeGen('codeIncrement', v)} placeholder="1" />
                  </Field>
                  <Field label="Allow Manual Override" span={2}>
                    <SelectInput value={codeGen.overrideAllowed} onChange={(v) => updateCodeGen('overrideAllowed', v)} options={['Yes — user can enter their own code', 'No — auto-generated code only']} />
                  </Field>
                </FormGrid>

                {codeGen.autoGenerate === 'No' && (
                  <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '8px', background: '#FFF7ED', border: '1px solid #FED7AA' }}>
                    <p style={{ fontSize: '12px', color: '#9A3412', margin: 0 }}>
                      <strong>Note:</strong> Auto-generate is off. Users will be required to enter codes manually for this entity type.
                    </p>
                  </div>
                )}

                {/* Save row */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                  {codeGenDirty && <span style={{ display: 'flex', alignItems: 'center', fontSize: '11px', color: '#92400E', background: '#FEF3C7', padding: '2px 10px', borderRadius: '9999px' }}>Unsaved changes</span>}
                  {codeGenSuccess && <span style={{ display: 'flex', alignItems: 'center', fontSize: '11px', color: '#065F46', background: '#D1FAE5', padding: '2px 10px', borderRadius: '9999px' }}>✓ Saved</span>}
                  <button type="button" disabled={codeGenSaving} onClick={saveCodeGen} style={{ ...btnPrimary, opacity: codeGenSaving ? 0.7 : 1 }}>
                    <Save size={13} />
                    {codeGenSaving ? 'Saving…' : 'Save Settings'}
                  </button>
                </div>
              </SectionPanel>
            )}
          </main>
        </div>
      </div>

      {/* ── Drawer ──────────────────────────────────────────────── */}
      {drawerOpen && (
        <PrefixDrawer
          visible={drawerVisible}
          isEdit={!!editingEntry}
          formData={drawerForm}
          onClose={closeDrawer}
          onChangeField={(field, value) => setDrawerForm((prev) => ({ ...prev, [field]: value }))}
          onSave={saveDrawerEntry}
        />
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
  onChangeField: (field: keyof Omit<PrefixEntry, 'id'>, value: string) => void;
  onSave: () => void;
}

const PrefixDrawer: React.FC<PrefixDrawerProps> = ({ visible, isEdit, formData, onClose, onChangeField, onSave }) => {
  const canSave = !!formData.documentType && !!formData.prefix && !!formData.counterFormat;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200 }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${visible ? 0.35 : 0})`, transition: 'background 0.25s ease' }}
      />
      {/* Panel */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: '480px',
        background: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column',
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s ease',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
      }}>
        {/* Header */}
        <div style={{ flexShrink: 0, padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)' }}>
              {isEdit ? 'Edit Document Number Prefix' : 'New Document Number Prefix'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Configure how numbers are generated for this document type
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ display: 'inline-flex', alignItems: 'center', padding: '6px', border: '1px solid transparent', borderRadius: '7px', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Field label="Document Type" required>
              <SelectInput
                value={formData.documentType}
                onChange={(v) => onChangeField('documentType', v)}
                options={['Sales Order', 'Purchase Order', 'Sales Invoice', 'Purchase Invoice', 'Delivery Note', 'Credit Note', 'Debit Note', 'Quotation', 'Stock Transfer']}
              />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Field label="Prefix" required hint="e.g. SO, PO, INV">
                <TextInput value={formData.prefix} onChange={(v) => onChangeField('prefix', v)} placeholder="e.g. SO" />
              </Field>
              <Field label="Separator">
                <SelectInput value={formData.separator} onChange={(v) => onChangeField('separator', v)} options={['-', '/', '.', '_', '']} />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Field label="Include Year in Number">
                <SelectInput value={formData.includeYear} onChange={(v) => onChangeField('includeYear', v)} options={['Yes', 'No']} />
              </Field>
              <Field label="Counter Format" required>
                <SelectInput value={formData.counterFormat} onChange={(v) => onChangeField('counterFormat', v)} options={['001 (3 digits)', '0001 (4 digits)', '00001 (5 digits)', '1 (no padding)']} />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Field label="Reset Frequency">
                <SelectInput value={formData.resetFrequency} onChange={(v) => onChangeField('resetFrequency', v)} options={['Never', 'Yearly', 'Monthly', 'Daily']} />
              </Field>
              <Field label="Starting Number">
                <TextInput type="number" value={formData.startingNumber} onChange={(v) => onChangeField('startingNumber', v)} placeholder="1" />
              </Field>
            </div>
            {/* Live preview */}
            <div style={{ padding: '14px 18px', borderRadius: '8px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Generated number preview</span>
              <span style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.05em' }}>
                {buildPreview(formData)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0, padding: '14px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" onClick={onClose} style={btnOutline}>Cancel</button>
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            style={{ ...btnPrimary, opacity: canSave ? 1 : 0.5, cursor: canSave ? 'pointer' : 'not-allowed' }}
          >
            <Save size={13} />
            {isEdit ? 'Save Changes' : 'Create Prefix'}
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
const btnOutline: React.CSSProperties = { ...btnBase, background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)' };
const btnPrimary: React.CSSProperties = { ...btnBase, background: 'var(--color-primary)', border: '1px solid var(--color-primary)', color: 'white', fontWeight: 600 };

// ─── SectionPanel ─────────────────────────────────────────────────────────────

interface SectionPanelProps {
  title: string;
  filledCount: number;
  totalCount: number;
  completion: 'complete' | 'partial' | 'empty';
  children: React.ReactNode;
}

const SectionPanel: React.FC<SectionPanelProps> = ({ title, filledCount, totalCount, completion, children }) => {
  const badge =
    completion === 'complete'
      ? { label: 'Complete',    color: '#15803D', dot: '#16A34A' }
      : completion === 'partial'
      ? { label: 'In progress', color: '#1D4ED8', dot: '#3B82F6' }
      : { label: 'Not started', color: '#94A3B8', dot: '#CBD5E1' };

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 20px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{filledCount} / {totalCount} filled</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 500, color: badge.color }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: badge.dot, flexShrink: 0 }} />
            {badge.label}
          </span>
        </div>
      </div>
      <div style={{ padding: '24px 20px' }}>
        {children}
      </div>
    </div>
  );
};

// ─── FormGrid ─────────────────────────────────────────────────────────────────

const FormGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
    {children}
  </div>
);

// ─── Field ────────────────────────────────────────────────────────────────────

interface FieldProps { label: string; required?: boolean; hint?: string; span?: number; children: React.ReactNode; }

const Field: React.FC<FieldProps> = ({ label, required, hint, span, children }) => (
  <div style={{ gridColumn: span === 2 ? 'span 2 / span 2' : undefined }}>
    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '5px' }}>
      {label}{required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
    </label>
    {children}
    {hint && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '3px' }}>{hint}</div>}
  </div>
);

// ─── Input base ───────────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: '100%', padding: '7px 11px', fontSize: '13px',
  border: '1px solid var(--color-border)', borderRadius: '8px',
  background: 'var(--color-surface)', color: 'var(--color-text)',
  outline: 'none', boxSizing: 'border-box',
};

interface TextInputProps { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; }
const TextInput: React.FC<TextInputProps> = ({ value, onChange, placeholder, type = 'text' }) => (
  <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputBase} />
);

interface SelectInputProps { value: string; onChange: (v: string) => void; options: string[]; }
const SelectInput: React.FC<SelectInputProps> = ({ value, onChange, options }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputBase, cursor: 'pointer' }}>
    <option value="">— Select —</option>
    {options.map((o) => <option key={o} value={o}>{o}</option>)}
  </select>
);

export default NumberingSettingsPage;
