import type { WorkflowStatus, WorkflowStepExecution } from '../types/workflowEngine';

type WorkflowStatusBarProps = {
  status: WorkflowStatus;
  currentStepCode?: string;
  stepExecutions?: WorkflowStepExecution[];
};

const STATUS_COLORS: Record<WorkflowStatus, string> = {
  NotStarted: '#64748b',
  Running: '#3b82f6',
  Paused: '#f59e0b',
  PendingApproval: '#f59e0b',
  Completed: '#22c55e',
  Failed: '#ef4444',
  Cancelled: '#6b7280',
};

const STATUS_LABELS: Record<WorkflowStatus, string> = {
  NotStarted: 'Not Started',
  Running: 'Running',
  Paused: 'Paused',
  PendingApproval: 'Pending Approval',
  Completed: 'Completed',
  Failed: 'Failed',
  Cancelled: 'Cancelled',
};

export function WorkflowStatusBar({ status, currentStepCode, stepExecutions = [] }: WorkflowStatusBarProps) {
  const color = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];
  const completedCount = stepExecutions.filter((s) => s.status === 'Completed').length;
  const totalCount = stepExecutions.length;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 14px',
        borderRadius: 6,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        fontSize: 13,
      }}
    >
      <span
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
        }}
      />
      <span style={{ fontWeight: 600, color }}>Workflow: {label}</span>
      {currentStepCode && (
        <span style={{ color: '#64748b' }}>
          &nbsp;·&nbsp;Step: <code style={{ fontSize: 12 }}>{currentStepCode}</code>
        </span>
      )}
      {totalCount > 0 && (
        <span style={{ color: '#94a3b8', marginLeft: 'auto', fontSize: 12 }}>
          {completedCount}/{totalCount} steps
        </span>
      )}
    </div>
  );
}
