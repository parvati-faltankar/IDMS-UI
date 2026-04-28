/**
 * Menu Builder Types and Data Model
 * Defines the structure for navigation menu configuration
 */

import type { LucideIcon } from 'lucide-react';

/**
 * Represents a single menu item (Level 3)
 * Maps to actual pages/routes
 */
export interface MenuItemData {
  id: string;
  label: string;
  key: string; // Used for routing and identification
  parentLevelId: string; // Reference to parent Level2
  order: number;
  icon?: LucideIcon | null;
  route?: string; // Optional route path
  externalUrl?: string; // Optional external URL
  openInNewTab?: boolean;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Represents a Level 2 group (e.g., "Pages")
 * Can contain menu items
 */
export interface MenuLevelData {
  id: string;
  label: string;
  level: 2;
  parentLevelId: string | null; // Reference to parent Level1
  order: number;
  hideLabel?: boolean;
  description?: string;
  isExpanded?: boolean;
  items: MenuItemData[]; // Level 3 items
  metadata?: Record<string, unknown>;
}

/**
 * Represents a Level 1 group (e.g., "Procurement", "Sales")
 * Can contain Level 2 groups
 */
export interface MenuSectionData {
  id: string;
  label: string;
  level: 1;
  order: number;
  icon?: LucideIcon | null;
  description?: string;
  isExpanded?: boolean;
  level2Groups: MenuLevelData[]; // Level 2 groups
  metadata?: Record<string, unknown>;
}

/**
 * Complete menu configuration
 */
export interface MenuConfiguration {
  id: string;
  name: string;
  status: 'draft' | 'published';
  sections: MenuSectionData[]; // Level 1 sections
  createdAt: number; // Timestamp
  updatedAt: number; // Timestamp
  publishedAt?: number; // Timestamp when published
  version: number; // For versioning and migrations
}

/**
 * Validation result for menu configuration
 */
export interface MenuValidationResult {
  isValid: boolean;
  errors: MenuValidationError[];
  warnings: MenuValidationWarning[];
}

export interface MenuValidationError {
  type: 'section' | 'level2' | 'item' | 'structure';
  itemId?: string;
  message: string;
  severity: 'error' | 'critical';
}

export interface MenuValidationWarning {
  type: string;
  itemId?: string;
  message: string;
}

/**
 * Menu builder state
 */
export interface MenuBuilderState {
  draftConfig: MenuConfiguration | null;
  publishedConfig: MenuConfiguration | null;
  selectedSectionId: string | null;
  selectedLevel2Id: string | null;
  selectedItemId: string | null;
  isLoading: boolean;
  lastError: string | null;
  isDirty: boolean; // Changes made to draft
  validationResult: MenuValidationResult | null;
}

/**
 * Drag and drop payload
 */
export interface DragDropPayload {
  type: 'section' | 'level2' | 'item';
  itemId: string;
  sourceParentId?: string;
  sourceOrder?: number;
  sourceLevel?: number;
}

/**
 * Local storage keys for menu builder
 */
export const MENU_BUILDER_STORAGE_KEYS = {
  DRAFT_CONFIG: 'menu-builder:draft-config',
  PUBLISHED_CONFIG: 'menu-builder:published-config',
  BUILDER_STATE: 'menu-builder:state',
} as const;

/**
 * Constants
 */
export const MENU_BUILDER_CONSTANTS = {
  MAX_DEPTH: 3,
  MAX_SECTIONS: 20,
  MAX_LEVEL2_PER_SECTION: 10,
  MAX_ITEMS_PER_LEVEL2: 50,
  VERSION: 1,
} as const;
