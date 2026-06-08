// ─── HierarchyTemplateSection ─────────────────────────────────────────────────

import React from 'react';
import { ExternalLink, Info, Lock } from 'lucide-react';
import type { ConfigSectionProps } from './sectionTypes';
import { sCard, sHead, sBody } from './sectionStyles';
import { WAREHOUSE_ROUTES } from '../../utils/routeUtils';

export function HierarchyTemplateSection({ warehouse, templates }: ConfigSectionProps) {
  const isBinLevel = warehouse.inventoryControlMode === 'Location-BIN-Level';
  const activeTemplate = templates.find((t) => t.status === 'Active');

  if (!isBinLevel) {
    return (
      <div data-testid="section-hierarchy-template">
        <div style={{
          padding: '14px 18px', background: '#F0FDF4', border: '1px solid #BBF7D0',
          borderRadius: '8px', fontSize: '12px', color: '#166534', display: 'flex', gap: '8px',
        }}>
          <Lock size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            Hierarchy templates are not applicable for Warehouse-Level inventory mode.
            Switch to Location/BIN-Level mode in the Inventory Control section to enable hierarchy templates.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="section-hierarchy-template">
      <div style={sCard}>
        <div style={sHead}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Hierarchy Templates</span>
          <a
            href={WAREHOUSE_ROUTES.hierarchy(warehouse.id)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontSize: '11px', fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none',
            }}
          >
            <ExternalLink size={12} />
            Open Hierarchy Editor
          </a>
        </div>
        <div style={sBody}>
          {!activeTemplate && (
            <div style={{
              padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5',
              borderRadius: '8px', fontSize: '12px', color: '#991B1B', marginBottom: '14px',
            }}>
              No active hierarchy template found. The warehouse cannot be activated until an active template is configured.
            </div>
          )}

          {templates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 20px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              No hierarchy templates configured. Open the Hierarchy Editor to add one.
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 60px 80px 100px',
                gap: '8px', padding: '6px 0',
                borderBottom: '1px solid var(--color-border)',
                fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase',
              }}>
                <span>Template Code</span><span>Template Name</span>
                <span>Ver.</span><span>Status</span><span>Effective From</span>
              </div>
              {templates.map((t) => (
                <div key={t.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 60px 80px 100px',
                  gap: '8px', padding: '10px 0', borderBottom: '1px solid var(--color-border)',
                  alignItems: 'center', fontSize: '12px',
                }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{t.templateCode}</span>
                  <span>{t.templateName}</span>
                  <span>v{t.currentVersion.versionNumber}</span>
                  <span style={{
                    display: 'inline-flex', padding: '2px 7px', borderRadius: '9999px', fontSize: '10px', fontWeight: 600,
                    background: t.status === 'Active' ? '#DCFCE7' : t.status === 'Draft' ? '#F1F5F9' : '#FEF2F2',
                    color: t.status === 'Active' ? '#15803D' : t.status === 'Draft' ? '#475569' : '#991B1B',
                  }}>
                    {t.status}
                  </span>
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    {t.effectiveFrom?.slice(0, 10) ?? '—'}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '12px', padding: '10px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', fontSize: '11px', color: '#1E40AF', display: 'flex', gap: '6px' }}>
            <Info size={13} style={{ flexShrink: 0 }} />
            <span>
              Only one template can be Active at a time. Activate a template via the Hierarchy Editor.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
