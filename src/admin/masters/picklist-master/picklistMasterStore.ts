export type PicklistConfigType = 'Independent' | 'Dependent' | 'Multi-Level';

export interface PicklistConfigRecord {
  id: string;
  code: string;
  name: string;
  displayName: string;
  entity: string;
  entityType: string;
  description: string;
  configurationType: PicklistConfigType;
  isActive: boolean;
  dependentParentConfigId?: string;
  dependentParentValueId?: string;
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
}

export interface PicklistLevelRecord {
  id: string;
  configId: string;
  levelSequence: string;
  parentLevelId: string;
  picklistName: string;
  displayName: string;
  allowMultipleParentMapping: boolean;
  allowValueReuse: boolean;
}

export interface PicklistValueRecord {
  id: string;
  configId: string;
  levelId: string;
  code: string;
  name: string;
  displayName: string;
  description: string;
  displaySequence: string;
  isActive: boolean;
  isDefault: boolean;
}

export interface DependencyMappingRecord {
  id: string;
  configId: string;
  parentLevelId: string;
  parentValueId: string;
  childLevelId: string;
  childValueId: string;
  isActive: boolean;
}

export interface PicklistMasterState {
  configs: PicklistConfigRecord[];
  levels: PicklistLevelRecord[];
  values: PicklistValueRecord[];
  mappings: DependencyMappingRecord[];
}

export const PICKLIST_ENTITY_OPTIONS = ['Address', 'Organisation', 'Supplier', 'Customer', 'Location'] as const;
export const PICKLIST_ENTITY_TYPE_OPTIONS = ['Master', 'Transactional', 'Reference'] as const;

export const PICKLIST_STORAGE_KEY = 'idms.picklist-master.v2';

