export interface FormLayoutTab {
  id: string;
  label: string;
  sectionIds: string[];
}

export interface FormLayoutSection {
  id: string;
  label: string;
  fieldIds: string[];
  fieldsPerRow?: number;
}

export interface FormLayoutGridColumn {
  key: string;
  label: string;
  visible: boolean;
  locked?: boolean;
}

export interface FormLayoutGrid {
  id: string;
  label: string;
  columns: FormLayoutGridColumn[];
}

export interface FormLayoutConfig {
  formId: string;
  version: number;
  tabs: FormLayoutTab[];
  sections: Record<string, FormLayoutSection>;
  grids?: Record<string, FormLayoutGrid>;
}

const STORAGE_PREFIX = 'form-layout-config:';
const DRAFT_STORAGE_PREFIX = 'form-layout-draft:';
const PUBLISHED_STORAGE_PREFIX = 'form-layout-published:';

export type FormLayoutPublicationStatus = 'Draft' | 'Published' | 'Never Configured';

export interface StoredFormLayoutRecord {
  config: FormLayoutConfig;
  updatedAt: string;
  publishedAt?: string;
}

export interface FormLayoutStatus {
  status: FormLayoutPublicationStatus;
  updatedAt?: string;
  publishedAt?: string;
}

function clampFieldsPerRow(value: unknown, fallback = 3): number {
  const numericValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.max(1, Math.min(4, Math.round(numericValue)));
}

function cloneConfig(config: FormLayoutConfig): FormLayoutConfig {
  return {
    ...config,
    tabs: config.tabs.map((tab) => ({ ...tab, sectionIds: [...tab.sectionIds] })),
    sections: Object.fromEntries(
      Object.entries(config.sections).map(([sectionId, section]) => [
        sectionId,
        {
          ...section,
          fieldsPerRow: clampFieldsPerRow(section.fieldsPerRow),
          fieldIds: [...section.fieldIds],
        },
      ])
    ),
    grids: config.grids
      ? Object.fromEntries(
          Object.entries(config.grids).map(([gridId, grid]) => [
            gridId,
            {
              ...grid,
              columns: grid.columns.map((column) => ({ ...column })),
            },
          ])
        )
      : undefined,
  };
}

function normalizeLabel(value: string, fallback: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export function sanitizeFormLayoutConfig(
  savedConfig: FormLayoutConfig | null,
  defaultConfig: FormLayoutConfig
): FormLayoutConfig {
  if (!savedConfig || savedConfig.formId !== defaultConfig.formId) {
    return cloneConfig(defaultConfig);
  }

  const defaultFieldIds = new Set(
    Object.values(defaultConfig.sections).flatMap((section) => section.fieldIds)
  );
  const usedFieldIds = new Set<string>();
  const sections: Record<string, FormLayoutSection> = {};

  Object.entries(savedConfig.sections).forEach(([sectionId, section]) => {
    if (!section || !Array.isArray(section.fieldIds)) {
      return;
    }

    const fieldIds = section.fieldIds.filter((fieldId) => {
      if (!defaultFieldIds.has(fieldId) || usedFieldIds.has(fieldId)) {
        return false;
      }
      usedFieldIds.add(fieldId);
      return true;
    });

    sections[sectionId] = {
      id: sectionId,
      label: normalizeLabel(section.label, defaultConfig.sections[sectionId]?.label ?? 'New section'),
      fieldsPerRow: clampFieldsPerRow(section.fieldsPerRow, defaultConfig.sections[sectionId]?.fieldsPerRow ?? 3),
      fieldIds,
    };
  });

  Object.entries(defaultConfig.sections).forEach(([sectionId, section]) => {
    if (!sections[sectionId]) {
      sections[sectionId] = { ...section, fieldsPerRow: clampFieldsPerRow(section.fieldsPerRow), fieldIds: [] };
    }

    section.fieldIds.forEach((fieldId) => {
      if (!usedFieldIds.has(fieldId)) {
        sections[sectionId].fieldIds.push(fieldId);
        usedFieldIds.add(fieldId);
      }
    });
  });

  const seenSectionIds = new Set<string>();
  const tabs = savedConfig.tabs
    .filter((tab) => tab && Array.isArray(tab.sectionIds))
    .map((tab) => {
      const sectionIds = tab.sectionIds.filter((sectionId) => {
        if (!sections[sectionId] || seenSectionIds.has(sectionId)) {
          return false;
        }
        if (sections[sectionId].fieldIds.length === 0) {
          return false;
        }
        seenSectionIds.add(sectionId);
        return true;
      });

      return {
        id: tab.id,
        label: normalizeLabel(tab.label, defaultConfig.tabs.find((defaultTab) => defaultTab.id === tab.id)?.label ?? 'New tab'),
        sectionIds,
      };
    })
    .filter((tab) => tab.sectionIds.some((sectionId) => sections[sectionId]?.fieldIds.length > 0));

  defaultConfig.tabs.forEach((defaultTab) => {
    const missingSectionIds = defaultTab.sectionIds.filter((sectionId) => !seenSectionIds.has(sectionId));
    if (missingSectionIds.length === 0) {
      return;
    }

    tabs.push({
      id: defaultTab.id,
      label: defaultTab.label,
      sectionIds: missingSectionIds,
    });
    missingSectionIds.forEach((sectionId) => seenSectionIds.add(sectionId));
  });

  const grids = sanitizeGrids(savedConfig.grids, defaultConfig.grids);

  return {
    formId: defaultConfig.formId,
    version: defaultConfig.version,
    tabs: tabs.length > 0 ? tabs : cloneConfig(defaultConfig).tabs,
    sections,
    grids,
  };
}

function sanitizeGrids(
  savedGrids: FormLayoutConfig['grids'],
  defaultGrids: FormLayoutConfig['grids']
): FormLayoutConfig['grids'] {
  if (!defaultGrids) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(defaultGrids).map(([gridId, defaultGrid]) => {
      const savedGrid = savedGrids?.[gridId];
      const defaultColumnMap = new Map(defaultGrid.columns.map((column) => [column.key, column]));
      const usedColumnKeys = new Set<string>();
      const columns: FormLayoutGridColumn[] = [];

      savedGrid?.columns?.forEach((savedColumn) => {
        const defaultColumn = defaultColumnMap.get(savedColumn.key);
        if (!defaultColumn || usedColumnKeys.has(savedColumn.key)) {
          return;
        }

        usedColumnKeys.add(savedColumn.key);
        columns.push({
          ...defaultColumn,
          label: savedColumn.label?.trim() || defaultColumn.label,
          visible: defaultColumn.locked ? true : savedColumn.visible !== false,
        });
      });

      defaultGrid.columns.forEach((defaultColumn) => {
        if (!usedColumnKeys.has(defaultColumn.key)) {
          columns.push({ ...defaultColumn, visible: defaultColumn.locked ? true : defaultColumn.visible !== false });
        }
      });

      return [
        gridId,
        {
          ...defaultGrid,
          label: savedGrid?.label?.trim() || defaultGrid.label,
          columns,
        },
      ];
    })
  );
}

