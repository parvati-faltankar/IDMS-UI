import React, { useCallback, useMemo, useRef, useState } from 'react';
import Drawer from '@mui/material/Drawer';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { ChevronDown, CircleHelp, Copy, Plus, Trash2, X } from 'lucide-react';
import { cn } from '../../utils/classNames';
import { handleGridLastCellTab } from './gridKeyboard';
import type { GridKeyboardEventLike } from './gridKeyboard';
import { Input, Select, Textarea } from './FormControls';
import type {
  EditableGridBulkActionContext,
  EditableGridCellElement,
  EditableGridColumn,
  EditableGridColumnContext,
  EditableGridFooterAggregates,
  EditableGridLayoutColumn,
  EditableGridMobileSummary,
  EditableGridViewPreset,
  EditableTransactionGridProps,
} from './editableTransactionGridTypes';

const selectionColumnId = '__editable-grid-selection__';

const defaultColumnWidthByKind: Record<EditableGridColumn<unknown>['kind'], number> = {
  actions: 78,
  text: 168,
  number: 132,
  date: 160,
  select: 148,
  lookup: 196,
  status: 150,
  computed: 140,
  remarks: 220,
};

function getColumnWidth<TRow>(column: EditableGridColumn<TRow>): number {
  const fallback = defaultColumnWidthByKind[column.kind as EditableGridColumn<unknown>['kind']] ?? 156;
  return column.width ?? Math.max(column.minWidth ?? 0, fallback);
}

function resolveColumnAlignment<TRow>(column: EditableGridColumn<TRow>): 'left' | 'center' | 'right' | undefined {
  return column.align ?? (column.kind === 'number' ? 'right' : column.kind === 'actions' ? 'center' : undefined);
}

function getColumnAlignmentClass<TRow>(
  column: EditableGridColumn<TRow>,
  element: 'cell' | 'body-cell' | 'footer-cell' | 'control' | 'display-cell'
): string | undefined {
  const alignment = resolveColumnAlignment(column);
  return alignment ? `editable-transaction-grid__${element}--align-${alignment}` : undefined;
}

function getStringValue(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value);
}

function getColumnValue<TRow>(
  column: EditableGridColumn<TRow>,
  row: TRow
): unknown {
  return column.getValue?.(row) ?? (row as Record<string, unknown>)[column.id];
}

function getFormattedValue<TRow>(
  column: EditableGridColumn<TRow>,
  row: TRow,
  context: EditableGridColumnContext<TRow>
): string {
  const value = getColumnValue(column, row);
  return column.format?.(value, row, context) ?? getStringValue(value);
}

function resolveFlag<TRow>(
  flag: EditableGridColumn<TRow>['required'] | undefined,
  row: TRow,
  context: EditableGridColumnContext<TRow>
): boolean {
  return typeof flag === 'function' ? flag(row, context) : Boolean(flag);
}

function resolveText<TRow>(
  text: EditableGridColumn<TRow>['placeholder'] | undefined,
  row: TRow,
  context: EditableGridColumnContext<TRow>
): string | undefined {
  return typeof text === 'function' ? text(row, context) : text;
}


function resolveBulkActionFlag<TRow>(
  flag: boolean | ((context: EditableGridBulkActionContext<TRow>) => boolean) | undefined,
  context: EditableGridBulkActionContext<TRow>
): boolean {
  return typeof flag === 'function' ? flag(context) : Boolean(flag);
}

export function isEditableGridInputColumn<TRow>(column: EditableGridColumn<TRow>): boolean {
  return column.kind !== 'actions' && column.kind !== 'computed' && column.kind !== 'status';
}

export function getEditableGridInputColumns<TRow>(
  columns: EditableGridColumn<TRow>[],
  isColumnEnabled: (column: EditableGridColumn<TRow>) => boolean = (column) => column.disabled !== true && column.readOnly !== true
): EditableGridColumn<TRow>[] {
  return columns.filter((column) => isEditableGridInputColumn(column) && isColumnEnabled(column));
}

export function getNextEditableGridColumn<TRow>(
  columns: EditableGridColumn<TRow>[],
  currentColumnId: string,
  isColumnEnabled: (column: EditableGridColumn<TRow>) => boolean = () => true
): EditableGridColumn<TRow> | undefined {
  const editableColumns = getEditableGridInputColumns(columns, isColumnEnabled);
  const currentIndex = editableColumns.findIndex((column) => column.id === currentColumnId);

  return currentIndex >= 0 ? editableColumns[currentIndex + 1] : undefined;
}

export function getLastEditableGridColumn<TRow>(
  columns: EditableGridColumn<TRow>[],
  isColumnEnabled: (column: EditableGridColumn<TRow>) => boolean = () => true
): EditableGridColumn<TRow> | undefined {
  const editableColumns = getEditableGridInputColumns(columns, isColumnEnabled);

  return editableColumns[editableColumns.length - 1];
}

function getFirstRowError<TRow>(
  errors: EditableTransactionGridProps<TRow>['errors'],
  rowId: string
): string | undefined {
  const rowErrors = errors?.[rowId];
  if (!rowErrors) {
    return undefined;
  }

  return Object.values(rowErrors).find((error): error is string => Boolean(error));
}

function getRowColumnError<TRow>(
  errors: EditableTransactionGridProps<TRow>['errors'],
  rowId: string,
  columnId: string
): string | undefined {
  return errors?.[rowId]?.[columnId];
}

export function resolveEditableGridColumns<TRow>(
  columns: EditableGridColumn<TRow>[],
  layoutColumns?: EditableGridLayoutColumn[]
): EditableGridColumn<TRow>[] {
  if (!layoutColumns || layoutColumns.length === 0) {
    return columns;
  }

  const columnMap = new Map(columns.map((column) => [column.id, column]));
  const usedColumnIds = new Set<string>();
  const arrangedColumns: EditableGridColumn<TRow>[] = layoutColumns.flatMap((layoutColumn) => {
    const column = columnMap.get(layoutColumn.key);
    if (!column || usedColumnIds.has(column.id)) {
      return [];
    }

    usedColumnIds.add(column.id);
    const isLocked = Boolean(column.locked || layoutColumn.locked);
    const isVisible = isLocked || layoutColumn.visible !== false || column.hideable === false;
    if (!isVisible) {
      return [];
    }

    return [{
      ...column,
      label: layoutColumn.label?.trim() || column.label,
      locked: isLocked,
    }];
  });

  columns.forEach((column) => {
    if (!usedColumnIds.has(column.id)) {
      arrangedColumns.push(column);
    }
  });

  return arrangedColumns;
}

