import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Edit2,
  Eye,
  FileCode2,
  Filter,
  Hash,
  Info,
  Lock,
  Tag,
  Trash2,
  X,
  ZapOff,
} from 'lucide-react';
import AdminShell from '../AdminShell';
import { AdminPageShell } from '../../experience/components/AdminPageShell';
import { AdminListPageShell } from '../../experience/components/AdminListPageShell';
import {
  MasterDataTable,
  MasterTableHealth,
  MasterTableIdentifierLink,
  MasterTableMetric,
  MasterTablePill,
  MasterTableRowActions,
  MasterTableStatus,
  MasterTableTextCell,
  MasterTableTruncate,
  getMasterStatusTone,
} from '../../components/common/MasterDataTable';
import MasterFilterDrawer from '../../components/common/MasterFilterDrawer';
import type { DataGridColumn } from '../../components/common/dataGridTypes';
import {
  MASTER_OVERLAY_STYLE,
  MASTER_POPUP_SURFACE_STYLE,
} from '../../experience/components/overlay/overlayTokens';
import { findGroupForMasterKey, findMasterByKey } from '../adminNavConfig';
import { recordRecentAdminMaster } from '../adminStorage';
import { HelpDrawer } from '../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../experience/help/helpTopics';
import CodeGenerationPolicyFormExperience from './code-generation-policy/components/CodeGenerationPolicyFormExperience';
import CodeGenerationPolicyUndoToast from './code-generation-policy/components/CodeGenerationPolicyUndoToast';
import { useCodeGenerationPolicyKeyboardShortcuts } from './code-generation-policy/hooks/useCodeGenerationPolicyKeyboardShortcuts';
import { useCodeGenerationPolicyOptimisticMutations } from './code-generation-policy/hooks/useCodeGenerationPolicyOptimisticMutations';

// --- Constants ----------------------------------------------------------------

const MASTER_KEY = 'code-generation-policy';

const APPLICABLE_FOR_OPTIONS = ['Master', 'Transaction', 'Configuration'] as const;

const SERIES_TYPES = [
  'Continuous',
  'Calendar Year',
  'Financial Year',
  'Monthly',
  'Daily',
  'Custom',
] as const;

const DEACTIVATION_REASONS = [
  'Replaced by New Policy',
  'Incorrect Configuration',
  'Duplicate Policy Created',
  'Entity No Longer Used',
  'Prefix Changed',
  'Series Pattern Changed',
  'Migration / Data Correction',
  'Business Rule Change',
  'Other',
];

const CUSTOM_TOKENS = [
  { token: '{Prefix}',         label: 'Prefix',         hint: 'Selected prefix value' },
  { token: '{Calendar Year}',  label: 'Calendar Year',  hint: 'YYYY or YY per format' },
  { token: '{Financial Year}', label: 'Financial Year', hint: 'Based on FY format setting' },
  { token: '{Month}',          label: 'Month',          hint: 'MM (01–12)' },
  { token: '{Day}',            label: 'Day',            hint: 'DD (01–31)' },
  { token: '{Entity Code}',    label: 'Entity Code',    hint: 'From entity metadata' },
  { token: '{Branch Code}',    label: 'Branch Code',    hint: 'From transaction context' },
  { token: '{Sequence}',       label: 'Sequence *',     hint: 'Required — sequential number' },
];

// Fields that must be locked once a policy is Active
const CRITICAL_FIELDS = new Set<keyof PolicyFormData>([
  'applicableFor', 'module', 'entity', 'entityType',
  'prefixId', 'prefixValue',
  'seriesType', 'calendarYearFormat', 'financialYearFormat',
  'customResetBasis', 'codePattern',
  'numberLength', 'startingNumber',
  'paddingCharacter', 'alignmentType', 'separator', 'caseFormat',
]);

// --- Form section navigation (org-master-style sidebar) --------------------

type CGPSectionKey = 'basic' | 'applicability' | 'prefix' | 'series' | 'format' | 'history';

const CGP_SECTIONS: Array<{
  key: CGPSectionKey;
  label: string;
  icon: React.ElementType;
  description: string;
}> = [
  { key: 'basic',         label: 'Basic Details',    icon: FileCode2, description: 'Policy name, display name and status' },
  { key: 'applicability', label: 'Applicability',    icon: Tag,       description: 'Module, entity and scope' },
  { key: 'prefix',        label: 'Prefix Selection', icon: Hash,      description: 'Prefix assigned to this policy' },
  { key: 'series',        label: 'Series & Pattern', icon: Edit2,     description: 'Series type, year format and pattern' },
  { key: 'format',        label: 'Number Format',    icon: Info,      description: 'Sequence length, padding and separator' },
  { key: 'history',       label: 'Usage & History',  icon: Eye,       description: 'Usage stats and deactivation record' },
];

const CGP_SECTION_REQUIRED: Record<CGPSectionKey, (keyof PolicyFormData)[]> = {
  basic:         ['policyName', 'displayName'],
  applicability: ['applicableFor', 'module', 'entity'],
  prefix:        ['prefixId'],
  series:        ['seriesType'],
  format:        ['numberLength', 'startingNumber', 'paddingCharacter', 'alignmentType', 'separator', 'caseFormat'],
  history:       [],
};

const CGP_SECTION_FIELDS: Record<CGPSectionKey, (keyof PolicyFormData)[]> = {
  basic:         ['policyName', 'displayName', 'status', 'description'],
  applicability: ['applicableFor', 'module', 'entity', 'entityType'],
  prefix:        ['prefixId', 'prefixValue'],
  series:        ['seriesType', 'calendarYearFormat', 'financialYearFormat', 'customResetBasis', 'codePattern'],
  format:        ['numberLength', 'startingNumber', 'paddingCharacter', 'alignmentType', 'separator', 'caseFormat'],
  history:       [],
};

function getCGPSectionCompletion(key: CGPSectionKey, form: PolicyFormData): 'complete' | 'partial' | 'empty' {
  const required = CGP_SECTION_REQUIRED[key];
  const allFields = CGP_SECTION_FIELDS[key];
  if (allFields.length === 0) return 'empty';
  if (required.length > 0 && required.every((f) => !!form[f])) return 'complete';
  if (allFields.some((f) => !!form[f])) return 'partial';
  return 'empty';
}

// Sample date fixed to current date for consistent previews
const SAMPLE_DATE = new Date(2026, 4, 21); // May 21, 2026

// --- Types --------------------------------------------------------------------

type PolicyStatus = 'Draft' | 'Active' | 'Inactive';
type ViewMode = 'list' | 'form';
type FormMode = 'add' | 'edit' | 'view';

interface PolicyFormData {
  policyName: string;
  displayName: string;
  description: string;
  status: PolicyStatus;
  applicableFor: string;
  module: string;
  entity: string;
  entityType: string;
  prefixId: string;
  prefixValue: string;
  seriesType: string;
  calendarYearFormat: string;
  financialYearFormat: string;
  customResetBasis: string;
  codePattern: string;
  numberLength: string;
  startingNumber: string;
  paddingCharacter: string;
  alignmentType: string;
  separator: string;
  caseFormat: string;
}

interface Policy extends PolicyFormData {
  id: string;
  policyCode: string;
  sampleCode: string;
  usedInCodeGeneration: boolean;
  generatedCodeCount: number;
  deactivationReason: string;
  deactivationRemark: string;
}

interface PrefixOption {
  id: string;
  code: string;
  name: string;
  prefixValue: string;
  applicableFor: string;
  module: string;
  entity: string;
  entityType: string;
  isActive: boolean;
  isDefault: boolean;
}

// --- Mock data for modules / entities / entity-types -------------------------

const MODULE_OPTIONS: Record<string, string[]> = {
  Master:        ['CRM', 'Inventory', 'HR', 'Asset'],
  Transaction:   ['Sales', 'Purchase', 'Finance', 'Production'],
  Configuration: ['System', 'Workflow', 'Reporting'],
};

const ENTITY_OPTIONS: Record<string, Record<string, string[]>> = {
  Master: {
    CRM:       ['Customer', 'Contact', 'Lead'],
    Inventory: ['Product', 'Category', 'Batch'],
    HR:        ['Employee', 'Designation', 'Department'],
    Asset:     ['Asset', 'Asset Type'],
  },
  Transaction: {
    Sales:      ['Sales Order', 'Sales Invoice', 'Delivery'],
    Purchase:   ['Purchase Order', 'Purchase Invoice', 'Purchase Receipt'],
    Finance:    ['Payment Voucher', 'Receipt Voucher', 'Journal Entry'],
    Production: ['Work Order', 'Job Card'],
  },
  Configuration: {
    System:    ['Report', 'Template', 'Notification'],
    Workflow:  ['Approval Workflow', 'Checklist'],
    Reporting: ['Dashboard', 'Report Config'],
  },
};

// Entities that require an entity type
const ENTITY_TYPE_OPTIONS: Record<string, string[]> = {
  'Sales Order':      ['Standard', 'Return', 'Exchange'],
  'Sales Invoice':    ['Standard', 'Credit Note'],
  'Purchase Order':   ['Standard', 'Import', 'Service'],
  'Purchase Invoice': ['Standard', 'Debit Note'],
};

const MOCK_PREFIXES: PrefixOption[] = [
  { id: 'PFX-001', code: 'PFX-001', name: 'Sales Order Prefix',      prefixValue: 'SO',   applicableFor: 'Transaction', module: 'Sales',      entity: 'Sales Order',      entityType: 'Standard', isActive: true, isDefault: true },
  { id: 'PFX-002', code: 'PFX-002', name: 'Purchase Order Prefix',   prefixValue: 'PO',   applicableFor: 'Transaction', module: 'Purchase',    entity: 'Purchase Order',   entityType: 'Standard', isActive: true, isDefault: true },
  { id: 'PFX-003', code: 'PFX-003', name: 'Customer Prefix',         prefixValue: 'CUST', applicableFor: 'Master',      module: 'CRM',         entity: 'Customer',         entityType: '',         isActive: true, isDefault: true },
  { id: 'PFX-004', code: 'PFX-004', name: 'Sales Invoice Prefix',    prefixValue: 'INV',  applicableFor: 'Transaction', module: 'Sales',       entity: 'Sales Invoice',    entityType: 'Standard', isActive: true, isDefault: true },
  { id: 'PFX-005', code: 'PFX-005', name: 'Product Code Prefix',     prefixValue: 'PROD', applicableFor: 'Master',      module: 'Inventory',   entity: 'Product',          entityType: '',         isActive: true, isDefault: false },
  { id: 'PFX-006', code: 'PFX-006', name: 'Delivery Note Prefix',    prefixValue: 'DLV',  applicableFor: 'Transaction', module: 'Sales',       entity: 'Delivery',         entityType: '',         isActive: true, isDefault: true },
  { id: 'PFX-007', code: 'PFX-007', name: 'Work Order Prefix',       prefixValue: 'WO',   applicableFor: 'Transaction', module: 'Production',  entity: 'Work Order',       entityType: '',         isActive: true, isDefault: true },
  { id: 'PFX-008', code: 'PFX-008', name: 'Employee Code Prefix',    prefixValue: 'EMP',  applicableFor: 'Master',      module: 'HR',          entity: 'Employee',         entityType: '',         isActive: true, isDefault: true },
  { id: 'PFX-009', code: 'PFX-009', name: 'Report Config Prefix',    prefixValue: 'RPT',  applicableFor: 'Configuration', module: 'Reporting', entity: 'Report Config',    entityType: '',         isActive: true, isDefault: true },
];

