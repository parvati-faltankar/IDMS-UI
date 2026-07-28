export interface SidebarFavoriteItem {
  key: string;
  route: string;
  parentLabel: string;
  labelFallback: string;
  favoritedAt: string;
}

export type SidebarFavoriteItemInput = Omit<SidebarFavoriteItem, 'favoritedAt'>;

const SIDEBAR_FAVORITE_ITEMS_STORAGE_KEY = 'app-sidebar-favorite-items:v1';

export const SIDEBAR_FAVORITE_ITEMS_UPDATED = 'app-sidebar:favorite-items-updated';

function sanitizeFavoriteItem(value: Partial<SidebarFavoriteItem> | null | undefined): SidebarFavoriteItem | null {
  if (!value) {
    return null;
  }

  const key = typeof value.key === 'string' ? value.key.trim() : '';
  const route = typeof value.route === 'string' ? value.route.trim() : '';
  const parentLabel = typeof value.parentLabel === 'string' ? value.parentLabel.trim() : '';
  const labelFallback = typeof value.labelFallback === 'string' ? value.labelFallback.trim() : '';
  const favoritedAt = typeof value.favoritedAt === 'string' ? value.favoritedAt : '';

  if (!key || !route || !parentLabel || !labelFallback || Number.isNaN(Date.parse(favoritedAt))) {
    return null;
  }

  return {
    key,
    route,
    parentLabel,
    labelFallback,
    favoritedAt,
  };
}

function writeSidebarFavoriteItems(entries: SidebarFavoriteItem[]) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(SIDEBAR_FAVORITE_ITEMS_STORAGE_KEY, JSON.stringify(entries));
    window.dispatchEvent(new CustomEvent(SIDEBAR_FAVORITE_ITEMS_UPDATED));
  } catch {
    // Keep navigation usable if browser storage is unavailable.
  }
}

export function loadSidebarFavoriteItems(): SidebarFavoriteItem[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(SIDEBAR_FAVORITE_ITEMS_STORAGE_KEY);
    const parsedValue = rawValue ? (JSON.parse(rawValue) as Array<Partial<SidebarFavoriteItem>>) : [];

    return Array.isArray(parsedValue)
      ? parsedValue
          .map(sanitizeFavoriteItem)
          .filter((entry): entry is SidebarFavoriteItem => Boolean(entry))
      : [];
  } catch {
    return [];
  }
}

export function toggleSidebarFavoriteItem(entry: SidebarFavoriteItemInput): SidebarFavoriteItem[] {
  const currentEntries = loadSidebarFavoriteItems();
  const existingEntry = currentEntries.find((item) => item.key === entry.key && item.parentLabel === entry.parentLabel);

  const nextEntries = existingEntry
    ? currentEntries.filter((item) => item.key !== entry.key || item.parentLabel !== entry.parentLabel)
    : [
        {
          ...entry,
          favoritedAt: new Date().toISOString(),
        },
        ...currentEntries,
      ];

  writeSidebarFavoriteItems(nextEntries);
  return nextEntries;
}
