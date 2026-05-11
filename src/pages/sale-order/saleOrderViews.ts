import type { SaleOrderDocument } from './saleOrderData';
import type { CatalogueViewDefinition, RecentlyViewedEntry } from '../../utils/catalogueViews';

export const SALE_ORDER_CATALOGUE_VIEW_ENTITY = 'sale-order';
export const SALE_ORDER_ALL_VIEW_ID = 'system-so-all';

export interface SaleOrderViewContext {
  currentUserName: string;
  recentlyViewedEntries: RecentlyViewedEntry[];
  now?: Date;
}

function toLocalDateString(value: Date): string {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekStart(value: Date): Date {
  const date = new Date(value);
  const day = date.getDay();
  const sundayAlignedOffset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + sundayAlignedOffset);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getWeekEnd(value: Date): Date {
  const date = getWeekStart(value);
  date.setDate(date.getDate() + 6);
  date.setHours(23, 59, 59, 999);
  return date;
}

function matchesDatePreset(
  orderDateTime: string,
  datePreset: CatalogueViewDefinition['criteria']['datePreset'],
  now: Date
): boolean {
  if (datePreset === 'all') {
    return true;
  }

  const documentDate = new Date(orderDateTime);
  if (Number.isNaN(documentDate.getTime())) {
    return false;
  }

  if (datePreset === 'today') {
    return toLocalDateString(documentDate) === toLocalDateString(now);
  }

  if (datePreset === 'this-week') {
    const weekStart = getWeekStart(now).getTime();
    const weekEnd = getWeekEnd(now).getTime();
    return documentDate.getTime() >= weekStart && documentDate.getTime() <= weekEnd;
  }

  if (datePreset === 'this-month') {
    return (
      documentDate.getFullYear() === now.getFullYear() &&
      documentDate.getMonth() === now.getMonth()
    );
  }

  return true;
}

function matchesCriteria(
  document: SaleOrderDocument,
  view: CatalogueViewDefinition,
  context: SaleOrderViewContext
): boolean {
  const { criteria } = view;

  if (criteria.ownerScope === 'me' && document.salesExecutive !== context.currentUserName) {
    return false;
  }

  if (
    criteria.ownerScope === 'specific' &&
    criteria.ownerName &&
    document.salesExecutive !== criteria.ownerName
  ) {
    return false;
  }

  if (criteria.statuses.length > 0 && !criteria.statuses.includes(document.status)) {
    return false;
  }

  if (criteria.priorities.length > 0 && !criteria.priorities.includes(document.priority)) {
    return false;
  }

  if (criteria.suppliers.length > 0 && !criteria.suppliers.includes(document.customerName)) {
    return false;
  }

  if (criteria.branches.length > 0 && !criteria.branches.includes(document.orderSource)) {
    return false;
  }

  return matchesDatePreset(document.orderDateTime, criteria.datePreset, context.now ?? new Date());
}

export function getSaleOrderSystemViews(currentUserName: string): CatalogueViewDefinition[] {
  return [
    {
      id: SALE_ORDER_ALL_VIEW_ID,
      name: 'All Sale Orders',
      kind: 'system',
      entityKey: SALE_ORDER_CATALOGUE_VIEW_ENTITY,
      criteria: {
        statuses: [],
        priorities: [],
        suppliers: [],
        branches: [],
        ownerScope: 'all',
        ownerName: '',
        datePreset: 'all',
      },
      sort: null,
    },
    {
      id: 'system-so-mine',
      name: 'My Sale Orders',
      kind: 'system',
      entityKey: SALE_ORDER_CATALOGUE_VIEW_ENTITY,
      criteria: {
        statuses: [],
        priorities: [],
        suppliers: [],
        branches: [],
        ownerScope: 'me',
        ownerName: currentUserName,
        datePreset: 'all',
      },
      sort: null,
    },
    {
      id: 'system-so-recent',
      name: 'Recently Viewed',
      kind: 'system',
      entityKey: SALE_ORDER_CATALOGUE_VIEW_ENTITY,
      criteria: {
        statuses: [],
        priorities: [],
        suppliers: [],
        branches: [],
        ownerScope: 'all',
        ownerName: '',
        datePreset: 'all',
      },
      sort: null,
    },
    {
      id: 'system-so-today',
      name: 'Today’s Sale Orders',
      kind: 'system',
      entityKey: SALE_ORDER_CATALOGUE_VIEW_ENTITY,
      criteria: {
        statuses: [],
        priorities: [],
        suppliers: [],
        branches: [],
        ownerScope: 'all',
        ownerName: '',
        datePreset: 'today',
      },
      sort: null,
    },
    {
      id: 'system-so-pending',
      name: 'Pending Approval',
      kind: 'system',
      entityKey: SALE_ORDER_CATALOGUE_VIEW_ENTITY,
      criteria: {
        statuses: ['Pending Approval'],
        priorities: [],
        suppliers: [],
        branches: [],
        ownerScope: 'all',
        ownerName: '',
        datePreset: 'all',
      },
      sort: null,
    },
    {
      id: 'system-so-draft',
      name: 'Draft',
      kind: 'system',
      entityKey: SALE_ORDER_CATALOGUE_VIEW_ENTITY,
      criteria: {
        statuses: ['Draft'],
        priorities: [],
        suppliers: [],
        branches: [],
        ownerScope: 'all',
        ownerName: '',
        datePreset: 'all',
      },
      sort: null,
    },
    {
      id: 'system-so-approved',
      name: 'Approved',
      kind: 'system',
      entityKey: SALE_ORDER_CATALOGUE_VIEW_ENTITY,
      criteria: {
        statuses: ['Approved'],
        priorities: [],
        suppliers: [],
        branches: [],
        ownerScope: 'all',
        ownerName: '',
        datePreset: 'all',
      },
      sort: null,
    },
    {
      id: 'system-so-cancelled',
      name: 'Cancelled',
      kind: 'system',
      entityKey: SALE_ORDER_CATALOGUE_VIEW_ENTITY,
      criteria: {
        statuses: ['Cancelled'],
        priorities: [],
        suppliers: [],
        branches: [],
        ownerScope: 'all',
        ownerName: '',
        datePreset: 'all',
      },
      sort: null,
    },
  ];
}

export function filterSaleOrdersByView(
  documents: SaleOrderDocument[],
  view: CatalogueViewDefinition,
  context: SaleOrderViewContext
): SaleOrderDocument[] {
  if (view.id === 'system-so-recent') {
    const orderMap = new Map(
      context.recentlyViewedEntries.map((entry, index) => [
        entry.documentId,
        { viewedAt: entry.viewedAt, index },
      ])
    );

    return documents
      .filter((document) => orderMap.has(document.id))
      .sort((left, right) => {
        const leftEntry = orderMap.get(left.id);
        const rightEntry = orderMap.get(right.id);
        if (!leftEntry || !rightEntry) {
          return 0;
        }

        const timeComparison = Date.parse(rightEntry.viewedAt) - Date.parse(leftEntry.viewedAt);
        if (timeComparison !== 0) {
          return timeComparison;
        }

        return leftEntry.index - rightEntry.index;
      });
  }

  return documents.filter((document) => matchesCriteria(document, view, context));
}
