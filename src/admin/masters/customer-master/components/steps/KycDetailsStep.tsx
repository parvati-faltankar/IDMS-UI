import React, { useState } from 'react';
import type { Customer, CustomerKYCDocument, CustomerKYCTaxMapping } from '../../types/customerMaster.types';
import {
  KYC_DOCUMENT_TYPES,
  KYC_DOC_STATUSES,
  KYC_OVERALL_STATUSES,
  TRANSACTION_USAGES,
  EMPTY_KYC_DOC,
  EMPTY_KYC_TAX_MAPPING,
  INDIAN_STATES,
} from '../../constants/customerMaster.constants';
import AppDialog from '../../../../../components/app/AppDialog';
import { CustomerAccordionSection } from '../CustomerAccordionSection';
import { MasterFormSectionSummary } from '../../../../../experience/components/AdminPageShell';

// ─── Style constants ──────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: '13px',
  border: '1px solid var(--color-border)', borderRadius: '8px',
  background: 'var(--color-surface)', color: 'var(--color-text)',
  outline: 'none', boxSizing: 'border-box',
};
const inputDisabled: React.CSSProperties = {
  ...inputBase, background: 'var(--color-surface-subtle)', color: 'var(--color-text-muted)', cursor: 'not-allowed',
};
const labelBase: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 600,
  color: 'var(--color-text-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.03em',
};
const sCardBody: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px',
};
const fw: React.CSSProperties = { gridColumn: '1 / -1' };
const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: '0 18px', height: '34px', fontSize: '13px', fontWeight: 600,
  borderRadius: '8px', border: 'none', cursor: 'pointer',
};
const btnPrimary: React.CSSProperties = { ...btnBase, background: 'var(--color-primary)', color: '#fff' };
const btnOutline: React.CSSProperties = { ...btnBase, background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)' };

function Req() { return <span style={{ color: '#DC2626', marginLeft: '2px' }}>*</span>; }
function Hint({ text }: { text: string }) {
  return <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px', lineHeight: 1.4 }}>{text}</p>;
}
function kycDocStatusColor(s: string) {
  if (s === 'Verified')           return { bg: '#F0FDF4', color: '#15803D' };
  if (s === 'Rejected')           return { bg: '#FEF2F2', color: '#DC2626' };
  if (s === 'Submitted')          return { bg: '#EFF6FF', color: '#1D4ED8' };
  if (s === 'Expired')            return { bg: '#FFF7ED', color: '#EA580C' };
  if (s === 'Inactive/Replaced')  return { bg: '#F8FAFC', color: '#64748B' };
  return { bg: '#F8FAFC', color: '#64748B' };
}

function kycOverallStatusColor(s: string) {
  if (s === 'Verified')           return { bg: '#F0FDF4', color: '#15803D' };
  if (s === 'Partially Verified') return { bg: '#FFFBEB', color: '#B45309' };
  if (s === 'Pending')            return { bg: '#EFF6FF', color: '#1D4ED8' };
  if (s === 'Rejected')           return { bg: '#FEF2F2', color: '#DC2626' };
  if (s === 'Expired')            return { bg: '#FFF7ED', color: '#EA580C' };
  return { bg: '#F8FAFC', color: '#64748B' };
}

function summaryText(label: string, value: string | number | null | undefined | boolean) {
  if (value === null || value === undefined || value === '' || value === false) return null;
  if (value === true) return label;
  return `${label}: ${value}`;
}

// ─── KYC Document form types ──────────────────────────────────────────────────

interface DocForm {
  documentType: string; documentNumber: string; documentExpiryDate: string;
  attachmentReference: string; documentStatus: string; rejectionReason: string;
  isPrimaryDocument: boolean; replacementReason: string;
  documentEffectiveDate: string; verifiedBy: string; verifiedDateTime: string;
  isReplacement: boolean;
}
interface DocErrors { documentType?: string; documentNumber?: string; documentStatus?: string; rejectionReason?: string; }

const EMPTY_DF: DocForm = {
  documentType: '', documentNumber: '', documentExpiryDate: '',
  attachmentReference: '', documentStatus: 'Draft', rejectionReason: '',
  isPrimaryDocument: false, replacementReason: '', documentEffectiveDate: '',
  verifiedBy: '', verifiedDateTime: '', isReplacement: false,
};

// ─── Tax Mapping form types ───────────────────────────────────────────────────

