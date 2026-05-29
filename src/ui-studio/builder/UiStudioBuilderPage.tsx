import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './uiStudioBuilder.css';
import { sampleCreateEditView } from '../metadata/sampleCreateEditView';
import { validateViewMetadata } from '../validation/validateViewMetadata';
import BuilderShell from './BuilderShell';
import BuilderTopBar from './BuilderTopBar';
import LayoutCanvas, { type DropTarget } from './LayoutCanvas';
import BuilderValidationPanel from './BuilderValidationPanel';
import BehaviorRulesPanel from './BehaviorRulesPanel';
import ActionsPanel from './ActionsPanel';
import ComponentPalette, { type PaletteDragData } from './ComponentPalette';
import PropertiesPanel from './PropertiesPanel';
import PreviewOverlay from './PreviewOverlay';
import {
  addColumnToDraft,
  addFieldToDraft,
  addRowToDraft,
  addSectionToDraft,
  createBuilderDraftState,
  moveFieldToColumn,
  updateComponentLabelInDraft,
  updateViewMetaInDraft,
} from './draftState';
import { emptyHistory, pushHistory, undoStep, redoStep, canUndo, canRedo } from './undoHistory';
import type { UndoHistoryState } from './undoHistory';
import type { BuilderDraftState } from './types';
import type { ViewSurface } from '../types';
import type { BuilderSaveState } from './uxContracts';
import { loadBuilderDraft, saveBuilderDraft } from './persistence';

const FIRST_RUN_KEY = 'ui-studio.first-run.v1';

const TOUR_STEPS = [
  { title: 'Step 1 of 3 â€” Component Palette', body: 'Pick a field from the left panel â€” drag it onto the canvas or click to add it to the active section.' },
  { title: 'Step 2 of 3 â€” Canvas', body: 'Click any field chip on the canvas to select it. It highlights with a blue ring.' },
  { title: 'Step 3 of 3 â€” Properties Panel', body: 'The right panel shows properties for the selected field. Edit label, type, and binding here.' },
];

function getStarterDraft(template: 'blank' | 'create-edit' | 'list-view'): BuilderDraftState {
  if (template === 'create-edit') {
    return createBuilderDraftState(sampleCreateEditView);
  }
  const base = {
    ...sampleCreateEditView,
    layout: { id: 'root', type: 'root' as const, children: template === 'list-view' ? [{ id: 'section-list', type: 'section' as const, children: [] }] : [] },
    components: [],
    actions: [],
    rules: [],
  };
  if (template === 'list-view') {
    return createBuilderDraftState({ ...base, id: 'view-list', viewCode: 'list-view', name: 'List View', surface: 'list' as ViewSurface });
  }
  return createBuilderDraftState({ ...base, id: 'view-blank', viewCode: 'blank-view', name: 'Blank Form', surface: 'create-edit' as ViewSurface });
}

