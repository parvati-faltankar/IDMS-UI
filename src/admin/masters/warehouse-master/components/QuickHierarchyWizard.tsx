import React, { useEffect, useMemo, useState } from 'react';
import type {
  QuickHierarchyDefaultsInput,
  QuickHierarchyCodingPolicyInput,
  QuickHierarchyCommitResult,
  QuickHierarchyPattern,
  QuickHierarchyPreviewRow,
  QuickHierarchyPreviewInput,
  QuickHierarchyPreviewResult,
} from '../types/warehouse.dto';
import type { WarehouseService } from '../services/warehouseService';
import { warehouseMockAdapter } from '../services/warehouseMockAdapter';

interface QuickHierarchyWizardProps {
  readonly open: boolean;
  readonly warehouseId: string;
  readonly onClose: () => void;
  readonly onCommitted?: (result: QuickHierarchyCommitResult) => void;
  readonly service?: WarehouseService;
  readonly permission?: {
    readonly canManageHierarchy: boolean;
    readonly reason?: string;
  };
}

const STEPS = [
  'Select Pattern',
  'Configure Counts',
  'Configure Coding',
  'Configure Defaults',
  'Preview',
  'Validate and Commit',
] as const;

function createCodingDefaults(pattern: QuickHierarchyPattern): QuickHierarchyCodingPolicyInput[] {
  return pattern.levels.map((level) => ({
    levelCode: level.levelCode,
    codePrefix: level.levelCode.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 3) || 'LVL',
    startSequence: 1,
    sequenceLength: 2,
    separator: '',
    suffix: '',
  }));
}

function createCountDefaults(pattern: QuickHierarchyPattern): Record<string, number> {
  return pattern.levels.reduce<Record<string, number>>((acc, level) => {
    acc[level.levelCode] = 2;
    return acc;
  }, {});
}

function createDefaultsInput(): QuickHierarchyDefaultsInput {
  return {
    status: 'Draft',
    levelRole: 'Structural',
    inventoryEndpointEligible: true,
    capacityApplicable: true,
    itemEligibilityApplicable: true,
    responsibilityApplicable: true,
    barcodeApplicable: false,
    qrApplicable: false,
    transactionPurposes: ['Storage'],
    capacityEnforcementMode: 'None',
    defaultResponsibilityRole: 'AreaSupervisor',
  };
}

export function buildQuickPreviewFingerprint(input: QuickHierarchyPreviewInput): string {
  return JSON.stringify(input);
}

export function isQuickPreviewInvalidated(previousFingerprint: string | null, currentInput: QuickHierarchyPreviewInput): boolean {
  if (!previousFingerprint) return false;
  return previousFingerprint !== buildQuickPreviewFingerprint(currentInput);
}

export function buildQuickPreviewTree(rows: QuickHierarchyPreviewRow[]) {
  const byParent = new Map<string, QuickHierarchyPreviewRow[]>();
  for (const row of rows) {
    const key = row.parentTempNodeId ?? 'ROOT';
    byParent.set(key, [...(byParent.get(key) ?? []), row]);
  }
  return byParent;
}

