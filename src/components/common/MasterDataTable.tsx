import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CheckCircle2, MoreHorizontal, XCircle } from 'lucide-react';
import CommonDataGrid from './CommonDataGrid';
import type { CommonDataGridProps, DataGridColumn } from './dataGridTypes';

export type MasterTableTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
export type MasterTableActionTone = 'default' | 'warning' | 'danger';
export type MasterTableStatusTone = 'neutral' | 'success' | 'danger';

interface MasterDataTableEmptyState {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface MasterTableActionDefinition {
  label: string;
  onSelect: () => void;
  icon?: React.ReactNode;
  tone?: MasterTableActionTone;
  dividerBefore?: boolean;
  disabled?: boolean;
  hidden?: boolean;
}

export interface MasterTableInlineAction {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  tone?: MasterTableActionTone;
}

export interface MasterDataTableProps<TData, TSortKey extends string = string>
  extends Omit<
    CommonDataGridProps<TData, TSortKey>,
    | 'variant'
    | 'showToolbar'
    | 'showChartAction'
    | 'showViewConfiguratorAction'
    | 'showResetAction'
    | 'defaultDensity'
    | 'toolbarEndSlot'
    | 'toolbarLabel'
    | 'chartTitle'
    | 'exportFileName'
  > {
  totalCount: number;
  emptyState: MasterDataTableEmptyState;
  countLabel?: string;
}

export interface CreateMasterIdentifierColumnOptions<TData> {
  id: string;
  label: string;
  getValue: (row: TData) => string;
  onClick: (row: TData) => void;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  hideable?: boolean;
  defaultPin?: 'left' | 'right';
}

export interface CreateMasterTextColumnOptions<TData> {
  id: string;
  label: string;
  primary: (row: TData) => string;
  secondary?: (row: TData) => string | undefined;
  title?: (row: TData) => string | undefined;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  hideable?: boolean;
  sortable?: boolean;
}

export interface CreateMasterStatusColumnOptions<TData> {
  id?: string;
  label?: string;
  getStatus: (row: TData) => string;
  getTone?: (status: string, row: TData) => MasterTableStatusTone;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  options?: string[];
}

export interface CreateMasterActionsColumnOptions<TData> {
  rowLabel: (row: TData) => string;
  inlineAction?: (row: TData) => MasterTableInlineAction | undefined;
  menuActions: (row: TData) => MasterTableActionDefinition[];
  width?: number;
  minWidth?: number;
  maxWidth?: number;
}

function getFooterRangeLabel(rowCount: number, totalCount: number, countLabel: string): string {
  if (totalCount === 0 || rowCount === 0) {
    return `Showing 0 of ${totalCount} ${countLabel}`;
  }

  return `Showing 1-${rowCount} of ${totalCount} ${countLabel}`;
}

function getMenuItemClassName(tone: MasterTableActionTone): string {
  if (tone === 'danger') {
    return 'master-table-action-menu__item master-table-action-menu__item--danger';
  }

  if (tone === 'warning') {
    return 'master-table-action-menu__item master-table-action-menu__item--warning';
  }

  return 'master-table-action-menu__item';
}

export const MasterDataTable = <TData, TSortKey extends string = string>({
  rows,
  totalCount,
  emptyState,
  countLabel = totalCount === 1 ? 'record' : 'records',
  ...gridProps
}: MasterDataTableProps<TData, TSortKey>) => {
  if (rows.length === 0) {
    return (
      <div className="master-table-empty-state">
        <div className="master-table-empty-state__title">{emptyState.title}</div>
        <div className="master-table-empty-state__description">{emptyState.description}</div>
        {emptyState.action && (
          <button type="button" onClick={emptyState.action.onClick} className="master-table-empty-state__action">
            {emptyState.action.label}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="master-table-shell">
      <CommonDataGrid
        {...gridProps}
        rows={rows}
        variant="master"
        showToolbar={false}
        showChartAction={false}
        showViewConfiguratorAction={false}
        showResetAction={false}
        defaultDensity="comfortable"
      />
      <div className="master-table-footer">
        {getFooterRangeLabel(rows.length, totalCount, countLabel)}
      </div>
    </div>
  );
};

export const MasterTableIdentifierLink: React.FC<{
  label: string;
  onClick: () => void;
}> = ({ label, onClick }) => (
  <button type="button" onClick={onClick} className="catalogue-table__document-link master-table__identifier-link">
    {label}
  </button>
);

export const MasterTableTextCell: React.FC<{
  primary: string;
  secondary?: string;
  title?: string;
}> = ({ primary, secondary, title }) => (
  <div className="master-table-text-cell" title={title ?? primary}>
    <div className="master-table-text-cell__primary">{primary}</div>
    {secondary ? <div className="master-table-text-cell__secondary">{secondary}</div> : null}
  </div>
);

export const MasterTableTruncate: React.FC<{
  value: string;
  title?: string;
  mono?: boolean;
}> = ({ value, title, mono = false }) => (
  <span className={mono ? 'master-table-truncate master-table-truncate--mono' : 'master-table-truncate'} title={title ?? value}>
    {value}
  </span>
);

export const MasterTablePill: React.FC<{
  label: string;
  tone?: MasterTableTone;
}> = ({ label, tone = 'neutral' }) => (
  <span className={`master-table-pill master-table-pill--${tone}`}>{label}</span>
);

export const MasterTableTagList: React.FC<{
  labels: string[];
  maxVisible?: number;
  tone?: MasterTableTone;
  overflowTone?: MasterTableTone;
  emptyLabel?: string;
}> = ({
  labels,
  maxVisible = 2,
  tone = 'neutral',
  overflowTone = 'info',
  emptyLabel = '-',
}) => {
  if (labels.length === 0) {
    return <MasterTableTruncate value={emptyLabel} />;
  }

  const visibleLabels = labels.slice(0, maxVisible);
  const overflowCount = labels.length - visibleLabels.length;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      {visibleLabels.map((label) => (
        <MasterTablePill key={label} label={label} tone={tone} />
      ))}
      {overflowCount > 0 ? <MasterTablePill label={`+${overflowCount}`} tone={overflowTone} /> : null}
    </div>
  );
};

export const MasterTableMetric: React.FC<{
  value: string;
  tone?: 'default' | 'success';
}> = ({ value, tone = 'default' }) => (
  <span className={`master-table-metric master-table-metric--${tone}`}>{value}</span>
);

export const MasterTableStatus: React.FC<{
  label: string;
  tone: 'neutral' | 'success' | 'danger';
}> = ({ label, tone }) => (
  <span className={`master-table-status master-table-status--${tone}`}>
    <span className="master-table-status__dot" />
    {label}
  </span>
);

export const MasterTableHealth: React.FC<{
  icon?: React.ReactNode;
  label: string;
  tone: MasterTableTone;
}> = ({ icon, label, tone }) => (
  <span className={`master-table-health master-table-health--${tone}`}>
    {icon ? <span className="master-table-health__icon">{icon}</span> : null}
    <span className="master-table-health__label">{label}</span>
  </span>
);

export const MasterTableBooleanValue: React.FC<{
  value: boolean;
  trueLabel?: string;
  falseLabel?: string;
}> = ({ value, trueLabel = 'Yes', falseLabel = 'No' }) => (
  <span
    className={value ? 'master-table-health master-table-health--success' : 'master-table-health master-table-health--neutral'}
    title={value ? trueLabel : falseLabel}
    aria-label={value ? trueLabel : falseLabel}
  >
    <span className="master-table-health__icon">
      {value ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
    </span>
    <span className="master-table-health__label">{value ? trueLabel : falseLabel}</span>
  </span>
);

export const MasterTableIconButton: React.FC<{
  title: string;
  onClick: () => void;
  tone?: MasterTableActionTone;
  children: React.ReactNode;
}> = ({ title, onClick, tone = 'default', children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onClick={onClick}
    className={
      tone === 'danger'
        ? 'master-table-icon-button master-table-icon-button--danger'
        : tone === 'warning'
          ? 'master-table-icon-button master-table-icon-button--warning'
          : 'master-table-icon-button'
    }
  >
    {children}
  </button>
);

export const MasterTableActionMenu: React.FC<{
  open: boolean;
  children: React.ReactNode;
  labelledBy?: string;
}> = ({ open, children, labelledBy }) => {
  if (!open) {
    return null;
  }

  return (
    <div className="master-table-action-menu" role="menu" aria-labelledby={labelledBy}>
      {children}
    </div>
  );
};

export const MasterTableActionMenuItem: React.FC<{
  onClick: () => void;
  danger?: boolean;
  warning?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({ onClick, danger = false, warning = false, children, disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    role="menuitem"
    disabled={disabled}
    className={getMenuItemClassName(danger ? 'danger' : warning ? 'warning' : 'default')}
  >
    {children}
  </button>
);

export const MasterTableActionMenuDivider = () => <div className="master-table-action-menu__divider" />;

export const MasterTableRowActions: React.FC<{
  rowLabel: string;
  inlineAction?: MasterTableInlineAction;
  menuActions: MasterTableActionDefinition[];
}> = ({ rowLabel, inlineAction, menuActions }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuId = useId();

  const visibleActions = useMemo(
    () => menuActions.filter((action) => !action.hidden),
    [menuActions]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (
        target &&
        !menuRef.current?.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const toggleMenu = () => setOpen((current) => !current);

  return (
    <div className="master-table-row-actions">
      {inlineAction ? (
        <MasterTableIconButton title={inlineAction.label} onClick={inlineAction.onClick} tone={inlineAction.tone}>
          {inlineAction.icon}
        </MasterTableIconButton>
      ) : null}
      <div className="master-table-row-actions__menu-shell" ref={menuRef}>
        <button
          ref={buttonRef}
          id={menuId}
          type="button"
          title={`More actions for ${rowLabel}`}
          aria-label={`More actions for ${rowLabel}`}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={toggleMenu}
          className="master-table-icon-button"
        >
          <MoreHorizontal size={13} />
        </button>
        <MasterTableActionMenu open={open} labelledBy={menuId}>
          {visibleActions.map((action) => (
            <React.Fragment key={action.label}>
              {action.dividerBefore ? <MasterTableActionMenuDivider /> : null}
              <button
                type="button"
                role="menuitem"
                disabled={action.disabled}
                onClick={() => {
                  action.onSelect();
                  setOpen(false);
                }}
                className={getMenuItemClassName(action.tone ?? 'default')}
              >
                {action.icon ? <span className="master-table-action-menu__icon">{action.icon}</span> : null}
                {action.label}
              </button>
            </React.Fragment>
          ))}
        </MasterTableActionMenu>
      </div>
    </div>
  );
};

export function getMasterStatusTone(status: string): 'neutral' | 'success' | 'danger' {
  if (status === 'Active') {
    return 'success';
  }

  if (status === 'Inactive') {
    return 'danger';
  }

  return 'neutral';
}

export function createMasterIdentifierColumn<TData>({
  id,
  label,
  getValue,
  onClick,
  width = 126,
  minWidth = 112,
  maxWidth,
  hideable = false,
  defaultPin = 'left',
}: CreateMasterIdentifierColumnOptions<TData>): DataGridColumn<TData> {
  return {
    id,
    label,
    type: 'text',
    width,
    minWidth,
    maxWidth,
    hideable,
    defaultPin,
    getValue,
    renderCell: (row) => (
      <MasterTableIdentifierLink label={getValue(row)} onClick={() => onClick(row)} />
    ),
  };
}

export function createMasterTextColumn<TData>({
  id,
  label,
  primary,
  secondary,
  title,
  width = 220,
  minWidth = 180,
  maxWidth,
  hideable = true,
  sortable = true,
}: CreateMasterTextColumnOptions<TData>): DataGridColumn<TData> {
  return {
    id,
    label,
    type: 'text',
    width,
    minWidth,
    maxWidth,
    hideable,
    sortable,
    getValue: primary,
    renderCell: (row) => (
      <MasterTableTextCell
        primary={primary(row)}
        secondary={secondary?.(row)}
        title={title?.(row) ?? primary(row)}
      />
    ),
  };
}

export function createMasterStatusColumn<TData>({
  id = 'status',
  label = 'Status',
  getStatus,
  getTone,
  width = 126,
  minWidth = 112,
  maxWidth,
  options,
}: CreateMasterStatusColumnOptions<TData>): DataGridColumn<TData> {
  return {
    id,
    label,
    type: 'status',
    width,
    minWidth,
    maxWidth,
    getValue: getStatus,
    options: (options ?? ['Draft', 'Active', 'Inactive']).map((value) => ({ value, label: value })),
    renderCell: (row) => {
      const status = getStatus(row);
      return (
        <MasterTableStatus
          label={status}
          tone={getTone ? getTone(status, row) : getMasterStatusTone(status)}
        />
      );
    },
  };
}

export function createMasterActionsColumn<TData>({
  rowLabel,
  inlineAction,
  menuActions,
  width = 92,
  minWidth = 92,
  maxWidth,
}: CreateMasterActionsColumnOptions<TData>): DataGridColumn<TData> {
  return {
    id: 'actions',
    label: 'Actions',
    type: 'actions',
    width,
    minWidth,
    maxWidth,
    sortable: false,
    filterable: false,
    groupable: false,
    hideable: false,
    defaultPin: 'right',
    getValue: () => '',
    renderCell: (row) => (
      <MasterTableRowActions
        rowLabel={rowLabel(row)}
        inlineAction={inlineAction?.(row)}
        menuActions={menuActions(row)}
      />
    ),
  };
}

export type { DataGridColumn };