const SEED_STATE: PicklistMasterState = {
  configs: [
    {
      id: 'CFG-001',
      code: 'PCK-001',
      name: 'Country',
      displayName: 'Country',
      entity: 'Address',
      entityType: 'Master',
      description: 'List of countries for address fields',
      configurationType: 'Independent',
      isActive: true,
      createdBy: 'Admin',
      createdDate: '2026-01-10 09:00',
      lastModifiedBy: 'Admin',
      lastModifiedDate: '2026-01-10 09:00',
    },
    {
      id: 'CFG-002',
      code: 'PCK-002',
      name: 'Region District',
      displayName: 'Region / District',
      entity: 'Address',
      entityType: 'Master',
      description: 'Two-level geographic hierarchy',
      configurationType: 'Dependent',
      isActive: true,
      createdBy: 'Admin',
      createdDate: '2026-01-12 10:00',
      lastModifiedBy: 'Admin',
      lastModifiedDate: '2026-01-12 10:00',
    },
    {
      id: 'CFG-003',
      code: 'PCK-003',
      name: 'Country State City',
      displayName: 'Country / State / City',
      entity: 'Address',
      entityType: 'Master',
      description: 'Three-level geographic hierarchy for shipping addresses',
      configurationType: 'Multi-Level',
      isActive: true,
      createdBy: 'Admin',
      createdDate: '2026-01-15 11:00',
      lastModifiedBy: 'Admin',
      lastModifiedDate: '2026-01-15 11:00',
    },
  ],
  levels: [
    { id: 'LVL-001', configId: 'CFG-002', levelSequence: '1', parentLevelId: '', picklistName: 'Region', displayName: 'Region', allowMultipleParentMapping: false, allowValueReuse: false },
    { id: 'LVL-002', configId: 'CFG-002', levelSequence: '2', parentLevelId: 'LVL-001', picklistName: 'District', displayName: 'District', allowMultipleParentMapping: false, allowValueReuse: false },
    { id: 'LVL-003', configId: 'CFG-003', levelSequence: '1', parentLevelId: '', picklistName: 'Country', displayName: 'Country', allowMultipleParentMapping: false, allowValueReuse: false },
    { id: 'LVL-004', configId: 'CFG-003', levelSequence: '2', parentLevelId: 'LVL-003', picklistName: 'State', displayName: 'State', allowMultipleParentMapping: false, allowValueReuse: false },
    { id: 'LVL-005', configId: 'CFG-003', levelSequence: '3', parentLevelId: 'LVL-004', picklistName: 'City', displayName: 'City', allowMultipleParentMapping: false, allowValueReuse: false },
  ],
  values: [
    { id: 'VAL-001', configId: 'CFG-001', levelId: 'DEFAULT', code: 'INDIA', name: 'India', displayName: 'India', description: '', displaySequence: '1', isActive: true, isDefault: true },
    { id: 'VAL-002', configId: 'CFG-001', levelId: 'DEFAULT', code: 'USA', name: 'United States', displayName: 'United States', description: '', displaySequence: '2', isActive: true, isDefault: false },
    { id: 'VAL-003', configId: 'CFG-001', levelId: 'DEFAULT', code: 'UK', name: 'United Kingdom', displayName: 'United Kingdom', description: '', displaySequence: '3', isActive: true, isDefault: false },
    { id: 'VAL-004', configId: 'CFG-002', levelId: 'LVL-001', code: 'NORTH', name: 'North', displayName: 'North India', description: '', displaySequence: '1', isActive: true, isDefault: false },
    { id: 'VAL-005', configId: 'CFG-002', levelId: 'LVL-001', code: 'SOUTH', name: 'South', displayName: 'South India', description: '', displaySequence: '2', isActive: true, isDefault: false },
    { id: 'VAL-006', configId: 'CFG-002', levelId: 'LVL-001', code: 'EAST', name: 'East', displayName: 'East India', description: '', displaySequence: '3', isActive: true, isDefault: false },
    { id: 'VAL-007', configId: 'CFG-002', levelId: 'LVL-002', code: 'DEL', name: 'Delhi', displayName: 'Delhi', description: '', displaySequence: '1', isActive: true, isDefault: false },
    { id: 'VAL-008', configId: 'CFG-002', levelId: 'LVL-002', code: 'MUM', name: 'Mumbai', displayName: 'Mumbai', description: '', displaySequence: '2', isActive: true, isDefault: false },
    { id: 'VAL-009', configId: 'CFG-002', levelId: 'LVL-002', code: 'CHE', name: 'Chennai', displayName: 'Chennai', description: '', displaySequence: '3', isActive: true, isDefault: false },
    { id: 'VAL-010', configId: 'CFG-002', levelId: 'LVL-002', code: 'BLR', name: 'Bangalore', displayName: 'Bengaluru', description: '', displaySequence: '4', isActive: true, isDefault: false },
  ],
  mappings: [
    { id: 'MAP-001', configId: 'CFG-002', parentLevelId: 'LVL-001', parentValueId: 'VAL-004', childLevelId: 'LVL-002', childValueId: 'VAL-007', isActive: true },
    { id: 'MAP-002', configId: 'CFG-002', parentLevelId: 'LVL-001', parentValueId: 'VAL-004', childLevelId: 'LVL-002', childValueId: 'VAL-008', isActive: true },
    { id: 'MAP-003', configId: 'CFG-002', parentLevelId: 'LVL-001', parentValueId: 'VAL-005', childLevelId: 'LVL-002', childValueId: 'VAL-009', isActive: true },
    { id: 'MAP-004', configId: 'CFG-002', parentLevelId: 'LVL-001', parentValueId: 'VAL-005', childLevelId: 'LVL-002', childValueId: 'VAL-010', isActive: true },
  ],
};

function cloneSeedState(): PicklistMasterState {
  return JSON.parse(JSON.stringify(SEED_STATE)) as PicklistMasterState;
}

function normalizeState(raw: Partial<PicklistMasterState> | null | undefined): PicklistMasterState {
  const seed = cloneSeedState();
  return {
    configs: Array.isArray(raw?.configs)
      ? raw!.configs.map((entry) => ({
          entity: 'Address',
          entityType: 'Master',
          ...entry,
          configurationType: entry.configurationType === 'Multi-Level Dependent' ? 'Multi-Level' : entry.configurationType,
        }))
      : seed.configs,
    levels: Array.isArray(raw?.levels) ? raw!.levels : seed.levels,
    values: Array.isArray(raw?.values) ? raw!.values : seed.values,
    mappings: Array.isArray(raw?.mappings) ? raw!.mappings : seed.mappings,
  };
}

export function loadPicklistMasterState(): PicklistMasterState {
  if (typeof window === 'undefined') return cloneSeedState();
  try {
    const raw = window.localStorage.getItem(PICKLIST_STORAGE_KEY);
    if (!raw) return cloneSeedState();
    return normalizeState(JSON.parse(raw) as Partial<PicklistMasterState>);
  } catch {
    return cloneSeedState();
  }
}

export function savePicklistMasterState(next: PicklistMasterState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PICKLIST_STORAGE_KEY, JSON.stringify(next));
}

