import React, { useState } from 'react';
import type { CustomerAddress } from '../../types/customerMaster.types';
import {
  CUSTOMER_ADDRESS_TYPES,
  EMPTY_ADDRESS,
  INDIAN_STATES,
} from '../../constants/customerMaster.constants';
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

// ─── Simulated Area Master lookup ─────────────────────────────────────────────

const AREA_LOOKUP: Record<string, { pinCode: string; city: string; district: string; state: string; country: string }> = {
  'Andheri West, Mumbai': { pinCode: '400058', city: 'Mumbai', district: 'Mumbai Suburban', state: 'Maharashtra', country: 'India' },
  'Koramangala, Bengaluru': { pinCode: '560034', city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', country: 'India' },
  'Banjara Hills, Hyderabad': { pinCode: '500034', city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', country: 'India' },
  'Connaught Place, Delhi': { pinCode: '110001', city: 'New Delhi', district: 'Central Delhi', state: 'Delhi', country: 'India' },
  'Anna Nagar, Chennai': { pinCode: '600040', city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', country: 'India' },
  'Salt Lake, Kolkata': { pinCode: '700064', city: 'Kolkata', district: 'North 24 Parganas', state: 'West Bengal', country: 'India' },
  'Vashi, Navi Mumbai': { pinCode: '400703', city: 'Navi Mumbai', district: 'Thane', state: 'Maharashtra', country: 'India' },
  'Gomti Nagar, Lucknow': { pinCode: '226010', city: 'Lucknow', district: 'Lucknow', state: 'Uttar Pradesh', country: 'India' },
};

const AREA_SUGGESTIONS = Object.keys(AREA_LOOKUP);

interface AddressFormType {
  addressType: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  areaLocality: string;
  pinCode: string;
  city: string;
  district: string;
  state: string;
  country: string;
  workLocation: string;
  isDefault: boolean;
  status: string;
}

interface AddressErrors {
  addressType?: string;
  addressLine1?: string;
  areaLocality?: string;
  state?: string;
  country?: string;
}

const EMPTY_ADDR_FORM: AddressFormType = {
  addressType: '', addressLine1: '', addressLine2: '', landmark: '',
  areaLocality: '', pinCode: '', city: '', district: '', state: '', country: 'India',
  workLocation: '', isDefault: false, status: 'Active',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  addresses: CustomerAddress[];
  onChange: (addresses: CustomerAddress[]) => void;
  isViewOnly: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddressDetailsStep({ addresses, onChange, isViewOnly }: Props) {
  const [dialogOpen, setDialogOpen]   = useState(false);
  const [editId, setEditId]           = useState<string | null>(null);
  const [addrForm, setAddrForm]       = useState<AddressFormType>(EMPTY_ADDR_FORM);
  const [errors, setErrors]           = useState<AddressErrors>({});
  const [areaInput, setAreaInput]     = useState('');
  const [areaSuggestions, setAreaSuggestions] = useState<string[]>([]);

  function openAdd() {
    setEditId(null);
    setAddrForm({ ...EMPTY_ADDR_FORM, isDefault: addresses.length === 0 });
    setErrors({}); setAreaInput(''); setAreaSuggestions([]);
    setDialogOpen(true);
  }

  function openEdit(a: CustomerAddress) {
    setEditId(a.id);
    setAddrForm({
      addressType: a.addressType, addressLine1: a.addressLine1, addressLine2: a.addressLine2,
      landmark: a.landmark, areaLocality: a.areaLocality, pinCode: a.pinCode,
      city: a.city, district: a.district, state: a.state, country: a.country,
      workLocation: a.workLocation, isDefault: a.isDefault, status: a.status,
    });
    setErrors({}); setAreaInput(a.areaLocality); setAreaSuggestions([]);
    setDialogOpen(true);
  }

  function handleAreaSearch(val: string) {
    setAreaInput(val);
    setAddrForm((p) => ({ ...p, areaLocality: val, pinCode: '', city: '', district: '', state: '', country: 'India' }));
    if (val.length >= 2) {
      setAreaSuggestions(AREA_SUGGESTIONS.filter((s) => s.toLowerCase().includes(val.toLowerCase())).slice(0, 5));
    } else {
      setAreaSuggestions([]);
    }
  }

  function selectArea(area: string) {
    const data = AREA_LOOKUP[area];
    setAreaInput(area);
    setAddrForm((p) => ({ ...p, areaLocality: area, ...data }));
    setAreaSuggestions([]);
  }

  function save() {
    const errs: AddressErrors = {};
    if (!addrForm.addressType)           errs.addressType = 'Address Type is required.';
    if (!addrForm.addressLine1.trim())   errs.addressLine1 = 'Address Line 1 is required.';
    if (!addrForm.areaLocality.trim())   errs.areaLocality = 'Area / Locality is required.';
    if (!addrForm.state)                 errs.state = 'State is required.';
    if (!addrForm.country)               errs.country = 'Country is required.';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const entry: CustomerAddress = {
      ...EMPTY_ADDRESS,
      id: editId ?? `CADR-${Date.now()}`,
      addressType: addrForm.addressType as CustomerAddress['addressType'],
      addressLine1: addrForm.addressLine1.trim(),
      addressLine2: addrForm.addressLine2.trim(),
      landmark: addrForm.landmark.trim(),
      areaLocality: addrForm.areaLocality.trim(),
      pinCode: addrForm.pinCode,
      city: addrForm.city,
      district: addrForm.district,
      state: addrForm.state,
      country: addrForm.country,
      workLocation: addrForm.workLocation.trim(),
      isDefault: addrForm.isDefault,
      status: addrForm.status as CustomerAddress['status'],
    };

    if (editId) {
      onChange(addresses.map((a) => {
        if (a.id === editId) return entry;
        if (entry.isDefault && a.id !== editId) return { ...a, isDefault: false };
        return a;
      }));
    } else {
      onChange([
        ...addresses.map((a) => entry.isDefault ? { ...a, isDefault: false } : a),
        entry,
      ]);
    }
    setDialogOpen(false);
  }

  function remove(id: string) { onChange(addresses.filter((a) => a.id !== id)); }

  const inp = isViewOnly ? inputDisabled : inputBase;

  return (
    <div>
      <div style={sectionCard}>
        <div style={sCardHead}>
          <STitle>Addresses ({addresses.length})</STitle>
          {!isViewOnly && (
            <button type="button" onClick={openAdd} style={{ ...btnPrimary, height: '30px', fontSize: '12px', padding: '0 14px' }}>+ Add Address</button>
          )}
        </div>

        {addresses.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            No addresses added yet. Click <strong>+ Add Address</strong> to get started.
          </div>
        ) : (
          <div>
            {/* Header row */}
            <div style={{ display: 'flex', gap: '0', padding: '6px 16px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)' }}>
              {['Type', 'Address Line 1', 'Area / Locality', 'City', 'State', 'Default', 'Status', ''].map((h) => (
                <div key={h} style={{ flex: h === '' ? '0 0 70px' : h === 'Default' || h === 'Status' ? '0 0 70px' : 1, fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 4px' }}>{h}</div>
              ))}
            </div>
            {addresses.map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0', padding: '10px 16px', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ flex: 1, padding: '0 4px' }}><span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8' }}>{a.addressType}</span></div>
                <div style={{ flex: 1, padding: '0 4px', fontSize: '12px', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.addressLine1}</div>
                <div style={{ flex: 1, padding: '0 4px', fontSize: '12px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.areaLocality || '—'}</div>
                <div style={{ flex: 1, padding: '0 4px', fontSize: '12px', color: 'var(--color-text-muted)' }}>{a.city || '—'}</div>
                <div style={{ flex: 1, padding: '0 4px', fontSize: '12px', color: 'var(--color-text-muted)' }}>{a.state || '—'}</div>
                <div style={{ flex: '0 0 70px', padding: '0 4px' }}>{a.isDefault && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#F0FDF4', color: '#15803D' }}>Default</span>}</div>
                <div style={{ flex: '0 0 70px', padding: '0 4px' }}><span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: a.status === 'Active' ? '#F0FDF4' : '#F8FAFC', color: a.status === 'Active' ? '#15803D' : '#64748B' }}>{a.status}</span></div>
                {!isViewOnly && (
                  <div style={{ flex: '0 0 70px', display: 'flex', gap: '4px', padding: '0 4px' }}>
                    <button type="button" onClick={() => openEdit(a)} style={{ ...btnOutline, height: '26px', padding: '0 10px', fontSize: '11px' }}>Edit</button>
                    <button type="button" onClick={() => remove(a.id)} style={{ ...btnBase, height: '26px', padding: '0 10px', fontSize: '11px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>✕</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Add/Edit Dialog ────────────────────────────────────────────────── */}
      <AppDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editId ? 'Edit Address' : 'Add Address'}
        width={680}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => setDialogOpen(false)} style={btnOutline}>Cancel</button>
            <button type="button" onClick={save} style={btnPrimary}>Save Address</button>
          </div>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelBase}>Address Type <Req /></label>
            <select value={addrForm.addressType} onChange={(e) => setAddrForm((p) => ({ ...p, addressType: e.target.value }))} style={inp}>
              <option value="">— Select —</option>
              {CUSTOMER_ADDRESS_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            {errors.addressType && <p style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px' }}>{errors.addressType}</p>}
          </div>
          <div />
          <div style={fw}>
            <label style={labelBase}>Address Line 1 <Req /></label>
            <input value={addrForm.addressLine1} onChange={(e) => setAddrForm((p) => ({ ...p, addressLine1: e.target.value }))} maxLength={250} placeholder="House/Building no., Street name" style={inp} />
            {errors.addressLine1 && <p style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px' }}>{errors.addressLine1}</p>}
          </div>
          <div style={fw}>
            <label style={labelBase}>Address Line 2</label>
            <input value={addrForm.addressLine2} onChange={(e) => setAddrForm((p) => ({ ...p, addressLine2: e.target.value }))} maxLength={250} placeholder="Apartment, Suite, Floor (optional)" style={inp} />
          </div>
          <div>
            <label style={labelBase}>Landmark</label>
            <input value={addrForm.landmark} onChange={(e) => setAddrForm((p) => ({ ...p, landmark: e.target.value }))} maxLength={150} placeholder="Near landmark (optional)" style={inp} />
          </div>
          <div style={{ position: 'relative' }}>
            <label style={labelBase}>Area / Locality <Req /></label>
            <input value={areaInput} onChange={(e) => handleAreaSearch(e.target.value)} maxLength={150} placeholder="Search area, locality, PIN code…" style={inp} />
            {areaSuggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', marginTop: '2px' }}>
                {areaSuggestions.map((s) => (
                  <button key={s} type="button" onClick={() => selectArea(s)} style={{ display: 'block', width: '100%', padding: '9px 12px', fontSize: '12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)' }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            {errors.areaLocality && <p style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px' }}>{errors.areaLocality}</p>}
          </div>
          <div>
            <label style={labelBase}>PIN / Postal Code</label>
            <input value={addrForm.pinCode} readOnly placeholder="Auto-filled from Area" style={inputDisabled} />
          </div>
          <div>
            <label style={labelBase}>City</label>
            <input value={addrForm.city} readOnly placeholder="Auto-filled from Area" style={inputDisabled} />
          </div>
          <div>
            <label style={labelBase}>District</label>
            <input value={addrForm.district} readOnly placeholder="Auto-filled from Area" style={inputDisabled} />
          </div>
          <div>
            <label style={labelBase}>State <Req /></label>
            <select value={addrForm.state} onChange={(e) => setAddrForm((p) => ({ ...p, state: e.target.value }))} style={inp}>
              <option value="">— Select State —</option>
              {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
            {errors.state && <p style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px' }}>{errors.state}</p>}
          </div>
          <div>
            <label style={labelBase}>Country <Req /></label>
            <input value={addrForm.country} onChange={(e) => setAddrForm((p) => ({ ...p, country: e.target.value }))} maxLength={100} placeholder="Country" style={inp} />
            {errors.country && <p style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px' }}>{errors.country}</p>}
          </div>
          <div>
            <label style={labelBase}>Work Location</label>
            <input value={addrForm.workLocation} onChange={(e) => setAddrForm((p) => ({ ...p, workLocation: e.target.value }))} maxLength={100} placeholder="Optional" style={inp} />
          </div>
          <div>
            <label style={labelBase}>Status <Req /></label>
            <select value={addrForm.status} onChange={(e) => setAddrForm((p) => ({ ...p, status: e.target.value }))} style={inp}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div style={fw}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={addrForm.isDefault} onChange={(e) => setAddrForm((p) => ({ ...p, isDefault: e.target.checked }))} style={{ width: '15px', height: '15px', accentColor: 'var(--color-primary)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>Set as Default Address</span>
            </label>
          </div>
        </div>
      </AppDialog>
    </div>
  );
}
