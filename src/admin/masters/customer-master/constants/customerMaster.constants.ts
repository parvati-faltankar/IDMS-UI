import type {
  CustomerType,
  CustomerStatus,
  CustomerStepDef,
  Customer,
  CustomerAddress,
  CustomerContact,
  CustomerConsent,
  CustomerKYCDocument,
  CustomerKYCTaxMapping,
  CustomerFamilyMember,
} from '../types/customerMaster.types';

// ─── Picklists ────────────────────────────────────────────────────────────────

export const CUSTOMER_TYPES: CustomerType[] = [
  'Retail Individual',
  'Corporate',
  'Fleet',
  'Government',
  'Internal',
];

export const CUSTOMER_STATUSES: CustomerStatus[] = [
  'Draft',
  'Active',
  'Inactive',
  'Blocked',
];

export const SUB_ENTITY_STATUSES = ['Active', 'Inactive'] as const;

export const CREATED_SOURCES = [
  'Manual',
  'CRM',
  'API',
  'Migration',
  'Mobile App',
  'Website',
  'Bulk Upload',
  'Service Transaction',
  'Sales Transaction',
] as const;

export const SOURCE_VALIDATION_STATUSES = [
  'Accepted',
  'Pending Validation',
  'Rejected',
  'Partially Validated',
] as const;

export const LEAD_SOURCES = [
  'Walk-in',
  'Referral',
  'Campaign',
  'Website',
  'Mobile App',
  'CRM Lead',
  'Call Center',
  'Dealer Event',
  'Service Visit',
  'Sales Enquiry',
  'Legacy Data',
  'Other',
] as const;

export const VISIBILITY_SCOPES = [
  'Global',
  'Organization Level',
  'Branch Level',
  'Dealer Level',
  'Restricted',
] as const;

export const CUSTOMER_ADDRESS_TYPES = [
  'Billing',
  'Service',
  'Delivery/Shipping',
  'Communication',
  'Permanent',
  'Registered Office',
  'Branch/Site Address',
] as const;

export const CONTACT_ROLES = [
  'Billing',
  'Service',
  'Purchase',
  'Admin',
  'Authorized Signatory',
  'Other',
] as const;

export const CONSENT_CHANNELS = ['SMS', 'WhatsApp', 'Email', 'Call'] as const;

export const CONSENT_PURPOSES = [
  'Transactional',
  'Service Updates',
  'Promotional',
  'Marketing',
] as const;

export const CONSENT_STATUSES = ['Allowed', 'Not Allowed', 'Withdrawn'] as const;

export const CONSENT_SOURCES = [
  'DMS',
  'CRM',
  'Mobile App',
  'Website',
  'Call Center',
  'Migration',
] as const;

export const KYC_OVERALL_STATUSES = [
  'Not Required',
  'Pending',
  'Partially Verified',
  'Verified',
  'Rejected',
  'Expired',
] as const;

export const KYC_DOC_STATUSES = [
  'Draft',
  'Submitted',
  'Verified',
  'Rejected',
  'Expired',
  'Inactive/Replaced',
] as const;

export const KYC_DOCUMENT_TYPES = [
  'Aadhaar Card',
  'PAN Card',
  'Passport',
  "Driver's License",
  'Voter ID',
  'GSTIN Certificate',
  'Company Registration Certificate',
  'Shop & Establishment Certificate',
  'Partnership Deed',
  'MOA / AOA',
  'GST Return',
  'Bank Statement',
  'Income Tax Return',
  'Utility Bill',
  'Lease Agreement',
  'Government ID',
  'Other',
] as const;

export const TRANSACTION_USAGES = [
  'Invoice',
  'Sales',
  'Service',
  'Credit',
  'CRM',
] as const;

export const FAMILY_RELATIONSHIPS = [
  'Spouse',
  'Father',
  'Mother',
  'Son',
  'Daughter',
  'Brother',
  'Sister',
  'Other',
] as const;

export const SALUTATIONS = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.', 'CA', 'Adv.'] as const;

