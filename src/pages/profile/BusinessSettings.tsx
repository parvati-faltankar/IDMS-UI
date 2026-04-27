import React, { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, RotateCcw, Save, Settings2, ShieldCheck, Workflow } from 'lucide-react';
import AppShell from '../../components/common/AppShell';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import { cn } from '../../utils/classNames';
import {
  defaultBusinessSettings,
  loadBusinessSettings,
  saveBusinessSettings,
  type BusinessSettings as BusinessSettingsModel,
  type DocumentTypeKey,
} from '../../utils/businessSettings';

interface BusinessSettingsProps {
  onBack: () => void;
}

const documentRows: Array<{ key: DocumentTypeKey; label: string; helper: string }> = [
  { key: 'purchaseRequisition', label: 'Purchase Requisition', helper: 'Request, approval, edit, and cancellation behavior.' },
  { key: 'purchaseOrder', label: 'Purchase Order', helper: 'Ordering workflow, source rules, and allowed actions.' },
  { key: 'purchaseReceipt', label: 'Purchase Receipt', helper: 'Receiving workflow and conversion permissions.' },
  { key: 'purchaseInvoice', label: 'Purchase Invoice', helper: 'Invoice create, edit, approval, and cancellation behavior.' },
  { key: 'saleOrder', label: 'Sale Order', helper: 'Customer order edit, submit, and cancel behavior.' },
  { key: 'saleAllocationRequisition', label: 'Sale Allocation Requisition', helper: 'Allocation request workflow actions.' },
  { key: 'saleAllocation', label: 'Sale Allocation', helper: 'Allocation edit and cancellation controls.' },
  { key: 'saleInvoice', label: 'Sale Invoice', helper: 'Sales invoice action permissions.' },
  { key: 'delivery', label: 'Delivery', helper: 'Delivery edit and cancel behavior.' },
];

function cloneSettings(settings: BusinessSettingsModel): BusinessSettingsModel {
  return JSON.parse(JSON.stringify(settings)) as BusinessSettingsModel;
}

function SwitchField({
  label,
  helper,
  checked,
  onChange,
  warning,
}: {
  label: string;
  helper: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  warning?: string;
}) {
  return (
    <label className="business-settings__setting">
      <span className="business-settings__setting-copy">
        <span className="business-settings__setting-label">{label}</span>
        <span className="business-settings__setting-helper">{helper}</span>
        {warning && <span className="business-settings__validation">{warning}</span>}
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="business-settings__switch" aria-hidden="true" />
    </label>
  );
}

