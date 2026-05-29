// ─── Service Type Master — TypeScript Types ───────────────────────────────────

// ─── Enum / Union Types ───────────────────────────────────────────────────────

export type STStatus = 'Draft' | 'Active' | 'Inactive';

export type PostingType = 'Paid' | 'Expenses' | 'Generate Claim';

export type BillingRatioType = 'Percentage' | 'Amount';

export type AllocationType = 'Change';

export type ContractOperator = 'ONLY DAYS' | 'And' | 'OR' | 'Only KM' | 'Maximum';

export type ServiceDeliveryMode =
  | 'On-site'
  | 'Workshop'
  | 'Remote'
  | 'Depot'
  | 'Pickup & Drop';

export type ServiceSourceApplicability =
  | 'Complaint'
  | 'Contract'
  | 'Warranty'
  | 'Scheduled PM'
  | 'IoT Alert'
  | 'Customer Request';

export type AssetIdentificationLevel =
  | 'Product'
  | 'Serial Number'
  | 'IMEI'
  | 'VIN'
  | 'Equipment Number'
  | 'Meter'
  | 'Location';

export type MeterReadingType =
  | 'KM'
  | 'Hours'
  | 'Cycles'
  | 'Units'
  | 'Runtime'
  | 'Print Count';

export type DurationType = 'Days' | 'Weeks' | 'Months' | 'Years';

export type DurationTypeShort = 'Days' | 'Month' | 'Year';

export type OperatorType = 'AND' | 'OR';

export type ServiceProviderType =
  | 'In-house'
  | 'Dealer'
  | 'Authorized Service Center'
  | 'OEM'
  | 'Third-party'
  | 'Partner';

export type SkillProficiencyLevel =
  | 'Junior'
  | 'Senior'
  | 'Expert'
  | 'OEM Certified';

export type WarrantyEligibilityBasis =
  | 'Sale Date'
  | 'Installation Date'
  | 'Usage'
  | 'Contract'
  | 'Serial Number'
  | 'Claim Policy';

export type BillingResponsibility =
  | 'Customer Paid'
  | 'OEM Paid'
  | 'Insurance Paid'
  | 'Warranty Paid'
  | 'Dealer Paid'
  | 'Contract Paid';

export type RelationType =
  | 'Service Details'
  | 'Item Details'
  | 'Vehicle Contract Applicable'
  | 'Service Contract Applicable'
  | 'Item Contract Applicable';

export type LogicOp = 'AND' | 'OR';

export type CategoryType = 'Individual' | 'Group';

export type SLACalendarType = 'Business Hours' | '24x7' | 'Customer Calendar';

// ─── Sub-entity Row Types ─────────────────────────────────────────────────────

export interface BillingRatioRow {
  id: string;
  serviceTypeRef: string;       // service type code/name lookup
  displayName: string;          // auto-populated, read-only
  accountPostingType: PostingType | '';
  order: string;                // number as string
  allocationType: AllocationType | '';
  value: string;
  minAllowedValue: string;
  maxAllowedValue: string;
}

export interface ProductApplicabilityRow {
  id: string;
  product: string;              // product code
  productName: string;          // auto-populated
  productCode: string;          // code alias
  variantCode: string;
  minUsage: string;
  maxUsage: string;
  additionalUsage: string;
  logic: LogicOp | '';
  durationType: DurationTypeShort | '';
  minDuration: string;
  maxDuration: string;
  additionalDuration: string;
  qty: string;
  availMultipleTimes: boolean;
  availLimit: string;
  mfgFrom: string;
  mfgTo: string;
  saleFrom: string;
  saleTo: string;
  dispatchFrom: string;
  dispatchTo: string;
  relationType: RelationType | '';
  applicableContract: string;
}

export interface ContractRelationLabourRow {
  id: string;
  productAttribute: string;
  productCodeName: string;
  category: CategoryType | '';
  groupName: string;
  service: string;
  serviceName: string;          // auto-populated
  minUsage: string;
  maxUsage: string;
  additionalUsage: string;
  logic: LogicOp | '';
  durationType: DurationTypeShort | '';
  minDuration: string;
  maxDuration: string;
  additionalDuration: string;
  hours: string;
  qty: string;
  availMultipleTimes: boolean;
  availLimit: string;
  applicableContract: string;
  autoPopulate: boolean;
  mandatory: boolean;
  sequence: string;
  lineServiceType: string;
  atLeast: string;
}

export interface ContractRelationPartRow {
  id: string;
  productAttribute: string;
  productCodeName: string;
  category: CategoryType | '';
  groupName: string;
  part: string;
  partName: string;             // auto-populated
  minUsage: string;
  maxUsage: string;
  additionalUsage: string;
  logic: LogicOp | '';
  durationType: DurationTypeShort | '';
  minDuration: string;
  maxDuration: string;
  additionalDuration: string;
  qty: string;
  availMultipleTimes: boolean;
  availLimit: string;
  applicableContract: string;
  autoPopulate: boolean;
  autoFetch: boolean;
  mandatory: boolean;
  sequence: string;
  lineServiceType: string;
  atLeast: string;
}

