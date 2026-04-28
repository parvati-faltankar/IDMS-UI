/**
 * usePublishedMenu Hook
 * Provides the published menu configuration or falls back to default
 */

import { useMemo } from 'react';
import type { Level1Item } from '../components/common/appShellShared';
import { menuStructure } from '../components/common/appShellShared';
import type { MenuSectionData } from '../utils/menuBuilderTypes';
import { MENU_BUILDER_STORAGE_KEYS } from '../utils/menuBuilderTypes';

/**
 * Convert published menu configuration to Level1Item structure for rendering
 */
function convertMenuSectionToLevel1Item(section: MenuSectionData): Level1Item {
  return {
    label: section.label,
    icon: section.icon,
    level2: section.level2Groups.map((level2) => ({
      label: level2.label,
      hideLabel: level2.hideLabel,
      level3: level2.items.map((item) => ({
        key: item.key,
        label: item.label,
        icon: item.icon,
      })),
    })),
  };
}

/**
 * Hook to get the current menu structure
 * Prefers published configuration, falls back to default
 */
export function usePublishedMenu(): Level1Item[] {
  return useMemo(() => {
    try {
      const publishedJson = localStorage.getItem(MENU_BUILDER_STORAGE_KEYS.PUBLISHED_CONFIG);
      if (publishedJson) {
        const publishedConfig = JSON.parse(publishedJson);
        if (publishedConfig && publishedConfig.sections && Array.isArray(publishedConfig.sections)) {
          return publishedConfig.sections.map(convertMenuSectionToLevel1Item);
        }
      }
    } catch {
      // If parsing fails, use default
    }

    return menuStructure;
  }, []);
}

/**
 * Hook to check if a published menu exists
 */
export function useHasPublishedMenu(): boolean {
  return useMemo(() => {
    try {
      const publishedJson = localStorage.getItem(MENU_BUILDER_STORAGE_KEYS.PUBLISHED_CONFIG);
      return publishedJson !== null;
    } catch {
      return false;
    }
  }, []);
}
