import type { WorkflowStartRequest, WorkflowStartResponse, WorkflowInstance, WorkflowResumeRequest } from '../types/workflowEngine';
import type { ServiceResponse } from '../types/services';
import { enginePost, engineGet } from './apiClient';

export async function startWorkflow(
  request: WorkflowStartRequest
): Promise<ServiceResponse<WorkflowStartResponse>> {
  return enginePost<WorkflowStartResponse>('/api/engine/workflow/start', request);
}

export async function getWorkflowInstance(
  workflowInstanceId: string
): Promise<ServiceResponse<WorkflowInstance>> {
  return engineGet<WorkflowInstance>(`/api/engine/workflow/instance/${workflowInstanceId}`);
}

export async function resumeWorkflow(
  request: WorkflowResumeRequest
): Promise<ServiceResponse<WorkflowInstance>> {
  return enginePost<WorkflowInstance>('/api/engine/workflow/resume', request);
}
