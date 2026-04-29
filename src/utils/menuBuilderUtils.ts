/**
 * Menu Builder Utilities
 * Functions for menu operations, validation, and management
 */

import type {
  MenuConfiguration,
  MenuItemData,
  MenuLevelData,
  MenuSectionData,
  MenuValidationResult,
  MenuValidationError,
  MenuValidationWarning,
  DragDropPayload,
} from './menuBuilderTypes';
import { MENU_BUILDER_CONSTANTS } from './menuBuilderTypes';
import {
  getDefaultItemIconName,
  getDefaultRouteForKey,
  getDefaultSectionIconName,
  isCanonicalMenuItemKey,
} from './menuBuilderNavigation';

function normalizeOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items]
    .sort((left, right) => left.order - right.order)
    .map((item, index) => ({ ...item, order: index }));
}

function insertAt<T>(items: T[], item: T, index: number): T[] {
  const next = [...items];
  const clampedIndex = Math.max(0, Math.min(index, next.length));
  next.splice(clampedIndex, 0, item);
  return next;
}

/**
 * Create a new empty menu configuration
 */
export function createEmptyMenuConfig(): MenuConfiguration {
  return {
    id: `config-${Date.now()}`,
    name: 'Default Menu',
    status: 'draft',
    sections: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: MENU_BUILDER_CONSTANTS.VERSION,
  };
}

/**
 * Create a new section
 */
export function createMenuSection(label: string, order: number): MenuSectionData {
  return {
    id: `section-${Date.now()}-${Math.random()}`,
    label,
    level: 1,
    order,
    iconName: getDefaultSectionIconName(label),
    isExpanded: true,
    isVisible: true,
    level2Groups: [],
  };
}

/**
 * Create a new level 2 group
 */
export function createMenuLevel2(label: string, parentSectionId: string, order: number): MenuLevelData {
  return {
    id: `level2-${Date.now()}-${Math.random()}`,
    label,
    level: 2,
    parentLevelId: parentSectionId,
    order,
    hideLabel: false,
    isExpanded: true,
    isVisible: true,
    items: [],
  };
}

/**
 * Create a new menu item
 */
export function createMenuItem(label: string, parentLevel2Id: string, order: number): MenuItemData {
  const key = label.toLowerCase().replace(/\s+/g, '-');
  return {
    id: `item-${Date.now()}-${Math.random()}`,
    label,
    key,
    parentLevelId: parentLevel2Id,
    order,
    iconName: getDefaultItemIconName(key),
    route: getDefaultRouteForKey(key),
    openInNewTab: false,
    isVisible: true,
  };
}

/**
 * Find a section by ID
 */
export function findSection(config: MenuConfiguration, sectionId: string): MenuSectionData | null {
  return config.sections.find((s) => s.id === sectionId) || null;
}

/**
 * Find a level 2 group by ID
 */
export function findLevel2(config: MenuConfiguration, level2Id: string): MenuLevelData | null {
  for (const section of config.sections) {
    const found = section.level2Groups.find((l2) => l2.id === level2Id);
    if (found) return found;
  }
  return null;
}

/**
 * Find a menu item by ID
 */
