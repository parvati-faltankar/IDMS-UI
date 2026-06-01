import {
  getWorkflows as getWorkflowsApi,
  saveWorkflow as saveWorkflowApi,
  deleteWorkflow as deleteWorkflowApi,
} from '../../../../../engine/api/configurationApi';
import type { WorkflowConfig } from '../../../../../engine/types/configuration';
import { SALE_ORDER_WORKFLOW_SEED } from '../../../../../engine/seed/workflowDefinitions';

export type { WorkflowConfig };

export interface EngineConfigResult<T> {
  data: T;
  isOffline: boolean;
}

export async function loadWorkflows(entityName?: string): Promise<EngineConfigResult<WorkflowConfig[]>> {
  const result = await getWorkflowsApi(entityName);
  if (result.success) return { data: result.data, isOffline: false };
  const seed = entityName
    ? SALE_ORDER_WORKFLOW_SEED.filter((w) => w.entityName === entityName)
    : SALE_ORDER_WORKFLOW_SEED;
  return { data: seed, isOffline: true };
}

export async function persistWorkflow(workflow: WorkflowConfig): Promise<EngineConfigResult<WorkflowConfig>> {
  const result = await saveWorkflowApi(workflow);
  if (result.success) return { data: result.data, isOffline: false };
  return { data: workflow, isOffline: true };
}

export async function removeWorkflow(workflowCode: string): Promise<EngineConfigResult<boolean>> {
  const result = await deleteWorkflowApi(workflowCode);
  return { data: result.success, isOffline: !result.success };
}
