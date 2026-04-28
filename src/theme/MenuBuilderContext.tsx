/**
 * Menu Builder Context
 * Manages menu builder state globally
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type {
  MenuBuilderState,
  MenuConfiguration,
  MenuSectionData,
  MenuLevelData,
  MenuItemData,
  MenuValidationResult,
} from '../utils/menuBuilderTypes';
import { MENU_BUILDER_STORAGE_KEYS, MENU_BUILDER_CONSTANTS } from '../utils/menuBuilderTypes';
import {
  createEmptyMenuConfig,
  createMenuSection,
  createMenuLevel2,
  createMenuItem,
  addSection,
  updateSection,
  removeSection,
  addLevel2,
  updateLevel2,
  removeLevel2,
  addMenuItem,
  updateMenuItem,
  removeMenuItem,
  moveMenuItem,
  reorderMenuItems,
  validateMenuConfig,
  findSection,
  findLevel2,
  findMenuItem,
} from '../utils/menuBuilderUtils';

// Actions
type MenuBuilderAction =
  | { type: 'LOAD_CONFIGS'; draft: MenuConfiguration | null; published: MenuConfiguration | null }
  | { type: 'SET_DRAFT_CONFIG'; config: MenuConfiguration }
  | { type: 'SET_PUBLISHED_CONFIG'; config: MenuConfiguration }
  | { type: 'SELECT_SECTION'; sectionId: string | null }
  | { type: 'SELECT_LEVEL2'; level2Id: string | null }
  | { type: 'SELECT_ITEM'; itemId: string | null }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'ADD_SECTION'; section: MenuSectionData }
  | { type: 'UPDATE_SECTION'; sectionId: string; updates: Partial<MenuSectionData> }
  | { type: 'REMOVE_SECTION'; sectionId: string }
  | { type: 'ADD_LEVEL2'; sectionId: string; level2: MenuLevelData }
  | { type: 'UPDATE_LEVEL2'; level2Id: string; updates: Partial<MenuLevelData> }
  | { type: 'REMOVE_LEVEL2'; level2Id: string }
  | { type: 'ADD_ITEM'; level2Id: string; item: MenuItemData }
  | { type: 'UPDATE_ITEM'; itemId: string; updates: Partial<MenuItemData> }
  | { type: 'REMOVE_ITEM'; itemId: string }
  | { type: 'MOVE_ITEM'; itemId: string; fromLevel2Id: string; toLevel2Id: string; order: number }
  | { type: 'REORDER_ITEMS'; level2Id: string; order: string[] }
  | { type: 'VALIDATE'; }
  | { type: 'RESET_TO_PUBLISHED'; }
  | { type: 'PUBLISH'; }
  | { type: 'MARK_DIRTY'; }
  | { type: 'RESET_DIRTY'; };

interface MenuBuilderContextType {
  state: MenuBuilderState;
  addSection: (label: string) => void;
  updateSection: (sectionId: string, updates: Partial<MenuSectionData>) => void;
  removeSection: (sectionId: string) => void;
  addLevel2: (sectionId: string, label: string) => void;
  updateLevel2: (level2Id: string, updates: Partial<MenuLevelData>) => void;
  removeLevel2: (level2Id: string) => void;
  addMenuItem: (level2Id: string, label: string) => void;
  updateMenuItem: (itemId: string, updates: Partial<MenuItemData>) => void;
  removeMenuItem: (itemId: string) => void;
  moveMenuItem: (itemId: string, fromLevel2Id: string, toLevel2Id: string, order: number) => void;
  reorderMenuItems: (level2Id: string, order: string[]) => void;
  selectSection: (sectionId: string | null) => void;
  selectLevel2: (level2Id: string | null) => void;
  selectItem: (itemId: string | null) => void;
  validateConfig: () => void;
  resetToDraft: () => void;
  publishConfig: () => void;
  loadInitialState: (draft: MenuConfiguration | null, published: MenuConfiguration | null) => void;
}

const MenuBuilderContext = createContext<MenuBuilderContextType | undefined>(undefined);

const initialState: MenuBuilderState = {
  draftConfig: null,
  publishedConfig: null,
  selectedSectionId: null,
  selectedLevel2Id: null,
  selectedItemId: null,
  isLoading: false,
  lastError: null,
  isDirty: false,
  validationResult: null,
};

function menuBuilderReducer(state: MenuBuilderState, action: MenuBuilderAction): MenuBuilderState {
  switch (action.type) {
    case 'LOAD_CONFIGS':
      return {
        ...state,
        draftConfig: action.draft || createEmptyMenuConfig(),
        publishedConfig: action.published,
        isDirty: false,
      };

    case 'SET_DRAFT_CONFIG':
      return {
        ...state,
        draftConfig: action.config,
        isDirty: true,
      };

    case 'SET_PUBLISHED_CONFIG':
      return {
        ...state,
        publishedConfig: action.config,
      };

    case 'SELECT_SECTION':
      return {
        ...state,
        selectedSectionId: action.sectionId,
        selectedLevel2Id: null,
        selectedItemId: null,
      };

    case 'SELECT_LEVEL2':
      return {
        ...state,
        selectedLevel2Id: action.level2Id,
        selectedItemId: null,
      };

    case 'SELECT_ITEM':
      return {
        ...state,
        selectedItemId: action.itemId,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.loading,
      };

    case 'SET_ERROR':
      return {
        ...state,
        lastError: action.error,
      };

    case 'ADD_SECTION': {
      if (!state.draftConfig) return state;
      return {
        ...state,
        draftConfig: addSection(state.draftConfig, action.section),
        isDirty: true,
      };
    }

    case 'UPDATE_SECTION': {
      if (!state.draftConfig) return state;
      return {
        ...state,
        draftConfig: updateSection(state.draftConfig, action.sectionId, action.updates),
        isDirty: true,
      };
    }

    case 'REMOVE_SECTION': {
      if (!state.draftConfig) return state;
      return {
        ...state,
        draftConfig: removeSection(state.draftConfig, action.sectionId),
        isDirty: true,
        selectedSectionId: state.selectedSectionId === action.sectionId ? null : state.selectedSectionId,
      };
    }

    case 'ADD_LEVEL2': {
      if (!state.draftConfig) return state;
      return {
        ...state,
        draftConfig: addLevel2(state.draftConfig, action.sectionId, action.level2),
        isDirty: true,
      };
    }

    case 'UPDATE_LEVEL2': {
      if (!state.draftConfig) return state;
      return {
        ...state,
        draftConfig: updateLevel2(state.draftConfig, action.level2Id, action.updates),
        isDirty: true,
      };
    }

    case 'REMOVE_LEVEL2': {
      if (!state.draftConfig) return state;
      return {
        ...state,
        draftConfig: removeLevel2(state.draftConfig, action.level2Id),
        isDirty: true,
        selectedLevel2Id: state.selectedLevel2Id === action.level2Id ? null : state.selectedLevel2Id,
      };
    }

    case 'ADD_ITEM': {
      if (!state.draftConfig) return state;
      return {
        ...state,
        draftConfig: addMenuItem(state.draftConfig, action.level2Id, action.item),
        isDirty: true,
      };
    }

    case 'UPDATE_ITEM': {
      if (!state.draftConfig) return state;
      return {
        ...state,
        draftConfig: updateMenuItem(state.draftConfig, action.itemId, action.updates),
        isDirty: true,
      };
    }

    case 'REMOVE_ITEM': {
      if (!state.draftConfig) return state;
      return {
        ...state,
        draftConfig: removeMenuItem(state.draftConfig, action.itemId),
        isDirty: true,
        selectedItemId: state.selectedItemId === action.itemId ? null : state.selectedItemId,
      };
    }

    case 'MOVE_ITEM': {
      if (!state.draftConfig) return state;
      return {
        ...state,
        draftConfig: moveMenuItem(
          state.draftConfig,
          action.itemId,
          action.fromLevel2Id,
          action.toLevel2Id,
          action.order
        ),
        isDirty: true,
      };
    }

    case 'REORDER_ITEMS': {
      if (!state.draftConfig) return state;
      return {
        ...state,
        draftConfig: reorderMenuItems(state.draftConfig, action.level2Id, action.order),
        isDirty: true,
      };
    }

    case 'VALIDATE': {
      if (!state.draftConfig) return state;
      const validation = validateMenuConfig(state.draftConfig);
      return {
        ...state,
        validationResult: validation,
      };
    }

    case 'RESET_TO_PUBLISHED': {
      return {
        ...state,
        draftConfig: state.publishedConfig ? { ...state.publishedConfig, status: 'draft', id: `draft-${Date.now()}` } : createEmptyMenuConfig(),
        isDirty: false,
        validationResult: null,
      };
    }

    case 'PUBLISH': {
      if (!state.draftConfig) return state;
      const publishedConfig: MenuConfiguration = {
        ...state.draftConfig,
        status: 'published',
        publishedAt: Date.now(),
      };
      return {
        ...state,
        publishedConfig,
        draftConfig: { ...state.draftConfig, status: 'draft' },
        isDirty: false,
        validationResult: null,
      };
    }

    case 'MARK_DIRTY':
      return {
        ...state,
        isDirty: true,
      };

    case 'RESET_DIRTY':
      return {
        ...state,
        isDirty: false,
      };

    default:
      return state;
  }
}

export const MenuBuilderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(menuBuilderReducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    const draftJson = localStorage.getItem(MENU_BUILDER_STORAGE_KEYS.DRAFT_CONFIG);
    const publishedJson = localStorage.getItem(MENU_BUILDER_STORAGE_KEYS.PUBLISHED_CONFIG);

    const draft = draftJson ? JSON.parse(draftJson) : null;
    const published = publishedJson ? JSON.parse(publishedJson) : null;

    dispatch({
      type: 'LOAD_CONFIGS',
      draft,
      published,
    });
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (state.draftConfig) {
      localStorage.setItem(MENU_BUILDER_STORAGE_KEYS.DRAFT_CONFIG, JSON.stringify(state.draftConfig));
    }
  }, [state.draftConfig]);

  useEffect(() => {
    if (state.publishedConfig) {
      localStorage.setItem(MENU_BUILDER_STORAGE_KEYS.PUBLISHED_CONFIG, JSON.stringify(state.publishedConfig));
    }
  }, [state.publishedConfig]);

  const addSectionHandler = useCallback((label: string) => {
    if (!state.draftConfig) return;
    const nextOrder = Math.max(...state.draftConfig.sections.map((s) => s.order), -1) + 1;
    const section = createMenuSection(label, nextOrder);
    dispatch({ type: 'ADD_SECTION', section });
  }, [state.draftConfig]);

  const updateSectionHandler = useCallback((sectionId: string, updates: Partial<MenuSectionData>) => {
    dispatch({ type: 'UPDATE_SECTION', sectionId, updates });
  }, []);

  const removeSectionHandler = useCallback((sectionId: string) => {
    dispatch({ type: 'REMOVE_SECTION', sectionId });
  }, []);

  const addLevel2Handler = useCallback((sectionId: string, label: string) => {
    if (!state.draftConfig) return;
    const section = findSection(state.draftConfig, sectionId);
    if (!section) return;
    const nextOrder = Math.max(...section.level2Groups.map((l2) => l2.order), -1) + 1;
    const level2 = createMenuLevel2(label, sectionId, nextOrder);
    dispatch({ type: 'ADD_LEVEL2', sectionId, level2 });
  }, [state.draftConfig]);

  const updateLevel2Handler = useCallback((level2Id: string, updates: Partial<MenuLevelData>) => {
    dispatch({ type: 'UPDATE_LEVEL2', level2Id, updates });
  }, []);

  const removeLevel2Handler = useCallback((level2Id: string) => {
    dispatch({ type: 'REMOVE_LEVEL2', level2Id });
  }, []);

  const addMenuItemHandler = useCallback((level2Id: string, label: string) => {
    if (!state.draftConfig) return;
    const level2 = findLevel2(state.draftConfig, level2Id);
    if (!level2) return;
    const nextOrder = Math.max(...level2.items.map((item) => item.order), -1) + 1;
    const item = createMenuItem(label, level2Id, nextOrder);
    dispatch({ type: 'ADD_ITEM', level2Id, item });
  }, [state.draftConfig]);

  const updateMenuItemHandler = useCallback((itemId: string, updates: Partial<MenuItemData>) => {
    dispatch({ type: 'UPDATE_ITEM', itemId, updates });
  }, []);

  const removeMenuItemHandler = useCallback((itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', itemId });
  }, []);

  const moveMenuItemHandler = useCallback((itemId: string, fromLevel2Id: string, toLevel2Id: string, order: number) => {
    dispatch({ type: 'MOVE_ITEM', itemId, fromLevel2Id, toLevel2Id, order });
  }, []);

  const reorderMenuItemsHandler = useCallback((level2Id: string, order: string[]) => {
    dispatch({ type: 'REORDER_ITEMS', level2Id, order });
  }, []);

  const value: MenuBuilderContextType = {
    state,
    addSection: addSectionHandler,
    updateSection: updateSectionHandler,
    removeSection: removeSectionHandler,
    addLevel2: addLevel2Handler,
    updateLevel2: updateLevel2Handler,
    removeLevel2: removeLevel2Handler,
    addMenuItem: addMenuItemHandler,
    updateMenuItem: updateMenuItemHandler,
    removeMenuItem: removeMenuItemHandler,
    moveMenuItem: moveMenuItemHandler,
    reorderMenuItems: reorderMenuItemsHandler,
    selectSection: useCallback((sectionId: string | null) => {
      dispatch({ type: 'SELECT_SECTION', sectionId });
    }, []),
    selectLevel2: useCallback((level2Id: string | null) => {
      dispatch({ type: 'SELECT_LEVEL2', level2Id });
    }, []),
    selectItem: useCallback((itemId: string | null) => {
      dispatch({ type: 'SELECT_ITEM', itemId });
    }, []),
    validateConfig: useCallback(() => {
      dispatch({ type: 'VALIDATE' });
    }, []),
    resetToDraft: useCallback(() => {
      dispatch({ type: 'RESET_TO_PUBLISHED' });
    }, []),
    publishConfig: useCallback(() => {
      dispatch({ type: 'PUBLISH' });
    }, []),
    loadInitialState: useCallback((draft: MenuConfiguration | null, published: MenuConfiguration | null) => {
      dispatch({ type: 'LOAD_CONFIGS', draft, published });
    }, []),
  };

  return <MenuBuilderContext.Provider value={value}>{children}</MenuBuilderContext.Provider>;
};

export function useMenuBuilder(): MenuBuilderContextType {
  const context = useContext(MenuBuilderContext);
  if (!context) {
    throw new Error('useMenuBuilder must be used within MenuBuilderProvider');
  }
  return context;
}