function parseStoredRecord(rawValue: string | null, defaultConfig: FormLayoutConfig): StoredFormLayoutRecord | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as StoredFormLayoutRecord | FormLayoutConfig;
    const possibleRecord = parsedValue as StoredFormLayoutRecord;
    const possibleConfig = possibleRecord.config ?? (parsedValue as FormLayoutConfig);
    const config = sanitizeFormLayoutConfig(possibleConfig, defaultConfig);

    return {
      config,
      updatedAt: possibleRecord.updatedAt ?? new Date().toISOString(),
      publishedAt: possibleRecord.publishedAt,
    };
  } catch {
    return null;
  }
}

function readStoredRecord(prefix: string, defaultConfig: FormLayoutConfig): StoredFormLayoutRecord | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return parseStoredRecord(window.localStorage.getItem(`${prefix}${defaultConfig.formId}`), defaultConfig);
}

function writeStoredRecord(prefix: string, config: FormLayoutConfig, publishedAt?: string): StoredFormLayoutRecord {
  const record: StoredFormLayoutRecord = {
    config: sanitizeFormLayoutConfig(config, config),
    updatedAt: new Date().toISOString(),
    publishedAt,
  };

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(`${prefix}${config.formId}`, JSON.stringify(record));
  }

  return record;
}

export function loadFormLayoutConfig(defaultConfig: FormLayoutConfig): FormLayoutConfig {
  if (typeof window === 'undefined') {
    return cloneConfig(defaultConfig);
  }

  try {
    const rawConfig = window.localStorage.getItem(`${STORAGE_PREFIX}${defaultConfig.formId}`);
    return sanitizeFormLayoutConfig(rawConfig ? JSON.parse(rawConfig) : null, defaultConfig);
  } catch {
    return cloneConfig(defaultConfig);
  }
}

export function saveFormLayoutConfig(config: FormLayoutConfig): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(`${STORAGE_PREFIX}${config.formId}`, JSON.stringify(config));
}

export function loadPublishedFormLayoutConfig(defaultConfig: FormLayoutConfig): FormLayoutConfig {
  const publishedRecord = readStoredRecord(PUBLISHED_STORAGE_PREFIX, defaultConfig);
  if (publishedRecord) {
    return publishedRecord.config;
  }

  const legacyRecord = readStoredRecord(STORAGE_PREFIX, defaultConfig);
  return legacyRecord?.config ?? cloneConfig(defaultConfig);
}

