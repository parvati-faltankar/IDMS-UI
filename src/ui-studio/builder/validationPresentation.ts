import type { ValidationIssue } from '../types';

export type GroupedValidation = {
  blocking: ValidationIssue[];
  warning: ValidationIssue[];
  info: ValidationIssue[];
};

export function groupValidationIssues(issues: ValidationIssue[]): GroupedValidation {
  const grouped: GroupedValidation = { blocking: [], warning: [], info: [] };
  for (const issue of issues) {
    if (issue.blocking) {
      grouped.blocking.push(issue);
      continue;
    }
    if (issue.severity === 'warning') {
      grouped.warning.push(issue);
      continue;
    }
    grouped.info.push(issue);
  }
  return grouped;
}