export const QuickHierarchyWizard: React.FC<QuickHierarchyWizardProps> = ({
  open,
  warehouseId,
  onClose,
  onCommitted,
  service = warehouseMockAdapter,
  permission = { canManageHierarchy: true },
}) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [patterns, setPatterns] = useState<QuickHierarchyPattern[]>([]);
  const [patternKey, setPatternKey] = useState<string>('');
  const [templateAction, setTemplateAction] = useState<'reuse-active' | 'create-from-pattern'>('create-from-pattern');
  const [countsByLevel, setCountsByLevel] = useState<Record<string, number>>({});
  const [codingByLevel, setCodingByLevel] = useState<QuickHierarchyCodingPolicyInput[]>([]);
  const [preview, setPreview] = useState<QuickHierarchyPreviewResult | null>(null);
  const [previewFingerprint, setPreviewFingerprint] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'tree' | 'table'>('tree');
  const [activateTemplateOnCommit, setActivateTemplateOnCommit] = useState(true);
  const [defaults, setDefaults] = useState<QuickHierarchyDefaultsInput>(createDefaultsInput());
  const [commitResult, setCommitResult] = useState<QuickHierarchyCommitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setCommitResult(null);
    setPreview(null);
    setPreviewFingerprint(null);
    setDefaults(createDefaultsInput());
    setStep(0);
    service.listQuickHierarchyPatterns(warehouseId)
      .then((items) => {
        setPatterns(items);
        const first = items[0];
        if (first) {
          setPatternKey(first.key);
          setCountsByLevel(createCountDefaults(first));
          setCodingByLevel(createCodingDefaults(first));
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to load quick hierarchy patterns.');
      })
      .finally(() => setLoading(false));
  }, [open, service, warehouseId]);

  const selectedPattern = useMemo(
    () => patterns.find((item) => item.key === patternKey) ?? null,
    [patterns, patternKey],
  );

  useEffect(() => {
    if (!selectedPattern) return;
    setCountsByLevel(createCountDefaults(selectedPattern));
    setCodingByLevel(createCodingDefaults(selectedPattern));
    setPreview(null);
    setPreviewFingerprint(null);
    setCommitResult(null);
  }, [selectedPattern]);

  const totalNodes = useMemo(() => {
    if (!selectedPattern) return 0;
    let parents = 1;
    let total = 0;
    for (const level of selectedPattern.levels) {
      const count = Math.max(0, countsByLevel[level.levelCode] ?? 0);
      const nodes = parents * count;
      total += nodes;
      parents = nodes;
    }
    return total;
  }, [selectedPattern, countsByLevel]);

  const currentInput: QuickHierarchyPreviewInput | null = useMemo(() => {
    if (!selectedPattern) return null;
    return {
      warehouseId,
      patternKey: selectedPattern.key,
      templateAction,
      activateTemplateOnCommit,
      countsByLevel,
      codingByLevel,
      defaults,
      permissionGranted: permission.canManageHierarchy,
    };
  }, [selectedPattern, warehouseId, templateAction, activateTemplateOnCommit, countsByLevel, codingByLevel, defaults, permission.canManageHierarchy]);

  const previewStale = currentInput ? isQuickPreviewInvalidated(previewFingerprint, currentInput) : false;

  if (!open) return null;

  async function handleGeneratePreview() {
    if (!selectedPattern || !currentInput) return;
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const result = await service.previewQuickHierarchy(warehouseId, currentInput);
      setPreview(result);
      setPreviewFingerprint(buildQuickPreviewFingerprint(currentInput));
      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview.');
    } finally {
      setLoading(false);
    }
  }

  async function handleValidateAndCommit() {
    if (!preview || !selectedPattern || !currentInput) return;
    if (previewStale) {
      setError('Preview is outdated. Regenerate preview before commit.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const validation = await service.validateQuickHierarchy(warehouseId, currentInput);
      if (!validation.valid) {
        setError(validation.issues.map((issue) => issue.message).join(' | '));
        return;
      }
      const result = await service.commitQuickHierarchy(warehouseId, {
        warehouseId,
        previewToken: preview.previewToken,
        paramsHash: preview.paramsHash,
        idempotencyKey: `QH-${Date.now()}`,
      });
      setCommitResult(result);
      if (result.success) {
        onCommitted?.(result);
      } else {
        setError(result.errors.map((item) => item.reason).join(' | '));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Commit failed.');
    } finally {
      setLoading(false);
    }
  }

  function nextStep() {
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function prevStep() {
    setStep((current) => Math.max(current - 1, 0));
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.25)' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 'min(840px, 100%)', height: '100%', background: 'white', borderLeft: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Quick Hierarchy Wizard</h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6B7280' }}>Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
          </div>
          <button type="button" onClick={onClose} style={{ border: '1px solid #D1D5DB', borderRadius: '8px', padding: '6px 10px', background: 'white', cursor: 'pointer' }}>
            Close
          </button>
        </div>

        <div style={{ padding: '16px 18px', overflow: 'auto', flex: 1 }}>
          {loading && <p style={{ fontSize: '12px', color: '#6B7280' }}>Working...</p>}
          {error && <div style={{ marginBottom: '12px', fontSize: '12px', color: '#B91C1C', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '8px 10px' }}>{error}</div>}
          {!permission.canManageHierarchy && (
            <div style={{ marginBottom: '12px', fontSize: '12px', color: '#92400E', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '8px', padding: '8px 10px' }}>
              {permission.reason ?? 'You do not have permission to manage hierarchy setup for this warehouse.'}
            </div>
          )}

          {step === 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '10px' }}>
              {patterns.map((pattern) => (
                <button
                  key={pattern.key}
                  type="button"
                  onClick={() => setPatternKey(pattern.key)}
                  style={{
                    textAlign: 'left',
                    border: `2px solid ${patternKey === pattern.key ? '#2563EB' : '#D1D5DB'}`,
                    borderRadius: '10px',
                    padding: '12px',
                    background: 'white',
                    cursor: 'pointer',
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '13px' }}>{pattern.label}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6B7280' }}>{pattern.description}</p>
                </button>
              ))}
            </div>
          )}

          {step === 1 && selectedPattern && (
            <div style={{ display: 'grid', gap: '10px' }}>
              {selectedPattern.levels.map((level) => (
                <label key={level.levelCode} style={{ display: 'grid', gap: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>{level.levelName} count per parent</span>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={countsByLevel[level.levelCode] ?? 1}
                    onChange={(event) => {
                      const count = Number(event.target.value || 1);
                      setCountsByLevel((current) => ({ ...current, [level.levelCode]: count }));
                    }}
                    style={{ border: '1px solid #D1D5DB', borderRadius: '8px', padding: '8px' }}
                  />
                </label>
              ))}
              <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Estimated total nodes: {totalNodes}</p>
            </div>
          )}

          {step === 2 && selectedPattern && (
            <div style={{ display: 'grid', gap: '12px' }}>
              {selectedPattern.levels.map((level) => {
                const coding = codingByLevel.find((item) => item.levelCode === level.levelCode);
                if (!coding) return null;
                return (
                  <div key={level.levelCode} style={{ border: '1px solid #E5E7EB', borderRadius: '10px', padding: '10px' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700 }}>{level.levelName} coding</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '8px' }}>
                      <input value={coding.codePrefix} onChange={(event) => setCodingByLevel((list) => list.map((item) => item.levelCode === level.levelCode ? { ...item, codePrefix: event.target.value } : item))} placeholder="Prefix" style={{ border: '1px solid #D1D5DB', borderRadius: '8px', padding: '8px' }} />
                      <input type="number" value={coding.startSequence} onChange={(event) => setCodingByLevel((list) => list.map((item) => item.levelCode === level.levelCode ? { ...item, startSequence: Number(event.target.value || 1) } : item))} placeholder="Start" style={{ border: '1px solid #D1D5DB', borderRadius: '8px', padding: '8px' }} />
                      <input type="number" min={1} max={6} value={coding.sequenceLength} onChange={(event) => setCodingByLevel((list) => list.map((item) => item.levelCode === level.levelCode ? { ...item, sequenceLength: Number(event.target.value || 2) } : item))} placeholder="Length" style={{ border: '1px solid #D1D5DB', borderRadius: '8px', padding: '8px' }} />
                      <input value={coding.separator ?? ''} onChange={(event) => setCodingByLevel((list) => list.map((item) => item.levelCode === level.levelCode ? { ...item, separator: event.target.value } : item))} placeholder="Separator" style={{ border: '1px solid #D1D5DB', borderRadius: '8px', padding: '8px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'grid', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="radio"
                  checked={templateAction === 'create-from-pattern'}
                  onChange={() => setTemplateAction('create-from-pattern')}
                />
                <span style={{ fontSize: '12px' }}>Create template from selected pattern and activate during commit</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={activateTemplateOnCommit}
                  onChange={(event) => setActivateTemplateOnCommit(event.target.checked)}
                />
                <span style={{ fontSize: '12px' }}>Activate template on commit</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="radio"
                  checked={templateAction === 'reuse-active'}
                  onChange={() => setTemplateAction('reuse-active')}
                />
                <span style={{ fontSize: '12px' }}>Reuse existing active template</span>
              </label>
              <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>
                Scope note: item mapping, capacity details, responsibility assignment, and import/export alignment are intentionally excluded.
              </p>
              <div style={{ border: '1px solid #E5E7EB', borderRadius: '10px', padding: '10px', display: 'grid', gap: '8px' }}>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 700 }}>Defaults configuration</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
                  <label style={{ display: 'grid', gap: '4px' }}>
                    <span style={{ fontSize: '12px' }}>Default location type</span>
                    <select value={defaults.defaultLocationType ?? ''} onChange={(event) => setDefaults((current) => ({ ...current, defaultLocationType: event.target.value ? event.target.value as QuickHierarchyDefaultsInput['defaultLocationType'] : undefined }))} style={{ border: '1px solid #D1D5DB', borderRadius: '8px', padding: '8px' }}>
                      <option value="">Pattern default</option>
                      <option value="BIN">BIN</option>
                      <option value="Zone">Zone</option>
                      <option value="Aisle">Aisle</option>
                      <option value="Rack">Rack</option>
                      <option value="Shelf">Shelf</option>
                      <option value="Staging">Staging</option>
                      <option value="General">General</option>
                    </select>
                  </label>
                  <label style={{ display: 'grid', gap: '4px' }}>
                    <span style={{ fontSize: '12px' }}>Level role</span>
                    <select value={defaults.levelRole ?? 'Structural'} onChange={(event) => setDefaults((current) => ({ ...current, levelRole: event.target.value as QuickHierarchyDefaultsInput['levelRole'] }))} style={{ border: '1px solid #D1D5DB', borderRadius: '8px', padding: '8px' }}>
                      <option value="Structural">Structural</option>
                      <option value="InventoryEndpoint">Inventory Endpoint</option>
                    </select>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={defaults.capacityApplicable ?? true} onChange={(event) => setDefaults((current) => ({ ...current, capacityApplicable: event.target.checked }))} />
                    <span style={{ fontSize: '12px' }}>Capacity applicable</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={defaults.itemEligibilityApplicable ?? true} onChange={(event) => setDefaults((current) => ({ ...current, itemEligibilityApplicable: event.target.checked }))} />
                    <span style={{ fontSize: '12px' }}>Item eligibility applicable</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={defaults.responsibilityApplicable ?? true} onChange={(event) => setDefaults((current) => ({ ...current, responsibilityApplicable: event.target.checked }))} />
                    <span style={{ fontSize: '12px' }}>Responsibility applicable</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={defaults.barcodeApplicable ?? false} onChange={(event) => setDefaults((current) => ({ ...current, barcodeApplicable: event.target.checked }))} />
                    <span style={{ fontSize: '12px' }}>Barcode applicable</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={defaults.qrApplicable ?? false} onChange={(event) => setDefaults((current) => ({ ...current, qrApplicable: event.target.checked }))} />
                    <span style={{ fontSize: '12px' }}>QR applicable</span>
                  </label>
                  <label style={{ display: 'grid', gap: '4px' }}>
                    <span style={{ fontSize: '12px' }}>Capacity enforcement</span>
                    <select value={defaults.capacityEnforcementMode ?? 'None'} onChange={(event) => setDefaults((current) => ({ ...current, capacityEnforcementMode: event.target.value as QuickHierarchyDefaultsInput['capacityEnforcementMode'] }))} style={{ border: '1px solid #D1D5DB', borderRadius: '8px', padding: '8px' }}>
                      <option value="None">None</option>
                      <option value="Informational">Informational</option>
                      <option value="Warning">Warning</option>
                      <option value="HardBlock">HardBlock</option>
                      <option value="ApprovalRequired">ApprovalRequired</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: 'grid', gap: '10px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Preview uses deterministic generation and duplicate checks against existing hierarchy.</p>
              <button type="button" onClick={handleGeneratePreview} disabled={loading || !selectedPattern || !permission.canManageHierarchy} style={{ justifySelf: 'start', border: '1px solid #2563EB', background: '#2563EB', color: 'white', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer' }}>
                Generate Preview
              </button>
              {preview && (
                <p style={{ margin: 0, fontSize: '12px', color: '#374151' }}>
                  Generated {preview.totalGeneratedNodes} nodes ({preview.conflictCount} conflicts)
                </p>
              )}
            </div>
          )}

          {step === 5 && (
            <div style={{ display: 'grid', gap: '10px' }}>
              {preview ? (
                <>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={() => setPreviewMode('tree')} style={{ border: '1px solid #D1D5DB', borderRadius: '8px', padding: '6px 10px', background: previewMode === 'tree' ? '#EEF2FF' : 'white' }}>Tree Preview</button>
                    <button type="button" onClick={() => setPreviewMode('table')} style={{ border: '1px solid #D1D5DB', borderRadius: '8px', padding: '6px 10px', background: previewMode === 'table' ? '#EEF2FF' : 'white' }}>Table Preview</button>
                  </div>
                  {previewStale && (
                    <div style={{ fontSize: '12px', color: '#B45309', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '8px 10px' }}>
                      Preview is outdated. Regenerate preview before commit.
                    </div>
                  )}
                  {previewMode === 'tree' && (
                    <div style={{ maxHeight: '280px', overflow: 'auto', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Warehouse Root</div>
                      <TreePreviewList parentId="ROOT" rows={preview.rows} />
                    </div>
                  )}
                  {previewMode === 'table' && (
                    <div style={{ maxHeight: '300px', overflow: 'auto', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', fontSize: '11px', padding: '8px', borderBottom: '1px solid #E5E7EB' }}>Level</th>
                          <th style={{ textAlign: 'left', fontSize: '11px', padding: '8px', borderBottom: '1px solid #E5E7EB' }}>Code</th>
                          <th style={{ textAlign: 'left', fontSize: '11px', padding: '8px', borderBottom: '1px solid #E5E7EB' }}>Full Identifier</th>
                          <th style={{ textAlign: 'left', fontSize: '11px', padding: '8px', borderBottom: '1px solid #E5E7EB' }}>Type</th>
                          <th style={{ textAlign: 'left', fontSize: '11px', padding: '8px', borderBottom: '1px solid #E5E7EB' }}>Role</th>
                          <th style={{ textAlign: 'left', fontSize: '11px', padding: '8px', borderBottom: '1px solid #E5E7EB' }}>Capabilities</th>
                          <th style={{ textAlign: 'left', fontSize: '11px', padding: '8px', borderBottom: '1px solid #E5E7EB' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.slice(0, 150).map((row) => (
                          <tr key={row.tempNodeId}>
                            <td style={{ fontSize: '12px', padding: '8px', borderBottom: '1px solid #F3F4F6' }}>{row.levelCode}</td>
                            <td style={{ fontSize: '12px', padding: '8px', borderBottom: '1px solid #F3F4F6' }}>{row.nodeCode}</td>
                            <td style={{ fontSize: '12px', padding: '8px', borderBottom: '1px solid #F3F4F6' }}>{row.fullLocationIdentifier}</td>
                            <td style={{ fontSize: '12px', padding: '8px', borderBottom: '1px solid #F3F4F6' }}>{row.locationType}</td>
                            <td style={{ fontSize: '12px', padding: '8px', borderBottom: '1px solid #F3F4F6' }}>{row.levelRole}</td>
                            <td style={{ fontSize: '12px', padding: '8px', borderBottom: '1px solid #F3F4F6' }}>
                              {row.inventoryEndpointEligible ? 'Endpoint' : 'Non-endpoint'} | Cap:{String(row.capacityApplicable)} | Item:{String(row.itemEligibilityApplicable)} | Resp:{String(row.responsibilityApplicable)}
                            </td>
                            <td style={{ fontSize: '12px', padding: '8px', borderBottom: '1px solid #F3F4F6', color: row.validationStatus === 'Conflict' ? '#B91C1C' : '#166534' }}>
                              {row.validationStatus}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  )}
                  <button type="button" onClick={handleValidateAndCommit} disabled={loading || preview.conflictCount > 0 || previewStale || !permission.canManageHierarchy} style={{ justifySelf: 'start', border: '1px solid #166534', background: '#166534', color: 'white', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer' }}>
                    Validate and Commit
                  </button>
                </>
              ) : (
                <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Generate preview before commit.</p>
              )}
              {commitResult && (
                <p style={{ margin: 0, fontSize: '12px', color: commitResult.success ? '#166534' : '#B91C1C' }}>
                  {commitResult.success ? `Created ${commitResult.createdCount} locations.` : `Commit failed: ${commitResult.errors.map((item) => item.reason).join(' | ')}`}
                </p>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: '12px 18px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between' }}>
          <button type="button" onClick={prevStep} disabled={step === 0 || loading} style={{ border: '1px solid #D1D5DB', borderRadius: '8px', padding: '7px 10px', background: 'white', cursor: 'pointer' }}>
            Back
          </button>
          <button type="button" onClick={nextStep} disabled={step >= STEPS.length - 1 || loading} style={{ border: '1px solid #111827', borderRadius: '8px', padding: '7px 10px', background: '#111827', color: 'white', cursor: 'pointer' }}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

function TreePreviewList({ parentId, rows }: { parentId: string; rows: QuickHierarchyPreviewRow[] }) {
  const children = rows.filter((row) => (row.parentTempNodeId ?? 'ROOT') === parentId);
  if (children.length === 0) return null;
  return (
    <ul style={{ margin: 0, paddingLeft: '18px' }}>
      {children.map((row) => (
        <li key={row.tempNodeId} style={{ marginBottom: '6px', fontSize: '12px' }}>
          <div>
            <strong>{row.nodeCode}</strong> · {row.nodeName} · {row.fullLocationIdentifier}
          </div>
          <div style={{ fontSize: '11px', color: '#6B7280' }}>
            {row.levelName} | {row.inventoryEndpointEligible ? 'Endpoint' : 'Non-endpoint'} | Capacity: {String(row.capacityApplicable)} | Item: {String(row.itemEligibilityApplicable)} | Responsibility: {String(row.responsibilityApplicable)} | {row.validationStatus}
          </div>
          <TreePreviewList parentId={row.tempNodeId} rows={rows} />
        </li>
      ))}
    </ul>
  );
}

export default QuickHierarchyWizard;
