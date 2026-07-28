export type ServiceTypeHelpEntry = {
  title: string;
  useCase: string;
  purpose: string;
  impact: string;
  outcome: string;
  example?: string;
};

const makeHelp = (
  title: string,
  useCase: string,
  purpose: string,
  impact: string,
  outcome: string,
  example?: string,
): ServiceTypeHelpEntry => ({ title, useCase, purpose, impact, outcome, example });

export const STEP_HELP = {
  serviceIdentityStep: makeHelp('Service Identity', 'User defines the base identity of the service type.', 'Captures the core name, posting model, and summary.', 'Workflow impact', 'Keeps the service catalogue clear and searchable.'),
  billingContractStep: makeHelp('Billing & Contract', 'User configures how the service is billed and whether contracts govern it.', 'Aligns financial and entitlement behavior.', 'Financial and workflow impact', 'Prevents incorrect billing or contract usage.'),
  assetSchedulingStep: makeHelp('Asset & Scheduling', 'User defines recurrence, asset dependency, and timing rules.', 'Controls due logic and scheduling readiness.', 'Operational impact', 'Improves preventive service planning.'),
  teamDeliveryStep: makeHelp('Team & Delivery', 'User defines provider, crew, skills, and territory expectations.', 'Supports better assignment planning.', 'Operational impact', 'Improves execution quality and dispatch fit.'),
  safetySlaStep: makeHelp('Safety & SLA', 'User configures safety gates, service commitments, and approvals.', 'Supports compliant and measurable service delivery.', 'Compliance impact', 'Improves readiness, response tracking, and governance.'),
  advancedSettingsStep: makeHelp('Advanced Settings', 'User reviews optional controls and downstream setup details.', 'Fine-tunes special-case behavior.', 'Configuration impact', 'Keeps the primary setup lean while retaining flexibility.'),
} as const;

