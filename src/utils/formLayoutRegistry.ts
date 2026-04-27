import type { FormLayoutConfig, FormLayoutGridColumn } from './formLayoutConfig';

function column(key: string, label: string, options: { locked?: boolean; visible?: boolean } = {}): FormLayoutGridColumn {
  return {
    key,
    label,
    visible: options.visible ?? true,
    locked: options.locked,
  };
}

const PURCHASE_REQUISITION_PRODUCT_COLUMNS = [
  column('action', 'Action', { locked: true }),
  column('productCode', 'Product Code', { locked: true }),
  column('productName', 'Product Name'),
  column('description', 'Description'),
  column('uom', 'UOM', { locked: true }),
  column('priority', 'Priority'),
  column('requirementDate', 'Requirement Date'),
  column('requestedQty', 'Requested Qty.', { locked: true }),
  column('orderedQty', 'Ordered Qty.', { locked: true }),
  column('cancelledQty', 'Cancelled Qty.', { locked: true }),
  column('pendingQty', 'Pending Qty.', { locked: true }),
  column('status', 'Status'),
  column('cancellationReason', 'Cancellation Reason'),
  column('remarks', 'Remarks'),
];

const PURCHASE_ORDER_PRODUCT_COLUMNS = [
  column('action', 'Action', { locked: true }),
  column('productCode', 'Product Code', { locked: true }),
  column('productName', 'Product Name'),
  column('hsnSac', 'HSN/SAC'),
  column('uom', 'UOM', { locked: true }),
  column('priority', 'Priority'),
  column('requirementDate', 'Requirement Date'),
  column('purchaseRate', 'Purchase Rate'),
  column('availableQty', 'Available Qty'),
  column('requestedQty', 'Requested Qty'),
  column('orderQty', 'Order Qty', { locked: true }),
  column('cancelledQty', 'Cancelled Qty'),
  column('receivedQty', 'Received Qty'),
  column('pendingReceiptQty', 'Pending Receipt Qty'),
  column('invoicedQty', 'Invoiced Qty'),
  column('pendingInvoiceQty', 'Pending Invoice Qty'),
  column('discountPercent', 'Discount %'),
  column('discountAmount', 'Discount Amount'),
  column('taxableAmount', 'Taxable Amount'),
  column('taxationColumns', 'Taxation Columns'),
  column('remarks', 'Remarks'),
  column('totalAmount', 'Total Amount', { locked: true }),
];

const PURCHASE_RECEIPT_PRODUCT_COLUMNS = [
  column('action', 'Action', { locked: true }),
  column('productCode', 'Product Code', { locked: true }),
  column('productName', 'Product Name'),
  column('hsnSac', 'HSN/SAC'),
  column('uom', 'UOM', { locked: true }),
  column('priority', 'Priority'),
  column('purchaseRate', 'Purchase Rate'),
  column('orderedQty', 'Ordered Qty'),
  column('previouslyReceivedQty', 'Previously Received Qty'),
  column('supplierInvoiceQty', 'Supplier Invoice Qty'),
  column('receivedQty', 'Received Qty', { locked: true }),
  column('shortageQty', 'Shortage Qty'),
  column('excessQty', 'Excess Qty'),
  column('damageQty', 'Damage Qty'),
  column('damageReason', 'Damage Reason'),
  column('batchNo', 'Batch No'),
  column('serialNo', 'Serial No'),
  column('manufacturingDate', 'Manufacturing Date'),
  column('storageLocation', 'Storage Location'),
  column('boxCount', 'Box Count'),
  column('remarks', 'Remarks'),
  column('attachment', 'Attachment'),
  column('discountPercent', 'Discount %'),
  column('discountAmount', 'Discount Amount'),
  column('taxableAmount', 'Taxable Amount'),
  column('taxColumns', 'Tax Columns'),
  column('totalAmount', 'Total Amount', { locked: true }),
];

