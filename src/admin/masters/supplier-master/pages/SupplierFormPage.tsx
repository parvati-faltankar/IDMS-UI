import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, ChevronRight, Info, Trash2 } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import AppDialog from '../../../../components/app/AppDialog';
import { SmartFormDrawer } from '../../../../experience/components/SmartFormDrawer';
import { SmartReviewDrawer } from '../../../../experience/components/SmartReviewDrawer';
import { HelpDrawer } from '../../../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../../../experience/help/helpTopics';
import { findGroupForMasterKey, findMasterByKey } from '../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../adminStorage';
import type {
  BusinessPartner,
  BPType,
  BPCategory,
  BusinessType,
  IndustryType,
  NoOfEmployeesRange,
  ContactType,
  AddressType,
  AccountType,
  SettlementType,
  PaymentMode,
  MaxQtyScope,
  ComplianceDocType,
  BPContact,
  BPAddress,
  BPOrgMapping,
  BPComplianceDocument,
  BPBankDetail,
  BPItemMapping,
  BPTransporterConfig,
  BPInsuranceConfig,
  BPFinancierConfig,
} from '../types/supplierMaster.types';
import { TransporterConfigStep } from '../components/steps/TransporterConfigStep';
import { InsuranceConfigStep } from '../components/steps/InsuranceConfigStep';
import { FinancierConfigStep } from '../components/steps/FinancierConfigStep';
import { supplierService } from '../services/supplierService';
import {
  BP_TYPES,
  BP_CATEGORIES,
  BUSINESS_TYPES,
  INDUSTRY_TYPES,
  NO_OF_EMPLOYEES_RANGES,
  CONTACT_TYPES,
  ADDRESS_TYPES,
  ACCOUNT_TYPES,
  SETTLEMENT_TYPES,
  PAYMENT_MODES,
  MAX_QTY_SCOPES,
  COMPLIANCE_DOC_TYPES,
  COUNTRY_CODES,
  COUNTRIES,
  CURRENCIES,
  FINANCIAL_YEARS,
  ORDER_UOMS,
  MOCK_ORGANISATIONS,
  MOCK_ITEMS,
  ITEM_CATEGORIES,
  BP_TYPE_TAB_APPLICABILITY,
  EMPTY_TRANSPORTER_CONFIG,
  EMPTY_INSURANCE_CONFIG,
  EMPTY_FINANCIER_CONFIG,
} from '../constants/supplierMaster.constants';
import { validateBPForSave, validateBPForActivation, type BPFieldErrors } from '../utils/supplierValidation';
import { validateContact, type ContactFieldErrors } from '../utils/contactValidation';
import { validateAddress, type AddressFieldErrors } from '../utils/addressValidation';
import { validateBankDetail, type BankFieldErrors } from '../utils/bankValidation';

// ─── Step definitions ─────────────────────────────────────────────────────────

const BASE_STEPS = [
  { index: 0, label: 'General Details',      tabNum: 1 },
  { index: 1, label: 'Contacts',             tabNum: 2 },
  { index: 2, label: 'Address Details',      tabNum: 3 },
  { index: 3, label: 'Organisation Mapping', tabNum: 4 },
  { index: 4, label: 'Tax & Compliance',     tabNum: 5 },
  { index: 5, label: 'Bank & Payment',       tabNum: 6 },
  { index: 6, label: 'Item Mapping',         tabNum: 7 },
];

// ─── Form state ───────────────────────────────────────────────────────────────

interface CoreForm {
  bpCode: string;
  bpLegalName: string;
  bpType: BPType | '';
  marketingName: string;
  displayName: string;
  bpCategory: BPCategory | '';
  countryOfRegistration: string;
  businessType: BusinessType | '';
  industryType: IndustryType | '';
  noOfEmployees: NoOfEmployeesRange | '';
  foundingDate: string;
  websiteUrl: string;
  annualTurnover: string;
  annualRevenue: string;
  financialYear: string;
  financialCurrency: string;
  effectiveFromDate: string;
  effectiveToDate: string;
  description: string;
  taxRegistered: boolean;
  taxJurisdiction: string;
  advanceAllowed: boolean;
  advancePercentage: string;
  settlementType: SettlementType | '';
  paymentMode: PaymentMode | '';
  creditDays: string;
  creditLimit: string;
  creditLimitCurrency: string;
}

const EMPTY_CORE: CoreForm = {
  bpCode: '', bpLegalName: '', bpType: '', marketingName: '', displayName: '',
  bpCategory: '', countryOfRegistration: '', businessType: '', industryType: '',
  noOfEmployees: '', foundingDate: '', websiteUrl: '', annualTurnover: '',
  annualRevenue: '', financialYear: '2025–26', financialCurrency: 'INR',
  effectiveFromDate: '', effectiveToDate: '', description: '',
  taxRegistered: false, taxJurisdiction: '',
  advanceAllowed: false, advancePercentage: '', settlementType: '',
  paymentMode: 'NEFT', creditDays: '30', creditLimit: '', creditLimitCurrency: 'INR',
};

function bpToForm(bp: BusinessPartner): CoreForm {
  return {
    bpCode: bp.bpCode, bpLegalName: bp.bpLegalName, bpType: bp.bpType,
    marketingName: bp.marketingName, displayName: bp.displayName,
    bpCategory: bp.bpCategory, countryOfRegistration: bp.countryOfRegistration,
    businessType: bp.businessType, industryType: bp.industryType,
    noOfEmployees: bp.noOfEmployees, foundingDate: bp.foundingDate,
    websiteUrl: bp.websiteUrl, annualTurnover: bp.annualTurnover,
    annualRevenue: bp.annualRevenue, financialYear: bp.financialYear,
    financialCurrency: bp.financialCurrency, effectiveFromDate: bp.effectiveFromDate,
    effectiveToDate: bp.effectiveToDate, description: bp.description,
    taxRegistered: bp.taxRegistered, taxJurisdiction: bp.taxJurisdiction,
    advanceAllowed: bp.paymentTerms.advanceAllowed,
    advancePercentage: String(bp.paymentTerms.advancePercentage || ''),
    settlementType: bp.paymentTerms.settlementType,
    paymentMode: bp.paymentTerms.paymentMode,
    creditDays: String(bp.paymentTerms.creditDays || ''),
    creditLimit: String(bp.paymentTerms.creditLimit || ''),
    creditLimitCurrency: bp.paymentTerms.creditLimitCurrency,
  };
}

