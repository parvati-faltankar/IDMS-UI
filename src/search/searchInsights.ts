import { extendedSaleInvoiceDocuments } from '../pages/sale-invoice/saleInvoiceData';
import { extendedPurchaseOrderDocuments as extendedPurchaseInvoiceDocuments } from '../pages/purchase-invoice/purchaseInvoiceData';

export interface SearchInsightMatch {
  id: string;
  title: string;
  value: string;
  description: string;
  href: string;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[â€™']/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toLocalDateString(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatAmount(value: number) {
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDisplayDate(value: Date) {
  return value.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function parseAmount(value: string | number | null | undefined) {
  const numericValue =
    typeof value === 'number'
      ? value
      : Number.parseFloat(String(value ?? '0').replace(/,/g, ''));

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function isTodayTotalSaleQuery(query: string) {
  const normalizedQuery = normalize(query);
  return /\btoday\b/.test(normalizedQuery) && /\b(total|sum|sales?)\b/.test(normalizedQuery) && /\bsale|sales\b/.test(normalizedQuery);
}

function isTodayTotalPurchaseQuery(query: string) {
  const normalizedQuery = normalize(query);
  return /\btoday\b/.test(normalizedQuery) && /\b(total|sum|purchase|purchases?)\b/.test(normalizedQuery) && /\bpurchase|purchases?\b/.test(normalizedQuery);
}

export function resolveSearchInsight(rawQuery: string, now = new Date()): SearchInsightMatch | null {
  if (!rawQuery.trim()) {
    return null;
  }

  const todayKey = toLocalDateString(now);

  if (isTodayTotalSaleQuery(rawQuery)) {
    const todayInvoices = extendedSaleInvoiceDocuments.filter(
      (document) => toLocalDateString(new Date(document.invoiceDateTime)) === todayKey
    );
    const totalAmount = todayInvoices.reduce((sum, document) => sum + parseAmount(document.totalAmount), 0);

    return {
      id: 'insight-today-total-sale',
      title: "Today's total sale",
      value: formatAmount(totalAmount),
      description:
        todayInvoices.length > 0
          ? `${todayInvoices.length} sale invoice${todayInvoices.length === 1 ? '' : 's'} posted on ${formatDisplayDate(now)}.`
          : `No sale invoices were posted on ${formatDisplayDate(now)}.`,
      href: '#/sale-invoice',
    };
  }

  if (isTodayTotalPurchaseQuery(rawQuery)) {
    const todayInvoices = extendedPurchaseInvoiceDocuments.filter(
      (document) => toLocalDateString(new Date(document.orderDateTime)) === todayKey
    );
    const totalAmount = todayInvoices.reduce((sum, document) => sum + parseAmount(document.totalAmount), 0);

    return {
      id: 'insight-today-total-purchase',
      title: "Today's total purchase",
      value: formatAmount(totalAmount),
      description:
        todayInvoices.length > 0
          ? `${todayInvoices.length} purchase invoice${todayInvoices.length === 1 ? '' : 's'} posted on ${formatDisplayDate(now)}.`
          : `No purchase invoices were posted on ${formatDisplayDate(now)}.`,
      href: '#/purchase-invoice',
    };
  }

  return null;
}
