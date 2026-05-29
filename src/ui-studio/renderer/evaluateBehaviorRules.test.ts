import { describe, expect, it } from 'vitest';
import { sampleCreateEditView } from '../metadata/sampleCreateEditView';
import type { RuntimeContext } from '../types';
import { evaluateBehaviorRules, evaluateRuleTargetStates } from './evaluateBehaviorRules';
import { renderToModel } from './renderToModel';

const context: RuntimeContext = {
  userId: 'u1',
  roles: ['sales'],
  mode: 'preview',
  device: 'desktop',
  channel: 'web',
};

describe('ui-studio behavior rule evaluation', () => {
  it('is deterministic for same metadata/context', () => {
    const first = evaluateBehaviorRules(sampleCreateEditView, context);
    const second = evaluateBehaviorRules(sampleCreateEditView, context);
    expect(first.components).toEqual(second.components);
  });

  it('applies last-wins on conflicting matching rules', () => {
    const withConflicts = {
      ...sampleCreateEditView,
      rules: [
        {
          id: 'rule-1',
          targetComponentId: 'customer-name',
          effect: 'hide' as const,
          condition: { contextPath: 'mode', operator: 'equals' as const, value: 'preview' },
        },
        {
          id: 'rule-2',
          targetComponentId: 'customer-name',
          effect: 'show' as const,
          condition: { contextPath: 'mode', operator: 'equals' as const, value: 'preview' },
        },
      ],
    };

    const evaluated = evaluateBehaviorRules(withConflicts, context);
    const target = evaluated.components.find((component) => component.id === 'customer-name');
    expect((target?.props as { hidden?: boolean } | undefined)?.hidden).toBe(false);
  });

  it('applies component and action target states', () => {
    const ruleView = {
      ...sampleCreateEditView,
      rules: [
        {
          id: 'rule-1',
          targetComponentId: 'customer-name',
          effect: 'disable' as const,
          condition: { contextPath: 'mode', operator: 'equals' as const, value: 'preview' },
        },
        {
          id: 'rule-2',
          targetActionId: 'action-submit',
          effect: 'hide' as const,
          condition: { contextPath: 'mode', operator: 'equals' as const, value: 'preview' },
        },
      ],
    };

    const states = evaluateRuleTargetStates(ruleView, context);
    expect(states.componentStates.get('customer-name')?.disabled).toBe(true);
    expect(states.actionStates.get('action-submit')?.hidden).toBe(true);

    const rendered = renderToModel(ruleView, context);
    expect(rendered.model.actionModels.find((action) => action.id === 'action-submit')?.hidden).toBe(true);
  });
});

