import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Eye, Filter } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { AdminListPageShell } from '../../../../experience/components/AdminListPageShell';
import { SmartPreviewDrawer } from '../../../../experience/components/SmartPreviewDrawer';
import type { PreviewSection } from '../../../../experience/components/SmartPreviewDrawer/SmartPreviewDrawer.types';
import { HelpDrawer } from '../../../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../../../experience/help/helpTopics';
import { findGroupForMasterKey, findMasterByKey } from '../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../adminStorage';
import type { ServiceTypeRecord, STStatus } from '../types/serviceTypeMaster.types';
import { serviceTypeService } from '../services/serviceTypeService';
import { MASTER_KEY } from '../constants/serviceTypeMaster.constants';
import ServiceTypePickerDialog from '../components/ServiceTypePickerDialog';
import {
  createMasterActionsColumn,
  createMasterIdentifierColumn,
  createMasterStatusColumn,
  createMasterTextColumn,
  MasterDataTable,
  MasterTableBooleanValue,
  MasterTableTruncate,
} from '../../../../components/common/MasterDataTable';
import MasterFilterDrawer from '../../../../components/common/MasterFilterDrawer';
import type { DataGridColumn } from '../../../../components/common/dataGridTypes';

function statusTone(status: STStatus): 'active' | 'draft' | 'inactive' {
  if (status === 'Active') return 'active';
  if (status === 'Inactive') return 'inactive';
  return 'draft';
}

function buildPreviewSections(record: ServiceTypeRecord): PreviewSection[] {
  const flags: string[] = [];
  if (record.saleable) flags.push('Saleable');
  if (record.taxExempted) flags.push('Tax Exempt');
  if (record.contractRequired) flags.push('Contract Req.');
  if (record.subscriptionApplicable) flags.push('Subscription');
  if (record.active) flags.push('Active');
  if (record.isHeader) flags.push('Is Header');
  if (record.isLine) flags.push('Is Line');

  const sections: PreviewSection[] = [
    {
      title: 'Details',
      fields: [
        { label: 'Code', value: record.code, mono: true },
        { label: 'Name', value: record.name },
        { label: 'Posting Type', value: record.postingType || '-' },
        { label: 'Status', value: record.status },
        ...(record.serviceDeliveryMode ? [{ label: 'Delivery Mode', value: record.serviceDeliveryMode }] : []),
        ...(record.billingResponsibility ? [{ label: 'Billing Responsibility', value: record.billingResponsibility }] : []),
        ...(record.description ? [{ label: 'Description', value: record.description, span: 2 as const }] : []),
      ],
    },
  ];

  if (flags.length > 0) {
    sections.push({
      title: 'Configuration Flags',
      fields: flags.map((flag) => ({ label: flag, value: 'Yes' })),
    });
  }

  if (record.labourRows.length > 0 || record.partRows.length > 0) {
    sections.push({
      title: 'Contract Relation',
      fields: [
        { label: 'Labour Rows', value: String(record.labourRows.length) },
        { label: 'Part Rows', value: String(record.partRows.length) },
      ],
    });
  }

  if (record.productApplicabilityRows.length > 0) {
    sections.push({
      title: 'Product Applicability',
      fields: [{ label: 'Products', value: String(record.productApplicabilityRows.length) }],
    });
  }

  sections.push({
    title: 'Audit',
    fields: [
      { label: 'Created By', value: record.createdBy },
      { label: 'Created', value: record.createdDate },
      { label: 'Last Modified', value: record.lastModifiedDate },
    ],
  });

  return sections;
}

