import React, { useMemo } from 'react';
import {
  MasterCreateFormShell,
  MasterFormAccordionSection,
  MasterFormSectionSummary,
} from '../../../../experience/components/AdminPageShell';
import { cn } from '../../../../utils/classNames';
import { useCodeGenerationPolicyRecommendations } from '../hooks/useCodeGenerationPolicyRecommendations';
import { useCodeGenerationPolicyWorkflow } from '../hooks/useCodeGenerationPolicyWorkflow';

type PolicyStatus = 'Draft' | 'Active' | 'Inactive';
type FormMode = 'add' | 'edit' | 'view';
type PolicyStepId = 'basic' | 'applicability' | 'prefix' | 'series' | 'format' | 'history';

interface PolicyFormData {
  policyName: string;
  displayName: string;
  description: string;
  status: PolicyStatus;
  applicableFor: string;
  module: string;
  entity: string;
  entityType: string;
  prefixId: string;
  prefixValue: string;
  seriesType: string;
  calendarYearFormat: string;
  financialYearFormat: string;
  customResetBasis: string;
  codePattern: string;
  numberLength: string;
  startingNumber: string;
  paddingCharacter: string;
  alignmentType: string;
  separator: string;
  caseFormat: string;
}

interface PolicyRecord extends PolicyFormData {
  id: string;
  policyCode: string;
  sampleCode: string;
  usedInCodeGeneration: boolean;
  generatedCodeCount: number;
  deactivationReason: string;
  deactivationRemark: string;
}

type FieldErrors = Partial<Record<keyof PolicyFormData, string>>;

interface CodeGenerationPolicyFormExperienceProps {
  activationErrors: string[];
  activeStepId: PolicyStepId;
  availableEntities: string[];
  availableEntityTypes: string[];
  availableModules: string[];
  availablePrefixes: Array<{
    id: string;
    isDefault: boolean;
    name: string;
    prefixValue: string;
  }>;
  editingPolicy: PolicyRecord | null;
  fieldErrors: FieldErrors;
  form: PolicyFormData;
  formMode: FormMode;
  helpTopicId: string;
  isLocked: (field: keyof PolicyFormData) => boolean;
  onActivate: () => void;
  onBackToList: () => void;
  onClearActivationErrors: () => void;
  onDeactivate: () => void;
  onHelpClick: (topicId: string) => void;
  onSaveDraft: () => void;
  onSetActiveStep: (stepId: PolicyStepId) => void;
  onSetField: <K extends keyof PolicyFormData>(key: K, value: PolicyFormData[K]) => void;
  pageTitle: string;
  requiresEntityType: boolean;
  sampleCode: string;
  showCalendarYearFormat: boolean;
  showCustomSection: boolean;
  showFinancialYearFormat: boolean;
}

const GLASS_CARD_CLASS =
  'bg-white/60 backdrop-blur-lg border border-slate-200/60 shadow-xl dark:bg-slate-950/50 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)]';
const GLASS_INPUT_CLASS =
  'w-full rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200/70 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20';
const LABEL_CLASS = 'mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300';
const FIELD_HINT_CLASS = 'mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400';
const BEACON_CLASS = 'relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400';

const APPLICABLE_FOR_OPTIONS = ['Master', 'Transaction', 'Configuration'] as const;
const SERIES_TYPE_OPTIONS = [
  'Continuous',
  'Calendar Year',
  'Financial Year',
  'Monthly',
  'Daily',
  'Custom',
] as const;
const DEACTIVATION_REASONS_PLACEHOLDER = 'Deactivation reason will appear once the policy is inactive.';

function summaryText(label: string, value?: string | number | boolean | null) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (value === true) {
    return label;
  }
  return `${label}: ${value}`;
}

function sectionStateFromSummary(items: Array<string | null>) {
  const completed = items.filter(Boolean).length;
  if (completed === 0) return 'default' as const;
  if (completed === items.length) return 'complete' as const;
  return 'partial' as const;
}

