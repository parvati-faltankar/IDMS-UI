import type React from 'react';

type MasterFormFieldProps = {
  label: string;
  required?: boolean;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
};

export function MasterFormField({
  label,
  required = false,
  hint,
  error,
  fullWidth = false,
  children,
}: MasterFormFieldProps) {
  return (
    <div
      style={{
        marginBottom: '14px',
        minWidth: 0,
        ...(fullWidth ? { gridColumn: '1 / -1' } : {}),
      }}
    >
      <label
        style={{
          display: 'block',
          marginBottom: '6px',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--color-text)',
        }}
      >
        {label}
        {required && <span style={{ color: '#dc2626' }}> *</span>}
      </label>
      {children}
      {hint && !error && (
        <div
          style={{
            marginTop: '5px',
            fontSize: '11px',
            lineHeight: 1.45,
            color: 'var(--color-text-muted)',
          }}
        >
          {hint}
        </div>
      )}
      {error && (
        <div
          style={{
            marginTop: '5px',
            fontSize: '11px',
            lineHeight: 1.45,
            color: '#dc2626',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
