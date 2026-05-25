import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Edit2,
  Eye,
  MapPin,
  Paintbrush,
  Plus,
  ScrollText,
  SlidersHorizontal,
  X,
  ZapOff,
} from 'lucide-react';
import AdminShell from '../AdminShell';
import { AdminListPageShell } from '../../experience/components/AdminListPageShell';
import { findGroupForMasterKey, findMasterByKey } from '../adminNavConfig';
import { recordRecentAdminMaster } from '../adminStorage';
import { HelpDrawer } from '../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../experience/help/helpTopics';

// ─── Constants ────────────────────────────────────────────────────────────────

const MASTER_KEY = 'organisation-master';

// Fields that must be locked once a record is Active
const CRITICAL_FIELDS = new Set<keyof OrgFormData>([
  'code', 'legalName', 'gstNumber', 'panNumber', 'cinNumber',
  'taxCategory', 'fiscalYearStart',
]);

const DEACTIVATION_REASONS = [
  'Entity No Longer Active',
  'Organisation Restructured',
  'Merged with Another Entity',
  'Incorrect Configuration',
  'Duplicate Record Created',
  'Migration / Data Correction',
  'Business Rule Change',
  'Other',
];

// ─── Types ────────────────────────────────────────────────────────────────────

type OrgStatus    = 'Draft' | 'Active' | 'Inactive';
type ViewMode     = 'list' | 'form';
type FormMode     = 'add' | 'edit' | 'view';
type OrgSectionKey = 'identity' | 'address' | 'legal' | 'branding' | 'settings' | 'review';

interface OrgFormData {
  // Company Identity
  code:            string;
  companyName:     string;
  legalName:       string;
  shortName:       string;
  description:     string;
  // Address & Contact
  addressLine1:    string;
  addressLine2:    string;
  city:            string;
  state:           string;
  country:         string;
  pinCode:         string;
  phone:           string;
  email:           string;
  website:         string;
  // Legal & Tax
  gstNumber:       string;
  panNumber:       string;
  cinNumber:       string;
  taxCategory:     string;
  fiscalYearStart: string;
  // Branding
  logoUrl:         string;
  tagline:         string;
  primaryColour:   string;
  // Notes & Settings
  effectiveFrom:   string;
  effectiveTo:     string;
  sortOrder:       string;
  externalCode:    string;
  remarks:         string;
}

interface OrgRecord extends OrgFormData {
  id:                 string;
  orgCode:            string;
  status:             OrgStatus;
  deactivationReason: string;
  deactivationRemark: string;
}

interface ChecklistItem {
  id:      string;
  label:   string;
  passed:  boolean;
  detail?: string;
}

// ─── Step / Section config ────────────────────────────────────────────────────

const FORM_STEPS: OrgSectionKey[] = ['identity', 'address', 'legal', 'branding', 'settings', 'review'];

const SECTIONS: Array<{ key: OrgSectionKey; label: string; icon: React.ElementType }> = [
  { key: 'identity', label: 'Company Identity',  icon: Building2          },
  { key: 'address',  label: 'Address & Contact', icon: MapPin             },
  { key: 'legal',    label: 'Legal & Tax',       icon: ScrollText         },
  { key: 'branding', label: 'Branding',          icon: Paintbrush         },
  { key: 'settings', label: 'Notes & Settings',  icon: SlidersHorizontal  },
  { key: 'review',   label: 'Review',            icon: CheckCircle2       },
];

const SECTION_REQUIRED: Record<OrgSectionKey, (keyof OrgFormData)[]> = {
  identity: ['companyName', 'legalName'],
  address:  ['addressLine1', 'city'],
  legal:    [],
  branding: [],
  settings: [],
  review:   [],
};

const SECTION_FIELDS: Record<OrgSectionKey, (keyof OrgFormData)[]> = {
  identity: ['code', 'companyName', 'legalName', 'shortName', 'description'],
  address:  ['addressLine1', 'addressLine2', 'city', 'state', 'country', 'pinCode', 'phone', 'email', 'website'],
  legal:    ['gstNumber', 'panNumber', 'cinNumber', 'taxCategory', 'fiscalYearStart'],
  branding: ['logoUrl', 'tagline', 'primaryColour'],
  settings: ['effectiveFrom', 'effectiveTo', 'sortOrder', 'externalCode', 'remarks'],
  review:   [],
};

// ─── Helper functions ─────────────────────────────────────────────────────────

function getStepState(
  key: OrgSectionKey,
  activeSection: OrgSectionKey,
  form: OrgFormData,
): 'complete' | 'inprogress' | 'notstarted' | 'attention' {
  if (key === activeSection) return 'inprogress';
  if (key === 'review') return 'notstarted';
  const req = SECTION_REQUIRED[key];
  const all = SECTION_FIELDS[key];
  if (all.length === 0) return 'notstarted';
  if (req.length > 0 && req.every(f => !!form[f])) return 'complete';
  if (all.some(f => !!form[f])) return 'attention';
  return 'notstarted';
}

function computeActivationChecklist(form: OrgFormData): ChecklistItem[] {
  const identityOk = !!(form.companyName.trim() && form.legalName.trim());
  const addressOk  = !!(form.addressLine1.trim() && form.city.trim());
  const contactOk  = !!(form.phone.trim() || form.email.trim());
  const datesOk    =
    !form.effectiveTo || !form.effectiveFrom || form.effectiveTo >= form.effectiveFrom;
  return [
    { id: 'identity', label: 'Company identity complete',            passed: identityOk, detail: identityOk ? undefined : 'Company Name and Legal Name are required' },
    { id: 'address',  label: 'Registered address complete',          passed: addressOk,  detail: addressOk  ? undefined : 'Address Line 1 and City are required' },
    { id: 'contact',  label: 'At least one contact method provided', passed: contactOk,  detail: contactOk  ? undefined : 'Add a phone number or email address' },
    { id: 'dates',    label: 'Effective dates are valid',            passed: datesOk,    detail: datesOk    ? undefined : 'Effective To must be on or after Effective From' },
  ];
}

function validateForDraftSave(form: OrgFormData): Partial<Record<keyof OrgFormData, string>> {
  const errs: Partial<Record<keyof OrgFormData, string>> = {};
  if (!form.companyName.trim()) errs.companyName = 'Company Name is required.';
  if (!form.legalName.trim())   errs.legalName   = 'Legal Name is required.';
  return errs;
}