const BusinessSettings: React.FC<BusinessSettingsProps> = ({ onBack }) => {
  const [savedSettings, setSavedSettings] = useState<BusinessSettingsModel>(() => loadBusinessSettings());
  const [draftSettings, setDraftSettings] = useState<BusinessSettingsModel>(() => loadBusinessSettings());
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const hasChanges = useMemo(
    () => JSON.stringify(savedSettings) !== JSON.stringify(draftSettings),
    [draftSettings, savedSettings]
  );
  const invoiceSettings = draftSettings.procurement.purchaseInvoice;
  const purchaseOrderSettings = draftSettings.procurement.purchaseOrder;
  const conversionSettings = draftSettings.procurement.conversions;
  const invoiceSourceError =
    invoiceSettings.sourceDocumentRequired && !invoiceSettings.allowPurchaseRequisitionSource
      ? 'Enable at least one source document when invoice source is mandatory.'
      : '';
  const canSave = !invoiceSourceError && hasChanges;

  const updateDraft = (updater: (current: BusinessSettingsModel) => void) => {
    setDraftSettings((current) => {
      const next = cloneSettings(current);
      updater(next);
      return next;
    });
    setSaveMessage('');
  };

  const handleSave = () => {
    if (!canSave) {
      return;
    }

    setIsSaveConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    const nextSaved = saveBusinessSettings(draftSettings);
    setSavedSettings(nextSaved);
    setDraftSettings(nextSaved);
    setIsSaveConfirmOpen(false);
    setSaveMessage('Business settings saved. Document screens will use these rules immediately.');
  };

  return (
    <AppShell activeLeaf={null} contentClassName="business-settings-shell">
      <main className="business-settings">
        <section className="business-settings__hero">
          <button type="button" className="page-back-button" onClick={onBack} aria-label="Back to form layout settings">
            <ArrowLeft size={18} />
          </button>
          <div className="business-settings__hero-copy">
            <span className="business-settings__eyebrow">
              <Settings2 size={15} />
              Business Settings
            </span>
            <h1 className="brand-page-title business-settings__title">Control document workflows</h1>
            <p className="business-settings__subtitle">
              Configure source requirements, conversions, and document actions. Defaults preserve today&apos;s behavior until you save changes.
            </p>
          </div>
          <div className="business-settings__hero-actions">
            {saveMessage && (
              <span className="business-settings__save-message">
                <CheckCircle2 size={15} />
                {saveMessage}
              </span>
            )}
            <button
              type="button"
              className="btn btn--outline btn--icon-left"
              disabled={!hasChanges}
              onClick={() => {
                setDraftSettings(savedSettings);
                setSaveMessage('');
              }}
            >
              <RotateCcw size={15} />
              Cancel
            </button>
            <button type="button" className="btn btn--primary btn--icon-left" disabled={!canSave} onClick={handleSave}>
              <Save size={15} />
              Save
            </button>
          </div>
        </section>

        <section className="business-settings__grid">
          <div className="business-settings__panel">
            <div className="business-settings__panel-head">
              <Workflow size={18} />
              <div>
                <h2>Procurement Workflow</h2>
                <p>Rules that actively guide create screens and conversions.</p>
              </div>
            </div>

            <div className="business-settings__setting-list">
              <SwitchField
                label="Purchase Requisition mandatory for Purchase Order"
                helper="When enabled, a purchase order cannot be saved without selecting at least one PR."
                checked={purchaseOrderSettings.purchaseRequisitionMandatory}
                onChange={(checked) =>
                  updateDraft((next) => {
                    next.procurement.purchaseOrder.purchaseRequisitionMandatory = checked;
                    if (checked) {
                      next.procurement.conversions.purchaseRequisitionToPurchaseOrder = true;
                    }
                  })
                }
              />
              <SwitchField
                label="Allow multiple PRs in one Purchase Order"
                helper="Controls whether users can select more than one purchase requisition while creating a PO."
                checked={purchaseOrderSettings.allowMultiplePurchaseRequisitions}
                onChange={(checked) =>
                  updateDraft((next) => {
                    next.procurement.purchaseOrder.allowMultiplePurchaseRequisitions = checked;
                  })
                }
              />
              <SwitchField
                label="Allow manual PO lines"
                helper="When disabled, PO lines must come from selected requisitions."
                checked={purchaseOrderSettings.allowManualLines}
                onChange={(checked) =>
                  updateDraft((next) => {
                    next.procurement.purchaseOrder.allowManualLines = checked;
                  })
                }
              />
              <SwitchField
                label="Allow PR to PO conversion"
                helper="Controls whether PRs can be used as source documents for purchase orders."
                checked={conversionSettings.purchaseRequisitionToPurchaseOrder}
                onChange={(checked) =>
                  updateDraft((next) => {
                    next.procurement.conversions.purchaseRequisitionToPurchaseOrder = checked;
                    if (!checked) {
                      next.procurement.purchaseOrder.purchaseRequisitionMandatory = false;
                    }
                  })
                }
              />
              <SwitchField
                label="Allow PO to Receipt conversion"
                helper="Controls whether purchase orders can be selected as source documents for receipts."
                checked={conversionSettings.purchaseOrderToPurchaseReceipt}
                onChange={(checked) =>
                  updateDraft((next) => {
                    next.procurement.conversions.purchaseOrderToPurchaseReceipt = checked;
                    next.procurement.purchaseReceipt.allowPurchaseOrderToReceiptConversion = checked;
                  })
                }
              />
              <SwitchField
                label="Allow Receipt to Invoice conversion"
                helper="Controls receipt-to-invoice conversion availability for invoice workflows."
                checked={conversionSettings.purchaseReceiptToPurchaseInvoice}
                onChange={(checked) =>
                  updateDraft((next) => {
                    next.procurement.conversions.purchaseReceiptToPurchaseInvoice = checked;
                  })
                }
              />
              <SwitchField
                label="Allow PR as Purchase Invoice source"
                helper="Controls the source-document picker currently used on purchase invoice creation."
                checked={invoiceSettings.allowPurchaseRequisitionSource}
                warning={invoiceSourceError}
                onChange={(checked) =>
                  updateDraft((next) => {
                    next.procurement.purchaseInvoice.allowPurchaseRequisitionSource = checked;
                    next.procurement.conversions.purchaseRequisitionToPurchaseInvoice = checked;
                  })
                }
              />
            </div>
          </div>

          <div className="business-settings__panel">
            <div className="business-settings__panel-head">
              <ShieldCheck size={18} />
              <div>
                <h2>Invoice Rules</h2>
                <p>Validation and create behavior for purchase invoices.</p>
              </div>
            </div>

            <div className="business-settings__setting-list">
              <SwitchField
                label="Source document mandatory"
                helper="When enabled, users must select a configured source before saving an invoice."
                checked={invoiceSettings.sourceDocumentRequired}
                warning={invoiceSourceError}
                onChange={(checked) =>
                  updateDraft((next) => {
                    next.procurement.purchaseInvoice.sourceDocumentRequired = checked;
                  })
                }
              />
              <SwitchField
                label="Allow manual invoice lines"
                helper="When disabled, invoice lines must be created from the selected source document."
                checked={invoiceSettings.allowManualLines}
                onChange={(checked) =>
                  updateDraft((next) => {
                    next.procurement.purchaseInvoice.allowManualLines = checked;
                  })
                }
              />
              <SwitchField
                label="Supplier invoice number required"
                helper="Adds validation to the purchase invoice create screen."
                checked={invoiceSettings.requireSupplierInvoiceNumber}
                onChange={(checked) =>
                  updateDraft((next) => {
                    next.procurement.purchaseInvoice.requireSupplierInvoiceNumber = checked;
                  })
                }
              />
              <SwitchField
                label="Supplier invoice date required"
                helper="Adds validation to the purchase invoice create screen."
                checked={invoiceSettings.requireSupplierInvoiceDate}
                onChange={(checked) =>
                  updateDraft((next) => {
                    next.procurement.purchaseInvoice.requireSupplierInvoiceDate = checked;
                  })
                }
              />
            </div>
          </div>

          <div className="business-settings__panel business-settings__panel--wide">
            <div className="business-settings__panel-head">
              <ShieldCheck size={18} />
              <div>
                <h2>Document Actions</h2>
                <p>Edit, cancel, submit, and approval-gate permissions across catalogues and create flows.</p>
              </div>
            </div>
            <div className="business-settings__action-table-wrap">
              <table className="business-settings__action-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Edit</th>
                    <th>Cancel</th>
                    <th>Submit</th>
                    <th>Approval before conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {documentRows.map((row) => {
                    const actionSettings = draftSettings.actions[row.key];

                    return (
                      <tr key={row.key}>
                        <td>
                          <strong>{row.label}</strong>
                          <span>{row.helper}</span>
                        </td>
                        {(['allowEdit', 'allowCancel', 'allowSubmit', 'requireApprovalBeforeConversion'] as const).map((field) => (
                          <td key={field}>
                            <label className="business-settings__compact-switch">
                              <input
                                type="checkbox"
                                checked={actionSettings[field]}
                                onChange={(event) =>
                                  updateDraft((next) => {
                                    next.actions[row.key][field] = event.target.checked;
                                  })
                                }
                              />
                              <span aria-hidden="true" />
                            </label>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <div className={cn('business-settings__defaults-note', hasChanges && 'business-settings__defaults-note--active')}>
          No saved change affects documents until you confirm Save. Use Cancel to return to the last saved configuration.
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => {
              setDraftSettings(defaultBusinessSettings);
              setSaveMessage('');
            }}
          >
            Restore safe defaults
          </button>
        </div>
      </main>

      <ConfirmationDialog
        isOpen={isSaveConfirmOpen}
        title="Apply workflow settings?"
        description="These settings will immediately control document create screens, conversions, validations, and allowed actions."
        confirmLabel="Apply settings"
        cancelLabel="Review"
        onConfirm={handleConfirmSave}
        onClose={() => setIsSaveConfirmOpen(false)}
      />
    </AppShell>
  );
};

export default BusinessSettings;
