import type { AuditEvent } from '../types/services';

type AuditTrailPanelProps = {
  events: AuditEvent[];
  isLoading: boolean;
};

export function AuditTrailPanel({ events, isLoading }: AuditTrailPanelProps) {
  if (isLoading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
        Loading audit trail...
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
        No audit events recorded.
      </div>
    );
  }

  return (
    <div style={{ padding: 16, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            {['Action', 'Performed By', 'Date & Time', 'Step'].map((h) => (
              <th
                key={h}
                style={{
                  padding: '6px 8px',
                  textAlign: 'left',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#475569',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.eventId} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '6px 8px', fontSize: 13, fontWeight: 500, color: '#334155' }}>
                {event.action}
              </td>
              <td style={{ padding: '6px 8px', fontSize: 13, color: '#64748b' }}>
                {event.performedBy}
              </td>
              <td style={{ padding: '6px 8px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                {new Date(event.performedAt).toLocaleString()}
              </td>
              <td style={{ padding: '6px 8px', fontSize: 12, fontFamily: 'monospace', color: '#64748b' }}>
                {event.stepCode ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
