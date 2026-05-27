// ─── Supplier Master — Constants ─────────────────────────────────────────────

import type {
  BPType,
  BPStatus,
  BPCategory,
  BusinessType,
  IndustryType,
  NoOfEmployeesRange,
  ContactType,
  AddressType,
  AccountType,
  SettlementType,
  PaymentMode,
  MaxQtyScope,
  ComplianceDocType,
  SubEntityStatus,
  BPTransporterConfig,
  BPInsuranceConfig,
  BPFinancierConfig,
} from '../types/supplierMaster.types';

export const BP_TYPES: BPType[] = [
  'Supplier',
  'Transporter',
  'Insurance Provider',
  'Financier',
  'Customer',
  'Broker',
  'Agent',
  'Contractor',
];

export const BP_STATUSES: BPStatus[] = ['Draft', 'Active', 'Inactive'];
export const SUB_ENTITY_STATUSES: SubEntityStatus[] = ['Active', 'Inactive'];

export const BP_TYPE_META: Record<BPType, { color: string; bgColor: string; description: string }> = {
  'Supplier':           { color: '#1D4ED8', bgColor: '#EFF6FF', description: 'Vendors supplying goods or raw materials' },
  'Transporter':        { color: '#0891B2', bgColor: '#ECFEFF', description: 'Logistics and transportation partners' },
  'Insurance Provider': { color: '#7C3AED', bgColor: '#F5F3FF', description: 'Insurance policies and coverage partners' },
  'Financier':          { color: '#B45309', bgColor: '#FFFBEB', description: 'Financing, credit, and lending partners' },
  'Customer':           { color: '#15803D', bgColor: '#F0FDF4', description: 'Buyers, clients, and sales partners' },
  'Broker':             { color: '#BE185D', bgColor: '#FDF2F8', description: 'Trade brokers and intermediaries' },
  'Agent':              { color: '#9333EA', bgColor: '#FAF5FF', description: 'Authorized agents and representatives' },
  'Contractor':         { color: '#C2410C', bgColor: '#FFF7ED', description: 'Contract workers and service providers' },
};

export const BP_CATEGORIES: BPCategory[] = [
  'Manufacturer',
  'Distributor',
  'Retailer',
  'Service Provider',
  'Consultant',
  'Government',
  'NGO',
  'Individual',
  'Other',
];

export const BUSINESS_TYPES: BusinessType[] = [
  'Proprietorship',
  'Partnership',
  'LLP',
  'Private Limited',
  'Public Limited',
  'Trust',
  'Society',
  'Government Entity',
  'Other',
];

export const INDUSTRY_TYPES: IndustryType[] = [
  'Automotive',
  'Electronics',
  'FMCG',
  'Healthcare',
  'IT & Software',
  'Logistics',
  'Manufacturing',
  'Retail',
  'Real Estate',
  'Financial Services',
  'Insurance',
  'Education',
  'Agriculture',
  'Construction',
  'Energy',
  'Other',
];

export const NO_OF_EMPLOYEES_RANGES: NoOfEmployeesRange[] = [
  '1–10',
  '11–50',
  '51–200',
  '201–500',
  '501–1000',
  '1001–5000',
  '5000+',
];

export const CONTACT_TYPES: ContactType[] = [
  'Primary',
  'Secondary',
  'Accounts',
  'Technical',
  'Operations',
  'Legal',
  'Emergency',
];

export const ADDRESS_TYPES: AddressType[] = [
  'Registered',
  'Corporate',
  'Billing',
  'Shipping',
  'Warehouse',
  'Branch',
  'Other',
];

export const ACCOUNT_TYPES: AccountType[] = [
  'Current',
  'Savings',
  'Overdraft',
  'Cash Credit',
  'Escrow',
];

export const SETTLEMENT_TYPES: SettlementType[] = [
  'Full Settlement',
  'Partial Settlement',
  'Running Account',
];

export const PAYMENT_MODES: PaymentMode[] = [
  'NEFT',
  'RTGS',
  'IMPS',
  'Cheque',
  'Cash',
  'UPI',
  'Letter of Credit',
  'Other',
];

export const MAX_QTY_SCOPES: MaxQtyScope[] = ['Per Order', 'Per Month', 'Per Year'];

export const COMPLIANCE_DOC_TYPES: ComplianceDocType[] = [
  'GST Certificate',
  'PAN Card',
  'TAN Certificate',
  'MSME Certificate',
  'Trade Licence',
  'Import Export Code',
  'ISO Certificate',
  'FSSAI Licence',
  'Factory Licence',
  'Drug Licence',
  'Other',
];

