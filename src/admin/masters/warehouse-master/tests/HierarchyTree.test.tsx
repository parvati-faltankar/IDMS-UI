import { describe, expect, it } from 'vitest';
import { flattenHierarchyItems, getTreeKeyboardTarget } from '../components/HierarchyTree';
import type { HierarchyNode } from '../types/warehouse.types';

const TREE: HierarchyNode[] = [
  {
    id: 'root',
    locationId: 'root',
    locationCode: 'Z01',
    locationName: 'Zone 01',
    levelCode: 'ZONE',
    levelName: 'Zone',
    children: [
      {
        id: 'aisle',
        locationId: 'aisle',
        locationCode: 'A01',
        locationName: 'Aisle 01',
        levelCode: 'AISLE',
        levelName: 'Aisle',
        parentId: 'root',
        children: [],
        isLeaf: true,
        inventoryAllowed: true,
        status: 'Active',
        fullCode: 'WH-Z01-A01',
      },
    ],
    isLeaf: false,
    inventoryAllowed: false,
    status: 'Active',
    fullCode: 'WH-Z01',
  },
];

describe('HierarchyTree helpers', () => {
  it('keeps warehouse root visible in flattened hierarchy', () => {
    const withRoot: HierarchyNode[] = [{
      id: '__WAREHOUSE_ROOT__',
      locationCode: 'WM02',
      locationName: 'Warehouse 02',
      levelCode: 'WAREHOUSE',
      levelName: 'Warehouse',
      children: TREE,
      isLeaf: false,
      inventoryAllowed: false,
      status: 'Active',
      fullCode: 'WM02',
    }];
    const items = flattenHierarchyItems(withRoot, new Set(['__WAREHOUSE_ROOT__', 'root']));
    expect(items[0].id).toBe('__WAREHOUSE_ROOT__');
  });

  it('flattens expanded tree items in visible order', () => {
    const items = flattenHierarchyItems(TREE, new Set(['root']));
    expect(items.map((item) => item.id)).toEqual(['root', 'aisle']);
  });

  it('filters by search while retaining ancestors', () => {
    const items = flattenHierarchyItems(TREE, new Set(), 'aisle');
    expect(items.map((item) => item.id)).toEqual(['root', 'aisle']);
  });

  it('supports keyboard navigation down and up', () => {
    const items = flattenHierarchyItems(TREE, new Set(['root']));
    expect(getTreeKeyboardTarget(items, 'root', 'ArrowDown')).toBe('aisle');
    expect(getTreeKeyboardTarget(items, 'aisle', 'ArrowUp')).toBe('root');
    expect(getTreeKeyboardTarget(items, 'aisle', 'Home')).toBe('root');
    expect(getTreeKeyboardTarget(items, 'root', 'End')).toBe('aisle');
  });
});