export default function UiStudioBuilderPage() {
  const baseDraftRef = useRef(createBuilderDraftState(sampleCreateEditView));
  const initialRecovery = useMemo(() => loadBuilderDraft(baseDraftRef.current), []);

  // Core draft state â€” use _setDraft only; exposed setDraft wrapper adds undo history
  const [draft, _setDraft] = useState<BuilderDraftState>(initialRecovery.draft);
  const [history, setHistory] = useState<UndoHistoryState<BuilderDraftState>>(emptyHistory);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  // Persistence & save state
  const [saveState, setSaveState] = useState<BuilderSaveState>(initialRecovery.status);
  const [lastSavedAt, setLastSavedAt] = useState<number>(Date.now());
  const [recoverNote, setRecoverNote] = useState<string>(initialRecovery.reason ?? '');

  // UI state
  const [rightPanelTab, setRightPanelTab] = useState<'properties' | 'behavior' | 'actions'>('properties');
  const [previewMode, setPreviewMode] = useState(false);
  const [tourStep, setTourStep] = useState<number | null>(null);

  // Checklist tracking
  const [hasAddedField, setHasAddedField] = useState(false);
  const [hasAddedSection, setHasAddedSection] = useState(false);
  const [hasAddedRule, setHasAddedRule] = useState(false);

  // ---------------------------------------------------------------------------
  // Draft mutation wrapper â€” pushes to undo history for user actions
  // ---------------------------------------------------------------------------
  const setDraft = useCallback((updater: (current: BuilderDraftState) => BuilderDraftState) => {
    const current = draftRef.current;
    const next = updater(current);
    if (next !== current) {
      setHistory((h) => pushHistory(h, current));
      _setDraft(next);
    }
  }, []);

  // Undo / redo
  const handleUndo = useCallback(() => {
    const result = undoStep(history, draftRef.current);
    if (result) {
      setHistory(result.history);
      _setDraft(result.restored);
    }
  }, [history]);

  const handleRedo = useCallback(() => {
    const result = redoStep(history, draftRef.current);
    if (result) {
      setHistory(result.history);
      _setDraft(result.restored);
    }
  }, [history]);

  // Keep stable refs for keyboard handler
  const handleUndoRef = useRef(handleUndo);
  handleUndoRef.current = handleUndo;
  const handleRedoRef = useRef(handleRedo);
  handleRedoRef.current = handleRedo;

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------
  const primarySectionId = draft.metadata.layout.children?.[0]?.id ?? '';
  const selectedSectionId = draft.selectedNodeId ?? primarySectionId;

  const componentsWithIssues = useMemo(() => {
    const result = validateViewMetadata(draft.metadata);
    const ids = new Set<string>();
    for (const issue of result.issues) {
      if (!issue.blocking && issue.severity !== 'error') continue;
      if (!issue.path) continue;
      for (const comp of draft.metadata.components) {
        if (issue.path.includes(comp.id) || issue.message.includes(comp.id)) {
          ids.add(comp.id);
        }
      }
    }
    return ids;
  }, [draft]);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Auto-save
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSaveState('saving');
      const error = saveBuilderDraft(draft);
      if (error) {
        setSaveState('error');
        setRecoverNote(error.message);
        return;
      }
      setSaveState('saved');
      setLastSavedAt(Date.now());
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [draft]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndoRef.current();
      }
      if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedoRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // First-run tour
  useEffect(() => {
    const seen = localStorage.getItem(FIRST_RUN_KEY);
    if (!seen) {
      const timer = window.setTimeout(() => setTourStep(0), 1000);
      return () => window.clearTimeout(timer);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  const handleAddField = (type: string, label: string, fieldPath: string) => {
    const componentId = `${type}-${Date.now()}`;
    setDraft((current) =>
      addFieldToDraft(current, { componentId, componentType: type, label, fieldPath }, primarySectionId || undefined),
    );
    setHasAddedField(true);
  };

  const handleAddSection = () => {
    const sectionId = `section-${Date.now()}`;
    setDraft((current) => addSectionToDraft(current, { sectionId, afterSectionId: selectedSectionId }));
    setHasAddedSection(true);
  };

  const handleAddRow = () => {
    const current = draftRef.current;
    const sectionId = current.selectedNodeId ?? current.metadata.layout.children?.[0]?.id;
    if (!sectionId) return;
    const rowId = `row-${Date.now()}`;
    setDraft((c) => addRowToDraft(c, { sectionId, rowId }));
  };

  const handleAddColumn = () => {
    const current = draftRef.current;
    const sectionId = current.selectedNodeId ?? current.metadata.layout.children?.[0]?.id;
    if (!sectionId) return;
    const section = current.metadata.layout.children?.find((s) => s.id === sectionId);
    const rows = section?.children?.filter((c) => c.type === 'row') ?? [];
    const rowId = rows[rows.length - 1]?.id;
    if (!rowId) return;
    const columnId = `column-${Date.now()}`;
    setDraft((c) => addColumnToDraft(c, { sectionId, rowId, columnId }));
  };

  const handleCanvasDrop = (data: PaletteDragData, target: DropTarget) => {
    const componentId = `${data.type}-${Date.now()}`;
    const sectionId = target.sectionId;
    setDraft((current) => {
      let next = addFieldToDraft(current, {
        componentId,
        componentType: data.type,
        label: data.label,
        fieldPath: data.fieldPath,
      }, sectionId);
      if (target.kind === 'column') {
        next = moveFieldToColumn(next, {
          componentId,
          fromContainerId: sectionId,
          toColumnId: target.columnId,
        });
      }
      return next;
    });
    setHasAddedField(true);
  };

  const handleSelectComponent = (id: string) => {
    _setDraft((current) => ({ ...current, selectedComponentId: id }));
    setRightPanelTab('properties');
  };

  const handleSelectNode = (nodeId: string) => {
    _setDraft((current) => ({ ...current, selectedNodeId: nodeId }));
  };

  const handleSelectTemplate = (template: 'blank' | 'create-edit' | 'list-view') => {
    const newDraft = getStarterDraft(template);
    setHistory(emptyHistory());
    _setDraft(newDraft);
  };

  const handleUpdateViewMeta = (patch: Partial<{ name: string; entityName: string; surface: ViewSurface; version: string }>) => {
    setDraft((current) => updateViewMetaInDraft(current, patch));
  };

  const handleUpdateComponentLabel = (componentId: string, label: string) => {
    setDraft((current) => updateComponentLabelInDraft(current, { componentId, label }));
  };

  const handleManualSave = () => {
    setSaveState('saving');
    const error = saveBuilderDraft(draft);
    if (error) {
      setSaveState('error');
      setRecoverNote(error.message);
    } else {
      setSaveState('saved');
      setLastSavedAt(Date.now());
    }
  };

  const handleValidationJump = (path: string) => {
    const bracketMatch = path.match(/components\[(\d+)\]/);
    if (bracketMatch) {
      const idx = parseInt(bracketMatch[1], 10);
      const comp = draft.metadata.components[idx];
      if (comp) {
        _setDraft((c) => ({ ...c, selectedComponentId: comp.id }));
        setRightPanelTab('properties');
        return;
      }
    }
    for (const comp of draft.metadata.components) {
      if (path.includes(comp.id) || path.includes(comp.id)) {
        _setDraft((c) => ({ ...c, selectedComponentId: comp.id }));
        setRightPanelTab('properties');
        return;
      }
    }
    for (const section of draft.metadata.layout.children ?? []) {
      if (path.includes(section.id)) {
        _setDraft((c) => ({ ...c, selectedNodeId: section.id }));
        return;
      }
    }
  };

  const handleTourNext = () => {
    if (tourStep === null) return;
    if (tourStep >= TOUR_STEPS.length - 1) {
      setTourStep(null);
      localStorage.setItem(FIRST_RUN_KEY, '1');
    } else {
      setTourStep(tourStep + 1);
    }
  };

  const handleTourSkip = () => {
    setTourStep(null);
    localStorage.setItem(FIRST_RUN_KEY, '1');
  };

  // ---------------------------------------------------------------------------
  // Rule checklist tracking
  // ---------------------------------------------------------------------------
  const ruleCount = draft.metadata.rules.length;
  const prevRuleCountRef = useRef(ruleCount);
  useEffect(() => {
    if (ruleCount > prevRuleCountRef.current) setHasAddedRule(true);
    prevRuleCountRef.current = ruleCount;
  }, [ruleCount]);

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------
  return (
    <div data-testid="ui-studio-builder-page" className="ui-studio-builder">
      {/* First-run tour banner */}
      {tourStep !== null && TOUR_STEPS[tourStep] && (
        <div className="tour-banner">
          <div className="tour-banner__content">
            <strong className="tour-banner__title">{TOUR_STEPS[tourStep].title}</strong>
            <span className="tour-banner__body">{TOUR_STEPS[tourStep].body}</span>
          </div>
          <div className="tour-banner__actions">
            <button type="button" className="ui-studio-btn ui-studio-btn--primary" onClick={handleTourNext}>
              {tourStep >= TOUR_STEPS.length - 1 ? 'Done' : 'Next â†’'}
            </button>
            <button type="button" className="ui-studio-btn" onClick={handleTourSkip}>
              Skip tour
            </button>
          </div>
        </div>
      )}

      {/* Recovery note */}
      {recoverNote && (
        <div className="ui-studio-assist ui-studio-assist--tip" style={{ marginBottom: 8 }}>
          {recoverNote}
        </div>
      )}

      <BuilderShell
        topBar={
          <BuilderTopBar
            dirty={draft.dirty}
            saveState={saveState}
            lastSavedAt={lastSavedAt}
            viewName={draft.metadata.name}
            entityName={draft.metadata.entityName}
            canUndo={canUndo(history)}
            canRedo={canRedo(history)}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onSave={handleManualSave}
            onValidate={() => {/* validation is always live in the bottom bar */}}
            onPreview={() => setPreviewMode(true)}
          />
        }
        leftPanel={
          <ComponentPalette
            onAddField={handleAddField}
            onAddSection={handleAddSection}
            onAddRow={handleAddRow}
            onAddColumn={handleAddColumn}
            onAddAction={() => setRightPanelTab('actions')}
            hasAddedField={hasAddedField}
            hasAddedSection={hasAddedSection}
            hasAddedRule={hasAddedRule}
            hasPreviewed={previewMode}
          />
        }
        canvas={
          <>
            {previewMode && (
              <PreviewOverlay
                metadata={draft.metadata}
                onClose={() => {
                  setPreviewMode(false);
                  setHasAddedRule((r) => { localStorage.setItem('ui-studio.checklist.preview', '1'); return r; });
                }}
              />
            )}
            <LayoutCanvas
              draft={draft}
              onSelectComponent={handleSelectComponent}
              onSelectNode={handleSelectNode}
              onDrop={handleCanvasDrop}
              onSelectTemplate={handleSelectTemplate}
              componentsWithIssues={componentsWithIssues}
            />
          </>
        }
        rightPanel={
          <div className="right-panel-root">
            {/* Tabs */}
            <div className="ui-studio-tabs">
              {(['properties', 'behavior', 'actions'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`ui-studio-tab${rightPanelTab === tab ? ' ui-studio-tab--active' : ''}`}
                  onClick={() => setRightPanelTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {rightPanelTab === 'properties' && (
              <PropertiesPanel
                draft={draft}
                onUpdateViewMeta={handleUpdateViewMeta}
                onUpdateComponentLabel={handleUpdateComponentLabel}
              />
            )}
            {rightPanelTab === 'behavior' && (
              <BehaviorRulesPanel draft={draft} setDraft={setDraft} />
            )}
            {rightPanelTab === 'actions' && (
              <ActionsPanel draft={draft} setDraft={setDraft} />
            )}
          </div>
        }
        bottomPanel={
          <BuilderValidationPanel
            draft={draft}
            onJumpTo={handleValidationJump}
          />
        }
      />
    </div>
  );
}