export function getEditableGridUsableViewPresets(
  viewPresets?: EditableGridViewPreset[]
): EditableGridViewPreset[] {
  return viewPresets?.filter((preset) => !preset.hidden && !preset.disabled) ?? [];
}

export function resolveEditableGridActiveViewPreset(
  viewPresets: EditableGridViewPreset[],
  activeViewId?: string,
  defaultViewId?: string
): EditableGridViewPreset | undefined {
  if (viewPresets.length === 0) {
    return undefined;
  }

  const findPreset = (viewId?: string) => viewId ? viewPresets.find((preset) => preset.id === viewId) : undefined;

  return findPreset(activeViewId) ?? findPreset(defaultViewId) ?? viewPresets[0];
}

export function resolveEditableGridViewColumns<TRow>(
  columns: EditableGridColumn<TRow>[],
  activeViewPreset?: EditableGridViewPreset
): EditableGridColumn<TRow>[] {
  if (!activeViewPreset) {
    return columns;
  }

  const viewColumnIds = new Set(activeViewPreset.columnIds);
  if (viewColumnIds.size === 0) {
    return columns;
  }

  const viewColumns = columns.filter((column) => viewColumnIds.has(column.id));

  return viewColumns.length > 0 ? viewColumns : columns;
}

function buildOffsets<TRow>(
  columns: EditableGridColumn<TRow>[],
  side: 'left' | 'right'
): Record<string, number> {
  const offsets: Record<string, number> = {};
  const pinnedColumns = columns.filter((column) => column.pinned === side);
  const orderedColumns = side === 'right' ? [...pinnedColumns].reverse() : pinnedColumns;

  orderedColumns.reduce((offset, column) => {
    offsets[column.id] = offset;
    return offset + getColumnWidth(column);
  }, 0);

  return offsets;
}

