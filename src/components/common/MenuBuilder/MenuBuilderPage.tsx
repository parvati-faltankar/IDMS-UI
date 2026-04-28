/**
 * Menu Builder Page
 * Main page for managing navigation menu configuration
 */

import React, { useState } from 'react';
import { ChevronLeft, Plus, RotateCcw, Save, Send } from 'lucide-react';
import { useMenuBuilder } from '../../../theme/MenuBuilderContext';
import MenuTree from './MenuTree';
import MenuPreview from './MenuPreview';
import MenuFormDialog from './MenuFormDialog';
import MenuConfirmationDialog from './MenuConfirmationDialog';
import MenuStatusBadge from './MenuStatusBadge';
import MenuValidationSummary from './MenuValidationSummary';
import { cn } from '../../../utils/classNames';
import type { DragDropPayload } from '../../../utils/menuBuilderTypes';

interface MenuBuilderPageProps {
  onBack?: () => void;
}

type FormDialogState = {
  isOpen: boolean;
  type: 'section' | 'level2' | 'item';
  title: string;
  editingId?: string;
} | null;

const MenuBuilderPage: React.FC<MenuBuilderPageProps> = ({ onBack }) => {
  const {
    state,
    addSection,
    updateSection,
    removeSection,
    addLevel2,
    updateLevel2,
    removeLevel2,
    addMenuItem,
    updateMenuItem,
    removeMenuItem,
    selectSection,
    selectLevel2,
    selectItem,
    validateConfig,
    resetToDraft,
    publishConfig,
  } = useMenuBuilder();

  const [formDialog, setFormDialog] = useState<FormDialogState>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const draftConfig = state.draftConfig;

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
    });
  };

  const handleAddLevel2 = (sectionId: string) => {
    setFormDialog({
      isOpen: true,
      type: 'level2',
      title: 'Add Group',
      editingId: sectionId,
    });
  };

  const handleAddItem = (level2Id: string) => {
    setFormDialog({
      isOpen: true,
      type: 'item',
      title: 'Add Menu Item',
      editingId: level2Id,
    });
  };

  const handleEditSection = (sectionId: string) => {
    const section = draftConfig?.sections.find((s: any) => s.id === sectionId);
    if (!section) return;
    setFormDialog({
      isOpen: true,
      type: 'section',
      title: 'Edit Section',
      editingId: sectionId,
    });
  };

  const handleEditLevel2 = (level2Id: string) => {
    // Find level2 and show edit dialog
    setFormDialog({
      isOpen: true,
      type: 'level2',
      title: 'Edit Group',
      editingId: level2Id,
    });
  };

  const handleEditItem = (itemId: string) => {
    // Find item and show edit dialog
    setFormDialog({
      isOpen: true,
      type: 'item',
      title: 'Edit Menu Item',
      editingId: itemId,
    });
  };

  const handleFormSubmit = (data: any) => {
    if (!formDialog) return;

    switch (formDialog.type) {
      case 'section':
        if (formDialog.editingId && state.draftConfig?.sections.find((s: any) => s.id === formDialog.editingId)) {
          updateSection(formDialog.editingId, data);
        } else {
          addSection(data.label);
        }
        break;

      case 'level2':
        if (formDialog.editingId && state.draftConfig?.sections.find((s: any) => s.id === formDialog.editingId)) {
          // Adding new level2
          addLevel2(formDialog.editingId, data.label);
        } else if (formDialog.editingId) {
          // Updating level2
          updateLevel2(formDialog.editingId, data);
        }
        break;

      case 'item':
        if (formDialog.editingId && state.draftConfig?.sections.some((s: any) =>
          s.level2Groups.some((l2: any) => l2.id === formDialog.editingId)
        )) {
          // Adding new item
          addMenuItem(formDialog.editingId, data.label);
        } else if (formDialog.editingId) {
          // Updating item
          updateMenuItem(formDialog.editingId, data);
        }
        break;
    }

    setFormDialog(null);
    showSuccess(`${formDialog.type} ${formDialog.editingId ? 'updated' : 'created'} successfully`);
  };

  const handleReset = () => {
    resetToDraft();
    setResetConfirmOpen(false);
    showSuccess('Menu has been reset to the published version');
  };

  const handlePublish = () => {
    validateConfig();
    if (state.validationResult && !state.validationResult.isValid) {
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
    showSuccess('Draft saved to browser storage');
  };

  const handlePublish2 = () => {
    validateConfig();
    setPublishConfirmOpen(true);
  };

  const handleDragStart = (_payload: DragDropPayload) => {
    // Handled by MenuTree
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropItem = (level2Id: string, _payload: DragDropPayload, _position: number) => {
    // Simplified - in production, you'd want proper order management
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Back"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold">Navigation Menu Builder</h1>
                <p className="text-sm text-gray-500">Design and configure your application's navigation structure</p>
              </div>
            </div>
            <MenuStatusBadge status={draftConfig.status} isDirty={state.isDirty} />
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-3 text-sm text-green-700">
          ✓ {successMessage}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {/* Validation Summary */}
          {state.validationResult && (
            <div className="mb-6">
              <MenuValidationSummary validation={state.validationResult} />
            </div>
          )}

          {/* Main Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Menu Configuration */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b flex items-center justify-between">
                  <h2 className="font-semibold">Menu Configuration</h2>
                  <button
                    onClick={handleAddSection}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded text-sm font-medium',
                      'bg-blue-600 text-white hover:bg-blue-700 transition-colors'
                    )}
                  >
                    <Plus size={16} />
                    Add Section
                  </button>
                </div>

                <div className="p-4">
                  <MenuTree
                    sections={draftConfig.sections}
                    selectedSectionId={state.selectedSectionId}
                    selectedLevel2Id={state.selectedLevel2Id}
                    selectedItemId={state.selectedItemId}
                    onSelectSection={selectSection}
                    onSelectLevel2={selectLevel2}
                    onSelectItem={selectItem}
                    onToggleSection={(sectionId) => {
                      const section = draftConfig.sections.find((s: any) => s.id === sectionId);
                      if (section) {
                        updateSection(sectionId, { isExpanded: !section.isExpanded });
                      }
                    }}
                    onToggleLevel2={(level2Id) => {
                      // Find and toggle level2
                      for (const section of draftConfig.sections) {
                        const level2 = section.level2Groups.find((l2: any) => l2.id === level2Id);
                        if (level2) {
                          updateLevel2(level2Id, { isExpanded: !level2.isExpanded });
                          return;
                        }
                      }
                    }}
                    onAddLevel2={handleAddLevel2}
                    onAddItem={handleAddItem}
                    onEditSection={handleEditSection}
                    onEditLevel2={handleEditLevel2}
                    onEditItem={handleEditItem}
                    onRemoveSection={removeSection}
                    onRemoveLevel2={removeLevel2}
                    onRemoveItem={removeMenuItem}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDropItem={handleDropItem}
                  />
                </div>
              </div>
            </div>

            {/* Right: Preview */}
            <div className="lg:col-span-1">
              <MenuPreview sections={draftConfig.sections} className="sticky top-24" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="bg-white border-t sticky bottom-0">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {state.isDirty && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                  Unsaved changes
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleReset2}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded font-medium text-sm',
                  'border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors'
                )}
                title="Reset changes to last published version"
              >
                <RotateCcw size={16} />
                Reset
              </button>

              <button
                onClick={handleSaveDraft}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded font-medium text-sm',
                  'bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors'
                )}
                disabled={!state.isDirty}
              >
                <Save size={16} />
                Save Draft
              </button>

              <button
                onClick={handlePublish2}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded font-medium text-sm',
                  'bg-green-600 text-white hover:bg-green-700 transition-colors',
                  state.validationResult && !state.validationResult.isValid && 'opacity-50 cursor-not-allowed'
                )}
                disabled={state.validationResult ? !state.validationResult.isValid : false}
                title="Publish menu configuration for users to see"
              >
                <Send size={16} />
                Publish
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {formDialog && (
        <MenuFormDialog
          isOpen={formDialog.isOpen}
          formType={formDialog.type}
          title={formDialog.title}
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
    </div>
  );
};

export default MenuBuilderPage;
