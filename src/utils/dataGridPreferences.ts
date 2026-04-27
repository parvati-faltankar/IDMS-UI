import type {
  DataGridColumn,
  DataGridDensity,
  DataGridPinState,
  DataGridStoredPreferences,
} from '../components/common/dataGridTypes';

const STORAGE_PREFIX = 'catalogue-grid-preferences:';
const STORAGE_VERSION = 1;

function createDefaultPreferences<TData>(
  columns: DataGridColumn<TData>[],
  density: DataGridDensity
): DataGridStoredPreferences {
  const columnOrder = columns.map((column) => column.id);
  const pinnedLeftColumnIds = columns
    .filter((column) => column.defaultPin === 'left')
    .map((column) => column.id);
  const pinnedRightColumnIds = columns
    .filter((column) => column.defaultPin === 'right')
    .map((column) => column.id);
  const columnWidths = Object.fromEntries(
    columns
      .filter((column) => typeof column.width === 'number')
      .map((column) => [column.id, column.width as number])
  );

  return {
    version: STORAGE_VERSION,
    columnOrder,
    hiddenColumnIds: [],
    pinnedLeftColumnIds,
    pinnedRightColumnIds,
    columnWidths,
    columnFilters: {},
    groupByColumnId: null,
    density,
  };
}

export function loadDataGridPreferences<TData>(
  gridId: string,
  columns: DataGridColumn<TData>[],
  density: DataGridDensity
): DataGridStoredPreferences {
  const defaults = createDefaultPreferences(columns, density);
  if (typeof window === 'undefined') {
    return defaults;
  }

  try {
    const rawValue = window.localStorage.getItem(`${STORAGE_PREFIX}${gridId}`);
    if (!rawValue) {
      return defaults;
    }

    const parsedValue = JSON.parse(rawValue) as Partial<DataGridStoredPreferences>;
    return sanitizeDataGridPreferences(parsedValue, columns, density);
  } catch {
    return defaults;
  }
}

export function saveDataGridPreferences(gridId: string, preferences: DataGridStoredPreferences): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(`${STORAGE_PREFIX}${gridId}`, JSON.stringify(preferences));
}

export function resetDataGridPreferences(gridId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(`${STORAGE_PREFIX}${gridId}`);
}

export function sanitizeDataGridPreferences<TData>(
  storedPreferences: Partial<DataGridStoredPreferences> | null | undefined,
  columns: DataGridColumn<TData>[],
  density: DataGridDensity
): DataGridStoredPreferences {
  const defaults = createDefaultPreferences(columns, density);
  const columnMap = new Map(columns.map((column) => [column.id, column]));
  const seenColumnIds = new Set<string>();
  const columnOrder = (storedPreferences?.columnOrder ?? [])
    .filter((columnId) => {
      if (!columnMap.has(columnId) || seenColumnIds.has(columnId)) {
        return false;
      }

      seenColumnIds.add(columnId);
      return true;
    });

  columns.forEach((column) => {
    if (!seenColumnIds.has(column.id)) {
      columnOrder.push(column.id);
      seenColumnIds.add(column.id);
    }
  });

  const hiddenColumnIds = (storedPreferences?.hiddenColumnIds ?? []).filter((columnId) => {
    const column = columnMap.get(columnId);
    return Boolean(column && !column.locked && column.hideable !== false);
  });

  const pinnedLeftColumnIds = normalizePinnedColumnIds(storedPreferences?.pinnedLeftColumnIds ?? [], columnMap);
  const pinnedRightColumnIds = normalizePinnedColumnIds(storedPreferences?.pinnedRightColumnIds ?? [], columnMap)
    .filter((columnId) => !pinnedLeftColumnIds.includes(columnId));

  const columnWidths = Object.fromEntries(
    Object.entries(storedPreferences?.columnWidths ?? {}).flatMap(([columnId, value]) => {
      const column = columnMap.get(columnId);
      const numericValue = Number(value);
      if (!column || !Number.isFinite(numericValue)) {
        return [];
      }

      const minWidth = column.minWidth ?? 120;
      const maxWidth = column.maxWidth ?? 420;
      return [[columnId, Math.max(minWidth, Math.min(maxWidth, Math.round(numericValue)))]];
    })
  );

  const groupByColumnId =
    storedPreferences?.groupByColumnId && columnMap.get(storedPreferences.groupByColumnId)?.groupable !== false
      ? storedPreferences.groupByColumnId
      : null;

  return {
    version: STORAGE_VERSION,
    columnOrder,
    hiddenColumnIds,
    pinnedLeftColumnIds,
    pinnedRightColumnIds,
    columnWidths,
    columnFilters: storedPreferences?.columnFilters ?? {},
    groupByColumnId,
    density: storedPreferences?.density === 'comfortable' ? 'comfortable' : defaults.density,
    chartPreset: storedPreferences?.chartPreset,
  };
}

export function setColumnPinState(
  preferences: DataGridStoredPreferences,
  columnId: string,
  pinState: DataGridPinState
): DataGridStoredPreferences {
  const nextLeft = preferences.pinnedLeftColumnIds.filter((item) => item !== columnId);
  const nextRight = preferences.pinnedRightColumnIds.filter((item) => item !== columnId);

  if (pinState === 'left') {
    nextLeft.push(columnId);
  }

  if (pinState === 'right') {
    nextRight.push(columnId);
  }

  return {
    ...preferences,
    pinnedLeftColumnIds: nextLeft,
    pinnedRightColumnIds: nextRight,
  };
}

function normalizePinnedColumnIds<TData>(
  columnIds: string[],
  columnMap: Map<string, DataGridColumn<TData>>
): string[] {
  const seenColumnIds = new Set<string>();

  return columnIds.filter((columnId) => {
    const column = columnMap.get(columnId);
    if (!column || column.pinnable === false || seenColumnIds.has(columnId)) {
      return false;
    }

    seenColumnIds.add(columnId);
    return true;
  });
}

