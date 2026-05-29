import type { BuilderDraftState } from './types';
import type { ViewSurface } from '../types';

type PropertiesPanelProps = {
  draft: BuilderDraftState;
  onUpdateViewMeta: (patch: { name?: string; entityName?: string; surface?: ViewSurface; version?: string }) => void;
  onUpdateComponentLabel: (componentId: string, label: string) => void;
};

const SURFACES: ViewSurface[] = [
  'create-edit',
  'list',
  'detail',
  'transaction-workspace',
  'dashboard',
  'wizard',
  'console',
];

export default function PropertiesPanel({ draft, onUpdateViewMeta, onUpdateComponentLabel }: PropertiesPanelProps) {
  const selected = draft.metadata.components.find((c) => c.id === draft.selectedComponentId) ?? null;

  if (selected) {
    return (
      <div className="prop-dock" data-testid="props-panel-component">
        <div className="prop-dock__header">
          <span className="prop-dock__context-chip">Component</span>
          <span className="prop-dock__context-id">{selected.id}</span>
        </div>

        <div className="prop-group">
          <label className="prop-field">
            <span className="prop-field__label">Label</span>
            <input
              className="ui-studio-input"
              value={selected.label ?? ''}
              onChange={(e) => onUpdateComponentLabel(selected.id, e.target.value)}
              placeholder="Component label"
            />
          </label>

          <div className="prop-field">
            <span className="prop-field__label">Type</span>
            <span className="prop-type-chip">{selected.type}</span>
          </div>

          {selected.bindings && selected.bindings.length > 0 && (
            <div className="prop-field">
              <span className="prop-field__label">Binding</span>
              <span className="prop-field__value">{selected.bindings[0]?.source ?? '—'}</span>
            </div>
          )}

          <div className="prop-field">
            <span className="prop-field__label">Component ID</span>
            <span className="prop-field__value prop-field__value--mono">{selected.id}</span>
          </div>
        </div>
      </div>
    );
  }

  // No component selected: show view-level metadata
  return (
    <div className="prop-dock" data-testid="props-panel-view">
      <div className="prop-dock__header">
        <span className="prop-dock__context-chip">View</span>
        <span className="prop-dock__context-id">{draft.metadata.viewCode}</span>
      </div>

      <div className="prop-group">
        <label className="prop-field">
          <span className="prop-field__label">View Name</span>
          <input
            className="ui-studio-input"
            value={draft.metadata.name}
            onChange={(e) => onUpdateViewMeta({ name: e.target.value })}
            placeholder="View name"
          />
        </label>

        <label className="prop-field">
          <span className="prop-field__label">Entity</span>
          <input
            className="ui-studio-input"
            value={draft.metadata.entityName}
            onChange={(e) => onUpdateViewMeta({ entityName: e.target.value })}
            placeholder="Entity name"
          />
        </label>

        <label className="prop-field">
          <span className="prop-field__label">Surface</span>
          <select
            className="ui-studio-select"
            value={draft.metadata.surface}
            onChange={(e) => onUpdateViewMeta({ surface: e.target.value as ViewSurface })}
          >
            {SURFACES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <label className="prop-field">
          <span className="prop-field__label">Version</span>
          <input
            className="ui-studio-input"
            value={draft.metadata.version}
            onChange={(e) => onUpdateViewMeta({ version: e.target.value })}
            placeholder="1.0.0"
          />
        </label>
      </div>

      <p className="prop-dock__hint">Select a field on the canvas to edit its properties.</p>
    </div>
  );
}
