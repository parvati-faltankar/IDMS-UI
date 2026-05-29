import type { ComponentNode, LayoutNode, ViewMetadata } from '../types';
import {
  BUILDER_CONDITION_MAX_DEPTH,
  conditionDraftToRuleCondition,
  conditionToDraft,
  toActionDefinition,
  toBehaviorRule,
} from './types';
import type {
  BuilderActionOperationAddPayload,
  BuilderActionOperationRemovePayload,
  BuilderActionOperationReorderPayload,
  BuilderActionOperationUpdatePayload,
  BuilderDraftState,
  BuilderFieldOperationAddPayload,
  BuilderFieldOperationRemovePayload,
  BuilderFieldOperationReorderPayload,
  BuilderLayoutOperationAddSectionPayload,
  BuilderLayoutOperationRemoveSectionPayload,
  BuilderLayoutOperationReorderSectionPayload,
  BuilderMoveFieldToColumnPayload,
  BuilderColumnOperationAddPayload,
  BuilderColumnOperationRemovePayload,
  BuilderColumnOperationReorderPayload,
  BuilderConditionGroupDraft,
  BuilderConditionNodeDraft,
  BuilderConditionOperationAddGroupPayload,
  BuilderConditionOperationAddLeafPayload,
  BuilderConditionOperationRemoveNodePayload,
  BuilderConditionOperationReorderNodePayload,
  BuilderConditionOperationUpdateNodePayload,
  BuilderRowOperationAddPayload,
  BuilderRowOperationRemovePayload,
  BuilderRowOperationReorderPayload,
  BuilderRuleOperationAddPayload,
  BuilderRuleOperationRemovePayload,
  BuilderRuleOperationReorderPayload,
  BuilderRuleOperationUpdatePayload,
} from './types';

const MAX_COLUMNS_PER_ROW = 4;
let conditionNodeCounter = 0;

function cloneLayout(layout: LayoutNode): LayoutNode {
  return {
    ...layout,
    componentIds: layout.componentIds ? [...layout.componentIds] : undefined,
    children: layout.children?.map(cloneLayout),
  };
}

function findNodeById(node: LayoutNode, nodeId: string): LayoutNode | null {
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

function firstSectionNodeId(node: LayoutNode): string {
  if (node.type === 'section') {
    return node.id;
  }

  for (const child of node.children ?? []) {
    const found = firstSectionNodeId(child);
    if (found) {
      return found;
    }
  }

  return node.id;
}

function listComponentRefs(node: LayoutNode): string[] {
  const refs = [...(node.componentIds ?? [])];
  for (const child of node.children ?? []) {
    refs.push(...listComponentRefs(child));
  }
  return refs;
}

function findRow(section: LayoutNode, rowId: string): LayoutNode | null {
  return (section.children ?? []).find((node) => node.type === 'row' && node.id === rowId) ?? null;
}

function removeFieldFromContainer(node: LayoutNode, containerId: string, componentId: string): boolean {
  if (node.id === containerId) {
    node.componentIds = (node.componentIds ?? []).filter((id) => id !== componentId);
    return true;
  }

  for (const child of node.children ?? []) {
    if (removeFieldFromContainer(child, containerId, componentId)) {
      return true;
    }
  }

  return false;
}

function nextConditionNodeId(prefix: string): string {
  conditionNodeCounter += 1;
  return `${prefix}-${conditionNodeCounter}`;
}

function cloneConditionNode(node: BuilderConditionNodeDraft): BuilderConditionNodeDraft {
  if (node.nodeType === 'leaf') {
    return { ...node };
  }
  return {
    ...node,
    children: node.children.map(cloneConditionNode),
  };
}

function getConditionDepth(node: BuilderConditionNodeDraft): number {
  if (node.nodeType === 'leaf') {
    return 1;
  }
  if (node.children.length === 0) {
    return 1;
  }
  return 1 + Math.max(...node.children.map(getConditionDepth));
}

function findConditionGroup(node: BuilderConditionNodeDraft, groupId: string): BuilderConditionGroupDraft | null {
  if (node.nodeType === 'group' && node.id === groupId) {
    return node;
  }
  if (node.nodeType === 'leaf') {
    return null;
  }
  for (const child of node.children) {
    const found = findConditionGroup(child, groupId);
    if (found) {
      return found;
    }
  }
  return null;
}

function updateConditionNodeById(
  node: BuilderConditionNodeDraft,
  nodeId: string,
  patch: Partial<BuilderConditionNodeDraft>,
): BuilderConditionNodeDraft {
  if (node.id === nodeId) {
    return { ...node, ...patch } as BuilderConditionNodeDraft;
  }
  if (node.nodeType === 'leaf') {
    return node;
  }
  return {
    ...node,
    children: node.children.map((child) => updateConditionNodeById(child, nodeId, patch)),
  };
}

function removeConditionNodeById(node: BuilderConditionNodeDraft, nodeId: string): BuilderConditionNodeDraft {
  if (node.nodeType === 'leaf') {
    return node;
  }
  return {
    ...node,
    children: node.children
      .filter((child) => child.id !== nodeId)
      .map((child) => removeConditionNodeById(child, nodeId)),
  };
}

function reorderConditionNodeInGroup(
  node: BuilderConditionNodeDraft,
  groupId: string,
  fromIndex: number,
  toIndex: number,
): BuilderConditionNodeDraft {
  if (node.nodeType === 'leaf') {
    return node;
  }
  if (node.id === groupId) {
    const children = [...node.children];
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= children.length || toIndex >= children.length) {
      return node;
    }
    const [moved] = children.splice(fromIndex, 1);
    children.splice(toIndex, 0, moved);
    return { ...node, children };
  }
  return {
    ...node,
    children: node.children.map((child) => reorderConditionNodeInGroup(child, groupId, fromIndex, toIndex)),
  };
}

