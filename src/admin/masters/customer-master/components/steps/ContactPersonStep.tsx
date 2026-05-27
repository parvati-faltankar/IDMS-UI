import React, { useState } from 'react';
import type { CustomerContact } from '../../types/customerMaster.types';
import { CONTACT_ROLES, LANGUAGES, COUNTRY_CODES, EMPTY_CONTACT } from '../../constants/customerMaster.constants';
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

interface ContactForm {
  contactName: string; designationRole: string; department: string;
  mobileCountryCode: string; mobileNumber: string; emailId: string;
  isPreferred: boolean; status: string; preferredLanguage: string;
}
interface ContactErrors { contactName?: string; status?: string; }

const EMPTY_CF: ContactForm = {
  contactName: '', designationRole: '', department: '',
  mobileCountryCode: '+91 (India)', mobileNumber: '', emailId: '',
  isPreferred: false, status: 'Active', preferredLanguage: '',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  contacts: CustomerContact[];
  onChange: (contacts: CustomerContact[]) => void;
  isViewOnly: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ContactPersonStep({ contacts, onChange, isViewOnly }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId]         = useState<string | null>(null);
  const [cf, setCf]                 = useState<ContactForm>(EMPTY_CF);
  const [errors, setErrors]         = useState<ContactErrors>({});

  function openAdd() {
    setEditId(null);
    setCf({ ...EMPTY_CF, isPreferred: contacts.length === 0 });
    setErrors({}); setDialogOpen(true);
  }

  function openEdit(c: CustomerContact) {
    setEditId(c.id);
    setCf({ contactName: c.contactName, designationRole: c.designationRole, department: c.department, mobileCountryCode: c.mobileCountryCode, mobileNumber: c.mobileNumber, emailId: c.emailId, isPreferred: c.isPreferred, status: c.status, preferredLanguage: c.preferredLanguage });
    setErrors({}); setDialogOpen(true);
  }

  function save() {
    const errs: ContactErrors = {};
    if (!cf.contactName.trim()) errs.contactName = 'Contact Name is required.';
    if (!cf.status)             errs.status = 'Status is required.';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const entry: CustomerContact = {
      ...EMPTY_CONTACT,
      id: editId ?? `CCON-${Date.now()}`,
      contactName: cf.contactName.trim(),
      designationRole: cf.designationRole,
      department: cf.department.trim(),
      mobileCountryCode: cf.mobileCountryCode,
      mobileNumber: cf.mobileNumber,
      emailId: cf.emailId.toLowerCase().trim(),
      isPreferred: cf.isPreferred,
      status: cf.status as CustomerContact['status'],
      preferredLanguage: cf.preferredLanguage,
    };

    if (editId) {
      onChange(contacts.map((c) => {
        if (c.id === editId) return entry;
        if (entry.isPreferred && c.id !== editId) return { ...c, isPreferred: false };
        return c;
      }));
    } else {
      onChange([
        ...contacts.map((c) => entry.isPreferred ? { ...c, isPreferred: false } : c),
        entry,
      ]);
    }
    setDialogOpen(false);
  }

  function remove(id: string) { onChange(contacts.filter((c) => c.id !== id)); }

  const inp = inputBase;

  return (
    <div>
      <div style={sectionCard}>
        <div style={sCardHead}>
          <STitle>Contact Persons ({contacts.length})</STitle>
          {!isViewOnly && (
            <button type="button" onClick={openAdd} style={{ ...btnPrimary, height: '30px', fontSize: '12px', padding: '0 14px' }}>+ Add Contact</button>
          )}
        </div>

        {contacts.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            No contacts added yet. Click <strong>+ Add Contact</strong> to add a contact person.
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', padding: '6px 16px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)' }}>
              {['Name', 'Role', 'Mobile', 'Email', 'Preferred', 'Status', ''].map((h) => (
                <div key={h} style={{ flex: h === '' ? '0 0 80px' : h === 'Preferred' || h === 'Status' ? '0 0 80px' : 1, fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 4px' }}>{h}</div>
              ))}
            </div>
            {contacts.map((c) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ flex: 1, padding: '0 4px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>{c.contactName}</div>
                <div style={{ flex: 1, padding: '0 4px' }}>
                  {c.designationRole && <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8' }}>{c.designationRole}</span>}
                </div>
                <div style={{ flex: 1, padding: '0 4px', fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{c.mobileNumber || '—'}</div>
                <div style={{ flex: 1, padding: '0 4px', fontSize: '12px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.emailId || '—'}</div>
                <div style={{ flex: '0 0 80px', padding: '0 4px' }}>{c.isPreferred && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#F0FDF4', color: '#15803D' }}>★ Preferred</span>}</div>
                <div style={{ flex: '0 0 80px', padding: '0 4px' }}><span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: c.status === 'Active' ? '#F0FDF4' : '#F8FAFC', color: c.status === 'Active' ? '#15803D' : '#64748B' }}>{c.status}</span></div>
                {!isViewOnly && (
                  <div style={{ flex: '0 0 80px', display: 'flex', gap: '4px', padding: '0 4px' }}>
                    <button type="button" onClick={() => openEdit(c)} style={{ ...btnOutline, height: '26px', padding: '0 10px', fontSize: '11px' }}>Edit</button>
                    <button type="button" onClick={() => remove(c.id)} style={{ ...btnBase, height: '26px', padding: '0 10px', fontSize: '11px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>✕</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Add/Edit Dialog ──────────────────────────────────────────────── */}
      <AppDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editId ? 'Edit Contact Person' : 'Add Contact Person'}
        width={600}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => setDialogOpen(false)} style={btnOutline}>Cancel</button>
            <button type="button" onClick={save} style={btnPrimary}>Save Contact</button>
          </div>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={fw}>
            <label style={labelBase}>Contact Person Name <Req /></label>
            <input value={cf.contactName} onChange={(e) => setCf((p) => ({ ...p, contactName: e.target.value }))} maxLength={150} placeholder="Full name" style={inp} />
            {errors.contactName && <p style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px' }}>{errors.contactName}</p>}
          </div>
          <div>
            <label style={labelBase}>Designation / Role</label>
            <select value={cf.designationRole} onChange={(e) => setCf((p) => ({ ...p, designationRole: e.target.value }))} style={inp}>
              <option value="">— Select Role —</option>
              {CONTACT_ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={labelBase}>Department</label>
            <input value={cf.department} onChange={(e) => setCf((p) => ({ ...p, department: e.target.value }))} maxLength={100} placeholder="Department name" style={inp} />
          </div>
          <div>
            <label style={labelBase}>Mobile Country Code</label>
            <select value={cf.mobileCountryCode} onChange={(e) => setCf((p) => ({ ...p, mobileCountryCode: e.target.value }))} style={inp}>
              <option value="">— Select —</option>
              {COUNTRY_CODES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelBase}>Mobile Number</label>
            <input value={cf.mobileNumber} onChange={(e) => setCf((p) => ({ ...p, mobileNumber: e.target.value }))} maxLength={15} placeholder="Mobile number" style={inp} />
          </div>
          <div>
            <label style={labelBase}>Email ID</label>
            <input type="email" value={cf.emailId} onChange={(e) => setCf((p) => ({ ...p, emailId: e.target.value }))} maxLength={150} placeholder="contact@example.com" style={inp} />
          </div>
          <div>
            <label style={labelBase}>Preferred Language</label>
            <select value={cf.preferredLanguage} onChange={(e) => setCf((p) => ({ ...p, preferredLanguage: e.target.value }))} style={inp}>
              <option value="">— Select —</option>
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={labelBase}>Status <Req /></label>
            <select value={cf.status} onChange={(e) => setCf((p) => ({ ...p, status: e.target.value }))} style={inp}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            {errors.status && <p style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px' }}>{errors.status}</p>}
          </div>
          <div style={fw}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={cf.isPreferred} onChange={(e) => setCf((p) => ({ ...p, isPreferred: e.target.checked }))} style={{ width: '15px', height: '15px', accentColor: 'var(--color-primary)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>Preferred Contact</span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 400 }}>— Primary contact for communications</span>
            </label>
          </div>
        </div>
      </AppDialog>
    </div>
  );
}
