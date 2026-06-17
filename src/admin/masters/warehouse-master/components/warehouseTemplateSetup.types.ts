import type {
  CapacityEnforcementMode,
  CapacityRollupMode,
  CycleCountFrequency,
  CycleCountScope,
  EligibilityMode,
  HierarchyLevelRole,
  LocationStatus,
  LocationTransactionPurpose,
  LocationType,
  PickingStrategy,
  PutawayStrategy,
  ResponsibilityRole,
} from '../types/warehouse.enums';

export type WarehouseTemplateSetupMode = 'recommended' | 'copy' | 'custom';

export interface WarehouseTemplateItemMappingRow {
  readonly id: string;
  readonly itemCode: string;
  readonly itemName: string;
  readonly uom: string;
  readonly mappingDirection: 'Allow' | 'Block';
  readonly effectiveFrom: string;
  readonly effectiveTo: string;
  readonly status: LocationStatus;
  readonly notes: string;
}

export interface WarehouseTemplateTreeNode {
  readonly id: string;
  readonly parentId: string;
  readonly name: string;
  readonly code: string;
  readonly status: LocationStatus;
  readonly levelName: string;
  readonly levelCode: string;
  readonly description: string;
  readonly role: HierarchyLevelRole;
  readonly locationType: LocationType;
  readonly mandatory: boolean;
  readonly allowSkipLevel: boolean;
  readonly leafEligible: boolean;
  readonly inventoryEndpointEligible: boolean;
  readonly capacityApplicable: boolean;
  readonly itemEligibilityApplicable: boolean;
  readonly responsibilityApplicable: boolean;
  readonly barcodeApplicable: boolean;
  readonly qrApplicable: boolean;
  readonly autoGenerateCode: boolean;
  readonly codePrefix: string;
  readonly startSequence: number;
  readonly sequenceLength: number;
  readonly separator: string;
  readonly suffix: string;
  readonly capacityEnforcementMode: CapacityEnforcementMode;
  readonly capacityRollupMode: CapacityRollupMode;
  readonly defaultResponsibilityRole?: ResponsibilityRole;
  readonly transactionPurposes: LocationTransactionPurpose[];
  readonly allowedParentLevels: string[];
  readonly allowedChildLevels: string[];
  readonly eligibilityMode: EligibilityMode;
  readonly eligibilityDefaultFallback: 'Allow' | 'Block';
  readonly eligibilityRulesSummary: string;
  readonly putawayEnabled: boolean;
  readonly putawayStrategySequence: PutawayStrategy[];
  readonly putawayOverrideAllowed: boolean;
  readonly pickingEnabled: boolean;
  readonly pickingStrategySequence: PickingStrategy[];
  readonly pickingOverrideAllowed: boolean;
  readonly cycleCountEnabled: boolean;
  readonly cycleCountScope: CycleCountScope;
  readonly cycleCountFrequency: CycleCountFrequency;
  readonly cycleCountVarianceTolerance: number;
  readonly cycleCountVarianceUnit: 'Percent' | 'Units';
  readonly cycleCountFreezeEnabled: boolean;
  readonly maxStorageQuantity?: number;
  readonly maxWeight?: number;
  readonly maxVolume?: number;
  readonly maxWidth?: number;
  readonly maxHeight?: number;
  readonly maxLengthDepth?: number;
  readonly floorLoad?: number;
  readonly rackStructuralLoad?: number;
  readonly temperatureControlled?: boolean;
  readonly minTemperature?: number;
  readonly maxTemperature?: number;
  readonly humidity?: number;
  readonly hazmatClass?: string;
  readonly fireClass?: string;
  readonly mixedItemAllowed?: boolean;
  readonly mixedLotAllowed?: boolean;
  readonly mixedOwnerAllowed?: boolean;
  readonly complianceLockRequired?: boolean;
  readonly itemMappings?: WarehouseTemplateItemMappingRow[];
  readonly currentVersion?: number;
  readonly lastUpdatedOn?: string;
  readonly lastUpdatedBy?: string;
  readonly changeSummary?: string;
  readonly previousSnapshotSummary?: string;
  readonly children: WarehouseTemplateTreeNode[];
}

export interface WarehouseTemplateLevelDraft {
  readonly name: string;
  readonly code: string;
  readonly status: LocationStatus;
  readonly levelName: string;
  readonly levelCode: string;
  readonly description: string;
  readonly role: HierarchyLevelRole;
  readonly locationType: LocationType;
  readonly mandatory: boolean;
  readonly allowSkipLevel: boolean;
  readonly leafEligible: boolean;
  readonly inventoryEndpointEligible: boolean;
  readonly capacityApplicable: boolean;
  readonly itemEligibilityApplicable: boolean;
  readonly responsibilityApplicable: boolean;
  readonly barcodeApplicable: boolean;
  readonly qrApplicable: boolean;
  readonly autoGenerateCode: boolean;
  readonly codePrefix: string;
  readonly startSequence: number;
  readonly sequenceLength: number;
  readonly separator: string;
  readonly suffix: string;
  readonly capacityEnforcementMode: CapacityEnforcementMode;
  readonly capacityRollupMode: CapacityRollupMode;
  readonly defaultResponsibilityRole?: ResponsibilityRole;
  readonly transactionPurposes: LocationTransactionPurpose[];
  readonly allowedParentLevels: string[];
  readonly allowedChildLevels: string[];
  readonly eligibilityMode: EligibilityMode;
  readonly eligibilityDefaultFallback: 'Allow' | 'Block';
  readonly eligibilityRulesSummary: string;
  readonly putawayEnabled: boolean;
  readonly putawayStrategySequence: PutawayStrategy[];
  readonly putawayOverrideAllowed: boolean;
  readonly pickingEnabled: boolean;
  readonly pickingStrategySequence: PickingStrategy[];
  readonly pickingOverrideAllowed: boolean;
  readonly cycleCountEnabled: boolean;
  readonly cycleCountScope: CycleCountScope;
  readonly cycleCountFrequency: CycleCountFrequency;
  readonly cycleCountVarianceTolerance: number;
  readonly cycleCountVarianceUnit: 'Percent' | 'Units';
  readonly cycleCountFreezeEnabled: boolean;
  readonly maxStorageQuantity?: number;
  readonly maxWeight?: number;
  readonly maxVolume?: number;
  readonly maxWidth?: number;
  readonly maxHeight?: number;
  readonly maxLengthDepth?: number;
  readonly floorLoad?: number;
  readonly rackStructuralLoad?: number;
  readonly temperatureControlled?: boolean;
  readonly minTemperature?: number;
  readonly maxTemperature?: number;
  readonly humidity?: number;
  readonly hazmatClass?: string;
  readonly fireClass?: string;
  readonly mixedItemAllowed?: boolean;
  readonly mixedLotAllowed?: boolean;
  readonly mixedOwnerAllowed?: boolean;
  readonly complianceLockRequired?: boolean;
  readonly itemMappings?: WarehouseTemplateItemMappingRow[];
  readonly currentVersion?: number;
  readonly lastUpdatedOn?: string;
  readonly lastUpdatedBy?: string;
  readonly changeSummary?: string;
  readonly previousSnapshotSummary?: string;
}
