// ─── Product Master — Service (In-Memory Mock) ────────────────────────────────

import type { ProductMaster } from '../types/productMaster.types';

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_PRODUCTS: ProductMaster[] = [
  {
    id: 'PM-SEED-001',
    productCode: 'PRD-0001',
    productName: 'Royale Aspira Interior Emulsion 20L Shade 101',
    productDescription: 'Premium interior emulsion paint, Shade 101 (Off White), 20L sealed metal drum.',
    productType: 'Finished Good',
    manufacturerOEM: 'Asian Paints Ltd.',
    countryOfOrigin: 'India',
    countryOfAssembly: 'India',
    productClass: 'Interior Wall Paint',
    productCategory: 'Interior Emulsion',
    productSubCategory: 'Premium Emulsion',
    brand: 'BR-001',
    productFamily: 'PF-001',
    productLine: 'PL-001',
    modelBaseProduct: 'Royale Aspira',
    variantConfiguration: '20L / Shade 101',
    skuTradeItem: 'Royale Aspira 20L Shade 101',
    scopeMappings: [
      { id: 'SCM-001', scopeType: 'Global', scopeDimension: 'Organization', scopeValue: 'HQ Organization', scopeActivationStatus: 'Active', effectiveFromDate: '2026-04-01', effectiveToDate: '' },
    ],
    baseUOM: 'Litre',
    applicableUOMs: [
      { id: 'UOM-001', applicableUOM: '20L Drum', conversionReference: 'CONV-DRUM20-LTR', conversionToBaseUOM: '1 Drum = 20 Litres' },
      { id: 'UOM-002', applicableUOM: '4L Can',   conversionReference: 'CONV-4LCAN-LTR',  conversionToBaseUOM: '1 Can = 4 Litres' },
    ],
    packagingRows: [
      { id: 'PKG-001', packType: 'Drum', packSize: '20L', packMaterial: 'Metal', packagingDescription: '20L sealed metal drum', purchaseSetQuantity: '1', salesSetQuantity: '1', organizationType: 'Dealer' },
    ],
    netWeight: '24.5',
    grossWeight: '25.8',
    length: '320',
    width: '320',
    height: '390',
    volume: '0.040',
    dimensionUOM: 'Millimetre',
    weightUOM: 'Kilogram',
    stockableIndicator: true,
    serializedTrackingRequired: false,
    batchTrackingRequired: true,
    lotTrackingRequired: false,
    consumptionStrategy: 'FIFO',
    storageCondition: 'Store in cool, dry place away from direct sunlight.',
    warrantyApplicable: false,
    sellableIndicator: true,
    salesChannelEligibility: ['Dealer', 'Retail'],
    salesDiscontinuationBehavior: 'Allow sell-through existing stock',
    purchasableIndicator: true,
    purchaseDiscontinuationBehavior: 'Block new purchase orders',
    productIdentifiers: [
      { id: 'PID-001', identifierType: 'HSN', identifierValue: '3209' },
    ],
    productAssociations: [],
    productStatus: 'Active',
    effectiveFromDate: '2026-04-01',
    effectiveToDate: '',
    discontinuationDate: '',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
  },
  {
    id: 'PM-SEED-002',
    productCode: 'PRD-0002',
    productName: 'Pulsar NS200 Front Brake Pad',
    productDescription: 'Genuine front brake pad for Bajaj Pulsar NS200. High-performance sintered compound.',
    productType: 'Spare Part',
    manufacturerOEM: 'Bajaj Auto Ltd.',
    countryOfOrigin: 'India',
    countryOfAssembly: 'India',
    productClass: 'Spare Parts',
    productCategory: 'Brake System',
    productSubCategory: 'Brake Pad',
    brand: 'BR-002',
    productFamily: 'PF-003',
    productLine: 'PL-004',
    modelBaseProduct: 'Pulsar NS200',
    variantConfiguration: 'Front Brake Pad',
    skuTradeItem: 'Pulsar NS200 Front Brake Pad',
    scopeMappings: [
      { id: 'SCM-002', scopeType: 'Global', scopeDimension: 'Organization', scopeValue: 'HQ Organization', scopeActivationStatus: 'Active', effectiveFromDate: '2026-04-01', effectiveToDate: '' },
    ],
    baseUOM: 'Piece',
    applicableUOMs: [
      { id: 'UOM-003', applicableUOM: 'Pair', conversionReference: 'CONV-PAIR-PCS', conversionToBaseUOM: '1 Pair = 2 Pieces' },
      { id: 'UOM-004', applicableUOM: 'Box of 10', conversionReference: 'CONV-BOX10-PCS', conversionToBaseUOM: '1 Box = 10 Pieces' },
    ],
    packagingRows: [
      { id: 'PKG-002', packType: 'Box', packSize: 'Box of 10', packMaterial: 'Cardboard', packagingDescription: '10 brake pads per cardboard box', purchaseSetQuantity: '10', salesSetQuantity: '1', organizationType: 'Dealer' },
    ],
    netWeight: '0.35',
    grossWeight: '0.40',
    length: '120',
    width: '45',
    height: '15',
    volume: '',
    dimensionUOM: 'Millimetre',
    weightUOM: 'Kilogram',
    stockableIndicator: true,
    serializedTrackingRequired: false,
    batchTrackingRequired: false,
    lotTrackingRequired: false,
    consumptionStrategy: 'FIFO',
    storageCondition: 'Keep in dry place. Avoid contact with brake fluid.',
    warrantyApplicable: true,
    sellableIndicator: true,
    salesChannelEligibility: ['Dealer', 'Service Center'],
    salesDiscontinuationBehavior: 'Allow sell-through existing stock',
    purchasableIndicator: true,
    purchaseDiscontinuationBehavior: 'Block new purchase orders',
    productIdentifiers: [
      { id: 'PID-002', identifierType: 'OEM Part No.', identifierValue: 'BKP-NS200-F-001' },
      { id: 'PID-003', identifierType: 'HSN',          identifierValue: '8708' },
    ],
    productAssociations: [],
    productStatus: 'Active',
    effectiveFromDate: '2026-04-01',
    effectiveToDate: '',
    discontinuationDate: '',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
  },
  {
    id: 'PM-SEED-003',
    productCode: 'PRD-0003',
    productName: 'Periodic Maintenance Service — 10,000 km',
    productDescription: 'Complete periodic maintenance service at 10,000 km interval. Includes oil change, filter replacement, brake inspection, and general checkup.',
    productType: 'Service',
    manufacturerOEM: '',
    countryOfOrigin: 'India',
    countryOfAssembly: '',
    productClass: 'Services',
    productCategory: 'Maintenance Service',
    productSubCategory: 'Periodic Service',
    brand: 'BR-004',
    productFamily: 'PF-007',
    productLine: '',
    modelBaseProduct: '',
    variantConfiguration: '10,000 km',
    skuTradeItem: 'Periodic Maintenance Service 10k',
    scopeMappings: [
      { id: 'SCM-003', scopeType: 'Global', scopeDimension: 'Organization', scopeValue: 'HQ Organization', scopeActivationStatus: 'Active', effectiveFromDate: '2026-04-01', effectiveToDate: '' },
    ],
    baseUOM: 'Nos',
    applicableUOMs: [],
    packagingRows: [],
    netWeight: '',
    grossWeight: '',
    length: '',
    width: '',
    height: '',
    volume: '',
    dimensionUOM: '',
    weightUOM: '',
    stockableIndicator: false,
    serializedTrackingRequired: false,
    batchTrackingRequired: false,
    lotTrackingRequired: false,
    consumptionStrategy: '',
    storageCondition: '',
    warrantyApplicable: false,
    sellableIndicator: true,
    salesChannelEligibility: ['Dealer', 'Service Center'],
    salesDiscontinuationBehavior: '',
    purchasableIndicator: false,
    purchaseDiscontinuationBehavior: '',
    productIdentifiers: [],
    productAssociations: [],
    productStatus: 'Draft',
    effectiveFromDate: '2026-06-01',
    effectiveToDate: '',
    discontinuationDate: '',
    createdAt: '2026-05-15T00:00:00.000Z',
    updatedAt: '2026-05-15T00:00:00.000Z',
  },
];

