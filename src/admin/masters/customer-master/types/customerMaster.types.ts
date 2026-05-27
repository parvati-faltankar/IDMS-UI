// ─── Customer Master — TypeScript Types ───────────────────────────────────────

// ─── Scalar types ─────────────────────────────────────────────────────────────

export type CustomerType =
  | 'Retail Individual'
  | 'Corporate'
  | 'Fleet'
  | 'Government'
  | 'Internal';

export type CustomerStatus = 'Draft' | 'Active' | 'Inactive' | 'Blocked';

export type SubEntityStatus = 'Active' | 'Inactive';

export type CustomerCreatedSource =
  | 'Manual'
  | 'CRM'
  | 'API'
  | 'Migration'
  | 'Mobile App'
  | 'Website'
  | 'Bulk Upload'
  | 'Service Transaction'
  | 'Sales Transaction';

export type CustomerSourceValidationStatus =
  | 'Accepted'
  | 'Pending Validation'
  | 'Rejected'
  | 'Partially Validated';

export type CustomerLeadSource =
  | 'Walk-in'
  | 'Referral'
  | 'Campaign'
  | 'Website'
  | 'Mobile App'
  | 'CRM Lead'
  | 'Call Center'
  | 'Dealer Event'
  | 'Service Visit'
  | 'Sales Enquiry'
  | 'Legacy Data'
  | 'Other';

export type CreditStatus =
  | 'Not Applicable'
  | 'Active'
  | 'On Hold'
  | 'Suspended'
  | 'Blocked';

export type VisibilityScope =
  | 'Global'
  | 'Organization Level'
  | 'Branch Level'
  | 'Dealer Level'
  | 'Restricted';

export type CustomerAddressType =
  | 'Billing'
  | 'Service'
  | 'Delivery/Shipping'
  | 'Communication'
  | 'Permanent'
  | 'Registered Office'
  | 'Branch/Site Address';

export type CustomerContactRole =
  | 'Billing'
  | 'Service'
  | 'Purchase'
  | 'Admin'
  | 'Authorized Signatory'
  | 'Other';

export type CustomerConsentChannel = 'SMS' | 'WhatsApp' | 'Email' | 'Call';

export type CustomerConsentPurpose =
  | 'Transactional'
  | 'Service Updates'
  | 'Promotional'
  | 'Marketing';

export type CustomerConsentStatus = 'Allowed' | 'Not Allowed' | 'Withdrawn';

export type CustomerConsentSource =
  | 'DMS'
  | 'CRM'
  | 'Mobile App'
  | 'Website'
  | 'Call Center'
  | 'Migration';

export type CustomerKYCStatus =
  | 'Not Required'
  | 'Pending'
  | 'Partially Verified'
  | 'Verified'
  | 'Rejected'
  | 'Expired';

export type CustomerKYCDocumentStatus =
  | 'Draft'
  | 'Submitted'
  | 'Verified'
  | 'Rejected'
  | 'Expired'
  | 'Inactive/Replaced';

export type FamilyRelationship =
  | 'Spouse'
  | 'Father'
  | 'Mother'
  | 'Son'
  | 'Daughter'
  | 'Brother'
  | 'Sister'
  | 'Other';

// ─── Sub-entity: Address ──────────────────────────────────────────────────────

export interface CustomerAddress {
  id: string;
  addressType: CustomerAddressType | '';
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  areaLocality: string;
  pinCode: string;
  city: string;
  district: string;
  state: string;
  country: string;
  workLocation: string;
  isDefault: boolean;
  status: SubEntityStatus;
}

// ─── Sub-entity: Contact Person ───────────────────────────────────────────────

export interface CustomerContact {
  id: string;
  contactName: string;
  designationRole: CustomerContactRole | string;
  department: string;
  mobileCountryCode: string;
  mobileNumber: string;
  emailId: string;
  isPreferred: boolean;
  status: SubEntityStatus;
  preferredLanguage: string;
}

// ─── Sub-entity: Consent ──────────────────────────────────────────────────────

