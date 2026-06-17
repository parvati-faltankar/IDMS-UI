import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Filter,
  Eye,
  Edit2,
  Phone,
  Trash2,
  UserCheck,
  User,
  X,
} from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { AdminListPageShell } from '../../../../experience/components/AdminListPageShell';
import { SmartFormDrawer } from '../../../../experience/components/SmartFormDrawer';
import { SmartPreviewDrawer } from '../../../../experience/components/SmartPreviewDrawer';
import type { PreviewSection } from '../../../../experience/components/SmartPreviewDrawer/SmartPreviewDrawer.types';
import { SmartReviewDrawer } from '../../../../experience/components/SmartReviewDrawer';
import { HelpDrawer } from '../../../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../../../experience/help/helpTopics';
import { findGroupForMasterKey, findMasterByKey } from '../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../adminStorage';
import type { BusinessPartner, BPType } from '../types/supplierMaster.types';
import { supplierService } from '../services/supplierService';
import { BP_TYPES } from '../constants/supplierMaster.constants';
import BPTypePickerDialog from '../components/BPTypePickerDialog';
import {
  MasterDataTable,
  MasterTableIdentifierLink,
  MasterTablePill,
  MasterTableRowActions,
  MasterTableStatus,
  MasterTableTextCell,
  MasterTableTruncate,
  getMasterStatusTone,
} from '../../../../components/common/MasterDataTable';
import MasterFilterDrawer from '../../../../components/common/MasterFilterDrawer';
import type { DataGridColumn } from '../../../../components/common/dataGridTypes';

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function getTypeTone(type: BPType): 'neutral' | 'success' | 'warning' | 'info' {
  if (type === 'Customer') return 'success';
  if (type === 'Financier') return 'warning';
  if (type === 'Supplier' || type === 'Transporter') return 'info';
  return 'neutral';
}

const MASTER_KEY = 'supplier-master';

