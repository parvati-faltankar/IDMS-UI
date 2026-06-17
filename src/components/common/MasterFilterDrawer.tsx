import React, { useRef } from 'react';
import SideDrawer from './SideDrawer';

export type MasterFilterOption = {
  value: string;
  label: string;
};

export type MasterFilterField = {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  options: MasterFilterOption[];
  onChange: (value: string) => void;
};

type MasterFilterDrawerProps = {
  open: boolean;
  title?: string;
  description?: string;
  fields: MasterFilterField[];
  onClose: () => void;
  onReset?: () => void;
  resetLabel?: string;
  closeLabel?: string;
};

const FIELD_STYLE: React.CSSProperties = {
  width: '100%',
  height: '38px',
  padding: '0 12px',
  fontSize: '13px',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  outline: 'none',
  boxSizing: 'border-box',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
};

export default function MasterFilterDrawer({
  open,
  title = 'Filters',
  description = 'Refine the catalogue results.',
  fields,
  onClose,
  onReset,
  resetLabel = 'Reset filters',
  closeLabel = 'Done',
}: MasterFilterDrawerProps) {
  const firstFieldRef = useRef<HTMLSelectElement | null>(null);

  return (
    <SideDrawer
      isOpen={open}
      title={title}
      subtitle={description}
      onClose={onClose}
      initialFocusRef={firstFieldRef}
      panelClassName="side-drawer__panel--narrow"
      footerClassName="master-filter-drawer__footer"
      footer={
        <>
          {onReset ? (
            <button type="button" className="btn btn--outline" onClick={onReset}>
              {resetLabel}
            </button>
          ) : null}
          <button type="button" className="btn btn--primary" onClick={onClose}>
            {closeLabel}
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: '16px' }}>
        {fields.map((field, index) => (
          <label key={field.id}>
            <span style={LABEL_STYLE}>{field.label}</span>
            <select
              ref={index === 0 ? firstFieldRef : undefined}
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
              style={FIELD_STYLE}
            >
              <option value="">{field.placeholder ?? `All ${field.label.toLowerCase()}`}</option>
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </SideDrawer>
  );
}
