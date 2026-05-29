import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Paperclip, Plus, ShieldCheck, Upload, X } from 'lucide-react';
import type { BPComplianceDocument } from '../types/supplierMaster.types';
import type { BPType } from '../types/supplierMaster.types';
import type { KycProofRow } from '../../kycConfig';
import { MOCK_CONFIGS } from '../../kycConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RowState {
  kycRowId:     string;
  proofType:    string;
  proofCategory: string;
  isMandatory:  boolean;
  rule:         KycProofRow;
  // doc data
  docId:        string;
  documentNumber: string;
  issueDate:    string;
  expiryDate:   string;
  allowAfterExpiry: boolean;
  fileNames:    string[];
  // ui state
  expanded:     boolean;
  docNumError:  string;
  isAdded:      boolean;
}

interface Props {
  value:                  BPComplianceDocument[];
  onChange:               (docs: BPComplianceDocument[]) => void;
  bpType:                 BPType | '';
  countryOfRegistration:  string;
  isViewOnly:             boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateDocNumber(val: string, rule: KycProofRow): string {
  if (!rule.documentNumberRequired) return '';
  if (!val) return 'Document number is required';
  if (rule.minLength && val.length < parseInt(rule.minLength, 10))
    return `Minimum ${rule.minLength} characters required`;
  if (rule.maxLength && val.length > parseInt(rule.maxLength, 10))
    return `Maximum ${rule.maxLength} characters allowed`;
  if (rule.mustMatchRegex && rule.regexPattern) {
    try { if (!new RegExp(rule.regexPattern).test(val)) return rule.regexErrorMessage || 'Invalid format'; }
    catch { /* ignore bad regex */ }
  }
  return '';
}

function isRowComplete(row: RowState): boolean {
  if (!row.isAdded) return false;
  if (row.rule.documentNumberRequired && !row.documentNumber) return false;
  if (row.docNumError) return false;
  if (row.rule.isAttachmentMandatory && row.fileNames.length === 0) return false;
  return true;
}

function rowsToDocs(rows: RowState[]): BPComplianceDocument[] {
  return rows.filter((r) => r.isAdded).map((r) => ({
    id:                         r.docId,
    documentType:               r.proofType,
    documentNumber:             r.documentNumber,
    issueDate:                  r.issueDate,
    expiryDate:                 r.expiryDate,
    allowTransactionAfterExpiry: r.allowAfterExpiry,
    attachmentName:             r.fileNames[0] ?? '',
    attachmentFiles:            r.fileNames,
    proofCategory:              r.proofCategory,
    kycProofRowId:              r.kycRowId,
    status:                     'Active' as const,
  }));
}

function buildRows(kycRows: KycProofRow[], existingDocs: BPComplianceDocument[]): RowState[] {
  return kycRows.map((kr) => {
    const existing = existingDocs.find(
      (d) => d.kycProofRowId === kr.id || d.documentType === kr.proofType
    );
    const isAdded = kr.isMandatory || !!existing;
    return {
      kycRowId:       kr.id,
      proofType:      kr.proofType,
      proofCategory:  kr.proofCategory,
      isMandatory:    kr.isMandatory,
      rule:           kr,
      docId:          existing?.id ?? `BPCD-new-${kr.id}`,
      documentNumber: existing?.documentNumber ?? '',
      issueDate:      existing?.issueDate ?? '',
      expiryDate:     existing?.expiryDate ?? '',
      allowAfterExpiry: existing?.allowTransactionAfterExpiry ?? false,
      fileNames:      existing?.attachmentFiles ?? (existing?.attachmentName ? [existing.attachmentName] : []),
      expanded:       kr.isMandatory || !!existing,
      docNumError:    '',
      isAdded,
    };
  });
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const categoryBadge = (category: string): React.CSSProperties => {
  const map: Record<string, { bg: string; color: string }> = {
    'Business Proof':  { bg: '#EFF6FF', color: '#1D4ED8' },
    'Identity Proof':  { bg: '#F5F3FF', color: '#7C3AED' },
    'Address Proof':   { bg: '#FFF7ED', color: '#C2410C' },
    'Financial Proof': { bg: '#F0FDF4', color: '#15803D' },
    'Other':           { bg: '#F8FAFC', color: '#64748B' },
  };
  const c = map[category] ?? map['Other'];
  return {
    display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
    background: c.bg, color: c.color, borderRadius: '4px',
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap',
  };
};

const inputBase: React.CSSProperties = {
  width: '100%', padding: '8px 10px', fontSize: '12px',
  border: '1px solid var(--color-border, #E5E7EB)', borderRadius: '7px',
  background: 'var(--color-surface, #fff)', color: 'var(--color-text, #111827)',
  outline: 'none', boxSizing: 'border-box',
};
const inputError: React.CSSProperties = {
  ...inputBase, borderColor: '#DC2626',
};
const labelSmall: React.CSSProperties = {
  display: 'block', fontSize: '10px', fontWeight: 700,
  color: 'var(--color-text-muted, #6B7280)', textTransform: 'uppercase',
  letterSpacing: '0.05em', marginBottom: '4px',
};
const iconBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: '4px', display: 'flex', alignItems: 'center',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ComplianceDocChecklist({ value, onChange, bpType: _bpType, countryOfRegistration, isViewOnly }: Props) {
  const country = countryOfRegistration || 'India';
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const [rows, setRows] = useState<RowState[]>([]);

  // ── Find KYC proof rows for Supplier entity in the given country ──────────
  const kycRows = useMemo(() => {
    const relevant = MOCK_CONFIGS.filter((c) => c.entity === 'Supplier' && c.status === 'Active');
    const all: KycProofRow[] = [];
    relevant.forEach((c) => c.proofRows.forEach((r) => { if (r.country === country && r.isActive) all.push(r); }));
    // dedupe by proofType
    const seen = new Set<string>();
    return all.filter((r) => { if (seen.has(r.proofType)) return false; seen.add(r.proofType); return true; });
  }, [country]);

  // ── Initialize rows from KYC config + existing value (on mount / country change) ─
  useEffect(() => {
    setRows(buildRows(kycRows, value));
  }, [kycRows]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mutation helper ───────────────────────────────────────────────────────
  function mutate(kycRowId: string, updates: Partial<RowState>) {
    setRows((prev) => {
      const next = prev.map((r) => r.kycRowId === kycRowId ? { ...r, ...updates } : r);
      onChange(rowsToDocs(next));
      return next;
    });
  }

  function handleDocNumChange(row: RowState, raw: string) {
    const val = raw.toUpperCase();
    mutate(row.kycRowId, { documentNumber: val, docNumError: validateDocNumber(val, row.rule) });
  }

  function handleFileSelect(row: RowState, files: FileList | null) {
    if (!files || files.length === 0) return;
    const allowed  = row.rule.allowedFileTypes.map((t) => t.toLowerCase());
    const maxCount = parseInt(row.rule.maximumFileCount || '5', 10);
    const maxKb    = parseInt(row.rule.maxFileSize || '10240', 10);
    const current  = row.fileNames;
    const added: string[] = [];
    for (let i = 0; i < files.length && (current.length + added.length) < maxCount; i++) {
      const f   = files[i];
      const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
      if (allowed.length > 0 && !allowed.includes(ext)) continue;
      if (f.size > maxKb * 1024) continue;
      added.push(f.name);
    }
    mutate(row.kycRowId, { fileNames: [...current, ...added] });
  }

  function removeFile(row: RowState, idx: number) {
    mutate(row.kycRowId, { fileNames: row.fileNames.filter((_, i) => i !== idx) });
  }

  const mandatoryRows = rows.filter((r) => r.isMandatory);
  const optionalRows  = rows.filter((r) => !r.isMandatory);
  const requiredDone  = mandatoryRows.filter(isRowComplete).length;
  const requiredTotal = mandatoryRows.length;
  const allDone       = requiredTotal > 0 && requiredDone === requiredTotal;

  // ── Empty state when no KYC config found ─────────────────────────────────
  if (kycRows.length === 0) {
    return (
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={14} color="var(--color-text-muted)" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Compliance Documents</span>
          </div>
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Powered by KYC Setup</span>
        </div>
        <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
          {country
            ? `No active KYC configuration found for Suppliers in ${country}. Configure one in Admin → KYC Setup.`
            : 'Select a Country of Registration in General Details to load required compliance documents.'}
        </div>
      </div>
    );
  }

  // ── Row renderer ──────────────────────────────────────────────────────────
  function renderRow(row: RowState, canRemove: boolean) {
    const done    = isRowComplete(row);
    const hasAttachment = row.rule.isAttachmentEnabled;
    const attachMandatory = row.rule.isAttachmentMandatory;
    const maxCount = parseInt(row.rule.maximumFileCount || '5', 10);
    const acceptTypes = row.rule.allowedFileTypes.map((t) => `.${t.toLowerCase()}`).join(',');

    return (
      <div
        key={row.kycRowId}
        style={{
          border: '1px solid var(--color-border, #E5E7EB)',
          borderRadius: '10px',
          overflow: 'hidden',
          background: done ? 'rgba(22,163,74,0.03)' : 'var(--color-surface, #fff)',
          transition: 'background 0.15s',
        }}
      >
        {/* ── Row header ────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
            borderBottom: row.expanded ? '1px solid var(--color-border, #E5E7EB)' : 'none',
            background: done ? 'rgba(22,163,74,0.04)' : 'var(--color-surface-subtle, #F9FAFB)',
            cursor: 'pointer',
          }}
          onClick={() => !isViewOnly && mutate(row.kycRowId, { expanded: !row.expanded })}
        >
          {/* completion icon */}
          <span style={{ flexShrink: 0 }}>
            {done
              ? <CheckCircle2 size={16} color="#16A34A" />
              : <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${row.isMandatory ? '#F59E0B' : '#CBD5E1'}` }} />}
          </span>

          {/* proof type */}
          <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: 'var(--color-text, #111827)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {row.proofType}
          </span>

          {/* category badge */}
          <span style={categoryBadge(row.proofCategory)}>{row.proofCategory}</span>

          {/* mandatory / optional badge */}
          {row.isMandatory
            ? <span style={{ fontSize: '10px', fontWeight: 700, color: '#DC2626', background: '#FEF2F2', padding: '2px 7px', borderRadius: '4px', whiteSpace: 'nowrap' }}>REQUIRED</span>
            : <span style={{ fontSize: '10px', fontWeight: 600, color: '#6B7280', background: '#F3F4F6', padding: '2px 7px', borderRadius: '4px', whiteSpace: 'nowrap' }}>OPTIONAL</span>
          }

          {/* remove optional */}
          {canRemove && !isViewOnly && (
            <button
              onClick={(e) => { e.stopPropagation(); mutate(row.kycRowId, { isAdded: false, expanded: false, documentNumber: '', issueDate: '', expiryDate: '', fileNames: [], docNumError: '' }); }}
              style={{ ...iconBtn, color: 'var(--color-text-muted, #9CA3AF)' }}
              title="Remove this document"
            >
              <X size={14} />
            </button>
          )}

          {/* expand / collapse */}
          <button style={{ ...iconBtn, color: 'var(--color-text-muted, #9CA3AF)' }} onClick={(e) => { e.stopPropagation(); mutate(row.kycRowId, { expanded: !row.expanded }); }}>
            {row.expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* ── Row body (expanded) ────────────────────────────────────────── */}
        {row.expanded && (
          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Doc number + dates row */}
            <div style={{ display: 'grid', gridTemplateColumns: row.rule.documentNumberRequired ? '1fr 140px 140px' : '140px 140px', gap: '10px' }}>
              {row.rule.documentNumberRequired && (
                <div>
                  <label style={labelSmall}>
                    Document Number <span style={{ color: '#DC2626' }}>*</span>
                    {row.rule.tooltip && (
                      <span style={{ marginLeft: '6px', fontSize: '10px', fontWeight: 400, color: 'var(--color-text-muted)', textTransform: 'none', letterSpacing: 0 }}>— {row.rule.tooltip}</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={row.documentNumber}
                    onChange={(e) => handleDocNumChange(row, e.target.value)}
                    disabled={isViewOnly}
                    placeholder={row.rule.placeholderText || 'Enter document number'}
                    style={row.docNumError ? inputError : inputBase}
                  />
                  {row.docNumError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '11px', color: '#DC2626' }}>
                      <AlertCircle size={11} /> {row.docNumError}
                    </div>
                  )}
                </div>
              )}
              <div>
                <label style={labelSmall}>Issue Date</label>
                <input type="date" value={row.issueDate} onChange={(e) => mutate(row.kycRowId, { issueDate: e.target.value })} disabled={isViewOnly} style={inputBase} />
              </div>
              <div>
                <label style={labelSmall}>Expiry Date</label>
                <input type="date" value={row.expiryDate} onChange={(e) => mutate(row.kycRowId, { expiryDate: e.target.value })} disabled={isViewOnly} style={inputBase} />
              </div>
            </div>

            {/* Allow after expiry */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isViewOnly ? 'default' : 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={row.allowAfterExpiry}
                onChange={(e) => mutate(row.kycRowId, { allowAfterExpiry: e.target.checked })}
                disabled={isViewOnly}
                style={{ width: '13px', height: '13px', cursor: isViewOnly ? 'default' : 'pointer' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--color-text, #374151)' }}>Allow transactions after document expiry</span>
            </label>

            {/* Upload zone */}
            {hasAttachment && (
              <div>
                <label style={labelSmall}>
                  Attachments {attachMandatory && <span style={{ color: '#DC2626' }}>*</span>}
                  <span style={{ marginLeft: '6px', fontSize: '10px', fontWeight: 400, color: 'var(--color-text-muted)', textTransform: 'none', letterSpacing: 0 }}>
                    — {row.rule.allowedFileTypes.join(', ')} · max {Math.round(parseInt(row.rule.maxFileSize || '10240', 10) / 1024)} MB per file · up to {row.rule.maximumFileCount} file(s)
                  </span>
                </label>

                {/* Uploaded files */}
                {row.fileNames.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                    {row.fileNames.map((name, idx) => (
                      <div key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', fontSize: '12px', color: '#1D4ED8' }}>
                        <Paperclip size={11} />
                        <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                        {!isViewOnly && (
                          <button onClick={() => removeFile(row, idx)} style={{ ...iconBtn, padding: '1px', color: '#60A5FA' }}>
                            <X size={11} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button / drop area */}
                {!isViewOnly && row.fileNames.length < maxCount && (
                  <>
                    <input
                      ref={(el) => { if (el) fileInputRefs.current.set(row.kycRowId, el); }}
                      type="file"
                      multiple={maxCount > 1}
                      accept={acceptTypes}
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileSelect(row, e.target.files)}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current.get(row.kycRowId)?.click()}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        width: '100%', padding: '10px', border: '1px dashed var(--color-border, #D1D5DB)',
                        borderRadius: '8px', background: 'var(--color-background, #F9FAFB)',
                        color: 'var(--color-text-muted, #6B7280)', fontSize: '12px',
                        cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
                      }}
                      onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'var(--color-primary, #2563EB)'; b.style.color = 'var(--color-primary, #2563EB)'; }}
                      onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'var(--color-border, #D1D5DB)'; b.style.color = 'var(--color-text-muted, #6B7280)'; }}
                    >
                      <Upload size={13} />
                      Click to upload or drag & drop
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={14} color={allDone ? '#16A34A' : 'var(--color-text-muted)'} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Compliance Documents</span>
          {requiredTotal > 0 && (
            <span style={{
              fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '9999px',
              background: allDone ? '#F0FDF4' : '#FFF7ED',
              color: allDone ? '#15803D' : '#B45309',
              border: `1px solid ${allDone ? '#BBF7D0' : '#FDE68A'}`,
            }}>
              {requiredDone} / {requiredTotal} Required Complete
            </span>
          )}
        </div>
        <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Powered by KYC Setup
        </span>
      </div>

      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

        {/* Required Documents */}
        {mandatoryRows.length > 0 && (
          <>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#DC2626', display: 'inline-block' }} />
              Required Documents
            </div>
            {mandatoryRows.map((row) => renderRow(row, false))}
          </>
        )}

        {/* Optional Documents */}
        {optionalRows.length > 0 && (
          <>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '10px 0 4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#CBD5E1', display: 'inline-block' }} />
              Optional Documents
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {optionalRows.map((row) =>
                row.isAdded
                  ? renderRow(row, true)
                  : (
                    <button
                      key={row.kycRowId}
                      type="button"
                      disabled={isViewOnly}
                      onClick={() => mutate(row.kycRowId, { isAdded: true, expanded: true })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 12px', border: '1px dashed var(--color-border, #D1D5DB)',
                        borderRadius: '8px', background: 'transparent',
                        cursor: isViewOnly ? 'default' : 'pointer',
                        color: 'var(--color-text-muted, #6B7280)', fontSize: '12px',
                        fontWeight: 500, textAlign: 'left', width: '100%',
                        opacity: isViewOnly ? 0.5 : 1,
                        transition: 'border-color 0.15s, color 0.15s',
                      }}
                      onMouseEnter={(e) => { if (!isViewOnly) { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'var(--color-primary, #2563EB)'; b.style.color = 'var(--color-primary, #2563EB)'; }}}
                      onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'var(--color-border, #D1D5DB)'; b.style.color = 'var(--color-text-muted, #6B7280)'; }}
                    >
                      <Plus size={13} />
                      <span>{row.proofType}</span>
                      <span style={categoryBadge(row.proofCategory)}>{row.proofCategory}</span>
                    </button>
                  )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
