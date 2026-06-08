import type {
  EffectiveCapacityPolicy,
  EffectiveNodeCapabilities,
  EligibilityEffectiveScope,
  HierarchyLevel,
  HierarchyNode,
  HierarchyTemplate,
  WarehouseLocation,
} from '../types/warehouse.types';
import type { ValidationIssue } from '../types/warehouse.types';
import type {
  EligibilityScopeType,
  HierarchyLevelRole,
  LocationType,
} from '../types/warehouse.enums';

export const WAREHOUSE_ROOT_LEVEL_CODE = 'WAREHOUSE';

function normalizeCode(value: string | undefined): string {
  return value?.trim().toUpperCase() ?? '';
}

function normalizeSeparator(separator: string | undefined, fallback = '-'): string {
  const raw = (separator ?? fallback).trim();
  return raw.length === 0 ? fallback : raw;
}

function extractNumericSuffix(value: string, prefix: string, suffix: string): number | null {
  const upper = value.trim().toUpperCase();
  const normalizedPrefix = prefix.trim().toUpperCase();
  const normalizedSuffix = suffix.trim().toUpperCase();
  if (!upper.startsWith(normalizedPrefix)) return null;
  const withoutPrefix = upper.slice(normalizedPrefix.length);
  const withoutSuffix = normalizedSuffix && withoutPrefix.endsWith(normalizedSuffix)
    ? withoutPrefix.slice(0, withoutPrefix.length - normalizedSuffix.length)
    : withoutPrefix;
  const digitsOnly = withoutSuffix.replace(/[^0-9]/g, '');
  if (!digitsOnly) return null;
  const parsed = Number(digitsOnly);
  return Number.isFinite(parsed) ? parsed : null;
}

export interface LocationCodingPolicy {
  readonly includeWarehouseCodeInIdentifier: boolean;
  readonly pathSeparator: string;
  readonly defaultSequenceLength: number;
  readonly manualNodeCodeAllowed: boolean;
  readonly autoGenerateNodeCodeAllowed: boolean;
  readonly codeLockedAfterActivation: boolean;
  readonly codePrefix: string;
  readonly startSequence: number;
  readonly sequenceLength: number;
  readonly codeSeparator: string;
  readonly suffix: string;
}

export interface GenerateNodeCodeInput {
  readonly policy: LocationCodingPolicy;
  readonly existingSiblingCodes: string[];
  readonly manualCode?: string;
  readonly autoGenerate: boolean;
}

export interface GenerateNodeCodeResult {
  readonly nodeCode: string;
  readonly sequenceUsed?: number;
  readonly preview: string;
}

export interface DeriveFullLocationIdentifierInput {
  readonly warehouseCode: string;
  readonly activeTemplate?: Pick<HierarchyTemplate, 'defaultPathSeparator' | 'includeWarehouseCodeInIdentifier'>;
  readonly parentLocationId?: string;
  readonly parentChain?: WarehouseLocation[];
  readonly allLocations?: WarehouseLocation[];
  readonly nodeCode: string;
  readonly separator?: string;
  readonly includeWarehouseCodeInIdentifier?: boolean;
}

export function deriveLocationCodingPolicy(
  template: HierarchyTemplate | undefined,
  level: HierarchyLevel | undefined,
): LocationCodingPolicy {
  return {
    includeWarehouseCodeInIdentifier: template?.includeWarehouseCodeInIdentifier ?? true,
    pathSeparator: normalizeSeparator(template?.defaultPathSeparator, '-'),
    defaultSequenceLength: Math.max(1, template?.defaultSequenceLength ?? 3),
    manualNodeCodeAllowed: template?.manualNodeCodeAllowed ?? true,
    autoGenerateNodeCodeAllowed: template?.autoGenerateNodeCodeAllowed ?? true,
    codeLockedAfterActivation: template?.codeLockedAfterActivation ?? true,
    codePrefix: (level?.codePrefix ?? level?.levelCode ?? 'L').trim().toUpperCase(),
    startSequence: Math.max(1, level?.startSequence ?? 1),
    sequenceLength: Math.max(1, level?.sequenceLength ?? template?.defaultSequenceLength ?? 3),
    codeSeparator: normalizeSeparator(level?.separator, ''),
    suffix: (level?.suffix ?? '').trim().toUpperCase(),
  };
}