const EMPTY_FORM: PolicyFormData = {
  policyName: '', displayName: '', description: '', status: 'Draft',
  applicableFor: '', module: '', entity: '', entityType: '',
  prefixId: '', prefixValue: '',
  seriesType: '', calendarYearFormat: '', financialYearFormat: '',
  customResetBasis: '', codePattern: '',
  numberLength: '5', startingNumber: '1',
  paddingCharacter: '0', alignmentType: 'Right',
  separator: '-', caseFormat: 'Uppercase',
};

const INITIAL_POLICIES: Policy[] = [
  {
    id: '1', policyCode: 'CGP-001',
    policyName: 'Customer Master Code', displayName: 'Customer Code',
    description: 'Auto-generated sequential code for all customer master records.',
    status: 'Active', applicableFor: 'Master', module: 'CRM', entity: 'Customer', entityType: '',
    prefixId: 'PFX-003', prefixValue: 'CUST',
    seriesType: 'Continuous', calendarYearFormat: '', financialYearFormat: '',
    customResetBasis: '', codePattern: '',
    numberLength: '6', startingNumber: '1', paddingCharacter: '0',
    alignmentType: 'Right', separator: '-', caseFormat: 'Uppercase',
    sampleCode: 'CUST-000001', usedInCodeGeneration: true, generatedCodeCount: 247,
    deactivationReason: '', deactivationRemark: '',
  },
  {
    id: '2', policyCode: 'CGP-002',
    policyName: 'Sales Order Number', displayName: 'Sales Order Number',
    description: 'Financial year based numbering for standard sales orders with annual reset.',
    status: 'Active', applicableFor: 'Transaction', module: 'Sales', entity: 'Sales Order', entityType: 'Standard',
    prefixId: 'PFX-001', prefixValue: 'SO',
    seriesType: 'Financial Year', calendarYearFormat: '', financialYearFormat: 'YY-YY',
    customResetBasis: '', codePattern: '',
    numberLength: '5', startingNumber: '1', paddingCharacter: '0',
    alignmentType: 'Right', separator: '-', caseFormat: 'Uppercase',
    sampleCode: 'SO-26-27-00001', usedInCodeGeneration: true, generatedCodeCount: 1432,
    deactivationReason: '', deactivationRemark: '',
  },
  {
    id: '3', policyCode: 'CGP-003',
    policyName: 'Product Master Code', displayName: 'Product Code',
    description: '',
    status: 'Draft', applicableFor: 'Master', module: 'Inventory', entity: 'Product', entityType: '',
    prefixId: 'PFX-005', prefixValue: 'PROD',
    seriesType: 'Continuous', calendarYearFormat: '', financialYearFormat: '',
    customResetBasis: '', codePattern: '',
    numberLength: '5', startingNumber: '1', paddingCharacter: '0',
    alignmentType: 'Right', separator: '-', caseFormat: 'Uppercase',
    sampleCode: 'PROD-00001', usedInCodeGeneration: false, generatedCodeCount: 0,
    deactivationReason: '', deactivationRemark: '',
  },
  {
    id: '4', policyCode: 'CGP-004',
    policyName: 'Purchase Order Number', displayName: 'Purchase Order Number',
    description: 'Financial year based numbering for all standard purchase orders.',
    status: 'Active', applicableFor: 'Transaction', module: 'Purchase', entity: 'Purchase Order', entityType: 'Standard',
    prefixId: 'PFX-002', prefixValue: 'PO',
    seriesType: 'Financial Year', calendarYearFormat: '', financialYearFormat: 'YY-YY',
    customResetBasis: '', codePattern: '',
    numberLength: '5', startingNumber: '1', paddingCharacter: '0',
    alignmentType: 'Right', separator: '-', caseFormat: 'Uppercase',
    sampleCode: 'PO-26-27-00001', usedInCodeGeneration: true, generatedCodeCount: 876,
    deactivationReason: '', deactivationRemark: '',
  },
  {
    id: '5', policyCode: 'CGP-005',
    policyName: 'Sales Invoice Number (Legacy)', displayName: 'Sales Invoice (Legacy)',
    description: 'Replaced by new financial year based invoice numbering policy.',
    status: 'Inactive', applicableFor: 'Transaction', module: 'Sales', entity: 'Sales Invoice', entityType: 'Standard',
    prefixId: 'PFX-004', prefixValue: 'INV',
    seriesType: 'Calendar Year', calendarYearFormat: 'YYYY', financialYearFormat: '',
    customResetBasis: '', codePattern: '',
    numberLength: '5', startingNumber: '1', paddingCharacter: '0',
    alignmentType: 'Right', separator: '-', caseFormat: 'Uppercase',
    sampleCode: 'INV-2026-00001', usedInCodeGeneration: true, generatedCodeCount: 3421,
    deactivationReason: 'Replaced by New Policy',
    deactivationRemark: 'Migrated to new financial year based policy.',
  },
];

// --- Helper functions ---------------------------------------------------------

function buildSampleCode(form: PolicyFormData): string {
  if (!form.seriesType || !form.prefixValue) return '—';

  const applyCase = (s: string) => {
    if (form.caseFormat === 'Uppercase') return s.toUpperCase();
    if (form.caseFormat === 'Lowercase') return s.toLowerCase();
    return s;
  };

  const sep = form.separator === 'Blank' ? '' : (form.separator || '-');
  const prefix = applyCase(form.prefixValue || 'PREFIX');
  const numLen = Math.max(1, parseInt(form.numberLength || '5', 10));
  const startNum = Math.max(1, parseInt(form.startingNumber || '1', 10));
  const padChar = form.paddingCharacter || '0';

  const seqStr = form.alignmentType === 'Left'
    ? String(startNum).padEnd(numLen, padChar)
    : String(startNum).padStart(numLen, padChar);

  const calYear = form.calendarYearFormat === 'YY'
    ? String(SAMPLE_DATE.getFullYear()).slice(-2)
    : String(SAMPLE_DATE.getFullYear());

  const fyStart = SAMPLE_DATE.getMonth() >= 3 ? SAMPLE_DATE.getFullYear() : SAMPLE_DATE.getFullYear() - 1;
  const fyEnd = fyStart + 1;
  const fyMap: Record<string, string> = {
    'YYYY-YY': `${fyStart}-${String(fyEnd).slice(-2)}`,
    'YY-YY':   `${String(fyStart).slice(-2)}-${String(fyEnd).slice(-2)}`,
    'FY-YYYY-YY': `FY-${fyStart}-${String(fyEnd).slice(-2)}`,
    'FY-YY-YY':   `FY-${String(fyStart).slice(-2)}-${String(fyEnd).slice(-2)}`,
  };
  const fyStr = fyMap[form.financialYearFormat] ?? `${String(fyStart).slice(-2)}-${String(fyEnd).slice(-2)}`;
  const month = String(SAMPLE_DATE.getMonth() + 1).padStart(2, '0');
  const day = String(SAMPLE_DATE.getDate()).padStart(2, '0');

  if (form.seriesType === 'Custom') {
    if (!form.codePattern) return 'CONFIGURE-PATTERN';
    return form.codePattern
      .replace(/\{Prefix\}/g, prefix)
      .replace(/\{Calendar Year\}/g, calYear)
      .replace(/\{Financial Year\}/g, fyStr)
      .replace(/\{Month\}/g, month)
      .replace(/\{Day\}/g, day)
      .replace(/\{Entity Code\}/g, applyCase('ENT'))
      .replace(/\{Branch Code\}/g, applyCase('PUNE'))
      .replace(/\{Sequence\}/g, seqStr);
  }

  const parts: string[] = [];
  switch (form.seriesType) {
    case 'Continuous':    parts.push(prefix, seqStr);                         break;
    case 'Calendar Year': parts.push(prefix, calYear, seqStr);                break;
    case 'Financial Year':parts.push(prefix, fyStr, seqStr);                  break;
    case 'Monthly':       parts.push(prefix, calYear, month, seqStr);         break;
    case 'Daily':         parts.push(prefix, calYear, month, day, seqStr);    break;
    default:              parts.push(prefix, seqStr);
  }
  return parts.join(sep);
}

function getStatusStyle(status: PolicyStatus): React.CSSProperties {
  if (status === 'Active')   return { background: '#DCFCE7', color: '#15803D' };
  if (status === 'Inactive') return { background: '#FEF2F2', color: '#DC2626' };
  return { background: '#F1F5F9', color: '#64748B' };
}

function getStatusDotColor(status: PolicyStatus): string {
  if (status === 'Active')   return '#16A34A';
  if (status === 'Inactive') return '#DC2626';
  return '#94A3B8';
}

function getApplicableForStyle(t: string): React.CSSProperties {
  if (t === 'Master')        return { background: '#EFF6FF', color: '#1D4ED8' };
  if (t === 'Transaction')   return { background: '#F0FDF4', color: '#15803D' };
  if (t === 'Configuration') return { background: '#FDF4FF', color: '#A21CAF' };
  return { background: '#F1F5F9', color: '#475569' };
}

function getSeriesTypeStyle(): React.CSSProperties {
  return { background: '#F5F3FF', color: '#6D28D9' };
}

type PolicyHealth = 'Healthy' | 'Draft Incomplete' | 'Needs Review' | 'Prefix Missing' | 'Inactive';

function getPolicyHealth(policy: Policy): PolicyHealth {
  if (policy.status === 'Inactive') return 'Inactive';
  if (policy.status === 'Draft') {
    if (!policy.prefixId || !policy.prefixValue) return 'Prefix Missing';
    if (!policy.applicableFor || !policy.module || !policy.entity) return 'Needs Review';
    if (!policy.seriesType) return 'Needs Review';
    return 'Draft Incomplete';
  }
  if (!policy.prefixValue) return 'Prefix Missing';
  if (!policy.applicableFor || !policy.module || !policy.entity) return 'Needs Review';
  return 'Healthy';
}

function getHealthIndicator(health: PolicyHealth): { icon: React.ReactNode; color: string; label: string } {
  switch (health) {
    case 'Healthy':          return { icon: <CheckCircle2 size={11} />, color: '#15803D', label: 'Healthy' };
    case 'Draft Incomplete': return { icon: <AlertCircle  size={11} />, color: '#94A3B8', label: 'Incomplete' };
    case 'Needs Review':     return { icon: <AlertCircle  size={11} />, color: '#D97706', label: 'Needs review' };
    case 'Prefix Missing':   return { icon: <AlertCircle  size={11} />, color: '#DC2626', label: 'Prefix missing' };
    case 'Inactive':         return { icon: null,                       color: '#94A3B8', label: 'Inactive' };
  }
}

