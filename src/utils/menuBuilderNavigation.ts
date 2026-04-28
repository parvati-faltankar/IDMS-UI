import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  FileMinus2,
  FilePlus2,
  FolderKanban,
  Grid2x2,
  LayoutPanelTop,
  PackageCheck,
  ReceiptText,
  Settings2,
  ShoppingBag,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import { menuStructure } from '../components/common/appShellShared';
import { paths } from '../routes/routeConfig';
import { MENU_BUILDER_CONSTANTS } from './menuBuilderTypes';
import type { MenuConfiguration, MenuItemData, MenuLevelData, MenuSectionData } from './menuBuilderTypes';

export const MENU_BUILDER_EVENTS = {
  publishedUpdated: 'menu-builder:published-updated',
  draftSaved: 'menu-builder:draft-saved',
} as const;

export const menuBuilderIconRegistry: Record<string, LucideIcon> = {
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  FileMinus2,
  FilePlus2,
  FolderKanban,
  Grid2x2,
  LayoutPanelTop,
  PackageCheck,
  ReceiptText,
  Settings2,
  ShoppingBag,
  ShoppingCart,
  Truck,
};

const iconNameByComponent = new Map(
  Object.entries(menuBuilderIconRegistry).map(([name, component]) => [component, name] as const)
);

const defaultSectionIconByLabel = new Map(
  menuStructure.map((section) => [section.label, resolveIconName(section.icon)])
);

const defaultItemIconByKey = new Map(
  menuStructure.flatMap((section) =>
    section.level2.flatMap((level2) =>
      (level2.level3 ?? []).map((item) => [item.key, resolveIconName(item.icon)])
    )
  )
);

const canonicalMenuItemKeys = new Set(
  menuStructure.flatMap((section) =>
    section.level2.flatMap((level2) => (level2.level3 ?? []).map((item) => item.key))
  )
);

export const defaultMenuItemRouteByKey: Record<string, string> = {
  'purchase-requisition': paths.purchaseRequisitionList,
  'purchase-order': paths.purchaseOrderList,
  'purchase-receipt': paths.purchaseReceiptList,
  'purchase-invoice': paths.purchaseInvoiceList,
  'sale-order': paths.saleOrderList,
  'sale-allocation-requisition': paths.saleAllocationRequisitionList,
  'sale-allocation': paths.saleAllocationList,
  'sale-invoice': paths.saleInvoiceList,
  delivery: paths.deliveryList,
  'form-layout': paths.formLayoutSettings,
  'theme-builder': paths.themeBuilder,
  'menu-builder': paths.menuBuilder,
  'business-settings': paths.businessSettings,
};

export function resolveIconName(icon?: LucideIcon | null): string | null {
  if (!icon) {
    return null;
  }

  return iconNameByComponent.get(icon) ?? null;
}

export function getIconByName(iconName?: string | null): LucideIcon | undefined {
  if (!iconName) {
    return undefined;
  }

  return menuBuilderIconRegistry[iconName];
}

export function getDefaultSectionIconName(label: string): string | null {
  return defaultSectionIconByLabel.get(label) ?? null;
}

export function getDefaultItemIconName(key: string): string | null {
  return defaultItemIconByKey.get(key) ?? null;
}

export function getDefaultRouteForKey(key: string): string | undefined {
  return defaultMenuItemRouteByKey[key];
}

export function isCanonicalMenuItemKey(key: string): boolean {
  return canonicalMenuItemKeys.has(key);
}

function createCanonicalSections(): MenuSectionData[] {
  return menuStructure.map((section, sectionIndex) => ({
    id: `canonical-section-${sectionIndex}`,
    label: section.label,
    level: 1 as const,
    order: sectionIndex,
    iconName: resolveIconName(section.icon),
    isExpanded: true,
    isVisible: true,
    level2Groups: section.level2.map((level2, level2Index) => ({
      id: `canonical-level2-${sectionIndex}-${level2Index}`,
      label: level2.label,
      level: 2 as const,
      parentLevelId: `canonical-section-${sectionIndex}`,
      order: level2Index,
      hideLabel: level2.hideLabel ?? false,
      isExpanded: true,
      isVisible: true,
      items: (level2.level3 ?? []).map((item, itemIndex) => ({
        id: `canonical-item-${sectionIndex}-${level2Index}-${itemIndex}`,
        label: item.label,
        key: item.key,
        parentLevelId: `canonical-level2-${sectionIndex}-${level2Index}`,
        order: itemIndex,
        iconName: resolveIconName(item.icon),
        route: getDefaultRouteForKey(item.key),
        openInNewTab: false,
        isVisible: true,
      })),
    })),
  }));
}

