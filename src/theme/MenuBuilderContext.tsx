/* eslint-disable react-refresh/only-export-components */
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
} from '../utils/menuBuilderTypes';
import { MENU_BUILDER_STORAGE_KEYS } from '../utils/menuBuilderTypes';
import {
  createEmptyMenuConfig,
  createMenuSection,
  createMenuLevel2,
  createMenuItem,
  addSection,
  updateSection,
  removeSection,
  reorderSections,
  addLevel2,
  updateLevel2,
  removeLevel2,
  reorderLevel2Groups,
  moveLevel2Group,
  addMenuItem,
  updateMenuItem,
  removeMenuItem,
  moveMenuItem,
  reorderMenuItems,
  validateMenuConfig,
  findSection,
  findLevel2,
} from '../utils/menuBuilderUtils';
import { migrateMenuConfiguration, notifyDraftSaved, notifyPublishedMenuUpdated } from '../utils/menuBuilderNavigation';

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
  | { type: 'REORDER_SECTIONS'; order: string[] }
  | { type: 'ADD_LEVEL2'; sectionId: string; level2: MenuLevelData }
  | { type: 'UPDATE_LEVEL2'; level2Id: string; updates: Partial<MenuLevelData> }
  | { type: 'REMOVE_LEVEL2'; level2Id: string }
  | { type: 'REORDER_LEVEL2'; sectionId: string; order: string[] }
  | { type: 'MOVE_LEVEL2'; level2Id: string; toSectionId: string; order: number }
  | { type: 'ADD_ITEM'; level2Id: string; item: MenuItemData }
  | { type: 'UPDATE_ITEM'; itemId: string; updates: Partial<MenuItemData> }
  | { type: 'REMOVE_ITEM'; itemId: string }
  | { type: 'MOVE_ITEM'; itemId: string; fromLevel2Id: string; toLevel2Id: string; order: number }
  | { type: 'REORDER_ITEMS'; level2Id: string; order: string[] }
  | { type: 'SET_VALIDATION'; validation: ReturnType<typeof validateMenuConfig> | null }
  | { type: 'RESET_TO_PUBLISHED'; }
  | { type: 'PUBLISH'; }
  | { type: 'SAVE_DRAFT'; }
  | { type: 'MARK_DIRTY'; }
  | { type: 'RESET_DIRTY'; };

interface MenuBuilderContextType {
  state: MenuBuilderState;
  addSection: (input: Pick<MenuSectionData, 'label' | 'description' | 'iconName' | 'isVisible'>) => void;
  updateSection: (sectionId: string, updates: Partial<MenuSectionData>) => void;
  removeSection: (sectionId: string) => void;
  reorderSections: (order: string[]) => void;
  addLevel2: (sectionId: string, input: Pick<MenuLevelData, 'label' | 'description' | 'hideLabel' | 'isVisible'>) => void;
  updateLevel2: (level2Id: string, updates: Partial<MenuLevelData>) => void;
  removeLevel2: (level2Id: string) => void;
  reorderLevel2Groups: (sectionId: string, order: string[]) => void;
  moveLevel2Group: (level2Id: string, toSectionId: string, order: number) => void;
  addMenuItem: (level2Id: string, input: Pick<MenuItemData, 'label' | 'key' | 'description' | 'iconName' | 'route' | 'externalUrl' | 'openInNewTab' | 'isVisible'>) => void;
  updateMenuItem: (itemId: string, updates: Partial<MenuItemData>) => void;
  removeMenuItem: (itemId: string) => void;
  moveMenuItem: (itemId: string, fromLevel2Id: string, toLevel2Id: string, order: number) => void;
  reorderMenuItems: (level2Id: string, order: string[]) => void;
  selectSection: (sectionId: string | null) => void;
  selectLevel2: (level2Id: string | null) => void;
  selectItem: (itemId: string | null) => void;
  validateConfig: () => ReturnType<typeof validateMenuConfig> | null;
  saveDraft: () => void;
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

