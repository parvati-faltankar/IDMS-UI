export type CatalogueViewKind = 'system' | 'custom';
export type CatalogueViewDatePreset = 'all' | 'today' | 'this-week' | 'this-month';
export type CatalogueViewOwnerScope = 'all' | 'me' | 'specific';

export interface CatalogueViewCriteria {
  statuses: string[];
  priorities: string[];
  suppliers: string[];
  branches: string[];
  ownerScope: CatalogueViewOwnerScope;
  ownerName: string;
  datePreset: CatalogueViewDatePreset;
}

export interface CatalogueViewSortPreset {
  key: string;
  direction: 'asc' | 'desc';
}

export interface CatalogueViewDefinition {
  id: string;
  name: string;
  kind: CatalogueViewKind;
  entityKey: string;
  criteria: CatalogueViewCriteria;
  sort: CatalogueViewSortPreset | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface EditableCatalogueViewDefinition {
  name: string;
  criteria: CatalogueViewCriteria;
  sort: CatalogueViewSortPreset | null;
}

export interface CatalogueViewState {
  pinnedViewId: string | null;
  lastSelectedViewId: string | null;
}

export interface RecentlyViewedEntry {
  documentId: string;
  viewedAt: string;
}

const CUSTOM_VIEWS_STORAGE_PREFIX = 'catalogue-custom-views:';
const VIEW_STATE_STORAGE_PREFIX = 'catalogue-view-state:';
const RECENTLY_VIEWED_STORAGE_PREFIX = 'catalogue-recently-viewed:';
const MAX_RECENTLY_VIEWED_ITEMS = 20;

function readStoredJson<T>(storageKey: string): T | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    return rawValue ? (JSON.parse(rawValue) as T) : null;
  } catch {
    return null;
  }
}

function writeStoredJson(storageKey: string, value: unknown): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // Ignore storage failures and keep the UI functional.
  }
}

function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0)
    )
  );
}

export function createEmptyCatalogueViewCriteria(): CatalogueViewCriteria {
  return {
    statuses: [],
    priorities: [],
    suppliers: [],
    branches: [],
    ownerScope: 'all',
    ownerName: '',
    datePreset: 'all',
  };
}

export function sanitizeCatalogueViewCriteria(value: Partial<CatalogueViewCriteria> | null | undefined): CatalogueViewCriteria {
  const ownerScope =
    value?.ownerScope === 'me' || value?.ownerScope === 'specific'
      ? value.ownerScope
      : 'all';
  const datePreset =
    value?.datePreset === 'today' ||
    value?.datePreset === 'this-week' ||
    value?.datePreset === 'this-month'
      ? value.datePreset
      : 'all';

  return {
    statuses: sanitizeStringArray(value?.statuses),
    priorities: sanitizeStringArray(value?.priorities),
    suppliers: sanitizeStringArray(value?.suppliers),
    branches: sanitizeStringArray(value?.branches),
    ownerScope,
    ownerName: typeof value?.ownerName === 'string' ? value.ownerName.trim() : '',
    datePreset,
  };
}

function sanitizeCatalogueViewSortPreset(value: Partial<CatalogueViewSortPreset> | null | undefined): CatalogueViewSortPreset | null {
  if (!value || typeof value.key !== 'string' || value.key.trim().length === 0) {
    return null;
  }

  if (value.direction !== 'asc' && value.direction !== 'desc') {
    return null;
  }

  return {
    key: value.key.trim(),
    direction: value.direction,
  };
}

function sanitizeStoredCatalogueView(
  entityKey: string,
  value: Partial<CatalogueViewDefinition> | null | undefined
): CatalogueViewDefinition | null {
  if (!value || typeof value.id !== 'string' || typeof value.name !== 'string') {
    return null;
  }

  const id = value.id.trim();
  const name = value.name.trim();

  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    kind: 'custom',
    entityKey,
    criteria: sanitizeCatalogueViewCriteria(value.criteria),
    sort: sanitizeCatalogueViewSortPreset(value.sort),
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : undefined,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : undefined,
  };
}