function generateOrgCode(records: OrgRecord[]): string {
  const prefix = 'ORG-';
  const max = records.reduce((m, r) => {
    const n = parseInt(r.orgCode.replace(prefix, ''), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

type OrgHealth = 'Healthy' | 'Draft Incomplete' | 'Needs Attention' | 'Inactive';

function getOrgHealth(record: OrgRecord): OrgHealth {
  if (record.status === 'Inactive') return 'Inactive';
  if (record.status === 'Draft') {
    if (!record.companyName || !record.legalName) return 'Needs Attention';
    return 'Draft Incomplete';
  }
  if (!record.addressLine1 || !record.city) return 'Needs Attention';
  return 'Healthy';
}

function getHealthIndicator(health: OrgHealth): { color: string; label: string } {
  switch (health) {
    case 'Healthy':          return { color: '#15803D', label: 'Healthy' };
    case 'Draft Incomplete': return { color: '#94A3B8', label: 'Incomplete' };
    case 'Needs Attention':  return { color: '#D97706', label: 'Needs attention' };
    case 'Inactive':         return { color: '#94A3B8', label: 'Inactive' };
  }
}

function getStatusStyle(status: OrgStatus): React.CSSProperties {
  if (status === 'Active')   return { background: '#DCFCE7', color: '#15803D' };
  if (status === 'Inactive') return { background: '#FEF2F2', color: '#DC2626' };
  return { background: '#F1F5F9', color: '#64748B' };
}

function getStatusDotColor(status: OrgStatus): string {
  if (status === 'Active')   return '#16A34A';
  if (status === 'Inactive') return '#DC2626';
  return '#94A3B8';
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const EMPTY_FORM: OrgFormData = {
  code: '', companyName: '', legalName: '', shortName: '', description: '',
  addressLine1: '', addressLine2: '', city: '', state: '', country: '', pinCode: '',
  phone: '', email: '', website: '',
  gstNumber: '', panNumber: '', cinNumber: '', taxCategory: '', fiscalYearStart: '',
  logoUrl: '', tagline: '', primaryColour: '#1e40af',
  effectiveFrom: '', effectiveTo: '', sortOrder: '', externalCode: '', remarks: '',
};

const MOCK_ORGS: OrgRecord[] = [
  {
    id: '1', orgCode: 'ORG-001', status: 'Active',
    code: 'ORG-001', companyName: 'Tata Motors Limited', legalName: 'Tata Motors Limited',
    shortName: 'TML', description: 'Leading automotive manufacturer in India.',
    addressLine1: 'Bombay House, 24, Homi Mody Street', addressLine2: 'Fort',
    city: 'Mumbai', state: 'Maharashtra', country: 'India', pinCode: '400001',
    phone: '+91 22 6665 8282', email: 'info@tatamotors.com', website: 'https://www.tatamotors.com',
    gstNumber: '27AAACT2727Q1ZW', panNumber: 'AAACT2727Q', cinNumber: 'L28920MH1945PLC004520',
    taxCategory: 'Regular', fiscalYearStart: 'April',
    logoUrl: '', tagline: 'Connecting Aspirations', primaryColour: '#1e40af',
    effectiveFrom: '2024-04-01', effectiveTo: '', sortOrder: '1', externalCode: '', remarks: '',
    deactivationReason: '', deactivationRemark: '',
  },
  {
    id: '2', orgCode: 'ORG-002', status: 'Draft',
    code: 'ORG-002', companyName: 'Excellon Software Pvt Ltd', legalName: '',
    shortName: '', description: '',
    addressLine1: '', addressLine2: '', city: '', state: '', country: '', pinCode: '',
    phone: '', email: '', website: '',
    gstNumber: '', panNumber: '', cinNumber: '', taxCategory: '', fiscalYearStart: '',
    logoUrl: '', tagline: '', primaryColour: '#1e40af',
    effectiveFrom: '', effectiveTo: '', sortOrder: '', externalCode: '', remarks: '',
    deactivationReason: '', deactivationRemark: '',
  },
];

// ─── Shared button styles ─────────────────────────────────────────────────────

const btnPrimary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '5px',
  padding: '0 14px', height: '32px', fontSize: '13px', fontWeight: 600,
  border: '1px solid var(--color-primary)', borderRadius: '8px',
  background: 'var(--color-primary)', color: 'white',
  cursor: 'pointer', transition: 'opacity 0.12s', whiteSpace: 'nowrap',
};

const btnOutline: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '5px',
  padding: '0 12px', height: '32px', fontSize: '13px', fontWeight: 500,
  border: '1px solid var(--color-border)', borderRadius: '8px',
  background: 'transparent', color: 'var(--color-text)',
  cursor: 'pointer', transition: 'background 0.12s', whiteSpace: 'nowrap',
};

const actionBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: '28px', height: '28px', border: 'none', borderRadius: '6px',
  background: 'transparent', color: 'var(--color-text-muted)',
  cursor: 'pointer', transition: 'background 0.1s',
};



// ─── Component ────────────────────────────────────────────────────────────────

const OrgMasterFormPage: React.FC = () => {
  const navigate = useNavigate();
  void navigate;

  const master = findMasterByKey(MASTER_KEY);
  const group  = findGroupForMasterKey(MASTER_KEY);

  useEffect(() => {
    if (master && group) {
      recordRecentAdminMaster({
        key: master.key, label: master.label, path: master.path,
        groupLabel: group.label, groupIconBg: group.iconBg, groupIconColor: group.iconColor,
      });
    }
  }, [master, group]);

  // ── View state ─────────────────────────────────────────────────
  const [viewMode,      setViewMode]      = useState<ViewMode>('list');
  const [formMode,      setFormMode]      = useState<FormMode>('add');
  const [editingId,     setEditingId]     = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<OrgSectionKey>('identity');

  // ── Data ───────────────────────────────────────────────────────
  const [records, setRecords] = useState<OrgRecord[]>(MOCK_ORGS);

  // ── Form ───────────────────────────────────────────────────────
  const [form,             setForm]             = useState<OrgFormData>({ ...EMPTY_FORM });
  const [fieldErrors,      setFieldErrors]      = useState<Partial<Record<keyof OrgFormData, string>>>({});
  const [activationErrors, setActivationErrors] = useState<string[]>([]);

  // ── List filters ───────────────────────────────────────────────
  const [searchQuery,  setSearchQuery]  = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // ── Deactivation modal ─────────────────────────────────────────
  const [deactivationOpen,      setDeactivationOpen]      = useState(false);
  const [deactivationTarget,    setDeactivationTarget]    = useState<OrgRecord | null>(null);
  const [deactivationReason,    setDeactivationReason]    = useState('');
  const [deactivationRemark,    setDeactivationRemark]    = useState('');
  const [deactivationReasonErr, setDeactivationReasonErr] = useState('');

  // ── Activate confirm ───────────────────────────────────────────
  const [activateConfirmOpen, setActivateConfirmOpen] = useState(false);

  // ── Help ───────────────────────────────────────────────────────
  const [helpOpen,    setHelpOpen]    = useState(false);
  const [helpTopicId, setHelpTopicId] = useState('organisation-master');

  // ── Computed ───────────────────────────────────────────────────
  const editingRecord = useMemo(
    () => records.find(r => r.id === editingId) ?? null,
    [records, editingId],
  );

  const isViewOnly     = formMode === 'view';
  const isActiveLocked = !isViewOnly && editingRecord?.status === 'Active';

  const isLocked = useCallback((field: keyof OrgFormData) => {
    if (isViewOnly) return true;
    if (isActiveLocked && CRITICAL_FIELDS.has(field)) return true;
    return false;
  }, [isViewOnly, isActiveLocked]);

  const checklist          = useMemo(() => computeActivationChecklist(form), [form]);
  const checklistAllPassed = checklist.every(c => c.passed);
  const checklistFailCount = checklist.filter(c => !c.passed).length;

  const filteredRecords = useMemo(() => {
    let list = records;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r =>
        r.orgCode.toLowerCase().includes(q) ||
        r.companyName.toLowerCase().includes(q) ||
        r.legalName.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.gstNumber.toLowerCase().includes(q),
      );
    }
    if (filterStatus) list = list.filter(r => r.status === filterStatus);
    return list;
  }, [records, searchQuery, filterStatus]);

  // ── Guards ─────────────────────────────────────────────────────
  if (!master || !group) return null;

  const orgHelpTopic = useMemo(() => getHelpTopic(helpTopicId), [helpTopicId]);

  // ── Navigation helpers ──────────────────────────────────────────
  const openAddForm = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setFieldErrors({});
    setActivationErrors([]);
    setFormMode('add');
    setActiveSection('identity');
    setViewMode('form');
  };

  const recordToForm = (r: OrgRecord): OrgFormData => ({
    code: r.code, companyName: r.companyName, legalName: r.legalName,
    shortName: r.shortName, description: r.description,
    addressLine1: r.addressLine1, addressLine2: r.addressLine2,
    city: r.city, state: r.state, country: r.country, pinCode: r.pinCode,
    phone: r.phone, email: r.email, website: r.website,
    gstNumber: r.gstNumber, panNumber: r.panNumber, cinNumber: r.cinNumber,
    taxCategory: r.taxCategory, fiscalYearStart: r.fiscalYearStart,
    logoUrl: r.logoUrl, tagline: r.tagline, primaryColour: r.primaryColour,
    effectiveFrom: r.effectiveFrom, effectiveTo: r.effectiveTo,
    sortOrder: r.sortOrder, externalCode: r.externalCode, remarks: r.remarks,
  });

  const openEditForm = (record: OrgRecord) => {
    setEditingId(record.id);
    setForm(recordToForm(record));
    setFieldErrors({});
    setActivationErrors([]);
    setFormMode('edit');
    setActiveSection('identity');
    setViewMode('form');
  };

  const openViewForm = (record: OrgRecord) => {
    setEditingId(record.id);
    setForm(recordToForm(record));
    setFieldErrors({});
    setActivationErrors([]);
    setFormMode('view');
    setActiveSection('identity');
    setViewMode('form');
  };

  const goBackToList = () => {
    setViewMode('list');
    setEditingId(null);
    setActivationErrors([]);
  };

  // ── Field setter ────────────────────────────────────────────────
  const setField = useCallback(<K extends keyof OrgFormData>(key: K, value: OrgFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setFieldErrors(prev => ({ ...prev, [key]: undefined }));
    setActivationErrors([]);
  }, []);

  // ── Save Draft ──────────────────────────────────────────────────
  const handleSaveDraft = () => {
    const errs = validateForDraftSave(form);
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    const code = editingId
      ? (editingRecord?.orgCode ?? generateOrgCode(records))
      : generateOrgCode(records);

    const saved: OrgRecord = {
      ...form,
      id: editingId ?? Date.now().toString(),
      orgCode: code,
      status: editingRecord?.status === 'Active' ? 'Active' : 'Draft',
      deactivationReason: editingRecord?.deactivationReason ?? '',
      deactivationRemark: editingRecord?.deactivationRemark ?? '',
    };

    setRecords(prev =>
      editingId ? prev.map(r => r.id === editingId ? saved : r) : [...prev, saved],
    );
    goBackToList();
  };

  // ── Activate ────────────────────────────────────────────────────
  const handleActivate = () => {
    const failed = computeActivationChecklist(form)
      .filter(c => !c.passed)
      .map(c => c.detail ?? c.label);
    if (failed.length > 0) { setActivationErrors(failed); return; }
    setActivationErrors([]);
    setActivateConfirmOpen(true);
  };

  const confirmActivate = () => {
    const code = editingId
      ? (editingRecord?.orgCode ?? generateOrgCode(records))
      : generateOrgCode(records);

    const saved: OrgRecord = {
      ...form,
      id: editingId ?? Date.now().toString(),
      orgCode: code,
      status: 'Active',
      deactivationReason: '',
      deactivationRemark: '',
    };

    setRecords(prev =>
      editingId ? prev.map(r => r.id === editingId ? saved : r) : [...prev, saved],
    );
    setActivateConfirmOpen(false);
    goBackToList();
  };

  // ── Deactivate ──────────────────────────────────────────────────
  const openDeactivation = (record: OrgRecord) => {
    setDeactivationTarget(record);
    setDeactivationReason('');
    setDeactivationRemark('');
    setDeactivationReasonErr('');
    setDeactivationOpen(true);
  };

  const confirmDeactivation = () => {
    if (!deactivationReason) { setDeactivationReasonErr('Deactivation Reason is required.'); return; }
    if (deactivationTarget) {
      setRecords(prev => prev.map(r =>
        r.id === deactivationTarget.id
          ? { ...r, status: 'Inactive' as OrgStatus, deactivationReason, deactivationRemark }
          : r,
      ));
    }
    setDeactivationOpen(false);
    setDeactivationTarget(null);
    if (viewMode === 'form') goBackToList();
  };


  // ── Render: list view ────────────────────────────────────────────
  const renderList = () => (
    <AdminListPageShell
      title={master.label}
      description="Configure your organisation's legal identity, address, tax details and branding."
      breadcrumbs={['Admin', group.label]}
      primaryAction={{ label: 'New Organisation', tone: 'primary', onClick: openAddForm }}
      secondaryActions={[
        { label: 'How this works', onClick: () => { setHelpTopicId('organisation-master'); setHelpOpen(true); } },
      ]}
      searchValue={searchQuery}
      searchPlaceholder="Search code, company name, city…"
      onSearchChange={setSearchQuery}
      quickFilterItems={[
        { key: '',         label: 'All',      count: records.length },
        { key: 'Active',   label: 'Active',   count: records.filter(r => r.status === 'Active').length },
        { key: 'Draft',    label: 'Draft',    count: records.filter(r => r.status === 'Draft').length },
        { key: 'Inactive', label: 'Inactive', count: records.filter(r => r.status === 'Inactive').length },
      ]}
      activeQuickFilter={filterStatus}
      onQuickFilterChange={setFilterStatus}
    >
      {filteredRecords.length === 0 ? (
        <div style={{ padding: '64px 28px', textAlign: 'center', background: 'var(--color-surface)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Building2 size={22} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
            {records.length === 0 ? 'No organisations yet' : 'No organisations match the current filters'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', maxWidth: '340px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            {records.length === 0
              ? 'Create your first Organisation Master to get started with system configuration.'
              : 'Try adjusting your search or filters to find what you\'re looking for.'}
          </div>
          {records.length === 0 && (
            <button type="button" onClick={openAddForm} style={btnPrimary}>
              <Plus size={13} />
              Add Organisation
            </button>
          )}
        </div>
      ) : (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: '860px' }}>
              {/* Column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '88px minmax(160px, 1fr) minmax(140px, 1fr) 100px 148px 80px 100px 56px', alignItems: 'center', height: '36px', padding: '0 16px', background: 'var(--color-surface-subtle)', borderBottom: '1.5px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 1 }}>
                {['Code', 'Company Name', 'Legal Name', 'City', 'GST Number', 'Status', 'Health', ''].map((col, i) => (
                  <div key={`h-${i}`} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingRight: i < 7 ? '8px' : '0', textAlign: i === 7 ? 'right' : 'left' }}>
                    {col}
                  </div>
                ))}
              </div>
              {/* Data rows */}
              {filteredRecords.map((record, idx) => {
                const health = getOrgHealth(record);
                const { color: healthColor, label: healthLabel } = getHealthIndicator(health);
                const isLast = idx === filteredRecords.length - 1;
                return (
                  <div
                    key={record.id}
                    style={{ display: 'grid', gridTemplateColumns: '88px minmax(160px, 1fr) minmax(140px, 1fr) 100px 148px 80px 100px 56px', alignItems: 'center', height: '44px', padding: '0 16px', borderBottom: isLast ? 'none' : '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 0.1s' }}
                    onClick={() => openViewForm(record)}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ paddingRight: '8px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)' }}>{record.orgCode}</span>
                    </div>
                    <div style={{ minWidth: 0, paddingRight: '8px', overflow: 'hidden' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.companyName || '—'}</span>
                    </div>
                    <div style={{ minWidth: 0, paddingRight: '8px', overflow: 'hidden' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-text)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.legalName || '—'}</span>
                    </div>
                    <div style={{ paddingRight: '8px', overflow: 'hidden' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-text)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.city || '—'}</span>
                    </div>
                    <div style={{ paddingRight: '8px', overflow: 'hidden' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: record.gstNumber ? 'var(--color-text)' : 'var(--color-text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.gstNumber || '—'}</span>
                    </div>
                    <div style={{ paddingRight: '8px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '9999px', whiteSpace: 'nowrap', ...getStatusStyle(record.status) }}>
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: getStatusDotColor(record.status), flexShrink: 0 }} />
                        {record.status}
                      </span>
                    </div>
                    <div style={{ paddingRight: '8px', overflow: 'hidden' }}>
                      <span style={{ fontSize: '11px', color: healthColor, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{healthLabel}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                      <button type="button" title="View" onClick={() => openViewForm(record)} style={actionBtnStyle}><Eye size={13} /></button>
                      <button type="button" title="Edit" onClick={() => openEditForm(record)} style={actionBtnStyle}><Edit2 size={13} /></button>
                      {record.status === 'Active' && (
                        <button type="button" title="Deactivate" onClick={() => openDeactivation(record)} style={{ ...actionBtnStyle, color: '#D97706' }}><ZapOff size={13} /></button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ padding: '10px 20px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Showing <strong style={{ color: 'var(--color-text)', fontWeight: 600 }}>1–{filteredRecords.length}</strong> of{' '}
              <strong style={{ color: 'var(--color-text)', fontWeight: 600 }}>{records.length}</strong> {records.length === 1 ? 'record' : 'records'}
            </span>
          </div>
        </div>
      )}
    </AdminListPageShell>
  );

  // ── Render: form workspace ────────────────────────────────────────
  const renderForm = () => {
    const stepIdx    = FORM_STEPS.indexOf(activeSection);
    const isOnReview = activeSection === 'review';
    const goToPrevStep = () => { if (stepIdx > 0) setActiveSection(FORM_STEPS[stepIdx - 1]); };
    const goToNextStep = () => { if (stepIdx < FORM_STEPS.length - 1) setActiveSection(FORM_STEPS[stepIdx + 1]); };

    const pageTitle =
      formMode === 'add'  ? 'New Organisation' :
      formMode === 'edit' ? 'Edit Organisation' :
                            editingRecord?.companyName || 'Organisation';

    const pageDescription =
      isViewOnly         ? `${editingRecord?.orgCode ?? ''} — Read-only view` :
      isActiveLocked     ? 'Active organisation — registration and tax fields are locked' :
      formMode === 'add' ? 'Define your organisation\'s legal identity and contact details.' :
                           'Update organisation settings and configuration.';

    const breadcrumbs = ['Admin', group.label, master.label,
      formMode === 'add' ? 'New' : formMode === 'edit' ? 'Edit' : 'View'];

    const statusBadgeStyle =
      editingRecord?.status === 'Active'
        ? { background: 'color-mix(in srgb, #10b981 12%, var(--color-surface))', color: 'color-mix(in srgb, #10b981 85%, var(--color-text))', borderColor: 'color-mix(in srgb, #10b981 35%, var(--color-border))' }
        : { background: 'var(--color-surface-subtle)', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' };

    const stepNav = (
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', overflowX: 'auto', width: '100%', minWidth: 0 }}>
        {FORM_STEPS.map((key, i) => {
          const sec   = SECTIONS.find(s => s.key === key)!;
          const isAct = key === activeSection;
          const state = getStepState(key, activeSection, form);
          const circleColor =
            isAct                ? 'var(--color-primary)' :
            state === 'complete' ? '#16A34A' :
            state === 'attention'? '#D97706' : 'var(--color-border)';
          const labelColor =
            isAct                ? 'var(--color-primary)' :
            state === 'complete' ? '#15803D' :
            state === 'attention'? '#D97706' : 'var(--color-text-muted)';
          return (
            <React.Fragment key={key}>
              {i > 0 && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: 'var(--color-border)' }}>
                  <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              <button
                type="button"
                onClick={() => setActiveSection(key)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', border: 'none', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${circleColor}`,
                  background: isAct ? circleColor : state === 'complete' ? '#DCFCE7' : 'transparent',
                  fontSize: '10px', fontWeight: 700,
                  color: isAct ? 'white' : state === 'complete' ? '#15803D' : circleColor,
                  transition: 'all 0.15s',
                }}>
                  {state === 'complete' && !isAct ? <Check size={10} strokeWidth={3} /> : i + 1}
                </span>
                <span style={{ fontSize: '12px', fontWeight: isAct ? 600 : 400, color: labelColor, transition: 'color 0.15s' }}>
                  {sec.label}
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    );

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-surface)' }}>

        {/* ── 1. Compact Form Header ─────────────────────────────────────── */}
        <div style={{ flexShrink: 0, padding: '10px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '2px', userSelect: 'none' }}>{breadcrumbs.join(' / ')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.25 }}>{pageTitle}</span>
              {editingRecord?.status && (
                <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '11px', fontWeight: 600, padding: '2px 9px', borderRadius: '9999px', border: '1px solid', ...statusBadgeStyle }}>
                  {editingRecord.status}
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px', lineHeight: 1.35 }}>{pageDescription}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button type="button" onClick={goBackToList} style={btnOutline}>← Back to Organisations</button>
            <button type="button" onClick={() => { setHelpTopicId('organisation-master'); setHelpOpen(true); }} style={btnOutline}>How this works</button>
          </div>
        </div>

        {/* ── 2. Workflow Bar ────────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, height: '44px', padding: '0 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          {stepNav}
        </div>

        {/* ── 3. Scrollable Form Body ────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px 24px', background: 'var(--color-surface-subtle)' }}>

          {/* Alert banners */}
          {(isActiveLocked || activationErrors.length > 0) && (
            <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {isActiveLocked && (
                <div style={{ padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <AlertCircle size={14} style={{ color: '#D97706', marginTop: '1px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#92400E' }}>Critical fields are locked</div>
                    <div style={{ fontSize: '11px', color: '#78350F', marginTop: '2px', lineHeight: 1.4 }}>
                      This organisation is Active. Org Code, Legal Name and tax registration fields are read-only to preserve data integrity.
                      Trading name, address, contact, branding and settings can still be updated.
                    </div>
                  </div>
                </div>
              )}
              {activationErrors.length > 0 && (
                <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <AlertCircle size={14} style={{ color: '#DC2626', flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#DC2626' }}>Activation Validation Failed</span>
                    <button type="button" onClick={() => setActivationErrors([])} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', cursor: 'pointer', color: '#DC2626', padding: '0' }}>
                      <X size={13} />
                    </button>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px' }}>
                    {activationErrors.map((e, i) => (
                      <li key={i} style={{ fontSize: '11px', color: '#991B1B', marginBottom: '3px', lineHeight: 1.5 }}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Company Identity */}
          {activeSection === 'identity' && (
            <OrgSectionPanel sectionKey="identity" title="Company Identity" description="Core company information, trading name and legal entity details." form={form}>
              <FormGrid>
                <Field label="Code" hint="Auto-generated if left blank">
                  <OrgTextInput value={form.code} onChange={v => setField('code', v)} disabled={isLocked('code')} placeholder="e.g. ORG-001" />
                </Field>
                <Field label="Company Name" required error={fieldErrors.companyName}>
                  <OrgTextInput value={form.companyName} onChange={v => setField('companyName', v)} disabled={isViewOnly} placeholder="Trading / operating name" error={!!fieldErrors.companyName} />
                </Field>
                <Field label="Legal Name" required error={fieldErrors.legalName}>
                  <OrgTextInput value={form.legalName} onChange={v => setField('legalName', v)} disabled={isLocked('legalName')} placeholder="Full registered legal name" error={!!fieldErrors.legalName} />
                </Field>
                <Field label="Short Name">
                  <OrgTextInput value={form.shortName} onChange={v => setField('shortName', v)} disabled={isViewOnly} placeholder="Abbreviation or alias" />
                </Field>
                <Field label="Description" span={2}>
                  <OrgTextareaInput value={form.description} onChange={v => setField('description', v)} disabled={isViewOnly} placeholder="Brief description of this organisation" rows={3} />
                </Field>
              </FormGrid>
            </OrgSectionPanel>
          )}

          {/* Address & Contact */}
          {activeSection === 'address' && (
            <OrgSectionPanel sectionKey="address" title="Address & Contact" description="Registered office address and primary contact information." form={form}>
              <FormGrid>
                <Field label="Address Line 1" required span={2}>
                  <OrgTextInput value={form.addressLine1} onChange={v => setField('addressLine1', v)} disabled={isViewOnly} placeholder="Building / Street name" />
                </Field>
                <Field label="Address Line 2" span={2}>
                  <OrgTextInput value={form.addressLine2} onChange={v => setField('addressLine2', v)} disabled={isViewOnly} placeholder="Area / Locality (optional)" />
                </Field>
                <Field label="City" required>
                  <OrgTextInput value={form.city} onChange={v => setField('city', v)} disabled={isViewOnly} placeholder="City" />
                </Field>
                <Field label="State">
                  <OrgTextInput value={form.state} onChange={v => setField('state', v)} disabled={isViewOnly} placeholder="State / Province" />
                </Field>
                <Field label="Country">
                  <OrgTextInput value={form.country} onChange={v => setField('country', v)} disabled={isViewOnly} placeholder="Country" />
                </Field>
                <Field label="PIN / ZIP Code">
                  <OrgTextInput value={form.pinCode} onChange={v => setField('pinCode', v)} disabled={isViewOnly} placeholder="Postal code" />
                </Field>
                <Field label="Phone">
                  <OrgTextInput value={form.phone} onChange={v => setField('phone', v)} disabled={isViewOnly} placeholder="+91 00000 00000" />
                </Field>
                <Field label="Email">
                  <OrgTextInput value={form.email} onChange={v => setField('email', v)} disabled={isViewOnly} placeholder="contact@company.com" />
                </Field>
                <Field label="Website" span={2}>
                  <OrgTextInput value={form.website} onChange={v => setField('website', v)} disabled={isViewOnly} placeholder="https://www.company.com" />
                </Field>
              </FormGrid>
            </OrgSectionPanel>
          )}

          {/* Legal & Tax */}
          {activeSection === 'legal' && (
            <OrgSectionPanel sectionKey="legal" title="Legal & Tax" description="Tax identifiers, regulatory numbers and legal registration details." form={form}>
              <FormGrid>
                <Field label="GST Number">
                  <OrgTextInput value={form.gstNumber} onChange={v => setField('gstNumber', v)} disabled={isLocked('gstNumber')} placeholder="27AAAAA0000A1Z5" />
                </Field>
                <Field label="PAN Number">
                  <OrgTextInput value={form.panNumber} onChange={v => setField('panNumber', v)} disabled={isLocked('panNumber')} placeholder="AAAAA0000A" />
                </Field>
                <Field label="CIN Number">
                  <OrgTextInput value={form.cinNumber} onChange={v => setField('cinNumber', v)} disabled={isLocked('cinNumber')} placeholder="L00000AA0000PLC000000" />
                </Field>
                <Field label="Tax Category">
                  <OrgSelectInput value={form.taxCategory} onChange={v => setField('taxCategory', v)} disabled={isLocked('taxCategory')} options={['Regular', 'Composition', 'Exempt', 'SEZ']} />
                </Field>
                <Field label="Fiscal Year Start">
                  <OrgSelectInput value={form.fiscalYearStart} onChange={v => setField('fiscalYearStart', v)} disabled={isLocked('fiscalYearStart')} options={['April', 'January', 'July', 'October']} />
                </Field>
              </FormGrid>
              <div style={{ marginTop: '12px', padding: '10px 14px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Legal &amp; Tax fields are optional during setup but <strong>recommended before activation</strong>. Once active, these fields will be locked to preserve audit trail accuracy.
                </span>
              </div>
            </OrgSectionPanel>
          )}

          {/* Branding */}
          {activeSection === 'branding' && (
            <OrgSectionPanel sectionKey="branding" title="Branding" description="Visual identity — logo URL, brand tagline and primary colour." form={form}>
              <FormGrid>
                <Field label="Logo URL" span={2}>
                  <OrgTextInput value={form.logoUrl} onChange={v => setField('logoUrl', v)} disabled={isViewOnly} placeholder="https://cdn.company.com/logo.png" />
                </Field>
                <Field label="Tagline" span={2}>
                  <OrgTextInput value={form.tagline} onChange={v => setField('tagline', v)} disabled={isViewOnly} placeholder="Your brand tagline" />
                </Field>
                <Field label="Primary Colour">
                  <OrgColourInput value={form.primaryColour} onChange={v => setField('primaryColour', v)} disabled={isViewOnly} />
                </Field>
              </FormGrid>
              {form.logoUrl && (
                <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '10px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={form.logoUrl} alt="Logo preview" style={{ height: '36px', objectFit: 'contain', borderRadius: '4px' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Logo preview</span>
                </div>
              )}
            </OrgSectionPanel>
          )}

          {/* Notes & Settings */}
          {activeSection === 'settings' && (
            <OrgSectionPanel sectionKey="settings" title="Notes & Settings" description="Operational validity period, integration codes and internal notes." form={form}>
              <FormGrid>
                <Field label="Effective From">
                  <OrgTextInput type="date" value={form.effectiveFrom} onChange={v => setField('effectiveFrom', v)} disabled={isViewOnly} />
                </Field>
                <Field label="Effective To" hint="Leave blank for no end date">
                  <OrgTextInput type="date" value={form.effectiveTo} onChange={v => setField('effectiveTo', v)} disabled={isViewOnly} />
                </Field>
                <Field label="Sort Order">
                  <OrgTextInput type="number" value={form.sortOrder} onChange={v => setField('sortOrder', v)} disabled={isViewOnly} placeholder="e.g. 1" />
                </Field>
                <Field label="External Code">
                  <OrgTextInput value={form.externalCode} onChange={v => setField('externalCode', v)} disabled={isViewOnly} placeholder="Integration reference code" />
                </Field>
                <Field label="Remarks" span={2}>
                  <OrgTextareaInput value={form.remarks} onChange={v => setField('remarks', v)} disabled={isViewOnly} placeholder="Internal notes visible to administrators only…" rows={5} />
                </Field>
              </FormGrid>
              {form.effectiveTo && (
                <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '10px', background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <p style={{ fontSize: '12px', color: '#92400E', margin: 0 }}>
                    <strong>Note:</strong> The record will automatically become inactive after the Effective To date.
                  </p>
                </div>
              )}
            </OrgSectionPanel>
          )}

          {/* Review */}
          {activeSection === 'review' && (
            <div>
              {[
                {
                  heading: 'Company Identity',
                  rows: [
                    { label: 'Org Code',     value: editingRecord?.orgCode || 'AUTO — generated on first save', mono: !!editingRecord?.orgCode },
                    { label: 'Company Name', value: form.companyName || '—', missing: !form.companyName },
                    { label: 'Legal Name',   value: form.legalName   || '—', missing: !form.legalName },
                    ...(form.shortName   ? [{ label: 'Short Name',  value: form.shortName }]  : []),
                    ...(form.description ? [{ label: 'Description', value: form.description }] : []),
                  ],
                },
                {
                  heading: 'Address & Contact',
                  rows: [
                    { label: 'Address', value: [form.addressLine1, form.addressLine2, form.city, form.state, form.pinCode].filter(Boolean).join(', ') || '—', missing: !form.addressLine1 },
                    { label: 'Country', value: form.country || '—' },
                    { label: 'Phone',   value: form.phone   || '—' },
                    { label: 'Email',   value: form.email   || '—' },
                    ...(form.website ? [{ label: 'Website', value: form.website }] : []),
                  ],
                },
                {
                  heading: 'Legal & Tax',
                  rows: [
                    { label: 'GST',          value: form.gstNumber       || '—' },
                    { label: 'PAN',          value: form.panNumber       || '—' },
                    { label: 'CIN',          value: form.cinNumber       || '—' },
                    { label: 'Tax Category', value: form.taxCategory     || '—' },
                    { label: 'Fiscal Year',  value: form.fiscalYearStart ? `Starts ${form.fiscalYearStart}` : '—' },
                  ],
                },
                ...(form.effectiveFrom || form.effectiveTo ? [{
                  heading: 'Validity',
                  rows: [
                    ...(form.effectiveFrom ? [{ label: 'Effective From', value: form.effectiveFrom }] : []),
                    ...(form.effectiveTo   ? [{ label: 'Effective To',   value: form.effectiveTo   }] : []),
                  ],
                }] : []),
              ].map(block => (
                <div key={block.heading} style={{ marginBottom: '16px', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ padding: '10px 16px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{block.heading}</span>
                  </div>
                  <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: '8px', columnGap: '12px', alignItems: 'baseline' }}>
                    {block.rows.map(row => (
                      <React.Fragment key={row.label}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'right' }}>{row.label}</span>
                        <span style={{ fontSize: '13px', color: ('missing' in row && row.missing) ? '#DC2626' : 'var(--color-text)', fontFamily: ('mono' in row && row.mono) ? 'monospace' : undefined, fontWeight: ('mono' in row && row.mono) ? 700 : 500, display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {('missing' in row && row.missing) && <AlertCircle size={11} style={{ color: '#DC2626', flexShrink: 0 }} />}
                          {row.value}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}

              {/* Activation checklist */}
              <div style={{ marginBottom: '16px', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activation Checklist</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: checklistAllPassed ? '#15803D' : '#D97706' }}>
                    {checklistAllPassed ? 'All checks passed — ready to activate' : `${checklistFailCount} item${checklistFailCount !== 1 ? 's' : ''} need attention`}
                  </span>
                </div>
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {checklist.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{ flexShrink: 0, marginTop: '1px', color: item.passed ? '#16A34A' : '#D97706', display: 'flex', alignItems: 'center' }}>
                        {item.passed ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>{item.label}</span>
                        {!item.passed && item.detail && (
                          <div style={{ fontSize: '11px', color: '#D97706', marginTop: '2px' }}>{item.detail}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>{/* ── end scrollable body ── */}

        {/* ── 4. Fixed Footer ────────────────────────────────────────────── */}
        {!isViewOnly && (
          <div style={{ flexShrink: 0, height: '60px', padding: '0 24px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 50 }}>
            {!isActiveLocked && (
              <button type="button" onClick={goToPrevStep} disabled={stepIdx <= 0}
                style={{ ...btnOutline, opacity: stepIdx <= 0 ? 0.4 : 1, cursor: stepIdx <= 0 ? 'not-allowed' : 'pointer' }}>
                ← Previous
              </button>
            )}
            {!isActiveLocked && (
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', padding: '0 4px' }}>
                Step {Math.max(1, stepIdx + 1)} of {FORM_STEPS.length}
              </span>
            )}
            <span style={{ flex: 1 }} />
            {isActiveLocked && (
              <button type="button" onClick={handleSaveDraft} style={btnPrimary}>Save Changes</button>
            )}
            {!isActiveLocked && (
              <>
                <button type="button" onClick={handleSaveDraft} style={btnOutline}>Save Draft</button>
                {isOnReview ? (
                  <button type="button" onClick={handleActivate} disabled={!checklistAllPassed}
                    title={!checklistAllPassed ? `${checklistFailCount} checklist item${checklistFailCount !== 1 ? 's' : ''} need attention` : 'Activate this organisation'}
                    style={{ ...btnPrimary, opacity: checklistAllPassed ? 1 : 0.5, cursor: checklistAllPassed ? 'pointer' : 'not-allowed' }}>
                    <Check size={13} />
                    Activate Organisation
                  </button>
                ) : (
                  <button type="button" onClick={goToNextStep} style={btnPrimary}>Continue →</button>
                )}
              </>
            )}
          </div>
        )}
        {/* View-only footer */}
        {isViewOnly && (
          <div style={{ flexShrink: 0, height: '56px', padding: '0 24px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button type="button" onClick={goBackToList} style={btnOutline}>← Back to Organisations</button>
            {editingRecord && editingRecord.status !== 'Inactive' && (
              <button type="button" onClick={() => { openEditForm(editingRecord); }} style={btnOutline}>
                <Edit2 size={12} /> Edit
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Activation confirm dialog ──────────────────────────────────
  const renderActivateConfirm = () => {
    if (!activateConfirmOpen) return null;
    return (
      <>
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }} onClick={() => setActivateConfirmOpen(false)} />
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 201, width: '440px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '14px', boxShadow: '0 16px 48px rgba(0,0,0,0.18)', padding: '24px', maxWidth: '94vw' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <CheckCircle2 size={20} style={{ color: '#15803D', flexShrink: 0 }} />
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>Activate Organisation</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
            You are about to activate{' '}
            <strong style={{ color: 'var(--color-text)' }}>{form.companyName || 'this organisation'}</strong>.
            <br />
            Once active, Org Code, Legal Name and tax registration fields will be locked to preserve data integrity.
          </div>
          <div style={{ padding: '12px 14px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: '8px', display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: '6px', columnGap: '10px', marginBottom: '20px', fontSize: '12px' }}>
            <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Company</span>
            <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{form.companyName || '—'}</span>
            <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Legal Name</span>
            <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{form.legalName || '—'}</span>
            <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>City</span>
            <span style={{ color: 'var(--color-text)' }}>{form.city || '—'}</span>
            {form.gstNumber && (
              <>
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>GST</span>
                <span style={{ color: 'var(--color-text)', fontFamily: 'monospace', fontSize: '12px' }}>{form.gstNumber}</span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setActivateConfirmOpen(false)} style={btnOutline}>Cancel</button>
            <button type="button" onClick={confirmActivate} style={btnPrimary}>
              <Check size={13} />
              Confirm Activate
            </button>
          </div>
        </div>
      </>
    );
  };

  // ── Deactivation dialog ────────────────────────────────────────
  const renderDeactivationDialog = () => {
    if (!deactivationOpen || !deactivationTarget) return null;
    return (
      <>
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }} onClick={() => setDeactivationOpen(false)} />
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 201, width: '440px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '14px', boxShadow: '0 16px 48px rgba(0,0,0,0.18)', padding: '24px', maxWidth: '94vw' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <ZapOff size={18} style={{ color: '#D97706', flexShrink: 0 }} />
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>Deactivate Organisation</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
            Deactivating{' '}
            <strong style={{ color: 'var(--color-text)' }}>{deactivationTarget.companyName}</strong>{' '}
            will prevent it from being used in new configurations.
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '5px' }}>
              Deactivation Reason <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={deactivationReason}
              onChange={e => { setDeactivationReason(e.target.value); setDeactivationReasonErr(''); }}
              style={{ width: '100%', padding: '7px 11px', fontSize: '13px', border: `1px solid ${deactivationReasonErr ? '#ef4444' : 'var(--color-border)'}`, borderRadius: '8px', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
            >
              <option value="">— Select reason —</option>
              {DEACTIVATION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {deactivationReasonErr && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '3px' }}>{deactivationReasonErr}</div>}
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '5px' }}>Remark (Optional)</label>
            <textarea
              value={deactivationRemark}
              onChange={e => setDeactivationRemark(e.target.value)}
              rows={3}
              placeholder="Additional context…"
              style={{ width: '100%', padding: '7px 11px', fontSize: '13px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setDeactivationOpen(false)} style={btnOutline}>Cancel</button>
            <button type="button" onClick={confirmDeactivation} style={{ ...btnPrimary, background: '#D97706', borderColor: '#D97706' }}>
              Confirm Deactivate
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <AdminShell>
      {viewMode === 'list' ? renderList() : renderForm()}
      {renderActivateConfirm()}
      {renderDeactivationDialog()}
      {orgHelpTopic && (
        <HelpDrawer open={helpOpen} topic={orgHelpTopic} onClose={() => setHelpOpen(false)} onTopicChange={id => setHelpTopicId(id)} />
      )}
    </AdminShell>
  );
};

// ─── OrgSectionPanel ──────────────────────────────────────────────────────────

interface OrgSectionPanelProps {
  sectionKey:  OrgSectionKey;
  title:       string;
  description: string;
  form:        OrgFormData;
  children:    React.ReactNode;
}

const OrgSectionPanel: React.FC<OrgSectionPanelProps> = ({ sectionKey, title, form, children }) => {
  const required    = SECTION_REQUIRED[sectionKey];
  const allFields   = SECTION_FIELDS[sectionKey];
  const totalFields  = allFields.length;
  const filledFields = allFields.filter(f => !!form[f]).length;

  const completion: 'complete' | 'partial' | 'empty' =
    allFields.length === 0 ? 'empty' :
    (required.length > 0 && required.every(f => !!form[f])) ? 'complete' :
    allFields.some(f => !!form[f]) ? 'partial' : 'empty';

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
          {totalFields > 0 && (
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{filledFields} / {totalFields} filled</span>
          )}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 500, color: badge.color }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: badge.dot, flexShrink: 0 }} />
            {badge.label}
          </span>
        </div>
      </div>
      <div style={{ padding: '16px 20px' }}>
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

interface FieldProps {
  label:    string;
  required?: boolean;
  hint?:    string;
  error?:   string;
  span?:    number;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, required, hint, error, span, children }) => (
  <div style={{ gridColumn: span === 2 ? 'span 2 / span 2' : undefined }}>
    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '5px' }}>
      {label}
      {required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
    </label>
    {children}
    {error && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '3px' }}>{error}</div>}
    {hint && !error && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '3px' }}>{hint}</div>}
  </div>
);

// ─── Input base style ─────────────────────────────────────────────────────────

const inputBase = (disabled: boolean, hasError?: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '7px 11px',
  fontSize: '13px',
  border: `1px solid ${hasError ? '#ef4444' : 'var(--color-border)'}`,
  borderRadius: '8px',
  background: disabled ? 'var(--color-surface-subtle)' : 'var(--color-surface)',
  color: 'var(--color-text)',
  outline: 'none',
  boxSizing: 'border-box' as const,
  cursor: disabled ? 'not-allowed' : undefined,
  opacity: disabled ? 0.7 : 1,
  transition: 'border-color 0.15s',
});

// ─── OrgTextInput ─────────────────────────────────────────────────────────────

interface OrgTextInputProps {
  value:        string;
  onChange:     (v: string) => void;
  disabled?:    boolean;
  placeholder?: string;
  type?:        string;
  error?:       boolean;
}

const OrgTextInput: React.FC<OrgTextInputProps> = ({ value, onChange, disabled = false, placeholder, type = 'text', error }) => (
  <input
    type={type}
    value={value}
    onChange={e => onChange(e.target.value)}
    disabled={disabled}
    placeholder={placeholder}
    style={inputBase(disabled, error)}
  />
);

// ─── OrgTextareaInput ─────────────────────────────────────────────────────────

interface OrgTextareaInputProps {
  value:        string;
  onChange:     (v: string) => void;
  disabled?:    boolean;
  placeholder?: string;
  rows?:        number;
}

const OrgTextareaInput: React.FC<OrgTextareaInputProps> = ({ value, onChange, disabled = false, placeholder, rows = 3 }) => (
  <textarea
    value={value}
    onChange={e => onChange(e.target.value)}
    disabled={disabled}
    placeholder={placeholder}
    rows={rows}
    style={{ ...inputBase(disabled), resize: 'vertical' }}
  />
);

// ─── OrgSelectInput ───────────────────────────────────────────────────────────

interface OrgSelectInputProps {
  value:    string;
  onChange: (v: string) => void;
  disabled?:boolean;
  options:  string[];
}

const OrgSelectInput: React.FC<OrgSelectInputProps> = ({ value, onChange, disabled = false, options }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    disabled={disabled}
    style={{ ...inputBase(disabled), cursor: disabled ? 'not-allowed' : 'pointer' }}
  >
    <option value="">— Select —</option>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

// ─── OrgColourInput ───────────────────────────────────────────────────────────

interface OrgColourInputProps {
  value:    string;
  onChange: (v: string) => void;
  disabled?:boolean;
}

const OrgColourInput: React.FC<OrgColourInputProps> = ({ value, onChange, disabled = false }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <input
      type="color"
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      style={{ width: '36px', height: '34px', padding: '2px 3px', border: '1px solid var(--color-border)', borderRadius: '6px', cursor: disabled ? 'not-allowed' : 'pointer', flexShrink: 0 }}
    />
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      placeholder="#1e40af"
      style={inputBase(disabled)}
    />
  </div>
);

export default OrgMasterFormPage;

