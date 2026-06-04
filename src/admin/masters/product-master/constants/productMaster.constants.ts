// ─── Product Master — Constants ───────────────────────────────────────────────

import type {
  ProductType,
  ProductStatus,
  ScopeType,
  ScopeDimension,
  ScopeActivationStatus,
  ConsumptionStrategy,
  SalesDiscontinuationBehavior,
  PurchaseDiscontinuationBehavior,
  PackType,
  PackMaterial,
  IdentifierType,
  AssociationType,
  OrgType,
} from '../types/productMaster.types';

export const PRODUCT_TYPES: ProductType[] = [
  'Finished Good',
  'Raw Material',
  'Spare Part',
  'Service',
  'Consumable',
  'Kit',
];

export const PRODUCT_STATUSES: ProductStatus[] = [
  'Draft',
  'Active',
  'Inactive',
  'Discontinued',
];

export const PRODUCT_TYPE_META: Record<ProductType, { color: string; bgColor: string; description: string }> = {
  'Finished Good': { color: '#1D4ED8', bgColor: '#EFF6FF', description: 'Manufactured or assembled product ready for sale' },
  'Raw Material':  { color: '#0891B2', bgColor: '#ECFEFF', description: 'Input material used in manufacturing or production' },
  'Spare Part':    { color: '#7C3AED', bgColor: '#F5F3FF', description: 'Replacement parts for servicing and repairs' },
  'Service':       { color: '#B45309', bgColor: '#FFFBEB', description: 'Non-physical service offering, not stockable' },
  'Consumable':    { color: '#15803D', bgColor: '#F0FDF4', description: 'Products consumed during use or operations' },
  'Kit':           { color: '#BE185D', bgColor: '#FDF2F8', description: 'Bundle of multiple components sold or used together' },
};

// ─── Smart Visibility Rules ───────────────────────────────────────────────────

/**
 * Step 2 (Configuration) tab indices to HIDE for each product type.
 * Indices: 0=Inventory Config, 1=Sales Config, 2=Purchase Config, 3=Dimensions
 */
export const PRODUCT_TYPE_HIDDEN_CONFIG_TABS: Record<ProductType, number[]> = {
  'Finished Good': [],
  'Raw Material':  [1],        // Sales Config hidden
  'Spare Part':    [],
  'Service':       [0, 3],     // Inventory Config + Dimensions hidden
  'Consumable':    [1],        // Sales Config hidden
  'Kit':           [],
};

/** True = Packaging tab in Step 1 is hidden for this product type. */
export const PRODUCT_TYPE_HIDES_PACKAGING: Record<ProductType, boolean> = {
  'Finished Good': false,
  'Raw Material':  false,
  'Spare Part':    false,
  'Service':       true,
  'Consumable':    false,
  'Kit':           false,
};

/** True = Kit Components section shown in Associations tab. */
export const PRODUCT_TYPE_SHOWS_KIT_COMPONENTS: Record<ProductType, boolean> = {
  'Finished Good': false,
  'Raw Material':  false,
  'Spare Part':    false,
  'Service':       false,
  'Consumable':    false,
  'Kit':           true,
};

// ─── Scope ───────────────────────────────────────────────────────────────────

export const SCOPE_TYPES: ScopeType[] = ['Global', 'Local'];
export const SCOPE_DIMENSIONS: ScopeDimension[] = ['Organization', 'Branch', 'Warehouse', 'Channel'];
export const SCOPE_ACTIVATION_STATUSES: ScopeActivationStatus[] = ['Active', 'Inactive', 'Blocked'];

export const MOCK_SCOPE_VALUES: Record<ScopeDimension, { id: string; name: string }[]> = {
  Organization: [
    { id: 'ORG-001', name: 'HQ Organization' },
    { id: 'ORG-002', name: 'Regional Office North' },
    { id: 'ORG-003', name: 'Regional Office South' },
  ],
  Branch: [
    { id: 'BRN-001', name: 'Mumbai Branch' },
    { id: 'BRN-002', name: 'Delhi Branch' },
    { id: 'BRN-003', name: 'Bangalore Branch' },
  ],
  Warehouse: [
    { id: 'WH-001', name: 'Central Warehouse' },
    { id: 'WH-002', name: 'North Hub' },
    { id: 'WH-003', name: 'South Hub' },
  ],
  Channel: [
    { id: 'CH-001', name: 'Dealer Channel' },
    { id: 'CH-002', name: 'Retail Channel' },
    { id: 'CH-003', name: 'Online Channel' },
  ],
};

// ─── UOM ─────────────────────────────────────────────────────────────────────

