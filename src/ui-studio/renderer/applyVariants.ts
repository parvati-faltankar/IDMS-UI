import type { RuntimeContext, ViewMetadata } from '../types';

function matchesContext(view: ViewMetadata, context: RuntimeContext) {
  return (view.variants ?? []).filter((variant) => {
    const byTenant = !variant.appliesWhen.tenantId || variant.appliesWhen.tenantId === context.tenantId;
    const byWorkflow =
      !variant.appliesWhen.workflowState || variant.appliesWhen.workflowState === context.workflowState;
    const byChannel = !variant.appliesWhen.channel || variant.appliesWhen.channel === context.channel;
    const byRole =
      !variant.appliesWhen.roleIds || variant.appliesWhen.roleIds.some((role) => context.roles.includes(role));

    return byTenant && byWorkflow && byChannel && byRole;
  });
}

export function applyVariants(view: ViewMetadata, context: RuntimeContext): ViewMetadata {
  const matched = matchesContext(view, context).sort((a, b) => a.priority - b.priority);
  if (matched.length === 0) {
    return view;
  }

  const next: ViewMetadata = {
    ...view,
    components: [...view.components],
    actions: [...view.actions],
    rules: [...view.rules],
  };

  for (const variant of matched) {
    if (variant.delta.componentChanges?.length) {
      next.components = [...next.components, ...variant.delta.componentChanges];
    }
    if (variant.delta.actionChanges?.length) {
      next.actions = [...next.actions, ...variant.delta.actionChanges];
    }
    if (variant.delta.ruleChanges?.length) {
      next.rules = [...next.rules, ...variant.delta.ruleChanges];
    }
  }

  return next;
}

