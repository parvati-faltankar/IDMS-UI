/**
 * Menu Initialization Utilities
 * Functions to initialize menu configuration from existing menu structure
 */

import type { MenuConfiguration } from '../utils/menuBuilderTypes';
import type { Level1Item } from '../components/common/appShellShared';
import { menuStructure } from '../components/common/appShellShared';
import { createEmptyMenuConfig } from '../utils/menuBuilderUtils';
import { MENU_BUILDER_STORAGE_KEYS } from '../utils/menuBuilderTypes';

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
    icon: level1.icon || null,
    isExpanded: true,
    level2Groups: level1.level2.map((level2, level2Idx) => ({
      id: `level2-${sectionIdx}-${level2Idx}`,
      label: level2.label,
      level: 2 as const,
      parentLevelId: `section-${sectionIdx}`,
      order: level2Idx,
      hideLabel: level2.hideLabel || false,
      isExpanded: true,
      items: (level2.level3 || []).map((level3, itemIdx) => ({
        id: `item-${sectionIdx}-${level2Idx}-${itemIdx}`,
        label: level3.label,
        key: level3.key,
        parentLevelId: `level2-${sectionIdx}-${level2Idx}`,
        order: itemIdx,
        icon: level3.icon || null,
        openInNewTab: false,
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
    
    // If no published config exists, create one from default menu structure
    if (!publishedJson) {
      const defaultConfig = convertLevel1ToMenuConfig(menuStructure);
      localStorage.setItem(MENU_BUILDER_STORAGE_KEYS.PUBLISHED_CONFIG, JSON.stringify(defaultConfig));
    }
  } catch (error) {
    console.error('Failed to initialize menu builder:', error);
  }
}
