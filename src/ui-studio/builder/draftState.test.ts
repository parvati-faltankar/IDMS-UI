import { describe, expect, it } from 'vitest';
import { sampleCreateEditView } from '../metadata/sampleCreateEditView';
import {
  addConditionGroupToRuleDraft,
  addConditionLeafToRuleDraft,
  addColumnToDraft,
  addActionToDraft,
  addFieldToDraft,
  addRowToDraft,
  addRuleToDraft,
  addSectionToDraft,
  createBuilderDraftState,
  moveFieldToColumn,
  removeColumnFromDraft,
  removeActionFromDraft,
  removeFieldFromDraft,
  removeRowFromDraft,
  removeRuleFromDraft,
  removeSectionFromDraft,
  reorderColumnsInDraft,
  reorderConditionNodeInRuleDraft,
  reorderActionsInDraft,
  reorderFieldsInDraft,
  reorderRowsInDraft,
  reorderRulesInDraft,
  reorderSectionsInDraft,
  updateActionInDraft,
  updateConditionNodeInRuleDraft,
  updateRuleInDraft,
  removeConditionNodeFromRuleDraft,
} from './draftState';
import { conditionToDraft } from './types';

describe('ui-studio builder draft state operations', () => {
  it('adds a field to selected section predictably', () => {
    const draft = createBuilderDraftState(sampleCreateEditView);
    const next = addFieldToDraft(
      draft,
      {
        componentId: 'field-branch',
        componentType: 'text-field',
        label: 'Branch',
        fieldPath: 'branchName',
      },
      'section-header',
    );

    expect(next.metadata.components.some((component) => component.id === 'field-branch')).toBe(true);
    const section = next.metadata.layout.children?.find((node) => node.id === 'section-header');
    expect(section?.componentIds?.includes('field-branch')).toBe(true);
    expect(next.dirty).toBe(true);
  });

  it('removes a field from components and layout references', () => {
    const draft = createBuilderDraftState(sampleCreateEditView);
    const next = removeFieldFromDraft(draft, { componentId: 'order-date' });

    expect(next.metadata.components.some((component) => component.id === 'order-date')).toBe(false);
    const section = next.metadata.layout.children?.find((node) => node.id === 'section-header');
    expect(section?.componentIds?.includes('order-date')).toBe(false);
  });

  it('reorders fields deterministically within a section', () => {
    const draft = createBuilderDraftState(sampleCreateEditView);
    const next = reorderFieldsInDraft(draft, { sectionId: 'section-header', fromIndex: 1, toIndex: 0 });
    const section = next.metadata.layout.children?.find((node) => node.id === 'section-header');

    expect(section?.componentIds?.[0]).toBe('order-date');
    expect(section?.componentIds?.[1]).toBe('customer-name');
    expect(next.dirty).toBe(true);
  });

  it('adds a section deterministically after selected section', () => {
    const draft = createBuilderDraftState(sampleCreateEditView);
    const next = addSectionToDraft(draft, { sectionId: 'section-extra', afterSectionId: 'section-header' });
    const sectionIds = (next.metadata.layout.children ?? []).map((node) => node.id);

    expect(sectionIds).toEqual(['section-header', 'section-extra', 'section-actions']);
    expect(next.selectedNodeId).toBe('section-extra');
    expect(next.dirty).toBe(true);
  });

  it('does not remove last remaining section from layout root', () => {
    const draft = createBuilderDraftState({
      ...sampleCreateEditView,
      layout: {
        ...sampleCreateEditView.layout,
        children: [{ id: 'section-only', type: 'section', componentIds: ['customer-name'] }],
      },
    });

    const next = removeSectionFromDraft(draft, { sectionId: 'section-only' });

    expect(next).toBe(draft);
  });

  it('removes section and orphaned components safely', () => {
    const draft = createBuilderDraftState(sampleCreateEditView);
    const next = removeSectionFromDraft(draft, { sectionId: 'section-actions' });

    expect((next.metadata.layout.children ?? []).some((node) => node.id === 'section-actions')).toBe(false);
    expect(next.metadata.components.some((component) => component.id === 'actions-primary')).toBe(false);
  });

  it('reorders sections deterministically', () => {
    const draft = createBuilderDraftState(sampleCreateEditView);
    const next = reorderSectionsInDraft(draft, { fromIndex: 1, toIndex: 0 });
    const sectionIds = (next.metadata.layout.children ?? []).map((node) => node.id);

    expect(sectionIds).toEqual(['section-actions', 'section-header']);
    expect(next.selectedNodeId).toBe('section-actions');
  });

  it('supports deterministic rule add/update/remove/reorder', () => {
    const draft = createBuilderDraftState(sampleCreateEditView);
    const added = addRuleToDraft(draft, {
      rule: {
        id: 'rule-custom',
        targetType: 'component',
        targetId: 'customer-name',
        effect: 'hide',
        condition: { contextPath: 'mode', operator: 'equals', value: 'preview' },
        priority: 2,
      },
    });
    expect(added.metadata.rules.some((rule) => rule.id === 'rule-custom')).toBe(true);

    const updated = updateRuleInDraft(added, {
      ruleId: 'rule-custom',
      patch: { effect: 'show', targetType: 'action', targetId: 'action-submit' },
    });
    const updatedRule = updated.metadata.rules.find((rule) => rule.id === 'rule-custom');
    expect(updatedRule?.effect).toBe('show');
    expect(updatedRule?.targetActionId).toBe('action-submit');
    expect(updatedRule?.targetComponentId).toBeUndefined();

    const reordered = reorderRulesInDraft(updated, { fromIndex: updated.metadata.rules.length - 1, toIndex: 0 });
    expect(reordered.metadata.rules[0]?.id).toBe('rule-custom');

    const removed = removeRuleFromDraft(reordered, { ruleId: 'rule-custom' });
    expect(removed.metadata.rules.some((rule) => rule.id === 'rule-custom')).toBe(false);
  });

  it('supports deterministic action add/update/remove/reorder', () => {
    const draft = createBuilderDraftState(sampleCreateEditView);
    const added = addActionToDraft(draft, {
      action: {
        id: 'action-preview',
        label: 'Preview',
        commandId: 'ui.preview',
        type: 'ui.navigate',
        payload: { route: '/preview' },
      },
    });
    expect(added.metadata.actions.some((action) => action.id === 'action-preview')).toBe(true);

    const updated = updateActionInDraft(added, {
      actionId: 'action-preview',
      patch: { requiresConfirmation: true, type: 'ui.open-panel', payload: { panelId: 'preview-panel' } },
    });
    const updatedAction = updated.metadata.actions.find((action) => action.id === 'action-preview');
    expect(updatedAction?.requiresConfirmation).toBe(true);
    expect(updatedAction?.type).toBe('ui.open-panel');
    expect(updatedAction?.payload?.panelId).toBe('preview-panel');

    const reordered = reorderActionsInDraft(updated, { fromIndex: updated.metadata.actions.length - 1, toIndex: 0 });
    expect(reordered.metadata.actions[0]?.id).toBe('action-preview');

    const removed = removeActionFromDraft(reordered, { actionId: 'action-preview' });
    expect(removed.metadata.actions.some((action) => action.id === 'action-preview')).toBe(false);
  });

  it('removes rule links targeting an action when action is removed', () => {
    const draft = createBuilderDraftState(sampleCreateEditView);
    const addedRule = addRuleToDraft(draft, {
      rule: {
        id: 'rule-target-save',
        targetType: 'action',
        targetId: 'action-save',
        effect: 'disable',
        condition: { contextPath: 'mode', operator: 'equals', value: 'edit' },
        priority: 1,
      },
    });
    const removedAction = removeActionFromDraft(addedRule, { actionId: 'action-save' });

    expect(removedAction.metadata.rules.some((rule) => rule.id === 'rule-target-save')).toBe(false);
  });

  it('supports deterministic row add/remove/reorder operations', () => {
    const draft = createBuilderDraftState(sampleCreateEditView);
    const withRow = addRowToDraft(draft, { sectionId: 'section-header', rowId: 'row-main' });
    expect(withRow.metadata.layout.children?.find((s) => s.id === 'section-header')?.children?.[0]?.id).toBe('row-main');

    const withSecondRow = addRowToDraft(withRow, { sectionId: 'section-header', rowId: 'row-secondary' });
    const reordered = reorderRowsInDraft(withSecondRow, { sectionId: 'section-header', fromIndex: 1, toIndex: 0 });
    expect(reordered.metadata.layout.children?.find((s) => s.id === 'section-header')?.children?.[0]?.id).toBe('row-secondary');

    const removed = removeRowFromDraft(reordered, { sectionId: 'section-header', rowId: 'row-main' });
    expect(removed.metadata.layout.children?.find((s) => s.id === 'section-header')?.children?.some((r) => r.id === 'row-main')).toBe(false);
  });

  it('supports deterministic column add/remove/reorder and field move', () => {
    const draft = createBuilderDraftState(sampleCreateEditView);
    const withRow = addRowToDraft(draft, { sectionId: 'section-header', rowId: 'row-main' });
    const withColumn = addColumnToDraft(withRow, { sectionId: 'section-header', rowId: 'row-main', columnId: 'col-2' });

    const reordered = reorderColumnsInDraft(withColumn, { sectionId: 'section-header', rowId: 'row-main', fromIndex: 1, toIndex: 0 });
    expect(reordered.metadata.layout.children?.find((s) => s.id === 'section-header')?.children?.[0]?.children?.[0]?.id).toBe('col-2');

    const movedField = moveFieldToColumn(reordered, {
      componentId: 'customer-name',
      fromContainerId: 'section-header',
      toColumnId: 'col-2',
    });
    const row = movedField.metadata.layout.children?.find((s) => s.id === 'section-header')?.children?.[0];
    const col2 = row?.children?.find((c) => c.id === 'col-2');
    expect(col2?.componentIds?.includes('customer-name')).toBe(true);

    const removed = removeColumnFromDraft(movedField, { sectionId: 'section-header', rowId: 'row-main', columnId: 'row-main-col-1' });
    expect(removed.metadata.layout.children?.find((s) => s.id === 'section-header')?.children?.[0]?.children?.some((c) => c.id === 'row-main-col-1')).toBe(false);
  });

  it('supports deterministic condition builder node operations', () => {
    const draft = createBuilderDraftState(sampleCreateEditView);
    const seeded = updateRuleInDraft(draft, {
      ruleId: 'rule-submit-lock',
      patch: {
        condition: {
          all: [{ contextPath: 'mode', operator: 'equals', value: 'preview' }],
        },
      },
    });

    const withGroup = addConditionGroupToRuleDraft(seeded, {
      ruleId: 'rule-submit-lock',
      parentGroupId: 'rule-submit-lock-group-0',
      groupType: 'any',
    });
    expect(withGroup.dirty).toBe(true);

    const withLeaf = addConditionLeafToRuleDraft(withGroup, {
      ruleId: 'rule-submit-lock',
      parentGroupId: 'rule-submit-lock-group-0',
      operator: 'equals',
      contextPath: 'mode',
      value: 'edit',
    });
    expect(withLeaf.metadata.rules.find((r) => r.id === 'rule-submit-lock')?.condition).toBeTruthy();
    const tree = conditionToDraft(withLeaf.metadata.rules.find((r) => r.id === 'rule-submit-lock')!.condition, 'rule-submit-lock');
    const firstLeafId =
      tree.nodeType === 'group'
        ? tree.children.find((node) => node.nodeType === 'leaf')?.id
        : undefined;
    expect(firstLeafId).toBeTruthy();

    const updated = updateConditionNodeInRuleDraft(withLeaf, {
      ruleId: 'rule-submit-lock',
      nodeId: firstLeafId as string,
      patch: { value: 'preview' },
    });
    expect(JSON.stringify(updated.metadata.rules.find((r) => r.id === 'rule-submit-lock')?.condition)).toContain('preview');

    const reordered = reorderConditionNodeInRuleDraft(updated, {
      ruleId: 'rule-submit-lock',
      parentGroupId: 'rule-submit-lock-group-0',
      fromIndex: 1,
      toIndex: 0,
    });
    expect(reordered.dirty).toBe(true);

    const removed = removeConditionNodeFromRuleDraft(reordered, {
      ruleId: 'rule-submit-lock',
      nodeId: firstLeafId as string,
    });
    expect(removed.dirty).toBe(true);
  });
});
