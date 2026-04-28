export const paths = {
  home: '/purchase-requisition',
  brandGuidelines: '/brand-guidelines',
  businessSettings: '/profile/business-settings',
  themeBuilder: '/profile/theme-builder',
  formLayoutSettings: '/profile/form-layout',
  formLayoutEditor: '/profile/form-layout/edit',
  purchaseRequisitionList: '/purchase-requisition',
  purchaseRequisitionCreate: '/purchase-requisition/new',
  purchaseOrderList: '/purchase-order',
  purchaseOrderCreate: '/purchase-order/new',
  purchaseReceiptList: '/purchasereceiptlist',
  purchaseReceiptCreate: '/purchase-receipt/new',
  purchaseInvoiceList: '/purchaseinvoicelist',
  purchaseInvoiceCreate: '/purchase-invoice/new',
  saleOrderList: '/sale-order',
  saleOrderCreate: '/sale-order/new',
  saleAllocationRequisitionList: '/sale-allocation-requisition',
  saleAllocationRequisitionCreate: '/sale-allocation-requisition/new',
  saleAllocationList: '/sale-allocation',
  saleAllocationCreate: '/sale-allocation/new',
  saleInvoiceList: '/sale-invoice',
  saleInvoiceCreate: '/sale-invoice/new',
  deliveryList: '/delivery',
  deliveryCreate: '/delivery/new',
} as const;

export type LegacyRedirect = {
  path: string;
  preserveSearch?: boolean;
  to: string;
};

export const legacyRedirects: LegacyRedirect[] = [
  { path: '/profile/form-layout-editor', to: paths.formLayoutEditor, preserveSearch: true },
  { path: '/create-purchase-requisition', to: paths.purchaseRequisitionCreate },
  { path: '/create-purchase-order', to: paths.purchaseOrderCreate },
  { path: '/create-purchase-receipt', to: paths.purchaseReceiptCreate },
  { path: '/create-purchase-invoice', to: paths.purchaseInvoiceCreate },
  { path: '/create-sale-order', to: paths.saleOrderCreate },
  { path: '/create-sale-allocation-requisition', to: paths.saleAllocationRequisitionCreate },
  { path: '/create-sale-allocation', to: paths.saleAllocationCreate },
  { path: '/create-sale-invoice', to: paths.saleInvoiceCreate },
  { path: '/create-delivery', to: paths.deliveryCreate },
  { path: '/purchaseorderlist', to: paths.purchaseOrderList },
  { path: '/purchase-receipt', to: paths.purchaseReceiptList },
  { path: '/purchase-invoice', to: paths.purchaseInvoiceList },
  { path: '/saleorderlist', to: paths.saleOrderList },
  { path: '/saleallocationrequisitionlist', to: paths.saleAllocationRequisitionList },
  { path: '/saleallocationlist', to: paths.saleAllocationList },
  { path: '/saleinvoicelist', to: paths.saleInvoiceList },
  { path: '/deliverylist', to: paths.deliveryList },
  { path: '/purchaserequistionlistview', to: paths.purchaseRequisitionList },
];