export function loadDraftFormLayoutConfig(defaultConfig: FormLayoutConfig): FormLayoutConfig {
  const draftRecord = readStoredRecord(DRAFT_STORAGE_PREFIX, defaultConfig);
  if (draftRecord) {
    return draftRecord.config;
  }

  return loadPublishedFormLayoutConfig(defaultConfig);
}

export function saveDraftFormLayoutConfig(config: FormLayoutConfig): StoredFormLayoutRecord {
  return writeStoredRecord(DRAFT_STORAGE_PREFIX, config);
}

export function publishFormLayoutConfig(config: FormLayoutConfig): StoredFormLayoutRecord {
  const publishedAt = new Date().toISOString();
  const publishedRecord = writeStoredRecord(PUBLISHED_STORAGE_PREFIX, config, publishedAt);
  writeStoredRecord(DRAFT_STORAGE_PREFIX, config, publishedAt);
  return publishedRecord;
}

export function getFormLayoutStatus(defaultConfig: FormLayoutConfig): FormLayoutStatus {
  const draftRecord = readStoredRecord(DRAFT_STORAGE_PREFIX, defaultConfig);
  const publishedRecord = readStoredRecord(PUBLISHED_STORAGE_PREFIX, defaultConfig);
  const legacyRecord = readStoredRecord(STORAGE_PREFIX, defaultConfig);
  const publishedConfig = publishedRecord?.config ?? legacyRecord?.config;
  const hasUnpublishedDraft =
    Boolean(draftRecord) &&
    (!publishedConfig || JSON.stringify(draftRecord?.config) !== JSON.stringify(publishedConfig));

  if (draftRecord && hasUnpublishedDraft) {
    return {
      status: 'Draft',
      updatedAt: draftRecord.updatedAt,
      publishedAt: publishedRecord?.publishedAt ?? legacyRecord?.publishedAt,
    };
  }

  if (publishedRecord || legacyRecord) {
    return {
      status: 'Published',
      updatedAt: publishedRecord?.updatedAt ?? legacyRecord?.updatedAt,
      publishedAt: publishedRecord?.publishedAt ?? legacyRecord?.updatedAt,
    };
  }

  return { status: 'Never Configured' };
}

export function resetFormLayoutConfig(defaultConfig: FormLayoutConfig): FormLayoutConfig {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(`${DRAFT_STORAGE_PREFIX}${defaultConfig.formId}`);
  }
  return cloneConfig(defaultConfig);
}

export function resetPublishedFormLayoutConfig(defaultConfig: FormLayoutConfig): FormLayoutConfig {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(`${PUBLISHED_STORAGE_PREFIX}${defaultConfig.formId}`);
    window.localStorage.removeItem(`${STORAGE_PREFIX}${defaultConfig.formId}`);
  }
  return cloneConfig(defaultConfig);
}

export function moveArrayItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  const nextItems = [...items];
  const [removedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(Math.max(0, Math.min(toIndex, nextItems.length)), 0, removedItem);
  return nextItems;
}

export function moveField(
  config: FormLayoutConfig,
  fieldId: string,
  targetSectionId: string,
  targetIndex: number
): FormLayoutConfig {
  const nextConfig = cloneConfig(config);
  let sourceSectionId = '';

  Object.values(nextConfig.sections).forEach((section) => {
    const fieldIndex = section.fieldIds.indexOf(fieldId);
    if (fieldIndex >= 0) {
      sourceSectionId = section.id;
      section.fieldIds.splice(fieldIndex, 1);
    }
  });

  const targetSection = nextConfig.sections[targetSectionId];
  if (!targetSection) {
    return config;
  }

  const adjustedIndex =
    sourceSectionId === targetSectionId && targetIndex > targetSection.fieldIds.length
      ? targetSection.fieldIds.length
      : targetIndex;
  targetSection.fieldIds.splice(Math.max(0, Math.min(adjustedIndex, targetSection.fieldIds.length)), 0, fieldId);

  return removeEmptyTabs(nextConfig);
}

export function moveSection(
  config: FormLayoutConfig,
  sectionId: string,
  targetTabId: string,
  targetIndex: number
): FormLayoutConfig {
  const nextConfig = cloneConfig(config);

  nextConfig.tabs.forEach((tab) => {
    const sectionIndex = tab.sectionIds.indexOf(sectionId);
    if (sectionIndex >= 0) {
      tab.sectionIds.splice(sectionIndex, 1);
    }
  });

  const targetTab = nextConfig.tabs.find((tab) => tab.id === targetTabId);
  if (!targetTab) {
    return config;
  }

  targetTab.sectionIds.splice(Math.max(0, Math.min(targetIndex, targetTab.sectionIds.length)), 0, sectionId);
  return removeEmptyTabs(nextConfig);
}

