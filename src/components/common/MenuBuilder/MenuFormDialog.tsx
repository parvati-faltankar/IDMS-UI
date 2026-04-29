/**
 * Menu Form Dialog Component
 * Dialog for creating/editing sections, level2 groups, and items
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { MenuSectionData } from '../../../utils/menuBuilderTypes';
import { cn } from '../../../utils/classNames';
import { menuBuilderIconRegistry } from '../../../utils/menuBuilderNavigation';
import type { MenuFormData } from './types';

type FormType = 'section' | 'level2' | 'item';

type ExistingNavigationItemOption = {
  id: string;
  label: string;
  key: string;
  route?: string;
  iconName?: string | null;
  sectionLabel: string;
  groupLabel: string;
};

function getInitialFormData(initialData: Partial<MenuFormData> | null | undefined, sections: MenuSectionData[]) {
  return {
    label: initialData?.label ?? '',
    key: initialData?.key ?? '',
    description: initialData?.description ?? '',
    hideLabel: initialData?.hideLabel ?? false,
    iconName: initialData?.iconName ?? '',
    route: initialData?.route ?? '',
    externalUrl: initialData?.externalUrl ?? '',
    openInNewTab: initialData?.openInNewTab ?? false,
    isVisible: initialData?.isVisible ?? true,
    parentSectionId: initialData?.parentSectionId ?? sections[0]?.id ?? '',
    parentLevel2Id: initialData?.parentLevel2Id ?? sections[0]?.level2Groups[0]?.id ?? '',
  };
}

interface MenuFormDialogProps {
  isOpen: boolean;
  formType: FormType;
  title: string;
  sections: MenuSectionData[];
  initialData?: Partial<MenuFormData> | null;
  onSubmit: (data: MenuFormData) => void;
  onCancel: () => void;
}

const MenuFormDialog: React.FC<MenuFormDialogProps> = ({
  isOpen,
  formType,
  title,
  sections,
  initialData,
  onSubmit,
  onCancel,
}) => {
  const defaults = getInitialFormData(initialData, sections);
  const [label, setLabel] = useState(defaults.label);
  const [presetItemId, setPresetItemId] = useState('');
  const [key, setKey] = useState(defaults.key);
  const [description, setDescription] = useState(defaults.description);
  const [hideLabel, setHideLabel] = useState(defaults.hideLabel);
  const [iconName, setIconName] = useState(defaults.iconName);
  const [route, setRoute] = useState(defaults.route);
  const [externalUrl, setExternalUrl] = useState(defaults.externalUrl);
  const [openInNewTab, setOpenInNewTab] = useState(defaults.openInNewTab);
  const [isVisible, setIsVisible] = useState(defaults.isVisible);
  const [parentSectionId, setParentSectionId] = useState(defaults.parentSectionId);
  const [parentLevel2Id, setParentLevel2Id] = useState(defaults.parentLevel2Id);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableLevel2Groups =
    formType === 'item'
      ? sections.flatMap((section) =>
          section.level2Groups.map((level2) => ({
            id: level2.id,
            label: `${section.label} / ${level2.label}`,
          }))
        )
      : [];

  const existingNavigationItems: ExistingNavigationItemOption[] =
    formType === 'item'
      ? sections.flatMap((section) =>
          section.level2Groups.flatMap((level2) =>
            level2.items.map((item) => ({
              id: item.id,
              label: item.label,
              key: item.key,
              route: item.route,
              iconName: item.iconName,
              sectionLabel: section.label,
              groupLabel: level2.label,
            }))
          )
        )
      : [];

  const applyExistingItemPreset = (selectedId: string) => {
    setPresetItemId(selectedId);
    const selectedItem = existingNavigationItems.find((item) => item.id === selectedId);
    if (!selectedItem) {
      return;
    }

    setLabel(selectedItem.label);
    setKey(selectedItem.key);
    setRoute(selectedItem.route ?? '');
    setIconName(selectedItem.iconName ?? '');
    setExternalUrl('');
    setOpenInNewTab(false);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!label.trim()) {
      newErrors.label = `${formType === 'section' ? 'Section' : formType === 'level2' ? 'Group' : 'Item'} name is required`;
    }

    if (formType === 'item' && !key.trim()) {
      newErrors.key = 'Item key is required';
    }

    if (formType === 'level2' && !parentSectionId) {
      newErrors.parentSectionId = 'Select a parent section';
    }

    if (formType === 'item' && !parentLevel2Id) {
      newErrors.parentLevel2Id = 'Select a parent group';
    }

    if (formType === 'item' && !route.trim() && !externalUrl.trim()) {
      newErrors.route = 'Provide a route or an external URL';
    }

    if (externalUrl.trim()) {
      try {
        new URL(externalUrl);
      } catch {
        newErrors.externalUrl = 'Enter a valid external URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data: MenuFormData = {
      label: label.trim(),
      description: description.trim(),
      iconName: iconName || null,
      isVisible,
    };

    if (formType === 'item') {
      data.key = key.trim();
      data.parentLevel2Id = parentLevel2Id;
      data.route = route.trim();
      data.externalUrl = externalUrl.trim();
      data.openInNewTab = openInNewTab;
    } else if (formType === 'level2') {
      data.hideLabel = hideLabel;
      data.parentSectionId = parentSectionId;
    }

    onSubmit(data);
    setLabel('');
    setKey('');
    setDescription('');
    setHideLabel(false);
    setIconName('');
    setRoute('');
    setExternalUrl('');
    setOpenInNewTab(false);
    setIsVisible(true);
  };

  if (!isOpen) return null;

  const handleAutoKey = (value: string) => {
    setKey(value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  };

  const iconOptions = Object.keys(menuBuilderIconRegistry).sort();

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="menu-form-dialog bg-white rounded-lg shadow-lg max-w-md w-full">
          <div className="menu-form-dialog__header flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onCancel}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="menu-form-dialog__form">
            <div className="menu-form-dialog__body p-4 space-y-4">
            {/* Label field */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {formType === 'section' ? 'Section Name' : formType === 'level2' ? 'Group Name' : 'Item Name'}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => {
                  setLabel(e.target.value);
                  if (formType === 'item') {
                    handleAutoKey(e.target.value);
                  }
                }}
                className={cn(
                  'w-full px-3 py-2 border rounded text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.label ? 'border-red-500' : 'border-gray-300'
                )}
                placeholder={`Enter ${formType === 'section' ? 'section' : formType === 'level2' ? 'group' : 'item'} name`}
              />
              {errors.label && <p className="text-red-500 text-xs mt-1">{errors.label}</p>}
            </div>

            {/* Key field (only for items) */}
            {formType === 'item' && (
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Existing Navigation Item</label>
                  <select
                    value={presetItemId}
                    onChange={(e) => applyExistingItemPreset(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Custom item</option>
                    {existingNavigationItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label} ({item.sectionLabel} / {item.groupLabel})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    Pick an existing navigation item to preload its label, key, icon, and route before editing.
                  </p>
                </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Item Key
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 border rounded text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500',
                    errors.key ? 'border-red-500' : 'border-gray-300'
                  )}
                  placeholder="auto-generated"
                />
                {errors.key && <p className="text-red-500 text-xs mt-1">{errors.key}</p>}
              </div>
              </div>
            )}

            {/* Description field */}
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional description"
                rows={3}
              />
            </div>

            {(formType === 'section' || formType === 'item') && (
              <div>
                <label className="block text-sm font-medium mb-1">Icon</label>
                <select
                  value={iconName}
                  onChange={(e) => setIconName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Default</option>
                  {iconOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formType === 'level2' && (
              <div>
                <label className="block text-sm font-medium mb-1">Parent Section</label>
                <select
                  value={parentSectionId}
                  onChange={(e) => setParentSectionId(e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                    errors.parentSectionId ? 'border-red-500' : 'border-gray-300'
                  )}
                >
                  <option value="">Select section</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.label}
                    </option>
                  ))}
                </select>
                {errors.parentSectionId && <p className="text-red-500 text-xs mt-1">{errors.parentSectionId}</p>}
              </div>
            )}

            {/* Hide Label checkbox (only for level2) */}
            {formType === 'level2' && (
              <div className="space-y-3 rounded border border-gray-200 bg-gray-50 p-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    id="hideLabel"
                    checked={hideLabel}
                    onChange={(e) => setHideLabel(e.target.checked)}
                    className="rounded"
                  />
                  Hide label and flatten items
                </label>
              </div>
            )}

            {formType === 'item' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Parent Group</label>
                  <select
                    value={parentLevel2Id}
                    onChange={(e) => setParentLevel2Id(e.target.value)}
                    className={cn(
                      'w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                      errors.parentLevel2Id ? 'border-red-500' : 'border-gray-300'
                    )}
                  >
                    <option value="">Select group</option>
                    {availableLevel2Groups.map((level2) => (
                      <option key={level2.id} value={level2.id}>
                        {level2.label}
                      </option>
                    ))}
                  </select>
                  {errors.parentLevel2Id && <p className="text-red-500 text-xs mt-1">{errors.parentLevel2Id}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Route</label>
                  <input
                    list="menu-builder-route-options"
                    type="text"
                    value={route}
                    onChange={(e) => setRoute(e.target.value)}
                    className={cn(
                      'w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                      errors.route ? 'border-red-500' : 'border-gray-300'
                    )}
                    placeholder="/purchase-order"
                  />
                  {errors.route && <p className="text-red-500 text-xs mt-1">{errors.route}</p>}
                  <datalist id="menu-builder-route-options">
                    {existingNavigationItems
                      .map((item) => item.route)
                      .filter((itemRoute, index, list): itemRoute is string => Boolean(itemRoute) && list.indexOf(itemRoute) === index)
                      .map((itemRoute) => (
                        <option key={itemRoute} value={itemRoute} />
                      ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">External URL</label>
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    className={cn(
                      'w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                      errors.externalUrl ? 'border-red-500' : 'border-gray-300'
                    )}
                    placeholder="https://example.com"
                  />
                  {errors.externalUrl && <p className="text-red-500 text-xs mt-1">{errors.externalUrl}</p>}
                </div>

                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={openInNewTab}
                    onChange={(e) => setOpenInNewTab(e.target.checked)}
                    className="rounded"
                  />
                  Open in new tab when using external URL
                </label>
              </>
            )}

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
                className="rounded"
              />
              Visible in navigation
            </label>
            </div>

            {/* Actions */}
            <div className="menu-form-dialog__actions flex gap-2 justify-end">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
              >
                {initialData ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default MenuFormDialog;
