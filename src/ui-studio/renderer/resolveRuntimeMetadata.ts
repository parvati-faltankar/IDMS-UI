import type { RuntimeContext, ViewMetadata } from '../types';
import { applyVariants } from './applyVariants';
import { defaultPermissionPruner, type PermissionPruner } from './applyPermissionPruning';
import { evaluateBehaviorRules } from './evaluateBehaviorRules';

export function resolveRuntimeMetadata(
  view: ViewMetadata,
  context: RuntimeContext,
  permissionPruner: PermissionPruner = defaultPermissionPruner,
): ViewMetadata {
  const variantApplied = applyVariants(view, context);
  const permissionPruned = permissionPruner(variantApplied, context);
  return evaluateBehaviorRules(permissionPruned, context);
}

