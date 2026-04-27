import {
  globalSearchEntityLabels,
  searchGlobalRecords,
  type GlobalSearchEntity,
  type GlobalSearchGroup,
  type GlobalSearchResult,
} from './globalSearch';
import { parseVoiceCommand, resolveVoiceCommand } from './voiceCommand';
import { resolveSearchInsight, type SearchInsightMatch } from './searchInsights';

export type SearchScopeId = 'all' | GlobalSearchEntity | 'procurement' | 'sales' | 'form-layout';

export interface SearchScopeOption {
  id: SearchScopeId;
  label: string;
  kind: 'all' | 'entity' | 'module';
  route?: string;
}

export interface SearchRecentEntry {
  id: string;
  query: string;
  scopeId: SearchScopeId;
  usedAt: string;
}

export interface SearchModuleShortcut {
  id: string;
  label: string;
  description: string;
  href: string;
  scopeId?: SearchScopeId;
  icon:
    | 'procurement'
    | 'sales'
    | 'purchase-requisition'
    | 'purchase-order'
    | 'purchase-receipt'
    | 'purchase-invoice'
    | 'sale-order'
    | 'sale-invoice'
    | 'sale-allocation'
    | 'delivery'
    | 'form-layout';
}

export interface SearchCommandPreview {
  title: string;
  description: string;
  href: string;
}

export interface SearchExperienceResolution {
  query: string;
  groups: GlobalSearchGroup[];
  flatResults: GlobalSearchResult[];
  insight: SearchInsightMatch | null;
  commandPreview: SearchCommandPreview | null;
  hasQuery: boolean;
}

const RECENT_SEARCHES_STORAGE_KEY = 'global-search-recent';
const MAX_RECENT_SEARCHES = 8;

const procurementEntities: GlobalSearchEntity[] = [
  'purchase-requisition',
  'purchase-order',
  'purchase-receipt',
  'purchase-invoice',
];

const salesEntities: GlobalSearchEntity[] = [
  'sale-order',
  'sale-allocation-requisition',
  'sale-allocation',
  'sale-invoice',
  'delivery',
];

export const searchScopeOptions: SearchScopeOption[] = [
  { id: 'all', label: 'All', kind: 'all' },
  { id: 'purchase-requisition', label: globalSearchEntityLabels['purchase-requisition'], kind: 'entity' },
  { id: 'purchase-order', label: globalSearchEntityLabels['purchase-order'], kind: 'entity' },
  { id: 'purchase-receipt', label: globalSearchEntityLabels['purchase-receipt'], kind: 'entity' },
  { id: 'purchase-invoice', label: globalSearchEntityLabels['purchase-invoice'], kind: 'entity' },
  { id: 'sale-order', label: globalSearchEntityLabels['sale-order'], kind: 'entity' },
  { id: 'sale-allocation-requisition', label: globalSearchEntityLabels['sale-allocation-requisition'], kind: 'entity' },
  { id: 'sale-allocation', label: globalSearchEntityLabels['sale-allocation'], kind: 'entity' },
  { id: 'sale-invoice', label: globalSearchEntityLabels['sale-invoice'], kind: 'entity' },
  { id: 'delivery', label: globalSearchEntityLabels.delivery, kind: 'entity' },
  { id: 'procurement', label: 'Procurement', kind: 'module', route: '#/purchase-requisition' },
  { id: 'sales', label: 'Sales', kind: 'module', route: '#/sale-order' },
  { id: 'form-layout', label: 'Form Layout', kind: 'module', route: '#/profile/form-layout' },
];

