import React, { useRef } from 'react';
import type { CatalogueFilters } from '../../utils/catalogueFilters';
import SideDrawer from './SideDrawer';
import { Input, Select } from './FormControls';

interface CatalogueFilterDrawerProps {
  isOpen: boolean;
  title?: string;
  subtitle: string;
  draftFilters: CatalogueFilters;
  primaryLabel: string;
  primaryOptions: string[];
  branchLabel: string;
  branchOptions: string[];
  dateFromLabel: string;
  dateToLabel: string;
  dateRangeError: string;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  onFilterChange: (field: keyof CatalogueFilters, value: string) => void;
}

const priorityOptions = ['High', 'Medium', 'Low'];

const CatalogueFilterDrawer: React.FC<CatalogueFilterDrawerProps> = ({
  isOpen,
  title = 'Filters',
  subtitle,
  draftFilters,
  primaryLabel,
  primaryOptions,
  branchLabel,
  branchOptions,
  dateFromLabel,
  dateToLabel,
  dateRangeError,
  onClose,
  onApply,
  onReset,
  onFilterChange,
}) => {
  const firstFieldRef = useRef<HTMLSelectElement | null>(null);

  return (
    <SideDrawer
      isOpen={isOpen}
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      initialFocusRef={firstFieldRef}
      panelClassName="side-drawer__panel--narrow"
      footer={
        <>
          <button type="button" className="btn btn--outline" onClick={onReset}>
            Reset
          </button>
          <button type="button" className="btn btn--primary" onClick={onApply}>
            Apply
          </button>
        </>
      }
    >
      <div className="filter-drawer__form">
        <label className="filter-drawer__field">
          <span className="field-label">{primaryLabel}</span>
          <Select
            ref={firstFieldRef}
            value={draftFilters.supplier}
            onChange={(event) => onFilterChange('supplier', event.target.value)}
            className="field-select"
            options={[
              { value: '', label: `All ${primaryLabel.toLowerCase()}s` },
              ...primaryOptions.map((option) => ({ value: option, label: option })),
            ]}
          />
        </label>

        <label className="filter-drawer__field">
          <span className="field-label">Priority</span>
          <Select
            value={draftFilters.priority}
            onChange={(event) => onFilterChange('priority', event.target.value)}
            className="field-select"
            options={[
              { value: '', label: 'All priorities' },
              ...priorityOptions.map((option) => ({ value: option, label: option })),
            ]}
          />
        </label>

        <label className="filter-drawer__field">
          <span className="field-label">{branchLabel}</span>
          <Select
            value={draftFilters.branch}
            onChange={(event) => onFilterChange('branch', event.target.value)}
            className="field-select"
            options={[
              { value: '', label: `All ${branchLabel.toLowerCase()}s` },
              ...branchOptions.map((option) => ({ value: option, label: option })),
            ]}
          />
        </label>

        <div className="filter-drawer__date-grid">
          <label className="filter-drawer__field">
            <span className="field-label">{dateFromLabel}</span>
            <Input
              type="date"
              value={draftFilters.startDate}
              onChange={(event) => onFilterChange('startDate', event.target.value)}
              max={draftFilters.endDate || undefined}
            />
          </label>
          <label className="filter-drawer__field">
            <span className="field-label">{dateToLabel}</span>
            <Input
              type="date"
              value={draftFilters.endDate}
              onChange={(event) => onFilterChange('endDate', event.target.value)}
              min={draftFilters.startDate || undefined}
              error={dateRangeError}
            />
          </label>
        </div>
      </div>
    </SideDrawer>
  );
};

export default CatalogueFilterDrawer;
