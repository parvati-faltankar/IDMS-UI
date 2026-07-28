import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Edit2, Filter, Landmark, Trash2, Truck, User, Users } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { AdminListPageShell } from '../../../../experience/components/AdminListPageShell';
import { findGroupForMasterKey, findMasterByKey } from '../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../adminStorage';
import {
  createMasterActionsColumn,
  createMasterIdentifierColumn,
  createMasterStatusColumn,
  createMasterTextColumn,
  MasterDataTable,
  MasterTablePill,
  MasterTableTruncate,
} from '../../../../components/common/MasterDataTable';
import MasterFilterDrawer from '../../../../components/common/MasterFilterDrawer';
import type { DataGridColumn } from '../../../../components/common/dataGridTypes';
import type { Customer, CustomerStatus, CustomerType } from '../types/customerMaster.types';
import { customerService } from '../services/customerService';
import { CUSTOMER_TYPES, CUSTOMER_STATUSES, CUSTOMER_TYPE_META } from '../constants/customerMaster.constants';
import CustomerTypePickerDialog from '../components/CustomerTypePickerDialog';

const FORM_MASTER_KEY = 'customer-master';

function getStatusTone(status: CustomerStatus): 'success' | 'neutral' | 'danger' {
  if (status === 'Active') return 'success';
  if (status === 'Blocked') return 'danger';
  return 'neutral';
}

const TYPE_ICONS: Record<CustomerType, React.ReactNode> = {
  'Retail Individual': <User size={12} />,
  Corporate: <Building2 size={12} />,
  Fleet: <Truck size={12} />,
  Government: <Landmark size={12} />,
  Internal: <Users size={12} />,
};

