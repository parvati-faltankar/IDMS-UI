const FAVORITES_KEY = "experience:favorites:v1";

export function getFavoriteIds(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteId(id: string): string[] {
  const existing = getFavoriteIds();
  const next = existing.includes(id)
    ? existing.filter((item) => item !== id)
    : [id, ...existing];
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return next;
}
