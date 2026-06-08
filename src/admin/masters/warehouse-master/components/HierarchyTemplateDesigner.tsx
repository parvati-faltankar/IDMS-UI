import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Plus, X } from 'lucide-react';
import { activateHierarchyTemplateMock, createHierarchyTemplateMock } from '../services/warehouseMockAdapter';
import type { CreateHierarchyTemplateInput } from '../types/warehouse.dto';
import type { HierarchyLevel, HierarchyTemplate } from '../types/warehouse.types';

const ROOT_PARENT = 'WAREHOUSE';

interface DesignerState {
  templateCode: string;
  templateName: string;
  versionNumber: string;
  flexiblePathEnabled: boolean;
  effectiveFrom: string;
  levels: HierarchyLevel[];
}

function makeDefaultLevel(sequence: number): HierarchyLevel {
  const presets = [
    { levelCode: 'ZONE', levelName: 'Zone', mandatory: true, leafEligible: false, allowSkipLevel: false, allowedParentLevels: [ROOT_PARENT], allowedChildLevels: ['AISLE', 'BIN'] },
    { levelCode: 'AISLE', levelName: 'Aisle', mandatory: true, leafEligible: false, allowSkipLevel: false, allowedParentLevels: ['ZONE'], allowedChildLevels: ['RACK'] },
    { levelCode: 'RACK', levelName: 'Rack', mandatory: true, leafEligible: false, allowSkipLevel: false, allowedParentLevels: ['AISLE'], allowedChildLevels: ['BIN'] },
    { levelCode: 'BIN', levelName: 'BIN', mandatory: true, leafEligible: true, allowSkipLevel: false, allowedParentLevels: ['WAREHOUSE', 'ZONE', 'RACK'], allowedChildLevels: [] },
  ];
  const preset = presets[Math.min(sequence - 1, presets.length - 1)];
  return {
    levelCode: preset.levelCode,
    levelName: preset.levelName,
    sequence,
    mandatory: preset.mandatory,
    leafEligible: preset.leafEligible,
    allowSkipLevel: preset.allowSkipLevel,
    allowedParentLevels: preset.allowedParentLevels,
    allowedChildLevels: preset.allowedChildLevels,
  };
}

function makeInitialState(template?: HierarchyTemplate): DesignerState {
  if (template) {
    return {
      templateCode: template.templateCode,
      templateName: template.templateName,
      versionNumber: String(template.currentVersion.versionNumber + 1),
      flexiblePathEnabled: template.flexiblePathEnabled,
      effectiveFrom: template.effectiveFrom,
      levels: template.levels.map((level) => ({
        ...level,
        allowedParentLevels: level.allowedParentLevels ?? [],
        allowedChildLevels: level.allowedChildLevels ?? [],
      })),
    };
  }

  return {
    templateCode: 'TPL-NEW',
    templateName: 'Warehouse Hierarchy',
    versionNumber: '1',
    flexiblePathEnabled: true,
    effectiveFrom: new Date().toISOString().slice(0, 10),
    levels: [makeDefaultLevel(1), makeDefaultLevel(2), makeDefaultLevel(3), makeDefaultLevel(4)],
  };
}

