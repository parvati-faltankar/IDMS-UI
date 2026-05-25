import { formatDate } from '../../utils/dateFormat';
import {
  createPurchaseOrderId,
  createPurchaseOrderNumber,
  createSaleOrderId,
  createSaleOrderNumber,
  getPurchaseOrders,
  getSaleOrders,
  upsertPurchaseOrder,
  upsertSaleOrder,
} from '../../stores/documentStore';
import type { PurchaseOrderDocument } from '../../pages/purchase-order/purchaseOrderData';
import type { SaleOrderDocument } from '../../pages/sale-order/saleOrderData';
import type { DocumentDraft, DocumentType, LineItemDraft, PreviewModel, SearchResultCard } from './types';

interface PartyMaster {
  id: string;
  name: string;
  phone: string;
  gstin: string;
  address: string;
}

interface ProductMaster {
  id: string;
  code: string;
  name: string;
  rate: number;
  taxRate: number;
  taxLabel: string;
}

const customerMaster: PartyMaster[] = [
  { id: 'cust-1', name: 'Galaxy Motors', phone: '+91 98765 41001', gstin: '27AABCG1100R1Z8', address: 'Pune' },
  { id: 'cust-2', name: 'Velocity Auto Hub', phone: '+91 98765 41002', gstin: '07AAECV2210B1Z4', address: 'Delhi' },
  { id: 'cust-3', name: 'Prime Wheels', phone: '+91 98765 41003', gstin: '29AAECP5524N1Z6', address: 'Bengaluru' },
];

const supplierMaster: PartyMaster[] = [
  { id: 'sup-1', name: 'Techsupply Corp', phone: '+91 90000 11111', gstin: '27AAACT1111A1Z1', address: 'Mumbai' },
  { id: 'sup-2', name: 'Apex Industries', phone: '+91 90000 22222', gstin: '27AAAAP2222A1Z2', address: 'Nashik' },
  { id: 'sup-3', name: 'Global Supplies Ltd', phone: '+91 90000 33333', gstin: '27AAAAG3333A1Z3', address: 'Pune' },
];

const productMaster: ProductMaster[] = [
  { id: 'prd-1', code: 'SP-1001', name: 'Front Brake Assembly', rate: 12500, taxRate: 18, taxLabel: 'GST 18%' },
  { id: 'prd-2', code: 'SP-1002', name: 'Clutch Master Cylinder', rate: 8800, taxRate: 18, taxLabel: 'GST 18%' },
  { id: 'prd-3', code: 'P-1001', name: 'Industrial Bearing Assembly', rate: 95, taxRate: 18, taxLabel: 'GST 18%' },
  { id: 'prd-4', code: 'P-1002', name: 'Stainless Steel Fasteners Kit', rate: 235, taxRate: 12, taxLabel: 'GST 12%' },
];

