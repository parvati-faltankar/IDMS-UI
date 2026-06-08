import { useEffect, useMemo, useState } from 'react';
import { Clock3 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminShell from '../../../AdminShell';
import { AdminListPageShell } from '../../../../experience/components/AdminListPageShell';
import { warehouseMockAdapter } from '../services/warehouseMockAdapter';
import { WAREHOUSE_ROUTES } from '../utils/routeUtils';
import { filterAuditEvents, formatAuditEventLabel } from '../utils/governanceUtils';
import { formatDateTime } from '../../../../utils/dateFormat';
import type { AuditEvent } from '../types/warehouse.types';

export function buildAuditRows(events: AuditEvent[]) {
  return events.map((event) => ({
    id: event.id,
    title: formatAuditEventLabel(event),
    subtitle: `${event.entityType} • ${event.performedBy}`,
    correlation: event.correlationId ?? event.referenceId ?? '—',
    version: event.recordVersion ? String(event.recordVersion) : '—',
    changeCount: event.fieldChanges?.length ?? 0,
  }));
}

export function renderAuditListMarkup(events: AuditEvent[]) {
  return buildAuditRows(events).map((row) => `${row.title}|${row.subtitle}|${row.correlation}|${row.version}`).join('\n');
}

export default function WarehouseAuditPage() {
  const { warehouseId = '' } = useParams<{ warehouseId: string }>();
  const navigate = useNavigate();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('all');
  const [entityType, setEntityType] = useState<AuditEvent['entityType'] | ''>('');
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    warehouseMockAdapter.getAudit(warehouseId, { page: 1, pageSize: 200 })
      .then((result) => {
        setEvents(result.items);
        setLoading(false);
      })
      .catch((error: unknown) => {
        setErrorText(error instanceof Error ? error.message : 'Failed to load audit events.');
        setLoading(false);
      });
  }, [warehouseId]);

  const filtered = useMemo(() => filterAuditEvents(events, { action, entityType, search }), [events, action, entityType, search]);
  const actionOptions = useMemo(() => ['all', ...Array.from(new Set(events.map((event) => event.action)))], [events]);

  return (
    <AdminShell>
      <AdminListPageShell
        title="Warehouse Audit"
        description="Review field-level changes, controlled actions, approvals, imports, and correlation history."
        breadcrumbs={['Admin', 'Warehouse & Inventory', 'Warehouse Master', 'Audit']}
        primaryAction={{ label: 'Back to Warehouse', onClick: () => navigate(WAREHOUSE_ROUTES.configuration(warehouseId)) }}
        summaryItems={[
          { label: 'Events', value: filtered.length, tone: 'neutral' },
          { label: 'Controlled', value: filtered.filter((event) => event.reasonCode).length, tone: 'warning' },
          { label: 'Imports', value: filtered.filter((event) => event.source === 'Import').length, tone: 'neutral' },
        ]}
        searchValue={search}
        searchPlaceholder="Search by action, user, reason, or correlation ID"
        onSearchChange={setSearch}
        toolbarActions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <select value={action} onChange={(event) => setAction(event.target.value)} style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              {actionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <select value={entityType} onChange={(event) => setEntityType(event.target.value as AuditEvent['entityType'] | '')} style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <option value="">All entities</option>
              <option value="Warehouse">Warehouse</option>
              <option value="Location">Location</option>
              <option value="HierarchyTemplate">Hierarchy Template</option>
            </select>
          </div>
        }
      >
        {loading ? (
          <div style={{ padding: '24px', fontSize: '13px', color: 'var(--color-text-muted)' }}>Loading audit events…</div>
        ) : errorText ? (
          <div style={{ padding: '12px 14px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: '12px' }}>
            {errorText}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '24px', border: '1px dashed var(--color-border)', borderRadius: '12px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            No audit events match the current filters.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {filtered.map((event) => {
              const { dateLabel, timeLabel } = formatDateTime(event.performedAt);
              return (
                <div key={event.id} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', background: 'var(--color-surface)' }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>{formatAuditEventLabel(event)}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {event.entityType} • {event.performedBy} • {event.source ?? 'Manual'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      <Clock3 size={12} />
                      {dateLabel} {timeLabel}
                    </div>
                  </div>
                  <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    <Stat label="Correlation / Ref" value={event.correlationId ?? event.referenceId ?? '—'} />
                    <Stat label="Version" value={event.recordVersion ? String(event.recordVersion) : '—'} />
                    <Stat label="Approval" value={event.approvalStatus ?? '—'} />
                    <Stat label="Effective Date" value={event.effectiveDate ?? '—'} />
                  </div>
                  {(event.reasonCode || event.reasonDescription) && (
                    <div style={{ padding: '0 16px 14px', fontSize: '12px', color: 'var(--color-text)' }}>
                      <strong>Reason:</strong> {event.reasonCode ?? '—'} {event.reasonDescription ? `• ${event.reasonDescription}` : ''}
                    </div>
                  )}
                  {event.fieldChanges && event.fieldChanges.length > 0 && (
                    <div style={{ padding: '0 16px 16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '6px' }}>Field Changes</div>
                      <div style={{ display: 'grid', gap: '6px' }}>
                        {event.fieldChanges.map((change) => (
                          <div key={`${event.id}-${change.field}`} style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                            {change.field}: {change.previousValue ?? '—'} → {change.newValue ?? '—'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </AdminListPageShell>
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: '13px', color: 'var(--color-text)', marginTop: '2px' }}>{value}</div>
    </div>
  );
}
