import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Edit2, Eye, Filter, Trash2, X } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { AdminListPageShell } from '../../../../experience/components/AdminListPageShell';
import { SmartFormDrawer } from '../../../../experience/components/SmartFormDrawer';
import { SmartPreviewDrawer } from '../../../../experience/components/SmartPreviewDrawer';
import type { PreviewSection } from '../../../../experience/components/SmartPreviewDrawer/SmartPreviewDrawer.types';
import { SmartReviewDrawer } from '../../../../experience/components/SmartReviewDrawer';
import { findGroupForMasterKey, findMasterByKey } from '../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../adminStorage';
import {
  createMasterActionsColumn,
  createMasterIdentifierColumn,
  createMasterStatusColumn,
  createMasterTextColumn,
  MasterDataTable,
  MasterTableMetric,
  MasterTablePill,
  MasterTableTextCell,
  MasterTableTruncate,
} from '../../../../components/common/MasterDataTable';
import MasterFilterDrawer from '../../../../components/common/MasterFilterDrawer';
import type { DataGridColumn } from '../../../../components/common/dataGridTypes';
import type { ProductMaster, ProductStatus } from '../types/productMaster.types';
import { productMasterService } from '../services/productMaster.service';
import { PRODUCT_TYPES, MOCK_BRANDS } from '../constants/productMaster.constants';

function getStatusTone(status: ProductStatus): 'active' | 'draft' | 'inactive' | 'warning' {
  if (status === 'Active') return 'active';
  if (status === 'Draft') return 'draft';
  if (status === 'Inactive') return 'inactive';
  return 'warning';
}

function getMasterStatusTone(status: ProductStatus): 'success' | 'neutral' | 'danger' {
  if (status === 'Active') return 'success';
  if (status === 'Inactive') return 'danger';
  return 'neutral';
}

function brandName(brandId: string): string {
  return MOCK_BRANDS.find((brand) => brand.id === brandId)?.name ?? brandId ?? '-';
}

const MASTER_KEY = 'product-master';

function buildPreviewSections(product: ProductMaster): PreviewSection[] {
  const brand = brandName(product.brand);

  return [
    {
      title: 'Product Definition',
      fields: [
        { label: 'Product Code', value: product.productCode, mono: true },
        { label: 'Product Name', value: product.productName },
        { label: 'Product Type', value: product.productType || '-' },
        { label: 'Manufacturer', value: product.manufacturerOEM || '-' },
        { label: 'Country of Origin', value: product.countryOfOrigin || '-' },
        ...(product.productDescription ? [{ label: 'Description', value: product.productDescription, span: 2 as const }] : []),
      ],
    },
    {
      title: 'Classification & Hierarchy',
      fields: [
        { label: 'Product Class', value: product.productClass || '-' },
        { label: 'Category', value: product.productCategory || '-' },
        { label: 'Sub-category', value: product.productSubCategory || '-' },
        { label: 'Brand', value: brand || '-' },
        { label: 'SKU / Trade Item', value: product.skuTradeItem || '-' },
        { label: 'Model', value: product.modelBaseProduct || '-' },
      ],
    },
    {
      title: 'Unit of Measurement',
      fields: [
        { label: 'Base UOM', value: product.baseUOM || '-' },
        { label: 'Applicable UOMs', value: product.applicableUOMs.length > 0 ? product.applicableUOMs.map((uom) => uom.applicableUOM).join(', ') : '-' },
        { label: 'Scope Mappings', value: String(product.scopeMappings.length) },
      ],
    },
    {
      title: 'Operational Indicators',
      fields: [
        { label: 'Stockable', value: product.stockableIndicator ? 'Yes' : 'No' },
        { label: 'Sellable', value: product.sellableIndicator ? 'Yes' : 'No' },
        { label: 'Purchasable', value: product.purchasableIndicator ? 'Yes' : 'No' },
        { label: 'Batch Tracking', value: product.batchTrackingRequired ? 'Yes' : 'No' },
        { label: 'Warranty', value: product.warrantyApplicable ? 'Yes' : 'No' },
        { label: 'Sales Channels', value: product.salesChannelEligibility.length > 0 ? product.salesChannelEligibility.join(', ') : '-' },
      ],
    },
    {
      title: 'Status & Availability',
      fields: [
        { label: 'Status', value: product.productStatus },
        { label: 'Effective From', value: product.effectiveFromDate || '-' },
        { label: 'Effective To', value: product.effectiveToDate || '-' },
        { label: 'Identifiers', value: String(product.productIdentifiers.length) },
        { label: 'Associations', value: String(product.productAssociations.length) },
        ...(product.discontinuationDate ? [{ label: 'Discontinuation Date', value: product.discontinuationDate }] : []),
      ],
    },
  ];
}