export function createBuilderDraftState(metadata: ViewMetadata): BuilderDraftState {
  return {
    metadata: {
      ...metadata,
      components: [...metadata.components],
      actions: [...metadata.actions],
      rules: [...metadata.rules],
      layout: cloneLayout(metadata.layout),
    },
    dirty: false,
    selectedComponentId: null,
    selectedNodeId: firstSectionNodeId(metadata.layout),
  };
}

export function addFieldToDraft(
  draft: BuilderDraftState,
  payload: BuilderFieldOperationAddPayload,
  sectionId?: string,
): BuilderDraftState {
  const next = createBuilderDraftState(draft.metadata);
  const nodeId = sectionId ?? draft.selectedNodeId ?? firstSectionNodeId(next.metadata.layout);
  const targetNode = findNodeById(next.metadata.layout, nodeId);
  if (!targetNode) {
    return draft;
  }

  const component: ComponentNode = {
    id: payload.componentId,
    type: payload.componentType,
    label: payload.label,
    bindings: [{ type: 'entity-field', source: next.metadata.entityName, fieldPath: payload.fieldPath }],
  };

  next.metadata.components.push(component);
  targetNode.componentIds = [...(targetNode.componentIds ?? []), payload.componentId];

  return {
    ...next,
    dirty: true,
    selectedComponentId: payload.componentId,
    selectedNodeId: targetNode.id,
  };
}

export function removeFieldFromDraft(
  draft: BuilderDraftState,
  payload: BuilderFieldOperationRemovePayload,
): BuilderDraftState {
  const next = createBuilderDraftState(draft.metadata);
  next.metadata.components = next.metadata.components.filter((component) => component.id !== payload.componentId);

  const walk = (node: LayoutNode) => {
    node.componentIds = (node.componentIds ?? []).filter((componentId) => componentId !== payload.componentId);
    for (const child of node.children ?? []) {
      walk(child);
    }
  };

  walk(next.metadata.layout);

  return {
    ...next,
    dirty: true,
    selectedComponentId: next.selectedComponentId === payload.componentId ? null : next.selectedComponentId,
  };
}

