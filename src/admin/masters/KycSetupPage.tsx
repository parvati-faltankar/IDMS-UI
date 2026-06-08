import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FileText,
  Globe,
  LayoutGrid,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  User,
  X,
  ZapOff,
} from 'lucide-react';
import AdminShell from '../AdminShell';
import { AdminPageShell } from '../../experience/components/AdminPageShell';
import { AdminListPageShell } from '../../experience/components/AdminListPageShell';
import { findGroupForMasterKey, findMasterByKey } from '../adminNavConfig';
import { recordRecentAdminMaster } from '../adminStorage';
import { ValidationChecklist } from '../../experience/components/ValidationChecklist';
import { FieldHelpPopover } from '../../experience/components/FieldHelpPopover';
import { HelpDrawer } from '../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../experience/help/helpTopics';
import { getFieldHelp } from '../../experience/help/fieldHelp';

// ─── Constants ────────────────────────────────────────────────────────────────

const MASTER_KEY = 'kyc-setup';

const COUNTRIES: Array<{ code: string; name: string; flag: string }> = [
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: 'US', name: 'USA', flag: '🇺🇸' },
  { code: 'GB', name: 'UK', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
];

const ENTITIES = ['Customer', 'Supplier', 'Employee', 'Vendor', 'Partner'] as const;

const ENTITY_TYPE_MAP: Record<string, string[]> = {
  Customer: ['Individual', 'Corporate', 'Government'],
  Supplier: ['Individual', 'Corporate', 'Partnership', 'LLP'],
  Employee: ['Permanent', 'Contractor', 'Intern'],
  Vendor: ['Individual', 'Corporate'],
  Partner: ['Individual', 'Corporate', 'JV'],
};

const PROOF_CATEGORIES = [
  'Identity Proof',
  'Address Proof',
  'Financial Proof',
  'Business Proof',
  'Other',
] as const;

type ProofCategory = typeof PROOF_CATEGORIES[number];

const PROOF_TYPE_MAP: Record<ProofCategory, string[]> = {
  'Identity Proof':  ['Aadhaar Card', 'Passport', 'Driving License', 'Election Card', 'PAN Card', 'National ID'],
  'Address Proof':   ['Electricity Bill', 'Gas Bill', 'Telephone Bill', 'Bank Statement', 'Rental Agreement', 'Passport'],
  'Financial Proof': ['Bank Statement', 'ITR', 'Salary Slip', 'Balance Sheet', 'Audited Financials'],
  'Business Proof':  ['GST Certificate', 'Business License', 'Incorporation Certificate', 'MSME Certificate', 'Trade License'],
  'Other':           ['Photograph', 'Signature Card', 'Letter of Authorization', 'Other Document'],
};

const FILE_TYPES = ['PDF', 'JPG', 'PNG', 'XLSX', 'DOCX', 'CSV'] as const;

const DEACTIVATION_REASONS = [
  'Replaced by Updated Configuration',
  'Entity No Longer Applicable',
  'Regulatory Change',
  'Incorrect Configuration',
  'Duplicate Configuration',
  'Business Process Change',
  'Other',
];

// ─── Section config ───────────────────────────────────────────────────────────

type KycSectionKey = 'overview' | 'kyc-grid' | 'checklist';

const KYC_SECTIONS: Array<{ key: KycSectionKey; label: string; icon: React.ElementType; description: string }> = [
  { key: 'overview',  label: 'Overview',            icon: User,          description: 'Identity, entity and status' },
  { key: 'kyc-grid',  label: 'KYC Grid',             icon: LayoutGrid,    description: 'Country-wise proof requirements' },
  { key: 'checklist', label: 'Activation Checklist', icon: ClipboardCheck, description: 'Review and activate configuration' },
];

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface KycProofRow {
  id: string;
  country: string;
  proofCategory: string;
  proofType: string;
  documentNumberRequired: boolean;
  tooltip: string;
  placeholderText: string;
  isCharAllowed: boolean;
  isNumberAllowed: boolean;
  isSpecialCharAllowed: boolean;
  allowedSpecialCharacters: string;
  minLength: string;
  maxLength: string;
  mustMatchRegex: boolean;
  regexPattern: string;
  regexErrorMessage: string;
  isAttachmentEnabled: boolean;
  isAttachmentMandatory: boolean;
  allowedFileTypes: string[];
  maxFileSize: string;
  minFileSize: string;
  maximumFileCount: string;
  isMandatory: boolean;
  isActive: boolean;
}

interface KycFormData {
  name: string;
  displayName: string;
  entity: string;
  entityType: string;
  description: string;
  isActive: boolean;
  proofRows: KycProofRow[];
}

interface KycConfig extends KycFormData {
  id: string;
  code: string;
  status: 'Draft' | 'Active' | 'Inactive';
}

type FormMode = 'add' | 'edit' | 'view';
type ViewMode = 'list' | 'form';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_ROW: Omit<KycProofRow, 'id'> = {
  country: '', proofCategory: '', proofType: '',
  documentNumberRequired: false, tooltip: '', placeholderText: '',
  isCharAllowed: true, isNumberAllowed: true, isSpecialCharAllowed: false,
  allowedSpecialCharacters: '', minLength: '', maxLength: '',
  mustMatchRegex: false, regexPattern: '', regexErrorMessage: '',
  isAttachmentEnabled: false, isAttachmentMandatory: false,
  allowedFileTypes: [], maxFileSize: '', minFileSize: '', maximumFileCount: '',
  isMandatory: false, isActive: true,
};

const EMPTY_FORM: KycFormData = {
  name: '', displayName: '', entity: '', entityType: '',
  description: '', isActive: true, proofRows: [],
};

function genId() { return Math.random().toString(36).slice(2, 10); }

function getStatusStyle(status: KycConfig['status']) {
  if (status === 'Active')   return {
    background: 'color-mix(in srgb, #10b981 15%, var(--color-surface))',
    color: 'color-mix(in srgb, #10b981 85%, var(--color-text))'
  };
  if (status === 'Inactive') return {
    background: 'color-mix(in srgb, var(--color-danger) 10%, var(--color-surface))',
    color: 'var(--color-danger)'
  };
  return {
    background: 'color-mix(in srgb, #f59e0b 10%, var(--color-surface))',
    color: 'color-mix(in srgb, #f59e0b 80%, var(--color-text))'
  };
}
function getStatusDot(status: KycConfig['status']) {
  if (status === 'Active')   return 'color-mix(in srgb, #10b981 90%, var(--color-text))';
  if (status === 'Inactive') return 'var(--color-danger)';
  return 'color-mix(in srgb, #f59e0b 80%, var(--color-text))';
}

