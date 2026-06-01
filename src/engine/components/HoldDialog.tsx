import { useState } from 'react';

type HoldDialogProps = {
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: (holdType: string, reason: string) => void;
  onCancel: () => void;
  errors?: string[];
};

const HOLD_TYPES = ['Quality Hold', 'Credit Hold', 'Compliance Hold', 'Customer Request', 'Other'];

export function HoldDialog({ isOpen, isLoading, onConfirm, onCancel, errors = [] }: HoldDialogProps) {
  const [holdType, setHoldType] = useState('');
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(holdType, reason);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Place Order on Hold</h3>

        {errors.length > 0 && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '8px 12px', marginBottom: 12 }}>
            {errors.map((e, i) => <div key={i} style={{ fontSize: 13, color: '#b91c1c' }}>{e}</div>)}
          </div>
        )}

        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Hold Type *</label>
        <select
          value={holdType}
          onChange={(e) => setHoldType(e.target.value)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13, marginBottom: 14 }}
        >
          <option value="">Select hold type...</option>
          {HOLD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Hold Reason *</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Describe the reason for hold..."
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 16 }}
        />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button type="button" disabled={isLoading || !holdType || !reason} onClick={handleConfirm}
            style={{ padding: '7px 16px', borderRadius: 6, border: 'none', background: '#f59e0b', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            {isLoading ? 'Processing...' : 'Place on Hold'}
          </button>
        </div>
      </div>
    </div>
  );
}