export function renameTab(config: FormLayoutConfig, tabId: string, label: string): FormLayoutConfig {
  return {
    ...config,
    tabs: config.tabs.map((tab) => (tab.id === tabId ? { ...tab, label: normalizeLabel(label, tab.label) } : tab)),
  };
}

export function renameSection(config: FormLayoutConfig, sectionId: string, label: string): FormLayoutConfig {
  const section = config.sections[sectionId];
  if (!section) {
    return config;
  }

  return {
    ...config,
    sections: {
      ...config.sections,
      [sectionId]: { ...section, label: normalizeLabel(label, section.label) },
    },
  };
}

export function addTab(config: FormLayoutConfig, label: string): FormLayoutConfig {
  const id = `custom-tab-${Date.now()}`;
  return {
    ...config,
    tabs: [...config.tabs, { id, label: normalizeLabel(label, 'New tab'), sectionIds: [] }],
  };
}

export function addSection(config: FormLayoutConfig, tabId: string, label: string): FormLayoutConfig {
  const id = `custom-section-${Date.now()}`;
  return {
    ...config,
    tabs: config.tabs.map((tab) =>
      tab.id === tabId ? { ...tab, sectionIds: [...tab.sectionIds, id] } : tab
    ),
    sections: {
      ...config.sections,
      [id]: { id, label: normalizeLabel(label, 'New section'), fieldsPerRow: 3, fieldIds: [] },
    },
  };
}

export function updateSectionFieldsPerRow(
  config: FormLayoutConfig,
  sectionId: string,
  fieldsPerRow: number
): FormLayoutConfig {
  const section = config.sections[sectionId];
  if (!section) {
    return config;
  }

  return {
    ...config,
    sections: {
      ...config.sections,
      [sectionId]: {
        ...section,
        fieldsPerRow: clampFieldsPerRow(fieldsPerRow),
      },
    },
  };
}

export function moveGridColumn(
  config: FormLayoutConfig,
  gridId: string,
  columnKey: string,
  targetIndex: number
): FormLayoutConfig {
  const grid = config.grids?.[gridId];
  if (!grid) {
    return config;
  }

  const sourceIndex = grid.columns.findIndex((column) => column.key === columnKey);
  if (sourceIndex < 0) {
    return config;
  }

  return {
    ...config,
    grids: {
      ...config.grids,
      [gridId]: {
        ...grid,
        columns: moveArrayItem(grid.columns, sourceIndex, targetIndex),
      },
    },
  };
}

export function updateGridColumnVisibility(
  config: FormLayoutConfig,
  gridId: string,
  columnKey: string,
  visible: boolean
): FormLayoutConfig {
  const grid = config.grids?.[gridId];
  if (!grid) {
    return config;
  }

  return {
    ...config,
    grids: {
      ...config.grids,
      [gridId]: {
        ...grid,
        columns: grid.columns.map((column) =>
          column.key === columnKey
            ? { ...column, visible: column.locked ? true : visible }
            : column
        ),
      },
    },
  };
}

export function getVisibleGridColumns(
  config: FormLayoutConfig,
  gridId: string
): FormLayoutGridColumn[] {
  return config.grids?.[gridId]?.columns.filter((column) => column.visible !== false || column.locked) ?? [];
}

export function mergeSections(
  config: FormLayoutConfig,
  sourceSectionId: string,
  targetSectionId: string
): FormLayoutConfig {
  if (sourceSectionId === targetSectionId) {
    return config;
  }

  const sourceSection = config.sections[sourceSectionId];
  const targetSection = config.sections[targetSectionId];
  if (!sourceSection || !targetSection) {
    return config;
  }

  const nextConfig = cloneConfig(config);
  nextConfig.sections[targetSectionId] = {
    ...targetSection,
    fieldIds: [...targetSection.fieldIds, ...sourceSection.fieldIds],
  };
  delete nextConfig.sections[sourceSectionId];
  nextConfig.tabs = nextConfig.tabs.map((tab) => ({
    ...tab,
    sectionIds: tab.sectionIds.filter((sectionId) => sectionId !== sourceSectionId),
  }));

  return removeEmptyTabs(nextConfig);
}

export function removeEmptyTabs(config: FormLayoutConfig): FormLayoutConfig {
  const nextConfig = cloneConfig(config);
  const tabs = nextConfig.tabs.filter((tab) =>
    tab.sectionIds.some((sectionId) => nextConfig.sections[sectionId]?.fieldIds.length > 0)
  );

  return {
    ...nextConfig,
    tabs: tabs.length > 0 ? tabs : nextConfig.tabs.slice(0, 1),
  };
}
