// Workflow Engine type contracts — derived from blueprint Section 8
// Entity-agnostic: orchestrates any entity's process flow

export type WorkflowStepType =
  | 'RuleTask'
  | 'ServiceTask'
  | 'Decision'
  | 'UserTask'
  | 'NotificationTask'
  | 'IntegrationTask'
  | 'Start'
  | 'End';

export type WorkflowStepFailureBehavior =
  | 'Stop'
  | 'ValidationFailed'
  | 'PendingApproval'
  | 'Retry'
  | 'NonBlocking';

export type WorkflowStepStatus =
  | 'Pending'
  | 'Running'
  | 'Completed'
  | 'Failed'
  | 'Skipped'
  | 'WaitingForUser';

export type WorkflowStatus =
  | 'NotStarted'
  | 'Running'
  | 'Paused'
  | 'PendingApproval'
  | 'Completed'
  | 'Failed'
  | 'Cancelled';

export type WorkflowStep = {
  seq: number;
  stepCode: string;
  stepType: WorkflowStepType;
  /** Service or rule set this step calls */
  calls: string;
  failureBehavior: WorkflowStepFailureBehavior;
  description?: string;
};

export type WorkflowTransition = {
  fromStep: string;
  toStep: string;
  condition?: string;
};

export type WorkflowDefinition = {
  workflowCode: string;
  workflowName: string;
  entityName: string;
  version: number;
  description: string;
  steps: WorkflowStep[];
  transitions: WorkflowTransition[];
};

export type WorkflowStepExecution = {
  stepCode: string;
  stepType: WorkflowStepType;
  status: WorkflowStepStatus;
  startedAt?: string;
  completedAt?: string;
  serviceReference?: string;
  errors?: string[];
  durationMs?: number;
};

export type WorkflowInstance = {
  workflowInstanceId: string;
  workflowCode: string;
  entityName: string;
  entityId: string;
  status: WorkflowStatus;
  currentStepCode?: string;
  startedAt: string;
  completedAt?: string;
  stepExecutions: WorkflowStepExecution[];
  approvalCaseId?: string;
  correlationId: string;
};

export type WorkflowStartRequest = {
  workflowCode: string;
  entityName: string;
  entityId?: string;
  viewCode: string;
  action: string;
  tenantId: string;
  header: Record<string, unknown>;
  lines: Record<string, unknown>[];
  context: Record<string, unknown>;
  correlationId: string;
  idempotencyKey: string;
};

export type WorkflowResumeRequest = {
  workflowInstanceId: string;
  decision: 'Approved' | 'Rejected' | 'ReturnedForCorrection' | 'Continue';
  comment?: string;
  decidedBy?: string;
};

export type WorkflowStartResponse = {
  success: boolean;
  workflowInstanceId: string;
  status: WorkflowStatus;
  entityId?: string;
  errors?: string[];
};
