// ─── Service Type Master — Validation ─────────────────────────────────────────

import type { ServiceTypeRecord } from '../types/serviceTypeMaster.types';

export type STFieldErrors = Partial<Record<string, string>>;

// ─── General Step ─────────────────────────────────────────────────────────────

export function validateGeneralStep(record: ServiceTypeRecord): STFieldErrors {
  const errs: STFieldErrors = {};

  // Basic Information
  if (!record.code.trim()) errs.code = 'Code is required';
  if (!record.name.trim()) errs.name = 'Name is required';
  if (record.name.length > 200) errs.name = 'Name cannot exceed 200 characters';
  if (!record.postingType) errs.postingType = 'Posting Type is required';
  if (record.description.length > 500) errs.description = 'Description cannot exceed 500 characters';

  // Is Header / Is Line — at least one required
  if (!record.isHeader && !record.isLine) {
    errs.isHeaderIsLine = 'At least one of Is Header or Is Line must be selected';
  }

  // Billing Ratio validation (only when isRatioApplicable)
  if (record.isRatioApplicable) {
    if (!record.billingRatioType) errs.billingRatioType = 'Billing Ratio Type is required when ratio is applicable';
    if (record.billingRatioRows.length === 0) errs.billingRatioRows = 'At least one billing ratio row is required';
    else {
      const orders = record.billingRatioRows.map((r) => r.order).filter(Boolean);
      const uniqueOrders = new Set(orders);
      if (uniqueOrders.size !== orders.length) errs.billingRatioOrderDuplicate = 'Duplicate Order values are not allowed in Billing Ratio';

      record.billingRatioRows.forEach((r, i) => {
        if (!r.serviceTypeRef) errs[`br_${i}_service`] = 'Service Type is required';
        if (!r.accountPostingType) errs[`br_${i}_posting`] = 'Account Posting Type is required';
        if (!r.order) errs[`br_${i}_order`] = 'Order is required';
        if (!r.allocationType) errs[`br_${i}_allocation`] = 'Allocation Type is required';
        if (!r.value) errs[`br_${i}_value`] = 'Value is required';
        if (r.minAllowedValue && r.maxAllowedValue && parseFloat(r.minAllowedValue) > parseFloat(r.maxAllowedValue)) {
          errs[`br_${i}_maxVal`] = 'Max Allowed Value must be ≥ Min Allowed Value';
        }
        if (record.billingRatioType === 'Percentage' && r.value && parseFloat(r.value) > 100) {
          errs[`br_${i}_pct`] = 'Percentage value cannot exceed 100';
        }
      });
    }
  }

  // Avail Limit validation
  if (!record.availMultipleTimes && record.availLimit) {
    const n = parseInt(record.availLimit, 10);
    if (isNaN(n) || n <= 0) errs.availLimit = 'Avail Limit must be a positive integer';
  }

  // Meter Reading conditional
  if (record.meterReadingRequired && !record.meterReadingType) {
    errs.meterReadingType = 'Meter Reading Type is required when Meter Reading is enabled';
  }
  if (record.meterReadingType && !record.meterReading) {
    errs.meterReading = 'Meter Reading value is required when Meter Reading Type is selected';
  }

  // Duration conditional
  if (record.durationValue && !record.durationType) {
    errs.durationType = 'Duration Type is required when Duration Value is entered';
  }
  if (record.durationType && !record.durationValue) {
    errs.durationValue = 'Duration Value is required when Duration Type is selected';
  }

  // Operator — required when both meter and duration are set
  if (record.meterReadingType && record.meterReading && record.durationType && record.durationValue && !record.operator) {
    errs.operator = 'Operator is required when both meter and duration restrictions are configured';
  }

  // Safety Checklist required when Safety Permit Required
  if (record.safetyPermitRequired && !record.safetyChecklistTemplate) {
    errs.safetyChecklistTemplate = 'Safety Checklist Template is required when Safety Permit Required is checked';
  }

  // Follow-up Interval required when Follow-up Required
  if (record.followUpRequired && !record.followUpInterval) {
    errs.followUpInterval = 'Follow-up Interval is required when Follow-up Required is checked';
  }

  // Service Time Window
  if (record.serviceTimeWindowRequired) {
    if (!record.defaultServiceWindowFrom) errs.defaultServiceWindowFrom = 'Service Window From is required';
    if (!record.defaultServiceWindowTo) errs.defaultServiceWindowTo = 'Service Window To is required';
  }

  return errs;
}