// ─── Style constants ──────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: '13px',
  border: '1px solid var(--color-border)', borderRadius: '8px',
  background: 'var(--color-surface)', color: 'var(--color-text)',
  outline: 'none', boxSizing: 'border-box',
};
const inputError: React.CSSProperties = { ...inputBase, border: '1px solid #FCA5A5' };
const labelBase: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: '6px' };
const labelMuted: React.CSSProperties = { fontSize: '11px', fontWeight: 500, color: 'var(--color-text-muted)', display: 'block', marginBottom: '5px' };
const fieldErrTxt: React.CSSProperties = { fontSize: '11px', color: '#DC2626', marginTop: '4px' };
const btnBase: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', cursor: 'pointer', border: 'none' };
const btnPrimary: React.CSSProperties = { ...btnBase, background: 'var(--color-primary)', color: 'white' };
const btnOutline: React.CSSProperties = { ...btnBase, fontWeight: 500, background: 'transparent', color: 'var(--color-text)', border: '1px solid var(--color-border)' };
const sectionCard: React.CSSProperties = { border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' };
const sCardHead: React.CSSProperties = { padding: '12px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const sCardBody: React.CSSProperties = { padding: '20px 24px', background: 'var(--color-surface)' };
const twoCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const threeCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' };
const fw: React.CSSProperties = { marginBottom: '14px' };

// ─── Sub-entity helpers ───────────────────────────────────────────────────────

function subTableHead(cols: string[]): React.ReactNode {
  return (
    <div style={{ display: 'flex', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', padding: '0 14px', height: '34px', alignItems: 'center', gap: '8px' }}>
      {cols.map((c) => (
        <div key={c} style={{ flex: 1, fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c}</div>
      ))}
      <div style={{ width: '64px', flexShrink: 0 }} />
    </div>
  );
}

const SUB_ROW_STYLE: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '0 14px', height: '42px', borderBottom: '1px solid var(--color-border)', transition: 'background 0.1s' };

const STATUS_PILL = (status: string) => ({
  display: 'inline-flex', alignItems: 'center', padding: '2px 8px', fontSize: '10px', fontWeight: 600,
  borderRadius: '9999px', background: status === 'Active' ? '#DCFCE7' : '#F1F5F9',
  color: status === 'Active' ? '#15803D' : '#64748B',
});

function SubRowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div style={{ width: '64px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
      <button type="button" onClick={onEdit} title="Edit"
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button type="button" onClick={onDelete} title="Remove"
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #FCA5A5', background: '#FEF2F2', cursor: 'pointer', color: '#DC2626' }}>
        <Trash2 size={11} />
      </button>
    </div>
  );
}

// ─── FORM_MASTER_KEY ──────────────────────────────────────────────────────────

const FORM_MASTER_KEY = 'supplier-master';

// ─── Component ────────────────────────────────────────────────────────────────

const SupplierFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNew = !id;
  const typeFromUrl = isNew ? (searchParams.get('type') as BPType | null) : null;

  // ── Core data ─────────────────────────────────────────────────────────
  const [existing, setExisting]   = useState<BusinessPartner | null>(null);
  const [notFound, setNotFound]   = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  // ── Core form ─────────────────────────────────────────────────────────
  const [form, setForm] = useState<CoreForm>(() => ({
    ...EMPTY_CORE,
    ...(typeFromUrl ? { bpType: typeFromUrl } : {}),
  }));
  const [fieldErrors, setFieldErrors] = useState<BPFieldErrors>({});

  // ── Sub-entity arrays ─────────────────────────────────────────────────
  const [contacts,         setContacts]         = useState<BPContact[]>([]);
  const [addresses,        setAddresses]        = useState<BPAddress[]>([]);
  const [orgMappings,      setOrgMappings]      = useState<BPOrgMapping[]>([]);
  const [complianceDocs,   setComplianceDocs]   = useState<BPComplianceDocument[]>([]);
  const [bankDetails,      setBankDetails]      = useState<BPBankDetail[]>([]);
  const [itemMappings,     setItemMappings]     = useState<BPItemMapping[]>([]);
  const [transporterConfig, setTransporterConfig] = useState<BPTransporterConfig>(EMPTY_TRANSPORTER_CONFIG);
  const [insuranceConfig,   setInsuranceConfig]   = useState<BPInsuranceConfig>(EMPTY_INSURANCE_CONFIG);
  const [financierConfig,   setFinancierConfig]   = useState<BPFinancierConfig>(EMPTY_FINANCIER_CONFIG);

  // ── Contact drawer ────────────────────────────────────────────────────
  const [contactOpen, setContactOpen]         = useState(false);
  const [contactEditId, setContactEditId]     = useState<string | null>(null);
  const [contactForm, setContactForm]         = useState({ contactType: '' as ContactType | '', contactName: '', department: '', designation: '', countryCode: '+91', phone: '', email: '', fax: '', status: 'Active' as 'Active' | 'Inactive' });
  const [contactErrors, setContactErrors]     = useState<ContactFieldErrors>({});

  // ── Address drawer ────────────────────────────────────────────────────
  const [addressOpen, setAddressOpen]         = useState(false);
  const [addressEditId, setAddressEditId]     = useState<string | null>(null);
  const [addressForm, setAddressForm]         = useState({ addressType: '' as AddressType | '', addressLine1: '', addressLine2: '', country: 'India', state: '', city: '', pin: '', latitude: '', longitude: '', isDefault: false, status: 'Active' as 'Active' | 'Inactive' });
  const [addressErrors, setAddressErrors]     = useState<AddressFieldErrors>({});

  // ── Org Mapping drawer ────────────────────────────────────────────────
  const [orgOpen, setOrgOpen]                 = useState(false);
  const [orgEditId, setOrgEditId]             = useState<string | null>(null);
  const [orgForm, setOrgForm]                 = useState({ applyToAll: false, organisationId: '', effectiveDate: '', expirationDate: '', status: 'Active' as 'Active' | 'Inactive' });

  // ── Compliance doc drawer ─────────────────────────────────────────────
  const [docOpen, setDocOpen]                 = useState(false);
  const [docEditId, setDocEditId]             = useState<string | null>(null);
  const [docForm, setDocForm]                 = useState({ documentType: '' as ComplianceDocType | '', documentNumber: '', issueDate: '', expiryDate: '', allowTransactionAfterExpiry: false, attachmentName: '', status: 'Active' as 'Active' | 'Inactive' });

  // ── Bank drawer ───────────────────────────────────────────────────────
  const [bankOpen, setBankOpen]               = useState(false);
  const [bankEditId, setBankEditId]           = useState<string | null>(null);
  const [bankForm, setBankForm]               = useState({ bankCode: '', bankName: '', branchName: '', accountHolderName: '', accountNumber: '', accountType: '' as AccountType | '', defaultCurrency: 'INR', isDefaultAccount: false, status: 'Active' as 'Active' | 'Inactive', addrLine1: '', addrLine2: '', addrCountry: 'India', addrState: '', addrCity: '', addrPin: '' });
  const [bankErrors, setBankErrors]           = useState<BankFieldErrors>({});

  // ── Item Selector (bulk add) ──────────────────────────────────────────────
  const [itemSelectorOpen,     setItemSelectorOpen]     = useState(false);
  const [itemSelectorSearch,   setItemSelectorSearch]   = useState('');
  const [itemSelectorCategory, setItemSelectorCategory] = useState('');
  const [itemSelectorSelected, setItemSelectorSelected] = useState<string[]>([]);
  const [itemSelectorDefaults, setItemSelectorDefaults] = useState({
    orderUom: '', orderMultiple: '', minOrderQty: '0', maxOrderQty: '0',
    maxQtyScope: 'Per Order' as MaxQtyScope,
    stdLeadTimeDays: '7', minLeadTimeDays: '0', maxLeadTimeDays: '0',
    isReturnable: false, effectiveFromDate: '', effectiveToDate: '',
  });
  const [inlineEditCell, setInlineEditCell]             = useState<{ id: string; field: string } | null>(null);

  // ── Lifecycle drawers ─────────────────────────────────────────────────
  const [activateOpen, setActivateOpen]         = useState(false);
  const [activationIssues, setActivationIssues] = useState<string[]>([]);
  const [inactivateOpen, setInactivateOpen]     = useState(false);
  const [inactivateReason, setInactivateReason] = useState('');
  const [deleteOpen, setDeleteOpen]             = useState(false);
  const [helpOpen, setHelpOpen]                 = useState(false);

  // ── Toast ─────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  function showToast(msg: string, tone: 'success' | 'error') {
    setToast({ message: msg, tone });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Load ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isNew && id) {
      const found = supplierService.getById(id);
      if (!found) { setNotFound(true); return; }
      setExisting(found);
      setForm(bpToForm(found));
      setContacts([...found.contacts]);
      setAddresses([...found.addresses]);
      setOrgMappings([...found.orgMappings]);
      setComplianceDocs([...found.complianceDocuments]);
      setBankDetails([...found.bankDetails]);
      setItemMappings([...found.itemMappings]);
      setTransporterConfig(found.transporterConfig ?? EMPTY_TRANSPORTER_CONFIG);
    }
    const master = findMasterByKey(FORM_MASTER_KEY);
    const group  = findGroupForMasterKey(FORM_MASTER_KEY);
    if (master && group) {
      recordRecentAdminMaster({ key: master.key, label: master.label, path: master.path, groupLabel: group.label, groupIconBg: group.iconBg, groupIconColor: group.iconColor });
    }
  }, [id, isNew]);

  // ── Derived ───────────────────────────────────────────────────────────
  const status = existing?.status ?? 'Draft';
  const isActive   = status === 'Active';
  const isInactive = !isNew && status === 'Inactive';
  const isViewOnly = isInactive;
  const canDel     = !isNew && status === 'Draft';

  const applicableTabs: number[] = useMemo(() => {
    if (!form.bpType) return [1, 2, 3, 4, 5, 6, 7];
    return BP_TYPE_TAB_APPLICABILITY[form.bpType] ?? [1, 2, 3, 4, 5, 6, 7];
  }, [form.bpType]);

  // Dynamic steps — add Transporter Configuration step for Transporter type
  const steps = useMemo(() => {
    if (form.bpType === 'Transporter') {
      return [...BASE_STEPS, { index: 7, label: 'Transporter Configuration', tabNum: 8 }];
    }
    if (form.bpType === 'Insurance Provider') {
      return [...BASE_STEPS, { index: 7, label: 'Insurance Configuration', tabNum: 8 }];
    }
    if (form.bpType === 'Financier') {
      return [...BASE_STEPS, { index: 7, label: 'Financier Configuration', tabNum: 8 }];
    }
    return BASE_STEPS;
  }, [form.bpType]);

  // Is a given step (0-indexed) "complete" (has meaningful data)?
  function stepHasData(i: number): boolean {
    if (i === 0) return !!form.bpLegalName.trim();
    if (i === 1) return contacts.length > 0;
    if (i === 2) return addresses.length > 0;
    if (i === 3) return orgMappings.length > 0;
    if (i === 4) return form.taxRegistered || complianceDocs.length > 0;
    if (i === 5) return bankDetails.length > 0 || !!form.settlementType;
    if (i === 6) return itemMappings.length > 0;
    if (i === 7) {
      if (form.bpType === 'Transporter') return !!transporterConfig.standardTransitTime || transporterConfig.transportModes.length > 0 || transporterConfig.vehicleCapabilities.length > 0;
      if (form.bpType === 'Insurance Provider') return !!insuranceConfig.insuranceProviderType || insuranceConfig.supportedInsuranceLines.length > 0;
      if (form.bpType === 'Financier') return !!financierConfig.financierType || financierConfig.supportedBusiness.length > 0;
    }
    return false;
  }

  function getStepCount(i: number): number {
    if (i === 1) return contacts.length;
    if (i === 2) return addresses.length;
    if (i === 3) return orgMappings.length;
    if (i === 4) return complianceDocs.length;
    if (i === 5) return bankDetails.length;
    if (i === 6) return itemMappings.length;
    if (i === 7) {
      if (form.bpType === 'Transporter') return transporterConfig.routeCapabilities.length;
      if (form.bpType === 'Insurance Provider') return insuranceConfig.branches.length;
      if (form.bpType === 'Financier') return financierConfig.branches.length;
    }
    return 0;
  }

  // ── Field helpers ─────────────────────────────────────────────────────
  function setField<K extends keyof CoreForm>(k: K, v: CoreForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setFieldErrors((e) => ({ ...e, [k]: undefined }));
  }

  // ── Build full BP from state ──────────────────────────────────────────
  function buildBP(): Omit<BusinessPartner, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      bpCode: form.bpCode || (existing?.bpCode ?? supplierService.generateCode()),
      bpLegalName: form.bpLegalName.trim(),
      bpType: (form.bpType as BPType) || 'Supplier',
      marketingName: form.marketingName.trim(),
      displayName: form.displayName.trim(),
      bpCategory: (form.bpCategory as BPCategory) || 'Other',
      countryOfRegistration: form.countryOfRegistration,
      businessType: (form.businessType as BusinessType) || 'Other',
      industryType: (form.industryType as IndustryType) || 'Other',
      noOfEmployees: (form.noOfEmployees as NoOfEmployeesRange) || '1–10',
      foundingDate: form.foundingDate,
      websiteUrl: form.websiteUrl,
      annualTurnover: form.annualTurnover,
      annualRevenue: form.annualRevenue,
      financialYear: form.financialYear,
      financialCurrency: form.financialCurrency,
      effectiveFromDate: form.effectiveFromDate,
      effectiveToDate: form.effectiveToDate,
      description: form.description,
      status: (existing?.status ?? 'Draft'),
      contacts,
      addresses,
      orgMappings,
      taxRegistered: form.taxRegistered,
      taxJurisdiction: form.taxJurisdiction,
      complianceDocuments: complianceDocs,
      bankDetails,
      paymentTerms: {
        advanceAllowed: form.advanceAllowed,
        advancePercentage: parseFloat(form.advancePercentage || '0') || 0,
        settlementType: (form.settlementType as SettlementType) || 'Full Settlement',
        paymentMode: (form.paymentMode as PaymentMode) || 'NEFT',
        creditDays: parseInt(form.creditDays || '0', 10) || 0,
        creditLimit: parseInt(form.creditLimit || '0', 10) || 0,
        creditLimitCurrency: form.creditLimitCurrency || 'INR',
      },
      itemMappings,
      transporterConfig: form.bpType === 'Transporter' ? transporterConfig : undefined,
    };
  }

  // ── Save Draft ────────────────────────────────────────────────────────
  function handleSaveDraft() {
    const allBPs = supplierService.getAll();
    const errs = validateBPForSave(
      { bpLegalName: form.bpLegalName, bpType: (form.bpType as import('../types/supplierMaster.types').BPType) || undefined, effectiveFromDate: form.effectiveFromDate, effectiveToDate: form.effectiveToDate } as Partial<BusinessPartner>,
      allBPs.filter((b) => b.id !== existing?.id),
      existing?.id,
    );
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      showToast('Please fix validation errors before saving.', 'error');
      return;
    }
    const data = buildBP();
    if (isNew) {
      supplierService.create(data);
      showToast('Business partner saved as Draft.', 'success');
    } else if (existing) {
      supplierService.update(existing.id, data);
      showToast('Draft saved.', 'success');
    }
    navigate('/admin/supplier-master');
  }

  // ── Activate ──────────────────────────────────────────────────────────
  function handleActivateRequest() {
    if (!existing) return;
    const full: BusinessPartner = { ...existing, ...buildBP() };
    const issues = validateBPForActivation(full);
    setActivationIssues(issues);
    setActivateOpen(true);
  }

  function confirmActivate() {
    if (!existing) return;
    supplierService.update(existing.id, { ...buildBP(), status: 'Active' });
    setActivateOpen(false);
    showToast(`"${existing.bpLegalName}" activated.`, 'success');
    navigate('/admin/supplier-master');
  }

  // ── Inactivate ────────────────────────────────────────────────────────
  function confirmInactivate() {
    if (!existing || !inactivateReason.trim()) return;
    supplierService.inactivate(existing.id, inactivateReason.trim());
    setInactivateOpen(false);
    showToast(`"${existing.bpLegalName}" inactivated.`, 'success');
    navigate('/admin/supplier-master');
  }

  // ── Delete ────────────────────────────────────────────────────────────
  function confirmDelete() {
    if (!existing) return;
    supplierService.delete(existing.id);
    setDeleteOpen(false);
    navigate('/admin/supplier-master');
  }

  // ── Contact CRUD ──────────────────────────────────────────────────────
  function openAddContact() {
    setContactEditId(null);
    setContactForm({ contactType: '', contactName: '', department: '', designation: '', countryCode: '+91', phone: '', email: '', fax: '', status: 'Active' });
    setContactErrors({});
    setContactOpen(true);
  }
  function openEditContact(c: BPContact) {
    setContactEditId(c.id);
    setContactForm({ contactType: c.contactType, contactName: c.contactName, department: c.department, designation: c.designation, countryCode: c.countryCode, phone: c.phone, email: c.email, fax: c.fax, status: c.status });
    setContactErrors({});
    setContactOpen(true);
  }
  function saveContact() {
    const errs = validateContact(contactForm as Partial<BPContact>, contacts, contactEditId ?? undefined);
    if (Object.keys(errs).length > 0) { setContactErrors(errs); return; }
    if (contactEditId) {
      setContacts((prev) => prev.map((c) => c.id === contactEditId ? { ...c, ...contactForm, contactType: contactForm.contactType as ContactType } : c));
    } else {
      const newC: BPContact = { id: `BPCT-${Date.now()}`, ...contactForm, contactType: contactForm.contactType as ContactType };
      setContacts((prev) => [...prev, newC]);
    }
    setContactOpen(false);
  }
  function removeContact(id: string) { setContacts((p) => p.filter((c) => c.id !== id)); }

  // ── Address CRUD ──────────────────────────────────────────────────────
  function openAddAddress() {
    setAddressEditId(null);
    setAddressForm({ addressType: '', addressLine1: '', addressLine2: '', country: 'India', state: '', city: '', pin: '', latitude: '', longitude: '', isDefault: addresses.length === 0, status: 'Active' });
    setAddressErrors({});
    setAddressOpen(true);
  }
  function openEditAddress(a: BPAddress) {
    setAddressEditId(a.id);
    setAddressForm({ addressType: a.addressType, addressLine1: a.addressLine1, addressLine2: a.addressLine2, country: a.country, state: a.state, city: a.city, pin: a.pin, latitude: a.latitude, longitude: a.longitude, isDefault: a.isDefault, status: a.status });
    setAddressErrors({});
    setAddressOpen(true);
  }
  function saveAddress() {
    const errs = validateAddress(addressForm as Partial<BPAddress>, addresses, addressEditId ?? undefined);
    const warnOnly = Object.keys(errs).length === 1 && errs.isDefault;
    if (Object.keys(errs).length > 0 && !warnOnly) { setAddressErrors(errs); return; }
    if (addressEditId) {
      setAddresses((prev) => prev.map((a) => {
        if (a.id === addressEditId) return { ...a, ...addressForm, addressType: addressForm.addressType as AddressType };
        if (addressForm.isDefault && a.id !== addressEditId) return { ...a, isDefault: false };
        return a;
      }));
    } else {
      const newA: BPAddress = { id: `BPAD-${Date.now()}`, ...addressForm, addressType: addressForm.addressType as AddressType };
      setAddresses((prev) => [
        ...prev.map((a) => addressForm.isDefault ? { ...a, isDefault: false } : a),
        newA,
      ]);
    }
    setAddressOpen(false);
  }
  function removeAddress(id: string) { setAddresses((p) => p.filter((a) => a.id !== id)); }

  // ── Org Mapping CRUD ──────────────────────────────────────────────────
  function openAddOrg() {
    setOrgEditId(null);
    setOrgForm({ applyToAll: false, organisationId: '', effectiveDate: '', expirationDate: '', status: 'Active' });
    setOrgOpen(true);
  }
  function openEditOrg(m: BPOrgMapping) {
    setOrgEditId(m.id);
    setOrgForm({ applyToAll: m.applyToAll, organisationId: m.organisationId, effectiveDate: m.effectiveDate, expirationDate: m.expirationDate, status: m.status });
    setOrgOpen(true);
  }
  function saveOrg() {
    const org = MOCK_ORGANISATIONS.find((o) => o.id === orgForm.organisationId);
    if (orgEditId) {
      setOrgMappings((prev) => prev.map((m) => m.id === orgEditId ? { ...m, ...orgForm, organisationName: org?.name ?? '' } : m));
    } else {
      const newM: BPOrgMapping = { id: `BPOM-${Date.now()}`, ...orgForm, organisationName: org?.name ?? '' };
      setOrgMappings((prev) => [...prev, newM]);
    }
    setOrgOpen(false);
  }
  function removeOrg(id: string) { setOrgMappings((p) => p.filter((m) => m.id !== id)); }

  // ── Compliance Doc CRUD ───────────────────────────────────────────────
  function openAddDoc() {
    setDocEditId(null);
    setDocForm({ documentType: '', documentNumber: '', issueDate: '', expiryDate: '', allowTransactionAfterExpiry: false, attachmentName: '', status: 'Active' });
    setDocOpen(true);
  }
  function openEditDoc(d: BPComplianceDocument) {
    setDocEditId(d.id);
    setDocForm({ documentType: d.documentType, documentNumber: d.documentNumber, issueDate: d.issueDate, expiryDate: d.expiryDate, allowTransactionAfterExpiry: d.allowTransactionAfterExpiry, attachmentName: d.attachmentName, status: d.status });
    setDocOpen(true);
  }
  function saveDoc() {
    if (docEditId) {
      setComplianceDocs((prev) => prev.map((d) => d.id === docEditId ? { ...d, ...docForm, documentType: docForm.documentType as ComplianceDocType } : d));
    } else {
      const newD: BPComplianceDocument = { id: `BPCD-${Date.now()}`, ...docForm, documentType: docForm.documentType as ComplianceDocType };
      setComplianceDocs((prev) => [...prev, newD]);
    }
    setDocOpen(false);
  }
  function removeDoc(id: string) { setComplianceDocs((p) => p.filter((d) => d.id !== id)); }

  // ── Bank CRUD ─────────────────────────────────────────────────────────
  function openAddBank() {
    setBankEditId(null);
    setBankForm({ bankCode: '', bankName: '', branchName: '', accountHolderName: form.bpLegalName, accountNumber: '', accountType: '', defaultCurrency: 'INR', isDefaultAccount: bankDetails.length === 0, status: 'Active', addrLine1: '', addrLine2: '', addrCountry: 'India', addrState: '', addrCity: '', addrPin: '' });
    setBankErrors({});
    setBankOpen(true);
  }
  function openEditBank(b: BPBankDetail) {
    setBankEditId(b.id);
    setBankForm({ bankCode: b.bankCode, bankName: b.bankName, branchName: b.branchName, accountHolderName: b.accountHolderName, accountNumber: b.accountNumber, accountType: b.accountType, defaultCurrency: b.defaultCurrency, isDefaultAccount: b.isDefaultAccount, status: b.status, addrLine1: b.bankAddress.addressLine1, addrLine2: b.bankAddress.addressLine2, addrCountry: b.bankAddress.country, addrState: b.bankAddress.state, addrCity: b.bankAddress.city, addrPin: b.bankAddress.pin });
    setBankErrors({});
    setBankOpen(true);
  }
  function saveBank() {
    const errs = validateBankDetail(bankForm as Partial<BPBankDetail>, bankDetails, bankEditId ?? undefined);
    if (Object.keys(errs).length > 0) { setBankErrors(errs); return; }
    const built: BPBankDetail = { id: bankEditId ?? `BPBK-${Date.now()}`, bankCode: bankForm.bankCode, bankName: bankForm.bankName, branchName: bankForm.branchName, accountHolderName: bankForm.accountHolderName, accountNumber: bankForm.accountNumber, accountType: bankForm.accountType as AccountType, defaultCurrency: bankForm.defaultCurrency, isDefaultAccount: bankForm.isDefaultAccount, status: bankForm.status, bankAddress: { addressLine1: bankForm.addrLine1, addressLine2: bankForm.addrLine2, country: bankForm.addrCountry, state: bankForm.addrState, city: bankForm.addrCity, pin: bankForm.addrPin } };
    if (bankEditId) {
      setBankDetails((prev) => prev.map((b) => b.id === bankEditId ? built : (bankForm.isDefaultAccount ? { ...b, isDefaultAccount: false } : b)));
    } else {
      setBankDetails((prev) => [...prev.map((b) => bankForm.isDefaultAccount ? { ...b, isDefaultAccount: false } : b), built]);
    }
    setBankOpen(false);
  }
  function removeBank(id: string) { setBankDetails((p) => p.filter((b) => b.id !== id)); }

  // ── Item Mapping CRUD ─────────────────────────────────────────────────
  function handleBulkAddItems() {
    const toNum = (s: string) => parseInt(s || '0', 10) || 0;
    const newMappings: BPItemMapping[] = itemSelectorSelected.map((code) => {
      const item = MOCK_ITEMS.find((i) => i.code === code);
      return {
        id: `BPIM-${Date.now()}-${code}`,
        itemCode: code,
        itemName: item?.name ?? code,
        orderUom: itemSelectorDefaults.orderUom,
        orderMultiple: toNum(itemSelectorDefaults.orderMultiple),
        minOrderQty: toNum(itemSelectorDefaults.minOrderQty),
        maxQtyScope: itemSelectorDefaults.maxQtyScope,
        maxOrderQty: toNum(itemSelectorDefaults.maxOrderQty),
        stdLeadTimeDays: toNum(itemSelectorDefaults.stdLeadTimeDays),
        minLeadTimeDays: toNum(itemSelectorDefaults.minLeadTimeDays),
        maxLeadTimeDays: toNum(itemSelectorDefaults.maxLeadTimeDays),
        isReturnable: itemSelectorDefaults.isReturnable,
        returnPeriodDays: 0,
        effectiveFromDate: itemSelectorDefaults.effectiveFromDate,
        effectiveToDate: itemSelectorDefaults.effectiveToDate,
        status: 'Active',
      };
    });
    setItemMappings((prev) => [...prev, ...newMappings]);
    setItemSelectorOpen(false);
    setItemSelectorSearch('');
    setItemSelectorCategory('');
    setItemSelectorSelected([]);
    setItemSelectorDefaults({ orderUom: '', orderMultiple: '', minOrderQty: '0', maxOrderQty: '0', maxQtyScope: 'Per Order', stdLeadTimeDays: '7', minLeadTimeDays: '0', maxLeadTimeDays: '0', isReturnable: false, effectiveFromDate: '', effectiveToDate: '' });
  }
  function updateItemField(id: string, field: string, value: string | number | boolean) {
    setItemMappings((prev) => prev.map((m) => m.id === id ? { ...m, [field]: value } : m));
  }
  function removeItem(id: string) { setItemMappings((p) => p.filter((m) => m.id !== id)); }

  // ── Not-found guard ───────────────────────────────────────────────────
  if (notFound) {
    return (
      <AdminShell>
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: 'var(--color-text-muted)' }}>Business partner not found.</p>
          <button type="button" onClick={() => navigate('/admin/supplier-master')} style={{ ...btnOutline, marginTop: '16px' }}>← Back to List</button>
        </div>
      </AdminShell>
    );
  }

  // ── Render helpers ────────────────────────────────────────────────────
  const pageTitle = isNew ? 'New Business Partner' : (existing?.bpLegalName || 'Business Partner');
  const activationChecklist = activationIssues.length > 0
    ? activationIssues.map((e, i) => ({ id: String(i), label: e, passed: false }))
    : [{ id: 'ready', label: 'All required fields are complete.', passed: true }];

  // ── Section renderers ─────────────────────────────────────────────────

  function renderStep0() {
    return (
      <>
        {/* Identity */}
        <div style={sectionCard}>
          <div style={sCardHead}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Basic Identity</span>
          </div>
          <div style={sCardBody}>
            <div style={twoCol}>
              <div style={fw}>
                <label style={labelBase}>BP Code</label>
                <div style={{ padding: '9px 12px', fontSize: '13px', fontFamily: 'monospace', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-muted)' }}>
                  {existing?.bpCode ?? <span style={{ fontStyle: 'italic', fontFamily: 'inherit' }}>Auto-generated on save</span>}
                </div>
              </div>
              <div style={fw}>
                <label style={labelBase}>BP Legal Name <span style={{ color: '#DC2626' }}>*</span></label>
                <input type="text" value={form.bpLegalName} onChange={(e) => setField('bpLegalName', e.target.value)} disabled={isViewOnly} placeholder="e.g. Apex Auto Components Pvt. Ltd." style={fieldErrors.bpLegalName ? inputError : inputBase} />
                {fieldErrors.bpLegalName && <p style={fieldErrTxt}>{fieldErrors.bpLegalName}</p>}
              </div>
            </div>
            <div style={twoCol}>
              <div style={fw}>
                <label style={labelBase}>Business Partner Type <span style={{ color: '#DC2626' }}>*</span></label>
                <select value={form.bpType} onChange={(e) => setField('bpType', e.target.value as BPType)} disabled={isViewOnly || !isNew || !!typeFromUrl} style={fieldErrors.bpType ? inputError : inputBase}>
                  <option value="">Select type…</option>
                  {BP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                {fieldErrors.bpType && <p style={fieldErrTxt}>{fieldErrors.bpType}</p>}
                {form.bpType && (
                  <p style={{ fontSize: '11px', color: 'var(--color-primary)', marginTop: '4px' }}>
                    {(!isNew || !!typeFromUrl) ? 'Partner type is locked after selection.' : 'Applicable steps will adapt to this type.'}
                  </p>
                )}
              </div>
              <div style={fw}>
                <label style={labelBase}>BP Category</label>
                <select value={form.bpCategory} onChange={(e) => setField('bpCategory', e.target.value as BPCategory)} disabled={isViewOnly} style={inputBase}>
                  <option value="">Select category…</option>
                  {BP_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={twoCol}>
              <div style={fw}>
                <label style={labelBase}>Marketing / Brand Name</label>
                <input type="text" value={form.marketingName} onChange={(e) => setField('marketingName', e.target.value)} disabled={isViewOnly} placeholder="e.g. Apex Auto" style={inputBase} />
              </div>
              <div style={fw}>
                <label style={labelBase}>Display Name</label>
                <input type="text" value={form.displayName} onChange={(e) => setField('displayName', e.target.value)} disabled={isViewOnly} placeholder="Short display name" style={inputBase} />
              </div>
            </div>
          </div>
        </div>

        {/* Registration Details */}
        <div style={sectionCard}>
          <div style={sCardHead}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Registration Details</span>
          </div>
          <div style={sCardBody}>
            <div style={threeCol}>
              <div style={fw}>
                <label style={labelBase}>Country of Registration</label>
                <select value={form.countryOfRegistration} onChange={(e) => setField('countryOfRegistration', e.target.value)} disabled={isViewOnly} style={inputBase}>
                  <option value="">Select country…</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={fw}>
                <label style={labelBase}>Business Type</label>
                <select value={form.businessType} onChange={(e) => setField('businessType', e.target.value as BusinessType)} disabled={isViewOnly} style={inputBase}>
                  <option value="">Select…</option>
                  {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={fw}>
                <label style={labelBase}>Industry Type</label>
                <select value={form.industryType} onChange={(e) => setField('industryType', e.target.value as IndustryType)} disabled={isViewOnly} style={inputBase}>
                  <option value="">Select…</option>
                  {INDUSTRY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={threeCol}>
              <div style={fw}>
                <label style={labelBase}>No. of Employees</label>
                <select value={form.noOfEmployees} onChange={(e) => setField('noOfEmployees', e.target.value as NoOfEmployeesRange)} disabled={isViewOnly} style={inputBase}>
                  <option value="">Select range…</option>
                  {NO_OF_EMPLOYEES_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={fw}>
                <label style={labelBase}>Founding Date</label>
                <input type="date" value={form.foundingDate} onChange={(e) => setField('foundingDate', e.target.value)} disabled={isViewOnly} style={inputBase} />
              </div>
              <div style={fw}>
                <label style={labelBase}>Website URL</label>
                <input type="url" value={form.websiteUrl} onChange={(e) => setField('websiteUrl', e.target.value)} disabled={isViewOnly} placeholder="https://…" style={inputBase} />
              </div>
            </div>
          </div>
        </div>

        {/* Financial Details */}
        <div style={sectionCard}>
          <div style={sCardHead}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Financial Details</span>
          </div>
          <div style={sCardBody}>
            <div style={threeCol}>
              <div style={fw}>
                <label style={labelBase}>Annual Turnover</label>
                <input type="text" value={form.annualTurnover} onChange={(e) => setField('annualTurnover', e.target.value)} disabled={isViewOnly} placeholder="e.g. 12,00,00,000" style={inputBase} />
              </div>
              <div style={fw}>
                <label style={labelBase}>Annual Revenue</label>
                <input type="text" value={form.annualRevenue} onChange={(e) => setField('annualRevenue', e.target.value)} disabled={isViewOnly} placeholder="e.g. 11,50,00,000" style={inputBase} />
              </div>
              <div style={fw}>
                <label style={labelBase}>Financial Currency</label>
                <select value={form.financialCurrency} onChange={(e) => setField('financialCurrency', e.target.value)} disabled={isViewOnly} style={inputBase}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ ...twoCol, maxWidth: '440px' }}>
              <div style={fw}>
                <label style={labelBase}>Financial Year</label>
                <select value={form.financialYear} onChange={(e) => setField('financialYear', e.target.value)} disabled={isViewOnly} style={inputBase}>
                  {FINANCIAL_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Lifecycle */}
        <div style={sectionCard}>
          <div style={sCardHead}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Lifecycle & Description</span>
          </div>
          <div style={sCardBody}>
            <div style={twoCol}>
              <div style={fw}>
                <label style={labelBase}>Effective From Date</label>
                <input type="date" value={form.effectiveFromDate} onChange={(e) => setField('effectiveFromDate', e.target.value)} disabled={isViewOnly} style={inputBase} />
              </div>
              <div style={fw}>
                <label style={labelBase}>Effective To Date</label>
                <input type="date" value={form.effectiveToDate} onChange={(e) => setField('effectiveToDate', e.target.value)} disabled={isViewOnly} style={inputBase} />
                {fieldErrors.effectiveToDate && <p style={fieldErrTxt}>{fieldErrors.effectiveToDate}</p>}
              </div>
            </div>
            <div style={fw}>
              <label style={labelBase}>Description</label>
              <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} disabled={isViewOnly} rows={3} placeholder="Brief description of this business partner…" style={{ ...inputBase, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
          </div>
        </div>
      </>
    );
  }

  function renderSubGrid(
    label: string,
    rows: React.ReactNode,
    header: React.ReactNode,
    isEmpty: boolean,
    emptyText: string,
    onAdd: () => void,
    addLabel: string,
  ) {
    return (
      <div style={sectionCard}>
        <div style={{ ...sCardHead }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>{label}</span>
          {!isViewOnly && (
            <button type="button" onClick={onAdd}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0 12px', height: '28px', fontSize: '12px', fontWeight: 600, borderRadius: '7px', border: '1px solid var(--color-primary)', background: 'color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))', color: 'var(--color-primary)', cursor: 'pointer' }}>
              + {addLabel}
            </button>
          )}
        </div>
        {isEmpty ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            {emptyText}
          </div>
        ) : (
          <div>
            {header}
            {rows}
          </div>
        )}
      </div>
    );
  }

  function renderStep1() {
    return renderSubGrid(
      'Contacts',
      contacts.map((c) => (
        <div key={c.id} style={{ ...SUB_ROW_STYLE, borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ flex: 1.5, fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.contactName}</div>
          <div style={{ flex: 1 }}><span style={{ ...BADGE_PILL, background: '#EFF6FF', color: '#1D4ED8' }}>{c.contactType}</span></div>
          <div style={{ flex: 1, fontSize: '11px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.department || '—'}</div>
          <div style={{ flex: 1.5, fontSize: '11px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email || '—'}</div>
          <div style={{ flex: 0.8 }}><span style={STATUS_PILL(c.status)}>{c.status}</span></div>
          <SubRowActions onEdit={() => openEditContact(c)} onDelete={() => removeContact(c.id)} />
        </div>
      )),
      subTableHead(['Name', 'Type', 'Department', 'Email', 'Status']),
      contacts.length === 0,
      'No contacts added yet. Click + Contact to add one.',
      openAddContact,
      'Contact',
    );
  }

  function renderStep2() {
    return renderSubGrid(
      'Addresses',
      addresses.map((a) => (
        <div key={a.id} style={{ ...SUB_ROW_STYLE, borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ flex: 1 }}><span style={{ ...BADGE_PILL, background: '#EFF6FF', color: '#1D4ED8' }}>{a.addressType}</span></div>
          <div style={{ flex: 2.5, fontSize: '12px', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[a.addressLine1, a.city, a.state].filter(Boolean).join(', ')}</div>
          <div style={{ flex: 0.8, fontSize: '11px', color: 'var(--color-text-muted)' }}>{a.pin || '—'}</div>
          <div style={{ flex: 0.6 }}>{a.isDefault && <span style={{ ...BADGE_PILL, background: '#F0FDF4', color: '#15803D' }}>Default</span>}</div>
          <div style={{ flex: 0.8 }}><span style={STATUS_PILL(a.status)}>{a.status}</span></div>
          <SubRowActions onEdit={() => openEditAddress(a)} onDelete={() => removeAddress(a.id)} />
        </div>
      )),
      subTableHead(['Type', 'Address', 'PIN', 'Default', 'Status']),
      addresses.length === 0,
      'No addresses added yet. Click + Address to add one.',
      openAddAddress,
      'Address',
    );
  }

  function renderStep3() {
    return renderSubGrid(
      'Organisation Mapping',
      orgMappings.map((m) => (
        <div key={m.id} style={{ ...SUB_ROW_STYLE, borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ flex: 2, fontSize: '12px', fontWeight: 500, color: 'var(--color-text)' }}>{m.applyToAll ? 'All Organisations' : (m.organisationName || m.organisationId)}</div>
          <div style={{ flex: 1, fontSize: '11px', color: 'var(--color-text-muted)' }}>{m.effectiveDate || '—'}</div>
          <div style={{ flex: 1, fontSize: '11px', color: 'var(--color-text-muted)' }}>{m.expirationDate || 'No expiry'}</div>
          <div style={{ flex: 0.8 }}><span style={STATUS_PILL(m.status)}>{m.status}</span></div>
          <SubRowActions onEdit={() => openEditOrg(m)} onDelete={() => removeOrg(m.id)} />
        </div>
      )),
      subTableHead(['Organisation', 'Effective From', 'Expires On', 'Status']),
      orgMappings.length === 0,
      'No organisation mappings yet. Click + Mapping to add one.',
      openAddOrg,
      'Mapping',
    );
  }

  function renderStep4() {
    return (
      <>
        {/* Tax Summary */}
        <div style={sectionCard}>
          <div style={sCardHead}><span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Tax Summary</span></div>
          <div style={sCardBody}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={form.taxRegistered} onChange={(e) => setField('taxRegistered', e.target.checked)} disabled={isViewOnly}
                  style={{ width: '15px', height: '15px', cursor: 'pointer' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>Tax Registered</span>
              </label>
            </div>
            {form.taxRegistered && (
              <div style={{ maxWidth: '360px' }}>
                <div style={fw}>
                  <label style={labelBase}>Tax Jurisdiction</label>
                  <input type="text" value={form.taxJurisdiction} onChange={(e) => setField('taxJurisdiction', e.target.value)} disabled={isViewOnly} placeholder="e.g. India — GST" style={inputBase} />
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Compliance Docs */}
        {renderSubGrid(
          'Compliance Documents',
          complianceDocs.map((d) => (
            <div key={d.id} style={{ ...SUB_ROW_STYLE, borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ flex: 1.5 }}><span style={{ ...BADGE_PILL, background: '#EFF6FF', color: '#1D4ED8', fontSize: '10px' }}>{d.documentType}</span></div>
              <div style={{ flex: 1, fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-text)', fontWeight: 600 }}>{d.documentNumber}</div>
              <div style={{ flex: 1, fontSize: '11px', color: 'var(--color-text-muted)' }}>{d.issueDate || '—'}</div>
              <div style={{ flex: 1, fontSize: '11px', color: 'var(--color-text-muted)' }}>{d.expiryDate || 'No expiry'}</div>
              <div style={{ flex: 0.8 }}><span style={STATUS_PILL(d.status)}>{d.status}</span></div>
              <SubRowActions onEdit={() => openEditDoc(d)} onDelete={() => removeDoc(d.id)} />
            </div>
          )),
          subTableHead(['Document Type', 'Number', 'Issue Date', 'Expiry Date', 'Status']),
          complianceDocs.length === 0,
          'No compliance documents added. Click + Document to add one.',
          openAddDoc,
          'Document',
        )}
      </>
    );
  }

  function renderStep5() {
    return (
      <>
        {/* Bank Accounts */}
        {renderSubGrid(
          'Bank Accounts',
          bankDetails.map((b) => (
            <div key={b.id} style={{ ...SUB_ROW_STYLE, borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ flex: 1.5, fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.bankName}</div>
              <div style={{ flex: 1.5, fontSize: '11px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.accountHolderName}</div>
              <div style={{ flex: 1, fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-text)', fontWeight: 600 }}>••••{b.accountNumber.slice(-4)}</div>
              <div style={{ flex: 0.8, fontSize: '11px', color: 'var(--color-text-muted)' }}>{b.accountType}</div>
              <div style={{ flex: 0.6 }}>{b.isDefaultAccount && <span style={{ ...BADGE_PILL, background: '#F0FDF4', color: '#15803D' }}>Default</span>}</div>
              <div style={{ flex: 0.8 }}><span style={STATUS_PILL(b.status)}>{b.status}</span></div>
              <SubRowActions onEdit={() => openEditBank(b)} onDelete={() => removeBank(b.id)} />
            </div>
          )),
          subTableHead(['Bank', 'Account Holder', 'Account No.', 'Type', 'Default', 'Status']),
          bankDetails.length === 0,
          'No bank accounts added. Click + Bank Account to add one.',
          openAddBank,
          'Bank Account',
        )}

        {/* Payment Terms */}
        <div style={sectionCard}>
          <div style={sCardHead}><span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Payment Terms</span></div>
          <div style={sCardBody}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={form.advanceAllowed} onChange={(e) => setField('advanceAllowed', e.target.checked)} disabled={isViewOnly} style={{ width: '15px', height: '15px', cursor: 'pointer' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>Advance Payment Allowed</span>
              </label>
            </div>
            {form.advanceAllowed && (
              <div style={{ maxWidth: '220px', marginBottom: '14px' }}>
                <label style={labelBase}>Advance %</label>
                <input type="number" value={form.advancePercentage} onChange={(e) => setField('advancePercentage', e.target.value)} disabled={isViewOnly} min="0" max="100" placeholder="0–100" style={inputBase} />
              </div>
            )}
            <div style={threeCol}>
              <div style={fw}>
                <label style={labelBase}>Settlement Type</label>
                <select value={form.settlementType} onChange={(e) => setField('settlementType', e.target.value as SettlementType)} disabled={isViewOnly} style={inputBase}>
                  <option value="">Select…</option>
                  {SETTLEMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={fw}>
                <label style={labelBase}>Payment Mode</label>
                <select value={form.paymentMode} onChange={(e) => setField('paymentMode', e.target.value as PaymentMode)} disabled={isViewOnly} style={inputBase}>
                  <option value="">Select…</option>
                  {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div style={fw}>
                <label style={labelBase}>Credit Days</label>
                <input type="number" value={form.creditDays} onChange={(e) => setField('creditDays', e.target.value)} disabled={isViewOnly} min="0" placeholder="e.g. 30" style={inputBase} />
              </div>
            </div>
            <div style={twoCol}>
              <div style={fw}>
                <label style={labelBase}>Credit Limit</label>
                <input type="number" value={form.creditLimit} onChange={(e) => setField('creditLimit', e.target.value)} disabled={isViewOnly} min="0" placeholder="e.g. 5000000" style={inputBase} />
              </div>
              <div style={fw}>
                <label style={labelBase}>Credit Limit Currency</label>
                <select value={form.creditLimitCurrency} onChange={(e) => setField('creditLimitCurrency', e.target.value)} disabled={isViewOnly} style={inputBase}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  function renderStep6() {
    const GRID = '84px 1fr 72px 72px 72px 90px 36px';

    function editCell(m: BPItemMapping, field: string, display: React.ReactNode, type: 'text' | 'number' | 'select' = 'text', options?: string[]) {
      const active = inlineEditCell?.id === m.id && inlineEditCell?.field === field;
      const cellBase: React.CSSProperties = { fontSize: '12px', display: 'flex', alignItems: 'center', padding: '0 4px', minHeight: '26px', borderRadius: '4px' };
      if (active) {
        if (type === 'select' && options) {
          return (
            <select autoFocus defaultValue={String(m[field as keyof BPItemMapping])}
              onChange={(e) => updateItemField(m.id, field, e.target.value)}
              onBlur={() => setInlineEditCell(null)}
              style={{ width: '100%', fontSize: '12px', padding: '2px 4px', border: '1px solid var(--color-primary)', borderRadius: '4px', background: 'var(--color-surface)', outline: 'none' }}>
              {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          );
        }
        return (
          <input autoFocus type={type} defaultValue={String(m[field as keyof BPItemMapping])}
            onBlur={(e) => { updateItemField(m.id, field, type === 'number' ? Number(e.target.value) : e.target.value); setInlineEditCell(null); }}
            style={{ width: '100%', fontSize: '12px', padding: '2px 4px', border: '1px solid var(--color-primary)', borderRadius: '4px', background: 'var(--color-surface)', outline: 'none', boxSizing: 'border-box' }}
            min={type === 'number' ? 0 : undefined} />
        );
      }
      return (
        <div onClick={() => !isViewOnly && setInlineEditCell({ id: m.id, field })}
          title={!isViewOnly ? 'Click to edit' : undefined}
          style={{ ...cellBase, cursor: isViewOnly ? 'default' : 'pointer' }}
          onMouseEnter={(e) => { if (!isViewOnly) (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-subtle)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
          {display}
        </div>
      );
    }

    return (
      <div style={sectionCard}>
        {/* Card header */}
        <div style={{ ...sCardHead, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Item Mappings</span>
            {itemMappings.length > 0 && (
              <span style={{ ...BADGE_PILL, background: 'color-mix(in srgb, var(--color-primary) 12%, white)', color: 'var(--color-primary)', fontSize: '11px', padding: '1px 8px' }}>
                {itemMappings.length}
              </span>
            )}
          </div>
          {!isViewOnly && (
            <button type="button" onClick={() => setItemSelectorOpen(true)}
              style={{ ...btnPrimary, height: '28px', fontSize: '12px', padding: '0 12px' }}>
              + Add Items
            </button>
          )}
        </div>

        {itemMappings.length === 0 ? (
          <div style={{ ...sCardBody, textAlign: 'center', padding: '40px 24px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            No items mapped yet.
            {!isViewOnly && (
              <> Click{' '}
                <button type="button" onClick={() => setItemSelectorOpen(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: '0 2px' }}>
                  + Add Items
                </button>{' '}
                to get started.
              </>
            )}
          </div>
        ) : (
          <>
            {/* Grid header */}
            <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '0 16px', height: '30px', alignItems: 'center', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)' }}>
              {['Item Code', 'Name', 'UOM', 'Min Qty', 'Max Qty', 'Std Lead', ''].map((h, i) => (
                <span key={i} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', padding: '0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h}</span>
              ))}
            </div>
            {/* Grid rows */}
            {itemMappings.map((m) => (
              <div key={m.id} style={{ display: 'grid', gridTemplateColumns: GRID, padding: '0 16px', minHeight: '38px', alignItems: 'center', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 4px' }}>
                  {m.itemCode}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 4px 0 0' }}>
                  {m.itemName}
                </div>
                {editCell(m, 'orderUom', m.orderUom || <em style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>—</em>, 'select', ORDER_UOMS)}
                {editCell(m, 'minOrderQty', <span style={{ color: 'var(--color-text-muted)' }}>{m.minOrderQty}</span>, 'number')}
                {editCell(m, 'maxOrderQty', <span style={{ color: 'var(--color-text-muted)' }}>{m.maxOrderQty}</span>, 'number')}
                {editCell(m, 'stdLeadTimeDays', <span style={{ color: 'var(--color-text-muted)' }}>{m.stdLeadTimeDays}d</span>, 'number')}
                {!isViewOnly && (
                  <button type="button" onClick={() => removeItem(m.id)} title="Remove item"
                    style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: 'var(--color-text-muted)' }}
                    onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#FEF2F2'; b.style.color = '#DC2626'; b.style.borderColor = '#FCA5A5'; }}
                    onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'transparent'; b.style.color = 'var(--color-text-muted)'; b.style.borderColor = 'var(--color-border)'; }}>
                    ×
                  </button>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    );
  }

  // ─── Main Render ──────────────────────────────────────────────────────────────

  return (
    <AdminShell>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, background: toast.tone === 'success' ? '#15803D' : '#DC2626', color: 'white', padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toast.message}
        </div>
      )}

      {/* ── CGP Custom Layout ─────────────────────────────────────────────────── */}
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-surface)' }}>

        {/* ── 1. Compact Header (64px) ─────────────────────────────────────── */}
        <div style={{ flexShrink: 0, padding: '10px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '2px', userSelect: 'none' }}>
              Admin / Business Partners / Supplier Master
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.25 }}>{pageTitle}</span>
              {existing?.status && (
                <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '11px', fontWeight: 600, padding: '2px 9px', borderRadius: '9999px', border: '1px solid',
                  ...(existing.status === 'Active' ? { background: 'color-mix(in srgb, #10b981 12%, var(--color-surface))', color: 'color-mix(in srgb, #10b981 85%, var(--color-text))', borderColor: 'color-mix(in srgb, #10b981 35%, var(--color-border))' }
                    : existing.status === 'Inactive' ? { background: 'var(--color-surface-subtle)', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }
                    : { background: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE' }) }}>
                  {existing.status}
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px', lineHeight: 1.35 }}>
              Configure supplier identity, contacts, addresses, compliance, bank details, and item mappings.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button type="button" onClick={() => navigate('/admin/supplier-master')} style={btnOutline}>← Back to List</button>
            <button type="button" onClick={() => setHelpOpen(true)} style={btnOutline}>How this works</button>
          </div>
        </div>

        {/* ── 2. Middle Area (sidebar + form body) ────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ── Left Step Sidebar (220px) ──────────────────────────────────── */}
          <nav style={{ width: '220px', flexShrink: 0, background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)', overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingTop: '8px' }}>
            {steps.map((s) => {
              const isAct        = activeStep === s.index;
              const hasData      = stepHasData(s.index);
              const isApplicable = applicableTabs.includes(s.tabNum);
              const count        = getStepCount(s.index);
              const isHovered    = hoveredStep === s.index;
              const dotColor     = isAct ? 'var(--color-primary)' : hasData ? '#16A34A' : '#CBD5E1';
              return (
                <React.Fragment key={s.index}>
                  <button type="button" onClick={() => setActiveStep(s.index)}
                    onMouseEnter={() => setHoveredStep(s.index)}
                    onMouseLeave={() => setHoveredStep(null)}
                    style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 12px 12px 20px', border: 'none', borderBottom: '1px solid var(--color-border)', background: isAct ? 'color-mix(in srgb, var(--color-primary) 6%, white)' : isHovered ? 'color-mix(in srgb, var(--color-primary) 3%, white)' : 'transparent', cursor: 'pointer', textAlign: 'left', opacity: isApplicable ? 1 : 0.4, transition: 'background 0.1s', width: '100%' }}
                  >
                    {isAct && <span style={{ position: 'absolute', left: 0, top: '8px', bottom: '8px', width: '3px', borderRadius: '0 3px 3px 0', background: 'var(--color-primary)' }} />}
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0, background: dotColor, transition: 'background 0.15s' }} />
                    <span style={{ flex: 1, fontSize: '12px', fontWeight: isAct ? 600 : 500, color: isAct ? 'var(--color-primary)' : hasData ? 'var(--color-text)' : 'var(--color-text-muted)', lineHeight: 1.3, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.label}
                    </span>
                    {count > 0 && (
                      <span style={{ fontSize: '10px', fontWeight: 700, minWidth: '18px', height: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '9px', padding: '0 4px', background: isAct ? 'var(--color-primary)' : 'color-mix(in srgb, var(--color-primary) 12%, white)', color: isAct ? 'white' : 'var(--color-primary)', flexShrink: 0 }}>
                        {count}
                      </span>
                    )}
                    <ChevronRight size={13} style={{ flexShrink: 0, color: 'var(--color-text-muted)', opacity: isHovered ? 0.7 : 0, transition: 'opacity 0.15s' }} />
                  </button>
                </React.Fragment>
              );
            })}
          </nav>

          {/* ── 3. Scrollable Form Body ─────────────────────────────────────── */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px 24px', background: 'var(--color-surface-subtle)' }}>

          {/* Status banners */}
          {isActive && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '10px', marginBottom: '20px' }}>
              <Info size={15} style={{ color: '#EA580C', flexShrink: 0, marginTop: '1px' }} />
              <span style={{ fontSize: '13px', color: '#9A3412', lineHeight: 1.6 }}>
                This business partner is <strong>Active</strong>. BP Code is locked. All other fields can be updated.
              </span>
            </div>
          )}
          {isInactive && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', background: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: '10px', marginBottom: '20px' }}>
              <AlertCircle size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginTop: '1px' }} />
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                This business partner is <strong>Inactive</strong>. All fields are read-only.
              </span>
            </div>
          )}

          {activeStep === 0 && renderStep0()}
          {activeStep === 1 && renderStep1()}
          {activeStep === 2 && renderStep2()}
          {activeStep === 3 && renderStep3()}
          {activeStep === 4 && renderStep4()}
          {activeStep === 5 && renderStep5()}
          {activeStep === 6 && renderStep6()}
          {activeStep === 7 && form.bpType === 'Transporter' && (
            <TransporterConfigStep
              config={transporterConfig}
              onChange={setTransporterConfig}
              isViewOnly={isViewOnly}
            />
          )}
          {activeStep === 7 && form.bpType === 'Insurance Provider' && (
            <InsuranceConfigStep
              config={insuranceConfig}
              onChange={setInsuranceConfig}
              isViewOnly={isViewOnly}
            />
          )}
          {activeStep === 7 && form.bpType === 'Financier' && (
            <FinancierConfigStep
              config={financierConfig}
              onChange={setFinancierConfig}
              isViewOnly={isViewOnly}
            />
          )}
          </div>
        </div>

        {/* ── 4. Sticky Footer (60px) ───────────────────────────────────────── */}
        <div style={{ flexShrink: 0, height: '60px', padding: '0 24px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Previous */}
          <button type="button" onClick={() => setActiveStep((s) => Math.max(0, s - 1))} disabled={activeStep === 0}
            style={{ ...btnOutline, opacity: activeStep === 0 ? 0.4 : 1, cursor: activeStep === 0 ? 'default' : 'pointer' }}>
            ← Previous
          </button>

          {/* Delete (Draft only) */}
          {canDel && (
            <button type="button" onClick={() => setDeleteOpen(true)}
              style={{ ...btnBase, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', fontWeight: 500 }}>
              Delete
            </button>
          )}

          <div style={{ flex: 1 }} />

          {/* Inactivate (Active only) */}
          {isActive && (
            <button type="button" onClick={() => setInactivateOpen(true)} style={{ ...btnBase, background: 'transparent', color: '#DC2626', border: '1px solid #FCA5A5', fontWeight: 500 }}>
              Inactivate
            </button>
          )}

          {/* Save Draft (Draft only) */}
          {!isInactive && !isActive && (
            <button type="button" onClick={handleSaveDraft} style={btnOutline}>
              Save Draft
            </button>
          )}

          {/* Save (Active) */}
          {isActive && (
            <button type="button" onClick={handleSaveDraft} style={btnOutline}>
              Save
            </button>
          )}

          {/* Activate (Draft, not new, last step) */}
          {!isNew && !isActive && !isInactive && (
            <button type="button" onClick={handleActivateRequest}
              style={{ ...btnPrimary, background: '#16A34A' }}>
              Activate
            </button>
          )}

          {/* Continue / Finish */}
          {activeStep < steps.length - 1 ? (
            <button type="button" onClick={() => setActiveStep((s) => Math.min(steps.length - 1, s + 1))} style={btnPrimary}>
              Continue →
            </button>
          ) : (
            !isInactive && (
              <button type="button" onClick={handleSaveDraft} style={btnPrimary}>
                {isNew ? 'Save as Draft' : 'Save Changes'}
              </button>
            )
          )}
        </div>
      </div>

      {/* ── Contact Drawer ────────────────────────────────────────────────────── */}
      <SmartFormDrawer
        open={contactOpen} onClose={() => setContactOpen(false)}
        title={contactEditId ? 'Edit Contact' : 'Add Contact'}
        onSave={saveContact} onCancel={() => setContactOpen(false)}
        saveLabel={contactEditId ? 'Save Changes' : 'Add Contact'}
        validationErrors={Object.values(contactErrors).filter(Boolean) as string[]}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', padding: '4px 0 8px' }}>
          <div>
            <label style={labelMuted}>Contact Type <span style={{ color: '#DC2626' }}>*</span></label>
            <select value={contactForm.contactType} onChange={(e) => setContactForm((f) => ({ ...f, contactType: e.target.value as ContactType }))} style={contactErrors.contactType ? inputError : inputBase}>
              <option value="">Select…</option>
              {CONTACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {contactErrors.contactType && <p style={fieldErrTxt}>{contactErrors.contactType}</p>}
          </div>
          <div>
            <label style={labelMuted}>Contact Name <span style={{ color: '#DC2626' }}>*</span></label>
            <input type="text" value={contactForm.contactName} onChange={(e) => setContactForm((f) => ({ ...f, contactName: e.target.value }))} style={contactErrors.contactName ? inputError : inputBase} placeholder="Full name" />
            {contactErrors.contactName && <p style={fieldErrTxt}>{contactErrors.contactName}</p>}
          </div>
          <div>
            <label style={labelMuted}>Department</label>
            <input type="text" value={contactForm.department} onChange={(e) => setContactForm((f) => ({ ...f, department: e.target.value }))} style={inputBase} placeholder="e.g. Finance" />
          </div>
          <div>
            <label style={labelMuted}>Designation</label>
            <input type="text" value={contactForm.designation} onChange={(e) => setContactForm((f) => ({ ...f, designation: e.target.value }))} style={inputBase} placeholder="e.g. Manager" />
          </div>
          <div>
            <label style={labelMuted}>Country Code</label>
            <select value={contactForm.countryCode} onChange={(e) => setContactForm((f) => ({ ...f, countryCode: e.target.value }))} style={inputBase}>
              {COUNTRY_CODES.map((cc) => <option key={cc.code} value={cc.code}>{cc.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelMuted}>Phone</label>
            <input type="tel" value={contactForm.phone} onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))} style={contactErrors.phone ? inputError : inputBase} placeholder="10-digit mobile" />
            {contactErrors.phone && <p style={fieldErrTxt}>{contactErrors.phone}</p>}
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelMuted}>Email</label>
            <input type="email" value={contactForm.email} onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))} style={contactErrors.email ? inputError : inputBase} placeholder="email@example.com" />
            {contactErrors.email && <p style={fieldErrTxt}>{contactErrors.email}</p>}
          </div>
          <div>
            <label style={labelMuted}>Fax</label>
            <input type="text" value={contactForm.fax} onChange={(e) => setContactForm((f) => ({ ...f, fax: e.target.value }))} style={inputBase} placeholder="Optional" />
          </div>
          <div>
            <label style={labelMuted}>Status</label>
            <select value={contactForm.status} onChange={(e) => setContactForm((f) => ({ ...f, status: e.target.value as 'Active' | 'Inactive' }))} style={inputBase}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </SmartFormDrawer>

      {/* ── Address Drawer ────────────────────────────────────────────────────── */}
      <SmartFormDrawer
        open={addressOpen} onClose={() => setAddressOpen(false)}
        title={addressEditId ? 'Edit Address' : 'Add Address'}
        onSave={saveAddress} onCancel={() => setAddressOpen(false)}
        saveLabel={addressEditId ? 'Save Changes' : 'Add Address'}
        validationErrors={Object.values(addressErrors).filter(Boolean) as string[]}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', padding: '4px 0 8px' }}>
          <div>
            <label style={labelMuted}>Address Type <span style={{ color: '#DC2626' }}>*</span></label>
            <select value={addressForm.addressType} onChange={(e) => setAddressForm((f) => ({ ...f, addressType: e.target.value as AddressType }))} style={addressErrors.addressType ? inputError : inputBase}>
              <option value="">Select…</option>
              {ADDRESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {addressErrors.addressType && <p style={fieldErrTxt}>{addressErrors.addressType}</p>}
          </div>
          <div>
            <label style={labelMuted}>Country</label>
            <select value={addressForm.country} onChange={(e) => setAddressForm((f) => ({ ...f, country: e.target.value }))} style={inputBase}>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelMuted}>Address Line 1 <span style={{ color: '#DC2626' }}>*</span></label>
            <input type="text" value={addressForm.addressLine1} onChange={(e) => setAddressForm((f) => ({ ...f, addressLine1: e.target.value }))} style={addressErrors.addressLine1 ? inputError : inputBase} placeholder="Street / Building name" />
            {addressErrors.addressLine1 && <p style={fieldErrTxt}>{addressErrors.addressLine1}</p>}
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelMuted}>Address Line 2</label>
            <input type="text" value={addressForm.addressLine2} onChange={(e) => setAddressForm((f) => ({ ...f, addressLine2: e.target.value }))} style={inputBase} placeholder="Area / Locality (optional)" />
          </div>
          <div>
            <label style={labelMuted}>State <span style={{ color: '#DC2626' }}>*</span></label>
            <input type="text" value={addressForm.state} onChange={(e) => setAddressForm((f) => ({ ...f, state: e.target.value }))} style={addressErrors.state ? inputError : inputBase} placeholder="State / Province" />
            {addressErrors.state && <p style={fieldErrTxt}>{addressErrors.state}</p>}
          </div>
          <div>
            <label style={labelMuted}>City <span style={{ color: '#DC2626' }}>*</span></label>
            <input type="text" value={addressForm.city} onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))} style={addressErrors.city ? inputError : inputBase} placeholder="City" />
            {addressErrors.city && <p style={fieldErrTxt}>{addressErrors.city}</p>}
          </div>
          <div>
            <label style={labelMuted}>PIN / Zip</label>
            <input type="text" value={addressForm.pin} onChange={(e) => setAddressForm((f) => ({ ...f, pin: e.target.value }))} style={inputBase} placeholder="PIN Code" />
          </div>
          <div>
            <label style={labelMuted}>Latitude</label>
            <input type="text" value={addressForm.latitude} onChange={(e) => setAddressForm((f) => ({ ...f, latitude: e.target.value }))} style={addressErrors.latitude ? inputError : inputBase} placeholder="-90 to +90" />
            {addressErrors.latitude && <p style={fieldErrTxt}>{addressErrors.latitude}</p>}
          </div>
          <div>
            <label style={labelMuted}>Longitude</label>
            <input type="text" value={addressForm.longitude} onChange={(e) => setAddressForm((f) => ({ ...f, longitude: e.target.value }))} style={addressErrors.longitude ? inputError : inputBase} placeholder="-180 to +180" />
            {addressErrors.longitude && <p style={fieldErrTxt}>{addressErrors.longitude}</p>}
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm((f) => ({ ...f, isDefault: e.target.checked }))} style={{ width: '14px', height: '14px', cursor: 'pointer' }} />
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>Set as default address</span>
            </label>
          </div>
        </div>
      </SmartFormDrawer>

      {/* ── Org Mapping Drawer ───────────────────────────────────────────────── */}
      <SmartFormDrawer
        open={orgOpen} onClose={() => setOrgOpen(false)}
        title={orgEditId ? 'Edit Organisation Mapping' : 'Add Organisation Mapping'}
        onSave={saveOrg} onCancel={() => setOrgOpen(false)}
        saveLabel={orgEditId ? 'Save Changes' : 'Add Mapping'}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', padding: '4px 0 8px' }}>
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={orgForm.applyToAll} onChange={(e) => setOrgForm((f) => ({ ...f, applyToAll: e.target.checked }))} style={{ width: '14px', height: '14px', cursor: 'pointer' }} />
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>Apply to All Organisations</span>
            </label>
          </div>
          {!orgForm.applyToAll && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelMuted}>Organisation</label>
              <select value={orgForm.organisationId} onChange={(e) => setOrgForm((f) => ({ ...f, organisationId: e.target.value }))} style={inputBase}>
                <option value="">Select organisation…</option>
                {MOCK_ORGANISATIONS.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={labelMuted}>Effective From Date</label>
            <input type="date" value={orgForm.effectiveDate} onChange={(e) => setOrgForm((f) => ({ ...f, effectiveDate: e.target.value }))} style={inputBase} />
          </div>
          <div>
            <label style={labelMuted}>Expiration Date</label>
            <input type="date" value={orgForm.expirationDate} onChange={(e) => setOrgForm((f) => ({ ...f, expirationDate: e.target.value }))} style={inputBase} />
          </div>
          <div>
            <label style={labelMuted}>Status</label>
            <select value={orgForm.status} onChange={(e) => setOrgForm((f) => ({ ...f, status: e.target.value as 'Active' | 'Inactive' }))} style={inputBase}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </SmartFormDrawer>

      {/* ── Compliance Doc Drawer ────────────────────────────────────────────── */}
      <SmartFormDrawer
        open={docOpen} onClose={() => setDocOpen(false)}
        title={docEditId ? 'Edit Compliance Document' : 'Add Compliance Document'}
        onSave={saveDoc} onCancel={() => setDocOpen(false)}
        saveLabel={docEditId ? 'Save Changes' : 'Add Document'}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', padding: '4px 0 8px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelMuted}>Document Type</label>
            <select value={docForm.documentType} onChange={(e) => setDocForm((f) => ({ ...f, documentType: e.target.value as ComplianceDocType }))} style={inputBase}>
              <option value="">Select…</option>
              {COMPLIANCE_DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelMuted}>Document Number</label>
            <input type="text" value={docForm.documentNumber} onChange={(e) => setDocForm((f) => ({ ...f, documentNumber: e.target.value.toUpperCase() }))} style={inputBase} placeholder="e.g. 27AAPCA1234B1Z5" />
          </div>
          <div>
            <label style={labelMuted}>Issue Date</label>
            <input type="date" value={docForm.issueDate} onChange={(e) => setDocForm((f) => ({ ...f, issueDate: e.target.value }))} style={inputBase} />
          </div>
          <div>
            <label style={labelMuted}>Expiry Date</label>
            <input type="date" value={docForm.expiryDate} onChange={(e) => setDocForm((f) => ({ ...f, expiryDate: e.target.value }))} style={inputBase} />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={docForm.allowTransactionAfterExpiry} onChange={(e) => setDocForm((f) => ({ ...f, allowTransactionAfterExpiry: e.target.checked }))} style={{ width: '14px', height: '14px', cursor: 'pointer' }} />
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>Allow transactions after document expiry</span>
            </label>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelMuted}>Attachment Reference</label>
            <input type="text" value={docForm.attachmentName} onChange={(e) => setDocForm((f) => ({ ...f, attachmentName: e.target.value }))} style={inputBase} placeholder="e.g. gst_certificate.pdf" />
          </div>
        </div>
      </SmartFormDrawer>

      {/* ── Bank Drawer ──────────────────────────────────────────────────────── */}
      <SmartFormDrawer
        open={bankOpen} onClose={() => setBankOpen(false)}
        title={bankEditId ? 'Edit Bank Account' : 'Add Bank Account'}
        onSave={saveBank} onCancel={() => setBankOpen(false)}
        saveLabel={bankEditId ? 'Save Changes' : 'Add Account'}
        validationErrors={Object.values(bankErrors).filter(Boolean) as string[]}
        width="md"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', padding: '4px 0 8px' }}>
          <div>
            <label style={labelMuted}>Bank Name <span style={{ color: '#DC2626' }}>*</span></label>
            <input type="text" value={bankForm.bankName} onChange={(e) => setBankForm((f) => ({ ...f, bankName: e.target.value }))} style={bankErrors.bankName ? inputError : inputBase} placeholder="e.g. HDFC Bank" />
            {bankErrors.bankName && <p style={fieldErrTxt}>{bankErrors.bankName}</p>}
          </div>
          <div>
            <label style={labelMuted}>Branch Name</label>
            <input type="text" value={bankForm.branchName} onChange={(e) => setBankForm((f) => ({ ...f, branchName: e.target.value }))} style={inputBase} placeholder="e.g. Andheri East" />
          </div>
          <div>
            <label style={labelMuted}>Bank Code (IFSC)</label>
            <input type="text" value={bankForm.bankCode} onChange={(e) => setBankForm((f) => ({ ...f, bankCode: e.target.value.toUpperCase() }))} style={inputBase} placeholder="e.g. HDFC0001234" />
          </div>
          <div>
            <label style={labelMuted}>Account Type <span style={{ color: '#DC2626' }}>*</span></label>
            <select value={bankForm.accountType} onChange={(e) => setBankForm((f) => ({ ...f, accountType: e.target.value as AccountType }))} style={bankErrors.accountType ? inputError : inputBase}>
              <option value="">Select…</option>
              {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {bankErrors.accountType && <p style={fieldErrTxt}>{bankErrors.accountType}</p>}
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelMuted}>Account Holder Name <span style={{ color: '#DC2626' }}>*</span></label>
            <input type="text" value={bankForm.accountHolderName} onChange={(e) => setBankForm((f) => ({ ...f, accountHolderName: e.target.value }))} style={bankErrors.accountHolderName ? inputError : inputBase} placeholder="Legal entity name" />
            {bankErrors.accountHolderName && <p style={fieldErrTxt}>{bankErrors.accountHolderName}</p>}
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelMuted}>Account Number <span style={{ color: '#DC2626' }}>*</span></label>
            <input type="text" value={bankForm.accountNumber} onChange={(e) => setBankForm((f) => ({ ...f, accountNumber: e.target.value }))} style={bankErrors.accountNumber ? inputError : inputBase} placeholder="Full account number" />
            {bankErrors.accountNumber && <p style={fieldErrTxt}>{bankErrors.accountNumber}</p>}
          </div>
          <div>
            <label style={labelMuted}>Default Currency <span style={{ color: '#DC2626' }}>*</span></label>
            <select value={bankForm.defaultCurrency} onChange={(e) => setBankForm((f) => ({ ...f, defaultCurrency: e.target.value }))} style={inputBase}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={bankForm.isDefaultAccount} onChange={(e) => setBankForm((f) => ({ ...f, isDefaultAccount: e.target.checked }))} style={{ width: '14px', height: '14px', cursor: 'pointer' }} />
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>Set as default account</span>
            </label>
          </div>
          {/* Bank address mini-section */}
          <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--color-border)', paddingTop: '14px', marginTop: '4px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>Bank Branch Address</p>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelMuted}>Address Line 1</label>
            <input type="text" value={bankForm.addrLine1} onChange={(e) => setBankForm((f) => ({ ...f, addrLine1: e.target.value }))} style={inputBase} placeholder="Street / Building" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelMuted}>Address Line 2</label>
            <input type="text" value={bankForm.addrLine2} onChange={(e) => setBankForm((f) => ({ ...f, addrLine2: e.target.value }))} style={inputBase} placeholder="Area / Locality" />
          </div>
          <div>
            <label style={labelMuted}>Country</label>
            <select value={bankForm.addrCountry} onChange={(e) => setBankForm((f) => ({ ...f, addrCountry: e.target.value }))} style={inputBase}>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelMuted}>State</label>
            <input type="text" value={bankForm.addrState} onChange={(e) => setBankForm((f) => ({ ...f, addrState: e.target.value }))} style={inputBase} placeholder="State" />
          </div>
          <div>
            <label style={labelMuted}>City</label>
            <input type="text" value={bankForm.addrCity} onChange={(e) => setBankForm((f) => ({ ...f, addrCity: e.target.value }))} style={inputBase} placeholder="City" />
          </div>
          <div>
            <label style={labelMuted}>PIN</label>
            <input type="text" value={bankForm.addrPin} onChange={(e) => setBankForm((f) => ({ ...f, addrPin: e.target.value }))} style={inputBase} placeholder="PIN Code" />
          </div>
        </div>
      </SmartFormDrawer>

      {/* ── Item Selector Modal ──────────────────────────────────────────────── */}
      {(() => {
        const mappedCodes = new Set(itemMappings.map((m) => m.itemCode));
        const filtered = MOCK_ITEMS.filter((item) => {
          const q = itemSelectorSearch.toLowerCase();
          const matchesSearch = !q || item.code.toLowerCase().includes(q) || item.name.toLowerCase().includes(q);
          const matchesCat = !itemSelectorCategory || item.category === itemSelectorCategory;
          return matchesSearch && matchesCat;
        });
        const selectable = filtered.filter((i) => !mappedCodes.has(i.code));
        const allChecked = selectable.length > 0 && selectable.every((i) => itemSelectorSelected.includes(i.code));
        const someChecked = selectable.some((i) => itemSelectorSelected.includes(i.code));
        const canAdd = itemSelectorSelected.length > 0 && !!itemSelectorDefaults.orderUom;
        const cellStyle: React.CSSProperties = { fontSize: '12px', color: 'var(--color-text-muted)', padding: '0 4px' };
        return (
          <AppDialog
            open={itemSelectorOpen}
            onClose={() => setItemSelectorOpen(false)}
            title="Add Items"
            description={`Select items from the catalogue and set shared default values.`}
            showCloseButton
            width={880}
            paperSx={{ '& .MuiDialogContent-root': { overflow: 'hidden', padding: 0 } }}
            actions={
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '0 2px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', flex: 1 }}>
                  {itemSelectorSelected.length > 0
                    ? `${itemSelectorSelected.length} item${itemSelectorSelected.length !== 1 ? 's' : ''} selected`
                    : 'No items selected'}
                  {!itemSelectorDefaults.orderUom && itemSelectorSelected.length > 0 && (
                    <span style={{ marginLeft: '8px', color: '#DC2626' }}>— Order UOM is required</span>
                  )}
                </span>
                <button type="button" onClick={() => setItemSelectorOpen(false)}
                  style={{ ...btnOutline, padding: '7px 16px', fontSize: '13px' }}>
                  Cancel
                </button>
                <button type="button" onClick={handleBulkAddItems} disabled={!canAdd}
                  style={{ ...btnPrimary, padding: '7px 16px', fontSize: '13px', opacity: canAdd ? 1 : 0.45, cursor: canAdd ? 'pointer' : 'not-allowed' }}>
                  Add {itemSelectorSelected.length > 0 ? itemSelectorSelected.length : ''} Item{itemSelectorSelected.length !== 1 ? 's' : ''}
                </button>
              </div>
            }
          >
            <div style={{ display: 'flex', gap: 0, height: '460px', overflow: 'hidden' }}>

              {/* ── Left: catalogue browser ────────────────────────────────── */}
              <div style={{ flex: '1 1 54%', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Search + filter bar */}
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--color-surface)' }}>
                  <input
                    type="search"
                    placeholder="Search by code or name…"
                    value={itemSelectorSearch}
                    onChange={(e) => setItemSelectorSearch(e.target.value)}
                    style={{ flex: 1, fontSize: '13px', padding: '7px 10px', border: '1px solid var(--color-border)', borderRadius: '8px', outline: 'none', background: 'var(--color-surface)' }}
                  />
                  <select
                    value={itemSelectorCategory}
                    onChange={(e) => setItemSelectorCategory(e.target.value)}
                    style={{ fontSize: '12px', padding: '7px 10px', border: '1px solid var(--color-border)', borderRadius: '8px', outline: 'none', background: 'var(--color-surface)', minWidth: '130px' }}
                  >
                    <option value="">All categories</option>
                    {ITEM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '36px 88px 1fr 96px', padding: '0 14px', height: '30px', alignItems: 'center', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={(el) => { if (el) el.indeterminate = !allChecked && someChecked; }}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setItemSelectorSelected((prev) => [...new Set([...prev, ...selectable.map((i) => i.code)])]);
                      } else {
                        const selectableCodes = new Set(selectable.map((i) => i.code));
                        setItemSelectorSelected((prev) => prev.filter((c) => !selectableCodes.has(c)));
                      }
                    }}
                    style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                  />
                  <span style={{ ...cellStyle, fontWeight: 600 }}>Code</span>
                  <span style={{ ...cellStyle, fontWeight: 600 }}>Name</span>
                  <span style={{ ...cellStyle, fontWeight: 600 }}>Category</span>
                </div>
                {/* Table rows */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {filtered.length === 0 ? (
                    <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                      No items match your search.
                    </div>
                  ) : filtered.map((item) => {
                    const alreadyMapped = mappedCodes.has(item.code);
                    const checked = itemSelectorSelected.includes(item.code);
                    return (
                      <div
                        key={item.code}
                        onClick={() => {
                          if (alreadyMapped) return;
                          setItemSelectorSelected((prev) =>
                            checked ? prev.filter((c) => c !== item.code) : [...prev, item.code]
                          );
                        }}
                        style={{ display: 'grid', gridTemplateColumns: '36px 88px 1fr 96px', padding: '0 14px', height: '36px', alignItems: 'center', borderBottom: '1px solid var(--color-border)', cursor: alreadyMapped ? 'default' : 'pointer', background: checked ? 'color-mix(in srgb, var(--color-primary) 6%, white)' : 'transparent', opacity: alreadyMapped ? 0.5 : 1 }}
                        onMouseEnter={(e) => { if (!alreadyMapped && !checked) (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-subtle)'; }}
                        onMouseLeave={(e) => { if (!checked) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                      >
                        <input
                          type="checkbox" checked={checked} disabled={alreadyMapped}
                          onChange={() => {}} onClick={(e) => e.stopPropagation()}
                          style={{ width: '14px', height: '14px', cursor: alreadyMapped ? 'not-allowed' : 'pointer' }}
                        />
                        <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '4px' }}>{item.code}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
                          {item.name}
                          {alreadyMapped && <span style={{ marginLeft: '6px', fontSize: '10px', fontWeight: 600, color: '#6B7280', background: '#F3F4F6', padding: '1px 6px', borderRadius: '4px' }}>Added</span>}
                        </div>
                        <div style={{ ...cellStyle, fontSize: '11px' }}>{item.category}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Right: default values ──────────────────────────────────── */}
              <div style={{ flex: '0 0 46%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)' }}>Default Values</span>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>Applied to all selected items. Edit individually after adding.</p>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={labelMuted}>Order UOM <span style={{ color: '#DC2626' }}>*</span></label>
                    <select value={itemSelectorDefaults.orderUom}
                      onChange={(e) => setItemSelectorDefaults((d) => ({ ...d, orderUom: e.target.value }))}
                      style={{ ...inputBase, borderColor: !itemSelectorDefaults.orderUom ? '#DC2626' : undefined }}>
                      <option value="">Select UOM…</option>
                      {ORDER_UOMS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={labelMuted}>Min Order Qty</label>
                      <input type="number" min="0" value={itemSelectorDefaults.minOrderQty}
                        onChange={(e) => setItemSelectorDefaults((d) => ({ ...d, minOrderQty: e.target.value }))}
                        style={inputBase} />
                    </div>
                    <div>
                      <label style={labelMuted}>Max Order Qty</label>
                      <input type="number" min="0" value={itemSelectorDefaults.maxOrderQty}
                        onChange={(e) => setItemSelectorDefaults((d) => ({ ...d, maxOrderQty: e.target.value }))}
                        style={inputBase} />
                    </div>
                  </div>
                  <div>
                    <label style={labelMuted}>Max Qty Scope</label>
                    <select value={itemSelectorDefaults.maxQtyScope}
                      onChange={(e) => setItemSelectorDefaults((d) => ({ ...d, maxQtyScope: e.target.value as MaxQtyScope }))}
                      style={inputBase}>
                      {MAX_QTY_SCOPES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={labelMuted}>Std Lead (d)</label>
                      <input type="number" min="0" value={itemSelectorDefaults.stdLeadTimeDays}
                        onChange={(e) => setItemSelectorDefaults((d) => ({ ...d, stdLeadTimeDays: e.target.value }))}
                        style={inputBase} />
                    </div>
                    <div>
                      <label style={labelMuted}>Min Lead (d)</label>
                      <input type="number" min="0" value={itemSelectorDefaults.minLeadTimeDays}
                        onChange={(e) => setItemSelectorDefaults((d) => ({ ...d, minLeadTimeDays: e.target.value }))}
                        style={inputBase} />
                    </div>
                    <div>
                      <label style={labelMuted}>Max Lead (d)</label>
                      <input type="number" min="0" value={itemSelectorDefaults.maxLeadTimeDays}
                        onChange={(e) => setItemSelectorDefaults((d) => ({ ...d, maxLeadTimeDays: e.target.value }))}
                        style={inputBase} />
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                    <input type="checkbox" checked={itemSelectorDefaults.isReturnable}
                      onChange={(e) => setItemSelectorDefaults((d) => ({ ...d, isReturnable: e.target.checked }))}
                      style={{ width: '14px', height: '14px', cursor: 'pointer' }} />
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>Item is returnable</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={labelMuted}>Effective From</label>
                      <input type="date" value={itemSelectorDefaults.effectiveFromDate}
                        onChange={(e) => setItemSelectorDefaults((d) => ({ ...d, effectiveFromDate: e.target.value }))}
                        style={inputBase} />
                    </div>
                    <div>
                      <label style={labelMuted}>Effective To</label>
                      <input type="date" value={itemSelectorDefaults.effectiveToDate}
                        onChange={(e) => setItemSelectorDefaults((d) => ({ ...d, effectiveToDate: e.target.value }))}
                        style={inputBase} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AppDialog>
        );
      })()}

      {/* ── Activate drawer ──────────────────────────────────────────────────── */}
      <SmartReviewDrawer
        open={activateOpen} onClose={() => setActivateOpen(false)}
        title="Activate Business Partner"
        subtitle={existing?.bpLegalName}
        description="This will make the business partner available in transactions."
        checklist={activationChecklist}
        confirmLabel="Activate"
        confirmDisabled={activationIssues.length > 0}
        warningText={activationIssues.length > 0 ? 'Resolve all issues above before activating.' : undefined}
        onConfirm={confirmActivate}
        onCancel={() => setActivateOpen(false)}
      />

      {/* ── Inactivate drawer ────────────────────────────────────────────────── */}
      <SmartFormDrawer
        open={inactivateOpen} onClose={() => setInactivateOpen(false)}
        title="Inactivate Business Partner"
        subtitle={existing?.bpLegalName}
        onSave={confirmInactivate} onCancel={() => setInactivateOpen(false)}
        saveLabel="Inactivate"
        saveDisabled={!inactivateReason.trim()}
        validationErrors={!inactivateReason.trim() ? ['Reason for inactivation is required.'] : []}
      >
        <div style={{ padding: '4px 0 8px' }}>
          <div style={{ padding: '10px 14px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', color: '#9A3412' }}>This partner will no longer be available in new transactions.</span>
          </div>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>
            Reason <span style={{ color: '#DC2626' }}>*</span>
          </label>
          <textarea value={inactivateReason} onChange={(e) => setInactivateReason(e.target.value)} rows={3} style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} placeholder="Enter reason…" />
        </div>
      </SmartFormDrawer>

      {/* ── Delete drawer ────────────────────────────────────────────────────── */}
      <SmartReviewDrawer
        open={deleteOpen} onClose={() => setDeleteOpen(false)}
        title="Delete Business Partner"
        subtitle={existing?.bpLegalName}
        description="This action cannot be undone."
        checklist={[{ id: 'draft', label: 'Record is in Draft status', passed: existing?.status === 'Draft' }]}
        warningText="Deletion is permanent. Consider inactivating instead."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      {/* ── Help drawer ──────────────────────────────────────────────────────── */}
      <HelpDrawer
        open={helpOpen} topic={getHelpTopic('supplier-master')}
        onClose={() => setHelpOpen(false)} titleFallback="Business Partner Master Help"
      />
    </AdminShell>
  );
};

export default SupplierFormPage;

// ─── Local style constant (used in sub-entity rows) ───────────────────────────
const BADGE_PILL: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  padding: '2px 8px', fontSize: '11px', fontWeight: 600,
  borderRadius: '9999px', whiteSpace: 'nowrap',
};
