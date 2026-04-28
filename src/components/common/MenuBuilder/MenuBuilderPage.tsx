/**
 * Menu Builder Page
 * Main page for managing navigation menu configuration
 */

import React, { useState } from 'react';
import { ArrowLeft, MoveRight, Plus, RotateCcw, Save, Send, Sparkles } from 'lucide-react';
import AppShell from '../AppShell';
import { useMenuBuilder } from '../../../theme/MenuBuilderContext';
import MenuTree from './MenuTree';
import MenuPreview from './MenuPreview';
import MenuFormDialog from './MenuFormDialog';
import type { MenuFormData } from './types';
import MenuConfirmationDialog from './MenuConfirmationDialog';
import MenuStatusBadge from './MenuStatusBadge';
import MenuValidationSummary from './MenuValidationSummary';
import { cn } from '../../../utils/classNames';
import type { DragDropPayload, MenuItemData, MenuLevelData, MenuSectionData } from '../../../utils/menuBuilderTypes';
import { findLevel2, findMenuItem, findParentSection, validateMenuConfig } from '../../../utils/menuBuilderUtils';
import { getDefaultRouteForKey } from '../../../utils/menuBuilderNavigation';

interface MenuBuilderPageProps {
  onBack?: () => void;
}

type FormDialogState = {
  isOpen: boolean;
  type: 'section' | 'level2' | 'item';
  title: string;
  mode: 'create' | 'edit';
  editingId?: string;
  initialData?: Partial<MenuFormData> | null;
} | null;