export const searchModuleShortcuts: SearchModuleShortcut[] = [
  {
    id: 'shortcut-purchase-requisition',
    label: 'Purchase Requisition',
    description: 'Open the requisition catalogue',
    href: '#/purchase-requisition',
    scopeId: 'purchase-requisition',
    icon: 'purchase-requisition',
  },
  {
    id: 'shortcut-purchase-order',
    label: 'Purchase Order',
    description: 'Open the purchase order catalogue',
    href: '#/purchase-order',
    scopeId: 'purchase-order',
    icon: 'purchase-order',
  },
  {
    id: 'shortcut-purchase-receipt',
    label: 'Purchase Receipt',
    description: 'Open the purchase receipt catalogue',
    href: '#/purchase-receipt',
    scopeId: 'purchase-receipt',
    icon: 'purchase-receipt',
  },
  {
    id: 'shortcut-purchase-invoice',
    label: 'Purchase Invoice',
    description: 'Open the purchase invoice catalogue',
    href: '#/purchase-invoice',
    scopeId: 'purchase-invoice',
    icon: 'purchase-invoice',
  },
  {
    id: 'shortcut-sale-order',
    label: 'Sale Order',
    description: 'Open the sale order catalogue',
    href: '#/sale-order',
    scopeId: 'sale-order',
    icon: 'sale-order',
  },
  {
    id: 'shortcut-sale-invoice',
    label: 'Sale Invoice',
    description: 'Open the sale invoice catalogue',
    href: '#/sale-invoice',
    scopeId: 'sale-invoice',
    icon: 'sale-invoice',
  },
  {
    id: 'shortcut-sale-allocation',
    label: 'Sale Allocation',
    description: 'Open the allocation catalogue',
    href: '#/sale-allocation',
    scopeId: 'sale-allocation',
    icon: 'sale-allocation',
  },
  {
    id: 'shortcut-delivery',
    label: 'Delivery',
    description: 'Open the delivery catalogue',
    href: '#/delivery',
    scopeId: 'delivery',
    icon: 'delivery',
  },
  {
    id: 'shortcut-procurement',
    label: 'Procurement',
    description: 'Go to the procurement workspace',
    href: '#/purchase-requisition',
    scopeId: 'procurement',
    icon: 'procurement',
  },
  {
    id: 'shortcut-sales',
    label: 'Sales',
    description: 'Go to the sales workspace',
    href: '#/sale-order',
    scopeId: 'sales',
    icon: 'sales',
  },
  {
    id: 'shortcut-form-layout',
    label: 'Form Layout',
    description: 'Configure create-screen layouts',
    href: '#/profile/form-layout',
    scopeId: 'form-layout',
    icon: 'form-layout',
  },
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[â€™']/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function readRecentSearches() {
  if (typeof window === 'undefined') {
    return [] as SearchRecentEntry[];
  }

  try {
    const rawValue = window.localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
    if (!rawValue) {
      return [] as SearchRecentEntry[];
    }

    const parsedValue = JSON.parse(rawValue) as Array<Partial<SearchRecentEntry>>;

    return parsedValue.flatMap((entry) => {
      if (
        typeof entry?.query !== 'string' ||
        typeof entry?.scopeId !== 'string' ||
        typeof entry?.usedAt !== 'string'
      ) {
        return [];
      }

      const scopeOption = searchScopeOptions.find((option) => option.id === entry.scopeId);
      if (!scopeOption) {
        return [];
      }

      return [
        {
          id: `${normalize(entry.query)}-${entry.scopeId}`,
          query: entry.query,
          scopeId: entry.scopeId as SearchScopeId,
          usedAt: entry.usedAt,
        },
      ];
    });
  } catch {
    return [] as SearchRecentEntry[];
  }
}

function writeRecentSearches(entries: SearchRecentEntry[]) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore storage failures
  }
}

export function loadRecentSearches(): SearchRecentEntry[] {
  return readRecentSearches();
}

export function recordRecentSearch(query: string, scopeId: SearchScopeId): SearchRecentEntry[] {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return loadRecentSearches();
  }

  const entryId = `${normalize(trimmedQuery)}-${scopeId}`;
  const nextEntries = [
    {
      id: entryId,
      query: trimmedQuery,
      scopeId,
      usedAt: new Date().toISOString(),
    },
    ...loadRecentSearches().filter((entry) => entry.id !== entryId),
  ].slice(0, MAX_RECENT_SEARCHES);

  writeRecentSearches(nextEntries);
  return nextEntries;
}

export function getSearchScopeLabel(scopeId: SearchScopeId) {
  return searchScopeOptions.find((option) => option.id === scopeId)?.label ?? 'All';
}

export function getScopeEntities(scopeId: SearchScopeId): GlobalSearchEntity[] | undefined {
  if (scopeId === 'all') {
    return undefined;
  }

  if (scopeId === 'form-layout') {
    return [];
  }

  if (scopeId === 'procurement') {
    return procurementEntities;
  }

  if (scopeId === 'sales') {
    return salesEntities;
  }

  return [scopeId];
}

function hasCommandCue(query: string) {
  return /\b(open|go to|navigate|create|new|show|find|today|latest|recent)\b/i.test(query);
}

export function resolveSearchExperience(query: string, scopeId: SearchScopeId): SearchExperienceResolution {
  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;
  const scopeOption = searchScopeOptions.find((option) => option.id === scopeId);
  const insight = hasQuery ? resolveSearchInsight(trimmedQuery) : null;
  const parsedIntent = hasQuery ? parseVoiceCommand(trimmedQuery) : null;
  const scopedEntities = getScopeEntities(scopeId);
  const intentEntities =
    scopeId === 'all' && parsedIntent?.entity ? [parsedIntent.entity] : scopedEntities;
  const searchQuery =
    hasQuery && parsedIntent?.subject
      ? parsedIntent.subject
      : trimmedQuery;
  const groups =
    hasQuery && searchQuery && (!intentEntities || intentEntities.length > 0)
      ? searchGlobalRecords(searchQuery, 24, intentEntities ? { entities: intentEntities } : undefined)
      : [];
  const flatResults = groups.flatMap((group) => group.results);
  const commandPreviewFromQuery =
    hasQuery && hasCommandCue(trimmedQuery)
      ? (() => {
          const resolution = resolveVoiceCommand(trimmedQuery);
          if (resolution.kind !== 'navigate') {
            return null;
          }

          return {
            title: resolution.intent.action === 'create' ? 'Quick action' : 'Direct navigation',
            description: resolution.message,
            href: resolution.href,
          } satisfies SearchCommandPreview;
        })()
      : null;
  const moduleScopePreview =
    hasQuery && !commandPreviewFromQuery && scopeOption?.kind === 'module' && scopeOption.route
      ? {
          title: scopeOption.label,
          description: `Open the ${scopeOption.label} workspace.`,
          href: scopeOption.route,
        }
      : null;
  const commandPreview = commandPreviewFromQuery ?? moduleScopePreview;

  return {
    query: searchQuery,
    groups,
    flatResults,
    insight,
    commandPreview,
    hasQuery,
  };
}