export function generateNodeCode(input: GenerateNodeCodeInput): GenerateNodeCodeResult {
  const { policy, existingSiblingCodes, manualCode, autoGenerate } = input;
  if (!autoGenerate && policy.manualNodeCodeAllowed) {
    const nodeCode = (manualCode ?? '').trim().toUpperCase();
    return { nodeCode, preview: nodeCode };
  }

  const siblingSet = new Set(existingSiblingCodes.map((code) => code.trim().toUpperCase()));
  const baseSequence = Math.max(1, policy.startSequence);
  let nextSequence = baseSequence;
  for (const code of siblingSet) {
    const extracted = extractNumericSuffix(code, policy.codePrefix, policy.suffix);
    if (extracted !== null) {
      nextSequence = Math.max(nextSequence, extracted + 1);
    }
  }

  while (true) {
    const padded = String(nextSequence).padStart(policy.sequenceLength, '0');
    const candidate = [policy.codePrefix, padded, policy.suffix]
      .filter(Boolean)
      .join(policy.codeSeparator)
      .toUpperCase();
    if (!siblingSet.has(candidate)) {
      return { nodeCode: candidate, sequenceUsed: nextSequence, preview: candidate };
    }
    nextSequence += 1;
  }
}

function mapLocationRoleToLocationType(role: HierarchyLevelRole | undefined): LocationType {
  switch (role) {
    case 'Dock':
      return 'Dock';
    case 'Staging':
      return 'Staging';
    case 'QC':
      return 'QC';
    case 'Scrap':
      return 'Scrap';
    default:
      return 'General';
  }
}

export function getTemplateLevelById(
  template: HierarchyTemplate | undefined,
  levelId: string | undefined,
): HierarchyLevel | undefined {
  if (!template || !levelId) return undefined;
  const normalizedLevelId = normalizeCode(levelId);
  return template.levels.find((level) => normalizeCode(level.levelId) === normalizedLevelId);
}

export function getTemplateLevelByCode(
  template: HierarchyTemplate | undefined,
  levelCode: string | undefined,
): HierarchyLevel | undefined {
  if (!template || !levelCode) return undefined;
  const normalizedLevelCode = normalizeCode(levelCode);
  return template.levels.find((level) => normalizeCode(level.levelCode) === normalizedLevelCode);
}

export function deriveEffectiveNodeCapabilities(
  template: HierarchyTemplate | undefined,
  levelOrLocation: HierarchyLevel | WarehouseLocation | null | undefined,
): EffectiveNodeCapabilities {
  const level = isWarehouseLocation(levelOrLocation)
    ? getTemplateLevelForLocation(levelOrLocation, template)
    : levelOrLocation ?? undefined;

  return {
    capacityApplicable: level?.capacityApplicable ?? false,
    itemEligibilityApplicable: level?.itemEligibilityApplicable ?? false,
    responsibilityApplicable: level?.responsibilityApplicable ?? false,
    inventoryEndpointEligible: level?.inventoryEndpointEligible ?? level?.leafEligible ?? false,
    barcodeApplicable: level?.barcodeApplicable ?? false,
    qrApplicable: level?.qrApplicable ?? false,
    transactionPurposes: [...(level?.transactionPurposes ?? [])],
    capacityEnforcementMode: level?.capacityEnforcementMode ?? 'None',
    capacityRollupMode: level?.capacityRollupMode ?? 'None',
    allowCapabilityOverride: level?.allowCapabilityOverride ?? false,
    defaultResponsibilityRole: level?.defaultResponsibilityRole,
    defaultLocationRole: level?.defaultLocationRole ?? 'Structural',
    defaultLocationType: level?.defaultLocationType,
  };
}

export function deriveEffectiveCapacityPolicy(
  template: HierarchyTemplate | undefined,
  levelOrLocation: HierarchyLevel | WarehouseLocation | null | undefined,
): EffectiveCapacityPolicy {
  const capabilities = deriveEffectiveNodeCapabilities(template, levelOrLocation);
  return {
    applicable: capabilities.capacityApplicable,
    enforcementMode: capabilities.capacityApplicable
      ? capabilities.capacityEnforcementMode
      : 'None',
    rollupMode: capabilities.capacityApplicable
      ? capabilities.capacityRollupMode
      : 'None',
    consumptionSources:
      (isWarehouseLocation(levelOrLocation)
        ? getTemplateLevelForLocation(levelOrLocation, template)?.capacityConsumptionSources
        : levelOrLocation?.capacityConsumptionSources) ?? [],
  };
}

export function deriveEffectiveEligibilityScope(
  warehouseId: string,
  location: WarehouseLocation | null | undefined,
  template?: HierarchyTemplate,
): EligibilityEffectiveScope {
  const capabilities = deriveEffectiveNodeCapabilities(template, location ?? undefined);
  const scopeType: EligibilityScopeType =
    location && capabilities.itemEligibilityApplicable ? 'HierarchyNode' : 'Warehouse';

  return {
    scopeType,
    warehouseId,
    locationId: scopeType === 'HierarchyNode' ? location?.id : undefined,
    templateLevelCode: location?.profile.templateLevelCode,
    scopeLabel: scopeType === 'HierarchyNode'
      ? `${location?.locationCode ?? 'Unknown'} (${location?.profile.templateLevelCode ?? 'LEVEL'})`
      : warehouseId,
    applicable: scopeType === 'HierarchyNode',
  };
}