export function findMenuItem(config: MenuConfiguration, itemId: string): MenuItemData | null {
  for (const section of config.sections) {
    for (const level2 of section.level2Groups) {
      const found = level2.items.find((item) => item.id === itemId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Find parent section for a level 2
 */
export function findParentSection(config: MenuConfiguration, level2Id: string): MenuSectionData | null {
  const level2 = findLevel2(config, level2Id);
  if (!level2 || !level2.parentLevelId) return null;
  return findSection(config, level2.parentLevelId);
}

/**
 * Find parent level 2 for an item
 */
export function findParentLevel2(config: MenuConfiguration, itemId: string): MenuLevelData | null {
  const item = findMenuItem(config, itemId);
  if (!item) return null;
  return findLevel2(config, item.parentLevelId);
}

/**
 * Add a section to config
 */
export function addSection(config: MenuConfiguration, section: MenuSectionData): MenuConfiguration {
  return {
    ...config,
    sections: [...config.sections, section].sort((a, b) => a.order - b.order),
    updatedAt: Date.now(),
  };
}

/**
 * Update a section
 */
export function updateSection(config: MenuConfiguration, sectionId: string, updates: Partial<MenuSectionData>): MenuConfiguration {
  return {
    ...config,
    sections: normalizeOrder(config.sections.map((s) => (s.id === sectionId ? { ...s, ...updates } : s))),
    updatedAt: Date.now(),
  };
}

/**
 * Remove a section
 */
export function removeSection(config: MenuConfiguration, sectionId: string): MenuConfiguration {
  return {
    ...config,
    sections: normalizeOrder(config.sections.filter((s) => s.id !== sectionId)),
    updatedAt: Date.now(),
  };
}

export function reorderSections(config: MenuConfiguration, newOrder: string[]): MenuConfiguration {
  const sectionMap = new Map(config.sections.map((section) => [section.id, section]));
  const orderedSections = newOrder.map((id) => sectionMap.get(id)).filter(Boolean) as MenuSectionData[];
  const remainingSections = config.sections.filter((section) => !newOrder.includes(section.id));

  return {
    ...config,
    sections: [...orderedSections, ...remainingSections].map((section, index) => ({
      ...section,
      order: index,
    })),
    updatedAt: Date.now(),
  };
}

/**
 * Add a level 2 group to a section
 */
export function addLevel2(config: MenuConfiguration, sectionId: string, level2: MenuLevelData): MenuConfiguration {
  return {
    ...config,
    sections: config.sections.map((s) =>
      s.id === sectionId
        ? {
            ...s,
            level2Groups: normalizeOrder([...s.level2Groups, level2]),
          }
        : s
    ),
    updatedAt: Date.now(),
  };
}

/**
 * Update a level 2 group
 */
export function updateLevel2(config: MenuConfiguration, level2Id: string, updates: Partial<MenuLevelData>): MenuConfiguration {
  return {
    ...config,
    sections: config.sections.map((s) => ({
      ...s,
      level2Groups: normalizeOrder(s.level2Groups.map((l2) => (l2.id === level2Id ? { ...l2, ...updates } : l2))),
    })),
    updatedAt: Date.now(),
  };
}

/**
 * Remove a level 2 group
 */
export function removeLevel2(config: MenuConfiguration, level2Id: string): MenuConfiguration {
  return {
    ...config,
    sections: config.sections.map((s) => ({
      ...s,
      level2Groups: normalizeOrder(s.level2Groups.filter((l2) => l2.id !== level2Id)),
    })),
    updatedAt: Date.now(),
  };
}

export function reorderLevel2Groups(config: MenuConfiguration, sectionId: string, newOrder: string[]): MenuConfiguration {
  return {
    ...config,
    sections: config.sections.map((section) => {
      if (section.id !== sectionId) {
        return section;
      }

      const groupMap = new Map(section.level2Groups.map((group) => [group.id, group]));
      const orderedGroups = newOrder.map((id) => groupMap.get(id)).filter(Boolean) as MenuLevelData[];
      const remainingGroups = section.level2Groups.filter((group) => !newOrder.includes(group.id));

      return {
        ...section,
        level2Groups: [...orderedGroups, ...remainingGroups].map((group, index) => ({
          ...group,
          order: index,
        })),
      };
    }),
    updatedAt: Date.now(),
  };
}

export function moveLevel2Group(
  config: MenuConfiguration,
  level2Id: string,
  toSectionId: string,
  newOrder: number
): MenuConfiguration {
  const movingGroup = findLevel2(config, level2Id);
  if (!movingGroup) {
    return config;
  }

  const sourceSection = findParentSection(config, level2Id);
  if (sourceSection?.id === toSectionId) {
    const nextOrder = sourceSection.level2Groups
      .map((group) => group.id)
      .filter((groupId) => groupId !== level2Id);
    const clampedOrder = Math.max(0, Math.min(newOrder, nextOrder.length));
    nextOrder.splice(clampedOrder, 0, level2Id);
    return reorderLevel2Groups(config, toSectionId, nextOrder);
  }

  const nextSections = config.sections.map((section) => {
    if (section.id === sourceSection?.id) {
      return {
        ...section,
        level2Groups: normalizeOrder(section.level2Groups.filter((group) => group.id !== level2Id)),
      };
    }

    if (section.id === toSectionId) {
      return {
        ...section,
        level2Groups: normalizeOrder(
          insertAt(
            section.level2Groups,
            { ...movingGroup, parentLevelId: toSectionId },
            newOrder
          )
        ),
      };
    }

    return section;
  });

  return {
    ...config,
    sections: nextSections,
    updatedAt: Date.now(),
  };
}

/**
 * Add a menu item to a level 2
 */
export function addMenuItem(config: MenuConfiguration, level2Id: string, item: MenuItemData): MenuConfiguration {
  return {
    ...config,
    sections: config.sections.map((s) => ({
      ...s,
      level2Groups: s.level2Groups.map((l2) =>
        l2.id === level2Id
          ? {
              ...l2,
              items: normalizeOrder([...l2.items, item]),
            }
          : l2
      ),
    })),
    updatedAt: Date.now(),
  };
}

/**
 * Update a menu item
 */
export function updateMenuItem(config: MenuConfiguration, itemId: string, updates: Partial<MenuItemData>): MenuConfiguration {
  return {
    ...config,
    sections: config.sections.map((s) => ({
      ...s,
      level2Groups: s.level2Groups.map((l2) => ({
        ...l2,
        items: normalizeOrder(l2.items.map((item) => (item.id === itemId ? { ...item, ...updates } : item))),
      })),
    })),
    updatedAt: Date.now(),
  };
}

/**
 * Remove a menu item
 */
export function removeMenuItem(config: MenuConfiguration, itemId: string): MenuConfiguration {
  return {
    ...config,
    sections: config.sections.map((s) => ({
      ...s,
      level2Groups: s.level2Groups.map((l2) => ({
        ...l2,
        items: normalizeOrder(l2.items.filter((item) => item.id !== itemId)),
      })),
    })),
    updatedAt: Date.now(),
  };
}

/**
 * Move an item from one level2 to another
 */
export function moveMenuItem(
  config: MenuConfiguration,
  itemId: string,
  fromLevel2Id: string,
  toLevel2Id: string,
  newOrder: number
): MenuConfiguration {
  const item = findMenuItem(config, itemId);
  if (!item) return config;

  return {
    ...config,
    sections: config.sections.map((section) => ({
      ...section,
      level2Groups: section.level2Groups.map((level2) => {
        if (level2.id === fromLevel2Id && fromLevel2Id !== toLevel2Id) {
          return {
            ...level2,
            items: normalizeOrder(level2.items.filter((currentItem) => currentItem.id !== itemId)),
          };
        }

        if (level2.id === toLevel2Id) {
          const itemsWithoutMovedItem = level2.items.filter((currentItem) => currentItem.id !== itemId);
          return {
            ...level2,
            items: normalizeOrder(insertAt(itemsWithoutMovedItem, { ...item, parentLevelId: toLevel2Id }, newOrder)),
          };
        }

        return level2;
      }),
    })),
    updatedAt: Date.now(),
  };
}

/**
 * Reorder items within the same level2
 */
export function reorderMenuItems(config: MenuConfiguration, level2Id: string, newOrder: string[]): MenuConfiguration {
  return {
    ...config,
    sections: config.sections.map((s) => ({
      ...s,
      level2Groups: s.level2Groups.map((l2) => {
        if (l2.id === level2Id) {
          const itemMap = new Map(l2.items.map((item) => [item.id, item]));
          const reordered = newOrder
            .map((id) => itemMap.get(id))
            .filter(Boolean) as MenuItemData[];
          return {
            ...l2,
            items: reordered.map((item, idx) => ({ ...item, order: idx })),
          };
        }
        return l2;
      }),
    })),
    updatedAt: Date.now(),
  };
}

/**
 * Validate menu configuration
 */
export function validateMenuConfig(config: MenuConfiguration): MenuValidationResult {
  const errors: MenuValidationError[] = [];
  const warnings: MenuValidationWarning[] = [];
  const itemKeys = new Set<string>();

  // Check sections
  if (config.sections.length === 0) {
    errors.push({
      type: 'structure',
      message: 'Menu must have at least one section',
      severity: 'error',
    });
  }

  if (config.sections.length > MENU_BUILDER_CONSTANTS.MAX_SECTIONS) {
    errors.push({
      type: 'structure',
      message: `Maximum ${MENU_BUILDER_CONSTANTS.MAX_SECTIONS} sections allowed`,
      severity: 'error',
    });
  }

  // Check section names
  const sectionNames = new Set<string>();
  config.sections.forEach((section) => {
    const normalizedSectionName = section.label.trim().toLowerCase();

    if (!section.label || section.label.trim() === '') {
      errors.push({
        type: 'section',
        itemId: section.id,
        message: 'Section name is required',
        severity: 'error',
      });
    }
    if (sectionNames.has(normalizedSectionName)) {
      warnings.push({
        type: 'section',
        itemId: section.id,
        message: 'Duplicate section name',
      });
    }
    sectionNames.add(normalizedSectionName);
  });

  // Check level2 groups
  config.sections.forEach((section) => {
    if (section.level2Groups.length > MENU_BUILDER_CONSTANTS.MAX_LEVEL2_PER_SECTION) {
      errors.push({
        type: 'structure',
        message: `Section "${section.label}" exceeds maximum level2 groups`,
        severity: 'error',
      });
    }

    const level2Names = new Set<string>();
    section.level2Groups.forEach((level2) => {
      const normalizedLevel2Name = level2.label.trim().toLowerCase();

      if (!level2.label || level2.label.trim() === '') {
        errors.push({
          type: 'level2',
          itemId: level2.id,
          message: 'Level2 group name is required',
          severity: 'error',
        });
      }

      if (level2Names.has(normalizedLevel2Name)) {
        warnings.push({
          type: 'level2',
          itemId: level2.id,
          message: `Duplicate group name in section "${section.label}"`,
        });
      }

      level2Names.add(normalizedLevel2Name);

      if (level2.hideLabel && level2.items.length === 0) {
        warnings.push({
          type: 'level2',
          itemId: level2.id,
          message: `Flattened group "${level2.label}" has no visible menu items`,
        });
      }
    });
  });

  // Check items
  config.sections.forEach((section) => {
    section.level2Groups.forEach((level2) => {
      if (level2.items.length > MENU_BUILDER_CONSTANTS.MAX_ITEMS_PER_LEVEL2) {
        errors.push({
          type: 'structure',
          message: `Level2 group "${level2.label}" exceeds maximum items`,
          severity: 'error',
        });
      }

      level2.items.forEach((item) => {
        if (!item.label || item.label.trim() === '') {
          errors.push({
            type: 'item',
            itemId: item.id,
            message: 'Item name is required',
            severity: 'error',
          });
        }
        if (!item.key || item.key.trim() === '') {
          errors.push({
            type: 'item',
            itemId: item.id,
            message: 'Item key is required',
            severity: 'error',
          });
        }

        const normalizedKey = item.key.trim().toLowerCase();
        if (itemKeys.has(normalizedKey)) {
          errors.push({
            type: 'item',
            itemId: item.id,
            message: `Duplicate item key "${item.key}"`,
            severity: 'error',
          });
        }
        itemKeys.add(normalizedKey);

        if (!item.externalUrl && !item.route && !getDefaultRouteForKey(item.key) && !isCanonicalMenuItemKey(item.key)) {
          errors.push({
            type: 'item',
            itemId: item.id,
            message: `Menu item "${item.label}" needs a route or external URL`,
            severity: 'error',
          });
        }

        if (item.externalUrl) {
          try {
            new URL(item.externalUrl);
          } catch {
            errors.push({
              type: 'item',
              itemId: item.id,
              message: `Menu item "${item.label}" has an invalid external URL`,
              severity: 'error',
            });
          }
        }
      });
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Convert current menu structure to MenuConfiguration
 * Used to initialize published config from existing appShellShared.menuStructure
 */
export function initializeFromExistingMenu(): MenuConfiguration {
  // This will be populated with the existing menu structure
  // For now, return empty config
  return createEmptyMenuConfig();
}

/**
 * Check if dragging from item to item is valid
 */
export function isValidDragDrop(
  config: MenuConfiguration,
  payload: DragDropPayload,
  targetLevel2Id: string
): { valid: boolean; reason?: string } {
  // Cannot drop a level2 or section on an item (items can only be reordered within level2)
  if (payload.type !== 'item') {
    return { valid: false, reason: 'Only items can be moved between groups' };
  }

  // Verify target level2 exists
  const targetLevel2 = findLevel2(config, targetLevel2Id);
  if (!targetLevel2) {
    return { valid: false, reason: 'Target group not found' };
  }

  return { valid: true };
}
