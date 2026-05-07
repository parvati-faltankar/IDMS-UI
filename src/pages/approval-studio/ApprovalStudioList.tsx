import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  Copy,
  Eye,
  FileText,
  Filter,
  MoreVertical,
  PencilLine,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import AppShell from '../../components/common/AppShell';
import CommonDataGrid from '../../components/common/CommonDataGrid';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import type { DataGridColumn } from '../../components/common/dataGridTypes';
import { Input, Select } from '../../components/common/FormControls';
import SideDrawer from '../../components/common/SideDrawer';
import { cn } from '../../utils/classNames';
import { formatDateTime } from '../../utils/dateFormat';
import {
  archiveApprovalWorkflow,
  deleteApprovalWorkflow,
  duplicateApprovalWorkflow,
  fetchApprovalWorkflows,
  type ApprovalWorkflowRecord,
  type ApprovalWorkflowStatus,
  type ApprovalWorkflowType,
} from './approvalStudioData';

interface ApprovalStudioListProps {
  onNew: () => void;
  onView: (workflowId: string) => void;
  onEdit: (workflowId: string) => void;
}

interface ApprovalStudioFilters {
  status: ApprovalWorkflowStatus | '';
  type: ApprovalWorkflowType | '';
  owner: string;
  createdFrom: string;
  createdTo: string;
  updatedFrom: string;
  updatedTo: string;
}

const defaultFilters: ApprovalStudioFilters = {
  status: '',
  type: '',
  owner: '',
  createdFrom: '',
  createdTo: '',
  updatedFrom: '',
  updatedTo: '',
};

function mapStatusBadgeClass(status: ApprovalWorkflowStatus) {
  switch (status) {
    case 'Active':
      return 'brand-badge--approved';
    case 'Paused':
      return 'brand-badge--pending';
    case 'Archived':
      return 'brand-badge--cancelled';
    default:
      return 'brand-badge--draft';
  }
}

function isDateWithinRange(value: string, from: string, to: string) {
  const normalized = value.slice(0, 10);
  if (from && normalized < from) {
    return false;
  }
  if (to && normalized > to) {
    return false;
  }
  return true;
}