const MOCK_CONFIGS: KycConfig[] = [
  {
    id: '1', code: 'KYC-001', name: 'Individual Customer KYC', displayName: 'Individual Customer KYC',
    entity: 'Customer', entityType: 'Individual', description: 'KYC for individual customers',
    isActive: true, status: 'Active',
    proofRows: [
      { id: 'r1', country: 'India', proofCategory: 'Identity Proof', proofType: 'Aadhaar Card', documentNumberRequired: true, tooltip: 'Enter 12-digit Aadhaar number', placeholderText: 'XXXX XXXX XXXX', isCharAllowed: false, isNumberAllowed: true, isSpecialCharAllowed: false, allowedSpecialCharacters: '', minLength: '12', maxLength: '12', mustMatchRegex: true, regexPattern: '^[0-9]{12}$', regexErrorMessage: 'Must be a 12-digit number', isAttachmentEnabled: true, isAttachmentMandatory: true, allowedFileTypes: ['PDF', 'JPG', 'PNG'], maxFileSize: '2048', minFileSize: '10', maximumFileCount: '2', isMandatory: true, isActive: true },
      { id: 'r2', country: 'India', proofCategory: 'Address Proof', proofType: 'Electricity Bill', documentNumberRequired: false, tooltip: '', placeholderText: '', isCharAllowed: true, isNumberAllowed: true, isSpecialCharAllowed: false, allowedSpecialCharacters: '', minLength: '', maxLength: '', mustMatchRegex: false, regexPattern: '', regexErrorMessage: '', isAttachmentEnabled: true, isAttachmentMandatory: false, allowedFileTypes: ['PDF', 'JPG'], maxFileSize: '5120', minFileSize: '10', maximumFileCount: '3', isMandatory: false, isActive: true },
    ],
  },
];

// ─── Section completion ───────────────────────────────────────────────────────

function getKycSectionCompletion(key: KycSectionKey, form: KycFormData): 'complete' | 'partial' | 'empty' {
  if (key === 'overview') {
    const filled = [form.name, form.entity, form.entityType].filter(Boolean).length;
    if (filled === 3) return 'complete';
    if (filled > 0) return 'partial';
    return 'empty';
  }
  if (key === 'kyc-grid') {
    const active = form.proofRows.filter(r => r.isActive).length;
    if (active > 0) return 'complete';
    if (form.proofRows.length > 0) return 'partial';
    return 'empty';
  }
  return 'empty'; // checklist is always read-only
}

// ─── Activation validation ────────────────────────────────────────────────────

interface ChecklistItem {
  key: string;
  label: string;
  detail: string;
  status: 'ok' | 'error' | 'warn';
  section: KycSectionKey;
  errors: string[];
}

function buildChecklist(form: KycFormData): ChecklistItem[] {
  const overviewErrors: string[] = [];
  if (!form.name) overviewErrors.push('Name is required');
  if (!form.entity) overviewErrors.push('Entity is required');
  if (!form.entityType) overviewErrors.push('Entity Type is required');

  const gridErrors: string[] = [];
  const activeRows = form.proofRows.filter(r => r.isActive);
  if (form.proofRows.length === 0) gridErrors.push('At least one proof row is required');
  else if (activeRows.length === 0) gridErrors.push('At least one proof row must be active');

  const rowValidationErrors: string[] = [];
  form.proofRows.forEach(row => {
    const label = `${row.country || '?'} · ${row.proofType || '?'}`;
    if (!row.country) rowValidationErrors.push(`${label} — Country is missing`);
    if (!row.proofCategory) rowValidationErrors.push(`${label} — Proof Category is missing`);
    if (!row.proofType) rowValidationErrors.push(`${label} — Proof Type is missing`);
    if (row.documentNumberRequired && !row.isCharAllowed && !row.isNumberAllowed && !row.isSpecialCharAllowed)
      rowValidationErrors.push(`${label} — At least one format option (Character/Number/Special) must be selected`);
    if (row.mustMatchRegex && !row.regexPattern)
      rowValidationErrors.push(`${label} — Regex Pattern is required when Must Match Regex is on`);
    if (row.mustMatchRegex && !row.regexErrorMessage)
      rowValidationErrors.push(`${label} — Regex Error Message is required`);
    if (row.isSpecialCharAllowed && !row.allowedSpecialCharacters)
      rowValidationErrors.push(`${label} — Allowed Special Characters is required`);
  });

  return [
    {
      key: 'overview',
      label: 'Overview Complete',
      detail: overviewErrors.length === 0
        ? `${form.name} · ${form.entity} · ${form.entityType}`
        : 'Name, Entity, and Entity Type are required',
      status: overviewErrors.length === 0 ? 'ok' : 'error',
      section: 'overview',
      errors: overviewErrors,
    },
    {
      key: 'grid-rows',
      label: 'At least 1 active proof',
      detail: activeRows.length > 0
        ? `${activeRows.length} active proof${activeRows.length > 1 ? 's' : ''} configured`
        : 'No active proof rows',
      status: gridErrors.length === 0 ? 'ok' : 'error',
      section: 'kyc-grid',
      errors: gridErrors,
    },
    {
      key: 'row-validity',
      label: 'All proof rows are valid',
      detail: rowValidationErrors.length === 0
        ? 'All rows have required fields filled'
        : `${rowValidationErrors.length} issue${rowValidationErrors.length > 1 ? 's' : ''} found`,
      status: rowValidationErrors.length === 0 ? 'ok' : 'error',
      section: 'kyc-grid',
      errors: rowValidationErrors,
    },
  ];
}

// ─── Regex validator ──────────────────────────────────────────────────────────

function isValidRegex(pattern: string): boolean {
  try { new RegExp(pattern); return true; } catch { return false; }
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: '13px',
  border: '1px solid var(--color-border)', borderRadius: '8px',
  background: 'var(--color-surface)', color: 'var(--color-text)',
  outline: 'none', boxSizing: 'border-box',
};

const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '7px 14px', fontSize: '12px', fontWeight: 600,
  borderRadius: '8px', cursor: 'pointer', border: 'none',
};

const btnPrimary: React.CSSProperties = {
  ...btnBase, background: 'var(--color-primary)', color: 'white',
};
const btnOutline: React.CSSProperties = {
  ...btnBase, background: 'transparent', border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
};

// ─── Toggle component ─────────────────────────────────────────────────────────

