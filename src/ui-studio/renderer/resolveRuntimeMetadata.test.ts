import { describe, expect, it } from 'vitest';
import { sampleCreateEditView } from '../metadata/sampleCreateEditView';
import type { RuntimeContext, ViewMetadata } from '../types';
import { resolveRuntimeMetadata } from './resolveRuntimeMetadata';

const context: RuntimeContext = {
  userId: 'user-1',
  roles: ['sales'],
  mode: 'preview',
  device: 'desktop',
  channel: 'web',
};

describe('ui-studio runtime metadata resolution', () => {
  it('applies permission pruning before behavior evaluation', () => {
    const pruned = resolveRuntimeMetadata(
      sampleCreateEditView,
      context,
      (view: ViewMetadata) => ({
        ...view,
        components: view.components.filter((component) => component.id !== 'sales-owner'),
      }),
    );

    expect(pruned.components.some((component) => component.id === 'sales-owner')).toBe(false);
  });
});

