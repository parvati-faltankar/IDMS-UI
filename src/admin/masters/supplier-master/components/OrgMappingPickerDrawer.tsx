import React, { useEffect, useMemo, useState } from 'react';
import { X, Search, Square, CheckSquare, Minus } from 'lucide-react';
import type { BPOrgMapping } from '../types/supplierMaster.types';
import { MOCK_ORGANISATIONS } from '../constants/supplierMaster.constants';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export function OrgMappingPickerDrawer({
  open,
  onClose,
  existingMappingOrgIds,
  onConfirm,
}: OrgMappingPickerDrawerProps) {
  const [search, setSearch]   = useState('');
  const [rows,   setRows]     = useState<OrgRow[]>([]);

  // Reset rows every time the drawer opens
  useEffect(() => {
    if (!open) return;
    setSearch('');
    setRows(
      MOCK_ORGANISATIONS.map((org) => ({
        id:              org.id,
        name:            org.name,
        checked:         false,
        effectiveDate:   '',
        expirationDate:  '',
        alreadyMapped:   existingMappingOrgIds.includes(org.id),
      }))
    );
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(
    () => rows.filter((r) => r.name.toLowerCase().includes(search.toLowerCase())),
    [rows, search]
  );

  const selectableFiltered = filtered.filter((r) => !r.alreadyMapped);
  const checkedCount       = rows.filter((r) => r.checked).length;
  const allChecked         = selectableFiltered.length > 0 && selectableFiltered.every((r) => r.checked);
  const someChecked        = selectableFiltered.some((r) => r.checked) && !allChecked;
  const availableCount     = rows.filter((r) => !r.alreadyMapped).length;

  function toggleSelectAll() {
    const ids = new Set(selectableFiltered.map((r) => r.id));
    setRows((prev) => prev.map((r) => ids.has(r.id) ? { ...r, checked: !allChecked } : r));
  }

  function toggleRow(id: string) {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, checked: !r.checked } : r));
  }

  function setDate(id: string, field: 'effectiveDate' | 'expirationDate', value: string) {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  }

  function handleConfirm() {
    const selected = rows.filter((r) => r.checked && !r.alreadyMapped);
    const now      = Date.now();
    const mappings: BPOrgMapping[] = selected.map((r, i) => ({
      id:               `BPOM-${now}-${i}`,
      applyToAll:       false,
      organisationId:   r.id,
      organisationName: r.name,
      effectiveDate:    r.effectiveDate,
      expirationDate:   r.expirationDate,
      status:           'Active' as const,
    }));
    onConfirm(mappings);
  }

  if (!open) return null;

  // ── Styles ─────────────────────────────────────────────────────────────────

  const drawerStyle: React.CSSProperties = {
    position:      'fixed',
    right:         0,
    top:           0,
    bottom:        0,
    width:         '720px',
    maxWidth:      '96vw',
    background:    'var(--color-surface, #fff)',
    zIndex:        1300,
    display:       'flex',
    flexDirection: 'column',
    boxShadow:     '-4px 0 32px rgba(0,0,0,0.14)',
  };

  const dateInput: React.CSSProperties = {
    width:       '130px',
    fontSize:    '12px',
    padding:     '5px 8px',
    border:      '1px solid var(--color-border, #E5E7EB)',
    borderRadius: '6px',
    background:  'var(--color-surface, #fff)',
    color:       'var(--color-text, #111827)',
    outline:     'none',
  };

  const iconBtn: React.CSSProperties = {
    background: 'none',
    border:     'none',
    cursor:     'pointer',
    padding:    '2px',
    display:    'flex',
    alignItems: 'center',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:   'fixed',
          inset:      0,
          background: 'rgba(0,0,0,0.35)',
          zIndex:     1299,
        }}
      />

      {/* Drawer panel */}
      <div style={drawerStyle}>

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div style={{
          padding:       '20px 24px 16px',
          borderBottom:  '1px solid var(--color-border, #E5E7EB)',
          display:       'flex',
          alignItems:    'center',
          justifyContent:'space-between',
          flexShrink:    0,
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text, #111827)' }}>
              Add Organisation Mappings
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #6B7280)', marginTop: '3px' }}>
              Select organisations to map this business partner to. Use inline dates per row.
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ ...iconBtn, padding: '6px', color: 'var(--color-text-muted, #6B7280)', borderRadius: '6px' }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Toolbar ───────────────────────────────────────────────────────── */}
        <div style={{
          padding:       '12px 24px',
          borderBottom:  '1px solid var(--color-border, #E5E7EB)',
          display:       'flex',
          alignItems:    'center',
          gap:           '12px',
          flexShrink:    0,
          background:    'var(--color-background, #FAFAFA)',
        }}>
          {/* Search */}
          <div style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '8px',
            flex:         1,
            background:   'var(--color-surface, #fff)',
            border:       '1px solid var(--color-border, #E5E7EB)',
            borderRadius: '8px',
            padding:      '0 12px',
            height:       '36px',
          }}>
            <Search size={14} color="var(--color-text-muted, #9CA3AF)" />
            <input
              type="text"
              placeholder="Search organisations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex:       1,
                border:     'none',
                background: 'none',
                outline:    'none',
                fontSize:   '13px',
                color:      'var(--color-text, #111827)',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ ...iconBtn, color: 'var(--color-text-muted, #9CA3AF)' }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Count badge */}
          <span style={{
            fontSize:    '12px',
            color:       checkedCount > 0 ? 'var(--color-primary, #2563EB)' : 'var(--color-text-muted, #6B7280)',
            fontWeight:  checkedCount > 0 ? 600 : 400,
            whiteSpace:  'nowrap',
          }}>
            {checkedCount > 0 ? `${checkedCount} selected` : `${availableCount} available`}
          </span>
        </div>

        {/* ── Column headers ────────────────────────────────────────────────── */}
        <div style={{
          display:       'flex',
          alignItems:    'center',
          padding:       '8px 24px',
          background:    'var(--color-background, #F3F4F6)',
          borderBottom:  '1px solid var(--color-border, #E5E7EB)',
          flexShrink:    0,
        }}>
          {/* Select-all checkbox */}
          <div style={{ width: '36px', display: 'flex', alignItems: 'center' }}>
            <button
              onClick={toggleSelectAll}
              style={{ ...iconBtn, color: 'var(--color-primary, #2563EB)' }}
              aria-label="Select all"
            >
              {allChecked
                ? <CheckSquare size={16} />
                : someChecked
                  ? <Minus size={16} />
                  : <Square size={16} color="#9CA3AF" />
              }
            </button>
          </div>

          <div style={{ flex: 2, fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted, #6B7280)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Organisation
          </div>
          <div style={{ width: '150px', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted, #6B7280)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Effective From
          </div>
          <div style={{ width: '150px', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted, #6B7280)', textTransform: 'uppercase', letterSpacing: '0.05em', marginLeft: '8px' }}>
            Expires On
          </div>
          <div style={{ width: '70px' }} />
        </div>

        {/* ── Rows ──────────────────────────────────────────────────────────── */}
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
                  display:       'flex',
                  alignItems:    'center',
                  padding:       '10px 24px',
                  borderBottom:  '1px solid var(--color-border, #F3F4F6)',
                  background:    row.alreadyMapped
                    ? 'var(--color-background, #F9FAFB)'
                    : row.checked
                      ? 'rgba(37,99,235,0.04)'
                      : 'transparent',
                  opacity:       row.alreadyMapped ? 0.65 : 1,
                  transition:    'background 0.1s',
                }}
              >
                {/* Checkbox */}
                <div style={{ width: '36px', display: 'flex', alignItems: 'center' }}>
                  {row.alreadyMapped ? (
                    <span style={{ width: '20px', display: 'flex', alignItems: 'center' }}>
                      <Square size={16} color="#D1D5DB" />
                    </span>
                  ) : (
                    <button
                      onClick={() => toggleRow(row.id)}
                      style={{
                        ...iconBtn,
                        color: row.checked ? 'var(--color-primary, #2563EB)' : '#9CA3AF',
                      }}
                    >
                      {row.checked ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  )}
                </div>

                {/* Org name */}
                <div style={{
                  flex:       2,
                  fontSize:   '13px',
                  fontWeight: row.alreadyMapped ? 400 : 500,
                  color:      row.alreadyMapped
                    ? 'var(--color-text-muted, #9CA3AF)'
                    : 'var(--color-text, #111827)',
                }}>
                  {row.name}
                </div>

                {/* Effective From */}
                <div style={{ width: '150px' }}>
                  {row.alreadyMapped ? (
                    <span style={{
                      display:      'inline-flex',
                      alignItems:   'center',
                      padding:      '2px 8px',
                      background:   '#F0F9FF',
                      color:        '#0369A1',
                      borderRadius: '4px',
                      fontSize:     '10px',
                      fontWeight:   700,
                      letterSpacing:'0.06em',
                    }}>
                      MAPPED
                    </span>
                  ) : (
                    <input
                      type="date"
                      value={row.effectiveDate}
                      onChange={(e) => setDate(row.id, 'effectiveDate', e.target.value)}
                      style={dateInput}
                    />
                  )}
                </div>

                {/* Expires On */}
                <div style={{ width: '150px', marginLeft: '8px' }}>
                  {!row.alreadyMapped && (
                    <input
                      type="date"
                      value={row.expirationDate}
                      onChange={(e) => setDate(row.id, 'expirationDate', e.target.value)}
                      style={dateInput}
                    />
                  )}
                </div>

                <div style={{ width: '70px' }} />
              </div>
            ))
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <div style={{
          padding:        '16px 24px',
          borderTop:      '1px solid var(--color-border, #E5E7EB)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'flex-end',
          gap:            '10px',
          flexShrink:     0,
        }}>
          <button
            onClick={onClose}
            style={{
              padding:      '8px 18px',
              fontSize:     '13px',
              fontWeight:   500,
              color:        'var(--color-text, #374151)',
              background:   'none',
              border:       '1px solid var(--color-border, #D1D5DB)',
              borderRadius: '8px',
              cursor:       'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={checkedCount === 0}
            style={{
              padding:      '8px 20px',
              fontSize:     '13px',
              fontWeight:   600,
              color:        '#fff',
              background:   checkedCount === 0 ? '#9CA3AF' : 'var(--color-primary, #2563EB)',
              border:       'none',
              borderRadius: '8px',
              cursor:       checkedCount === 0 ? 'not-allowed' : 'pointer',
              transition:   'background 0.15s',
              minWidth:     '160px',
              textAlign:    'center',
            }}
          >
            {checkedCount === 0 ? 'Select Organisations' : `Add ${checkedCount} Selected`}
          </button>
        </div>

      </div>
    </>
  );
}
