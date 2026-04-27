import type { PurchaseRequisitionDocument } from './purchaseRequisitionCatalogueData';
import type { CatalogueViewDefinition } from '../utils/catalogueViews';
import type { RecentlyViewedEntry } from '../utils/catalogueViews';

export const PURCHASE_REQUISITION_CATALOGUE_VIEW_ENTITY = 'purchase-requisition';
export const PURCHASE_REQUISITION_ALL_VIEW_ID = 'system-pr-all';

export interface PurchaseRequisitionViewContext {
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

function matchesDatePreset(documentDateTime: string, datePreset: CatalogueViewDefinition['criteria']['datePreset'], now: Date): boolean {
  if (datePreset === 'all') {
    return true;
  }

  const documentDate = new Date(documentDateTime);
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
  document: PurchaseRequisitionDocument,
  view: CatalogueViewDefinition,
  context: PurchaseRequisitionViewContext
): boolean {
  const { criteria } = view;

  if (criteria.ownerScope === 'me' && document.requesterName !== context.currentUserName) {
    return false;
  }

  if (criteria.ownerScope === 'specific' && criteria.ownerName && document.requesterName !== criteria.ownerName) {
    return false;
  }

  if (criteria.statuses.length > 0 && !criteria.statuses.includes(document.status)) {
    return false;
  }

  if (criteria.priorities.length > 0 && !criteria.priorities.includes(document.priority)) {
    return false;
  }

  if (criteria.suppliers.length > 0 && !criteria.suppliers.includes(document.supplierName)) {
    return false;
  }

  if (criteria.branches.length > 0 && !criteria.branches.includes(document.branch)) {
    return false;
  }

  return matchesDatePreset(document.documentDateTime, criteria.datePreset, context.now ?? new Date());
}

export function getPurchaseRequisitionSystemViews(currentUserName: string): CatalogueViewDefinition[] {
  return [
    {
      id: PURCHASE_REQUISITION_ALL_VIEW_ID,
      name: 'All Purchase Requisitions',
      kind: 'system',
      entityKey: PURCHASE_REQUISITION_CATALOGUE_VIEW_ENTITY,
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
      id: 'system-pr-mine',
      name: 'My Purchase Requisitions',
      kind: 'system',
      entityKey: PURCHASE_REQUISITION_CATALOGUE_VIEW_ENTITY,
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
      id: 'system-pr-recent',
      name: 'Recently Viewed',
      kind: 'system',
      entityKey: PURCHASE_REQUISITION_CATALOGUE_VIEW_ENTITY,
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
      id: 'system-pr-today',
      name: 'Today’s Purchase Requisitions',
      kind: 'system',
      entityKey: PURCHASE_REQUISITION_CATALOGUE_VIEW_ENTITY,
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
      id: 'system-pr-pending',
      name: 'Pending Approval',
      kind: 'system',
      entityKey: PURCHASE_REQUISITION_CATALOGUE_VIEW_ENTITY,
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
      id: 'system-pr-draft',
      name: 'Draft',
      kind: 'system',
      entityKey: PURCHASE_REQUISITION_CATALOGUE_VIEW_ENTITY,
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
      id: 'system-pr-approved',
      name: 'Approved',
      kind: 'system',
      entityKey: PURCHASE_REQUISITION_CATALOGUE_VIEW_ENTITY,
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
      id: 'system-pr-rejected',
      name: 'Rejected',
      kind: 'system',
      entityKey: PURCHASE_REQUISITION_CATALOGUE_VIEW_ENTITY,
      criteria: {
        statuses: ['Rejected'],
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

export function filterPurchaseRequisitionDocumentsByView(
  documents: PurchaseRequisitionDocument[],
  view: CatalogueViewDefinition,
  context: PurchaseRequisitionViewContext
): PurchaseRequisitionDocument[] {
  if (view.id === 'system-pr-recent') {
    const orderMap = new Map(
      context.recentlyViewedEntries.map((entry, index) => [entry.documentId, { viewedAt: entry.viewedAt, index }])
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
