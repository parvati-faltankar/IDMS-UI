import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Filter, Package, Trash2 } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { AdminListPageShell } from '../../../../experience/components/AdminListPageShell';
import { SmartFormDrawer } from '../../../../experience/components/SmartFormDrawer';
import { SmartPreviewDrawer } from '../../../../experience/components/SmartPreviewDrawer';
import type { PreviewSection } from '../../../../experience/components/SmartPreviewDrawer/SmartPreviewDrawer.types';
import { SmartReviewDrawer } from '../../../../experience/components/SmartReviewDrawer';
import { findGroupForMasterKey, findMasterByKey } from '../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../adminStorage';
import type { ProductMaster, ProductStatus, ProductType } from '../types/productMaster.types';
import { productMasterService } from '../services/productMaster.service';
import { PRODUCT_TYPES, PRODUCT_TYPE_META, MOCK_BRANDS } from '../constants/productMaster.constants';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusStyle(status: ProductStatus): React.CSSProperties {
  if (status === 'Active')       return { background: '#DCFCE7', color: '#15803D' };
  if (status === 'Inactive')     return { background: '#FEF2F2', color: '#DC2626' };
  if (status === 'Discontinued') return { background: '#FEF3C7', color: '#92400E' };
  return { background: '#F1F5F9', color: '#64748B' }; // Draft
}

function getTypeStyle(type: ProductType): React.CSSProperties {
  const meta = PRODUCT_TYPE_META[type];
  return meta ? { background: meta.bgColor, color: meta.color } : { background: '#EFF6FF', color: '#1D4ED8' };
}

function brandName(brandId: string): string {
  return MOCK_BRANDS.find((b) => b.id === brandId)?.name ?? brandId ?? '—';
}

const BADGE_BASE: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  padding: '2px 8px', fontSize: '11px', fontWeight: 600,
  borderRadius: '9999px', whiteSpace: 'nowrap',
};

const GRID_COLUMNS = '88px minmax(200px,1fr) 120px minmax(140px,1fr) 110px 60px 100px 100px';

const COL_HEADERS = [
  { label: 'Code',     align: 'left'   },
  { label: 'Product',  align: 'left'   },
  { label: 'Type',     align: 'left'   },
  { label: 'Category', align: 'left'   },
  { label: 'Brand',    align: 'left'   },
  { label: 'UOMs',     align: 'center' },
  { label: 'Status',   align: 'left'   },
  { label: 'Actions',  align: 'right'  },
];

const MASTER_KEY = 'product-master';

// ─── Preview builder ──────────────────────────────────────────────────────────

