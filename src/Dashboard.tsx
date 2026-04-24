import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock3,
  PackageCheck,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Users,
} from 'lucide-react';
import AppShell from './components/AppShell';
import StatusBadge from './components/common/StatusBadge';
import { extendedPurchaseRequisitionDocuments } from './purchaseRequisitionCatalogueData';
import { extendedPurchaseOrderDocuments } from './purchase order/purchaseOrderData';
import { extendedPurchaseOrderDocuments as extendedPurchaseReceiptDocuments } from './purhcase receipt/purchaseReceiptData';
import { extendedPurchaseOrderDocuments as extendedPurchaseInvoiceDocuments } from './purchase invoice/purchaseInvoiceData';
import { extendedSaleOrderDocuments } from './sale order/saleOrderData';
import { extendedSaleAllocationRequisitionDocuments } from './sale allocation requisition/saleAllocationRequisitionData';
import { extendedSaleAllocationDocuments } from './sale allocation/saleAllocationData';
import { extendedSaleInvoiceDocuments } from './sale invoice/saleInvoiceData';
import { extendedDeliveryDocuments } from './delivery/deliveryData';
import { cn } from './utils/classNames';
import { formatDate } from './utils/dateFormat';

type DashboardTab = 'overview' | 'sales' | 'procurement' | 'inventory' | 'services' | 'crm';

interface DashboardProps {
  onNavigateToDashboard: () => void;
  onNavigateToPurchaseRequisitionList: () => void;
  onNavigateToPurchaseOrderList: () => void;
  onNavigateToPurchaseReceiptList: () => void;
  onNavigateToPurchaseInvoiceList: () => void;
  onNavigateToSaleOrderList: () => void;
  onNavigateToSaleAllocationRequisitionList: () => void;
  onNavigateToSaleAllocationList: () => void;
  onNavigateToSaleInvoiceList: () => void;
  onNavigateToDeliveryList: () => void;
}

interface KpiCardProps {
  label: string;
  value: string;
  context: string;
  trend: string;
  icon: React.ElementType;
  tone?: 'primary' | 'success' | 'warning' | 'neutral';
  onClick?: () => void;
}

interface InsightCardProps {
  title: string;
  value: string;
  description: string;
  progress: number;
  actionLabel: string;
  onAction?: () => void;
}

interface ActivityItem {
  number: string;
  title: string;
  date: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Cancelled';
  amount?: string;
}

const dashboardTabs: Array<{ key: DashboardTab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'sales', label: 'Sales' },
  { key: 'procurement', label: 'Procurement' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'services', label: 'Services' },
  { key: 'crm', label: 'CRM' },
];

function isDashboardTab(value: string | null): value is DashboardTab {
  return Boolean(value && dashboardTabs.some((tab) => tab.key === value));
}

function getDashboardTabFromHash(): DashboardTab {
  const hashQuery = window.location.hash.split('?')[1] ?? '';
  const tab = new URLSearchParams(hashQuery).get('tab');
  return isDashboardTab(tab) ? tab : 'overview';
}

function parseAmount(value: string | undefined): number {
  return Number.parseFloat(value ?? '0') || 0;
}

