import React, { useState } from 'react';
import type { CustomerConsent } from '../../types/customerMaster.types';
import {
  CONSENT_CHANNELS,
  CONSENT_PURPOSES,
  CONSENT_STATUSES,
  CONSENT_SOURCES,
  EMPTY_CONSENT,
} from '../../constants/customerMaster.constants';
import AppDialog from '../../../../../components/app/AppDialog';

// ─── Style constants ──────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: '13px',
  border: '1px solid var(--color-border)', borderRadius: '8px',
  background: 'var(--color-surface)', color: 'var(--color-text)',
  outline: 'none', boxSizing: 'border-box',
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
const fw: React.CSSProperties = { gridColumn: '1 / -1' };
const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: '0 18px', height: '34px', fontSize: '13px', fontWeight: 600,
  borderRadius: '8px', border: 'none', cursor: 'pointer',
};
const btnPrimary: React.CSSProperties = { ...btnBase, background: 'var(--color-primary)', color: '#fff' };
const btnOutline: React.CSSProperties = { ...btnBase, background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)' };

function Req() { return <span style={{ color: '#DC2626', marginLeft: '2px' }}>*</span>; }
function STitle({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{children}</span>;
}

function consentStatusColor(s: string) {
  if (s === 'Allowed')      return { bg: '#F0FDF4', color: '#15803D' };
  if (s === 'Not Allowed')  return { bg: '#FEF2F2', color: '#DC2626' };
  if (s === 'Withdrawn')    return { bg: '#FFF7ED', color: '#EA580C' };
  return { bg: '#F8FAFC', color: '#64748B' };
}

interface ConsentForm {
  consentChannel: string; consentPurpose: string; consentStatus: string;
  consentSource: string; capturedBy: string;
  withdrawalDateTime: string; withdrawalReason: string;
}
interface ConsentErrors {
  consentChannel?: string; consentPurpose?: string;
  consentStatus?: string; consentSource?: string;
}
const EMPTY_CF: ConsentForm = {
  consentChannel: '', consentPurpose: '', consentStatus: '',
  consentSource: '', capturedBy: '',
  withdrawalDateTime: '', withdrawalReason: '',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  consents: CustomerConsent[];
  onChange: (consents: CustomerConsent[]) => void;
  isViewOnly: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ConsentDetailsStep({ consents, onChange, isViewOnly }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId]         = useState<string | null>(null);
  const [cf, setCf]                 = useState<ConsentForm>(EMPTY_CF);
  const [errors, setErrors]         = useState<ConsentErrors>({});

  function openAdd() {
    setEditId(null); setCf(EMPTY_CF); setErrors({}); setDialogOpen(true);
  }

  function openEdit(c: CustomerConsent) {
    setEditId(c.id);
    setCf({ consentChannel: c.consentChannel, consentPurpose: c.consentPurpose, consentStatus: c.consentStatus, consentSource: c.consentSource, capturedBy: c.capturedBy, withdrawalDateTime: c.withdrawalDateTime, withdrawalReason: c.withdrawalReason });
    setErrors({}); setDialogOpen(true);
  }

  function save() {
    const errs: ConsentErrors = {};
    if (!cf.consentChannel)  errs.consentChannel = 'Consent Channel is required.';
    if (!cf.consentPurpose)  errs.consentPurpose = 'Consent Purpose is required.';
    if (!cf.consentStatus)   errs.consentStatus  = 'Consent Status is required.';
    if (!cf.consentSource)   errs.consentSource  = 'Consent Source is required.';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const isWithdrawn = cf.consentStatus === 'Withdrawn';
    const capturedAt = editId ? (consents.find((c) => c.id === editId)?.capturedDateTime ?? new Date().toISOString()) : new Date().toISOString();
    const entry: CustomerConsent = {
      ...EMPTY_CONSENT,
      id: editId ?? `CCON-${Date.now()}`,
      consentChannel: cf.consentChannel as CustomerConsent['consentChannel'],
      consentPurpose: cf.consentPurpose as CustomerConsent['consentPurpose'],
      consentStatus: cf.consentStatus as CustomerConsent['consentStatus'],
      capturedDateTime: capturedAt,
      consentSource: cf.consentSource as CustomerConsent['consentSource'],
      capturedBy: cf.capturedBy || 'System',
      withdrawalDateTime: isWithdrawn ? (cf.withdrawalDateTime || new Date().toISOString()) : '',
      withdrawalReason: isWithdrawn ? cf.withdrawalReason : '',
    };

    if (editId) {
      onChange(consents.map((c) => c.id === editId ? entry : c));
    } else {
      onChange([...consents, entry]);
    }
    setDialogOpen(false);
  }

  function remove(id: string) { onChange(consents.filter((c) => c.id !== id)); }

  const inp = inputBase;

  return (
    <div>
      {/* ── Info note ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '10px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', marginBottom: '16px', fontSize: '12px', color: '#1D4ED8', lineHeight: 1.5 }}>
        Consent is captured per <strong>Channel × Purpose</strong> combination. Each row records whether communication is allowed, not allowed, or has been withdrawn.
      </div>

      <div style={sectionCard}>
        <div style={sCardHead}>
          <STitle>Consent Matrix ({consents.length})</STitle>
          {!isViewOnly && (
            <button type="button" onClick={openAdd} style={{ ...btnPrimary, height: '30px', fontSize: '12px', padding: '0 14px' }}>+ Add Consent Row</button>
          )}
        </div>

        {consents.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            No consent records added. Click <strong>+ Add Consent Row</strong> to capture customer consent.
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', padding: '6px 16px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)' }}>
              {['Channel', 'Purpose', 'Status', 'Captured On', 'Source', ''].map((h) => (
                <div key={h} style={{ flex: h === '' ? '0 0 80px' : 1, fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 4px' }}>{h}</div>
              ))}
            </div>
            {consents.map((c) => {
              const sc = consentStatusColor(c.consentStatus as string);
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ flex: 1, padding: '0 4px' }}><span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#ECFEFF', color: '#0891B2' }}>{c.consentChannel}</span></div>
                  <div style={{ flex: 1, padding: '0 4px', fontSize: '12px', color: 'var(--color-text)' }}>{c.consentPurpose}</div>
                  <div style={{ flex: 1, padding: '0 4px' }}><span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: sc.bg, color: sc.color }}>{c.consentStatus}</span></div>
                  <div style={{ flex: 1, padding: '0 4px', fontSize: '11px', color: 'var(--color-text-muted)' }}>{c.capturedDateTime ? new Date(c.capturedDateTime).toLocaleDateString() : '—'}</div>
                  <div style={{ flex: 1, padding: '0 4px', fontSize: '11px', color: 'var(--color-text-muted)' }}>{c.consentSource || '—'}</div>
                  {!isViewOnly && (
                    <div style={{ flex: '0 0 80px', display: 'flex', gap: '4px', padding: '0 4px' }}>
                      <button type="button" onClick={() => openEdit(c)} style={{ ...btnOutline, height: '26px', padding: '0 10px', fontSize: '11px' }}>Edit</button>
                      <button type="button" onClick={() => remove(c.id)} style={{ ...btnBase, height: '26px', padding: '0 10px', fontSize: '11px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>✕</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add/Edit Dialog ──────────────────────────────────────────────── */}
      <AppDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editId ? 'Edit Consent Record' : 'Add Consent Record'}
        width={560}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => setDialogOpen(false)} style={btnOutline}>Cancel</button>
            <button type="button" onClick={save} style={btnPrimary}>Save</button>
          </div>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelBase}>Consent Channel <Req /></label>
            <select value={cf.consentChannel} onChange={(e) => setCf((p) => ({ ...p, consentChannel: e.target.value }))} style={inp}>
              <option value="">— Select —</option>
              {CONSENT_CHANNELS.map((c) => <option key={c}>{c}</option>)}
            </select>
            {errors.consentChannel && <p style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px' }}>{errors.consentChannel}</p>}
          </div>
          <div>
            <label style={labelBase}>Consent Purpose <Req /></label>
            <select value={cf.consentPurpose} onChange={(e) => setCf((p) => ({ ...p, consentPurpose: e.target.value }))} style={inp}>
              <option value="">— Select —</option>
              {CONSENT_PURPOSES.map((p) => <option key={p}>{p}</option>)}
            </select>
            {errors.consentPurpose && <p style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px' }}>{errors.consentPurpose}</p>}
          </div>
          <div>
            <label style={labelBase}>Consent Status <Req /></label>
            <select value={cf.consentStatus} onChange={(e) => setCf((p) => ({ ...p, consentStatus: e.target.value }))} style={inp}>
              <option value="">— Select —</option>
              {CONSENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            {errors.consentStatus && <p style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px' }}>{errors.consentStatus}</p>}
          </div>
          <div>
            <label style={labelBase}>Consent Source <Req /></label>
            <select value={cf.consentSource} onChange={(e) => setCf((p) => ({ ...p, consentSource: e.target.value }))} style={inp}>
              <option value="">— Select —</option>
              {CONSENT_SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>
            {errors.consentSource && <p style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px' }}>{errors.consentSource}</p>}
          </div>
          <div style={fw}>
            <label style={labelBase}>Captured By</label>
            <input value={cf.capturedBy} onChange={(e) => setCf((p) => ({ ...p, capturedBy: e.target.value }))} placeholder="User or system name (auto if blank)" style={inp} />
          </div>
          {cf.consentStatus === 'Withdrawn' && (
            <>
              <div>
                <label style={labelBase}>Withdrawal Date / Time</label>
                <input type="datetime-local" value={cf.withdrawalDateTime} onChange={(e) => setCf((p) => ({ ...p, withdrawalDateTime: e.target.value }))} style={inp} />
              </div>
              <div style={fw}>
                <label style={labelBase}>Withdrawal Reason</label>
                <textarea value={cf.withdrawalReason} onChange={(e) => setCf((p) => ({ ...p, withdrawalReason: e.target.value }))} maxLength={250} rows={2} placeholder="Reason for withdrawal (optional)" style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
              </div>
            </>
          )}
          {editId && (
            <div style={{ ...fw, padding: '8px 12px', background: 'var(--color-surface-subtle)', borderRadius: '8px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
              ℹ Consent Captured Date/Time is system-recorded and cannot be edited.
            </div>
          )}
        </div>
      </AppDialog>
    </div>
  );
}
