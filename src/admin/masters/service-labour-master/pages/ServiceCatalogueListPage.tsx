import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Eye, Filter } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { AdminListPageShell } from '../../../../experience/components/AdminListPageShell';
import { SmartPreviewDrawer } from '../../../../experience/components/SmartPreviewDrawer';
import type { PreviewSection } from '../../../../experience/components/SmartPreviewDrawer/SmartPreviewDrawer.types';
import { findGroupForMasterKey, findMasterByKey } from '../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../adminStorage';
import {
  createMasterActionsColumn,
  createMasterIdentifierColumn,
  createMasterStatusColumn,
  createMasterTextColumn,
  MasterDataTable,
  MasterTableTruncate,
} from '../../../../components/common/MasterDataTable';
import MasterFilterDrawer from '../../../../components/common/MasterFilterDrawer';
import type { DataGridColumn } from '../../../../components/common/dataGridTypes';
import {
  getServiceCatalogueConfig,
  SERVICE_CATALOGUE_BUSINESS_UNIT_OPTIONS,
  SERVICE_CATALOGUE_REGION_OPTIONS,
  SERVICE_CATALOGUE_ROWS,
  SERVICE_CATALOGUE_STATUS_OPTIONS,
  type ServiceCatalogueRow,
  type ServiceCatalogueStatus,
  type ServiceCatalogueVariant,
} from '../serviceCatalogueConfig';

interface ServiceCatalogueListPageProps {
  variant: ServiceCatalogueVariant;
}

function getStatusTone(status: ServiceCatalogueStatus): 'active' | 'draft' | 'inactive' {
  if (status === 'Active') return 'active';
  if (status === 'Inactive') return 'inactive';
  return 'draft';
}

function buildPreviewSections(
  variant: ServiceCatalogueVariant,
  row: ServiceCatalogueRow,
): PreviewSection[] {
  if (variant === 'domain') {
    return [
      {
        title: 'Basic Details',
        fields: [
          { label: 'Domain Code', value: row.code, mono: true },
          { label: 'Domain Name', value: row.name },
          { label: 'Display Name', value: row.displayName || '-' },
          { label: 'Status', value: row.status },
          { label: 'Description', value: row.description, span: 2 },
        ],
      },
      {
        title: 'Business Ownership',
        fields: [
          { label: 'Department', value: row.ownerDepartment || '-' },
          { label: 'Owner Role', value: row.ownerRole || '-' },
        ],
      },
      {
        title: 'Scope & Applicability',
        fields: [
          { label: 'Scope Level', value: row.scopeLevel },
          { label: 'Business Unit', value: row.businessUnit },
          { label: 'Brand', value: row.brand },
          { label: 'Region', value: row.region },
        ],
      },
    ];
  }

  if (variant === 'family') {
    return [
      {
        title: 'Basic Details',
        fields: [
          { label: 'Family Code', value: row.code, mono: true },
          { label: 'Family Name', value: row.name },
          { label: 'Service Domain', value: row.serviceDomain || '-' },
          { label: 'Status', value: row.status },
          { label: 'Description', value: row.description, span: 2 },
        ],
      },
      {
        title: 'Applicability',
        fields: [
          { label: 'Scope Level', value: row.scopeLevel },
          { label: 'Business Unit', value: row.businessUnit },
          { label: 'Brand', value: row.brand },
          { label: 'Region', value: row.region },
        ],
      },
    ];
  }

  return [
    {
      title: 'Activity Details',
      fields: [
        { label: 'Labour Code', value: row.code, mono: true },
        { label: 'Activity Name', value: row.name },
        { label: 'Service Domain', value: row.serviceDomain || '-' },
        { label: 'Service Family', value: row.serviceFamily || '-' },
        { label: 'Status', value: row.status },
        { label: 'Description', value: row.description, span: 2 },
      ],
    },
    {
      title: 'Commercials & Applicability',
      fields: [
        { label: 'Rate Type', value: row.rateType || '-' },
        { label: 'Standard Rate', value: row.standardRate || '-' },
        { label: 'Unit Of Measure', value: row.unitOfMeasure || '-' },
        { label: 'Business Unit', value: row.businessUnit },
        { label: 'Brand', value: row.brand },
        { label: 'Region', value: row.region },
      ],
    },
  ];
}

