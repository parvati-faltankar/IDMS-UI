// ─── Warehouse Master — Hierarchy Template Validation ───────────────────────

import type { CreateHierarchyTemplateInput } from '../types/warehouse.dto';
import type { HierarchyTemplate, ValidationIssue } from '../types/warehouse.types';
import type { HierarchyTemplateStatus } from '../types/warehouse.enums';
import { validateTemplateLevelTree } from '../utils/hierarchyUtils';

// ─── Field-level validation ───────────────────────────────────────────────────

export interface HierarchyTemplateFieldErrors {
  templateCode?: string;
  templateName?: string;
  versionNumber?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  levels?: string;
}

const TEMPLATE_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{1,19}$/;

function toIsoDay(value: string | undefined): string {
  return (value ?? '').slice(0, 10);
}

function hasStructuralHierarchyChange(
  current: HierarchyTemplate,
  proposed: CreateHierarchyTemplateInput,
): boolean {
  if (current.levels.length !== proposed.levels.length) return true;
  const currentSignature = current.levels
    .map((level) => `${level.sequence}|${level.levelCode}|${(level.allowedParentLevels ?? []).join(',')}`)
    .sort()
    .join('||');
  const nextSignature = proposed.levels
    .map((level) => `${level.sequence}|${level.levelCode}|${(level.allowedParentLevels ?? []).join(',')}`)
    .sort()
    .join('||');
  return currentSignature !== nextSignature;
}

export function validateHierarchyTemplateForSave(
  input: CreateHierarchyTemplateInput,
  existingTemplates: HierarchyTemplate[],
  editingId?: string,
): HierarchyTemplateFieldErrors {
  const errors: HierarchyTemplateFieldErrors = {};

  if (!input.templateCode?.trim()) {
    errors.templateCode = 'Template Code is required.';
  } else if (!TEMPLATE_CODE_PATTERN.test(input.templateCode.trim())) {
    errors.templateCode =
      'Template Code must be 2–20 uppercase letters, digits, hyphens, or underscores.';
  } else if (input.versionNumber !== undefined) {
    const duplicateVersion = existingTemplates.find(
      (t) =>
        t.templateCode.trim().toUpperCase() === input.templateCode.trim().toUpperCase() &&
        t.currentVersion.versionNumber === input.versionNumber &&
        t.warehouseId === input.warehouseId &&
        t.id !== editingId,
    );
    if (duplicateVersion) {
      errors.versionNumber = 'This template version already exists for this warehouse.';
    }
  }

  if (!input.templateName?.trim()) {
    errors.templateName = 'Template Name is required.';
  }

  if (input.versionNumber !== undefined && input.versionNumber < 1) {
    errors.versionNumber = 'Version must be 1 or greater.';
  }

  if (!input.effectiveFrom) {
    errors.effectiveFrom = 'Effective From date is required.';
  }

  if (input.effectiveTo && input.effectiveFrom && input.effectiveTo < input.effectiveFrom) {
    errors.effectiveTo = 'Effective To must be on or after Effective From.';
  }

  if (!input.levels || input.levels.length === 0) {
    errors.levels = 'At least one hierarchy level is required.';
  } else {
    const levelIssues = validateTemplateLevelTree(input.levels);
    const errors_from_levels = levelIssues.filter((i) => i.severity === 'error');
    if (errors_from_levels.length > 0) {
      errors.levels = errors_from_levels[0].message;
    }
  }

  if (editingId) {
    const existing = existingTemplates.find((template) => template.id === editingId);
    if (
      existing &&
      existing.status === 'Active' &&
      existing.codeLockedAfterActivation &&
      (existing.dependencyMarker?.hasNodes || existing.dependencyMarker?.hasStock || existing.dependencyMarker?.hasTransactions) &&
      hasStructuralHierarchyChange(existing, input)
    ) {
      errors.levels = 'Active templates with dependencies are structurally locked and cannot be edited.';
    }
  }

  return errors;
}

// ─── Activation validation ────────────────────────────────────────────────────

export function validateHierarchyTemplateForActivation(
  template: HierarchyTemplate,
  existingTemplates: HierarchyTemplate[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (template.status !== 'Draft') {
    issues.push({
      severity: 'error',
      category: 'LifecycleConstraint',
      message: `Only Draft templates can be activated. Current status: ${template.status}.`,
    });
  }

  if (!template.templateCode?.trim()) {
    issues.push({ field: 'templateCode', severity: 'error', category: 'FieldRequired', message: 'Template Code is required.' });
  }

  if (!template.templateName?.trim()) {
    issues.push({ field: 'templateName', severity: 'error', category: 'FieldRequired', message: 'Template Name is required.' });
  }

  if (template.effectiveTo && toIsoDay(template.effectiveTo) < toIsoDay(new Date().toISOString())) {
    issues.push({
      field: 'effectiveTo',
      severity: 'error',
      category: 'LifecycleConstraint',
      message: 'Expired templates cannot be activated. Update Effective To or keep the template in Draft.',
    });
  }

  if (!template.levels || template.levels.length === 0) {
    issues.push({
      section: 'hierarchyTemplate',
      severity: 'error',
      category: 'FieldRequired',
      message: 'Template must have at least one level.',
    });
  } else {
    const levelIssues = validateTemplateLevelTree(template.levels);
    issues.push(...levelIssues.filter((i) => i.severity === 'error'));
  }

  // Warn if there is already an active template — it will be superseded
  const activeTemplate = existingTemplates.find(
    (t) => t.warehouseId === template.warehouseId && t.status === 'Active' && t.id !== template.id,
  );
  if (activeTemplate) {
    issues.push({
      section: 'hierarchyTemplate',
      severity: 'warning',
      category: 'SystemConstraint',
      message: `Active template "${activeTemplate.templateCode}" will be superseded when this template is activated.`,
    });
  }

  return issues;
}

export function validateHierarchyTemplateLifecycleAction(
  currentStatus: HierarchyTemplateStatus,
  targetStatus: HierarchyTemplateStatus,
  hasDependency: boolean,
): string | undefined {
  if (currentStatus === targetStatus) {
    return `Template is already in ${targetStatus} status.`;
  }

  if (targetStatus === 'Draft') {
    return 'Templates cannot transition back to Draft once created.';
  }

  if (targetStatus === 'Inactive' && currentStatus === 'Active' && hasDependency) {
    return 'Cannot set Active template to Inactive while dependent hierarchy nodes exist.';
  }

  if (targetStatus === 'Blocked' && currentStatus === 'Superseded') {
    return 'Superseded templates cannot be blocked.';
  }

  return undefined;
}

export function hasHierarchyTemplateFieldErrors(errors: HierarchyTemplateFieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}
