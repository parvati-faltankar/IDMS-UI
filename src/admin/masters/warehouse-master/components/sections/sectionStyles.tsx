// ─── Shared section styles + helpers ─────────────────────────────────────────

import React from 'react';
import { Save, X } from 'lucide-react';

export const inputBase: React.CSSProperties = {
  width: '100%', padding: '8px 11px', fontSize: '13px',
  border: '1px solid var(--color-border)', borderRadius: '8px',
  background: 'var(--color-surface)', color: 'var(--color-text)',
  outline: 'none', boxSizing: 'border-box',
};
export const inputRO: React.CSSProperties = {
  ...inputBase, background: 'var(--color-surface-subtle)',
  color: 'var(--color-text-muted)', cursor: 'not-allowed',
};
export const inputErr: React.CSSProperties = {
  ...inputBase, border: '1px solid #FCA5A5',
};
export const labelBase: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, color: 'var(--color-text)',
  display: 'block', marginBottom: '5px', textTransform: 'uppercase',
  letterSpacing: '0.04em',
};
export const hintTxt: React.CSSProperties = {
  fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px',
};
export const errTxt: React.CSSProperties = {
  fontSize: '11px', color: '#DC2626', marginTop: '4px',
};
export const twoCol: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px',
};
export const threeCol: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px',
};
export const fw: React.CSSProperties = { marginBottom: '14px' };

export const sCard: React.CSSProperties = {
  border: '1px solid var(--color-border)', borderRadius: '10px',
  overflow: 'hidden', marginBottom: '16px',
};
export const sHead: React.CSSProperties = {
  padding: '10px 18px', borderBottom: '1px solid var(--color-border)',
  background: 'var(--color-surface-subtle)', display: 'flex',
  alignItems: 'center', justifyContent: 'space-between',
};
export const sBody: React.CSSProperties = {
  padding: '18px 20px', background: 'var(--color-surface)',
};
export const btnPrimary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '5px',
  padding: '7px 16px', fontSize: '12px', fontWeight: 600,
  borderRadius: '7px', border: 'none', cursor: 'pointer',
  background: 'var(--color-primary)', color: 'white',
};
export const btnOutline: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '5px',
  padding: '7px 14px', fontSize: '12px', fontWeight: 500,
  borderRadius: '7px', border: '1px solid var(--color-border)',
  background: 'transparent', color: 'var(--color-text)', cursor: 'pointer',
};

export function SectionActionRow({
  dirty,
  saving,
  readOnly,
  onSave,
  onDiscard,
}: {
  dirty: boolean;
  saving: boolean;
  readOnly: boolean;
  onSave: () => void;
  onDiscard: () => void;
}) {
  if (readOnly || !dirty) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '18px',
        paddingTop: '14px',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        style={{ ...btnPrimary, opacity: saving ? 0.5 : 1 }}
      >
        <Save size={13} />
        {saving ? 'Saving…' : 'Save changes'}
      </button>
      <button
        type="button"
        onClick={onDiscard}
        disabled={saving}
        style={btnOutline}
      >
        <X size={13} /> Discard
      </button>
      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginLeft: '4px' }}>
        Unsaved changes
      </span>
    </div>
  );
}
