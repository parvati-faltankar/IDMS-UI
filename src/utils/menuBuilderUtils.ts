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
    isExpanded: true,
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
    items: [],
  };
}

/**
 * Create a new menu item
 */
export function createMenuItem(label: string, parentLevel2Id: string, order: number): MenuItemData {
  return {
    id: `item-${Date.now()}-${Math.random()}`,
    label,
    key: label.toLowerCase().replace(/\s+/g, '-'),
    parentLevelId: parentLevel2Id,
    order,
    openInNewTab: false,
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
    sections: config.sections.map((s) => (s.id === sectionId ? { ...s, ...updates } : s)),
    updatedAt: Date.now(),
  };
}

/**
 * Remove a section
 */
export function removeSection(config: MenuConfiguration, sectionId: string): MenuConfiguration {
  return {
    ...config,
    sections: config.sections.filter((s) => s.id !== sectionId),
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
            level2Groups: [...s.level2Groups, level2].sort((a, b) => a.order - b.order),
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
      level2Groups: s.level2Groups.map((l2) => (l2.id === level2Id ? { ...l2, ...updates } : l2)),
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
      level2Groups: s.level2Groups.filter((l2) => l2.id !== level2Id),
    })),
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
              items: [...l2.items, item].sort((a, b) => a.order - b.order),
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
        items: l2.items.map((item) => (item.id === itemId ? { ...item, ...updates } : item)),
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
        items: l2.items.filter((item) => item.id !== itemId),
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

  // Remove from source
  let updated = removeMenuItem(config, itemId);

  // Update item's parent and order
  const updatedItem = { ...item, parentLevelId: toLevel2Id, order: newOrder };

  // Re-order items in target level2
  updated = {
    ...updated,
    sections: updated.sections.map((s) => ({
      ...s,
      level2Groups: s.level2Groups.map((l2) => {
        if (l2.id === toLevel2Id) {
          const items = [...l2.items, updatedItem].sort((a, b) => a.order - b.order);
          return { ...l2, items };
        }
        return l2;
      }),
    })),
    updatedAt: Date.now(),
  };

  return updated;
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
    if (!section.label || section.label.trim() === '') {
      errors.push({
        type: 'section',
        itemId: section.id,
        message: 'Section name is required',
        severity: 'error',
      });
    }
    if (sectionNames.has(section.label)) {
      warnings.push({
        type: 'section',
        itemId: section.id,
        message: 'Duplicate section name',
      });
    }
    sectionNames.add(section.label);
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

    section.level2Groups.forEach((level2) => {
      if (!level2.label || level2.label.trim() === '') {
        errors.push({
          type: 'level2',
          itemId: level2.id,
          message: 'Level2 group name is required',
          severity: 'error',
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
