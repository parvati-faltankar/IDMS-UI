import type { WorkflowStepExecution, WorkflowInstance } from '../types/workflowEngine';

type WorkflowHistoryDrawerProps = {
  instance: WorkflowInstance | null;
  isLoading: boolean;
};

const STEP_STATUS_COLOR: Record<string, string> = {
  Completed: '#22c55e',
  Failed: '#ef4444',
  Running: '#3b82f6',
  Pending: '#94a3b8',
  Skipped: '#d1d5db',
  WaitingForUser: '#f59e0b',
};

function StepRow({ step }: { step: WorkflowStepExecution }) {
  const color = STEP_STATUS_COLOR[step.status] ?? '#94a3b8';
  return (
    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
      <td style={{ padding: '6px 8px', fontSize: 12, fontFamily: 'monospace', color: '#334155' }}>
        {step.stepCode}
      </td>
      <td style={{ padding: '6px 8px', fontSize: 12, color: '#64748b' }}>{step.stepType}</td>
      <td style={{ padding: '6px 8px' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color }}>{step.status}</span>
      </td>
      <td style={{ padding: '6px 8px', fontSize: 11, color: '#94a3b8' }}>
        {step.startedAt ? new Date(step.startedAt).toLocaleTimeString() : '—'}
      </td>
      <td style={{ padding: '6px 8px', fontSize: 11, color: '#94a3b8' }}>
        {step.durationMs != null ? `${step.durationMs}ms` : '—'}
      </td>
      <td style={{ padding: '6px 8px', fontSize: 11, color: '#64748b' }}>
        {step.serviceReference ?? '—'}
      </td>
    </tr>
  );
}

export function WorkflowHistoryDrawer({ instance, isLoading }: WorkflowHistoryDrawerProps) {
  if (isLoading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
        Loading workflow history...
      </div>
    );
  }

  if (!instance) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
        No workflow instance found for this order.
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 12, display: 'flex', gap: 16, fontSize: 12, color: '#64748b' }}>
        <span>Instance: <code>{instance.workflowInstanceId}</code></span>
        <span>Workflow: <code>{instance.workflowCode}</code></span>
        <span>Status: <strong>{instance.status}</strong></span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Step Code', 'Type', 'Status', 'Started', 'Duration', 'Service Ref'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '6px 8px',
                    textAlign: 'left',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#475569',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {instance.stepExecutions.map((step) => (
              <StepRow key={step.stepCode} step={step} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