interface TaxMapForm {
  kycDocumentId: string; taxRegistrationType: string; taxRegistrationNumber: string;
  addressId: string; mappedState: string; isPrimaryTaxRegistration: boolean; transactionUsage: string[];
}
const EMPTY_TMF: TaxMapForm = {
  kycDocumentId: '', taxRegistrationType: '', taxRegistrationNumber: '',
  addressId: '', mappedState: '', isPrimaryTaxRegistration: false, transactionUsage: [],
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  form: Customer;
  onChange: (updates: Partial<Customer>) => void;
  isViewOnly: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function KycDetailsStep({ form, onChange, isViewOnly }: Props) {
  // KYC Document CRUD
  const [docOpen, setDocOpen]     = useState(false);
  const [docEditId, setDocEditId] = useState<string | null>(null);
  const [df, setDf]               = useState<DocForm>(EMPTY_DF);
  const [docErrors, setDocErrors] = useState<DocErrors>({});

  // Tax Mapping CRUD
  const [taxOpen, setTaxOpen]     = useState(false);
  const [taxEditId, setTaxEditId] = useState<string | null>(null);
  const [tmf, setTmf]             = useState<TaxMapForm>(EMPTY_TMF);

  function openAddDoc() { setDocEditId(null); setDf(EMPTY_DF); setDocErrors({}); setDocOpen(true); }
  function openEditDoc(d: CustomerKYCDocument) {
    setDocEditId(d.id);
    setDf({ documentType: d.documentType, documentNumber: d.documentNumber, documentExpiryDate: d.documentExpiryDate, attachmentReference: d.attachmentReference, documentStatus: d.documentStatus, rejectionReason: d.rejectionReason, isPrimaryDocument: d.isPrimaryDocument, replacementReason: d.replacementReason, documentEffectiveDate: d.documentEffectiveDate, verifiedBy: d.verifiedBy, verifiedDateTime: d.verifiedDateTime, isReplacement: false });
    setDocErrors({}); setDocOpen(true);
  }

  function saveDoc() {
    const errs: DocErrors = {};
    if (!df.documentType)                                          errs.documentType = 'Document Type is required.';
    if (!df.documentNumber.trim())                                 errs.documentNumber = 'Document Number is required.';
    if (!df.documentStatus)                                        errs.documentStatus = 'Document Status is required.';
    if (df.documentStatus === 'Rejected' && !df.rejectionReason.trim()) errs.rejectionReason = 'Rejection Reason is required.';
    if (Object.keys(errs).length > 0) { setDocErrors(errs); return; }

    const existingDoc = docEditId ? form.kycDocuments.find((d) => d.id === docEditId) : null;
    const newVersion = df.isReplacement ? (existingDoc?.documentVersion ?? 0) + 1 : (existingDoc?.documentVersion ?? 1);

    const entry: CustomerKYCDocument = {
      ...EMPTY_KYC_DOC,
      id: df.isReplacement ? `CKYD-${Date.now()}` : (docEditId ?? `CKYD-${Date.now()}`),
      documentType: df.documentType,
      documentNumber: df.documentNumber.trim().toUpperCase(),
      documentExpiryDate: df.documentExpiryDate,
      attachmentReference: df.attachmentReference,
      documentStatus: df.documentStatus as CustomerKYCDocument['documentStatus'],
      rejectionReason: df.documentStatus === 'Rejected' ? df.rejectionReason : '',
      isPrimaryDocument: df.isPrimaryDocument,
      documentVersion: newVersion,
      replacementReason: df.isReplacement ? df.replacementReason : '',
      documentEffectiveDate: df.documentEffectiveDate,
      verifiedBy: df.verifiedBy,
      verifiedDateTime: df.verifiedDateTime,
    };

    let updatedDocs: CustomerKYCDocument[];
    if (df.isReplacement && existingDoc) {
      const inactived = { ...existingDoc, documentStatus: 'Inactive/Replaced' as CustomerKYCDocument['documentStatus'] };
      updatedDocs = [...form.kycDocuments.map((d) => d.id === docEditId ? inactived : d), entry];
    } else if (docEditId) {
      updatedDocs = form.kycDocuments.map((d) => d.id === docEditId ? entry : d);
    } else {
      updatedDocs = [...form.kycDocuments, entry];
    }

    onChange({ kycDocuments: updatedDocs });
    setDocOpen(false);
  }

  function removeDoc(id: string) { onChange({ kycDocuments: form.kycDocuments.filter((d) => d.id !== id) }); }

  function openAddTax() { setTaxEditId(null); setTmf(EMPTY_TMF); setTaxOpen(true); }
  function openEditTax(t: CustomerKYCTaxMapping) {
    setTaxEditId(t.id);
    setTmf({ kycDocumentId: t.kycDocumentId, taxRegistrationType: t.taxRegistrationType, taxRegistrationNumber: t.taxRegistrationNumber, addressId: t.addressId, mappedState: t.mappedState, isPrimaryTaxRegistration: t.isPrimaryTaxRegistration, transactionUsage: t.transactionUsage });
    setTaxOpen(true);
  }
  function saveTax() {
    const entry: CustomerKYCTaxMapping = {
      ...EMPTY_KYC_TAX_MAPPING,
      id: taxEditId ?? `CTXM-${Date.now()}`,
      kycDocumentId: tmf.kycDocumentId,
      taxRegistrationType: tmf.taxRegistrationType,
      taxRegistrationNumber: tmf.taxRegistrationNumber.trim().toUpperCase(),
      addressId: tmf.addressId,
      mappedState: tmf.mappedState,
      isPrimaryTaxRegistration: tmf.isPrimaryTaxRegistration,
      transactionUsage: tmf.transactionUsage,
    };
    if (taxEditId) {
      onChange({ kycTaxMappings: form.kycTaxMappings.map((t) => t.id === taxEditId ? entry : t) });
    } else {
      onChange({ kycTaxMappings: [...form.kycTaxMappings, entry] });
    }
    setTaxOpen(false);
  }
  function removeTax(id: string) { onChange({ kycTaxMappings: form.kycTaxMappings.filter((t) => t.id !== id) }); }

  const inp = isViewOnly ? inputDisabled : inputBase;
  const overallSC = form.overallKYCStatus ? kycOverallStatusColor(form.overallKYCStatus) : null;
  const verifiedDocs = form.kycDocuments.filter((d) => d.documentStatus === 'Verified').length;
  const primaryTaxMap = form.kycTaxMappings.find((t) => t.isPrimaryTaxRegistration) ?? form.kycTaxMappings[0];

  return (
    <div>
      {/* ── Profile Image ─────────────────────────────────────────────────── */}
      <CustomerAccordionSection
        title="Profile Image"
        description="Maintain the customer profile image reference using the shared collapsible section layout."
        summary={<MasterFormSectionSummary items={[summaryText('Image', form.profileImageReference || 'Not uploaded')]} />}
      >
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--color-surface-subtle)', border: '2px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            {form.profileImageReference ? (
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '4px' }}>Image</span>
            ) : (
              <span style={{ fontSize: '28px', color: 'var(--color-text-muted)' }}>👤</span>
            )}
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>{form.profileImageReference || 'No profile image uploaded'}</div>
            {!isViewOnly && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="file" id="profile-img" style={{ display: 'none' }} accept=".jpg,.jpeg,.png"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange({ profileImageReference: f.name }); }}
                />
                <label htmlFor="profile-img" style={{ ...btnOutline, height: '30px', fontSize: '12px', padding: '0 12px', cursor: 'pointer' }}>Upload Image</label>
                {form.profileImageReference && (
                  <button type="button" onClick={() => onChange({ profileImageReference: '' })} style={{ ...btnBase, height: '30px', fontSize: '12px', padding: '0 12px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>Remove</button>
                )}
              </div>
            )}
            <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '6px' }}>JPG or PNG, max 2MB. Optional.</p>
          </div>
        </div>
      </CustomerAccordionSection>

      {/* ── Overall KYC Status ────────────────────────────────────────────── */}
      <CustomerAccordionSection
        title="Overall KYC Status"
        description="Review the derived KYC status before drilling into the underlying documents."
        summary={<MasterFormSectionSummary items={[summaryText('Status', form.overallKYCStatus), verifiedDocs > 0 ? `${verifiedDocs} verified document(s)` : null]} />}
        actions={<span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 500 }}>System-derived</span>}
      >
        <div style={{ ...sCardBody, background: 'var(--color-surface-subtle)' }}>
          <div>
            <label style={labelBase}>KYC Status</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              {overallSC ? (
                <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '6px', background: overallSC.bg, color: overallSC.color }}>{form.overallKYCStatus}</span>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Not computed</span>
              )}
            </div>
            <Hint text="Derived from document statuses as per KYC Setup." />
          </div>
          <div>
            <label style={labelBase}>Override Status (manual)</label>
            <select value={form.overallKYCStatus} onChange={(e) => onChange({ overallKYCStatus: e.target.value as Customer['overallKYCStatus'] })} disabled={isViewOnly} style={inp}>
              <option value="">— System Derived —</option>
              {KYC_OVERALL_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </CustomerAccordionSection>

      {/* ── KYC Documents ─────────────────────────────────────────────────── */}
      <CustomerAccordionSection
        title={`KYC Documents (${form.kycDocuments.length})`}
        description="Track all customer KYC documents with the same shared accordion treatment as supplier master."
        summary={<MasterFormSectionSummary items={[`${form.kycDocuments.length} document(s)`, verifiedDocs > 0 ? `${verifiedDocs} verified` : null, form.kycDocuments[0] ? `Latest: ${form.kycDocuments[0].documentType}` : null]} />}
        actions={!isViewOnly ? (
          <button type="button" onClick={openAddDoc} style={{ ...btnPrimary, height: '30px', fontSize: '12px', padding: '0 14px' }}>+ Add Document</button>
        ) : undefined}
      >
        {form.kycDocuments.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            No KYC documents added. Click <strong>+ Add Document</strong> to upload.
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', padding: '6px 16px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)' }}>
              {['Document Type', 'Number', 'Expiry', 'Status', 'Primary', 'Version', ''].map((h) => (
                <div key={h} style={{ flex: h === '' ? '0 0 100px' : h === 'Primary' || h === 'Version' ? '0 0 70px' : 1, fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 4px' }}>{h}</div>
              ))}
            </div>
            {form.kycDocuments.map((d) => {
              const sc = kycDocStatusColor(d.documentStatus as string);
              return (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ flex: 1, padding: '0 4px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>{d.documentType}</div>
                  <div style={{ flex: 1, padding: '0 4px', fontSize: '12px', fontFamily: 'monospace', color: 'var(--color-text)' }}>{d.documentNumber}</div>
                  <div style={{ flex: 1, padding: '0 4px', fontSize: '11px', color: 'var(--color-text-muted)' }}>{d.documentExpiryDate || '—'}</div>
                  <div style={{ flex: 1, padding: '0 4px' }}><span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: sc.bg, color: sc.color }}>{d.documentStatus}</span></div>
                  <div style={{ flex: '0 0 70px', padding: '0 4px' }}>{d.isPrimaryDocument && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#F0FDF4', color: '#15803D' }}>Primary</span>}</div>
                  <div style={{ flex: '0 0 70px', padding: '0 4px', fontSize: '11px', color: 'var(--color-text-muted)' }}>v{d.documentVersion}</div>
                  {!isViewOnly && (
                    <div style={{ flex: '0 0 100px', display: 'flex', gap: '4px', padding: '0 4px' }}>
                      <button type="button" onClick={() => openEditDoc(d)} style={{ ...btnOutline, height: '26px', padding: '0 10px', fontSize: '11px' }}>Edit</button>
                      <button type="button" onClick={() => removeDoc(d.id)} style={{ ...btnBase, height: '26px', padding: '0 10px', fontSize: '11px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>✕</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CustomerAccordionSection>

      {/* ── Tax Registration Mapping ──────────────────────────────────────── */}
      <CustomerAccordionSection
        title="Tax Registration Mapping"
        description="Map tax registrations to states and addresses in a collapsible shared section."
        summary={<MasterFormSectionSummary items={[`${form.kycTaxMappings.length} mapping(s)`, summaryText('Primary State', primaryTaxMap?.mappedState), summaryText('Tax Number', primaryTaxMap?.taxRegistrationNumber)]} />}
        actions={!isViewOnly ? (
          <button type="button" onClick={openAddTax} style={{ ...btnOutline, height: '30px', fontSize: '12px', padding: '0 14px' }}>+ Map Tax Reg</button>
        ) : undefined}
      >
        {form.kycTaxMappings.length === 0 ? (
          <div style={{ padding: '20px 16px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            No tax registration mappings. Add GSTIN or tax documents above, then map them to addresses and states here.
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', padding: '6px 16px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)' }}>
              {['Tax Type', 'Tax Number', 'Mapped State', 'Primary', ''].map((h) => (
                <div key={h} style={{ flex: h === '' ? '0 0 80px' : h === 'Primary' ? '0 0 70px' : 1, fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 4px' }}>{h}</div>
              ))}
            </div>
            {form.kycTaxMappings.map((t) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ flex: 1, padding: '0 4px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>{t.taxRegistrationType || '—'}</div>
                <div style={{ flex: 1, padding: '0 4px', fontSize: '12px', fontFamily: 'monospace', color: 'var(--color-text)' }}>{t.taxRegistrationNumber || '—'}</div>
                <div style={{ flex: 1, padding: '0 4px', fontSize: '12px', color: 'var(--color-text-muted)' }}>{t.mappedState || '—'}</div>
                <div style={{ flex: '0 0 70px', padding: '0 4px' }}>{t.isPrimaryTaxRegistration && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#F0FDF4', color: '#15803D' }}>Primary</span>}</div>
                {!isViewOnly && (
                  <div style={{ flex: '0 0 80px', display: 'flex', gap: '4px', padding: '0 4px' }}>
                    <button type="button" onClick={() => openEditTax(t)} style={{ ...btnOutline, height: '26px', padding: '0 10px', fontSize: '11px' }}>Edit</button>
                    <button type="button" onClick={() => removeTax(t.id)} style={{ ...btnBase, height: '26px', padding: '0 10px', fontSize: '11px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>✕</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CustomerAccordionSection>

      {/* ── KYC Document Dialog ───────────────────────────────────────────── */}
      <AppDialog
        open={docOpen}
        onClose={() => setDocOpen(false)}
        title={docEditId ? 'Edit KYC Document' : 'Add KYC Document'}
        width={720}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => setDocOpen(false)} style={btnOutline}>Cancel</button>
            <button type="button" onClick={saveDoc} style={btnPrimary}>{df.isReplacement ? 'Replace Document' : 'Save Document'}</button>
          </div>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelBase}>Document Type <Req /></label>
            <select value={df.documentType} onChange={(e) => setDf((p) => ({ ...p, documentType: e.target.value }))} style={inp}>
              <option value="">— Select —</option>
              {KYC_DOCUMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            {docErrors.documentType && <p style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px' }}>{docErrors.documentType}</p>}
          </div>
          <div>
            <label style={labelBase}>Document Number <Req /></label>
            <input value={df.documentNumber} onChange={(e) => setDf((p) => ({ ...p, documentNumber: e.target.value }))} maxLength={50} placeholder="e.g. AAAPB1234C, 22AAAA..." style={inp} />
            {docErrors.documentNumber && <p style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px' }}>{docErrors.documentNumber}</p>}
          </div>
          <div>
            <label style={labelBase}>Document Expiry Date</label>
            <input type="date" value={df.documentExpiryDate} onChange={(e) => setDf((p) => ({ ...p, documentExpiryDate: e.target.value }))} style={inp} />
          </div>
          <div>
            <label style={labelBase}>Document Status <Req /></label>
            <select value={df.documentStatus} onChange={(e) => setDf((p) => ({ ...p, documentStatus: e.target.value }))} style={inp}>
              {KYC_DOC_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            {docErrors.documentStatus && <p style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px' }}>{docErrors.documentStatus}</p>}
          </div>
          {df.documentStatus === 'Rejected' && (
            <div style={fw}>
              <label style={labelBase}>Rejection Reason <Req /></label>
              <textarea value={df.rejectionReason} onChange={(e) => setDf((p) => ({ ...p, rejectionReason: e.target.value }))} maxLength={250} rows={2} placeholder="Reason for rejection" style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
              {docErrors.rejectionReason && <p style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px' }}>{docErrors.rejectionReason}</p>}
            </div>
          )}
          <div style={fw}>
            <label style={labelBase}>Document Attachment</label>
            {df.attachmentReference ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', border: '1px solid #86EFAC', borderRadius: '8px', background: '#F0FDF4' }}>
                <span style={{ fontSize: '12px', color: '#15803D', fontWeight: 600, flex: 1 }}>{df.attachmentReference}</span>
                <button type="button" onClick={() => setDf((p) => ({ ...p, attachmentReference: '' }))} style={{ fontSize: '11px', color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Remove</button>
              </div>
            ) : (
              <div>
                <input type="file" id="kyc-doc-file" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setDf((p) => ({ ...p, attachmentReference: f.name })); }}
                />
                <label htmlFor="kyc-doc-file" style={{ ...btnOutline, height: '34px', fontSize: '12px', cursor: 'pointer' }}>Upload Document (PDF / JPG / PNG)</label>
              </div>
            )}
          </div>
          <div>
            <label style={labelBase}>Document Effective Date</label>
            <input type="date" value={df.documentEffectiveDate} onChange={(e) => setDf((p) => ({ ...p, documentEffectiveDate: e.target.value }))} style={inp} />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none', paddingTop: '22px' }}>
              <input type="checkbox" checked={df.isPrimaryDocument} onChange={(e) => setDf((p) => ({ ...p, isPrimaryDocument: e.target.checked }))} style={{ width: '14px', height: '14px', accentColor: 'var(--color-primary)' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>Primary Document</span>
            </label>
          </div>
          {df.documentStatus === 'Verified' && (
            <>
              <div>
                <label style={labelBase}>Verified By</label>
                <input value={df.verifiedBy} readOnly placeholder="System captured on verification" style={inputDisabled} />
              </div>
              <div>
                <label style={labelBase}>Verified Date / Time</label>
                <input value={df.verifiedDateTime} readOnly placeholder="System captured" style={inputDisabled} />
              </div>
            </>
          )}
          {docEditId && (
            <div style={fw}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={df.isReplacement} onChange={(e) => setDf((p) => ({ ...p, isReplacement: e.target.checked }))} style={{ width: '14px', height: '14px', accentColor: '#B45309' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#B45309' }}>Replace this document (creates new version)</span>
              </label>
              {df.isReplacement && (
                <div style={{ marginTop: '8px' }}>
                  <label style={labelBase}>Replacement Reason <Req /></label>
                  <textarea value={df.replacementReason} onChange={(e) => setDf((p) => ({ ...p, replacementReason: e.target.value }))} maxLength={250} rows={2} placeholder="Reason for replacing this document" style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
                </div>
              )}
            </div>
          )}
        </div>
      </AppDialog>

      {/* ── Tax Mapping Dialog ────────────────────────────────────────────── */}
      <AppDialog
        open={taxOpen}
        onClose={() => setTaxOpen(false)}
        title={taxEditId ? 'Edit Tax Registration Mapping' : 'Add Tax Registration Mapping'}
        width={560}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => setTaxOpen(false)} style={btnOutline}>Cancel</button>
            <button type="button" onClick={saveTax} style={btnPrimary}>Save Mapping</button>
          </div>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelBase}>Tax Registration Type</label>
            <input value={tmf.taxRegistrationType} onChange={(e) => setTmf((p) => ({ ...p, taxRegistrationType: e.target.value }))} placeholder="e.g. GSTIN, PAN, TAN" style={inputBase} />
          </div>
          <div>
            <label style={labelBase}>Tax Registration Number</label>
            <input value={tmf.taxRegistrationNumber} onChange={(e) => setTmf((p) => ({ ...p, taxRegistrationNumber: e.target.value }))} maxLength={20} placeholder="e.g. 22AAAAA0000A1Z5" style={inputBase} />
          </div>
          <div>
            <label style={labelBase}>Mapped State</label>
            <select value={tmf.mappedState} onChange={(e) => setTmf((p) => ({ ...p, mappedState: e.target.value }))} style={inputBase}>
              <option value="">— Select State —</option>
              {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={labelBase}>KYC Document</label>
            <select value={tmf.kycDocumentId} onChange={(e) => setTmf((p) => ({ ...p, kycDocumentId: e.target.value }))} style={inputBase}>
              <option value="">— Select Document —</option>
              {form.kycDocuments.map((d) => <option key={d.id} value={d.id}>{d.documentType} — {d.documentNumber}</option>)}
            </select>
          </div>
          <div style={fw}>
            <label style={labelBase}>Transaction Usage</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px', border: '1px solid var(--color-border)', borderRadius: '8px', minHeight: '42px' }}>
              {tmf.transactionUsage.map((u) => (
                <span key={u} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', background: '#EFF6FF', color: '#1D4ED8', fontSize: '11px', fontWeight: 600, borderRadius: '4px' }}>
                  {u}<button type="button" onClick={() => setTmf((p) => ({ ...p, transactionUsage: p.transactionUsage.filter((x) => x !== u) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0 1px', lineHeight: 1 }}>×</button>
                </span>
              ))}
              <select value="" onChange={(e) => { if (e.target.value && !tmf.transactionUsage.includes(e.target.value)) setTmf((p) => ({ ...p, transactionUsage: [...p.transactionUsage, e.target.value] })); }} style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '11px', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <option value="">+ Add usage…</option>
                {TRANSACTION_USAGES.filter((u) => !tmf.transactionUsage.includes(u)).map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div style={fw}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={tmf.isPrimaryTaxRegistration} onChange={(e) => setTmf((p) => ({ ...p, isPrimaryTaxRegistration: e.target.checked }))} style={{ width: '14px', height: '14px', accentColor: 'var(--color-primary)' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>Primary Tax Registration</span>
            </label>
          </div>
        </div>
      </AppDialog>
    </div>
  );
}
