export type SortDirection = 'asc' | 'desc';
export type SortState<TKey extends string> = { key: TKey; direction: SortDirection } | null;

export function getNextSortState<TKey extends string>(
  current: SortState<TKey>,
  key: TKey
): SortState<TKey> {
  if (!current || current.key !== key) {
    return { key, direction: 'asc' };
  }

  if (current.direction === 'asc') {
    return { key, direction: 'desc' };
  }

  return null;
}
