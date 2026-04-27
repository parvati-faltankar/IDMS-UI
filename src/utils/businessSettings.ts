import { useEffect, useState } from 'react';

export type DocumentTypeKey =
  | 'purchaseRequisition'
  | 'purchaseOrder'
  | 'purchaseReceipt'
  | 'purchaseInvoice'
  | 'saleOrder'
  | 'saleAllocationRequisition'
  | 'saleAllocation'
  | 'saleInvoice'
  | 'delivery';

export interface DocumentActionSettings {
  allowEdit: boolean;
  allowCancel: boolean;
  allowSubmit: boolean;
  requireApprovalBeforeConversion: boolean;
}

export interface BusinessSettings {
  procurement: {
    purchaseOrder: {
      purchaseRequisitionMandatory: boolean;
      allowMultiplePurchaseRequisitions: boolean;
      allowManualLines: boolean;
    };
    purchaseReceipt: {
      allowPurchaseOrderToReceiptConversion: boolean;
    };
    purchaseInvoice: {
      sourceDocumentRequired: boolean;
      allowManualLines: boolean;
      allowPurchaseRequisitionSource: boolean;
      requireSupplierInvoiceNumber: boolean;
      requireSupplierInvoiceDate: boolean;
    };
    conversions: {
      purchaseRequisitionToPurchaseOrder: boolean;
      purchaseOrderToPurchaseReceipt: boolean;
      purchaseReceiptToPurchaseInvoice: boolean;
      purchaseRequisitionToPurchaseInvoice: boolean;
    };
  };
  actions: Record<DocumentTypeKey, DocumentActionSettings>;
}

const STORAGE_KEY = 'business-settings:v1';
export const BUSINESS_SETTINGS_UPDATED_EVENT = 'business-settings-updated';

const defaultActionSettings: DocumentActionSettings = {
  allowEdit: true,
  allowCancel: true,
  allowSubmit: true,
  requireApprovalBeforeConversion: false,
};

export const defaultBusinessSettings: BusinessSettings = {
  procurement: {
    purchaseOrder: {
      purchaseRequisitionMandatory: false,
      allowMultiplePurchaseRequisitions: true,
      allowManualLines: true,
    },
    purchaseReceipt: {
      allowPurchaseOrderToReceiptConversion: true,
    },
    purchaseInvoice: {
      sourceDocumentRequired: false,
      allowManualLines: true,
      allowPurchaseRequisitionSource: true,
      requireSupplierInvoiceNumber: false,
      requireSupplierInvoiceDate: false,
    },
    conversions: {
      purchaseRequisitionToPurchaseOrder: true,
      purchaseOrderToPurchaseReceipt: true,
      purchaseReceiptToPurchaseInvoice: true,
      purchaseRequisitionToPurchaseInvoice: true,
    },
  },
  actions: {
    purchaseRequisition: { ...defaultActionSettings },
    purchaseOrder: { ...defaultActionSettings },
    purchaseReceipt: { ...defaultActionSettings },
    purchaseInvoice: { ...defaultActionSettings },
    saleOrder: { ...defaultActionSettings },
    saleAllocationRequisition: { ...defaultActionSettings },
    saleAllocation: { ...defaultActionSettings },
    saleInvoice: { ...defaultActionSettings },
    delivery: { ...defaultActionSettings },
  },
};

function sanitizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function sanitizeBusinessSettings(value: Partial<BusinessSettings> | null | undefined): BusinessSettings {
  const source = value ?? {};
  const procurement = (source.procurement ?? {}) as Partial<BusinessSettings['procurement']>;
  const purchaseOrder = (procurement.purchaseOrder ?? {}) as Partial<BusinessSettings['procurement']['purchaseOrder']>;
  const purchaseReceipt = (procurement.purchaseReceipt ?? {}) as Partial<BusinessSettings['procurement']['purchaseReceipt']>;
  const purchaseInvoice = (procurement.purchaseInvoice ?? {}) as Partial<BusinessSettings['procurement']['purchaseInvoice']>;
  const conversions = (procurement.conversions ?? {}) as Partial<BusinessSettings['procurement']['conversions']>;
  const actions = (source.actions ?? {}) as Partial<Record<DocumentTypeKey, Partial<DocumentActionSettings>>>;

  return {
    procurement: {
      purchaseOrder: {
        purchaseRequisitionMandatory: sanitizeBoolean(
          purchaseOrder.purchaseRequisitionMandatory,
          defaultBusinessSettings.procurement.purchaseOrder.purchaseRequisitionMandatory
        ),
        allowMultiplePurchaseRequisitions: sanitizeBoolean(
          purchaseOrder.allowMultiplePurchaseRequisitions,
          defaultBusinessSettings.procurement.purchaseOrder.allowMultiplePurchaseRequisitions
        ),
        allowManualLines: sanitizeBoolean(
          purchaseOrder.allowManualLines,
          defaultBusinessSettings.procurement.purchaseOrder.allowManualLines
        ),
      },
      purchaseReceipt: {
        allowPurchaseOrderToReceiptConversion: sanitizeBoolean(
          purchaseReceipt.allowPurchaseOrderToReceiptConversion,
          defaultBusinessSettings.procurement.purchaseReceipt.allowPurchaseOrderToReceiptConversion
        ),
      },
      purchaseInvoice: {
        sourceDocumentRequired: sanitizeBoolean(
          purchaseInvoice.sourceDocumentRequired,
          defaultBusinessSettings.procurement.purchaseInvoice.sourceDocumentRequired
        ),
        allowManualLines: sanitizeBoolean(
          purchaseInvoice.allowManualLines,
          defaultBusinessSettings.procurement.purchaseInvoice.allowManualLines
        ),
        allowPurchaseRequisitionSource: sanitizeBoolean(
          purchaseInvoice.allowPurchaseRequisitionSource,
          defaultBusinessSettings.procurement.purchaseInvoice.allowPurchaseRequisitionSource
        ),
        requireSupplierInvoiceNumber: sanitizeBoolean(
          purchaseInvoice.requireSupplierInvoiceNumber,
          defaultBusinessSettings.procurement.purchaseInvoice.requireSupplierInvoiceNumber
        ),
        requireSupplierInvoiceDate: sanitizeBoolean(
          purchaseInvoice.requireSupplierInvoiceDate,
          defaultBusinessSettings.procurement.purchaseInvoice.requireSupplierInvoiceDate
        ),
      },
      conversions: {
        purchaseRequisitionToPurchaseOrder: sanitizeBoolean(
          conversions.purchaseRequisitionToPurchaseOrder,
          defaultBusinessSettings.procurement.conversions.purchaseRequisitionToPurchaseOrder
        ),
        purchaseOrderToPurchaseReceipt: sanitizeBoolean(
          conversions.purchaseOrderToPurchaseReceipt,
          defaultBusinessSettings.procurement.conversions.purchaseOrderToPurchaseReceipt
        ),
        purchaseReceiptToPurchaseInvoice: sanitizeBoolean(
          conversions.purchaseReceiptToPurchaseInvoice,
          defaultBusinessSettings.procurement.conversions.purchaseReceiptToPurchaseInvoice
        ),
        purchaseRequisitionToPurchaseInvoice: sanitizeBoolean(
          conversions.purchaseRequisitionToPurchaseInvoice,
          defaultBusinessSettings.procurement.conversions.purchaseRequisitionToPurchaseInvoice
        ),
      },
    },
    actions: Object.fromEntries(
      Object.entries(defaultBusinessSettings.actions).map(([key, defaults]) => {
        const saved = actions[key as DocumentTypeKey] ?? {};
        return [
          key,
          {
            allowEdit: sanitizeBoolean(saved.allowEdit, defaults.allowEdit),
            allowCancel: sanitizeBoolean(saved.allowCancel, defaults.allowCancel),
            allowSubmit: sanitizeBoolean(saved.allowSubmit, defaults.allowSubmit),
            requireApprovalBeforeConversion: sanitizeBoolean(
              saved.requireApprovalBeforeConversion,
              defaults.requireApprovalBeforeConversion
            ),
          },
        ];
      })
    ) as Record<DocumentTypeKey, DocumentActionSettings>,
  };
}

export function loadBusinessSettings(): BusinessSettings {
  if (typeof window === 'undefined') {
    return defaultBusinessSettings;
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    return sanitizeBusinessSettings(rawValue ? JSON.parse(rawValue) : null);
  } catch {
    return defaultBusinessSettings;
  }
}

export function saveBusinessSettings(settings: BusinessSettings): BusinessSettings {
  const sanitized = sanitizeBusinessSettings(settings);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    window.dispatchEvent(new CustomEvent(BUSINESS_SETTINGS_UPDATED_EVENT, { detail: sanitized }));
  }

  return sanitized;
}

export function useBusinessSettings(): BusinessSettings {
  const [settings, setSettings] = useState<BusinessSettings>(() => loadBusinessSettings());

  useEffect(() => {
    const handleSettingsChange = () => setSettings(loadBusinessSettings());

    window.addEventListener(BUSINESS_SETTINGS_UPDATED_EVENT, handleSettingsChange);
    window.addEventListener('storage', handleSettingsChange);

    return () => {
      window.removeEventListener(BUSINESS_SETTINGS_UPDATED_EVENT, handleSettingsChange);
      window.removeEventListener('storage', handleSettingsChange);
    };
  }, []);

  return settings;
}
