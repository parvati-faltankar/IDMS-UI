// ─── InventoryControlSection ──────────────────────────────────────────────────

import { useState } from 'react';
import type { ConfigSectionProps } from './sectionTypes';
import { labelBase, hintTxt, sCard, sHead, sBody, SectionActionRow } from './sectionStyles';
import { DerivedValueDisplay } from '../DerivedValueDisplay';
import { ConfigurationImpactBanner } from '../ConfigurationImpactBanner';
import { deriveBinManaged } from '../../utils/warehouseDerivations';
import type { InventoryControlMode } from '../../types/warehouse.enums';

/** Returns true when inventory mode must not be changed (active/blocked warehouse). */
export function isInventoryModeChangeLocked(warehouseStatus: string): boolean {
  return warehouseStatus === 'Active' || warehouseStatus === 'Blocked';
}

interface LocalState {
  inventoryControlMode: InventoryControlMode;
  wmsEnabled: boolean;
}

function toLocal(w: ConfigSectionProps['warehouse']): LocalState {
  return {
    inventoryControlMode: w.inventoryControlMode,
    wmsEnabled: w.wmsEnabled,
  };
}

export function InventoryControlSection({ warehouse, readOnly, saving, onSave }: ConfigSectionProps) {
  const [local, setLocal] = useState<LocalState>(() => toLocal(warehouse));
  const [dirty, setDirty] = useState(false);
  const [showImpact, setShowImpact] = useState(false);
  const [pendingMode, setPendingMode] = useState<InventoryControlMode | null>(null);

  const modeLocked = isInventoryModeChangeLocked(warehouse.status);
  const binManaged = deriveBinManaged(local.inventoryControlMode);

  function requestModeChange(mode: InventoryControlMode) {
    if (mode === local.inventoryControlMode) return;
    if (modeLocked) return;
    // Stage the change — show impact warning first
    setPendingMode(mode);
    setShowImpact(true);
  }

  function confirmModeChange() {
    if (pendingMode) {
      setLocal((s) => ({ ...s, inventoryControlMode: pendingMode }));
      setDirty(true);
    }
    setPendingMode(null);
    setShowImpact(false);
  }

  function discardModeChange() {
    setPendingMode(null);
    setShowImpact(false);
  }

  function setWms(v: boolean) {
    setLocal((s) => ({ ...s, wmsEnabled: v }));
    setDirty(true);
  }

  function discard() {
    setLocal(toLocal(warehouse));
    setDirty(false);
    setShowImpact(false);
    setPendingMode(null);
  }

  async function save() {
    await onSave({
      inventoryControlMode: local.inventoryControlMode,
      wmsEnabled: local.wmsEnabled,
    });
    setDirty(false);
  }

  return (
    <div data-testid="section-inventory-control">
      {showImpact && (
        <ConfigurationImpactBanner
          tone="warning"
          title="Changing Inventory Control Mode"
          description={`Switching to "${pendingMode ?? ''}" has permanent downstream effects.`}
          impacts={[
            { text: 'BIN Managed flag changes immediately — derived from this setting.', reversible: false },
            { text: 'Hierarchy templates and locations configured for the previous mode may be invalidated.', reversible: false },
            { text: 'Auto Putaway and Auto Picking availability changes with the mode.', reversible: true },
            { text: 'Existing stock transactions will not be retroactively re-classified.', reversible: false },
          ]}
        />
      )}

      {showImpact && pendingMode && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <button type="button" onClick={confirmModeChange} style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '7px 14px', fontSize: '12px', fontWeight: 600,
            borderRadius: '7px', border: 'none', background: '#D97706', color: 'white', cursor: 'pointer',
          }}>
            Confirm mode change
          </button>
          <button type="button" onClick={discardModeChange} style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '7px 12px', fontSize: '12px', fontWeight: 500,
            borderRadius: '7px', border: '1px solid var(--color-border)',
            background: 'transparent', color: 'var(--color-text)', cursor: 'pointer',
          }}>
            Cancel
          </button>
        </div>
      )}

      <div style={sCard}>
        <div style={sHead}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Inventory Control Mode</span>
          {modeLocked && (
            <span style={{
              fontSize: '10px', padding: '2px 7px', borderRadius: '4px',
              background: '#F1F5F9', color: '#475569', fontWeight: 600,
            }}>
              locked — {warehouse.status.toLowerCase()}
            </span>
          )}
        </div>
        <div style={sBody}>
          {modeLocked && (
            <div style={{
              padding: '10px 14px', background: '#F1F5F9', border: '1px solid #CBD5E1',
              borderRadius: '8px', fontSize: '12px', color: '#475569', marginBottom: '14px',
            }}>
              Inventory Control Mode cannot be changed while the warehouse is {warehouse.status.toLowerCase()}.
              To change the mode, the warehouse must be returned to Draft status via a migration workflow.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {([
              {
                value: 'Warehouse-Level' as InventoryControlMode,
                label: 'Warehouse-Level Inventory',
                description: 'Stock tracked at warehouse level only. No location or BIN required for receipts and issues.',
              },
              {
                value: 'Location-BIN-Level' as InventoryControlMode,
                label: 'Location / BIN-Level Inventory',
                description: 'Stock tracked at individual location or BIN. Requires hierarchy template and active locations.',
                recommended: true,
              },
            ]).map((opt) => (
              <label
                key={opt.value}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '14px 16px', borderRadius: '10px',
                  border: `2px solid ${local.inventoryControlMode === opt.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: local.inventoryControlMode === opt.value
                    ? 'color-mix(in srgb, var(--color-primary) 5%, white)'
                    : 'var(--color-surface)',
                  cursor: modeLocked || readOnly ? 'not-allowed' : 'pointer',
                  opacity: modeLocked ? 0.75 : 1,
                  transition: 'all 0.12s',
                }}
              >
                <input
                  type="radio"
                  name="inventoryControlMode"
                  checked={local.inventoryControlMode === opt.value}
                  onChange={() => requestModeChange(opt.value)}
                  disabled={modeLocked || readOnly}
                  style={{ marginTop: '2px', accentColor: 'var(--color-primary)' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>{opt.label}</span>
                    {opt.recommended && (
                      <span style={{
                        fontSize: '10px', fontWeight: 700, padding: '1px 6px',
                        borderRadius: '9999px', background: '#DCFCE7', color: '#15803D',
                      }}>
                        Recommended for enterprise
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {opt.description}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {/* Derived BIN Managed */}
          <div style={{ marginBottom: '16px' }}>
            <DerivedValueDisplay
              label="BIN Managed"
              value={binManaged ? 'Yes' : 'No'}
              derivedFrom={`Derived from Inventory Control Mode = "${local.inventoryControlMode}"`}
              lockReason="Cannot be edited directly."
              testId="inv-derived-bin-managed"
            />
          </div>

          {/* Contextual notes */}
          {local.inventoryControlMode === 'Warehouse-Level' && (
            <p style={{ ...hintTxt, marginBottom: '14px' }}>
              Auto Putaway and Auto Picking are disabled for Warehouse-Level mode.
            </p>
          )}

          {/* WMS */}
          <div style={{ marginTop: '4px' }}>
            <label style={labelBase}>WMS Integration</label>
            <label
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px', maxWidth: '360px',
                padding: '10px 14px', borderRadius: '8px', cursor: readOnly ? 'not-allowed' : 'pointer',
                border: `1.5px solid ${local.wmsEnabled ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: local.wmsEnabled ? 'color-mix(in srgb, var(--color-primary) 5%, white)' : 'var(--color-surface)',
              }}
            >
              <input
                type="checkbox"
                checked={local.wmsEnabled}
                onChange={(e) => setWms(e.target.checked)}
                disabled={readOnly}
                style={{ marginTop: '2px', accentColor: 'var(--color-primary)' }}
              />
              <div>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 600 }}>WMS Enabled</p>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Warehouse Management System integration is active for this warehouse.
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <SectionActionRow
        dirty={dirty}
        saving={saving}
        readOnly={readOnly}
        onSave={save}
        onDiscard={discard}
      />
    </div>
  );
}
