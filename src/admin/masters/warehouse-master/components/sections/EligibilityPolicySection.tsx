// ─── EligibilityPolicySection ─────────────────────────────────────────────────

import React, { useState } from 'react';
import { Plus, Trash2, Info } from 'lucide-react';
import type { ConfigSectionProps } from './sectionTypes';
import type { EligibilityPolicy } from '../../types/warehouse.types';
import type { EligibilityMode } from '../../types/warehouse.enums';

import { inputBase, inputRO, labelBase, hintTxt, sCard, sHead, sBody, SectionActionRow } from './sectionStyles';

// Local editable rule shape
type EditableRule = {
  id: string;
  ruleType: 'ItemCode' | 'Category' | 'HsnCode' | 'Attribute';
  ruleValue: string;
  allowedOrBlocked: 'Allowed' | 'Blocked';
};

type LocalPolicy = {
  mode: EligibilityMode;
  rules: EditableRule[];
  defaultFallback: 'Allow' | 'Block';
};

const MODES: EligibilityMode[] = ['Open', 'Restricted', 'Basic-Hybrid', 'Category-Based', 'Advanced-Hybrid'];

function toLocal(w: ConfigSectionProps['warehouse']): LocalPolicy {
  const policy = w.eligibilityPolicy;
  return {
    mode: policy?.mode ?? 'Open',
    defaultFallback: policy?.defaultFallback ?? 'Allow',
    rules: (policy?.rules ?? []).map((r) => ({
      id: r.ruleId,
      ruleType: r.ruleType,
      ruleValue: r.ruleValue,
      allowedOrBlocked: r.allowedOrBlocked,
    })),
  };
}

