// Configuration CRUD API — used by Config Admin UI (Phase 3)
import type { RuleSetConfig, WorkflowConfig, ServiceConfig, ApprovalCategoryConfig } from '../types/configuration';
import type { ApprovalMatrixEntry } from '../types/approvalMatrix';
import type { ServiceResponse } from '../types/services';
import { engineGet, enginePost, enginePut, engineDelete } from './apiClient';

// ─── Rule Sets ───────────────────────────────────────────────────────────────

export async function getRuleSets(entityName?: string): Promise<ServiceResponse<RuleSetConfig[]>> {
  const query = entityName ? `?entityName=${encodeURIComponent(entityName)}` : '';
  return engineGet<RuleSetConfig[]>(`/api/config/rule-sets${query}`);
}

export async function saveRuleSet(ruleSet: RuleSetConfig): Promise<ServiceResponse<RuleSetConfig>> {
  return ruleSet.ruleSetCode
    ? enginePut<RuleSetConfig>(`/api/config/rule-sets/${ruleSet.ruleSetCode}`, ruleSet)
    : enginePost<RuleSetConfig>('/api/config/rule-sets', ruleSet);
}

export async function deleteRuleSet(ruleSetCode: string): Promise<ServiceResponse<Record<string, never>>> {
  return engineDelete<Record<string, never>>(`/api/config/rule-sets/${ruleSetCode}`);
}

// ─── Workflow Definitions ────────────────────────────────────────────────────

export async function getWorkflows(entityName?: string): Promise<ServiceResponse<WorkflowConfig[]>> {
  const query = entityName ? `?entityName=${encodeURIComponent(entityName)}` : '';
  return engineGet<WorkflowConfig[]>(`/api/config/workflows${query}`);
}

export async function saveWorkflow(workflow: WorkflowConfig): Promise<ServiceResponse<WorkflowConfig>> {
  return workflow.workflowCode
    ? enginePut<WorkflowConfig>(`/api/config/workflows/${workflow.workflowCode}`, workflow)
    : enginePost<WorkflowConfig>('/api/config/workflows', workflow);
}

export async function deleteWorkflow(workflowCode: string): Promise<ServiceResponse<Record<string, never>>> {
  return engineDelete<Record<string, never>>(`/api/config/workflows/${workflowCode}`);
}

// ─── Service Registry ────────────────────────────────────────────────────────

export async function getServices(): Promise<ServiceResponse<ServiceConfig[]>> {
  return engineGet<ServiceConfig[]>('/api/config/services');
}

export async function saveService(service: ServiceConfig): Promise<ServiceResponse<ServiceConfig>> {
  return service.serviceCode
    ? enginePut<ServiceConfig>(`/api/config/services/${service.serviceCode}`, service)
    : enginePost<ServiceConfig>('/api/config/services', service);
}

// ─── Approval Matrix ─────────────────────────────────────────────────────────

export async function getApprovalMatrix(entityName?: string): Promise<ServiceResponse<ApprovalMatrixEntry[]>> {
  const query = entityName ? `?entityName=${encodeURIComponent(entityName)}` : '';
  return engineGet<ApprovalMatrixEntry[]>(`/api/config/approval-matrix${query}`);
}

export async function saveApprovalMatrixEntry(
  entry: ApprovalMatrixEntry
): Promise<ServiceResponse<ApprovalMatrixEntry>> {
  return entry.entryId
    ? enginePut<ApprovalMatrixEntry>(`/api/config/approval-matrix/${entry.entryId}`, entry)
    : enginePost<ApprovalMatrixEntry>('/api/config/approval-matrix', entry);
}

export async function deleteApprovalMatrixEntry(
  entryId: string
): Promise<ServiceResponse<Record<string, never>>> {
  return engineDelete<Record<string, never>>(`/api/config/approval-matrix/${entryId}`);
}

// ─── Approval Categories ─────────────────────────────────────────────────────

export async function getApprovalCategories(): Promise<ServiceResponse<ApprovalCategoryConfig[]>> {
  return engineGet<ApprovalCategoryConfig[]>('/api/config/approval-categories');
}
