import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Filter, X } from 'lucide-react';
import {
  MASTER_OVERLAY_STYLE,
  MASTER_SIDE_PANEL_STYLE,
} from '../../../../experience/components/overlay/overlayTokens';
import { cn } from '../../../../utils/classNames';
import type { BPStatus, BPType, BusinessType } from '../types/supplierMaster.types';

type AccordionId = 'status' | 'partnerType' | 'businessProfile';

interface SupplierCatalogueFilterState {
  status: BPStatus | '';
  partnerType: BPType | '';
  businessType: BusinessType | '';
  country: string;
}

interface SupplierCatalogueFilterDrawerProps {
  businessTypeOptions: readonly BusinessType[];
  countryOptions: readonly string[];
  isOpen: boolean;
  statusOptions: readonly BPStatus[];
  typeOptions: readonly BPType[];
  value: SupplierCatalogueFilterState;
  onApply: (value: SupplierCatalogueFilterState) => void;
  onClose: () => void;
}

function FilterSection({
  children,
  id,
  isOpen,
  onToggle,
  title,
}: {
  children: React.ReactNode;
  id: AccordionId;
  isOpen: boolean;
  onToggle: (id: AccordionId) => void;
  title: string;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/60 dark:border-white/10 dark:bg-slate-900/40">
      <button
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        onClick={() => onToggle(id)}
        type="button"
      >
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-slate-500 transition-transform dark:text-slate-400',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            animate={{ height: 'auto', opacity: 1 }}
            className="border-t border-slate-200/70 dark:border-white/10"
            exit={{ height: 0, opacity: 0 }}
            initial={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="space-y-4 px-4 py-4">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function OptionChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        'rounded-full border px-3 py-2 text-xs font-semibold transition',
        active
          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-500/20 dark:text-blue-100'
          : 'border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-slate-900/70'
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function SelectField({
  label,
  onChange,
  options,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <select
        className="w-full rounded-2xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function SupplierCatalogueFilterDrawer({
  businessTypeOptions,
  countryOptions,
  isOpen,
  statusOptions,
  typeOptions,
  value,
  onApply,
  onClose,
}: SupplierCatalogueFilterDrawerProps) {
  const [draft, setDraft] = useState<SupplierCatalogueFilterState>(value);
  const [openSections, setOpenSections] = useState<Record<AccordionId, boolean>>({
    status: true,
    partnerType: true,
    businessProfile: true,
  });

  useEffect(() => {
    if (isOpen) {
      setDraft(value);
    }
  }, [isOpen, value]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const activeFilterCount = useMemo(
    () => [draft.status, draft.partnerType, draft.businessType, draft.country].filter(Boolean).length,
    [draft]
  );

  const clearAll = () => {
    setDraft({
      status: '',
      partnerType: '',
      businessType: '',
      country: '',
    });
  };

  const toggleSection = (id: AccordionId) => {
    setOpenSections((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.button
            aria-label="Close filters"
            className="fixed inset-0 z-[1600]"
            initial={{ opacity: 0 }}
            onClick={onClose}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={MASTER_OVERLAY_STYLE}
            type="button"
          />

          <motion.aside
            aria-labelledby="supplier-filter-drawer-title"
            aria-modal="true"
            className="fixed right-0 top-0 z-[1601] flex h-screen w-full max-w-md flex-col text-slate-900 dark:text-slate-50"
            role="dialog"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            style={MASTER_SIDE_PANEL_STYLE}
            transition={{ duration: 0.24, ease: 'easeOut' }}
          >
            <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/85 px-5 py-4 backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/75">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    <Filter size={14} />
                    Catalogue Filters
                  </div>
                  <h2
                    className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100"
                    id="supplier-filter-drawer-title"
                  >
                    Refine Business Partners
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Narrow the supplier catalogue with status, partner type, business type, and geography.
                  </p>
                </div>
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-slate-500 transition hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-800"
                  onClick={onClose}
                  type="button"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'} selected
                </div>
                <button
                  className="text-xs font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
                  onClick={clearAll}
                  type="button"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-4">
                <FilterSection
                  id="status"
                  isOpen={openSections.status}
                  onToggle={toggleSection}
                  title="Business Partner Status"
                >
                  <div className="flex flex-wrap gap-2">
                    <OptionChip
                      active={draft.status === ''}
                      label="All statuses"
                      onClick={() => setDraft((current) => ({ ...current, status: '' }))}
                    />
                    {statusOptions.map((status) => (
                      <OptionChip
                        key={status}
                        active={draft.status === status}
                        label={status}
                        onClick={() => setDraft((current) => ({ ...current, status }))}
                      />
                    ))}
                  </div>
                </FilterSection>

                <FilterSection
                  id="partnerType"
                  isOpen={openSections.partnerType}
                  onToggle={toggleSection}
                  title="Partner Classification"
                >
                  <SelectField
                    label="Business Partner Type"
                    onChange={(partnerType) => setDraft((current) => ({ ...current, partnerType: partnerType as BPType | '' }))}
                    options={typeOptions}
                    placeholder="All partner types"
                    value={draft.partnerType}
                  />
                </FilterSection>

                <FilterSection
                  id="businessProfile"
                  isOpen={openSections.businessProfile}
                  onToggle={toggleSection}
                  title="Business Profile"
                >
                  <div className="space-y-4">
                    <SelectField
                      label="Business Type"
                      onChange={(businessType) =>
                        setDraft((current) => ({ ...current, businessType: businessType as BusinessType | '' }))
                      }
                      options={businessTypeOptions}
                      placeholder="All business types"
                      value={draft.businessType}
                    />
                    <SelectField
                      label="Country"
                      onChange={(country) => setDraft((current) => ({ ...current, country }))}
                      options={countryOptions}
                      placeholder="All countries"
                      value={draft.country}
                    />
                  </div>
                </FilterSection>
              </div>
            </div>

            <div className="sticky bottom-0 border-t border-slate-200/80 bg-white/85 px-5 py-4 backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/75">
              <div className="flex items-center justify-end gap-3">
                <button
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={onClose}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                  onClick={() => onApply(draft)}
                  type="button"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