export function getTemplateLevelForLocation(
  location: WarehouseLocation | null | undefined,
  template?: HierarchyTemplate,
): HierarchyLevel | undefined {
  if (!location || !template) return undefined;

  return (
    getTemplateLevelById(template, location.profile.templateLevelId) ??
    getTemplateLevelByCode(template, location.profile.templateLevelCode) ??
    template.levels.find((level) => level.sequence === location.profile.level)
  );
}

export function resolveLocationTypeForLevel(level: HierarchyLevel): LocationType {
  return level.defaultLocationType ?? mapLocationRoleToLocationType(level.defaultLocationRole);
}

export function resolveTemplateLevelForInput(
  template: HierarchyTemplate | undefined,
  parent: WarehouseLocation | null,
  input: {
    templateLevelId?: string;
    templateLevelCode?: string;
    locationType?: LocationType;
  },
): HierarchyLevel | undefined {
  if (!template) return undefined;

  const allowedLevels = getAllowedChildLevels(parent, template);
  const byId = getTemplateLevelById(template, input.templateLevelId);
  if (byId) {
    return allowedLevels.find((level) => normalizeCode(level.levelId) === normalizeCode(byId.levelId));
  }

  const byCode = getTemplateLevelByCode(template, input.templateLevelCode);
  if (byCode) {
    return allowedLevels.find((level) => normalizeCode(level.levelCode) === normalizeCode(byCode.levelCode));
  }

  if (!input.locationType) return undefined;

  return allowedLevels.find((level) => resolveLocationTypeForLevel(level) === input.locationType);
}

export function deriveFullLocationIdentifier(
  input: DeriveFullLocationIdentifierInput,
): string;
export function deriveFullLocationIdentifier(
  warehouseCode: string,
  locationCode: string,
  parentLocationId: string | undefined,
  allLocations: WarehouseLocation[],
  separator?: string,
): string;
export function deriveFullLocationIdentifier(
  inputOrWarehouseCode: DeriveFullLocationIdentifierInput | string,
  locationCode?: string,
  parentLocationId?: string,
  allLocations?: WarehouseLocation[],
  separator = '-',
): string {
  if (typeof inputOrWarehouseCode !== 'string') {
    const useWarehouse = inputOrWarehouseCode.includeWarehouseCodeInIdentifier
      ?? inputOrWarehouseCode.activeTemplate?.includeWarehouseCodeInIdentifier
      ?? true;
    const effectiveSeparator = normalizeSeparator(
      inputOrWarehouseCode.separator ?? inputOrWarehouseCode.activeTemplate?.defaultPathSeparator,
      '-',
    );
    const parentPool = inputOrWarehouseCode.parentChain ?? inputOrWarehouseCode.allLocations ?? [];
    const parent = inputOrWarehouseCode.parentLocationId
      ? parentPool.find((item) => item.id === inputOrWarehouseCode.parentLocationId)
      : undefined;
    const nodeSegment = inputOrWarehouseCode.nodeCode.trim().toUpperCase();
    const warehouseSegment = inputOrWarehouseCode.warehouseCode.trim().toUpperCase();
    const parentFullCode = parent?.profile.fullCode?.trim().toUpperCase() ?? '';
    const warehousePrefix = `${warehouseSegment}${effectiveSeparator}`;
    const normalizedParentPath = parentFullCode.startsWith(warehousePrefix)
      ? parentFullCode.slice(warehousePrefix.length)
      : parentFullCode === warehouseSegment
        ? ''
        : parentFullCode;
    const withoutWarehouse = normalizedParentPath
      ? normalizedParentPath.split(effectiveSeparator).filter(Boolean)
      : [];
    const base = useWarehouse
      ? [warehouseSegment, ...withoutWarehouse, nodeSegment]
      : [...withoutWarehouse, nodeSegment];

    return base.filter(Boolean).join(effectiveSeparator);
  }

  const warehouseCode = inputOrWarehouseCode;
  const locationSegment = (locationCode ?? '').trim().toUpperCase();
  if (!parentLocationId) {
    return [warehouseCode.trim().toUpperCase(), locationSegment].filter(Boolean).join(separator);
  }

  const parent = (allLocations ?? []).find((item) => item.id === parentLocationId);
  if (!parent) {
    return [warehouseCode.trim().toUpperCase(), locationSegment].filter(Boolean).join(separator);
  }

  return [parent.profile.fullCode, locationSegment].filter(Boolean).join(separator);
}

