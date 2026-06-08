import React from 'react';
import { SmartReviewDrawer } from '../../../../experience/components/SmartReviewDrawer';
import type { ControlledActionPlan } from '../utils/governanceUtils';

export interface WarehouseControlledActionDrawerProps {
  open: boolean;
  plan: ControlledActionPlan | null;
  reasonCode: string;
  reasonDescription: string;
  effectiveDate: string;
  saving?: boolean;
  onClose: () => void;
  onReasonCodeChange: (value: string) => void;
  onReasonDescriptionChange: (value: string) => void;
  onEffectiveDateChange: (value: string) => void;
  onConfirm: () => void;
  reasonCodeOptions: string[];
}

export function WarehouseControlledActionDrawer({
  open,
  plan,
  reasonCode,
  reasonDescription,
  effectiveDate,
  saving = false,
  onClose,
  onReasonCodeChange,
  onReasonDescriptionChange,
  onEffectiveDateChange,
  onConfirm,
  reasonCodeOptions,
}: WarehouseControlledActionDrawerProps) {
  if (!plan) return null;

  const checklist = plan.checklist.map((item) => {
    if (item.id === 'reason-code') {
      return { ...item, passed: Boolean(reasonCode) };
    }
    if (item.id === 'reason-description') {
      return { ...item, passed: Boolean(reasonDescription.trim()) };
    }
    if (item.id === 'effective-date' && item.label.toLowerCase().includes('effective date')) {
      return { ...item, passed: item.label.startsWith('No') || Boolean(effectiveDate) };
    }
    return item;
  });

  return (
    <SmartReviewDrawer
      open={open}
      onClose={onClose}
      title={plan.title}
      subtitle={plan.kind}
      description={plan.summary}
      confirmLabel={plan.approvalRequired ? 'Submit For Approval' : 'Confirm Action'}
      confirmDisabled={!reasonCode || !reasonDescription.trim() || saving}
      loading={saving}
      onCancel={onClose}
      onConfirm={onConfirm}
      checklist={checklist}
      warningText={!reasonCode || !reasonDescription.trim() ? 'Reason code and explanation are required for this controlled action.' : undefined}
      consequenceNote={plan.consequenceNote}
      summaryFields={[
        { label: 'Impact', value: plan.impactSummary.join(' | ') },
        { label: 'Approval', value: plan.approvalRequired ? `Required via ${plan.approverRoute ?? 'configured route'}` : 'Not required' },
        {
          label: 'Reason Code',
          value: (
            <select
              value={reasonCode}
              onChange={(event) => onReasonCodeChange(event.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${reasonCode ? 'var(--color-border)' : '#FCA5A5'}`, background: 'var(--color-surface)', color: 'var(--color-text)' }}
            >
              <option value="">Select reason code</option>
              {reasonCodeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ),
        },
        {
          label: 'Explanation',
          value: (
            <textarea
              value={reasonDescription}
              onChange={(event) => onReasonDescriptionChange(event.target.value)}
              rows={3}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${reasonDescription.trim() ? 'var(--color-border)' : '#FCA5A5'}`, background: 'var(--color-surface)', color: 'var(--color-text)', resize: 'vertical' }}
              placeholder="Explain the reason and expected impact..."
            />
          ),
        },
        {
          label: 'Effective Date',
          value: (
            <input
              type="date"
              value={effectiveDate}
              onChange={(event) => onEffectiveDateChange(event.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
            />
          ),
        },
      ]}
    />
  );
}