export function EligibilityPolicySection({ warehouse, readOnly, saving, onSave }: ConfigSectionProps) {
  const [local, setLocal] = useState<LocalPolicy>(() => toLocal(warehouse));
  const [dirty, setDirty] = useState(false);

  function setMode(mode: EligibilityMode) {
    setLocal((s) => ({ ...s, mode }));
    setDirty(true);
  }

  function setFallback(v: 'Allow' | 'Block') {
    setLocal((s) => ({ ...s, defaultFallback: v }));
    setDirty(true);
  }

  function addRule() {
    const newRule: EditableRule = {
      id: `ELIG-${Date.now()}`,
      ruleType: 'Category',
      ruleValue: '',
      allowedOrBlocked: 'Allowed',
    };
    setLocal((s) => ({ ...s, rules: [...s.rules, newRule] }));
    setDirty(true);
  }

  function updateRule(id: string, field: keyof EditableRule, value: string) {
    setLocal((s) => ({
      ...s,
      rules: s.rules.map((r) => r.id === id ? { ...r, [field]: value } : r),
    }));
    setDirty(true);
  }

  function removeRule(id: string) {
    setLocal((s) => ({ ...s, rules: s.rules.filter((r) => r.id !== id) }));
    setDirty(true);
  }

  function discard() {
    setLocal(toLocal(warehouse));
    setDirty(false);
  }

  async function save() {
    const rules = (local.rules as unknown as EditableRule[]).map((r) => ({
      ruleId: r.id, ruleType: r.ruleType, ruleValue: r.ruleValue, allowedOrBlocked: r.allowedOrBlocked,
    }));
    await onSave({ eligibilityPolicy: { ...local, rules } as EligibilityPolicy });
    setDirty(false);
  }

  const modeDescriptions: Record<EligibilityMode, string> = {
    'Open': 'All items are eligible by default.',
    'Restricted': 'Only items explicitly listed are eligible.',
    'Basic-Hybrid': 'Combines allow and block rules with a default fallback.',
    'Category-Based': 'Eligibility is driven by item category rules.',
    'Advanced-Hybrid': 'Full rule engine with priority and override support.',
  };

  return (
    <div data-testid="section-eligibility">
      <div style={sCard}>
        <div style={sHead}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Eligibility Mode</span>
        </div>
        <div style={sBody}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {MODES.map((mode) => (
              <label
                key={mode}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '10px 14px', borderRadius: '8px',
                  border: `2px solid ${local.mode === mode ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: local.mode === mode ? 'color-mix(in srgb, var(--color-primary) 5%, white)' : 'var(--color-surface)',
                  cursor: readOnly ? 'not-allowed' : 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="eligibilityMode"
                  checked={local.mode === mode}
                  onChange={() => setMode(mode)}
                  disabled={readOnly}
                  style={{ marginTop: '2px', accentColor: 'var(--color-primary)' }}
                />
                <div>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: 600 }}>{mode}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    {modeDescriptions[mode]}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {/* Default Fallback */}
          <div style={{ maxWidth: '280px', marginBottom: '16px' }}>
            <label style={labelBase}>Default Fallback</label>
            <select
              value={local.defaultFallback}
              onChange={(e) => setFallback(e.target.value as 'Allow' | 'Block')}
              style={readOnly ? inputRO : inputBase}
              disabled={readOnly}
            >
              <option value="Allow">Allow</option>
              <option value="Block">Block</option>
            </select>
            <p style={hintTxt}>Applied when no matching rule is found. Most restrictive rule wins.</p>
          </div>

          <div style={{ padding: '10px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', fontSize: '11px', color: '#1E40AF', display: 'flex', gap: '6px', marginBottom: '14px' }}>
            <Info size={13} style={{ flexShrink: 0 }} />
            <span>
              When multiple rules apply to the same item, the <strong>most restrictive</strong> (Block) takes precedence.
              Overriding a "Block" rule requires a separate approval workflow.
            </span>
          </div>
        </div>
      </div>

      {/* Rules table */}
      <div style={sCard}>
        <div style={sHead}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Eligibility Rules ({local.rules.length})</span>
          {!readOnly && (
            <button type="button" onClick={addRule} style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px',
              fontSize: '11px', fontWeight: 600, borderRadius: '6px',
              border: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer',
            }}>
              <Plus size={12} /> Add Rule
            </button>
          )}
        </div>
        {local.rules.length === 0 ? (
          <div style={{ padding: '24px 20px', textAlign: 'center', fontSize: '13px', color: 'var(--color-text-muted)' }}>
            No rules configured. The default fallback applies to all items.
          </div>
        ) : (
          <div>
            <div style={{
              display: 'grid', gridTemplateColumns: '100px 1fr 80px 36px',
              gap: '8px', padding: '6px 16px', background: 'var(--color-surface-subtle)',
              borderBottom: '1px solid var(--color-border)', fontSize: '10px', fontWeight: 700,
              color: 'var(--color-text-muted)', textTransform: 'uppercase',
            }}>
              <span>Rule Type</span><span>Rule Value</span><span>Decision</span><span />
            </div>
            {(local.rules as unknown as EditableRule[]).map((rule) => (
              <div key={rule.id} style={{
                display: 'grid', gridTemplateColumns: '100px 1fr 80px 36px',
                gap: '8px', padding: '8px 16px', borderBottom: '1px solid var(--color-border)',
                alignItems: 'center',
              }}>
                <select
                  value={rule.ruleType}
                  onChange={(e) => updateRule(rule.id, 'ruleType', e.target.value)}
                  style={{ ...inputBase, padding: '5px 8px', fontSize: '12px' }}
                  disabled={readOnly}
                >
                  <option value="Category">Category</option>
                  <option value="ItemCode">ItemCode</option>
                  <option value="HsnCode">HsnCode</option>
                  <option value="Attribute">Attribute</option>
                </select>
                <input
                  type="text"
                  value={rule.ruleValue}
                  onChange={(e) => updateRule(rule.id, 'ruleValue', e.target.value)}
                  style={{ ...inputBase, padding: '5px 8px', fontSize: '12px' }}
                  placeholder="Category / Item code"
                  disabled={readOnly}
                />
                <select
                  value={rule.allowedOrBlocked}
                  onChange={(e) => updateRule(rule.id, 'allowedOrBlocked', e.target.value as 'Allowed' | 'Blocked')}
                  style={{ ...inputBase, padding: '5px 8px', fontSize: '12px' }}
                  disabled={readOnly}
                >
                  <option value="Allowed">Allowed</option>
                  <option value="Blocked">Blocked</option>
                </select>
                {!readOnly && (
                  <button type="button" onClick={() => removeRule(rule.id)} title="Remove" style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '26px', height: '26px', borderRadius: '6px',
                    border: '1px solid #FCA5A5', background: '#FEF2F2', cursor: 'pointer', color: '#DC2626',
                  }}>
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <SectionActionRow dirty={dirty} saving={saving} readOnly={readOnly} onSave={save} onDiscard={discard} />
    </div>
  );
}