export function createCustomCatalogueView(
  entityKey: string,
  definition: EditableCatalogueViewDefinition
): CatalogueViewDefinition {
  const timestamp = new Date().toISOString();

  return {
    id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: definition.name.trim(),
    kind: 'custom',
    entityKey,
    criteria: sanitizeCatalogueViewCriteria(definition.criteria),
    sort: sanitizeCatalogueViewSortPreset(definition.sort),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateCustomCatalogueView(
  view: CatalogueViewDefinition,
  definition: EditableCatalogueViewDefinition
): CatalogueViewDefinition {
  return {
    ...view,
    name: definition.name.trim(),
    criteria: sanitizeCatalogueViewCriteria(definition.criteria),
    sort: sanitizeCatalogueViewSortPreset(definition.sort),
    updatedAt: new Date().toISOString(),
  };
}

export function loadCustomCatalogueViews(entityKey: string): CatalogueViewDefinition[] {
  const rawValue = readStoredJson<Array<Partial<CatalogueViewDefinition>>>(`${CUSTOM_VIEWS_STORAGE_PREFIX}${entityKey}`);
  if (!rawValue) {
    return [];
  }

  return rawValue
    .map((view) => sanitizeStoredCatalogueView(entityKey, view))
    .filter((view): view is CatalogueViewDefinition => Boolean(view));
}

export function saveCustomCatalogueViews(entityKey: string, views: CatalogueViewDefinition[]): void {
  writeStoredJson(
    `${CUSTOM_VIEWS_STORAGE_PREFIX}${entityKey}`,
    views
      .filter((view) => view.kind === 'custom')
      .map((view) => ({
        ...view,
        kind: 'custom',
        entityKey,
      }))
  );
}

export function loadCatalogueViewState(entityKey: string): CatalogueViewState {
  const rawValue = readStoredJson<Partial<CatalogueViewState>>(`${VIEW_STATE_STORAGE_PREFIX}${entityKey}`);

  return {
    pinnedViewId: typeof rawValue?.pinnedViewId === 'string' && rawValue.pinnedViewId.trim().length > 0
      ? rawValue.pinnedViewId
      : null,
    lastSelectedViewId: typeof rawValue?.lastSelectedViewId === 'string' && rawValue.lastSelectedViewId.trim().length > 0
      ? rawValue.lastSelectedViewId
      : null,
  };
}

export function saveCatalogueViewState(entityKey: string, state: CatalogueViewState): void {
  writeStoredJson(`${VIEW_STATE_STORAGE_PREFIX}${entityKey}`, state);
}

export function setPinnedCatalogueViewId(entityKey: string, viewId: string | null): CatalogueViewState {
  const currentState = loadCatalogueViewState(entityKey);
  const nextState = {
    ...currentState,
    pinnedViewId: viewId,
  };
  saveCatalogueViewState(entityKey, nextState);
  return nextState;
}

export function setLastSelectedCatalogueViewId(entityKey: string, viewId: string | null): CatalogueViewState {
  const currentState = loadCatalogueViewState(entityKey);
  const nextState = {
    ...currentState,
    lastSelectedViewId: viewId,
  };
  saveCatalogueViewState(entityKey, nextState);
  return nextState;
}

export function resolveCatalogueViewId(
  views: CatalogueViewDefinition[],
  state: CatalogueViewState,
  fallbackViewId: string
): string {
  const availableViewIds = new Set(views.map((view) => view.id));

  if (state.pinnedViewId && availableViewIds.has(state.pinnedViewId)) {
    return state.pinnedViewId;
  }

  if (state.lastSelectedViewId && availableViewIds.has(state.lastSelectedViewId)) {
    return state.lastSelectedViewId;
  }

  return availableViewIds.has(fallbackViewId) ? fallbackViewId : views[0]?.id ?? fallbackViewId;
}

function sanitizeRecentlyViewedEntries(value: unknown): RecentlyViewedEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .flatMap((item) => {
      if (
        !item ||
        typeof item !== 'object' ||
        typeof (item as RecentlyViewedEntry).documentId !== 'string' ||
        typeof (item as RecentlyViewedEntry).viewedAt !== 'string'
      ) {
        return [];
      }

      const documentId = (item as RecentlyViewedEntry).documentId.trim();
      const viewedAt = (item as RecentlyViewedEntry).viewedAt;

      if (!documentId || Number.isNaN(Date.parse(viewedAt))) {
        return [];
      }

      return [{ documentId, viewedAt }];
    })
    .slice(0, MAX_RECENTLY_VIEWED_ITEMS);
}

export function loadRecentlyViewedEntries(entityKey: string): RecentlyViewedEntry[] {
  return sanitizeRecentlyViewedEntries(
    readStoredJson<RecentlyViewedEntry[]>(`${RECENTLY_VIEWED_STORAGE_PREFIX}${entityKey}`)
  );
}

export function recordRecentlyViewedDocument(entityKey: string, documentId: string): RecentlyViewedEntry[] {
  const timestamp = new Date().toISOString();
  const currentEntries = loadRecentlyViewedEntries(entityKey).filter((entry) => entry.documentId !== documentId);
  const nextEntries = [{ documentId, viewedAt: timestamp }, ...currentEntries].slice(0, MAX_RECENTLY_VIEWED_ITEMS);

  writeStoredJson(`${RECENTLY_VIEWED_STORAGE_PREFIX}${entityKey}`, nextEntries);
  return nextEntries;
}
