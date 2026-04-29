export type CatalogueViewModeId = 'list' | 'grid' | 'split';

export type CatalogueDocumentType = 'purchase-requisition';

export interface CatalogueViewModeDefinition {
  id: CatalogueViewModeId;
  label: string;
  description: string;
}

export interface CatalogueSplitViewSettings {
  listDensity: 'compact' | 'comfortable';
  previewMode: 'detail';
}

export interface CatalogueDocumentViewConfig {
  documentType: CatalogueDocumentType;
  enabledViews: CatalogueViewModeId[];
  defaultView: CatalogueViewModeId;
  viewSettings: {
    split: CatalogueSplitViewSettings;
  };
}

const CATALOGUE_VIEW_MODE_STORAGE_PREFIX = 'catalogue-display-view-mode:';
const fallbackEnabledViews: CatalogueViewModeId[] = ['list', 'grid'];

export const catalogueViewModeRegistry: Record<CatalogueViewModeId, CatalogueViewModeDefinition> = {
  list: {
    id: 'list',
    label: 'Table',
    description: 'Classic sortable table view.',
  },
  grid: {
    id: 'grid',
    label: 'Cards',
    description: 'Card layout with key document details.',
  },
  split: {
    id: 'split',
    label: 'Split View',
    description: 'Compact list with a document preview panel.',
  },
};

const catalogueDocumentViewConfigs: Record<CatalogueDocumentType, CatalogueDocumentViewConfig> = {
  'purchase-requisition': {
    documentType: 'purchase-requisition',
    enabledViews: ['list', 'grid', 'split'],
    defaultView: 'list',
    viewSettings: {
      split: {
        listDensity: 'compact',
        previewMode: 'detail',
      },
    },
  },
};

function isCatalogueViewModeId(value: unknown): value is CatalogueViewModeId {
  return typeof value === 'string' && value in catalogueViewModeRegistry;
}

function sanitizeEnabledViews(value: unknown): CatalogueViewModeId[] {
  if (!Array.isArray(value)) {
    return fallbackEnabledViews;
  }

  const enabledViews = Array.from(new Set(value.filter(isCatalogueViewModeId)));
  return enabledViews.length > 0 ? enabledViews : fallbackEnabledViews;
}

export function getCatalogueViewModeConfig(documentType: CatalogueDocumentType): CatalogueDocumentViewConfig {
  const config = catalogueDocumentViewConfigs[documentType];

  if (!config) {
    return {
      documentType,
      enabledViews: fallbackEnabledViews,
      defaultView: 'list',
      viewSettings: {
        split: {
          listDensity: 'compact',
          previewMode: 'detail',
        },
      },
    };
  }

  const enabledViews = sanitizeEnabledViews(config.enabledViews);
  const defaultView = enabledViews.includes(config.defaultView) ? config.defaultView : enabledViews[0];

  return {
    ...config,
    enabledViews,
    defaultView,
  };
}

export function resolveCatalogueViewMode(
  documentType: CatalogueDocumentType,
  requestedMode: CatalogueViewModeId | null | undefined
): CatalogueViewModeId {
  const config = getCatalogueViewModeConfig(documentType);
  return requestedMode && config.enabledViews.includes(requestedMode) ? requestedMode : config.defaultView;
}

export function loadCatalogueDisplayViewMode(documentType: CatalogueDocumentType): CatalogueViewModeId | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(`${CATALOGUE_VIEW_MODE_STORAGE_PREFIX}${documentType}`);
    return isCatalogueViewModeId(storedValue) ? storedValue : null;
  } catch {
    return null;
  }
}

export function saveCatalogueDisplayViewMode(documentType: CatalogueDocumentType, viewMode: CatalogueViewModeId): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(`${CATALOGUE_VIEW_MODE_STORAGE_PREFIX}${documentType}`, viewMode);
  } catch {
    // Storage is optional; keep the catalogue usable if it fails.
  }
}