    case 'REORDER_SECTIONS': {
      if (!state.draftConfig) return state;
      return {
        ...state,
        draftConfig: reorderSections(state.draftConfig, action.order),
        isDirty: true,
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

    case 'REORDER_LEVEL2': {
      if (!state.draftConfig) return state;
      return {
        ...state,
        draftConfig: reorderLevel2Groups(state.draftConfig, action.sectionId, action.order),
        isDirty: true,
      };
    }

    case 'MOVE_LEVEL2': {
      if (!state.draftConfig) return state;
      return {
        ...state,
        draftConfig: moveLevel2Group(state.draftConfig, action.level2Id, action.toSectionId, action.order),
        isDirty: true,
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

    case 'SET_VALIDATION': {
      return {
        ...state,
        validationResult: action.validation,
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

    case 'SAVE_DRAFT':
      return {
        ...state,
        isDirty: false,
      };

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

    const draft = draftJson ? migrateMenuConfiguration(JSON.parse(draftJson)) : null;
    const published = publishedJson ? migrateMenuConfiguration(JSON.parse(publishedJson)) : null;

    dispatch({
      type: 'LOAD_CONFIGS',
      draft: draft ? { ...draft, status: 'draft' } : null,
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
      notifyPublishedMenuUpdated();
    }
  }, [state.publishedConfig]);

  const addSectionHandler = useCallback((input: Pick<MenuSectionData, 'label' | 'description' | 'iconName' | 'isVisible'>) => {
    if (!state.draftConfig) return;
    const nextOrder = Math.max(...state.draftConfig.sections.map((s) => s.order), -1) + 1;
    const section = { ...createMenuSection(input.label, nextOrder), ...input };
    dispatch({ type: 'ADD_SECTION', section });
  }, [state.draftConfig]);

  const updateSectionHandler = useCallback((sectionId: string, updates: Partial<MenuSectionData>) => {
    dispatch({ type: 'UPDATE_SECTION', sectionId, updates });
  }, []);

  const removeSectionHandler = useCallback((sectionId: string) => {
    dispatch({ type: 'REMOVE_SECTION', sectionId });
  }, []);

  const addLevel2Handler = useCallback((sectionId: string, input: Pick<MenuLevelData, 'label' | 'description' | 'hideLabel' | 'isVisible'>) => {
    if (!state.draftConfig) return;
    const section = findSection(state.draftConfig, sectionId);
    if (!section) return;
    const nextOrder = Math.max(...section.level2Groups.map((l2) => l2.order), -1) + 1;
    const level2 = { ...createMenuLevel2(input.label, sectionId, nextOrder), ...input };
    dispatch({ type: 'ADD_LEVEL2', sectionId, level2 });
  }, [state.draftConfig]);

  const updateLevel2Handler = useCallback((level2Id: string, updates: Partial<MenuLevelData>) => {
    dispatch({ type: 'UPDATE_LEVEL2', level2Id, updates });
  }, []);

  const removeLevel2Handler = useCallback((level2Id: string) => {
    dispatch({ type: 'REMOVE_LEVEL2', level2Id });
  }, []);

  const addMenuItemHandler = useCallback((level2Id: string, input: Pick<MenuItemData, 'label' | 'key' | 'description' | 'iconName' | 'route' | 'externalUrl' | 'openInNewTab' | 'isVisible'>) => {
    if (!state.draftConfig) return;
    const level2 = findLevel2(state.draftConfig, level2Id);
    if (!level2) return;
    const nextOrder = Math.max(...level2.items.map((item) => item.order), -1) + 1;
    const item = { ...createMenuItem(input.label, level2Id, nextOrder), ...input };
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

  const reorderSectionsHandler = useCallback((order: string[]) => {
    dispatch({ type: 'REORDER_SECTIONS', order });
  }, []);

  const reorderLevel2GroupsHandler = useCallback((sectionId: string, order: string[]) => {
    dispatch({ type: 'REORDER_LEVEL2', sectionId, order });
  }, []);

  const moveLevel2GroupHandler = useCallback((level2Id: string, toSectionId: string, order: number) => {
    dispatch({ type: 'MOVE_LEVEL2', level2Id, toSectionId, order });
  }, []);

  const reorderMenuItemsHandler = useCallback((level2Id: string, order: string[]) => {
    dispatch({ type: 'REORDER_ITEMS', level2Id, order });
  }, []);

  const validateConfigHandler = useCallback(() => {
    if (!state.draftConfig) {
      dispatch({ type: 'SET_VALIDATION', validation: null });
      return null;
    }

    const validation = validateMenuConfig(state.draftConfig);
    dispatch({ type: 'SET_VALIDATION', validation });
    return validation;
  }, [state.draftConfig]);

  const saveDraftHandler = useCallback(() => {
    if (!state.draftConfig) {
      return;
    }

    localStorage.setItem(MENU_BUILDER_STORAGE_KEYS.DRAFT_CONFIG, JSON.stringify(state.draftConfig));
    notifyDraftSaved();
    dispatch({ type: 'SAVE_DRAFT' });
  }, [state.draftConfig]);

  const value: MenuBuilderContextType = {
    state,
    addSection: addSectionHandler,
    updateSection: updateSectionHandler,
    removeSection: removeSectionHandler,
    reorderSections: reorderSectionsHandler,
    addLevel2: addLevel2Handler,
    updateLevel2: updateLevel2Handler,
    removeLevel2: removeLevel2Handler,
    reorderLevel2Groups: reorderLevel2GroupsHandler,
    moveLevel2Group: moveLevel2GroupHandler,
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
    validateConfig: validateConfigHandler,
    saveDraft: saveDraftHandler,
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