function mergeCanonicalItems(existingLevel2: MenuLevelData, canonicalLevel2: MenuLevelData): MenuLevelData {
  const existingItemsByKey = new Map(existingLevel2.items.map((item) => [item.key, item]));
  const mergedItems: MenuItemData[] = [...existingLevel2.items];

  canonicalLevel2.items.forEach((canonicalItem) => {
    const existingItem = existingItemsByKey.get(canonicalItem.key);
    if (!existingItem) {
      mergedItems.push({
        ...canonicalItem,
        id: `item-${canonicalItem.key}`,
        parentLevelId: existingLevel2.id,
        order: mergedItems.length,
      });
      return;
    }

    if (!existingItem.route && canonicalItem.route) {
      existingItem.route = canonicalItem.route;
    }

    if (!existingItem.iconName && canonicalItem.iconName) {
      existingItem.iconName = canonicalItem.iconName;
    }
  });

  return {
    ...existingLevel2,
    items: mergedItems.map((item, index) => ({ ...item, order: index })),
  };
}

function mergeCanonicalGroups(existingSection: MenuSectionData, canonicalSection: MenuSectionData): MenuSectionData {
  const existingLevel2ByLabel = new Map(existingSection.level2Groups.map((level2) => [level2.label, level2]));
  const mergedGroups: MenuLevelData[] = [...existingSection.level2Groups];

  canonicalSection.level2Groups.forEach((canonicalLevel2) => {
    const existingLevel2 = existingLevel2ByLabel.get(canonicalLevel2.label);
    if (!existingLevel2) {
      mergedGroups.push({
        ...canonicalLevel2,
        id: `level2-${existingSection.label.toLowerCase()}-${canonicalLevel2.label.toLowerCase().replace(/\s+/g, '-')}`,
        parentLevelId: existingSection.id,
        items: canonicalLevel2.items.map((item, index) => ({
          ...item,
          id: `item-${item.key}`,
          parentLevelId: `level2-${existingSection.label.toLowerCase()}-${canonicalLevel2.label.toLowerCase().replace(/\s+/g, '-')}`,
          order: index,
        })),
        order: mergedGroups.length,
      });
      return;
    }

    const mergedLevel2 = mergeCanonicalItems(existingLevel2, canonicalLevel2);
    const existingIndex = mergedGroups.findIndex((group) => group.id === existingLevel2.id);
    mergedGroups[existingIndex] = {
      ...mergedLevel2,
      hideLabel: mergedLevel2.hideLabel ?? canonicalLevel2.hideLabel,
    };
  });

  return {
    ...existingSection,
    iconName: existingSection.iconName ?? canonicalSection.iconName,
    level2Groups: mergedGroups.map((group, index) => ({ ...group, order: index })),
  };
}

