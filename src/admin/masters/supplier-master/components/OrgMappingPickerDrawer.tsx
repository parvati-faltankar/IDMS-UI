import React, { useEffect, useMemo, useState } from 'react';
import { Search, Square, CheckSquare, Minus, X } from 'lucide-react';
import { SmartDrawer } from '../../../../experience/components/SmartDrawer';
import type { BPOrgMapping } from '../types/supplierMaster.types';
import { MOCK_ORGANISATIONS } from '../constants/supplierMaster.constants';

interface OrgRow {
  id: string;
  name: string;
  checked: boolean;
  effectiveDate: string;
  expirationDate: string;
  alreadyMapped: boolean;
}

interface OrgMappingPickerDrawerProps {
  open: boolean;
  onClose: () => void;
  existingMappingOrgIds: string[];
  onConfirm: (mappings: BPOrgMapping[]) => void;
}

export function OrgMappingPickerDrawer({
  open,
  onClose,
  existingMappingOrgIds,
  onConfirm,
}: OrgMappingPickerDrawerProps) {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<OrgRow[]>([]);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setRows(
      MOCK_ORGANISATIONS.map((org) => ({
        id: org.id,
        name: org.name,
        checked: false,
        effectiveDate: '',
        expirationDate: '',
        alreadyMapped: existingMappingOrgIds.includes(org.id),
      })),
    );
  }, [existingMappingOrgIds, open]);

  const filtered = useMemo(
    () => rows.filter((r) => r.name.toLowerCase().includes(search.toLowerCase())),
    [rows, search],
  );

  const selectableFiltered = filtered.filter((r) => !r.alreadyMapped);
  const checkedCount = rows.filter((r) => r.checked).length;
  const allChecked = selectableFiltered.length > 0 && selectableFiltered.every((r) => r.checked);
  const someChecked = selectableFiltered.some((r) => r.checked) && !allChecked;
  const availableCount = rows.filter((r) => !r.alreadyMapped).length;

  function toggleSelectAll() {
    const ids = new Set(selectableFiltered.map((r) => r.id));
    setRows((prev) => prev.map((r) => (ids.has(r.id) ? { ...r, checked: !allChecked } : r)));
  }

  function toggleRow(id: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, checked: !r.checked } : r)));
  }

  function setDate(id: string, field: 'effectiveDate' | 'expirationDate', value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function handleConfirm() {
    const selected = rows.filter((r) => r.checked && !r.alreadyMapped);
    const now = Date.now();
    const mappings: BPOrgMapping[] = selected.map((r, i) => ({
      id: `BPOM-${now}-${i}`,
      applyToAll: false,
      organisationId: r.id,
      organisationName: r.name,
      effectiveDate: r.effectiveDate,
      expirationDate: r.expirationDate,
      status: 'Active',
    }));
    onConfirm(mappings);
  }

  if (!open) return null;

  return (
    <SmartDrawer
      open={open}
      onClose={onClose}
      title="Add Organisation Mappings"
      subtitle="Select organisations to map this business partner to. Use inline dates per row."
      footerActions={[{
        label: checkedCount === 0 ? 'Select Organisations' : `Add ${checkedCount} Selected`,
        onClick: handleConfirm,
        tone: 'primary',
        disabled: checkedCount === 0,
        fullWidth: true,
      }]}
    >
      <div style={toolbarStyle}>
        <div style={searchWrapStyle}>
          <Search size={14} color="var(--color-text-muted, #9CA3AF)" />
          <input
            type="text"
            placeholder="Search organisations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={searchInputStyle}
          />
          {search && (
            <button onClick={() => setSearch('')} style={iconBtn} type="button">
              <X size={12} />
            </button>
          )}
        </div>

        <span style={{
          fontSize: '12px',
          color: checkedCount > 0 ? 'var(--color-primary, #2563EB)' : 'var(--color-text-muted, #6B7280)',
          fontWeight: checkedCount > 0 ? 600 : 400,
          whiteSpace: 'nowrap',
        }}>
          {checkedCount > 0 ? `${checkedCount} selected` : `${availableCount} available`}
        </span>
      </div>

      <div style={headerRowStyle}>
        <button onClick={toggleSelectAll} style={iconBtn} aria-label="Select all" type="button">
          {allChecked ? <CheckSquare size={16} /> : someChecked ? <Minus size={16} /> : <Square size={16} color="#9CA3AF" />}
        </button>
        <span style={headerSelectText}>Select all</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-muted, #9CA3AF)', fontSize: '13px' }}>
            No organisations match your search.
          </div>
        ) : (
          filtered.map((row) => (
            <div
              key={row.id}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--color-border, #F3F4F6)',
                background: row.alreadyMapped
                  ? 'var(--color-background, #F9FAFB)'
                  : row.checked
                    ? 'rgba(37,99,235,0.04)'
                    : 'transparent',
                opacity: row.alreadyMapped ? 0.65 : 1,
              }}
            >
              <div style={rowTopStyle}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: 0, flex: 1 }}>
                  {row.alreadyMapped ? (
                    <span style={{ width: '20px', display: 'flex', alignItems: 'center', marginTop: '2px' }}>
                      <Square size={16} color="#D1D5DB" />
                    </span>
                  ) : (
                    <button
                      onClick={() => toggleRow(row.id)}
                      style={{ ...iconBtn, color: row.checked ? 'var(--color-primary, #2563EB)' : '#9CA3AF', marginTop: '2px' }}
                      type="button"
                    >
                      {row.checked ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  )}
                  <div style={orgNameStyle}>{row.name}</div>
                </div>

                {row.alreadyMapped && (
                  <span style={mappedBadgeStyle}>MAPPED</span>
                )}
              </div>

              {!row.alreadyMapped && (
                <div style={dateGridStyle}>
                  <div>
                    <div style={fieldLabelStyle}>Effective From</div>
                    <input
                      type="date"
                      value={row.effectiveDate}
                      onChange={(e) => setDate(row.id, 'effectiveDate', e.target.value)}
                      style={dateInput}
                    />
                  </div>
                  <div>
                    <div style={fieldLabelStyle}>Expires On</div>
                    <input
                      type="date"
                      value={row.expirationDate}
                      onChange={(e) => setDate(row.id, 'expirationDate', e.target.value)}
                      style={dateInput}
                    />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </SmartDrawer>
  );
}

const toolbarStyle: React.CSSProperties = {
  padding: '12px 24px',
  borderBottom: '1px solid var(--color-border, #E5E7EB)',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  background: 'var(--color-background, #FAFAFA)',
};

const searchWrapStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flex: 1,
  background: 'var(--color-surface, #fff)',
  border: '1px solid var(--color-border, #E5E7EB)',
  borderRadius: '8px',
  padding: '0 12px',
  height: '36px',
};

