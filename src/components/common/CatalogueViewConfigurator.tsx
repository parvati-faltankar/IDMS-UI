import React, { useMemo, useState } from 'react';
import { PencilLine, Pin, Plus, Trash2 } from 'lucide-react';
import SideDrawer from './SideDrawer';
import { Input, Select } from './FormControls';
import { cn } from '../../utils/classNames';
import type {
  CatalogueViewCriteria,
  CatalogueViewDefinition,
  EditableCatalogueViewDefinition,
} from '../../utils/catalogueViews';
import { createEmptyCatalogueViewCriteria } from '../../utils/catalogueViews';

interface Option {
  value: string;
  label: string;
}

interface CatalogueViewConfiguratorProps {
  isOpen: boolean;
  title: string;
  views: CatalogueViewDefinition[];
  activeViewId: string;
  pinnedViewId: string | null;
  viewCounts: Record<string, number>;
  currentUserName: string;
  requesterOptions: Option[];
  supplierOptions: Option[];
  branchOptions: Option[];
  statusOptions: Option[];
  priorityOptions: Option[];
  sortOptions: Option[];
  onClose: () => void;
  onSave: (draft: EditableCatalogueViewDefinition, options: { viewId?: string; pinAsDefault: boolean }) => string;
  onDelete: (viewId: string) => void;
  onPin: (viewId: string | null) => void;
}

const draftViewId = '__new-view__';

function createEmptyDraft(): EditableCatalogueViewDefinition {
  return {
    name: '',
    criteria: createEmptyCatalogueViewCriteria(),
    sort: null,
  };
}

function cloneCriteria(criteria: CatalogueViewCriteria): CatalogueViewCriteria {
  return {
    ...criteria,
    statuses: [...criteria.statuses],
    priorities: [...criteria.priorities],
    suppliers: [...criteria.suppliers],
    branches: [...criteria.branches],
  };
}

function toDraft(view: CatalogueViewDefinition): EditableCatalogueViewDefinition {
  return {
    name: view.name,
    criteria: cloneCriteria(view.criteria),
    sort: view.sort ? { ...view.sort } : null,
  };
}

function buildCriteriaSummary(draft: EditableCatalogueViewDefinition, currentUserName: string): string[] {
  const tags: string[] = [];

  if (draft.criteria.ownerScope === 'me') {
    tags.push(`Requester: ${currentUserName}`);
  } else if (draft.criteria.ownerScope === 'specific' && draft.criteria.ownerName) {
    tags.push(`Requester: ${draft.criteria.ownerName}`);
  }

  if (draft.criteria.statuses.length > 0) {
    tags.push(`Status: ${draft.criteria.statuses.join(', ')}`);
  }

  if (draft.criteria.priorities.length > 0) {
    tags.push(`Priority: ${draft.criteria.priorities.join(', ')}`);
  }

  if (draft.criteria.suppliers[0]) {
    tags.push(`Supplier: ${draft.criteria.suppliers[0]}`);
  }

  if (draft.criteria.branches[0]) {
    tags.push(`Branch: ${draft.criteria.branches[0]}`);
  }

  if (draft.criteria.datePreset !== 'all') {
    tags.push(`Date: ${draft.criteria.datePreset.replace('-', ' ')}`);
  }

  if (draft.sort) {
    tags.push(`Sort: ${draft.sort.key} (${draft.sort.direction})`);
  }

  return tags.length > 0 ? tags : ['No additional rules'];
}

