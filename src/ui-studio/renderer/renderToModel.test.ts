import { describe, expect, it } from 'vitest';
import { sampleCreateEditView } from '../metadata/sampleCreateEditView';
import type { RuntimeContext, ViewMetadata } from '../types';
import { renderToModel } from './renderToModel';

const desktopContext: RuntimeContext = {
  userId: 'user-1',
  roles: ['sales'],
  mode: 'preview',
  device: 'desktop',
  channel: 'web',
  workflowState: 'draft',
};

describe('ui-studio renderer model', () => {
  it('renders deterministically for the same context', () => {
    const first = renderToModel(sampleCreateEditView, desktopContext);
    const second = renderToModel(sampleCreateEditView, desktopContext);

    expect(first.model.componentModels).toEqual(second.model.componentModels);
  });

  it('emits diagnostics for unsupported components without crashing', () => {
    const broken: ViewMetadata = {
      ...sampleCreateEditView,
      components: [
        ...sampleCreateEditView.components,
        { id: 'unknown-component', type: 'x-unknown-field', label: 'Unknown Field' },
      ],
    };

    const rendered = renderToModel(broken, desktopContext);
    const renderedSecond = renderToModel(broken, desktopContext);

    expect(rendered.model.componentModels.some((component) => component.id === 'unknown-component')).toBe(false);
    expect(rendered.model.diagnostics.some((event) => event.errorCode === 'COMPONENT_NOT_REGISTERED')).toBe(true);
    expect(rendered.model.diagnostics).toEqual(renderedSecond.model.diagnostics);
    const diagnostic = rendered.model.diagnostics.find((event) => event.errorCode === 'COMPONENT_NOT_REGISTERED');
    expect(diagnostic?.id).toBe('view-so-create:1.0.0:COMPONENT_NOT_REGISTERED:unknown-component');
    expect(diagnostic?.message).not.toContain('\n');
  });

  it('keeps stable component visibility without matching hide rule', () => {
    const mobileContext: RuntimeContext = {
      ...desktopContext,
      device: 'mobile',
      roles: ['warehouse'],
      channel: 'mobile',
    };

    const rendered = renderToModel(sampleCreateEditView, mobileContext);
    const salesOwner = rendered.model.componentModels.find((component) => component.id === 'sales-owner');

    expect(salesOwner?.hidden).toBe(false);
  });
});
