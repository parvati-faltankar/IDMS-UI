import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Eye, GripVertical, Plus, RotateCcw, Save } from 'lucide-react';
import AppShell from '../../components/common/AppShell';
import CompactFormDialog from '../../components/common/CompactFormDialog';
import FormLayoutPreviewOverlay from '../../components/common/FormLayoutPreviewOverlay';
import GridColumnConfigurator from '../../components/common/GridColumnConfigurator';
import { formLayoutRegistry, type FormLayoutRegistryItem } from '../../utils/formLayoutRegistry';
import { cn } from '../../utils/classNames';
import {
  loadDraftFormLayoutConfig,
  mergeSections,
  moveArrayItem,
  moveField,
  moveSection,
  publishFormLayoutConfig,
  renameSection,
  renameTab,
  resetFormLayoutConfig,
  saveDraftFormLayoutConfig,
  type FormLayoutConfig,
  updateSectionFieldsPerRow,
} from '../../utils/formLayoutConfig';

type LayoutDragPayload = {
  type: 'field' | 'section' | 'tab';
  id: string;
};

type LayoutDialogState =
  | { mode: 'create-tab'; initialValue: string }
  | { mode: 'create-section'; tabId: string; initialValue: string }
  | { mode: 'rename-tab'; tabId: string; initialValue: string }
  | { mode: 'rename-section'; sectionId: string; initialValue: string }
  | null;

interface FormLayoutEditorProps {
  formId: string | null;
  onBack: () => void;
}

function getFormById(formId: string | null): FormLayoutRegistryItem | undefined {
  return formLayoutRegistry.find((form) => form.id === formId);
}

function getDialogCopy(dialog: LayoutDialogState) {
  if (!dialog) {
    return null;
  }

  if (dialog.mode === 'create-tab') {
    return {
      title: 'Create tab',
      description: 'Add a new tab and move sections or fields into it.',
      label: 'Tab name',
      placeholder: 'Enter tab name',
    };
  }

  if (dialog.mode === 'create-section') {
    return {
      title: 'Create section',
      description: 'Add a new section in the current tab.',
      label: 'Section name',
      placeholder: 'Enter section name',
    };
  }

  if (dialog.mode === 'rename-tab') {
    return {
      title: 'Rename tab',
      description: 'Update the display name for this tab.',
      label: 'Tab name',
      placeholder: 'Enter tab name',
    };
  }

  return {
    title: 'Rename section',
    description: 'Update the display name for this section.',
    label: 'Section name',
    placeholder: 'Enter section name',
  };
}

function getDialogKey(dialog: Exclude<LayoutDialogState, null>) {
  if (dialog.mode === 'create-tab') {
    return `create-tab:${dialog.initialValue}`;
  }

  if (dialog.mode === 'create-section') {
    return `create-section:${dialog.tabId}:${dialog.initialValue}`;
  }

  if (dialog.mode === 'rename-tab') {
    return `rename-tab:${dialog.tabId}:${dialog.initialValue}`;
  }

  return `rename-section:${dialog.sectionId}:${dialog.initialValue}`;
}