const SALE_ORDER_PRODUCT_COLUMNS = [
  column('action', 'Action', { locked: true }),
  column('productCode', 'Product Code', { locked: true }),
  column('productName', 'Product Name'),
  column('hsnSac', 'HSN/SAC'),
  column('uom', 'UOM', { locked: true }),
  column('requestedDate', 'Requested Date'),
  column('fulfillmentDate', 'Fulfillment Date'),
  column('priority', 'Priority'),
  column('rate', 'Rate', { locked: true }),
  column('orderQty', 'Order Qty', { locked: true }),
  column('convertedQty', 'Converted Qty'),
  column('pendingQty', 'Pending Qty'),
  column('baseAmount', 'Base Amount'),
  column('discountPercent', 'Discount %'),
  column('discountAmount', 'Discount Amount'),
  column('taxableAmount', 'Taxable Amount'),
  column('taxationColumn', 'Taxation Column'),
  column('totalAmount', 'Total Amount', { locked: true }),
  column('remark', 'Remark'),
];

const SALE_INVOICE_PRODUCT_COLUMNS = [
  column('action', 'Action', { locked: true }),
  column('productCode', 'Product Code', { locked: true }),
  column('productName', 'Product Name'),
  column('hsnSac', 'HSN/SAC'),
  column('uom', 'UOM'),
  column('rate', 'Rate', { locked: true }),
  column('orderQty', 'Order Qty'),
  column('allocationQty', 'Allocation Qty'),
  column('invoiceQty', 'Invoice Quantity', { locked: true }),
  column('serialNumber', 'Serial Number'),
  column('location', 'Location'),
  column('discountPercent', 'Discount %'),
  column('discountAmount', 'Discount Amount'),
  column('taxableAmount', 'Taxable Amount'),
  column('taxationColumn', 'Taxation Column'),
  column('lineAmount', 'Line Amount', { locked: true }),
  column('remark', 'Remark'),
];

const ALLOCATION_SERIALIZED_COLUMNS = [
  column('productCode', 'Product Code', { locked: true }),
  column('productName', 'Product Name'),
  column('hsnSac', 'HSN/SAC'),
  column('uom', 'UOM'),
  column('orderQty', 'Order Qty', { locked: true }),
  column('allocationReqQty', 'Allocation Req. Qty'),
  column('allocatedQty', 'Allocated Qty'),
  column('allocationQty', 'Allocation Qty', { locked: true }),
  column('priority', 'Priority'),
  column('location', 'Location'),
  column('serialNumber', 'Serial Number'),
  column('requestedAllocationDate', 'Requested Allocation Date'),
  column('remarks', 'Remarks'),
];

const ALLOCATION_NON_SERIALIZED_COLUMNS = [
  column('productCode', 'Product Code', { locked: true }),
  column('productName', 'Product Name'),
  column('hsnSac', 'HSN/SAC'),
  column('uom', 'UOM'),
  column('orderQty', 'Order Qty', { locked: true }),
  column('allocationReqQty', 'Allocation Req. Qty'),
  column('allocatedQty', 'Allocated Qty'),
  column('allocationQty', 'Allocation Qty', { locked: true }),
  column('priority', 'Priority'),
  column('location', 'Location'),
  column('requestedAllocationDate', 'Requested Allocation Date'),
  column('remarks', 'Remarks'),
];

export const PURCHASE_REQUISITION_LAYOUT: FormLayoutConfig = {
  formId: 'purchase-requisition-create',
  version: 2,
  tabs: [
    { id: 'general', label: 'General Details', sectionIds: ['requisition-details'] },
    { id: 'product', label: 'Product Details', sectionIds: ['product-lines'] },
    { id: 'additional', label: 'Additional Details', sectionIds: ['attachments-notes'] },
  ],
  sections: {
    'requisition-details': {
      id: 'requisition-details',
      label: 'Requisition Details',
      fieldsPerRow: 3,
      fieldIds: ['department', 'supplier', 'priority', 'requirementDate', 'validTillDate', 'referenceNumber', 'remarks'],
    },
    'product-lines': {
      id: 'product-lines',
      label: 'Line Details',
      fieldsPerRow: 1,
      fieldIds: ['productGrid'],
    },
    'attachments-notes': {
      id: 'attachments-notes',
      label: 'Attachments And Notes',
      fieldsPerRow: 1,
      fieldIds: ['attachments'],
    },
  },
  grids: {
    productGrid: {
      id: 'productGrid',
      label: 'Product Details Columns',
      columns: PURCHASE_REQUISITION_PRODUCT_COLUMNS,
    },
  },
};

