import React, { useState } from 'react';
import type { BPTransporterConfig, BPRouteCapability, BPVehicleCapability } from '../../types/supplierMaster.types';
import { TRANSPORTER_PICKLISTS } from '../../constants/supplierMaster.constants';
import AppDialog from '../../../../../components/app/AppDialog';

// ─── Style constants ──────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: '13px',
  border: '1px solid var(--color-border)', borderRadius: '8px',
  background: 'var(--color-surface)', color: 'var(--color-text)',
  outline: 'none', boxSizing: 'border-box',
};
const labelBase: React.CSSProperties = {
  fontSize: '12px', fontWeight: 600, color: 'var(--color-text)',
  display: 'block', marginBottom: '6px',
};
const fw: React.CSSProperties = { marginBottom: '14px' };
const sectionCard: React.CSSProperties = {
  border: '1px solid var(--color-border)', borderRadius: '12px',
  overflow: 'hidden', marginBottom: '20px',
};
const sCardHead: React.CSSProperties = {
  padding: '12px 20px', borderBottom: '1px solid var(--color-border)',
  background: 'var(--color-surface-subtle)',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
};
const sCardBody: React.CSSProperties = { padding: '20px 24px', background: 'var(--color-surface)' };
const twoCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const threeCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' };
const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  fontSize: '13px', fontWeight: 600, borderRadius: '8px', cursor: 'pointer', border: 'none',
};
const btnPrimary: React.CSSProperties = { ...btnBase, padding: '9px 18px', background: 'var(--color-primary)', color: 'white' };
const btnOutline: React.CSSProperties = { ...btnBase, padding: '9px 18px', fontWeight: 500, background: 'transparent', color: 'var(--color-text)', border: '1px solid var(--color-border)' };

// ─── Inner helpers ────────────────────────────────────────────────────────────

function Req() {
  return <span style={{ color: '#DC2626' }}> *</span>;
}

function FieldHint({ text }: { text: string }) {
  return <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>{text}</p>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>{children}</span>;
}