function buildPreviewSections(p: ProductMaster): PreviewSection[] {
  const brand = brandName(p.brand);
  const sections: PreviewSection[] = [
    {
      title: 'Product Definition',
      fields: [
        { label: 'Product Code',      value: p.productCode, mono: true },
        { label: 'Product Name',      value: p.productName },
        { label: 'Product Type',      value: p.productType || '—' },
        { label: 'Manufacturer',      value: p.manufacturerOEM || '—' },
        { label: 'Country of Origin', value: p.countryOfOrigin || '—' },
        ...(p.productDescription ? [{ label: 'Description', value: p.productDescription, span: 2 as const }] : []),
      ],
    },
    {
      title: 'Classification & Hierarchy',
      fields: [
        { label: 'Product Class',    value: p.productClass || '—' },
        { label: 'Category',         value: p.productCategory || '—' },
        { label: 'Sub-category',     value: p.productSubCategory || '—' },
        { label: 'Brand',            value: brand || '—' },
        { label: 'SKU / Trade Item', value: p.skuTradeItem || '—' },
        { label: 'Model',            value: p.modelBaseProduct || '—' },
      ],
    },
    {
      title: 'Unit of Measurement',
      fields: [
        { label: 'Base UOM',        value: p.baseUOM || '—' },
        { label: 'Applicable UOMs', value: p.applicableUOMs.length > 0 ? p.applicableUOMs.map((u) => u.applicableUOM).join(', ') : '—' },
        { label: 'Scope Mappings',  value: String(p.scopeMappings.length) },
      ],
    },
    {
      title: 'Operational Indicators',
      fields: [
        { label: 'Stockable',      value: p.stockableIndicator    ? 'Yes' : 'No' },
        { label: 'Sellable',       value: p.sellableIndicator     ? 'Yes' : 'No' },
        { label: 'Purchasable',    value: p.purchasableIndicator  ? 'Yes' : 'No' },
        { label: 'Batch Tracking', value: p.batchTrackingRequired ? 'Yes' : 'No' },
        { label: 'Warranty',       value: p.warrantyApplicable    ? 'Yes' : 'No' },
        { label: 'Sales Channels', value: p.salesChannelEligibility.length > 0 ? p.salesChannelEligibility.join(', ') : '—' },
      ],
    },
    {
      title: 'Status & Availability',
      fields: [
        { label: 'Status',         value: p.productStatus },
        { label: 'Effective From', value: p.effectiveFromDate || '—' },
        { label: 'Effective To',   value: p.effectiveToDate || '—' },
        { label: 'Identifiers',    value: String(p.productIdentifiers.length) },
        { label: 'Associations',   value: String(p.productAssociations.length) },
        ...(p.discontinuationDate ? [{ label: 'Discontinuation Date', value: p.discontinuationDate }] : []),
      ],
    },
  ];
  return sections;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ProductListPage: React.FC = () => {
  const navigate = useNavigate();

  // ── Data ──────────────────────────────────────────────────────────────
  const [records, setRecords] = useState<ProductMaster[]>(() => productMasterService.getAll());

  // ── Filters ───────────────────────────────────────────────────────────
  const [searchQuery,         setSearchQuery]         = useState('');
  const [filterStatus,        setFilterStatus]        = useState('');
  const [filterType,          setFilterType]          = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // ── Activate flow ─────────────────────────────────────────────────────
  const [activateTarget, setActivateTarget] = useState<ProductMaster | null>(null);
  const [activateOpen,   setActivateOpen]   = useState(false);

  // ── Inactivate flow ───────────────────────────────────────────────────
  const [inactivateTarget, setInactivateTarget] = useState<ProductMaster | null>(null);
  const [inactivateOpen,   setInactivateOpen]   = useState(false);

  // ── Delete flow ───────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<ProductMaster | null>(null);
  const [deleteOpen,   setDeleteOpen]   = useState(false);

  // ── Preview ───────────────────────────────────────────────────────────
  const [previewProduct, setPreviewProduct] = useState<ProductMaster | null>(null);
  const [previewOpen,    setPreviewOpen]    = useState(false);

  // ── Toast ─────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  function showToast(message: string, tone: 'success' | 'error') {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Recent master tracking ────────────────────────────────────────────
  useEffect(() => {
    const master = findMasterByKey(MASTER_KEY);
    const group  = findGroupForMasterKey(MASTER_KEY);
    if (master && group) {
      recordRecentAdminMaster({
        key: master.key, label: master.label, path: master.path,
        groupLabel: group.label, groupIconBg: group.iconBg, groupIconColor: group.iconColor,
      });
    }
  }, []);

  // ── Filtered list ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((p) => {
      if (filterStatus && p.productStatus !== filterStatus) return false;
      if (filterType   && p.productType   !== filterType)   return false;
      if (q) {
        const hay = `${p.productCode} ${p.productName} ${p.productType} ${p.productCategory} ${p.productSubCategory} ${p.skuTradeItem}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [records, searchQuery, filterStatus, filterType]);

  // ── Summary counts ────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    all:          records.length,
    Active:       records.filter((p) => p.productStatus === 'Active').length,
    Draft:        records.filter((p) => p.productStatus === 'Draft').length,
    Inactive:     records.filter((p) => p.productStatus === 'Inactive').length,
    Discontinued: records.filter((p) => p.productStatus === 'Discontinued').length,
  }), [records]);

  // ── Actions ───────────────────────────────────────────────────────────
  function handleActivateClick(p: ProductMaster, e: React.MouseEvent) {
    e.stopPropagation();
    setActivateTarget(p); setActivateOpen(true);
  }
  function confirmActivate() {
    if (!activateTarget) return;
    productMasterService.activate(activateTarget.id);
    setRecords(productMasterService.getAll());
    setActivateOpen(false);
    showToast(`"${activateTarget.productName}" activated.`, 'success');
    setActivateTarget(null);
  }

  function handleInactivateClick(p: ProductMaster, e: React.MouseEvent) {
    e.stopPropagation();
    setInactivateTarget(p); setInactivateOpen(true);
  }
  function confirmInactivate() {
    if (!inactivateTarget) return;
    productMasterService.inactivate(inactivateTarget.id);
    setRecords(productMasterService.getAll());
    setInactivateOpen(false);
    showToast(`"${inactivateTarget.productName}" inactivated.`, 'success');
    setInactivateTarget(null);
  }

  function handleDeleteClick(p: ProductMaster, e: React.MouseEvent) {
    e.stopPropagation();
    setDeleteTarget(p); setDeleteOpen(true);
  }
  function confirmDelete() {
    if (!deleteTarget) return;
    productMasterService.delete(deleteTarget.id);
    setRecords(productMasterService.getAll());
    setDeleteOpen(false);
    showToast(`"${deleteTarget.productName}" deleted.`, 'success');
    setDeleteTarget(null);
  }

  // ── Toolbar filter panel ──────────────────────────────────────────────
  const inputBase: React.CSSProperties = {
    width: '100%', padding: '6px 10px', fontSize: '12px',
    border: '1px solid var(--color-border)', borderRadius: '7px',
    background: 'var(--color-surface)', color: 'var(--color-text)',
    outline: 'none', boxSizing: 'border-box',
  };

  const toolbarActions = (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setShowAdvancedFilters((v) => !v)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0 10px', height: '30px', fontSize: '12px', fontWeight: 500, border: `1px solid ${filterType ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: '8px', background: filterType ? 'color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))' : 'transparent', color: filterType ? 'var(--color-primary)' : 'var(--color-text-muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}
      >
        <Filter size={11} />
        Filters
        {filterType && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0 }} />}
        <ChevronDown size={10} style={{ transform: showAdvancedFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {showAdvancedFilters && (
        <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 200, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.10)', padding: '16px 18px', minWidth: '210px', marginTop: '6px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>Filter by Type</p>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={inputBase}>
            <option value="">All types</option>
            {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button type="button" onClick={() => { setFilterType(''); setShowAdvancedFilters(false); }}
            style={{ marginTop: '10px', fontSize: '11px', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            Clear filter
          </button>
        </div>
      )}
    </div>
  );

  // ── Quick filter chips ────────────────────────────────────────────────
  const activeFilter = filterStatus || 'all';

  const quickFilterItems = [
    { key: 'all',          label: 'All',          count: counts.all          },
    { key: 'Active',       label: 'Active',       count: counts.Active       },
    { key: 'Draft',        label: 'Draft',        count: counts.Draft        },
    { key: 'Inactive',     label: 'Inactive',     count: counts.Inactive     },
    { key: 'Discontinued', label: 'Discontinued', count: counts.Discontinued },
  ];

  // ── Table ─────────────────────────────────────────────────────────────
  const tableHeader = (
    <div style={{ display: 'grid', gridTemplateColumns: GRID_COLUMNS, alignItems: 'center', height: '36px', padding: '0 16px', borderBottom: '1.5px solid var(--color-border)', background: 'var(--color-surface-subtle)', position: 'sticky', top: 0, zIndex: 10 }}>
      {COL_HEADERS.map(({ label, align }, i) => (
        <div key={i} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: align as React.CSSProperties['textAlign'], paddingRight: i < COL_HEADERS.length - 1 ? '8px' : '0' }}>
          {label}
        </div>
      ))}
    </div>
  );

  const tableBody = filtered.length === 0 ? (
    <div style={{ padding: '60px 28px', textAlign: 'center', background: 'var(--color-surface)' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        {records.length === 0
          ? <Package size={20} style={{ color: 'var(--color-text-muted)' }} />
          : <Filter  size={20} style={{ color: 'var(--color-text-muted)' }} />}
      </div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
        {records.length === 0 ? 'No products yet' : 'No products match the current filters'}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', maxWidth: '360px', margin: '0 auto 20px', lineHeight: 1.6 }}>
        {records.length === 0
          ? 'Add finished goods, spare parts, services, consumables, and kits to build your product catalog.'
          : 'Try adjusting your search or filters.'}
      </div>
      {records.length === 0 && (
        <button type="button" onClick={() => navigate('/admin/product-master/new')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0 16px', height: '32px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer' }}>
          + New Product
        </button>
      )}
    </div>
  ) : (
    <>
      {filtered.map((p, idx) => {
        const isLast = idx === filtered.length - 1;
        const bName  = brandName(p.brand);

        return (
          <div
            key={p.id}
            style={{ display: 'grid', gridTemplateColumns: GRID_COLUMNS, alignItems: 'center', height: '44px', padding: '0 16px', borderBottom: isLast ? 'none' : '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 0.10s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-subtle)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
            onClick={() => { setPreviewProduct(p); setPreviewOpen(true); }}
          >
            {/* Code */}
            <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
              {p.productCode}
            </div>

            {/* Product name + SKU */}
            <div style={{ paddingRight: '8px', overflow: 'hidden' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.productName}</div>
              {p.skuTradeItem && p.skuTradeItem !== p.productName && (
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.skuTradeItem}</div>
              )}
            </div>

            {/* Type */}
            <div style={{ paddingRight: '8px' }}>
              {p.productType
                ? <span style={{ ...BADGE_BASE, ...getTypeStyle(p.productType as ProductType) }}>{p.productType}</span>
                : <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>—</span>}
            </div>

            {/* Category / Subcategory */}
            <div style={{ paddingRight: '8px', overflow: 'hidden' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.productCategory || '—'}</div>
              {p.productSubCategory && (
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.productSubCategory}</div>
              )}
            </div>

            {/* Brand */}
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
              {bName || '—'}
            </div>

            {/* UOM count */}
            <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, color: p.applicableUOMs.length > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)', paddingRight: '8px' }}>
              {p.applicableUOMs.length > 0 ? p.applicableUOMs.length : '—'}
            </div>

            {/* Status */}
            <div style={{ paddingRight: '8px' }}>
              <span style={{ ...BADGE_BASE, ...getStatusStyle(p.productStatus) }}>{p.productStatus}</span>
            </div>

            {/* Row actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
              {/* Edit */}
              <button type="button" title="Edit" onClick={() => navigate(`/admin/product-master/${p.id}`)}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '7px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>

              {/* Activate — Draft only */}
              {p.productStatus === 'Draft' && (
                <button type="button" title="Activate" onClick={(e) => handleActivateClick(p, e)}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '7px', border: '1px solid #BBF7D0', background: '#F0FDF4', cursor: 'pointer', color: '#15803D' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
              )}

              {/* Inactivate — Active only */}
              {p.productStatus === 'Active' && (
                <button type="button" title="Inactivate" onClick={(e) => handleInactivateClick(p, e)}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '7px', border: '1px solid #FECACA', background: '#FEF2F2', cursor: 'pointer', color: '#DC2626' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}

              {/* Delete — Draft only */}
              {p.productStatus === 'Draft' && (
                <button type="button" title="Delete" onClick={(e) => handleDeleteClick(p, e)}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '7px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: '#DC2626' }}>
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </>
  );

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <AdminShell>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, background: toast.tone === 'success' ? '#15803D' : '#DC2626', color: 'white', padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'opacity 0.3s' }}>
          {toast.message}
        </div>
      )}

      <AdminListPageShell
        title="Product Master"
        description="Manage finished goods, spare parts, services, consumables, kits, and raw materials."
        breadcrumbs={['Admin', 'Products & Catalogue', 'Product Master']}
        primaryAction={{ label: '+ New Product', onClick: () => navigate('/admin/product-master/new') }}
        searchValue={searchQuery}
        searchPlaceholder="Search by code, name, type, or category…"
        onSearchChange={setSearchQuery}
        quickFilterItems={quickFilterItems}
        activeQuickFilter={activeFilter}
        onQuickFilterChange={(key) => setFilterStatus(key === 'all' ? '' : key)}
        toolbarActions={toolbarActions}
      >
        {/* ── Table ── */}
        <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          {tableHeader}
          {tableBody}
        </div>
      </AdminListPageShell>

      {/* ── Preview Drawer ── */}
      {previewProduct && (
        <SmartPreviewDrawer
          open={previewOpen}
          onClose={() => { setPreviewOpen(false); setPreviewProduct(null); }}
          title={previewProduct.productName}
          subtitle={`${previewProduct.productCode} · ${previewProduct.productType}`}
          statusBadge={{ label: previewProduct.productStatus, style: getStatusStyle(previewProduct.productStatus) }}
          sections={buildPreviewSections(previewProduct)}
          onEdit={() => { setPreviewOpen(false); navigate(`/admin/product-master/${previewProduct.id}`); }}
        />
      )}

      {/* ── Activate confirm ── */}
      <SmartReviewDrawer
        open={activateOpen}
        onClose={() => setActivateOpen(false)}
        title="Activate Product"
        subtitle={activateTarget?.productName}
        description="This will make the product available for use in transactions."
        checklist={[
          { id: 'name',    label: 'Product Name is filled in',         passed: !!activateTarget?.productName },
          { id: 'type',    label: 'Product Type is selected',          passed: !!activateTarget?.productType },
          { id: 'class',   label: 'Product Class is assigned',         passed: !!activateTarget?.productClass },
          { id: 'uom',     label: 'Base UOM is defined',               passed: !!activateTarget?.baseUOM },
          { id: 'scope',   label: 'At least one scope mapping exists', passed: (activateTarget?.scopeMappings.length ?? 0) > 0 },
          { id: 'effdate', label: 'Effective From Date is set',        passed: !!activateTarget?.effectiveFromDate },
        ]}
        confirmLabel="Activate"
        onConfirm={confirmActivate}
        onCancel={() => setActivateOpen(false)}
      />

      {/* ── Inactivate drawer ── */}
      <SmartFormDrawer
        open={inactivateOpen}
        onClose={() => setInactivateOpen(false)}
        title="Inactivate Product"
        subtitle={inactivateTarget?.productName}
        onSave={confirmInactivate}
        onCancel={() => setInactivateOpen(false)}
        saveLabel="Inactivate"
      >
        <div style={{ paddingBottom: '8px' }}>
          <div style={{ padding: '10px 14px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '8px' }}>
            <span style={{ fontSize: '12px', color: '#9A3412' }}>
              This product will no longer be available for new transactions. Existing transactions will not be affected.
            </span>
          </div>
        </div>
      </SmartFormDrawer>

      {/* ── Delete confirm ── */}
      <SmartReviewDrawer
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Product"
        subtitle={deleteTarget?.productName}
        description="This action cannot be undone. Only Draft records can be deleted."
        checklist={[{ id: 'draft', label: 'Record is in Draft status', passed: deleteTarget?.productStatus === 'Draft' }]}
        warningText="Deletion is permanent. Consider inactivating the product instead."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </AdminShell>
  );
};

export default ProductListPage;