const ProductListPage: React.FC = () => {
  const navigate = useNavigate();

  const [records, setRecords] = useState<ProductMaster[]>(() => productMasterService.getAll());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [activateTarget, setActivateTarget] = useState<ProductMaster | null>(null);
  const [activateOpen, setActivateOpen] = useState(false);

  const [inactivateTarget, setInactivateTarget] = useState<ProductMaster | null>(null);
  const [inactivateOpen, setInactivateOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ProductMaster | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [previewProduct, setPreviewProduct] = useState<ProductMaster | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  function showToast(message: string, tone: 'success' | 'error') {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    const master = findMasterByKey(MASTER_KEY);
    const group = findGroupForMasterKey(MASTER_KEY);
    if (master && group) {
      recordRecentAdminMaster({
        key: master.key,
        label: master.label,
        path: master.path,
        groupLabel: group.label,
        groupIconBg: group.iconBg,
        groupIconColor: group.iconColor,
      });
    }
  }, []);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return records.filter((product) => {
      if (filterStatus && product.productStatus !== filterStatus) return false;
      if (filterType && product.productType !== filterType) return false;

      if (query) {
        const haystack = [
          product.productCode,
          product.productName,
          product.productType,
          product.productCategory,
          product.productSubCategory,
          product.skuTradeItem,
        ].join(' ').toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [records, searchQuery, filterStatus, filterType]);

  function handleActivateClick(product: ProductMaster) {
    setActivateTarget(product);
    setActivateOpen(true);
  }

  function confirmActivate() {
    if (!activateTarget) return;
    productMasterService.activate(activateTarget.id);
    setRecords(productMasterService.getAll());
    if (previewProduct?.id === activateTarget.id) {
      setPreviewProduct(productMasterService.getById(activateTarget.id) ?? null);
    }
    setActivateOpen(false);
    showToast(`"${activateTarget.productName}" activated.`, 'success');
    setActivateTarget(null);
  }

  function handleInactivateClick(product: ProductMaster) {
    setInactivateTarget(product);
    setInactivateOpen(true);
  }

  function confirmInactivate() {
    if (!inactivateTarget) return;
    productMasterService.inactivate(inactivateTarget.id);
    setRecords(productMasterService.getAll());
    if (previewProduct?.id === inactivateTarget.id) {
      setPreviewProduct(productMasterService.getById(inactivateTarget.id) ?? null);
    }
    setInactivateOpen(false);
    showToast(`"${inactivateTarget.productName}" inactivated.`, 'success');
    setInactivateTarget(null);
  }

  function handleDeleteClick(product: ProductMaster) {
    setDeleteTarget(product);
    setDeleteOpen(true);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    productMasterService.delete(deleteTarget.id);
    setRecords(productMasterService.getAll());
    if (previewProduct?.id === deleteTarget.id) {
      setPreviewOpen(false);
      setPreviewProduct(null);
    }
    setDeleteOpen(false);
    showToast(`"${deleteTarget.productName}" deleted.`, 'success');
    setDeleteTarget(null);
  }

  const hasFilters = Boolean(filterStatus || filterType);

  const gridColumns: DataGridColumn<ProductMaster>[] = [
    createMasterIdentifierColumn<ProductMaster>({
      id: 'productCode',
      label: 'Code',
      getValue: (product) => product.productCode,
      onClick: (product) => {
        setPreviewProduct(product);
        setPreviewOpen(true);
      },
      width: 132,
      minWidth: 116,
    }),
    createMasterTextColumn<ProductMaster>({
      id: 'productName',
      label: 'Product',
      primary: (product) => product.productName,
      secondary: (product) => product.skuTradeItem && product.skuTradeItem !== product.productName ? product.skuTradeItem : undefined,
      title: (product) => product.productName,
      width: 270,
      minWidth: 220,
      hideable: false,
    }),
    {
      id: 'productType',
      label: 'Type',
      type: 'text',
      width: 156,
      minWidth: 136,
      getValue: (product) => product.productType || '-',
      renderCell: (product) => (
        product.productType
          ? <MasterTablePill label={product.productType} tone="info" />
          : <MasterTableTruncate value="-" />
      ),
    },
    {
      id: 'category',
      label: 'Category',
      type: 'text',
      width: 220,
      minWidth: 180,
      getValue: (product) => `${product.productCategory || '-'} ${product.productSubCategory || ''}`.trim(),
      renderCell: (product) => (
        <MasterTableTextCell
          primary={product.productCategory || '-'}
          secondary={product.productSubCategory || undefined}
          title={product.productCategory || product.productName}
        />
      ),
    },
    {
      id: 'brand',
      label: 'Brand',
      type: 'text',
      width: 160,
      minWidth: 136,
      getValue: (product) => brandName(product.brand),
      renderCell: (product) => <MasterTableTruncate value={brandName(product.brand) || '-'} />,
    },
    {
      id: 'uomCount',
      label: 'UOMs',
      type: 'number',
      width: 92,
      minWidth: 84,
      getValue: (product) => product.applicableUOMs.length,
      renderCell: (product) => (
        product.applicableUOMs.length > 0
          ? <MasterTableMetric value={String(product.applicableUOMs.length)} tone="success" />
          : <MasterTableTruncate value="-" />
      ),
    },
    createMasterStatusColumn<ProductMaster>({
      getStatus: (product) => product.productStatus,
      getTone: (status) => getMasterStatusTone(status as ProductStatus),
      width: 146,
      minWidth: 126,
      options: ['Draft', 'Active', 'Inactive', 'Discontinued'],
    }),
    createMasterActionsColumn<ProductMaster>({
      rowLabel: (product) => product.productName,
      inlineAction: (product) => ({
        label: 'Edit product',
        onClick: () => navigate(`/admin/product-master/${product.id}`),
        icon: <Edit2 size={13} />,
      }),
      menuActions: (product) => [
        {
          label: 'Preview',
          onSelect: () => {
            setPreviewProduct(product);
            setPreviewOpen(true);
          },
          icon: <Eye size={13} />,
        },
        {
          label: 'Edit',
          onSelect: () => navigate(`/admin/product-master/${product.id}`),
          icon: <Edit2 size={13} />,
        },
        {
          label: 'Activate',
          onSelect: () => handleActivateClick(product),
          icon: <Check size={13} />,
          hidden: product.productStatus !== 'Draft',
        },
        {
          label: 'Inactivate',
          onSelect: () => handleInactivateClick(product),
          icon: <X size={13} />,
          hidden: product.productStatus !== 'Active',
        },
        {
          label: 'Delete',
          onSelect: () => handleDeleteClick(product),
          icon: <Trash2 size={13} />,
          tone: 'danger',
          dividerBefore: true,
          hidden: product.productStatus !== 'Draft',
        },
      ],
      width: 120,
      minWidth: 108,
    }),
  ];

  return (
    <AdminShell>
      {toast ? (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, background: toast.tone === 'success' ? '#15803D' : '#DC2626', color: 'white', padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'opacity 0.3s' }}>
          {toast.message}
        </div>
      ) : null}

      <AdminListPageShell
        title="Product Master"
        description="Manage finished goods, spare parts, services, consumables, kits, and raw materials."
        breadcrumbs={['Admin', 'Products & Catalogue', 'Product Master']}
        primaryAction={{ label: '+ New Product', onClick: () => navigate('/admin/product-master/new') }}
        secondaryActions={[{
          label: 'Filters',
          onClick: () => setShowAdvancedFilters(true),
          icon: <Filter size={13} />,
          iconOnly: true,
          title: 'Open filters',
          active: hasFilters,
        }]}
        searchValue={searchQuery}
        searchPlaceholder="Search by code, name, type, or category..."
        onSearchChange={setSearchQuery}
      >
        <MasterDataTable
          gridId="product-master-table"
          ariaLabel="Products table"
          rows={filtered}
          columns={gridColumns}
          rowId={(product) => product.id}
          totalCount={records.length}
          emptyState={{
            title: records.length === 0 ? 'No products yet' : 'No products match the current filters',
            description: records.length === 0
              ? 'Add finished goods, spare parts, services, consumables, and kits to build your product catalog.'
              : 'Try adjusting your search or filters.',
            ...(records.length === 0
              ? { action: { label: 'New Product', onClick: () => navigate('/admin/product-master/new') } }
              : {}),
          }}
        />
      </AdminListPageShell>

      <MasterFilterDrawer
        open={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onReset={() => {
          setFilterStatus('');
          setFilterType('');
        }}
        description="Filter products by status and product type."
        fields={[
          {
            id: 'product-status',
            label: 'Status',
            value: filterStatus,
            placeholder: 'All statuses',
            options: ['Active', 'Draft', 'Inactive', 'Discontinued'].map((status) => ({ value: status, label: status })),
            onChange: (value) => setFilterStatus(value as ProductStatus | ''),
          },
          {
            id: 'product-type',
            label: 'Product Type',
            value: filterType,
            placeholder: 'All types',
            options: PRODUCT_TYPES.map((type) => ({ value: type, label: type })),
            onChange: setFilterType,
          },
        ]}
      />

      {previewProduct ? (
        <SmartPreviewDrawer
          open={previewOpen}
          onClose={() => {
            setPreviewOpen(false);
            setPreviewProduct(null);
          }}
          title={previewProduct.productName}
          subtitle={`${previewProduct.productCode} · ${previewProduct.productType || '-'}`}
          statusLabel={previewProduct.productStatus}
          statusTone={getStatusTone(previewProduct.productStatus)}
          sections={buildPreviewSections(previewProduct)}
          primaryAction={{ label: 'Edit', onClick: () => { setPreviewOpen(false); navigate(`/admin/product-master/${previewProduct.id}`); } }}
        />
      ) : null}

      <SmartReviewDrawer
        open={activateOpen}
        onClose={() => setActivateOpen(false)}
        title="Activate Product"
        subtitle={activateTarget?.productName}
        description="This will make the product available for use in transactions."
        checklist={[
          { id: 'name', label: 'Product Name is filled in', passed: !!activateTarget?.productName },
          { id: 'type', label: 'Product Type is selected', passed: !!activateTarget?.productType },
          { id: 'class', label: 'Product Class is assigned', passed: !!activateTarget?.productClass },
          { id: 'uom', label: 'Base UOM is defined', passed: !!activateTarget?.baseUOM },
          { id: 'scope', label: 'At least one scope mapping exists', passed: (activateTarget?.scopeMappings.length ?? 0) > 0 },
          { id: 'effdate', label: 'Effective From Date is set', passed: !!activateTarget?.effectiveFromDate },
        ]}
        confirmLabel="Activate"
        onConfirm={confirmActivate}
        onCancel={() => setActivateOpen(false)}
      />

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
