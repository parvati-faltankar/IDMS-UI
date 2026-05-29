import type { BindingType, ViewSurface } from '../types';

export interface ComponentDefinition {
  type: string;
  label: string;
  category: 'field' | 'layout' | 'grid' | 'transaction' | 'workflow' | 'display' | 'data' | 'analytics';
  version: string;
  supportedSurfaces: ViewSurface[];
  supportedBindings: BindingType[];
  defaultProps: Record<string, unknown>;
  propSchema?: Record<string, unknown>;
  eventSchema?: Record<string, unknown>;
  deprecated?: boolean;
  replacementComponentType?: string;
}

const registry: ComponentDefinition[] = [
  {
    type: 'text-field',
    label: 'Text Field',
    category: 'field',
    version: '1.0.0',
    supportedSurfaces: ['detail', 'create-edit', 'transaction-workspace'],
    supportedBindings: ['entity-field', 'computed', 'static'],
    defaultProps: { required: false, placeholder: '' },
  },
  {
    type: 'number-field',
    label: 'Number Field',
    category: 'field',
    version: '1.0.0',
    supportedSurfaces: ['detail', 'create-edit', 'transaction-workspace'],
    supportedBindings: ['entity-field', 'computed', 'static'],
    defaultProps: { required: false, min: null, max: null },
  },
  {
    type: 'date-field',
    label: 'Date Field',
    category: 'field',
    version: '1.0.0',
    supportedSurfaces: ['detail', 'create-edit', 'transaction-workspace'],
    supportedBindings: ['entity-field', 'static'],
    defaultProps: { required: false },
  },
  {
    type: 'select-field',
    label: 'Select Field',
    category: 'field',
    version: '1.0.0',
    supportedSurfaces: ['detail', 'create-edit', 'transaction-workspace'],
    supportedBindings: ['entity-field', 'query', 'static'],
    defaultProps: { required: false, options: [] },
  },
  {
    type: 'entity-picker',
    label: 'Entity Picker',
    category: 'data',
    version: '1.0.0',
    supportedSurfaces: ['list', 'detail', 'create-edit', 'transaction-workspace'],
    supportedBindings: ['relationship', 'query', 'external'],
    defaultProps: { displayFields: [] },
  },
  {
    type: 'action-toolbar',
    label: 'Action Toolbar',
    category: 'display',
    version: '1.0.0',
    supportedSurfaces: ['list', 'detail', 'create-edit', 'transaction-workspace', 'wizard', 'console'],
    supportedBindings: [],
    defaultProps: { align: 'end' },
  },
];

export function getComponentRegistry(): ComponentDefinition[] {
  return registry;
}

export function getComponentDefinition(type: string): ComponentDefinition | undefined {
  return registry.find((item) => item.type === type);
}

