import type { ServiceRequest, ServiceResponse, ApprovalServiceOutput, ApprovalTask } from '../types/services';
import { enginePost, engineGet } from './apiClient';

export type ApprovalCaseRequest = ServiceRequest & {
  approvalRequests: {
    approvalCategory: string;
    approvalReason: string;
    triggerRule: string;
    amount?: number;
    discountPercent?: number;
  }[];
};

export type ApprovalDecisionRequest = {
  approvalCaseId: string;
  taskId: string;
  decision: 'Approve' | 'Reject' | 'Return';
  comment?: string;
  decidedBy: string;
};

export async function createApprovalCase(
  request: ApprovalCaseRequest
): Promise<ServiceResponse<ApprovalServiceOutput>> {
  return enginePost<ApprovalServiceOutput>('/api/services/approval/create-case', request);
}

export async function getApprovalCase(
  approvalCaseId: string
): Promise<ServiceResponse<ApprovalServiceOutput>> {
  return engineGet<ApprovalServiceOutput>(`/api/services/approval/case/${approvalCaseId}`);
}

export async function getApprovalTask(
  taskId: string
): Promise<ServiceResponse<ApprovalTask>> {
  return engineGet<ApprovalTask>(`/api/services/approval/task/${taskId}`);
}

export async function captureDecision(
  request: ApprovalDecisionRequest
): Promise<ServiceResponse<ApprovalServiceOutput>> {
  return enginePost<ApprovalServiceOutput>('/api/services/approval/decision', request);
}

export async function escalateApproval(
  approvalCaseId: string,
  taskId: string
): Promise<ServiceResponse<ApprovalServiceOutput>> {
  return enginePost<ApprovalServiceOutput>('/api/services/approval/escalate', {
    approvalCaseId,
    taskId,
  });
}