export const UOMS = [
  'Piece', 'Nos', 'Set', 'Kit', 'Pair',
  'Litre', 'Millilitre',
  'Kilogram', 'Gram', 'Tonne',
  'Metre', 'Centimetre', 'Millimetre',
  'Box', 'Carton', 'Drum', 'Can', 'Bottle', 'Crate', 'Pallet',
  'Hour', 'Day',
];

export const WEIGHT_UOMS = ['Kilogram', 'Gram', 'Tonne', 'Pound'];
export const DIMENSION_UOMS = ['Metre', 'Centimetre', 'Millimetre', 'Inch', 'Foot'];

/** Mock UOM Conversion Master entries — read-only in Product Master. */
export const MOCK_UOM_CONVERSIONS: {
  id: string;
  label: string;
  fromUOM: string;
  toUOM: string;
  conversionDisplay: string;
}[] = [
  { id: 'CONV-001', label: 'CONV-DRUM20-LTR',   fromUOM: '20L Drum',     toUOM: 'Litre',  conversionDisplay: '1 Drum = 20 Litres' },
  { id: 'CONV-002', label: 'CONV-4LCAN-LTR',    fromUOM: '4L Can',       toUOM: 'Litre',  conversionDisplay: '1 Can = 4 Litres' },
  { id: 'CONV-003', label: 'CONV-1LCAN-LTR',    fromUOM: '1L Can',       toUOM: 'Litre',  conversionDisplay: '1 Can = 1 Litre' },
  { id: 'CONV-004', label: 'CONV-BOX10-PCS',    fromUOM: 'Box of 10',    toUOM: 'Piece',  conversionDisplay: '1 Box = 10 Pieces' },
  { id: 'CONV-005', label: 'CONV-CTN12-PCS',    fromUOM: 'Carton of 12', toUOM: 'Piece',  conversionDisplay: '1 Carton = 12 Pieces' },
  { id: 'CONV-006', label: 'CONV-KG-GM',        fromUOM: 'Kilogram',     toUOM: 'Gram',   conversionDisplay: '1 Kilogram = 1000 Grams' },
  { id: 'CONV-007', label: 'CONV-SET4-PCS',     fromUOM: 'Set of 4',     toUOM: 'Piece',  conversionDisplay: '1 Set = 4 Pieces' },
  { id: 'CONV-008', label: 'CONV-PAIR-PCS',     fromUOM: 'Pair',         toUOM: 'Piece',  conversionDisplay: '1 Pair = 2 Pieces' },
];

// ─── Packaging ────────────────────────────────────────────────────────────────

export const PACK_TYPES: PackType[] = ['Box', 'Carton', 'Drum', 'Can', 'Bottle', 'Crate', 'Pallet', 'Loose', 'Set'];
export const PACK_MATERIALS: PackMaterial[] = ['Plastic', 'Metal', 'Cardboard', 'Wooden', 'Glass', 'Composite'];
export const ORG_TYPES: OrgType[] = ['OEM', 'Distributor', 'Dealer', 'Retailer', 'Warehouse', 'Service Center', 'Export Unit'];

// ─── Inventory ────────────────────────────────────────────────────────────────

export const CONSUMPTION_STRATEGIES: ConsumptionStrategy[] = ['FIFO', 'FEFO', 'LIFO', 'Manual'];

// ─── Sales & Purchase ─────────────────────────────────────────────────────────

export const SALES_CHANNELS = ['Dealer', 'Retail', 'Online', 'OEM', 'Distributor', 'Export', 'Service Center'];

export const SALES_DISCONTINUATION_BEHAVIORS: SalesDiscontinuationBehavior[] = [
  'Allow sell-through existing stock',
  'Block new sales orders',
  'Block all sales transactions',
];

export const PURCHASE_DISCONTINUATION_BEHAVIORS: PurchaseDiscontinuationBehavior[] = [
  'Block new purchase orders',
  'Allow existing POs to complete',
  'Block all purchase transactions',
];

// ─── Identifiers & Associations ───────────────────────────────────────────────

export const IDENTIFIER_TYPES: IdentifierType[] = [
  'GTIN', 'HS Code', 'HSN', 'OEM Part No.', 'Manufacturer Part No.', 'UPC', 'EAN', 'Other',
];

export const ASSOCIATION_TYPES: AssociationType[] = ['Alternate', 'Supersedes', 'Kit Component'];

// ─── Countries ────────────────────────────────────────────────────────────────

export const COUNTRIES = [
  'India', 'China', 'Germany', 'Japan', 'United States', 'United Kingdom',
  'South Korea', 'Taiwan', 'Italy', 'France', 'Brazil', 'Mexico', 'Thailand',
  'Malaysia', 'Indonesia', 'Vietnam', 'Singapore', 'Other',
];

// ─── Hierarchy Mock Masters ───────────────────────────────────────────────────

