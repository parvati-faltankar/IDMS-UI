import type { FieldHelp } from './helpTypes';

/**
 * Registry of field-level help content for complex admin form fields.
 * Consumed by FieldHelpPopover — do not place this text directly in forms.
 */
export const fieldHelpRegistry: Record<string, FieldHelp> = {
  regexPattern: {
    key: 'regexPattern',
    title: 'Regex Pattern',
    description:
      'A regular expression the document or proof number must fully match. Use this only when the format is strictly defined — for example, a government-issued ID with a fixed letter-digit structure. Leave blank to accept any text within the configured length limits.',
    example:
      '^[A-Z]{5}[0-9]{4}[A-Z]$  →  PAN Card (e.g., ABCDE1234F). ' +
      '^[2-9]{1}[0-9]{11}$  →  Aadhaar (12 digits, first digit 2-9). ' +
      '^[A-Z]{2}[0-9]{8}$  →  Passport (two letters + 8 digits).',
  },

  entityType: {
    key: 'entityType',
    title: 'Entity Type',
    description:
      'The sub-category of the entity this rule applies to. KYC requirements, code policies, and approval workflows can differ between entity types within the same parent entity. Select the most specific type available.',
    example:
      'Customer → Individual or Corporate. ' +
      'Supplier → Domestic or Foreign. ' +
      'Employee → Permanent, Contractor, or Intern.',
  },

  prefixValue: {
    key: 'prefixValue',
    title: 'Prefix Value',
    description:
      'A short alphabetic code prepended to all generated numbers for this entity. Must be unique across all active numbering configurations. Cannot be changed after the first document is generated — choose carefully before activation.',
    example:
      'INV for Sales Invoices · SO for Sales Orders · PO for Purchase Orders · ' +
      'CUST for Customer codes · SUPP for Supplier codes.',
  },

  seriesType: {
    key: 'seriesType',
    title: 'Series Type',
    description:
      'Controls how the sequence counter increments. Numeric generates a plain integer sequence (1, 2, 3…). Alphanumeric continues with letter combinations (A01, A02…) after the numeric limit is reached — useful when annual volumes exceed the padding length.',
    example:
      'Numeric with length 4: INV-0001, INV-0002 … INV-9999. ' +
      'Alphanumeric with length 4: continues as INV-A001 after INV-9999.',
  },

  resetFrequency: {
    key: 'resetFrequency',
    title: 'Reset Frequency',
    description:
      'When the sequence counter resets back to 1. Never keeps a single running sequence indefinitely. Financial Year resets on the start of your configured financial year (set in Organisation Master). Calendar Year resets on 1 January every year.',
    example:
      'Never: INV-00001 → INV-00002 → … indefinitely. ' +
      'Financial Year (Apr start): sequence restarts at INV-00001 on 1 April each year.',
  },

  numberConsumptionEvent: {
    key: 'numberConsumptionEvent',
    title: 'Number Consumption Event',
    description:
      'The business action that causes the system to assign a permanent number. OnSave assigns a number immediately when a record is first saved as Draft — results in gaps if drafts are abandoned. OnSubmit assigns only when the document is formally submitted — preferred for audit-sensitive documents where sequential numbering without gaps is required.',
    example:
      'OnSave: INV-0001 assigned when user clicks Save for the first time. ' +
      'OnSubmit: number assigned only after the document is reviewed and submitted — recommended for invoices and purchase orders.',
  },

  allowedSpecialCharacters: {
    key: 'allowedSpecialCharacters',
    title: 'Allowed Special Characters',
    description:
      'Characters that may appear in the generated code beyond letters and digits. Only include separators that your print formats, reports, and external systems (ERPs, APIs) can handle without encoding or parsing issues. Keep this minimal.',
    example:
      'Hyphen and slash are standard: INV-2024/001. ' +
      'Avoid &, <, >, %, #, @ — these conflict with URLs, HTML, and many file systems.',
  },

  attachmentRules: {
    key: 'attachmentRules',
    title: 'Attachment Rules',
    description:
      'Whether a scanned or digital copy of the proof document must be uploaded during entity onboarding. Required blocks submission until the file is attached — use for identity and tax proofs where documentary evidence is legally required. Optional allows the user to proceed without attaching.',
    example:
      'Required: Passport scan, PAN Card image, GST Certificate PDF. ' +
      'Optional: secondary address proof, bank statement for lower-risk entity types.',
  },

  proofCategory: {
    key: 'proofCategory',
    title: 'Proof Category',
    description:
      'A logical grouping used to organise KYC proof documents during onboarding. Each category groups related proof types together in the onboarding form. Categories help users understand which class of document they need to provide.',
    example:
      'Identity: Passport, Aadhaar, Driving Licence. ' +
      'Address: Utility Bill, Bank Statement, Lease Agreement. ' +
      'Tax: PAN Card, GST Certificate, TAN. ' +
      'Business: Certificate of Incorporation, MOA, Partnership Deed.',
  },

  proofType: {
    key: 'proofType',
    title: 'Proof Type',
    description:
      'The specific document accepted as proof within a category. Each proof type defines its own document number format (length, regex), and attachment rules. A KYC rule can list multiple accepted proof types — the user selects which one they are providing.',
    example:
      'Under Identity: Passport (format: 2 letters + 8 digits), Aadhaar (12 digits), Driving Licence. ' +
      'Under Tax: PAN Card (10-character alphanumeric), GST Number (15-character GSTIN).',
  },

  warehouseInventoryControlMode: {
    key: 'warehouseInventoryControlMode',
    title: 'Inventory Control Mode',
    description:
      'Choose the level at which stock is posted and governed. Warehouse-Level keeps stock at the warehouse bucket only. Location/BIN-Level requires an active hierarchy and inventory-allowed leaf locations before activation.',
    example:
      'Warehouse-Level for simple stock holding sites. Location/BIN-Level for warehouses that need bin tracking, directed putaway, or directed picking.',
  },

  warehouseHierarchyChoice: {
    key: 'warehouseHierarchyChoice',
    title: 'Hierarchy Setup Choice',
    description:
      'This controls how the location structure will be prepared for a Location/BIN-Level warehouse. Recommended starts from a standard structure, Copy reuses an existing pattern, and Configure later keeps the warehouse in Draft until a valid hierarchy is activated.',
    example:
      'Recommended template: Zone > Aisle > Rack > Shelf > BIN. Configure later: save Draft now, finish hierarchy before activation.',
  },

  warehouseReservationLevel: {
    key: 'warehouseReservationLevel',
    title: 'Reservation Level',
    description:
      'Reservation protects quantity from being consumed by other demand. Choose the level where quantity is protected. Finer levels improve source control but require matching hierarchy and inventory control capability.',
    example:
      'Warehouse reservation protects quantity anywhere in the warehouse. BIN reservation protects quantity in one specific BIN.',
  },

  warehouseAllocationLevel: {
    key: 'warehouseAllocationLevel',
    title: 'Allocation Level',
    description:
      'Allocation locks the source scope chosen for fulfilment. Allocation is separate from reservation: reservation protects quantity, while allocation narrows where that quantity must come from.',
    example:
      'Location allocation locks a pick to one location. BIN allocation locks a pick to one specific BIN.',
  },

  warehouseStorageMixing: {
    key: 'warehouseStorageMixing',
    title: 'Storage Mixing Rules',
    description:
      'These rules govern whether different items, lots, or owners can share the same storage location. They influence eligibility validation, directed putaway, and manual overrides.',
    example:
      'Mixed owner = No means stock for different owners cannot occupy the same BIN. Mixed lot = No means one BIN can hold only one lot at a time.',
  },
};

/**
 * Returns field help for a given field key, or undefined if not registered.
 */
export function getFieldHelp(key: string): FieldHelp | undefined {
  return fieldHelpRegistry[key];
}