function parseDecimal(value: string | undefined): number {
  const parsed = Number.parseFloat(value ?? '');
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function toCard(party: PartyMaster): SearchResultCard {
  return {
    id: party.id,
    title: party.name,
    subtitle: party.phone,
    description: party.gstin,
    metadata: [
      { label: 'GSTIN', value: party.gstin },
      { label: 'Address', value: party.address },
    ],
  };
}

export const aiDocumentService = {
  searchParty(documentType: DocumentType, query: string): SearchResultCard[] {
    const normalized = query.trim().toLowerCase();
    const source = documentType === 'sale_order' ? customerMaster : supplierMaster;
    return source
      .filter((party) =>
        [party.name, party.phone, party.gstin].some((value) => value.toLowerCase().includes(normalized))
      )
      .map(toCard);
  },

  createInlineParty(documentType: DocumentType, input: string): SearchResultCard {
    const source = documentType === 'sale_order' ? customerMaster : supplierMaster;
    const id = `${documentType}-inline-${Date.now()}`;
    const record: PartyMaster = {
      id,
      name: input,
      phone: 'Not specified',
      gstin: 'Not specified',
      address: 'Not specified',
    };
    source.unshift(record);
    return toCard(record);
  },

  getOpenDocuments(documentType: DocumentType, partyName: string): SearchResultCard[] {
    if (documentType === 'sale_order') {
      return getSaleOrders()
        .filter((document) => document.customerName === partyName && document.status !== 'Cancelled')
        .slice(0, 5)
        .map((document) => ({
          id: document.id,
          title: document.number,
          subtitle: `${formatDate(document.orderDateTime)} | ${document.status}`,
          description: `Amount: Rs ${formatCurrency(parseDecimal(document.totalAmount))}`,
          metadata: [{ label: 'Items', value: String(document.lines.length) }],
        }));
    }

    return getPurchaseOrders()
      .filter((document) => document.supplierName === partyName && document.status !== 'Cancelled')
      .slice(0, 5)
      .map((document) => ({
        id: document.id,
        title: document.number,
        subtitle: `${formatDate(document.orderDateTime)} | ${document.status}`,
        description: `Amount: Rs ${formatCurrency(parseDecimal(document.totalAmount))}`,
        metadata: [{ label: 'Items', value: String(document.lines.length) }],
      }));
  },

  searchProducts(query: string): SearchResultCard[] {
    const normalized = query.trim().toLowerCase();
    return productMaster
      .filter((item) => [item.code, item.name].some((value) => value.toLowerCase().includes(normalized)))
      .map((item) => ({
        id: item.id,
        title: item.name,
        subtitle: item.code,
        description: `Rate Rs ${formatCurrency(item.rate)} | ${item.taxLabel}`,
      }));
  },

  toDraftLine(productId: string, quantity: string): LineItemDraft | undefined {
    const product = productMaster.find((item) => item.id === productId);
    if (!product) {
      return undefined;
    }

    return {
      id: `line-${Date.now()}`,
      code: product.code,
      name: product.name,
      quantity,
      rate: product.rate.toFixed(2),
      discountAmount: '0.00',
      discountPercent: '0.00',
      taxRate: product.taxRate,
      taxLabel: product.taxLabel,
    };
  },

  buildPreview(draft: DocumentDraft): PreviewModel {
    const totalBase = draft.lines.reduce((sum, line) => sum + parseDecimal(line.quantity) * parseDecimal(line.rate), 0);
    const totalDiscount = draft.lines.reduce((sum, line) => sum + parseDecimal(line.discountAmount), 0);
    const taxable = Math.max(totalBase - totalDiscount, 0);
    const totalTax = draft.lines.reduce((sum, line) => {
      const lineTaxable = parseDecimal(line.quantity) * parseDecimal(line.rate) - parseDecimal(line.discountAmount);
      return sum + Math.max(lineTaxable, 0) * ((line.taxRate ?? 0) / 100);
    }, 0);
    const charges = parseDecimal(draft.charges);
    const net = taxable + totalTax + charges;

    return {
      header: [
        { label: draft.documentType === 'sale_order' ? 'Customer' : 'Supplier', value: draft.customerOrSupplier?.title ?? '-' },
        { label: 'Total lines', value: String(draft.lines.length) },
      ],
      lines: draft.lines.map((line) => ({
        label: `${line.name} (${line.code}) x ${line.quantity}`,
        value: `Rs ${formatCurrency(parseDecimal(line.quantity) * parseDecimal(line.rate))}`,
      })),
      totals: [
        { label: 'Base amount', value: `Rs ${formatCurrency(totalBase)}` },
        { label: 'Discount', value: `Rs ${formatCurrency(totalDiscount)}` },
        { label: 'Taxable amount', value: `Rs ${formatCurrency(taxable)}` },
        { label: 'Tax', value: `Rs ${formatCurrency(totalTax)}` },
        { label: 'Charges', value: `Rs ${formatCurrency(charges)}` },
        { label: 'Net amount', value: `Rs ${formatCurrency(net)}` },
      ],
    };
  },

  saveDraft(draft: DocumentDraft): { id: string; number: string; documentType: DocumentType } {
    const preview = this.buildPreview(draft);
    const netRow = preview.totals.find((item) => item.label === 'Net amount');
    const totalAmount = netRow?.value.replace('Rs ', '') ?? '0.00';

    if (draft.documentType === 'sale_order') {
      const id = createSaleOrderId();
      const number = createSaleOrderNumber();
      const document: SaleOrderDocument = {
        id,
        number,
        orderDateTime: new Date().toISOString(),
        customerName: draft.customerOrSupplier?.title ?? 'Unknown customer',
        orderSource: 'AI Drawer',
        salesExecutive: 'Alex Kumar',
        requestedDeliveryDate: '',
        validTillDate: '',
        placeOfSupply: '',
        promisedDeliveryDate: '',
        priority: 'Medium',
        status: 'Draft',
        paymentMode: '',
        paymentMethod: '',
        paymentTerm: '',
        advancePayment: '0.00',
        paymentRemarks: '',
        financer: '',
        downPayment: '0.00',
        financeAmount: '0.00',
        emiAmount: '0.00',
        balanceAmount: '0.00',
        tenure: '',
        emiInterestRate: '0.00',
        deliveryTerm: '',
        deliveryType: '',
        deliverySlot: '',
        deliveryAddress: '',
        deliveryInstruction: '',
        shippingAddress: '',
        shippingTerm: '',
        shippingMethod: '',
        shippingInstructions: '',
        totalAmount,
        insuranceProvider: '',
        policyNumber: '',
        policyDate: '',
        insuranceRemarks: '',
        lines: draft.lines.map((line) => {
          const base = parseDecimal(line.quantity) * parseDecimal(line.rate);
          const discount = parseDecimal(line.discountAmount);
          const taxable = Math.max(base - discount, 0);
          const tax = taxable * ((line.taxRate ?? 0) / 100);
          return {
            productCode: line.code,
            productName: line.name,
            hsnSac: '',
            uom: 'Unit',
            requestedDate: '',
            fulfillmentDate: '',
            priority: 'Medium',
            rate: line.rate,
            orderQuantity: line.quantity,
            baseAmount: base.toFixed(2),
            discountPercent: line.discountPercent ?? '0.00',
            discountAmount: discount.toFixed(2),
            taxableAmount: taxable.toFixed(2),
            taxationColumn: line.taxLabel ?? '',
            lineAmount: (taxable + tax).toFixed(2),
            convertedQuantity: '0.00',
            pendingQuantity: line.quantity,
            status: 'Open',
            remark: draft.notes ?? '',
          };
        }),
      };
      upsertSaleOrder(document);
      return { id, number, documentType: draft.documentType };
    }

    const id = createPurchaseOrderId();
    const number = createPurchaseOrderNumber();
    const document: PurchaseOrderDocument = {
      id,
      number,
      orderDateTime: new Date().toISOString(),
      requisitionNumber: '',
      requisitionDate: new Date().toISOString().slice(0, 10),
      supplierName: draft.customerOrSupplier?.title ?? 'Unknown supplier',
      buyerName: 'Alex Kumar',
      createdBy: 'Alex Kumar',
      createdOn: new Date().toISOString(),
      buyerEmail: '',
      branch: '',
      department: '',
      priority: 'Medium',
      status: 'Draft',
      expectedDeliveryDate: '',
      paymentTerms: '',
      incoterm: '',
      taxableAmount: '0.00',
      totalDiscount: '0.00',
      totalTaxes: '0.00',
      totalAmount,
      currency: 'INR',
      notes: draft.notes ?? '',
      lines: draft.lines.map((line) => ({
        itemCode: line.code,
        itemName: line.name,
        description: '',
        uom: 'Unit',
        quantity: line.quantity,
        unitPrice: line.rate,
        expectedDate: '',
        amount: (parseDecimal(line.quantity) * parseDecimal(line.rate)).toFixed(2),
      })),
    };
    upsertPurchaseOrder(document);
    return { id, number, documentType: draft.documentType };
  },
};