function validateForDraftSave(form: PolicyFormData): Partial<Record<keyof PolicyFormData, string>> {
  const errs: Partial<Record<keyof PolicyFormData, string>> = {};
  if (!form.policyName.trim())  errs.policyName   = 'Policy Name is required.';
  if (!form.displayName.trim()) errs.displayName   = 'Display Name is required.';
  if (!form.applicableFor)      errs.applicableFor = 'Applicable For is required.';
  if (!form.module)             errs.module        = 'Module is required.';
  if (!form.entity)             errs.entity        = 'Entity is required.';
  return errs;
}

function validateForActivation(
  form: PolicyFormData,
  policies: Policy[],
  editingId: string | null
): string[] {
  const errs: string[] = [];
  if (!form.policyName.trim())  errs.push('Policy Name is required.');
  if (!form.displayName.trim()) errs.push('Display Name is required.');
  if (!form.applicableFor)      errs.push('Applicable For is required.');
  if (!form.module)             errs.push('Module is required.');
  if (!form.entity)             errs.push('Entity is required.');

  if (!form.prefixId) errs.push('An active Prefix is required.');
  if (!form.seriesType) errs.push('Series Type is required.');

  if (['Calendar Year', 'Monthly', 'Daily'].includes(form.seriesType) && !form.calendarYearFormat)
    errs.push('Calendar Year Format is required for the selected Series Type.');
  if (form.seriesType === 'Financial Year' && !form.financialYearFormat)
    errs.push('Financial Year Format is required for Financial Year series.');
  if (form.seriesType === 'Custom') {
    if (!form.customResetBasis) errs.push('Custom Reset Basis is required for Custom Series.');
    if (!form.codePattern)      errs.push('Code Pattern is required for Custom Series.');
    else if (!form.codePattern.includes('{Sequence}'))
      errs.push('Code Pattern must include the {Sequence} token.');
  }

  const numLen  = parseInt(form.numberLength, 10);
  const startNum = parseInt(form.startingNumber, 10);
  if (!form.numberLength || isNaN(numLen) || numLen <= 0 || numLen > 10)
    errs.push('Number Length must be a valid number between 1 and 10.');
  if (!form.startingNumber || isNaN(startNum) || startNum <= 0)
    errs.push('Starting Number must be greater than 0.');
  if (!isNaN(numLen) && !isNaN(startNum) && String(startNum).length > numLen)
    errs.push(`Starting Number (${startNum}) does not fit within Number Length (${numLen}).`);

  if (!form.paddingCharacter) errs.push('Padding Character is required.');
  if (!form.alignmentType)    errs.push('Alignment Type is required.');
  if (!form.separator)        errs.push('Separator is required.');
  if (!form.caseFormat)       errs.push('Case Format is required.');

  const dup = policies.find(p =>
    p.id !== editingId &&
    p.status === 'Active' &&
    p.applicableFor === form.applicableFor &&
    p.module === form.module &&
    p.entity === form.entity &&
    p.entityType === form.entityType &&
    p.prefixId === form.prefixId
  );
  if (dup)
    errs.push(`An active policy already exists for this scope and prefix (${dup.policyCode}). Deactivate it before activating a new one.`);

  return errs;
}