export function reorderFieldsInDraft(
  draft: BuilderDraftState,
  payload: BuilderFieldOperationReorderPayload,
): BuilderDraftState {
  const next = createBuilderDraftState(draft.metadata);
  const section = findNodeById(next.metadata.layout, payload.sectionId);
  if (!section?.componentIds) {
    return draft;
  }

  const ids = [...section.componentIds];
  if (
    payload.fromIndex < 0 ||
    payload.fromIndex >= ids.length ||
    payload.toIndex < 0 ||
    payload.toIndex >= ids.length
  ) {
    return draft;
  }

  const [moved] = ids.splice(payload.fromIndex, 1);
  ids.splice(payload.toIndex, 0, moved);
  section.componentIds = ids;

  return {
    ...next,
    dirty: true,
    selectedNodeId: section.id,
  };
}

export function addSectionToDraft(
  draft: BuilderDraftState,
  payload: BuilderLayoutOperationAddSectionPayload,
): BuilderDraftState {
  const next = createBuilderDraftState(draft.metadata);
  const children = [...(next.metadata.layout.children ?? [])];
  if (children.some((section) => section.id === payload.sectionId)) {
    return draft;
  }

  const newSection: LayoutNode = {
    id: payload.sectionId,
    type: 'section',
    componentIds: [],
  };

  if (!payload.afterSectionId) {
    children.push(newSection);
  } else {
    const afterIndex = children.findIndex((section) => section.id === payload.afterSectionId);
    if (afterIndex === -1) {
      children.push(newSection);
    } else {
      children.splice(afterIndex + 1, 0, newSection);
    }
  }

  next.metadata.layout.children = children;
  return {
    ...next,
    dirty: true,
    selectedNodeId: payload.sectionId,
  };
}

export function removeSectionFromDraft(
  draft: BuilderDraftState,
  payload: BuilderLayoutOperationRemoveSectionPayload,
): BuilderDraftState {
  const next = createBuilderDraftState(draft.metadata);
  const children = [...(next.metadata.layout.children ?? [])];
  if (children.length <= 1) {
    return draft;
  }

  const target = children.find((section) => section.id === payload.sectionId);
  if (!target) {
    return draft;
  }

  const componentIds = new Set(target.componentIds ?? []);
  for (const ref of listComponentRefs(target)) {
    componentIds.add(ref);
  }
  const remainingChildren = children.filter((section) => section.id !== payload.sectionId);
  const remainingComponentIds = new Set<string>();
  for (const section of remainingChildren) {
    for (const componentId of section.componentIds ?? []) {
      remainingComponentIds.add(componentId);
    }
  }

  next.metadata.components = next.metadata.components.filter(
    (component) => !componentIds.has(component.id) || remainingComponentIds.has(component.id),
  );
  next.metadata.layout.children = remainingChildren;

  return {
    ...next,
    dirty: true,
    selectedNodeId: remainingChildren[0]?.id ?? null,
    selectedComponentId: next.selectedComponentId && componentIds.has(next.selectedComponentId) ? null : next.selectedComponentId,
  };
}

export function reorderSectionsInDraft(
  draft: BuilderDraftState,
  payload: BuilderLayoutOperationReorderSectionPayload,
): BuilderDraftState {
  const next = createBuilderDraftState(draft.metadata);
  const sections = [...(next.metadata.layout.children ?? [])];
  if (
    payload.fromIndex < 0 ||
    payload.toIndex < 0 ||
    payload.fromIndex >= sections.length ||
    payload.toIndex >= sections.length
  ) {
    return draft;
  }

  const [moved] = sections.splice(payload.fromIndex, 1);
  sections.splice(payload.toIndex, 0, moved);
  next.metadata.layout.children = sections;

  return {
    ...next,
    dirty: true,
    selectedNodeId: moved?.id ?? next.selectedNodeId,
  };
}

