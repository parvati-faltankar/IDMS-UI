import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import SideDrawer from './SideDrawer';
import { cn } from '../../utils/classNames';

export interface CatalogueDisplayField<TItem> {
  id: string;
  label: string;
  description?: string;
  render: (item: TItem) => React.ReactNode;
}

interface CatalogueFieldDisplaySettingsProps<TItem> {
  title: string;
  subtitle?: string;
  fields: CatalogueDisplayField<TItem>[];
  selectedFieldIds: string[];
  maxFields?: number;
  onChange: (fieldIds: string[]) => void;
}

function CatalogueFieldDisplaySettings<TItem>({
  title,
  subtitle,
  fields,
  selectedFieldIds,
  maxFields = 8,
  onChange,
}: CatalogueFieldDisplaySettingsProps<TItem>) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedFieldSet = new Set(selectedFieldIds);
  const selectedCount = selectedFieldIds.length;

  const handleToggleField = (fieldId: string) => {
    if (selectedFieldSet.has(fieldId)) {
      onChange(selectedFieldIds.filter((selectedFieldId) => selectedFieldId !== fieldId));
      return;
    }

    if (selectedCount >= maxFields) {
      return;
    }

    onChange([...selectedFieldIds, fieldId]);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="catalogue-field-settings__trigger"
        aria-label={`Configure ${title}`}
        title="Configure fields"
      >
        <Settings size={16} />
      </button>

      <SideDrawer
        isOpen={isOpen}
        title={title}
        subtitle={subtitle ?? `Select up to ${maxFields} fields to show in the compact list.`}
        onClose={() => setIsOpen(false)}
        panelClassName="side-drawer__panel--narrow"
        footer={
          <button type="button" onClick={() => setIsOpen(false)} className="btn btn--primary">
            Done
          </button>
        }
      >
        <div className="catalogue-field-settings">
          <div className="catalogue-field-settings__summary">
            <strong>{selectedCount} selected</strong>
            <span>Maximum {maxFields}</span>
          </div>

          <div className="catalogue-field-settings__list">
            {fields.map((field) => {
              const isSelected = selectedFieldSet.has(field.id);
              const isDisabled = !isSelected && selectedCount >= maxFields;

              return (
                <label
                  key={field.id}
                  className={cn('catalogue-field-settings__option', isDisabled && 'catalogue-field-settings__option--disabled')}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => handleToggleField(field.id)}
                  />
                  <span>
                    <strong>{field.label}</strong>
                    {field.description && <small>{field.description}</small>}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </SideDrawer>
    </>
  );
}

export default CatalogueFieldDisplaySettings;