const searchInputStyle: React.CSSProperties = {
  flex: 1,
  border: 'none',
  background: 'none',
  outline: 'none',
  fontSize: '13px',
  color: 'var(--color-text, #111827)',
};

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 16px',
  background: 'var(--color-background, #F3F4F6)',
  borderBottom: '1px solid var(--color-border, #E5E7EB)',
};

const headerSelectText: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--color-text-muted, #6B7280)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const dateInput: React.CSSProperties = {
  width: '100%',
  fontSize: '12px',
  padding: '5px 8px',
  border: '1px solid var(--color-border, #E5E7EB)',
  borderRadius: '6px',
  background: 'var(--color-surface, #fff)',
  color: 'var(--color-text, #111827)',
  outline: 'none',
};

const iconBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '2px',
  display: 'flex',
  alignItems: 'center',
};

const mappedBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 8px',
  background: '#F0F9FF',
  color: '#0369A1',
  borderRadius: '4px',
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.06em',
};

const rowTopStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '10px',
};

const orgNameStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--color-text, #111827)',
  lineHeight: 1.4,
  wordBreak: 'break-word',
};

const dateGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '8px',
  marginTop: '10px',
  paddingLeft: '30px',
};

const fieldLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  color: 'var(--color-text-muted, #6B7280)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '4px',
};
