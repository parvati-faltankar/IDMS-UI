// ─── AddressPickerDrawer ──────────────────────────────────────────────────────
// Shared address-entry drawer backed by the Area Master.
// Replaces free-text State/City/Area fields across all entity forms.
//
// Behaviour:
//  • User types in the Area/Locality search box — searchAreas() fires with debounce
//  • Selecting an area resolves the full hierarchy (Country → State → City → Area)
//    and auto-fills + locks PIN, Lat, Lng from the master record
//  • "+ Enter address manually" escape hatch: switches all fields to free-text
//    and sets isManualEntry = true, showing an Unverified badge
//  • Address Line 1, Line 2, Landmark always remain free text
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin, Lock, AlertTriangle, X, Search } from 'lucide-react';
import { areaService } from '../../../admin/masters/area-master/services/areaService';
import type { Area } from '../../../admin/masters/area-master/types/areaMaster.types';

// ─── Public surface ───────────────────────────────────────────────────────────

export interface AddressFormValue {
  addressType: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  /** Selected area name — shown as display value */
  areaLocality: string;
  /** Area Master id, present when master-linked */
  areaId: string;
  pinCode: string;
  city: string;
  state: string;
  country: string;
  latitude: string;
  longitude: string;
  isDefault: boolean;
  isManualEntry: boolean;
  status: 'Active' | 'Inactive';
}

export const EMPTY_ADDRESS_FORM: AddressFormValue = {
  addressType: '',
  addressLine1: '',
  addressLine2: '',
  landmark: '',
  areaLocality: '',
  areaId: '',
  pinCode: '',
  city: '',
  state: '',
  country: '',
  latitude: '',
  longitude: '',
  isDefault: false,
  isManualEntry: false,
  status: 'Active',
};

export interface AddressFormErrors {
  addressType?: string;
  addressLine1?: string;
  areaLocality?: string;
  state?: string;
  country?: string;
}

export interface AddressPickerDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Called when the form is saved; caller persists the result */
  onSave: (value: AddressFormValue) => void;
  /** Pass the address being edited, or undefined for a new address */
  editingValue?: AddressFormValue | null;
  /** Address type options to show in the dropdown */
  addressTypeOptions: readonly string[];
  /** True → show default checkbox ticked by default (first address) */
  defaultChecked?: boolean;
  /** Title override */
  title?: string;
}

// ─── Style constants ──────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: '13px',
  border: '1px solid var(--color-border)', borderRadius: '8px',
  background: 'var(--color-surface)', color: 'var(--color-text)',
  outline: 'none', boxSizing: 'border-box',
};
const inputError: React.CSSProperties = { ...inputBase, border: '1px solid #EF4444' };
const inputLocked: React.CSSProperties = {
  ...inputBase,
  background: 'var(--color-surface-subtle)',
  color: 'var(--color-text-muted)',
  cursor: 'not-allowed',
};
const labelBase: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 600,
  color: 'var(--color-text-muted)', marginBottom: '5px',
  textTransform: 'uppercase', letterSpacing: '0.03em',
};
const errText: React.CSSProperties = { fontSize: '11px', color: '#EF4444', marginTop: '3px' };
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' };
const fw: React.CSSProperties = { gridColumn: '1 / -1' };

function Req() {
  return <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>;
}

// ─── Debounce hook ────────────────────────────────────────────────────────────

function useDebounced<T>(value: T, delayMs = 220): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

// ─── Verified / Unverified badge ──────────────────────────────────────────────

function VerificationBadge({ isManual }: { isManual: boolean }) {
  if (isManual) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px',
        background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A',
      }}>
        <AlertTriangle size={11} /> Unverified
      </span>
    );
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px',
      background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0',
    }}>
      <MapPin size={11} /> Area Master
    </span>
  );
}

// ─── Area search dropdown ─────────────────────────────────────────────────────

interface AreaSearchProps {
  value: string;
  onChange: (raw: string) => void;
  onSelect: (area: Area) => void;
  hasError: boolean;
}