export const MOCK_BRANDS: { id: string; name: string }[] = [
  { id: 'BR-001', name: 'Asian Paints' },
  { id: 'BR-002', name: 'Bajaj' },
  { id: 'BR-003', name: 'Bosch' },
  { id: 'BR-004', name: 'Maruti Suzuki' },
  { id: 'BR-005', name: 'Generic / Unbranded' },
];

export const MOCK_PRODUCT_FAMILIES: Record<string, { id: string; name: string }[]> = {
  'BR-001': [{ id: 'PF-001', name: 'Decorative Paints' }, { id: 'PF-002', name: 'Industrial Coatings' }],
  'BR-002': [{ id: 'PF-003', name: 'Two-Wheeler Parts' }, { id: 'PF-004', name: 'Three-Wheeler Parts' }],
  'BR-003': [{ id: 'PF-005', name: 'Power Tools' }, { id: 'PF-006', name: 'Automotive Filters' }],
  'BR-004': [{ id: 'PF-007', name: 'Genuine Spare Parts' }],
  'BR-005': [{ id: 'PF-008', name: 'Generic Parts' }, { id: 'PF-009', name: 'Consumables' }],
};

export const MOCK_PRODUCT_LINES: Record<string, { id: string; name: string }[]> = {
  'PF-001': [{ id: 'PL-001', name: 'Royale Series' }, { id: 'PL-002', name: 'Apex Series' }],
  'PF-002': [{ id: 'PL-003', name: 'Apcolite Series' }],
  'PF-003': [{ id: 'PL-004', name: 'Pulsar Series' }, { id: 'PL-005', name: 'Platina Series' }],
  'PF-005': [{ id: 'PL-006', name: 'Professional Series' }],
  'PF-006': [{ id: 'PL-007', name: 'Workshop Filters' }],
  'PF-007': [{ id: 'PL-008', name: 'Alto 800 Parts' }, { id: 'PL-009', name: 'Swift Parts' }],
  'PF-008': [{ id: 'PL-010', name: 'General Components' }],
  'PF-009': [{ id: 'PL-011', name: 'Oils & Fluids' }],
};

// ─── Classification Mock Masters ─────────────────────────────────────────────

export const MOCK_PRODUCT_CLASSES = [
  'Interior Wall Paint',
  'Exterior Wall Paint',
  'Industrial Coating',
  'Spare Parts',
  'Consumables',
  'Accessories',
  'Services',
  'Raw Materials',
  'Packaging Materials',
];

export const MOCK_PRODUCT_CATEGORIES: Record<string, string[]> = {
  'Interior Wall Paint':   ['Interior Emulsion', 'Distemper', 'Primer'],
  'Exterior Wall Paint':   ['Exterior Emulsion', 'Texture Finish', 'Waterproof Coating'],
  'Industrial Coating':    ['Anti-Corrosion', 'Heat Resistant', 'Floor Coating'],
  'Spare Parts':           ['Engine Parts', 'Brake System', 'Suspension', 'Electrical', 'Body Parts'],
  'Consumables':           ['Lubricants', 'Filters', 'Fluids', 'Adhesives', 'Sealants'],
  'Accessories':           ['Tools', 'Kits', 'Mounting Hardware'],
  'Services':              ['Repair Service', 'Maintenance Service', 'Inspection Service'],
  'Raw Materials':         ['Chemicals', 'Metals', 'Polymers', 'Composites'],
  'Packaging Materials':   ['Drums', 'Cans', 'Cartons', 'Pouches'],
};

export const MOCK_PRODUCT_SUBCATEGORIES: Record<string, string[]> = {
  'Interior Emulsion':    ['Premium Emulsion', 'Economy Emulsion', 'Washable Emulsion'],
  'Distemper':            ['Dry Distemper', 'Oil Bound Distemper'],
  'Primer':               ['Acrylic Primer', 'Oil-Based Primer'],
  'Exterior Emulsion':    ['Smooth Finish', 'Texture Finish'],
  'Waterproof Coating':   ['Elastomeric', 'Cementitious'],
  'Engine Parts':         ['Piston', 'Cylinder', 'Gasket', 'Valve'],
  'Brake System':         ['Brake Pad', 'Brake Disc', 'Brake Drum', 'Caliper'],
  'Suspension':           ['Shock Absorber', 'Spring', 'Strut'],
  'Electrical':           ['Battery', 'Alternator', 'Starter Motor', 'Sensor'],
  'Lubricants':           ['Engine Oil', 'Gear Oil', 'Coolant', 'Brake Fluid'],
  'Filters':              ['Air Filter', 'Oil Filter', 'Fuel Filter', 'Cabin Filter'],
  'Repair Service':       ['Mechanical Repair', 'Body Repair', 'Electrical Repair'],
  'Maintenance Service':  ['Periodic Service', 'Pre-delivery Inspection'],
};
