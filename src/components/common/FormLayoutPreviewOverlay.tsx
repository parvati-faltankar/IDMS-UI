import React, { useMemo, useState } from 'react';
import { CheckCircle2, Eye, X } from 'lucide-react';
import { cn } from '../../utils/classNames';
import {
  getVisibleGridColumns,
  type FormLayoutConfig,
  type FormLayoutGridColumn,
} from '../../utils/formLayoutConfig';

interface FormLayoutPreviewOverlayProps {
  isOpen: boolean;
  config: FormLayoutConfig;
  formName: string;
  fieldLabels?: Record<string, string>;
  fieldValues?: Record<string, React.ReactNode>;
  onClose: () => void;
  onPublish: () => boolean | void;
}

const FormLayoutPreviewOverlay: React.FC<FormLayoutPreviewOverlayProps> = ({
  isOpen,
  config,
  formName,
  fieldLabels = {},
  fieldValues = {},
  onClose,
  onPublish,
}) => {
  const [activeTab, setActiveTab] = useState(config.tabs[0]?.id ?? '');

  const currentTab = useMemo(
    () => config.tabs.find((tab) => tab.id === activeTab) ?? config.tabs[0],
    [activeTab, config.tabs]
  );

  if (!isOpen) {
    return null;
  }

  const handlePublish = () => {
    const didPublish = onPublish();
    if (didPublish !== false) {
      onClose();
    }
  };

  const getFieldValue = (fieldId: string) => {
    if (fieldValues[fieldId] !== undefined && fieldValues[fieldId] !== null && fieldValues[fieldId] !== '') {
      return fieldValues[fieldId];
    }

    return 'Configured field';
  };

  const getSampleCellValue = (column: FormLayoutGridColumn, rowIndex: number) => {
    const sampleValues: Record<string, string[]> = {
      action: ['-', '-'],
      productCode: ['P-1001', 'P-1002'],
      productName: ['Industrial Bearing Assembly', 'Steel Fastener Kit'],
      description: ['Precision grade assembly', 'M10 to M20 fasteners'],
      hsnSac: ['8482', '7318'],
      uom: ['Unit', 'Box'],
      priority: ['High', 'Medium'],
      requirementDate: ['Mar 15, 2025', 'Mar 18, 2025'],
      requestedQty: ['150.00', '500.00'],
      orderedQty: ['0.00', '0.00'],
      cancelledQty: ['0.00', '0.00'],
      pendingQty: ['150.00', '500.00'],
      orderQty: ['24.00', '18.00'],
      invoiceQty: ['24.00', '18.00'],
      allocationQty: ['1.00', '1.00'],
      allocatedQty: ['0.00', '0.00'],
      rate: ['180.00', '265.00'],
      purchaseRate: ['180.00', '265.00'],
      amount: ['27,000.00', '47,700.00'],
      lineAmount: ['27,000.00', '47,700.00'],
      totalAmount: ['27,000.00', '47,700.00'],
      status: ['Open', 'Open'],
      remarks: ['Preview line', 'Preview line'],
    };

    return sampleValues[column.key]?.[rowIndex] ?? (column.locked ? 'Required' : '-');
  };

  const renderGridPreview = (fieldId: string) => {
    const grid = config.grids?.[fieldId];
    if (!grid) {
      return null;
    }

    const visibleColumns = getVisibleGridColumns(config, grid.id);

    return (
      <div className="form-layout-preview__grid-card">
        <div className="form-layout-preview__grid-card-header">
          <div>
            <strong>{grid.label}</strong>
            <span>{visibleColumns.length} visible columns in published sequence</span>
          </div>
          <span className="form-layout-preview__readonly-pill">Read only</span>
        </div>
        <div className="form-layout-preview__table-wrap">
          <table className="form-layout-preview__table">
            <thead>
              <tr>
                {visibleColumns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[0, 1].map((rowIndex) => (
                <tr key={rowIndex}>
                  {visibleColumns.map((column) => (
                    <td key={column.key}>
                      <span className="form-layout-preview__sample-value">
                        {getSampleCellValue(column, rowIndex)}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPreviewField = (fieldId: string) => {
    const gridPreview = renderGridPreview(fieldId);
    if (gridPreview) {
      return gridPreview;
    }

    return (
      <div className="form-layout-preview__field">
        <span className="form-layout-preview__field-label">{fieldLabels[fieldId] ?? fieldId}</span>
        <strong className="form-layout-preview__field-value">{getFieldValue(fieldId)}</strong>
      </div>
    );
  };

  return (
    <div className="form-layout-preview">
      <button type="button" className="form-layout-preview__backdrop" onClick={onClose} aria-label="Close preview" />
      <aside className="form-layout-preview__panel" role="dialog" aria-modal="true" aria-label={`${formName} layout preview`}>
        <div className="form-layout-preview__header">
          <div className="form-layout-preview__title-group">
            <span className="form-layout-preview__icon">
              <Eye size={16} aria-hidden="true" />
            </span>
            <div>
              <h2>{formName}</h2>
            </div>
          </div>
          <div className="form-layout-preview__actions">
            <button type="button" className="btn btn--outline btn--sm" onClick={onClose}>
              <X size={14} aria-hidden="true" />
              Close
            </button>
            <button type="button" className="btn btn--primary btn--sm" onClick={handlePublish}>
              <CheckCircle2 size={14} aria-hidden="true" />
              Publish
            </button>
          </div>
        </div>

        <div className="form-layout-preview__body">
          <div className="form-layout-preview__tabs">
            <div className="create-pr-tabs__list" role="tablist" aria-label={`${formName} preview tabs`}>
              {config.tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={currentTab?.id === tab.id}
                  className={cn('create-pr-tab', currentTab?.id === tab.id ? 'create-pr-tab--active' : 'create-pr-tab--inactive')}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="create-pr-tab__label">{tab.label}</span>
                  <span className="form-layout-preview__tab-count">
                    {tab.sectionIds.reduce((count, sectionId) => count + (config.sections[sectionId]?.fieldIds.length ?? 0), 0)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-layout-preview__sections">
            {currentTab?.sectionIds.map((sectionId) => {
              const section = config.sections[sectionId];
              if (!section) {
                return null;
              }

              return (
                <section
                  key={section.id}
                  className="form-layout-preview__section"
                  style={{ '--form-layout-columns': section.fieldsPerRow ?? 3 } as React.CSSProperties}
                >
                  <div className="form-layout-preview__section-header">
                    <h3>{section.label}</h3>
                    <span>{section.fieldIds.length} fields</span>
                  </div>
                  <div className="form-layout-preview__field-grid">
                    {section.fieldIds.map((fieldId) => (
                      <div
                        key={fieldId}
                        className={cn(
                          ['productGrid', 'attachments', 'serializedGrid', 'nonSerializedGrid'].includes(fieldId) &&
                            'form-layout-preview__field-shell--wide'
                      )}
                      >
                        {renderPreviewField(fieldId)}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default FormLayoutPreviewOverlay;