export const COUNTRY_CODES: { code: string; label: string }[] = [
  { code: '+91', label: 'India (+91)' },
  { code: '+1', label: 'USA (+1)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+971', label: 'UAE (+971)' },
  { code: '+65', label: 'Singapore (+65)' },
  { code: '+49', label: 'Germany (+49)' },
  { code: '+81', label: 'Japan (+81)' },
  { code: '+86', label: 'China (+86)' },
  { code: '+61', label: 'Australia (+61)' },
  { code: '+33', label: 'France (+33)' },
];

export const COUNTRIES: string[] = [
  'India',
  'United States',
  'United Kingdom',
  'UAE',
  'Singapore',
  'Germany',
  'Japan',
  'China',
  'Australia',
  'France',
];

export const CURRENCIES: string[] = [
  'INR',
  'USD',
  'EUR',
  'GBP',
  'AED',
  'SGD',
  'JPY',
  'CNY',
  'AUD',
];

export const FINANCIAL_YEARS: string[] = [
  '2024–25',
  '2025–26',
  '2026–27',
];

export const ORDER_UOMS: string[] = [
  'Each',
  'Box',
  'Carton',
  'Pallet',
  'KG',
  'MT',
  'Litre',
  'Metre',
  'Set',
  'Pair',
];

// ─── Mock Organisation List (for Org Mapping) ─────────────────────────────────
export const MOCK_ORGANISATIONS: { id: string; name: string }[] = [
  { id: 'ORG-001', name: 'HQ — Head Office' },
  { id: 'ORG-002', name: 'Region North' },
  { id: 'ORG-003', name: 'Region South' },
  { id: 'ORG-004', name: 'Region East' },
  { id: 'ORG-005', name: 'Region West' },
  { id: 'ORG-006', name: 'Branch Mumbai' },
  { id: 'ORG-007', name: 'Branch Delhi' },
  { id: 'ORG-008', name: 'Branch Bangalore' },
];

// ─── Mock Item Catalogue (for Item Mapping) ───────────────────────────────────
export const ITEM_CATEGORIES = [
  'Filters', 'Brakes', 'Engine', 'Electrical', 'Transmission',
  'Cooling', 'Ignition', 'Suspension', 'Fuel System', 'Body Parts',
];

export const MOCK_ITEMS: { code: string; name: string; category: string }[] = [
  { code: 'ITM-001', name: 'Engine Oil Filter',       category: 'Filters' },
  { code: 'ITM-002', name: 'Brake Pad Assembly',      category: 'Brakes' },
  { code: 'ITM-003', name: 'Air Filter Element',      category: 'Filters' },
  { code: 'ITM-004', name: 'Spark Plug Set',          category: 'Ignition' },
  { code: 'ITM-005', name: 'Clutch Plate Kit',        category: 'Transmission' },
  { code: 'ITM-006', name: 'Fuel Injector',           category: 'Fuel System' },
  { code: 'ITM-007', name: 'Radiator Assembly',       category: 'Cooling' },
  { code: 'ITM-008', name: 'Alternator Unit',         category: 'Electrical' },
  { code: 'ITM-009', name: 'Timing Belt Kit',         category: 'Engine' },
  { code: 'ITM-010', name: 'Shock Absorber Front',    category: 'Suspension' },
  { code: 'ITM-011', name: 'Brake Disc Rotor',        category: 'Brakes' },
  { code: 'ITM-012', name: 'Fuel Filter Cartridge',   category: 'Filters' },
  { code: 'ITM-013', name: 'Starter Motor',           category: 'Electrical' },
  { code: 'ITM-014', name: 'Water Pump Assembly',     category: 'Cooling' },
  { code: 'ITM-015', name: 'Gearbox Seal Kit',        category: 'Transmission' },
  { code: 'ITM-016', name: 'Coil Spring Set',         category: 'Suspension' },
  { code: 'ITM-017', name: 'Piston Ring Set',         category: 'Engine' },
  { code: 'ITM-018', name: 'Battery 12V 65Ah',        category: 'Electrical' },
  { code: 'ITM-019', name: 'Bonnet Latch Assembly',   category: 'Body Parts' },
  { code: 'ITM-020', name: 'Cabin Air Filter',        category: 'Filters' },
];

