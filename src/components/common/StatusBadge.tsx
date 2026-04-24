import React from 'react';
import { cn } from '../../utils/classNames';

type RequisitionStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Cancelled';
type RequisitionPriority = 'Low' | 'Medium' | 'High' | 'Critical';
type LineStatus = 'Open' | 'Partially Cancelled' | 'Partially Ordered' | 'Fully Ordered' | 'Cancelled';

type BadgeKind = 'requisition-status' | 'priority' | 'line-status';
type BadgeValue = RequisitionStatus | RequisitionPriority | LineStatus;

function getBadgeModifier(kind: BadgeKind, value: BadgeValue): string {
  if (kind === 'priority') {
    switch (value) {
      case 'Critical':
        return 'brand-badge--priority-critical';
      case 'High':
        return 'brand-badge--priority-high';
      case 'Medium':
        return 'brand-badge--priority-medium';
      default:
        return 'brand-badge--priority-low';
    }
  }

  if (kind === 'line-status') {
    switch (value) {
      case 'Fully Ordered':
        return 'brand-badge--approved';
      case 'Partially Ordered':
        return 'brand-badge--pending';
      case 'Partially Cancelled':
        return 'brand-badge--priority-high';
      case 'Cancelled':
        return 'brand-badge--cancelled';
      default:
        return 'brand-badge--draft';
    }
  }

  switch (value) {
    case 'Approved':
      return 'brand-badge--approved';
    case 'Pending Approval':
      return 'brand-badge--pending';
    case 'Rejected':
      return 'brand-badge--rejected';
    case 'Cancelled':
      return 'brand-badge--cancelled';
    default:
      return 'brand-badge--draft';
  }
}

interface StatusBadgeProps {
  kind: BadgeKind;
  value: BadgeValue;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ kind, value, className }) => (
  <span className={cn('brand-badge', getBadgeModifier(kind, value), className)}>{value}</span>
);

export default StatusBadge;