export const GENDERS = ['Male', 'Female', 'Non-Binary', 'Prefer not to say'] as const;

export const MARITAL_STATUSES = [
  'Single',
  'Married',
  'Divorced',
  'Widowed',
  'Separated',
] as const;

export const NATIONALITIES = [
  'Indian',
  'American',
  'British',
  'Canadian',
  'Australian',
  'German',
  'French',
  'Japanese',
  'Chinese',
  'Other',
] as const;

export const EDUCATION_LEVELS = [
  'Below 10th',
  '10th / SSC',
  '12th / HSC',
  'Diploma',
  "Bachelor's Degree",
  "Master's Degree",
  'Doctorate',
  'Professional Degree',
  'Other',
] as const;

export const LANGUAGES = [
  'English',
  'Hindi',
  'Marathi',
  'Tamil',
  'Telugu',
  'Kannada',
  'Malayalam',
  'Bengali',
  'Gujarati',
  'Punjabi',
  'Other',
] as const;

export const COUNTRY_CODES = [
  '+91 (India)',
  '+1 (USA)',
  '+44 (UK)',
  '+61 (Australia)',
  '+971 (UAE)',
  '+966 (Saudi Arabia)',
  '+65 (Singapore)',
  '+60 (Malaysia)',
] as const;

export const CUSTOMER_SEGMENTS = [
  'Mass Market',
  'Premium',
  'VIP',
  'Corporate',
  'SME',
  'Government',
  'Fleet Operator',
  'High Net Worth',
  'Young Professional',
  'Senior Citizen',
] as const;

export const CREDIT_STATUSES = [
  'Not Applicable',
  'Active',
  'On Hold',
  'Suspended',
  'Blocked',
] as const;

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
] as const;

// ─── Customer Type Metadata ───────────────────────────────────────────────────

export const CUSTOMER_TYPE_META: Record<CustomerType, {
  color: string;
  bgColor: string;
  description: string;
  icon: string;
}> = {
  'Retail Individual': {
    color: '#15803D',
    bgColor: '#F0FDF4',
    description: 'Individual walk-in or retail customers',
    icon: 'User',
  },
  'Corporate': {
    color: '#1D4ED8',
    bgColor: '#EFF6FF',
    description: 'Companies, enterprises, and business clients',
    icon: 'Building2',
  },
  'Fleet': {
    color: '#0891B2',
    bgColor: '#ECFEFF',
    description: 'Fleet operators and multi-vehicle customers',
    icon: 'Truck',
  },
  'Government': {
    color: '#475569',
    bgColor: '#F8FAFC',
    description: 'Government agencies, ministries, and PSUs',
    icon: 'Landmark',
  },
  'Internal': {
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    description: 'Internal departments, employees, and branches',
    icon: 'Users',
  },
};

// ─── Step Definitions (all 7 possible steps) ──────────────────────────────────

export const CUSTOMER_STEP_DEFINITIONS: CustomerStepDef[] = [
  { index: 0, label: 'Basic Details',           tabNum: 1 },
  { index: 1, label: 'Business Identification', tabNum: 2 },
  { index: 2, label: 'Address Details',         tabNum: 3 },
  { index: 3, label: 'Contact Person',          tabNum: 4 },
  { index: 4, label: 'Consent Details',         tabNum: 5 },
  { index: 5, label: 'KYC Details',             tabNum: 6 },
  { index: 6, label: 'Family Details',          tabNum: 7 },
];

// ─── Step Applicability by Customer Type ─────────────────────────────────────
// Maps CustomerType → array of applicable step indices (from CUSTOMER_STEP_DEFINITIONS)

export const CUSTOMER_TYPE_STEP_APPLICABILITY: Record<CustomerType, number[]> = {
  'Retail Individual': [0, 2, 4, 5, 6],   // Basic, Address, Consent, KYC, Family
  'Corporate':         [0, 1, 2, 3, 4, 5], // Basic, BusinessID, Address, Contact, Consent, KYC
  'Fleet':             [0, 1, 2, 3, 4, 5],
  'Government':        [0, 1, 2, 3, 4, 5],
  'Internal':          [0, 1, 2, 3, 4, 5],
};

