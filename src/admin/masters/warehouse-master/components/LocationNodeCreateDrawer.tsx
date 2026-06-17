import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { warehouseMockAdapter } from '../services/warehouseMockAdapter';
import type { CreateLocationInput } from '../types/warehouse.dto';
import type { BinType, LocationType } from '../types/warehouse.enums';
import type { HierarchyTemplate, Warehouse, WarehouseLocation } from '../types/warehouse.types';
import {
  deriveFullLocationIdentifier,
  deriveLocationCodingPolicy,
  explainChildLevelAllowance,
  generateNodeCode,
  getAllowedChildTemplateLevels,
  resolveLocationTypeForLevel,
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
  const [manualOverride, setManualOverride] = useState(false);
  const [binType, setBinType] = useState<BinType | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const firstLevel = allowedLevels[0];
    setSelectedLevelCode(firstLevel?.levelCode ?? '');
    setLocationCode('');
    setLocationName('');
    setManualOverride(false);
    setBinType('');
    setMessage(null);
  }, [allowedLevels, open]);

  const selectedLevel = allowedLevels.find((level) => level.levelCode === selectedLevelCode);
  const singleAllowedLevel = allowedLevels.length <= 1;
  const selectedLocationType = useMemo<LocationType | null>(() => {
    if (!selectedLevel) return null;
    return resolveLocationTypeForLevel(selectedLevel);
  }, [selectedLevel]);
  const codingPolicy = useMemo(
    () => deriveLocationCodingPolicy(template, selectedLevel),
    [selectedLevel, template],
  );
  const autoGenerateEnabled = codingPolicy.autoGenerateNodeCodeAllowed && !manualOverride;
  const previewCode = useMemo(() => {
    if (manualOverride) return locationCode.trim().toUpperCase();
    return generateNodeCode({
      policy: codingPolicy,
      existingSiblingCodes: locations
        .filter((location) => location.parentLocationId === parentLocation?.id)
        .map((location) => location.locationCode),
      autoGenerate: true,
    }).nodeCode;
  }, [codingPolicy, locationCode, locations, manualOverride, parentLocation?.id]);
  const previewIdentifier = useMemo(() => deriveFullLocationIdentifier({
    warehouseCode: warehouse.warehouseCode,
    activeTemplate: template,
    parentLocationId: parentLocation?.id,
    allLocations: locations,
    nodeCode: previewCode,
  }), [locations, parentLocation?.id, previewCode, template, warehouse.warehouseCode]);

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
      locationCode: manualOverride ? locationCode : previewCode,
      locationName,
      locationType: selectedLocationType,
      binType: selectedLocationType === 'BIN' ? (binType || 'Standard') : undefined,
    };

    try {
      const validation = await warehouseMockAdapter.validateLocationIdentifier(warehouse.id, {
        warehouseId: warehouse.id,
        parentLocationId: parentLocation?.id,
        templateLevelCode: selectedLevel?.levelCode,
        templateLevelId: selectedLevel?.levelId,
        nodeCode: payload.locationCode,
        autoGenerate: !manualOverride,
        manualOverride,
      });
      if (!validation.valid) {
        setMessage(validation.issues[0]?.message ?? 'Location identifier validation failed.');
        setSubmitting(false);
        return;
      }
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
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>
              Add {selectedLevel?.levelName ?? 'Hierarchy Node'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Parent: {parentLocation ? `${parentLocation.locationCode} · ${parentLocation.profile.fullCode}` : `${warehouse.warehouseCode} · Warehouse root`}
            </div>
          </div>
          <button type="button" onClick={onClose} style={closeBtn}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>
          <div style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)', marginBottom: '12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            <div>Selected parent: <strong style={{ color: 'var(--color-text)' }}>{parentLocation?.locationCode ?? warehouse.warehouseCode}</strong></div>
            <div>Parent full identifier: <strong style={{ color: 'var(--color-text)' }}>{parentLocation?.profile.fullCode ?? warehouse.warehouseCode}</strong></div>
            <div>Next allowed level{allowedLevels.length === 1 ? '' : 's'}: <strong style={{ color: 'var(--color-text)' }}>{allowedLevels.map((level) => `${level.levelName} (${level.levelCode})`).join(', ') || 'none'}</strong></div>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: '10px', background: allowanceExplanation.allowed ? '#EFF6FF' : '#FEF3C7', color: allowanceExplanation.allowed ? '#1D4ED8' : '#92400E', fontSize: '12px', marginBottom: '14px', lineHeight: 1.6 }}>
            {allowanceExplanation.allowed
              ? `Create the next ${selectedLevel?.levelName ?? 'child level'} under ${parentLocation?.locationCode ?? warehouse.warehouseCode}. Fill only the code and name first.`
              : allowanceExplanation.reason}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Parent Level</label>
              <input value={parentLocation ? parentLocation.profile.locationType : 'Warehouse'} readOnly style={{ ...inputStyle, background: 'var(--color-surface-subtle)' }} />
            </div>
            <div>
              <label style={labelStyle}>Child Level</label>
              {singleAllowedLevel ? (
                <input
                  value={selectedLevel ? `${selectedLevel.levelCode} · ${selectedLevel.levelName}` : 'No allowed level'}
                  readOnly
                  style={{ ...inputStyle, background: 'var(--color-surface-subtle)' }}
                />
              ) : (
                <select value={selectedLevelCode} onChange={(event) => setSelectedLevelCode(event.target.value)} style={inputStyle}>
                  {allowedLevels.map((level) => (
                    <option key={level.levelCode} value={level.levelCode}>
                      {level.levelCode} · {level.levelName}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <Field label="Node Code" value={locationCode} onChange={setLocationCode} readOnly={!manualOverride} />
            <Field label="Node Name" value={locationName} onChange={setLocationName} />
          </div>

          <div style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--color-border)', marginBottom: '12px', fontSize: '12px' }}>
            <div>Node code preview: <strong>{previewCode || '—'}</strong></div>
            <div>Full identifier preview: <strong>{previewIdentifier || '—'}</strong></div>
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

          <details style={{ marginBottom: '12px' }}>
            <summary style={{ cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>
              More options
            </summary>
            <div style={{ marginTop: '10px', display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  id="manual-code-toggle"
                  type="checkbox"
                  checked={manualOverride}
                  disabled={!codingPolicy.manualNodeCodeAllowed}
                  onChange={(event) => {
                    setManualOverride(event.target.checked);
                    if (!event.target.checked) setLocationCode(previewCode);
                  }}
                />
                <label htmlFor="manual-code-toggle" style={{ ...labelStyle, marginBottom: 0 }}>
                  Manual node code override
                </label>
              </div>

              <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                <div>Path separator: <strong>{codingPolicy.pathSeparator}</strong></div>
                <div>Identifier includes warehouse code: <strong>{codingPolicy.includeWarehouseCodeInIdentifier ? 'Yes' : 'No'}</strong></div>
                <div>Auto-generation: <strong>{autoGenerateEnabled ? 'Enabled' : 'Disabled'}</strong></div>
                <div>Code lock after activation: <strong>{codingPolicy.codeLockedAfterActivation ? 'Enabled' : 'Disabled'}</strong></div>
              </div>

              {selectedLevel && (
                <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: '6px' }}>Capability preview</div>
                  <div>Selected child level: {selectedLevel.levelName} ({selectedLevel.levelCode})</div>
                  <div>Leaf endpoint eligible: {selectedLevel.leafEligible ? 'Yes' : 'No'}</div>
                  <div>Inventory endpoint eligible: {selectedLevel.inventoryEndpointEligible ? 'Yes' : 'No'}</div>
                  <div>Capacity applicable: {selectedLevel.capacityApplicable ? 'Yes' : 'No'}</div>
                  <div>Item eligibility applicable: {selectedLevel.itemEligibilityApplicable ? 'Yes' : 'No'}</div>
                  <div>Responsibility applicable: {selectedLevel.responsibilityApplicable ? 'Yes' : 'No'}</div>
                </div>
              )}

              <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                <div>Derived rules on create:</div>
                <div>Full Location Code is derived from warehouse and parent path.</div>
                <div>Is Leaf Endpoint is derived from the active template and child presence.</div>
                <div>Inventory Allowed stays blocked on non-leaf nodes and draft nodes.</div>
              </div>
            </div>
          </details>

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
            Create {selectedLevel?.levelName ?? 'Node'}
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
  readOnly,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input value={value} readOnly={readOnly} onChange={(event) => onChange(event.target.value)} style={{ ...inputStyle, background: readOnly ? 'var(--color-surface-subtle)' : inputStyle.background }} />
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
