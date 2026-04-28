/**
 * Menu Initialization Utilities
 * Functions to initialize menu configuration from existing menu structure
 */

import type { MenuConfiguration } from '../utils/menuBuilderTypes';
import type { Level1Item } from '../components/common/appShellShared';
import { menuStructure } from '../components/common/appShellShared';
import { createEmptyMenuConfig } from '../utils/menuBuilderUtils';
import { MENU_BUILDER_STORAGE_KEYS } from '../utils/menuBuilderTypes';
import { getDefaultRouteForKey, migrateMenuConfiguration, resolveIconName } from './menuBuilderNavigation';

/**
 * Convert Level1Item structure to MenuConfiguration
 */
export function convertLevel1ToMenuConfig(level1Items: Level1Item[]): MenuConfiguration {
  const config = createEmptyMenuConfig();
  config.status = 'published';
  config.name = 'Default Menu';

  config.sections = level1Items.map((level1, sectionIdx) => ({
    id: `section-${sectionIdx}`,
    label: level1.label,
    level: 1 as const,
    order: sectionIdx,
    iconName: resolveIconName(level1.icon),
    isExpanded: true,
    isVisible: true,
    level2Groups: level1.level2.map((level2, level2Idx) => ({
      id: `level2-${sectionIdx}-${level2Idx}`,
      label: level2.label,
      level: 2 as const,
      parentLevelId: `section-${sectionIdx}`,
      order: level2Idx,
      hideLabel: level2.hideLabel || false,
      isExpanded: true,
      isVisible: true,
      items: (level2.level3 || []).map((level3, itemIdx) => ({
        id: `item-${sectionIdx}-${level2Idx}-${itemIdx}`,
        label: level3.label,
        key: level3.key,
        parentLevelId: `level2-${sectionIdx}-${level2Idx}`,
        order: itemIdx,
        iconName: resolveIconName(level3.icon),
        route: getDefaultRouteForKey(level3.key),
        openInNewTab: false,
        isVisible: true,
      })),
    })),
  }));

  return config;
}

/**
 * Initialize menu builder with default menu on first load
 */
export function initializeMenuBuilder() {
  try {
    const publishedJson = localStorage.getItem(MENU_BUILDER_STORAGE_KEYS.PUBLISHED_CONFIG);
    const draftJson = localStorage.getItem(MENU_BUILDER_STORAGE_KEYS.DRAFT_CONFIG);
    
    // If no published config exists, create one from default menu structure
    if (!publishedJson) {
      const defaultConfig = convertLevel1ToMenuConfig(menuStructure);
      localStorage.setItem(MENU_BUILDER_STORAGE_KEYS.PUBLISHED_CONFIG, JSON.stringify(defaultConfig));
      localStorage.setItem(
        MENU_BUILDER_STORAGE_KEYS.DRAFT_CONFIG,
        JSON.stringify({ ...defaultConfig, id: `draft-${Date.now()}`, status: 'draft' as const })
      );
      return;
    }

    const migratedPublished = migrateMenuConfiguration(JSON.parse(publishedJson));
    if (migratedPublished) {
      localStorage.setItem(MENU_BUILDER_STORAGE_KEYS.PUBLISHED_CONFIG, JSON.stringify(migratedPublished));
    }

    if (draftJson) {
      const migratedDraft = migrateMenuConfiguration(JSON.parse(draftJson));
      if (migratedDraft) {
        localStorage.setItem(
          MENU_BUILDER_STORAGE_KEYS.DRAFT_CONFIG,
          JSON.stringify({ ...migratedDraft, status: 'draft' as const })
        );
      }
    } else if (migratedPublished) {
      localStorage.setItem(
        MENU_BUILDER_STORAGE_KEYS.DRAFT_CONFIG,
        JSON.stringify({ ...migratedPublished, id: `draft-${Date.now()}`, status: 'draft' as const })
      );
    }
  } catch (error) {
    console.error('Failed to initialize menu builder:', error);
  }
}
