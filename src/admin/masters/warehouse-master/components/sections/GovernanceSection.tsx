// ─── GovernanceSection ────────────────────────────────────────────────────────
// Displays recent audit events + approval references (read-only display section)

import React from 'react';
import { Clock, User, Info } from 'lucide-react';
import type { ConfigSectionProps } from './sectionTypes';
import type { AuditEvent } from '../../types/warehouse.types';
import { sCard, sHead, sBody } from './sectionStyles';
import { WAREHOUSE_ROUTES } from '../../utils/routeUtils';

const EVENT_COLOR: Record<string, string> = {
  Created: '#2563EB',
  Updated: '#7C3AED',
  Activated: '#16A34A',
  Blocked: '#D97706',
  Inactivated: '#DC2626',
  StatusChanged: '#0891B2',
  LocationAdded: '#059669',
  TemplateActivated: '#6D28D9',
};

function eventColor(action: string): string {
  return EVENT_COLOR[action] ?? 'var(--color-text-muted)';
}

export function GovernanceSection({ warehouse }: ConfigSectionProps & { auditEvents?: AuditEvent[] }) {
  // The full audit event list lives on WarehouseDetails.recentAuditEvents.
  // The page passes warehouse.id; for now we show a placeholder with a link.
  return (
    <div data-testid="section-governance">
      {/* Lifecycle summary */}
      <div style={sCard}>
        <div style={sHead}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Lifecycle Summary</span>
        </div>
        <div style={sBody}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            <Stat label="Status" value={warehouse.status} />
            <Stat label="Creation Source" value={warehouse.creationSource ?? '—'} />
            <Stat label="Version" value={String(warehouse.version)} />
            <Stat label="Created" value={formatDate(warehouse.createdAt)} />
            <Stat label="Last Updated" value={formatDate(warehouse.updatedAt)} />
            <Stat label="Activated" value={formatDate(warehouse.activatedAt)} />
          </div>
          {warehouse.blockReason && (
            <div style={{ marginTop: '12px', padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', fontSize: '12px', color: '#92400E' }}>
              <strong>Block Reason:</strong> {warehouse.blockReason}
            </div>
          )}
          {warehouse.inactiveReason && (
            <div style={{ marginTop: '12px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', fontSize: '12px', color: '#991B1B' }}>
              <strong>Inactive Reason:</strong> {warehouse.inactiveReason}
            </div>
          )}
        </div>
      </div>

      {/* Audit event link */}
      <div style={sCard}>
        <div style={sHead}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Audit Trail</span>
          <a
            href={WAREHOUSE_ROUTES.audit(warehouse.id)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }}
          >
            <Clock size={12} /> View full audit log
          </a>
        </div>
        <div style={sBody}>
          <div style={{ padding: '10px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', fontSize: '11px', color: '#1E40AF', display: 'flex', gap: '6px' }}>
            <Info size={13} style={{ flexShrink: 0 }} />
            <span>
              The full audit log captures all changes, approvals, and status transitions for this warehouse.
              Audit records are immutable and cannot be deleted.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </p>
      <p style={{ margin: '3px 0 0', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
        {value || '—'}
      </p>
    </div>
  );
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso.slice(0, 10);
  }
}