// ─── In-Memory Store ──────────────────────────────────────────────────────────

let store: ProductMaster[] = [...SEED_PRODUCTS];

// ─── Service ──────────────────────────────────────────────────────────────────

export const productMasterService = {
  getAll(): ProductMaster[] {
    return [...store];
  },

  getById(id: string): ProductMaster | undefined {
    return store.find((p) => p.id === id);
  },

  generateCode(): string {
    const prefix = 'PRD-';
    const max = store.reduce((m, p) => {
      const n = parseInt(p.productCode.replace(prefix, ''), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    return `${prefix}${String(max + 1).padStart(4, '0')}`;
  },

  create(data: Omit<ProductMaster, 'id' | 'createdAt' | 'updatedAt'>): ProductMaster {
    const now = new Date().toISOString();
    const newProduct: ProductMaster = {
      ...data,
      id: `PM-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    store = [...store, newProduct];
    return newProduct;
  },

  update(
    id: string,
    data: Partial<Omit<ProductMaster, 'id' | 'createdAt'>>,
  ): ProductMaster | undefined {
    const idx = store.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    const updated: ProductMaster = {
      ...store[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    store = [...store.slice(0, idx), updated, ...store.slice(idx + 1)];
    return updated;
  },

  delete(id: string): boolean {
    const prev = store.length;
    store = store.filter((p) => p.id !== id);
    return store.length < prev;
  },

  activate(id: string): ProductMaster | undefined {
    return this.update(id, { productStatus: 'Active' });
  },

  inactivate(id: string): ProductMaster | undefined {
    return this.update(id, { productStatus: 'Inactive' });
  },

  discontinue(id: string, discontinuationDate: string): ProductMaster | undefined {
    return this.update(id, { productStatus: 'Discontinued', discontinuationDate });
  },
};