const EditableTransactionGrid = <TRow,>({
  gridId,
  title,
  description,
  lineCountLabel,
  hideHeaderIdentity = false,
  summaryItems,
  attentionMessage,
  headerHelp,
  headerActions,
  primaryActionLabel = 'Add line',
  showInstructionalHint = false,
  selection,
  bulkActions = [],
  selectionColumnLabel = 'Select rows',
  rows,
  columns,
  rowId,
  errors,
  onRowsChange,
  onAddRow,
  onDuplicateRow,
  onDeleteRow,
  isRowComplete,
  createRow,
  onIncompleteRow,
  footerAggregates,
  layoutColumns,
  viewPresets,
  activeViewId,
  defaultViewId,
  onViewChange,
  readOnly = false,
  emptyState,
  ariaLabel,
  mobileEditorTitle,
  getMobileRowSummary,
  forceMobileLayout,
}: EditableTransactionGridProps<TRow>) => {
  const isSmallViewport = useMediaQuery('(max-width: 640px)');
  const useMobileLayout = forceMobileLayout ?? isSmallViewport;
  const [mobileEditingRowId, setMobileEditingRowId] = useState<string | null>(null);
  const [isMobileSelectionMode, setIsMobileSelectionMode] = useState(false);
  const cellControlRefs = useRef(new Map<string, EditableGridCellElement>());
  const lastSelectionAnchorIndexRef = useRef<number | null>(null);
  const mobileLongPressTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  const [uncontrolledActiveViewId, setUncontrolledActiveViewId] = useState<string | undefined>();

  const usableViewPresets = useMemo(
    () => getEditableGridUsableViewPresets(viewPresets),
    [viewPresets]
  );
  const resolvedActiveViewPreset = useMemo(
    () => resolveEditableGridActiveViewPreset(
      usableViewPresets,
      activeViewId ?? uncontrolledActiveViewId,
      defaultViewId
    ),
    [activeViewId, defaultViewId, uncontrolledActiveViewId, usableViewPresets]
  );
  const shouldUseViewPresets = usableViewPresets.length >= 2;
  const shouldShowViewTabs = shouldUseViewPresets;
  const layoutVisibleColumns = useMemo(
    () => resolveEditableGridColumns(columns, layoutColumns),
    [columns, layoutColumns]
  );
  const visibleColumns = useMemo(
    () => resolveEditableGridViewColumns(
      layoutVisibleColumns,
      shouldUseViewPresets ? resolvedActiveViewPreset : undefined
    ),
    [layoutVisibleColumns, resolvedActiveViewPreset, shouldUseViewPresets]
  );
  const editableColumns = useMemo(
    () => visibleColumns.filter((column) => column.kind !== 'actions'),
    [visibleColumns]
  );
  const selectionColumn = useMemo<EditableGridColumn<TRow> | null>(() => {
    if (!selection) {
      return null;
    }

    return {
      id: selectionColumnId,
      label: selectionColumnLabel,
      kind: 'actions',
      width: 46,
      minWidth: 46,
      locked: true,
      pinned: 'left',
      hideable: false,
    };
  }, [selection, selectionColumnLabel]);
  const tableColumns = useMemo(
    () => selectionColumn ? [selectionColumn, ...visibleColumns] : visibleColumns,
    [selectionColumn, visibleColumns]
  );
  const leftOffsets = useMemo(() => buildOffsets(tableColumns, 'left'), [tableColumns]);
  const rightOffsets = useMemo(() => buildOffsets(tableColumns, 'right'), [tableColumns]);
  const aggregateValues = useMemo(
    () => resolveFooterAggregates(rows, visibleColumns, footerAggregates),
    [footerAggregates, rows, visibleColumns]
  );
  const mobileEditingRow = rows.find((row) => rowId(row) === mobileEditingRowId);
  const mobileEditingRowIndex = mobileEditingRow ? rows.indexOf(mobileEditingRow) : -1;
  const resolvedLineCountLabel = lineCountLabel ?? String(rows.length);
  const resolvedLineCountAriaLabel = `${rows.length} ${rows.length === 1 ? 'line' : 'lines'}`;
  const hasHeaderSummary = Boolean(summaryItems?.length || attentionMessage || description);

  const controlledSelectedRowIdSet = useMemo(
    () => new Set(selection?.selectedRowIds ?? []),
    [selection?.selectedRowIds]
  );
  const isSelectionEnabled = Boolean(selection);
  const canUseSelection = Boolean(selection && !readOnly);

  const isRowSelectable = (row: TRow, rowIndex: number) => {
    if (!selection || readOnly) {
      return false;
    }

    return selection.getRowSelectable?.(row, { row, rowId: rowId(row), rowIndex }) ?? true;
  };

  const selectableRowIds = rows
    .filter((row, index) => isRowSelectable(row, index))
    .map((row) => rowId(row));
  const selectableRowIdSet = new Set(selectableRowIds);
  const selectedRows = rows.filter((row, index) => controlledSelectedRowIdSet.has(rowId(row)) && isRowSelectable(row, index));
  const selectedRowIdsInOrder = selectedRows.map((row) => rowId(row));
  const selectedRowIdSet = new Set(selectedRowIdsInOrder);
  const selectedCount = selectedRows.length;
  const selectedSelectableCount = selectedRowIdsInOrder.filter((id) => selectableRowIdSet.has(id)).length;
  const areAllSelectableRowsSelected = selectableRowIds.length > 0 && selectedSelectableCount === selectableRowIds.length;
  const isSomeSelectableRowSelected = selectedSelectableCount > 0 && !areAllSelectableRowsSelected;

  const changeSelection = (nextIds: string[], reason: 'row' | 'range' | 'all' | 'clear' | 'external') => {
    if (!selection || readOnly) {
      return;
    }

    const nextIdSet = new Set(nextIds);
    const normalizedIds = rows
      .map((row) => rowId(row))
      .filter((id, index) => nextIdSet.has(id) && isRowSelectable(rows[index], index));

    selection.onSelectionChange(normalizedIds, { reason });

    if (normalizedIds.length === 0) {
      setIsMobileSelectionMode(false);
    }
  };

  const clearSelection = () => changeSelection([], 'clear');

  const bulkActionContext: EditableGridBulkActionContext<TRow> = {
    selectedRowIds: selectedRowIdsInOrder,
    selectedRows,
    clearSelection,
  };

  const visibleBulkActions = bulkActions.filter((action) => !resolveBulkActionFlag(action.hidden, bulkActionContext));

  const handleSelectAllRows = (checked: boolean) => {
    lastSelectionAnchorIndexRef.current = checked && selectableRowIds.length > 0 ? 0 : null;
    changeSelection(checked ? selectableRowIds : [], 'all');
  };

  const handleRowSelectionChange = (row: TRow, rowIndex: number, checked: boolean, shiftKey: boolean) => {
    if (!isRowSelectable(row, rowIndex)) {
      return;
    }

    const currentIds = new Set(selectedRowIdsInOrder);
    let reason: 'row' | 'range' = 'row';

    if (shiftKey && lastSelectionAnchorIndexRef.current !== null) {
      const startIndex = Math.min(lastSelectionAnchorIndexRef.current, rowIndex);
      const endIndex = Math.max(lastSelectionAnchorIndexRef.current, rowIndex);
      rows.slice(startIndex, endIndex + 1).forEach((rangeRow, rangeOffset) => {
        const absoluteIndex = startIndex + rangeOffset;
        if (!isRowSelectable(rangeRow, absoluteIndex)) {
          return;
        }

        const rangeRowId = rowId(rangeRow);
        if (checked) {
          currentIds.add(rangeRowId);
        } else {
          currentIds.delete(rangeRowId);
        }
      });
      reason = 'range';
    } else if (checked) {
      currentIds.add(rowId(row));
    } else {
      currentIds.delete(rowId(row));
    }

    lastSelectionAnchorIndexRef.current = rowIndex;
    changeSelection(Array.from(currentIds), reason);
  };

  const handleMobileLongPressStart = (row: TRow, rowIndex: number) => {
    if (!canUseSelection || !isRowSelectable(row, rowIndex)) {
      return;
    }

    if (mobileLongPressTimerRef.current) {
      window.clearTimeout(mobileLongPressTimerRef.current);
    }

    mobileLongPressTimerRef.current = window.setTimeout(() => {
      setIsMobileSelectionMode(true);
      handleRowSelectionChange(row, rowIndex, true, false);
    }, 450);
  };

  const cancelMobileLongPress = () => {
    if (mobileLongPressTimerRef.current) {
      window.clearTimeout(mobileLongPressTimerRef.current);
      mobileLongPressTimerRef.current = null;
    }
  };

  const setSelectAllCheckboxRef = (element: HTMLInputElement | null) => {
    if (element) {
      element.indeterminate = isSomeSelectableRowSelected;
    }
  };

  const updateRow = (targetRowId: string, updater: (row: TRow) => TRow) => {
    if (!onRowsChange) {
      return;
    }

    onRowsChange(rows.map((row) => (rowId(row) === targetRowId ? updater(row) : row)));
  };

  const handleAddRow = () => {
    if (readOnly) {
      return;
    }

    if (onAddRow) {
      onAddRow();
      return;
    }

    if (createRow && onRowsChange) {
      onRowsChange([...rows, createRow(rows.length + 1)]);
    }
  };

  const renderBulkToolbar = (variant: 'desktop' | 'mobile' = 'desktop') => {
    if (!isSelectionEnabled || readOnly || selectedCount === 0) {
      return null;
    }

    return (
      <div
        className={cn(
          'editable-transaction-grid__bulk-toolbar',
          variant === 'mobile' && 'editable-transaction-grid__bulk-toolbar--mobile'
        )}
        role="toolbar"
        aria-label={`${selectedCount} selected rows`}
      >
        <span className="editable-transaction-grid__bulk-count">
          {selectedCount} selected
        </span>
        <div className="editable-transaction-grid__bulk-actions">
          {visibleBulkActions.map((action) => {
            const isDisabled = resolveBulkActionFlag(action.disabled, bulkActionContext);

            return (
              <button
                key={action.id}
                type="button"
                className={cn(
                  'editable-transaction-grid__bulk-action',
                  action.tone === 'primary' && 'editable-transaction-grid__bulk-action--primary',
                  action.tone === 'danger' && 'editable-transaction-grid__bulk-action--danger'
                )}
                disabled={isDisabled}
                onClick={() => action.onAction(bulkActionContext)}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            );
          })}
          <button type="button" className="editable-transaction-grid__bulk-action" onClick={clearSelection}>
            Clear
          </button>
        </div>
      </div>
    );
  };

  const renderHeaderSelectedCount = () => {
    if (!isSelectionEnabled || readOnly || selectedCount === 0 || useMobileLayout) {
      return null;
    }

    return (
      <span className="editable-transaction-grid__header-selected-count">
        {selectedCount} selected
      </span>
    );
  };

  const renderHeaderBulkActions = () => {
    if (!isSelectionEnabled || readOnly || selectedCount === 0 || useMobileLayout) {
      return null;
    }

    return (
      <div
        className="editable-transaction-grid__header-selection-actions"
        role="toolbar"
        aria-label={`${selectedCount} selected rows`}
      >
        {visibleBulkActions.map((action) => {
          const isDisabled = resolveBulkActionFlag(action.disabled, bulkActionContext);

          return (
            <button
              key={action.id}
              type="button"
              className={cn(
                'btn btn--outline editable-transaction-grid__header-bulk-action',
                action.icon && 'btn--icon-left',
                action.tone === 'danger' && 'editable-transaction-grid__header-bulk-action--danger'
              )}
              disabled={isDisabled}
              onClick={() => action.onAction(bulkActionContext)}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const handleViewPresetChange = (viewId: string) => {
    if (viewId === resolvedActiveViewPreset?.id) {
      return;
    }

    if (activeViewId === undefined) {
      setUncontrolledActiveViewId(viewId);
    }

    onViewChange?.(viewId);
  };

  const renderViewPresetTabs = () => {
    if (!shouldShowViewTabs) {
      return null;
    }

    return (
      <div className="editable-transaction-grid__view-tabs" role="tablist" aria-label={`${title} grid views`}>
        {usableViewPresets.map((preset) => {
          const isActive = preset.id === resolvedActiveViewPreset?.id;

          return (
            <button
              key={preset.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={cn(
                'editable-transaction-grid__view-tab',
                isActive && 'editable-transaction-grid__view-tab--active'
              )}
              title={preset.description}
              onClick={() => handleViewPresetChange(preset.id)}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    );
  };

  const renderSelectionHeaderCell = (column: EditableGridColumn<TRow>) => {
    const style = {
      width: `${getColumnWidth(column)}px`,
      minWidth: `${getColumnWidth(column)}px`,
      left: `${leftOffsets[column.id]}px`,
    };

    return (
      <th
        key={column.id}
        scope="col"
        className="editable-transaction-grid__cell editable-transaction-grid__cell--selection editable-transaction-grid__cell--pinned-left"
        style={style}
      >
        <input
          ref={setSelectAllCheckboxRef}
          type="checkbox"
          className="editable-transaction-grid__selection-checkbox"
          aria-label={selection?.ariaLabel ?? selectionColumnLabel}
          checked={areAllSelectableRowsSelected}
          disabled={!canUseSelection || selectableRowIds.length === 0}
          onChange={(event) => handleSelectAllRows(event.target.checked)}
        />
      </th>
    );
  };

  const renderSelectionCell = (column: EditableGridColumn<TRow>, row: TRow, rowIndex: number) => {
    const id = rowId(row);
    const selectable = isRowSelectable(row, rowIndex);
    const style = {
      width: `${getColumnWidth(column)}px`,
      minWidth: `${getColumnWidth(column)}px`,
      left: `${leftOffsets[column.id]}px`,
    };

    return (
      <td
        key={column.id}
        className="editable-transaction-grid__body-cell editable-transaction-grid__body-cell--selection editable-transaction-grid__cell--pinned-left"
        style={style}
      >
        <input
          type="checkbox"
          className="editable-transaction-grid__selection-checkbox"
          aria-label={`Select line ${rowIndex + 1}`}
          checked={selectedRowIdSet.has(id)}
          disabled={!canUseSelection || !selectable}
          onChange={(event) => {
            const nativeEvent = event.nativeEvent;
            handleRowSelectionChange(row, rowIndex, event.target.checked, nativeEvent instanceof MouseEvent && nativeEvent.shiftKey);
          }}
        />
      </td>
    );
  };

  const renderActions = (row: TRow, rowIndex: number) => {
    const id = rowId(row);

    return (
      <div className="editable-transaction-grid__row-actions">
        {onDuplicateRow && (
          <Tooltip title="Duplicate line" arrow placement="top">
            <button
              type="button"
              onClick={() => onDuplicateRow(id, row, rowIndex)}
              className="editable-transaction-grid__icon-action"
              aria-label={`Duplicate line ${rowIndex + 1}`}
              disabled={readOnly}
            >
              <Copy size={14} aria-hidden="true" />
            </button>
          </Tooltip>
        )}
        {onDeleteRow && (
          <Tooltip title="Delete line" arrow placement="top">
            <button
              type="button"
              onClick={() => onDeleteRow(id, row, rowIndex)}
              className="editable-transaction-grid__icon-action editable-transaction-grid__delete"
              aria-label={`Delete line ${rowIndex + 1}`}
              disabled={readOnly}
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </Tooltip>
        )}
      </div>
    );
  };

  const buildCellContext = (
    row: TRow,
    rowIndex: number,
    column: EditableGridColumn<TRow>,
    error?: string
  ): EditableGridColumnContext<TRow> => {
    const id = rowId(row);
    const baseContext = {
      gridId,
      row,
      rowId: id,
      rowIndex,
      column,
      error,
      readOnly: false,
      disabled: false,
    };
    const columnReadOnly = readOnly || resolveFlag(column.readOnly, row, baseContext);
    const columnDisabled = columnReadOnly || resolveFlag(column.disabled, row, {
      ...baseContext,
      readOnly: columnReadOnly,
    });

    return {
      ...baseContext,
      readOnly: columnReadOnly,
      disabled: columnDisabled,
    };
  };

  const getResolvedColumnError = (
    row: TRow,
    rowIndex: number,
    column: EditableGridColumn<TRow>
  ): string | undefined => {
    const id = rowId(row);
    const externalError = getRowColumnError(errors, id, column.id);
    if (externalError) {
      return externalError;
    }

    if (!column.validate) {
      return undefined;
    }

    const context = buildCellContext(row, rowIndex, column);
    return column.validate(row, getColumnValue(column, row), context);
  };

  const getLastEditableColumn = (row: TRow, rowIndex: number) =>
    getLastEditableGridColumn(visibleColumns, (candidate) => {
      const candidateContext = buildCellContext(row, rowIndex, candidate);
      return !candidateContext.disabled && !candidateContext.readOnly;
    });

  const isLastEditableColumn = (column: EditableGridColumn<TRow>, row: TRow, rowIndex: number) =>
    getLastEditableColumn(row, rowIndex)?.id === column.id;

  const getRowEditableColumns = (row: TRow, rowIndex: number) =>
    getEditableGridInputColumns(visibleColumns, (candidate) => {
      const candidateContext = buildCellContext(row, rowIndex, candidate);
      return !candidateContext.disabled && !candidateContext.readOnly;
    });

  const focusEditableCell = (row: TRow, column: EditableGridColumn<TRow>) => {
    const element = cellControlRefs.current.get(`${rowId(row)}:${column.id}`);

    if (!element || element.disabled) {
      return;
    }

    element.focus();
    element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };

  const getNextEditableCell = (row: TRow, rowIndex: number, column: EditableGridColumn<TRow>) => {
    const editableColumns = getRowEditableColumns(row, rowIndex);
    const currentColumnIndex = editableColumns.findIndex((candidate) => candidate.id === column.id);

    if (currentColumnIndex >= 0 && currentColumnIndex < editableColumns.length - 1) {
      return { row, column: editableColumns[currentColumnIndex + 1] };
    }

    for (let nextRowIndex = rowIndex + 1; nextRowIndex < rows.length; nextRowIndex += 1) {
      const nextRow = rows[nextRowIndex];
      const [firstEditableColumn] = getRowEditableColumns(nextRow, nextRowIndex);

      if (firstEditableColumn) {
        return { row: nextRow, column: firstEditableColumn };
      }
    }

    return undefined;
  };

  const handleEditableCellTab = (
    event: GridKeyboardEventLike,
    row: TRow,
    rowIndex: number,
    column: EditableGridColumn<TRow>
  ) => {
    if (event.defaultPrevented || event.key !== 'Tab' || event.shiftKey) {
      return;
    }

    const nextEditableCell = getNextEditableCell(row, rowIndex, column);

    if (nextEditableCell) {
      event.preventDefault();
      window.setTimeout(() => focusEditableCell(nextEditableCell.row, nextEditableCell.column), 0);
      return;
    }

    if (isLastEditableColumn(column, row, rowIndex)) {
      handleRowBoundaryTab(event, row, rowIndex);
    }
  };

  const renderCellControl = (
    column: EditableGridColumn<TRow>,
    row: TRow,
    rowIndex: number,
    variant: 'table' | 'mobile'
  ) => {
    const id = rowId(row);
    const error = getResolvedColumnError(row, rowIndex, column);
    const context = buildCellContext(row, rowIndex, column, error);
    const value = getFormattedValue(column, row, context);
    const errorId = error ? `${gridId}-${id}-${column.id}-error` : undefined;
    const className = cn(
      'editable-transaction-grid__control',
      column.kind === 'number' && 'editable-transaction-grid__control--number',
      getColumnAlignmentClass(column, 'control'),
      (context.readOnly || column.kind === 'computed' || column.kind === 'status') && 'editable-transaction-grid__control--readonly',
      variant === 'mobile' && 'editable-transaction-grid__control--mobile',
      column.className
    );
    let currentControlElement: EditableGridCellElement | null = null;
    const handleNativeControlKeyDown = (nativeEvent: Event) => {
      if (!(nativeEvent instanceof KeyboardEvent)) {
        return;
      }

      const target = nativeEvent.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      handleEditableCellTab(nativeEvent, row, rowIndex, column);
    };
    const setControlRef = (element: EditableGridCellElement | null) => {
      if (currentControlElement) {
        currentControlElement.removeEventListener('keydown', handleNativeControlKeyDown, true);
      }

      currentControlElement = element;

      if (element) {
        cellControlRefs.current.set(`${id}:${column.id}`, element);
      } else {
        cellControlRefs.current.delete(`${id}:${column.id}`);
      }

      column.inputRef?.(row, element, context);

      if (element && !context.disabled && !context.readOnly) {
        element.addEventListener('keydown', handleNativeControlKeyDown, true);
      }
    };
    const handleControlKeyDownCapture = (event: React.KeyboardEvent<EditableGridCellElement>) => {
      handleEditableCellTab(event, row, rowIndex, column);
    };

    if (column.kind === 'actions') {
      return renderActions(row, rowIndex);
    }

    if (column.renderDisplay && (context.readOnly || column.kind === 'computed' || column.kind === 'status')) {
      return (
        <div className={cn('editable-transaction-grid__display-cell', getColumnAlignmentClass(column, 'display-cell'))}>
          {column.renderDisplay(row, context)}
        </div>
      );
    }

    if (column.kind === 'status' || column.kind === 'computed') {
      return (
        <Input
          value={value}
          readOnly
          disabled
          className={className}
          aria-describedby={errorId}
        />
      );
    }

    if (column.kind === 'select' || column.kind === 'lookup') {
      const options = typeof column.options === 'function' ? column.options(row, context) : column.options;

      return (
        <Select
          ref={setControlRef}
          value={value}
          error={error}
          disabled={context.disabled}
          mobileLookup={column.kind === 'lookup' || column.mobileLookup}
          lookupTitle={resolveText(column.lookupTitle, row, context)}
          searchPlaceholder={resolveText(column.searchPlaceholder, row, context)}
          searchable={column.searchable}
          aria-describedby={errorId}
          data-tour={resolveDataTour(column, row, rowIndex)}
          options={options}
          onChange={(event) => handleCellChange(column, row, event.target.value, context)}
          onBlur={() => column.onBlur?.(row, context)}
          onKeyDownCapture={handleControlKeyDownCapture}
        onKeyDown={(event) => handleCellKeyDown(event, column, row, rowIndex, context)}
          className={className}
        />
      );
    }

    if (column.kind === 'remarks' && variant === 'mobile') {
      return (
        <Textarea
          ref={setControlRef}
          value={value}
          error={error}
          maxLength={column.maxLength}
          placeholder={resolveText(column.placeholder, row, context)}
          readOnly={context.readOnly}
          disabled={context.disabled}
          aria-describedby={errorId}
          data-tour={resolveDataTour(column, row, rowIndex)}
          onChange={(event) => handleCellChange(column, row, event.target.value, context)}
          onBlur={() => column.onBlur?.(row, context)}
          onKeyDownCapture={handleControlKeyDownCapture}
          onKeyDown={(event) => handleCellKeyDown(event, column, row, rowIndex, context)}
          className={cn(className, 'editable-transaction-grid__textarea')}
        />
      );
    }

    return (
      <Input
        ref={setControlRef}
        value={value}
        type={column.kind === 'date' ? 'date' : 'text'}
        error={error}
        maxLength={column.maxLength}
        inputMode={column.kind === 'number' ? column.inputMode ?? 'decimal' : column.inputMode}
        placeholder={resolveText(column.placeholder, row, context)}
        readOnly={context.readOnly}
        disabled={context.disabled}
        aria-describedby={errorId}
        data-tour={resolveDataTour(column, row, rowIndex)}
        onChange={(event) => handleCellChange(column, row, event.target.value, context)}
        onBlur={() => column.onBlur?.(row, context)}
        onKeyDownCapture={handleControlKeyDownCapture}
        onKeyDown={(event) => handleCellKeyDown(event, column, row, rowIndex, context)}
        className={className}
      />
    );
  };

  const handleCellChange = (
    column: EditableGridColumn<TRow>,
    row: TRow,
    value: string,
    context: EditableGridColumnContext<TRow>
  ) => {
    if (context.disabled) {
      return;
    }

    const nextValue = column.parse?.(value, row, context) ?? value;

    if (column.onChange) {
      column.onChange(row, nextValue, context);
      return;
    }

    if (column.setValue) {
      updateRow(context.rowId, (currentRow) => column.setValue?.(currentRow, nextValue, context) ?? currentRow);
    }
  };

  const handleRowBoundaryTab = useCallback((
    event: GridKeyboardEventLike,
    row: TRow,
    rowIndex: number
  ) => {
    if (event.defaultPrevented || event.key !== 'Tab' || event.shiftKey || !onAddRow || !isRowComplete) {
      return;
    }

    handleGridLastCellTab({
      event,
      line: row,
      lineIndex: rowIndex,
      lines: rows,
      canAddLine: !readOnly,
      isLineComplete: isRowComplete,
      onAddLine: onAddRow,
      onIncompleteLine: onIncompleteRow,
    });
  }, [isRowComplete, onAddRow, onIncompleteRow, readOnly, rows]);

  const handleCellKeyDown = (
    event: React.KeyboardEvent<EditableGridCellElement>,
    column: EditableGridColumn<TRow>,
    row: TRow,
    rowIndex: number,
    context: EditableGridColumnContext<TRow>
  ) => {
    column.onKeyDown?.(event, row, context);
    if (event.defaultPrevented) {
      return;
    }

    handleEditableCellTab(event, row, rowIndex, column);
  };

  const renderError = (row: TRow, rowIndex: number, column: EditableGridColumn<TRow>) => {
    const id = rowId(row);
    const error = getResolvedColumnError(row, rowIndex, column);
    if (!error) {
      return null;
    }

    return (
      <p id={`${gridId}-${id}-${column.id}-error`} className="editable-transaction-grid__error">
        {error}
      </p>
    );
  };

  const renderTableCell = (column: EditableGridColumn<TRow>, row: TRow, rowIndex: number) => {
    if (column.id === selectionColumnId) {
      return renderSelectionCell(column, row, rowIndex);
    }

    const error = getResolvedColumnError(row, rowIndex, column);
    const isNumberColumn = column.kind === 'number';
    const pinState = column.pinned;
    const style =
      pinState === 'left'
        ? { width: `${getColumnWidth(column)}px`, minWidth: `${getColumnWidth(column)}px`, left: `${leftOffsets[column.id]}px` }
        : pinState === 'right'
          ? { width: `${getColumnWidth(column)}px`, minWidth: `${getColumnWidth(column)}px`, right: `${rightOffsets[column.id]}px` }
          : { width: `${getColumnWidth(column)}px`, minWidth: `${getColumnWidth(column)}px` };

    return (
      <td
        key={column.id}
        className={cn(
          'editable-transaction-grid__body-cell',
          column.kind === 'actions' && 'editable-transaction-grid__body-cell--action',
          isNumberColumn && 'editable-transaction-grid__body-cell--number',
          getColumnAlignmentClass(column, 'body-cell'),
          error && 'editable-transaction-grid__body-cell--error',
          pinState === 'left' && 'editable-transaction-grid__cell--pinned-left',
          pinState === 'right' && 'editable-transaction-grid__cell--pinned-right'
        )}
        style={style}
      >
        {renderCellControl(column, row, rowIndex, 'table')}
        {error && (
          <div className="editable-transaction-grid__meta-row">
            {renderError(row, rowIndex, column)}
          </div>
        )}
      </td>
    );
  };

  const renderMobileSummary = (row: TRow, rowIndex: number): EditableGridMobileSummary => {
    const id = rowId(row);
    const firstError = getFirstRowError(errors, id);
    if (getMobileRowSummary) {
      return getMobileRowSummary(row, { rowId: id, rowIndex, firstError });
    }

    const prioritizedColumns = [...editableColumns]
      .sort((left, right) => (left.mobilePriority ?? 99) - (right.mobilePriority ?? 99))
      .slice(0, 4);
    const [titleColumn, subtitleColumn, ...metricColumns] = prioritizedColumns;
    const titleContext = titleColumn ? buildCellContext(row, rowIndex, titleColumn) : undefined;

    return {
      title: titleColumn && titleContext ? getFormattedValue(titleColumn, row, titleContext) || `Line ${rowIndex + 1}` : `Line ${rowIndex + 1}`,
      subtitle: subtitleColumn ? getFormattedValue(subtitleColumn, row, buildCellContext(row, rowIndex, subtitleColumn)) : undefined,
      detail: firstError,
      metrics: metricColumns.map((column) => ({
        label: column.label,
        value: getFormattedValue(column, row, buildCellContext(row, rowIndex, column)),
      })),
    };
  };

  const renderMobileLayout = () => (
    <div className="editable-transaction-grid__mobile-list">
      {renderBulkToolbar('mobile')}
      {rows.length === 0 ? (
        <div className="editable-transaction-grid__empty">{emptyState ?? 'No lines added yet.'}</div>
      ) : (
        rows.map((row, rowIndex) => {
          const id = rowId(row);
          const summary = renderMobileSummary(row, rowIndex);
          const firstError = getFirstRowError(errors, id);
          const selected = selectedRowIdSet.has(id);
          const selectable = isRowSelectable(row, rowIndex);

          return (
            <article
              key={id}
              className={cn(
                'editable-transaction-grid__mobile-card',
                firstError && 'editable-transaction-grid__mobile-card--error',
                selected && 'editable-transaction-grid__mobile-card--selected',
                isMobileSelectionMode && 'editable-transaction-grid__mobile-card--selection-mode'
              )}
              onPointerDown={() => handleMobileLongPressStart(row, rowIndex)}
              onPointerUp={cancelMobileLongPress}
              onPointerLeave={cancelMobileLongPress}
              onPointerCancel={cancelMobileLongPress}
            >
              <button
                type="button"
                className="editable-transaction-grid__mobile-card-main"
                aria-pressed={isMobileSelectionMode ? selected : undefined}
                onClick={() => {
                  cancelMobileLongPress();
                  if (isMobileSelectionMode && selectable) {
                    handleRowSelectionChange(row, rowIndex, !selected, false);
                    return;
                  }

                  setMobileEditingRowId(id);
                }}
              >
                <span className="editable-transaction-grid__mobile-card-title">{summary.title}</span>
                {summary.subtitle && <span className="editable-transaction-grid__mobile-card-subtitle">{summary.subtitle}</span>}
                {summary.metrics && summary.metrics.length > 0 && (
                  <span className="editable-transaction-grid__mobile-metrics">
                    {summary.metrics.map((metric) => (
                      <span key={metric.label} className="editable-transaction-grid__mobile-metric">
                        <span>{metric.label}</span>
                        <strong>{metric.value}</strong>
                      </span>
                    ))}
                  </span>
                )}
                {summary.detail && <span className="editable-transaction-grid__mobile-error">{summary.detail}</span>}
              </button>
              <div className="editable-transaction-grid__mobile-card-side">
                {canUseSelection && (
                  <input
                    type="checkbox"
                    className="editable-transaction-grid__selection-checkbox editable-transaction-grid__mobile-selection-checkbox"
                    aria-label={`Select line ${rowIndex + 1}`}
                    checked={selected}
                    disabled={!selectable}
                    onPointerDown={(event) => event.stopPropagation()}
                    onChange={(event) => {
                      setIsMobileSelectionMode(true);
                      const nativeEvent = event.nativeEvent;
                      handleRowSelectionChange(row, rowIndex, event.target.checked, nativeEvent instanceof MouseEvent && nativeEvent.shiftKey);
                    }}
                  />
                )}
                {summary.status}
                {!readOnly && !isMobileSelectionMode && renderActions(row, rowIndex)}
              </div>
            </article>
          );
        })
      )}
    </div>
  );

  const renderMobileEditor = () => {
    if (!mobileEditingRow) {
      return null;
    }

    const titleText =
      typeof mobileEditorTitle === 'function'
        ? mobileEditorTitle(mobileEditingRow, mobileEditingRowIndex)
        : mobileEditorTitle ?? `Line ${mobileEditingRowIndex + 1}`;

    return (
      <Drawer
        anchor="bottom"
        open={Boolean(mobileEditingRow)}
        onClose={() => setMobileEditingRowId(null)}
        ModalProps={{ keepMounted: true }}
        slotProps={{
          paper: {
            className: 'editable-transaction-grid__mobile-editor-paper',
            sx: {
              width: '100vw',
              maxWidth: '100vw',
              maxHeight: '92dvh',
              m: 0,
              borderRadius: '20px 20px 0 0',
              backgroundImage: 'none',
              overflow: 'hidden',
            },
          },
        }}
      >
        <section className="editable-transaction-grid__mobile-editor" aria-label={titleText}>
          <header className="editable-transaction-grid__mobile-editor-header">
            <h3>{titleText}</h3>
            <button
              type="button"
              className="editable-transaction-grid__mobile-editor-close"
              onClick={() => setMobileEditingRowId(null)}
              aria-label="Close line editor"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>
          <div className="editable-transaction-grid__mobile-editor-body">
            {editableColumns.map((column) => {
              const context = buildCellContext(mobileEditingRow, mobileEditingRowIndex, column);
              const required = resolveFlag(column.required, mobileEditingRow, context);

              return (
                <label key={column.id} className="editable-transaction-grid__mobile-field">
                  <span className="editable-transaction-grid__mobile-field-label">
                    {column.label}
                    {required && <span aria-hidden="true"> *</span>}
                  </span>
                  {renderCellControl(column, mobileEditingRow, mobileEditingRowIndex, 'mobile')}
                  {getResolvedColumnError(mobileEditingRow, mobileEditingRowIndex, column) && (
                    <span className="editable-transaction-grid__meta-row editable-transaction-grid__meta-row--mobile">
                      {renderError(mobileEditingRow, mobileEditingRowIndex, column)}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </section>
      </Drawer>
    );
  };

  return (
    <section
      className={cn('editable-transaction-grid', shouldShowViewTabs && 'editable-transaction-grid--has-view-presets')}
      data-grid-id={gridId}
    >
      <div className="editable-transaction-grid__header">
        <div className="editable-transaction-grid__title-wrap">
          {!hideHeaderIdentity && (
            <div className="editable-transaction-grid__title-row">
              <ChevronDown size={16} className="editable-transaction-grid__title-icon" aria-hidden="true" />
              <h4 className="editable-transaction-grid__title">{title}</h4>
              <span className="editable-transaction-grid__count" aria-label={resolvedLineCountAriaLabel}>{resolvedLineCountLabel}</span>
            </div>
          )}
          {hasHeaderSummary && (
            <div className="editable-transaction-grid__summary-row">
              {summaryItems?.map((item, index) => (
                <span key={index} className="editable-transaction-grid__summary-chip">{item}</span>
              ))}
              {attentionMessage && <span className="editable-transaction-grid__attention">{attentionMessage}</span>}
              {description && <span className="editable-transaction-grid__subtitle">{description}</span>}
            </div>
          )}
          {renderViewPresetTabs()}
          {renderHeaderSelectedCount()}
        </div>

        <div className="editable-transaction-grid__header-actions">
          {showInstructionalHint && headerHelp && (
            <Tooltip title={headerHelp} arrow>
              <button type="button" className="editable-transaction-grid__help-button" aria-label="Grid help">
                <CircleHelp size={14} aria-hidden="true" />
              </button>
            </Tooltip>
          )}
          {headerActions}
          {renderHeaderBulkActions()}
          <button
            type="button"
            onClick={handleAddRow}
            className="btn btn--outline btn--icon-left editable-transaction-grid__add-button"
            disabled={readOnly}
          >
            <Plus size={14} aria-hidden="true" />
            {primaryActionLabel}
          </button>
        </div>
      </div>

      {useMobileLayout ? (
        renderMobileLayout()
      ) : (
        <div className="editable-transaction-grid__table-wrap">
          <table aria-label={ariaLabel} className="editable-transaction-grid__table">
            <caption className="sr-only">{ariaLabel}</caption>
            <thead>
              <tr>
                {tableColumns.map((column) => {
                  if (column.id === selectionColumnId) {
                    return renderSelectionHeaderCell(column);
                  }

                  const style =
                    column.pinned === 'left'
                      ? { width: `${getColumnWidth(column)}px`, minWidth: `${getColumnWidth(column)}px`, left: `${leftOffsets[column.id]}px` }
                      : column.pinned === 'right'
                        ? { width: `${getColumnWidth(column)}px`, minWidth: `${getColumnWidth(column)}px`, right: `${rightOffsets[column.id]}px` }
                        : { width: `${getColumnWidth(column)}px`, minWidth: `${getColumnWidth(column)}px` };

                  return (
                    <th
                      key={column.id}
                      scope="col"
                      className={cn(
                        'editable-transaction-grid__cell',
                        column.kind === 'actions' && 'editable-transaction-grid__cell--action',
                        column.kind === 'number' && 'editable-transaction-grid__cell--number',
                        getColumnAlignmentClass(column, 'cell'),
                        column.pinned === 'left' && 'editable-transaction-grid__cell--pinned-left',
                        column.pinned === 'right' && 'editable-transaction-grid__cell--pinned-right',
                        column.headerClassName
                      )}
                      style={style}
                    >
                      {column.kind === 'actions' ? <span className="sr-only">Line actions</span> : column.label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={tableColumns.length} className="editable-transaction-grid__empty-cell">
                    {emptyState ?? 'No lines added yet.'}
                  </td>
                </tr>
              ) : (
                rows.map((row, rowIndex) => {
                  const id = rowId(row);
                  const firstError = getFirstRowError(errors, id);

                  return (
                    <tr
                      key={id}
                      className={cn(
                        firstError && 'editable-transaction-grid__row--error',
                        selectedRowIdSet.has(id) && 'editable-transaction-grid__row--selected'
                      )}
                    >
                      {tableColumns.map((column) => renderTableCell(column, row, rowIndex))}
                    </tr>
                  );
                })
              )}
            </tbody>
            {tableColumns.length > 0 && (
              <tfoot>
                <tr>
                  {tableColumns.map((column) => {
                    const businessColumnIndex = visibleColumns.findIndex((visibleColumn) => visibleColumn.id === column.id);
                    const footerContent = column.id === selectionColumnId
                      ? ''
                      : businessColumnIndex === 0
                        ? 'Total'
                        : aggregateValues[column.id] ?? '';

                    return (
                      <td
                        key={column.id}
                        className={cn(
                          'editable-transaction-grid__footer-cell',
                          column.kind === 'number' && 'editable-transaction-grid__footer-cell--number',
                          getColumnAlignmentClass(column, 'footer-cell'),
                          column.pinned === 'left' && 'editable-transaction-grid__cell--pinned-left',
                          column.pinned === 'right' && 'editable-transaction-grid__cell--pinned-right',
                          column.footerClassName
                        )}
                        style={
                          column.pinned === 'left'
                            ? { width: `${getColumnWidth(column)}px`, minWidth: `${getColumnWidth(column)}px`, left: `${leftOffsets[column.id]}px` }
                            : column.pinned === 'right'
                              ? { width: `${getColumnWidth(column)}px`, minWidth: `${getColumnWidth(column)}px`, right: `${rightOffsets[column.id]}px` }
                              : { width: `${getColumnWidth(column)}px`, minWidth: `${getColumnWidth(column)}px` }
                        }
                      >
                        {footerContent}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {renderMobileEditor()}
    </section>
  );
};

function resolveFooterAggregates<TRow>(
  rows: TRow[],
  visibleColumns: EditableGridColumn<TRow>[],
  footerAggregates?: EditableGridFooterAggregates<TRow>
): Record<string, React.ReactNode> {
  if (typeof footerAggregates === 'function') {
    return footerAggregates(rows, visibleColumns);
  }

  if (footerAggregates) {
    return footerAggregates;
  }

  return Object.fromEntries(
    visibleColumns
      .filter((column) => column.aggregate)
      .map((column) => [column.id, column.aggregate?.(rows)])
  );
}

function resolveDataTour<TRow>(
  column: EditableGridColumn<TRow>,
  row: TRow,
  rowIndex: number
): string | undefined {
  return typeof column.dataTour === 'function' ? column.dataTour(row, rowIndex) : column.dataTour;
}

export default EditableTransactionGrid;


























