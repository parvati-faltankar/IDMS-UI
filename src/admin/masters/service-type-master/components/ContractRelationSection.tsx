// ─── Contract Relation Section (Labour & Part) ────────────────────────────────

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import type { ContractRelationLabourRow, ContractRelationPartRow } from '../types/serviceTypeMaster.types';
import { ContractRelationDrawer, type CRRowType } from './ContractRelationDrawer';

// ─── Types ────────────────────────────────────────────────────────────────────

type AnyRow = ContractRelationLabourRow | ContractRelationPartRow;

interface ContractRelationSectionProps {
  type: CRRowType;
  rows: AnyRow[];
  onChange: (rows: AnyRow[]) => void;
}

// ─── Column config ────────────────────────────────────────────────────────────

const LABOUR_COLS = '100px 1fr 80px 80px 60px 80px 60px 50px';
const LABOUR_HEADERS = ['Service', 'Service Name', 'Min Usage', 'Max Usage', 'Hours', 'Contract', 'Mandatory', ''];

const PART_COLS = '100px 1fr 80px 80px 60px 80px 60px 50px';
const PART_HEADERS = ['Part', 'Part Name', 'Min Usage', 'Max Usage', 'Qty', 'Contract', 'Mandatory', ''];

// ─── Component ────────────────────────────────────────────────────────────────

export const ContractRelationSection: React.FC<ContractRelationSectionProps> = ({
  type, rows, onChange,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editRow, setEditRow] = useState<AnyRow | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const isLabour = type === 'labour';
  const title = isLabour ? 'Service Type Association For Labour' : 'Service Type Association For Part';
  const cols = isLabour ? LABOUR_COLS : PART_COLS;
  const headers = isLabour ? LABOUR_HEADERS : PART_HEADERS;

  function openAdd() {
    setEditRow(null);
    setDrawerOpen(true);
  }

  function openEdit(row: AnyRow) {
    setEditRow(row);
    setDrawerOpen(true);
  }

  function handleSave(row: AnyRow) {
    if (editRow) {
      onChange(rows.map((r) => (r.id === row.id ? row : r)));
    } else {
      onChange([...rows, row]);
    }
    setDrawerOpen(false);
  }

  function removeRow(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    onChange(rows.filter((r) => r.id !== id));
  }

  function getRowDisplay(row: AnyRow) {
    if (isLabour) {
      const lr = row as ContractRelationLabourRow;
      return {
        code: lr.service || '—',
        name: lr.serviceName || '—',
        minUsage: lr.minUsage || '—',
        maxUsage: lr.maxUsage || '—',
        extra: lr.hours || '—',
        contract: lr.applicableContract || '—',
        mandatory: lr.mandatory,
      };
    } else {
      const pr = row as ContractRelationPartRow;
      return {
        code: pr.part || '—',
        name: pr.partName || '—',
        minUsage: pr.minUsage || '—',
        maxUsage: pr.maxUsage || '—',
        extra: pr.qty || '0',
        contract: pr.applicableContract || '—',
        mandatory: pr.mandatory,
      };
    }
  }

  return (
    <>
      {/* Collapsible Card */}
      <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>

        {/* Header */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '12px 20px', background: 'var(--color-surface-subtle)', border: 'none', borderBottom: expanded ? '1px solid var(--color-border)' : 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {expanded ? <ChevronDown size={15} color="var(--color-text-muted)" /> : <ChevronRight size={15} color="var(--color-text-muted)" />}
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>{title}</span>
            {rows.length > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '20px', height: '20px', padding: '0 6px', borderRadius: '10px', background: 'var(--color-primary)', color: 'white', fontSize: '10px', fontWeight: 700 }}>
                {rows.length}
              </span>
            )}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            {rows.length === 0 ? 'No rows' : `${rows.length} row${rows.length > 1 ? 's' : ''}`}
          </span>
        </button>

        {/* Body */}
        {expanded && (
          <div style={{ background: 'var(--color-surface)' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: cols, gap: '8px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', padding: '0 14px', height: '34px', alignItems: 'center' }}>
              {headers.map((h, i) => (
                <div key={i} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
              ))}
            </div>

            {/* Empty state */}
            {rows.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                No rows added yet. Click &ldquo;+ Add Row&rdquo; to begin.
              </div>
            )}

            {/* Data rows */}
            {rows.map((row) => {
              const d = getRowDisplay(row);
              return (
                <div
                  key={row.id}
                  onClick={() => openEdit(row)}
                  onMouseEnter={() => setHoveredRow(row.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{ display: 'grid', gridTemplateColumns: cols, gap: '8px', padding: '0 14px', height: '44px', alignItems: 'center', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', background: hoveredRow === row.id ? 'var(--color-surface-subtle)' : 'var(--color-surface)', transition: 'background 0.1s' }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)', fontFamily: 'monospace' }}>{d.code}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text)', textAlign: 'center' }}>{d.minUsage}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text)', textAlign: 'center' }}>{d.maxUsage}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text)', textAlign: 'center' }}>{d.extra}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.contract}</div>
                  <div style={{ fontSize: '12px', color: d.mandatory ? '#15803D' : 'var(--color-text-muted)', fontWeight: d.mandatory ? 600 : 400 }}>
                    {d.mandatory ? 'Yes' : 'No'}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => removeRow(row.id, e)}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', border: '1px solid #FCA5A5', background: '#FEF2F2', borderRadius: '6px', cursor: 'pointer', color: '#DC2626' }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              );
            })}

            {/* Footer */}
            <div style={{ padding: '10px 14px', borderTop: rows.length > 0 ? '1px solid var(--color-border)' : 'none' }}>
              <button
                type="button"
                onClick={openAdd}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)', background: 'transparent', border: '1px solid var(--color-primary)', borderRadius: '6px', cursor: 'pointer' }}
              >
                <Plus size={12} /> Add Row
              </button>
            </div>
          </div>
        )}
      </div>

      <ContractRelationDrawer
        open={drawerOpen}
        type={type}
        editRow={editRow}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSave}
      />
    </>
  );
};
