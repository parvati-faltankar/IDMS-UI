const FAVORITES_KEY = 'admin-favorites:v1';
const RECENT_KEY = 'admin-recent:v1';
const MAX_RECENT = 10;

export interface RecentMasterEntry {
  key: string;
  label: string;
  path: string;
  groupLabel: string;
  groupIconBg: string;
  groupIconColor: string;
  visitedAt: string;
}

export function loadAdminFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveAdminFavorites(keys: string[]): void {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(keys));
}

export function toggleAdminFavorite(key: string): string[] {
  const favorites = loadAdminFavorites();
  const updated = favorites.includes(key)
    ? favorites.filter((k) => k !== key)
    : [key, ...favorites];
  saveAdminFavorites(updated);
  return updated;
}

export function loadRecentAdminMasters(): RecentMasterEntry[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as RecentMasterEntry[]) : [];
  } catch {
    return [];
  }
}

export function recordRecentAdminMaster(entry: Omit<RecentMasterEntry, 'visitedAt'>): RecentMasterEntry[] {
  const recents = loadRecentAdminMasters().filter((r) => r.key !== entry.key);
  const updated = [{ ...entry, visitedAt: new Date().toISOString() }, ...recents].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  return updated;
}