export const FIELD_HELP = {
  serviceTypeName: makeHelp('Service Type Name', 'User enters the business-facing service name.', 'Makes the service easy to identify in requests and reports.', 'Logical impact', 'Prevents vague or duplicate service setup.', 'Example: Annual Maintenance Contract'),
  postingType: makeHelp('Posting Type', 'User decides how this service should be posted financially.', 'Controls whether the service behaves like a paid, free, warranty, or contract-driven service.', 'Financial impact', 'Improves invoice and accounting accuracy.'),
  description: makeHelp('Description', 'User explains what the service covers.', 'Helps users understand when to use the service.', 'Information-only', 'Reduces wrong service selection.'),
  usedAs: makeHelp('Used As', 'User decides where this service appears in transactions.', 'Controls header, line-item, or mixed usage.', 'Workflow impact', 'Prevents use at the wrong transaction level.'),
  saleable: makeHelp('Saleable', 'User marks whether this service can be billed commercially.', 'Separates purely operational services from revenue-bearing services.', 'Financial impact', 'Improves pricing and invoice control.'),
  taxExempted: makeHelp('Tax Exempted', 'User marks whether tax should not be applied to this service.', 'Supports compliant taxation behavior.', 'Financial impact', 'Reduces tax misapplication risk.'),
  active: makeHelp('Active', 'User controls whether the service type is available for use.', 'Prevents inactive services from being selected in live operations.', 'Workflow impact', 'Improves catalogue hygiene.'),
  billingResponsibility: makeHelp('Billing Responsibility', 'User defines who should bear the cost.', 'Supports customer, OEM, vendor, or split billing scenarios.', 'Financial impact', 'Improves charge allocation.'),
  billingRatioApplicable: makeHelp('Billing Ratio Applicable', 'User marks whether charges should be split using ratio logic.', 'Enables percentage-based sharing across billing parties.', 'Financial impact', 'Improves complex billing allocation.'),
  contractRequired: makeHelp('Contract Required', 'User marks whether this service can only be availed under a valid contract.', 'Protects entitlement-driven services from open use.', 'Workflow impact', 'Prevents invalid service availing.'),
  contractOperator: makeHelp('Contract Operator', 'User defines how contract evaluation should behave.', 'Supports precise contract applicability logic.', 'Logical impact', 'Improves entitlement matching.'),
  applicableContract: makeHelp('Applicable Contract', 'User narrows this service to a specific contract setup.', 'Limits usage to approved contract types.', 'Logical impact', 'Avoids using the service under unrelated contracts.'),
  recurrenceTracking: makeHelp('Recurrence Tracking', 'User chooses whether the service is due by meter, duration, both, or not recurring.', 'Defines the due-service logic.', 'Scheduling impact', 'Improves maintenance triggering.'),
  meterReadingType: makeHelp('Meter Reading Type', 'User selects the measurement basis such as KM, hours, or cycles.', 'Standardises usage-based recurrence.', 'Scheduling impact', 'Keeps due calculations asset-appropriate.'),
  meterReadingValue: makeHelp('Meter Reading Value', 'User sets the usage threshold for recurrence.', 'Defines when the service becomes due by usage.', 'Scheduling impact', 'Improves preventive maintenance accuracy.'),
  durationType: makeHelp('Duration Type', 'User selects the calendar interval basis.', 'Defines the time unit for recurrence.', 'Scheduling impact', 'Supports reliable time-based service planning.'),
  durationValue: makeHelp('Duration Value', 'User enters the time interval for recurrence.', 'Sets how often the service should be due by duration.', 'Scheduling impact', 'Prevents missed or early service triggers.'),
  recurrenceOperator: makeHelp('Operator', 'User defines how meter and duration should work when both are enabled.', 'Controls whether both conditions or either condition should trigger due service.', 'Logical impact', 'Prevents conflicting recurrence rules.'),
  installedAssetRequired: makeHelp('Installed Asset Required', 'User marks whether a linked installed asset is mandatory.', 'Separates asset-bound work from generic services.', 'Workflow impact', 'Prevents asset services from being raised without asset context.'),
  assetIdentificationLevel: makeHelp('Asset Identification Level', 'User defines how precisely the asset must be identified.', 'Controls whether model, serial, or installed asset detail is needed.', 'Workflow impact', 'Improves service eligibility accuracy.'),
  multiAssetServiceAllowed: makeHelp('Multi-Asset Allowed', 'User allows one service request to cover multiple assets.', 'Supports grouped service execution.', 'Workflow impact', 'Improves batch planning.'),
  standardServiceDuration: makeHelp('Standard Service Duration', 'User estimates the usual execution duration.', 'Supports schedule, slot, and manpower planning.', 'Operational impact', 'Improves realistic planning.'),
  serviceTimeWindowRequired: makeHelp('Service Time Window Required', 'User decides whether the service must happen inside a time band.', 'Supports appointment or policy-bound execution.', 'Scheduling impact', 'Prevents out-of-window booking.'),
  windowFrom: makeHelp('Window From', 'User sets the earliest allowed execution time.', 'Defines the start of the service window.', 'Scheduling impact', 'Supports compliant appointment creation.'),
  windowTo: makeHelp('Window To', 'User sets the latest allowed execution time.', 'Defines the end of the service window.', 'Scheduling impact', 'Avoids booking beyond the approved window.'),
  serviceDeliveryMode: makeHelp('Service Delivery Mode', 'User selects how the service is delivered.', 'Aligns execution with workshop, field, remote, or hybrid models.', 'Operational impact', 'Improves dispatch and customer expectations.'),
  serviceProviderType: makeHelp('Service Provider Type', 'User selects who will execute the service.', 'Supports ownership and fulfillment planning.', 'Operational impact', 'Improves assignment clarity.'),
  requiredSkills: makeHelp('Required Skills', 'User tags the skill requirements for this service.', 'Supports technician matching and training readiness.', 'Operational impact', 'Improves first-time-right execution.'),
  requiredCertifications: makeHelp('Required Certifications', 'User lists certifications that are mandatory before assignment.', 'Supports compliance and OEM standards.', 'Compliance impact', 'Prevents assignment to underqualified staff.'),
  applicableTerritories: makeHelp('Applicable Territories', 'User limits service execution to selected territories.', 'Supports territory-based governance.', 'Operational impact', 'Prevents out-of-scope assignment.'),
  crewRequired: makeHelp('Crew Required', 'User marks whether more than one technician is needed.', 'Supports team-based execution planning.', 'Operational impact', 'Improves staffing decisions.'),
  remoteServiceAllowed: makeHelp('Remote Service Allowed', 'User allows the service to be performed through remote support.', 'Supports hybrid service models.', 'Operational impact', 'Improves flexibility and response speed.'),
  minimumTechnicians: makeHelp('Minimum Technicians', 'User sets the minimum crew size for execution.', 'Supports safe and realistic staffing.', 'Operational impact', 'Prevents understaffed jobs.'),
  safetyPermitRequired: makeHelp('Safety Permit Required', 'User marks whether formal safety approval is needed.', 'Supports hazardous or regulated work.', 'Compliance impact', 'Improves safety governance.'),
  safetyChecklistTemplate: makeHelp('Safety Checklist Template', 'User links the checklist that should be completed before or during execution.', 'Standardises safety validation.', 'Compliance impact', 'Improves execution consistency.'),
  slaProfile: makeHelp('SLA Profile', 'User selects the SLA package for this service.', 'Defines response and resolution commitment behavior.', 'Operational impact', 'Improves monitoring and escalation readiness.'),
  slaCalendar: makeHelp('SLA Calendar', 'User defines which calendar drives SLA timing.', 'Controls whether SLA uses business hours or 24x7 timing.', 'Operational impact', 'Prevents wrong SLA calculations.'),
  responseSla: makeHelp('Response SLA', 'User sets the maximum response time.', 'Defines the initial service commitment.', 'Operational impact', 'Improves response tracking.'),
  resolutionSla: makeHelp('Resolution SLA', 'User sets the maximum resolution time.', 'Defines the completion commitment.', 'Operational impact', 'Improves service performance measurement.'),
  approvalRequired: makeHelp('Approval Required', 'User marks whether execution needs approval first.', 'Supports governed or sensitive services.', 'Workflow impact', 'Prevents unauthorized execution.'),
  subscriptionApplicable: makeHelp('Subscription Applicable', 'User marks whether the service can participate in subscription-style offerings.', 'Supports recurring commercial packaging.', 'Commercial impact', 'Improves offer-model flexibility.'),
  separateBillRequired: makeHelp('Separate Bill Required', 'User marks whether this service should be billed separately.', 'Supports services that must not merge into consolidated billing.', 'Financial impact', 'Improves invoice clarity.'),
  discontinued: makeHelp('Discontinued', 'User marks whether the service is retired from future use.', 'Keeps historic configuration while preventing fresh usage.', 'Workflow impact', 'Improves lifecycle control.'),
  availWithUCN: makeHelp('Avail with UCN', 'User marks whether a UCN-based reference is required or supported for availing.', 'Supports controlled usage against registered customer identifiers.', 'Workflow impact', 'Improves traceability.'),
  isCustom: makeHelp('Is Custom', 'User marks whether the service is a custom-defined offering.', 'Separates standard catalogue entries from bespoke services.', 'Reporting impact', 'Improves service classification.'),
  availedAtOrganization: makeHelp('Availed At Organization', 'User marks whether the service is consumed at organization level.', 'Supports organization-bound entitlement or execution rules.', 'Workflow impact', 'Improves applicability control.'),
  availMultipleTimes: makeHelp('Avail Multiple Times', 'User marks whether the service can be used repeatedly.', 'Controls whether usage should be unlimited or capped.', 'Policy impact', 'Prevents unintended repeat availing.'),
  offlineExecutionAllowed: makeHelp('Offline Execution Allowed', 'User marks whether the service may be completed without live connectivity.', 'Supports field environments with intermittent networks.', 'Operational impact', 'Improves execution continuity.'),
  availLimit: makeHelp('Avail Limit', 'User caps how many times the service may be availed.', 'Supports policy-driven entitlement limits.', 'Workflow impact', 'Prevents overuse.'),
  generateReminder: makeHelp('Generate Reminder', 'User marks whether reminder logic should be created for this service.', 'Supports due-date awareness and proactive follow-up.', 'Operational impact', 'Improves timely service delivery.'),
  applicableToAllParts: makeHelp('Applicable To All Parts', 'User marks whether the service applies across all parts.', 'Avoids item-by-item mapping where universal applicability is intended.', 'Configuration impact', 'Reduces maintenance effort.'),
  applicableToAllServices: makeHelp('Applicable To All Services', 'User marks whether the rule or relation should apply to all services.', 'Supports broad applicability without detailed mapping.', 'Configuration impact', 'Improves setup speed.'),
  applicableToAllProducts: makeHelp('Applicable To All Products', 'User marks whether the service applies to every product.', 'Avoids unnecessary product-level restriction.', 'Configuration impact', 'Simplifies product applicability setup.'),
  copyToWarrantyTab: makeHelp('Copy to Warranty Tab', 'User marks whether the relevant setup should flow into warranty handling.', 'Supports mirrored warranty processing behavior.', 'Workflow impact', 'Improves downstream consistency.'),
  childContractActive: makeHelp('Child Contract Active', 'User marks whether child-contract mapping should be enforced.', 'Turns on dependent entitlement relationships.', 'Logical impact', 'Improves contract hierarchy handling.'),
  childContracts: makeHelp('Child Contracts', 'User links dependent child contracts.', 'Supports parent-child entitlement mapping.', 'Logical impact', 'Improves downstream contract validation.'),
  childLabours: makeHelp('Child Labours', 'User links related labour items under child contracts.', 'Keeps labour applicability aligned with contract dependency.', 'Logical impact', 'Improves configuration consistency.'),
  segmentType: makeHelp('Segment Type', 'User classifies the service by segment.', 'Supports commercial and operational reporting.', 'Reporting impact', 'Improves analytics quality.'),
  subSegmentType: makeHelp('Sub-Segment Type', 'User adds deeper classification within a segment.', 'Supports finer-grained reporting.', 'Reporting impact', 'Improves service grouping.'),
  organization: makeHelp('Organization', 'User tags or limits the service to an organization.', 'Supports enterprise-specific control.', 'Logical impact', 'Improves ownership clarity.'),
  claimTo: makeHelp('Claim To', 'User sets the party to whom claims should be routed.', 'Supports warranty and reimbursement handling.', 'Financial impact', 'Improves claim routing accuracy.'),
  dependentContract: makeHelp('Dependent Contract', 'User links a prerequisite or related contract.', 'Supports chained entitlement logic.', 'Logical impact', 'Prevents incomplete contract setup.'),
  defaultMaxDuration: makeHelp('Default Max Duration', 'User sets a default upper duration limit.', 'Supports controlled contract defaults.', 'Policy impact', 'Keeps durations inside approved limits.'),
  defaultMaxUsage: makeHelp('Default Max Usage', 'User sets a default upper usage limit.', 'Supports capped entitlement defaults.', 'Policy impact', 'Prevents uncontrolled usage.'),
  warrantyEligibilityBasis: makeHelp('Warranty Eligibility Basis', 'User chooses the rule basis for warranty validation.', 'Standardises warranty decision logic.', 'Workflow impact', 'Improves consistency in claims.'),
  visitChargeApplicable: makeHelp('Visit Charge Applicable', 'User marks whether a visit charge can be levied for this service.', 'Supports charging for travel or site attendance.', 'Financial impact', 'Improves charge capture.'),
  diagnosisChargeApplicable: makeHelp('Diagnosis Charge Applicable', 'User marks whether diagnostic effort can be billed.', 'Supports monetising fault-identification work.', 'Financial impact', 'Improves service revenue control.'),
  pickupAndDropRequired: makeHelp('Pickup & Drop Required', 'User marks whether logistics pickup and return are needed.', 'Supports services that require physical movement of goods.', 'Operational impact', 'Improves service readiness.'),
  closureEvidenceRequired: makeHelp('Closure Evidence Required', 'User marks whether proof is mandatory before closure.', 'Supports auditable completion.', 'Compliance impact', 'Improves closeout quality.'),
  complaintReviewRequired: makeHelp('Complaint Review Required', 'User marks whether complaints linked to this service need structured review.', 'Supports governed complaint handling.', 'Workflow impact', 'Improves service quality assurance.'),
  testInspectionEvidenceRequired: makeHelp('Test/Inspection Evidence', 'User marks whether inspection or test proof must be attached.', 'Supports verifiable technical completion.', 'Compliance impact', 'Improves documentation quality.'),
  followUpRequired: makeHelp('Follow-up Required', 'User marks whether post-service follow-up is mandatory.', 'Supports controlled post-completion engagement.', 'Operational impact', 'Improves customer care consistency.'),
  followUpInterval: makeHelp('Follow-up Interval', 'User sets how many days later follow-up should happen.', 'Controls post-service follow-up timing.', 'Operational impact', 'Improves consistent customer care.'),
  knowledgeArticleReference: makeHelp('Knowledge Article Reference', 'User links guidance used during service execution.', 'Supports standard work and troubleshooting support.', 'Operational impact', 'Improves consistency and knowledge reuse.'),
  preServiceChecklist: makeHelp('Pre-Service Checklist', 'User links the checklist for readiness before service starts.', 'Supports preparation discipline.', 'Compliance impact', 'Improves execution readiness.'),
  postServiceChecklist: makeHelp('Post-Service Checklist', 'User links the checklist for closure after work is done.', 'Supports handover and completion quality.', 'Compliance impact', 'Improves closeout discipline.'),
  proficiencyLevel: makeHelp('Proficiency Level', 'User sets the expected proficiency for assignment.', 'Supports better workforce matching.', 'Operational impact', 'Improves service quality.'),
  serviceRequestSourceApplicability: makeHelp('Service Source Applicability', 'User selects which upstream request sources can use this service type.', 'Aligns the service with valid originating channels.', 'Workflow impact', 'Prevents selection from unsupported source flows.'),
} as const;

export type ServiceTypeStepHelpKey = keyof typeof STEP_HELP;
export type ServiceTypeHelpKey = keyof typeof FIELD_HELP;

export function describeHelp(help: ServiceTypeHelpEntry) {
  return `Use case: ${help.useCase}\n\nPurpose: ${help.purpose}\n\nImpact: ${help.impact}\n\nAchieves: ${help.outcome}`;
}
