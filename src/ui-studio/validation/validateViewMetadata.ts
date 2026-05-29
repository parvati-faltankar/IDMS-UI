import { getComponentDefinition } from '../registry/componentRegistry';
import type { ValidationIssue, ValidationResult, ViewMetadata } from '../types';

function issue(
  id: string,
  severity: ValidationIssue['severity'],
  code: string,
  message: string,
  blocking: boolean,
  path?: string,
): ValidationIssue {
  return { id, severity, code, message, blocking, path };
}

function walkLayoutComponentRefs(node: ViewMetadata['layout'], refs: string[]) {
  for (const componentId of node.componentIds ?? []) {
    refs.push(componentId);
  }

  for (const child of node.children ?? []) {
    walkLayoutComponentRefs(child, refs);
  }
}

function walkLayoutNodes(node: ViewMetadata['layout'], nodes: Array<{ id: string; type: string; parentType?: string }>, parentType?: string) {
  nodes.push({ id: node.id, type: node.type, parentType });
  for (const child of node.children ?? []) {
    walkLayoutNodes(child, nodes, node.type);
  }
}

function walkRowsAndColumns(node: ViewMetadata['layout'], issues: ValidationIssue[]) {
  for (const child of node.children ?? []) {
    if (node.type === 'section' && child.type !== 'row') {
      issues.push(
        issue(
          `layout-section-child-invalid-${child.id}`,
          'error',
          'LAYOUT_SECTION_CHILD_TYPE_INVALID',
          `Section "${node.id}" can only contain row nodes in this slice.`,
          true,
          `layout.${child.id}`,
        ),
      );
    }

    if (node.type === 'row' && child.type !== 'column') {
      issues.push(
        issue(
          `layout-row-child-invalid-${child.id}`,
          'error',
          'LAYOUT_ROW_CHILD_TYPE_INVALID',
          `Row "${node.id}" can only contain column nodes in this slice.`,
          true,
          `layout.${child.id}`,
        ),
      );
    }

    if (node.type === 'column' && child.type === 'row') {
      issues.push(
        issue(
          `layout-row-depth-invalid-${child.id}`,
          'error',
          'LAYOUT_ROW_DEPTH_INVALID',
          'Nested row nodes are not supported in this slice.',
          true,
          `layout.${child.id}`,
        ),
      );
    }

    if (node.type === 'row' && (node.children ?? []).length > 4) {
      issues.push(
        issue(
          `layout-row-column-limit-${node.id}`,
          'error',
          'LAYOUT_ROW_COLUMN_LIMIT_EXCEEDED',
          `Row "${node.id}" cannot have more than 4 columns.`,
          true,
          `layout.${node.id}.children`,
        ),
      );
    }

    walkRowsAndColumns(child, issues);
  }
}

const allowedRuleEffects = new Set(['show', 'hide', 'enable', 'disable']);
const allowedOperators = new Set(['equals', 'notEquals', 'contains', 'greaterThan', 'lessThan', 'isEmpty', 'isNotEmpty']);
const allowedActionTypes = new Set(['ui.navigate', 'ui.open-panel', 'workflow.transition']);

function isConditionShapeValid(condition: ViewMetadata['rules'][number]['condition']): boolean {
  if (!condition) {
    return false;
  }

  if (condition.all?.length) {
    return condition.all.every((child) => isConditionShapeValid(child));
  }

  if (condition.any?.length) {
    return condition.any.every((child) => isConditionShapeValid(child));
  }

  if (!condition.operator || !allowedOperators.has(condition.operator)) {
    return false;
  }

  if (!condition.contextPath && !condition.field) {
    return false;
  }

  return true;
}

function conditionDepth(condition: ViewMetadata['rules'][number]['condition']): number {
  if (condition.all?.length) {
    return 1 + Math.max(...condition.all.map((child) => conditionDepth(child)));
  }
  if (condition.any?.length) {
    return 1 + Math.max(...condition.any.map((child) => conditionDepth(child)));
  }
  return 1;
}