function toneForStatus(status?: PolicyStatus) {
  if (status === 'Active') return 'active' as const;
  if (status === 'Inactive') return 'neutral' as const;
  return 'draft' as const;
}

function FieldShell({
  children,
  error,
  label,
  required,
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className={LABEL_CLASS}>
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </span>
      {children}
      {error ? <span className="mt-1 block text-[11px] text-rose-600 dark:text-rose-400">{error}</span> : null}
    </label>
  );
}

function TextInput({
  className,
  disabled,
  error,
  maxLength,
  mono,
  onChange,
  placeholder,
  type = 'text',
  value,
}: {
  className?: string;
  disabled?: boolean;
  error?: boolean;
  maxLength?: number;
  mono?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <input
      className={cn(
        GLASS_INPUT_CLASS,
        mono && 'font-mono tracking-[0.08em]',
        disabled && 'cursor-not-allowed border-slate-200/60 bg-slate-100/70 text-slate-500 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-500',
        error && 'border-rose-400 focus:border-rose-400 focus:ring-rose-200/70 dark:border-rose-500 dark:focus:ring-rose-500/20',
        className,
      )}
      disabled={disabled}
      maxLength={maxLength}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      type={type}
      value={value}
    />
  );
}

function SelectInput({
  disabled,
  error,
  onChange,
  options,
  placeholder = 'Select',
  renderOption,
  value,
}: {
  disabled?: boolean;
  error?: boolean;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  renderOption?: (value: string) => string;
  value: string;
}) {
  return (
    <select
      className={cn(
        GLASS_INPUT_CLASS,
        disabled && 'cursor-not-allowed border-slate-200/60 bg-slate-100/70 text-slate-500 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-500',
        error && 'border-rose-400 focus:border-rose-400 focus:ring-rose-200/70 dark:border-rose-500 dark:focus:ring-rose-500/20',
      )}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {renderOption ? renderOption(option) : option}
        </option>
      ))}
    </select>
  );
}

function TextAreaInput({
  disabled,
  onChange,
  placeholder,
  rows = 4,
  value,
}: {
  disabled?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  value: string;
}) {
  return (
    <textarea
      className={cn(
        GLASS_INPUT_CLASS,
        'resize-none leading-6',
        disabled && 'cursor-not-allowed border-slate-200/60 bg-slate-100/70 text-slate-500 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-500',
      )}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={rows}
      value={value}
    />
  );
}

function RecommendationChip({
  description,
  label,
  onClick,
  shortcut,
}: {
  description: string;
  label: string;
  onClick: () => void;
  shortcut?: string;
}) {
  return (
    <div className={cn(GLASS_CARD_CLASS, 'mb-4 flex items-center justify-between gap-4 rounded-2xl px-4 py-3')}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={BEACON_CLASS}>
            <span className="absolute inset-0 rounded-full bg-emerald-400/60 blur-md" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Suggested Next Action
          </span>
        </div>
        <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</div>
        <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{description}</p>
      </div>
      <button
        className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-500 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600 dark:border-blue-400/20"
        onClick={onClick}
        type="button"
      >
        {label}
        {shortcut ? (
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] tracking-[0.12em]">
            {shortcut}
          </span>
        ) : null}
      </button>
    </div>
  );
}