// ─── Contract Relation Step ───────────────────────────────────────────────────

export function validateContractRelationStep(record: ServiceTypeRecord): STFieldErrors {
  const errs: STFieldErrors = {};

  record.labourRows.forEach((r, i) => {
    if (!r.service) errs[`labour_${i}_service`] = 'Service is required';
    if (r.minUsage && r.maxUsage && parseFloat(r.minUsage) > parseFloat(r.maxUsage)) {
      errs[`labour_${i}_usage`] = 'Max Usage must be ≥ Min Usage';
    }
  });

  record.partRows.forEach((r, i) => {
    if (!r.part) errs[`part_${i}_part`] = 'Part is required';
    if (r.minUsage && r.maxUsage && parseFloat(r.minUsage) > parseFloat(r.maxUsage)) {
      errs[`part_${i}_usage`] = 'Max Usage must be ≥ Min Usage';
    }
  });

  return errs;
}

// ─── Attribute Tagging Step ───────────────────────────────────────────────────

export function validateAttributeTaggingStep(record: ServiceTypeRecord): STFieldErrors {
  const errs: STFieldErrors = {};

  record.attributeTagRows.forEach((r, i) => {
    if (!r.selectAttribute) errs[`attr_${i}_attribute`] = 'Attribute is required';
  });

  return errs;
}

// ─── All steps combined ───────────────────────────────────────────────────────

export function validateForSave(record: ServiceTypeRecord): STFieldErrors {
  return {
    ...validateGeneralStep(record),
    ...validateContractRelationStep(record),
    ...validateAttributeTaggingStep(record),
  };
}

export function validateForActivation(record: ServiceTypeRecord): string[] {
  const issues: string[] = [];
  const errs = validateForSave(record);
  const topLevelErrors = ['code', 'name', 'postingType', 'isHeaderIsLine'];
  topLevelErrors.forEach((k) => { if (errs[k]) issues.push(errs[k] as string); });
  if (!record.active) issues.push('The "Active" checkbox must be checked to activate this service type');
  return issues;
}
// ─── Per-wizard-step validation (“Next” button) ─────────────────────────────────────────────────

export function validateStep(step: number, record: ServiceTypeRecord): STFieldErrors {
  const errs: STFieldErrors = {};

  if (step === 0) {
    if (!record.name.trim()) errs.name = 'Service Type Name is required';
    if (!record.postingType) errs.postingType = 'Posting Type is required';
  }

  if (step === 1) {
    if (!record.isHeader && !record.isLine) {
      errs.isHeaderIsLine = 'Select at least one of Header or Line';
    }
    if (record.isRatioApplicable) {
      if (!record.billingRatioType) errs.billingRatioType = 'Billing Ratio Type is required';
      if (record.billingRatioRows.length === 0) errs.billingRatioRows = 'Add at least one billing ratio row';
    }
  }

  if (step === 2) {
    if (record.meterReadingRequired && !record.meterReadingType) {
      errs.meterReadingType = 'Meter Reading Type is required';
    }
    if (record.meterReadingType && !record.meterReading) {
      errs.meterReading = 'Meter Reading value is required';
    }
    if (record.durationType && !record.durationValue) {
      errs.durationValue = 'Duration Value is required';
    }
    if (record.durationValue && !record.durationType) {
      errs.durationType = 'Duration Type is required';
    }
    if (record.serviceTimeWindowRequired) {
      if (!record.defaultServiceWindowFrom) errs.defaultServiceWindowFrom = 'Window From is required';
      if (!record.defaultServiceWindowTo) errs.defaultServiceWindowTo = 'Window To is required';
    }
  }

  if (step === 4) {
    if (record.safetyPermitRequired && !record.safetyChecklistTemplate) {
      errs.safetyChecklistTemplate = 'Safety Checklist Template is required';
    }
  }

  return errs;
}