// ─── Tab Applicability per BP Type ────────────────────────────────────────────
// Tabs: 1=General, 2=Contacts, 3=Addresses, 4=OrgMapping, 5=Tax, 6=Bank, 7=Items, 8=TypeConfig
export const BP_TYPE_TAB_APPLICABILITY: Record<string, number[]> = {
  'Supplier':           [1, 2, 3, 4, 5, 6, 7],
  'Transporter':        [1, 2, 3, 4, 6, 8],
  'Insurance Provider': [1, 2, 3, 5, 6, 8],
  'Financier':          [1, 2, 3, 5, 6, 8],
  'Customer':           [1, 2, 3, 4, 7],
  'Broker':             [1, 2, 3, 4, 5, 6],
  'Agent':              [1, 2, 3, 4, 5, 6],
  'Contractor':         [1, 2, 3, 4, 5, 6],
};

// ─── Transporter Picklists ────────────────────────────────────────────────────
export const TRANSPORTER_PICKLISTS = {
  transportModes:       ['Road', 'Rail', 'Air', 'Sea', 'Courier', 'Pipeline'],
  serviceNature:        ['Full Truck Load (FTL)', 'Less Than Truck Load (LTL)', 'Part Load', 'Express Delivery', 'Dedicated Fleet'],
  fleetOwnershipType:   ['Owned', 'Leased', 'Contracted', 'Mixed'],
  coverageScope:        ['Local', 'Regional', 'State', 'National', 'International'],
  vehicleTypes:         ['Truck', 'Mini Truck', 'Trailer', 'Container', 'Tanker', 'Refrigerated Van', 'Two-Wheeler', 'Three-Wheeler'],
  loadUOMs:             ['KG', 'MT', 'LTR', 'CBM', 'Units'],
  routeTypes:           ['Local', 'Interstate', 'International'],
  pickupResponsibility:    ['Supplier', 'Dealer', 'Transporter'],
  deliveryResponsibility:  ['Transporter', 'Third-party'],
  loadingResponsibility:   ['Supplier', 'Dealer'],
  unloadingResponsibility: ['Transporter', 'Dealer'],
  operatingCountries:   ['India', 'USA', 'UAE', 'UK', 'Germany', 'China', 'Japan', 'Singapore', 'Australia'],
  operatingStates:      ['Maharashtra', 'Gujarat', 'Rajasthan', 'Karnataka', 'Tamil Nadu', 'Delhi', 'Uttar Pradesh', 'West Bengal', 'Telangana', 'Kerala'],
  operatingCities:      ['Mumbai', 'Pune', 'Ahmedabad', 'Surat', 'Jaipur', 'Bangalore', 'Chennai', 'Delhi', 'Noida', 'Hyderabad', 'Kolkata', 'Kochi'],
  serviceZones:         ['Zone A', 'Zone B', 'Zone C', 'North', 'South', 'East', 'West', 'Central'],
  configStatus:         ['Active', 'Inactive'],
};

export const EMPTY_TRANSPORTER_CONFIG: BPTransporterConfig = {
  transportModes: [], serviceNature: '', fleetOwnershipType: '',
  gpsTracking: false, refrigeratedTransport: false, hazardousMaterial: false,
  coverageScope: '', operatingCountries: [], operatingStates: [], operatingCities: [], serviceZones: [],
  vehicleCapabilities: [],
  standardTransitTime: '', minTransitTime: '', maxTransitTime: '',
  weekendOperations: false, nightOperations: false,
  pickupResponsibility: '', deliveryResponsibility: '', loadingResponsibility: '', unloadingResponsibility: '',
  routeCapabilities: [],
  configEffectiveFrom: '', configEffectiveTo: '', configStatus: 'Active',
};

