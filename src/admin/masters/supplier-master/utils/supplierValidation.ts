// ─── Supplier Master — Core BP Validation ────────────────────────────────────

import type { BusinessPartner } from '../types/supplierMaster.types';

export interface BPFieldErrors {
  bpCode?: string;
  bpLegalName?: string;
  bpType?: string;
  effectiveFromDate?: string;
  effectiveToDate?: string;
}

export function validateBPForSave(
  bp: Partial<BusinessPartner>,
  allBPs: BusinessPartner[],
  editingId?: string,
): BPFieldErrors {
  const errors: BPFieldErrors = {};

  if (!bp.bpLegalName?.trim()) {
    errors.bpLegalName = 'Legal name is required.';
  }

  if (!bp.bpType) {
    errors.bpType = 'Business partner type is required.';
  }

  // Duplicate legal name check
  const duplicate = allBPs.find(
    (b) =>
      b.bpLegalName.trim().toLowerCase() === bp.bpLegalName?.trim().toLowerCase() &&
      b.id !== editingId,
  );
  if (duplicate) {
    errors.bpLegalName = 'A business partner with this legal name already exists.';
  }

  // Date range check
  if (bp.effectiveFromDate && bp.effectiveToDate && bp.effectiveToDate < bp.effectiveFromDate) {
    errors.effectiveToDate = 'Effective To date must be on or after Effective From date.';
  }

  return errors;
}

export function validateBPForActivation(bp: BusinessPartner): string[] {
  const issues: string[] = [];

  if (!bp.bpLegalName?.trim()) issues.push('Legal name is required.');
  if (!bp.bpType) issues.push('Business partner type is required.');
  if (!bp.bpCategory) issues.push('BP category is required.');
  if (!bp.countryOfRegistration) issues.push('Country of registration is required.');
  if (!bp.businessType) issues.push('Business type is required.');

  if (bp.contacts.length === 0) {
    issues.push('At least one contact must be added.');
  } else {
    const hasPrimary = bp.contacts.some((c) => c.contactType === 'Primary' && c.status === 'Active');
    if (!hasPrimary) issues.push('A Primary contact is required.');
  }

  if (bp.addresses.length === 0) {
    issues.push('At least one address must be added.');
  } else {
    const hasDefault = bp.addresses.some((a) => a.isDefault && a.status === 'Active');
    if (!hasDefault) issues.push('At least one address must be set as default.');
  }

  // Transporter-specific configuration validation
  if (bp.bpType === 'Transporter') {
    const tc = bp.transporterConfig;
    if (!tc || !tc.transportModes?.length) issues.push('At least one Transport Mode is required.');
    if (!tc?.serviceNature)               issues.push('Service Nature is required.');
    if (!tc?.fleetOwnershipType)          issues.push('Fleet Ownership Type is required.');
    if (!tc?.coverageScope)               issues.push('Coverage Scope is required.');
    if (!tc?.vehicleCapabilities?.length) issues.push('At least one Vehicle Type is required.');
    if (!tc?.standardTransitTime)         issues.push('Standard Transit Time is required.');
    if (!tc?.pickupResponsibility)        issues.push('Pickup Responsibility is required.');
    if (!tc?.deliveryResponsibility)      issues.push('Delivery Responsibility is required.');
    if (!tc?.configEffectiveFrom)         issues.push('Transporter Configuration Effective From Date is required.');
  }

  // Insurance Provider-specific configuration validation
  if (bp.bpType === 'Insurance Provider') {
    const ic = bp.insuranceConfig;
    if (!ic?.insuranceProviderType)              issues.push('Insurance Provider Type is required.');
    if (!ic?.regulatorRegNumber)                 issues.push('Regulator Registration Number is required.');
    if (!ic?.regulatorRegValidTill)              issues.push('Regulator Registration expiry date is required.');
    if (!ic?.supportedInsuranceLines?.length)    issues.push('Select at least one Insurance Line.');
    if (!ic?.mandatoryCustomerDocuments?.length) issues.push('Select at least one mandatory document.');
    if (ic?.vehicleInspectionRequired && !ic?.inspectionMode) issues.push('Inspection Mode is required when Vehicle Inspection is enabled.');
    if (ic?.commissionApplicable && !ic?.commissionType)      issues.push('Commission Type is required when Commission is applicable.');
    if (ic?.commissionType && !ic?.commissionValue)           issues.push('Commission Value is required.');
    if (ic?.commissionType === 'Fixed' && !ic?.commissionCurrency) issues.push('Commission Currency is required when Fixed commission is configured.');
    if (!ic?.configEffectiveFrom)                issues.push('Effective From Date is required.');
    if (!ic?.configStatus)                       issues.push('Insurance Configuration Status is required.');
  }

  // Financier-specific configuration validation
  if (bp.bpType === 'Financier') {
    const fc = bp.financierConfig;
    if (!fc?.financierType)                      issues.push('Financier Type is required.');
    if (!fc?.supportedBusiness?.length)          issues.push('Select at least one Supported Business.');
    if (!fc?.financingModel?.length)             issues.push('Select at least one Financing Model.');
    if (!fc?.coverageScope)                      issues.push('Coverage Scope is required.');
    if (fc?.supportedBusiness?.includes('Vehicle') && !fc?.eligibleVehicleTypes?.length) issues.push('Select eligible Vehicle Types.');
    if (!fc?.interestType)                       issues.push('Interest Type is required.');
    if (!fc?.disbursementMode)                   issues.push('Disbursement Mode is required.');
    if (!fc?.settlementTrigger)                  issues.push('Settlement Trigger is required.');
    if (!fc?.mandatoryDocuments?.length)         issues.push('Select at least one mandatory document.');
    if (!fc?.customerKycLevel)                   issues.push('Customer KYC Level is required.');
    if (fc?.processingFeeType && !fc?.processingFeeValue) issues.push('Processing Fee Value is required when Processing Fee Type is selected.');
    if (fc?.commissionApplicable && !fc?.commissionType)  issues.push('Commission Type is required when Commission is applicable.');
    if (fc?.commissionType && !fc?.commissionValue)       issues.push('Commission Value is required.');
    if (fc?.commissionType === 'Fixed' && !fc?.commissionCurrency) issues.push('Commission Currency is required when Fixed commission is configured.');
    const needsCurrency = !!(fc?.minLoanAmount || fc?.maxLoanAmount || (fc?.processingFeeType === 'Fixed' && fc?.processingFeeValue) || (fc?.commissionType === 'Fixed' && fc?.commissionValue));
    if (needsCurrency && !fc?.financeCurrency)   issues.push('Finance Currency is required when a loan amount or fixed charge is entered.');
    if (!fc?.configEffectiveFrom)                issues.push('Effective From Date is required.');
    if (!fc?.configStatus)                       issues.push('Financier Configuration Status is required.');
  }

  return issues;
}