function formatCompactCurrency(value: number): string {
  return `Rs ${new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

function getDatePart(value: string): string {
  return value.slice(0, 10);
}

function getLatestDate(values: string[]): string {
  return values.sort((left, right) => right.localeCompare(left))[0] ?? new Date().toISOString().slice(0, 10);
}

function countByStatus<T extends { status: string }>(records: T[], status: string): number {
  return records.filter((record) => record.status === status).length;
}

function getPercent(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }

  return Math.round((numerator / denominator) * 100);
}

function getRecentActivity(): ActivityItem[] {
  return [
    ...extendedSaleOrdersToActivity(),
    ...extendedPurchaseOrdersToActivity(),
    ...extendedDeliveryDocuments.slice(0, 3).map((item) => ({
      number: item.number,
      title: item.customerName,
      date: item.deliveryDateTime,
      status: item.status,
      amount: `${item.totalPackages} package(s)`,
    })),
  ]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 8);
}

function extendedSaleOrdersToActivity(): ActivityItem[] {
  return extendedSaleOrderDocuments.slice(0, 4).map((item) => ({
    number: item.number,
    title: item.customerName,
    date: item.orderDateTime,
    status: item.status,
    amount: item.totalAmount,
  }));
}

function extendedPurchaseOrdersToActivity(): ActivityItem[] {
  return extendedPurchaseOrderDocuments.slice(0, 4).map((item) => ({
    number: item.number,
    title: item.supplierName,
    date: item.orderDateTime,
    status: item.status,
    amount: item.totalAmount,
  }));
}

const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  context,
  trend,
  icon: Icon,
  tone = 'primary',
  onClick,
}) => (
  <button
    type="button"
    className={cn('dashboard-kpi-card', `dashboard-kpi-card--${tone}`)}
    onClick={onClick}
    disabled={!onClick}
  >
    <span className="dashboard-kpi-card__icon">
      <Icon size={18} />
    </span>
    <span className="dashboard-kpi-card__content">
      <span className="dashboard-kpi-card__label">{label}</span>
      <strong className="dashboard-kpi-card__value">{value}</strong>
      <span className="dashboard-kpi-card__context">{context}</span>
    </span>
    <span className="dashboard-kpi-card__trend">{trend}</span>
  </button>
);

const InsightCard: React.FC<InsightCardProps> = ({
  title,
  value,
  description,
  progress,
  actionLabel,
  onAction,
}) => (
  <article className="dashboard-insight-card">
    <div className="dashboard-insight-card__header">
      <span>{title}</span>
      <span className="dashboard-insight-card__pill">Live insight</span>
    </div>
    <strong className="dashboard-insight-card__value">{value}</strong>
    <div className="dashboard-progress" aria-label={`${title} ${progress}%`}>
      <span style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} />
    </div>
    <p>{description}</p>
    <button type="button" className="dashboard-link-button" onClick={onAction}>
      {actionLabel}
    </button>
  </article>
);

const TrendBars: React.FC<{ values: number[]; labels: string[] }> = ({ values, labels }) => {
  const maxValue = Math.max(...values, 1);

  return (
    <div className="dashboard-trend-bars" role="img" aria-label="Trend comparison chart">
      {values.map((value, index) => (
        <div className="dashboard-trend-bars__item" key={`${labels[index]}-${value}`}>
          <span className="dashboard-trend-bars__bar" style={{ height: `${Math.max((value / maxValue) * 100, 8)}%` }} />
          <span className="dashboard-trend-bars__label">{labels[index]}</span>
        </div>
      ))}
    </div>
  );
};

const ActivityList: React.FC<{ items: ActivityItem[] }> = ({ items }) => (
  <div className="dashboard-activity-list">
    {items.map((item) => (
      <div className="dashboard-activity-item" key={item.number}>
        <div>
          <strong>{item.number}</strong>
          <span>{item.title}</span>
        </div>
        <div className="dashboard-activity-item__meta">
          <span>{formatDate(getDatePart(item.date))}</span>
          <StatusBadge kind="requisition-status" value={item.status} />
          {item.amount && <span>{Number.isNaN(Number(item.amount)) ? item.amount : formatCompactCurrency(parseAmount(item.amount))}</span>}
        </div>
      </div>
    ))}
  </div>
);

const EmptyModulePanel: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <section className="dashboard-panel dashboard-empty-module">
    <div className="dashboard-empty-module__icon">
      <BarChart3 size={22} />
    </div>
    <div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  </section>
);

const Dashboard: React.FC<DashboardProps> = ({
  onNavigateToDashboard,
  onNavigateToPurchaseRequisitionList,
  onNavigateToPurchaseOrderList,
  onNavigateToPurchaseReceiptList,
  onNavigateToPurchaseInvoiceList,
  onNavigateToSaleOrderList,
  onNavigateToSaleAllocationRequisitionList,
  onNavigateToSaleAllocationList,
  onNavigateToSaleInvoiceList,
  onNavigateToDeliveryList,
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(() => getDashboardTabFromHash());
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setLastUpdatedAt(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const syncTabFromHash = () => setActiveTab(getDashboardTabFromHash());
    window.addEventListener('hashchange', syncTabFromHash);
    return () => window.removeEventListener('hashchange', syncTabFromHash);
  }, []);

  const snapshot = useMemo(() => {
    const salesReferenceDate = getLatestDate([
      ...extendedSaleOrderDocuments.map((item) => getDatePart(item.orderDateTime)),
      ...extendedSaleInvoiceDocuments.map((item) => getDatePart(item.invoiceDateTime)),
      ...extendedDeliveryDocuments.map((item) => getDatePart(item.deliveryDateTime)),
    ]);
    const procurementReferenceDate = getLatestDate([
      ...extendedPurchaseOrderDocuments.map((item) => getDatePart(item.orderDateTime)),
      ...extendedPurchaseReceiptDocuments.map((item) => getDatePart(item.orderDateTime)),
      ...extendedPurchaseInvoiceDocuments.map((item) => getDatePart(item.orderDateTime)),
    ]);

    const saleOrdersToday = extendedSaleOrderDocuments.filter(
      (item) => getDatePart(item.orderDateTime) === salesReferenceDate
    );
    const saleInvoicesToday = extendedSaleInvoiceDocuments.filter(
      (item) => getDatePart(item.invoiceDateTime) === salesReferenceDate
    );
    const deliveriesToday = extendedDeliveryDocuments.filter(
      (item) => getDatePart(item.deliveryDateTime) === salesReferenceDate
    );
    const purchaseOrdersToday = extendedPurchaseOrderDocuments.filter(
      (item) => getDatePart(item.orderDateTime) === procurementReferenceDate
    );

    const saleOrderValue = extendedSaleOrderDocuments.reduce((sum, item) => sum + parseAmount(item.totalAmount), 0);
    const invoiceValue = extendedSaleInvoiceDocuments.reduce((sum, item) => sum + parseAmount(item.totalAmount), 0);
    const purchaseValue = extendedPurchaseOrderDocuments.reduce((sum, item) => sum + parseAmount(item.totalAmount), 0);
    const pendingApprovals =
      countByStatus(extendedSaleOrderDocuments, 'Pending Approval') +
      countByStatus(extendedPurchaseOrderDocuments, 'Pending Approval') +
      countByStatus(extendedPurchaseRequisitionDocuments, 'Pending Approval') +
      countByStatus(extendedSaleInvoiceDocuments, 'Pending Approval');

    return {
      salesReferenceDate,
      procurementReferenceDate,
      saleOrdersToday,
      saleInvoicesToday,
      deliveriesToday,
      purchaseOrdersToday,
      saleOrderValue,
      invoiceValue,
      purchaseValue,
      pendingApprovals,
      approvedSalesPercent: getPercent(countByStatus(extendedSaleOrderDocuments, 'Approved'), extendedSaleOrderDocuments.length),
      deliveryCompletionPercent: getPercent(countByStatus(extendedDeliveryDocuments, 'Approved'), extendedDeliveryDocuments.length),
      procurementApprovalPercent: getPercent(countByStatus(extendedPurchaseOrderDocuments, 'Approved'), extendedPurchaseOrderDocuments.length),
      allocationCoveragePercent: getPercent(extendedSaleAllocationDocuments.length, extendedSaleAllocationRequisitionDocuments.length || 1),
    };
  }, []);

  const kpis: KpiCardProps[] = [
    {
      label: 'Today Sales Orders',
      value: String(snapshot.saleOrdersToday.length),
      context: `Operational date ${formatDate(snapshot.salesReferenceDate)}`,
      trend: formatCompactCurrency(snapshot.saleOrdersToday.reduce((sum, item) => sum + parseAmount(item.totalAmount), 0)),
      icon: ShoppingBag,
      tone: 'primary',
      onClick: onNavigateToSaleOrderList,
    },
    {
      label: 'Today Invoices',
      value: String(snapshot.saleInvoicesToday.length),
      context: 'Sale invoice activity in current data window',
      trend: formatCompactCurrency(snapshot.saleInvoicesToday.reduce((sum, item) => sum + parseAmount(item.totalAmount), 0)),
      icon: ReceiptText,
      tone: 'success',
      onClick: onNavigateToSaleInvoiceList,
    },
    {
      label: 'Today Purchase Orders',
      value: String(snapshot.purchaseOrdersToday.length),
      context: `Procurement date ${formatDate(snapshot.procurementReferenceDate)}`,
      trend: formatCompactCurrency(snapshot.purchaseOrdersToday.reduce((sum, item) => sum + parseAmount(item.totalAmount), 0)),
      icon: ShoppingCart,
      tone: 'warning',
      onClick: onNavigateToPurchaseOrderList,
    },
    {
      label: 'Deliveries',
      value: String(snapshot.deliveriesToday.length),
      context: 'Scheduled or completed in current sales window',
      trend: `${snapshot.deliveryCompletionPercent}% approved`,
      icon: Truck,
      tone: 'neutral',
      onClick: onNavigateToDeliveryList,
    },
  ];

  const renderOverview = () => (
    <>
      <section className="dashboard-kpi-grid">
        {kpis.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </section>

      <section className="dashboard-grid dashboard-grid--balanced">
        <InsightCard
          title="Approval Health"
          value={`${100 - getPercent(snapshot.pendingApprovals, extendedSaleOrderDocuments.length + extendedPurchaseOrderDocuments.length)}%`}
          description={`${snapshot.pendingApprovals} documents need attention before downstream conversion.`}
          progress={100 - getPercent(snapshot.pendingApprovals, extendedSaleOrderDocuments.length + extendedPurchaseOrderDocuments.length)}
          actionLabel="Review approvals"
          onAction={onNavigateToPurchaseRequisitionList}
        />
        <InsightCard
          title="Sales Realization"
          value={`${getPercent(snapshot.invoiceValue, snapshot.saleOrderValue)}%`}
          description={`${formatCompactCurrency(snapshot.invoiceValue)} invoiced against ${formatCompactCurrency(snapshot.saleOrderValue)} booked order value.`}
          progress={getPercent(snapshot.invoiceValue, snapshot.saleOrderValue)}
          actionLabel="Open invoices"
          onAction={onNavigateToSaleInvoiceList}
        />
        <InsightCard
          title="Allocation Coverage"
          value={`${snapshot.allocationCoveragePercent}%`}
          description={`${extendedSaleAllocationDocuments.length} allocations generated from ${extendedSaleAllocationRequisitionDocuments.length} allocation requests.`}
          progress={snapshot.allocationCoveragePercent}
          actionLabel="View allocation"
          onAction={onNavigateToSaleAllocationList}
        />
      </section>

      <section className="dashboard-grid dashboard-grid--wide">
        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div>
              <h3>Business Value Trend</h3>
              <p>Data-derived comparison across major document streams.</p>
            </div>
          </div>
          <TrendBars
            labels={['SO', 'SI', 'PO', 'PI', 'Delivery']}
            values={[
              snapshot.saleOrderValue,
              snapshot.invoiceValue,
              snapshot.purchaseValue,
              extendedPurchaseInvoiceDocuments.reduce((sum, item) => sum + parseAmount(item.totalAmount), 0),
              extendedDeliveryDocuments.length * 10000,
            ]}
          />
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div>
              <h3>Recent Operational Activity</h3>
              <p>Latest records across sales, procurement, and delivery.</p>
            </div>
          </div>
          <ActivityList items={getRecentActivity()} />
        </article>
      </section>
    </>
  );

  const renderSales = () => (
    <>
      <section className="dashboard-kpi-grid">
        <KpiCard label="Booked Value" value={formatCompactCurrency(snapshot.saleOrderValue)} context={`${extendedSaleOrderDocuments.length} sale orders`} trend={`${snapshot.approvedSalesPercent}% approved`} icon={ShoppingBag} onClick={onNavigateToSaleOrderList} />
        <KpiCard label="Invoice Value" value={formatCompactCurrency(snapshot.invoiceValue)} context={`${extendedSaleInvoiceDocuments.length} sale invoices`} trend={`${getPercent(snapshot.invoiceValue, snapshot.saleOrderValue)}% realized`} icon={ReceiptText} tone="success" onClick={onNavigateToSaleInvoiceList} />
        <KpiCard label="Open Allocation Requests" value={String(extendedSaleAllocationRequisitionDocuments.length)} context="Demand waiting for allocation review" trend={`${snapshot.allocationCoveragePercent}% covered`} icon={ClipboardList} tone="warning" onClick={onNavigateToSaleAllocationRequisitionList} />
        <KpiCard label="Deliveries" value={String(extendedDeliveryDocuments.length)} context="Delivery documents available" trend={`${snapshot.deliveryCompletionPercent}% complete`} icon={Truck} tone="neutral" onClick={onNavigateToDeliveryList} />
      </section>
      <section className="dashboard-grid dashboard-grid--wide">
        <article className="dashboard-panel">
          <div className="dashboard-panel__header"><div><h3>Sales Flow</h3><p>Order, allocation, invoice, and delivery movement.</p></div></div>
          <TrendBars labels={['Orders', 'Alloc. Req', 'Alloc.', 'Invoices', 'Delivery']} values={[extendedSaleOrderDocuments.length, extendedSaleAllocationRequisitionDocuments.length, extendedSaleAllocationDocuments.length, extendedSaleInvoiceDocuments.length, extendedDeliveryDocuments.length]} />
        </article>
        <article className="dashboard-panel">
          <div className="dashboard-panel__header"><div><h3>Recent Sales Records</h3><p>Quick scan of high-priority sales documents.</p></div></div>
          <ActivityList items={extendedSaleOrdersToActivity()} />
        </article>
      </section>
    </>
  );

  const renderProcurement = () => (
    <>
      <section className="dashboard-kpi-grid">
        <KpiCard label="PR Volume" value={String(extendedPurchaseRequisitionDocuments.length)} context="Purchase requisitions visible" trend={`${countByStatus(extendedPurchaseRequisitionDocuments, 'Draft')} draft`} icon={ClipboardList} onClick={onNavigateToPurchaseRequisitionList} />
        <KpiCard label="PO Value" value={formatCompactCurrency(snapshot.purchaseValue)} context={`${extendedPurchaseOrderDocuments.length} purchase orders`} trend={`${snapshot.procurementApprovalPercent}% approved`} icon={ShoppingCart} tone="success" onClick={onNavigateToPurchaseOrderList} />
        <KpiCard label="Receipts" value={String(extendedPurchaseReceiptDocuments.length)} context="Goods receipt documents" trend="Inward visibility" icon={PackageCheck} tone="neutral" onClick={onNavigateToPurchaseReceiptList} />
        <KpiCard label="Purchase Invoices" value={String(extendedPurchaseInvoiceDocuments.length)} context="Supplier invoice documents" trend={formatCompactCurrency(extendedPurchaseInvoiceDocuments.reduce((sum, item) => sum + parseAmount(item.totalAmount), 0))} icon={ReceiptText} tone="warning" onClick={onNavigateToPurchaseInvoiceList} />
      </section>
      <section className="dashboard-grid dashboard-grid--wide">
        <article className="dashboard-panel">
          <div className="dashboard-panel__header"><div><h3>Procurement Pipeline</h3><p>Requisition to invoice conversion view.</p></div></div>
          <TrendBars labels={['PR', 'PO', 'Receipt', 'Invoice']} values={[extendedPurchaseRequisitionDocuments.length, extendedPurchaseOrderDocuments.length, extendedPurchaseReceiptDocuments.length, extendedPurchaseInvoiceDocuments.length]} />
        </article>
        <article className="dashboard-panel">
          <div className="dashboard-panel__header"><div><h3>Recent Purchase Orders</h3><p>Supplier activity and approval state.</p></div></div>
          <ActivityList items={extendedPurchaseOrdersToActivity()} />
        </article>
      </section>
    </>
  );

  const renderInventory = () => (
    <EmptyModulePanel
      title="Inventory dashboard is ready for live stock feeds"
      description="Inventory navigation exists, but stock transfer, stock adjustment, warehouse balance, and reorder datasets are not connected yet. Once those entities are added, this tab can surface low-stock alerts, inward/outward movement, and valuation."
    />
  );

  const renderServices = () => (
    <EmptyModulePanel
      title="Services dashboard is ready for service transactions"
      description="Service navigation exists for appointments, estimates, job cards, spare issue, and service invoices. No service datasets are present yet, so this tab safely shows readiness instead of fake KPIs."
    />
  );

  const renderCrm = () => (
    <EmptyModulePanel
      title="CRM insights are not connected yet"
      description="Customer names are available through sales documents, but no lead, opportunity, or follow-up dataset exists in the project yet. This tab is prepared for those records when the CRM module is added."
    />
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'sales':
        return renderSales();
      case 'procurement':
        return renderProcurement();
      case 'inventory':
        return renderInventory();
      case 'services':
        return renderServices();
      case 'crm':
        return renderCrm();
      default:
        return renderOverview();
    }
  };

  return (
    <AppShell
      activeLeaf="dashboard"
      onDashboardClick={onNavigateToDashboard}
      onPurchaseRequisitionClick={onNavigateToPurchaseRequisitionList}
      onPurchaseOrderClick={onNavigateToPurchaseOrderList}
      onPurchaseReceiptClick={onNavigateToPurchaseReceiptList}
      onPurchaseInvoiceClick={onNavigateToPurchaseInvoiceList}
      onSaleOrderClick={onNavigateToSaleOrderList}
      onSaleAllocationRequisitionClick={onNavigateToSaleAllocationRequisitionList}
      onSaleAllocationClick={onNavigateToSaleAllocationList}
      onSaleInvoiceClick={onNavigateToSaleInvoiceList}
      onDeliveryClick={onNavigateToDeliveryList}
    >
      <main className="dashboard-page">
        <section className="dashboard-hero">
          <div>
            <span className="dashboard-eyebrow">Executive command center</span>
            <h1>Dashboard</h1>
            <p>
              Live operational pulse across sales, procurement, allocation, invoices, and delivery using the project's
              current document data.
            </p>
          </div>
          <div className="dashboard-hero__meta">
            <span>Last refreshed</span>
            <strong>{lastUpdatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
          </div>
        </section>

        <div className="dashboard-tabs" role="tablist" aria-label="Dashboard modules">
          {dashboardTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn('dashboard-tab', activeTab === tab.key && 'dashboard-tab--active')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <section className="dashboard-priority-strip" aria-label="Priority summary">
            <div><AlertTriangle size={16} /><span>{snapshot.pendingApprovals} pending approvals</span></div>
            <div><Clock3 size={16} /><span>{snapshot.saleOrdersToday.length + snapshot.purchaseOrdersToday.length} records in current operational day</span></div>
            <div><CheckCircle2 size={16} /><span>{snapshot.deliveryCompletionPercent}% delivery completion health</span></div>
            <div><Users size={16} /><span>{new Set(extendedSaleOrderDocuments.map((item) => item.customerName)).size} active customers</span></div>
          </section>
        )}

        {renderActiveTab()}
      </main>
    </AppShell>
  );
};

export default Dashboard;