// ─── Insurance Picklists ──────────────────────────────────────────────────────────
export const INSURANCE_PICKLISTS = {
  insuranceProviderTypes: ['General', 'Life', 'Health'],
  providerCategories:     ['OEM Partner', 'Third-party'],
  insuranceLines:         ['Motor', 'Health', 'Extended Warranty', 'Property', 'Travel', 'Marine'],
  kycDocuments:           ['Aadhaar', 'PAN', 'RC Book', "Driver's Licence", 'Passport', 'Voter ID', 'Form 60', 'GST Certificate'],
  inspectionModes:        ['Physical', 'Digital'],
  commissionTypes:        ['Percentage', 'Fixed'],
  currencies:             ['INR', 'USD', 'EUR', 'GBP', 'AED'],
  payoutBasisOptions:     ['Per Policy', 'Monthly', 'Quarterly'],
  payoutTriggerOptions:   ['Policy Issuance', 'Payment Received', 'Renewal'],
  branchTypes:            ['Regional', 'Zonal', 'City', 'Local'],
  branchStatuses:         ['Active', 'Inactive'],
  coverageScopes:         ['City', 'State', 'Multi-State', 'National'],
  states:                 ['Andhra Pradesh', 'Delhi', 'Gujarat', 'Karnataka', 'Kerala', 'Maharashtra', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'],
  countries:              ['India', 'UAE', 'USA', 'UK', 'Singapore', 'Germany'],
  countryCodes:           ['+91 (India)', '+971 (UAE)', '+1 (USA/Canada)', '+44 (UK)', '+65 (Singapore)', '+49 (Germany)'],
  configStatus:           ['Active', 'Inactive'],
};

export const EMPTY_INSURANCE_CONFIG: BPInsuranceConfig = {
  insuranceProviderType: '', providerCategory: '',
  regulatorRegNumber: '', regulatorRegValidTill: '',
  supportedInsuranceLines: [], defaultInsuranceProvider: false,
  mandatoryCustomerDocuments: [], vehicleInspectionRequired: false,
  inspectionMode: '', dealerVerificationRequired: false,
  commissionApplicable: false, commissionType: '', commissionValue: '',
  commissionCurrency: '', payoutBasis: '', payoutTrigger: '',
  branches: [],
  configEffectiveFrom: '', configEffectiveTo: '', configStatus: 'Active',
};

// ─── Financier Picklists ──────────────────────────────────────────────────────────
export const FINANCIER_PICKLISTS = {
  financierTypes:        ['Bank', 'NBFC', 'Captive Finance'],
  financierCategories:   ['OEM Finance', 'Third-party', 'In-house'],
  supportedBusinesses:   ['Vehicle', 'Item', 'Service'],
  financingModels:       ['Retail', 'Wholesale'],
  loanProducts:          ['Loan', 'Lease', 'Hypothecation', 'Overdraft'],
  coverageScopes:        ['Branch-specific', 'State', 'National'],
  vehicleTypes:          ['Two-Wheeler', 'Three-Wheeler', 'Passenger Car', 'SUV', 'Commercial Vehicle', 'Truck', 'Bus', 'Tractor'],
  itemCategories:        ['Accessories', 'Spare Parts', 'Electronics', 'Machinery', 'Equipment', 'Tools'],
  currencies:            ['INR', 'USD', 'EUR', 'GBP', 'AED'],
  interestTypes:         ['Flat', 'Reducing'],
  interestBasis:         ['Monthly', 'Annual'],
  processingFeeTypes:    ['Fixed', 'Percentage'],
  disbursementModes:     ['Direct to Dealer', 'Customer'],
  settlementTriggers:    ['Invoice', 'Delivery', 'Registration'],
  kycDocuments:          ['Aadhaar', 'PAN', 'RC Book', "Driver's Licence", 'Passport', 'Voter ID', 'Form 60', 'GST Certificate'],
  kycLevels:             ['Basic', 'Full'],
  commissionTypes:       ['Percentage', 'Fixed'],
  payoutBasisOptions:    ['Per Deal', 'Monthly', 'Quarterly'],
  payoutTriggerOptions:  ['Disbursement', 'Booking', 'Invoice'],
  branchTypes:           ['Regional', 'Zonal', 'City', 'Local'],
  branchStatuses:        ['Active', 'Inactive'],
  branchCoverageScopes:  ['City', 'State', 'Multi-State', 'National'],
  states:                ['Andhra Pradesh', 'Delhi', 'Gujarat', 'Karnataka', 'Kerala', 'Maharashtra', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'],
  countries:             ['India', 'UAE', 'USA', 'UK', 'Singapore', 'Germany'],
  countryCodes:          ['+91 (India)', '+971 (UAE)', '+1 (USA/Canada)', '+44 (UK)', '+65 (Singapore)', '+49 (Germany)'],
  configStatus:          ['Active', 'Inactive'],
};

export const EMPTY_FINANCIER_CONFIG: BPFinancierConfig = {
  financierType: '', financierCategory: '',
  supportedBusiness: [], financingModel: [], activeLoanProducts: [],
  coverageScope: '', eligibleVehicleTypes: [], eligibleItemCategories: [],
  financeCurrency: '', minLoanAmount: '', maxLoanAmount: '', maxFinancePercentage: '',
  interestType: '', interestCalculationBasis: '', interestRate: '',
  processingFeeType: '', processingFeeValue: '',
  foreclosureAllowed: false, prepaymentAllowed: false,
  disbursementMode: '', settlementTrigger: '', settlementCycleDays: '',
  partialDisbursementAllowed: false, holdDisbursementOnException: false,
  mandatoryDocuments: [], customerKycLevel: '', dealerVerificationRequired: false, autoKycValidation: false,
  commissionApplicable: false, commissionType: '', commissionValue: '', commissionCurrency: '', payoutBasis: '', payoutTrigger: '',
  branches: [],
  configEffectiveFrom: '', configEffectiveTo: '', configStatus: 'Active',
};