interface HierarchyTemplateDesignerProps {
  open: boolean;
  warehouseId: string;
  templates: HierarchyTemplate[];
  activeTemplate?: HierarchyTemplate;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

export function HierarchyTemplateDesigner({
  open,
  warehouseId,
  templates,
  activeTemplate,
  onClose,
  onSaved,
}: HierarchyTemplateDesignerProps) {
  const [state, setState] = useState<DesignerState>(makeInitialState(activeTemplate));
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setState(makeInitialState(activeTemplate));
      setMessage(null);
    }
  }, [activeTemplate, open]);

  const orderedLevels = useMemo(
    () => state.levels
      .map((level, index) => ({ level, index }))
      .sort((left, right) => left.level.sequence - right.level.sequence),
    [state.levels],
  );

  if (!open) return null;

  async function saveTemplate() {
    setSaving(true);
    setMessage(null);
    try {
      const payload: CreateHierarchyTemplateInput = {
        warehouseId,
        templateCode: state.templateCode,
        templateName: state.templateName,
        versionNumber: Number(state.versionNumber) || 1,
        flexiblePathEnabled: state.flexiblePathEnabled,
        effectiveFrom: state.effectiveFrom,
        levels: orderedLevels.map((entry) => entry.level),
      };
      await createHierarchyTemplateMock(payload);
      setMessage('Draft hierarchy template saved.');
      await onSaved();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save hierarchy template.');
    } finally {
      setSaving(false);
    }
  }

  async function activateTemplate(templateId: string) {
    setActivatingId(templateId);
    setMessage(null);
    try {
      await activateHierarchyTemplateMock(warehouseId, templateId);
      setMessage('Hierarchy template activated. Only one active version remains.');
      await onSaved();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to activate hierarchy template.');
    } finally {
      setActivatingId(null);
    }
  }

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <div style={headerStyle}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>Hierarchy Template Designer</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Define template header, level rules, flexible paths, and activate one live version.
            </div>
          </div>
          <button type="button" onClick={onClose} style={closeBtn}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>
          <div style={gridTwo}>
            <Field label="Template Code" value={state.templateCode} onChange={(value) => setState((current) => ({ ...current, templateCode: value.toUpperCase() }))} />
            <Field label="Template Name" value={state.templateName} onChange={(value) => setState((current) => ({ ...current, templateName: value }))} />
            <Field label="Version" value={state.versionNumber} onChange={(value) => setState((current) => ({ ...current, versionNumber: value }))} />
            <Field label="Status" value="Draft" readOnly />
            <Field label="Effective From" value={state.effectiveFrom} onChange={(value) => setState((current) => ({ ...current, effectiveFrom: value }))} type="date" />
            <ToggleField
              label="Flexible Paths"
              checked={state.flexiblePathEnabled}
              onChange={(checked) => setState((current) => ({ ...current, flexiblePathEnabled: checked }))}
            />
          </div>

          <div style={{ marginTop: '20px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Level Rows</div>
            <button
              type="button"
              onClick={() => setState((current) => ({ ...current, levels: [...current.levels, makeDefaultLevel(current.levels.length + 1)] }))}
              style={secondaryBtn}
            >
              <Plus size={14} /> Add Level
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: '1240px', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={rowHeaderStyle}>
                {['Level Code', 'Level Name', 'Sequence', 'Mandatory Level', 'Allow Skip Level', 'Leaf Eligible', 'Allowed Parent Level', 'Allowed Child Level'].map((title) => (
                  <div key={title} style={headerCellStyle}>{title}</div>
                ))}
              </div>
              {orderedLevels.map(({ level, index }) => (
                <div key={`${level.levelCode}-${index}`} style={rowStyle}>
                  <CellInput value={level.levelCode} onChange={(value) => updateLevel(index, { levelCode: value.toUpperCase() })} />
                  <CellInput value={level.levelName} onChange={(value) => updateLevel(index, { levelName: value })} />
                  <CellInput value={String(level.sequence)} onChange={(value) => updateLevel(index, { sequence: Number(value) || level.sequence })} type="number" />
                  <CellToggle checked={level.mandatory} onChange={(checked) => updateLevel(index, { mandatory: checked })} />
                  <CellToggle checked={level.allowSkipLevel} onChange={(checked) => updateLevel(index, { allowSkipLevel: checked })} />
                  <CellToggle checked={level.leafEligible} onChange={(checked) => updateLevel(index, { leafEligible: checked })} />
                  <CellInput
                    value={(level.allowedParentLevels ?? []).join(', ')}
                    onChange={(value) => updateLevel(index, { allowedParentLevels: splitList(value) })}
                    placeholder="WAREHOUSE, ZONE"
                  />
                  <CellInput
                    value={(level.allowedChildLevels ?? []).join(', ')}
                    onChange={(value) => updateLevel(index, { allowedChildLevels: splitList(value) })}
                    placeholder="AISLE, BIN"
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '18px', padding: '12px 14px', borderRadius: '10px', background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', fontSize: '12px' }}>
            Supported flexible examples: `Warehouse -> BIN`, `Warehouse -> Zone -> BIN`, and `Warehouse -> Zone -> Aisle -> Rack -> BIN`.
            Use `Allowed Parent Level` to declare each valid parent path.
          </div>

          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '10px' }}>Existing Template Versions</div>
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
              {templates.map((template) => (
                <div key={template.id} style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.2fr 80px 80px 130px', gap: '10px', alignItems: 'center', padding: '12px 14px', borderTop: '1px solid var(--color-border)', fontSize: '12px' }}>
                  <span style={{ fontFamily: 'monospace' }}>{template.templateCode}</span>
                  <span>{template.templateName}</span>
                  <span>v{template.currentVersion.versionNumber}</span>
                  <span>{template.status}</span>
                  <button
                    type="button"
                    onClick={() => activateTemplate(template.id)}
                    disabled={template.status === 'Active' || activatingId === template.id}
                    style={{ ...secondaryBtn, opacity: template.status === 'Active' || activatingId === template.id ? 0.5 : 1 }}
                  >
                    {template.status === 'Active' ? <><CheckCircle2 size={14} /> Active</> : 'Activate'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {message && (
            <div style={{ marginTop: '16px', padding: '10px 12px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid var(--color-border)', fontSize: '12px', color: 'var(--color-text)' }}>
              {message}
            </div>
          )}
        </div>

        <div style={footerStyle}>
          <button type="button" onClick={onClose} style={secondaryBtn}>Close</button>
          <button type="button" onClick={saveTemplate} disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.6 : 1 }}>
            Save Draft Template
          </button>
        </div>
      </div>
    </div>
  );

  function updateLevel(index: number, patch: Partial<HierarchyLevel>) {
    setState((current) => ({
      ...current,
      levels: current.levels.map((level, currentIndex) =>
        currentIndex === index ? { ...level, ...patch } : level,
      ),
    }));
  }
}

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

function Field({
  label,
  value,
  onChange,
  readOnly = false,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        readOnly={readOnly}
        style={{ ...inputStyle, background: readOnly ? 'var(--color-surface-subtle)' : 'var(--color-surface)' }}
      />
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '30px 0 0' }}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span style={{ fontSize: '12px', color: 'var(--color-text)' }}>{label}</span>
    </label>
  );
}

function CellInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      style={inputStyle}
    />
  );
}

function CellToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label style={{ display: 'flex', justifyContent: 'center' }}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1800,
  background: 'rgba(15, 23, 42, 0.34)',
  display: 'flex',
  justifyContent: 'flex-end',
};

const panelStyle: React.CSSProperties = {
  width: 'min(1180px, 100vw)',
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

const gridTwo: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '12px',
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
  fontSize: '12px',
  color: 'var(--color-text)',
  boxSizing: 'border-box',
};

const secondaryBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
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

const rowHeaderStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
  gap: '10px',
  padding: '10px 12px',
  background: 'var(--color-surface-subtle)',
  borderBottom: '1px solid var(--color-border)',
};

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
  gap: '10px',
  padding: '10px 12px',
  borderTop: '1px solid var(--color-border)',
};

const headerCellStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
};
