import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { warehouseMockAdapter } from '../services/warehouseMockAdapter';
import type { BulkLocationInput, BulkPreview } from '../types/warehouse.dto';
import type { BinType, LocationType } from '../types/warehouse.enums';
import type { HierarchyTemplate, Warehouse, WarehouseLocation } from '../types/warehouse.types';
import { getAllowedChildTemplateLevels } from '../utils/hierarchyUtils';

export interface BulkCreateFormState {
  parentLocationId?: string;
  childLevelCode: string;
  level: number;
  codePrefix: string;
  namePrefix: string;
  startSequence: number;
  count: number;
  sequenceLength: number;
  separator: string;
  suffix: string;
  defaultLocationType: LocationType;
  defaultBinType?: BinType;
  locationProfileName: string;
}

export function buildBulkPreviewFingerprint(input: BulkCreateFormState): string {
  return JSON.stringify(input);
}

export function isPreviewInvalidated(
  previewFingerprint: string | null,
  currentInput: BulkCreateFormState,
): boolean {
  if (!previewFingerprint) return false;
  return previewFingerprint !== buildBulkPreviewFingerprint(currentInput);
}

export function makeDefaultBulkState(parent: WarehouseLocation | null, template?: HierarchyTemplate): BulkCreateFormState {
  const allowedTemplateLevel = getAllowedChildTemplateLevels(parent, template)[0];
  const derivedType = mapTemplateLevelToLocationType(allowedTemplateLevel?.levelCode, parent);
  return {
    parentLocationId: parent?.id,
    childLevelCode: allowedTemplateLevel?.levelCode ?? '',
    level: allowedTemplateLevel?.sequence ?? ((parent?.profile.level ?? 0) + 1),
    codePrefix: parent?.locationCode ?? 'Z',
    namePrefix: parent?.locationName ?? 'Zone',
    startSequence: 1,
    count: 5,
    sequenceLength: 3,
    separator: '-',
    suffix: '',
    defaultLocationType: derivedType,
    defaultBinType: derivedType === 'BIN' ? 'Standard' : undefined,
    locationProfileName: '',
  };
}

interface LocationBulkCreateDrawerProps {
  open: boolean;
  warehouse: Warehouse;
  parentLocation: WarehouseLocation | null;
  template?: HierarchyTemplate;
  onClose: () => void;
  onCommitted: () => Promise<void> | void;
}

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

