// ─── UOM (Unit of Measurement) Master — TypeScript Types ─────────────────────

// ─── Enums / Union Types ──────────────────────────────────────────────────────

export type UnitType =
  | 'Quantity'
  | 'Volume'
  | 'Weight'
  | 'Length'
  | 'Area'
  | 'Time'
  | 'Distance'
  | 'Packaging'
  | 'Service'
  | 'Usage / Meter Reading';

export type UomStatus = 'Draft' | 'Active' | 'Inactive';

export type ConversionStatus = 'Active' | 'Inactive';

// ─── UOM Conversion Sub-Entity ────────────────────────────────────────────────

export interface UomConversion {
  id: string;
  fromUnitCode: string;
  fromUnitName: string;
  toUnitCode: string;
  toUnitName: string;
  conversionFactor: number;
  decimalPrecision: number | null;
  roundingRule: string;
  /** true when this row was auto-generated as the reverse of another conversion */
  isAutoReverse: boolean;
  status: ConversionStatus;
}

// ─── UOM Record (Main Entity) ─────────────────────────────────────────────────

export interface UomRecord {
  id: string;
  /** Auto-generated (e.g. UOM-0001), lockable by user */
  unitCode: string;
  /** Max 30 chars, must be unique */
  unitName: string;
  /** Max 20 chars, must be unique */
  unitSymbol: string;
  /** Optional — from picklist */
  unitType: UnitType | '';
  /** Max 300 chars */
  description: string;
  /** When true, qtyDecimalPrecision becomes required */
  allowDecimal: boolean;
  /** Null when allowDecimal is false */
  qtyDecimalPrecision: number | null;
  /** Optional, from picklist master */
  roundingRule: string;
  status: UomStatus;
  effectiveFromDate: string;
  effectiveToDate: string;
  conversions: UomConversion[];
  /** ISO timestamp — managed by service */
  createdAt?: string;
  /** ISO timestamp — managed by service */
  updatedAt?: string;
}

// ─── Form State ───────────────────────────────────────────────────────────────

export interface UomFormErrors {
  unitCode?: string;
  unitName?: string;
  unitSymbol?: string;
  unitType?: string;
  qtyDecimalPrecision?: string;
  effectiveToDate?: string;
  general?: string;
}

export interface ConversionFormErrors {
  fromUnitCode?: string;
  toUnitCode?: string;
  conversionFactor?: string;
  general?: string;
}
