import { describe, expect, it } from 'vitest';
import { getComponentDefinition, getComponentRegistry } from './componentRegistry';

describe('ui-studio component registry', () => {
  it('contains standard create-edit components with binding contracts', () => {
    const registry = getComponentRegistry();

    expect(registry.length).toBeGreaterThan(0);
    expect(getComponentDefinition('text-field')?.supportedSurfaces.includes('create-edit')).toBe(true);
    expect(getComponentDefinition('entity-picker')?.supportedBindings.includes('relationship')).toBe(true);
  });
});