export function addRowToDraft(draft: BuilderDraftState, payload: BuilderRowOperationAddPayload): BuilderDraftState {
  const next = createBuilderDraftState(draft.metadata);
  const section = findNodeById(next.metadata.layout, payload.sectionId);
  if (!section || section.type !== 'section') {
    return draft;
  }

  const rows = [...(section.children ?? [])];
  if (rows.some((node) => node.id === payload.rowId)) {
    return draft;
  }

  const newRow: LayoutNode = { id: payload.rowId, type: 'row', children: [{ id: `${payload.rowId}-col-1`, type: 'column', componentIds: [] }] };
  if (!payload.afterRowId) {
    rows.push(newRow);
  } else {
    const afterIndex = rows.findIndex((node) => node.id === payload.afterRowId);
    if (afterIndex === -1) {
      rows.push(newRow);
    } else {
      rows.splice(afterIndex + 1, 0, newRow);
    }
  }

  section.children = rows;
  return { ...next, dirty: true, selectedNodeId: payload.rowId };
}

export function removeRowFromDraft(draft: BuilderDraftState, payload: BuilderRowOperationRemovePayload): BuilderDraftState {
  const next = createBuilderDraftState(draft.metadata);
  const section = findNodeById(next.metadata.layout, payload.sectionId);
  if (!section || section.type !== 'section') {
    return draft;
  }

  const rows = [...(section.children ?? [])];
  if (rows.length <= 1) {
    return draft;
  }

  const idx = rows.findIndex((row) => row.id === payload.rowId);
  if (idx === -1) {
    return draft;
  }

  rows.splice(idx, 1);
  section.children = rows;
  return { ...next, dirty: true, selectedNodeId: rows[0]?.id ?? section.id };
}

export function reorderRowsInDraft(draft: BuilderDraftState, payload: BuilderRowOperationReorderPayload): BuilderDraftState {
  const next = createBuilderDraftState(draft.metadata);
  const section = findNodeById(next.metadata.layout, payload.sectionId);
  if (!section || section.type !== 'section') {
    return draft;
  }

  const rows = [...(section.children ?? [])];
  if (
    payload.fromIndex < 0 ||
    payload.toIndex < 0 ||
    payload.fromIndex >= rows.length ||
    payload.toIndex >= rows.length
  ) {
    return draft;
  }

  const [moved] = rows.splice(payload.fromIndex, 1);
  rows.splice(payload.toIndex, 0, moved);
  section.children = rows;
  return { ...next, dirty: true, selectedNodeId: moved?.id ?? section.id };
}

export function addColumnToDraft(draft: BuilderDraftState, payload: BuilderColumnOperationAddPayload): BuilderDraftState {
  const next = createBuilderDraftState(draft.metadata);
  const section = findNodeById(next.metadata.layout, payload.sectionId);
  if (!section || section.type !== 'section') {
    return draft;
  }
  const row = findRow(section, payload.rowId);
  if (!row) {
    return draft;
  }

  const cols = [...(row.children ?? [])];
  if (cols.length >= MAX_COLUMNS_PER_ROW || cols.some((col) => col.id === payload.columnId)) {
    return draft;
  }

  const col: LayoutNode = { id: payload.columnId, type: 'column', componentIds: [] };
  if (!payload.afterColumnId) {
    cols.push(col);
  } else {
    const afterIdx = cols.findIndex((node) => node.id === payload.afterColumnId);
    if (afterIdx === -1) {
      cols.push(col);
    } else {
      cols.splice(afterIdx + 1, 0, col);
    }
  }

  row.children = cols;
  return { ...next, dirty: true, selectedNodeId: payload.columnId };
}

export function removeColumnFromDraft(draft: BuilderDraftState, payload: BuilderColumnOperationRemovePayload): BuilderDraftState {
  const next = createBuilderDraftState(draft.metadata);
  const section = findNodeById(next.metadata.layout, payload.sectionId);
  if (!section || section.type !== 'section') {
    return draft;
  }
  const row = findRow(section, payload.rowId);
  if (!row) {
    return draft;
  }

  const cols = [...(row.children ?? [])];
  if (cols.length <= 1) {
    return draft;
  }

  const idx = cols.findIndex((col) => col.id === payload.columnId);
  if (idx === -1) {
    return draft;
  }

  const target = cols[idx];
  if ((target.componentIds ?? []).length > 0) {
    return draft;
  }

  cols.splice(idx, 1);
  row.children = cols;
  return { ...next, dirty: true, selectedNodeId: cols[0]?.id ?? row.id };
}

