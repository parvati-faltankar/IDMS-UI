import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, FlaskConical, Lock, Plus, RotateCcw, Trash2 } from 'lucide-react';
import type { ConfigSectionProps } from './sectionTypes';
import type { PickingPolicy } from '../../types/warehouse.types';
import type { PickingStrategy } from '../../types/warehouse.enums';
import {
  addOrderedStrategy,
  moveOrderedStrategy,
  removeOrderedStrategy,
  restoreRecommendedOrder,
  simulatePickingStrategy,
} from '../../utils/policyWorkbench';
import {
  btnOutline,
  hintTxt,
  inputBase,
  inputRO,
  labelBase,
  sBody,
  sCard,
  sHead,
  SectionActionRow,
} from './sectionStyles';

const STRATEGIES: PickingStrategy[] = [
  'FEFO',
  'FIFO',
  'Zone-Wave',
  'Batch',
  'Cluster',
  'Single-Order',
  'LIFO',
  'LEFO',
];

const RECOMMENDED_SEQUENCE: PickingStrategy[] = [
  'FEFO',
  'FIFO',
  'Zone-Wave',
  'Batch',
  'Cluster',
  'Single-Order',
  'LIFO',
  'LEFO',
];

function defaultPolicy(): PickingPolicy {
  return {
    enabled: true,
    strategy: 'FEFO',
    strategySequence: ['FEFO', 'FIFO', 'Zone-Wave'],
    overrideAllowed: true,
  };
}

function toLocal(warehouse: ConfigSectionProps['warehouse']): PickingPolicy {
  const policy = warehouse.autoPicking ?? defaultPolicy();
  const sequence = policy.strategySequence.length > 0 ? policy.strategySequence : [policy.strategy];
  return {
    ...policy,
    strategy: sequence[0] ?? policy.strategy,
    strategySequence: sequence,
  };
}

