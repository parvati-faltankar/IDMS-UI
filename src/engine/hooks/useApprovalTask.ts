import { useState, useCallback } from 'react';
import type { ApprovalTask } from '../types/services';
import type { ServiceError } from '../types/services';
import { getApprovalTask, captureDecision } from '../api/approvalServiceApi';

export type ApprovalTaskState = {
  isLoading: boolean;
  task: ApprovalTask | null;
  taskError: ServiceError | null;
  decisionSubmitted: boolean;
};

/**
 * Generic approval task hook — entity-agnostic.
 * Used by approvers to load a task and capture Approve / Reject / Return decisions.
 */
export function useApprovalTask() {
  const [state, setState] = useState<ApprovalTaskState>({
    isLoading: false,
    task: null,
    taskError: null,
    decisionSubmitted: false,
  });

  const loadTask = useCallback(async (taskId: string): Promise<ApprovalTask | null> => {
    setState({ isLoading: true, task: null, taskError: null, decisionSubmitted: false });

    const result = await getApprovalTask(taskId);

    if (!result.success) {
      const error: ServiceError = result.errors[0] ?? {
        code: 'TASK_LOAD_FAILED',
        message: 'Failed to load approval task.',
      };
      setState({ isLoading: false, task: null, taskError: error, decisionSubmitted: false });
      return null;
    }

    setState({ isLoading: false, task: result.data, taskError: null, decisionSubmitted: false });
    return result.data;
  }, []);

  const submitDecision = useCallback(
    async (
      approvalCaseId: string,
      taskId: string,
      decision: 'Approve' | 'Reject' | 'Return',
      comment: string,
      decidedBy: string
    ): Promise<boolean> => {
      setState((prev) => ({ ...prev, isLoading: true, taskError: null }));

      const result = await captureDecision({ approvalCaseId, taskId, decision, comment, decidedBy });

      if (!result.success) {
        const error: ServiceError = result.errors[0] ?? {
          code: 'DECISION_FAILED',
          message: 'Failed to submit approval decision.',
        };
        setState((prev) => ({ ...prev, isLoading: false, taskError: error }));
        return false;
      }

      setState((prev) => ({ ...prev, isLoading: false, decisionSubmitted: true }));
      return true;
    },
    []
  );

  const approve = useCallback(
    (approvalCaseId: string, taskId: string, comment: string, decidedBy: string) =>
      submitDecision(approvalCaseId, taskId, 'Approve', comment, decidedBy),
    [submitDecision]
  );

  const reject = useCallback(
    (approvalCaseId: string, taskId: string, comment: string, decidedBy: string) =>
      submitDecision(approvalCaseId, taskId, 'Reject', comment, decidedBy),
    [submitDecision]
  );

  const returnForCorrection = useCallback(
    (approvalCaseId: string, taskId: string, comment: string, decidedBy: string) =>
      submitDecision(approvalCaseId, taskId, 'Return', comment, decidedBy),
    [submitDecision]
  );

  return { state, loadTask, approve, reject, returnForCorrection };
}