// Chip-toggle: wrapping row of toggle chips for small fixed option lists
function ChipToggle({
  options, selected, onChange, disabled,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  disabled: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {options.map((o) => {
        const isSel = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            disabled={disabled}
            onClick={() => onChange(isSel ? selected.filter((s) => s !== o) : [...selected, o])}
            style={{
              padding: '5px 13px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500,
              border: isSel ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
              background: isSel ? 'var(--color-primary)' : 'transparent',
              color: isSel ? 'white' : 'var(--color-text-muted)',
              cursor: disabled ? 'default' : 'pointer',
              transition: 'all 0.1s',
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

// Tag-select: selected chips + native dropdown for adding items (for larger lists)
function TagSelect({
  options, selected, onChange, disabled, placeholder,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  disabled: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
          {selected.map((v) => (
            <span
              key={v}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '2px 8px', borderRadius: '9999px',
                background: '#EFF6FF', color: '#1D4ED8', fontSize: '12px', fontWeight: 500,
              }}
            >
              {v}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onChange(selected.filter((s) => s !== v))}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '14px', height: '14px', borderRadius: '50%',
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    color: '#1D4ED8', fontSize: '14px', padding: 0, lineHeight: 1,
                  }}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      {!disabled && (
        <select
          value=""
          onChange={(e) => {
            const val = e.target.value;
            if (val && !selected.includes(val)) onChange([...selected, val]);
          }}
          style={inputBase}
        >
          <option value="">{placeholder ?? 'Select to add…'}</option>
          {options.filter((o) => !selected.includes(o)).map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      )}
      {disabled && selected.length === 0 && (
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>—</span>
      )}
    </div>
  );
}

// Checkbox row with label and hint
function CheckRow({
  checked, onChange, label, hint, disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
  disabled: boolean;
}) {
  return (
    <label
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        cursor: disabled ? 'default' : 'pointer',
        padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '8px',
        background: checked ? 'color-mix(in srgb, var(--color-primary) 4%, var(--color-surface))' : 'var(--color-surface)',
        transition: 'background 0.1s',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: '2px', accentColor: 'var(--color-primary)', width: '14px', height: '14px', flexShrink: 0 }}
      />
      <div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>{label}</div>
        {hint && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{hint}</div>}
      </div>
    </label>
  );
}

// ─── Route form types ─────────────────────────────────────────────────────────

interface RouteForm {
  routeType: string;
  minLoadQty: string;
  maxLoadQty: string;
  transitTimeOverride: string;
}

const EMPTY_ROUTE: RouteForm = {
  routeType: '', minLoadQty: '', maxLoadQty: '', transitTimeOverride: '',
};

// ─── Vehicle form types ───────────────────────────────────────────────────────

interface VehicleForm {
  vehicleType: string;
  loadUOM: string;
  loadCapacityMin: string;
  loadCapacityMax: string;
  approximateFleetSize: string;
  minConsignmentSize: string;
  maxConsignmentSize: string;
}

const EMPTY_VEHICLE: VehicleForm = {
  vehicleType: '', loadUOM: '', loadCapacityMin: '', loadCapacityMax: '',
  approximateFleetSize: '', minConsignmentSize: '', maxConsignmentSize: '',
};

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  config: BPTransporterConfig;
  onChange: (c: BPTransporterConfig) => void;
  isViewOnly: boolean;
}

export function TransporterConfigStep({ config, onChange, isViewOnly }: Props) {
  const set = <K extends keyof BPTransporterConfig>(k: K, v: BPTransporterConfig[K]) =>
    onChange({ ...config, [k]: v });

  // ── Route CRUD state ──────────────────────────────────────────────────
  const [routeOpen, setRouteOpen]         = useState(false);
  const [routeEditId, setRouteEditId]     = useState<string | null>(null);
  const [routeForm, setRouteForm]         = useState<RouteForm>(EMPTY_ROUTE);
  const [routeErrors, setRouteErrors]     = useState<{ routeType?: string }>({});

  // ── Vehicle CRUD state ────────────────────────────────────────────────
  const [vehicleOpen, setVehicleOpen]         = useState(false);
  const [vehicleEditId, setVehicleEditId]     = useState<string | null>(null);
  const [vehicleForm, setVehicleForm]         = useState<VehicleForm>(EMPTY_VEHICLE);
  const [vehicleErrors, setVehicleErrors]     = useState<{ vehicleType?: string }>({});

  function openAddVehicle() {
    setVehicleEditId(null);
    setVehicleForm(EMPTY_VEHICLE);
    setVehicleErrors({});
    setVehicleOpen(true);
  }
  function openEditVehicle(v: BPVehicleCapability) {
    setVehicleEditId(v.id);
    setVehicleForm({
      vehicleType: v.vehicleType, loadUOM: v.loadUOM,
      loadCapacityMin: v.loadCapacityMin, loadCapacityMax: v.loadCapacityMax,
      approximateFleetSize: v.approximateFleetSize,
      minConsignmentSize: v.minConsignmentSize, maxConsignmentSize: v.maxConsignmentSize,
    });
    setVehicleErrors({});
    setVehicleOpen(true);
  }
  function saveVehicle() {
    if (!vehicleForm.vehicleType) { setVehicleErrors({ vehicleType: 'Vehicle Type is required.' }); return; }
    const entry: BPVehicleCapability = {
      id: vehicleEditId ?? `VC-${Date.now()}`,
      vehicleType: vehicleForm.vehicleType, loadUOM: vehicleForm.loadUOM,
      loadCapacityMin: vehicleForm.loadCapacityMin, loadCapacityMax: vehicleForm.loadCapacityMax,
      approximateFleetSize: vehicleForm.approximateFleetSize,
      minConsignmentSize: vehicleForm.minConsignmentSize, maxConsignmentSize: vehicleForm.maxConsignmentSize,
    };
    const vehicles = vehicleEditId
      ? config.vehicleCapabilities.map((v) => (v.id === vehicleEditId ? entry : v))
      : [...config.vehicleCapabilities, entry];
    onChange({ ...config, vehicleCapabilities: vehicles });
    setVehicleOpen(false);
  }
  function removeVehicle(id: string) {
    onChange({ ...config, vehicleCapabilities: config.vehicleCapabilities.filter((v) => v.id !== id) });
  }

  function openAddRoute() {
    setRouteEditId(null);
    setRouteForm(EMPTY_ROUTE);
    setRouteErrors({});
    setRouteOpen(true);
  }
  function openEditRoute(r: BPRouteCapability) {
    setRouteEditId(r.id);
    setRouteForm({
      routeType: r.routeType,
      minLoadQty: r.minLoadQty,
      maxLoadQty: r.maxLoadQty,
      transitTimeOverride: r.transitTimeOverride,
    });
    setRouteErrors({});
    setRouteOpen(true);
  }
  function saveRoute() {
    if (!routeForm.routeType) {
      setRouteErrors({ routeType: 'Route Type is required.' });
      return;
    }
    const entry: BPRouteCapability = {
      id: routeEditId ?? `RC-${Date.now()}`,
      routeType: routeForm.routeType,
      minLoadQty: routeForm.minLoadQty,
      maxLoadQty: routeForm.maxLoadQty,
      transitTimeOverride: routeForm.transitTimeOverride,
    };
    const routes = routeEditId
      ? config.routeCapabilities.map((r) => (r.id === routeEditId ? entry : r))
      : [...config.routeCapabilities, entry];
    onChange({ ...config, routeCapabilities: routes });
    setRouteOpen(false);
  }
  function removeRoute(id: string) {
    onChange({ ...config, routeCapabilities: config.routeCapabilities.filter((r) => r.id !== id) });
  }

  // ── Coverage scope derived visibility ─────────────────────────────────
  const scope = config.coverageScope;
  const showStates = ['State', 'National', 'International'].includes(scope);
  const showCities = ['Local', 'Regional', 'State'].includes(scope);

  // Route grid column widths
  const RC_COLS = '140px 1fr 1fr 130px 68px';

  return (
    <div>

      {/* ═══════════════════════════════════════════════════════════════
          Section 1 — Transport Operations
      ════════════════════════════════════════════════════════════════ */}
      <div style={sectionCard}>
        <div style={sCardHead}>
          <SectionTitle>Transport Operations</SectionTitle>
        </div>
        <div style={sCardBody}>

          {/* Transport Mode — chip-toggle multi-select */}
          <div style={fw}>
            <label style={labelBase}>Transport Mode <Req /></label>
            <ChipToggle
              options={TRANSPORTER_PICKLISTS.transportModes}
              selected={config.transportModes}
              onChange={(v) => set('transportModes', v)}
              disabled={isViewOnly}
            />
            {config.transportModes.length === 0 && (
              <FieldHint text="Select all applicable transport modes for this partner." />
            )}
          </div>

          {/* Service Nature + Fleet Ownership */}
          <div style={{ ...twoCol, ...fw }}>
            <div>
              <label style={labelBase}>Service Nature <Req /></label>
              <select
                value={config.serviceNature}
                onChange={(e) => set('serviceNature', e.target.value)}
                disabled={isViewOnly}
                style={inputBase}
              >
                <option value="">Select…</option>
                {TRANSPORTER_PICKLISTS.serviceNature.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelBase}>Fleet Ownership Type <Req /></label>
              <select
                value={config.fleetOwnershipType}
                onChange={(e) => set('fleetOwnershipType', e.target.value)}
                disabled={isViewOnly}
                style={inputBase}
              >
                <option value="">Select…</option>
                {TRANSPORTER_PICKLISTS.fleetOwnershipType.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Capability checkboxes */}
          <div style={threeCol}>
            <CheckRow
              checked={config.gpsTracking}
              onChange={(v) => set('gpsTracking', v)}
              label="GPS Tracking Supported"
              hint="Real-time vehicle tracking available"
              disabled={isViewOnly}
            />
            <CheckRow
              checked={config.refrigeratedTransport}
              onChange={(v) => set('refrigeratedTransport', v)}
              label="Refrigerated Transport"
              hint="Cold-chain / temperature-controlled"
              disabled={isViewOnly}
            />
            <CheckRow
              checked={config.hazardousMaterial}
              onChange={(v) => set('hazardousMaterial', v)}
              label="Hazardous Material"
              hint="Batteries, chemicals, flammables"
              disabled={isViewOnly}
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          Section 2 — Service Coverage
      ════════════════════════════════════════════════════════════════ */}
      <div style={sectionCard}>
        <div style={sCardHead}>
          <SectionTitle>Service Coverage</SectionTitle>
        </div>
        <div style={sCardBody}>

          {/* Coverage Scope */}
          <div style={fw}>
            <label style={labelBase}>Coverage Scope <Req /></label>
            <select
              value={config.coverageScope}
              onChange={(e) => set('coverageScope', e.target.value)}
              disabled={isViewOnly}
              style={{ ...inputBase, maxWidth: '300px' }}
            >
              <option value="">Select…</option>
              {TRANSPORTER_PICKLISTS.coverageScope.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            {scope && (
              <FieldHint text="Coverage Scope determines which geographic fields are required below." />
            )}
          </div>

          {/* Operating Countries */}
          <div style={fw}>
            <label style={labelBase}>
              Operating Countries
              {['State', 'National', 'International'].includes(scope) && <Req />}
            </label>
            <TagSelect
              options={TRANSPORTER_PICKLISTS.operatingCountries}
              selected={config.operatingCountries}
              onChange={(v) => set('operatingCountries', v)}
              disabled={isViewOnly}
              placeholder="Select country to add…"
            />
          </div>

          {/* Operating States — conditional */}
          {showStates && (
            <div style={fw}>
              <label style={labelBase}>Operating States <Req /></label>
              <TagSelect
                options={TRANSPORTER_PICKLISTS.operatingStates}
                selected={config.operatingStates}
                onChange={(v) => set('operatingStates', v)}
                disabled={isViewOnly}
                placeholder="Select state to add…"
              />
              <FieldHint text="Filtered based on selected Operating Countries." />
            </div>
          )}

          {/* Operating Cities — conditional */}
          {showCities && (
            <div style={fw}>
              <label style={labelBase}>Operating Cities</label>
              <TagSelect
                options={TRANSPORTER_PICKLISTS.operatingCities}
                selected={config.operatingCities}
                onChange={(v) => set('operatingCities', v)}
                disabled={isViewOnly}
                placeholder="Select city to add…"
              />
            </div>
          )}

          {/* Service Zones — always optional */}
          <div style={{ ...fw, marginBottom: 0 }}>
            <label style={labelBase}>
              Service Zones{' '}
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 400 }}>(Optional)</span>
            </label>
            <TagSelect
              options={TRANSPORTER_PICKLISTS.serviceZones}
              selected={config.serviceZones}
              onChange={(v) => set('serviceZones', v)}
              disabled={isViewOnly}
              placeholder="Select zone to add…"
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          Section 3 — Fleet Capability
      ════════════════════════════════════════════════════════════════ */}
      <div style={sectionCard}>
        <div style={sCardHead}>
          <SectionTitle>Fleet Capability <Req /></SectionTitle>
          {!isViewOnly && (
            <button
              type="button"
              onClick={openAddVehicle}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '0 12px', height: '28px', fontSize: '12px', fontWeight: 600,
                borderRadius: '7px', border: '1px solid var(--color-primary)',
                background: 'color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))',
                color: 'var(--color-primary)', cursor: 'pointer',
              }}
            >
              + Add Vehicle
            </button>
          )}
        </div>

        {config.vehicleCapabilities.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            No vehicle types configured. Add vehicle-specific load capacity and consignment details.
          </div>
        ) : (
          <div>
            {/* Grid header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 160px 90px 170px 68px', gap: '8px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', padding: '0 16px', height: '34px', alignItems: 'center' }}>
              {['Vehicle Type', 'Load UOM', 'Capacity Range', 'Fleet Size', 'Consignment Range', ''].map((h) => (
                <div key={h} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
              ))}
            </div>
            {/* Grid rows */}
            {config.vehicleCapabilities.map((v, idx) => {
              const capRange = (v.loadCapacityMin || v.loadCapacityMax)
                ? `${v.loadCapacityMin || '0'}\u2013${v.loadCapacityMax || '\u221e'}${v.loadUOM ? ' ' + v.loadUOM : ''}`
                : '\u2014';
              const conRange = (v.minConsignmentSize || v.maxConsignmentSize)
                ? `${v.minConsignmentSize || '0'}\u2013${v.maxConsignmentSize || '\u221e'}${v.loadUOM ? ' ' + v.loadUOM : ''}`
                : '\u2014';
              return (
                <div
                  key={v.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 80px 160px 90px 170px 68px', gap: '8px',
                    padding: '0 16px', height: '44px', alignItems: 'center',
                    borderBottom: idx < config.vehicleCapabilities.length - 1 ? '1px solid var(--color-border)' : 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-subtle)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>{v.vehicleType}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{v.loadUOM || '\u2014'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{capRange}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{v.approximateFleetSize || '\u2014'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{conRange}</div>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                    {!isViewOnly && (
                      <>
                        <button type="button" onClick={() => openEditVehicle(v)} title="Edit"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button type="button" onClick={() => removeVehicle(v.id)} title="Remove"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #FCA5A5', background: '#FEF2F2', cursor: 'pointer', color: '#DC2626' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          Section 4 — Transit & SLA Parameters
      ════════════════════════════════════════════════════════════════ */}
      <div style={sectionCard}>
        <div style={sCardHead}>
          <SectionTitle>Transit & SLA Parameters</SectionTitle>
        </div>
        <div style={sCardBody}>

          {/* Standard Transit Time — mandatory */}
          <div style={fw}>
            <label style={labelBase}>Standard Transit Time (Calendar Days) <Req /></label>
            <input
              type="number" min="0" value={config.standardTransitTime}
              onChange={(e) => set('standardTransitTime', e.target.value)}
              disabled={isViewOnly} placeholder="e.g. 3"
              style={{ ...inputBase, maxWidth: '220px' }}
            />
            <FieldHint text="Used for ETA calculation. Must be between Min and Max transit times where provided." />
          </div>

          {/* Min / Max Transit Time */}
          <div style={{ ...twoCol, ...fw }}>
            <div>
              <label style={labelBase}>Minimum Transit Time (Days)</label>
              <input
                type="number" min="0" value={config.minTransitTime}
                onChange={(e) => set('minTransitTime', e.target.value)}
                disabled={isViewOnly} placeholder="e.g. 1" style={inputBase}
              />
            </div>
            <div>
              <label style={labelBase}>Maximum Transit Time (Days)</label>
              <input
                type="number" min="0" value={config.maxTransitTime}
                onChange={(e) => set('maxTransitTime', e.target.value)}
                disabled={isViewOnly} placeholder="e.g. 5" style={inputBase}
              />
            </div>
          </div>

          {/* Operations checkboxes */}
          <div style={twoCol}>
            <CheckRow
              checked={config.weekendOperations}
              onChange={(v) => set('weekendOperations', v)}
              label="Weekend Operations Supported"
              hint="Saturday and Sunday pickups / deliveries"
              disabled={isViewOnly}
            />
            <CheckRow
              checked={config.nightOperations}
              onChange={(v) => set('nightOperations', v)}
              label="Night Operations Supported"
              hint="After-hours and overnight movements"
              disabled={isViewOnly}
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          Section 5 — Logistics Responsibility
      ════════════════════════════════════════════════════════════════ */}
      <div style={sectionCard}>
        <div style={sCardHead}>
          <SectionTitle>Logistics Responsibility</SectionTitle>
        </div>
        <div style={sCardBody}>
          <div style={twoCol}>
            <div style={fw}>
              <label style={labelBase}>Pickup Responsibility <Req /></label>
              <select value={config.pickupResponsibility} onChange={(e) => set('pickupResponsibility', e.target.value)} disabled={isViewOnly} style={inputBase}>
                <option value="">Select…</option>
                {TRANSPORTER_PICKLISTS.pickupResponsibility.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div style={fw}>
              <label style={labelBase}>Delivery Responsibility <Req /></label>
              <select value={config.deliveryResponsibility} onChange={(e) => set('deliveryResponsibility', e.target.value)} disabled={isViewOnly} style={inputBase}>
                <option value="">Select…</option>
                {TRANSPORTER_PICKLISTS.deliveryResponsibility.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div style={fw}>
              <label style={labelBase}>Loading Responsibility</label>
              <select value={config.loadingResponsibility} onChange={(e) => set('loadingResponsibility', e.target.value)} disabled={isViewOnly} style={inputBase}>
                <option value="">Select…</option>
                {TRANSPORTER_PICKLISTS.loadingResponsibility.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div style={{ ...fw, marginBottom: 0 }}>
              <label style={labelBase}>Unloading Responsibility</label>
              <select value={config.unloadingResponsibility} onChange={(e) => set('unloadingResponsibility', e.target.value)} disabled={isViewOnly} style={inputBase}>
                <option value="">Select…</option>
                {TRANSPORTER_PICKLISTS.unloadingResponsibility.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          Section 6 — Configuration Validity
      ════════════════════════════════════════════════════════════════ */}
      <div style={sectionCard}>
        <div style={sCardHead}>
          <SectionTitle>Configuration Validity</SectionTitle>
        </div>
        <div style={sCardBody}>
          <div style={{ ...twoCol, ...fw }}>
            <div>
              <label style={labelBase}>Effective From Date <Req /></label>
              <input
                type="date" value={config.configEffectiveFrom}
                onChange={(e) => set('configEffectiveFrom', e.target.value)}
                disabled={isViewOnly} style={inputBase}
              />
            </div>
            <div>
              <label style={labelBase}>Effective To Date</label>
              <input
                type="date" value={config.configEffectiveTo}
                onChange={(e) => set('configEffectiveTo', e.target.value)}
                disabled={isViewOnly} style={inputBase}
              />
            </div>
          </div>
          <div style={{ ...fw, maxWidth: '220px', marginBottom: '16px' }}>
            <label style={labelBase}>Status <Req /></label>
            <select
              value={config.configStatus}
              onChange={(e) => set('configStatus', e.target.value)}
              disabled={isViewOnly}
              style={inputBase}
            >
              {TRANSPORTER_PICKLISTS.configStatus.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          {config.configStatus === 'Active' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16A34A', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#15803D' }}>
                Active configuration will be available for new logistics transactions from the Effective From Date.
              </span>
            </div>
          )}
          {config.configStatus === 'Inactive' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#64748B', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Inactive configuration will not be available for new transactions.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          Transport Capability Mapping (repeatable route entries)
      ════════════════════════════════════════════════════════════════ */}
      <div style={sectionCard}>
        <div style={sCardHead}>
          <SectionTitle>Transport Capability Mapping</SectionTitle>
          {!isViewOnly && (
            <button
              type="button"
              onClick={openAddRoute}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '0 12px', height: '28px', fontSize: '12px', fontWeight: 600,
                borderRadius: '7px', border: '1px solid var(--color-primary)',
                background: 'color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))',
                color: 'var(--color-primary)', cursor: 'pointer',
              }}
            >
              + Add Route
            </button>
          )}
        </div>

        {config.routeCapabilities.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            No routes configured. Add route-specific load capacity and transit time overrides.
          </div>
        ) : (
          <div>
            {/* Grid header */}
            <div
              style={{
                display: 'grid', gridTemplateColumns: RC_COLS, gap: '8px',
                background: 'var(--color-surface-subtle)',
                borderBottom: '1px solid var(--color-border)',
                padding: '0 16px', height: '34px', alignItems: 'center',
              }}
            >
              {['Route Type', 'Min Load Qty', 'Max Load Qty', 'Transit Override', ''].map((h) => (
                <div
                  key={h}
                  style={{
                    fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}
                >
                  {h}
                </div>
              ))}
            </div>

            {/* Grid rows */}
            {config.routeCapabilities.map((r, idx) => (
              <div
                key={r.id}
                style={{
                  display: 'grid', gridTemplateColumns: RC_COLS, gap: '8px',
                  padding: '0 16px', height: '44px', alignItems: 'center',
                  borderBottom: idx < config.routeCapabilities.length - 1
                    ? '1px solid var(--color-border)' : 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-subtle)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>
                  {r.routeType}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  {r.minLoadQty || '—'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  {r.maxLoadQty || '—'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  {r.transitTimeOverride ? `${r.transitTimeOverride} days` : '—'}
                </div>
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                  {!isViewOnly && (
                    <>
                      <button
                        type="button" onClick={() => openEditRoute(r)} title="Edit"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        type="button" onClick={() => removeRoute(r.id)} title="Remove"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #FCA5A5', background: '#FEF2F2', cursor: 'pointer', color: '#DC2626' }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Route Add / Edit Dialog ────────────────────────────────────── */}
      <AppDialog
        open={routeOpen}
        onClose={() => setRouteOpen(false)}
        title={routeEditId ? 'Edit Route Capability' : 'Add Route Capability'}
        description="Define route-specific load capacity and transit time overrides for this transporter."
        showCloseButton
        width={480}
        actions={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            <button type="button" onClick={() => setRouteOpen(false)} style={btnOutline}>
              Cancel
            </button>
            <button type="button" onClick={saveRoute} style={btnPrimary}>
              {routeEditId ? 'Save Changes' : 'Add Route'}
            </button>
          </div>
        }
      >
        <div style={{ padding: '4px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelBase}>Route Type <Req /></label>
            <select
              value={routeForm.routeType}
              onChange={(e) => setRouteForm((f) => ({ ...f, routeType: e.target.value }))}
              style={{
                ...inputBase,
                border: routeErrors.routeType ? '1px solid #FCA5A5' : '1px solid var(--color-border)',
              }}
            >
              <option value="">Select…</option>
              {TRANSPORTER_PICKLISTS.routeTypes.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            {routeErrors.routeType && (
              <p style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px' }}>{routeErrors.routeType}</p>
            )}
          </div>

          <div>
            <label style={labelBase}>
              Load Qty Range
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'center' }}>
              <input
                type="number" min="0" value={routeForm.minLoadQty}
                onChange={(e) => setRouteForm((f) => ({ ...f, minLoadQty: e.target.value }))}
                placeholder="Min" style={inputBase}
              />
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>to</span>
              <input
                type="number" min="0" value={routeForm.maxLoadQty}
                onChange={(e) => setRouteForm((f) => ({ ...f, maxLoadQty: e.target.value }))}
                placeholder="Max" style={inputBase}
              />
            </div>
          </div>

          <div>
            <label style={labelBase}>Transit Time Override (Days)</label>
            <input
              type="number" min="0" value={routeForm.transitTimeOverride}
              onChange={(e) => setRouteForm((f) => ({ ...f, transitTimeOverride: e.target.value }))}
              placeholder="Overrides default SLA if provided"
              style={inputBase}
            />
          </div>
        </div>
      </AppDialog>

      {/* ── Vehicle Capability dialog ─────────────────────────────────────────── */}
      <AppDialog
        open={vehicleOpen}
        onClose={() => setVehicleOpen(false)}
        title={vehicleEditId ? 'Edit Vehicle Capability' : 'Add Vehicle Capability'}
        width={520}
        actions={
          !isViewOnly ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => setVehicleOpen(false)} style={btnOutline}>Cancel</button>
              <button type="button" onClick={saveVehicle} style={btnPrimary}>
                {vehicleEditId ? 'Update' : 'Add'}
              </button>
            </div>
          ) : undefined
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Vehicle Type */}
          <div>
            <label style={labelBase}>Vehicle Type <Req /></label>
            <select
              value={vehicleForm.vehicleType}
              onChange={(e) => setVehicleForm((f) => ({ ...f, vehicleType: e.target.value }))}
              disabled={isViewOnly}
              style={{ ...inputBase, borderColor: vehicleErrors.vehicleType ? '#DC2626' : undefined }}
            >
              <option value="">Select&hellip;</option>
              {TRANSPORTER_PICKLISTS.vehicleTypes
                .filter((t) => t === vehicleForm.vehicleType || !config.vehicleCapabilities.some((vc) => vc.vehicleType === t))
                .map((t) => <option key={t} value={t}>{t}</option>)
              }
            </select>
            {vehicleErrors.vehicleType && (
              <div style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px' }}>{vehicleErrors.vehicleType}</div>
            )}
          </div>

          {/* Load UOM */}
          <div>
            <label style={labelBase}>Load UOM</label>
            <select
              value={vehicleForm.loadUOM}
              onChange={(e) => setVehicleForm((f) => ({ ...f, loadUOM: e.target.value }))}
              disabled={isViewOnly}
              style={inputBase}
            >
              <option value="">Select&hellip;</option>
              {TRANSPORTER_PICKLISTS.loadUOMs.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          {/* Load Capacity Range */}
          <div>
            <label style={labelBase}>
              {`Load Capacity Range${vehicleForm.loadUOM ? ' (' + vehicleForm.loadUOM + ')' : ''}`}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'center' }}>
              <input
                type="number" min="0" value={vehicleForm.loadCapacityMin}
                onChange={(e) => setVehicleForm((f) => ({ ...f, loadCapacityMin: e.target.value }))}
                disabled={isViewOnly} placeholder="Min" style={inputBase}
              />
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>to</span>
              <input
                type="number" min="0" value={vehicleForm.loadCapacityMax}
                onChange={(e) => setVehicleForm((f) => ({ ...f, loadCapacityMax: e.target.value }))}
                disabled={isViewOnly} placeholder="Max" style={inputBase}
              />
            </div>
          </div>

          {/* Approximate Fleet Size */}
          <div>
            <label style={labelBase}>Approximate Fleet Size</label>
            <input
              type="number" min="0" value={vehicleForm.approximateFleetSize}
              onChange={(e) => setVehicleForm((f) => ({ ...f, approximateFleetSize: e.target.value }))}
              disabled={isViewOnly} placeholder="e.g. 25"
              style={{ ...inputBase, maxWidth: '160px' }}
            />
          </div>

          {/* Consignment Size Range */}
          <div>
            <label style={labelBase}>
              {`Consignment Size Range${vehicleForm.loadUOM ? ' (' + vehicleForm.loadUOM + ')' : ''}`}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'center' }}>
              <input
                type="number" min="0" value={vehicleForm.minConsignmentSize}
                onChange={(e) => setVehicleForm((f) => ({ ...f, minConsignmentSize: e.target.value }))}
                disabled={isViewOnly} placeholder="Min" style={inputBase}
              />
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>to</span>
              <input
                type="number" min="0" value={vehicleForm.maxConsignmentSize}
                onChange={(e) => setVehicleForm((f) => ({ ...f, maxConsignmentSize: e.target.value }))}
                disabled={isViewOnly} placeholder="Max" style={inputBase}
              />
            </div>
          </div>
        </div>
      </AppDialog>
    </div>
  );
}
