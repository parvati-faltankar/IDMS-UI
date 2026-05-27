import React, { useState } from 'react';
import type { CustomerFamilyMember } from '../../types/customerMaster.types';
import { FAMILY_RELATIONSHIPS, COUNTRY_CODES, EMPTY_FAMILY_MEMBER } from '../../constants/customerMaster.constants';
import AppDialog from '../../../../../components/app/AppDialog';

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

function calculateAge(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

interface FamilyForm {
  relationship: string; specifyRelationship: string; memberName: string;
  dateOfBirth: string; contactCountryCode: string; contactNumber: string;
}
interface FamilyErrors { relationship?: string; memberName?: string; specifyRelationship?: string; }

const EMPTY_FF: FamilyForm = {
  relationship: '', specifyRelationship: '', memberName: '',
  dateOfBirth: '', contactCountryCode: '', contactNumber: '',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  familyMembers: CustomerFamilyMember[];
  onChange: (members: CustomerFamilyMember[]) => void;
  isViewOnly: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FamilyDetailsStep({ familyMembers, onChange, isViewOnly }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId]         = useState<string | null>(null);
  const [ff, setFf]                 = useState<FamilyForm>(EMPTY_FF);
  const [errors, setErrors]         = useState<FamilyErrors>({});

  function openAdd() { setEditId(null); setFf(EMPTY_FF); setErrors({}); setDialogOpen(true); }
  function openEdit(m: CustomerFamilyMember) {
    setEditId(m.id);
    setFf({ relationship: m.relationship, specifyRelationship: m.specifyRelationship, memberName: m.memberName, dateOfBirth: m.dateOfBirth, contactCountryCode: m.contactCountryCode, contactNumber: m.contactNumber });
    setErrors({}); setDialogOpen(true);
  }

  function save() {
    const errs: FamilyErrors = {};
    if (!ff.relationship)                                            errs.relationship = 'Relationship is required.';
    if (!ff.memberName.trim())                                       errs.memberName = 'Member Name is required.';
    if (ff.relationship === 'Other' && !ff.specifyRelationship.trim()) errs.specifyRelationship = 'Please specify the relationship.';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const computedAge = calculateAge(ff.dateOfBirth);
    const entry: CustomerFamilyMember = {
      ...EMPTY_FAMILY_MEMBER,
      id: editId ?? `CFM-${Date.now()}`,
      relationship: ff.relationship as CustomerFamilyMember['relationship'],
      specifyRelationship: ff.relationship === 'Other' ? ff.specifyRelationship.trim() : '',
      memberName: ff.memberName.trim(),
      dateOfBirth: ff.dateOfBirth,
      age: computedAge,
      contactCountryCode: ff.contactCountryCode,
      contactNumber: ff.contactNumber,
    };

    if (editId) {
      onChange(familyMembers.map((m) => m.id === editId ? entry : m));
    } else {
      onChange([...familyMembers, entry]);
    }
    setDialogOpen(false);
  }

  function remove(id: string) { onChange(familyMembers.filter((m) => m.id !== id)); }

  const inp = inputBase;

  return (
    <div>
      {/* ── Info banner ───────────────────────────────────────────────────── */}
      <div style={{ padding: '10px 14px', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '10px', marginBottom: '16px', fontSize: '12px', color: '#15803D', lineHeight: 1.5 }}>
        Family Details are applicable for <strong>Retail Individual</strong> customers only. Adding family information is optional.
      </div>

      <div style={sectionCard}>
        <div style={sCardHead}>
          <STitle>Family Members ({familyMembers.length})</STitle>
          {!isViewOnly && (
            <button type="button" onClick={openAdd} style={{ ...btnPrimary, height: '30px', fontSize: '12px', padding: '0 14px' }}>+ Add Member</button>
          )}
        </div>

        {familyMembers.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            No family members added. Click <strong>+ Add Member</strong> to add family information.
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', padding: '6px 16px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)' }}>
              {['Relationship', 'Member Name', 'Date of Birth', 'Age', 'Contact Number', ''].map((h) => (
                <div key={h} style={{ flex: h === '' ? '0 0 80px' : h === 'Age' ? '0 0 60px' : 1, fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 4px' }}>{h}</div>
              ))}
            </div>
            {familyMembers.map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ flex: 1, padding: '0 4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#F5F3FF', color: '#7C3AED' }}>
                    {m.relationship === 'Other' ? m.specifyRelationship || 'Other' : m.relationship}
                  </span>
                </div>
                <div style={{ flex: 1, padding: '0 4px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>{m.memberName}</div>
                <div style={{ flex: 1, padding: '0 4px', fontSize: '11px', color: 'var(--color-text-muted)' }}>{m.dateOfBirth || '—'}</div>
                <div style={{ flex: '0 0 60px', padding: '0 4px', fontSize: '12px', color: 'var(--color-text)' }}>{m.age !== null ? m.age : '—'}</div>
                <div style={{ flex: 1, padding: '0 4px', fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{m.contactNumber || '—'}</div>
                {!isViewOnly && (
                  <div style={{ flex: '0 0 80px', display: 'flex', gap: '4px', padding: '0 4px' }}>
                    <button type="button" onClick={() => openEdit(m)} style={{ ...btnOutline, height: '26px', padding: '0 10px', fontSize: '11px' }}>Edit</button>
                    <button type="button" onClick={() => remove(m.id)} style={{ ...btnBase, height: '26px', padding: '0 10px', fontSize: '11px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>✕</button>
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
        title={editId ? 'Edit Family Member' : 'Add Family Member'}
        width={520}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => setDialogOpen(false)} style={btnOutline}>Cancel</button>
            <button type="button" onClick={save} style={btnPrimary}>Save</button>
          </div>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelBase}>Relationship <Req /></label>
            <select value={ff.relationship} onChange={(e) => setFf((p) => ({ ...p, relationship: e.target.value }))} style={inp}>
              <option value="">— Select —</option>
              {FAMILY_RELATIONSHIPS.map((r) => <option key={r}>{r}</option>)}
            </select>
            {errors.relationship && <p style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px' }}>{errors.relationship}</p>}
          </div>
          {ff.relationship === 'Other' && (
            <div>
              <label style={labelBase}>Specify Relationship <Req /></label>
              <input value={ff.specifyRelationship} onChange={(e) => setFf((p) => ({ ...p, specifyRelationship: e.target.value }))} maxLength={100} placeholder="e.g. Uncle, Cousin" style={inp} />
              {errors.specifyRelationship && <p style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px' }}>{errors.specifyRelationship}</p>}
            </div>
          )}
          <div style={fw}>
            <label style={labelBase}>Family Member Name <Req /></label>
            <input value={ff.memberName} onChange={(e) => setFf((p) => ({ ...p, memberName: e.target.value }))} maxLength={150} placeholder="Full name" style={inp} />
            {errors.memberName && <p style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px' }}>{errors.memberName}</p>}
          </div>
          <div>
            <label style={labelBase}>Date of Birth</label>
            <input type="date" value={ff.dateOfBirth} onChange={(e) => setFf((p) => ({ ...p, dateOfBirth: e.target.value }))} max={new Date().toISOString().split('T')[0]} style={inp} />
          </div>
          <div>
            <label style={labelBase}>Age (auto-calculated)</label>
            <input value={ff.dateOfBirth ? (calculateAge(ff.dateOfBirth) !== null ? String(calculateAge(ff.dateOfBirth)) : '') : ''} readOnly placeholder="Calculated from DOB" style={inputDisabled} />
          </div>
          <div>
            <label style={labelBase}>Contact Country Code</label>
            <select value={ff.contactCountryCode} onChange={(e) => setFf((p) => ({ ...p, contactCountryCode: e.target.value }))} style={inp}>
              <option value="">— Select —</option>
              {COUNTRY_CODES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelBase}>Contact Number</label>
            <input value={ff.contactNumber} onChange={(e) => setFf((p) => ({ ...p, contactNumber: e.target.value }))} maxLength={15} placeholder="Mobile number" style={inp} />
          </div>
        </div>
      </AppDialog>
    </div>
  );
}