export function LocationBulkCreateDrawer({
  open,
  warehouse,
  parentLocation,
  template,
  onClose,
  onCommitted,
}: LocationBulkCreateDrawerProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<BulkCreateFormState>(makeDefaultBulkState(parentLocation, template));
  const [preview, setPreview] = useState<BulkPreview | null>(null);
  const [previewFingerprint, setPreviewFingerprint] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const allowedLevels = useMemo(
    () => getAllowedChildTemplateLevels(parentLocation, template),
    [parentLocation, template],
  );

  useEffect(() => {
    if (open) {
      setForm(makeDefaultBulkState(parentLocation, template));
      setPreview(null);
      setPreviewFingerprint(null);
      setStep(0);
      setMessage(null);
    }
  }, [open, parentLocation, template]);

  useEffect(() => {
    const selectedLevel = allowedLevels.find((level) => level.levelCode === form.childLevelCode) ?? allowedLevels[0];
    if (!selectedLevel) return;
    const nextLocationType = mapTemplateLevelToLocationType(selectedLevel.levelCode, parentLocation);
    setForm((current) => {
      if (
        current.childLevelCode === selectedLevel.levelCode &&
        current.level === selectedLevel.sequence &&
        current.defaultLocationType === nextLocationType &&
        current.defaultBinType === (nextLocationType === 'BIN' ? current.defaultBinType ?? 'Standard' : undefined)
      ) {
        return current;
      }
      return {
        ...current,
        childLevelCode: selectedLevel.levelCode,
        level: selectedLevel.sequence,
        defaultLocationType: nextLocationType,
        defaultBinType: nextLocationType === 'BIN' ? current.defaultBinType ?? 'Standard' : undefined,
      };
    });
  }, [allowedLevels, form.childLevelCode, parentLocation]);

  const previewStale = isPreviewInvalidated(previewFingerprint, form);

  const bulkInput: BulkLocationInput = useMemo(() => ({
    warehouseId: warehouse.id,
    parentLocationId: form.parentLocationId,
    level: form.level,
    locationType: form.defaultLocationType,
    binType: form.defaultBinType,
    codePrefix: form.codePrefix,
    namePrefix: form.namePrefix,
    startSequence: form.startSequence,
    count: form.count,
    sequenceLength: form.sequenceLength,
    separator: form.separator,
    suffix: form.suffix,
    locationProfileName: form.locationProfileName || undefined,
    idempotencyKey: `bulk-${warehouse.id}-${form.parentLocationId ?? 'root'}`,
  }), [form, warehouse.id]);

  if (!open) return null;

  async function generatePreview() {
    const result = await warehouseMockAdapter.bulkPreviewLocations(warehouse.id, bulkInput);
    setPreview(result);
    setPreviewFingerprint(buildBulkPreviewFingerprint(form));
    setStep(2);
    setMessage(null);
  }

  async function commitBulk() {
    if (!preview || previewStale) {
      setMessage('Preview is stale. Regenerate preview before commit.');
      return;
    }
    setCommitting(true);
    const result = await warehouseMockAdapter.commitBulkLocations(warehouse.id, {
      warehouseId: warehouse.id,
      previewToken: preview.previewToken,
      paramsHash: preview.paramsHash,
      idempotencyKey: bulkInput.idempotencyKey,
    });
    setCommitting(false);
    if (!result.success) {
      setMessage(result.errors[0]?.reason ?? 'Bulk commit failed.');
      setStep(3);
      return;
    }
    setMessage(`${result.createdCount} locations created in Draft status.`);
    await onCommitted();
    setStep(4);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1800, background: 'rgba(15, 23, 42, 0.28)', display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ width: '560px', maxWidth: '100%', height: '100%', background: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>Bulk Create Locations</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Parent: {parentLocation ? `${parentLocation.locationCode} · Level ${form.level}` : `Warehouse root · Level ${form.level}`}
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '6px', padding: '12px 18px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)' }}>
          {['Configure', 'Generate preview', 'Validate', 'Review conflicts', 'Commit'].map((label, index) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '999px',
                background: index <= step ? 'var(--color-primary)' : 'var(--color-border)',
                color: index <= step ? '#fff' : 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
              }}>
                {index + 1}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{label}</span>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Parent</label>
              <input value={parentLocation?.locationCode ?? 'Warehouse root'} disabled style={{ ...inputStyle, background: 'var(--color-surface-subtle)' }} />
            </div>
            <div>
              <label style={labelStyle}>Child Level</label>
              <select
                value={form.childLevelCode}
                onChange={(event) => setForm((state) => ({ ...state, childLevelCode: event.target.value }))}
                style={inputStyle}
                disabled={allowedLevels.length <= 1}
              >
                {allowedLevels.map((level) => (
                  <option key={level.levelCode} value={level.levelCode}>
                    {level.levelCode} · {level.levelName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Level</label>
              <input value={String(form.level)} disabled style={{ ...inputStyle, background: 'var(--color-surface-subtle)' }} />
            </div>
            <div>
              <label style={labelStyle}>Derived Location Type</label>
              <input value={form.defaultLocationType} disabled style={{ ...inputStyle, background: 'var(--color-surface-subtle)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <Field label="Code Prefix" value={form.codePrefix} onChange={(value) => setForm((state) => ({ ...state, codePrefix: value }))} />
            <Field label="Name Prefix" value={form.namePrefix} onChange={(value) => setForm((state) => ({ ...state, namePrefix: value }))} />
            <NumberField label="Start Sequence" value={form.startSequence} onChange={(value) => setForm((state) => ({ ...state, startSequence: value }))} />
            <NumberField label="Count" value={form.count} onChange={(value) => setForm((state) => ({ ...state, count: value }))} />
            <NumberField label="Sequence Length" value={form.sequenceLength} onChange={(value) => setForm((state) => ({ ...state, sequenceLength: value }))} />
            <Field label="Separator" value={form.separator} onChange={(value) => setForm((state) => ({ ...state, separator: value }))} />
            <Field label="Suffix" value={form.suffix} onChange={(value) => setForm((state) => ({ ...state, suffix: value }))} />
            <SelectField
              label="Default BIN Type"
              value={form.defaultBinType ?? ''}
              options={['', 'Standard', 'Bulk', 'Cold-Chain', 'Hazardous', 'Overflow', 'Return', 'Quarantine']}
              onChange={(value) => setForm((state) => ({ ...state, defaultBinType: (value || undefined) as BinType | undefined }))}
            />
            <Field label="Location Profile (optional)" value={form.locationProfileName} onChange={(value) => setForm((state) => ({ ...state, locationProfileName: value }))} />
          </div>

          {preview && (
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden', marginTop: '18px' }}>
              <div style={{ padding: '12px 14px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Preview</span>
                <span style={{ fontSize: '12px', color: preview.conflictCount > 0 ? '#D97706' : '#16A34A' }}>
                  {preview.validCount} valid · {preview.conflictCount} conflicts
                </span>
              </div>
              <div>
                {preview.rows.map((row) => (
                  <div key={row.proposedCode} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1fr 130px', gap: '10px', padding: '10px 14px', borderTop: '1px solid var(--color-border)', fontSize: '12px' }}>
                    <span>{row.sequenceNumber}</span>
                    <span>{row.proposedCode}</span>
                    <span>{row.proposedName}</span>
                    <span style={{ color: row.conflict ? '#D97706' : '#16A34A' }}>
                      {row.conflict ? row.conflictReason : 'Ready'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {previewStale && (
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', background: '#FEF3C7', color: '#92400E' }}>
              <AlertTriangle size={14} />
              <span style={{ fontSize: '12px' }}>Input changed after preview. Regenerate preview before commit.</span>
            </div>
          )}

          {message && (
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', background: step === 4 ? '#DCFCE7' : '#FEF2F2', color: step === 4 ? '#166534' : '#991B1B' }}>
              {step === 4 ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
              <span style={{ fontSize: '12px' }}>{message}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 18px', borderTop: '1px solid var(--color-border)' }}>
          <button type="button" onClick={onClose} style={secondaryBtn}>Close</button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={generatePreview} style={secondaryBtn}>
              Generate preview
            </button>
            <button type="button" onClick={commitBulk} disabled={!preview || previewStale || committing} style={{ ...primaryBtn, opacity: !preview || previewStale || committing ? 0.5 : 1 }}>
              Commit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function mapTemplateLevelToLocationType(levelCode?: string, parent?: WarehouseLocation | null): LocationType {
  const normalized = levelCode?.trim().toUpperCase();
  if (normalized === 'ZONE') return 'Zone';
  if (normalized === 'AISLE') return 'Aisle';
  if (normalized === 'RACK') return 'Rack';
  if (normalized === 'SHELF') return 'Shelf';
  if (normalized === 'BIN') return 'BIN';
  if (normalized === 'DOCK') return 'Dock';
  if (normalized === 'STAGING') return 'Staging';
  if (normalized === 'QC') return 'QC';
  if (normalized === 'SCRAP') return 'Scrap';
  if (normalized === 'VIRTUAL') return 'Virtual';
  if (parent?.profile.locationType === 'Shelf') return 'BIN';
  if (parent) return 'General';
  return 'Zone';
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle} />
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} style={inputStyle} />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle}>
        {options.map((option) => (
          <option key={option || 'empty'} value={option}>
            {option || 'None'}
          </option>
        ))}
      </select>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
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
  color: 'white',
  border: 'none',
};
