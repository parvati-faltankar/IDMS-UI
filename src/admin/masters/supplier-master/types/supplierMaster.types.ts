// ─── Supplier (Business Partner) Master — TypeScript Types ───────────────────

// ─── Enums / Union Types ──────────────────────────────────────────────────────

export type BPType =
  | 'Supplier'
  | 'Transporter'
  | 'Insurance Provider'
  | 'Financier'
  | 'Customer'
  | 'Broker'
  | 'Agent'
  | 'Contractor';

export type BPStatus = 'Draft' | 'Active' | 'Inactive';
export type SubEntityStatus = 'Active' | 'Inactive';

export type BPCategory =
  | 'Manufacturer'
  | 'Distributor'
  | 'Retailer'
  | 'Service Provider'
  | 'Consultant'
  | 'Government'
  | 'NGO'
  | 'Individual'
  | 'Other';

export type BusinessType =
  | 'Proprietorship'
  | 'Partnership'
  | 'LLP'
  | 'Private Limited'
  | 'Public Limited'
  | 'Trust'
  | 'Society'
  | 'Government Entity'
  | 'Other';

export type IndustryType =
  | 'Automotive'
  | 'Electronics'
  | 'FMCG'
  | 'Healthcare'
  | 'IT & Software'
  | 'Logistics'
  | 'Manufacturing'
  | 'Retail'
  | 'Real Estate'
  | 'Financial Services'
  | 'Insurance'
  | 'Education'
  | 'Agriculture'
  | 'Construction'
  | 'Energy'
  | 'Other';

export type NoOfEmployeesRange =
  | '1–10'
  | '11–50'
  | '51–200'
  | '201–500'
  | '501–1000'
  | '1001–5000'
  | '5000+';

export type ContactType =
  | 'Primary'
  | 'Secondary'
  | 'Accounts'
  | 'Technical'
  | 'Operations'
  | 'Legal'
  | 'Emergency';

export type AddressType =
  | 'Registered'
  | 'Corporate'
  | 'Billing'
  | 'Shipping'
  | 'Warehouse'
  | 'Branch'
  | 'Other';

export type AccountType =
  | 'Current'
  | 'Savings'
  | 'Overdraft'
  | 'Cash Credit'
  | 'Escrow';

export type SettlementType =
  | 'Full Settlement'
  | 'Partial Settlement'
  | 'Running Account';

export type PaymentMode =
  | 'NEFT'
  | 'RTGS'
  | 'IMPS'
  | 'Cheque'
  | 'Cash'
  | 'UPI'
  | 'Letter of Credit'
  | 'Other';

export type MaxQtyScope = 'Per Order' | 'Per Month' | 'Per Year';

export type ComplianceDocType =
  | 'GST Certificate'
  | 'PAN Card'
  | 'TAN Certificate'
  | 'MSME Certificate'
  | 'Trade Licence'
  | 'Import Export Code'
  | 'ISO Certificate'
  | 'FSSAI Licence'
  | 'Factory Licence'
  | 'Drug Licence'
  | 'Other';

// ─── Sub-Entities ─────────────────────────────────────────────────────────────

export interface BPContact {
  id: string;
  contactType: ContactType;
  contactName: string;
  department: string;
  designation: string;
  countryCode: string;
  phone: string;
  email: string;
  fax: string;
  status: SubEntityStatus;
}

export interface BPAddress {
  id: string;
  addressType: AddressType;
  addressLine1: string;
  addressLine2: string;
  country: string;
  state: string;
  city: string;
  pin: string;
  latitude: string;
  longitude: string;
  isDefault: boolean;
  status: SubEntityStatus;
}

export interface BPOrgMapping {
  id: string;
  applyToAll: boolean;
  organisationId: string;
  organisationName: string;
  effectiveDate: string;
  expirationDate: string;
  status: SubEntityStatus;
}

