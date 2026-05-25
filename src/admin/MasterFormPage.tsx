import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Save,
  X,
} from 'lucide-react';
import AdminShell from './AdminShell';
import { findGroupForMasterKey, findMasterByKey } from './adminNavConfig';
import { cn } from '../utils/classNames';
import { AdminPageShell } from '../experience/components/AdminPageShell';
import { HelpDrawer } from '../experience/components/HelpDrawer';
import { getHelpTopic } from '../experience/help/helpTopics';

// ─── Form tabs config ─────────────────────────────────────────────────────────

const FORM_TABS = ['Basic Information', 'Additional Details', 'Configuration', 'Notes'];

// ─── Component ────────────────────────────────────────────────────────────────

const MasterFormPage: React.FC = () => {
  const { masterKey = '', recordId } = useParams<{ masterKey: string; recordId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const master = findMasterByKey(masterKey);
  const group = findGroupForMasterKey(masterKey);

  const isView = searchParams.get('mode') === 'view';
  const isEdit = recordId !== undefined && recordId !== 'new' && searchParams.get('mode') !== 'view';
  const isCreate = recordId === 'new' || recordId === undefined;

  const [activeTab, setActiveTab] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpTopicId, setHelpTopicId] = useState('generic-master-form');

  // Generic form state
  const [formData, setFormData] = useState({
    code: isCreate ? '' : `${masterKey.split('-')[0].toUpperCase()}-001`,
    name: isCreate ? '' : 'Sample Record',
    shortName: isCreate ? '' : 'SR',
    description: isCreate ? '' : 'This is a sample description for the master record.',
    status: 'Active',
    sortOrder: isCreate ? '' : '1',
    remarks: '',
    externalCode: '',
    parentCode: '',
    effectiveFrom: isCreate ? '' : '01 Jan 2024',
    effectiveTo: '',
  });

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = (andNew = false, andClose = false) => {
    setIsSaving(true);
    window.setTimeout(() => {
      setIsSaving(false);
      setIsDirty(false);
      setShowSaveSuccess(true);
      window.setTimeout(() => setShowSaveSuccess(false), 3000);
      if (andNew) {
        navigate(`/admin/master/${masterKey}/new`);
      } else if (andClose) {
        navigate(`/admin/master/${masterKey}`);
      }
    }, 600);
  };

  const handleCancel = () => {
    navigate(`/admin/master/${masterKey}`);
  };

  if (!master || !group) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Master not found</div>
            <button type="button" onClick={() => navigate('/admin')} className="text-sm underline" style={{ color: 'var(--color-primary)' }}>
              Back to Admin Dashboard
            </button>
          </div>
        </div>
      </AdminShell>
    );
  }

  const pageTitle = isView
    ? `View ${master.label}`
    : isEdit
      ? `Edit ${master.label}`
      : `New ${master.label}`;

  return (
    <AdminShell>
      <AdminPageShell
        title={pageTitle}
        description={isCreate ? `Create a new ${master.label} record` : master.description}
        breadcrumbs={['Admin', group.label, master.label]}
        statusLabel={isDirty ? 'Unsaved changes' : showSaveSuccess ? 'Saved' : undefined}
        statusTone={isDirty ? 'warning' : 'active'}
        primaryAction={isView ? { label: 'Edit', tone: 'primary', onClick: () => navigate(`/admin/master/${masterKey}/${recordId}?mode=edit`) } : undefined}
        secondaryActions={!isView ? [{ label: 'Cancel', tone: 'ghost', onClick: handleCancel }] : []}
        helpTopicId="generic-master-form"
        onHelpClick={(id) => { setHelpTopicId(id); setHelpOpen(true); }}
      >
        {/* ── Tabs ─────────────────────────────────────────────────── */}
        <div
          className="border-b overflow-x-auto mb-6"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', margin: '0 -24px 24px', padding: '0 24px' }}
        >
          <div className="flex gap-0">
            {FORM_TABS.map((tab, idx) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={cn(
                  'px-4 py-3 text-sm font-medium transition-all border-b-2 whitespace-nowrap',
                  activeTab === idx
                    ? 'border-current'
                    : 'border-transparent hover:bg-gray-50'
                )}
                style={activeTab === idx
                  ? { color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }
                  : { color: 'var(--color-text-muted)' }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ── Form Body ─────────────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto">

            {activeTab === 0 && (
              <FormSection title="Basic Information" description="Enter the core details for this master record.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Code"
                    hint="Auto-generated if left blank"
                    value={formData.code}
                    onChange={(v) => updateField('code', v)}
                    disabled={isView}
                    placeholder="e.g. CU-001"
                  />
                  <FormField
                    label="Name"
                    required
                    value={formData.name}
                    onChange={(v) => updateField('name', v)}
                    disabled={isView}
                    placeholder={`Enter ${master.label} name`}
                  />
                  <FormField
                    label="Short Name"
                    value={formData.shortName}
                    onChange={(v) => updateField('shortName', v)}
                    disabled={isView}
                    placeholder="Abbreviation"
                  />
                  <FormField
                    label="Status"
                    type="select"
                    value={formData.status}
                    onChange={(v) => updateField('status', v)}
                    disabled={isView}
                    options={['Active', 'Inactive', 'Draft']}
                  />
                  <div className="sm:col-span-2">
                    <FormField
                      label="Description"
                      type="textarea"
                      value={formData.description}
                      onChange={(v) => updateField('description', v)}
                      disabled={isView}
                      placeholder="Brief description of this record"
                    />
                  </div>
                </div>
              </FormSection>
            )}

            {activeTab === 1 && (
              <FormSection title="Additional Details" description="Optional configuration details for this master.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Sort Order"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(v) => updateField('sortOrder', v)}
                    disabled={isView}
                    placeholder="e.g. 1"
                  />
                  <FormField
                    label="External Code"
                    value={formData.externalCode}
                    onChange={(v) => updateField('externalCode', v)}
                    disabled={isView}
                    placeholder="Integration reference code"
                  />
                  <FormField
                    label="Parent Code"
                    value={formData.parentCode}
                    onChange={(v) => updateField('parentCode', v)}
                    disabled={isView}
                    placeholder="Parent record code (if any)"
                  />
                </div>
              </FormSection>
            )}

            {activeTab === 2 && (
              <FormSection title="Configuration" description="Define the active period and operational settings.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Effective From"
                    type="date"
                    value={formData.effectiveFrom}
                    onChange={(v) => updateField('effectiveFrom', v)}
                    disabled={isView}
                  />
                  <FormField
                    label="Effective To"
                    type="date"
                    value={formData.effectiveTo}
                    onChange={(v) => updateField('effectiveTo', v)}
                    disabled={isView}
                    hint="Leave blank for no end date"
                  />
                </div>
                <div
                  className="mt-4 p-4 rounded-xl border"
                  style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}
                >
                  <p className="text-sm" style={{ color: '#92400E' }}>
                    <strong>Note:</strong> If Effective To date is set, the record will automatically become inactive after that date.
                  </p>
                </div>
              </FormSection>
            )}

            {activeTab === 3 && (
              <FormSection title="Notes & Remarks" description="Internal notes visible only to administrators.">
                <FormField
                  label="Remarks"
                  type="textarea"
                  value={formData.remarks}
                  onChange={(v) => updateField('remarks', v)}
                  disabled={isView}
                  placeholder="Add any internal notes or remarks here…"
                  rows={6}
                />
              </FormSection>
            )}

            {/* Bottom action bar */}
            {!isView && (
              <div className="flex items-center justify-end gap-2 pt-6 mt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium transition-all hover:bg-gray-50"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  <X size={14} />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(false, false)}
                  className="px-4 py-2 rounded-lg border text-sm font-medium transition-all"
                  style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                >
                  Save Draft
                </button>
                {isCreate && (
                  <button
                    type="button"
                    onClick={() => handleSave(true, false)}
                    className="px-4 py-2 rounded-lg border text-sm font-medium transition-all"
                    style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                  >
                    Save & New
                  </button>
                )}
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSave(false, true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-70"
                  style={{ background: 'var(--color-primary)', color: 'white' }}
                >
                  <Save size={14} />
                  {isSaving ? 'Saving…' : 'Save & Close'}
                </button>
              </div>
            )}
          </div>
      </AdminPageShell>
      <HelpDrawer
        open={helpOpen}
        topic={getHelpTopic(helpTopicId)}
        onClose={() => setHelpOpen(false)}
        onTopicChange={(id) => setHelpTopicId(id)}
      />
    </AdminShell>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface FormSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({ title, description, children }) => (
  <div
    className="rounded-xl border p-6 mb-4"
    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
  >
    <div className="mb-5">
      <div role="heading" aria-level={2} className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{title}</div>
      <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{description}</p>
    </div>
    {children}
  </div>
);

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'select' | 'date' | 'number';
  options?: string[];
  rows?: number;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  required,
  disabled,
  hint,
  placeholder,
  type = 'text',
  options,
  rows = 3,
}) => {
  const inputStyle = {
    background: disabled ? 'var(--color-surface-subtle)' : 'var(--color-surface)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text)',
  };

  const baseClass = 'w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all';
  const focusStyle = disabled ? '' : 'focus:ring-2 focus:ring-offset-0';

  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5">
        <span style={{ color: 'var(--color-text)' }}>{label}</span>
        {required && <span className="ml-0.5" style={{ color: 'var(--color-danger)' }}>*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          rows={rows}
          className={cn(baseClass, focusStyle, 'resize-none')}
          style={inputStyle}
        />
      ) : type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(baseClass, focusStyle, 'cursor-pointer')}
          style={inputStyle}
        >
          {options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <input
          type={type === 'date' ? 'date' : type === 'number' ? 'number' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(baseClass, focusStyle)}
          style={inputStyle}
        />
      )}
      {hint && (
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{hint}</p>
      )}
    </div>
  );
};

export default MasterFormPage;