// ─── Empty Sub-entity Objects ──────────────────────────────────────────────────

export const EMPTY_ADDRESS: CustomerAddress = {
  id: '',
  addressType: '',
  addressLine1: '',
  addressLine2: '',
  landmark: '',
  areaLocality: '',
  pinCode: '',
  city: '',
  district: '',
  state: '',
  country: 'India',
  workLocation: '',
  isDefault: false,
  status: 'Active',
};

export const EMPTY_CONTACT: CustomerContact = {
  id: '',
  contactName: '',
  designationRole: '',
  department: '',
  mobileCountryCode: '+91 (India)',
  mobileNumber: '',
  emailId: '',
  isPreferred: false,
  status: 'Active',
  preferredLanguage: '',
};

export const EMPTY_CONSENT: CustomerConsent = {
  id: '',
  consentChannel: '',
  consentPurpose: '',
  consentStatus: '',
  capturedDateTime: '',
  consentSource: '',
  capturedBy: '',
  withdrawalDateTime: '',
  withdrawalReason: '',
};

export const EMPTY_KYC_DOC: CustomerKYCDocument = {
  id: '',
  documentType: '',
  documentNumber: '',
  documentExpiryDate: '',
  attachmentReference: '',
  documentStatus: '',
  rejectionReason: '',
  isPrimaryDocument: false,
  documentVersion: 1,
  replacementReason: '',
  documentEffectiveDate: '',
  verifiedBy: '',
  verifiedDateTime: '',
};

export const EMPTY_KYC_TAX_MAPPING: CustomerKYCTaxMapping = {
  id: '',
  kycDocumentId: '',
  taxRegistrationType: '',
  taxRegistrationNumber: '',
  addressId: '',
  mappedState: '',
  isPrimaryTaxRegistration: false,
  transactionUsage: [],
};

export const EMPTY_FAMILY_MEMBER: CustomerFamilyMember = {
  id: '',
  relationship: '',
  specifyRelationship: '',
  memberName: '',
  dateOfBirth: '',
  age: null,
  contactCountryCode: '',
  contactNumber: '',
};

// ─── Empty Customer Object ────────────────────────────────────────────────────

export const EMPTY_CUSTOMER: Customer = {
  id: '',
  draftReferenceId: '',
  customerCode: '',
  customerStatus: 'Draft',
  statusChangeReason: '',
  customerType: 'Retail Individual',
  primaryCustomerSegment: '',
  additionalTags: [],
  isLoyaltyCustomer: false,
  createdSource: '',
  sourceSystem: '',
  sourceReferenceId: '',
  sourceValidationStatus: '',
  bulkUploadBatchId: '',
  owningOrganization: '',
  owningBranchDealer: '',
  visibilityScope: '',
  isSharedCustomer: false,
  salutation: '',
  firstName: '',
  middleName: '',
  lastName: '',
  legalName: '',
  tradeName: '',
  deptLegalName: '',
  internalEntityName: '',
  displayName: '',
  primaryMobileCountryCode: '+91 (India)',
  primaryMobileNumber: '',
  secondaryMobileCountryCode: '',
  secondaryMobileNumber: '',
  emailId: '',
  otpVerified: false,
  sourceOfLead: '',
  specifyOtherSource: '',
  gender: '',
  dateOfBirth: '',
  age: null,
  maritalStatus: '',
  anniversaryDate: '',
  nationality: '',
  education: '',
  preferredLanguage: '',
  creditStatus: '',
  creditHoldReason: '',
  dateOfIncorporation: '',
  isTaxExempt: false,
  taxExemptionReason: '',
  taxExemptionEffectiveFrom: '',
  taxExemptionEffectiveTo: '',
  taxExemptionAttachment: '',
  profileImageReference: '',
  overallKYCStatus: '',
  addresses: [],
  contacts: [],
  consents: [],
  kycDocuments: [],
  kycTaxMappings: [],
  familyMembers: [],
  createdAt: '',
  updatedAt: '',
};
