import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Drawer from '@mui/material/Drawer';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { ChevronDown, ChevronRight, CircleHelp, Copy, Plus, Trash2, X } from 'lucide-react';
import { cn } from '../../utils/classNames';
import { handleGridLastCellTab } from './gridKeyboard';
import type { GridKeyboardEventLike } from './gridKeyboard';
import { Input, Select, Textarea } from './FormControls';
import type {
  EditableGridAddRowResult,
  EditableGridBulkActionContext,
  EditableGridCellElement,
  EditableGridColumn,
  EditableGridColumnContext,
  EditableGridFooterAggregates,
  EditableGridLayoutColumn,
  EditableGridMobileFieldGroup,
  EditableGridMobileSummary,
  EditableGridViewPreset,
  EditableTransactionGridProps,
} from './editableTransactionGridTypes';

const selectionColumnId = '__editable-grid-selection__';

type EditableGridValidationTone = 'error' | 'warning';

interface EditableGridRowValidationMessage {
  columnId: string;
  columnLabel: string;
  message: string;
  tone: EditableGridValidationTone;
}

interface EditableGridMobileIssueSummaryItem<TRow> extends EditableGridRowValidationMessage {
  key: string;
  rowCount: number;
  rowIds: string[];
  rows: TRow[];
  firstRow: TRow;
  firstRowIndex: number;
}

export interface EditableGridMobileLayoutResolutionInput {
  forceMobileLayout?: boolean;
  breakpoint?: 'phone' | 'tablet-portrait';
  isPhoneViewport: boolean;
  isTabletPortraitViewport: boolean;
}

export interface ResolvedEditableGridMobileFieldGroup<TRow> {
  id: string;
  label: string;
  columns: EditableGridColumn<TRow>[];
}

export interface EditableGridMobileEditorOpenGroupResolutionInput {
  groupIds: string[];
  isNewRow: boolean;
  firstErrorGroupId?: string;
  newRowOpenGroupIds?: string[];
  existingRowOpenGroupIds?: string[];
  fallbackGroupId?: string;
}


export function resolveEditableGridMobileLayout({
  forceMobileLayout,
  breakpoint = 'phone',
  isPhoneViewport,
  isTabletPortraitViewport,
}: EditableGridMobileLayoutResolutionInput): boolean {
  if (forceMobileLayout !== undefined) {
    return forceMobileLayout;
  }

  return breakpoint === 'tablet-portrait'
    ? isPhoneViewport || isTabletPortraitViewport
    : isPhoneViewport;
}

export function resolveEditableGridMobileFieldGroups<TRow>(
  columns: EditableGridColumn<TRow>[],
  fieldGroups?: EditableGridMobileFieldGroup<TRow>[]
): ResolvedEditableGridMobileFieldGroup<TRow>[] {
  if (!fieldGroups?.length) {
    return [];
  }

  const columnById = new Map(columns.map((column) => [column.id, column]));
  const usedColumnIds = new Set<string>();
  const resolvedGroups = fieldGroups
    .map((group) => {
      const groupColumns = group.columnIds
        .map((columnId) => columnById.get(String(columnId)))
        .filter((column): column is EditableGridColumn<TRow> => column !== undefined && !usedColumnIds.has(column.id));

      groupColumns.forEach((column) => usedColumnIds.add(column.id));

      return { id: group.id, label: group.label, columns: groupColumns };
    })
    .filter((group) => group.columns.length > 0);

  const ungroupedColumns = columns.filter((column) => !usedColumnIds.has(column.id));
  if (ungroupedColumns.length > 0) {
    resolvedGroups.push({ id: 'other-details', label: 'Other details', columns: ungroupedColumns });
  }

  return resolvedGroups;
}

export function formatEditableGridMobileFieldCount(count: number): string {
  return `${count} ${count === 1 ? 'field' : 'fields'}`;
}

export function resolveEditableGridMobileEditorOpenGroupIds({
  groupIds,
  isNewRow,
  firstErrorGroupId,
  newRowOpenGroupIds,
  existingRowOpenGroupIds,
  fallbackGroupId,
}: EditableGridMobileEditorOpenGroupResolutionInput): string[] {
  const validGroupIds = new Set(groupIds);
  if (firstErrorGroupId && validGroupIds.has(firstErrorGroupId)) {
    return [firstErrorGroupId];
  }

  const configuredGroupIds = isNewRow ? newRowOpenGroupIds : existingRowOpenGroupIds;
  const resolvedGroupIds = Array.from(new Set(configuredGroupIds ?? [])).filter((groupId) => validGroupIds.has(groupId));
  if (resolvedGroupIds.length > 0) {
    return resolvedGroupIds.slice(0, 1);
  }

  if (fallbackGroupId && validGroupIds.has(fallbackGroupId)) {
    return [fallbackGroupId];
  }

  return groupIds.slice(0, 1);
}

export function resolveEditableGridAddedRowId(result: EditableGridAddRowResult): string | undefined {
  if (typeof result === 'string') {
    const rowId = result.trim();
    return rowId || undefined;
  }

  if (result && typeof result === 'object') {
    const rowId = result.rowId;
    return typeof rowId === 'string' && rowId.trim() ? rowId : undefined;
  }

  return undefined;
}
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

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return '';
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
  isColumnEnabled: (column: EditableGridColumn<TRow>) => boolean = (column) => column.disabled !== true && column.readOnly !== true
): EditableGridColumn<TRow> | undefined {
  const editableColumns = getEditableGridInputColumns(columns, isColumnEnabled);
  const currentIndex = editableColumns.findIndex((column) => column.id === currentColumnId);

  return currentIndex >= 0 ? editableColumns[currentIndex + 1] : undefined;
}