export default function ServiceCatalogueListPage({
  variant,
}: ServiceCatalogueListPageProps) {
  const navigate = useNavigate();
  const config = getServiceCatalogueConfig(variant);
  const master = findMasterByKey(config.masterKey);
  const group = findGroupForMasterKey(config.masterKey);

  const [records] = useState<ServiceCatalogueRow[]>(SERVICE_CATALOGUE_ROWS[variant]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ServiceCatalogueStatus | ''>('');
  const [filterBusinessUnit, setFilterBusinessUnit] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<ServiceCatalogueRow | null>(null);

  useEffect(() => {
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
  }, [group, master]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return records.filter((row) => {
      if (filterStatus && row.status !== filterStatus) return false;
      if (filterBusinessUnit && row.businessUnit !== filterBusinessUnit) return false;
      if (filterRegion && row.region !== filterRegion) return false;

      if (!query) return true;

      const haystack = [
        row.code,
        row.name,
        row.description,
        row.serviceDomain,
        row.serviceFamily,
        row.ownerDepartment,
        row.ownerRole,
        row.region,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [filterBusinessUnit, filterRegion, filterStatus, records, searchQuery]);

  const columns = useMemo<DataGridColumn<ServiceCatalogueRow>[]>(() => {
    const commonColumns: DataGridColumn<ServiceCatalogueRow>[] = [
      createMasterIdentifierColumn<ServiceCatalogueRow>({
        id: 'code',
        label: 'Code',
        getValue: (row) => row.code,
        onClick: (row) => setPreviewRecord(row),
        width: 132,
        minWidth: 112,
      }),
      createMasterTextColumn<ServiceCatalogueRow>({
        id: 'name',
        label: variant === 'labour' ? 'Labour Activity' : 'Name',
        primary: (row) => row.name,
        secondary: (row) =>
          variant === 'domain'
            ? row.displayName || undefined
            : variant === 'family'
              ? row.serviceDomain || undefined
              : row.serviceFamily || undefined,
        title: (row) => row.name,
        width: 240,
        minWidth: 220,
        hideable: false,
      }),
    ];

    if (variant === 'domain') {
      commonColumns.push(
        {
          id: 'ownerDepartment',
          label: 'Department',
          type: 'text',
          width: 176,
          minWidth: 156,
          getValue: (row) => row.ownerDepartment || '-',
          renderCell: (row) => <MasterTableTruncate value={row.ownerDepartment || '-'} />,
        },
        {
          id: 'businessUnit',
          label: 'Business Unit',
          type: 'text',
          width: 170,
          minWidth: 150,
          getValue: (row) => row.businessUnit,
          renderCell: (row) => <MasterTableTruncate value={row.businessUnit} />,
        },
      );
    }

    if (variant === 'family') {
      commonColumns.push(
        {
          id: 'serviceDomain',
          label: 'Service Domain',
          type: 'text',
          width: 188,
          minWidth: 168,
          getValue: (row) => row.serviceDomain || '-',
          renderCell: (row) => <MasterTableTruncate value={row.serviceDomain || '-'} />,
        },
        {
          id: 'businessUnit',
          label: 'Business Unit',
          type: 'text',
          width: 170,
          minWidth: 150,
          getValue: (row) => row.businessUnit,
          renderCell: (row) => <MasterTableTruncate value={row.businessUnit} />,
        },
      );
    }

    if (variant === 'labour') {
      commonColumns.push(
        {
          id: 'serviceDomain',
          label: 'Service Domain',
          type: 'text',
          width: 184,
          minWidth: 164,
          getValue: (row) => row.serviceDomain || '-',
          renderCell: (row) => <MasterTableTruncate value={row.serviceDomain || '-'} />,
        },
        {
          id: 'rateType',
          label: 'Rate Type',
          type: 'text',
          width: 136,
          minWidth: 120,
          getValue: (row) => row.rateType || '-',
          renderCell: (row) => <MasterTableTruncate value={row.rateType || '-'} />,
        },
      );
    }

    commonColumns.push(
      createMasterStatusColumn<ServiceCatalogueRow>({
        getStatus: (row) => row.status,
        getTone: (status) => getStatusTone(status as ServiceCatalogueStatus),
        width: 126,
        minWidth: 112,
        options: SERVICE_CATALOGUE_STATUS_OPTIONS,
      }),
      {
        id: 'updatedAt',
        label: 'Updated',
        type: 'text',
        width: 126,
        minWidth: 114,
        getValue: (row) => row.updatedAt,
        renderCell: (row) => <MasterTableTruncate value={row.updatedAt} />,
      },
      createMasterActionsColumn<ServiceCatalogueRow>({
        rowLabel: (row) => row.name,
        inlineAction: (row) => ({
          label: `Edit ${config.title.toLowerCase()}`,
          onClick: () => navigate(`${config.listPath}/${row.id}`),
          icon: <Edit2 size={13} />,
        }),
        menuActions: (row) => [
          {
            label: 'Preview',
            onSelect: () => setPreviewRecord(row),
            icon: <Eye size={13} />,
          },
          {
            label: 'Edit',
            onSelect: () => navigate(`${config.listPath}/${row.id}`),
            icon: <Edit2 size={13} />,
          },
        ],
        width: 118,
        minWidth: 106,
      }),
    );

    return commonColumns;
  }, [config.listPath, config.title, navigate, variant]);

  const hasFilters = Boolean(filterStatus || filterBusinessUnit || filterRegion);

  return (
    <AdminShell>
      <AdminListPageShell
        title={config.title}
        primaryAction={{ label: config.createLabel, onClick: () => navigate(`${config.listPath}/new`) }}
        secondaryActions={[{
          label: 'Filters',
          onClick: () => setFilterOpen(true),
          icon: <Filter size={13} />,
          iconOnly: true,
          title: 'Open filters',
          active: hasFilters,
        }]}
        searchValue={searchQuery}
        searchPlaceholder={config.searchPlaceholder}
        onSearchChange={setSearchQuery}
      >
        <MasterDataTable
          gridId={`${config.masterKey}-table`}
          ariaLabel={`${config.title} table`}
          rows={filtered}
          columns={columns}
          rowId={(row) => row.id}
          totalCount={records.length}
          countLabel={records.length === 1 ? 'record' : 'records'}
          emptyState={{
            title: searchQuery || hasFilters ? `No ${config.title.toLowerCase()} records match your search` : `No ${config.title.toLowerCase()} records yet`,
            description: searchQuery || hasFilters
              ? 'Try adjusting your search or filters.'
              : `Click "${config.createLabel}" to add your first record.`,
            ...(!searchQuery && !hasFilters
              ? { action: { label: config.title, onClick: () => navigate(`${config.listPath}/new`) } }
              : {}),
          }}
        />
      </AdminListPageShell>

      <MasterFilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onReset={() => {
          setFilterStatus('');
          setFilterBusinessUnit('');
          setFilterRegion('');
        }}
        description={`Filter ${config.title.toLowerCase()} records by lifecycle status, business unit, and region.`}
        fields={[
          {
            id: `${config.masterKey}-status`,
            label: 'Status',
            value: filterStatus,
            placeholder: 'All statuses',
            options: SERVICE_CATALOGUE_STATUS_OPTIONS.map((status) => ({ value: status, label: status })),
            onChange: (value) => setFilterStatus(value as ServiceCatalogueStatus | ''),
          },
          {
            id: `${config.masterKey}-business-unit`,
            label: 'Business Unit',
            value: filterBusinessUnit,
            placeholder: 'All business units',
            options: SERVICE_CATALOGUE_BUSINESS_UNIT_OPTIONS.map((option) => ({ value: option, label: option })),
            onChange: (value) => setFilterBusinessUnit(value),
          },
          {
            id: `${config.masterKey}-region`,
            label: 'Region / Location',
            value: filterRegion,
            placeholder: 'All regions',
            options: SERVICE_CATALOGUE_REGION_OPTIONS.map((option) => ({ value: option, label: option })),
            onChange: (value) => setFilterRegion(value),
          },
        ]}
      />

      <SmartPreviewDrawer
        open={Boolean(previewRecord)}
        onClose={() => setPreviewRecord(null)}
        title={previewRecord?.name || config.title}
        statusLabel={previewRecord?.status}
        statusTone={previewRecord ? getStatusTone(previewRecord.status) : undefined}
        sections={previewRecord ? buildPreviewSections(variant, previewRecord) : []}
        primaryAction={previewRecord ? {
          label: 'Edit',
          onClick: () => {
            navigate(`${config.listPath}/${previewRecord.id}`);
            setPreviewRecord(null);
          },
        } : undefined}
      />
    </AdminShell>
  );
}