export function buildFullLocationCode(
  locationId: string,
  allLocations: WarehouseLocation[],
): string {
  const location = allLocations.find((item) => item.id === locationId);
  if (!location) return '';

  const warehouseCode = location.profile.fullCode.split('-')[0] ?? '';
  return deriveFullLocationIdentifier(
    warehouseCode,
    location.locationCode,
    location.parentLocationId,
    allLocations,
  );
}

export function buildFullLocationCodeFromParent(
  warehouseCode: string,
  locationCode: string,
  parentLocationId: string | undefined,
  allLocations: WarehouseLocation[],
): string {
  return deriveFullLocationIdentifier({
    warehouseCode,
    nodeCode: locationCode,
    parentLocationId,
    allLocations,
  });
}

export function buildHierarchyTree(
  locations: WarehouseLocation[],
  template?: HierarchyTemplate,
): HierarchyNode[] {
  const nodeMap = new Map<string, HierarchyNode>();

  for (const location of locations) {
    const level = getTemplateLevelForLocation(location, template);
    nodeMap.set(location.id, {
      id: location.id,
      locationId: location.id,
      locationCode: location.locationCode,
      locationName: location.locationName,
      levelCode: level?.levelCode ?? location.profile.templateLevelCode ?? `LEVEL-${location.profile.level}`,
      levelName: level?.levelName ?? location.profile.templateLevelCode ?? `Level ${location.profile.level}`,
      parentId: location.parentLocationId,
      children: [],
      isLeaf: location.profile.isLeafEndpoint,
      inventoryAllowed: location.profile.inventoryAllowed,
      status: location.status,
      fullCode: location.profile.fullCode,
    });
  }

  const roots: HierarchyNode[] = [];
  for (const node of nodeMap.values()) {
    if (node.parentId) {
      const parent = nodeMap.get(node.parentId);
      if (parent) {
        (parent.children as HierarchyNode[]).push(node);
      }
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export function buildTemplatePathPreviews(
  levels: HierarchyLevel[],
  flexiblePathEnabled: boolean,
  maxPaths = 12,
): string[] {
  if (levels.length === 0) return [];

  const sorted = [...levels].sort((left, right) => left.sequence - right.sequence);
  const usesExplicitParentRules = sorted.some((level) => (level.allowedParentLevels ?? []).length > 0);
  const codeToLevel = new Map(sorted.map((level) => [normalizeCode(level.levelCode), level]));

  const childrenByParent = new Map<string, HierarchyLevel[]>();
  if (usesExplicitParentRules) {
    for (const level of sorted) {
      for (const parentCode of level.allowedParentLevels ?? []) {
        const normalizedParent = normalizeCode(parentCode);
        if (!childrenByParent.has(normalizedParent)) {
          childrenByParent.set(normalizedParent, []);
        }
        childrenByParent.get(normalizedParent)!.push(level);
      }
    }
  }

  const results: string[] = [];

  function getChildren(current: HierarchyLevel | null): HierarchyLevel[] {
    if (usesExplicitParentRules) {
      const key = current ? normalizeCode(current.levelCode) : WAREHOUSE_ROOT_LEVEL_CODE;
      return [...(childrenByParent.get(key) ?? [])].sort((left, right) => left.sequence - right.sequence);
    }

    if (!current) {
      const firstSequence = Math.min(...sorted.map((item) => item.sequence));
      return sorted.filter((level) => level.sequence === firstSequence);
    }

    if (!flexiblePathEnabled) {
      const nextLevel = sorted.find((level) => level.sequence === current.sequence + 1);
      return nextLevel ? [nextLevel] : [];
    }

    return sorted.filter((candidate) => {
      if (candidate.sequence <= current.sequence) return false;
      const skippedLevels = sorted.filter(
        (level) => level.sequence > current.sequence && level.sequence < candidate.sequence,
      );
      return skippedLevels.every((level) => level.allowSkipLevel || !level.mandatory);
    });
  }

  function walk(current: HierarchyLevel | null, stack: HierarchyLevel[]) {
    if (results.length >= maxPaths) return;

    const children = getChildren(current);
    if (current && (current.leafEligible || children.length === 0)) {
      results.push(['WAREHOUSE', ...stack.map((item) => item.levelCode)].join(' -> '));
      if (results.length >= maxPaths) return;
    }

    for (const child of children) {
      const normalizedCode = normalizeCode(child.levelCode);
      if (stack.some((item) => normalizeCode(item.levelCode) === normalizedCode)) continue;
      walk(child, [...stack, child]);
      if (results.length >= maxPaths) return;
    }
  }

  if (usesExplicitParentRules) {
    const roots = childrenByParent.get(WAREHOUSE_ROOT_LEVEL_CODE) ?? [];
    for (const root of roots) {
      walk(root, [root]);
      if (results.length >= maxPaths) break;
    }
  } else {
    walk(null, []);
  }

  if (results.length === 0 && codeToLevel.has('BIN')) {
    results.push('WAREHOUSE -> BIN');
  }

  return results;
}

export function buildLevelGeneratedCodeExample(
  level: HierarchyLevel,
  templateDefaults?: Pick<HierarchyTemplate, 'defaultSequenceLength'>,
): string {
  if (!level.autoGenerateCode) return level.codePrefix?.trim() || level.levelCode;
  const prefix = (level.codePrefix ?? level.levelCode).trim().toUpperCase();
  const sequenceLength = Math.max(1, level.sequenceLength ?? templateDefaults?.defaultSequenceLength ?? 3);
  const sequence = String(Math.max(1, level.startSequence ?? 1)).padStart(sequenceLength, '0');
  const separator = normalizeSeparator(level.separator, '-');
  const suffix = (level.suffix ?? '').trim().toUpperCase();
  return [prefix, sequence, suffix].filter(Boolean).join(separator);
}

export function buildTemplateIdentifierExamples(
  template: Pick<HierarchyTemplate, 'levels' | 'flexiblePathEnabled' | 'defaultPathSeparator' | 'includeWarehouseCodeInIdentifier' | 'defaultSequenceLength'>,
  warehouseCode: string,
  maxPaths = 6,
): string[] {
  const pathPreviews = buildTemplatePathPreviews(template.levels, template.flexiblePathEnabled, maxPaths);
  const byCode = new Map(template.levels.map((level) => [normalizeCode(level.levelCode), level]));
  const separator = normalizeSeparator(template.defaultPathSeparator, '-');
  const whSegment = warehouseCode.trim().toUpperCase() || 'WH';

  return pathPreviews.map((path) => {
    const segments = path
      .split('->')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .filter((segment) => segment !== WAREHOUSE_ROOT_LEVEL_CODE)
      .map((code) => {
        const level = byCode.get(normalizeCode(code));
        return level ? buildLevelGeneratedCodeExample(level, template) : code;
      });

    const allSegments = template.includeWarehouseCodeInIdentifier === false
      ? segments
      : [whSegment, ...segments];

    return allSegments.join(separator);
  });
}

export function validateTemplateLevelTree(levels: HierarchyLevel[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (levels.length === 0) {
    issues.push({
      section: 'hierarchyTemplate',
      severity: 'error',
      category: 'FieldRequired',
      message: 'At least one hierarchy level is required.',
    });
    return issues;
  }

  const sequences = levels.map((level) => level.sequence);
  if (new Set(sequences).size !== sequences.length) {
    issues.push({
      section: 'hierarchyTemplate',
      severity: 'error',
      category: 'DuplicateCode',
      message: 'Hierarchy level sequence numbers must be unique.',
    });
  }

  const codes = levels.map((level) => normalizeCode(level.levelCode));
  if (new Set(codes).size !== codes.length) {
    issues.push({
      section: 'hierarchyTemplate',
      severity: 'error',
      category: 'DuplicateCode',
      message: 'Hierarchy level codes must be unique.',
    });
  }

  const levelIds = levels.map((level) => normalizeCode(level.levelId)).filter(Boolean);
  if (levelIds.length > 0 && new Set(levelIds).size !== levelIds.length) {
    issues.push({
      section: 'hierarchyTemplate',
      severity: 'error',
      category: 'DuplicateCode',
      message: 'Hierarchy level identifiers must be unique when supplied.',
    });
  }

  if (!levels.some((level) => level.leafEligible)) {
    issues.push({
      section: 'hierarchyTemplate',
      severity: 'error',
      category: 'PolicyConflict',
      message: 'At least one level must be marked as Leaf Eligible.',
    });
  }

  const sorted = [...levels].sort((left, right) => left.sequence - right.sequence);
  const codeSet = new Set(sorted.map((level) => normalizeCode(level.levelCode)));
  const usesExplicitParentRules = sorted.some((level) => (level.allowedParentLevels ?? []).length > 0);

  sorted.forEach((level, index) => {
    if (!level.levelCode.trim()) {
      issues.push({
        field: `levels[${index}].levelCode`,
        section: 'hierarchyTemplate',
        severity: 'error',
        category: 'FieldRequired',
        message: 'Each hierarchy level requires a Level Code.',
      });
    }

    if (!level.levelName.trim()) {
      issues.push({
        field: `levels[${index}].levelName`,
        section: 'hierarchyTemplate',
        severity: 'error',
        category: 'FieldRequired',
        message: `Hierarchy level "${level.levelCode || index + 1}" requires a Level Name.`,
      });
    }

    const levelRole = level.levelRole ?? level.defaultLocationRole;
    if (!levelRole) {
      issues.push({
        field: `levels[${index}].levelRole`,
        section: 'hierarchyTemplate',
        severity: 'error',
        category: 'FieldRequired',
        message: `Level "${level.levelCode || index + 1}" requires a Level Role.`,
      });
    }

    if ((level.autoGenerateCode ?? false) && !(level.codePrefix ?? level.levelCode).trim()) {
      issues.push({
        field: `levels[${index}].codePrefix`,
        section: 'hierarchyTemplate',
        severity: 'error',
        category: 'FieldRequired',
        message: `Level "${level.levelCode}" requires a code prefix when Auto Generate Code is enabled.`,
      });
    }

    if ((level.autoGenerateCode ?? false) && (level.startSequence ?? 1) < 1) {
      issues.push({
        field: `levels[${index}].startSequence`,
        section: 'hierarchyTemplate',
        severity: 'error',
        category: 'FieldFormat',
        message: `Level "${level.levelCode}" start sequence must be greater than zero.`,
      });
    }

    if ((level.autoGenerateCode ?? false) && (level.sequenceLength ?? 3) < 1) {
      issues.push({
        field: `levels[${index}].sequenceLength`,
        section: 'hierarchyTemplate',
        severity: 'error',
        category: 'FieldFormat',
        message: `Level "${level.levelCode}" sequence length must be at least 1.`,
      });
    }

    if ((level.separator ?? '').includes(' ')) {
      issues.push({
        field: `levels[${index}].separator`,
        section: 'hierarchyTemplate',
        severity: 'error',
        category: 'FieldFormat',
        message: `Level "${level.levelCode}" separator cannot contain spaces.`,
      });
    }

    if (index === sorted.length - 1 && level.allowSkipLevel) {
      issues.push({
        field: `levels[${index}].allowSkipLevel`,
        section: 'hierarchyTemplate',
        severity: 'warning',
        category: 'PolicyConflict',
        message: `Level "${level.levelCode}" is the last level and Allow Skip Level has no effect.`,
      });
    }

    if (level.mandatory && level.allowSkipLevel) {
      issues.push({
        field: `levels[${index}].mandatory`,
        section: 'hierarchyTemplate',
        severity: 'error',
        category: 'PolicyConflict',
        message: `Level "${level.levelCode}" cannot be both Mandatory and Allow Skip Level.`,
      });
    }

    const normalizedParents = (level.allowedParentLevels ?? []).map(normalizeCode).filter(Boolean);
    if (new Set(normalizedParents).size !== normalizedParents.length) {
      issues.push({
        field: `levels[${index}].allowedParentLevels`,
        section: 'hierarchyTemplate',
        severity: 'error',
        category: 'DuplicateCode',
        message: `Level "${level.levelCode}" has duplicate Allowed Parent Level entries.`,
      });
    }

    const normalizedChildren = (level.allowedChildLevels ?? []).map(normalizeCode).filter(Boolean);
    if (new Set(normalizedChildren).size !== normalizedChildren.length) {
      issues.push({
        field: `levels[${index}].allowedChildLevels`,
        section: 'hierarchyTemplate',
        severity: 'error',
        category: 'DuplicateCode',
        message: `Level "${level.levelCode}" has duplicate Allowed Child Level entries.`,
      });
    }

    for (const parentCode of normalizedParents) {
      if (parentCode === WAREHOUSE_ROOT_LEVEL_CODE) continue;
      if (!codeSet.has(parentCode)) {
        issues.push({
          field: `levels[${index}].allowedParentLevels`,
          section: 'hierarchyTemplate',
          severity: 'error',
          category: 'DependencyMissing',
          message: `Level "${level.levelCode}" references unknown parent level "${parentCode}".`,
        });
      }
    }

    if (level.leafEligible && (level.allowedChildLevels ?? []).length > 0) {
      issues.push({
        field: `levels[${index}].allowedChildLevels`,
        section: 'hierarchyTemplate',
        severity: 'warning',
        category: 'PolicyConflict',
        message: `Level "${level.levelCode}" is Leaf Eligible; allowed child levels are usually expected to be empty.`,
      });
    }

    if ((level.inventoryEndpointEligible ?? false) && !level.leafEligible) {
      issues.push({
        field: `levels[${index}].inventoryEndpointEligible`,
        section: 'hierarchyTemplate',
        severity: 'error',
        category: 'PolicyConflict',
        message: `Level "${level.levelCode}" cannot be inventory-endpoint eligible unless it is Leaf Eligible.`,
      });
    }

    if ((level.inventoryEndpointEligible ?? false) && !(level.autoGenerateCode ?? false)) {
      issues.push({
        field: `levels[${index}].autoGenerateCode`,
        section: 'hierarchyTemplate',
        severity: 'warning',
        category: 'PolicyConflict',
        message: `Level "${level.levelCode}" is inventory-endpoint eligible. Consider enabling auto-generated codes for consistency.`,
      });
    }

    if (!(level.capacityApplicable ?? false) && (level.capacityEnforcementMode ?? 'None') !== 'None') {
      issues.push({
        field: `levels[${index}].capacityEnforcementMode`,
        section: 'hierarchyTemplate',
        severity: 'error',
        category: 'PolicyConflict',
        message: `Level "${level.levelCode}" cannot define capacity enforcement when Capacity Applicable is disabled.`,
      });
    }

    if (!(level.capacityApplicable ?? false) && (level.capacityRollupMode ?? 'None') !== 'None') {
      issues.push({
        field: `levels[${index}].capacityRollupMode`,
        section: 'hierarchyTemplate',
        severity: 'error',
        category: 'PolicyConflict',
        message: `Level "${level.levelCode}" cannot define capacity rollup when Capacity Applicable is disabled.`,
      });
    }

    if (!(level.responsibilityApplicable ?? false) && level.defaultResponsibilityRole) {
      issues.push({
        field: `levels[${index}].defaultResponsibilityRole`,
        section: 'hierarchyTemplate',
        severity: 'error',
        category: 'PolicyConflict',
        message: `Level "${level.levelCode}" cannot define a default responsibility role when Responsibility Applicable is disabled.`,
      });
    }
  });

  if (usesExplicitParentRules) {
    const adjacency = new Map<string, string[]>();
    for (const level of sorted) {
      const levelCode = normalizeCode(level.levelCode);
      if (!adjacency.has(levelCode)) adjacency.set(levelCode, []);
      for (const candidateChild of sorted) {
        const allowsParent = (candidateChild.allowedParentLevels ?? [])
          .map(normalizeCode)
          .includes(levelCode);
        if (allowsParent) {
          adjacency.get(levelCode)!.push(normalizeCode(candidateChild.levelCode));
        }
      }
    }

    const visiting = new Set<string>();
    const visited = new Set<string>();
    let hasCycle = false;

    function visit(node: string): void {
      if (hasCycle || visited.has(node)) return;
      if (visiting.has(node)) {
        hasCycle = true;
        return;
      }
      visiting.add(node);
      for (const nextNode of adjacency.get(node) ?? []) {
        visit(nextNode);
      }
      visiting.delete(node);
      visited.add(node);
    }

    for (const level of sorted) {
      visit(normalizeCode(level.levelCode));
      if (hasCycle) break;
    }

    if (hasCycle) {
      issues.push({
        section: 'hierarchyTemplate',
        severity: 'error',
        category: 'PolicyConflict',
        message: 'Hierarchy level rules contain a cycle. Parent-child relationships must form an acyclic graph.',
      });
    }

    const reachable = new Set<string>();
    const stack = ['WAREHOUSE'];
    while (stack.length > 0) {
      const current = stack.pop()!;
      for (const level of sorted) {
        const levelCode = normalizeCode(level.levelCode);
        const allowedParents = (level.allowedParentLevels ?? []).map(normalizeCode);
        if (!allowedParents.includes(current)) continue;
        if (reachable.has(levelCode)) continue;
        reachable.add(levelCode);
        stack.push(levelCode);
      }
    }

    const unreachable = sorted
      .map((level) => normalizeCode(level.levelCode))
      .filter((code) => !reachable.has(code));

    if (unreachable.length > 0) {
      issues.push({
        section: 'hierarchyTemplate',
        severity: 'error',
        category: 'PolicyConflict',
        message: `Some levels are unreachable from WAREHOUSE root: ${unreachable.join(', ')}.`,
      });
    }
  }

  const generatedExamples = sorted
    .filter((level) => level.autoGenerateCode)
    .map((level) => buildLevelGeneratedCodeExample(level));
  if (new Set(generatedExamples).size !== generatedExamples.length) {
    issues.push({
      section: 'hierarchyTemplate',
      severity: 'error',
      category: 'DuplicateCode',
      message: 'Generated code examples must be unique across hierarchy levels.',
    });
  }

  return issues;
}

export function isCircularHierarchy(
  locationId: string,
  proposedParentId: string | undefined,
  allLocations: WarehouseLocation[],
): boolean {
  if (!proposedParentId) return false;
  if (proposedParentId === locationId) return true;

  let currentId: string | undefined = proposedParentId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === locationId) return true;
    if (visited.has(currentId)) break;
    visited.add(currentId);
    currentId = allLocations.find((location) => location.id === currentId)?.parentLocationId;
  }

  return false;
}

export function computeLocationLevel(
  locationId: string,
  allLocations: WarehouseLocation[],
): number {
  let level = 1;
  let parentId = allLocations.find((location) => location.id === locationId)?.parentLocationId;

  while (parentId) {
    level++;
    parentId = allLocations.find((location) => location.id === parentId)?.parentLocationId;
    if (level > 50) break;
  }

  return level;
}

export function validateHierarchyDepthConsistency(
  locations: WarehouseLocation[],
  template: HierarchyTemplate,
): ValidationIssue[] {
  if (template.flexiblePathEnabled) return [];

  const leaves = locations.filter((location) => location.profile.isLeafEndpoint);
  if (leaves.length === 0) return [];

  const depths = new Set(leaves.map((location) => location.profile.level));
  if (depths.size <= 1) return [];

  return [
    {
      section: 'hierarchyTemplate',
      severity: 'warning',
      category: 'PolicyConflict',
      message: `Flexible paths are disabled but leaf locations exist at different depths (${[...depths].join(', ')}).`,
    },
  ];
}

export function getAllowedChildLevels(
  parent: WarehouseLocation | null,
  template?: HierarchyTemplate,
): HierarchyLevel[] {
  if (!template) return [];

  const parentLevelCode = parent
    ? getTemplateLevelForLocation(parent, template)?.levelCode ?? parent.profile.templateLevelCode ?? ''
    : WAREHOUSE_ROOT_LEVEL_CODE;
  const normalizedParentLevelCode = normalizeCode(parentLevelCode || WAREHOUSE_ROOT_LEVEL_CODE);

  const explicitMatches = template.levels
    .filter((level) =>
      (level.allowedParentLevels ?? []).some(
        (allowedParentLevel) => normalizeCode(allowedParentLevel) === normalizedParentLevelCode,
      ),
    )
    .sort((left, right) => left.sequence - right.sequence);

  if (explicitMatches.length > 0) {
    return explicitMatches;
  }

  if (!parent) {
    return [...template.levels]
      .filter((level) => level.sequence === Math.min(...template.levels.map((item) => item.sequence)))
      .sort((left, right) => left.sequence - right.sequence);
  }

  const parentLevel = getTemplateLevelForLocation(parent, template);
  if (!parentLevel) return [];

  if (!template.flexiblePathEnabled) {
    const nextLevel = template.levels.find((level) => level.sequence === parentLevel.sequence + 1);
    return nextLevel ? [nextLevel] : [];
  }

  const sortedLevels = [...template.levels].sort((left, right) => left.sequence - right.sequence);
  return sortedLevels.filter((candidate) => {
    if (candidate.sequence <= parentLevel.sequence) return false;
    const skippedLevels = sortedLevels.filter(
      (level) => level.sequence > parentLevel.sequence && level.sequence < candidate.sequence,
    );
    return skippedLevels.every((level) => level.allowSkipLevel || !level.mandatory);
  });
}

export function getAllowedChildTemplateLevels(
  parent: WarehouseLocation | null,
  template?: HierarchyTemplate,
): HierarchyLevel[] {
  return getAllowedChildLevels(parent, template);
}

export function canCreateChildLevel(
  parent: WarehouseLocation | null,
  childLevelCode: string,
  template?: HierarchyTemplate,
): boolean {
  return getAllowedChildLevels(parent, template).some(
    (level) => normalizeCode(level.levelCode) === normalizeCode(childLevelCode),
  );
}

export function explainChildLevelAllowance(
  parent: WarehouseLocation | null,
  childLevelCode: string,
  template?: HierarchyTemplate,
): { allowed: boolean; reason: string } {
  if (!template) {
    return { allowed: false, reason: 'No active hierarchy template is available.' };
  }

  const childLevel = getTemplateLevelByCode(template, childLevelCode);
  if (!childLevel) {
    return {
      allowed: false,
      reason: `Level "${childLevelCode}" is not part of the active template.`,
    };
  }

  if (canCreateChildLevel(parent, childLevelCode, template)) {
    return {
      allowed: true,
      reason: `${childLevel.levelName} is allowed under ${parent?.locationCode ?? 'warehouse root'} by the active template.`,
    };
  }

  const parentLabel = parent?.profile.templateLevelCode ?? parent?.locationCode ?? WAREHOUSE_ROOT_LEVEL_CODE;
  return {
    allowed: false,
    reason: `${childLevel.levelName} is not allowed under ${parentLabel}. Allowed parent levels: ${(childLevel.allowedParentLevels ?? []).join(', ') || 'none configured'}.`,
  };
}

export function getAllowedChildLocationTypes(
  parent: WarehouseLocation | null,
  template?: HierarchyTemplate,
): LocationType[] {
  return getAllowedChildLevels(parent, template).map(resolveLocationTypeForLevel);
}

export function isValidParentChildCombination(
  parent: WarehouseLocation | null,
  childType: LocationType,
  template?: HierarchyTemplate,
): boolean {
  return getAllowedChildLocationTypes(parent, template).includes(childType);
}

function isWarehouseLocation(
  value: HierarchyLevel | WarehouseLocation | null | undefined,
): value is WarehouseLocation {
  return Boolean(value && typeof value === 'object' && 'warehouseId' in value && 'profile' in value);
}
