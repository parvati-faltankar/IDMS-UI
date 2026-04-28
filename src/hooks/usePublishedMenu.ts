/**
 * usePublishedMenu Hook
 * Provides the published menu configuration or falls back to default
 */

import { useEffect, useState } from 'react';
import type { Level1Item } from '../components/common/appShellShared';
import { menuStructure } from '../components/common/appShellShared';
import type { MenuSectionData } from '../utils/menuBuilderTypes';
import { MENU_BUILDER_STORAGE_KEYS } from '../utils/menuBuilderTypes';
import {
  getDefaultItemIconName,
  getDefaultSectionIconName,
  getIconByName,
  migrateMenuConfiguration,
  MENU_BUILDER_EVENTS,
} from '../utils/menuBuilderNavigation';

/**
 * Convert published menu configuration to Level1Item structure for rendering
 */
function convertMenuSectionToLevel1Item(section: MenuSectionData): Level1Item {
  return {
    label: section.label,
    icon: getIconByName(section.iconName ?? getDefaultSectionIconName(section.label)),
    level2: section.level2Groups
      .filter((level2) => level2.isVisible !== false)
      .map((level2) => ({
      label: level2.label,
      hideLabel: level2.hideLabel,
      level3: level2.items
        .filter((item) => item.isVisible !== false)
        .map((item) => ({
        key: item.key,
        label: item.label,
        icon: getIconByName(item.iconName ?? getDefaultItemIconName(item.key)),
        route: item.route,
        externalUrl: item.externalUrl,
        openInNewTab: item.openInNewTab,
      })),
    })),
  };
}

function readPublishedMenu(): Level1Item[] {
  try {
    const publishedJson = localStorage.getItem(MENU_BUILDER_STORAGE_KEYS.PUBLISHED_CONFIG);
    if (!publishedJson) {
      return menuStructure;
    }

    const publishedConfig = migrateMenuConfiguration(JSON.parse(publishedJson));
    if (!publishedConfig || !Array.isArray(publishedConfig.sections)) {
      return menuStructure;
    }

    return publishedConfig.sections
      .filter((section) => section.isVisible !== false)
      .map(convertMenuSectionToLevel1Item)
      .filter((section) => section.level2.length > 0);
  } catch {
    return menuStructure;
  }
}

/**
 * Hook to get the current menu structure
 * Prefers published configuration, falls back to default
 */
export function usePublishedMenu(): Level1Item[] {
  const [menu, setMenu] = useState<Level1Item[]>(() => readPublishedMenu());

  useEffect(() => {
    const updateMenu = () => {
      setMenu(readPublishedMenu());
    };

    window.addEventListener(MENU_BUILDER_EVENTS.publishedUpdated, updateMenu);
    window.addEventListener('storage', updateMenu);

    return () => {
      window.removeEventListener(MENU_BUILDER_EVENTS.publishedUpdated, updateMenu);
      window.removeEventListener('storage', updateMenu);
    };
  }, []);

  return menu;
}

/**
 * Hook to check if a published menu exists
 */
export function useHasPublishedMenu(): boolean {
  const [hasPublishedMenu, setHasPublishedMenu] = useState(() => {
    try {
      const publishedJson = localStorage.getItem(MENU_BUILDER_STORAGE_KEYS.PUBLISHED_CONFIG);
      return publishedJson !== null;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const updateValue = () => {
      try {
        setHasPublishedMenu(localStorage.getItem(MENU_BUILDER_STORAGE_KEYS.PUBLISHED_CONFIG) !== null);
      } catch {
        setHasPublishedMenu(false);
      }
    };

    window.addEventListener(MENU_BUILDER_EVENTS.publishedUpdated, updateValue);
    window.addEventListener('storage', updateValue);

    return () => {
      window.removeEventListener(MENU_BUILDER_EVENTS.publishedUpdated, updateValue);
      window.removeEventListener('storage', updateValue);
    };
  }, []);

  return hasPublishedMenu;
}
