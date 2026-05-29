import { useMemo, useState } from 'react';
import {
  Type, Hash, Calendar, List, Link, Zap, MoreVertical,
} from 'lucide-react';
import type { BuilderDraftState } from './types';
import type { PaletteDragData } from './ComponentPalette';
import EmptyCanvasState from './EmptyCanvasState';

export type DropTarget =
  | { kind: 'section'; sectionId: string }
  | { kind: 'column'; sectionId: string; columnId: string };

type LayoutCanvasProps = {
  draft: BuilderDraftState;
  onSelectComponent: (componentId: string) => void;
  onSelectNode?: (nodeId: string) => void;
  onDrop: (data: PaletteDragData, target: DropTarget) => void;
  onSelectTemplate: (template: 'blank' | 'create-edit' | 'list-view') => void;
  componentsWithIssues: Set<string>;
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  'text-field': <Type size={12} />,
  'number-field': <Hash size={12} />,
  'date-field': <Calendar size={12} />,
  'select-field': <List size={12} />,
  'entity-picker': <Link size={12} />,
  'action-toolbar': <Zap size={12} />,
};

const ACCENT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export default function LayoutCanvas({
  draft,
  onSelectComponent,
  onSelectNode,
  onDrop,
  onSelectTemplate,
  componentsWithIssues,
}: LayoutCanvasProps) {
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Map each column/section id → parent section id
  const columnToSection = useMemo(() => {
    const map = new Map<string, string>();
    for (const section of draft.metadata.layout.children ?? []) {
      map.set(section.id, section.id);
      for (const row of section.children ?? []) {
        for (const col of row.children ?? []) {
          if (col.type === 'column') {
            map.set(col.id, section.id);
          }
        }
      }
    }
    return map;
  }, [draft.metadata.layout]);

  // Map each componentId → rule count
  const rulesPerComponent = useMemo(() => {
    const map = new Map<string, number>();
    for (const rule of draft.metadata.rules) {
      const id = rule.targetComponentId;
      if (id) map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  }, [draft.metadata.rules]);

  const parseDrop = (e: React.DragEvent): PaletteDragData | null => {
    try {
      const raw = e.dataTransfer.getData('text/plain');
      const data = JSON.parse(raw) as PaletteDragData;
      return data.source === 'palette' ? data : null;
    } catch {
      return null;
    }
  };

  const handleSectionDrop = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);
    const data = parseDrop(e);
    if (!data) return;
    onDrop(data, { kind: 'section', sectionId });
  };

  const handleColumnDrop = (e: React.DragEvent, sectionId: string, columnId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);
    const data = parseDrop(e);
    if (!data) return;
    onDrop(data, { kind: 'column', sectionId, columnId });
  };

  const renderComponentChip = (componentId: string) => {
    const component = draft.metadata.components.find((c) => c.id === componentId);
    if (!component) return null;

    const isSelected = draft.selectedComponentId === componentId;
    const hasIssue = componentsWithIssues.has(componentId);
    const ruleCount = rulesPerComponent.get(componentId) ?? 0;
    const icon = TYPE_ICONS[component.type] ?? <Type size={12} />;

    return (
      <button
        key={componentId}
        type="button"
        className={`canvas-field-chip${isSelected ? ' canvas-field-chip--selected' : ''}${hasIssue ? ' canvas-field-chip--issue' : ''}`}
        onClick={() => {
          onSelectComponent(componentId);
        }}
        aria-selected={isSelected}
        title={`${component.type} — ${component.id}`}
      >
        <span className="canvas-field-chip__icon">{icon}</span>
        <span className="canvas-field-chip__label">{component.label ?? component.type}</span>
        {ruleCount > 0 && (
          <span className="canvas-field-chip__rule-badge" title={`${ruleCount} rule${ruleCount > 1 ? 's' : ''}`}>
            {ruleCount}
          </span>
        )}
        {hasIssue && <span className="canvas-field-chip__error-dot" title="Has validation issues" />}
      </button>
    );
  };

  const sections = draft.metadata.layout.children ?? [];
  const isEmpty = sections.length === 0 && draft.metadata.components.length === 0;

  if (isEmpty) {
    return <EmptyCanvasState onSelectTemplate={onSelectTemplate} />;
  }

  return (
    <div data-testid="builder-layout-canvas" className="canvas-root">
      {sections.map((section, sectionIndex) => {
        const accentColor = ACCENT_COLORS[sectionIndex % ACCENT_COLORS.length];
        const isSelectedSection = draft.selectedNodeId === section.id;
        const sectionComponentIds = section.componentIds ?? [];
        const rows = (section.children ?? []).filter((c) => c.type === 'row');

        return (
          <div
            key={section.id}
            className={`canvas-section${isSelectedSection ? ' canvas-section--selected' : ''}`}
          >
            {/* Left accent bar */}
            <div className="canvas-section__accent" style={{ background: accentColor }} />

            {/* Section header */}
            <div className="canvas-section__header">
              <button
                type="button"
                className="canvas-section__title-btn"
                onClick={() => onSelectNode?.(section.id)}
                title={`Select section: ${section.id}`}
              >
                {section.id}
              </button>
              <button
                type="button"
                className="canvas-section__menu-btn"
                onClick={() => onSelectNode?.(section.id)}
                aria-label="Section options"
              >
                <MoreVertical size={14} />
              </button>
            </div>

            {/* Section body */}
            <div className="canvas-section__body">
              {/* Root-level component chips in section */}
              {sectionComponentIds.length > 0 && (
                <div className="canvas-chips-row">
                  {sectionComponentIds.map((cid) => renderComponentChip(cid))}
                </div>
              )}

              {/* Rows */}
              {rows.map((row) => {
                const columns = (row.children ?? []).filter((c) => c.type === 'column');
                return (
                  <div key={row.id} className="canvas-row">
                    <span className="canvas-row__label">Row</span>
                    {columns.length > 0 ? (
                      <div className="canvas-columns">
                        {columns.map((col) => {
                          const colSectionId = columnToSection.get(col.id) ?? section.id;
                          const isDropTarget = dragOverId === col.id;
                          return (
                            <div
                              key={col.id}
                              className={`canvas-col${isDropTarget ? ' canvas-col--drop-active' : ''}`}
                              onDragOver={(e) => { e.preventDefault(); setDragOverId(col.id); }}
                              onDragLeave={() => setDragOverId(null)}
                              onDrop={(e) => handleColumnDrop(e, colSectionId, col.id)}
                            >
                              <span className="canvas-col__label">{col.id}</span>
                              {(col.componentIds ?? []).map((cid) => renderComponentChip(cid))}
                              <div className={`canvas-drop-zone${isDropTarget ? ' canvas-drop-zone--active' : ''}`}>
                                + Drop here
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="canvas-row__empty">No columns — add a column from the palette</p>
                    )}
                  </div>
                );
              })}

              {/* Section-level drop zone (when no rows, or always as fallback) */}
              {rows.length === 0 && (
                <div
                  className={`canvas-drop-zone canvas-drop-zone--section${dragOverId === section.id ? ' canvas-drop-zone--active' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOverId(section.id); }}
                  onDragLeave={() => setDragOverId(null)}
                  onDrop={(e) => handleSectionDrop(e, section.id)}
                >
                  + Drop field here, or add a Row first
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

