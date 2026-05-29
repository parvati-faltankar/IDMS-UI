import { Undo2, Redo2, ChevronRight } from 'lucide-react';
import type { BuilderSaveState } from './uxContracts';

type BuilderTopBarProps = {
  dirty: boolean;
  saveState?: BuilderSaveState;
  lastSavedAt?: number;
  viewName?: string;
  entityName?: string;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onValidate?: () => void;
  onPreview?: () => void;
};

function formatSavedAt(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return 'Just saved';
  if (diff < 60) return `Saved ${diff}s ago`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `Saved ${mins}m ago`;
  return 'Saved earlier';
}

export default function BuilderTopBar({
  dirty,
  saveState = 'idle',
  lastSavedAt,
  viewName = 'Untitled View',
  entityName = 'Entity',
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onSave,
  onValidate,
  onPreview,
}: BuilderTopBarProps) {
  const saveChipClass =
    saveState === 'saved' ? 'topbar__save-chip topbar__save-chip--saved' :
    saveState === 'saving' ? 'topbar__save-chip topbar__save-chip--saving' :
    saveState === 'error' ? 'topbar__save-chip topbar__save-chip--error' :
    saveState === 'recovered' ? 'topbar__save-chip topbar__save-chip--recovered' :
    dirty ? 'topbar__save-chip topbar__save-chip--unsaved' :
    'topbar__save-chip topbar__save-chip--idle';

  const saveLabel =
    saveState === 'saving' ? '● Saving…' :
    saveState === 'saved' && lastSavedAt ? `✓ ${formatSavedAt(lastSavedAt)}` :
    saveState === 'error' ? '✗ Save error' :
    saveState === 'recovered' ? '↩ Recovered' :
    dirty ? '● Unsaved changes' :
    '✓ Up to date';

  return (
    <div data-testid="builder-topbar" className="ui-studio-topbar">
      {/* Left: breadcrumb */}
      <nav className="topbar__breadcrumb" aria-label="Builder location">
        <span className="topbar__crumb topbar__crumb--root">UI Studio</span>
        <ChevronRight size={13} className="topbar__crumb-sep" />
        <span className="topbar__crumb">{entityName}</span>
        <ChevronRight size={13} className="topbar__crumb-sep" />
        <span className="topbar__crumb topbar__crumb--active">{viewName}</span>
      </nav>

      {/* Center: save status */}
      <div className="topbar__center">
        <span className={saveChipClass}>{saveLabel}</span>
      </div>

      {/* Right: action groups */}
      <div className="topbar__right">
        {/* History group */}
        <div className="topbar__btn-group">
          <button
            type="button"
            className="ui-studio-btn topbar__icon-btn"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <Undo2 size={15} />
          </button>
          <button
            type="button"
            className="ui-studio-btn topbar__icon-btn"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
          >
            <Redo2 size={15} />
          </button>
        </div>
        {/* Secondary */}
        <button type="button" className="ui-studio-btn" onClick={onValidate}>
          Validate
        </button>
        {/* Primary */}
        <div className="topbar__btn-group">
          <button type="button" className="ui-studio-btn" onClick={onSave}>
            Save
          </button>
          <button type="button" className="ui-studio-btn ui-studio-btn--primary" onClick={onPreview}>
            Preview
          </button>
        </div>
      </div>
    </div>
  );
}
