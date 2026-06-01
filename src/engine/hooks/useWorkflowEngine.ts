import { useState, useCallback } from 'react';
import type { WorkflowInstance, WorkflowStartRequest, WorkflowResumeRequest } from '../types/workflowEngine';
import type { ServiceError } from '../types/services';
import {
  startWorkflow as startWorkflowApi,
  resumeWorkflow as resumeWorkflowApi,
  getWorkflowInstance as getWorkflowInstanceApi,
} from '../api/workflowEngineApi';

export type WorkflowEngineState = {
  isLoading: boolean;
  workflowInstance: WorkflowInstance | null;
  /** API-level or workflow-level error message */
  workflowError: ServiceError | null;
};

/**
 * Generic workflow engine hook — entity-agnostic.
 * Use entity-specific wrapper hooks (e.g. useSaleOrderWorkflow) for higher-level operations.
 */
export function useWorkflowEngine() {
  const [state, setState] = useState<WorkflowEngineState>({
    isLoading: false,
    workflowInstance: null,
    workflowError: null,
  });

  const startWorkflow = useCallback(async (request: WorkflowStartRequest): Promise<WorkflowInstance | null> => {
    setState((prev) => ({ ...prev, isLoading: true, workflowError: null }));

    const result = await startWorkflowApi(request);

    if (!result.success) {
      const error: ServiceError = result.errors[0] ?? {
        code: 'WORKFLOW_START_FAILED',
        message: 'Failed to start workflow.',
      };
      setState({ isLoading: false, workflowInstance: null, workflowError: error });
      return null;
    }

    // Fetch full instance after start
    const instanceResult = await getWorkflowInstanceApi(result.data.workflowInstanceId);
    const instance = instanceResult.success ? instanceResult.data : null;

    setState({ isLoading: false, workflowInstance: instance, workflowError: null });
    return instance;
  }, []);

  const resumeWorkflow = useCallback(async (request: WorkflowResumeRequest): Promise<WorkflowInstance | null> => {
    setState((prev) => ({ ...prev, isLoading: true, workflowError: null }));

    const result = await resumeWorkflowApi(request);

    if (!result.success) {
      const error: ServiceError = result.errors[0] ?? {
        code: 'WORKFLOW_RESUME_FAILED',
        message: 'Failed to resume workflow.',
      };
      setState((prev) => ({ ...prev, isLoading: false, workflowError: error }));
      return null;
    }

    setState({ isLoading: false, workflowInstance: result.data, workflowError: null });
    return result.data;
  }, []);

  const loadWorkflowInstance = useCallback(async (workflowInstanceId: string): Promise<WorkflowInstance | null> => {
    setState((prev) => ({ ...prev, isLoading: true, workflowError: null }));

    const result = await getWorkflowInstanceApi(workflowInstanceId);

    if (!result.success) {
      const error: ServiceError = result.errors[0] ?? {
        code: 'WORKFLOW_LOAD_FAILED',
        message: 'Failed to load workflow instance.',
      };
      setState((prev) => ({ ...prev, isLoading: false, workflowError: error }));
      return null;
    }

    setState({ isLoading: false, workflowInstance: result.data, workflowError: null });
    return result.data;
  }, []);

  return { state, startWorkflow, resumeWorkflow, loadWorkflowInstance };
}