export function reorderColumnsInDraft(draft: BuilderDraftState, payload: BuilderColumnOperationReorderPayload): BuilderDraftState {
  const next = createBuilderDraftState(draft.metadata);
  const section = findNodeById(next.metadata.layout, payload.sectionId);
  if (!section || section.type !== 'section') {
    return draft;
  }
  const row = findRow(section, payload.rowId);
  if (!row) {
    return draft;
  }

  const cols = [...(row.children ?? [])];
  if (
    payload.fromIndex < 0 ||
    payload.toIndex < 0 ||
    payload.fromIndex >= cols.length ||
    payload.toIndex >= cols.length
  ) {
    return draft;
  }

  const [moved] = cols.splice(payload.fromIndex, 1);
  cols.splice(payload.toIndex, 0, moved);
  row.children = cols;
  return { ...next, dirty: true, selectedNodeId: moved?.id ?? row.id };
}

export function moveFieldToColumn(draft: BuilderDraftState, payload: BuilderMoveFieldToColumnPayload): BuilderDraftState {
  const next = createBuilderDraftState(draft.metadata);
  const targetColumn = findNodeById(next.metadata.layout, payload.toColumnId);
  if (!targetColumn || targetColumn.type !== 'column') {
    return draft;
  }

  const sourceRemoved = removeFieldFromContainer(next.metadata.layout, payload.fromContainerId, payload.componentId);
  if (!sourceRemoved) {
    return draft;
  }

  const ids = [...(targetColumn.componentIds ?? [])];
  const safeIndex = payload.toIndex === undefined ? ids.length : Math.max(0, Math.min(payload.toIndex, ids.length));
  ids.splice(safeIndex, 0, payload.componentId);
  targetColumn.componentIds = ids;

  return {
    ...next,
    dirty: true,
    selectedComponentId: payload.componentId,
    selectedNodeId: payload.toColumnId,
  };
}

export function addRuleToDraft(draft: BuilderDraftState, payload: BuilderRuleOperationAddPayload): BuilderDraftState {
  const next = createBuilderDraftState(draft.metadata);
  if (next.metadata.rules.some((rule) => rule.id === payload.rule.id)) {
    return draft;
  }

  next.metadata.rules = [...next.metadata.rules, toBehaviorRule(payload.rule)];
  return { ...next, dirty: true };
}

export function updateRuleInDraft(draft: BuilderDraftState, payload: BuilderRuleOperationUpdatePayload): BuilderDraftState {
  const currentRule = draft.metadata.rules.find((rule) => rule.id === payload.ruleId);
  if (!currentRule) {
    return draft;
  }

  const next = createBuilderDraftState(draft.metadata);
  next.metadata.rules = next.metadata.rules.map((rule) => {
    if (rule.id !== payload.ruleId) {
      return rule;
    }

    const targetType = payload.patch.targetType ?? (rule.targetActionId ? 'action' : 'component');
    const targetId = payload.patch.targetId ?? rule.targetComponentId ?? rule.targetActionId ?? '';
    const merged = toBehaviorRule({
      id: payload.patch.id ?? rule.id,
      targetType,
      targetId,
      effect: payload.patch.effect ?? (rule.effect as 'show' | 'hide' | 'enable' | 'disable'),
      condition: payload.patch.condition ?? rule.condition,
      priority: payload.patch.priority ?? 0,
    });
    return merged;
  });

  return { ...next, dirty: true };
}

export function removeRuleFromDraft(draft: BuilderDraftState, payload: BuilderRuleOperationRemovePayload): BuilderDraftState {
  const next = createBuilderDraftState(draft.metadata);
  next.metadata.rules = next.metadata.rules.filter((rule) => rule.id !== payload.ruleId);
  return { ...next, dirty: true };
}