export interface FormLayoutRegistryItem {
  id: string;
  formName: string;
  moduleName: string;
  route: string;
  defaultConfig?: FormLayoutConfig;
  fieldLabels?: Record<string, string>;
  configurable: boolean;
}

export const purchaseRequisitionFieldLabels: Record<string, string> = {
  department: 'Department',
  supplier: 'Supplier',
  priority: 'Priority',
  requirementDate: 'Requirement Date',
  validTillDate: 'Valid Till Date',
  referenceNumber: 'Reference Number',
  remarks: 'Remarks',
  productGrid: 'Product Details Grid',
  attachments: 'Attachments And Notes',
};

function buildLayout(
  formId: string,
  tabs: Array<{ id: string; label: string; sections: Array<{ id: string; label: string; fields: string[]; fieldsPerRow?: number }> }>
): FormLayoutConfig {
  return {
    formId,
    version: 1,
    tabs: tabs.map((tab) => ({
      id: tab.id,
      label: tab.label,
      sectionIds: tab.sections.map((section) => section.id),
    })),
    sections: Object.fromEntries(
      tabs.flatMap((tab) =>
        tab.sections.map((section) => [
          section.id,
          {
            id: section.id,
            label: section.label,
            fieldsPerRow: section.fieldsPerRow ?? 3,
            fieldIds: section.fields,
          },
        ])
      )
    ),
  };
}

function withGrids(
  config: FormLayoutConfig,
  grids: Record<string, { label: string; columns: FormLayoutGridColumn[] }>
): FormLayoutConfig {
  return {
    ...config,
    grids: Object.fromEntries(
      Object.entries(grids).map(([gridId, grid]) => [
        gridId,
        {
          id: gridId,
          label: grid.label,
          columns: grid.columns,
        },
      ])
    ),
  };
}

function labelize(fieldId: string) {
  return fieldId
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace('Hsn', 'HSN')
    .replace('Sac', 'SAC')
    .replace('Uom', 'UOM')
    .replace('Gstin', 'GSTIN')
    .replace('Po', 'PO')
    .replace('Pr', 'PR');
}

function labelsFor(config: FormLayoutConfig, overrides: Record<string, string> = {}) {
  const fieldIds = Object.values(config.sections).flatMap((section) => section.fieldIds);
  return Object.fromEntries(fieldIds.map((fieldId) => [fieldId, overrides[fieldId] ?? labelize(fieldId)]));
}

const PURCHASE_ORDER_LAYOUT = withGrids(buildLayout('purchase-order-create', [
  {
    id: 'general',
    label: 'General Details',
    sections: [
      {
        id: 'po-basic-details',
        label: 'Basic Details',
        fields: ['linkedRequisition', 'supplierName', 'department', 'priority', 'placeOfSupply', 'paymentMode', 'paymentTerms', 'validTillDate'],
        fieldsPerRow: 4,
      },
    ],
  },
  {
    id: 'product',
    label: 'Product Details',
    sections: [{ id: 'po-product-lines', label: 'Product Details', fields: ['productGrid'], fieldsPerRow: 1 }],
  },
  {
    id: 'delivery',
    label: 'Delivery Details',
    sections: [
      {
        id: 'po-shipping-details',
        label: 'Shipping Details',
        fields: ['shipToLocation', 'shippingTerm', 'shippingMethod', 'shippingInstructions'],
        fieldsPerRow: 4,
      },
      {
        id: 'po-insurance-details',
        label: 'Insurance Details',
        fields: ['insuranceProvider', 'contactPerson', 'insuranceType', 'insuranceNumber', 'insuranceAddress'],
        fieldsPerRow: 4,
      },
    ],
  },
]), {
  productGrid: { label: 'Product Details Columns', columns: PURCHASE_ORDER_PRODUCT_COLUMNS },
});