// â”€â”€â”€ Preview section builder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function buildPreviewSections(bp: BusinessPartner): PreviewSection[] {
  const primaryContact = bp.contacts.find((c) => c.contactType === 'Primary');
  const defaultAddress = bp.addresses.find((a) => a.isDefault);
  const defaultBank    = bp.bankDetails.find((b) => b.isDefaultAccount);

  const sections: PreviewSection[] = [
    {
      title: 'General Details',
      fields: [
        { label: 'BP Code',     value: bp.bpCode,     mono: true },
        { label: 'Legal Name',  value: bp.bpLegalName },
        { label: 'Type',        value: bp.bpType || 'â€”' },
        { label: 'Category',    value: bp.bpCategory || 'â€”' },
        { label: 'Country',     value: bp.countryOfRegistration || 'â€”' },
        { label: 'Business Type', value: bp.businessType || 'â€”' },
        { label: 'Industry',    value: bp.industryType || 'â€”' },
        { label: 'Employees',   value: bp.noOfEmployees || 'â€”' },
        { label: 'Founded',     value: bp.foundingDate || 'â€”' },
        { label: 'Website',     value: bp.websiteUrl || 'â€”' },
        ...(bp.effectiveFromDate ? [{ label: 'Effective From', value: bp.effectiveFromDate }] : []),
        ...(bp.description ? [{ label: 'Description', value: bp.description, span: 2 as const }] : []),
      ],
    },
  ];

  if (primaryContact) {
    sections.push({
      title: 'Primary Contact',
      fields: [
        { label: 'Name',        value: primaryContact.contactName },
        { label: 'Designation', value: primaryContact.designation || 'â€”' },
        { label: 'Department',  value: primaryContact.department  || 'â€”' },
        { label: 'Phone',       value: primaryContact.countryCode ? `${primaryContact.countryCode} ${primaryContact.phone}` : primaryContact.phone || 'â€”' },
        { label: 'Email',       value: primaryContact.email || 'â€”', span: 2 },
      ],
    });
  }

  if (defaultAddress) {
    sections.push({
      title: 'Default Address',
      fields: [
        { label: 'Type',        value: defaultAddress.addressType },
        { label: 'Address',     value: [defaultAddress.addressLine1, defaultAddress.addressLine2].filter(Boolean).join(', '), span: 2 },
        { label: 'City',        value: defaultAddress.city || 'â€”' },
        { label: 'State',       value: defaultAddress.state || 'â€”' },
        { label: 'PIN',         value: defaultAddress.pin || 'â€”' },
        { label: 'Country',     value: defaultAddress.country || 'â€”' },
      ],
    });
  }

  sections.push({
    title: 'Tax & Compliance',
    fields: [
      { label: 'Tax Registered', value: bp.taxRegistered ? 'Yes' : 'No' },
      ...(bp.taxJurisdiction ? [{ label: 'Tax Jurisdiction', value: bp.taxJurisdiction }] : []),
      { label: 'Compliance Docs', value: String(bp.complianceDocuments.length) },
    ],
  });

  if (defaultBank) {
    sections.push({
      title: 'Default Bank Account',
      fields: [
        { label: 'Bank',           value: defaultBank.bankName },
        { label: 'Branch',         value: defaultBank.branchName || 'â€”' },
        { label: 'Account Holder', value: defaultBank.accountHolderName },
        { label: 'Account No.',    value: `â€¢â€¢â€¢â€¢${defaultBank.accountNumber.slice(-4)}`, mono: true },
        { label: 'Account Type',   value: defaultBank.accountType },
        { label: 'Currency',       value: defaultBank.defaultCurrency },
      ],
    });
  }

  if (bp.itemMappings.length > 0) {
    sections.push({
      title: 'Item Mapping',
      fields: [
        { label: 'Mapped Items', value: String(bp.itemMappings.length) },
        {
          label: 'Items',
          value: bp.itemMappings.slice(0, 3).map((m) => m.itemName).join(', ') +
            (bp.itemMappings.length > 3 ? ` +${bp.itemMappings.length - 3} more` : ''),
          span: 2,
        },
      ],
    });
  }

  return sections;
}

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const SupplierListPage: React.FC = () => {
  const navigate = useNavigate();

  // â”€â”€ Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [records, setRecords] = useState<BusinessPartner[]>(() => supplierService.getAll());

  // â”€â”€ Filters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [searchQuery,        setSearchQuery]        = useState('');
  const [filterStatus,       setFilterStatus]       = useState('');
  const [filterType,         setFilterType]         = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // â”€â”€ Activate flow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [activateTarget, setActivateTarget] = useState<BusinessPartner | null>(null);
  const [activateOpen,   setActivateOpen]   = useState(false);

  // â”€â”€ Inactivate flow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [inactivateTarget, setInactivateTarget] = useState<BusinessPartner | null>(null);
  const [inactivateReason, setInactivateReason] = useState('');
  const [inactivateOpen,   setInactivateOpen]   = useState(false);

  // â”€â”€ Delete flow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [deleteTarget, setDeleteTarget] = useState<BusinessPartner | null>(null);
  const [deleteOpen,   setDeleteOpen]   = useState(false);

  // â”€â”€ Preview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [previewBP,   setPreviewBP]   = useState<BusinessPartner | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // â”€â”€ Help â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [helpOpen, setHelpOpen] = useState(false);

  // â”€â”€ UI state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [pickerOpen, setPickerOpen] = useState(false);


  // â”€â”€ Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  function showToast(message: string, tone: 'success' | 'error') {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3500);
  }

  // â”€â”€ Recent admin master tracking â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const master = findMasterByKey(MASTER_KEY);
    const group  = findGroupForMasterKey(MASTER_KEY);
    if (master && group) {
      recordRecentAdminMaster({
        key:            master.key,
        label:          master.label,
        path:           master.path,
        groupLabel:     group.label,
        groupIconBg:    group.iconBg,
        groupIconColor: group.iconColor,
      });
    }
  }, []);

  // â”€â”€ Filtered list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((bp) => {
      if (filterStatus && bp.status !== filterStatus) return false;
      if (filterType   && bp.bpType   !== filterType)  return false;
      if (q) {
        const haystack =
          `${bp.bpCode} ${bp.bpLegalName} ${bp.marketingName} ${bp.displayName} ${bp.bpType} ${bp.bpCategory}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [records, searchQuery, filterStatus, filterType]);

  // â”€â”€ Quick filter counts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // â”€â”€ Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  function handleQuickFilter(key: string) {
    setFilterStatus(key === 'all' ? '' : key);
  }

  function handleActivateClick(bp: BusinessPartner) {
    setActivateTarget(bp);
    setActivateOpen(true);
  }

  function confirmActivate() {
    if (!activateTarget) return;
    supplierService.activate(activateTarget.id);
    setRecords(supplierService.getAll());
    setActivateOpen(false);
    showToast(`"${activateTarget.bpLegalName}" activated.`, 'success');
    setActivateTarget(null);
  }

  function handleInactivateClick(bp: BusinessPartner) {
    setInactivateTarget(bp);
    setInactivateReason('');
    setInactivateOpen(true);
  }

  function confirmInactivate() {
    if (!inactivateTarget || !inactivateReason.trim()) return;
    supplierService.inactivate(inactivateTarget.id, inactivateReason.trim());
    setRecords(supplierService.getAll());
    setInactivateOpen(false);
    showToast(`"${inactivateTarget.bpLegalName}" inactivated.`, 'success');
    setInactivateTarget(null);
    setInactivateReason('');
  }

  function handleDeleteClick(bp: BusinessPartner) {
    setDeleteTarget(bp);
    setDeleteOpen(true);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    supplierService.delete(deleteTarget.id);
    setRecords(supplierService.getAll());
    setDeleteOpen(false);
    showToast(`"${deleteTarget.bpLegalName}" deleted.`, 'success');
    setDeleteTarget(null);
  }

  // â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const hasFilters = Boolean(filterStatus || filterType);

  const gridColumns: DataGridColumn<BusinessPartner>[] = [
    {
      id: 'bpCode',
      label: 'Code',
      type: 'text',
      width: 126,
      minWidth: 112,
      hideable: false,
      defaultPin: 'left',
      getValue: (bp) => bp.bpCode,
      renderCell: (bp) => (
        <MasterTableIdentifierLink label={bp.bpCode} onClick={() => { setPreviewBP(bp); setPreviewOpen(true); }} />
      ),
    },
    {
      id: 'bpLegalName',
      label: 'Legal Name',
      type: 'text',
      width: 252,
      minWidth: 220,
      hideable: false,
      getValue: (bp) => bp.bpLegalName,
      renderCell: (bp) => (
        <MasterTableTextCell
          primary={bp.bpLegalName}
          secondary={bp.displayName && bp.displayName !== bp.bpLegalName ? bp.displayName : undefined}
          title={bp.bpLegalName}
        />
      ),
    },
    {
      id: 'bpType',
      label: 'Type',
      type: 'enum',
      width: 146,
      minWidth: 132,
      getValue: (bp) => bp.bpType,
      options: BP_TYPES.map((value) => ({ value, label: value })),
      renderCell: (bp) => <MasterTablePill label={bp.bpType} tone={getTypeTone(bp.bpType)} />,
    },
    {
      id: 'bpCategory',
      label: 'Category',
      type: 'text',
      width: 160,
      minWidth: 146,
      getValue: (bp) => bp.bpCategory,
      renderCell: (bp) => <MasterTableTruncate value={bp.bpCategory || '-'} />,
    },
    {
      id: 'countryOfRegistration',
      label: 'Country',
      type: 'text',
      width: 152,
      minWidth: 136,
      getValue: (bp) => bp.countryOfRegistration,
      renderCell: (bp) => <MasterTableTruncate value={bp.countryOfRegistration || '-'} />,
    },
    {
      id: 'contacts',
      label: 'Contacts',
      type: 'number',
      width: 120,
      minWidth: 108,
      getValue: (bp) => bp.contacts.length,
      renderCell: (bp) => {
        const hasPrimaryContact = bp.contacts.some((contact) => contact.contactType === 'Primary');

        return (
          <span className="master-table-inline-meta">
            <User size={11} />
            <span>{bp.contacts.length}</span>
            {hasPrimaryContact ? <Phone size={10} className="master-table-inline-meta__accent" /> : null}
          </span>
        );
      },
    },
    {
      id: 'status',
      label: 'Status',
      type: 'status',
      width: 126,
      minWidth: 112,
      getValue: (bp) => bp.status,
      options: ['Draft', 'Active', 'Inactive'].map((value) => ({ value, label: value })),
      renderCell: (bp) => <MasterTableStatus label={bp.status} tone={getMasterStatusTone(bp.status)} />,
    },
    {
      id: 'actions',
      label: 'Actions',
      type: 'actions',
      width: 92,
      minWidth: 92,
      sortable: false,
      filterable: false,
      groupable: false,
      hideable: false,
      defaultPin: 'right',
      getValue: () => '',
      renderCell: (bp) => (
        <MasterTableRowActions
          rowLabel={bp.bpCode}
          inlineAction={{ label: 'Edit partner', onClick: () => navigate(`/admin/supplier-master/${bp.id}`), icon: <Edit2 size={13} /> }}
          menuActions={[
            {
              label: 'Preview details',
              onSelect: () => {
                setPreviewBP(bp);
                setPreviewOpen(true);
              },
              icon: <Eye size={13} />,
            },
            {
              label: 'Edit partner',
              onSelect: () => navigate(`/admin/supplier-master/${bp.id}`),
              icon: <Edit2 size={13} />,
            },
            ...(bp.status === 'Draft'
              ? [{
                  label: 'Activate',
                  onSelect: () => handleActivateClick(bp),
                  icon: <UserCheck size={13} />,
                }]
              : []),
            ...(bp.status === 'Active'
              ? [{
                  label: 'Inactivate',
                  onSelect: () => handleInactivateClick(bp),
                  icon: <X size={13} />,
                  tone: 'warning' as const,
                  dividerBefore: true,
                }]
              : []),
            ...(bp.status === 'Draft'
              ? [{
                  label: 'Delete',
                  onSelect: () => handleDeleteClick(bp),
                  icon: <Trash2 size={13} />,
                  tone: 'danger' as const,
                  dividerBefore: true,
                }]
              : []),
          ]}
        />
      ),
    },
  ];

  return (
    <AdminShell>
      <AdminListPageShell
        title="Business Partner Master"
        description="Manage suppliers, transporters, financiers, insurance providers, and customers."
        breadcrumbs={['Admin', 'Business Partners', 'Supplier Master']}
        primaryAction={{ label: '+ New Business Partner', onClick: () => setPickerOpen(true) }}
        secondaryActions={[{
          label: 'Filters',
          onClick: () => setShowAdvancedFilters(true),
          icon: <Filter size={13} />,
          iconOnly: true,
          title: 'Open filters',
          active: hasFilters,
        }]}
        helpTopicId="supplier-master"
        onHelpClick={() => setHelpOpen(true)}
        searchValue={searchQuery}
        searchPlaceholder="Search by code, name, or typeâ€¦"
        onSearchChange={setSearchQuery}
      >
        {/* â”€â”€ Table view â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <MasterDataTable
          gridId="supplier-master-table"
          rows={filtered}
          columns={gridColumns}
          rowId={(bp) => bp.id}
          totalCount={records.length}
          emptyState={{
            title: records.length === 0 ? 'No business partners yet' : 'No partners match the current filters',
            description: records.length === 0
              ? 'Add suppliers, transporters, financiers, and other business partners to get started.'
              : 'Try adjusting your search or filters.',
            ...(records.length === 0 ? { action: { label: 'New Business Partner', onClick: () => setPickerOpen(true) } } : {}),
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
        description="Filter business partners by status and partner type."
        fields={[
          {
            id: 'bp-status',
            label: 'Status',
            value: filterStatus,
            placeholder: 'All statuses',
            options: ['Active', 'Draft', 'Inactive'].map((status) => ({ value: status, label: status })),
            onChange: handleQuickFilter,
          },
          {
            id: 'bp-type',
            label: 'BP Type',
            value: filterType,
            placeholder: 'All types',
            options: BP_TYPES.map((type) => ({ value: type, label: type })),
            onChange: setFilterType,
          },
        ]}
      />

      {/* â”€â”€ Activate confirm â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <SmartReviewDrawer
        open={activateOpen}
        onClose={() => setActivateOpen(false)}
        title="Activate Business Partner"
        subtitle={activateTarget?.bpLegalName}
        description="This will make the partner available in transactions."
        checklist={[
          { id: 'legal-name', label: 'Legal name is filled in',       passed: !!activateTarget?.bpLegalName },
          { id: 'bp-type',    label: 'Business partner type selected', passed: !!activateTarget?.bpType },
          { id: 'contact',    label: 'At least one contact added',     passed: (activateTarget?.contacts.length ?? 0) > 0 },
          { id: 'address',    label: 'At least one address added',     passed: (activateTarget?.addresses.length ?? 0) > 0 },
        ]}
        confirmLabel="Activate"
        onConfirm={confirmActivate}
        onCancel={() => setActivateOpen(false)}
      />

      {/* â”€â”€ Inactivate drawer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <SmartFormDrawer
        open={inactivateOpen}
        onClose={() => setInactivateOpen(false)}
        title="Inactivate Business Partner"
        subtitle={inactivateTarget?.bpLegalName}
        onSave={confirmInactivate}
        onCancel={() => setInactivateOpen(false)}
        saveLabel="Inactivate"
        saveDisabled={!inactivateReason.trim()}
        validationErrors={!inactivateReason.trim() ? ['Reason for inactivation is required.'] : []}
      >
        <div style={{ padding: '4px 0 8px' }}>
          <div style={{ padding: '10px 14px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', color: '#9A3412' }}>
              This partner will no longer be available in new transactions.
            </span>
          </div>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>
            Reason for inactivation <span style={{ color: '#DC2626' }}>*</span>
          </label>
          <textarea
            value={inactivateReason}
            onChange={(e) => setInactivateReason(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            placeholder="Enter reasonâ€¦"
          />
        </div>
      </SmartFormDrawer>

      {/* â”€â”€ Delete confirm â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <SmartReviewDrawer
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Business Partner"
        subtitle={deleteTarget?.bpLegalName}
        description="This action cannot be undone. Only Draft records can be deleted."
        checklist={[{ id: 'draft', label: 'Record is in Draft status', passed: deleteTarget?.status === 'Draft' }]}
        warningText="Deletion is permanent. Consider inactivating instead."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      {/* â”€â”€ Preview drawer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <SmartPreviewDrawer
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewBP?.bpLegalName ?? ''}
        subtitle={previewBP?.bpCode}
        statusLabel={previewBP?.status}
        statusTone={
          previewBP?.status === 'Active' ? 'active'
          : previewBP?.status === 'Inactive' ? 'inactive'
          : 'draft'
        }
        summaryFields={previewBP ? [
          { label: 'Type',     value: previewBP.bpType     || 'â€”' },
          { label: 'Category', value: previewBP.bpCategory || 'â€”' },
          { label: 'Country',  value: previewBP.countryOfRegistration || 'â€”' },
        ] : []}
        sections={previewBP ? buildPreviewSections(previewBP) : []}
        primaryAction={{ label: 'Edit', onClick: () => { setPreviewOpen(false); navigate(`/admin/supplier-master/${previewBP?.id}`); } }}
        secondaryActions={[
          ...(previewBP?.status === 'Draft' ? [{ label: 'Activate', onClick: () => { setPreviewOpen(false); handleActivateClick(previewBP!); } }] : []),
          ...(previewBP?.status === 'Active' ? [{ label: 'Inactivate', onClick: () => { setPreviewOpen(false); handleInactivateClick(previewBP!); } }] : []),
        ]}
        dangerAction={
          previewBP?.status === 'Draft'
            ? { label: 'Delete', onClick: () => { setPreviewOpen(false); handleDeleteClick(previewBP!); } }
            : undefined
        }
      />

      {/* â”€â”€ Help drawer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <HelpDrawer
        open={helpOpen}
        topic={getHelpTopic('supplier-master')}
        onClose={() => setHelpOpen(false)}
        titleFallback="Business Partner Master Help"
      />

      {/* â”€â”€ Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {toast && (
        <div
          style={{
            position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 9999, padding: '10px 20px', borderRadius: '10px', fontSize: '13px',
            fontWeight: 500, color: 'white', pointerEvents: 'none',
            background: toast.tone === 'success' ? '#15803D' : '#DC2626',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}
        >
          {toast.message}
        </div>
      )}

      {/* â”€â”€ Type Picker Dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <BPTypePickerDialog open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </AdminShell>
  );
};

export default SupplierListPage;

