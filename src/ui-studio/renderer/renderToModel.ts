import { getComponentDefinition } from '../registry/componentRegistry';
import type { RuntimeContext, ViewMetadata } from '../types';
import { evaluateRuleTargetStates } from './evaluateBehaviorRules';
import { createDiagnostic } from './renderDiagnostics';
import { resolveRuntimeMetadata } from './resolveRuntimeMetadata';
import type { RenderModel, RenderResult } from './types';

export function renderToModel(view: ViewMetadata, context: RuntimeContext): RenderResult {
  const metadata = resolveRuntimeMetadata(view, context);
  const targetStates = evaluateRuleTargetStates(view, context);
  const diagnostics: ReturnType<typeof createDiagnostic>[] = [];

  const componentModels = metadata.components.flatMap((component) => {
    const definition = getComponentDefinition(component.type);
    if (!definition) {
      diagnostics.push(
        createDiagnostic(
          metadata,
          'COMPONENT_NOT_REGISTERED',
          `Component "${component.type}" is not registered.`,
          component.id,
        ),
      );
      return [];
    }

    const hidden = Boolean((component.props as { hidden?: boolean } | undefined)?.hidden);
    const disabled = Boolean((component.props as { disabled?: boolean } | undefined)?.disabled);
    return [{ id: component.id, type: component.type, label: component.label, hidden, disabled }];
  });

  const actionModels = metadata.actions.map((action) => ({
    id: action.id,
    label: action.label,
    hidden: targetStates.actionStates.get(action.id)?.hidden ?? false,
    disabled: targetStates.actionStates.get(action.id)?.disabled ?? false,
  }));

  const model: RenderModel = {
    viewId: metadata.id,
    componentModels,
    actionModels,
    diagnostics,
  };

  return { metadata, model };
}