export interface BPComplianceDocument {
  id: string;
  documentType: ComplianceDocType;
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  allowTransactionAfterExpiry: boolean;
  attachmentName: string;
  status: SubEntityStatus;
}

export interface BPBankAddress {
  addressLine1: string;
  addressLine2: string;
  country: string;
  state: string;
  city: string;
  pin: string;
}

export interface BPBankDetail {
  id: string;
  bankCode: string;
  bankName: string;
  branchName: string;
  accountHolderName: string;
  accountNumber: string;
  accountType: AccountType;
  defaultCurrency: string;
  isDefaultAccount: boolean;
  status: SubEntityStatus;
  bankAddress: BPBankAddress;
}

export interface BPPaymentTerms {
  advanceAllowed: boolean;
  advancePercentage: number;
  settlementType: SettlementType;
  paymentMode: PaymentMode;
  creditDays: number;
  creditLimit: number;
  creditLimitCurrency: string;
}

export interface BPItemMapping {
  id: string;
  itemCode: string;
  itemName: string;
  orderUom: string;
  minOrderQty: number;
  maxQtyScope: MaxQtyScope;
  maxOrderQty: number;
  orderMultiple: number;
  stdLeadTimeDays: number;
  minLeadTimeDays: number;
  maxLeadTimeDays: number;
  isReturnable: boolean;
  returnPeriodDays: number;
  effectiveFromDate: string;
  effectiveToDate: string;
  status: SubEntityStatus;
}

// ─── Transporter Configuration ───────────────────────────────────────────────

export interface BPRouteCapability {
  id: string;
  routeType: string;
  minLoadQty: string;
  maxLoadQty: string;
  transitTimeOverride: string;
}

export interface BPVehicleCapability {
  id: string;
  vehicleType: string;
  loadUOM: string;
  loadCapacityMin: string;
  loadCapacityMax: string;
  approximateFleetSize: string;
  minConsignmentSize: string;
  maxConsignmentSize: string;
}

export interface BPInsuranceBranch {
  id: string;
  branchCode: string;
  branchName: string;
  branchType: string;
  status: string;
  effectiveStartDate: string;
  effectiveEndDate: string;
  addressLine1: string;
  addressLine2: string;
  country: string;
  state: string;
  city: string;
  pinCode: string;
  coverageScope: string;
  coveredStates: string[];
  contactPerson: string;
  countryCode: string;
  mobileNumber: string;
  emailId: string;
  escalationContact: string;
}

export interface BPInsuranceConfig {
  // Insurance Provider Profile
  insuranceProviderType: string;
  providerCategory: string;
  regulatorRegNumber: string;
  regulatorRegValidTill: string;
  supportedInsuranceLines: string[];
  defaultInsuranceProvider: boolean;
  // Document & KYC Requirements
  mandatoryCustomerDocuments: string[];
  vehicleInspectionRequired: boolean;
  inspectionMode: string;
  dealerVerificationRequired: boolean;
  // Commission & Incentive
  commissionApplicable: boolean;
  commissionType: string;
  commissionValue: string;
  commissionCurrency: string;
  payoutBasis: string;
  payoutTrigger: string;
  // Branch Network (repeatable)
  branches: BPInsuranceBranch[];
  // Configuration Validity
  configEffectiveFrom: string;
  configEffectiveTo: string;
  configStatus: string;
}

export interface BPFinancierBranch {
  id: string;
  branchCode: string;
  branchName: string;
  branchType: string;
  status: string;
  effectiveStartDate: string;
  effectiveEndDate: string;
  addressLine1: string;
  addressLine2: string;
  country: string;
  state: string;
  city: string;
  pinCode: string;
  coverageScope: string;
  coveredStates: string[];
  contactPerson: string;
  countryCode: string;
  mobileNumber: string;
  emailId: string;
  escalationContact: string;
}