function AreaSearchField({ value, onChange, onSelect, hasError }: AreaSearchProps) {
  const [results, setResults] = useState<Area[]>([]);
  const debouncedQuery = useDebounced(value);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedQuery.trim().length >= 1) {
      setResults(areaService.searchAreas(debouncedQuery));
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setResults([]);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function handleSelect(area: Area) {
    setResults([]);
    onSelect(area);
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search area, locality, PIN…"
          style={{
            ...(hasError ? inputError : inputBase),
            paddingLeft: '30px',
          }}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          marginTop: '3px', overflow: 'hidden', maxHeight: '220px', overflowY: 'auto',
        }}>
          {results.map((area) => (
            <button
              key={area.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(area); }}
              style={{
                display: 'block', width: '100%', padding: '9px 12px', fontSize: '13px',
                textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-subtle)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
            >
              <span style={{ fontWeight: 600 }}>{area.areaName}</span>
              {area.hierarchyPath && area.hierarchyPath !== area.areaName && (
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginLeft: '6px' }}>
                  {area.hierarchyPath}
                </span>
              )}
              {area.postalCode && (
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginLeft: '6px' }}>
                  — {area.postalCode}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AddressPickerDrawer({
  open,
  onClose,
  onSave,
  editingValue,
  addressTypeOptions,
  defaultChecked = false,
  title,
}: AddressPickerDrawerProps) {
  const [form, setForm] = useState<AddressFormValue>({ ...EMPTY_ADDRESS_FORM });
  const [errors, setErrors] = useState<AddressFormErrors>({});

  // Reset form each time drawer opens
  useEffect(() => {
    if (!open) return;
    if (editingValue) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({ ...editingValue });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({ ...EMPTY_ADDRESS_FORM, isDefault: defaultChecked });
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setErrors({});
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const setField = useCallback(<K extends keyof AddressFormValue>(k: K, v: AddressFormValue[K]) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    if (errors[k as keyof AddressFormErrors]) {
      setErrors((prev) => ({ ...prev, [k]: undefined }));
    }
  }, [errors]);

  // ── Area selection ──────────────────────────────────────────────────────
  function handleAreaSelect(area: Area) {
    const resolved = areaService.resolveAddressFields(area.id);
    setForm((prev) => ({
      ...prev,
      areaId: resolved.areaId,
      areaLocality: resolved.areaName,
      city: resolved.city,
      state: resolved.state,
      country: resolved.country || 'India',
      pinCode: resolved.postalCode,
      latitude: resolved.latitude != null ? String(resolved.latitude) : '',
      longitude: resolved.longitude != null ? String(resolved.longitude) : '',
      isManualEntry: false,
    }));
    setErrors((prev) => ({ ...prev, areaLocality: undefined, state: undefined, country: undefined }));
  }

  function handleAreaSearchChange(raw: string) {
    // If user clears the field, also clear the resolved hierarchy
    setForm((prev) => ({
      ...prev,
      areaLocality: raw,
      areaId: '',
      city: '',
      state: '',
      country: '',
      pinCode: '',
      latitude: '',
      longitude: '',
    }));
  }

  // ── Manual entry toggle ─────────────────────────────────────────────────
  function enableManualEntry() {
    setForm((prev) => ({
      ...prev,
      areaId: '',
      isManualEntry: true,
    }));
  }

  function backToAreaSearch() {
    setForm((prev) => ({
      ...prev,
      areaLocality: '',
      areaId: '',
      city: '',
      state: '',
      country: '',
      pinCode: '',
      latitude: '',
      longitude: '',
      isManualEntry: false,
    }));
    setErrors({});
  }

  // ── Save ────────────────────────────────────────────────────────────────
  function handleSave() {
    const errs: AddressFormErrors = {};
    if (!form.addressType) errs.addressType = 'Address type is required.';
    if (!form.addressLine1.trim()) errs.addressLine1 = 'Address line 1 is required.';

    if (form.isManualEntry) {
      if (!form.areaLocality.trim()) errs.areaLocality = 'Area / Locality is required.';
      if (!form.state.trim()) errs.state = 'State is required.';
      if (!form.country.trim()) errs.country = 'Country is required.';
    } else {
      if (!form.areaId) errs.areaLocality = 'Please select an area from the list, or choose "Enter manually".';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSave({ ...form });
  }

  if (!open) return null;

  const isLinked = !!form.areaId && !form.isManualEntry;
  const drawerTitle = title ?? (editingValue ? 'Edit Address' : 'Add Address');

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1200,
          background: 'rgba(0,0,0,0.35)',
        }}
      />

      {/* Drawer panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 1201,
        width: '520px', maxWidth: '95vw',
        background: 'var(--color-surface)',
        boxShadow: '-4px 0 32px rgba(0,0,0,0.16)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MapPin size={18} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>{drawerTitle}</span>
            <VerificationBadge isManual={form.isManualEntry} />
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={grid2}>

            {/* Address Type */}
            <div>
              <label style={labelBase}>Address Type<Req /></label>
              <select
                value={form.addressType}
                onChange={(e) => setField('addressType', e.target.value)}
                style={errors.addressType ? inputError : inputBase}
              >
                <option value="">— Select —</option>
                {addressTypeOptions.map((t) => <option key={t}>{t}</option>)}
              </select>
              {errors.addressType && <p style={errText}>{errors.addressType}</p>}
            </div>

            <div /> {/* spacer */}

            {/* Address Line 1 */}
            <div style={fw}>
              <label style={labelBase}>Address Line 1<Req /></label>
              <input
                type="text"
                value={form.addressLine1}
                onChange={(e) => setField('addressLine1', e.target.value)}
                maxLength={250}
                placeholder="Street / Building name"
                style={errors.addressLine1 ? inputError : inputBase}
              />
              {errors.addressLine1 && <p style={errText}>{errors.addressLine1}</p>}
            </div>

            {/* Address Line 2 */}
            <div style={fw}>
              <label style={labelBase}>Address Line 2</label>
              <input
                type="text"
                value={form.addressLine2}
                onChange={(e) => setField('addressLine2', e.target.value)}
                maxLength={250}
                placeholder="Area / Locality (optional)"
                style={inputBase}
              />
            </div>

            {/* Landmark */}
            <div style={fw}>
              <label style={labelBase}>Landmark</label>
              <input
                type="text"
                value={form.landmark}
                onChange={(e) => setField('landmark', e.target.value)}
                maxLength={150}
                placeholder="Near landmark (optional)"
                style={inputBase}
              />
            </div>

            {/* ── Area / Locality ─────────────────────────────────────── */}
            <div style={fw}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                <label style={{ ...labelBase, marginBottom: 0 }}>Area / Locality<Req /></label>
                {form.isManualEntry ? (
                  <button
                    type="button"
                    onClick={backToAreaSearch}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600, padding: 0 }}
                  >
                    ← Back to area search
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={enableManualEntry}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600, padding: 0 }}
                  >
                    + Enter address manually
                  </button>
                )}
              </div>

              {form.isManualEntry ? (
                <input
                  type="text"
                  value={form.areaLocality}
                  onChange={(e) => setField('areaLocality', e.target.value)}
                  maxLength={150}
                  placeholder="Area / Locality"
                  style={errors.areaLocality ? inputError : inputBase}
                />
              ) : (
                <AreaSearchField
                  value={form.areaLocality}
                  onChange={handleAreaSearchChange}
                  onSelect={handleAreaSelect}
                  hasError={!!errors.areaLocality}
                />
              )}
              {errors.areaLocality && <p style={errText}>{errors.areaLocality}</p>}

              {/* Resolved hierarchy pills */}
              {isLinked && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                  {[form.country, form.state, form.city, form.areaLocality].filter(Boolean).map((label, i) => (
                    <span key={i} style={{
                      fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '9999px',
                      background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                    }}>
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* PIN / Zip */}
            <div>
              <label style={labelBase}>PIN / Zip</label>
              {isLinked ? (
                <div style={{ position: 'relative' }}>
                  <input value={form.pinCode || '—'} readOnly style={inputLocked} />
                  <Lock size={12} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                </div>
              ) : (
                <input
                  type="text"
                  value={form.pinCode}
                  onChange={(e) => setField('pinCode', e.target.value)}
                  maxLength={10}
                  placeholder="PIN Code"
                  style={inputBase}
                />
              )}
            </div>

            {/* City — auto-filled when linked */}
            <div>
              <label style={labelBase}>City</label>
              {isLinked ? (
                <div style={{ position: 'relative' }}>
                  <input value={form.city || '—'} readOnly style={inputLocked} />
                  <Lock size={12} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                </div>
              ) : (
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setField('city', e.target.value)}
                  maxLength={100}
                  placeholder="City"
                  style={inputBase}
                />
              )}
            </div>

            {/* State */}
            <div>
              <label style={labelBase}>State<Req /></label>
              {isLinked ? (
                <div style={{ position: 'relative' }}>
                  <input value={form.state || '—'} readOnly style={inputLocked} />
                  <Lock size={12} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                </div>
              ) : (
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setField('state', e.target.value)}
                  maxLength={100}
                  placeholder="State / Province"
                  style={errors.state ? inputError : inputBase}
                />
              )}
              {errors.state && <p style={errText}>{errors.state}</p>}
            </div>

            {/* Country */}
            <div>
              <label style={labelBase}>Country<Req /></label>
              {isLinked ? (
                <div style={{ position: 'relative' }}>
                  <input value={form.country || '—'} readOnly style={inputLocked} />
                  <Lock size={12} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                </div>
              ) : (
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setField('country', e.target.value)}
                  maxLength={100}
                  placeholder="Country"
                  style={errors.country ? inputError : inputBase}
                />
              )}
              {errors.country && <p style={errText}>{errors.country}</p>}
            </div>

            {/* Lat / Lng — shown as compact read-only when area-linked */}
            {isLinked && (form.latitude || form.longitude) && (
              <div style={{ ...fw, display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelBase}>Latitude</label>
                  <div style={{ position: 'relative' }}>
                    <input value={form.latitude || '—'} readOnly style={inputLocked} />
                    <Lock size={12} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelBase}>Longitude</label>
                  <div style={{ position: 'relative' }}>
                    <input value={form.longitude || '—'} readOnly style={inputLocked} />
                    <Lock size={12} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Manual lat/lng entry */}
            {form.isManualEntry && (
              <>
                <div>
                  <label style={labelBase}>Latitude</label>
                  <input
                    type="text"
                    value={form.latitude}
                    onChange={(e) => setField('latitude', e.target.value)}
                    placeholder="-90 to +90"
                    style={inputBase}
                  />
                </div>
                <div>
                  <label style={labelBase}>Longitude</label>
                  <input
                    type="text"
                    value={form.longitude}
                    onChange={(e) => setField('longitude', e.target.value)}
                    placeholder="-180 to +180"
                    style={inputBase}
                  />
                </div>
              </>
            )}

            {/* Status */}
            <div>
              <label style={labelBase}>Status</label>
              <select
                value={form.status}
                onChange={(e) => setField('status', e.target.value as 'Active' | 'Inactive')}
                style={inputBase}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Default checkbox */}
            <div style={fw}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setField('isDefault', e.target.checked)}
                  style={{ width: '15px', height: '15px', accentColor: 'var(--color-primary)' }}
                />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>Set as Default Address</span>
              </label>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px', borderTop: '1px solid var(--color-border)',
          display: 'flex', justifyContent: 'flex-end', gap: '10px',
          background: 'var(--color-surface)',
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              height: '36px', padding: '0 18px', fontSize: '13px', fontWeight: 600,
              borderRadius: '8px', background: 'transparent', border: '1px solid var(--color-border)',
              color: 'var(--color-text)', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              height: '36px', padding: '0 20px', fontSize: '13px', fontWeight: 700,
              borderRadius: '8px', background: 'var(--color-primary)', border: 'none',
              color: '#fff', cursor: 'pointer',
            }}
          >
            {editingValue ? 'Save Changes' : 'Add Address'}
          </button>
        </div>
      </div>
    </>
  );
}
