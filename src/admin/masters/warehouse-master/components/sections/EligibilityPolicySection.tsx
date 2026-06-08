import React, { useMemo, useState } from 'react';
import { Info, Plus, Trash2 } from 'lucide-react';
import type { ConfigSectionProps } from './sectionTypes';
import type { EligibilityPolicy } from '../../types/warehouse.types';
import type { EligibilityMode } from '../../types/warehouse.enums';
import {
  canConfigureLocationEligibility,
  summarizeEligibilityRuleMode,
} from '../../utils/policyWorkbench';
import {
  hintTxt,
  inputBase,
  inputRO,
  labelBase,
  sBody,
  sCard,
  sHead,
  SectionActionRow,
} from './sectionStyles';

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

function toLocal(warehouse: ConfigSectionProps['warehouse']): LocalPolicy {
  const policy = warehouse.eligibilityPolicy;
  return {
    mode: policy?.mode ?? 'Open',
    defaultFallback: policy?.defaultFallback ?? 'Allow',
    rules: (policy?.rules ?? []).map((rule) => ({
      id: rule.ruleId,
      ruleType: rule.ruleType,
      ruleValue: rule.ruleValue,
      allowedOrBlocked: rule.allowedOrBlocked,
    })),
  };
}

export function EligibilityPolicySection({ warehouse, locations, readOnly, saving, onSave }: ConfigSectionProps) {
  const [local, setLocal] = useState<LocalPolicy>(() => toLocal(warehouse));
  const [dirty, setDirty] = useState(false);

  const eligibleLeafCount = useMemo(
    () => locations.filter(canConfigureLocationEligibility).length,
    [locations],
  );

  function setMode(mode: EligibilityMode) {
    setLocal((current) => ({ ...current, mode }));
    setDirty(true);
  }

  function setFallback(value: 'Allow' | 'Block') {
    setLocal((current) => ({ ...current, defaultFallback: value }));
    setDirty(true);
  }

  function addRule() {
    setLocal((current) => ({
      ...current,
      rules: [
        ...current.rules,
        {
          id: `ELIG-${Date.now()}`,
          ruleType: local.mode === 'Category-Based' ? 'Category' : 'ItemCode',
          ruleValue: '',
          allowedOrBlocked: 'Allowed',
        },
      ],
    }));
    setDirty(true);
  }

  function updateRule(id: string, field: keyof EditableRule, value: string) {
    setLocal((current) => ({
      ...current,
      rules: current.rules.map((rule) => (rule.id === id ? { ...rule, [field]: value } : rule)),
    }));
    setDirty(true);
  }

  function removeRule(id: string) {
    setLocal((current) => ({
      ...current,
      rules: current.rules.filter((rule) => rule.id !== id),
    }));
    setDirty(true);
  }

  function discard() {
    setLocal(toLocal(warehouse));
    setDirty(false);
  }

  async function save() {
    await onSave({
      eligibilityPolicy: {
        mode: local.mode,
        defaultFallback: local.defaultFallback,
        rules: local.rules.map((rule) => ({
          ruleId: rule.id,
          ruleType: local.mode === 'Category-Based' ? 'Category' : rule.ruleType,
          ruleValue: rule.ruleValue,
          allowedOrBlocked: rule.allowedOrBlocked,
        })),
      } as EligibilityPolicy,
    });
    setDirty(false);
  }

  return (
    <div data-testid="section-eligibility">
      <div style={sCard}>
        <div style={sHead}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Eligibility Mode</span>
        </div>
        <div style={sBody}>
          <div style={{ marginBottom: '14px', padding: '12px 14px', borderRadius: '8px', border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8', fontSize: '12px' }}>
            {summarizeEligibilityRuleMode(local)}
          </div>
          <div style={{ marginBottom: '14px', padding: '12px 14px', borderRadius: '8px', border: '1px solid #D1FAE5', background: '#ECFDF5', color: '#065F46', fontSize: '12px' }}>
            Location-level eligibility overrides should only be configured on active inventory-allowed leaf locations.
            Eligible leaf locations currently available: {eligibleLeafCount}.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {MODES.map((mode) => (
              <label
                key={mode}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
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
                    {mode === 'Open' && 'All items are eligible by default.'}
                    {mode === 'Restricted' && 'Only items explicitly allowed remain eligible.'}
                    {mode === 'Basic-Hybrid' && 'Allow and deny rules are combined with a fallback result.'}
                    {mode === 'Category-Based' && 'Category rules drive eligibility and deny rules apply before allow rules.'}
                    {mode === 'Advanced-Hybrid' && 'Most flexible mode with deny-before-allow behavior and explicit fallback.'}
                  </p>
                </div>
              </label>
            ))}
          </div>

          <div style={{ maxWidth: '280px' }}>
            <label style={labelBase}>Default Fallback</label>
            <select value={local.defaultFallback} onChange={(event) => setFallback(event.target.value as 'Allow' | 'Block')} style={readOnly ? inputRO : inputBase} disabled={readOnly}>
              <option value="Allow">Allow</option>
              <option value="Block">Block</option>
            </select>
            <p style={hintTxt}>When no rule matches, the fallback decides the result after deny rules have been checked first.</p>
          </div>
        </div>
      </div>

      <div style={sCard}>
        <div style={sHead}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Eligibility Rules ({local.rules.length})</span>
          {!readOnly && (
            <button type="button" onClick={addRule} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', fontSize: '11px', fontWeight: 600, borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer' }}>
              <Plus size={12} />
              Add Rule
            </button>
          )}
        </div>
        <div style={sBody}>
          <div style={{ padding: '10px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', fontSize: '11px', color: '#1E40AF', display: 'flex', gap: '6px', marginBottom: '14px' }}>
            <Info size={13} style={{ flexShrink: 0 }} />
            Deny rules are always evaluated before allow rules, regardless of row order.
          </div>
          {local.rules.length === 0 ? (
            <div style={{ padding: '24px 20px', textAlign: 'center', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              No rules configured. The fallback currently decides eligibility for unmatched items.
            </div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 100px 36px', gap: '8px', padding: '6px 16px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                <span>Rule Type</span>
                <span>Rule Value</span>
                <span>Decision</span>
                <span />
              </div>
              {local.rules.map((rule) => (
                <div key={rule.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 100px 36px', gap: '8px', padding: '8px 16px', borderBottom: '1px solid var(--color-border)', alignItems: 'center' }}>
                  <select value={local.mode === 'Category-Based' ? 'Category' : rule.ruleType} onChange={(event) => updateRule(rule.id, 'ruleType', event.target.value)} style={{ ...inputBase, padding: '5px 8px', fontSize: '12px' }} disabled={readOnly || local.mode === 'Category-Based'}>
                    <option value="Category">Category</option>
                    <option value="ItemCode">ItemCode</option>
                    <option value="HsnCode">HsnCode</option>
                    <option value="Attribute">Attribute</option>
                  </select>
                  <input type="text" value={rule.ruleValue} onChange={(event) => updateRule(rule.id, 'ruleValue', event.target.value)} style={{ ...inputBase, padding: '5px 8px', fontSize: '12px' }} placeholder="Category / Item code / Attribute" disabled={readOnly} />
                  <select value={rule.allowedOrBlocked} onChange={(event) => updateRule(rule.id, 'allowedOrBlocked', event.target.value as 'Allowed' | 'Blocked')} style={{ ...inputBase, padding: '5px 8px', fontSize: '12px' }} disabled={readOnly}>
                    <option value="Blocked">Blocked</option>
                    <option value="Allowed">Allowed</option>
                  </select>
                  {!readOnly && (
                    <button type="button" onClick={() => removeRule(rule.id)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #FCA5A5', background: '#FEF2F2', cursor: 'pointer', color: '#DC2626' }}>
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <SectionActionRow dirty={dirty} saving={saving} readOnly={readOnly} onSave={save} onDiscard={discard} />
    </div>
  );
}
