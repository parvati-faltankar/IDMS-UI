import { describe, expect, it } from 'vitest';
import { menuStructure } from '../components/common/appShellShared';
import { convertLevel1ToMenuConfig } from './menuInitialization';
import {
  findLevel2,
  findMenuItem,
  moveLevel2Group,
  moveMenuItem,
  reorderSections,
  validateMenuConfig,
} from './menuBuilderUtils';

function createConfig() {
  return convertLevel1ToMenuConfig(menuStructure);
}

describe('menuBuilderUtils', () => {
  it('allows canonical menu items without explicit routes to publish', () => {
    const config = createConfig();
    const validation = validateMenuConfig(config);

    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('reorders sections while keeping all sections', () => {
    const config = createConfig();
    const reordered = reorderSections(config, ['section-1', 'section-0']);

    expect(reordered.sections[0]?.label).toBe('Sales');
    expect(reordered.sections[1]?.label).toBe('Procurement');
    expect(reordered.sections).toHaveLength(config.sections.length);
  });

  it('moves a level2 group to another section and rewrites its parent', () => {
    const config = createConfig();
    const moved = moveLevel2Group(config, 'level2-0-0', 'section-1', 0);
    const movedGroup = findLevel2(moved, 'level2-0-0');
    const sourceSection = moved.sections.find((section) => section.id === 'section-0');
    const targetSection = moved.sections.find((section) => section.id === 'section-1');

    expect(movedGroup?.parentLevelId).toBe('section-1');
    expect(sourceSection?.level2Groups.find((group) => group.id === 'level2-0-0')).toBeUndefined();
    expect(targetSection?.level2Groups[0]?.id).toBe('level2-0-0');
  });

  it('moves an item between groups and rewrites its parent', () => {
    const config = createConfig();
    const firstSalesGroupId = 'level2-1-0';
    const moved = moveMenuItem(config, 'item-0-0-0', 'level2-0-0', firstSalesGroupId, 0);
    const movedItem = findMenuItem(moved, 'item-0-0-0');
    const procurementGroup = findLevel2(moved, 'level2-0-0');
    const salesGroup = findLevel2(moved, firstSalesGroupId);

    expect(movedItem?.parentLevelId).toBe(firstSalesGroupId);
    expect(procurementGroup?.items.find((item) => item.id === 'item-0-0-0')).toBeUndefined();
    expect(salesGroup?.items[0]?.id).toBe('item-0-0-0');
  });

  it('flags custom items without a route or external URL', () => {
    const config = createConfig();
    const procurementGroup = findLevel2(config, 'level2-0-0');

    if (!procurementGroup) {
      throw new Error('Expected level2-0-0 to exist in the default menu config');
    }

    procurementGroup.items.push({
      id: 'item-custom',
      label: 'Custom Workspace',
      key: 'custom-workspace',
      parentLevelId: procurementGroup.id,
      order: procurementGroup.items.length,
      isVisible: true,
    });

    const validation = validateMenuConfig(config);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((error) => error.message.includes('Custom Workspace'))).toBe(true);
  });
});