const PURCHASE_RECEIPT_LAYOUT = withGrids(buildLayout('purchase-receipt-create', [
  {
    id: 'general',
    label: 'General Details',
    sections: [
      {
        id: 'receipt-basic-details',
        label: 'Basic Details',
        fields: [
          'supplierName',
          'department',
          'priority',
          'placeOfSupply',
          'receivingLocation',
          'receiveDate',
          'receivedBy',
          'paymentMode',
          'paymentTerm',
          'supplierInvoiceNumber',
          'supplierInvoiceDate',
        ],
        fieldsPerRow: 4,
      },
    ],
  },
  {
    id: 'product',
    label: 'Product Details',
    sections: [{ id: 'receipt-product-lines', label: 'Product Details', fields: ['productGrid'], fieldsPerRow: 1 }],
  },
  {
    id: 'delivery',
    label: 'Delivery Details',
    sections: [
      {
        id: 'receipt-transport-details',
        label: 'Transport Details',
        fields: ['transporterName', 'vehicleNumber', 'lrAwbConsignmentNumber', 'lrAwbDate'],
        fieldsPerRow: 4,
      },
      {
        id: 'receipt-insurance-details',
        label: 'Insurance Details',
        fields: ['insuranceProvider', 'contactPerson', 'insuranceType', 'insuranceNumber', 'insuranceAddress'],
        fieldsPerRow: 4,
      },
    ],
  },
]), {
  productGrid: { label: 'Product Details Columns', columns: PURCHASE_RECEIPT_PRODUCT_COLUMNS },
});

const PURCHASE_INVOICE_LAYOUT = withGrids(buildLayout('purchase-invoice-create', [
  {
    id: 'general',
    label: 'General Details',
    sections: [
      {
        id: 'purchase-invoice-basic-details',
        label: 'Basic Details',
        fields: [
          'supplierName',
          'department',
          'priority',
          'placeOfSupply',
          'receivingLocation',
          'receiveDate',
          'receivedBy',
          'paymentMode',
          'paymentTerm',
          'supplierInvoiceNumber',
          'supplierInvoiceDate',
        ],
        fieldsPerRow: 4,
      },
    ],
  },
  {
    id: 'product',
    label: 'Product Details',
    sections: [{ id: 'purchase-invoice-product-lines', label: 'Product Details', fields: ['productGrid'], fieldsPerRow: 1 }],
  },
]), {
  productGrid: { label: 'Product Details Columns', columns: PURCHASE_RECEIPT_PRODUCT_COLUMNS },
});

const SALE_ORDER_LAYOUT = withGrids(buildLayout('sale-order-create', [
  {
    id: 'customer-order',
    label: 'Customer And Order',
    sections: [
      { id: 'so-customer-details', label: 'Customer Details', fields: ['customerCard'], fieldsPerRow: 1 },
      {
        id: 'so-order-details',
        label: 'Order Details',
        fields: ['orderSource', 'salesExecutive', 'requestedDeliveryDate', 'validTillDate', 'placeOfSupply', 'promisedDeliveryDate', 'priority'],
        fieldsPerRow: 4,
      },
    ],
  },
  {
    id: 'product',
    label: 'Product Details',
    sections: [{ id: 'so-product-lines', label: 'Product Details', fields: ['productGrid'], fieldsPerRow: 1 }],
  },
  {
    id: 'payment-finance',
    label: 'Payment And Finance',
    sections: [
      { id: 'so-payment-details', label: 'Payment Details', fields: ['paymentMode', 'paymentMethod', 'paymentTerm', 'advancePayment', 'paymentRemarks'], fieldsPerRow: 4 },
      {
        id: 'so-finance-details',
        label: 'Finance Details',
        fields: ['financier', 'downPayment', 'financeAmount', 'emiAmount', 'emiInterestRate', 'balanceAmount', 'tenure'],
        fieldsPerRow: 4,
      },
      { id: 'so-insurance-details', label: 'Insurance Details', fields: ['insuranceProvider', 'policyNumber'], fieldsPerRow: 4 },
    ],
  },
  {
    id: 'delivery-shipping',
    label: 'Delivery And Shipping',
    sections: [
      { id: 'so-delivery-details', label: 'Delivery Details', fields: ['deliveryTerm', 'deliveryType', 'deliverySlot', 'deliveryAddress', 'deliveryInstruction'], fieldsPerRow: 4 },
      { id: 'so-shipping-details', label: 'Shipping Details', fields: ['shippingAddress', 'shippingTerm', 'shippingMethod', 'shippingInstructions'], fieldsPerRow: 4 },
    ],
  },
]), {
  productGrid: { label: 'Product Details Columns', columns: SALE_ORDER_PRODUCT_COLUMNS },
});