const ApprovalStudioList: React.FC<ApprovalStudioListProps> = ({ onNew, onView, onEdit }) => {
  const [workflows, setWorkflows] = useState<ApprovalWorkflowRecord[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [searchText, setSearchText] = useState('');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<ApprovalStudioFilters>(defaultFilters);
  const [draftFilters, setDraftFilters] = useState<ApprovalStudioFilters>(defaultFilters);
  const [dateError, setDateError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [menuAnchorRect, setMenuAnchorRect] = useState<DOMRect | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'archive' | 'delete';
    workflow: ApprovalWorkflowRecord;
  } | null>(null);
  const actionMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    let isMounted = true;
    setLoadState('loading');

    fetchApprovalWorkflows()
      .then((records) => {
        if (!isMounted) {
          return;
        }
        setWorkflows(records);
        setLoadState('ready');
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setLoadState('error');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!openActionMenuId) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const node = actionMenuRefs.current[openActionMenuId];
      if (node && !node.contains(event.target as Node)) {
        setOpenActionMenuId(null);
        setMenuAnchorRect(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenActionMenuId(null);
        setMenuAnchorRect(null);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [openActionMenuId]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToastMessage('');
    }, 2800);

    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const ownerOptions = useMemo(
    () => Array.from(new Set(workflows.map((workflow) => workflow.owner))).sort(),
    [workflows]
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return workflows.filter((workflow) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        workflow.name.toLowerCase().includes(normalizedSearch) ||
        workflow.description.toLowerCase().includes(normalizedSearch) ||
        workflow.status.toLowerCase().includes(normalizedSearch) ||
        workflow.type.toLowerCase().includes(normalizedSearch) ||
        workflow.owner.toLowerCase().includes(normalizedSearch) ||
        workflow.ownerTeam.toLowerCase().includes(normalizedSearch);

      const matchesStatus = !filters.status || workflow.status === filters.status;
      const matchesType = !filters.type || workflow.type === filters.type;
      const matchesOwner = !filters.owner || workflow.owner === filters.owner;
      const matchesCreated = isDateWithinRange(workflow.createdAt, filters.createdFrom, filters.createdTo);
      const matchesUpdated = isDateWithinRange(workflow.updatedAt, filters.updatedFrom, filters.updatedTo);

      return matchesSearch && matchesStatus && matchesType && matchesOwner && matchesCreated && matchesUpdated;
    });
  }, [filters, searchText, workflows]);

  const sortedRows = useMemo(() => {
    const rows = [...filteredRows];
    rows.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
    return rows;
  }, [filteredRows]);

  const activeFilterCount = useMemo(() => {
    return [
      filters.status,
      filters.type,
      filters.owner,
      filters.createdFrom,
      filters.createdTo,
      filters.updatedFrom,
      filters.updatedTo,
    ].filter((value) => value !== '').length;
  }, [filters]);

  const handleReload = () => {
    setLoadState('loading');
    fetchApprovalWorkflows()
      .then((records) => {
        setWorkflows(records);
        setLoadState('ready');
      })
      .catch(() => {
        setLoadState('error');
      });
  };

  const handleFilterDateChange = (field: keyof ApprovalStudioFilters, value: string) => {
    const nextFilters = { ...draftFilters, [field]: value };
    setDraftFilters(nextFilters);

    if (nextFilters.createdFrom && nextFilters.createdTo && nextFilters.createdTo < nextFilters.createdFrom) {
      setDateError('Created To cannot be earlier than Created From.');
      return;
    }

    if (nextFilters.updatedFrom && nextFilters.updatedTo && nextFilters.updatedTo < nextFilters.updatedFrom) {
      setDateError('Updated To cannot be earlier than Updated From.');
      return;
    }

    setDateError('');
  };

  const applyFilters = () => {
    if (dateError) {
      return;
    }
    setFilters(draftFilters);
    setIsFilterDrawerOpen(false);
  };

  const resetFilters = () => {
    setDraftFilters(defaultFilters);
    setFilters(defaultFilters);
    setDateError('');
    setIsFilterDrawerOpen(false);
  };

  const runDuplicate = (workflowId: string) => {
    const duplicatedRecord = duplicateApprovalWorkflow(workflowId);
    if (!duplicatedRecord) {
      return;
    }

    setWorkflows((current) => [duplicatedRecord, ...current]);
    setToastMessage('Approval workflow duplicated as draft.');
    setOpenActionMenuId(null);
    setMenuAnchorRect(null);
  };

  const runArchive = (workflowId: string) => {
    const archivedRecord = archiveApprovalWorkflow(workflowId);
    if (!archivedRecord) {
      return;
    }

    setWorkflows((current) =>
      current.map((workflow) => (workflow.id === workflowId ? archivedRecord : workflow))
    );
    setToastMessage('Approval workflow archived.');
  };

  const runDelete = (workflowId: string) => {
    const deleted = deleteApprovalWorkflow(workflowId);
    if (!deleted) {
      return;
    }

    setWorkflows((current) => current.filter((workflow) => workflow.id !== workflowId));
    setToastMessage('Approval workflow deleted.');
  };

  const handleConfirmAction = () => {
    if (!confirmAction) {
      return;
    }

    if (confirmAction.type === 'archive') {
      runArchive(confirmAction.workflow.id);
    } else {
      runDelete(confirmAction.workflow.id);
    }

    setConfirmAction(null);
    setOpenActionMenuId(null);
    setMenuAnchorRect(null);
  };

  const renderRowActions = (workflow: ApprovalWorkflowRecord) => (
    <div
      ref={(element) => {
        actionMenuRefs.current[workflow.id] = element;
      }}
      className="catalogue-action-menu"
    >
      <button
        type="button"
        className="catalogue-action-menu__trigger"
        aria-label={`Open actions for ${workflow.name}`}
        aria-expanded={openActionMenuId === workflow.id}
        onClick={(event) => {
          const nextIsOpen = openActionMenuId !== workflow.id;
          const rect = (event.currentTarget as HTMLButtonElement).getBoundingClientRect();
          setMenuAnchorRect(nextIsOpen ? rect : null);
          setOpenActionMenuId(nextIsOpen ? workflow.id : null);
        }}
      >
        <MoreVertical size={15} />
      </button>

      {openActionMenuId === workflow.id && menuAnchorRect && (
        <div
          className="catalogue-action-menu__panel"
          role="menu"
          aria-label={`Actions for ${workflow.name}`}
          style={{
            position: 'fixed',
            top: menuAnchorRect.bottom + 8,
            left: Math.max(12, Math.min(menuAnchorRect.left - 132, window.innerWidth - 196)),
          }}
        >
          <button type="button" className="catalogue-action-menu__item" role="menuitem" onClick={() => onView(workflow.id)}>
            <Eye size={16} />
            View
          </button>
          <button type="button" className="catalogue-action-menu__item" role="menuitem" onClick={() => onEdit(workflow.id)}>
            <PencilLine size={16} />
            Edit
          </button>
          <button type="button" className="catalogue-action-menu__item" role="menuitem" onClick={() => runDuplicate(workflow.id)}>
            <Copy size={16} />
            Duplicate
          </button>
          <button
            type="button"
            className="catalogue-action-menu__item"
            role="menuitem"
            onClick={() => setConfirmAction({ type: 'archive', workflow })}
          >
            <Archive size={16} />
            Archive
          </button>
          <button
            type="button"
            className="catalogue-action-menu__item catalogue-action-menu__item--danger"
            role="menuitem"
            onClick={() => setConfirmAction({ type: 'delete', workflow })}
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      )}
    </div>
  );

  const gridColumns: DataGridColumn<ApprovalWorkflowRecord>[] = [
    {
      id: 'name',
      label: 'Approval name',
      type: 'text',
      width: 220,
      hideable: false,
      getValue: (row) => row.name,
      renderCell: (row) => (
        <button type="button" className="catalogue-table__document-link" onClick={() => onView(row.id)}>
          {row.name}
        </button>
      ),
    },
    {
      id: 'description',
      label: 'Description',
      type: 'text',
      width: 286,
      getValue: (row) => row.description,
      renderCell: (row) => (
        <div className="catalogue-table__truncate" title={row.description}>
          {row.description}
        </div>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      type: 'status',
      width: 136,
      getValue: (row) => row.status,
      options: [
        { value: 'Draft', label: 'Draft' },
        { value: 'Active', label: 'Active' },
        { value: 'Paused', label: 'Paused' },
        { value: 'Archived', label: 'Archived' },
      ],
      renderCell: (row) => (
        <span className={cn('brand-badge', mapStatusBadgeClass(row.status))}>{row.status}</span>
      ),
    },
    {
      id: 'type',
      label: 'Type',
      type: 'enum',
      width: 150,
      getValue: (row) => row.type,
      options: [
        { value: 'Sequential', label: 'Sequential' },
        { value: 'Parallel', label: 'Parallel' },
        { value: 'Conditional', label: 'Conditional' },
        { value: 'Multi-level', label: 'Multi-level' },
      ],
      renderCell: (row) => row.type,
    },
    {
      id: 'owner',
      label: 'Owner',
      type: 'text',
      width: 156,
      getValue: (row) => row.owner,
      renderCell: (row) => row.owner,
    },
    {
      id: 'updatedAt',
      label: 'Last updated',
      type: 'date',
      width: 176,
      getValue: (row) => row.updatedAt,
      renderCell: (row) => {
        const updated = formatDateTime(row.updatedAt);
        return (
          <span>
            {updated.dateLabel}, {updated.timeLabel}
          </span>
        );
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      type: 'actions',
      width: 84,
      sortable: false,
      filterable: false,
      groupable: false,
      hideable: false,
      defaultPin: 'right',
      renderCell: (row) => renderRowActions(row),
    },
  ];

  return (
    <AppShell activeLeaf="approval-studio">
      <div className="catalogue-toolbar">
        <div className="catalogue-toolbar__inner catalogue-toolbar__inner--stacked">
          <div className="catalogue-toolbar__top">
            <div className="catalogue-toolbar__heading catalogue-toolbar__heading--stacked">
              <div className="catalogue-toolbar__heading-copy">
                <div className="catalogue-toolbar__title-row">
                  <h2 className="brand-page-title">Approval Studio</h2>
                  <span className="catalogue-toolbar__count">{sortedRows.length}</span>
                </div>
                <p className="brand-page-subtitle">
                  Manage approval components and create end-to-end approval workflows.
                </p>
              </div>
            </div>

            <div className="catalogue-toolbar__actions">
              <div className="catalogue-toolbar__utility-group">
                <div className="catalogue-toolbar__search">
                  <Search size={16} className="catalogue-toolbar__search-icon" />
                  <input
                    type="search"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Search approvals..."
                    className="search-input catalogue-toolbar__search-input"
                    aria-label="Search approval workflows"
                  />
                </div>
              </div>

              <div className="catalogue-toolbar__primary-group">
                <button
                  type="button"
                  className={cn(
                    'btn btn--outline btn--icon-left catalogue-filter-button',
                    activeFilterCount > 0 && 'catalogue-filter-button--active'
                  )}
                  onClick={() => {
                    setDraftFilters(filters);
                    setDateError('');
                    setIsFilterDrawerOpen(true);
                  }}
                  aria-label={
                    activeFilterCount > 0
                      ? `Filter approval workflows. ${activeFilterCount} filters applied.`
                      : 'Filter approval workflows'
                  }
                >
                  <Filter size={16} />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="catalogue-filter-button__badge">{activeFilterCount}</span>
                  )}
                </button>

                <button type="button" onClick={onNew} className="btn btn--primary btn--icon-left">
                  <Plus size={16} />
                  New
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-4 px-4 py-4">
        {toastMessage && <div className="brand-message px-4 py-3 text-sm">{toastMessage}</div>}

        {loadState === 'loading' && (
          <div className="space-y-3" aria-live="polite">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        )}

        {loadState === 'error' && (
          <div className="rounded border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            Approval components could not be loaded right now.
            <button type="button" className="btn btn--outline ml-3" onClick={handleReload}>
              Retry
            </button>
          </div>
        )}

        {loadState === 'ready' && sortedRows.length === 0 && (
          <div className="flex flex-col items-center rounded border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
              <FileText size={28} className="text-slate-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">No approval components found</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-500">
              Create a new approval workflow or adjust your search and filters.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {activeFilterCount > 0 && (
                <button type="button" onClick={resetFilters} className="btn btn--outline">
                  Clear filters
                </button>
              )}
              <button type="button" onClick={onNew} className="btn btn--primary">
                New Approval Workflow
              </button>
            </div>
          </div>
        )}

        {loadState === 'ready' && sortedRows.length > 0 && (
          <CommonDataGrid
            gridId="approval-studio-catalogue-v2"
            rows={sortedRows}
            columns={gridColumns}
            rowId={(row) => row.id}
            chartTitle="Approval Studio"
          />
        )}
      </div>

      <SideDrawer
        isOpen={isFilterDrawerOpen}
        title="Approval filters"
        subtitle="Filter by status, type, owner, and activity date ranges."
        onClose={() => setIsFilterDrawerOpen(false)}
        panelClassName="side-drawer__panel--narrow"
        footer={
          <>
            <button type="button" onClick={resetFilters} className="btn btn--outline">
              Reset
            </button>
            <button type="button" onClick={applyFilters} className="btn btn--primary" disabled={Boolean(dateError)}>
              Apply
            </button>
          </>
        }
      >
        <div className="drawer-form">
          <label className="drawer-form__field">
            <span className="field-label">Status</span>
            <Select
              value={draftFilters.status}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  status: event.target.value as ApprovalWorkflowStatus | '',
                }))
              }
              options={[
                { value: '', label: 'All status' },
                { value: 'Draft', label: 'Draft' },
                { value: 'Active', label: 'Active' },
                { value: 'Paused', label: 'Paused' },
                { value: 'Archived', label: 'Archived' },
              ]}
            />
          </label>

          <label className="drawer-form__field">
            <span className="field-label">Type</span>
            <Select
              value={draftFilters.type}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  type: event.target.value as ApprovalWorkflowType | '',
                }))
              }
              options={[
                { value: '', label: 'All types' },
                { value: 'Sequential', label: 'Sequential' },
                { value: 'Parallel', label: 'Parallel' },
                { value: 'Conditional', label: 'Conditional' },
                { value: 'Multi-level', label: 'Multi-level' },
              ]}
            />
          </label>

          <label className="drawer-form__field">
            <span className="field-label">Owner</span>
            <Select
              value={draftFilters.owner}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  owner: event.target.value,
                }))
              }
              options={[
                { value: '', label: 'All owners' },
                ...ownerOptions.map((owner) => ({ value: owner, label: owner })),
              ]}
            />
          </label>

          <div className="drawer-form__date-grid">
            <label className="drawer-form__field">
              <span className="field-label">Created from</span>
              <Input
                type="date"
                value={draftFilters.createdFrom}
                onChange={(event) => handleFilterDateChange('createdFrom', event.target.value)}
              />
            </label>

            <label className="drawer-form__field">
              <span className="field-label">Created to</span>
              <Input
                type="date"
                value={draftFilters.createdTo}
                onChange={(event) => handleFilterDateChange('createdTo', event.target.value)}
              />
            </label>
          </div>

          <div className="drawer-form__date-grid">
            <label className="drawer-form__field">
              <span className="field-label">Updated from</span>
              <Input
                type="date"
                value={draftFilters.updatedFrom}
                onChange={(event) => handleFilterDateChange('updatedFrom', event.target.value)}
              />
            </label>

            <label className="drawer-form__field">
              <span className="field-label">Updated to</span>
              <Input
                type="date"
                value={draftFilters.updatedTo}
                onChange={(event) => handleFilterDateChange('updatedTo', event.target.value)}
              />
            </label>
          </div>

          {dateError && <p className="field-error">{dateError}</p>}
        </div>
      </SideDrawer>

      <ConfirmationDialog
        isOpen={Boolean(confirmAction)}
        title={confirmAction?.type === 'delete' ? 'Delete approval workflow?' : 'Archive approval workflow?'}
        description={
          confirmAction?.type === 'delete'
            ? `Are you sure you want to delete "${confirmAction?.workflow.name}"? This action cannot be undone.`
            : `Archive "${confirmAction?.workflow.name}"? It will no longer be active.`
        }
        confirmLabel={confirmAction?.type === 'delete' ? 'Delete' : 'Archive'}
        cancelLabel="Cancel"
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />
    </AppShell>
  );
};

export default ApprovalStudioList;
