import type { RuntimeContext, ViewMetadata } from '../types';

type TargetVisualState = {
  hidden?: boolean;
  disabled?: boolean;
};

const allowedEffects = new Set(['show', 'hide', 'enable', 'disable']);

function evaluateCondition(condition: NonNullable<ViewMetadata['rules'][number]['condition']>, context: RuntimeContext): boolean {
  if (condition.all?.length) {
    return condition.all.every((item) => evaluateCondition(item, context));
  }

  if (condition.any?.length) {
    return condition.any.some((item) => evaluateCondition(item, context));
  }

  if (!condition.operator) {
    return false;
  }

  const sourceValue = condition.contextPath ? ((context as unknown as Record<string, unknown>)[condition.contextPath] ?? undefined) : undefined;

  switch (condition.operator) {
    case 'equals':
      return sourceValue === condition.value;
    case 'notEquals':
      return sourceValue !== condition.value;
    case 'contains':
      return typeof sourceValue === 'string' && typeof condition.value === 'string'
        ? sourceValue.includes(condition.value)
        : false;
    case 'isEmpty':
      return sourceValue === null || sourceValue === undefined || sourceValue === '';
    case 'isNotEmpty':
      return !(sourceValue === null || sourceValue === undefined || sourceValue === '');
    case 'greaterThan':
      return typeof sourceValue === 'number' && typeof condition.value === 'number' ? sourceValue > condition.value : false;
    case 'lessThan':
      return typeof sourceValue === 'number' && typeof condition.value === 'number' ? sourceValue < condition.value : false;
    default:
      return false;
  }
}

export function evaluateRuleTargetStates(view: ViewMetadata, context: RuntimeContext) {
  const componentStates = new Map<string, TargetVisualState>();
  const actionStates = new Map<string, TargetVisualState>();

  for (const rule of view.rules) {
    if (!allowedEffects.has(rule.effect)) {
      continue;
    }

    if (!evaluateCondition(rule.condition, context)) {
      continue;
    }

    if (rule.targetComponentId) {
      const current = componentStates.get(rule.targetComponentId) ?? {};
      if (rule.effect === 'show') {
        current.hidden = false;
      } else if (rule.effect === 'hide') {
        current.hidden = true;
      } else if (rule.effect === 'enable') {
        current.disabled = false;
      } else if (rule.effect === 'disable') {
        current.disabled = true;
      }
      componentStates.set(rule.targetComponentId, current);
    }

    if (rule.targetActionId) {
      const current = actionStates.get(rule.targetActionId) ?? {};
      if (rule.effect === 'show') {
        current.hidden = false;
      } else if (rule.effect === 'hide') {
        current.hidden = true;
      } else if (rule.effect === 'enable') {
        current.disabled = false;
      } else if (rule.effect === 'disable') {
        current.disabled = true;
      }
      actionStates.set(rule.targetActionId, current);
    }
  }

  return { componentStates, actionStates };
}

export function evaluateBehaviorRules(view: ViewMetadata, context: RuntimeContext): ViewMetadata {
  const { componentStates } = evaluateRuleTargetStates(view, context);

  const next: ViewMetadata = {
    ...view,
    components: view.components.map((component) => ({
      ...component,
      props: {
        ...(component.props ?? {}),
        hidden: componentStates.get(component.id)?.hidden ?? false,
        disabled: componentStates.get(component.id)?.disabled ?? false,
      },
    })),
  };

  return next;
}
