import type { ValidationIssue, ViewMetadata } from '../types';
import type { ActionDefinition, BehaviorRule, RuleEffect, RuleCondition } from '../types';

export interface BuilderDraftState {
  metadata: ViewMetadata;
  dirty: boolean;
  selectedComponentId: string | null;
  selectedNodeId: string | null;
}

export interface BuilderFieldOperationAddPayload {
  componentId: string;
  componentType: string;
  label: string;
  fieldPath: string;
}

export interface BuilderFieldOperationRemovePayload {
  componentId: string;
}

export interface BuilderFieldOperationReorderPayload {
  sectionId: string;
  fromIndex: number;
  toIndex: number;
}

export interface BuilderValidationSummary {
  issues: ValidationIssue[];
  blockingCount: number;
}

export interface BuilderLayoutOperationAddSectionPayload {
  sectionId: string;
  afterSectionId?: string;
}

export interface BuilderLayoutOperationRemoveSectionPayload {
  sectionId: string;
}

export interface BuilderLayoutOperationReorderSectionPayload {
  fromIndex: number;
  toIndex: number;
}

export interface BuilderRowOperationAddPayload {
  sectionId: string;
  rowId: string;
  afterRowId?: string;
}

export interface BuilderRowOperationRemovePayload {
  sectionId: string;
  rowId: string;
}

export interface BuilderRowOperationReorderPayload {
  sectionId: string;
  fromIndex: number;
  toIndex: number;
}

export interface BuilderColumnOperationAddPayload {
  sectionId: string;
  rowId: string;
  columnId: string;
  afterColumnId?: string;
}

export interface BuilderColumnOperationRemovePayload {
  sectionId: string;
  rowId: string;
  columnId: string;
}

export interface BuilderColumnOperationReorderPayload {
  sectionId: string;
  rowId: string;
  fromIndex: number;
  toIndex: number;
}

export interface BuilderMoveFieldToColumnPayload {
  componentId: string;
  fromContainerId: string;
  toColumnId: string;
  toIndex?: number;
}

export type BuilderRuleAllowedEffect = Extract<RuleEffect, 'show' | 'hide' | 'enable' | 'disable'>;

export interface BuilderRuleDraft {
  id: string;
  targetType: 'component' | 'action';
  targetId: string;
  effect: BuilderRuleAllowedEffect;
  condition: RuleCondition;
  priority: number;
}

export interface BuilderRuleOperationAddPayload {
  rule: BuilderRuleDraft;
}

export interface BuilderRuleOperationUpdatePayload {
  ruleId: string;
  patch: Partial<BuilderRuleDraft>;
}

export interface BuilderRuleOperationRemovePayload {
  ruleId: string;
}

export interface BuilderRuleOperationReorderPayload {
  fromIndex: number;
  toIndex: number;
}

export const BUILDER_CONDITION_MAX_DEPTH = 2;

export type BuilderConditionOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'greaterThan'
  | 'lessThan'
  | 'isEmpty'
  | 'isNotEmpty';

export interface BuilderConditionLeafDraft {
  id: string;
  nodeType: 'leaf';
  field?: string;
  contextPath?: string;
  operator: BuilderConditionOperator;
  value?: unknown;
}

export interface BuilderConditionGroupDraft {
  id: string;
  nodeType: 'group';
  groupType: 'all' | 'any';
  children: BuilderConditionNodeDraft[];
}

export type BuilderConditionNodeDraft = BuilderConditionLeafDraft | BuilderConditionGroupDraft;

export interface BuilderConditionOperationAddGroupPayload {
  ruleId: string;
  parentGroupId: string;
  groupType: 'all' | 'any';
}

export interface BuilderConditionOperationAddLeafPayload {
  ruleId: string;
  parentGroupId: string;
  operator: BuilderConditionOperator;
  field?: string;
  contextPath?: string;
  value?: unknown;
}

export interface BuilderConditionOperationUpdateNodePayload {
  ruleId: string;
  nodeId: string;
  patch: Partial<BuilderConditionLeafDraft | BuilderConditionGroupDraft>;
}

export interface BuilderConditionOperationRemoveNodePayload {
  ruleId: string;
  nodeId: string;
}

export interface BuilderConditionOperationReorderNodePayload {
  ruleId: string;
  parentGroupId: string;
  fromIndex: number;
  toIndex: number;
}

export type BuilderAllowedActionType = 'ui.navigate' | 'ui.open-panel' | 'workflow.transition';

export interface BuilderActionDraft {
  id: string;
  label: string;
  commandId: string;
  type: BuilderAllowedActionType;
  targetComponentId?: string;
  payload?: {
    route?: string;
    panelId?: string;
    transitionId?: string;
  };
  requiresConfirmation?: boolean;
}

export interface BuilderActionOperationAddPayload {
  action: BuilderActionDraft;
}

export interface BuilderActionOperationUpdatePayload {
  actionId: string;
  patch: Partial<BuilderActionDraft>;
}

export interface BuilderActionOperationRemovePayload {
  actionId: string;
}

export interface BuilderActionOperationReorderPayload {
  fromIndex: number;
  toIndex: number;
}

export function toBehaviorRule(rule: BuilderRuleDraft): BehaviorRule {
  return {
    id: rule.id,
    targetComponentId: rule.targetType === 'component' ? rule.targetId : undefined,
    targetActionId: rule.targetType === 'action' ? rule.targetId : undefined,
    effect: rule.effect,
    condition: rule.condition,
  };
}

export function toActionDefinition(action: BuilderActionDraft): ActionDefinition {
  return {
    id: action.id,
    label: action.label,
    commandId: action.commandId,
    type: action.type,
    targetComponentId: action.targetComponentId,
    payload: action.payload,
    requiresConfirmation: action.requiresConfirmation,
  };
}

export function conditionToDraft(condition: RuleCondition, idPrefix = 'cond', path = '0'): BuilderConditionNodeDraft {
  if (condition.all || condition.any) {
    const groupType = condition.all ? 'all' : 'any';
    const children = (condition.all ?? condition.any ?? []).map((child, index) =>
      conditionToDraft(child, idPrefix, `${path}-${index}`),
    );
    return {
      id: `${idPrefix}-group-${path}`,
      nodeType: 'group',
      groupType,
      children,
    };
  }

  return {
    id: `${idPrefix}-leaf-${path}`,
    nodeType: 'leaf',
    field: condition.field,
    contextPath: condition.contextPath,
    operator: (condition.operator ?? 'equals') as BuilderConditionOperator,
    value: condition.value,
  };
}

export function conditionDraftToRuleCondition(node: BuilderConditionNodeDraft): RuleCondition {
  if (node.nodeType === 'group') {
    if (node.groupType === 'all') {
      return { all: node.children.map(conditionDraftToRuleCondition) };
    }
    return { any: node.children.map(conditionDraftToRuleCondition) };
  }

  return {
    field: node.field,
    contextPath: node.contextPath,
    operator: node.operator,
    value: node.value,
  };
}
