import { useState } from 'react';
import type { RuleError, RuleWarning } from '../types/ruleEngine';

type RuleEngineErrorSummaryProps = {
  errors: RuleError[];
  warnings: RuleWarning[];
};

export function RuleEngineErrorSummary({ errors, warnings }: RuleEngineErrorSummaryProps) {
  const [expanded, setExpanded] = useState(true);

  if (errors.length === 0 && warnings.length === 0) return null;

  return (
    <div
      style={{
        border: errors.length > 0 ? '1px solid #fca5a5' : '1px solid #fde68a',
        borderRadius: 8,
        background: errors.length > 0 ? '#fff5f5' : '#fffbeb',
        marginBottom: 12,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: '8px 14px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 13,
          color: errors.length > 0 ? '#b91c1c' : '#92400e',
          textAlign: 'left',
        }}
      >
        <span>{errors.length > 0 ? '✕' : '⚠'}</span>
        <span>
          {errors.length > 0
            ? `${errors.length} validation error${errors.length !== 1 ? 's' : ''}`
            : ''}
          {errors.length > 0 && warnings.length > 0 ? ', ' : ''}
          {warnings.length > 0
            ? `${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`
            : ''}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 11 }}>{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div style={{ padding: '0 14px 10px' }}>
          {errors.map((err) => (
            <div
              key={err.code}
              style={{ fontSize: 13, color: '#b91c1c', padding: '3px 0', display: 'flex', gap: 8 }}
            >
              <span>•</span>
              <span>
                {err.field && <strong>{err.field}: </strong>}
                {err.message}
                <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>[{err.code}]</span>
              </span>
            </div>
          ))}
          {warnings.map((warn) => (
            <div
              key={warn.code}
              style={{ fontSize: 13, color: '#92400e', padding: '3px 0', display: 'flex', gap: 8 }}
            >
              <span>•</span>
              <span>
                {warn.field && <strong>{warn.field}: </strong>}
                {warn.message}
                <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>[{warn.code}]</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
