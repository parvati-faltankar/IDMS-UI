import { useState } from 'react';

type AmendDialogProps = {
  isOpen: boolean;
  isLoading: boolean;
  hasProcessedScope: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  errors?: string[];
};

export function AmendDialog({ isOpen, isLoading, hasProcessedScope, onConfirm, onCancel, errors = [] }: AmendDialogProps) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Amend Sale Order</h3>

        {hasProcessedScope && (
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 6, padding: '8px 12px', marginBottom: 12, fontSize: 13, color: '#92400e' }}>
            ⚠ This order has downstream processing. Amendment may require approval and will create a new revision.
          </div>
        )}

        {errors.length > 0 && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '8px 12px', marginBottom: 12 }}>
            {errors.map((e, i) => <div key={i} style={{ fontSize: 13, color: '#b91c1c' }}>{e}</div>)}
          </div>
        )}

        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Amendment Reason *</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Describe what is being amended and why..."
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 16 }}
        />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button type="button" disabled={isLoading || !reason} onClick={() => onConfirm(reason)}
            style={{ padding: '7px 16px', borderRadius: 6, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            {isLoading ? 'Processing...' : 'Start Amendment'}
          </button>
        </div>
      </div>
    </div>
  );
}
