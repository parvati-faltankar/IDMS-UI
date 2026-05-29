import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { sampleCreateEditView } from '../metadata/sampleCreateEditView';
import { createBuilderDraftState } from './draftState';
import LayoutCanvas from './LayoutCanvas';
import UiStudioBuilderPage from './UiStudioBuilderPage';

describe('ui-studio builder shell rendering', () => {
  it('renders top/left/right/bottom shell structure', () => {
    const html = renderToStaticMarkup(<UiStudioBuilderPage />);

    expect(html).toContain('data-testid="builder-topbar"');
    expect(html).toContain('data-testid="builder-panel-left"');
    expect(html).toContain('data-testid="builder-panel-right"');
    expect(html).toContain('data-testid="builder-panel-bottom"');
    expect(html).toContain('Add Section');
    expect(html).toContain('Remove Selected Section');
    expect(html).toContain('Move Section Up');
    expect(html).toContain('Move Section Down');
    expect(html).toContain('Rows &amp; Columns');
    expect(html).toContain('Behavior');
    expect(html).toContain('Actions');
  });

  it('renders read-only canvas deterministically from metadata', () => {
    const draft = createBuilderDraftState(sampleCreateEditView);
    const first = renderToStaticMarkup(<LayoutCanvas draft={draft} onSelectComponent={() => undefined} onSelectNode={() => undefined} />);
    const second = renderToStaticMarkup(<LayoutCanvas draft={draft} onSelectComponent={() => undefined} onSelectNode={() => undefined} />);

    expect(first).toEqual(second);
    expect(first).toContain('Read-Only Canvas');
    expect(first).toContain('Customer Name');
  });
});
