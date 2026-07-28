export interface SidebarRecentDocument {
  documentId: string;
  documentNumber: string;
  moduleKey: string;
  moduleLabel: string;
  partyLabel: string;
  status: string;
  route: string;
  viewedAt: string;
}

export type SidebarRecentDocumentInput = Omit<SidebarRecentDocument, 'viewedAt'>;

const SIDEBAR_RECENT_DOCUMENTS_STORAGE_KEY = 'app-sidebar-recent-documents:v1';
const MAX_SIDEBAR_RECENT_DOCUMENTS = 5;

export const SIDEBAR_RECENT_DOCUMENTS_UPDATED = 'app-sidebar:recent-documents-updated';

function sanitizeRecentDocument(value: Partial<SidebarRecentDocument> | null | undefined): SidebarRecentDocument | null {
  if (!value) {
    return null;
  }

  const documentId = typeof value.documentId === 'string' ? value.documentId.trim() : '';
  const documentNumber = typeof value.documentNumber === 'string' ? value.documentNumber.trim() : '';
  const moduleKey = typeof value.moduleKey === 'string' ? value.moduleKey.trim() : '';
  const moduleLabel = typeof value.moduleLabel === 'string' ? value.moduleLabel.trim() : '';
  const partyLabel = typeof value.partyLabel === 'string' ? value.partyLabel.trim() : '';
  const status = typeof value.status === 'string' ? value.status.trim() : '';
  const route = typeof value.route === 'string' ? value.route.trim() : '';
  const viewedAt = typeof value.viewedAt === 'string' ? value.viewedAt : '';

  if (!documentId || !documentNumber || !moduleKey || !moduleLabel || !route || Number.isNaN(Date.parse(viewedAt))) {
    return null;
  }

  return {
    documentId,
    documentNumber,
    moduleKey,
    moduleLabel,
    partyLabel,
    status,
    route,
    viewedAt,
  };
}

function writeSidebarRecentDocuments(entries: SidebarRecentDocument[]) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(SIDEBAR_RECENT_DOCUMENTS_STORAGE_KEY, JSON.stringify(entries));
    window.dispatchEvent(new CustomEvent(SIDEBAR_RECENT_DOCUMENTS_UPDATED));
  } catch {
    // Keep navigation usable if browser storage is unavailable.
  }
}

export function loadSidebarRecentDocuments(): SidebarRecentDocument[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(SIDEBAR_RECENT_DOCUMENTS_STORAGE_KEY);
    const parsedValue = rawValue ? (JSON.parse(rawValue) as Array<Partial<SidebarRecentDocument>>) : [];

    return Array.isArray(parsedValue)
      ? parsedValue
          .map(sanitizeRecentDocument)
          .filter((entry): entry is SidebarRecentDocument => Boolean(entry))
          .slice(0, MAX_SIDEBAR_RECENT_DOCUMENTS)
      : [];
  } catch {
    return [];
  }
}

export function recordSidebarRecentDocument(entry: SidebarRecentDocumentInput): SidebarRecentDocument[] {
  const nextEntry: SidebarRecentDocument = {
    ...entry,
    viewedAt: new Date().toISOString(),
  };
  const currentEntries = loadSidebarRecentDocuments().filter(
    (item) => item.moduleKey !== nextEntry.moduleKey || item.documentId !== nextEntry.documentId
  );
  const nextEntries = [nextEntry, ...currentEntries].slice(0, MAX_SIDEBAR_RECENT_DOCUMENTS);

  writeSidebarRecentDocuments(nextEntries);
  return nextEntries;
}
export function removeSidebarRecentDocument(moduleKey: string, documentId: string): SidebarRecentDocument[] {
  const normalizedModuleKey = moduleKey.trim();
  const normalizedDocumentId = documentId.trim();
  const nextEntries = loadSidebarRecentDocuments().filter(
    (item) => item.moduleKey !== normalizedModuleKey || item.documentId !== normalizedDocumentId
  );

  writeSidebarRecentDocuments(nextEntries);
  return nextEntries;
}
