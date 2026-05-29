import { describe, expect, it } from 'vitest';
import { sampleCreateEditView } from '../metadata/sampleCreateEditView';
import type { ViewMetadata } from '../types';
import { validateViewMetadata } from './validateViewMetadata';

describe('ui-studio metadata validation', () => {
  it('passes valid create-edit metadata', () => {
    const result = validateViewMetadata(sampleCreateEditView);

    expect(result.isValid).toBe(true);
    expect(result.issues.filter((issue) => issue.blocking)).toHaveLength(0);
  });

  it('blocks publish for broken binding component contracts', () => {
    const broken: ViewMetadata = {
      ...sampleCreateEditView,
      components: [
        ...sampleCreateEditView.components,
        {
          id: 'broken-1',
          type: 'date-field',
          label: 'Broken Binding',
          bindings: [{ type: 'relationship', source: 'user', fieldPath: 'id' }],
        },
      ],
    };

    const result = validateViewMetadata(broken);

    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'COMPONENT_BINDING_UNSUPPORTED')).toBe(true);
  });

  it('blocks publish when layout references missing component ids', () => {
    const broken: ViewMetadata = {
      ...sampleCreateEditView,
      layout: {
        ...sampleCreateEditView.layout,
        children: [
          ...(sampleCreateEditView.layout.children ?? []),
          {
            id: 'section-invalid',
            type: 'section',
            componentIds: ['component-that-does-not-exist'],
          },
        ],
      },
    };

    const result = validateViewMetadata(broken);
    const layoutIssue = result.issues.find((issue) => issue.code === 'LAYOUT_COMPONENT_REFERENCE_MISSING');

    expect(result.isValid).toBe(false);
    expect(layoutIssue?.blocking).toBe(true);
    expect(layoutIssue?.path).toContain('layout.componentIds');
  });

  it('blocks publish when rules reference unknown action or component targets', () => {
    const broken: ViewMetadata = {
      ...sampleCreateEditView,
      rules: [
        ...sampleCreateEditView.rules,
        {
          id: 'broken-rule-targets',
          targetComponentId: 'unknown-component',
          targetActionId: 'unknown-action',
          effect: 'disable',
          condition: { contextPath: 'mode', operator: 'equals', value: 'edit' },
        },
      ],
    };

    const result = validateViewMetadata(broken);

    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'RULE_TARGET_COMPONENT_MISSING')).toBe(true);
    expect(result.issues.some((issue) => issue.code === 'RULE_TARGET_ACTION_MISSING')).toBe(true);
  });

  it('returns standardized validation issue shape', () => {
    const broken: ViewMetadata = {
      ...sampleCreateEditView,
      id: '',
    };
    const result = validateViewMetadata(broken);
    const first = result.issues[0];

    expect(first).toMatchObject({
      severity: 'error',
      blocking: true,
    });
    expect(typeof first.code).toBe('string');
    expect(typeof first.message).toBe('string');
    expect(typeof first.path).toBe('string');
  });

  it('blocks invalid root structure and duplicate layout node ids', () => {
    const broken: ViewMetadata = {
      ...sampleCreateEditView,
      layout: {
        id: 'layout-root',
        type: 'section',
        children: [
          { id: 'section-header', type: 'section', componentIds: ['customer-name'] },
          { id: 'section-header', type: 'section', componentIds: ['order-date'] },
        ],
      },
    };

    const result = validateViewMetadata(broken);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'LAYOUT_ROOT_TYPE_INVALID')).toBe(true);
    expect(result.issues.some((issue) => issue.code === 'LAYOUT_NODE_ID_DUPLICATE')).toBe(true);
  });

  it('blocks layout when root has no section children', () => {
    const broken: ViewMetadata = {
      ...sampleCreateEditView,
      layout: {
        id: 'layout-root',
        type: 'root',
        children: [],
      },
    };

    const result = validateViewMetadata(broken);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'LAYOUT_ROOT_SECTION_REQUIRED')).toBe(true);
  });

  it('blocks unsupported rule effect for this slice', () => {
    const broken: ViewMetadata = {
      ...sampleCreateEditView,
      rules: [
        {
          id: 'rule-unsupported',
          targetComponentId: 'customer-name',
          effect: 'readonly',
          condition: { contextPath: 'mode', operator: 'equals', value: 'preview' },
        },
      ],
    };

    const result = validateViewMetadata(broken);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'RULE_EFFECT_UNSUPPORTED')).toBe(true);
  });

  it('blocks malformed rule condition for supported operators', () => {
    const broken: ViewMetadata = {
      ...sampleCreateEditView,
      rules: [
        {
          id: 'rule-bad-condition',
          targetComponentId: 'customer-name',
          effect: 'hide',
          condition: { operator: 'equals', value: 'preview' },
        },
      ],
    };

    const result = validateViewMetadata(broken);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'RULE_CONDITION_INVALID')).toBe(true);
  });

  it('blocks unsupported action type', () => {
    const broken: ViewMetadata = {
      ...sampleCreateEditView,
      actions: [
        {
          ...sampleCreateEditView.actions[0],
          type: 'api.call' as unknown as ViewMetadata['actions'][number]['type'],
        },
      ],
    };

    const result = validateViewMetadata(broken);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'ACTION_TYPE_UNSUPPORTED')).toBe(true);
  });

  it('blocks unknown action target component reference', () => {
    const broken: ViewMetadata = {
      ...sampleCreateEditView,
      actions: [
        {
          ...sampleCreateEditView.actions[0],
          targetComponentId: 'missing-component',
        },
      ],
    };

    const result = validateViewMetadata(broken);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'ACTION_TARGET_COMPONENT_MISSING')).toBe(true);
  });

  it('blocks invalid action payload shape for supported type', () => {
    const broken: ViewMetadata = {
      ...sampleCreateEditView,
      actions: [
        {
          ...sampleCreateEditView.actions[0],
          type: 'ui.navigate',
          payload: { route: '   ' },
        },
      ],
    };

    const result = validateViewMetadata(broken);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'ACTION_PAYLOAD_INVALID')).toBe(true);
  });

  it('blocks empty condition groups', () => {
    const broken: ViewMetadata = {
      ...sampleCreateEditView,
      rules: [
        {
          id: 'rule-empty-group',
          targetActionId: 'action-save',
          effect: 'disable',
          condition: { all: [] },
        },
      ],
    };

    const result = validateViewMetadata(broken);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'RULE_CONDITION_GROUP_EMPTY')).toBe(true);
  });

  it('blocks condition depth above supported max', () => {
    const broken: ViewMetadata = {
      ...sampleCreateEditView,
      rules: [
        {
          id: 'rule-over-depth',
          targetActionId: 'action-save',
          effect: 'disable',
          condition: {
            all: [
              {
                any: [
                  {
                    all: [{ contextPath: 'mode', operator: 'equals', value: 'edit' }],
                  },
                ],
              },
            ],
          },
        },
      ],
    };

    const result = validateViewMetadata(broken);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'RULE_CONDITION_DEPTH_EXCEEDED')).toBe(true);
  });
});