function mergeWithCanonicalNavigation(config: MenuConfiguration): MenuConfiguration {
  const canonicalSections = createCanonicalSections();
  const existingSectionsByLabel = new Map(config.sections.map((section) => [section.label, section]));
  const mergedSections: MenuSectionData[] = [...config.sections];

  canonicalSections.forEach((canonicalSection) => {
    const existingSection = existingSectionsByLabel.get(canonicalSection.label);
    if (!existingSection) {
      mergedSections.push({
        ...canonicalSection,
        id: `section-${canonicalSection.label.toLowerCase()}`,
        level2Groups: canonicalSection.level2Groups.map((level2, level2Index) => {
          const level2Id = `level2-${canonicalSection.label.toLowerCase()}-${level2.label.toLowerCase().replace(/\s+/g, '-')}`;
          return {
            ...level2,
            id: level2Id,
            parentLevelId: `section-${canonicalSection.label.toLowerCase()}`,
            order: level2Index,
            items: level2.items.map((item, itemIndex) => ({
              ...item,
              id: `item-${item.key}`,
              parentLevelId: level2Id,
              order: itemIndex,
            })),
          };
        }),
        order: mergedSections.length,
      });
      return;
    }

    const mergedSection = mergeCanonicalGroups(existingSection, canonicalSection);
    const existingIndex = mergedSections.findIndex((section) => section.id === existingSection.id);
    mergedSections[existingIndex] = mergedSection;
  });

  return {
    ...config,
    version: MENU_BUILDER_CONSTANTS.VERSION,
    sections: mergedSections.map((section, index) => ({ ...section, order: index })),
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return value as Record<string, unknown>;
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' ? value : fallback;
}

export function migrateMenuConfiguration(rawConfig: unknown): MenuConfiguration | null {
  const config = asRecord(rawConfig);
  if (!config) {
    return null;
  }
  const now = Date.now();
  const sections = Array.isArray(config.sections) ? config.sections : [];

  const migratedConfig: MenuConfiguration = {
    id: readString(config.id, `config-${now}`),
    name: readString(config.name, 'Default Menu'),
    status: config.status === 'published' ? 'published' : 'draft',
    createdAt: readNumber(config.createdAt, now),
    updatedAt: readNumber(config.updatedAt, now),
    publishedAt: typeof config.publishedAt === 'number' ? config.publishedAt : undefined,
    version: readNumber(config.version, MENU_BUILDER_CONSTANTS.VERSION),
    sections: sections.map((section, sectionIndex) => {
      const sectionRecord = asRecord(section) ?? {};
      const level2Groups = Array.isArray(sectionRecord.level2Groups) ? sectionRecord.level2Groups : [];

      return {
          id: readString(sectionRecord.id, `section-${sectionIndex}`),
          label: readString(sectionRecord.label, `Section ${sectionIndex + 1}`),
          level: 1 as const,
          order: readNumber(sectionRecord.order, sectionIndex),
          iconName:
            (readString(sectionRecord.iconName, '') ||
            getDefaultSectionIconName(readString(sectionRecord.label, ''))) ??
            null,
          description: readString(sectionRecord.description, ''),
          isExpanded: readBoolean(sectionRecord.isExpanded, true),
          isVisible: readBoolean(sectionRecord.isVisible, true),
          metadata: asRecord(sectionRecord.metadata) ?? undefined,
          level2Groups: level2Groups.map((level2, level2Index) => {
                const level2Record = asRecord(level2) ?? {};
                const items = Array.isArray(level2Record.items) ? level2Record.items : [];

                return {
                id: readString(level2Record.id, `level2-${sectionIndex}-${level2Index}`),
                label: readString(level2Record.label, `Group ${level2Index + 1}`),
                level: 2 as const,
                parentLevelId: readString(level2Record.parentLevelId, readString(sectionRecord.id, `section-${sectionIndex}`)),
                order: readNumber(level2Record.order, level2Index),
                hideLabel: readBoolean(level2Record.hideLabel, false),
                description: readString(level2Record.description, ''),
                isExpanded: readBoolean(level2Record.isExpanded, true),
                isVisible: readBoolean(level2Record.isVisible, true),
                metadata: asRecord(level2Record.metadata) ?? undefined,
                items: items.map((item, itemIndex) => {
                      const itemRecord = asRecord(item) ?? {};
                      return {
                      id: readString(itemRecord.id, `item-${sectionIndex}-${level2Index}-${itemIndex}`),
                      label: readString(itemRecord.label, `Item ${itemIndex + 1}`),
                      key: readString(itemRecord.key, `item-${sectionIndex}-${level2Index}-${itemIndex}`),
                      parentLevelId: readString(itemRecord.parentLevelId, readString(level2Record.id, `level2-${sectionIndex}-${level2Index}`)),
                      order: readNumber(itemRecord.order, itemIndex),
                      iconName:
                        (readString(itemRecord.iconName, '') ||
                        getDefaultItemIconName(readString(itemRecord.key, ''))) ??
                        null,
                      route: readString(itemRecord.route, '') || getDefaultRouteForKey(readString(itemRecord.key, '')),
                      externalUrl: readString(itemRecord.externalUrl, '') || undefined,
                      openInNewTab: readBoolean(itemRecord.openInNewTab, false),
                      description: readString(itemRecord.description, ''),
                      isVisible: readBoolean(itemRecord.isVisible, true),
                      metadata: asRecord(itemRecord.metadata) ?? undefined,
                    };
                  }),
              };
            }),
        };
      }),
  };

  if (migratedConfig.version < MENU_BUILDER_CONSTANTS.VERSION) {
    return mergeWithCanonicalNavigation(migratedConfig);
  }

  return migratedConfig;
}

export function notifyPublishedMenuUpdated() {
  window.dispatchEvent(new CustomEvent(MENU_BUILDER_EVENTS.publishedUpdated));
}

export function notifyDraftSaved() {
  window.dispatchEvent(new CustomEvent(MENU_BUILDER_EVENTS.draftSaved));
}