const SALE_ALLOCATION_REQUISITION_LAYOUT = withGrids(buildLayout('sale-allocation-requisition-create', [
  {
    id: 'general',
    label: 'General Details',
    sections: [
      { id: 'sar-source-details', label: 'Source Details', fields: ['searchSource', 'saleOrderCard', 'customerCard'], fieldsPerRow: 2 },
      { id: 'sar-general-details', label: 'Allocation Details', fields: ['department', 'allocationBy', 'priority', 'warehouse', 'validTillDate'], fieldsPerRow: 4 },
    ],
  },
  {
    id: 'product',
    label: 'Product Details',
    sections: [
      { id: 'sar-serialized-lines', label: 'Serialized', fields: ['serializedGrid'], fieldsPerRow: 1 },
      { id: 'sar-non-serialized-lines', label: 'Non-serialized', fields: ['nonSerializedGrid'], fieldsPerRow: 1 },
    ],
  },
]), {
  serializedGrid: { label: 'Serialized Columns', columns: ALLOCATION_SERIALIZED_COLUMNS },
  nonSerializedGrid: { label: 'Non-serialized Columns', columns: ALLOCATION_NON_SERIALIZED_COLUMNS },
});

const SALE_ALLOCATION_LAYOUT = withGrids(buildLayout('sale-allocation-create', [
  {
    id: 'general',
    label: 'General Details',
    sections: [
      { id: 'sa-source-details', label: 'Source Details', fields: ['searchSource', 'saleOrderCard', 'allocationRequisitionCard', 'customerCard'], fieldsPerRow: 2 },
      { id: 'sa-general-details', label: 'Allocation Details', fields: ['department', 'allocationBy', 'priority', 'warehouse', 'validTillDate'], fieldsPerRow: 4 },
    ],
  },
  {
    id: 'product',
    label: 'Product Details',
    sections: [
      { id: 'sa-serialized-lines', label: 'Serialized', fields: ['serializedGrid'], fieldsPerRow: 1 },
      { id: 'sa-non-serialized-lines', label: 'Non-serialized', fields: ['nonSerializedGrid'], fieldsPerRow: 1 },
    ],
  },
]), {
  serializedGrid: { label: 'Serialized Columns', columns: ALLOCATION_SERIALIZED_COLUMNS },
  nonSerializedGrid: { label: 'Non-serialized Columns', columns: ALLOCATION_NON_SERIALIZED_COLUMNS },
});

const SALE_INVOICE_LAYOUT = withGrids(buildLayout('sale-invoice-create', [
  {
    id: 'general',
    label: 'General Details',
    sections: [
      { id: 'si-source-details', label: 'Source Details', fields: ['searchSource', 'customerCard', 'orderDetailsCard', 'allocationDetailsCard'], fieldsPerRow: 3 },
      { id: 'si-basic-details', label: 'Basic Details', fields: ['placeOfSupply', 'paymentMode', 'paymentMethod'], fieldsPerRow: 4 },
    ],
  },
  {
    id: 'product',
    label: 'Product Details',
    sections: [{ id: 'si-product-lines', label: 'Product Details', fields: ['productGrid'], fieldsPerRow: 1 }],
  },
  {
    id: 'payment',
    label: 'Payment Details',
    sections: [{ id: 'si-payment-details', label: 'Payment Details', fields: ['paymentSummary', 'invoiceRemarks'], fieldsPerRow: 2 }],
  },
]), {
  productGrid: { label: 'Product Details Columns', columns: SALE_INVOICE_PRODUCT_COLUMNS },
});