export interface AttributeTagRow {
  id: string;
  selectAttribute: string;
  attributeCode: string;        // auto-populated, read-only
  attributeName: string;        // auto-populated, read-only
  attributeType: string;        // auto-populated
  mandatory: boolean;
  defaultValue: string;
  validationRules: string;
  value: string;
}

// ─── Main Record ──────────────────────────────────────────────────────────────

export interface ServiceTypeRecord {
  id: string;
  status: STStatus;

  // ── Basic Information ───────────────────────────────────────────────────────
  code: string;
  codeOverride: boolean;        // if true, user typed manually
  name: string;
  postingType: PostingType | '';
  description: string;

  // ── Contract Configuration ──────────────────────────────────────────────────
  saleable: boolean;
  taxExempted: boolean;
  subscriptionApplicable: boolean;
  separateBillRequired: boolean;
  contractRequired: boolean;
  generateReminder: boolean;
  applicableToAllParts: boolean;
  applicableToAllServices: boolean;
  applicableToAllProducts: boolean;
  isRatioApplicable: boolean;
  billingRatioType: BillingRatioType | '';
  billingRatioRows: BillingRatioRow[];
  isHeader: boolean;
  isLine: boolean;
  availWithUCN: boolean;
  availMultipleTimes: boolean;
  availLimit: string;
  active: boolean;
  discontinued: boolean;
  copyToWarrantyTab: boolean;
  availedAtOrganization: boolean;
  isCustom: boolean;

  // ── Contract Settings ───────────────────────────────────────────────────────
  claimTo: string;
  contractOperator: ContractOperator | '';
  defaultMaxDuration: string;
  defaultMaxUsage: string;
  applicableContract: string;
  dependentContract: string;

  // ── Child Service Contract Mapping ──────────────────────────────────────────
  childContractActive: boolean;
  childContracts: string[];
  childLabours: string[];

  // ── Classification ───────────────────────────────────────────────────────────
  segmentType: string;
  subSegmentType: string;
  organization: string;

  // ── Service Execution ────────────────────────────────────────────────────────
  serviceDeliveryMode: ServiceDeliveryMode | '';
  serviceRequestSourceApplicability: ServiceSourceApplicability[];
  remoteServiceAllowed: boolean;
  remoteDiagnosisRequired: boolean;

  // ── Asset Applicability ──────────────────────────────────────────────────────
  installedAssetRequired: boolean;
  assetIdentificationLevel: AssetIdentificationLevel | '';
  multiAssetServiceAllowed: boolean;

  // ── Scheduling & Recurrence ──────────────────────────────────────────────────
  meterReadingRequired: boolean;
  meterReadingType: MeterReadingType | '';
  meterReading: string;
  durationType: DurationType | '';
  durationValue: string;
  operator: OperatorType | '';
  serviceTypeTagging: string[];
  standardServiceDuration: string;
  serviceTimeWindowRequired: boolean;
  defaultServiceWindowFrom: string;
  defaultServiceWindowTo: string;

  // ── Territory & Provider ─────────────────────────────────────────────────────
  applicableServiceTerritory: string[];
  serviceProviderType: ServiceProviderType | '';

  // ── Technician & Skill ────────────────────────────────────────────────────────
  requiredSkill: string[];
  requiredCertification: string[];
  skillProficiencyLevel: SkillProficiencyLevel | '';
  minimumTechnicianCount: string;
  crewRequired: boolean;

  // ── Safety, Checklist & Evidence ────────────────────────────────────────────
  safetyPermitRequired: boolean;
  safetyChecklistTemplate: string;
  preServiceChecklistTemplate: string;
  postServiceChecklistTemplate: string;
  testInspectionEvidenceRequired: boolean;
  complaintReviewRequired: boolean;

  // ── SLA & Approval ────────────────────────────────────────────────────────────
  slaProfile: string;
  responseSLA: string;
  resolutionSLA: string;
  slaCalendar: SLACalendarType | '';
  approvalRequired: boolean;

  // ── Warranty, Billing & Operations ───────────────────────────────────────────
  warrantyEligibilityBasis: WarrantyEligibilityBasis | '';
  billingResponsibility: BillingResponsibility | '';
  visitChargeApplicable: boolean;
  diagnosisChargeApplicable: boolean;
  pickupAndDropRequired: boolean;
  closureEvidenceRequired: boolean;
  followUpRequired: boolean;
  followUpInterval: string;
  knowledgeArticleReference: string;
  offlineExecutionAllowed: boolean;

  // ── Product Applicability ──────────────────────────────────────────────────
  productCategory: string;
  productApplicabilityRows: ProductApplicabilityRow[];

  // ── Contract Relation ──────────────────────────────────────────────────────
  labourRows: ContractRelationLabourRow[];
  partRows: ContractRelationPartRow[];

  // ── Attribute Tagging ──────────────────────────────────────────────────────
  attributeTagRows: AttributeTagRow[];

  // ── Audit ──────────────────────────────────────────────────────────────────
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
}
