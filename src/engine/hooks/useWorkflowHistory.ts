import { useState, useCallback } from 'react';
import type { WorkflowInstance } from '../types/workflowEngine';
import type { ServiceError } from '../types/services';
import { getWorkflowInstance } from '../api/workflowEngineApi';

export type WorkflowHistoryState = {
  isLoading: boolean;
  instance: WorkflowInstance | null;
  historyError: ServiceError | null;
};

/**
 * Generic hook for loading workflow execution history for any entity instance.
 * Used by WorkflowHistoryDrawer to display step-by-step execution log.
 */
export function useWorkflowHistory() {
  const [state, setState] = useState<WorkflowHistoryState>({
    isLoading: false,
    instance: null,
    historyError: null,
  });

  const loadHistory = useCallback(async (workflowInstanceId: string): Promise<WorkflowInstance | null> => {
    if (!workflowInstanceId) return null;

    setState({ isLoading: true, instance: null, historyError: null });

    const result = await getWorkflowInstance(workflowInstanceId);

    if (!result.success) {
      const error: ServiceError = result.errors[0] ?? {
        code: 'HISTORY_LOAD_FAILED',
        message: 'Failed to load workflow history.',
      };
      setState({ isLoading: false, instance: null, historyError: error });
      return null;
    }

    setState({ isLoading: false, instance: result.data, historyError: null });
    return result.data;
  }, []);

  const clearHistory = useCallback(() => {
    setState({ isLoading: false, instance: null, historyError: null });
  }, []);

  return { state, loadHistory, clearHistory };
}
