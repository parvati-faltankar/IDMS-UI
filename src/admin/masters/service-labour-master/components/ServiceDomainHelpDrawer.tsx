import React from 'react';
import { SmartDrawer } from '../../../../experience/components/SmartDrawer';

type ServiceDomainHelpDrawerProps = {
  open: boolean;
  onClose: () => void;
};

const SUMMARY =
  'Service Domain is the top-level business area for services. It helps the company separate different service businesses such as regular service, collision repair, roadside assistance, and customer convenience.';

const USE_CASE_ROWS = [
  {
    situation: 'Regular vehicle service',
    withoutDomain: 'Mixed with all other services',
    withDomain: 'Comes under After Sales Service',
  },
  {
    situation: 'Accident repair',
    withoutDomain: 'Mixed with normal repairs',
    withDomain: 'Comes under Body & Paint / Collision',
  },
  {
    situation: 'Breakdown support',
    withoutDomain: 'Mixed with workshop jobs',
    withDomain: 'Comes under Roadside Assistance',
  },
  {
    situation: 'Pickup & drop',
    withoutDomain: 'Mixed with repair services',
    withDomain: 'Comes under Customer Convenience',
  },
] as const;

const BENEFITS = [
  'Separates major service business areas.',
  'Helps assign the right owner or department.',
  'Helps create correct service reports.',
  'Helps control which services are shown to users.',
  'Helps route work to the right process.',
  'Helps map services with ERP, DMS, CRM, or warranty systems.',
] as const;

const EXAMPLE_ROWS = [
  {
    domain: 'After Sales Service',
    family: 'Periodic Maintenance',
    item: '10,000 KM Service',
  },
  {
    domain: 'Body & Paint',
    family: 'Painting',
    item: 'Front Bumper Repainting',
  },
  {
    domain: 'Roadside Assistance',
    family: 'Emergency Support',
    item: 'Vehicle Towing',
  },
  {
    domain: 'Customer Convenience',
    family: 'Pickup & Drop',
    item: 'Vehicle Pickup - One Way',
  },
] as const;

const shellStyle: React.CSSProperties = {
  display: 'grid',
  gap: '20px',
  padding: '20px',
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '14px',
  fontWeight: 700,
  color: 'var(--color-text)',
};

const tableWrapStyle: React.CSSProperties = {
  overflowX: 'auto',
  border: '1px solid var(--color-border)',
  borderRadius: '12px',
  background: 'var(--color-surface)',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: '520px',
};

const headCellStyle: React.CSSProperties = {
  padding: '12px 14px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: 700,
  color: 'var(--color-text)',
  background: 'var(--color-surface-subtle)',
  borderBottom: '1px solid var(--color-border)',
};

const bodyCellStyle: React.CSSProperties = {
  padding: '12px 14px',
  fontSize: '13px',
  lineHeight: 1.5,
  color: 'var(--color-text)',
  borderBottom: '1px solid var(--color-border)',
  verticalAlign: 'top',
};

const mutedTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '13px',
  lineHeight: 1.6,
  color: 'var(--color-text-muted)',
};

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: '18px',
  display: 'grid',
  gap: '8px',
  color: 'var(--color-text)',
  fontSize: '13px',
  lineHeight: 1.6,
};

const calloutStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: '12px',
  border: '1px solid #BFDBFE',
  background: '#EFF6FF',
  color: '#1D4ED8',
  fontSize: '13px',
  fontWeight: 600,
  lineHeight: 1.6,
};

function ContentTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: string[][];
}) {
  return (
    <div style={tableWrapStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} style={headCellStyle}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td
                  key={`${rowIndex}-${cellIndex}`}
                  style={{
                    ...bodyCellStyle,
                    borderBottom:
                      rowIndex === rows.length - 1 ? 'none' : bodyCellStyle.borderBottom,
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ServiceDomainHelpDrawer({
  open,
  onClose,
}: ServiceDomainHelpDrawerProps) {
  return (
    <SmartDrawer open={open} onClose={onClose} title="Why Service Domain exists">
      <div style={shellStyle}>
        <p style={{ ...mutedTextStyle, color: 'var(--color-text)' }}>{SUMMARY}</p>

        <section style={{ display: 'grid', gap: '12px' }}>
          <h3 style={sectionTitleStyle}>Real-world use case</h3>
          <ContentTable
            columns={['Situation', 'Without Service Domain', 'With Service Domain']}
            rows={USE_CASE_ROWS.map((row) => [row.situation, row.withoutDomain, row.withDomain])}
          />
        </section>

        <section style={{ display: 'grid', gap: '12px' }}>
          <h3 style={sectionTitleStyle}>Why it is useful</h3>
          <ul style={listStyle}>
            {BENEFITS.map((benefit) => (
              <li key={benefit}>{benefit}</li>
            ))}
          </ul>
        </section>

        <section style={{ display: 'grid', gap: '12px' }}>
          <h3 style={sectionTitleStyle}>Example</h3>
          <ContentTable
            columns={['Service Domain', 'Example Service Family', 'Example Service Item']}
            rows={EXAMPLE_ROWS.map((row) => [row.domain, row.family, row.item])}
          />
        </section>

        <section style={{ display: 'grid', gap: '12px' }}>
          <h3 style={sectionTitleStyle}>Simple rule</h3>
          <div style={calloutStyle}>
            If it represents a major business area, create a Service Domain. If it
            represents exact work to be performed, create a Service Item.
          </div>
        </section>

        <p style={mutedTextStyle}>
          Example inspired by real OEM service structures where regular service,
          collision repair, roadside assistance, mobile service, and pickup/drop are
          handled as separate service areas.
        </p>
      </div>
    </SmartDrawer>
  );
}
