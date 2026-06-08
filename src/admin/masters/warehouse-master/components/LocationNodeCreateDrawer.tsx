import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { warehouseMockAdapter } from '../services/warehouseMockAdapter';
import type { CreateLocationInput } from '../types/warehouse.dto';
import type { BinType, LocationType } from '../types/warehouse.enums';
import type { HierarchyTemplate, Warehouse, WarehouseLocation } from '../types/warehouse.types';
import {
  explainChildLevelAllowance,
  getAllowedChildTemplateLevels,
} from '../utils/hierarchyUtils';

interface LocationNodeCreateDrawerProps {
  open: boolean;
  warehouse: Warehouse;
  parentLocation: WarehouseLocation | null;
  template?: HierarchyTemplate;
  locations: WarehouseLocation[];
  onClose: () => void;
  onCreated: (locationId: string) => Promise<void> | void;
}

export function LocationNodeCreateDrawer({
  open,
  warehouse,
  parentLocation,
  template,
  locations,
  onClose,
  onCreated,
}: LocationNodeCreateDrawerProps) {
  const allowedLevels = useMemo(
    () => getAllowedChildTemplateLevels(parentLocation, template),
    [parentLocation, template],
  );
  const [selectedLevelCode, setSelectedLevelCode] = useState('');
  const [locationCode, setLocationCode] = useState('');
  const [locationName, setLocationName] = useState('');
  const [binType, setBinType] = useState<BinType | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const firstLevel = allowedLevels[0];
    setSelectedLevelCode(firstLevel?.levelCode ?? '');
    setLocationCode('');
    setLocationName('');
    setBinType('');
    setMessage(null);
  }, [allowedLevels, open]);

  const selectedLevel = allowedLevels.find((level) => level.levelCode === selectedLevelCode);
  const selectedLocationType = useMemo<LocationType | null>(() => {
    if (!selectedLevel) return null;
    const normal = selectedLevel.levelCode.toUpperCase();
    if (normal === 'ZONE') return 'Zone';
    if (normal === 'AISLE') return 'Aisle';
    if (normal === 'RACK') return 'Rack';
    if (normal === 'SHELF') return 'Shelf';
    if (normal === 'BIN') return 'BIN';
    return 'General';
  }, [selectedLevel]);

  if (!open) return null;

  const allowanceExplanation = selectedLevelCode
    ? explainChildLevelAllowance(parentLocation, selectedLevelCode, template)
    : { allowed: false, reason: 'No active child level is available.' };

  async function submit() {
    if (!selectedLocationType) {
      setMessage('Select a valid child level before creating a node.');
      return;
    }

    setSubmitting(true);
    setMessage(null);
    const payload: CreateLocationInput = {
      warehouseId: warehouse.id,
      parentLocationId: parentLocation?.id,
      locationCode,
      locationName,
      locationType: selectedLocationType,
      binType: selectedLocationType === 'BIN' ? (binType || 'Standard') : undefined,
    };

    try {
      const result = await warehouseMockAdapter.createLocation(warehouse.id, payload);
      setMessage(`Created ${result.locationCode} as Draft.`);
      await onCreated(result.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create hierarchy node.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <div style={headerStyle}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>Create Hierarchy Node</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Parent: {parentLocation ? `${parentLocation.locationCode} · ${parentLocation.profile.fullCode}` : `${warehouse.warehouseCode} · Warehouse root`}
            </div>
          </div>
          <button type="button" onClick={onClose} style={closeBtn}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Parent Level</label>
              <input value={parentLocation ? parentLocation.profile.locationType : 'Warehouse'} readOnly style={{ ...inputStyle, background: 'var(--color-surface-subtle)' }} />
            </div>
            <div>
              <label style={labelStyle}>Child Level</label>
              <select value={selectedLevelCode} onChange={(event) => setSelectedLevelCode(event.target.value)} style={inputStyle}>
                {allowedLevels.map((level) => (
                  <option key={level.levelCode} value={level.levelCode}>
                    {level.levelCode} · {level.levelName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: '10px', background: allowanceExplanation.allowed ? '#F0FDF4' : '#FEF3C7', color: allowanceExplanation.allowed ? '#166534' : '#92400E', fontSize: '12px', marginBottom: '14px' }}>
            {allowanceExplanation.reason}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <Field label="Location Code" value={locationCode} onChange={setLocationCode} />
            <Field label="Location Name" value={locationName} onChange={setLocationName} />
          </div>

          {selectedLocationType === 'BIN' && (
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>BIN Type</label>
              <select value={binType} onChange={(event) => setBinType(event.target.value as BinType)} style={inputStyle}>
                {['Standard', 'Bulk', 'Cold-Chain', 'Hazardous', 'Overflow', 'Return', 'Quarantine'].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            <div>Derived rules on create:</div>
            <div>Full Location Code is derived from warehouse and parent path.</div>
            <div>Is Leaf Endpoint is derived from the active template and child presence.</div>
            <div>Inventory Allowed stays blocked on non-leaf nodes and draft nodes.</div>
          </div>

          {message && (
            <div style={{ marginTop: '14px', padding: '10px 12px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={14} />
              <span>{message}</span>
            </div>
          )}

          {locations.length === 0 && (
            <div style={{ marginTop: '14px', padding: '10px 12px', borderRadius: '10px', background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', fontSize: '12px' }}>
              This warehouse has no hierarchy nodes yet. Start with the warehouse root to create the first path.
            </div>
          )}
        </div>

        <div style={footerStyle}>
          <button type="button" onClick={onClose} style={secondaryBtn}>Close</button>
          <button type="button" onClick={submit} disabled={!allowanceExplanation.allowed || submitting} style={{ ...primaryBtn, opacity: !allowanceExplanation.allowed || submitting ? 0.5 : 1 }}>
            Create Node
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle} />
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1800,
  background: 'rgba(15, 23, 42, 0.28)',
  display: 'flex',
  justifyContent: 'flex-end',
};

const panelStyle: React.CSSProperties = {
  width: 'min(560px, 100vw)',
  height: '100%',
  background: 'var(--color-surface)',
  borderLeft: '1px solid var(--color-border)',
  display: 'flex',
  flexDirection: 'column',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 18px',
  borderBottom: '1px solid var(--color-border)',
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '14px 18px',
  borderTop: '1px solid var(--color-border)',
};

const closeBtn: React.CSSProperties = {
  border: 'none',
  background: 'none',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontSize: '12px',
  boxSizing: 'border-box',
};

const secondaryBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};

const primaryBtn: React.CSSProperties = {
  ...secondaryBtn,
  background: 'var(--color-primary)',
  border: '1px solid var(--color-primary)',
  color: '#fff',
};