export interface BPFinancierConfig {
  // Financier Profile
  financierType: string;
  financierCategory: string;
  supportedBusiness: string[];
  financingModel: string[];
  activeLoanProducts: string[];
  // Finance Coverage & Eligibility
  coverageScope: string;
  eligibleVehicleTypes: string[];
  eligibleItemCategories: string[];
  financeCurrency: string;
  minLoanAmount: string;
  maxLoanAmount: string;
  maxFinancePercentage: string;
  // Interest & Charges
  interestType: string;
  interestCalculationBasis: string;
  interestRate: string;
  processingFeeType: string;
  processingFeeValue: string;
  foreclosureAllowed: boolean;
  prepaymentAllowed: boolean;
  // Settlement & Disbursement
  disbursementMode: string;
  settlementTrigger: string;
  settlementCycleDays: string;
  partialDisbursementAllowed: boolean;
  holdDisbursementOnException: boolean;
  // Document & KYC Requirements
  mandatoryDocuments: string[];
  customerKycLevel: string;
  dealerVerificationRequired: boolean;
  autoKycValidation: boolean;
  // Commission & Incentive
  commissionApplicable: boolean;
  commissionType: string;
  commissionValue: string;
  commissionCurrency: string;
  payoutBasis: string;
  payoutTrigger: string;
  // Branch Network (repeatable)
  branches: BPFinancierBranch[];
  // Configuration Validity
  configEffectiveFrom: string;
  configEffectiveTo: string;
  configStatus: string;
}

export interface BPTransporterConfig {
  // Transport Operations
  transportModes: string[];
  serviceNature: string;
  fleetOwnershipType: string;
  gpsTracking: boolean;
  refrigeratedTransport: boolean;
  hazardousMaterial: boolean;
  // Service Coverage
  coverageScope: string;
  operatingCountries: string[];
  operatingStates: string[];
  operatingCities: string[];
  serviceZones: string[];
  // Fleet Capability (per-vehicle-type entries)
  vehicleCapabilities: BPVehicleCapability[];
  // Transit & SLA Parameters
  standardTransitTime: string;
  minTransitTime: string;
  maxTransitTime: string;
  weekendOperations: boolean;
  nightOperations: boolean;
  // Logistics Responsibility
  pickupResponsibility: string;
  deliveryResponsibility: string;
  loadingResponsibility: string;
  unloadingResponsibility: string;
  // Transport Capability Mapping (repeatable)
  routeCapabilities: BPRouteCapability[];
  // Configuration Validity
  configEffectiveFrom: string;
  configEffectiveTo: string;
  configStatus: string;
}

// ─── Core Business Partner ────────────────────────────────────────────────────

export interface BusinessPartner {
  id: string;
  bpCode: string;
  bpLegalName: string;
  bpType: BPType;
  marketingName: string;
  displayName: string;
  bpCategory: BPCategory;
  countryOfRegistration: string;
  businessType: BusinessType;
  industryType: IndustryType;
  noOfEmployees: NoOfEmployeesRange;
  foundingDate: string;
  websiteUrl: string;
  annualTurnover: string;
  annualRevenue: string;
  financialYear: string;
  financialCurrency: string;
  status: BPStatus;
  effectiveFromDate: string;
  effectiveToDate: string;
  description: string;
  // Tab 2 — Contacts
  contacts: BPContact[];
  // Tab 3 — Addresses
  addresses: BPAddress[];
  // Tab 4 — Org Mapping
  orgMappings: BPOrgMapping[];
  // Tab 5 — Tax & Compliance
  taxRegistered: boolean;
  taxJurisdiction: string;
  complianceDocuments: BPComplianceDocument[];
  // Tab 6 — Bank & Payment
  bankDetails: BPBankDetail[];
  paymentTerms: BPPaymentTerms;
  // Tab 7 — Item Mapping
  itemMappings: BPItemMapping[];
  // Tab 8 — Type-specific Configuration
  transporterConfig?: BPTransporterConfig;
  insuranceConfig?: BPInsuranceConfig;
  financierConfig?: BPFinancierConfig;
  // Audit
  createdAt: string;
  updatedAt: string;
}
