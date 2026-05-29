import React, { useState } from 'react';
import type { CustomerAddress } from '../../types/customerMaster.types';
import {
  CUSTOMER_ADDRESS_TYPES,
  EMPTY_ADDRESS,
} from '../../constants/customerMaster.constants';
import { AddressPickerDrawer, type AddressFormValue } from '../../../../../experience/components/AddressPickerDrawer/AddressPickerDrawer';

// ─── Style constants ──────────────────────────────────────────────────────────



const sectionCard: React.CSSProperties = {
  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
  borderRadius: '12px', overflow: 'hidden', marginBottom: '16px',
};
const sCardHead: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '12px 16px', borderBottom: '1px solid var(--color-border)',
  background: 'var(--color-surface-subtle)',
};

const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: '0 18px', height: '34px', fontSize: '13px', fontWeight: 600,
  borderRadius: '8px', border: 'none', cursor: 'pointer',
};
const btnPrimary: React.CSSProperties = { ...btnBase, background: 'var(--color-primary)', color: '#fff' };
const btnOutline: React.CSSProperties = { ...btnBase, background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)' };

function STitle({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{children}</span>;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  addresses: CustomerAddress[];
  onChange: (addresses: CustomerAddress[]) => void;
  isViewOnly: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddressDetailsStep({ addresses, onChange, isViewOnly }: Props) {
  const [pickerOpen, setPickerOpen]         = useState(false);
  const [editId, setEditId]                 = useState<string | null>(null);
  const [pickerValue, setPickerValue]       = useState<AddressFormValue | null>(null);

  function openAdd() {
    setEditId(null);
    setPickerValue(null);
    setPickerOpen(true);
  }

  function openEdit(a: CustomerAddress) {
    setEditId(a.id);
    setPickerValue({
      addressType: a.addressType,
      addressLine1: a.addressLine1,
      addressLine2: a.addressLine2,
      landmark: a.landmark,
      areaLocality: a.areaId ? a.areaLocality : '',
      areaId: a.areaId ?? '',
      pinCode: a.pinCode,
      city: a.city,
      state: a.state,
      country: a.country,
      latitude: '',
      longitude: '',
      isDefault: a.isDefault,
      isManualEntry: a.isManualEntry ?? !a.areaId,
      status: a.status,
    });
    setPickerOpen(true);
  }

  function saveAddress(value: AddressFormValue) {
    const entry: CustomerAddress = {
      ...EMPTY_ADDRESS,
      id: editId ?? `CADR-${crypto.randomUUID()}`,
      addressType: value.addressType as CustomerAddress['addressType'],
      addressLine1: value.addressLine1,
      addressLine2: value.addressLine2,
      landmark: value.landmark,
      areaLocality: value.areaLocality || value.city,
      pinCode: value.pinCode,
      city: value.city,
      district: '',
      state: value.state,
      country: value.country,
      workLocation: '',
      isDefault: value.isDefault,
      status: value.status as CustomerAddress['status'],
      areaId: value.areaId || undefined,
      isManualEntry: value.isManualEntry,
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
    setPickerOpen(false);
  }

  function remove(id: string) { onChange(addresses.filter((a) => a.id !== id)); }

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

      <AddressPickerDrawer
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSave={saveAddress}
        editingValue={pickerValue}
        addressTypeOptions={CUSTOMER_ADDRESS_TYPES}
        defaultChecked={addresses.length === 0}
        title={editId ? 'Edit Address' : 'Add Address'}
      />
    </div>
  );
}
