// ─── Product Master — TypeScript Types ───────────────────────────────────────

// ─── Enums / Union Types ──────────────────────────────────────────────────────

export type ProductType =
  | 'Finished Good'
  | 'Raw Material'
  | 'Spare Part'
  | 'Service'
  | 'Consumable'
  | 'Kit';

export type ProductStatus = 'Draft' | 'Active' | 'Inactive' | 'Discontinued';

export type ScopeType = 'Global' | 'Local';

export type ScopeDimension = 'Organization' | 'Branch' | 'Warehouse' | 'Channel';

export type ScopeActivationStatus = 'Active' | 'Inactive' | 'Blocked';

export type ConsumptionStrategy = 'FIFO' | 'FEFO' | 'LIFO' | 'Manual';

export type SalesDiscontinuationBehavior =
  | 'Allow sell-through existing stock'
  | 'Block new sales orders'
  | 'Block all sales transactions';

export type PurchaseDiscontinuationBehavior =
  | 'Block new purchase orders'
  | 'Allow existing POs to complete'
  | 'Block all purchase transactions';

export type PackType =
  | 'Box'
  | 'Carton'
  | 'Drum'
  | 'Can'
  | 'Bottle'
  | 'Crate'
  | 'Pallet'
  | 'Loose'
  | 'Set';

export type PackMaterial =
  | 'Plastic'
  | 'Metal'
  | 'Cardboard'
  | 'Wooden'
  | 'Glass'
  | 'Composite';

export type IdentifierType =
  | 'GTIN'
  | 'HS Code'
  | 'HSN'
  | 'OEM Part No.'
  | 'Manufacturer Part No.'
  | 'UPC'
  | 'EAN'
  | 'Other';

export type AssociationType = 'Alternate' | 'Supersedes' | 'Kit Component';

export type OrgType =
  | 'OEM'
  | 'Distributor'
  | 'Dealer'
  | 'Retailer'
  | 'Warehouse'
  | 'Service Center'
  | 'Export Unit';

// ─── Sub-Entities ─────────────────────────────────────────────────────────────

export interface ProductScopeMapping {
  id: string;
  scopeType: ScopeType;
  scopeDimension: ScopeDimension;
  scopeValue: string;
  scopeActivationStatus: ScopeActivationStatus;
  effectiveFromDate: string;
  effectiveToDate: string;
}

export interface ProductUOMRow {
  id: string;
  applicableUOM: string;
  conversionReference: string;
  /** Read-only — fetched from UOM Conversion Master via conversionReference. */
  conversionToBaseUOM: string;
}

export interface ProductPackagingRow {
  id: string;
  packType: PackType | '';
  packSize: string;
  packMaterial: PackMaterial | '';
  packagingDescription: string;
  purchaseSetQuantity: string;
  salesSetQuantity: string;
  organizationType: OrgType | '';
}

export interface ProductIdentifierRow {
  id: string;
  identifierType: IdentifierType | '';
  identifierValue: string;
}

export interface ProductAssociationRow {
  id: string;
  associationType: AssociationType | '';
  relatedProductCode: string;
  relatedProductName: string;
}

// ─── Main Product Master ──────────────────────────────────────────────────────

export interface ProductMaster {
  id: string;

  // § 1 – Product Definition
  // Note: Product Authenticity removed (review decision).
  // Brand / Make moved to § 3 Product Hierarchy (review decision).
  productCode: string;
  productName: string;
  productDescription: string;
  productType: ProductType | '';
  manufacturerOEM: string;
  countryOfOrigin: string;
  countryOfAssembly: string;

  // § 2 – Product Classification
  productClass: string;
  productCategory: string;
  productSubCategory: string;

  // § 3 – Product Hierarchy  (Brand moved here from § 1 per review comment)
  brand: string;
  productFamily: string;
  productLine: string;
  modelBaseProduct: string;
  variantConfiguration: string;
  skuTradeItem: string;

  // § 4 – Scope & Applicability
  scopeMappings: ProductScopeMapping[];

  // § 5 – Unit of Measurement
  baseUOM: string;
  applicableUOMs: ProductUOMRow[];

  // § 6 – Packaging  (hidden for Service type)
  packagingRows: ProductPackagingRow[];

  // § 7 – Product Dimensions  (hidden for Service type)
  netWeight: string;
  grossWeight: string;
  length: string;
  width: string;
  height: string;
  volume: string;
  dimensionUOM: string;
  weightUOM: string;

  // § 8 – Inventory Configuration  (hidden for Service type)
  // Note: Shelf Life removed — managed as attribute (review decision).
  stockableIndicator: boolean;
  serializedTrackingRequired: boolean;
  batchTrackingRequired: boolean;
  lotTrackingRequired: boolean;
  consumptionStrategy: ConsumptionStrategy | '';
  storageCondition: string;
  warrantyApplicable: boolean;

  // § 9 – Sales Configuration  (hidden for Raw Material / Consumable)
  // Note: Sales Return Eligibility removed — managed by Return Policy Config (review decision).
  sellableIndicator: boolean;
  salesChannelEligibility: string[];
  salesDiscontinuationBehavior: SalesDiscontinuationBehavior | '';

  // § 10 – Purchase Configuration
  // Note: Purchase Return Eligibility removed — managed by Return Policy Config (review decision).
  purchasableIndicator: boolean;
  purchaseDiscontinuationBehavior: PurchaseDiscontinuationBehavior | '';

  // § 12 – Product Identifiers
  productIdentifiers: ProductIdentifierRow[];

  // § 13 – Product Associations
  productAssociations: ProductAssociationRow[];

  // § 14 – Status & Availability
  productStatus: ProductStatus;
  effectiveFromDate: string;
  effectiveToDate: string;
  discontinuationDate: string;

  // Audit
  createdAt: string;
  updatedAt: string;
}