export function reorderRulesInDraft(draft: BuilderDraftState, payload: BuilderRuleOperationReorderPayload): BuilderDraftState {
  const next = createBuilderDraftState(draft.metadata);
  const rules = [...next.metadata.rules];
  if (
    payload.fromIndex < 0 ||
    payload.toIndex < 0 ||
    payload.fromIndex >= rules.length ||
    payload.toIndex >= rules.length
  ) {
    return draft;
  }

  const [moved] = rules.splice(payload.fromIndex, 1);
  rules.splice(payload.toIndex, 0, moved);
  next.metadata.rules = rules;
  return { ...next, dirty: true };
}

export function addActionToDraft(draft: BuilderDraftState, payload: BuilderActionOperationAddPayload): BuilderDraftState {
  const next = createBuilderDraftState(draft.metadata);
  if (next.metadata.actions.some((action) => action.id === payload.action.id)) {
    return draft;
  }

  next.metadata.actions = [...next.metadata.actions, toActionDefinition(payload.action)];
  return { ...next, dirty: true };
}

export function updateActionInDraft(draft: BuilderDraftState, payload: BuilderActionOperationUpdatePayload): BuilderDraftState {
  const currentAction = draft.metadata.actions.find((action) => action.id === payload.actionId);
  if (!currentAction) {
    return draft;
  }

  const next = createBuilderDraftState(draft.metadata);
  next.metadata.actions = next.metadata.actions.map((action) => {
    if (action.id !== payload.actionId) {
      return action;
    }

    return {
      ...action,
      ...payload.patch,
      id: payload.patch.id ?? action.id,
      type: payload.patch.type ?? action.type ?? 'ui.navigate',
      commandId: payload.patch.commandId ?? action.commandId,
      label: payload.patch.label ?? action.label,
    };
  });

  return { ...next, dirty: true };
}

export function removeActionFromDraft(draft: BuilderDraftState, payload: BuilderActionOperationRemovePayload): BuilderDraftState {
  const next = createBuilderDraftState(draft.metadata);
  next.metadata.actions = next.metadata.actions.filter((action) => action.id !== payload.actionId);
  next.metadata.rules = next.metadata.rules.filter((rule) => rule.targetActionId !== payload.actionId);
  return { ...next, dirty: true };
}

export function reorderActionsInDraft(draft: BuilderDraftState, payload: BuilderActionOperationReorderPayload): BuilderDraftState {
  const next = createBuilderDraftState(draft.metadata);
  const actions = [...next.metadata.actions];
  if (
    payload.fromIndex < 0 ||
    payload.toIndex < 0 ||
    payload.fromIndex >= actions.length ||
    payload.toIndex >= actions.length
  ) {
    return draft;
  }

  const [moved] = actions.splice(payload.fromIndex, 1);
  actions.splice(payload.toIndex, 0, moved);
  next.metadata.actions = actions;
  return { ...next, dirty: true };
}

export function addConditionGroupToRuleDraft(
  draft: BuilderDraftState,
  payload: BuilderConditionOperationAddGroupPayload,
): BuilderDraftState {
  const currentRule = draft.metadata.rules.find((rule) => rule.id === payload.ruleId);
  if (!currentRule) {
    return draft;
  }
  const root = cloneConditionNode(conditionToDraft(currentRule.condition, payload.ruleId));
  const parent = findConditionGroup(root, payload.parentGroupId);
  if (!parent) {
    return draft;
  }
  const parentDepth = getConditionDepth(parent);
  if (parentDepth >= BUILDER_CONDITION_MAX_DEPTH) {
    return draft;
  }

  parent.children.push({
    id: nextConditionNodeId('cond-group'),
    nodeType: 'group',
    groupType: payload.groupType,
    children: [],
  });

  const next = createBuilderDraftState(draft.metadata);
  next.metadata.rules = next.metadata.rules.map((rule) =>
    rule.id === payload.ruleId ? { ...rule, condition: conditionDraftToRuleCondition(root) } : rule,
  );
  return { ...next, dirty: true };
}