const ServiceTypeListPage: React.FC = () => {
  const navigate = useNavigate();

  const [records, setRecords] = useState<ServiceTypeRecord[]>(() => serviceTypeService.getAll());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSaleable, setFilterSaleable] = useState('');
  const [filterContractRequired, setFilterContractRequired] = useState('');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<ServiceTypeRecord | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  const group = findGroupForMasterKey(MASTER_KEY);

  function showToast(message: string, tone: 'success' | 'error') {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3200);
  }

  useEffect(() => {
    const master = findMasterByKey(MASTER_KEY);
    const masterGroup = findGroupForMasterKey(MASTER_KEY);
    if (master && masterGroup) {
      recordRecentAdminMaster({
        key: master.key,
        label: master.label,
        path: master.path,
        groupLabel: masterGroup.label,
        groupIconBg: masterGroup.iconBg,
        groupIconColor: masterGroup.iconColor,
      });
    }
  }, []);

  const filtered = useMemo(() => {
    let list = records;
    if (filterStatus) list = list.filter((record) => record.status === filterStatus);
    if (filterSaleable === 'yes') list = list.filter((record) => record.saleable);
    if (filterSaleable === 'no') list = list.filter((record) => !record.saleable);
    if (filterContractRequired === 'yes') list = list.filter((record) => record.contractRequired);
    if (filterContractRequired === 'no') list = list.filter((record) => !record.contractRequired);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((record) =>
        record.code.toLowerCase().includes(query) ||
        record.name.toLowerCase().includes(query) ||
        record.postingType.toLowerCase().includes(query)
      );
    }

    return list;
  }, [filterContractRequired, filterSaleable, filterStatus, records, searchQuery]);

  function handleActivate(record: ServiceTypeRecord) {
    const updated = serviceTypeService.changeStatus(record.id, 'Active');
    if (updated) {
      setRecords(serviceTypeService.getAll());
      setPreviewRecord(updated);
      showToast(`${record.name} activated`, 'success');
    }
  }

  function handleDeactivate(record: ServiceTypeRecord) {
    const updated = serviceTypeService.changeStatus(record.id, 'Inactive');
    if (updated) {
      setRecords(serviceTypeService.getAll());
      setPreviewRecord(updated);
      showToast(`${record.name} deactivated`, 'success');
    }
  }

  const hasFilters = Boolean(filterStatus || filterSaleable || filterContractRequired);

  const gridColumns: DataGridColumn<ServiceTypeRecord>[] = [
    createMasterIdentifierColumn<ServiceTypeRecord>({
      id: 'code',
      label: 'Code',
      getValue: (record) => record.code,
      onClick: (record) => setPreviewRecord(record),
      width: 112,
      minWidth: 96,
    }),
    createMasterTextColumn<ServiceTypeRecord>({
      id: 'name',
      label: 'Name',
      primary: (record) => record.name,
      secondary: (record) => record.description || undefined,
      title: (record) => record.name,
      width: 260,
      minWidth: 220,
      hideable: false,
    }),
    {
      id: 'postingType',
      label: 'Posting Type',
      type: 'text',
      width: 156,
      minWidth: 136,
      getValue: (record) => record.postingType,
      renderCell: (record) => <MasterTableTruncate value={record.postingType || '-'} />,
    },
    {
      id: 'saleable',
      label: 'Saleable',
      type: 'boolean',
      width: 128,
      minWidth: 118,
      getValue: (record) => record.saleable,
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ],
      renderCell: (record) => <MasterTableBooleanValue value={record.saleable} />,
    },
    {
      id: 'contractRequired',
      label: 'Contract Req.',
      type: 'boolean',
      width: 146,
      minWidth: 132,
      getValue: (record) => record.contractRequired,
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ],
      renderCell: (record) => <MasterTableBooleanValue value={record.contractRequired} />,
    },
    {
      id: 'active',
      label: 'Active Flag',
      type: 'boolean',
      width: 126,
      minWidth: 112,
      getValue: (record) => record.active,
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ],
      renderCell: (record) => <MasterTableBooleanValue value={record.active} />,
    },
    createMasterStatusColumn<ServiceTypeRecord>({
      getStatus: (record) => record.status,
      width: 126,
      minWidth: 112,
      options: ['Draft', 'Active', 'Inactive'],
    }),
    createMasterActionsColumn<ServiceTypeRecord>({
      rowLabel: (record) => record.code,
      inlineAction: (record) => ({
        label: 'Edit service type',
        onClick: () => navigate(`/admin/master/service-type-master/${record.id}`),
        icon: <Edit2 size={13} />,
      }),
      menuActions: (record) => [
        {
          label: 'Preview details',
          onSelect: () => setPreviewRecord(record),
          icon: <Eye size={13} />,
        },
        {
          label: 'Edit service type',
          onSelect: () => navigate(`/admin/master/service-type-master/${record.id}`),
          icon: <Edit2 size={13} />,
        },
        ...(record.status === 'Draft' || record.status === 'Inactive'
          ? [{
              label: 'Activate',
              onSelect: () => handleActivate(record),
              dividerBefore: true,
            }]
          : []),
        ...(record.status === 'Active'
          ? [{
              label: 'Deactivate',
              onSelect: () => handleDeactivate(record),
              tone: 'warning' as const,
              dividerBefore: true,
            }]
          : []),
      ],
    }),
  ];

  const helpTopic = getHelpTopic('service-type-master');

  return (
    <AdminShell>
      <AdminListPageShell
        title="Service Type Master"
        description="Define service types with posting rules, contract configuration, billing ratios, and product applicability."
        breadcrumbs={['Admin', group?.label ?? 'Service', 'Service Type Master']}
        primaryAction={{ label: '+ New Service Type', tone: 'primary', onClick: () => setPickerOpen(true) }}
        secondaryActions={[{
          label: 'Filters',
          onClick: () => setFilterDrawerOpen(true),
          icon: <Filter size={13} />,
          iconOnly: true,
          title: 'Open filters',
          active: hasFilters,
        }]}
        searchValue={searchQuery}
        searchPlaceholder="Search by code, name or posting type..."
        onSearchChange={setSearchQuery}
        helpTopicId="service-type-master"
        onHelpClick={() => setHelpOpen(true)}
      >
        <MasterDataTable
          gridId="service-type-master-table"
          rows={filtered}
          columns={gridColumns}
          rowId={(record) => record.id}
          totalCount={records.length}
          emptyState={{
            title: records.length === 0 ? 'No service types yet' : 'No service types match the current filters',
            description: records.length === 0
              ? 'Create your first service type to define posting rules, flags, and product applicability.'
              : 'Try adjusting your search or quick filters.',
            ...(records.length === 0
              ? { action: { label: 'New Service Type', onClick: () => setPickerOpen(true) } }
              : {}),
          }}
        />
      </AdminListPageShell>

      <MasterFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        onReset={() => {
          setFilterStatus('');
          setFilterSaleable('');
          setFilterContractRequired('');
        }}
        description="Filter service types by status and configuration flags."
        fields={[
          {
            id: 'service-type-status',
            label: 'Status',
            value: filterStatus,
            placeholder: 'All statuses',
            options: ['Active', 'Draft', 'Inactive'].map((status) => ({ value: status, label: status })),
            onChange: setFilterStatus,
          },
          {
            id: 'service-type-saleable',
            label: 'Saleable',
            value: filterSaleable,
            placeholder: 'All values',
            options: [
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ],
            onChange: setFilterSaleable,
          },
          {
            id: 'service-type-contract',
            label: 'Contract Required',
            value: filterContractRequired,
            placeholder: 'All values',
            options: [
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ],
            onChange: setFilterContractRequired,
          },
        ]}
      />

      {previewRecord && (
        <SmartPreviewDrawer
          open={!!previewRecord}
          onClose={() => setPreviewRecord(null)}
          title={previewRecord.name}
          subtitle={previewRecord.code}
          statusLabel={previewRecord.status}
          statusTone={statusTone(previewRecord.status)}
          summaryFields={[
            { label: 'Code', value: previewRecord.code, mono: true },
            { label: 'Posting Type', value: previewRecord.postingType || '-' },
            { label: 'Saleable', value: previewRecord.saleable ? 'Yes' : 'No' },
            { label: 'Contract Req.', value: previewRecord.contractRequired ? 'Yes' : 'No' },
            { label: 'Tax Exempt', value: previewRecord.taxExempted ? 'Yes' : 'No' },
            { label: 'Active', value: previewRecord.active ? 'Yes' : 'No' },
          ]}
          sections={buildPreviewSections(previewRecord)}
          primaryAction={{
            label: 'Edit',
            tone: 'primary',
            onClick: () => navigate(`/admin/master/service-type-master/${previewRecord.id}`),
          }}
          secondaryActions={[
            ...(previewRecord.status === 'Draft' || previewRecord.status === 'Inactive'
              ? [{ label: 'Activate', tone: 'outline' as const, onClick: () => handleActivate(previewRecord) }]
              : []),
            ...(previewRecord.status === 'Active'
              ? [{ label: 'Deactivate', tone: 'outline' as const, onClick: () => handleDeactivate(previewRecord) }]
              : []),
          ]}
        />
      )}

      <ServiceTypePickerDialog open={pickerOpen} onClose={() => setPickerOpen(false)} />

      {helpTopic && (
        <HelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} topic={helpTopic} />
      )}

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 500,
            color: 'white',
            background: toast.tone === 'success' ? '#15803D' : '#DC2626',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            transition: 'all 0.2s',
          }}
        >
          {toast.message}
        </div>
      )}
    </AdminShell>
  );
};

export default ServiceTypeListPage;