export interface CustomerConsent {
  id: string;
  consentChannel: CustomerConsentChannel | '';
  consentPurpose: CustomerConsentPurpose | '';
  consentStatus: CustomerConsentStatus | '';
  capturedDateTime: string;
  consentSource: CustomerConsentSource | '';
  capturedBy: string;
  withdrawalDateTime: string;
  withdrawalReason: string;
}

// ─── Sub-entity: KYC Document ────────────────────────────────────────────────

export interface CustomerKYCDocument {
  id: string;
  documentType: string;
  documentNumber: string;
  documentExpiryDate: string;
  attachmentReference: string;
  documentStatus: CustomerKYCDocumentStatus | '';
  rejectionReason: string;
  isPrimaryDocument: boolean;
  documentVersion: number;
  replacementReason: string;
  documentEffectiveDate: string;
  verifiedBy: string;
  verifiedDateTime: string;
}

// ─── Sub-entity: KYC Tax Registration Mapping ────────────────────────────────

export interface CustomerKYCTaxMapping {
  id: string;
  kycDocumentId: string;
  taxRegistrationType: string;
  taxRegistrationNumber: string;
  addressId: string;
  mappedState: string;
  isPrimaryTaxRegistration: boolean;
  transactionUsage: string[];
}

// ─── Sub-entity: Family Member ────────────────────────────────────────────────

export interface CustomerFamilyMember {
  id: string;
  relationship: FamilyRelationship | '';
  specifyRelationship: string;
  memberName: string;
  dateOfBirth: string;
  age: number | null;
  contactCountryCode: string;
  contactNumber: string;
}

// ─── Main Customer Interface ──────────────────────────────────────────────────

export interface Customer {
  id: string;

  // System Identification
  draftReferenceId: string;
  customerCode: string;

  // Status & Lifecycle
  customerStatus: CustomerStatus;
  statusChangeReason: string;

  // Customer Classification
  customerType: CustomerType;
  primaryCustomerSegment: string;
  additionalTags: string[];
  isLoyaltyCustomer: boolean;

  // Source Tracking
  createdSource: CustomerCreatedSource | '';
  sourceSystem: string;
  sourceReferenceId: string;
  sourceValidationStatus: CustomerSourceValidationStatus | '';
  bulkUploadBatchId: string;

  // Ownership & Visibility
  owningOrganization: string;
  owningBranchDealer: string;
  visibilityScope: VisibilityScope | '';
  isSharedCustomer: boolean;

  // Individual Name (Retail Individual)
  salutation: string;
  firstName: string;
  middleName: string;
  lastName: string;

  // Business Name (Corporate, Fleet)
  legalName: string;
  tradeName: string;

  // Government Name
  deptLegalName: string;

  // Internal Name
  internalEntityName: string;

  // Display Identity
  displayName: string;

  // Contact Details
  primaryMobileCountryCode: string;
  primaryMobileNumber: string;
  secondaryMobileCountryCode: string;
  secondaryMobileNumber: string;
  emailId: string;
  otpVerified: boolean;

  // Source of Lead
  sourceOfLead: CustomerLeadSource | '';
  specifyOtherSource: string;

  // Personal Profile (Retail Individual)
  gender: string;
  dateOfBirth: string;
  age: number | null;
  maritalStatus: string;
  anniversaryDate: string;
  nationality: string;
  education: string;
  preferredLanguage: string;

  // Credit Summary (read-only, derived from Finance/Credit Setup)
  creditStatus: CreditStatus | '';
  creditHoldReason: string;

  // Business Identification
  dateOfIncorporation: string;
  isTaxExempt: boolean;
  taxExemptionReason: string;
  taxExemptionEffectiveFrom: string;
  taxExemptionEffectiveTo: string;
  taxExemptionAttachment: string;

  // Profile Image (KYC)
  profileImageReference: string;

  // Overall KYC Status (system-derived)
  overallKYCStatus: CustomerKYCStatus | '';

  // Sub-entities
  addresses: CustomerAddress[];
  contacts: CustomerContact[];
  consents: CustomerConsent[];
  kycDocuments: CustomerKYCDocument[];
  kycTaxMappings: CustomerKYCTaxMapping[];
  familyMembers: CustomerFamilyMember[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ─── Step Definition ──────────────────────────────────────────────────────────

export interface CustomerStepDef {
  index: number;
  label: string;
  tabNum: number;
}
