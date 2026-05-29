import { useState, useEffect } from 'react';
import {
  Type,
  Hash,
  Calendar,
  List,
  Link,
  Zap,
  LayoutGrid,
  Rows3,
  Columns3,
  Search,
  GripVertical,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  BookOpen,
} from 'lucide-react';

export type PaletteDragData = {
  source: 'palette';
  type: string;
  label: string;
  fieldPath: string;
};

type FieldEntry = {
  type: string;
  label: string;
  fieldPath: string;
  icon: React.ReactNode;
  description: string;
};

const FIELDS: FieldEntry[] = [
  { type: 'text-field', label: 'Text Field', fieldPath: 'fieldText', icon: <Type size={13} />, description: 'Single-line text input' },
  { type: 'number-field', label: 'Number Field', fieldPath: 'fieldNumber', icon: <Hash size={13} />, description: 'Numeric value input' },
  { type: 'date-field', label: 'Date Field', fieldPath: 'fieldDate', icon: <Calendar size={13} />, description: 'Date picker' },
  { type: 'select-field', label: 'Select Field', fieldPath: 'fieldSelect', icon: <List size={13} />, description: 'Dropdown selector' },
  { type: 'entity-picker', label: 'Entity Picker', fieldPath: 'fieldEntity', icon: <Link size={13} />, description: 'Related record selector' },
  { type: 'action-toolbar', label: 'Action Toolbar', fieldPath: 'actions', icon: <Zap size={13} />, description: 'Button group for actions' },
];

type ComponentPaletteProps = {
  onAddField: (type: string, label: string, fieldPath: string) => void;
  onAddSection: () => void;
  onAddRow: () => void;
  onAddColumn: () => void;
  onAddAction: () => void;
  hasAddedField: boolean;
  hasAddedSection: boolean;
  hasAddedRule: boolean;
  hasPreviewed: boolean;
};

const CHECKLIST_KEY = 'ui-studio.checklist.v1';

