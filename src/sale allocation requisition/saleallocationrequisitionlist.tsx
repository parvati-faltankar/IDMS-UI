import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Ban,
  Eye,
  FileText,
  Filter,
  LayoutGrid,
  List,
  MoreVertical,
  PencilLine,
  Plus,
  Search,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import CancelDocumentDialog from '../components/common/CancelDocumentDialog';
import CatalogueInsightCards from '../components/common/CatalogueInsightCards';
import CatalogueFilterDrawer from '../components/common/CatalogueFilterDrawer';
import DocumentPreviewDrawer from '../components/common/DocumentPreviewDrawer';
import SortableTableHeader from '../components/common/SortableTableHeader';
import StatusBadge from '../components/common/StatusBadge';
import { cn } from '../utils/classNames';
import { buildCountInsight, formatInsightAmount, formatInsightCount, getInsightPercent, sumNumericValues } from '../utils/catalogueInsights';
import { formatDate, formatDateTime } from '../utils/dateFormat';
import type { SortState } from '../utils/sortState';
import { buildNumberColumnAggregation } from '../utils/tableColumnAggregations';
import type { RequisitionPriority, RequisitionStatus } from '../purchaseRequisitionCatalogueData';
import {
  emptyCatalogueFilters,
  getActiveFilterCount,
  validateDateRange,
  type CatalogueFilters,
} from '../catalogueFilters';
import {
  extendedSaleAllocationRequisitionDocuments,
  type SaleAllocationRequisitionDocument,
} from './saleAllocationRequisitionData';

interface SaleAllocationRequisitionListProps {
  onNew: () => void;
  onEdit: (documentId: string) => void;
  onNavigateToSaleAllocationRequisitionList: () => void;
}

type SortKey =
  | 'number'
  | 'requestDateTime'
  | 'customerName'
  | 'orderSource'
  | 'salesExecutive'
  | 'requestedDeliveryDate'
  | 'warehouse'
  | 'priority'
  | 'status'
  | 'totalAmount';