function generatePolicyCode(policies: Policy[]): string {
  const prefix = 'CGP-';
  const max = policies.reduce((m, p) => {
    const n = parseInt(p.policyCode.replace(prefix, ''), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

// --- Component ----------------------------------------------------------------

const CodeGenerationPolicyPage: React.FC = () => {
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

  // -- View state -------------------------------------------------
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [formMode, setFormMode] = useState<FormMode>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<CGPSectionKey>('basic');

  // -- Data -------------------------------------------------------
  const {
    items: policies,
    runOptimisticMutation,
    toast,
    dismissToast,
  } = useCodeGenerationPolicyOptimisticMutations<Policy>(INITIAL_POLICIES);

  // -- Form -------------------------------------------------------
  const [form, setForm] = useState<PolicyFormData>({ ...EMPTY_FORM });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof PolicyFormData, string>>>({});
  const [activationErrors, setActivationErrors] = useState<string[]>([]);

  // -- List filters -----------------------------------------------
  const [searchQuery, setSearchQuery]           = useState('');
  const [filterStatus, setFilterStatus]         = useState('');
  const [filterApplicableFor, setFilterAF]      = useState('');
  const [filterSeriesType, setFilterSeries]     = useState('');

  // -- Deactivation modal -----------------------------------------
  const [deactivationOpen, setDeactivationOpen]       = useState(false);
  const [deactivationTarget, setDeactivationTarget]   = useState<Policy | null>(null);
  const [deactivationReason, setDeactivationReason]   = useState('');
  const [deactivationRemark, setDeactivationRemark]   = useState('');
  const [deactivationReasonErr, setDeactivationReasonErr] = useState('');

  // -- Delete confirm ---------------------------------------------
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget]           = useState<Policy | null>(null);

  // -- Activate confirm -------------------------------------------
  const [activateConfirmOpen, setActivateConfirmOpen] = useState(false);

  // -- Help -------------------------------------------------------
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpTopicId, setHelpTopicId] = useState('code-generation-policy');

  // -- Preview & more-menu ----------------------------------------
  const [previewPolicy, setPreviewPolicy] = useState<Policy | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // --- Computed --------------------------------------------------
  const editingPolicy = useMemo(() =>
    policies.find(p => p.id === editingId) ?? null,
    [policies, editingId]
  );

  const isViewOnly = formMode === 'view';
  const isActiveLocked = !isViewOnly && editingPolicy?.status === 'Active';

  const isLocked = useCallback((field: keyof PolicyFormData) => {
    if (isViewOnly) return true;
    if (isActiveLocked && CRITICAL_FIELDS.has(field)) return true;
    return false;
  }, [isViewOnly, isActiveLocked]);

  const availableModules = useMemo(() =>
    form.applicableFor ? (MODULE_OPTIONS[form.applicableFor] ?? []) : [],
    [form.applicableFor]
  );

  const availableEntities = useMemo(() =>
    (form.applicableFor && form.module)
      ? (ENTITY_OPTIONS[form.applicableFor]?.[form.module] ?? [])
      : [],
    [form.applicableFor, form.module]
  );

  const availableEntityTypes = useMemo(() =>
    form.entity ? (ENTITY_TYPE_OPTIONS[form.entity] ?? []) : [],
    [form.entity]
  );

  const requiresEntityType = useMemo(() => availableEntityTypes.length > 0, [availableEntityTypes]);

  const availablePrefixes = useMemo(() => {
    if (!form.applicableFor || !form.module || !form.entity) return [];
    return MOCK_PREFIXES.filter(p =>
      p.isActive &&
      p.applicableFor === form.applicableFor &&
      p.module === form.module &&
      p.entity === form.entity &&
      (form.entityType ? p.entityType === form.entityType : true)
    );
  }, [form.applicableFor, form.module, form.entity, form.entityType]);

  const showCalendarYearFormat = useMemo(() =>
    ['Calendar Year', 'Monthly', 'Daily'].includes(form.seriesType) ||
    (form.seriesType === 'Custom' && form.codePattern.includes('{Calendar Year}')),
    [form.seriesType, form.codePattern]
  );

  const showFinancialYearFormat = useMemo(() =>
    form.seriesType === 'Financial Year' ||
    (form.seriesType === 'Custom' && form.codePattern.includes('{Financial Year}')),
    [form.seriesType, form.codePattern]
  );

  const showCustomSection = form.seriesType === 'Custom';

  const sampleCode = useMemo(() => buildSampleCode(form), [form]);

  const filteredPolicies = useMemo(() => {
    let list = policies;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.policyCode.toLowerCase().includes(q) ||
        p.policyName.toLowerCase().includes(q) ||
        p.entity.toLowerCase().includes(q) ||
        p.module.toLowerCase().includes(q) ||
        p.prefixValue.toLowerCase().includes(q)
      );
    }
    if (filterStatus)        list = list.filter(p => p.status === filterStatus);
    if (filterApplicableFor) list = list.filter(p => p.applicableFor === filterApplicableFor);
    if (filterSeriesType)    list = list.filter(p => p.seriesType === filterSeriesType);
    return list;
  }, [policies, searchQuery, filterStatus, filterApplicableFor, filterSeriesType]);


  // Auto-select prefix when scope is fully specified
  useEffect(() => {
    if (isLocked('prefixId') || !form.applicableFor || !form.module || !form.entity) return;
    if (availablePrefixes.length === 1) {
      const only = availablePrefixes[0];
      setForm(prev => ({ ...prev, prefixId: only.id, prefixValue: only.prefixValue }));
    } else if (availablePrefixes.length > 1) {
      const def = availablePrefixes.find(p => p.isDefault);
      if (def && !form.prefixId) {
        setForm(prev => ({ ...prev, prefixId: def.id, prefixValue: def.prefixValue }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availablePrefixes]);

  // --- Form field helper ------------------------------------------
  const setField = useCallback(<K extends keyof PolicyFormData>(key: K, value: PolicyFormData[K]) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'applicableFor') { next.module = ''; next.entity = ''; next.entityType = ''; next.prefixId = ''; next.prefixValue = ''; }
      if (key === 'module')        { next.entity = ''; next.entityType = ''; next.prefixId = ''; next.prefixValue = ''; }
      if (key === 'entity')        { next.entityType = ''; next.prefixId = ''; next.prefixValue = ''; }
      if (key === 'entityType')    { next.prefixId = ''; next.prefixValue = ''; }
      if (key === 'prefixId') {
        const pfx = MOCK_PREFIXES.find(p => p.id === value);
        next.prefixValue = pfx ? pfx.prefixValue : '';
      }
      if (key === 'seriesType') {
        next.calendarYearFormat = '';
        next.financialYearFormat = '';
        next.customResetBasis = '';
        next.codePattern = '';
      }
      return next;
    });
    setFieldErrors(prev => ({ ...prev, [key]: undefined }));
    setActivationErrors([]);
  }, []);

  // --- Navigation helpers -----------------------------------------
  const openAddForm = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setFieldErrors({});
    setActivationErrors([]);
    setFormMode('add');
    setActiveSection('basic');
    setViewMode('form');
  };

  const policyToForm = (policy: Policy): PolicyFormData => ({
    policyName: policy.policyName, displayName: policy.displayName,
    description: policy.description, status: policy.status,
    applicableFor: policy.applicableFor, module: policy.module,
    entity: policy.entity, entityType: policy.entityType,
    prefixId: policy.prefixId, prefixValue: policy.prefixValue,
    seriesType: policy.seriesType, calendarYearFormat: policy.calendarYearFormat,
    financialYearFormat: policy.financialYearFormat, customResetBasis: policy.customResetBasis,
    codePattern: policy.codePattern, numberLength: policy.numberLength,
    startingNumber: policy.startingNumber, paddingCharacter: policy.paddingCharacter,
    alignmentType: policy.alignmentType, separator: policy.separator,
    caseFormat: policy.caseFormat,
  });

  const openEditForm = (policy: Policy) => {
    setEditingId(policy.id);
    setForm(policyToForm(policy));
    setFieldErrors({});
    setActivationErrors([]);
    setFormMode('edit');
    setActiveSection('basic');
    setViewMode('form');
  };

  const openViewForm = (policy: Policy) => {
    setEditingId(policy.id);
    setForm(policyToForm(policy));
    setFieldErrors({});
    setActivationErrors([]);
    setFormMode('view');
    setActiveSection('basic');
    setViewMode('form');
  };

  const goBackToList = () => {
    setViewMode('list');
    setEditingId(null);
    setActivationErrors([]);
  };

  // --- Save Draft -------------------------------------------------
  const handleSaveDraft = () => {
    const errs = validateForDraftSave(form);
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    const code = editingId
      ? (editingPolicy?.policyCode ?? generatePolicyCode(policies))
      : generatePolicyCode(policies);

    const saved: Policy = {
      ...form,
      id: editingId ?? Date.now().toString(),
      policyCode: code,
      status: 'Draft',
      sampleCode: buildSampleCode(form),
      usedInCodeGeneration: editingPolicy?.usedInCodeGeneration ?? false,
      generatedCodeCount: editingPolicy?.generatedCodeCount ?? 0,
      deactivationReason: editingPolicy?.deactivationReason ?? '',
      deactivationRemark: editingPolicy?.deactivationRemark ?? '',
    };

    runOptimisticMutation({
      message: editingId ? 'Draft changes saved' : 'Draft policy created',
      description: 'The policy list updated immediately. Use Undo if you want to roll back this draft change.',
      nextState: (current) =>
        editingId ? current.map((policy) => policy.id === editingId ? saved : policy) : [...current, saved],
    });
    goBackToList();
  };

  // --- Activate ---------------------------------------------------
  const handleActivate = () => {
    const errs = validateForActivation(form, policies, editingId);
    if (errs.length > 0) { setActivationErrors(errs); return; }
    setActivationErrors([]);
    setActivateConfirmOpen(true);
  };

  const confirmActivate = () => {
    const code = editingId
      ? (editingPolicy?.policyCode ?? generatePolicyCode(policies))
      : generatePolicyCode(policies);

    const saved: Policy = {
      ...form,
      id: editingId ?? Date.now().toString(),
      policyCode: code,
      status: 'Active',
      sampleCode: buildSampleCode(form),
      usedInCodeGeneration: editingPolicy?.usedInCodeGeneration ?? false,
      generatedCodeCount: editingPolicy?.generatedCodeCount ?? 0,
      deactivationReason: '',
      deactivationRemark: '',
    };

    runOptimisticMutation({
      message: 'Policy activated',
      description: 'The policy status changed immediately and can still be undone from the toast.',
      nextState: (current) =>
        editingId ? current.map((policy) => policy.id === editingId ? saved : policy) : [...current, saved],
    });
    setActivateConfirmOpen(false);
    goBackToList();
  };

  // --- Deactivate -------------------------------------------------
  const openDeactivation = (policy: Policy) => {
    setDeactivationTarget(policy);
    setDeactivationReason('');
    setDeactivationRemark('');
    setDeactivationReasonErr('');
    setDeactivationOpen(true);
  };

  const confirmDeactivation = () => {
    if (!deactivationReason) { setDeactivationReasonErr('Deactivation Reason is required.'); return; }
    if (deactivationTarget) {
      runOptimisticMutation({
        message: 'Policy deactivated',
        description: 'The policy was removed from active generation immediately and can be undone from the toast.',
        nextState: (current) => current.map((policy) =>
          policy.id === deactivationTarget.id
            ? { ...policy, status: 'Inactive', deactivationReason, deactivationRemark }
            : policy
        ),
      });
    }
    setDeactivationOpen(false);
    setDeactivationTarget(null);
    if (viewMode === 'form') goBackToList();
  };

  // --- Delete -----------------------------------------------------
  const openDeleteConfirm = (policy: Policy) => {
    setDeleteTarget(policy);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      runOptimisticMutation({
        message: 'Policy deleted',
        description: 'The draft row was removed immediately and can be restored using Undo.',
        nextState: (current) => current.filter((policy) => policy.id !== deleteTarget.id),
      });
    }
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  useCodeGenerationPolicyKeyboardShortcuts({
    onDismiss: () => {
      if (previewPolicy) {
        setPreviewPolicy(null);
        return;
      }
      if (helpOpen) {
        setHelpOpen(false);
        return;
      }
      if (showAdvancedFilters) {
        setShowAdvancedFilters(false);
        return;
      }
      if (deleteConfirmOpen) {
        setDeleteConfirmOpen(false);
        return;
      }
      if (activateConfirmOpen) {
        setActivateConfirmOpen(false);
        return;
      }
      if (deactivationOpen) {
        setDeactivationOpen(false);
        return;
      }
      if (viewMode === 'form') {
        goBackToList();
      }
    },
    onPrimaryAction: () => {
      if (viewMode === 'list') {
        openAddForm();
        return;
      }
      if (activateConfirmOpen) {
        confirmActivate();
        return;
      }
      if (editingPolicy?.status === 'Active') {
        handleSaveDraft();
        return;
      }
      handleActivate();
    },
  });

  // --- Guards -----------------------------------------------------
  if (!master || !group) return null;

  const cgpHelpTopic = useMemo(() => getHelpTopic(helpTopicId), [helpTopicId]);

  // --- Render: list view ------------------------------------------
  const renderList = () => {
    const hasAdvancedFilter = !!(filterApplicableFor || filterSeriesType);
    const getHealthTone = (health: PolicyHealth): 'neutral' | 'success' | 'warning' | 'danger' => {
      if (health === 'Healthy') return 'success';
      if (health === 'Needs Review') return 'warning';
      if (health === 'Prefix Missing') return 'danger';
      return 'neutral';
    };

    const gridColumns: DataGridColumn<Policy>[] = [
      {
        id: 'policyCode',
        label: 'Code',
        type: 'text',
        width: 136,
        minWidth: 120,
        hideable: false,
        defaultPin: 'left',
        getValue: (policy) => policy.policyCode,
        renderCell: (policy) => (
          <MasterTableIdentifierLink label={policy.policyCode} onClick={() => setPreviewPolicy(policy)} />
        ),
      },
      {
        id: 'policyName',
        label: 'Policy Name',
        type: 'text',
        width: 248,
        minWidth: 220,
        hideable: false,
        getValue: (policy) => policy.policyName,
        renderCell: (policy) => (
          <MasterTableTextCell
            primary={policy.policyName}
            secondary={policy.displayName && policy.displayName !== policy.policyName ? policy.displayName : undefined}
            title={policy.policyName}
          />
        ),
      },
      {
        id: 'applicableFor',
        label: 'For',
        type: 'enum',
        width: 104,
        minWidth: 96,
        getValue: (policy) => policy.applicableFor,
        options: APPLICABLE_FOR_OPTIONS.map((value) => ({ value, label: value })),
        renderCell: (policy) => <MasterTablePill label={(policy.applicableFor || '-').toUpperCase()} tone="neutral" />,
      },
      {
        id: 'module',
        label: 'Module',
        type: 'text',
        width: 128,
        minWidth: 116,
        getValue: (policy) => policy.module,
        renderCell: (policy) => <MasterTableTruncate value={policy.module || '-'} />,
      },
      {
        id: 'entity',
        label: 'Entity',
        type: 'text',
        width: 220,
        minWidth: 190,
        getValue: (policy) => `${policy.entity}${policy.entityType ? ` (${policy.entityType})` : ''}`,
        renderCell: (policy) => (
          <MasterTableTruncate
            value={policy.entity ? `${policy.entity}${policy.entityType ? ` (${policy.entityType})` : ''}` : '-'}
          />
        ),
      },
      {
        id: 'prefixValue',
        label: 'Prefix',
        type: 'text',
        width: 96,
        minWidth: 88,
        getValue: (policy) => policy.prefixValue,
        renderCell: (policy) => <MasterTableTruncate value={policy.prefixValue || '-'} mono />,
      },
      {
        id: 'seriesType',
        label: 'Series',
        type: 'enum',
        width: 128,
        minWidth: 116,
        getValue: (policy) => policy.seriesType,
        options: SERIES_TYPES.map((value) => ({ value, label: value })),
        renderCell: (policy) => <MasterTablePill label={policy.seriesType || '-'} tone="neutral" />,
      },
      {
        id: 'sampleCode',
        label: 'Sample Code',
        type: 'text',
        width: 168,
        minWidth: 152,
        getValue: (policy) => policy.sampleCode,
        renderCell: (policy) => <MasterTableTruncate value={policy.sampleCode || '-'} mono />,
      },
      {
        id: 'generatedCodeCount',
        label: 'Generated',
        type: 'number',
        width: 124,
        minWidth: 112,
        getValue: (policy) => policy.generatedCodeCount,
        renderCell: (policy) => (
          <MasterTableMetric
            value={policy.usedInCodeGeneration ? policy.generatedCodeCount.toLocaleString() : '0'}
            tone={policy.usedInCodeGeneration && policy.generatedCodeCount > 0 ? 'success' : 'default'}
          />
        ),
      },
      {
        id: 'status',
        label: 'Status',
        type: 'status',
        width: 126,
        minWidth: 112,
        getValue: (policy) => policy.status,
        options: ['Draft', 'Active', 'Inactive'].map((value) => ({ value, label: value })),
        renderCell: (policy) => <MasterTableStatus label={policy.status} tone={getMasterStatusTone(policy.status)} />,
      },
      {
        id: 'health',
        label: 'Health',
        type: 'text',
        width: 144,
        minWidth: 132,
        getValue: (policy) => getPolicyHealth(policy),
        renderCell: (policy) => {
          const health = getPolicyHealth(policy);
          const { icon, label } = getHealthIndicator(health);
          return <MasterTableHealth icon={icon} label={label} tone={getHealthTone(health)} />;
        },
      },
      {
        id: 'actions',
        label: 'Actions',
        type: 'actions',
        width: 88,
        minWidth: 88,
        sortable: false,
        filterable: false,
        groupable: false,
        hideable: false,
        defaultPin: 'right',
        getValue: () => '',
        renderCell: (policy) => {
          const canDelete = policy.status === 'Draft' && !policy.usedInCodeGeneration;
          const canActivate = policy.status === 'Draft';
          const canDeactivate = policy.status === 'Active';

          return (
            <MasterTableRowActions
              rowLabel={policy.policyCode}
              inlineAction={{ label: 'Preview policy', onClick: () => setPreviewPolicy(policy), icon: <Eye size={13} /> }}
              menuActions={[
                { label: 'View details', onSelect: () => openViewForm(policy), icon: <Eye size={13} /> },
                { label: 'Edit policy', onSelect: () => openEditForm(policy), icon: <Edit2 size={13} /> },
                ...(canActivate
                  ? [{ label: 'Activate', onSelect: () => openEditForm(policy), icon: <Check size={13} /> }]
                  : []),
                ...(canDeactivate
                  ? [{
                      label: 'Deactivate',
                      onSelect: () => openDeactivation(policy),
                      icon: <ZapOff size={13} />,
                      tone: 'warning' as const,
                      dividerBefore: true,
                    }]
                  : []),
                ...(canDelete
                  ? [{
                      label: 'Delete',
                      onSelect: () => openDeleteConfirm(policy),
                      icon: <Trash2 size={13} />,
                      tone: 'danger' as const,
                      dividerBefore: !canDeactivate,
                    }]
                  : []),
              ]}
            />
          );
        },
      },
    ];

    return (
      <>
        <AdminListPageShell
          title={master.label}
          primaryAction={{ label: 'New Policy', tone: 'primary', onClick: openAddForm }}
          secondaryActions={[
            {
              label: 'Filters',
              onClick: () => setShowAdvancedFilters(true),
              icon: <Filter size={13} />,
              active: hasAdvancedFilter,
              iconOnly: true,
              title: 'Filters',
            },
          ]}
          helpTopicId="code-generation-policy"
          onHelpClick={(id) => { setHelpTopicId(id); setHelpOpen(true); }}
          searchValue={searchQuery}
          searchPlaceholder="Search code, name, entity..."
          onSearchChange={setSearchQuery}
        >
          <MasterDataTable
            gridId="code-generation-policy-master-table"
            rows={filteredPolicies}
            columns={gridColumns}
            rowId={(policy) => policy.id}
            totalCount={policies.length}
            emptyState={{
              title: policies.length === 0 ? 'No code generation policies yet' : 'No policies match the current filters',
              description: policies.length === 0
                ? 'Create a Code Generation Policy to define how codes and numbers are auto-generated for each entity.'
                : 'Try adjusting your search or filters to find what you are looking for.',
              ...(policies.length === 0 ? { action: { label: 'Create First Policy', onClick: openAddForm } } : {}),
            }}
          />
        </AdminListPageShell>

        <MasterFilterDrawer
          open={showAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
          onReset={() => {
            setFilterAF('');
            setFilterSeries('');
          }}
          description="Filter code generation policies by applicability and series type."
          fields={[
            {
              id: 'code-policy-applicable-for',
              label: 'Applicable For',
              value: filterApplicableFor,
              placeholder: 'All values',
              options: APPLICABLE_FOR_OPTIONS.map((option) => ({ value: option, label: option })),
              onChange: setFilterAF,
            },
            {
              id: 'code-policy-series-type',
              label: 'Series Type',
              value: filterSeriesType,
              placeholder: 'All values',
              options: SERIES_TYPES.map((option) => ({ value: option, label: option })),
              onChange: setFilterSeries,
            },
          ]}
        />
      </>
    );
  };
  // --- Render: form view ------------------------------------------
  const renderFormLegacy = () => {
    const isActiveLockBanner = isActiveLocked && !isViewOnly;
    const isDraft = !editingId || editingPolicy?.status === 'Draft';
    const currentCode = editingPolicy?.policyCode ?? '(New Policy)';
    return (
      <AdminPageShell
        title={currentCode}
        compactHeader
        helpIconOnly
        statusLabel={editingPolicy?.status}
        statusTone={editingPolicy?.status === 'Active' ? 'active' : editingPolicy?.status === 'Draft' ? 'draft' : editingPolicy?.status === 'Inactive' ? 'neutral' : undefined}
        helpTopicId={helpTopicId}
        onHelpClick={(id) => { setHelpTopicId(id); setHelpOpen(true); }}
        primaryAction={!isViewOnly ? (
          (formMode === 'add' || editingPolicy?.status === 'Draft') ? { label: 'Activate', tone: 'primary' as const, onClick: handleActivate } :
          editingPolicy?.status === 'Active' ? { label: 'Save', tone: 'primary' as const, onClick: handleSaveDraft } :
          undefined
        ) : undefined}
        secondaryActions={[
          ...(!isViewOnly && isDraft ? [{ label: 'Save Draft', tone: 'ghost' as const, onClick: handleSaveDraft }] : []),
          ...(!isViewOnly && editingPolicy?.status === 'Active' ? [{ label: 'Deactivate', tone: 'ghost' as const, onClick: () => editingPolicy && openDeactivation(editingPolicy) }] : []),
          { label: 'Policy List', tone: 'ghost' as const, onClick: goBackToList },
        ]}
        toolbar={
          <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
            {CGP_SECTIONS.map((s, i) => {
              const isActive = activeSection === s.key;
              return (
                <button key={s.key} type="button" onClick={() => setActiveSection(s.key)}
                  style={{
                    padding: '6px 16px', fontSize: '13px',
                    fontWeight: isActive ? 600 : 400, border: 'none',
                    borderRight: i < CGP_SECTIONS.length - 1 ? '1px solid var(--color-border)' : 'none',
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
 
        {/* -- Alert banners -- */}
        {(isActiveLockBanner || activationErrors.length > 0) && (
          <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {isActiveLockBanner && (
              <div style={{ padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Lock size={14} style={{ color: '#D97706', marginTop: '1px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#92400E' }}>Generation-critical fields are locked</div>
                  <div style={{ fontSize: '11px', color: '#78350F', marginTop: '2px', lineHeight: 1.4 }}>
                    This policy is Active. Scope, prefix, series, and format fields are read-only. Only <strong>Display Name</strong> and <strong>Description</strong> can be updated.
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


              {/* -- Basic Details -- */}
              {activeSection === 'basic' && (
                <CGPSectionPanel sectionKey="basic" title="Basic Details" form={form}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <FField label="Policy Code">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: '10px' }}>
                        <span style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8', fontWeight: 600, flexShrink: 0 }}>AUTO</span>
                        <span style={{ fontSize: '13px', color: editingPolicy?.policyCode ? 'var(--color-text)' : 'var(--color-text-muted)', fontFamily: editingPolicy?.policyCode ? 'monospace' : undefined }}>
                          {editingPolicy?.policyCode || 'System generated on first save'}
                        </span>
                      </div>
                    </FField>
                    <FField label="Policy Status" required>
                      <FSelect
                        value={form.status}
                        onChange={v => setField('status', v as PolicyStatus)}
                        locked={isLocked('status') || (!isViewOnly && editingPolicy?.status === 'Active')}
                        options={['Draft', 'Active', 'Inactive']}
                        error={fieldErrors.status}
                      />
                      <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                        {form.status === 'Draft' && 'Policy is incomplete. Use Activate to enable it for code generation.'}
                        {form.status === 'Active' && 'Policy is live and used for code generation.'}
                        {form.status === 'Inactive' && 'Policy is disabled. New codes will not be generated.'}
                      </div>
                    </FField>
                    <FField label="Policy Name" required error={fieldErrors.policyName}>
                      <FInput value={form.policyName} onChange={v => setField('policyName', v)} placeholder="e.g. Sales Order Number, Customer Code" maxLength={100} locked={isLocked('policyName')} error={fieldErrors.policyName} />
                    </FField>
                    <FField label="Display Name" required error={fieldErrors.displayName}>
                      <FInput value={form.displayName} onChange={v => setField('displayName', v)} placeholder="e.g. Sales Order Number" maxLength={100} locked={isLocked('displayName')} error={fieldErrors.displayName} />
                    </FField>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <FField label="Description (Optional)">
                        <textarea
                          value={form.description}
                          onChange={e => setField('description', e.target.value)}
                          placeholder="Brief description of this code generation policy…"
                          maxLength={500} rows={3} disabled={isLocked('description')}
                          style={{ ...inputBase, resize: 'none', lineHeight: 1.5, ...(isLocked('description') ? lockedInputStyle : {}) }}
                        />
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', textAlign: 'right' }}>{form.description.length}/500</div>
                      </FField>
                    </div>
                  </div>
                </CGPSectionPanel>
              )}

              {/* -- Applicability -- */}
              {activeSection === 'applicability' && (
                <CGPSectionPanel sectionKey="applicability" title="Applicability" form={form}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <FField label="Applicable For" required error={fieldErrors.applicableFor}>
                      <FSelect value={form.applicableFor} onChange={v => setField('applicableFor', v)} locked={isLocked('applicableFor')} options={APPLICABLE_FOR_OPTIONS as unknown as string[]} error={fieldErrors.applicableFor} />
                    </FField>
                    <FField label="Module" required error={fieldErrors.module}>
                      <FSelect value={form.module} onChange={v => setField('module', v)} locked={isLocked('module')} disabled={!form.applicableFor && !isLocked('module')} options={availableModules} error={fieldErrors.module} placeholder={form.applicableFor ? '— Select Module —' : '— Select Applicable For first —'} />
                    </FField>
                    <FField label="Entity" required error={fieldErrors.entity}>
                      <FSelect value={form.entity} onChange={v => setField('entity', v)} locked={isLocked('entity')} disabled={!form.module && !isLocked('entity')} options={availableEntities} error={fieldErrors.entity} placeholder={form.module ? '— Select Entity —' : '— Select Module first —'} />
                    </FField>
                    <FField label="Entity Type" error={fieldErrors.entityType}>
                      <FSelect value={form.entityType} onChange={v => setField('entityType', v)} locked={isLocked('entityType')} disabled={(!form.entity && !isLocked('entityType')) || !requiresEntityType} options={availableEntityTypes} error={fieldErrors.entityType} placeholder={!requiresEntityType ? '— Not applicable for this Entity —' : '— Select Entity Type (Optional) —'} />
                    </FField>
                  </div>
                </CGPSectionPanel>
              )}

              {/* -- Prefix Selection -- */}
              {activeSection === 'prefix' && (
                <CGPSectionPanel sectionKey="prefix" title="Prefix Selection" form={form}>
                  {(!form.applicableFor || !form.module || !form.entity) && !isLocked('prefixId') ? (
                    <div style={{ padding: '16px', background: 'var(--color-surface-subtle)', border: '1px dashed var(--color-border)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Info size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Complete the <strong>Applicability</strong> section first to see matching prefixes.</span>
                    </div>
                  ) : availablePrefixes.length === 0 && !isLocked('prefixId') ? (
                    <div style={{ padding: '16px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <AlertCircle size={15} style={{ color: '#D97706', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: '#92400E' }}>
                        No active prefixes found for the selected scope ({form.applicableFor} / {form.module} / {form.entity}{form.entityType ? ` / ${form.entityType}` : ''}).
                        {' '}Please create a prefix in Code Prefix Master first.
                      </span>
                    </div>
                  ) : (
                    <div>
                      <FField label="Prefix" required>
                        <FSelect
                          value={form.prefixId}
                          onChange={v => setField('prefixId', v)}
                          locked={isLocked('prefixId')}
                          options={availablePrefixes.map(p => p.id)}
                          displayMap={Object.fromEntries(availablePrefixes.map(p => [p.id, `${p.prefixValue} — ${p.name}`]))}
                          placeholder="— Select Prefix —"
                        />
                      </FField>
                      {form.prefixValue && (
                        <div style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#0369A1', fontWeight: 500 }}>Selected prefix value:</span>
                          <span style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 800, color: '#0369A1', letterSpacing: '0.05em' }}>{form.prefixValue}</span>
                          {availablePrefixes.find(p => p.id === form.prefixId)?.isDefault && (
                            <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: '#0369A1', color: 'white', fontWeight: 600 }}>DEFAULT</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CGPSectionPanel>
              )}


              {/* -- Series & Pattern -- */}
              {activeSection === 'series' && (
                <>
                  <CGPSectionPanel sectionKey="series" title="Series Configuration" form={form}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <FField label="Series Type" required error={fieldErrors.seriesType}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                            {SERIES_TYPES.map(st => {
                              const active = form.seriesType === st;
                              const locked = isLocked('seriesType');
                              return (
                                <button
                                  key={st}
                                  type="button"
                                  disabled={locked}
                                  onClick={() => !locked && setField('seriesType', st)}
                                  style={{
                                    padding: '10px 14px', fontSize: '13px',
                                    fontWeight: active ? 700 : 500,
                                    border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                    borderRadius: '10px',
                                    background: active ? 'var(--color-primary)' : locked ? 'var(--color-surface-subtle)' : 'var(--color-surface)',
                                    color: active ? 'white' : locked ? 'var(--color-text-muted)' : 'var(--color-text)',
                                    cursor: locked ? 'not-allowed' : 'pointer',
                                    textAlign: 'center',
                                    transition: 'all 0.15s',
                                  }}
                                >
                                  {st}
                                </button>
                              );
                            })}
                          </div>
                        </FField>
                        {form.seriesType && (
                          <div style={{ marginTop: '8px', padding: '8px 12px', background: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                              {form.seriesType === 'Continuous' && 'Sequence runs continuously with no reset. Format: PREFIX-SEQ'}
                              {form.seriesType === 'Calendar Year' && 'Resets every calendar year. Format: PREFIX-YYYY/YY-SEQ'}
                              {form.seriesType === 'Financial Year' && 'Resets every financial year. Format: PREFIX-FY-SEQ'}
                              {form.seriesType === 'Monthly' && 'Resets every month. Format: PREFIX-YYYY/YY-MM-SEQ'}
                              {form.seriesType === 'Daily' && 'Resets every day. Format: PREFIX-YYYY/YY-MM-DD-SEQ'}
                              {form.seriesType === 'Custom' && 'Define your own pattern using allowed tokens.'}
                            </span>
                          </div>
                        )}
                      </div>
                      {showCalendarYearFormat && (
                        <FField label="Calendar Year Format" required>
                          <FSelect
                            value={form.calendarYearFormat}
                            onChange={v => setField('calendarYearFormat', v)}
                            locked={isLocked('calendarYearFormat')}
                            options={['YYYY', 'YY']}
                            displayMap={{ 'YYYY': 'YYYY — Full year (e.g. 2026)', 'YY': 'YY — Short year (e.g. 26)' }}
                            placeholder="— Select Year Format —"
                          />
                        </FField>
                      )}
                      {showFinancialYearFormat && (
                        <FField label="Financial Year Format" required>
                          <FSelect
                            value={form.financialYearFormat}
                            onChange={v => setField('financialYearFormat', v)}
                            locked={isLocked('financialYearFormat')}
                            options={['YYYY-YY', 'YY-YY', 'FY-YYYY-YY', 'FY-YY-YY']}
                            displayMap={{ 'YYYY-YY': 'YYYY-YY (e.g. 2026-27)', 'YY-YY': 'YY-YY (e.g. 26-27)', 'FY-YYYY-YY': 'FY-YYYY-YY (e.g. FY-2026-27)', 'FY-YY-YY': 'FY-YY-YY (e.g. FY-26-27)' }}
                            placeholder="— Select FY Format —"
                          />
                        </FField>
                      )}
                      {form.seriesType === 'Custom' && (
                        <FField label="Custom Reset Basis" required>
                          <FSelect
                            value={form.customResetBasis}
                            onChange={v => setField('customResetBasis', v)}
                            locked={isLocked('customResetBasis')}
                            options={['No Reset', 'Calendar Year', 'Financial Year', 'Monthly', 'Daily']}
                            placeholder="— Select Reset Basis —"
                          />
                        </FField>
                      )}
                    </div>
                  </CGPSectionPanel>

                  {/* Pattern Configuration (Custom series only) */}
                  {showCustomSection && (
                    <div style={{ marginTop: '20px' }}>
                      <FormSection label="Pattern Configuration" icon={<Edit2 size={14} />} highlight>
                        <div style={{ marginBottom: '12px', padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', display: 'flex', gap: '8px' }}>
                          <Info size={14} style={{ color: '#D97706', flexShrink: 0, marginTop: '1px' }} />
                          <span style={{ fontSize: '12px', color: '#92400E', lineHeight: 1.5 }}>
                            Use only the allowed tokens below. The <strong>{'{Sequence}'}</strong> token is mandatory.
                            Click a token chip to insert it at the end of the pattern.
                          </span>
                        </div>
                        <FField label="Code Pattern" required>
                          <FInput
                            value={form.codePattern}
                            onChange={v => setField('codePattern', v)}
                            placeholder="e.g. {Prefix}-{Financial Year}-{Sequence}"
                            maxLength={250}
                            locked={isLocked('codePattern')}
                            monospace
                          />
                        </FField>
                        {!isLocked('codePattern') && (
                          <div style={{ marginTop: '12px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                              Available Tokens — click to insert
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {CUSTOM_TOKENS.map(({ token, label, hint }) => {
                                const isInPattern = form.codePattern.includes(token);
                                return (
                                  <button
                                    key={token}
                                    type="button"
                                    title={hint}
                                    onClick={() => setField('codePattern', form.codePattern + token)}
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                                      padding: '5px 10px', fontSize: '12px', fontWeight: 600,
                                      border: `1.5px solid ${isInPattern ? '#2563EB' : 'var(--color-border)'}`,
                                      borderRadius: '8px',
                                      background: isInPattern ? '#EFF6FF' : 'var(--color-surface)',
                                      color: isInPattern ? '#1D4ED8' : 'var(--color-text)',
                                      cursor: 'pointer', transition: 'all 0.1s',
                                      fontFamily: 'monospace',
                                    }}
                                  >
                                    {label}
                                    {token === '{Sequence}' && <span style={{ fontSize: '10px', color: '#DC2626' }}>?</span>}
                                  </button>
                                );
                              })}
                            </div>
                            {form.codePattern && !form.codePattern.includes('{Sequence}') && (
                              <div style={{ marginTop: '8px', fontSize: '12px', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <AlertCircle size={13} />
                                Pattern must include the <strong>{'{Sequence}'}</strong> token.
                              </div>
                            )}
                          </div>
                        )}
                      </FormSection>
                    </div>
                  )}
                </>
              )}

              {/* -- Number Format -- */}
              {activeSection === 'format' && (
                <CGPSectionPanel sectionKey="format" title="Number Format" form={form}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <FField label="Number Length" required error={fieldErrors.numberLength}>
                      <FInput value={form.numberLength} onChange={v => setField('numberLength', v)} placeholder="e.g. 5" type="number" locked={isLocked('numberLength')} error={fieldErrors.numberLength} />
                      <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--color-text-muted)' }}>Digits in the sequence number (1–10). Example: 5 ? 00001</div>
                    </FField>
                    <FField label="Starting Number" required error={fieldErrors.startingNumber}>
                      <FInput value={form.startingNumber} onChange={v => setField('startingNumber', v)} placeholder="e.g. 1" type="number" locked={isLocked('startingNumber')} error={fieldErrors.startingNumber} />
                      <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        First number in the sequence. {isActiveLocked ? 'Locked once Active.' : 'Useful for migration — set to last number + 1.'}
                      </div>
                    </FField>
                    <FField label="Padding Character" required>
                      <FSelect value={form.paddingCharacter} onChange={v => setField('paddingCharacter', v)} locked={isLocked('paddingCharacter')} options={['0', ' ', '_', '*']} displayMap={{ '0': '0 (Zero — recommended)', ' ': 'Space', '_': 'Underscore', '*': 'Asterisk' }} placeholder="— Select Character —" />
                    </FField>
                    <FField label="Alignment Type" required>
                      <FSelect value={form.alignmentType} onChange={v => setField('alignmentType', v)} locked={isLocked('alignmentType')} options={['Right', 'Left']} displayMap={{ 'Right': 'Right — left-pad (e.g. 00031)', 'Left': 'Left — right-pad (e.g. 31000)' }} placeholder="— Select Alignment —" />
                    </FField>
                    <FField label="Separator / Concatenation Character" required>
                      <FSelect value={form.separator} onChange={v => setField('separator', v)} locked={isLocked('separator')} options={['-', '/', '_', 'Blank']} displayMap={{ '-': '- (Hyphen — default)', '/': '/ (Slash)', '_': '_ (Underscore)', 'Blank': 'Blank (No separator)' }} placeholder="— Select Separator —" />
                    </FField>
                    <FField label="Case Format" required>
                      <FSelect value={form.caseFormat} onChange={v => setField('caseFormat', v)} locked={isLocked('caseFormat')} options={['Uppercase', 'Lowercase', 'As Entered']} displayMap={{ 'Uppercase': 'Uppercase (SO, CUST)', 'Lowercase': 'Lowercase (so, cust)', 'As Entered': 'As Entered (keep as-is)' }} placeholder="— Select Case —" />
                    </FField>
                  </div>
                </CGPSectionPanel>
              )}

              {/* -- Usage & History -- */}
              {activeSection === 'history' && (
                <CGPSectionPanel sectionKey="history" title="Usage & History" form={form}>
                  {!editingPolicy ? (
                    <div style={{ padding: '20px 16px', textAlign: 'center', background: 'var(--color-surface-subtle)', border: '1px dashed var(--color-border)', borderRadius: '10px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        Usage history will appear here after the policy is saved and activated.
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <FField label="Used In Code Generation">
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: '10px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: editingPolicy.usedInCodeGeneration ? '#16A34A' : '#94A3B8', flexShrink: 0 }} />
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>{editingPolicy.usedInCodeGeneration ? 'Yes' : 'No'}</span>
                        </div>
                        <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                          {editingPolicy.usedInCodeGeneration ? 'This policy has been used. It cannot be deleted.' : 'Policy has not been used yet. Can be deleted if Draft.'}
                        </div>
                      </FField>
                      <FField label="Generated Code Count">
                        <div style={{ padding: '10px 14px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: '10px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 800, color: 'var(--color-primary)' }}>{editingPolicy.generatedCodeCount.toLocaleString()}</span>
                          <span style={{ marginLeft: '6px', fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500 }}>codes generated</span>
                        </div>
                      </FField>
                      {editingPolicy.status === 'Inactive' && (
                        <>
                          <FField label="Deactivation Reason">
                            <div style={{ padding: '10px 14px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: '10px', fontSize: '13px', color: editingPolicy.deactivationReason ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                              {editingPolicy.deactivationReason || '—'}
                            </div>
                          </FField>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <FField label="Deactivation Remark">
                              <div style={{ padding: '10px 14px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: '10px', fontSize: '13px', color: editingPolicy.deactivationRemark ? 'var(--color-text)' : 'var(--color-text-muted)', lineHeight: 1.5, minHeight: '60px' }}>
                                {editingPolicy.deactivationRemark || '—'}
                              </div>
                            </FField>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </CGPSectionPanel>
              )}

            {/* -- Sticky preview bar -- */}
            {(() => {
              const isValid = sampleCode !== '—' && sampleCode !== 'CONFIGURE-PATTERN';
              return (
                <div style={{ flexShrink: 0, background: isValid ? '#F0FDF4' : 'var(--color-surface)', borderTop: `1.5px solid ${isValid ? '#BBF7D0' : 'var(--color-border)'}`, padding: '0 24px', display: 'flex', alignItems: 'center', gap: '20px', height: '68px', minHeight: '68px' }}>
                  <div style={{ flexShrink: 0 }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: isValid ? '#15803D' : 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>
                      Live Preview
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 900, color: isValid ? '#15803D' : 'var(--color-text-muted)', letterSpacing: '0.04em', lineHeight: 1, whiteSpace: 'nowrap' }}>
                      {sampleCode}
                    </div>
                  </div>
                  {isValid ? (
                    <>
                      <div style={{ width: '1px', height: '36px', background: '#BBF7D0', flexShrink: 0 }} />
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                        {form.prefixValue && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: '#DCFCE7', color: '#15803D', fontWeight: 600 }}>
                            <span style={{ fontWeight: 500, opacity: 0.75 }}>Prefix</span>
                            <span>{form.prefixValue}</span>
                          </span>
                        )}
                        {form.seriesType && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: '#DCFCE7', color: '#15803D', fontWeight: 600 }}>
                            <span style={{ fontWeight: 500, opacity: 0.75 }}>Series</span>
                            <span>{form.seriesType}</span>
                          </span>
                        )}
                        {form.numberLength && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: '#DCFCE7', color: '#15803D', fontWeight: 600 }}>
                            <span style={{ fontWeight: 500, opacity: 0.75 }}>Seq</span>
                            <span>{form.numberLength} digits</span>
                          </span>
                        )}
                        {form.separator && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: '#DCFCE7', color: '#15803D', fontWeight: 600 }}>
                            <span style={{ fontWeight: 500, opacity: 0.75 }}>Sep</span>
                            <span>{form.separator === 'Blank' ? 'none' : `"${form.separator}"`}</span>
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                      {sampleCode === 'CONFIGURE-PATTERN'
                        ? 'Enter a valid Code Pattern with all required tokens.'
                        : 'Configure Prefix and Series Type above to see a live preview.'}
                    </div>
                  )}
                </div>
              );
            })()}

      </AdminPageShell>
    );
  };

  const renderForm = () => (
    <CodeGenerationPolicyFormExperience
      activationErrors={activationErrors}
      activeStepId={activeSection}
      availableEntities={availableEntities}
      availableEntityTypes={availableEntityTypes}
      availableModules={availableModules}
      availablePrefixes={availablePrefixes}
      editingPolicy={editingPolicy}
      fieldErrors={fieldErrors}
      form={form}
      formMode={formMode}
      helpTopicId={helpTopicId}
      isLocked={isLocked}
      onActivate={handleActivate}
      onBackToList={goBackToList}
      onClearActivationErrors={() => setActivationErrors([])}
      onDeactivate={() => {
        if (editingPolicy) {
          openDeactivation(editingPolicy);
        }
      }}
      onHelpClick={(id) => {
        setHelpTopicId(id);
        setHelpOpen(true);
      }}
      onSaveDraft={handleSaveDraft}
      onSetActiveStep={(stepId) => setActiveSection(stepId)}
      onSetField={setField}
      pageTitle={editingPolicy?.policyCode ?? '(New Policy)'}
      requiresEntityType={requiresEntityType}
      sampleCode={sampleCode}
      showCalendarYearFormat={showCalendarYearFormat}
      showCustomSection={showCustomSection}
      showFinancialYearFormat={showFinancialYearFormat}
    />
  );

  // --- Render: preview drawer -------------------------------------
  const renderPreviewDrawer = () => {
    if (!previewPolicy) return null;
    const pp = previewPolicy;
    const canActivate = pp.status === 'Draft';
    const canDeactivate = pp.status === 'Active';
    const canEdit = pp.status !== 'Inactive';
    return (
      <>
        <div style={{ position: 'fixed', inset: 0, zIndex: 400 }} onClick={() => setPreviewPolicy(null)} />
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 401, width: '380px', background: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)', boxShadow: '-8px 0 32px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ flexShrink: 0, padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.03em' }}>{pp.policyCode}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, padding: '2px 9px', borderRadius: '9999px', ...getStatusStyle(pp.status) }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: getStatusDotColor(pp.status) }} />
                {pp.status}
              </span>
            </div>
            <button type="button" onClick={() => setPreviewPolicy(null)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', border: 'none', borderRadius: '6px', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
              <X size={14} />
            </button>
          </div>
          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '3px', lineHeight: 1.3 }}>{pp.policyName}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{pp.displayName}</div>
              {pp.description && <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px', lineHeight: 1.6 }}>{pp.description}</div>}
            </div>
            {/* Sample code */}
            <div style={{ padding: '14px 16px', marginBottom: '18px', borderRadius: '10px', background: pp.status === 'Active' ? '#F0FDF4' : 'var(--color-surface-subtle)', border: `1px solid ${pp.status === 'Active' ? '#BBF7D0' : 'var(--color-border)'}` }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Sample Generated Code</div>
              <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 900, letterSpacing: '0.04em', color: pp.status === 'Active' ? '#15803D' : 'var(--color-text)', lineHeight: 1 }}>{pp.sampleCode}</div>
            </div>
            {/* Applicability */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Applicability</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', ...getApplicableForStyle(pp.applicableFor) }}>{pp.applicableFor}</span>
                {pp.module && <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '6px', background: 'var(--color-surface-subtle)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>{pp.module}</span>}
                {pp.entity && <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '6px', background: 'var(--color-surface-subtle)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>{pp.entity}</span>}
                {pp.entityType && <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '6px', background: 'var(--color-surface-subtle)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>{pp.entityType}</span>}
              </div>
            </div>
            {/* Prefix & Series */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Prefix & Series Pattern</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 800, padding: '4px 12px', borderRadius: '6px', background: '#F0F9FF', color: '#0369A1', letterSpacing: '0.05em' }}>{pp.prefixValue || '—'}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '6px', ...getSeriesTypeStyle() }}>{pp.seriesType || '—'}</span>
              </div>
            </div>
            {/* Usage */}
            <div style={{ padding: '12px 14px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Usage</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 800, color: pp.usedInCodeGeneration ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>{pp.generatedCodeCount.toLocaleString()}</span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>codes generated</span>
              </div>
            </div>
            {/* Deactivation info */}
            {pp.status === 'Inactive' && pp.deactivationReason && (
              <div style={{ marginTop: '16px', padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Deactivation Reason</div>
                <div style={{ fontSize: '12px', color: '#DC2626' }}>{pp.deactivationReason}</div>
                {pp.deactivationRemark && <div style={{ fontSize: '12px', color: '#9B1C1C', marginTop: '4px', lineHeight: 1.5 }}>{pp.deactivationRemark}</div>}
              </div>
            )}
          </div>
          {/* Footer: actions */}
          {canEdit && (
            <div style={{ flexShrink: 0, borderTop: '1px solid var(--color-border)', padding: '12px 20px', display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => { openEditForm(pp); setPreviewPolicy(null); }} style={{ ...btnOutline, flex: 1, justifyContent: 'center' }}>
                <Edit2 size={12} /> Edit
              </button>
              {canActivate && (
                <button type="button" onClick={() => { openEditForm(pp); setPreviewPolicy(null); }} style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }}>
                  <Check size={12} /> Activate
                </button>
              )}
              {canDeactivate && (
                <button type="button" onClick={() => { openDeactivation(pp); setPreviewPolicy(null); }} style={{ ...btnBase, flex: 1, justifyContent: 'center', border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626' }}>
                  <ZapOff size={12} /> Deactivate
                </button>
              )}
            </div>
          )}
        </div>
      </>
    );
  };

  // --- Render: deactivation modal ---------------------------------
  const renderDeactivationModal = () => {
    if (!deactivationOpen || !deactivationTarget) return null;
    return (
      <div style={MASTER_OVERLAY_STYLE}>
        <div onClick={() => setDeactivationOpen(false)} style={{ position: 'absolute', inset: 0 }} />
        <div style={{ ...MASTER_POPUP_SURFACE_STYLE, position: 'relative', width: '520px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '18px 20px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>Deactivate Policy</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                {deactivationTarget.policyCode} — {deactivationTarget.policyName}
              </div>
            </div>
            <button type="button" onClick={() => setDeactivationOpen(false)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: 'none', borderRadius: '8px', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {/* Warning */}
            <div style={{ marginBottom: '20px', padding: '14px 16px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '10px', display: 'flex', gap: '10px' }}>
              <AlertCircle size={16} style={{ color: '#D97706', flexShrink: 0, marginTop: '1px' }} />
              <div style={{ fontSize: '13px', color: '#92400E', lineHeight: 1.5 }}>
                After deactivation, new codes will <strong>not</strong> be generated using this policy.
                Please ensure another active Code Generation Policy exists if this entity still requires code generation.
              </div>
            </div>

            <DField label="Deactivation Reason" required mt={false}>
              <div style={{ position: 'relative' }}>
                <select
                  value={deactivationReason}
                  onChange={e => { setDeactivationReason(e.target.value); setDeactivationReasonErr(''); }}
                  style={{ ...drawerInputBase, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', paddingRight: '38px', borderColor: deactivationReasonErr ? '#DC2626' : undefined }}
                >
                  <option value="">— Select Reason —</option>
                  {DEACTIVATION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <svg style={{ position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)' }} width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              {deactivationReasonErr && <div style={{ marginTop: '4px', fontSize: '12px', color: '#DC2626' }}>{deactivationReasonErr}</div>}
            </DField>

            <DField label="Deactivation Remark (Optional)" mt>
              <textarea
                value={deactivationRemark}
                onChange={e => setDeactivationRemark(e.target.value)}
                placeholder="Optional notes about why this policy is being deactivated…"
                rows={3}
                maxLength={500}
                style={{ ...drawerInputBase, resize: 'none', lineHeight: 1.5 }}
              />
            </DField>
          </div>

          {/* Footer */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setDeactivationOpen(false)} style={btnOutline}>
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDeactivation}
              style={{ ...btnBase, background: '#DC2626', border: '1px solid #DC2626', color: 'white', fontWeight: 600 }}
            >
              <ZapOff size={13} />
              Deactivate Policy
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- Render: delete confirm -------------------------------------
  const renderDeleteConfirm = () => {
    if (!deleteConfirmOpen || !deleteTarget) return null;
    const canDelete = deleteTarget.status === 'Draft' && !deleteTarget.usedInCodeGeneration;
    return (
      <div style={MASTER_OVERLAY_STYLE}>
        <div onClick={() => setDeleteConfirmOpen(false)} style={{ position: 'absolute', inset: 0 }} />
        <div style={{ ...MASTER_POPUP_SURFACE_STYLE, position: 'relative', width: '440px', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>Delete Policy</div>
            <button type="button" onClick={() => setDeleteConfirmOpen(false)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: 'none', borderRadius: '8px', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ padding: '20px' }}>
            {canDelete ? (
              <div style={{ fontSize: '13px', color: 'var(--color-text)', lineHeight: 1.6 }}>
                Are you sure you want to permanently delete{' '}
                <strong style={{ fontFamily: 'monospace' }}>{deleteTarget.policyCode}</strong> — {deleteTarget.policyName}?
                {' '}This action cannot be undone.
              </div>
            ) : (
              <div style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', fontSize: '13px', color: '#991B1B', lineHeight: 1.5 }}>
                <strong>Cannot delete this policy.</strong>
                <br />
                {deleteTarget.status !== 'Draft'
                  ? `Policy is currently ${deleteTarget.status}. Only Draft policies can be deleted.`
                  : 'This policy has been used for code generation and cannot be deleted.'}
              </div>
            )}
          </div>
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setDeleteConfirmOpen(false)} style={btnOutline}>
              {canDelete ? 'Cancel' : 'Close'}
            </button>
            {canDelete && (
              <button type="button" onClick={confirmDelete} style={{ ...btnBase, background: '#DC2626', border: '1px solid #DC2626', color: 'white', fontWeight: 600 }}>
                <Trash2 size={13} />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- Render: activate confirm -----------------------------------
  const renderActivateConfirm = () => {
    if (!activateConfirmOpen) return null;
    return (
      <div style={MASTER_OVERLAY_STYLE}>
        <div onClick={() => setActivateConfirmOpen(false)} style={{ position: 'absolute', inset: 0 }} />
        <div style={{ ...MASTER_POPUP_SURFACE_STYLE, position: 'relative', width: '460px', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>Activate Policy</div>
            <button type="button" onClick={() => setActivateConfirmOpen(false)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: 'none', borderRadius: '8px', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px', padding: '12px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', display: 'flex', gap: '8px' }}>
              <Check size={15} style={{ color: '#15803D', flexShrink: 0, marginTop: '1px' }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#14532D' }}>All validation checks passed</div>
                <div style={{ fontSize: '12px', color: '#374151', marginTop: '4px' }}>Sample code: <strong style={{ fontFamily: 'monospace', color: '#15803D' }}>{sampleCode}</strong></div>
              </div>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text)', lineHeight: 1.6 }}>
              Once activated, generation-critical fields will be locked.
              This policy will be used for code generation. Are you sure you want to activate this policy?
            </div>
          </div>
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setActivateConfirmOpen(false)} style={btnOutline}>Cancel</button>
            <button type="button" onClick={confirmActivate} style={btnPrimary}>
              <Check size={13} />
              Activate Policy
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminShell>
      <CodeGenerationPolicyUndoToast onDismiss={dismissToast} toast={toast} />
      {viewMode === 'list' ? renderList() : renderForm()}
      {renderPreviewDrawer()}
      {renderDeactivationModal()}
      {renderDeleteConfirm()}
      {renderActivateConfirm()}
      {cgpHelpTopic && (
        <HelpDrawer open={helpOpen} topic={cgpHelpTopic} onClose={() => setHelpOpen(false)} onTopicChange={(id) => setHelpTopicId(id)} />
      )}
    </AdminShell>
  );
};

export default CodeGenerationPolicyPage;

// --- Module-scope helper components ------------------------------------------

// Shared button style objects
const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '5px',
  padding: '6px 14px', borderRadius: '8px',
  fontSize: '12px', fontWeight: 500, cursor: 'pointer',
  whiteSpace: 'nowrap', transition: 'opacity 0.15s', border: 'none',
};
const btnOutline: React.CSSProperties = {
  ...btnBase, background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)',
};
const btnPrimary: React.CSSProperties = {
  ...btnBase, background: 'var(--color-primary)', border: '1px solid var(--color-primary)', color: 'white', fontWeight: 600,
};

// Form input base style
const inputBase: React.CSSProperties = {
  width: '100%', padding: '10px 14px', fontSize: '13px',
  border: '1px solid var(--color-border)', borderRadius: '10px',
  background: 'var(--color-surface)', color: 'var(--color-text)',
  outline: 'none', boxSizing: 'border-box',
};

const lockedInputStyle: React.CSSProperties = {
  background: 'var(--color-surface-subtle)',
  color: 'var(--color-text)',
  cursor: 'not-allowed',
};

// Drawer-style input base (for modals)
const drawerInputBase: React.CSSProperties = {
  width: '100%', padding: '11px 14px', fontSize: '14px',
  border: '1px solid var(--color-border)', borderRadius: '10px',
  background: 'var(--color-surface)', color: 'var(--color-text)',
  outline: 'none', boxSizing: 'border-box',
};

// --- FormSection --------------------------------------------------------------

interface FormSectionProps {
  label: string;
  icon?: React.ReactNode;
  highlight?: boolean;
  children: React.ReactNode;
}
const FormSection: React.FC<FormSectionProps> = ({ label, icon, highlight, children }) => (
  <div style={{
    background: 'var(--color-surface)',
    border: `1px solid ${highlight ? '#C4B5FD' : 'var(--color-border)'}`,
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '16px',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '12px 20px',
      borderBottom: '1px solid var(--color-border)',
      background: highlight ? '#F5F3FF' : 'var(--color-surface-subtle)',
    }}>
      {icon && <span style={{ color: highlight ? '#6D28D9' : 'var(--color-text-muted)', flexShrink: 0 }}>{icon}</span>}
      <span style={{ fontSize: '13px', fontWeight: 700, color: highlight ? '#5B21B6' : 'var(--color-text)', letterSpacing: '-0.01em' }}>{label}</span>
    </div>
    <div style={{ padding: '20px' }}>{children}</div>
  </div>
);

// --- CGPSectionPanel ----------------------------------------------------------

interface CGPSectionPanelProps {
  sectionKey: CGPSectionKey;
  title: string;
  form: PolicyFormData;
  highlight?: boolean;
  children: React.ReactNode;
}
const CGPSectionPanel: React.FC<CGPSectionPanelProps> = ({ sectionKey, title, form, highlight, children }) => {
  const completion = getCGPSectionCompletion(sectionKey, form);
  const allFields = CGP_SECTION_FIELDS[sectionKey];
  const totalFields = allFields.length;
  const filledFields = allFields.filter((f) => !!form[f as keyof PolicyFormData]).length;

  const badge =
    completion === 'complete'
      ? { label: 'Complete', color: '#15803D', dot: '#16A34A' }
      : completion === 'partial'
      ? { label: 'In progress', color: '#1D4ED8', dot: '#3B82F6' }
      : { label: 'Not started', color: '#94A3B8', dot: '#CBD5E1' };

  return (
    <div style={{ background: 'var(--color-surface)', border: `1px solid ${highlight ? '#C4B5FD' : 'var(--color-border)'}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 20px', background: highlight ? '#F5F3FF' : 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: highlight ? '#6D28D9' : 'var(--color-text)' }}>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {totalFields > 0 && (
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{filledFields} / {totalFields} filled</span>
          )}
          {totalFields > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 500, color: badge.color }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: badge.dot, flexShrink: 0 }} />
              {badge.label}
            </span>
          )}
        </div>
      </div>
      <div style={{ padding: '24px 20px' }}>{children}</div>
    </div>
  );
};

// --- FField -------------------------------------------------------------------

interface FFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}
const FField: React.FC<FFieldProps> = ({ label, required, error, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px', lineHeight: 1 }}>
      {label}{required && <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>}
    </label>
    {children}
    {error && <div style={{ marginTop: '4px', fontSize: '11px', color: '#DC2626' }}>{error}</div>}
  </div>
);

// --- FInput -------------------------------------------------------------------

interface FInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  locked?: boolean;
  error?: string;
  monospace?: boolean;
}
const FInput: React.FC<FInputProps> = ({ value, onChange, placeholder, type = 'text', maxLength, locked, error, monospace }) => (
  <input
    type={type}
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    maxLength={maxLength}
    disabled={locked}
    style={{
      ...inputBase,
      ...(locked ? lockedInputStyle : {}),
      ...(error ? { borderColor: '#DC2626' } : {}),
      ...(monospace ? { fontFamily: 'monospace', letterSpacing: '0.02em' } : {}),
    }}
  />
);

// --- FSelect -----------------------------------------------------------------

interface FSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  displayMap?: Record<string, string>;
  locked?: boolean;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
}
const FSelect: React.FC<FSelectProps> = ({ value, onChange, options, displayMap, locked, disabled, error, placeholder }) => (
  <div style={{ position: 'relative' }}>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={locked || disabled}
      style={{
        ...inputBase,
        paddingRight: '36px',
        cursor: locked || disabled ? 'not-allowed' : 'pointer',
        appearance: 'none',
        WebkitAppearance: 'none',
        ...(locked || disabled ? lockedInputStyle : {}),
        ...(error ? { borderColor: '#DC2626' } : {}),
      }}
    >
      <option value="">{placeholder ?? '— Select —'}</option>
      {options.map(o => (
        <option key={o} value={o}>{displayMap?.[o] ?? o}</option>
      ))}
    </select>
    {!locked && !disabled && (
      <svg style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)' }} width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M3.5 5.5l3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
  </div>
);

// --- DField ------------------------------------------------------------------

interface DFieldProps { label: string; required?: boolean; mt?: boolean; children: React.ReactNode; }
const DField: React.FC<DFieldProps> = ({ label, required, mt, children }) => (
  <div style={{ marginTop: mt ? '16px' : undefined }}>
    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
      {label}{required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
    </label>
    {children}
  </div>
);