const MenuBuilderPage: React.FC<MenuBuilderPageProps> = ({ onBack }) => {
  const {
    state,
    addSection,
    updateSection,
    removeSection,
    reorderSections,
    addLevel2,
    updateLevel2,
    removeLevel2,
    reorderLevel2Groups,
    moveLevel2Group,
    addMenuItem,
    updateMenuItem,
    removeMenuItem,
    moveMenuItem,
    selectSection,
    selectLevel2,
    selectItem,
    validateConfig,
    saveDraft,
    resetToDraft,
    publishConfig,
  } = useMenuBuilder();

  const [formDialog, setFormDialog] = useState<FormDialogState>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const draftConfig = state.draftConfig;

  const selectedSection = draftConfig?.sections.find((section) => section.id === state.selectedSectionId) ?? null;
  const selectedLevel2 = draftConfig && state.selectedLevel2Id ? findLevel2(draftConfig, state.selectedLevel2Id) : null;
  const selectedItem = draftConfig && state.selectedItemId ? findMenuItem(draftConfig, state.selectedItemId) : null;

  // Show success message
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Form dialog handlers
  const handleAddSection = () => {
    setFormDialog({
      isOpen: true,
      type: 'section',
      title: 'Add Section',
      mode: 'create',
    });
  };

  const handleAddLevel2 = (sectionId: string) => {
    setFormDialog({
      isOpen: true,
      type: 'level2',
      title: 'Add Group',
      mode: 'create',
      editingId: sectionId,
      initialData: { parentSectionId: sectionId, isVisible: true },
    });
  };

  const handleAddItem = (level2Id: string) => {
    setFormDialog({
      isOpen: true,
      type: 'item',
      title: 'Add Menu Item',
      mode: 'create',
      editingId: level2Id,
      initialData: { parentLevel2Id: level2Id, isVisible: true },
    });
  };

  const handleEditSection = (sectionId: string) => {
    const section = draftConfig?.sections.find((s) => s.id === sectionId);
    if (!section) return;
    setFormDialog({
      isOpen: true,
      type: 'section',
      title: 'Edit Section',
      mode: 'edit',
      editingId: sectionId,
      initialData: section,
    });
  };

  const handleEditLevel2 = (level2Id: string) => {
    if (!draftConfig) return;
    const level2 = findLevel2(draftConfig, level2Id);
    if (!level2) return;
    setFormDialog({
      isOpen: true,
      type: 'level2',
      title: 'Edit Group',
      mode: 'edit',
      editingId: level2Id,
      initialData: {
        ...level2,
        parentSectionId: level2.parentLevelId ?? undefined,
      },
    });
  };

  const handleEditItem = (itemId: string) => {
    if (!draftConfig) return;
    const item = findMenuItem(draftConfig, itemId);
    if (!item) return;
    setFormDialog({
      isOpen: true,
      type: 'item',
      title: 'Edit Menu Item',
      mode: 'edit',
      editingId: itemId,
      initialData: {
        ...item,
        route: item.route ?? getDefaultRouteForKey(item.key) ?? '',
        parentLevel2Id: item.parentLevelId,
      },
    });
  };

  const handleFormSubmit = (data: MenuFormData) => {
    if (!formDialog) return;

    switch (formDialog.type) {
      case 'section':
        if (formDialog.mode === 'edit' && formDialog.editingId) {
          updateSection(formDialog.editingId, data as Partial<MenuSectionData>);
        } else {
          addSection(data as Pick<MenuSectionData, 'label' | 'description' | 'iconName' | 'isVisible'>);
        }
        break;

      case 'level2':
        if (formDialog.mode === 'edit' && formDialog.editingId) {
          const nextParentSectionId = data.parentSectionId as string;
          if (nextParentSectionId) {
            const currentParentSection = draftConfig ? findParentSection(draftConfig, formDialog.editingId) : null;
            if (currentParentSection && currentParentSection.id !== nextParentSectionId) {
              moveLevel2Group(formDialog.editingId, nextParentSectionId, Number.MAX_SAFE_INTEGER);
            }
          }
          updateLevel2(formDialog.editingId, {
            ...data,
            parentLevelId: data.parentSectionId,
          } as Partial<MenuLevelData>);
        } else if (formDialog.editingId) {
          addLevel2(
            data.parentSectionId || formDialog.editingId,
            data as Pick<MenuLevelData, 'label' | 'description' | 'hideLabel' | 'isVisible'>
          );
        }
        break;

      case 'item':
        if (formDialog.mode === 'edit' && formDialog.editingId) {
          const nextParentLevel2Id = data.parentLevel2Id as string;
          const currentItem = draftConfig ? findMenuItem(draftConfig, formDialog.editingId) : null;
          if (currentItem && nextParentLevel2Id && currentItem.parentLevelId !== nextParentLevel2Id) {
            moveMenuItem(formDialog.editingId, currentItem.parentLevelId, nextParentLevel2Id, Number.MAX_SAFE_INTEGER);
          }

          updateMenuItem(formDialog.editingId, {
            ...data,
            parentLevelId: nextParentLevel2Id,
          } as Partial<MenuItemData>);
        } else if (formDialog.editingId) {
          addMenuItem(
            data.parentLevel2Id || formDialog.editingId,
            data as Pick<MenuItemData, 'label' | 'key' | 'description' | 'iconName' | 'route' | 'externalUrl' | 'openInNewTab' | 'isVisible'>
          );
        }
        break;
    }

    setFormDialog(null);
    showSuccess(`${formDialog.type} ${formDialog.mode === 'edit' ? 'updated' : 'created'} successfully`);
  };

  const handleRemoveSection = (sectionId: string) => {
    const section = draftConfig?.sections.find((currentSection) => currentSection.id === sectionId);
    if (!section) {
      return;
    }

    if (section.level2Groups.length > 0) {
      showSuccess('Move or remove all groups before deleting a section');
      return;
    }

    removeSection(sectionId);
  };

  const handleRemoveLevel2 = (level2Id: string) => {
    const level2 = draftConfig ? findLevel2(draftConfig, level2Id) : null;
    if (!level2) {
      return;
    }

    if (level2.items.length > 0) {
      showSuccess('Move or remove all items before deleting a group');
      return;
    }

    removeLevel2(level2Id);
  };

  const handleReset = () => {
    resetToDraft();
    setResetConfirmOpen(false);
    showSuccess('Menu has been reset to the published version');
  };

  const handlePublish = () => {
    const validation = validateConfig() ?? (draftConfig ? validateMenuConfig(draftConfig) : null);
    if (!validation) {
      return;
    }
    if (!validation.isValid) {
      showSuccess('Cannot publish: Configuration has errors');
      return;
    }
    publishConfig();
    setPublishConfirmOpen(false);
    showSuccess('Menu configuration published successfully!');
  };

  const handleReset2 = () => {
    setResetConfirmOpen(true);
  };

  const handleSaveDraft = () => {
    const validation = validateConfig();
    saveDraft();
    showSuccess(validation?.isValid ? 'Draft saved locally' : 'Draft saved locally with validation issues');
  };

  const handlePublish2 = () => {
    const validation = validateConfig() ?? (draftConfig ? validateMenuConfig(draftConfig) : null);
    if (!validation) {
      return;
    }
    if (!validation.isValid) {
      showSuccess('Fix validation errors before publishing');
      return;
    }
    setPublishConfirmOpen(true);
  };

  const handleMoveNode = (payload: DragDropPayload, target: { type: 'section' | 'level2' | 'item'; targetId: string; position: number }) => {
    if (!draftConfig || payload.itemId === target.targetId) {
      return;
    }

    if (payload.type === 'section' && target.type === 'section') {
      const nextOrder = draftConfig.sections
        .map((section) => section.id)
        .filter((sectionId) => sectionId !== payload.itemId);
      const targetIndex = nextOrder.indexOf(target.targetId);
      nextOrder.splice(targetIndex >= 0 ? targetIndex : nextOrder.length, 0, payload.itemId);
      reorderSections(nextOrder);
      return;
    }

    if (payload.type === 'level2') {
      const movingLevel2 = findLevel2(draftConfig, payload.itemId);
      if (!movingLevel2) {
        return;
      }

      if (target.type === 'section') {
        moveLevel2Group(payload.itemId, target.targetId, Number.MAX_SAFE_INTEGER);
        return;
      }

      if (target.type === 'level2') {
        const targetLevel2 = findLevel2(draftConfig, target.targetId);
        if (!targetLevel2) {
          return;
        }

        const targetSectionId = targetLevel2.parentLevelId ?? payload.sourceParentId;
        if (!targetSectionId) {
          return;
        }

        if (movingLevel2.parentLevelId !== targetSectionId) {
          moveLevel2Group(payload.itemId, targetSectionId, target.position);
          return;
        }

        const currentSection = draftConfig.sections.find((section) => section.id === targetSectionId);
        if (!currentSection) {
          return;
        }

        const nextOrder = currentSection.level2Groups
          .map((group) => group.id)
          .filter((groupId) => groupId !== payload.itemId);
        const targetIndex = nextOrder.indexOf(target.targetId);
        nextOrder.splice(targetIndex >= 0 ? targetIndex : nextOrder.length, 0, payload.itemId);
        reorderLevel2Groups(targetSectionId, nextOrder);
        return;
      }
    }

    if (payload.type === 'item') {
      if (target.type === 'level2') {
        moveMenuItem(payload.itemId, payload.sourceParentId ?? '', target.targetId, Number.MAX_SAFE_INTEGER);
        return;
      }

      if (target.type === 'item') {
        const targetItem = findMenuItem(draftConfig, target.targetId);
        if (!targetItem) {
          return;
        }

        moveMenuItem(payload.itemId, payload.sourceParentId ?? '', targetItem.parentLevelId, target.position);
      }
    }
  };

  if (!draftConfig) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading menu builder...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell activeLeaf={null} contentClassName="menu-builder-shell">
      <main className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {onBack && (
                    <button
                      type="button"
                      onClick={onBack}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100"
                      aria-label="Back"
                    >
                      <ArrowLeft size={18} />
                    </button>
                  )}
                  <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                    <Sparkles size={12} />
                    Profile Tools
                  </span>
                </div>
                <div>
                  <h1 className="brand-page-title text-slate-900">Navigation Menu Builder</h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    Create sections, rearrange groups, assign routes, and publish a live navigation experience without changing the existing sidebar architecture.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-start gap-4 lg:items-end">
                <MenuStatusBadge status={draftConfig.status} isDirty={state.isDirty} />
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleReset2}
                    className="btn btn--outline btn--icon-left"
                    type="button"
                  >
                    <RotateCcw size={15} />
                    Reset
                  </button>
                  <button
                    onClick={handleSaveDraft}
                    className="btn btn--outline btn--icon-left"
                    type="button"
                    disabled={!state.isDirty}
                  >
                    <Save size={15} />
                    Save Draft
                  </button>
                  <button
                    onClick={handlePublish2}
                    className="btn btn--primary btn--icon-left"
                    type="button"
                  >
                    <Send size={15} />
                    Publish Navigation
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 sm:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs uppercase tracking-wide text-slate-400">Sections</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">{draftConfig.sections.length}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs uppercase tracking-wide text-slate-400">Groups</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      {draftConfig.sections.reduce((count, section) => count + section.level2Groups.length, 0)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs uppercase tracking-wide text-slate-400">Items</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      {draftConfig.sections.reduce(
                        (count, section) => count + section.level2Groups.reduce((groupCount, level2) => groupCount + level2.items.length, 0),
                        0
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs uppercase tracking-wide text-slate-400">Status</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">{state.validationResult?.isValid ? 'Ready' : 'Review'}</div>
                  </div>
                </div>
              </div>
            </div>

            {successMessage && (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            )}
          </section>

          {state.validationResult && (
            <MenuValidationSummary validation={state.validationResult} onDismiss={() => validateConfig()} />
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_380px]">
            <section className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Structure Editor</h2>
                    <p className="mt-1 text-sm text-slate-500">Drag sections, groups, and items to reorder the navigation hierarchy.</p>
                  </div>
                  <button
                    onClick={handleAddSection}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium',
                      'bg-blue-600 text-white hover:bg-blue-700 transition-colors'
                    )}
                  >
                    <Plus size={16} />
                    Add Section
                  </button>
                </div>

                <div className="p-5">
                  <MenuTree
                    sections={draftConfig.sections}
                    selectedSectionId={state.selectedSectionId}
                    selectedLevel2Id={state.selectedLevel2Id}
                    selectedItemId={state.selectedItemId}
                    onSelectSection={selectSection}
                    onSelectLevel2={selectLevel2}
                    onSelectItem={selectItem}
                    onToggleSection={(sectionId) => {
                      const section = draftConfig.sections.find((currentSection) => currentSection.id === sectionId);
                      if (section) {
                        updateSection(sectionId, { isExpanded: !section.isExpanded });
                      }
                    }}
                    onToggleLevel2={(level2Id) => {
                      const level2 = findLevel2(draftConfig, level2Id);
                      if (level2) {
                        updateLevel2(level2Id, { isExpanded: !level2.isExpanded });
                      }
                    }}
                    onAddLevel2={handleAddLevel2}
                    onAddItem={handleAddItem}
                    onEditSection={handleEditSection}
                    onEditLevel2={handleEditLevel2}
                    onEditItem={handleEditItem}
                    onRemoveSection={handleRemoveSection}
                    onRemoveLevel2={handleRemoveLevel2}
                    onRemoveItem={removeMenuItem}
                    onMoveNode={handleMoveNode}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <MoveRight size={16} />
                    Selected node details
                  </div>
                  <div className="mt-4 text-sm text-slate-600">
                    {selectedItem ? (
                      <div className="space-y-2">
                        <div className="text-base font-semibold text-slate-900">{selectedItem.label}</div>
                        <div>Key: {selectedItem.key}</div>
                        <div>Route: {selectedItem.route || getDefaultRouteForKey(selectedItem.key) || 'Uses existing sidebar action'}</div>
                        <div>External URL: {selectedItem.externalUrl || 'None'}</div>
                        <div>Visibility: {selectedItem.isVisible === false ? 'Hidden' : 'Visible'}</div>
                      </div>
                    ) : selectedLevel2 ? (
                      <div className="space-y-2">
                        <div className="text-base font-semibold text-slate-900">{selectedLevel2.label}</div>
                        <div>Items: {selectedLevel2.items.length}</div>
                        <div>Flatten group: {selectedLevel2.hideLabel ? 'Yes' : 'No'}</div>
                        <div>Visibility: {selectedLevel2.isVisible === false ? 'Hidden' : 'Visible'}</div>
                      </div>
                    ) : selectedSection ? (
                      <div className="space-y-2">
                        <div className="text-base font-semibold text-slate-900">{selectedSection.label}</div>
                        <div>Groups: {selectedSection.level2Groups.length}</div>
                        <div>Visibility: {selectedSection.isVisible === false ? 'Hidden' : 'Visible'}</div>
                      </div>
                    ) : (
                      <p>Select a section, group, or menu item to inspect and edit its properties.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900">Publish checklist</h3>
                  <ul className="mt-4 space-y-3 text-sm text-slate-600">
                    <li>Every visible item needs a working route or external URL.</li>
                    <li>Use existing navigation presets in create or edit to retain current labels, routes, and icons.</li>
                    <li>Use unique keys so the current routing callbacks stay predictable.</li>
                    <li>Delete only empty groups and sections to avoid accidental bulk removal.</li>
                    <li>Publish updates the live sidebar immediately through the shared hook.</li>
                  </ul>
                </div>
              </div>
            </section>

            <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
              <MenuPreview sections={draftConfig.sections} />

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">Existing navigation coverage</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <p>
                    The builder starts from your current published navigation. When adding or editing items, use the existing navigation preset list to preserve routed pages already used by the sidebar.
                  </p>
                  <p>
                    This keeps Menu Builder aligned with Theme Builder and Form Layout: primary actions stay at the top, and editing panels focus on controlled configuration instead of freeform recreation.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Dialogs */}
      {formDialog && (
        <MenuFormDialog
          key={`${formDialog.type}-${formDialog.mode}-${formDialog.editingId ?? 'new'}`}
          isOpen={formDialog.isOpen}
          formType={formDialog.type}
          title={formDialog.title}
          sections={draftConfig.sections}
          initialData={formDialog.initialData ?? null}
          onSubmit={handleFormSubmit}
          onCancel={() => setFormDialog(null)}
        />
      )}

      <MenuConfirmationDialog
        isOpen={resetConfirmOpen}
        type="reset"
        isDirty={state.isDirty}
        onConfirm={handleReset}
        onCancel={() => setResetConfirmOpen(false)}
      />

      <MenuConfirmationDialog
        isOpen={publishConfirmOpen}
        type="publish"
        onConfirm={handlePublish}
        onCancel={() => setPublishConfirmOpen(false)}
      />
    </AppShell>
  );
};

export default MenuBuilderPage;