interface ToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  size?: 'sm' | 'md';
}
const Toggle: React.FC<ToggleProps> = ({ value, onChange, disabled, label, description, size = 'md' }) => {
  const w = size === 'sm' ? 32 : 40;
  const h = size === 'sm' ? 18 : 22;
  const d = size === 'sm' ? 12 : 16;
  return (
    <div style={{ display: 'flex', alignItems: label ? 'flex-start' : 'center', gap: '10px' }}>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        disabled={disabled}
        onClick={() => !disabled && onChange(!value)}
        style={{
          flexShrink: 0, width: w, height: h, borderRadius: 9999,
          background: value ? 'var(--color-primary)' : 'var(--color-border)',
          border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
          position: 'relative', transition: 'background 0.2s', padding: 0,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span style={{
          position: 'absolute', top: (h - d) / 2, left: value ? w - d - (h - d) / 2 : (h - d) / 2,
          width: d, height: d, borderRadius: '50%', background: 'white',
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
      {label && (
        <div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>{label}</div>
          {description && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px', lineHeight: 1.4 }}>{description}</div>}
        </div>
      )}
    </div>
  );
};

// ─── Collapsible drawer card (toggle-as-header) ───────────────────────────────

interface DrawerCardProps {
  toggleLabel: string;
  toggleDescription?: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  disabled?: boolean;
  accentColor?: string;
  children: React.ReactNode;
}
const DrawerCard: React.FC<DrawerCardProps> = ({ toggleLabel, toggleDescription, enabled, onToggle, disabled, accentColor = 'var(--color-primary)', children }) => (
  <div style={{
    border: `1px solid ${enabled ? accentColor + '40' : 'var(--color-border)'}`,
    borderRadius: '10px', overflow: 'hidden',
    background: enabled ? 'var(--color-surface)' : 'var(--color-surface-subtle)',
    transition: 'border-color 0.2s, background 0.2s',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px',
      background: enabled ? accentColor + '08' : 'transparent',
      borderBottom: enabled ? `1px solid ${accentColor}25` : '1px solid transparent',
      transition: 'background 0.2s',
    }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: enabled ? accentColor : 'var(--color-text)' }}>{toggleLabel}</div>
        {toggleDescription && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{toggleDescription}</div>}
      </div>
      <Toggle value={enabled} onChange={onToggle} disabled={disabled} size="sm" />
    </div>
    {enabled && (
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {children}
      </div>
    )}
  </div>
);

// ─── Field + Label ────────────────────────────────────────────────────────────

interface DFieldProps { label: string; required?: boolean; error?: string; help?: React.ReactNode; children: React.ReactNode; }
const DField: React.FC<DFieldProps> = ({ label, required, error, help, children }) => (
  <div>
    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span>{label}{required && <span style={{ color: '#DC2626', marginLeft: '3px' }}>*</span>}</span>{help}
    </div>
    {children}
    {error && <div style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={11} />{error}</div>}
  </div>
);

// ─── Select helper ────────────────────────────────────────────────────────────

interface DSelectProps { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; disabled?: boolean; error?: string; }
const DSelect: React.FC<DSelectProps> = ({ value, onChange, options, placeholder = '— Select —', disabled, error }) => (
  <select
    value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
    style={{ ...inputBase, cursor: disabled ? 'not-allowed' : 'default', opacity: disabled ? 0.6 : 1, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: '30px', borderColor: error ? '#DC2626' : undefined }}
  >
    <option value="">{placeholder}</option>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

// ─── KycSectionPanel ──────────────────────────────────────────────────────────

interface KycSectionPanelProps {
  sectionKey: KycSectionKey;
  title: string;
  form: KycFormData;
  subtitle?: string;
  children: React.ReactNode;
}
const KycSectionPanel: React.FC<KycSectionPanelProps> = ({ sectionKey, title, form, subtitle, children }) => {
  const completion = getKycSectionCompletion(sectionKey, form);
  const badge = completion === 'complete'
    ? { label: 'Complete', color: '#15803D', dot: '#16A34A' }
    : completion === 'partial'
    ? { label: 'In progress', color: '#1D4ED8', dot: '#3B82F6' }
    : { label: 'Not started', color: '#94A3B8', dot: '#CBD5E1' };
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>{title}</span>
          {subtitle && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '1px' }}>{subtitle}</div>}
        </div>
        {sectionKey !== 'checklist' && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 500, color: badge.color }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: badge.dot }} />
            {badge.label}
          </span>
        )}
      </div>
      <div style={{ padding: '24px 20px' }}>{children}</div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const KycSetupPage: React.FC = () => {
  const master = findMasterByKey(MASTER_KEY);
  const group = findGroupForMasterKey(MASTER_KEY);

  useEffect(() => {
    if (master && group) {
      recordRecentAdminMaster({
        key: master.key, label: master.label, path: master.path,
        groupLabel: group.label, groupIconBg: group.iconBg, groupIconColor: group.iconColor,
      });
    }
  }, [master, group]);

  // ── View state ──────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [formMode, setFormMode] = useState<FormMode>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<KycSectionKey>('overview');

  // ── Data state ──────────────────────────────────────────────────────────────
  const [configs, setConfigs] = useState<KycConfig[]>(MOCK_CONFIGS);
  const [form, setForm] = useState<KycFormData>(EMPTY_FORM);
  const [displayNameTouched, setDisplayNameTouched] = useState(false);

  // ── List state ──────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');

  // ── Validation ──────────────────────────────────────────────────────────────
  const [activationErrors, setActivationErrors] = useState<string[]>([]);

  // ── Grid accordion ──────────────────────────────────────────────────────────
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());

  // ── Deactivation modal ──────────────────────────────────────────────────────
  const [deactivationOpen, setDeactivationOpen] = useState(false);
  const [deactivationTarget, setDeactivationTarget] = useState<KycConfig | null>(null);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [deactivationRemark, setDeactivationRemark] = useState('');

  // ── Delete confirmation ─────────────────────────────────────────────────────
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ── Proof drawer ────────────────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<KycProofRow | null>(null);
  const [drawerRow, setDrawerRow] = useState<KycProofRow>({ id: genId(), ...EMPTY_ROW });
  const [drawerErrors, setDrawerErrors] = useState<Record<string, string>>({});
  const [drawerDirty, setDrawerDirty] = useState(false);
  const [prefilledCountry, setPrefilledCountry] = useState<string>('');

  // ── Computed ────────────────────────────────────────────────────────────────
  const editingConfig = useMemo(() => configs.find(c => c.id === editingId), [configs, editingId]);
  const isViewOnly = formMode === 'view';
  const isDraft = !editingId || editingConfig?.status === 'Draft';
  const currentCode = editingConfig?.code ?? '(New Config)';
  const availableEntityTypes = form.entity ? (ENTITY_TYPE_MAP[form.entity] ?? []) : [];
  const checklist = useMemo(() => buildChecklist(form), [form]);

  // ── Help ────────────────────────────────────────────────────────────────────
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpTopicId, setHelpTopicId] = useState('kyc-setup');
  const kycHelpTopic = useMemo(() => getHelpTopic(helpTopicId), [helpTopicId]);

  // Groups for the KYC grid accordion
  const proofsByCountry = useMemo(() => {
    const map = new Map<string, KycProofRow[]>();
    form.proofRows.forEach(row => {
      const key = row.country || '(No Country)';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    });
    return map;
  }, [form.proofRows]);

  // Drawer: available proof types filtered by category + country
  const drawerProofTypes = drawerRow.proofCategory
    ? (PROOF_TYPE_MAP[drawerRow.proofCategory as ProofCategory] ?? [])
    : [];

  // ── Field setter ────────────────────────────────────────────────────────────
  function setField<K extends keyof KycFormData>(key: K, value: KycFormData[K]) {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      // Auto-sync display name while untouched
      if (key === 'name' && !displayNameTouched) {
        next.displayName = value as string;
      }
      // Reset entity type when entity changes
      if (key === 'entity') { next.entityType = ''; }
      return next;
    });
    setActivationErrors([]);
  }

  // ── Navigation helpers ──────────────────────────────────────────────────────
  const goBackToList = () => { setViewMode('list'); setActivationErrors([]); };

  const openAddForm = () => {
    setEditingId(null); setForm({ ...EMPTY_FORM }); setDisplayNameTouched(false);
    setActivationErrors([]); setFormMode('add'); setActiveSection('overview');
    setExpandedCountries(new Set()); setViewMode('form');
  };

  const openEditForm = (config: KycConfig) => {
    setEditingId(config.id);
    setForm({ name: config.name, displayName: config.displayName, entity: config.entity, entityType: config.entityType, description: config.description, isActive: config.isActive, proofRows: config.proofRows.map(r => ({ ...r })) });
    setDisplayNameTouched(true);
    setActivationErrors([]); setFormMode('edit'); setActiveSection('overview');
    const countries = new Set(config.proofRows.map(r => r.country).filter(Boolean));
    setExpandedCountries(countries); setViewMode('form');
  };

  const openViewForm = (config: KycConfig) => {
    openEditForm(config); setFormMode('view');
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSaveDraft = () => {
    const id = editingId ?? genId();
    const code = editingConfig?.code ?? `KYC-${String(configs.length + 1).padStart(3, '0')}`;
    const record: KycConfig = { ...form, id, code, status: 'Draft' };
    setConfigs(prev => editingId ? prev.map(c => c.id === editingId ? record : c) : [...prev, record]);
    setEditingId(id);
    setFormMode('edit');
  };

  const handleActivate = () => {
    const errors: string[] = [];
    checklist.forEach(item => { errors.push(...item.errors); });
    if (errors.length > 0) { setActivationErrors(errors); setActiveSection('checklist'); return; }
    const id = editingId ?? genId();
    const code = editingConfig?.code ?? `KYC-${String(configs.length + 1).padStart(3, '0')}`;
    const record: KycConfig = { ...form, id, code, status: 'Active' };
    setConfigs(prev => editingId ? prev.map(c => c.id === editingId ? record : c) : [...prev, record]);
    setViewMode('list');
  };

  const confirmDeactivation = () => {
    if (!deactivationTarget) return;
    setConfigs(prev => prev.map(c => c.id === deactivationTarget.id ? { ...c, status: 'Inactive' as const } : c));
    setDeactivationOpen(false); setDeactivationTarget(null); setDeactivationReason(''); setDeactivationRemark('');
    if (editingId === deactivationTarget.id) setViewMode('list');
  };

  const confirmDelete = (id: string) => {
    setConfigs(prev => prev.filter(c => c.id !== id));
    setDeleteConfirmId(null);
    if (editingId === id) setViewMode('list');
  };

  // ── Drawer helpers ──────────────────────────────────────────────────────────
  function openDrawerAdd(prefillCountry?: string) {
    const newRow: KycProofRow = { id: genId(), ...EMPTY_ROW };
    if (prefillCountry) newRow.country = prefillCountry;
    setEditingRow(null); setDrawerRow(newRow); setDrawerErrors({});
    setDrawerDirty(false); setPrefilledCountry(prefillCountry ?? ''); setDrawerOpen(true);
  }

  function openDrawerEdit(row: KycProofRow) {
    setEditingRow(row); setDrawerRow({ ...row }); setDrawerErrors({});
    setDrawerDirty(false); setPrefilledCountry(''); setDrawerOpen(true);
  }

  function closeDrawer() {
    if (drawerDirty) {
      if (!window.confirm('You have unsaved changes. Discard them?')) return;
    }
    setDrawerOpen(false); setEditingRow(null); setDrawerDirty(false);
  }

  function setDrawerField<K extends keyof KycProofRow>(key: K, value: KycProofRow[K]) {
    setDrawerDirty(true);
    setDrawerRow(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'country') { next.proofCategory = ''; next.proofType = ''; }
      if (key === 'proofCategory') { next.proofType = ''; }
      if (key === 'isSpecialCharAllowed' && !value) next.allowedSpecialCharacters = '';
      if (key === 'documentNumberRequired' && !value) {
        next.tooltip = ''; next.placeholderText = '';
        next.isCharAllowed = true; next.isNumberAllowed = true;
        next.isSpecialCharAllowed = false; next.allowedSpecialCharacters = '';
        next.minLength = ''; next.maxLength = '';
        next.mustMatchRegex = false; next.regexPattern = ''; next.regexErrorMessage = '';
      }
      if (key === 'mustMatchRegex' && !value) { next.regexPattern = ''; next.regexErrorMessage = ''; }
      if (key === 'isAttachmentEnabled' && !value) {
        next.isAttachmentMandatory = false; next.allowedFileTypes = [];
        next.maxFileSize = ''; next.minFileSize = ''; next.maximumFileCount = '';
      }
      return next;
    });
  }

  function validateDrawerRow(): boolean {
    const errs: Record<string, string> = {};
    if (!drawerRow.country) errs.country = 'Country is required';
    if (!drawerRow.proofCategory) errs.proofCategory = 'Proof Category is required';
    if (!drawerRow.proofType) errs.proofType = 'Proof Type is required';
    if (drawerRow.documentNumberRequired && !drawerRow.isCharAllowed && !drawerRow.isNumberAllowed && !drawerRow.isSpecialCharAllowed)
      errs.format = 'At least one format option must be selected';
    if (drawerRow.isSpecialCharAllowed && !drawerRow.allowedSpecialCharacters)
      errs.allowedSpecialCharacters = 'Required when Special Char is enabled';
    if (drawerRow.mustMatchRegex && !drawerRow.regexPattern)
      errs.regexPattern = 'Regex Pattern is required';
    if (drawerRow.mustMatchRegex && drawerRow.regexPattern && !isValidRegex(drawerRow.regexPattern))
      errs.regexPattern = 'Invalid regex pattern';
    if (drawerRow.mustMatchRegex && !drawerRow.regexErrorMessage)
      errs.regexErrorMessage = 'Regex Error Message is required';
    if (drawerRow.maxLength && drawerRow.minLength && Number(drawerRow.maxLength) < Number(drawerRow.minLength))
      errs.maxLength = 'Max Length must be ≥ Min Length';
    if (drawerRow.isAttachmentEnabled && drawerRow.maxFileSize && drawerRow.minFileSize && Number(drawerRow.maxFileSize) < Number(drawerRow.minFileSize))
      errs.maxFileSize = 'Max File Size must be ≥ Min File Size';
    // Duplicate check
    const isDuplicate = form.proofRows.some(r => r.id !== drawerRow.id && r.country === drawerRow.country && r.proofCategory === drawerRow.proofCategory && r.proofType === drawerRow.proofType);
    if (isDuplicate) errs.proofType = 'This Country + Category + Proof Type combination already exists';
    setDrawerErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function saveDrawerRow() {
    if (!validateDrawerRow()) return;
    setForm(prev => {
      const rows = editingRow
        ? prev.proofRows.map(r => r.id === editingRow.id ? drawerRow : r)
        : [...prev.proofRows, drawerRow];
      // Auto-expand the country group
      const country = drawerRow.country;
      setExpandedCountries(ec => new Set([...ec, country]));
      return { ...prev, proofRows: rows };
    });
    setDrawerOpen(false); setEditingRow(null); setDrawerDirty(false);
    setActivationErrors([]);
  }

  function deleteRow(id: string) {
    setForm(prev => ({ ...prev, proofRows: prev.proofRows.filter(r => r.id !== id) }));
    setActivationErrors([]);
  }

  function toggleRowActive(id: string) {
    setForm(prev => ({ ...prev, proofRows: prev.proofRows.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r) }));
  }

  function toggleCountry(country: string) {
    setExpandedCountries(prev => {
      const next = new Set(prev);
      if (next.has(country)) next.delete(country); else next.add(country);
      return next;
    });
  }

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filteredConfigs = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return configs.filter(c => !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.entity.toLowerCase().includes(q));
  }, [configs, searchQuery]);

  // ── Keyboard ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawerOpen) closeDrawer();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen, drawerDirty]);

  // ─── Render: list view ───────────────────────────────────────────────────────
  const renderList = () => (
    <AdminListPageShell
      title={master?.label ?? 'KYC Setup'}
      description="Manage KYC configurations for entity-specific document verification."
      breadcrumbs={group?.label ? ['Admin', group.label] : ['Admin']}
      primaryAction={{ label: 'Add KYC Config', tone: 'primary', onClick: openAddForm }}
      helpTopicId="kyc-setup"
      onHelpClick={(id) => { setHelpTopicId(id); setHelpOpen(true); }}
      summaryItems={[
        { label: 'Total',    value: configs.length                                                               },
        { label: 'Active',   value: configs.filter(c => c.status === 'Active').length,   tone: 'success' as const },
        { label: 'Draft',    value: configs.filter(c => c.status === 'Draft').length,    tone: 'warning' as const },
        { label: 'Inactive', value: configs.filter(c => c.status === 'Inactive').length, tone: 'danger'  as const },
      ]}
      searchValue={searchQuery}
      searchPlaceholder="Search configurations…"
      onSearchChange={(q) => setSearchQuery(q)}
    >
        {filteredConfigs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--color-text-muted)' }}>
            <ShieldCheck size={40} style={{ opacity: 0.25, marginBottom: '12px' }} />
            <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>No KYC configurations found</div>
            <div style={{ fontSize: '13px' }}>{searchQuery ? 'Try a different search term.' : 'Click "Add KYC Config" to create your first configuration.'}</div>
          </div>
        ) : (
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                  {['Code', 'Name', 'Entity', 'Entity Type', 'Proofs', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredConfigs.map((cfg, i) => (
                  <tr key={cfg.id} style={{ borderBottom: i < filteredConfigs.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>{cfg.code}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{cfg.name}</div>
                      {cfg.displayName !== cfg.name && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{cfg.displayName}</div>}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text)' }}>{cfg.entity}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>{cfg.entityType}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', background: '#EFF6FF', color: '#1D4ED8', fontWeight: 600 }}>
                        {cfg.proofRows.length} proof{cfg.proofRows.length !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '9999px', ...getStatusStyle(cfg.status) }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: getStatusDot(cfg.status) }} />
                        {cfg.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button type="button" title="View" onClick={() => openViewForm(cfg)} style={{ ...btnOutline, padding: '5px 8px' }}><FileText size={13} /></button>
                        <button type="button" title="Edit" onClick={() => openEditForm(cfg)} style={{ ...btnOutline, padding: '5px 8px' }}><Pencil size={13} /></button>
                        {cfg.status === 'Active' && (
                          <button type="button" title="Deactivate" onClick={() => { setDeactivationTarget(cfg); setDeactivationOpen(true); }} style={{ ...btnOutline, padding: '5px 8px', borderColor: '#FCA5A5', color: '#DC2626' }}><ZapOff size={13} /></button>
                        )}
                        <button type="button" title="Delete" onClick={() => setDeleteConfirmId(cfg.id)} style={{ ...btnOutline, padding: '5px 8px', borderColor: '#FCA5A5', color: '#DC2626' }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      {/* Delete confirm */}
      {deleteConfirmId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setDeleteConfirmId(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
          <div style={{ position: 'relative', width: '400px', background: 'var(--color-surface)', borderRadius: '14px', padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Trash2 size={16} style={{ color: '#DC2626' }} /></div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>Delete Configuration?</div>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>This will permanently delete the KYC configuration and all its proof rows. This cannot be undone.</div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setDeleteConfirmId(null)} style={btnOutline}>Cancel</button>
              <button type="button" onClick={() => confirmDelete(deleteConfirmId)} style={{ ...btnBase, background: '#DC2626', color: 'white', border: 'none' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminListPageShell>
  );

  // ─── Render: proof drawer ────────────────────────────────────────────────────
  const renderDrawer = () => {
    if (!drawerOpen) return null;
    const r = drawerRow;
    const isCountryLocked = !!prefilledCountry && !editingRow;
    const drawerTitle = [r.proofCategory, r.proofType, r.country ? `${COUNTRIES.find(c => c.name === r.country)?.flag ?? ''} ${r.country}` : ''].filter(Boolean).join(' · ') || (editingRow ? 'Edit Proof Row' : 'New Proof Requirement');

    return (
      <>
        {/* Overlay */}
        <div onClick={closeDrawer} style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(1px)' }} />
        {/* Drawer panel */}
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '520px', zIndex: 1101, background: 'var(--color-surface)', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
          {/* Drawer header */}
          <div style={{ flexShrink: 0, padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{drawerTitle}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '3px' }}>{editingRow ? 'Edit proof requirement' : 'Define a new proof requirement'} · Press Esc to close</div>
            </div>
            <button type="button" onClick={closeDrawer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)', flexShrink: 0 }}><X size={14} /></button>
          </div>

          {/* Drawer body */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Group 1: Proof Identity */}
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={13} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Proof Identity</span>
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <DField label="Country" required error={drawerErrors.country}>
                  {isCountryLocked ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '13px' }}>
                      <span>{COUNTRIES.find(c => c.name === r.country)?.flag}</span>
                      <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{r.country}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--color-text-muted)', padding: '1px 6px', borderRadius: '4px', background: 'var(--color-border)' }}>Pre-filled</span>
                    </div>
                  ) : (
                    <DSelect
                      value={r.country}
                      onChange={v => setDrawerField('country', v)}
                      options={COUNTRIES.map(c => c.name)}
                      placeholder="— Select Country —"
                      error={drawerErrors.country}
                    />
                  )}
                </DField>
                <DField label="Proof Category" required error={drawerErrors.proofCategory} help={(() => { const h = getFieldHelp('proofCategory'); return h ? <FieldHelpPopover title={h.title} description={h.description} example={h.example} /> : null; })()}>
                  <DSelect
                    value={r.proofCategory}
                    onChange={v => setDrawerField('proofCategory', v)}
                    options={[...PROOF_CATEGORIES]}
                    placeholder={r.country ? '— Select Category —' : '— Select Country first —'}
                    disabled={!r.country}
                    error={drawerErrors.proofCategory}
                  />
                </DField>
                <DField label="Proof Type" required error={drawerErrors.proofType} help={(() => { const h = getFieldHelp('proofType'); return h ? <FieldHelpPopover title={h.title} description={h.description} example={h.example} /> : null; })()}>
                  <DSelect
                    value={r.proofType}
                    onChange={v => setDrawerField('proofType', v)}
                    options={drawerProofTypes}
                    placeholder={r.proofCategory ? '— Select Proof Type —' : '— Select Category first —'}
                    disabled={!r.proofCategory}
                    error={drawerErrors.proofType}
                  />
                </DField>
              </div>
            </div>

            {/* Group 2: Document Number Rules */}
            <DrawerCard
              toggleLabel="Document Number Required"
              toggleDescription="Require the entity to provide a document number for this proof"
              enabled={r.documentNumberRequired}
              onToggle={v => setDrawerField('documentNumberRequired', v)}
              disabled={isViewOnly}
              accentColor="#2563EB"
            >
              <DField label="Tooltip Text" error={drawerErrors.tooltip}>
                <textarea value={r.tooltip} onChange={e => setDrawerField('tooltip', e.target.value)} placeholder="Helper text shown next to the document number field…" maxLength={1000} rows={2} disabled={isViewOnly} style={{ ...inputBase, resize: 'none', lineHeight: 1.5 }} />
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textAlign: 'right', marginTop: '2px' }}>{r.tooltip.length}/1000</div>
              </DField>
              <DField label="Placeholder Text" error={drawerErrors.placeholderText}>
                <input value={r.placeholderText} onChange={e => setDrawerField('placeholderText', e.target.value)} placeholder="e.g. XXXX XXXX XXXX" maxLength={1000} disabled={isViewOnly} style={inputBase} />
              </DField>
              <DField label="Allowed Format" error={drawerErrors.format}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {([['isCharAllowed', 'Characters'], ['isNumberAllowed', 'Numbers'], ['isSpecialCharAllowed', 'Special Chars']] as const).map(([field, label]) => {
                    const isOn = r[field] as boolean;
                    return (
                      <button key={field} type="button" disabled={isViewOnly} onClick={() => setDrawerField(field, !isOn as never)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, border: `1.5px solid ${isOn ? '#2563EB' : 'var(--color-border)'}`, borderRadius: '8px', background: isOn ? '#EFF6FF' : 'var(--color-surface)', color: isOn ? '#1D4ED8' : 'var(--color-text)', cursor: isViewOnly ? 'default' : 'pointer', transition: 'all 0.15s' }}>
                        {isOn && <Check size={11} />}{label}
                      </button>
                    );
                  })}
                </div>
                {drawerErrors.format && <div style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={11} />{drawerErrors.format}</div>}
              </DField>
              {r.isSpecialCharAllowed && (
                <DField label="Allowed Special Characters" required error={drawerErrors.allowedSpecialCharacters} help={(() => { const h = getFieldHelp('allowedSpecialCharacters'); return h ? <FieldHelpPopover title={h.title} description={h.description} example={h.example} /> : null; })()}>
                  <input value={r.allowedSpecialCharacters} onChange={e => setDrawerField('allowedSpecialCharacters', e.target.value)} placeholder="e.g. - / ." disabled={isViewOnly} style={inputBase} />
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '3px' }}>Separate characters with spaces or commas</div>
                </DField>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <DField label="Min Length">
                  <input type="number" value={r.minLength} onChange={e => setDrawerField('minLength', e.target.value)} placeholder="0" min={0} disabled={isViewOnly} style={inputBase} />
                </DField>
                <DField label="Max Length" error={drawerErrors.maxLength}>
                  <input type="number" value={r.maxLength} onChange={e => setDrawerField('maxLength', e.target.value)} placeholder="e.g. 20" min={0} disabled={isViewOnly} style={{ ...inputBase, borderColor: drawerErrors.maxLength ? '#DC2626' : undefined }} />
                  {drawerErrors.maxLength && <div style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={11} />{drawerErrors.maxLength}</div>}
                </DField>
              </div>
            </DrawerCard>

            {/* Group 3: Regex Validation */}
            <DrawerCard
              toggleLabel="Must Match Regex Pattern"
              toggleDescription="Define a regex pattern the document number must satisfy"
              enabled={r.mustMatchRegex}
              onToggle={v => setDrawerField('mustMatchRegex', v)}
              disabled={isViewOnly}
              accentColor="#7C3AED"
            >
              <div style={{ padding: '8px 12px', background: '#F5F3FF', border: '1px solid #C4B5FD', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <AlertCircle size={13} style={{ color: '#7C3AED', marginTop: '1px', flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: '#5B21B6', lineHeight: 1.4 }}>Regex overrides Character, Number, Special Char, Min/Max Length rules at runtime.</span>
              </div>
              <DField label="Regex Pattern" required error={drawerErrors.regexPattern} help={(() => { const h = getFieldHelp('regexPattern'); return h ? <FieldHelpPopover title={h.title} description={h.description} example={h.example} /> : null; })()}>
                <input
                  value={r.regexPattern}
                  onChange={e => setDrawerField('regexPattern', e.target.value)}
                  placeholder="e.g. ^[0-9]{12}$"
                  disabled={isViewOnly}
                  style={{ ...inputBase, fontFamily: 'monospace', borderColor: drawerErrors.regexPattern ? '#DC2626' : r.regexPattern && !isValidRegex(r.regexPattern) ? '#F59E0B' : undefined }}
                />
                {r.regexPattern && !drawerErrors.regexPattern && (
                  <div style={{ fontSize: '10px', color: isValidRegex(r.regexPattern) ? '#16A34A' : '#F59E0B', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isValidRegex(r.regexPattern) ? <><CheckCircle2 size={10} />Valid regex</> : <><AlertCircle size={10} />Invalid regex syntax</>}
                  </div>
                )}
              </DField>
              <DField label="Regex Error Message" required error={drawerErrors.regexErrorMessage}>
                <input value={r.regexErrorMessage} onChange={e => setDrawerField('regexErrorMessage', e.target.value)} placeholder="e.g. Must be a 12-digit number" disabled={isViewOnly} style={inputBase} />
              </DField>
            </DrawerCard>

            {/* Group 4: Attachment Settings */}
            <DrawerCard
              toggleLabel="Attachment Enabled"
              toggleDescription="Allow or require document file upload for this proof"
              enabled={r.isAttachmentEnabled}
              onToggle={v => setDrawerField('isAttachmentEnabled', v)}
              disabled={isViewOnly}
              accentColor="#059669"
            >
              <Toggle value={r.isAttachmentMandatory} onChange={v => setDrawerField('isAttachmentMandatory', v)} disabled={isViewOnly} label="Attachment Mandatory" description="Transaction cannot proceed without uploading this document" />
              <DField label="Allowed File Types">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {FILE_TYPES.map(ft => {
                    const selected = r.allowedFileTypes.includes(ft);
                    return (
                      <button key={ft} type="button" disabled={isViewOnly} onClick={() => setDrawerField('allowedFileTypes', selected ? r.allowedFileTypes.filter(f => f !== ft) : [...r.allowedFileTypes, ft])}
                        style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, border: `1.5px solid ${selected ? '#059669' : 'var(--color-border)'}`, borderRadius: '6px', background: selected ? '#DCFCE7' : 'var(--color-surface)', color: selected ? '#15803D' : 'var(--color-text)', cursor: isViewOnly ? 'default' : 'pointer', transition: 'all 0.15s' }}>
                        {ft}
                      </button>
                    );
                  })}
                </div>
              </DField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <DField label="Min File Size (KB)">
                  <input type="number" value={r.minFileSize} onChange={e => setDrawerField('minFileSize', e.target.value)} placeholder="e.g. 10" min={0} disabled={isViewOnly} style={inputBase} />
                </DField>
                <DField label="Max File Size (KB)" error={drawerErrors.maxFileSize}>
                  <input type="number" value={r.maxFileSize} onChange={e => setDrawerField('maxFileSize', e.target.value)} placeholder="e.g. 2048" min={0} disabled={isViewOnly} style={{ ...inputBase, borderColor: drawerErrors.maxFileSize ? '#DC2626' : undefined }} />
                  {drawerErrors.maxFileSize && <div style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={11} />{drawerErrors.maxFileSize}</div>}
                </DField>
              </div>
              <DField label="Maximum File Count">
                <input type="number" value={r.maximumFileCount} onChange={e => setDrawerField('maximumFileCount', e.target.value)} placeholder="e.g. 3" min={1} disabled={isViewOnly} style={inputBase} />
              </DField>
            </DrawerCard>

            {/* Group 5: Proof Status */}
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Toggle value={r.isMandatory} onChange={v => setDrawerField('isMandatory', v)} disabled={isViewOnly} label="Is Mandatory" description="Transaction cannot proceed without submitting this proof" />
              <Toggle value={r.isActive} onChange={v => setDrawerField('isActive', v)} disabled={isViewOnly} label="Is Active" description="Inactive proofs are excluded from runtime validation" />
            </div>

            </div>{/* end inner content wrapper */}
          </div>

          {/* Drawer footer */}
          {!isViewOnly && (
            <div style={{ flexShrink: 0, padding: '14px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '8px', justifyContent: 'flex-end', background: 'var(--color-surface)' }}>
              <button type="button" onClick={closeDrawer} style={btnOutline}>Cancel</button>
              <button type="button" onClick={saveDrawerRow} style={btnPrimary}>
                <Check size={13} />{editingRow ? 'Update Proof Row' : 'Save Proof Row'}
              </button>
            </div>
          )}
        </div>
      </>
    );
  };

  // ─── Render: form view ───────────────────────────────────────────────────────
  const renderForm = () => (
    <AdminPageShell
      title={currentCode}
      description={isViewOnly ? 'Viewing — read only' : 'Fill all sections, then activate'}
      breadcrumbs={[group?.label ?? '', master?.label ?? '']}
      statusLabel={editingConfig?.status}
      statusTone={editingConfig?.status === 'Active' ? 'active' : editingConfig?.status === 'Draft' ? 'draft' : editingConfig?.status === 'Inactive' ? 'neutral' : undefined}
      helpTopicId={helpTopicId}
      onHelpClick={(id) => { setHelpTopicId(id); setHelpOpen(true); }}
      primaryAction={!isViewOnly ? (
        (formMode === 'add' || editingConfig?.status === 'Draft') ? { label: 'Activate', tone: 'primary' as const, onClick: handleActivate } :
        editingConfig?.status === 'Active' ? { label: 'Save', tone: 'primary' as const, onClick: handleSaveDraft } :
        undefined
      ) : undefined}
      secondaryActions={[
        ...(!isViewOnly && isDraft ? [{ label: 'Save Draft', tone: 'ghost' as const, onClick: handleSaveDraft }] : []),
        ...(!isViewOnly && editingConfig?.status === 'Active' ? [{ label: 'Deactivate', tone: 'ghost' as const, onClick: () => { if (editingConfig) { setDeactivationTarget(editingConfig); setDeactivationOpen(true); } } }] : []),
        { label: 'KYC List', tone: 'ghost' as const, onClick: goBackToList },
      ]}
      toolbar={
        <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
          {KYC_SECTIONS.map((s, i) => {
            const isActive = activeSection === s.key;
            return (
              <button key={s.key} type="button" onClick={() => setActiveSection(s.key)}
                style={{
                  padding: '6px 16px', fontSize: '13px',
                  fontWeight: isActive ? 600 : 400, border: 'none',
                  borderRight: i < KYC_SECTIONS.length - 1 ? '1px solid var(--color-border)' : 'none',
                  background: isActive ? 'var(--color-primary)' : 'transparent',
                  color: isActive ? 'white' : 'var(--color-text)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                {s.label}
              </button>
            );
          })}
        </div>
      }
    >

      {/* Activation errors strip */}
      {activationErrors.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ padding: '10px 14px', background: 'color-mix(in srgb, var(--color-danger) 8%, var(--color-surface))', border: '1px solid color-mix(in srgb, var(--color-danger) 30%, var(--color-border))', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <AlertCircle size={14} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-danger)' }}>Activation Validation Failed</span>
              <button type="button" onClick={() => setActivationErrors([])} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-danger)', padding: 0 }}><X size={13} /></button>
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px' }}>
              {activationErrors.map((e, i) => (
                <li key={i} style={{ fontSize: '11px', color: '#991B1B', marginBottom: '3px', lineHeight: 1.5 }}>{e}</li>
              ))}
            </ul>
          </div>
        </div>
      )}



          {/* ── Section: Overview ── */}
          {activeSection === 'overview' && (
            <KycSectionPanel sectionKey="overview" title="Overview" form={form}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                <DField label="Config Code">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8', fontWeight: 600, flexShrink: 0 }}>AUTO</span>
                    <span style={{ fontSize: '13px', color: editingConfig?.code ? 'var(--color-text)' : 'var(--color-text-muted)', fontFamily: editingConfig?.code ? 'monospace' : undefined }}>
                      {editingConfig?.code || 'System generated on first save'}
                    </span>
                  </div>
                </DField>

                <DField label="Configuration Status">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 12px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                    <Toggle value={form.isActive} onChange={v => setField('isActive', v)} disabled={isViewOnly} size="sm" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: form.isActive ? '#15803D' : 'var(--color-text-muted)' }}>{form.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                    {form.isActive ? 'Configuration will be used for runtime KYC validation.' : 'Inactive configurations are excluded from all transactions.'}
                  </div>
                </DField>

                <DField label="Name" required>
                  <input
                    value={form.name} onChange={e => setField('name', e.target.value)}
                    placeholder="e.g. Individual Customer KYC — India"
                    maxLength={100} disabled={isViewOnly} style={inputBase}
                  />
                </DField>

                <DField label="Display Name">
                  <div style={{ position: 'relative' }}>
                    <input
                      value={form.displayName}
                      onChange={e => { setDisplayNameTouched(true); setField('displayName', e.target.value); }}
                      placeholder="Auto-filled from Name"
                      maxLength={100} disabled={isViewOnly} style={{ ...inputBase, paddingRight: !displayNameTouched && form.name ? '110px' : undefined }}
                    />
                    {!displayNameTouched && form.name && (
                      <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: '#2563EB', background: '#EFF6FF', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                        Synced with Name ↗
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Optional. Auto-copied from Name; edit to customise.</div>
                </DField>

                <DField label="Entity" required>
                  <DSelect
                    value={form.entity} onChange={v => setField('entity', v)}
                    options={[...ENTITIES]} placeholder="— Select Entity —"
                    disabled={isViewOnly}
                  />
                </DField>

                <DField label="Entity Type" required help={(() => { const h = getFieldHelp('entityType'); return h ? <FieldHelpPopover title={h.title} description={h.description} example={h.example} /> : null; })()}>
                  <DSelect
                    value={form.entityType} onChange={v => setField('entityType', v)}
                    options={availableEntityTypes}
                    placeholder={form.entity ? '— Select Entity Type —' : '— Select Entity first —'}
                    disabled={isViewOnly || !form.entity}
                  />
                  {form.entity && availableEntityTypes.length === 0 && (
                    <div style={{ fontSize: '11px', color: '#D97706', marginTop: '4px' }}>No entity types configured for {form.entity}.</div>
                  )}
                </DField>

                <div style={{ gridColumn: '1 / -1' }}>
                  <DField label="Description">
                    <textarea value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Brief description of this KYC configuration…" maxLength={500} rows={3} disabled={isViewOnly} style={{ ...inputBase, resize: 'none', lineHeight: 1.5 }} />
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '3px', textAlign: 'right' }}>{form.description.length}/500</div>
                  </DField>
                </div>

              </div>
            </KycSectionPanel>
          )}

          {/* ── Section: KYC Grid ── */}
          {activeSection === 'kyc-grid' && (
            <KycSectionPanel
              sectionKey="kyc-grid"
              title="KYC Grid"
              form={form}
              subtitle={form.proofRows.length > 0 ? `${form.proofRows.length} proof${form.proofRows.length > 1 ? 's' : ''} across ${proofsByCountry.size} countr${proofsByCountry.size > 1 ? 'ies' : 'y'}` : undefined}
            >
              {/* Grid header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  {form.proofRows.length === 0 ? 'No proof requirements configured yet.' : `Showing ${form.proofRows.length} proof row${form.proofRows.length > 1 ? 's' : ''}`}
                </div>
                {!isViewOnly && (
                  <button type="button" onClick={() => openDrawerAdd()} style={btnPrimary}>
                    <Plus size={13} />Add Proof
                  </button>
                )}
              </div>

              {/* Empty state */}
              {form.proofRows.length === 0 && (
                <div style={{ padding: '40px 24px', textAlign: 'center', background: 'var(--color-surface-subtle)', border: '2px dashed var(--color-border)', borderRadius: '12px' }}>
                  <ShieldCheck size={36} style={{ color: 'var(--color-border)', marginBottom: '12px' }} />
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>No proof requirements defined</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
                    Add country-wise proof requirements to define what documents<br />entities of type <strong>{form.entity || 'the selected entity'}</strong> must provide.
                  </div>
                  {!isViewOnly && (
                    <button type="button" onClick={() => openDrawerAdd()} style={btnPrimary}>
                      <Plus size={13} />Add First Proof Requirement
                    </button>
                  )}
                </div>
              )}

              {/* Country-grouped accordion */}
              {[...proofsByCountry.entries()].map(([country, rows]) => {
                const countryData = COUNTRIES.find(c => c.name === country);
                const expanded = expandedCountries.has(country);
                const activeRowCount = rows.filter(r => r.isActive).length;
                return (
                  <div key={country} style={{ border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px' }}>
                    {/* Country group header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'var(--color-surface-subtle)', cursor: 'pointer' }} onClick={() => toggleCountry(country)}>
                      <span style={{ fontSize: '20px', lineHeight: 1 }}>{countryData?.flag ?? '🌐'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>{country}</span>
                        <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {rows.length} proof{rows.length > 1 ? 's' : ''} · {activeRowCount} active
                        </span>
                      </div>
                      {!isViewOnly && (
                        <button type="button" onClick={e => { e.stopPropagation(); openDrawerAdd(country); }}
                          style={{ ...btnOutline, padding: '4px 10px', fontSize: '11px', gap: '4px' }}>
                          <Plus size={11} />Add Proof
                        </button>
                      )}
                      <ChevronDown size={16} style={{ color: 'var(--color-text-muted)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                    </div>

                    {/* Rows table */}
                    {expanded && (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ background: '#FAFAFA', borderTop: '1px solid var(--color-border)' }}>
                            {['Proof Category', 'Proof Type', 'Mandatory', 'Doc No.', 'Attachment', 'Active', ''].map(h => (
                              <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row) => (
                            <tr key={row.id} style={{ borderTop: '1px solid var(--color-border)', background: row.isActive ? undefined : '#FAFAFA' }}>
                              <td style={{ padding: '10px 14px', color: 'var(--color-text-muted)', fontWeight: 500 }}>{row.proofCategory}</td>
                              <td style={{ padding: '10px 14px', fontWeight: 600, color: row.isActive ? 'var(--color-text)' : 'var(--color-text-muted)' }}>{row.proofType}</td>
                              <td style={{ padding: '10px 14px' }}>
                                {row.isMandatory
                                  ? <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: '#DCFCE7', color: '#15803D' }}>Mandatory</span>
                                  : <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '9999px', background: 'var(--color-surface-subtle)', color: 'var(--color-text-muted)' }}>Optional</span>}
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: row.documentNumberRequired ? '#2563EB' : 'var(--color-border)', display: 'inline-block' }} />
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: row.isAttachmentEnabled ? '#059669' : 'var(--color-border)', display: 'inline-block' }} />
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <Toggle value={row.isActive} onChange={() => !isViewOnly && toggleRowActive(row.id)} size="sm" disabled={isViewOnly} />
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                                  <button type="button" title="Edit" onClick={() => openDrawerEdit(row)} style={{ ...btnOutline, padding: '4px 7px' }}><Pencil size={11} /></button>
                                  {!isViewOnly && <button type="button" title="Delete" onClick={() => deleteRow(row.id)} style={{ ...btnOutline, padding: '4px 7px', borderColor: '#FCA5A5', color: '#DC2626' }}><Trash2 size={11} /></button>}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })}
            </KycSectionPanel>
          )}

          {/* ── Section: Activation Checklist ── */}
          {activeSection === 'checklist' && (
            <KycSectionPanel sectionKey="checklist" title="Activation Checklist" form={form} subtitle="Review all requirements before activating this configuration">
              <ValidationChecklist
                items={checklist.map(item => ({ ...item, sectionKey: item.section }))}
                onNavigateToSection={key => setActiveSection(key as KycSectionKey)}
                canActivate={!isViewOnly && (formMode === 'add' || editingConfig?.status === 'Draft')}
                isReadOnly={isViewOnly}
                onActivate={handleActivate}
              />
            </KycSectionPanel>
          )}

      {/* Proof drawer */}
      {renderDrawer()}
    </AdminPageShell>
  );

  // ─── Render: deactivation modal ──────────────────────────────────────────────
  const renderDeactivationModal = () => {
    if (!deactivationOpen || !deactivationTarget) return null;
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div onClick={() => setDeactivationOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
        <div style={{ position: 'relative', width: '480px', background: 'var(--color-surface)', borderRadius: '16px', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'color-mix(in srgb, var(--color-danger) 12%, var(--color-surface))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ZapOff size={16} style={{ color: 'var(--color-danger)' }} /></div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>Deactivate Configuration</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{deactivationTarget.name}</div>
              </div>
            </div>
            <button type="button" onClick={() => setDeactivationOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}><X size={16} /></button>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ padding: '10px 14px', background: 'color-mix(in srgb, #f59e0b 8%, var(--color-surface))', border: '1px solid color-mix(in srgb, #f59e0b 30%, var(--color-border))', borderRadius: '8px', fontSize: '12px', color: 'color-mix(in srgb, #f59e0b 75%, var(--color-text))', marginBottom: '16px', lineHeight: 1.4 }}>
              This configuration will no longer be applied to new transactions. Existing validated records are not affected.
            </div>
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Reason <span style={{ color: '#DC2626' }}>*</span></div>
              <DSelect value={deactivationReason} onChange={setDeactivationReason} options={DEACTIVATION_REASONS} placeholder="— Select a reason —" />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Remark (Optional)</div>
              <textarea value={deactivationRemark} onChange={e => setDeactivationRemark(e.target.value)} placeholder="Any additional notes…" rows={3} style={{ ...inputBase, resize: 'none', lineHeight: 1.5 }} />
            </div>
          </div>
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setDeactivationOpen(false)} style={btnOutline}>Cancel</button>
            <button type="button" onClick={confirmDeactivation} disabled={!deactivationReason} style={{ ...btnBase, background: deactivationReason ? '#DC2626' : 'var(--color-border)', color: deactivationReason ? 'white' : 'var(--color-text-muted)', border: 'none', cursor: deactivationReason ? 'pointer' : 'not-allowed' }}>
              <ZapOff size={13} />Confirm Deactivate
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Root render ─────────────────────────────────────────────────────────────
  return (
    <AdminShell>
      {viewMode === 'list' ? renderList() : renderForm()}
      {renderDeactivationModal()}
      {kycHelpTopic && (
        <HelpDrawer
          open={helpOpen}
          topic={kycHelpTopic}
          onClose={() => setHelpOpen(false)}
          onTopicChange={(id) => setHelpTopicId(id)}
        />
      )}
    </AdminShell>
  );
};

export default KycSetupPage;
