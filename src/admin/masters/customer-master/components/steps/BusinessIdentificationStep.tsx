import React from 'react';
import type { Customer, CustomerKYCDocument } from '../../types/customerMaster.types';
import { INDIAN_STATES } from '../../constants/customerMaster.constants';

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
const sectionCard: React.CSSProperties = {
  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
  borderRadius: '12px', overflow: 'hidden', marginBottom: '16px',
};
const sCardHead: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '12px 16px', borderBottom: '1px solid var(--color-border)',
  background: 'var(--color-surface-subtle)',
};
const sCardBody: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px',
};
const fw: React.CSSProperties = { gridColumn: '1 / -1' };

function Req() { return <span style={{ color: '#DC2626', marginLeft: '2px' }}>*</span>; }
function Hint({ text }: { text: string }) {
  return <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px', lineHeight: 1.4 }}>{text}</p>;
}
function STitle({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{children}</span>;
}
function ReadOnly({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <label style={labelBase}>{label}</label>
      <div style={{ ...inputDisabled, padding: '9px 12px', borderRadius: '8px', fontSize: '13px', minHeight: '38px', display: 'flex', alignItems: 'center' }}>
        {value || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
      </div>
      {hint && <Hint text={hint} />}
    </div>
  );
}

// ─── Derive tax fields from KYC documents ────────────────────────────────────

function deriveFromKYC(docs: CustomerKYCDocument[]) {
  const gstin = docs.find((d) => d.documentType === 'GSTIN Certificate');
  const pan   = docs.find((d) => d.documentType === 'PAN Card');
  const reg   = docs.find((d) => d.documentType === 'Company Registration Certificate');
  return {
    taxIdType: pan ? 'PAN' : '',
    taxIdNumber: pan?.documentNumber ?? '',
    taxRegType: gstin ? 'GSTIN' : '',
    taxRegNumber: gstin?.documentNumber ?? '',
    businessRegNumber: reg?.documentNumber ?? '',
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  form: Customer;
  onChange: (updates: Partial<Customer>) => void;
  kycDocuments: CustomerKYCDocument[];
  isViewOnly: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BusinessIdentificationStep({ form, onChange, kycDocuments, isViewOnly }: Props) {
  const inp = isViewOnly ? inputDisabled : inputBase;
  const derived = deriveFromKYC(kycDocuments);

  return (
    <div>
      {/* ── Business Profile ──────────────────────────────────────────────── */}
      <div style={sectionCard}>
        <div style={sCardHead}><STitle>Business Profile</STitle></div>
        <div style={sCardBody}>
          <div>
            <label style={labelBase}>Date of Incorporation</label>
            <input type="date" value={form.dateOfIncorporation} onChange={(e) => onChange({ dateOfIncorporation: e.target.value })} disabled={isViewOnly} max={new Date().toISOString().split('T')[0]} style={inp} />
          </div>
        </div>
      </div>

      {/* ── Read-only Business & Tax Summary ─────────────────────────────── */}
      <div style={sectionCard}>
        <div style={sCardHead}>
          <STitle>Business &amp; Tax Identification</STitle>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Derived from KYC Details</span>
        </div>
        <div style={{ ...sCardBody, background: 'var(--color-surface-subtle)' }}>
          <ReadOnly label="Business Registration Number" value={derived.businessRegNumber} hint="Populated from KYC — Company Registration Certificate." />
          <div />
          <ReadOnly label="Tax Identification Type" value={derived.taxIdType} hint="Populated from KYC — PAN Card." />
          <ReadOnly label="Tax Identification Number" value={derived.taxIdNumber} hint="Populated from KYC — PAN Card number." />
          <ReadOnly label="Tax Registration Type" value={derived.taxRegType} hint="Populated from KYC — GSTIN Certificate." />
          <ReadOnly label="Tax Registration Number" value={derived.taxRegNumber} hint="Populated from KYC — GSTIN number." />
          {!derived.taxIdNumber && !derived.taxRegNumber && (
            <div style={fw}>
              <div style={{ padding: '10px 12px', background: '#EFF6FF', borderRadius: '8px', fontSize: '12px', color: '#1D4ED8', lineHeight: 1.5 }}>
                Add KYC documents (PAN Card, GSTIN Certificate, Company Registration) in the <strong>KYC Details</strong> step to populate these fields automatically.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Tax Exemption ─────────────────────────────────────────────────── */}
      <div style={sectionCard}>
        <div style={sCardHead}><STitle>Tax Exemption</STitle></div>
        <div style={sCardBody}>
          <div style={fw}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isViewOnly ? 'default' : 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={form.isTaxExempt} onChange={(e) => onChange({ isTaxExempt: e.target.checked })} disabled={isViewOnly} style={{ width: '15px', height: '15px', accentColor: 'var(--color-primary)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>Tax Exempt</span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 400 }}>— If enabled, exemption details and proof become mandatory.</span>
            </label>
          </div>

          {form.isTaxExempt && (
            <>
              <div style={fw}>
                <label style={labelBase}>Tax Exemption Reason <Req /></label>
                <textarea value={form.taxExemptionReason} onChange={(e) => onChange({ taxExemptionReason: e.target.value })} disabled={isViewOnly} maxLength={250} rows={2} placeholder="Reason for tax exemption" style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
              </div>
              <div>
                <label style={labelBase}>Effective From Date <Req /></label>
                <input type="date" value={form.taxExemptionEffectiveFrom} onChange={(e) => onChange({ taxExemptionEffectiveFrom: e.target.value })} disabled={isViewOnly} style={inp} />
              </div>
              <div>
                <label style={labelBase}>Effective To Date <Req /></label>
                <input type="date" value={form.taxExemptionEffectiveTo} onChange={(e) => onChange({ taxExemptionEffectiveTo: e.target.value })} disabled={isViewOnly} min={form.taxExemptionEffectiveFrom || undefined} style={inp} />
              </div>
              <div style={fw}>
                <label style={labelBase}>Exemption Proof Attachment <Req /></label>
                {form.taxExemptionAttachment ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: '1px solid #86EFAC', borderRadius: '8px', background: '#F0FDF4' }}>
                    <span style={{ fontSize: '12px', color: '#15803D', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.taxExemptionAttachment}</span>
                    {!isViewOnly && (
                      <button type="button" onClick={() => onChange({ taxExemptionAttachment: '' })} style={{ fontSize: '11px', color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Remove</button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="file" id="tax-exempt-attachment" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onChange({ taxExemptionAttachment: f.name });
                      }}
                    />
                    {!isViewOnly && (
                      <label htmlFor="tax-exempt-attachment" style={{ display: 'inline-flex', alignItems: 'center', padding: '0 16px', height: '34px', fontSize: '12px', fontWeight: 600, borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer' }}>
                        Upload Proof (PDF / JPG / PNG)
                      </label>
                    )}
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>No file selected</span>
                  </div>
                )}
                <Hint text="Upload exemption certificate or government notification." />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── State Mapping (for GSTIN) ──────────────────────────────────────── */}
      {derived.taxRegNumber && (
        <div style={sectionCard}>
          <div style={sCardHead}><STitle>GSTIN / Tax Registration — State Mapping</STitle></div>
          <div style={sCardBody}>
            <div>
              <label style={labelBase}>Mapped State</label>
              <select value={form.kycTaxMappings[0]?.mappedState ?? ''} onChange={(e) => {
                const existing = form.kycTaxMappings[0];
                const updated = existing
                  ? { ...existing, mappedState: e.target.value }
                  : { id: `TXM-${Date.now()}`, kycDocumentId: '', taxRegistrationType: 'GSTIN', taxRegistrationNumber: derived.taxRegNumber, addressId: '', mappedState: e.target.value, isPrimaryTaxRegistration: true, transactionUsage: [] };
                onChange({ kycTaxMappings: existing ? form.kycTaxMappings.map((m, i) => i === 0 ? updated : m) : [updated] });
              }} disabled={isViewOnly} style={isViewOnly ? inputDisabled : inputBase}>
                <option value="">— Select State —</option>
                {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isViewOnly ? 'default' : 'pointer', userSelect: 'none', paddingTop: '22px' }}>
                <input type="checkbox" checked={form.kycTaxMappings[0]?.isPrimaryTaxRegistration ?? false} onChange={(e) => {
                  const existing = form.kycTaxMappings[0];
                  if (existing) onChange({ kycTaxMappings: form.kycTaxMappings.map((m, i) => i === 0 ? { ...m, isPrimaryTaxRegistration: e.target.checked } : m) });
                }} disabled={isViewOnly} style={{ width: '14px', height: '14px', accentColor: 'var(--color-primary)' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>Primary Tax Registration</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