const CatalogueViewConfigurator: React.FC<CatalogueViewConfiguratorProps> = ({
  isOpen,
  title,
  views,
  activeViewId,
  pinnedViewId,
  viewCounts,
  currentUserName,
  requesterOptions,
  supplierOptions,
  branchOptions,
  statusOptions,
  priorityOptions,
  sortOptions,
  onClose,
  onSave,
  onDelete,
  onPin,
}) => {
  const initialView = views.find((view) => view.id === activeViewId) ?? views[0] ?? null;
  const [selectedViewId, setSelectedViewId] = useState<string>(initialView?.id ?? draftViewId);
  const [draft, setDraft] = useState<EditableCatalogueViewDefinition>(() =>
    initialView ? toDraft(initialView) : createEmptyDraft()
  );
  const [pinAsDefault, setPinAsDefault] = useState(() => Boolean(initialView && pinnedViewId === initialView.id));

  const selectedView = useMemo(
    () => views.find((view) => view.id === selectedViewId) ?? null,
    [selectedViewId, views]
  );
  const isCreatingNewView = selectedViewId === draftViewId;
  const isEditable = isCreatingNewView || selectedView?.kind === 'custom';

  const handleSelectSavedView = (viewId: string) => {
    const nextView = views.find((view) => view.id === viewId);
    if (!nextView) {
      return;
    }

    setSelectedViewId(viewId);
    setDraft(toDraft(nextView));
    setPinAsDefault(pinnedViewId === viewId);
  };

  const handleStartNewView = () => {
    const baseDraft = selectedView ? toDraft(selectedView) : createEmptyDraft();
    setSelectedViewId(draftViewId);
    setDraft({
      ...baseDraft,
      name: selectedView ? `${selectedView.name} Copy` : '',
    });
    setPinAsDefault(false);
  };

  const handleSave = () => {
    const trimmedName = draft.name.trim();
    if (!trimmedName) {
      return;
    }

    const savedViewId = onSave(
      {
        ...draft,
        name: trimmedName,
      },
      {
        viewId: !isCreatingNewView && selectedView?.kind === 'custom' ? selectedView.id : undefined,
        pinAsDefault,
      }
    );

    if (savedViewId) {
      handleSelectSavedView(savedViewId);
    }
  };

  const handleDelete = () => {
    if (!selectedView || selectedView.kind !== 'custom') {
      return;
    }

    onDelete(selectedView.id);
  };

  const handleMultiToggle = (
    field: 'statuses' | 'priorities',
    value: string
  ) => {
    setDraft((current) => {
      const currentValues = current.criteria[field];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      return {
        ...current,
        criteria: {
          ...current.criteria,
          [field]: nextValues,
        },
      };
    });
  };

  const criteriaSummary = buildCriteriaSummary(draft, currentUserName);

  return (
    <SideDrawer
      isOpen={isOpen}
      title={title}
      subtitle="Create, pin, and manage reusable catalogue views without disturbing the current catalogue experience."
      onClose={onClose}
      panelClassName="side-drawer__panel--wide"
      contentClassName="catalogue-view-configurator"
      headerActions={
        <button type="button" className="btn btn--outline btn--sm" onClick={handleStartNewView}>
          <Plus size={14} />
          New view
        </button>
      }
      footer={
        <div className="catalogue-view-configurator__footer-actions">
          <button type="button" className="btn btn--outline" onClick={onClose}>
            Close
          </button>
          {!isCreatingNewView && selectedView?.kind === 'custom' && (
            <button type="button" className="btn btn--outline" onClick={handleDelete}>
              <Trash2 size={14} />
              Delete
            </button>
          )}
          {isEditable && (
            <button type="button" className="btn btn--primary" onClick={handleSave} disabled={!draft.name.trim()}>
              Save view
            </button>
          )}
        </div>
      }
    >
      <div className="catalogue-view-configurator__layout">
        <section className="catalogue-view-configurator__library">
          <div className="catalogue-view-configurator__section-head">
            <strong>Available views</strong>
            <span>{views.length} views</span>
          </div>

          <div className="catalogue-view-configurator__view-list">
            {views.map((view) => {
              const isSelected = view.id === selectedViewId;
              const isPinned = pinnedViewId === view.id;

              return (
                <div
                  key={view.id}
                  className={cn('catalogue-view-configurator__view-item', isSelected && 'catalogue-view-configurator__view-item--active')}
                >
                  <button
                    type="button"
                    className="catalogue-view-configurator__view-select"
                    onClick={() => handleSelectSavedView(view.id)}
                  >
                    <span className="catalogue-view-configurator__view-copy">
                      <span className="catalogue-view-configurator__view-title-row">
                        <span className="catalogue-view-configurator__view-title">{view.name}</span>
                        {view.id === activeViewId && <span className="catalogue-view-configurator__view-badge">Active</span>}
                      </span>
                      <span className="catalogue-view-configurator__view-meta">
                        <span>{viewCounts[view.id] ?? 0}</span>
                        <span>{view.kind === 'system' ? 'System' : 'Custom'}</span>
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    className={cn('catalogue-view-configurator__pin-button', isPinned && 'catalogue-view-configurator__pin-button--active')}
                    aria-label={isPinned ? `Unpin ${view.name}` : `Pin ${view.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onPin(isPinned ? null : view.id);
                      setPinAsDefault(!isPinned && selectedViewId === view.id);
                    }}
                  >
                    <Pin size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="catalogue-view-configurator__editor">
          <div className="catalogue-view-configurator__section-head">
            <strong>{isCreatingNewView ? 'Create custom view' : selectedView?.kind === 'system' ? 'System view details' : 'Edit custom view'}</strong>
            {selectedView?.kind === 'system' && !isCreatingNewView && (
              <button type="button" className="btn btn--outline btn--sm" onClick={handleStartNewView}>
                <PencilLine size={14} />
                Create custom copy
              </button>
            )}
          </div>

          <div className="catalogue-view-configurator__summary">
            {criteriaSummary.map((item) => (
              <span key={item} className="catalogue-view-configurator__summary-pill">
                {item}
              </span>
            ))}
          </div>

          {isEditable ? (
            <div className="catalogue-view-configurator__form">
              <label className="drawer-form__field">
                <span className="field-label">View name</span>
                <Input
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Enter view name"
                />
              </label>

              <div className="catalogue-view-configurator__form-grid">
                <label className="drawer-form__field">
                  <span className="field-label">Requester scope</span>
                  <Select
                    value={draft.criteria.ownerScope}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        criteria: {
                          ...current.criteria,
                          ownerScope: event.target.value as CatalogueViewCriteria['ownerScope'],
                          ownerName:
                            event.target.value === 'specific'
                              ? current.criteria.ownerName
                              : '',
                        },
                      }))
                    }
                    options={[
                      { value: 'all', label: 'All requesters' },
                      { value: 'me', label: 'My requisitions' },
                      { value: 'specific', label: 'Specific requester' },
                    ]}
                  />
                </label>

                <label className="drawer-form__field">
                  <span className="field-label">Date window</span>
                  <Select
                    value={draft.criteria.datePreset}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        criteria: {
                          ...current.criteria,
                          datePreset: event.target.value as CatalogueViewCriteria['datePreset'],
                        },
                      }))
                    }
                    options={[
                      { value: 'all', label: 'All dates' },
                      { value: 'today', label: 'Today' },
                      { value: 'this-week', label: 'This week' },
                      { value: 'this-month', label: 'This month' },
                    ]}
                  />
                </label>

                {draft.criteria.ownerScope === 'specific' && (
                  <label className="drawer-form__field">
                    <span className="field-label">Requester</span>
                    <Select
                      value={draft.criteria.ownerName}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          criteria: {
                            ...current.criteria,
                            ownerName: event.target.value,
                          },
                        }))
                      }
                      options={[
                        { value: '', label: 'Select requester' },
                        ...requesterOptions,
                      ]}
                    />
                  </label>
                )}

                <label className="drawer-form__field">
                  <span className="field-label">Supplier</span>
                  <Select
                    value={draft.criteria.suppliers[0] ?? ''}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        criteria: {
                          ...current.criteria,
                          suppliers: event.target.value ? [event.target.value] : [],
                        },
                      }))
                    }
                    options={[
                      { value: '', label: 'All suppliers' },
                      ...supplierOptions,
                    ]}
                  />
                </label>

                <label className="drawer-form__field">
                  <span className="field-label">Branch</span>
                  <Select
                    value={draft.criteria.branches[0] ?? ''}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        criteria: {
                          ...current.criteria,
                          branches: event.target.value ? [event.target.value] : [],
                        },
                      }))
                    }
                    options={[
                      { value: '', label: 'All branches' },
                      ...branchOptions,
                    ]}
                  />
                </label>
              </div>

              <div className="catalogue-view-configurator__checkbox-section">
                <span className="field-label">Statuses</span>
                <div className="catalogue-view-configurator__checkbox-grid">
                  {statusOptions.map((option) => (
                    <label key={option.value} className="catalogue-view-configurator__checkbox-pill">
                      <input
                        type="checkbox"
                        checked={draft.criteria.statuses.includes(option.value)}
                        onChange={() => handleMultiToggle('statuses', option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="catalogue-view-configurator__checkbox-section">
                <span className="field-label">Priorities</span>
                <div className="catalogue-view-configurator__checkbox-grid">
                  {priorityOptions.map((option) => (
                    <label key={option.value} className="catalogue-view-configurator__checkbox-pill">
                      <input
                        type="checkbox"
                        checked={draft.criteria.priorities.includes(option.value)}
                        onChange={() => handleMultiToggle('priorities', option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="catalogue-view-configurator__form-grid">
                <label className="drawer-form__field">
                  <span className="field-label">Sort by</span>
                  <Select
                    value={draft.sort?.key ?? ''}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        sort: event.target.value
                          ? {
                              key: event.target.value,
                              direction: current.sort?.direction ?? 'desc',
                            }
                          : null,
                      }))
                    }
                    options={[
                      { value: '', label: 'No default sort' },
                      ...sortOptions,
                    ]}
                  />
                </label>

                <label className="drawer-form__field">
                  <span className="field-label">Direction</span>
                  <Select
                    value={draft.sort?.direction ?? 'desc'}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        sort: current.sort
                          ? {
                              ...current.sort,
                              direction: event.target.value as 'asc' | 'desc',
                            }
                          : null,
                      }))
                    }
                    disabled={!draft.sort}
                    options={[
                      { value: 'desc', label: 'Descending' },
                      { value: 'asc', label: 'Ascending' },
                    ]}
                  />
                </label>
              </div>

              <label className="catalogue-view-configurator__pin-toggle">
                <input
                  type="checkbox"
                  checked={pinAsDefault}
                  onChange={(event) => setPinAsDefault(event.target.checked)}
                />
                <span>Pin this view as the default Purchase Requisition catalogue view</span>
              </label>
            </div>
          ) : (
            <div className="catalogue-view-configurator__system-copy">
              <p>
                System views can be pinned as default, and you can create a custom copy when you need a modified version.
              </p>
              <label className="catalogue-view-configurator__pin-toggle">
                <input
                  type="checkbox"
                  checked={pinnedViewId === selectedView?.id}
                  onChange={(event) => onPin(event.target.checked ? selectedView?.id ?? null : null)}
                />
                <span>Pin this system view as the default</span>
              </label>
            </div>
          )}
        </section>
      </div>
    </SideDrawer>
  );
};

export default CatalogueViewConfigurator;
