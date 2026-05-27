import type { Customer } from '../types/customerMaster.types';

// ─── Validation issues list ───────────────────────────────────────────────────

export function validateCustomerForActivation(c: Customer): string[] {
  const issues: string[] = [];

  // Display Name (always required)
  if (!c.displayName.trim()) issues.push('Display Name is required.');

  // Customer Type-specific name requirements
  if (c.customerType === 'Retail Individual') {
    if (!c.firstName.trim()) issues.push('First Name is required for Retail Individual.');
  }
  if (c.customerType === 'Corporate' || c.customerType === 'Fleet') {
    if (!c.legalName.trim()) issues.push('Legal Name is required.');
  }
  if (c.customerType === 'Government') {
    if (!c.deptLegalName.trim()) issues.push('Department / Legal Name is required.');
  }
  if (c.customerType === 'Internal') {
    if (!c.internalEntityName.trim()) issues.push('Internal Entity / Employee / Branch Name is required.');
  }

  // Contact — primary mobile required for Retail Individual / Corporate / Fleet
  if (['Retail Individual', 'Corporate', 'Fleet'].includes(c.customerType)) {
    if (!c.primaryMobileNumber.trim()) issues.push('Primary Mobile Number is required.');
    if (!c.primaryMobileCountryCode) issues.push('Primary Mobile Country Code is required.');
  }

  // Status change reason when Inactive or Blocked
  if ((c.customerStatus === 'Inactive' || c.customerStatus === 'Blocked') && !c.statusChangeReason.trim()) {
    issues.push('Status Change Reason is required when status is Inactive or Blocked.');
  }

  // Source of Lead: if Other, specifyOtherSource is required
  if (c.sourceOfLead === 'Other' && !c.specifyOtherSource.trim()) {
    issues.push('Please specify the Other source of lead.');
  }

  // Personal Profile: DOB cannot be future date
  if (c.dateOfBirth) {
    const dob = new Date(c.dateOfBirth);
    if (dob > new Date()) issues.push('Date of Birth cannot be a future date.');
  }

  // Anniversary Date: only when Married, cannot be future
  if (c.maritalStatus === 'Married' && c.anniversaryDate) {
    const ann = new Date(c.anniversaryDate);
    if (ann > new Date()) issues.push('Anniversary Date cannot be a future date.');
  }

  // Address — at least one required for activation
  if (c.addresses.length === 0) issues.push('At least one address is required.');
  const hasDefaultAddr = c.addresses.some((a) => a.isDefault && a.status === 'Active');
  if (c.addresses.length > 0 && !hasDefaultAddr) {
    issues.push('At least one address must be set as default.');
  }

  // Business Identification
  if (['Corporate', 'Fleet', 'Government', 'Internal'].includes(c.customerType)) {
    if (c.dateOfIncorporation) {
      const doi = new Date(c.dateOfIncorporation);
      if (doi > new Date()) issues.push('Date of Incorporation cannot be a future date.');
    }
  }

  // Tax Exemption
  if (c.isTaxExempt) {
    if (!c.taxExemptionReason.trim()) issues.push('Tax Exemption Reason is required.');
    if (!c.taxExemptionEffectiveFrom) issues.push('Tax Exemption Effective From Date is required.');
    if (!c.taxExemptionEffectiveTo)   issues.push('Tax Exemption Effective To Date is required.');
    if (c.taxExemptionEffectiveFrom && c.taxExemptionEffectiveTo) {
      const from = new Date(c.taxExemptionEffectiveFrom);
      const to   = new Date(c.taxExemptionEffectiveTo);
      if (to < from) issues.push('Tax Exemption Effective To Date cannot be earlier than From Date.');
    }
    if (!c.taxExemptionAttachment) issues.push('Tax Exemption Proof attachment is required.');
  }

  // Consent: if any consent row exists, required fields must be filled
  c.consents.forEach((cs, idx) => {
    if (!cs.consentChannel)  issues.push(`Consent row ${idx + 1}: Channel is required.`);
    if (!cs.consentPurpose)  issues.push(`Consent row ${idx + 1}: Purpose is required.`);
    if (!cs.consentStatus)   issues.push(`Consent row ${idx + 1}: Status is required.`);
    if (!cs.consentSource)   issues.push(`Consent row ${idx + 1}: Source is required.`);
  });

  // KYC Documents: rejection reason required when Rejected
  c.kycDocuments.forEach((doc, idx) => {
    if (!doc.documentType) issues.push(`KYC Document ${idx + 1}: Document Type is required.`);
    if (doc.documentStatus === 'Rejected' && !doc.rejectionReason.trim()) {
      issues.push(`KYC Document ${idx + 1}: Rejection Reason is required.`);
    }
  });

  // Family Members: if row exists, required fields
  c.familyMembers.forEach((fm, idx) => {
    if (!fm.relationship) issues.push(`Family Member ${idx + 1}: Relationship is required.`);
    if (!fm.memberName.trim()) issues.push(`Family Member ${idx + 1}: Member Name is required.`);
    if (fm.relationship === 'Other' && !fm.specifyRelationship.trim()) {
      issues.push(`Family Member ${idx + 1}: Please specify the relationship.`);
    }
    if (fm.dateOfBirth) {
      const dob = new Date(fm.dateOfBirth);
      if (dob > new Date()) issues.push(`Family Member ${idx + 1}: Date of Birth cannot be a future date.`);
    }
  });

  return issues;
}

export function validateCustomerForSave(
  c: Partial<Customer>,
  allCustomers: Customer[],
  editingId?: string,
): { displayName?: string; primaryMobileNumber?: string } {
  const errors: { displayName?: string; primaryMobileNumber?: string } = {};

  if (!c.displayName?.trim()) {
    errors.displayName = 'Display Name is required.';
  } else {
    const duplicate = allCustomers.find(
      (x) => x.id !== editingId && x.displayName.trim().toLowerCase() === c.displayName!.trim().toLowerCase(),
    );
    if (duplicate) errors.displayName = 'A customer with this Display Name already exists.';
  }

  return errors;
}