export function getLastEditableGridColumn<TRow>(
  columns: EditableGridColumn<TRow>[],
  isColumnEnabled: (column: EditableGridColumn<TRow>) => boolean = (column) => column.disabled !== true && column.readOnly !== true
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

function getRowColumnWarning<TRow>(
  warnings: EditableTransactionGridProps<TRow>['warnings'],
  rowId: string,
  columnId: string
): string | undefined {
  return warnings?.[rowId]?.[columnId];
}

function getCellValidationDescriptionId(
  gridId: string,
  rowId: string,
  columnId: string,
  tone: EditableGridValidationTone = 'error'
): string {
  return `${gridId}-${rowId}-${columnId}-${tone}`;
}

function getValidationColumnLabel<TRow>(column: EditableGridColumn<TRow>): string {
  return column.label.replace(/[.:]+$/, '');
}

function formatValidationMessage(message: EditableGridRowValidationMessage): string {
  return `${message.columnLabel} - ${message.message}`;
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
  warnings,
  validationDisplay = 'cell-inline',
  maxRowValidationMessages = 2,
  onRowsChange,
  onAddRow,
  onMobileEditorClose,
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
  mobileLayout,
  forceMobileLayout,
}: EditableTransactionGridProps<TRow>) => {
  const isPhoneViewport = useMediaQuery('(max-width: 640px)');
  const isTabletPortraitViewport = useMediaQuery('(max-width: 1024px) and (orientation: portrait)');
  const useMobileLayout = resolveEditableGridMobileLayout({
    forceMobileLayout,
    breakpoint: mobileLayout?.breakpoint,
    isPhoneViewport,
    isTabletPortraitViewport,
  });
  const mobilePresentation = mobileLayout?.presentation ?? 'cards';
  const shouldUseCompactInlineMobile = useMobileLayout && mobilePresentation === 'compact-inline';
  const shouldUseMobileEditorAccordions = useMobileLayout && mobileLayout?.editorPresentation === 'accordions';
  const [mobileEditingRowId, setMobileEditingRowId] = useState<string | null>(null);
  const [mobileAddedRowId, setMobileAddedRowId] = useState<string | null>(null);
  const [mobileExpandedRowId, setMobileExpandedRowId] = useState<string | null>(null);
  const [mobileFocusColumnId, setMobileFocusColumnId] = useState<string | null>(null);
  const [mobileEditorOpenGroupIds, setMobileEditorOpenGroupIds] = useState<string[]>([]);
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
  const shouldShowViewTabs = shouldUseViewPresets && !shouldUseCompactInlineMobile;
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
  const layoutColumnById = useMemo(
    () => new Map(layoutVisibleColumns.map((column) => [column.id, column])),
    [layoutVisibleColumns]
  );
  const mobileValidationColumns = useMemo(
    () => layoutVisibleColumns.filter((column) => column.kind !== 'actions'),
    [layoutVisibleColumns]
  );
  const configuredMobileInlineColumnIds = useMemo(
    () => (mobileLayout?.inlineFieldIds ?? []).map((columnId) => String(columnId)),
    [mobileLayout?.inlineFieldIds]
  );
  const configuredMobileInlineColumnIdSet = useMemo(
    () => new Set(configuredMobileInlineColumnIds),
    [configuredMobileInlineColumnIds]
  );
  const baseMobileInlineColumns = useMemo(() => {
    const configuredColumns = configuredMobileInlineColumnIds
      .map((columnId) => layoutColumnById.get(columnId))
      .filter((column): column is EditableGridColumn<TRow> => column !== undefined && isEditableGridInputColumn(column));

    return configuredColumns.length > 0
      ? configuredColumns
      : editableColumns.filter(isEditableGridInputColumn);
  }, [configuredMobileInlineColumnIds, editableColumns, layoutColumnById]);
  const mobileProgressColumns = useMemo(() => {
    const progressGroup = mobileLayout?.fieldGroups?.find((group) => group.id === 'progress');
    const candidateColumns = progressGroup
      ? progressGroup.columnIds
        .map((columnId) => layoutColumnById.get(String(columnId)))
        .filter((column): column is EditableGridColumn<TRow> => column !== undefined)
      : layoutVisibleColumns;

    return candidateColumns.filter(
      (column) =>
        (column.kind === 'computed' || column.kind === 'status') &&
        !configuredMobileInlineColumnIdSet.has(column.id)
    );
  }, [configuredMobileInlineColumnIdSet, layoutColumnById, layoutVisibleColumns, mobileLayout?.fieldGroups]);
  const mobileEditorColumns = useMemo(
    () => (shouldUseMobileEditorAccordions ? layoutVisibleColumns : editableColumns)
      .filter((column) => column.kind !== 'actions'),
    [editableColumns, layoutVisibleColumns, shouldUseMobileEditorAccordions]
  );
  const mobileEditorGroups = useMemo(
    () => resolveEditableGridMobileFieldGroups(mobileEditorColumns, mobileLayout?.fieldGroups),
    [mobileEditorColumns, mobileLayout?.fieldGroups]
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
  const isMobileEditingAddedRow = Boolean(mobileEditingRowId && mobileAddedRowId === mobileEditingRowId);
  const resolvedLineCountLabel = lineCountLabel ?? String(rows.length);
  const resolvedLineCountAriaLabel = `${rows.length} ${rows.length === 1 ? 'line' : 'lines'}`;
  const hasHeaderSummary = Boolean(summaryItems?.length || attentionMessage || description);
  const shouldUseRowValidationSummary = validationDisplay === 'row-summary';
  const resolvedMaxRowValidationMessages = Math.max(1, maxRowValidationMessages);

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
  const isMobileBulkSelectionActive = useMobileLayout && (isMobileSelectionMode || selectedCount > 0);
  const selectedSelectableCount = selectedRowIdsInOrder.filter((id) => selectableRowIdSet.has(id)).length;
  const areAllSelectableRowsSelected = selectableRowIds.length > 0 && selectedSelectableCount === selectableRowIds.length;
  const isSomeSelectableRowSelected = selectedSelectableCount > 0 && !areAllSelectableRowsSelected;

  useEffect(() => {
    if (!mobileExpandedRowId || !mobileFocusColumnId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const element = cellControlRefs.current.get(`${mobileExpandedRowId}:${mobileFocusColumnId}`);
      if (element && !element.disabled) {
        element.focus();
        element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
      setMobileFocusColumnId(null);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [mobileExpandedRowId, mobileFocusColumnId, rows]);

  useEffect(() => {
    if (!mobileEditingRow || !shouldUseMobileEditorAccordions || mobileEditorGroups.length === 0) {
      setMobileEditorOpenGroupIds([]);
      return;
    }

    setMobileEditorOpenGroupIds(getInitialMobileEditorOpenGroupIds(mobileEditingRow, mobileEditingRowIndex));
  }, [mobileEditingRowId, shouldUseMobileEditorAccordions, mobileEditorGroups]);

  const toggleMobileEditorGroup = (groupId: string) => {
    setMobileEditorOpenGroupIds((currentGroupIds) => (
      currentGroupIds.includes(groupId) ? [] : [groupId]
    ));
  };
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

  const openMobileEditorForAddedRow = (addResult: EditableGridAddRowResult) => {
    const addedRowId = resolveEditableGridAddedRowId(addResult);
    if (!useMobileLayout || !addedRowId) {
      return;
    }

    setIsMobileSelectionMode(false);
    setMobileExpandedRowId(null);
    setMobileAddedRowId(addedRowId);
    setMobileEditingRowId(addedRowId);
  };

  const handleAddRow = () => {
    if (readOnly) {
      return;
    }

    if (onAddRow) {
      openMobileEditorForAddedRow(onAddRow({ source: useMobileLayout ? 'mobile' : 'desktop' }));
      return;
    }

    if (createRow && onRowsChange) {
      const nextRow = createRow(rows.length + 1);
      onRowsChange([...rows, nextRow]);
      openMobileEditorForAddedRow(rowId(nextRow));
    }
  };

  const closeMobileEditor = () => {
    if (mobileEditingRow) {
      onMobileEditorClose?.(rowId(mobileEditingRow), mobileEditingRow, mobileEditingRowIndex);
    }

    setMobileEditingRowId(null);
    setMobileAddedRowId(null);
    setMobileEditorOpenGroupIds([]);
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

  const shouldUseStickyMobileAddAction = Boolean(mobileLayout?.stickyAddAction);
  const shouldHideHeaderAddAction = useMobileLayout && shouldUseStickyMobileAddAction;
  const shouldShowStickyMobileAddAction =
    shouldHideHeaderAddAction && !readOnly && !isMobileBulkSelectionActive && !mobileEditingRow;
  const mobileStickyActionOffsetStyle = mobileLayout?.stickyActionOffset
    ? ({ '--editable-transaction-grid-mobile-sticky-offset': mobileLayout.stickyActionOffset } as React.CSSProperties)
    : undefined;

  const renderStickyMobileAddAction = (placement: 'sticky' | 'compact-footer' = 'sticky') => {
    if (!shouldShowStickyMobileAddAction) {
      return null;
    }

    const isCompactFooter = placement === 'compact-footer';

    return (
      <div
        className={cn(
          'editable-transaction-grid__mobile-sticky-action',
          isCompactFooter && 'editable-transaction-grid__compact-mobile-add-action'
        )}
        style={isCompactFooter ? undefined : mobileStickyActionOffsetStyle}
      >
        <button
          type="button"
          onClick={handleAddRow}
          className="btn btn--outline btn--icon-left editable-transaction-grid__mobile-sticky-add-button"
        >
          <Plus size={14} aria-hidden="true" />
          {primaryActionLabel}
        </button>
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
    error?: string,
    warning?: string
  ): EditableGridColumnContext<TRow> => {
    const id = rowId(row);
    const baseContext = {
      gridId,
      row,
      rowId: id,
      rowIndex,
      column,
      error,
      warning,
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

  const getResolvedColumnWarning = (
    row: TRow,
    _rowIndex: number,
    column: EditableGridColumn<TRow>
  ): string | undefined => getRowColumnWarning(warnings, rowId(row), column.id);

  const getRowValidationMessages = (
    row: TRow,
    rowIndex: number,
    sourceColumns: EditableGridColumn<TRow>[] = visibleColumns
  ): EditableGridRowValidationMessage[] => {
    const messages: EditableGridRowValidationMessage[] = [];

    sourceColumns.forEach((column) => {
      if (column.kind === 'actions') {
        return;
      }

      const columnLabel = getValidationColumnLabel(column);
      const error = getResolvedColumnError(row, rowIndex, column);
      if (error) {
        messages.push({ columnId: column.id, columnLabel, message: error, tone: 'error' });
        return;
      }

      const warning = getResolvedColumnWarning(row, rowIndex, column);
      if (warning) {
        messages.push({ columnId: column.id, columnLabel, message: warning, tone: 'warning' });
      }
    });

    return messages;
  };

  const getFirstMobileEditorErrorGroupId = (row: TRow, rowIndex: number): string | undefined =>
    mobileEditorGroups.find((group) =>
      group.columns.some((column) => Boolean(getResolvedColumnError(row, rowIndex, column)))
    )?.id;

  const getFirstMobileEditorIncompleteRequiredGroupId = (row: TRow, rowIndex: number): string | undefined =>
    mobileEditorGroups.find((group) =>
      group.columns.some((column) => {
        const context = buildCellContext(row, rowIndex, column);
        return resolveFlag(column.required, row, context) && !getFormattedValue(column, row, context).trim();
      })
    )?.id;

  const getInitialMobileEditorOpenGroupIds = (row: TRow, rowIndex: number) =>
    resolveEditableGridMobileEditorOpenGroupIds({
      groupIds: mobileEditorGroups.map((group) => group.id),
      isNewRow: Boolean(mobileAddedRowId && mobileAddedRowId === rowId(row)),
      firstErrorGroupId: getFirstMobileEditorErrorGroupId(row, rowIndex),
      newRowOpenGroupIds: mobileLayout?.editorAccordionDefaults?.newRowOpenGroupIds,
      existingRowOpenGroupIds: mobileLayout?.editorAccordionDefaults?.existingRowOpenGroupIds,
      fallbackGroupId: mobileEditorGroups[0]?.id,
    });

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
    const warning = error ? undefined : getResolvedColumnWarning(row, rowIndex, column);
    const context = buildCellContext(row, rowIndex, column, error, warning);
    const value = getFormattedValue(column, row, context);
    const validationDescriptionId = error
      ? getCellValidationDescriptionId(gridId, id, column.id, 'error')
      : warning
        ? getCellValidationDescriptionId(gridId, id, column.id, 'warning')
        : undefined;
    const className = cn(
      'editable-transaction-grid__control',
      column.kind === 'number' && 'editable-transaction-grid__control--number',
      warning && 'editable-transaction-grid__control--warning',
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
          aria-describedby={validationDescriptionId}
        />
      );
    }

    if (column.kind === 'select' || column.kind === 'lookup') {
      const options = typeof column.options === 'function' ? column.options(row, context) : column.options;

      if (variant === 'mobile' && column.kind === 'select' && column.mobileControlPresentation === 'segmented') {
        const choiceOptions = (options ?? []).filter((option) => option.value !== '');
        const selectedChoiceIndex = choiceOptions.findIndex((option) => option.value === value);
        const fallbackRefIndex = selectedChoiceIndex >= 0 ? selectedChoiceIndex : 0;

        return (
          <div
            role="radiogroup"
            aria-label={column.label}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={validationDescriptionId}
            className={cn(
              'editable-transaction-grid__mobile-choice-control',
              error && 'editable-transaction-grid__mobile-choice-control--error',
              warning && 'editable-transaction-grid__mobile-choice-control--warning',
              context.disabled && 'editable-transaction-grid__mobile-choice-control--disabled'
            )}
          >
            {choiceOptions.map((option, optionIndex) => {
              const selected = option.value === value;
              const disabled = context.disabled || option.disabled;

              return (
                <button
                  key={option.value}
                  ref={optionIndex === fallbackRefIndex ? setControlRef : undefined}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={cn(
                    'editable-transaction-grid__mobile-choice-option',
                    selected && 'editable-transaction-grid__mobile-choice-option--selected'
                  )}
                  disabled={disabled}
                  data-tour={optionIndex === fallbackRefIndex ? resolveDataTour(column, row, rowIndex) : undefined}
                  onClick={() => {
                    if (disabled) {
                      return;
                    }

                    handleCellChange(column, row, option.value, context);
                  }}
                  onBlur={() => column.onBlur?.(row, context)}
                  onKeyDownCapture={handleControlKeyDownCapture}
                  onKeyDown={(event) => handleCellKeyDown(event, column, row, rowIndex, context)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        );
      }

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
          aria-describedby={validationDescriptionId}
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
          aria-describedby={validationDescriptionId}
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
        aria-describedby={validationDescriptionId}
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
      onAddLine: () => onAddRow({ source: 'desktop' }),
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
      <p id={getCellValidationDescriptionId(gridId, id, column.id, 'error')} className="editable-transaction-grid__error">
        {error}
      </p>
    );
  };

  const renderWarning = (row: TRow, rowIndex: number, column: EditableGridColumn<TRow>) => {
    const id = rowId(row);
    const warning = getResolvedColumnWarning(row, rowIndex, column);
    if (!warning || getResolvedColumnError(row, rowIndex, column)) {
      return null;
    }

    return (
      <p id={getCellValidationDescriptionId(gridId, id, column.id, 'warning')} className="editable-transaction-grid__error editable-transaction-grid__error--warning">
        {warning}
      </p>
    );
  };

  const renderValidationDescriptionNodes = (
    row: TRow,
    messages: EditableGridRowValidationMessage[]
  ) => {
    const id = rowId(row);

    return messages.map((message) => (
      <span
        key={`${message.columnId}-${message.tone}`}
        id={getCellValidationDescriptionId(gridId, id, message.columnId, message.tone)}
        className="sr-only"
      >
        {formatValidationMessage(message)}
      </span>
    ));
  };

  const renderRowValidationSummary = (
    row: TRow,
    messages: EditableGridRowValidationMessage[]
  ) => {
    if (messages.length === 0) {
      return null;
    }

    const visibleMessages = messages.slice(0, resolvedMaxRowValidationMessages);
    const hiddenCount = Math.max(0, messages.length - visibleMessages.length);
    const tone = messages.some((message) => message.tone === 'error') ? 'error' : 'warning';

    return (
      <tr className="editable-transaction-grid__validation-row">
        <td
          colSpan={tableColumns.length}
          className={cn(
            'editable-transaction-grid__validation-cell',
            tone === 'error'
              ? 'editable-transaction-grid__validation-cell--error'
              : 'editable-transaction-grid__validation-cell--warning'
          )}
        >
          <div className="editable-transaction-grid__validation-content">
            {visibleMessages.map((message) => (
              <span key={`${message.columnId}-${message.tone}`} className="editable-transaction-grid__validation-message">
                {formatValidationMessage(message)}
              </span>
            ))}
            {hiddenCount > 0 && (
              <span className="editable-transaction-grid__validation-message">+{hiddenCount} more</span>
            )}
            <span className="sr-only">
              {messages.map(formatValidationMessage).join(' ')}
            </span>
            {renderValidationDescriptionNodes(row, messages)}
          </div>
        </td>
      </tr>
    );
  };

  const renderTableCell = (column: EditableGridColumn<TRow>, row: TRow, rowIndex: number) => {
    if (column.id === selectionColumnId) {
      return renderSelectionCell(column, row, rowIndex);
    }

    const error = getResolvedColumnError(row, rowIndex, column);
    const warning = error ? undefined : getResolvedColumnWarning(row, rowIndex, column);
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
          warning && 'editable-transaction-grid__body-cell--warning',
          pinState === 'left' && 'editable-transaction-grid__cell--pinned-left',
          pinState === 'right' && 'editable-transaction-grid__cell--pinned-right'
        )}
        style={style}
      >
        {renderCellControl(column, row, rowIndex, 'table')}
        {!shouldUseRowValidationSummary && (error || warning) && (
          <div className="editable-transaction-grid__meta-row">
            {error ? renderError(row, rowIndex, column) : renderWarning(row, rowIndex, column)}
          </div>
        )}
      </td>
    );
  };

  const renderMobileSummary = (row: TRow, rowIndex: number): EditableGridMobileSummary => {
    const id = rowId(row);
    const firstValidationError = getRowValidationMessages(row, rowIndex, mobileValidationColumns)
      .find((message) => message.tone === 'error')?.message;
    const firstError = firstValidationError ?? getFirstRowError(errors, id);
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

  const getMobileIssueSummaryItems = (): EditableGridMobileIssueSummaryItem<TRow>[] => {
    const issueMap = new Map<string, EditableGridMobileIssueSummaryItem<TRow>>();

    rows.forEach((row, rowIndex) => {
      getRowValidationMessages(row, rowIndex, mobileValidationColumns).forEach((message) => {
        const key = `${message.tone}:${message.columnId}:${message.message}`;
        const existingIssue = issueMap.get(key);

        if (existingIssue) {
          existingIssue.rowCount += 1;
          existingIssue.rowIds.push(rowId(row));
          existingIssue.rows.push(row);
          return;
        }

        issueMap.set(key, {
          ...message,
          key,
          rowCount: 1,
          rowIds: [rowId(row)],
          rows: [row],
          firstRow: row,
          firstRowIndex: rowIndex,
        });
      });
    });

    return Array.from(issueMap.values());
  };

  const renderCompactMobileIssueSummary = () => {
    if (!mobileLayout?.showIssueSummary) {
      return null;
    }

    const issues = getMobileIssueSummaryItems();
    if (issues.length === 0) {
      return null;
    }

    return (
      <div className="editable-transaction-grid__compact-mobile-issues" aria-label="Line issues">
        {issues.map((issue) => (
          <button
            key={issue.key}
            type="button"
            className={cn(
              'editable-transaction-grid__compact-mobile-issue',
              issue.tone === 'warning' && 'editable-transaction-grid__compact-mobile-issue--warning'
            )}
            onClick={() => {
              const firstRowId = issue.rowIds[0];
              setMobileExpandedRowId(firstRowId);
              setMobileFocusColumnId(issue.columnId);
            }}
          >
            <span className="editable-transaction-grid__compact-mobile-issue-dot" aria-hidden="true" />
            <span className="editable-transaction-grid__compact-mobile-issue-copy">
              <span className="editable-transaction-grid__compact-mobile-issue-title">{issue.message}</span>
              <span className="editable-transaction-grid__compact-mobile-issue-meta">
                {issue.rowCount} {issue.rowCount === 1 ? 'line' : 'lines'} - {issue.columnLabel}
              </span>
            </span>
            <ChevronDown size={14} aria-hidden="true" />
          </button>
        ))}
      </div>
    );
  };

  const renderCompactMobileSelectionControls = () => {
    if (!canUseSelection || !isMobileBulkSelectionActive) {
      return null;
    }

    return (
      <div className="editable-transaction-grid__compact-mobile-selection-bar">
        <span>{selectedCount} selected</span>
        <button type="button" onClick={clearSelection}>Done</button>
      </div>
    );
  };

  const renderMobileField = (
    column: EditableGridColumn<TRow>,
    row: TRow,
    rowIndex: number,
    variant: 'drawer' | 'compact' = 'drawer'
  ) => {
    const error = getResolvedColumnError(row, rowIndex, column);
    const warning = error ? undefined : getResolvedColumnWarning(row, rowIndex, column);
    const context = buildCellContext(row, rowIndex, column, error, warning);
    const required = resolveFlag(column.required, row, context);
    const value = getFormattedValue(column, row, context);
    const showClearAction =
      variant === 'drawer' &&
      column.kind === 'select' &&
      column.mobileControlPresentation === 'segmented' &&
      Boolean(value) &&
      !context.disabled &&
      !context.readOnly;

    return (
      <div
        key={column.id}
        className={cn(
          variant === 'compact'
            ? 'editable-transaction-grid__compact-mobile-field'
            : 'editable-transaction-grid__mobile-field'
        )}
      >
        <div className="editable-transaction-grid__mobile-field-heading">
          <span className={variant === 'compact'
            ? 'editable-transaction-grid__compact-mobile-field-label'
            : 'editable-transaction-grid__mobile-field-label'}>
            {column.label}
            {required && <span aria-hidden="true"> *</span>}
          </span>
          {showClearAction && (
            <button
              type="button"
              className="editable-transaction-grid__mobile-field-clear"
              onClick={() => {
                handleCellChange(column, row, '', context);
                column.onBlur?.(row, context);
              }}
            >
              Clear
            </button>
          )}
        </div>
        {renderCellControl(column, row, rowIndex, 'mobile')}
        {(error || warning) && (
          <span className="editable-transaction-grid__meta-row editable-transaction-grid__meta-row--mobile">
            {error ? renderError(row, rowIndex, column) : renderWarning(row, rowIndex, column)}
          </span>
        )}
      </div>
    );
  };

  const renderCompactMobileProgress = (row: TRow, rowIndex: number) => {
    if (mobileProgressColumns.length === 0) {
      return null;
    }

    return (
      <div className="editable-transaction-grid__compact-mobile-progress">
        {mobileProgressColumns.map((column) => {
          const context = buildCellContext(row, rowIndex, column);
          return (
            <div key={column.id} className="editable-transaction-grid__compact-mobile-progress-item">
              <span>{column.label}</span>
              <strong>{getFormattedValue(column, row, context) || '-'}</strong>
            </div>
          );
        })}
      </div>
    );
  };

  const openMobileEditorForExistingRow = (id: string) => {
    setMobileAddedRowId(null);
    setMobileEditingRowId(id);
  };

  const renderCompactMobileExpanded = (row: TRow, rowIndex: number) => {
    const id = rowId(row);

    return (
      <div className="editable-transaction-grid__compact-mobile-expanded">
        {baseMobileInlineColumns.length > 0 && (
          <div className="editable-transaction-grid__compact-mobile-fields">
            {baseMobileInlineColumns.map((column) => renderMobileField(column, row, rowIndex, 'compact'))}
          </div>
        )}
        {renderCompactMobileProgress(row, rowIndex)}
        <div className="editable-transaction-grid__compact-mobile-actions">
          <button type="button" onClick={() => openMobileEditorForExistingRow(id)}>
            All details
          </button>
          {!readOnly && onDuplicateRow && (
            <button type="button" onClick={() => onDuplicateRow(id, row, rowIndex)}>
              <Copy size={14} aria-hidden="true" />
              Duplicate
            </button>
          )}
          {!readOnly && onDeleteRow && (
            <button
              type="button"
              className="editable-transaction-grid__compact-mobile-action--danger"
              onClick={() => onDeleteRow(id, row, rowIndex)}
            >
              <Trash2 size={14} aria-hidden="true" />
              Delete
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderCompactMobileRow = (row: TRow, rowIndex: number) => {
    const id = rowId(row);
    const summary = renderMobileSummary(row, rowIndex);
    const messages = getRowValidationMessages(row, rowIndex, mobileValidationColumns);
    const firstError = messages.find((message) => message.tone === 'error');
    const firstWarning = messages.find((message) => message.tone === 'warning');
    const primaryIssue = firstError ?? firstWarning;
    const selected = selectedRowIdSet.has(id);
    const selectable = isRowSelectable(row, rowIndex);
    const isExpanded = mobileExpandedRowId === id;
    const secondaryItems: React.ReactNode[] = primaryIssue
      ? [`Line ${rowIndex + 1}`, primaryIssue.columnLabel]
      : [
          summary.subtitle,
          ...(summary.metrics ?? []).map((metric) => (
            <React.Fragment key={metric.label}>{metric.label} {metric.value}</React.Fragment>
          )),
        ].filter((item): item is React.ReactNode => Boolean(item));

    return (
      <article
        key={id}
        className={cn(
          'editable-transaction-grid__compact-mobile-row',
          firstError && 'editable-transaction-grid__compact-mobile-row--error',
          !firstError && firstWarning && 'editable-transaction-grid__compact-mobile-row--warning',
          selected && 'editable-transaction-grid__compact-mobile-row--selected'
        )}
        onPointerDown={() => handleMobileLongPressStart(row, rowIndex)}
        onPointerUp={cancelMobileLongPress}
        onPointerLeave={cancelMobileLongPress}
        onPointerCancel={cancelMobileLongPress}
      >
        <div className="editable-transaction-grid__compact-mobile-row-shell">
          {isMobileBulkSelectionActive && canUseSelection && (
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
          <button
            type="button"
            className="editable-transaction-grid__compact-mobile-summary"
            aria-expanded={isExpanded}
            onClick={() => {
              cancelMobileLongPress();
              if (isMobileBulkSelectionActive && selectable) {
                handleRowSelectionChange(row, rowIndex, !selected, false);
                return;
              }

              setMobileExpandedRowId(isExpanded ? null : id);
            }}
          >
            <span
              className={cn(
                'editable-transaction-grid__compact-mobile-dot',
                firstError && 'editable-transaction-grid__compact-mobile-dot--error',
                !firstError && firstWarning && 'editable-transaction-grid__compact-mobile-dot--warning',
                !firstError && !firstWarning && 'editable-transaction-grid__compact-mobile-dot--valid'
              )}
              aria-hidden="true"
            />
            <span className="editable-transaction-grid__compact-mobile-content">
              <span className="editable-transaction-grid__compact-mobile-primary">
                {primaryIssue?.message ?? summary.title}
              </span>
              {secondaryItems.length > 0 && (
                <span className="editable-transaction-grid__compact-mobile-secondary">
                  {secondaryItems.map((item, itemIndex) => (
                    <span key={itemIndex}>{item}</span>
                  ))}
                </span>
              )}
            </span>
            <span className="editable-transaction-grid__compact-mobile-chevron" aria-hidden="true">
              <ChevronRight size={16} />
            </span>
          </button>
        </div>
        {isExpanded && renderCompactMobileExpanded(row, rowIndex)}
      </article>
    );
  };

  const renderCompactMobileLayout = () => (
    <div className="editable-transaction-grid__compact-mobile">
      {renderBulkToolbar('mobile')}
      {renderCompactMobileSelectionControls()}
      {renderCompactMobileIssueSummary()}
      {rows.length === 0 ? (
        <div className="editable-transaction-grid__empty">{emptyState ?? 'No lines added yet.'}</div>
      ) : (
        <div className="editable-transaction-grid__compact-mobile-list">
          {rows.map((row, rowIndex) => renderCompactMobileRow(row, rowIndex))}
        </div>
      )}
      {renderStickyMobileAddAction('compact-footer')}
    </div>
  );

  const renderLegacyMobileLayout = () => (
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
      {renderStickyMobileAddAction()}
    </div>
  );

  const renderMobileLayout = () => (
    shouldUseCompactInlineMobile ? renderCompactMobileLayout() : renderLegacyMobileLayout()
  );

  const handleMobileEditorSubmit = () => {
    if (!mobileEditingRow) {
      return;
    }

    if (isMobileEditingAddedRow && isRowComplete && !isRowComplete(mobileEditingRow)) {
      onIncompleteRow?.(mobileEditingRow);
      const firstGroupId =
        getFirstMobileEditorErrorGroupId(mobileEditingRow, mobileEditingRowIndex) ??
        getFirstMobileEditorIncompleteRequiredGroupId(mobileEditingRow, mobileEditingRowIndex) ??
        mobileEditorGroups[0]?.id;

      if (firstGroupId) {
        setMobileEditorOpenGroupIds([firstGroupId]);
      }
      return;
    }

    closeMobileEditor();
  };

  const renderMobileEditorAccordion = (
    group: ResolvedEditableGridMobileFieldGroup<TRow>,
    row: TRow,
    rowIndex: number
  ) => {
    const groupHasError = group.columns.some((column) => Boolean(getResolvedColumnError(row, rowIndex, column)));
    const groupHasWarning = !groupHasError && group.columns.some((column) => Boolean(getResolvedColumnWarning(row, rowIndex, column)));
    const isOpen = mobileEditorOpenGroupIds.includes(group.id);
    const panelId = `${gridId}-${rowId(row)}-${group.id}-panel`;
    const editableFieldCount = group.columns.filter((column) => {
      const context = buildCellContext(row, rowIndex, column);
      return isEditableGridInputColumn(column) && !context.disabled && !context.readOnly;
    }).length;
    const fieldCountText = formatEditableGridMobileFieldCount(group.columns.length);
    const metaText = editableFieldCount > 0 && editableFieldCount !== group.columns.length
      ? `${fieldCountText} - ${editableFieldCount} editable`
      : fieldCountText;

    return (
      <section
        key={group.id}
        className={cn(
          'editable-transaction-grid__mobile-editor-accordion',
          isOpen && 'editable-transaction-grid__mobile-editor-accordion--open',
          groupHasError && 'editable-transaction-grid__mobile-editor-accordion--error',
          groupHasWarning && 'editable-transaction-grid__mobile-editor-accordion--warning'
        )}
      >
        <button
          type="button"
          className="editable-transaction-grid__mobile-editor-accordion-header"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => toggleMobileEditorGroup(group.id)}
        >
          <span className="editable-transaction-grid__mobile-editor-accordion-title">{group.label}</span>
          <span className="editable-transaction-grid__mobile-editor-accordion-meta">
            {metaText}
            <ChevronDown size={14} aria-hidden="true" />
          </span>
        </button>
        <div
          id={panelId}
          className="editable-transaction-grid__mobile-editor-accordion-panel"
          hidden={!isOpen}
        >
          <div className="editable-transaction-grid__mobile-editor-group-fields">
            {group.columns.map((column) => renderMobileField(column, row, rowIndex))}
          </div>
        </div>
      </section>
    );
  };

  const renderMobileEditorBody = (row: TRow, rowIndex: number) => {
    if (shouldUseMobileEditorAccordions && mobileEditorGroups.length > 0) {
      return (
        <div className="editable-transaction-grid__mobile-editor-accordions">
          {mobileEditorGroups.map((group) => renderMobileEditorAccordion(group, row, rowIndex))}
        </div>
      );
    }

    if (mobileEditorGroups.length > 0) {
      return mobileEditorGroups.map((group) => (
        <section key={group.id} className="editable-transaction-grid__mobile-editor-group">
          <h4 className="editable-transaction-grid__mobile-editor-group-title">{group.label}</h4>
          <div className="editable-transaction-grid__mobile-editor-group-fields">
            {group.columns.map((column) => renderMobileField(column, row, rowIndex))}
          </div>
        </section>
      ));
    }

    return mobileEditorColumns.map((column) => renderMobileField(column, row, rowIndex));
  };

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
        onClose={closeMobileEditor}
        ModalProps={{ keepMounted: true }}
        slotProps={{
          paper: {
            className: 'editable-transaction-grid__mobile-editor-paper',
            sx: {
              width: '100vw',
              maxWidth: '100vw',
              height: shouldUseCompactInlineMobile ? '84dvh' : undefined,
              maxHeight: '92dvh',
              m: 0,
              borderRadius: '20px 20px 0 0',
              backgroundImage: 'none',
              overflow: 'hidden',
            },
          },
        }}
      >
        <section
          className={cn(
            'editable-transaction-grid__mobile-editor',
            shouldUseCompactInlineMobile && 'editable-transaction-grid__mobile-editor--compact-inline',
            isMobileEditingAddedRow && 'editable-transaction-grid__mobile-editor--has-footer'
          )}
          aria-label={titleText}
        >
          <header className="editable-transaction-grid__mobile-editor-header">
            <h3>{titleText}</h3>
            <button
              type="button"
              className="editable-transaction-grid__mobile-editor-close"
              onClick={closeMobileEditor}
              aria-label="Close line editor"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>
          <div className="editable-transaction-grid__mobile-editor-body">
            {renderMobileEditorBody(mobileEditingRow, mobileEditingRowIndex)}
          </div>
          {isMobileEditingAddedRow && (
            <footer className="editable-transaction-grid__mobile-editor-footer">
              <button
                type="button"
                className="btn btn--primary btn--icon-left editable-transaction-grid__mobile-editor-add-button"
                onClick={handleMobileEditorSubmit}
              >
                <Plus size={14} aria-hidden="true" />
                Add line
              </button>
            </footer>
          )}
        </section>
      </Drawer>
    );
  };

  return (
    <section
      className={cn(
        'editable-transaction-grid',
        shouldShowViewTabs && 'editable-transaction-grid--has-view-presets',
        shouldUseCompactInlineMobile && 'editable-transaction-grid--compact-inline-mobile'
      )}
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
          {!shouldHideHeaderAddAction && (
            <button
              type="button"
              onClick={handleAddRow}
              className="btn btn--outline btn--icon-left editable-transaction-grid__add-button"
              disabled={readOnly}
            >
              <Plus size={14} aria-hidden="true" />
              {primaryActionLabel}
            </button>
          )}
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
                  const rowValidationMessages = shouldUseRowValidationSummary
                    ? getRowValidationMessages(row, rowIndex)
                    : [];
                  const hasError = rowValidationMessages.some((message) => message.tone === 'error') || Boolean(getFirstRowError(errors, id));

                  return (
                    <React.Fragment key={id}>
                      <tr
                        className={cn(
                          hasError && 'editable-transaction-grid__row--error',
                          selectedRowIdSet.has(id) && 'editable-transaction-grid__row--selected'
                        )}
                      >
                        {tableColumns.map((column) => renderTableCell(column, row, rowIndex))}
                      </tr>
                      {shouldUseRowValidationSummary && renderRowValidationSummary(row, rowValidationMessages)}
                    </React.Fragment>
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