function loadChecklist() {
  try {
    const raw = localStorage.getItem(CHECKLIST_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function saveChecklist(state: Record<string, boolean>) {
  try {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export default function ComponentPalette({
  onAddField,
  onAddSection,
  onAddRow,
  onAddColumn,
  onAddAction,
  hasAddedField,
  hasAddedSection,
  hasAddedRule,
  hasPreviewed,
}: ComponentPaletteProps) {
  const [search, setSearch] = useState('');
  const [fieldsOpen, setFieldsOpen] = useState(true);
  const [layoutOpen, setLayoutOpen] = useState(true);
  const [checklistOpen, setChecklistOpen] = useState(true);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>(loadChecklist);

  // Sync checklist from props
  useEffect(() => {
    const updated = { ...checklistState };
    let changed = false;
    if (hasAddedField && !updated.field) { updated.field = true; changed = true; }
    if (hasAddedSection && !updated.section) { updated.section = true; changed = true; }
    if (hasAddedRule && !updated.rule) { updated.rule = true; changed = true; }
    if (hasPreviewed && !updated.preview) { updated.preview = true; changed = true; }
    if (changed) {
      setChecklistState(updated);
      saveChecklist(updated);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAddedField, hasAddedSection, hasAddedRule, hasPreviewed]);

  const filteredFields = search
    ? FIELDS.filter((f) => f.label.toLowerCase().includes(search.toLowerCase()))
    : FIELDS;

  const handleDragStart = (e: React.DragEvent, field: FieldEntry) => {
    const data: PaletteDragData = { source: 'palette', type: field.type, label: field.label, fieldPath: field.fieldPath };
    e.dataTransfer.setData('text/plain', JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const checklistItems = [
    { key: 'field', label: 'Add your first field', done: !!checklistState.field },
    { key: 'section', label: 'Create a section', done: !!checklistState.section },
    { key: 'rule', label: 'Configure a behavior rule', done: !!checklistState.rule },
    { key: 'preview', label: 'Preview your view', done: !!checklistState.preview },
  ];
  const doneCount = checklistItems.filter((i) => i.done).length;

  return (
    <div className="palette-root">
      {/* Search */}
      <div className="palette-search-wrap">
        <Search size={13} className="palette-search-icon" />
        <input
          className="palette-search"
          placeholder="Search components…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search palette"
        />
      </div>

      {/* Form Fields group */}
      <div className="palette-group">
        <button
          type="button"
          className="palette-group__header"
          onClick={() => setFieldsOpen((o) => !o)}
          aria-expanded={fieldsOpen}
        >
          {fieldsOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          <span>Form Fields</span>
        </button>
        {fieldsOpen && (
          <div className="palette-group__body">
            {filteredFields.filter((f) => f.type !== 'action-toolbar').map((field) => (
              <div
                key={field.type}
                className="palette-chip"
                draggable
                onDragStart={(e) => handleDragStart(e, field)}
                title={field.description}
                role="button"
                tabIndex={0}
                aria-label={`Drag ${field.label} onto canvas`}
                onClick={() => onAddField(field.type, field.label, field.fieldPath)}
                onKeyDown={(e) => e.key === 'Enter' && onAddField(field.type, field.label, field.fieldPath)}
              >
                <GripVertical size={11} className="palette-chip__drag-handle" />
                <span className="palette-chip__icon">{field.icon}</span>
                <span className="palette-chip__label">{field.label}</span>
              </div>
            ))}
            {filteredFields.filter((f) => f.type !== 'action-toolbar').length === 0 && (
              <p className="palette-empty">No matches</p>
            )}
          </div>
        )}
      </div>

      {/* Layout group */}
      {!search && (
        <div className="palette-group">
          <button
            type="button"
            className="palette-group__header"
            onClick={() => setLayoutOpen((o) => !o)}
            aria-expanded={layoutOpen}
          >
            {layoutOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            <span>Layout</span>
          </button>
          {layoutOpen && (
            <div className="palette-group__body">
              <button type="button" className="palette-layout-btn" onClick={onAddSection}>
                <LayoutGrid size={13} />
                <span>Section</span>
              </button>
              <button type="button" className="palette-layout-btn" onClick={onAddRow}>
                <Rows3 size={13} />
                <span>Row</span>
              </button>
              <button type="button" className="palette-layout-btn" onClick={onAddColumn}>
                <Columns3 size={13} />
                <span>Column</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Actions group */}
      {!search && (
        <div className="palette-group">
          <button
            type="button"
            className="palette-group__header"
            onClick={() => {/* no-op collapse */}}
            aria-expanded
          >
            <ChevronDown size={13} />
            <span>Actions</span>
          </button>
          <div className="palette-group__body">
            {FIELDS.filter((f) => f.type === 'action-toolbar').map((field) => (
              <div
                key={field.type}
                className="palette-chip"
                draggable
                onDragStart={(e) => handleDragStart(e, field)}
                title={field.description}
                role="button"
                tabIndex={0}
                aria-label={`Drag ${field.label} onto canvas`}
                onClick={() => onAddField(field.type, field.label, field.fieldPath)}
                onKeyDown={(e) => e.key === 'Enter' && onAddField(field.type, field.label, field.fieldPath)}
              >
                <GripVertical size={11} className="palette-chip__drag-handle" />
                <span className="palette-chip__icon">{field.icon}</span>
                <span className="palette-chip__label">{field.label}</span>
              </div>
            ))}
            <button type="button" className="palette-layout-btn" onClick={onAddAction}>
              <Zap size={13} />
              <span>Manage Actions</span>
            </button>
          </div>
        </div>
      )}

      {/* Getting Started checklist */}
      {!search && (
        <div className="palette-group palette-group--checklist">
          <button
            type="button"
            className="palette-group__header"
            onClick={() => setChecklistOpen((o) => !o)}
            aria-expanded={checklistOpen}
          >
            {checklistOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            <BookOpen size={13} />
            <span>Getting Started</span>
            <span className="palette-checklist-progress">{doneCount}/{checklistItems.length}</span>
          </button>
          {checklistOpen && (
            <div className="palette-group__body">
              {checklistItems.map((item) => (
                <div key={item.key} className={`checklist-item${item.done ? ' checklist-item--done' : ''}`}>
                  {item.done ? (
                    <CheckCircle2 size={14} className="checklist-item__icon checklist-item__icon--done" />
                  ) : (
                    <Circle size={14} className="checklist-item__icon" />
                  )}
                  <span className="checklist-item__label">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