function isConditionGroupEmpty(condition: ViewMetadata['rules'][number]['condition']): boolean {
  if (condition.all !== undefined) {
    return condition.all.length === 0;
  }
  if (condition.any !== undefined) {
    return condition.any.length === 0;
  }
  return false;
}

export function validateViewMetadata(view: ViewMetadata): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!view.id) {
    issues.push(issue('view-id-required', 'error', 'VIEW_ID_REQUIRED', 'View id is required.', true, 'id'));
  }

  if (!view.viewCode) {
    issues.push(issue('view-code-required', 'error', 'VIEW_CODE_REQUIRED', 'View code is required.', true, 'viewCode'));
  }

  if (!view.version) {
    issues.push(issue('view-version-required', 'error', 'VIEW_VERSION_REQUIRED', 'View version is required.', true, 'version'));
  }

  if (view.layout.type !== 'root') {
    issues.push(
      issue(
        'layout-root-type-invalid',
        'error',
        'LAYOUT_ROOT_TYPE_INVALID',
        'Layout root node must use type "root".',
        true,
        'layout.type',
      ),
    );
  }

  const layoutNodes: Array<{ id: string; type: string; parentType?: string }> = [];
  walkLayoutNodes(view.layout, layoutNodes);
  const nodeIds = new Set<string>();
  for (const node of layoutNodes) {
    if (!node.id) {
      issues.push(
        issue('layout-node-id-required', 'error', 'LAYOUT_NODE_ID_REQUIRED', 'Layout node id is required.', true, 'layout'),
      );
      continue;
    }

    if (nodeIds.has(node.id)) {
      issues.push(
        issue(
          `layout-node-duplicate-${node.id}`,
          'error',
          'LAYOUT_NODE_ID_DUPLICATE',
          `Duplicate layout node id "${node.id}".`,
          true,
          `layout.${node.id}`,
        ),
      );
    } else {
      nodeIds.add(node.id);
    }

    if (node.parentType === 'root' && node.type !== 'section') {
      issues.push(
        issue(
          `layout-parent-child-invalid-${node.id}`,
          'error',
          'LAYOUT_PARENT_CHILD_TYPE_INVALID',
          `Root node can only contain section nodes, found "${node.type}".`,
          true,
          `layout.${node.id}`,
        ),
      );
    }
  }

  const rootSections = (view.layout.children ?? []).filter((node) => node.type === 'section');
  if (rootSections.length === 0) {
    issues.push(
      issue(
        'layout-root-section-required',
        'error',
        'LAYOUT_ROOT_SECTION_REQUIRED',
        'Layout root must contain at least one section.',
        true,
        'layout.children',
      ),
    );
  }

  for (const section of rootSections) {
    const hasDirectComponents = (section.componentIds ?? []).length > 0;
    const rows = (section.children ?? []).filter((child) => child.type === 'row');
    const hasRows = rows.length > 0;
    if (!hasDirectComponents && !hasRows) {
      issues.push(
        issue(
          `layout-section-empty-${section.id}`,
          'error',
          'LAYOUT_SECTION_EMPTY',
          `Section "${section.id}" cannot be empty.`,
          true,
          `layout.${section.id}`,
        ),
      );
    }
  }

  walkRowsAndColumns(view.layout, issues);

  const rowNodes = layoutNodes.filter((node) => node.type === 'row').map((node) => node.id);
  for (const rowId of rowNodes) {
    const row = findNodeById(view.layout, rowId);
    if (!row) {
      continue;
    }
    if ((row.children ?? []).length === 0) {
      issues.push(
        issue(
          `layout-row-empty-${rowId}`,
          'error',
          'LAYOUT_ROW_EMPTY',
          `Row "${rowId}" must contain at least one column.`,
          true,
          `layout.${rowId}`,
        ),
      );
    }
  }

  const componentIds = new Set<string>();
  for (const component of view.components) {
    if (!component.id) {
      issues.push(
        issue(
          'component-id-required',
          'error',
          'COMPONENT_ID_REQUIRED',
          'Component id is required.',
          true,
          'components',
        ),
      );
      continue;
    }

    if (componentIds.has(component.id)) {
      issues.push(
        issue(
          `component-duplicate-${component.id}`,
          'error',
          'COMPONENT_ID_DUPLICATE',
          `Duplicate component id "${component.id}".`,
          true,
          `components.${component.id}`,
        ),
      );
      continue;
    }

    componentIds.add(component.id);

    if (!component.type) {
      issues.push(
        issue(
          `component-type-required-${component.id}`,
          'error',
          'COMPONENT_TYPE_REQUIRED',
          `Component "${component.id}" must define type.`,
          true,
          `components.${component.id}.type`,
        ),
      );
      continue;
    }

    const definition = getComponentDefinition(component.type);
    if (!definition) {
      issues.push(
        issue(
          `component-unknown-${component.id}`,
          'error',
          'COMPONENT_UNKNOWN',
          `Component "${component.type}" is not in registry.`,
          true,
          `components.${component.id}.type`,
        ),
      );
      continue;
    }

    if (!definition.supportedSurfaces.includes(view.surface)) {
      issues.push(
        issue(
          `component-surface-${component.id}`,
          'error',
          'COMPONENT_SURFACE_UNSUPPORTED',
          `Component "${component.type}" is not allowed on surface "${view.surface}".`,
          true,
          `components.${component.id}.type`,
        ),
      );
    }

    for (const binding of component.bindings ?? []) {
      if (!definition.supportedBindings.includes(binding.type)) {
        issues.push(
          issue(
            `component-binding-${component.id}-${binding.type}`,
            'error',
            'COMPONENT_BINDING_UNSUPPORTED',
            `Binding type "${binding.type}" is not supported for component "${component.type}".`,
            true,
            `components.${component.id}.bindings`,
          ),
        );
      }
    }
  }

  const layoutRefs: string[] = [];
  walkLayoutComponentRefs(view.layout, layoutRefs);
  for (const ref of layoutRefs) {
    if (!componentIds.has(ref)) {
      issues.push(
        issue(
          `layout-reference-missing-${ref}`,
          'error',
          'LAYOUT_COMPONENT_REFERENCE_MISSING',
          `Layout references unknown component id "${ref}".`,
          true,
          `layout.componentIds.${ref}`,
        ),
      );
    }
  }

  const actionIds = new Set<string>();
  for (const action of view.actions) {
    if (!action.id) {
      issues.push(
        issue('action-id-required', 'error', 'ACTION_ID_REQUIRED', 'Action id is required.', true, 'actions'),
      );
      continue;
    }

    if (actionIds.has(action.id)) {
      issues.push(
        issue(
          `action-duplicate-${action.id}`,
          'error',
          'ACTION_ID_DUPLICATE',
          `Duplicate action id "${action.id}".`,
          true,
          `actions.${action.id}`,
        ),
      );
    } else {
      actionIds.add(action.id);
    }

    if (!action.commandId) {
      issues.push(
        issue(
          `action-command-${action.id}`,
          'error',
          'ACTION_COMMAND_REQUIRED',
          `Action "${action.id}" must define commandId.`,
          true,
          `actions.${action.id}.commandId`,
        ),
      );
    }

    if (!action.type || !allowedActionTypes.has(action.type)) {
      issues.push(
        issue(
          `action-type-unsupported-${action.id}`,
          'error',
          'ACTION_TYPE_UNSUPPORTED',
          `Action "${action.id}" must use supported type for this slice.`,
          true,
          `actions.${action.id}.type`,
        ),
      );
      continue;
    }

    if (action.targetComponentId && !componentIds.has(action.targetComponentId)) {
      issues.push(
        issue(
          `action-target-component-missing-${action.id}`,
          'error',
          'ACTION_TARGET_COMPONENT_MISSING',
          `Action "${action.id}" references unknown component target "${action.targetComponentId}".`,
          true,
          `actions.${action.id}.targetComponentId`,
        ),
      );
    }

    if (action.type === 'ui.navigate' && action.payload?.route !== undefined && action.payload.route.trim() === '') {
      issues.push(
        issue(
          `action-payload-route-invalid-${action.id}`,
          'error',
          'ACTION_PAYLOAD_INVALID',
          `Action "${action.id}" requires a non-empty route payload.`,
          true,
          `actions.${action.id}.payload.route`,
        ),
      );
    }

    if (action.type === 'ui.open-panel' && action.payload?.panelId !== undefined && action.payload.panelId.trim() === '') {
      issues.push(
        issue(
          `action-payload-panel-invalid-${action.id}`,
          'error',
          'ACTION_PAYLOAD_INVALID',
          `Action "${action.id}" requires a non-empty panelId payload.`,
          true,
          `actions.${action.id}.payload.panelId`,
        ),
      );
    }

    if (
      action.type === 'workflow.transition' &&
      action.payload?.transitionId !== undefined &&
      action.payload.transitionId.trim() === ''
    ) {
      issues.push(
        issue(
          `action-payload-transition-invalid-${action.id}`,
          'error',
          'ACTION_PAYLOAD_INVALID',
          `Action "${action.id}" requires a non-empty transitionId payload.`,
          true,
          `actions.${action.id}.payload.transitionId`,
        ),
      );
    }
  }

  for (const rule of view.rules) {
    if (!rule.id) {
      issues.push(issue('rule-id-required', 'error', 'RULE_ID_REQUIRED', 'Rule id is required.', true, 'rules'));
      continue;
    }

    if (rule.targetComponentId && !componentIds.has(rule.targetComponentId)) {
      issues.push(
        issue(
          `rule-component-target-missing-${rule.id}`,
          'error',
          'RULE_TARGET_COMPONENT_MISSING',
          `Rule "${rule.id}" references unknown component target "${rule.targetComponentId}".`,
          true,
          `rules.${rule.id}.targetComponentId`,
        ),
      );
    }

    if (rule.targetActionId && !actionIds.has(rule.targetActionId)) {
      issues.push(
        issue(
          `rule-action-target-missing-${rule.id}`,
          'error',
          'RULE_TARGET_ACTION_MISSING',
          `Rule "${rule.id}" references unknown action target "${rule.targetActionId}".`,
          true,
          `rules.${rule.id}.targetActionId`,
        ),
      );
    }

    if (!allowedRuleEffects.has(rule.effect)) {
      issues.push(
        issue(
          `rule-effect-unsupported-${rule.id}`,
          'error',
          'RULE_EFFECT_UNSUPPORTED',
          `Rule "${rule.id}" uses unsupported effect "${rule.effect}" for this slice.`,
          true,
          `rules.${rule.id}.effect`,
        ),
      );
    }

    if (!isConditionShapeValid(rule.condition)) {
      issues.push(
        issue(
          `rule-condition-invalid-${rule.id}`,
          'error',
          'RULE_CONDITION_INVALID',
          `Rule "${rule.id}" has invalid condition shape.`,
          true,
          `rules.${rule.id}.condition`,
        ),
      );
    }

    if (isConditionGroupEmpty(rule.condition)) {
      issues.push(
        issue(
          `rule-condition-group-empty-${rule.id}`,
          'error',
          'RULE_CONDITION_GROUP_EMPTY',
          `Rule "${rule.id}" has an empty condition group.`,
          true,
          `rules.${rule.id}.condition`,
        ),
      );
    }

    if (conditionDepth(rule.condition) > 2) {
      issues.push(
        issue(
          `rule-condition-depth-invalid-${rule.id}`,
          'error',
          'RULE_CONDITION_DEPTH_EXCEEDED',
          `Rule "${rule.id}" exceeds max supported condition depth.`,
          true,
          `rules.${rule.id}.condition`,
        ),
      );
    }
  }

  const isValid = issues.every((current) => !current.blocking);
  return { isValid, issues };
}

function findNodeById(node: ViewMetadata['layout'], nodeId: string): ViewMetadata['layout'] | null {
  if (node.id === nodeId) {
    return node;
  }

  for (const child of node.children ?? []) {
    const found = findNodeById(child, nodeId);
    if (found) {
      return found;
    }
  }

  return null;
}