export default function CustomerListPage() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<CustomerType | ''>('');
  const [filterStatus, setFilterStatus] = useState<CustomerStatus | ''>('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    setCustomers(customerService.getAll());
    const master = findMasterByKey(FORM_MASTER_KEY);
    const group = findGroupForMasterKey(FORM_MASTER_KEY);
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
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      if (filterType && customer.customerType !== filterType) return false;
      if (filterStatus && customer.customerStatus !== filterStatus) return false;
      if (
        query &&
        !customer.displayName.toLowerCase().includes(query) &&
        !customer.customerCode.toLowerCase().includes(query) &&
        !customer.primaryMobileNumber.includes(query) &&
        !customer.emailId.toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });
  }, [customers, search, filterType, filterStatus]);

  function handleDelete(customer: Customer) {
    customerService.delete(customer.id);
    setCustomers(customerService.getAll());
    setDeleteTarget(null);
    showToast(`"${customer.displayName}" deleted.`);
  }

  const hasFilter = Boolean(filterType || filterStatus);

  const gridColumns: DataGridColumn<Customer>[] = [
    createMasterIdentifierColumn<Customer>({
      id: 'customerCode',
      label: 'Customer Code',
      getValue: (customer) => customer.customerCode || customer.draftReferenceId || '-',
      onClick: (customer) => navigate(`/admin/master/customer-master/${customer.id}`),
      width: 156,
      minWidth: 136,
    }),
    createMasterTextColumn<Customer>({
      id: 'displayName',
      label: 'Display Name',
      primary: (customer) => customer.displayName || '-',
      secondary: (customer) => customer.primaryCustomerSegment || undefined,
      title: (customer) => customer.displayName || customer.draftReferenceId || 'Customer',
      width: 240,
      minWidth: 210,
      hideable: false,
    }),
    {
      id: 'customerType',
      label: 'Type',
      type: 'text',
      width: 176,
      minWidth: 156,
      getValue: (customer) => customer.customerType,
      renderCell: (customer) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <MasterTablePill label={customer.customerType} tone="info" />
          <span style={{ color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center' }}>{TYPE_ICONS[customer.customerType]}</span>
        </span>
      ),
    },
    createMasterStatusColumn<Customer>({
      getStatus: (customer) => customer.customerStatus,
      getTone: (status) => getStatusTone(status as CustomerStatus),
      width: 126,
      minWidth: 114,
      options: CUSTOMER_STATUSES,
    }),
    {
      id: 'mobile',
      label: 'Mobile',
      type: 'text',
      width: 142,
      minWidth: 128,
      getValue: (customer) => customer.primaryMobileNumber || '-',
      renderCell: (customer) => <MasterTableTruncate value={customer.primaryMobileNumber || '-'} mono />,
    },
    {
      id: 'email',
      label: 'Email',
      type: 'text',
      width: 220,
      minWidth: 180,
      getValue: (customer) => customer.emailId || '-',
      renderCell: (customer) => <MasterTableTruncate value={customer.emailId || '-'} />,
    },
    {
      id: 'createdAt',
      label: 'Created',
      type: 'text',
      width: 126,
      minWidth: 114,
      getValue: (customer) => customer.createdAt || '',
      renderCell: (customer) => <MasterTableTruncate value={customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '-'} />,
    },
    createMasterActionsColumn<Customer>({
      rowLabel: (customer) => customer.displayName || customer.customerCode || customer.draftReferenceId || 'Customer',
      inlineAction: (customer) => ({
        label: 'Edit customer',
        onClick: () => navigate(`/admin/master/customer-master/${customer.id}`),
        icon: <Edit2 size={13} />,
      }),
      menuActions: (customer) => [
        {
          label: 'Edit',
          onSelect: () => navigate(`/admin/master/customer-master/${customer.id}`),
          icon: <Edit2 size={13} />,
        },
        {
          label: 'Delete Draft',
          onSelect: () => setDeleteTarget(customer),
          icon: <Trash2 size={13} />,
          tone: 'danger',
          dividerBefore: true,
          hidden: customer.customerStatus !== 'Draft',
        },
      ],
      width: 118,
      minWidth: 106,
    }),
  ];

  return (
    <AdminShell>
      {toast ? (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, background: '#15803D', color: 'white', padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toast}
        </div>
      ) : null}

      <CustomerTypePickerDialog open={pickerOpen} onClose={() => setPickerOpen(false)} />

      <AdminListPageShell
        title="Customer Master"
        primaryAction={{ label: '+ New Customer', onClick: () => setPickerOpen(true) }}
        secondaryActions={[{
          label: 'Filters',
          onClick: () => setFilterOpen(true),
          icon: <Filter size={13} />,
          iconOnly: true,
          title: 'Open filters',
          active: hasFilter,
        }]}
        searchValue={search}
        searchPlaceholder="Search by name, code, mobile, email..."
        onSearchChange={setSearch}
      >
        <MasterDataTable
          gridId="customer-master-table"
          ariaLabel="Customers table"
          rows={filtered}
          columns={gridColumns}
          rowId={(customer) => customer.id}
          totalCount={customers.length}
          countLabel={customers.length === 1 ? 'customer' : 'customers'}
          emptyState={{
            title: search || hasFilter ? 'No customers match your search' : 'No customers yet',
            description: search || hasFilter
              ? 'Try adjusting your search or filters.'
              : 'Click "+ New Customer" to add your first customer.',
            ...(!search && !hasFilter
              ? { action: { label: 'New Customer', onClick: () => setPickerOpen(true) } }
              : {}),
          }}
        />
      </AdminListPageShell>

      <MasterFilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onReset={() => {
          setFilterType('');
          setFilterStatus('');
        }}
        description="Filter customers by business type and lifecycle status."
        fields={[
          {
            id: 'customer-type',
            label: 'Customer Type',
            value: filterType,
            placeholder: 'All types',
            options: CUSTOMER_TYPES.map((type) => ({ value: type, label: type })),
            onChange: (value) => setFilterType(value as CustomerType | ''),
          },
          {
            id: 'customer-status',
            label: 'Status',
            value: filterStatus,
            placeholder: 'All statuses',
            options: CUSTOMER_STATUSES.map((status) => ({ value: status, label: status })),
            onChange: (value) => setFilterStatus(value as CustomerStatus | ''),
          },
        ]}
      />

      {deleteTarget ? (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '24px', maxWidth: '380px', width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>Delete Draft Customer</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              Delete <strong>"{deleteTarget.displayName || deleteTarget.draftReferenceId}"</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                style={{ padding: '0 16px', height: '34px', fontSize: '13px', fontWeight: 500, borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteTarget)}
                style={{ padding: '0 16px', height: '34px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', background: '#DC2626', color: '#fff', cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