const FormLayoutEditor: React.FC<FormLayoutEditorProps> = ({
  formId,
  onBack,
}) => {
  const form = getFormById(formId);
  const defaultConfig = form?.defaultConfig;
  const [layoutConfig, setLayoutConfig] = useState<FormLayoutConfig | null>(() =>
    defaultConfig ? loadDraftFormLayoutConfig(defaultConfig) : null
  );
  const [activeTab, setActiveTab] = useState(() => defaultConfig?.tabs[0]?.id ?? '');
  const [dragPayload, setDragPayload] = useState<LayoutDragPayload | null>(null);
  const [layoutDialog, setLayoutDialog] = useState<LayoutDialogState>(null);
  const [message, setMessage] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (!layoutConfig) {
      return;
    }

    saveDraftFormLayoutConfig(layoutConfig);
  }, [layoutConfig]);

  const effectiveActiveTab = useMemo(() => {
    if (!layoutConfig) {
      return '';
    }

    return layoutConfig.tabs.some((tab) => tab.id === activeTab)
      ? activeTab
      : layoutConfig.tabs[0]?.id ?? '';
  }, [activeTab, layoutConfig]);

  if (!form || !defaultConfig || !layoutConfig) {
    return (
      <AppShell activeLeaf={null}>
        <main className="form-layout-settings">
          <section className="form-layout-settings__hero">
            <button type="button" className="page-back-button" onClick={onBack} aria-label="Back to Form Layout">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="form-layout-settings__title">Form layout unavailable</h1>
              <p className="form-layout-settings__description">This form is not registered for layout configuration yet.</p>
            </div>
          </section>
        </main>
      </AppShell>
    );
  }

  const readDropPayload = (event: React.DragEvent<HTMLElement>): LayoutDragPayload | null => {
    const rawPayload = event.dataTransfer.getData('application/json');
    if (!rawPayload) {
      return dragPayload;
    }

    try {
      return JSON.parse(rawPayload) as LayoutDragPayload;
    } catch {
      return dragPayload;
    }
  };

  const startLayoutDrag = (event: React.DragEvent<HTMLElement>, payload: LayoutDragPayload) => {
    setDragPayload(payload);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/json', JSON.stringify(payload));
    event.dataTransfer.setData('text/plain', `${payload.type}:${payload.id}`);
  };

  const handleDropOnField = (event: React.DragEvent<HTMLElement>, targetSectionId: string, targetIndex: number) => {
    event.preventDefault();
    event.stopPropagation();

    const payload = readDropPayload(event);
    if (payload?.type === 'field') {
      setLayoutConfig((currentConfig) =>
        currentConfig ? moveField(currentConfig, payload.id, targetSectionId, targetIndex) : currentConfig
      );
    }
    setDragPayload(null);
  };

  const handleDropOnSection = (
    event: React.DragEvent<HTMLElement>,
    targetTabId: string,
    targetSectionId: string,
    targetIndex: number
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const payload = readDropPayload(event);
    if (!payload) {
      return;
    }

    if (payload.type === 'section') {
      setLayoutConfig((currentConfig) =>
        currentConfig ? moveSection(currentConfig, payload.id, targetTabId, targetIndex) : currentConfig
      );
      setDragPayload(null);
      return;
    }

    if (payload.type === 'field') {
      setLayoutConfig((currentConfig) => {
        if (!currentConfig) {
          return currentConfig;
        }
        const targetSection = currentConfig.sections[targetSectionId];
        return moveField(currentConfig, payload.id, targetSectionId, targetSection?.fieldIds.length ?? 0);
      });
      setDragPayload(null);
    }
  };

  const handleDropOnTab = (event: React.DragEvent<HTMLElement>, targetTabId: string, targetIndex: number) => {
    event.preventDefault();
    event.stopPropagation();

    const payload = readDropPayload(event);
    if (!payload) {
      return;
    }

    if (payload.type === 'tab') {
      setLayoutConfig((currentConfig) => {
        if (!currentConfig) {
          return currentConfig;
        }
        const sourceIndex = currentConfig.tabs.findIndex((tab) => tab.id === payload.id);
        return sourceIndex >= 0
          ? { ...currentConfig, tabs: moveArrayItem(currentConfig.tabs, sourceIndex, targetIndex) }
          : currentConfig;
      });
      setDragPayload(null);
      return;
    }

    if (payload.type === 'section') {
      setLayoutConfig((currentConfig) => {
        const targetTab = currentConfig?.tabs.find((tab) => tab.id === targetTabId);
        return currentConfig ? moveSection(currentConfig, payload.id, targetTabId, targetTab?.sectionIds.length ?? 0) : currentConfig;
      });
      setActiveTab(targetTabId);
      setDragPayload(null);
    }
  };

  const handleLayoutDialogSave = (value: string) => {
    if (!layoutDialog) {
      return;
    }

    if (layoutDialog.mode === 'create-tab') {
      const tabId = `custom-tab-${Date.now()}`;
      const sectionId = `custom-section-${Date.now()}`;
      setLayoutConfig((currentConfig) =>
        currentConfig
          ? {
              ...currentConfig,
              tabs: [...currentConfig.tabs, { id: tabId, label: value, sectionIds: [sectionId] }],
              sections: {
                ...currentConfig.sections,
                [sectionId]: { id: sectionId, label: 'New section', fieldsPerRow: 3, fieldIds: [] },
              },
            }
          : currentConfig
      );
      setActiveTab(tabId);
    }

    if (layoutDialog.mode === 'create-section') {
      const sectionId = `custom-section-${Date.now()}`;
      setLayoutConfig((currentConfig) =>
        currentConfig
          ? {
              ...currentConfig,
              tabs: currentConfig.tabs.map((tab) =>
                tab.id === layoutDialog.tabId ? { ...tab, sectionIds: [...tab.sectionIds, sectionId] } : tab
              ),
              sections: {
                ...currentConfig.sections,
                [sectionId]: { id: sectionId, label: value, fieldsPerRow: 3, fieldIds: [] },
              },
            }
          : currentConfig
      );
    }

    if (layoutDialog.mode === 'rename-tab') {
      setLayoutConfig((currentConfig) => (currentConfig ? renameTab(currentConfig, layoutDialog.tabId, value) : currentConfig));
    }

    if (layoutDialog.mode === 'rename-section') {
      setLayoutConfig((currentConfig) =>
        currentConfig ? renameSection(currentConfig, layoutDialog.sectionId, value) : currentConfig
      );
    }

    setLayoutDialog(null);
  };

  const handlePublish = () => {
    publishFormLayoutConfig(layoutConfig);
    setMessage(`${form.formName} layout published.`);
    return true;
  };

  const currentTab = layoutConfig.tabs.find((tab) => tab.id === effectiveActiveTab) ?? layoutConfig.tabs[0];
  const dialogCopy = getDialogCopy(layoutDialog);

  return (
    <AppShell activeLeaf={null} contentClassName="form-layout-editor-shell">
      <main className="form-layout-editor">
        <section className="create-pr-header">
          <div className="create-pr-header__top">
            <div className="create-pr-header__title-group">
              <button type="button" className="page-back-button create-pr-header__back" onClick={onBack} aria-label="Back to Form Layout">
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="brand-page-title create-pr-header__title">Configure {form.formName}</h1>
                <p className="form-layout-editor__subtitle">{form.moduleName} form layout</p>
              </div>
            </div>
          </div>
          <div className="create-pr-header__actions">
            <button type="button" className="btn btn--outline btn--sm" onClick={() => setLayoutDialog({ mode: 'create-tab', initialValue: 'New tab' })}>
              <Plus size={14} /> Tab
            </button>
            <button type="button" className="btn btn--outline btn--sm" onClick={() => setLayoutDialog({ mode: 'create-section', tabId: effectiveActiveTab, initialValue: 'New section' })}>
              <Plus size={14} /> Section
            </button>
            <button type="button" className="btn btn--outline btn--sm" onClick={() => saveDraftFormLayoutConfig(layoutConfig)}>
              <Save size={14} /> Save draft
            </button>
            <button type="button" className="btn btn--outline btn--sm" onClick={() => setIsPreviewOpen(true)}>
              <Eye size={14} /> Preview
            </button>
            <button type="button" className="btn btn--primary btn--sm" onClick={handlePublish}>
              <CheckCircle2 size={14} /> Publish
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setLayoutConfig(resetFormLayoutConfig(defaultConfig));
                setActiveTab(defaultConfig.tabs[0]?.id ?? '');
                setMessage('Draft layout reset to default.');
              }}
            >
              <RotateCcw size={14} /> Reset draft
            </button>
          </div>
        </section>

        <div className="create-pr-page mx-auto w-full max-w-[1800px] px-6 py-6 space-y-6">
          <div className="form-layout-placement">
            <label className="form-layout-row-control">
              <span>Tab placement</span>
              <select
                className="form-layout-select"
                value={layoutConfig.tabPlacement ?? 'header'}
                onChange={(event) =>
                  setLayoutConfig((currentConfig) =>
                    currentConfig
                      ? {
                          ...currentConfig,
                          tabPlacement: event.target.value === 'bottom-fixed' ? 'bottom-fixed' : 'header',
                        }
                      : currentConfig
                  )
                }
              >
                <option value="header">Header</option>
                <option value="bottom-fixed">Footer (Bottom fixed)</option>
              </select>
            </label>
          </div>
          <div className="create-pr-tabs">
            <div className="create-pr-tabs__list" role="tablist" aria-label={`${form.formName} sections`}>
              {layoutConfig.tabs.map((tab, tabIndex) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={effectiveActiveTab === tab.id}
                  draggable
                  onDragStart={(event) => startLayoutDrag(event, { type: 'tab', id: tab.id })}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDropOnTab(event, tab.id, tabIndex)}
                  onDragEnd={() => setDragPayload(null)}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn('create-pr-tab', effectiveActiveTab === tab.id ? 'create-pr-tab--active' : 'create-pr-tab--inactive')}
                >
                  <span className="create-pr-tab__label">{tab.label}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    className="create-pr-tab__rename"
                    onClick={(event) => {
                      event.stopPropagation();
                      setLayoutDialog({ mode: 'rename-tab', tabId: tab.id, initialValue: tab.label });
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        event.stopPropagation();
                        setLayoutDialog({ mode: 'rename-tab', tabId: tab.id, initialValue: tab.label });
                      }
                    }}
                  >
                    Rename
                  </span>
                </button>
              ))}
            </div>
          </div>

          {message && <div className="brand-message px-4 py-3 text-sm">{message}</div>}

          <div className="form-layout-sections">
            {currentTab?.sectionIds.map((sectionId, sectionIndex) => {
              const section = layoutConfig.sections[sectionId];
              if (!section) {
                return null;
              }

              return (
                <React.Fragment key={sectionId}>
                  <div
                    className="form-layout-dropzone form-layout-dropzone--section"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleDropOnSection(event, currentTab.id, sectionId, sectionIndex)}
                  >
                    Drop section here
                  </div>
                  <section
                    className={cn('form-layout-section form-layout-section--editable', dragPayload?.type === 'section' && dragPayload.id !== sectionId && 'form-layout-section--drop-target')}
                    style={{ '--form-layout-columns': section.fieldsPerRow ?? 3 } as React.CSSProperties}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleDropOnSection(event, currentTab.id, sectionId, sectionIndex)}
                  >
                    <div className="form-layout-section__header">
                      <div className="form-layout-section__title-wrap">
                        <button
                          type="button"
                          draggable
                          className="form-layout-section__handle"
                          aria-label={`Drag ${section.label}`}
                          onDragStart={(event) => startLayoutDrag(event, { type: 'section', id: sectionId })}
                          onDragEnd={() => setDragPayload(null)}
                        >
                          <GripVertical size={15} />
                        </button>
                        <h3 className="form-layout-section__title">{section.label}</h3>
                        <span className="form-layout-section__count">{section.fieldIds.length} fields</span>
                      </div>
                      <div className="form-layout-section__actions">
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setLayoutDialog({ mode: 'rename-section', sectionId, initialValue: section.label })}>
                          Rename
                        </button>
                        <label className="form-layout-row-control">
                          <span>Fields/row</span>
                          <select
                            className="form-layout-select"
                            value={section.fieldsPerRow ?? 3}
                            onChange={(event) =>
                              setLayoutConfig((currentConfig) =>
                                currentConfig ? updateSectionFieldsPerRow(currentConfig, sectionId, Number(event.target.value)) : currentConfig
                              )
                            }
                          >
                            {[1, 2, 3, 4].map((value) => (
                              <option key={value} value={value}>{value}</option>
                            ))}
                          </select>
                        </label>
                        <select
                          className="form-layout-select"
                          value=""
                          onChange={(event) => {
                            if (event.target.value) {
                              setLayoutConfig((currentConfig) =>
                                currentConfig ? mergeSections(currentConfig, sectionId, event.target.value) : currentConfig
                              );
                            }
                          }}
                        >
                          <option value="">Merge into...</option>
                          {Object.values(layoutConfig.sections)
                            .filter((availableSection) => availableSection.id !== sectionId)
                            .map((availableSection) => (
                              <option key={availableSection.id} value={availableSection.id}>
                                {availableSection.label}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                    <div className="form-layout-section__fields">
                      {section.fieldIds.map((fieldId, fieldIndex) => (
                        <div
                          key={fieldId}
                          className={cn('form-layout-field form-layout-field--editable', dragPayload?.type === 'field' && dragPayload.id !== fieldId && 'form-layout-field--drop-target')}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => handleDropOnField(event, sectionId, fieldIndex)}
                        >
                          <button
                            type="button"
                            draggable
                            className="form-layout-field__handle"
                            aria-label={`Drag ${form.fieldLabels?.[fieldId] ?? fieldId}`}
                            onDragStart={(event) => startLayoutDrag(event, { type: 'field', id: fieldId })}
                            onDragEnd={() => setDragPayload(null)}
                          >
                            <GripVertical size={14} />
                            <span>{form.fieldLabels?.[fieldId] ?? fieldId}</span>
                          </button>
                          <div className="form-layout-editor__field-card">{form.fieldLabels?.[fieldId] ?? fieldId}</div>
                        </div>
                      ))}
                      <div
                        className="form-layout-dropzone form-layout-dropzone--end"
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => handleDropOnField(event, sectionId, section.fieldIds.length)}
                      >
                        Drop field here
                      </div>
                    </div>
                  </section>
                </React.Fragment>
              );
            })}
          </div>
          <GridColumnConfigurator
            layoutConfig={layoutConfig}
            onChange={(updater) => setLayoutConfig((currentConfig) => (currentConfig ? updater(currentConfig) : currentConfig))}
          />
        </div>
      </main>
      {layoutDialog && dialogCopy && (
        <CompactFormDialog
          key={getDialogKey(layoutDialog)}
          isOpen={Boolean(layoutDialog)}
          title={dialogCopy.title}
          description={dialogCopy.description}
          label={dialogCopy.label}
          initialValue={layoutDialog?.initialValue ?? ''}
          placeholder={dialogCopy.placeholder}
          saveLabel="Save"
          discardLabel="Discard"
          onSave={handleLayoutDialogSave}
          onClose={() => setLayoutDialog(null)}
        />
      )}
      <FormLayoutPreviewOverlay
        isOpen={isPreviewOpen}
        config={layoutConfig}
        formName={form.formName}
        fieldLabels={form.fieldLabels}
        onClose={() => setIsPreviewOpen(false)}
        onPublish={handlePublish}
      />
    </AppShell>
  );
};

export default FormLayoutEditor;