const DELIVERY_LAYOUT = withGrids(buildLayout('delivery-create', [
  {
    id: 'general',
    label: 'General Details',
    sections: [
      { id: 'delivery-source-details', label: 'Source Details', fields: ['searchSource', 'customerCard', 'orderDetailsCard'], fieldsPerRow: 3 },
      { id: 'delivery-basic-details', label: 'Basic Details', fields: ['deliveryDate', 'deliveredBy', 'deliveryLocation', 'deliveryMethod', 'priority'], fieldsPerRow: 4 },
    ],
  },
  {
    id: 'product',
    label: 'Product Details',
    sections: [{ id: 'delivery-product-lines', label: 'Product Details', fields: ['productGrid'], fieldsPerRow: 1 }],
  },
]), {
  productGrid: { label: 'Product Details Columns', columns: SALE_INVOICE_PRODUCT_COLUMNS },
});

export const formLayoutRegistry: FormLayoutRegistryItem[] = [
  {
    id: 'purchase-requisition-create',
    formName: 'Purchase Requisition Create',
    moduleName: 'Procurement',
    route: '#/purchase-requisition/new',
    defaultConfig: PURCHASE_REQUISITION_LAYOUT,
    fieldLabels: purchaseRequisitionFieldLabels,
    configurable: true,
  },
  {
    id: 'purchase-order-create',
    formName: 'Purchase Order Create',
    moduleName: 'Procurement',
    route: '#/purchase-order/new',
    defaultConfig: PURCHASE_ORDER_LAYOUT,
    fieldLabels: labelsFor(PURCHASE_ORDER_LAYOUT, { productGrid: 'Product Details Grid' }),
    configurable: true,
  },
  {
    id: 'purchase-receipt-create',
    formName: 'Purchase Receipt Create',
    moduleName: 'Procurement',
    route: '#/purchase-receipt/new',
    defaultConfig: PURCHASE_RECEIPT_LAYOUT,
    fieldLabels: labelsFor(PURCHASE_RECEIPT_LAYOUT, { productGrid: 'Product Details Grid' }),
    configurable: true,
  },
  {
    id: 'purchase-invoice-create',
    formName: 'Purchase Invoice Create',
    moduleName: 'Procurement',
    route: '#/purchase-invoice/new',
    defaultConfig: PURCHASE_INVOICE_LAYOUT,
    fieldLabels: labelsFor(PURCHASE_INVOICE_LAYOUT, { productGrid: 'Product Details Grid' }),
    configurable: true,
  },
  {
    id: 'sale-order-create',
    formName: 'Sale Order Create',
    moduleName: 'Sales',
    route: '#/sale-order/new',
    defaultConfig: SALE_ORDER_LAYOUT,
    fieldLabels: labelsFor(SALE_ORDER_LAYOUT, { customerCard: 'Customer Details Card', productGrid: 'Product Details Grid' }),
    configurable: true,
  },
  {
    id: 'sale-allocation-requisition-create',
    formName: 'Sale Allocation Requisition Create',
    moduleName: 'Sales',
    route: '#/sale-allocation-requisition/new',
    defaultConfig: SALE_ALLOCATION_REQUISITION_LAYOUT,
    fieldLabels: labelsFor(SALE_ALLOCATION_REQUISITION_LAYOUT),
    configurable: true,
  },
  {
    id: 'sale-allocation-create',
    formName: 'Sale Allocation Create',
    moduleName: 'Sales',
    route: '#/sale-allocation/new',
    defaultConfig: SALE_ALLOCATION_LAYOUT,
    fieldLabels: labelsFor(SALE_ALLOCATION_LAYOUT),
    configurable: true,
  },
  {
    id: 'sale-invoice-create',
    formName: 'Sale Invoice Create',
    moduleName: 'Sales',
    route: '#/sale-invoice/new',
    defaultConfig: SALE_INVOICE_LAYOUT,
    fieldLabels: labelsFor(SALE_INVOICE_LAYOUT, {
      customerCard: 'Customer Details Card',
      orderDetailsCard: 'Order Details Card',
      allocationDetailsCard: 'Allocation Details Card',
      productGrid: 'Product Details Grid',
    }),
    configurable: true,
  },
  {
    id: 'delivery-create',
    formName: 'Delivery Create',
    moduleName: 'Sales',
    route: '#/delivery/new',
    defaultConfig: DELIVERY_LAYOUT,
    fieldLabels: labelsFor(DELIVERY_LAYOUT, { customerCard: 'Customer Details Card', productGrid: 'Product Details Grid' }),
    configurable: true,
  },
];
