import React, { useMemo } from 'react';
import { ArrowRight, Settings2 } from 'lucide-react';
import AppShell from './components/AppShell';
import { formLayoutRegistry } from './formLayoutRegistry';
import { cn } from './utils/classNames';
import { formatDateTime } from './utils/dateFormat';
import { getFormLayoutStatus, type FormLayoutStatus } from './utils/formLayoutConfig';

interface FormLayoutSettingsProps {
  onEditFormLayout: (formId: string) => void;
  onNavigateToDashboard?: () => void;
  onNavigateToPurchaseRequisitionList?: () => void;
}

function formatMetaDate(value?: string) {
  if (!value) {
    return '-';
  }

  const { dateLabel, timeLabel } = formatDateTime(value);
  return `${dateLabel}, ${timeLabel}`;
}

function getStatusTone(status: FormLayoutStatus['status']) {
  if (status === 'Draft') {
    return 'form-layout-settings__status--draft';
  }

  if (status === 'Published') {
    return 'form-layout-settings__status--published';
  }

  return 'form-layout-settings__status--idle';
}

const FormLayoutSettings: React.FC<FormLayoutSettingsProps> = ({
  onEditFormLayout,
  onNavigateToDashboard,
  onNavigateToPurchaseRequisitionList,
}) => {
  const rows = useMemo(
    () =>
      formLayoutRegistry.map((form) => ({
        ...form,
        layoutStatus: form.defaultConfig
          ? getFormLayoutStatus(form.defaultConfig)
          : ({ status: 'Never Configured' } satisfies FormLayoutStatus),
      })),
    []
  );

  return (
    <AppShell
      activeLeaf={null}
      onDashboardClick={onNavigateToDashboard}
      onPurchaseRequisitionClick={onNavigateToPurchaseRequisitionList}
      contentClassName="form-layout-settings-shell"
    >
      <main className="form-layout-settings">
        <section className="form-layout-settings__panel" aria-label="Available create forms">
          <div className="form-layout-settings__panel-header">
            <div>
              <h2>Available create forms</h2>
              <p>Select any registered create form to configure its tabs, sections, fields, and row density.</p>
            </div>
            <span className="form-layout-settings__count">{rows.length} forms</span>
          </div>

          <div className="form-layout-settings__table-wrap">
            <table className="brand-table form-layout-settings__table">
              <thead className="brand-table-head">
                <tr>
                  <th>Form name</th>
                  <th>Module</th>
                  <th>Status</th>
                  <th>Last updated</th>
                  <th>Last published</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((form) => (
                  <tr key={form.id}>
                    <td>
                      <div className="form-layout-settings__form-cell">
                        <Settings2 size={16} aria-hidden="true" />
                        <div>
                          <strong>{form.formName}</strong>
                          <span>{form.configurable ? 'Configurable now' : 'Schema registration pending'}</span>
                        </div>
                      </div>
                    </td>
                    <td>{form.moduleName}</td>
                    <td>
                      <span className={cn('form-layout-settings__status', getStatusTone(form.layoutStatus.status))}>
                        {form.layoutStatus.status}
                      </span>
                    </td>
                    <td>{formatMetaDate(form.layoutStatus.updatedAt)}</td>
                    <td>{formatMetaDate(form.layoutStatus.publishedAt)}</td>
                    <td>
                      <button
                        type="button"
                        className={cn('btn btn--sm', form.configurable ? 'btn--primary' : 'btn--outline')}
                        disabled={!form.configurable}
                        onClick={() => onEditFormLayout(form.id)}
                        title={form.configurable ? 'Edit layout' : 'This form needs a registered layout schema first'}
                      >
                        Edit
                        <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </AppShell>
  );
};

export default FormLayoutSettings;