export function addConditionLeafToRuleDraft(
  draft: BuilderDraftState,
  payload: BuilderConditionOperationAddLeafPayload,
): BuilderDraftState {
  const currentRule = draft.metadata.rules.find((rule) => rule.id === payload.ruleId);
  if (!currentRule) {
    return draft;
  }
  const root = cloneConditionNode(conditionToDraft(currentRule.condition, payload.ruleId));
  const parent = findConditionGroup(root, payload.parentGroupId);
  if (!parent) {
    return draft;
  }

  parent.children.push({
    id: nextConditionNodeId('cond-leaf'),
    nodeType: 'leaf',
    operator: payload.operator,
    field: payload.field,
    contextPath: payload.contextPath,
    value: payload.value,
  });

  const next = createBuilderDraftState(draft.metadata);
  next.metadata.rules = next.metadata.rules.map((rule) =>
    rule.id === payload.ruleId ? { ...rule, condition: conditionDraftToRuleCondition(root) } : rule,
  );
  return { ...next, dirty: true };
}

export function updateConditionNodeInRuleDraft(
  draft: BuilderDraftState,
  payload: BuilderConditionOperationUpdateNodePayload,
): BuilderDraftState {
  const currentRule = draft.metadata.rules.find((rule) => rule.id === payload.ruleId);
  if (!currentRule) {
    return draft;
  }
  const root = cloneConditionNode(conditionToDraft(currentRule.condition, payload.ruleId));
  const updated = updateConditionNodeById(root, payload.nodeId, payload.patch as Partial<BuilderConditionNodeDraft>);

  const next = createBuilderDraftState(draft.metadata);
  next.metadata.rules = next.metadata.rules.map((rule) =>
    rule.id === payload.ruleId ? { ...rule, condition: conditionDraftToRuleCondition(updated) } : rule,
  );
  return { ...next, dirty: true };
}

export function removeConditionNodeFromRuleDraft(
  draft: BuilderDraftState,
  payload: BuilderConditionOperationRemoveNodePayload,
): BuilderDraftState {
  const currentRule = draft.metadata.rules.find((rule) => rule.id === payload.ruleId);
  if (!currentRule) {
    return draft;
  }
  const root = cloneConditionNode(conditionToDraft(currentRule.condition, payload.ruleId));
  if (root.id === payload.nodeId) {
    return draft;
  }
  const updated = removeConditionNodeById(root, payload.nodeId);

  const next = createBuilderDraftState(draft.metadata);
  next.metadata.rules = next.metadata.rules.map((rule) =>
    rule.id === payload.ruleId ? { ...rule, condition: conditionDraftToRuleCondition(updated) } : rule,
  );
  return { ...next, dirty: true };
}

export function reorderConditionNodeInRuleDraft(
  draft: BuilderDraftState,
  payload: BuilderConditionOperationReorderNodePayload,
): BuilderDraftState {
  const currentRule = draft.metadata.rules.find((rule) => rule.id === payload.ruleId);
  if (!currentRule) {
    return draft;
  }
  const root = cloneConditionNode(conditionToDraft(currentRule.condition, payload.ruleId));
  const updated = reorderConditionNodeInGroup(root, payload.parentGroupId, payload.fromIndex, payload.toIndex);

  const next = createBuilderDraftState(draft.metadata);
  next.metadata.rules = next.metadata.rules.map((rule) =>
    rule.id === payload.ruleId ? { ...rule, condition: conditionDraftToRuleCondition(updated) } : rule,
  );
  return { ...next, dirty: true };
}

// ---------------------------------------------------------------------------
// View metadata + component label updates (Phase 6 additions)
// ---------------------------------------------------------------------------

export function updateComponentLabelInDraft(
  state: BuilderDraftState,
  payload: { componentId: string; label: string },
): BuilderDraftState {
  const index = state.metadata.components.findIndex((c) => c.id === payload.componentId);
  if (index === -1) return state;
  const components = [...state.metadata.components];
  components[index] = { ...components[index], label: payload.label };
  return { ...state, metadata: { ...state.metadata, components }, dirty: true };
}

export function updateViewMetaInDraft(
  state: BuilderDraftState,
  patch: Partial<Pick<ViewMetadata, 'name' | 'entityName' | 'surface' | 'version'>>,
): BuilderDraftState {
  return { ...state, metadata: { ...state.metadata, ...patch }, dirty: true };
}

