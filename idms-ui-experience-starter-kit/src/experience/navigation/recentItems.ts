import type { NavigationItem } from "./navigationTypes";

const RECENT_ITEMS_KEY = "experience:recent-navigation-items:v1";

export function getRecentItems(): NavigationItem[] {
  try {
    const raw = localStorage.getItem(RECENT_ITEMS_KEY);
    return raw ? (JSON.parse(raw) as NavigationItem[]) : [];
  } catch {
    return [];
  }
}

export function recordRecentItem(item: NavigationItem, limit = 8): void {
  const existing = getRecentItems().filter((recent) => recent.id !== item.id);
  const next = [item, ...existing].slice(0, limit);
  localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(next));
}

export function clearRecentItems(): void {
  localStorage.removeItem(RECENT_ITEMS_KEY);
}
