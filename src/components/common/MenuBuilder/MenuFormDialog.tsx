/**
 * Menu Form Dialog Component
 * Dialog for creating/editing sections, level2 groups, and items
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { MenuSectionData, MenuLevelData, MenuItemData } from '../../../utils/menuBuilderTypes';
import { cn } from '../../../utils/classNames';

type FormType = 'section' | 'level2' | 'item';

interface MenuFormDialogProps {
  isOpen: boolean;
  formType: FormType;
  title: string;
  initialData?: Partial<MenuSectionData & MenuLevelData & MenuItemData> | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const MenuFormDialog: React.FC<MenuFormDialogProps> = ({
  isOpen,
  formType,
  title,
  initialData,
  onSubmit,
  onCancel,
}) => {
  const [label, setLabel] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [hideLabel, setHideLabel] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setLabel(initialData.label || '');
      setKey(initialData.key || '');
      setDescription(initialData.description || '');
      setHideLabel(initialData.hideLabel || false);
    } else {
      setLabel('');
      setKey('');
      setDescription('');
      setHideLabel(false);
    }
    setErrors({});
  }, [isOpen, initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!label.trim()) {
      newErrors.label = `${formType === 'section' ? 'Section' : formType === 'level2' ? 'Group' : 'Item'} name is required`;
    }

    if (formType === 'item' && !key.trim()) {
      newErrors.key = 'Item key is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data: any = { label };

    if (formType === 'item') {
      data.key = key;
      data.description = description;
    } else if (formType === 'level2') {
      data.description = description;
      data.hideLabel = hideLabel;
    } else {
      data.description = description;
    }

    onSubmit(data);
    setLabel('');
    setKey('');
    setDescription('');
    setHideLabel(false);
  };

  if (!isOpen) return null;

  const handleAutoKey = (value: string) => {
    setKey(value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onCancel}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
            )}

            {/* Description field */}
            {formType !== 'section' && (
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
            )}

            {/* Hide Label checkbox (only for level2) */}
            {formType === 'level2' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hideLabel"
                  checked={hideLabel}
                  onChange={(e) => setHideLabel(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="hideLabel" className="text-sm cursor-pointer">
                  Hide label and flatten items
                </label>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4">
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