export default function CodeGenerationPolicyFormExperience({
  activationErrors,
  activeStepId,
  availableEntities,
  availableEntityTypes,
  availableModules,
  availablePrefixes,
  editingPolicy,
  fieldErrors,
  form,
  formMode,
  helpTopicId,
  isLocked,
  onActivate,
  onBackToList,
  onClearActivationErrors,
  onDeactivate,
  onHelpClick,
  onSaveDraft,
  onSetActiveStep,
  onSetField,
  pageTitle,
  requiresEntityType,
  sampleCode,
  showCalendarYearFormat,
  showCustomSection,
  showFinancialYearFormat,
}: CodeGenerationPolicyFormExperienceProps) {
  const { steps } = useCodeGenerationPolicyWorkflow({
    activeStepId,
    form,
  });
  const isViewOnly = formMode === 'view';
  const isDraft = !editingPolicy || editingPolicy.status === 'Draft';
  const recommendation = useCodeGenerationPolicyRecommendations({
    activeStepId,
    form,
    isDraft,
  });

  const primaryAction =
    !isViewOnly
      ? editingPolicy?.status === 'Active'
        ? { label: 'Save', onClick: onSaveDraft, tone: 'primary' as const }
        : { label: 'Activate', onClick: onActivate, tone: 'primary' as const }
      : undefined;

  const secondaryActions = [
    ...(!isViewOnly && isDraft ? [{ label: 'Save Draft', onClick: onSaveDraft, tone: 'ghost' as const }] : []),
    ...(!isViewOnly && editingPolicy?.status === 'Active'
      ? [{ label: 'Deactivate', onClick: onDeactivate, tone: 'ghost' as const }]
      : []),
    { label: 'Policy List', onClick: onBackToList, tone: 'ghost' as const },
  ];

  const handleRecommendation = () => {
    if (recommendation.action === 'complete-basic') onSetActiveStep('basic');
    else if (recommendation.action === 'complete-applicability') onSetActiveStep('applicability');
    else if (recommendation.action === 'pick-prefix') onSetActiveStep('prefix');
    else if (recommendation.action === 'configure-series') onSetActiveStep('series');
    else if (recommendation.action === 'configure-format') onSetActiveStep('format');
    else if (recommendation.action === 'review-history') onSetActiveStep('history');
    else if (recommendation.action === 'activate') onActivate();
    else onSaveDraft();
  };

  const stepperSteps = useMemo(
    () =>
      steps.map((step) => ({
        id: step.id,
        label: step.label,
        icon: <step.icon size={14} />,
        state: step.state,
      })),
    [steps],
  );

  const basicSummary = [
    summaryText('Policy Name', form.policyName),
    summaryText('Display Name', form.displayName),
    summaryText('Status', form.status),
  ];
  const applicabilitySummary = [
    summaryText('Applicable For', form.applicableFor),
    summaryText('Module', form.module),
    summaryText('Entity', form.entity),
    summaryText('Entity Type', form.entityType),
  ];
  const prefixSummary = [
    summaryText('Prefix', form.prefixValue),
    availablePrefixes.find((prefix) => prefix.id === form.prefixId)?.isDefault ? 'Default prefix selected' : null,
  ];
  const seriesSummary = [
    summaryText('Series Type', form.seriesType),
    summaryText('Calendar Year', form.calendarYearFormat),
    summaryText('Financial Year', form.financialYearFormat),
  ];
  const formatSummary = [
    summaryText('Length', form.numberLength),
    summaryText('Start', form.startingNumber),
    summaryText('Separator', form.separator),
    summaryText('Case', form.caseFormat),
  ];
  const historySummary = [
    summaryText('Usage Count', editingPolicy?.generatedCodeCount ?? 0),
    summaryText('Used In Generation', editingPolicy?.usedInCodeGeneration ? 'Yes' : 'No'),
    summaryText('Deactivation Reason', editingPolicy?.deactivationReason),
  ];

  return (
    <MasterCreateFormShell
      activeStepId={activeStepId}
      backAction={{ label: 'Back', onClick: onBackToList }}
      helpTopicId={helpTopicId}
      navigationPersistenceKey="code-generation-policy-form-stepper"
      onHelpClick={(id) => onHelpClick(id)}
      onStepChange={(stepId) => onSetActiveStep(stepId as PolicyStepId)}
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
      statusLabel={editingPolicy?.status}
      statusTone={toneForStatus(editingPolicy?.status)}
      steps={stepperSteps}
      title={pageTitle}
    >
      <div className="space-y-4 bg-transparent">
        <RecommendationChip
          description={recommendation.description}
          label={recommendation.label}
          onClick={handleRecommendation}
          shortcut={recommendation.shortcut}
        />

        {activationErrors.length > 0 ? (
          <div className="rounded-2xl border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 shadow-sm dark:border-rose-500/20 dark:bg-rose-950/30 dark:text-rose-300">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">Activation validation failed</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5">
                  {activationErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
              <button className="text-xs font-semibold text-rose-700 dark:text-rose-300" onClick={onClearActivationErrors} type="button">
                Dismiss
              </button>
            </div>
          </div>
        ) : null}

        {activeStepId === 'basic' ? (
          <MasterFormAccordionSection
            defaultOpen
            state={sectionStateFromSummary(basicSummary)}
            summary={<MasterFormSectionSummary items={basicSummary} />}
            title="Basic Details"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FieldShell label="Policy Code">
                <div className={cn(GLASS_CARD_CLASS, 'flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-700 dark:text-slate-200')}>
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
                    Auto
                  </span>
                  <span className="font-mono">{editingPolicy?.policyCode || 'System generated on first save'}</span>
                </div>
              </FieldShell>
              <FieldShell label="Policy Status" required>
                <SelectInput
                  disabled={isLocked('status') || (!isViewOnly && editingPolicy?.status === 'Active')}
                  error={Boolean(fieldErrors.status)}
                  onChange={(value) => onSetField('status', value as PolicyStatus)}
                  options={['Draft', 'Active', 'Inactive']}
                  value={form.status}
                />
                <p className={FIELD_HINT_CLASS}>
                  {form.status === 'Draft' && 'Policy is incomplete. Use Activate to enable it for code generation.'}
                  {form.status === 'Active' && 'Policy is live and already available for code generation.'}
                  {form.status === 'Inactive' && 'Policy is disabled for new code generation.'}
                </p>
              </FieldShell>
              <FieldShell error={fieldErrors.policyName} label="Policy Name" required>
                <TextInput
                  disabled={isLocked('policyName')}
                  error={Boolean(fieldErrors.policyName)}
                  maxLength={100}
                  onChange={(value) => onSetField('policyName', value)}
                  placeholder="e.g. Sales Order Number, Customer Code"
                  value={form.policyName}
                />
              </FieldShell>
              <FieldShell error={fieldErrors.displayName} label="Display Name" required>
                <TextInput
                  disabled={isLocked('displayName')}
                  error={Boolean(fieldErrors.displayName)}
                  maxLength={100}
                  onChange={(value) => onSetField('displayName', value)}
                  placeholder="e.g. Sales Order Number"
                  value={form.displayName}
                />
              </FieldShell>
              <div className="md:col-span-2">
                <FieldShell label="Description">
                  <TextAreaInput
                    disabled={isLocked('description')}
                    onChange={(value) => onSetField('description', value)}
                    placeholder="Brief description of this code generation policy..."
                    rows={4}
                    value={form.description}
                  />
                  <p className="mt-1 text-right text-[11px] text-slate-500 dark:text-slate-400">{form.description.length}/500</p>
                </FieldShell>
              </div>
            </div>
          </MasterFormAccordionSection>
        ) : null}

        {activeStepId === 'applicability' ? (
          <MasterFormAccordionSection
            defaultOpen
            state={sectionStateFromSummary(applicabilitySummary)}
            summary={<MasterFormSectionSummary items={applicabilitySummary} />}
            title="Applicability"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FieldShell error={fieldErrors.applicableFor} label="Applicable For" required>
                <SelectInput
                  disabled={isLocked('applicableFor')}
                  error={Boolean(fieldErrors.applicableFor)}
                  onChange={(value) => onSetField('applicableFor', value)}
                  options={[...APPLICABLE_FOR_OPTIONS]}
                  value={form.applicableFor}
                />
              </FieldShell>
              <FieldShell error={fieldErrors.module} label="Module" required>
                <SelectInput
                  disabled={!form.applicableFor && !isLocked('module')}
                  error={Boolean(fieldErrors.module)}
                  onChange={(value) => onSetField('module', value)}
                  options={availableModules}
                  placeholder={form.applicableFor ? 'Select module' : 'Select applicable for first'}
                  value={form.module}
                />
              </FieldShell>
              <FieldShell error={fieldErrors.entity} label="Entity" required>
                <SelectInput
                  disabled={!form.module && !isLocked('entity')}
                  error={Boolean(fieldErrors.entity)}
                  onChange={(value) => onSetField('entity', value)}
                  options={availableEntities}
                  placeholder={form.module ? 'Select entity' : 'Select module first'}
                  value={form.entity}
                />
              </FieldShell>
              <FieldShell error={fieldErrors.entityType} label="Entity Type">
                <SelectInput
                  disabled={(!form.entity && !isLocked('entityType')) || !requiresEntityType}
                  error={Boolean(fieldErrors.entityType)}
                  onChange={(value) => onSetField('entityType', value)}
                  options={availableEntityTypes}
                  placeholder={requiresEntityType ? 'Select entity type' : 'Not applicable'}
                  value={form.entityType}
                />
              </FieldShell>
            </div>
          </MasterFormAccordionSection>
        ) : null}

        {activeStepId === 'prefix' ? (
          <MasterFormAccordionSection
            defaultOpen
            state={sectionStateFromSummary(prefixSummary)}
            summary={<MasterFormSectionSummary items={prefixSummary} />}
            title="Prefix Selection"
          >
            {!form.applicableFor || !form.module || !form.entity ? (
              <div className={cn(GLASS_CARD_CLASS, 'rounded-2xl border-dashed px-4 py-4 text-sm text-slate-600 dark:text-slate-300')}>
                Complete the Applicability step first to see matching prefixes.
              </div>
            ) : availablePrefixes.length === 0 ? (
              <div className="rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-4 text-sm text-amber-700 dark:border-amber-400/20 dark:bg-amber-950/30 dark:text-amber-300">
                No active prefixes are available for the selected entity scope. Create one in Code Prefix Master first.
              </div>
            ) : (
              <div className="space-y-4">
                <FieldShell label="Prefix" required>
                  <SelectInput
                    disabled={isLocked('prefixId')}
                    onChange={(value) => onSetField('prefixId', value)}
                    options={availablePrefixes.map((prefix) => prefix.id)}
                    renderOption={(value) => {
                      const prefix = availablePrefixes.find((entry) => entry.id === value);
                      return prefix ? `${prefix.prefixValue} - ${prefix.name}` : value;
                    }}
                    value={form.prefixId}
                  />
                </FieldShell>
                {form.prefixValue ? (
                  <div className={cn(GLASS_CARD_CLASS, 'inline-flex items-center gap-3 rounded-full px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200')}>
                    <span className={BEACON_CLASS}>
                      <span className="absolute inset-0 rounded-full bg-sky-400/70 blur-md" />
                    </span>
                    <span>Selected prefix</span>
                    <span className="font-mono tracking-[0.18em]">{form.prefixValue}</span>
                    {availablePrefixes.find((prefix) => prefix.id === form.prefixId)?.isDefault ? (
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
                        Default
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}
          </MasterFormAccordionSection>
        ) : null}

        {activeStepId === 'series' ? (
          <>
            <MasterFormAccordionSection
              defaultOpen
              state={sectionStateFromSummary(seriesSummary)}
              summary={<MasterFormSectionSummary items={seriesSummary} />}
              title="Series Configuration"
            >
              <div className="space-y-4">
                <FieldShell error={fieldErrors.seriesType} label="Series Type" required>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    {SERIES_TYPE_OPTIONS.map((seriesType) => {
                      const active = form.seriesType === seriesType;
                      const locked = isLocked('seriesType');
                      return (
                        <button
                          className={cn(
                            GLASS_CARD_CLASS,
                            'rounded-2xl px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:text-slate-200',
                            active && 'border-blue-400 bg-blue-500 text-white dark:border-blue-400 dark:bg-blue-500 dark:text-white',
                            locked && 'cursor-not-allowed opacity-60',
                          )}
                          disabled={locked}
                          key={seriesType}
                          onClick={() => onSetField('seriesType', seriesType)}
                          type="button"
                        >
                          {seriesType}
                        </button>
                      );
                    })}
                  </div>
                </FieldShell>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {showCalendarYearFormat ? (
                    <FieldShell label="Calendar Year Format" required>
                      <SelectInput
                        disabled={isLocked('calendarYearFormat')}
                        onChange={(value) => onSetField('calendarYearFormat', value)}
                        options={['YYYY', 'YY']}
                        renderOption={(value) => (value === 'YYYY' ? 'YYYY - Full year' : 'YY - Short year')}
                        value={form.calendarYearFormat}
                      />
                    </FieldShell>
                  ) : null}

                  {showFinancialYearFormat ? (
                    <FieldShell label="Financial Year Format" required>
                      <SelectInput
                        disabled={isLocked('financialYearFormat')}
                        onChange={(value) => onSetField('financialYearFormat', value)}
                        options={['YYYY-YY', 'YY-YY', 'FY-YYYY-YY', 'FY-YY-YY']}
                        value={form.financialYearFormat}
                      />
                    </FieldShell>
                  ) : null}

                  {form.seriesType === 'Custom' ? (
                    <FieldShell label="Custom Reset Basis" required>
                      <SelectInput
                        disabled={isLocked('customResetBasis')}
                        onChange={(value) => onSetField('customResetBasis', value)}
                        options={['No Reset', 'Calendar Year', 'Financial Year', 'Monthly', 'Daily']}
                        value={form.customResetBasis}
                      />
                    </FieldShell>
                  ) : null}
                </div>
              </div>
            </MasterFormAccordionSection>

            {showCustomSection ? (
              <MasterFormAccordionSection
                defaultOpen
                state={form.codePattern ? 'complete' : 'partial'}
                summary={<MasterFormSectionSummary items={[summaryText('Pattern', form.codePattern)]} />}
                title="Pattern Configuration"
              >
                <div className="space-y-4">
                  <div className={cn(GLASS_CARD_CLASS, 'rounded-2xl border-dashed px-4 py-4 text-sm leading-6 text-slate-600 dark:text-slate-300')}>
                    Use only approved tokens in the pattern. The <span className="font-mono font-semibold">{'{Sequence}'}</span> token is mandatory.
                  </div>
                  <FieldShell label="Code Pattern" required>
                    <TextInput
                      disabled={isLocked('codePattern')}
                      mono
                      onChange={(value) => onSetField('codePattern', value)}
                      placeholder="e.g. {Prefix}-{Financial Year}-{Sequence}"
                      value={form.codePattern}
                    />
                  </FieldShell>
                </div>
              </MasterFormAccordionSection>
            ) : null}
          </>
        ) : null}

        {activeStepId === 'format' ? (
          <MasterFormAccordionSection
            defaultOpen
            state={sectionStateFromSummary(formatSummary)}
            summary={<MasterFormSectionSummary items={formatSummary} />}
            title="Number Format"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FieldShell error={fieldErrors.numberLength} label="Number Length" required>
                <TextInput
                  disabled={isLocked('numberLength')}
                  error={Boolean(fieldErrors.numberLength)}
                  onChange={(value) => onSetField('numberLength', value)}
                  placeholder="e.g. 5"
                  type="number"
                  value={form.numberLength}
                />
                <p className={FIELD_HINT_CLASS}>Digits in the sequence number. Example: 5 {'->'} 00001.</p>
              </FieldShell>
              <FieldShell error={fieldErrors.startingNumber} label="Starting Number" required>
                <TextInput
                  disabled={isLocked('startingNumber')}
                  error={Boolean(fieldErrors.startingNumber)}
                  onChange={(value) => onSetField('startingNumber', value)}
                  placeholder="e.g. 1"
                  type="number"
                  value={form.startingNumber}
                />
              </FieldShell>
              <FieldShell label="Padding Character" required>
                <SelectInput
                  disabled={isLocked('paddingCharacter')}
                  onChange={(value) => onSetField('paddingCharacter', value)}
                  options={['0', ' ', '_', '*']}
                  renderOption={(value) =>
                    value === '0'
                      ? '0 - Zero'
                      : value === ' '
                        ? 'Space'
                        : value === '_'
                          ? 'Underscore'
                          : 'Asterisk'
                  }
                  value={form.paddingCharacter}
                />
              </FieldShell>
              <FieldShell label="Alignment Type" required>
                <SelectInput
                  disabled={isLocked('alignmentType')}
                  onChange={(value) => onSetField('alignmentType', value)}
                  options={['Right', 'Left']}
                  value={form.alignmentType}
                />
              </FieldShell>
              <FieldShell label="Separator / Concatenation Character" required>
                <SelectInput
                  disabled={isLocked('separator')}
                  onChange={(value) => onSetField('separator', value)}
                  options={['-', '/', '_', 'Blank']}
                  value={form.separator}
                />
              </FieldShell>
              <FieldShell label="Case Format" required>
                <SelectInput
                  disabled={isLocked('caseFormat')}
                  onChange={(value) => onSetField('caseFormat', value)}
                  options={['Uppercase', 'Lowercase', 'As Entered']}
                  value={form.caseFormat}
                />
              </FieldShell>
            </div>
          </MasterFormAccordionSection>
        ) : null}

        {activeStepId === 'history' ? (
          <MasterFormAccordionSection
            defaultOpen
            state={sectionStateFromSummary(historySummary)}
            summary={<MasterFormSectionSummary items={historySummary} />}
            title="Usage & History"
          >
            {!editingPolicy ? (
              <div className={cn(GLASS_CARD_CLASS, 'rounded-2xl border-dashed px-4 py-6 text-center text-sm text-slate-600 dark:text-slate-300')}>
                Usage history will appear after the policy is saved and activated.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FieldShell label="Used In Code Generation">
                  <div className={cn(GLASS_CARD_CLASS, 'flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-700 dark:text-slate-200')}>
                    <span className={BEACON_CLASS}>
                      <span className="absolute inset-0 rounded-full bg-emerald-400/70 blur-md" />
                    </span>
                    {editingPolicy.usedInCodeGeneration ? 'Yes' : 'No'}
                  </div>
                </FieldShell>
                <FieldShell label="Generated Code Count">
                  <div className={cn(GLASS_CARD_CLASS, 'rounded-xl px-3 py-3 text-sm text-slate-700 dark:text-slate-200')}>
                    <span className="font-mono text-lg font-bold">{editingPolicy.generatedCodeCount.toLocaleString()}</span>
                  </div>
                </FieldShell>
                <FieldShell label="Sample Generated Code">
                  <div className={cn(GLASS_CARD_CLASS, 'rounded-xl px-3 py-3 font-mono text-sm tracking-[0.14em] text-slate-700 dark:text-slate-200')}>
                    {sampleCode}
                  </div>
                </FieldShell>
                <FieldShell label="Deactivation Reason">
                  <div className={cn(GLASS_CARD_CLASS, 'rounded-xl px-3 py-3 text-sm text-slate-700 dark:text-slate-200')}>
                    {editingPolicy.deactivationReason || DEACTIVATION_REASONS_PLACEHOLDER}
                  </div>
                </FieldShell>
              </div>
            )}
          </MasterFormAccordionSection>
        ) : null}
      </div>
    </MasterCreateFormShell>
  );
}
