import React, { useEffect, useMemo, useState } from 'react';
import type {
  QuickHierarchyCodingPolicyInput,
  QuickHierarchyCommitResult,
  QuickHierarchyPattern,
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

export const QuickHierarchyWizard: React.FC<QuickHierarchyWizardProps> = ({
  open,
  warehouseId,
  onClose,
  onCommitted,
  service = warehouseMockAdapter,
}) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [patterns, setPatterns] = useState<QuickHierarchyPattern[]>([]);
  const [patternKey, setPatternKey] = useState<string>('');
  const [templateAction, setTemplateAction] = useState<'reuse-active' | 'create-from-pattern'>('create-from-pattern');
  const [countsByLevel, setCountsByLevel] = useState<Record<string, number>>({});
  const [codingByLevel, setCodingByLevel] = useState<QuickHierarchyCodingPolicyInput[]>([]);
  const [preview, setPreview] = useState<QuickHierarchyPreviewResult | null>(null);
  const [commitResult, setCommitResult] = useState<QuickHierarchyCommitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setCommitResult(null);
    setPreview(null);
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

  if (!open) return null;

  async function handleGeneratePreview() {
    if (!selectedPattern) return;
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const payload: QuickHierarchyPreviewInput = {
        warehouseId,
        patternKey: selectedPattern.key,
        templateAction,
        activateTemplateOnCommit: true,
        countsByLevel,
        codingByLevel,
        defaults: { status: 'Draft' },
      };
      const result = await service.previewQuickHierarchy(warehouseId, payload);
      setPreview(result);
      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview.');
    } finally {
      setLoading(false);
    }
  }

  async function handleValidateAndCommit() {
    if (!preview || !selectedPattern) return;
    setLoading(true);
    setError(null);
    try {
      const payload: QuickHierarchyPreviewInput = {
        warehouseId,
        patternKey: selectedPattern.key,
        templateAction,
        activateTemplateOnCommit: true,
        countsByLevel,
        codingByLevel,
        defaults: { status: 'Draft' },
      };
      const validation = await service.validateQuickHierarchy(warehouseId, payload);
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
                      setPreview(null);
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
                  type="radio"
                  checked={templateAction === 'reuse-active'}
                  onChange={() => setTemplateAction('reuse-active')}
                />
                <span style={{ fontSize: '12px' }}>Reuse existing active template</span>
              </label>
              <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>
                Scope note: item mapping, capacity details, responsibility assignment, and import/export alignment are intentionally excluded.
              </p>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: 'grid', gap: '10px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Preview uses deterministic generation and duplicate checks against existing hierarchy.</p>
              <button type="button" onClick={handleGeneratePreview} disabled={loading || !selectedPattern} style={{ justifySelf: 'start', border: '1px solid #2563EB', background: '#2563EB', color: 'white', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer' }}>
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
                  <div style={{ maxHeight: '300px', overflow: 'auto', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', fontSize: '11px', padding: '8px', borderBottom: '1px solid #E5E7EB' }}>Level</th>
                          <th style={{ textAlign: 'left', fontSize: '11px', padding: '8px', borderBottom: '1px solid #E5E7EB' }}>Code</th>
                          <th style={{ textAlign: 'left', fontSize: '11px', padding: '8px', borderBottom: '1px solid #E5E7EB' }}>Full Identifier</th>
                          <th style={{ textAlign: 'left', fontSize: '11px', padding: '8px', borderBottom: '1px solid #E5E7EB' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.slice(0, 150).map((row) => (
                          <tr key={row.tempNodeId}>
                            <td style={{ fontSize: '12px', padding: '8px', borderBottom: '1px solid #F3F4F6' }}>{row.levelCode}</td>
                            <td style={{ fontSize: '12px', padding: '8px', borderBottom: '1px solid #F3F4F6' }}>{row.nodeCode}</td>
                            <td style={{ fontSize: '12px', padding: '8px', borderBottom: '1px solid #F3F4F6' }}>{row.fullLocationIdentifier}</td>
                            <td style={{ fontSize: '12px', padding: '8px', borderBottom: '1px solid #F3F4F6', color: row.validationStatus === 'Conflict' ? '#B91C1C' : '#166534' }}>
                              {row.validationStatus}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button type="button" onClick={handleValidateAndCommit} disabled={loading || preview.conflictCount > 0} style={{ justifySelf: 'start', border: '1px solid #166534', background: '#166534', color: 'white', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer' }}>
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

export default QuickHierarchyWizard;
