import { useState } from 'react';
import type { ApprovalTask } from '../types/services';
import type { ApprovalRequest } from '../types/ruleEngine';

type ApprovalActionPanelProps = {
  approvalCaseId: string;
  approvalRequests: ApprovalRequest[];
  tasks: ApprovalTask[];
  currentUserId: string;
  isLoading: boolean;
  onApprove: (comment: string) => void;
  onReject: (comment: string) => void;
  onReturn: (comment: string) => void;
};

export function ApprovalActionPanel({
  approvalCaseId,
  approvalRequests,
  tasks,
  currentUserId: _currentUserId,
  isLoading,
  onApprove,
  onReject,
  onReturn,
}: ApprovalActionPanelProps) {
  const [comment, setComment] = useState('');

  const pendingTask = tasks.find((t) => t.status === 'Pending');

  return (
    <div
      style={{
        border: '1px solid #fde68a',
        borderRadius: 10,
        background: '#fffbeb',
        padding: 16,
        marginBottom: 16,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 14, color: '#92400e', marginBottom: 8 }}>
        ⏳ Pending Approval
      </div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
        Case ID: <code>{approvalCaseId}</code>
      </div>

      {approvalRequests.map((req) => (
        <div
          key={req.triggerRule}
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            padding: '8px 12px',
            marginBottom: 8,
            fontSize: 13,
          }}
        >
          <div style={{ fontWeight: 600, color: '#334155' }}>{req.approvalCategory}</div>
          <div style={{ color: '#64748b' }}>{req.approvalReason}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
            Triggered by: <code>{req.triggerRule}</code>
          </div>
        </div>
      ))}

      {pendingTask && (
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>
          Assigned to: <strong>{pendingTask.assignedTo ?? 'Unassigned'}</strong> (Level {pendingTask.level} — {pendingTask.role})
        </div>
      )}

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a comment (optional)..."
        rows={2}
        style={{
          width: '100%',
          padding: '8px 10px',
          borderRadius: 6,
          border: '1px solid #e2e8f0',
          fontSize: 13,
          resize: 'vertical',
          marginBottom: 10,
          boxSizing: 'border-box',
        }}
      />

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => onApprove(comment)}
          style={{
            padding: '7px 18px',
            borderRadius: 6,
            border: 'none',
            background: '#22c55e',
            color: '#fff',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Approve
        </button>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => onReject(comment)}
          style={{
            padding: '7px 18px',
            borderRadius: 6,
            border: 'none',
            background: '#ef4444',
            color: '#fff',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Reject
        </button>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => onReturn(comment)}
          style={{
            padding: '7px 18px',
            borderRadius: 6,
            border: '1px solid #e2e8f0',
            background: '#fff',
            color: '#334155',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Return for Correction
        </button>
      </div>
    </div>
  );
}
