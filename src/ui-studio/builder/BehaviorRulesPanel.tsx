import { useMemo, useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import {
  addConditionGroupToRuleDraft,
  addConditionLeafToRuleDraft,
  addRuleToDraft,
  removeConditionNodeFromRuleDraft,
  removeRuleFromDraft,
  reorderRulesInDraft,
  updateConditionNodeInRuleDraft,
  updateRuleInDraft,
} from './draftState';
import {
  BUILDER_CONDITION_MAX_DEPTH,
  conditionToDraft,
} from './types';
import type {
  BuilderConditionGroupDraft,
  BuilderConditionLeafDraft,
  BuilderConditionNodeDraft,
  BuilderDraftState,
  BuilderRuleAllowedEffect,
  BuilderRuleDraft,
} from './types';

type BehaviorRulesPanelProps = {
  draft: BuilderDraftState;
  setDraft: (updater: (current: BuilderDraftState) => BuilderDraftState) => void;
};

const allowedEffects: BuilderRuleAllowedEffect[] = ['show', 'hide', 'enable', 'disable'];
const operators: BuilderConditionLeafDraft['operator'][] = [
  'equals', 'notEquals', 'contains', 'greaterThan', 'lessThan', 'isEmpty', 'isNotEmpty',
];

const EFFECT_COLOR: Record<BuilderRuleAllowedEffect, string> = {
  show: '#16a34a',
  hide: '#6b7280',
  enable: '#2563eb',
  disable: '#dc2626',
};

export default function BehaviorRulesPanel({ draft, setDraft }: BehaviorRulesPanelProps) {
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [targetType, setTargetType] = useState<'component' | 'action'>('component');
  const [targetId, setTargetId] = useState('');
  const [effect, setEffect] = useState<BuilderRuleAllowedEffect>('show');

  const targets = useMemo(() => {
    if (targetType === 'component') {
      return draft.metadata.components.map((c) => ({ id: c.id, label: c.label ?? c.id }));
    }
    return draft.metadata.actions.map((a) => ({ id: a.id, label: a.label }));
  }, [draft, targetType]);

  const effectiveTarget = targetId || targets[0]?.id || '';

  const addRule = () => {
    if (!effectiveTarget) return;
    const nextRule: BuilderRuleDraft = {
      id: `rule-${draft.metadata.rules.length + 1}`,
      targetType,
      targetId: effectiveTarget,
      effect,
      priority: draft.metadata.rules.length,
      condition: { all: [{ contextPath: 'mode', operator: 'equals', value: 'preview' }] },
    };
    setDraft((current) => addRuleToDraft(current, { rule: nextRule }));
    setExpandedRuleId(nextRule.id);
    setShowAddForm(false);
  };

  const renderConditionNode = (
    ruleId: string,
    node: BuilderConditionNodeDraft,
    parentGroupId?: string,
    depth = 0,
  ) => {
    if (node.nodeType === 'leaf') {
      return (
        <div key={node.id} className="condition-leaf">
          <div className="condition-leaf__row">
            <input
              className="ui-studio-input condition-leaf__source"
              value={node.contextPath ?? node.field ?? ''}
              placeholder="source"
              onChange={(e) =>
                setDraft((current) =>
                  updateConditionNodeInRuleDraft(current, {
                    ruleId, nodeId: node.id,
                    patch: { contextPath: e.target.value, field: undefined },
                  }),
                )
              }
            />
            <select
              className="ui-studio-select condition-leaf__op"
              value={node.operator}
              onChange={(e) =>
                setDraft((current) =>
                  updateConditionNodeInRuleDraft(current, {
                    ruleId, nodeId: node.id,
                    patch: { operator: e.target.value as BuilderConditionLeafDraft['operator'] },
                  }),
                )
              }
            >
              {operators.map((op) => <option key={op} value={op}>{op}</option>)}
            </select>
            <input
              className="ui-studio-input condition-leaf__value"
              value={String(node.value ?? '')}
              placeholder="value"
              onChange={(e) =>
                setDraft((current) =>
                  updateConditionNodeInRuleDraft(current, { ruleId, nodeId: node.id, patch: { value: e.target.value } }),
                )
              }
            />
            <button
              type="button"
              className="condition-leaf__remove"
              onClick={() => setDraft((current) => removeConditionNodeFromRuleDraft(current, { ruleId, nodeId: node.id }))}
              aria-label="Remove condition"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      );
    }

    const depthLimitReached = depth + 1 >= BUILDER_CONDITION_MAX_DEPTH;
    return (
      <div key={node.id} className="condition-group">
        <div className="condition-group__header">
          <select
            className="ui-studio-select condition-group__type"
            value={node.groupType}
            onChange={(e) =>
              setDraft((current) =>
                updateConditionNodeInRuleDraft(current, {
                  ruleId, nodeId: node.id,
                  patch: { groupType: e.target.value as BuilderConditionGroupDraft['groupType'] },
                }),
              )
            }
          >
            <option value="all">ALL of</option>
            <option value="any">ANY of</option>
          </select>
          <div className="condition-group__actions">
            <button
              type="button"
              className="ui-studio-btn ui-studio-btn--xs"
              onClick={() =>
                setDraft((current) =>
                  addConditionLeafToRuleDraft(current, {
                    ruleId, parentGroupId: node.id, operator: 'equals', contextPath: 'mode', value: 'preview',
                  }),
                )
              }
            >
              + Row
            </button>
            {!depthLimitReached && (
              <button
                type="button"
                className="ui-studio-btn ui-studio-btn--xs"
                onClick={() =>
                  setDraft((current) =>
                    addConditionGroupToRuleDraft(current, { ruleId, parentGroupId: node.id, groupType: 'all' }),
                  )
                }
              >
                + Group
              </button>
            )}
            {parentGroupId && (
              <button
                type="button"
                className="condition-leaf__remove"
                onClick={() => setDraft((current) => removeConditionNodeFromRuleDraft(current, { ruleId, nodeId: node.id }))}
                aria-label="Remove group"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="condition-group__children">
          {node.children.map((child) => renderConditionNode(ruleId, child, node.id, depth + 1))}
        </div>
      </div>
    );
  };

  return (
    <div data-testid="builder-behavior-panel" className="rule-panel">
      {/* Rules list */}
      {draft.metadata.rules.length === 0 && !showAddForm && (
        <p className="ui-studio-subtle" style={{ padding: '8px 0' }}>No rules yet. Add one to control field visibility and state.</p>
      )}

      <div className="rule-list">
        {draft.metadata.rules.map((rule, index) => {
          const isExpanded = expandedRuleId === rule.id;
          const target = rule.targetComponentId ?? rule.targetActionId ?? 'unknown';
          const targetLabel =
            draft.metadata.components.find((c) => c.id === target)?.label ??
            draft.metadata.actions.find((a) => a.id === target)?.label ??
            target;
          const conditionDraft = conditionToDraft(rule.condition, rule.id);

          return (
            <div key={rule.id} className={`rule-card${isExpanded ? ' rule-card--expanded' : ''}`}>
              {/* Card header */}
              <div
                className="rule-card__header"
                role="button"
                tabIndex={0}
                onClick={() => setExpandedRuleId(isExpanded ? null : rule.id)}
                onKeyDown={(e) => e.key === 'Enter' && setExpandedRuleId(isExpanded ? null : rule.id)}
                aria-expanded={isExpanded}
              >
                <span className="rule-card__chevron">
                  {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </span>
                <span
                  className="rule-card__effect-badge"
                  style={{ background: `${EFFECT_COLOR[rule.effect as BuilderRuleAllowedEffect] ?? '#6b7280'}18`, color: EFFECT_COLOR[rule.effect as BuilderRuleAllowedEffect] ?? '#6b7280', border: `1px solid ${EFFECT_COLOR[rule.effect as BuilderRuleAllowedEffect] ?? '#6b7280'}40` }}
                >
                  {rule.effect}
                </span>
                <span className="rule-card__arrow">â†’</span>
                <span className="rule-card__target">{targetLabel}</span>
                <div className="rule-card__actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="rule-card__icon-btn"
                    disabled={index === 0}
                    onClick={() => setDraft((current) => reorderRulesInDraft(current, { fromIndex: index, toIndex: index - 1 }))}
                    aria-label="Move rule up"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    type="button"
                    className="rule-card__icon-btn"
                    disabled={index >= draft.metadata.rules.length - 1}
                    onClick={() => setDraft((current) => reorderRulesInDraft(current, { fromIndex: index, toIndex: index + 1 }))}
                    aria-label="Move rule down"
                  >
                    <ArrowDown size={12} />
                  </button>
                  <button
                    type="button"
                    className="rule-card__icon-btn rule-card__icon-btn--danger"
                    onClick={() => setDraft((current) => removeRuleFromDraft(current, { ruleId: rule.id }))}
                    aria-label="Delete rule"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Expanded condition builder */}
              {isExpanded && (
                <div className="rule-card__body">
                  <div className="rule-card__effect-row">
                    <span className="ui-studio-label" style={{ marginBottom: 0 }}>Effect:</span>
                    <select
                      className="ui-studio-select"
                      value={rule.effect}
                      onChange={(e) =>
                        setDraft((current) =>
                          updateRuleInDraft(current, { ruleId: rule.id, patch: { effect: e.target.value as BuilderRuleAllowedEffect } }),
                        )
                      }
                      style={{ width: 'auto' }}
                    >
                      {allowedEffects.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="rule-card__condition-label">Condition</div>
                  {renderConditionNode(rule.id, conditionDraft)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Inline add rule form */}
      {showAddForm && (
        <div className="rule-add-form">
          <div className="ui-studio-grid">
            <label className="ui-studio-label">
              Target Type
              <select className="ui-studio-select" value={targetType} onChange={(e) => setTargetType(e.target.value as 'component' | 'action')}>
                <option value="component">Component</option>
                <option value="action">Action</option>
              </select>
            </label>
            <label className="ui-studio-label">
              Target
              <select className="ui-studio-select" value={effectiveTarget} onChange={(e) => setTargetId(e.target.value)}>
                {targets.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </label>
            <label className="ui-studio-label">
              Effect
              <select className="ui-studio-select" value={effect} onChange={(e) => setEffect(e.target.value as BuilderRuleAllowedEffect)}>
                {allowedEffects.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </label>
          </div>
          <div className="rule-add-form__actions">
            <button type="button" className="ui-studio-btn ui-studio-btn--primary" onClick={addRule} disabled={!effectiveTarget}>
              Add Rule
            </button>
            <button type="button" className="ui-studio-btn" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add rule trigger */}
      {!showAddForm && (
        <button type="button" className="rule-add-trigger" onClick={() => setShowAddForm(true)}>
          <Plus size={13} /> Add Rule
        </button>
      )}
    </div>
  );
}
