import {
  getWorkflows as getWorkflowsApi,
  saveWorkflow as saveWorkflowApi,
  deleteWorkflow as deleteWorkflowApi,
} from '../../../../../engine/api/configurationApi';
import type { WorkflowConfig } from '../../../../../engine/types/configuration';
import { SALE_ORDER_WORKFLOW_SEED } from '../../../../../engine/seed/workflowDefinitions';
import { workflowStorage } from '../../../../../engine/storage/engineConfigStorage';

export type { WorkflowConfig };

export interface EngineConfigResult<T> {
  data: T;
  isOffline: boolean;
}

/** Load: API → localStorage overrides on top of seed → seed fallback */
export async function loadWorkflows(entityName?: string): Promise<EngineConfigResult<WorkflowConfig[]>> {
  const result = await getWorkflowsApi(entityName);
  if (result.success) return { data: result.data, isOffline: false };

  const seed: WorkflowConfig[] = entityName
    ? SALE_ORDER_WORKFLOW_SEED.filter((w) => w.entityName === entityName)
    : [...SALE_ORDER_WORKFLOW_SEED];

  const local = workflowStorage.load<WorkflowConfig>();
  if (local.length > 0) {
    const merged = seed.map((s) => local.find((l) => l.workflowCode === s.workflowCode) ?? s);
    const newEntries = local.filter((l) => !seed.some((s) => s.workflowCode === l.workflowCode));
    return { data: [...merged, ...newEntries], isOffline: true };
  }

  return { data: seed, isOffline: true };
}

export async function persistWorkflow(workflow: WorkflowConfig): Promise<EngineConfigResult<WorkflowConfig>> {
  const result = await saveWorkflowApi(workflow);
  if (result.success) {
    workflowStorage.save<WorkflowConfig>(workflow);
    return { data: result.data, isOffline: false };
  }
  workflowStorage.save<WorkflowConfig>(workflow);
  return { data: workflow, isOffline: true };
}

export async function removeWorkflow(workflowCode: string): Promise<EngineConfigResult<boolean>> {
  const result = await deleteWorkflowApi(workflowCode);
  workflowStorage.remove<WorkflowConfig>(workflowCode);
  return { data: result.success, isOffline: !result.success };
}
