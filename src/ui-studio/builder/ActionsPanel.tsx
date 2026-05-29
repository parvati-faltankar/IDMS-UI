import { useMemo, useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Navigation, PanelRight, GitBranch, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  addActionToDraft,
  removeActionFromDraft,
  reorderActionsInDraft,
  updateActionInDraft,
} from './draftState';
import type { BuilderAllowedActionType, BuilderDraftState } from './types';

type ActionsPanelProps = {
  draft: BuilderDraftState;
  setDraft: (updater: (current: BuilderDraftState) => BuilderDraftState) => void;
};

const allowedTypes: BuilderAllowedActionType[] = ['ui.navigate', 'ui.open-panel', 'workflow.transition'];

const ACTION_ICON: Record<BuilderAllowedActionType, React.ReactNode> = {
  'ui.navigate': <Navigation size={14} />,
  'ui.open-panel': <PanelRight size={14} />,
  'workflow.transition': <GitBranch size={14} />,
};

const ACTION_COLOR: Record<BuilderAllowedActionType, string> = {
  'ui.navigate': '#2563eb',
  'ui.open-panel': '#7c3aed',
  'workflow.transition': '#059669',
};

const ACTION_LABEL: Record<BuilderAllowedActionType, string> = {
  'ui.navigate': 'Navigate',
  'ui.open-panel': 'Open Panel',
  'workflow.transition': 'Workflow',
};

export default function ActionsPanel({ draft, setDraft }: ActionsPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [label, setLabel] = useState('New Action');
  const [type, setType] = useState<BuilderAllowedActionType>('ui.navigate');
  const [targetComponentId, setTargetComponentId] = useState('');
  const [payloadValue, setPayloadValue] = useState('');

  const componentTargets = useMemo(
    () => draft.metadata.components.map((c) => ({ id: c.id, label: c.label ?? c.id })),
    [draft.metadata.components],
  );
  const effectiveTargetComponentId = targetComponentId || componentTargets[0]?.id;

  const buildPayload = () => {
    if (!payloadValue.trim()) return undefined;
    if (type === 'ui.navigate') return { route: payloadValue.trim() };
    if (type === 'ui.open-panel') return { panelId: payloadValue.trim() };
    return { transitionId: payloadValue.trim() };
  };

  const addAction = () => {
    const nextId = `action-${draft.metadata.actions.length + 1}`;
    setDraft((current) =>
      addActionToDraft(current, {
        action: {
          id: nextId,
          label,
          type,
          commandId: `${type}.${nextId}`,
          targetComponentId: effectiveTargetComponentId || undefined,
          payload: buildPayload(),
        },
      }),
    );
    setLabel('New Action');
    setPayloadValue('');
    setShowAddForm(false);
  };

  return (
    <div data-testid="builder-actions-panel" className="actions-panel">
      {draft.metadata.actions.length === 0 && !showAddForm && (
        <p className="ui-studio-subtle" style={{ padding: '8px 0' }}>No actions yet. Add one to define navigation or workflow transitions.</p>
      )}

      {/* Action cards */}
      <div className="action-list">
        {draft.metadata.actions.map((action, index) => {
          const actionType = (action.type ?? 'ui.navigate') as BuilderAllowedActionType;
          const color = ACTION_COLOR[actionType];
          const icon = ACTION_ICON[actionType];
          const typeLabel = ACTION_LABEL[actionType];

          return (
            <div key={action.id} className="action-card">
              <div className="action-card__icon" style={{ background: `${color}18`, color }}>
                {icon}
              </div>
              <div className="action-card__info">
                <span className="action-card__label">{action.label}</span>
                <span className="action-card__type">{typeLabel}</span>
              </div>
              <div className="action-card__controls">
                <button
                  type="button"
                  className="action-card__toggle"
                  title="Requires confirmation"
                  onClick={() =>
                    setDraft((current) =>
                      updateActionInDraft(current, {
                        actionId: action.id,
                        patch: { requiresConfirmation: !action.requiresConfirmation },
                      }),
                    )
                  }
                  aria-label="Toggle confirmation required"
                >
                  {action.requiresConfirmation ? (
                    <ToggleRight size={16} style={{ color: 'var(--brand)' }} />
                  ) : (
                    <ToggleLeft size={16} style={{ color: 'var(--muted)' }} />
                  )}
                </button>
                <button
                  type="button"
                  className="rule-card__icon-btn"
                  disabled={index === 0}
                  onClick={() => setDraft((current) => reorderActionsInDraft(current, { fromIndex: index, toIndex: index - 1 }))}
                  aria-label="Move up"
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  type="button"
                  className="rule-card__icon-btn"
                  disabled={index >= draft.metadata.actions.length - 1}
                  onClick={() => setDraft((current) => reorderActionsInDraft(current, { fromIndex: index, toIndex: index + 1 }))}
                  aria-label="Move down"
                >
                  <ArrowDown size={12} />
                </button>
                <button
                  type="button"
                  className="rule-card__icon-btn rule-card__icon-btn--danger"
                  onClick={() => setDraft((current) => removeActionFromDraft(current, { actionId: action.id }))}
                  aria-label="Delete action"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inline add form */}
      {showAddForm && (
        <div className="rule-add-form">
          <div className="ui-studio-grid">
            <label className="ui-studio-label">
              Label
              <input className="ui-studio-input" value={label} onChange={(e) => setLabel(e.target.value)} />
            </label>
            <label className="ui-studio-label">
              Type
              <select className="ui-studio-select" value={type} onChange={(e) => setType(e.target.value as BuilderAllowedActionType)}>
                {allowedTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="ui-studio-label">
              Target Component
              <select
                className="ui-studio-select"
                value={effectiveTargetComponentId}
                onChange={(e) => setTargetComponentId(e.target.value)}
              >
                {componentTargets.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </label>
            <label className="ui-studio-label">
              Payload
              <input
                className="ui-studio-input"
                value={payloadValue}
                onChange={(e) => setPayloadValue(e.target.value)}
                placeholder={type === 'ui.navigate' ? '/path' : type === 'ui.open-panel' ? 'panel-id' : 'transition-id'}
              />
            </label>
          </div>
          <div className="rule-add-form__actions">
            <button type="button" className="ui-studio-btn ui-studio-btn--primary" onClick={addAction}>
              Add Action
            </button>
            <button type="button" className="ui-studio-btn" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showAddForm && (
        <button type="button" className="rule-add-trigger" onClick={() => setShowAddForm(true)}>
          <Plus size={13} /> Add Action
        </button>
      )}
    </div>
  );
}