export function PickingPolicySection({ warehouse, locations, readOnly, saving, onSave }: ConfigSectionProps) {
  const [local, setLocal] = useState<PickingPolicy>(() => toLocal(warehouse));
  const [dirty, setDirty] = useState(false);
  const [pendingStrategy, setPendingStrategy] = useState<PickingStrategy>('Batch');
  const [showSimulation, setShowSimulation] = useState(false);

  const isBinLevel = warehouse.inventoryControlMode === 'Location-BIN-Level';
  const simulation = useMemo(
    () => simulatePickingStrategy(local.strategySequence, locations),
    [local.strategySequence, locations],
  );

  if (!isBinLevel) {
    return (
      <div data-testid="section-picking">
        <div style={{ padding: '14px 18px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '12px', color: '#475569', display: 'flex', gap: '8px' }}>
          <Lock size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
          Auto Picking is not applicable for Warehouse-Level inventory mode.
        </div>
      </div>
    );
  }

  function set<K extends keyof PickingPolicy>(key: K, value: PickingPolicy[K]) {
    setLocal((current) => ({ ...current, [key]: value }));
    setDirty(true);
  }

  function updateSequence(nextSequence: PickingStrategy[]) {
    setLocal((current) => ({
      ...current,
      strategy: nextSequence[0] ?? current.strategy,
      strategySequence: nextSequence,
    }));
    setDirty(true);
  }

  function discard() {
    setLocal(toLocal(warehouse));
    setShowSimulation(false);
    setDirty(false);
  }

  async function save() {
    await onSave({
      autoPicking: {
        ...local,
        strategy: local.strategySequence[0] ?? local.strategy,
        strategySequence: local.strategySequence,
      },
    });
    setDirty(false);
  }

  const availableToAdd = STRATEGIES.filter((strategy) => !local.strategySequence.includes(strategy));

  return (
    <div data-testid="section-picking">
      <div style={sCard}>
        <div style={sHead}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Auto Picking Policy</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', fontSize: '12px' }}>
            <input
              type="checkbox"
              checked={local.enabled}
              onChange={(event) => set('enabled', event.target.checked)}
              disabled={readOnly}
              style={{ accentColor: 'var(--color-primary)' }}
            />
            Enabled
          </label>
        </div>
        <div style={{ ...sBody, opacity: local.enabled ? 1 : 0.45 }}>
          <div style={{ marginBottom: '14px', padding: '12px 14px', border: '1px solid #BFDBFE', background: '#EFF6FF', borderRadius: '8px', fontSize: '12px', color: '#1D4ED8' }}>
            Auto Picking filters candidate stock locations before sorting them by the ordered strategy list. The
            sequence is ordered, not an unordered multi-select.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '14px', alignItems: 'end', marginBottom: '16px' }}>
            <div>
              <label style={labelBase}>Add Strategy</label>
              <select
                value={pendingStrategy}
                onChange={(event) => setPendingStrategy(event.target.value as PickingStrategy)}
                style={readOnly || !local.enabled ? inputRO : inputBase}
                disabled={readOnly || !local.enabled || availableToAdd.length === 0}
              >
                {availableToAdd.length === 0 ? (
                  <option value={pendingStrategy}>All strategies already included</option>
                ) : (
                  availableToAdd.map((strategy) => (
                    <option key={strategy} value={strategy}>{strategy}</option>
                  ))
                )}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => updateSequence(addOrderedStrategy(local.strategySequence, pendingStrategy))}
                disabled={readOnly || !local.enabled || availableToAdd.length === 0}
                style={{ ...btnOutline, opacity: readOnly || !local.enabled || availableToAdd.length === 0 ? 0.5 : 1 }}
              >
                <Plus size={13} />
                Add strategy
              </button>
              <button
                type="button"
                onClick={() => updateSequence(restoreRecommendedOrder(local.strategySequence, RECOMMENDED_SEQUENCE))}
                disabled={readOnly || !local.enabled}
                style={{ ...btnOutline, opacity: readOnly || !local.enabled ? 0.5 : 1 }}
              >
                <RotateCcw size={13} />
                Restore recommended order
              </button>
              <button
                type="button"
                onClick={() => setShowSimulation((current) => !current)}
                disabled={!local.enabled}
                style={{ ...btnOutline, opacity: !local.enabled ? 0.5 : 1 }}
              >
                <FlaskConical size={13} />
                Test strategy
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelBase}>Ordered Strategy Builder</label>
            <p style={{ ...hintTxt, marginBottom: '10px' }}>
              Candidate stock is filtered first, then sorted by this ordered strategy sequence.
            </p>
            {local.strategySequence.length === 0 ? (
              <div style={{ padding: '18px', border: '1px dashed var(--color-border)', borderRadius: '8px', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                Add at least one strategy to enable auto picking.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {local.strategySequence.map((strategy, index) => (
                  <div
                    key={strategy}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '44px 1fr auto',
                      gap: '10px',
                      alignItems: 'center',
                      padding: '10px 12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      background: index === 0 ? 'color-mix(in srgb, var(--color-primary) 4%, white)' : 'var(--color-surface)',
                    }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '9999px', background: 'var(--color-surface-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                      {index + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>{strategy}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {index === 0 ? 'Primary strategy' : 'Fallback strategy'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button type="button" onClick={() => updateSequence(moveOrderedStrategy(local.strategySequence, index, 'up'))} disabled={readOnly || !local.enabled || index === 0} style={{ ...btnOutline, padding: '6px 8px', opacity: readOnly || !local.enabled || index === 0 ? 0.5 : 1 }}>
                        <ArrowUp size={13} />
                      </button>
                      <button type="button" onClick={() => updateSequence(moveOrderedStrategy(local.strategySequence, index, 'down'))} disabled={readOnly || !local.enabled || index === local.strategySequence.length - 1} style={{ ...btnOutline, padding: '6px 8px', opacity: readOnly || !local.enabled || index === local.strategySequence.length - 1 ? 0.5 : 1 }}>
                        <ArrowDown size={13} />
                      </button>
                      <button type="button" onClick={() => updateSequence(removeOrderedStrategy(local.strategySequence, strategy))} disabled={readOnly || !local.enabled} style={{ ...btnOutline, padding: '6px 8px', color: '#DC2626', opacity: readOnly || !local.enabled ? 0.5 : 1 }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
            <input
              type="checkbox"
              checked={local.overrideAllowed}
              onChange={(event) => set('overrideAllowed', event.target.checked)}
              disabled={readOnly || !local.enabled}
              style={{ accentColor: 'var(--color-primary)' }}
            />
            Allow picking users to override the recommended source
          </label>
        </div>
      </div>

      {showSimulation && local.enabled && (
        <div style={sCard}>
          <div style={sHead}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Strategy Test Simulation</span>
          </div>
          <div style={sBody}>
            <div style={{ marginBottom: '14px', padding: '10px 12px', borderRadius: '8px', background: '#FFF7ED', border: '1px solid #FDBA74', color: '#9A3412', fontSize: '12px' }}>
              {simulation.previewLabel}
            </div>
            <p style={{ ...hintTxt, marginBottom: '12px' }}>
              Filters applied before sorting: Active leaf locations, inventory allowed, picking not blocked, available stock required.
            </p>
            <div style={{ display: 'grid', gap: '8px' }}>
              {simulation.candidates.length === 0 ? (
                <div style={{ padding: '16px', border: '1px dashed var(--color-border)', borderRadius: '8px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  No eligible source locations found for preview.
                </div>
              ) : (
                simulation.candidates.map((candidate) => (
                  <div key={candidate.locationId} style={{ padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px', background: simulation.selectedResult?.locationId === candidate.locationId ? 'color-mix(in srgb, var(--color-primary) 4%, white)' : 'var(--color-surface)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{candidate.locationCode}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{candidate.locationName}</div>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        Capacity: {candidate.capacityState ?? 'n/a'}
                      </div>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      Filters: {candidate.filtersApplied.join(', ')}
                    </div>
                    {candidate.exclusions.length > 0 && (
                      <div style={{ marginTop: '4px', fontSize: '11px', color: '#B45309' }}>
                        Warnings: {candidate.exclusions.join(', ')}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            {simulation.tieBreaker && (
              <p style={{ ...hintTxt, marginTop: '12px' }}>Tie-breaker: {simulation.tieBreaker}</p>
            )}
            {simulation.warnings.length > 0 && (
              <div style={{ marginTop: '10px', fontSize: '11px', color: '#B45309' }}>
                {simulation.warnings.join(' ')}
              </div>
            )}
          </div>
        </div>
      )}

      <SectionActionRow dirty={dirty} saving={saving} readOnly={readOnly} onSave={save} onDiscard={discard} />
    </div>
  );
}