const SaleAllocationRequisitionList: React.FC<SaleAllocationRequisitionListProps> = ({
  onNew,
  onEdit,
  onNavigateToSaleAllocationRequisitionList,
}) => {
  const [documents, setDocuments] = useState<SaleAllocationRequisitionDocument[]>(
    extendedSaleAllocationRequisitionDocuments
  );
  const [filters, setFilters] = useState<CatalogueFilters>({ ...emptyCatalogueFilters });
  const [draftFilters, setDraftFilters] = useState<CatalogueFilters>({ ...emptyCatalogueFilters });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [dateRangeError, setDateRangeError] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [catalogueViewMode, setCatalogueViewMode] = useState<'list' | 'grid'>('list');
  const [sortState, setSortState] = useState<SortState<SortKey>>(null);
  const [activeInsightKey, setActiveInsightKey] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready'>('loading');
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [previewDocumentId, setPreviewDocumentId] = useState<string | null>(null);
  const [cancelDocumentId, setCancelDocumentId] = useState<string | null>(null);
  const actionMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (loadState !== 'loading') {
      return;
    }

    const timer = window.setTimeout(() => setLoadState('ready'), 220);
    return () => window.clearTimeout(timer);
  }, [loadState]);

  useEffect(() => {
    if (!openActionMenuId) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const menuNode = actionMenuRefs.current[openActionMenuId];
      if (menuNode && !menuNode.contains(event.target as Node)) {
        setOpenActionMenuId(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenActionMenuId(null);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [openActionMenuId]);

  const customerOptions = useMemo(
    () => Array.from(new Set(documents.map((item) => item.customerName))).sort(),
    [documents]
  );
  const warehouseOptions = useMemo(
    () => Array.from(new Set(documents.map((item) => item.warehouse))).sort(),
    [documents]
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch = tableSearch.trim().toLowerCase();

    return documents.filter((item) => {
      const matchesCustomer = !filters.supplier || item.customerName === filters.supplier;
      const matchesPriority = !filters.priority || item.priority === filters.priority;
      const matchesWarehouse = !filters.branch || item.warehouse === filters.branch;
      const matchesStartDate = !filters.startDate || item.requestedDeliveryDate >= filters.startDate;
      const matchesEndDate = !filters.endDate || item.requestedDeliveryDate <= filters.endDate;

      if (normalizedSearch.length === 0) {
        return matchesCustomer && matchesPriority && matchesWarehouse && matchesStartDate && matchesEndDate;
      }

      const matchesSearch =
        item.number.toLowerCase().includes(normalizedSearch) ||
        item.customerName.toLowerCase().includes(normalizedSearch) ||
        item.salesExecutive.toLowerCase().includes(normalizedSearch) ||
        item.orderSource.toLowerCase().includes(normalizedSearch) ||
        item.warehouse.toLowerCase().includes(normalizedSearch) ||
        item.status.toLowerCase().includes(normalizedSearch) ||
        item.priority.toLowerCase().includes(normalizedSearch);

      return matchesCustomer && matchesPriority && matchesWarehouse && matchesStartDate && matchesEndDate && matchesSearch;
    });
  }, [documents, filters, tableSearch]);

  const sortedRows = useMemo(() => {
    const totalValue = sumNumericValues(filteredRows, (item) => item.totalAmount);
    const averageValue = filteredRows.length ? totalValue / filteredRows.length : 0;
    const insightFilteredRows = filteredRows.filter((item) => {
      if (!activeInsightKey || activeInsightKey === 'all') {
        return true;
      }

      if (activeInsightKey === 'pending') {
        return item.status === 'Pending Approval';
      }

      if (activeInsightKey === 'approved') {
        return item.status === 'Approved';
      }

      if (activeInsightKey === 'high-value') {
        return Number.parseFloat(item.totalAmount || '0') >= averageValue;
      }

      return true;
    });

    if (!sortState) {
      return insightFilteredRows;
    }

    const priorityOrder: Record<Exclude<RequisitionPriority, 'Critical'>, number> = {
      Low: 1,
      Medium: 2,
      High: 3,
    };

    const statusOrder: Record<RequisitionStatus, number> = {
      Draft: 1,
      'Pending Approval': 2,
      Approved: 3,
      Rejected: 4,
      Cancelled: 5,
    };

    const directionFactor = sortState.direction === 'asc' ? 1 : -1;
    const rows = [...insightFilteredRows];

    rows.sort((left, right) => {
      let comparison = 0;

      switch (sortState.key) {
        case 'number':
          comparison = left.number.localeCompare(right.number, undefined, { numeric: true });
          break;
        case 'requestDateTime':
          comparison = new Date(left.requestDateTime).getTime() - new Date(right.requestDateTime).getTime();
          break;
        case 'customerName':
          comparison = left.customerName.localeCompare(right.customerName);
          break;
        case 'orderSource':
          comparison = left.orderSource.localeCompare(right.orderSource);
          break;
        case 'salesExecutive':
          comparison = left.salesExecutive.localeCompare(right.salesExecutive);
          break;
        case 'requestedDeliveryDate':
          comparison = new Date(left.requestedDeliveryDate).getTime() - new Date(right.requestedDeliveryDate).getTime();
          break;
        case 'warehouse':
          comparison = left.warehouse.localeCompare(right.warehouse);
          break;
        case 'priority':
          comparison = priorityOrder[left.priority] - priorityOrder[right.priority];
          break;
        case 'status':
          comparison = statusOrder[left.status] - statusOrder[right.status];
          break;
        case 'totalAmount':
          comparison = Number.parseFloat(left.totalAmount) - Number.parseFloat(right.totalAmount);
          break;
      }

      if (comparison === 0) {
        comparison = left.number.localeCompare(right.number, undefined, { numeric: true });
      }

      return comparison * directionFactor;
    });

    return rows;
  }, [activeInsightKey, filteredRows, sortState]);

  const insightItems = useMemo(() => {
    const total = filteredRows.length;
    const pending = filteredRows.filter((item) => item.status === 'Pending Approval').length;
    const approved = filteredRows.filter((item) => item.status === 'Approved').length;
    const totalValue = sumNumericValues(filteredRows, (item) => item.totalAmount);
    const averageValue = total ? totalValue / total : 0;
    const highValue = filteredRows.filter((item) => Number.parseFloat(item.totalAmount || '0') >= averageValue).length;

    return [
      buildCountInsight({
        key: 'all',
        label: 'Visible requests',
        count: total,
        total,
        support: `${formatInsightCount(total)} allocation requisitions`,
        hint: `${formatInsightAmount(totalValue)} requested value`,
        tone: 'neutral',
      }),
      buildCountInsight({
        key: 'pending',
        label: 'Pending approval',
        count: pending,
        total,
        support: `${pending} requests need review`,
        hint: `${getInsightPercent(pending, total)}% pending`,
        tone: 'warning',
      }),
      buildCountInsight({
        key: 'approved',
        label: 'Approved',
        count: approved,
        total,
        support: `${approved} requests approved`,
        hint: `${getInsightPercent(approved, total)}% approved`,
        tone: 'success',
      }),
      buildCountInsight({
        key: 'high-value',
        label: 'High value requests',
        count: highValue,
        total,
        support: `${highValue} above average value`,
        hint: `Average ${formatInsightAmount(averageValue)}`,
        tone: 'primary',
      }),
    ];
  }, [filteredRows]);

  const cancelDocument = useMemo(
    () => documents.find((document) => document.id === cancelDocumentId) ?? null,
    [cancelDocumentId, documents]
  );
  const previewDocument = useMemo(
    () => documents.find((document) => document.id === previewDocumentId) ?? null,
    [documents, previewDocumentId]
  );
  const activeFilterCount = useMemo(() => getActiveFilterCount(filters), [filters]);
  const hasActiveFilters = activeFilterCount > 0;
  const totalAmountAggregation = useMemo(
    () =>
      buildNumberColumnAggregation(sortedRows, {
        selector: (item) => item.totalAmount,
        formatter: formatInsightAmount,
      }),
    [sortedRows]
  );

  const handleSortChange = (key: SortKey, direction: 'asc' | 'desc' | null) => {
    setSortState(direction ? { key, direction } : null);
  };

  const openFilterDrawer = () => {
    setDraftFilters(filters);
    setDateRangeError('');
    setIsFilterDrawerOpen(true);
  };

  const handleFilterChange = (field: keyof CatalogueFilters, value: string) => {
    const nextFilters = {
      ...draftFilters,
      [field]: value,
    };

    setDraftFilters(nextFilters);
    setDateRangeError(validateDateRange(nextFilters));
  };

  const handleApplyFilters = () => {
    const validationError = validateDateRange(draftFilters);
    if (validationError) {
      setDateRangeError(validationError);
      return;
    }

    setFilters(draftFilters);
    setIsFilterDrawerOpen(false);
  };

  const handleResetFilters = () => {
    const nextFilters = { ...emptyCatalogueFilters };
    setFilters(nextFilters);
    setDraftFilters(nextFilters);
    setActiveInsightKey(null);
    setDateRangeError('');
    setIsFilterDrawerOpen(false);
  };

  const handleConfirmCancelDocument = () => {
    if (!cancelDocumentId) {
      return;
    }

    setDocuments((current) =>
      current.map((document) =>
        document.id === cancelDocumentId ? { ...document, status: 'Cancelled' } : document
      )
    );
    setCancelDocumentId(null);
  };

  const handlePreviewDocument = (documentId: string) => {
    setPreviewDocumentId(documentId);
    setOpenActionMenuId(null);
  };

  const renderActionMenu = (item: SaleAllocationRequisitionDocument) => (
    <div
      className="catalogue-action-menu"
      ref={(node) => {
        actionMenuRefs.current[item.id] = node;
      }}
    >
      <button
        type="button"
        className="catalogue-action-menu__trigger"
        onClick={() => setOpenActionMenuId((current) => (current === item.id ? null : item.id))}
        aria-label={`Open actions for ${item.number}`}
        aria-haspopup="menu"
        aria-expanded={openActionMenuId === item.id}
      >
        <MoreVertical size={15} />
      </button>

      {openActionMenuId === item.id && (
        <div className="catalogue-action-menu__panel" role="menu" aria-label={`Actions for ${item.number}`}>
          <button type="button" className="catalogue-action-menu__item" role="menuitem" onClick={() => handlePreviewDocument(item.id)}>
            <Eye size={16} />
            View
          </button>
          <button type="button" className="catalogue-action-menu__item" role="menuitem" onClick={() => onEdit(item.id)}>
            <PencilLine size={16} />
            Edit
          </button>
          <button
            type="button"
            className="catalogue-action-menu__item catalogue-action-menu__item--danger"
            role="menuitem"
            disabled={item.status === 'Cancelled'}
            onClick={() => {
              setOpenActionMenuId(null);
              setCancelDocumentId(item.id);
            }}
          >
            <Ban size={16} />
            Cancel
          </button>
        </div>
      )}
    </div>
  );

  return (
    <AppShell
      activeLeaf="sale-allocation-requisition"
      onSaleAllocationRequisitionClick={onNavigateToSaleAllocationRequisitionList}
    >
      <div className="catalogue-toolbar">
        <div className="catalogue-toolbar__inner catalogue-toolbar__inner--stacked">
          <div className="catalogue-toolbar__top">
            <div className="catalogue-toolbar__heading">
              <div className="catalogue-toolbar__title-row">
                <button type="button" className="catalogue-toolbar__title-button" aria-label="Sale allocation requisition catalogue">
                  <h2 className="brand-page-title">My Sale Allocation Requisition</h2>
                </button>
                <span className="catalogue-toolbar__count">{sortedRows.length}</span>
              </div>
            </div>

            <div className="catalogue-toolbar__actions">
              <div className="catalogue-toolbar__utility-group">
                <div className="catalogue-toolbar__search">
                  <Search size={16} className="catalogue-toolbar__search-icon" />
                  <input
                    type="search"
                    value={tableSearch}
                    onChange={(event) => setTableSearch(event.target.value)}
                    placeholder="Search..."
                    className="search-input catalogue-toolbar__search-input"
                    aria-label="Search sale allocation requisitions"
                  />
                </div>

                <div className="catalogue-view-toggle" role="group" aria-label="Sale allocation requisition view mode">
                  <button
                    type="button"
                    onClick={() => setCatalogueViewMode('list')}
                    className={cn('catalogue-view-toggle__button', catalogueViewMode === 'list' && 'catalogue-view-toggle__button--active')}
                    aria-pressed={catalogueViewMode === 'list'}
                  >
                    <List size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogueViewMode('grid')}
                    className={cn('catalogue-view-toggle__button', catalogueViewMode === 'grid' && 'catalogue-view-toggle__button--active')}
                    aria-pressed={catalogueViewMode === 'grid'}
                  >
                    <LayoutGrid size={16} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={openFilterDrawer}
                  className={cn('btn btn--outline btn--icon-left catalogue-filter-button', hasActiveFilters && 'catalogue-filter-button--active')}
                  aria-label={hasActiveFilters ? `Filter sale allocation requisitions. ${activeFilterCount} filters applied.` : 'Filter sale allocation requisitions'}
                >
                  <Filter size={16} />
                  Filters
                  {hasActiveFilters && <span className="catalogue-filter-button__badge">{activeFilterCount}</span>}
                </button>
              </div>

              <div className="catalogue-toolbar__primary-group">
                <button
                  type="button"
                  onClick={onNew}
                  className="btn btn--primary btn--icon-left catalogue-toolbar__primary-button"
                >
                  <Plus size={16} />
                  New
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-4 px-4 py-4">
        {loadState === 'ready' && (
          <CatalogueInsightCards
            items={insightItems}
            activeKey={activeInsightKey}
            ariaLabel="Sale allocation requisition insights"
            onSelect={(key) => setActiveInsightKey((current) => (current === key || key === 'all' ? null : key))}
          />
        )}

        {loadState === 'loading' && (
          <div className="space-y-3" aria-live="polite">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        )}

        {loadState === 'ready' && sortedRows.length === 0 && (
          <div className="flex flex-col items-center rounded border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
              <FileText size={28} className="text-slate-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">No sale allocation requisitions found</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-500">
              Adjust your filters or search a different customer, executive, or source.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {hasActiveFilters && (
                <button type="button" onClick={handleResetFilters} className="btn btn--outline">
                  Clear filters
                </button>
              )}
              <button type="button" onClick={onNew} className="btn btn--primary">
                Create New Sale Allocation Requisition
              </button>
            </div>
          </div>
        )}

        {loadState === 'ready' && sortedRows.length > 0 && catalogueViewMode === 'list' && (
          <div className="catalogue-table-scroll">
            <table className="catalogue-table">
              <thead>
                <tr>
                  <SortableTableHeader label="SAR No." sortKey="number" sortState={sortState} onSortChange={handleSortChange} />
                  <SortableTableHeader label="Document date & time" sortKey="requestDateTime" sortState={sortState} onSortChange={handleSortChange} dataType="date" />
                  <SortableTableHeader label="Customer" sortKey="customerName" sortState={sortState} onSortChange={handleSortChange} />
                  <SortableTableHeader label="Order source" sortKey="orderSource" sortState={sortState} onSortChange={handleSortChange} />
                  <SortableTableHeader label="Sales executive" sortKey="salesExecutive" sortState={sortState} onSortChange={handleSortChange} />
                  <SortableTableHeader label="Requested delivery" sortKey="requestedDeliveryDate" sortState={sortState} onSortChange={handleSortChange} dataType="date" />
                  <SortableTableHeader label="Warehouse" sortKey="warehouse" sortState={sortState} onSortChange={handleSortChange} />
                  <SortableTableHeader label="Priority" sortKey="priority" sortState={sortState} onSortChange={handleSortChange} dataType="status" />
                  <SortableTableHeader label="Status" sortKey="status" sortState={sortState} onSortChange={handleSortChange} dataType="status" />
                  <SortableTableHeader label="Total amount" sortKey="totalAmount" sortState={sortState} onSortChange={handleSortChange} dataType="number" aggregation={totalAmountAggregation} />
                  <th className="catalogue-table__action-header">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((item) => {
                  const documentDateTime = formatDateTime(item.requestDateTime);

                  return (
                    <tr key={item.id}>
                      <td>
                        <button type="button" onClick={() => handlePreviewDocument(item.id)} className="catalogue-table__document-link">
                          {item.number}
                        </button>
                      </td>
                      <td>
                        <div className="catalogue-table__datetime">
                          {documentDateTime.dateLabel}, {documentDateTime.timeLabel}
                        </div>
                      </td>
                      <td><div className="catalogue-table__truncate" title={item.customerName}>{item.customerName}</div></td>
                      <td>{item.orderSource}</td>
                      <td>{item.salesExecutive}</td>
                      <td>{formatDate(item.requestedDeliveryDate)}</td>
                      <td>{item.warehouse}</td>
                      <td><StatusBadge kind="priority" value={item.priority} /></td>
                      <td><StatusBadge kind="requisition-status" value={item.status} /></td>
                      <td>{item.totalAmount}</td>
                      <td className="catalogue-table__action-cell">{renderActionMenu(item)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {loadState === 'ready' && sortedRows.length > 0 && catalogueViewMode === 'grid' && (
          <div className="catalogue-card-grid">
            {sortedRows.map((item) => {
              const documentDateTime = formatDateTime(item.requestDateTime);

              return (
                <article key={item.id} className="catalogue-card">
                  <div className="catalogue-card__top">
                    <div className="catalogue-card__identity">
                      <button type="button" onClick={() => handlePreviewDocument(item.id)} className="catalogue-card__number">
                        {item.number}
                      </button>
                      <div className="catalogue-card__date">
                        {documentDateTime.dateLabel}, {documentDateTime.timeLabel}
                      </div>
                    </div>
                    <div className="catalogue-card__top-actions">
                      <StatusBadge kind="requisition-status" value={item.status} />
                      {renderActionMenu(item)}
                    </div>
                  </div>
                  <div className="catalogue-card__body">
                    <div className="catalogue-card__info-grid">
                      <span className="catalogue-card__label">Customer</span>
                      <span className="catalogue-card__value">{item.customerName}</span>
                      <span className="catalogue-card__label">Sales executive</span>
                      <span className="catalogue-card__value">{item.salesExecutive}</span>
                      <span className="catalogue-card__label">Requested delivery</span>
                      <span className="catalogue-card__value">{formatDate(item.requestedDeliveryDate)}</span>
                      <span className="catalogue-card__label">Warehouse</span>
                      <span className="catalogue-card__value">{item.warehouse}</span>
                      <span className="catalogue-card__label">Total amount</span>
                      <span className="catalogue-card__value">{item.totalAmount}</span>
                    </div>
                  </div>
                  <div className="catalogue-card__footer">
                    <StatusBadge kind="priority" value={item.priority} />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <CatalogueFilterDrawer
        isOpen={isFilterDrawerOpen}
        subtitle="Narrow down allocation requisitions by customer, priority, warehouse, and delivery window."
        draftFilters={draftFilters}
        primaryLabel="Customer"
        primaryOptions={customerOptions}
        branchLabel="Warehouse"
        branchOptions={warehouseOptions}
        dateFromLabel="Delivery from"
        dateToLabel="Delivery to"
        dateRangeError={dateRangeError}
        onClose={() => setIsFilterDrawerOpen(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        onFilterChange={handleFilterChange}
      />

      <DocumentPreviewDrawer
        document={previewDocument}
        isOpen={Boolean(previewDocument)}
        documentTypeLabel="Sale Allocation Requisition"
        subtitle="Sale Allocation Requisition preview"
        onClose={() => setPreviewDocumentId(null)}
        onEdit={(document) => onEdit(document.id)}
        onCancel={(document) => {
          setPreviewDocumentId(null);
          setCancelDocumentId(document.id);
        }}
        canEdit={previewDocument?.status !== 'Cancelled'}
        canCancel={previewDocument?.status !== 'Cancelled'}
      />

      <CancelDocumentDialog
        isOpen={Boolean(cancelDocument)}
        documentTypeLabel="sale allocation requisition"
        documentNumber={cancelDocument?.number ?? ''}
        onClose={() => setCancelDocumentId(null)}
        onConfirm={handleConfirmCancelDocument}
      />
    </AppShell>
  );
};

export default SaleAllocationRequisitionList;
