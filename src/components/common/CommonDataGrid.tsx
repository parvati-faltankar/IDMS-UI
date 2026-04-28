import React, { useEffect, useMemo, useRef, useState } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { BarChart3, Download, LayoutTemplate, RotateCcw } from 'lucide-react';
import SortableTableHeader from './SortableTableHeader';
import DataGridConfigurator from './DataGridConfigurator';
import DataGridChartDrawer from './DataGridChartDrawer';
import type {
  CommonDataGridProps,
  DataGridColumn,
  DataGridStoredPreferences,
} from './dataGridTypes';
import { cn } from '../../utils/classNames';
import { buildCountColumnAggregation, buildNumberColumnAggregation } from '../../utils/tableColumnAggregations';
import type { SortDirection, SortState } from '../../utils/sortState';
import {
  loadDataGridPreferences,
  resetDataGridPreferences,
  sanitizeDataGridPreferences,
  saveDataGridPreferences,
  setColumnPinState,
} from '../../utils/dataGridPreferences';

const selectionColumnWidth = 44;

function defaultColumnWidth<TData>(column: DataGridColumn<TData>): number {
  if (column.type === 'actions') {
    return column.width ?? 96;
  }

  if (column.type === 'number') {
    return column.width ?? 140;
  }

  if (column.type === 'date') {
    return column.width ?? 172;
  }

  return column.width ?? 168;
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  const nextItems = [...items];
  const [item] = nextItems.splice(fromIndex, 1);
  nextItems.splice(Math.max(0, Math.min(toIndex, nextItems.length)), 0, item);
  return nextItems;
}

function normalizeDateValue(value: unknown): string {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value.slice(0, 10);
    }

    const dateValue = new Date(value);
    if (Number.isFinite(dateValue.getTime())) {
      return dateValue.toISOString().slice(0, 10);
    }
  }

  return '';
}

function getComparableValue<TData>(column: DataGridColumn<TData>, row: TData): unknown {
  return column.getSortValue?.(row) ?? column.getValue?.(row);
}

function getFilterValue<TData>(column: DataGridColumn<TData>, row: TData): unknown {
  return column.getValue?.(row);
}

function compareValues(left: unknown, right: unknown): number {
  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  const leftDate = normalizeDateValue(left);
  const rightDate = normalizeDateValue(right);
  if (leftDate && rightDate) {
    return leftDate.localeCompare(rightDate);
  }

  if (typeof left === 'boolean' && typeof right === 'boolean') {
    return Number(left) - Number(right);
  }

  return String(left ?? '').localeCompare(String(right ?? ''), undefined, { numeric: true });
}

function exportRowsToCsv<TData>(
  rows: TData[],
  columns: DataGridColumn<TData>[],
  fileName: string
) {
  const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const headerRow = columns.map((column) => escapeCell(column.label)).join(',');
  const dataRows = rows.map((row) =>
    columns
      .map((column) => escapeCell(column.getExportValue?.(row) ?? String(column.getValue?.(row) ?? '')))
      .join(',')
  );
  const csvContent = [headerRow, ...dataRows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

const CommonDataGrid = <TData, TSortKey extends string = string>({
  gridId,
  rows,
  columns,
  rowId,
  rowClassName,
  selectable = false,
  sortState,
  onSortChange,
  defaultDensity = 'compact',
  initialBatchSize = 80,
  batchSize = 60,
  incrementalRenderingThreshold = 90,
  onSelectionChange,
  bulkActions,
  toolbarEndSlot,
  toolbarLabel = 'Grid actions',
  chartTitle = 'Catalogue',
  exportFileName,
}: CommonDataGridProps<TData, TSortKey>) => {
  const [storedPreferences, setStoredPreferences] = useState<DataGridStoredPreferences>(() =>
    loadDataGridPreferences(gridId, columns, defaultDensity)
  );
  const [internalSortState, setInternalSortState] = useState<SortState<string>>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [isConfiguratorOpen, setIsConfiguratorOpen] = useState(false);
  const [isChartDrawerOpen, setIsChartDrawerOpen] = useState(false);
  const [collapsedGroupLabels, setCollapsedGroupLabels] = useState<Record<string, boolean>>({});
  const [loadedRowCount, setLoadedRowCount] = useState(initialBatchSize);
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const preferences = useMemo(
    () => sanitizeDataGridPreferences(storedPreferences, columns, defaultDensity),
    [columns, defaultDensity, storedPreferences]
  );

  useEffect(() => {
    saveDataGridPreferences(gridId, preferences);
  }, [gridId, preferences]);

  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedRowIds);
    }
  }, [onSelectionChange, selectedRowIds]);

  const effectiveSortState = (sortState as SortState<string> | undefined) ?? internalSortState;

  const columnMap = useMemo(
    () => new Map(columns.map((column) => [column.id, column])),
    [columns]
  );
  const orderedColumns = useMemo(
    () =>
      preferences.columnOrder
        .map((columnId) => columnMap.get(columnId))
        .filter((column): column is DataGridColumn<TData> => Boolean(column)),
    [columnMap, preferences.columnOrder]
  );

  const visibleColumns = useMemo(
    () =>
      orderedColumns.filter(
        (column) => column.locked || column.hideable === false || !preferences.hiddenColumnIds.includes(column.id)
      ),
    [orderedColumns, preferences.hiddenColumnIds]
  );

  const leftPinnedColumns = useMemo(
    () => visibleColumns.filter((column) => preferences.pinnedLeftColumnIds.includes(column.id)),
    [preferences.pinnedLeftColumnIds, visibleColumns]
  );
  const rightPinnedColumns = useMemo(
    () => visibleColumns.filter((column) => preferences.pinnedRightColumnIds.includes(column.id)),
    [preferences.pinnedRightColumnIds, visibleColumns]
  );
  const centerColumns = useMemo(
    () =>
      visibleColumns.filter(
        (column) =>
          !preferences.pinnedLeftColumnIds.includes(column.id) &&
          !preferences.pinnedRightColumnIds.includes(column.id)
      ),
    [preferences.pinnedLeftColumnIds, preferences.pinnedRightColumnIds, visibleColumns]
  );
  const arrangedColumns = useMemo(
    () => [...leftPinnedColumns, ...centerColumns, ...rightPinnedColumns],
    [centerColumns, leftPinnedColumns, rightPinnedColumns]
  );

  const filteredRows = rows;

  const sortedRows = useMemo(() => {
    if (sortState || !effectiveSortState) {
      return filteredRows;
    }

    const column = columnMap.get(effectiveSortState.key);
    if (!column) {
      return filteredRows;
    }

    const directionFactor = effectiveSortState.direction === 'asc' ? 1 : -1;
    return [...filteredRows].sort((left, right) => {
      const comparison = compareValues(getComparableValue(column, left), getComparableValue(column, right));
      if (comparison === 0) {
        return String(rowId(left)).localeCompare(String(rowId(right)), undefined, { numeric: true });
      }

      return comparison * directionFactor;
    });
  }, [columnMap, effectiveSortState, filteredRows, rowId, sortState]);

  const renderCount =
    sortedRows.length > incrementalRenderingThreshold
      ? Math.min(Math.max(initialBatchSize, loadedRowCount), sortedRows.length)
      : sortedRows.length;

  useEffect(() => {
    if (sortedRows.length <= renderCount) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setLoadedRowCount((current) => Math.min(current + batchSize, sortedRows.length));
        }
      },
      { rootMargin: '320px 0px' }
    );

    const node = loadMoreRef.current;
    if (node) {
      observer.observe(node);
    }

    return () => observer.disconnect();
  }, [batchSize, renderCount, sortedRows.length]);

  const renderedRows = useMemo(
    () => sortedRows.slice(0, renderCount),
    [renderCount, sortedRows]
  );

  const groupedRows = useMemo(() => {
    if (!preferences.groupByColumnId) {
      return [];
    }

    const groupColumn = columnMap.get(preferences.groupByColumnId);
    if (!groupColumn) {
      return [];
    }

    const groups = new Map<string, TData[]>();
    renderedRows.forEach((row) => {
      const groupLabel = String(getFilterValue(groupColumn, row) ?? 'Not specified');
      if (!groups.has(groupLabel)) {
        groups.set(groupLabel, []);
      }
      groups.get(groupLabel)?.push(row);
    });

    return Array.from(groups.entries()).map(([label, groupRows]) => ({
      label,
      rows: groupRows,
    }));
  }, [columnMap, preferences.groupByColumnId, renderedRows]);

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedRowIds.includes(rowId(row))),
    [rowId, rows, selectedRowIds]
  );
  const filteredRowIds = useMemo(
    () => filteredRows.map((row) => rowId(row)),
    [filteredRows, rowId]
  );
  const allFilteredSelected =
    filteredRowIds.length > 0 && filteredRowIds.every((id) => selectedRowIds.includes(id));
  const someFilteredSelected =
    !allFilteredSelected && filteredRowIds.some((id) => selectedRowIds.includes(id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someFilteredSelected;
    }
  }, [someFilteredSelected]);

  const columnWidths = useMemo(
    () =>
      Object.fromEntries(
        arrangedColumns.map((column) => [
          column.id,
          preferences.columnWidths[column.id] ?? defaultColumnWidth(column),
        ])
      ),
    [arrangedColumns, preferences.columnWidths]
  );

  const leftOffsets = useMemo(() => {
    const offsets: Record<string, number> = {};
    leftPinnedColumns.reduce((offset, column) => {
      offsets[column.id] = offset;
      return offset + columnWidths[column.id];
    }, selectable ? selectionColumnWidth : 0);
    return offsets;
  }, [columnWidths, leftPinnedColumns, selectable]);

  const rightOffsets = useMemo(() => {
    const offsets: Record<string, number> = {};
    [...rightPinnedColumns].reverse().reduce((offset, column) => {
      offsets[column.id] = offset;
      return offset + columnWidths[column.id];
    }, 0);
    return offsets;
  }, [columnWidths, rightPinnedColumns]);

  const aggregations = useMemo(
    () =>
      Object.fromEntries(
        arrangedColumns.map((column) => {
          if (column.aggregation) {
            return [column.id, column.aggregation(filteredRows)];
          }

          if (column.type === 'number') {
            return [
              column.id,
              buildNumberColumnAggregation(filteredRows, {
                selector: (row) => getFilterValue(column, row) as string | number | null | undefined,
              }),
            ];
          }

          return [column.id, buildCountColumnAggregation(filteredRows)];
        })
      ),
    [arrangedColumns, filteredRows]
  );

  const updatePreferences = (updater: (current: DataGridStoredPreferences) => DataGridStoredPreferences) => {
    setStoredPreferences((current) => updater(current));
  };

  const handleSortChange = (key: string, direction: SortDirection | null) => {
    if (onSortChange) {
      onSortChange(key as TSortKey, direction);
      return;
    }

    setInternalSortState(direction ? { key, direction } : null);
  };

  const handleMoveColumn = (columnId: string, targetIndex: number) => {
    updatePreferences((current) => {
      const sourceIndex = current.columnOrder.indexOf(columnId);
      if (sourceIndex < 0) {
        return current;
      }

      return {
        ...current,
        columnOrder: moveItem(current.columnOrder, sourceIndex, targetIndex),
      };
    });
  };

  const handleVisibilityChange = (columnId: string, visible: boolean) => {
    updatePreferences((current) => {
      const hiddenColumnIds = current.hiddenColumnIds.filter((id) => id !== columnId);
      if (!visible) {
        hiddenColumnIds.push(columnId);
      }

      return {
        ...current,
        hiddenColumnIds,
        groupByColumnId: current.groupByColumnId === columnId && !visible ? null : current.groupByColumnId,
      };
    });
  };

  const handlePinChange = (columnId: string, pinState: 'left' | 'right' | null) => {
    updatePreferences((current) => setColumnPinState(current, columnId, pinState));
  };

  const handleResetView = () => {
    resetDataGridPreferences(gridId);
    setStoredPreferences(loadDataGridPreferences(gridId, columns, defaultDensity));
    setSelectedRowIds([]);
    setCollapsedGroupLabels({});
    setLoadedRowCount(initialBatchSize);
    if (!sortState) {
      setInternalSortState(null);
    }
  };

  const handleResetColumn = (columnId: string) => {
    const defaultColumn = columns.find((column) => column.id === columnId);
    updatePreferences((current) => {
      const hiddenColumnIds = current.hiddenColumnIds.filter((id) => id !== columnId);
      const nextColumnFilters = { ...current.columnFilters };
      delete nextColumnFilters[columnId];
      const nextPreferences = setColumnPinState(
        {
          ...current,
          hiddenColumnIds,
          columnWidths: Object.fromEntries(
            Object.entries(current.columnWidths).filter(([id]) => id !== columnId)
          ),
          columnFilters: nextColumnFilters,
          groupByColumnId: current.groupByColumnId === columnId ? null : current.groupByColumnId,
        },
        columnId,
        defaultColumn?.defaultPin ?? null
      );

      return nextPreferences;
    });
  };

  const handleResizeStart = (column: DataGridColumn<TData>, event: React.MouseEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startWidth = columnWidths[column.id];
    const minWidth = column.minWidth ?? 110;
    const maxWidth = column.maxWidth ?? 420;

    const handlePointerMove = (moveEvent: MouseEvent) => {
      const nextWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + moveEvent.clientX - startX));
      updatePreferences((current) => ({
        ...current,
        columnWidths: {
          ...current.columnWidths,
          [column.id]: Math.round(nextWidth),
        },
      }));
    };

    const handlePointerUp = () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
  };

  const renderDataCell = (column: DataGridColumn<TData>, row: TData, rowIndex: number) => {
    const id = rowId(row);
    const pinState = preferences.pinnedLeftColumnIds.includes(column.id)
      ? 'left'
      : preferences.pinnedRightColumnIds.includes(column.id)
        ? 'right'
        : null;
    const style =
      pinState === 'left'
        ? { width: `${columnWidths[column.id]}px`, minWidth: `${columnWidths[column.id]}px`, left: `${leftOffsets[column.id]}px` }
        : pinState === 'right'
          ? { width: `${columnWidths[column.id]}px`, minWidth: `${columnWidths[column.id]}px`, right: `${rightOffsets[column.id]}px` }
          : { width: `${columnWidths[column.id]}px`, minWidth: `${columnWidths[column.id]}px` };

    return (
      <td
        key={column.id}
        className={cn(
          column.className,
          pinState === 'left' && 'catalogue-grid__cell--pinned-left',
          pinState === 'right' && 'catalogue-grid__cell--pinned-right'
        )}
        style={style}
      >
        {column.renderCell(row, {
          row,
          rowId: id,
          rowIndex,
          isSelected: selectedRowIds.includes(id),
        })}
      </td>
    );
  };

  return (
    <>
      <div className="catalogue-table-toolbar catalogue-grid-toolbar" aria-label={toolbarLabel}>
        <div className="catalogue-table-toolbar__meta">
          Showing {renderedRows.length} of {sortedRows.length} rows
          {preferences.groupByColumnId && (
            <span className="catalogue-grid-toolbar__pill">
              Grouped by {columnMap.get(preferences.groupByColumnId)?.label ?? 'column'}
            </span>
          )}
        </div>

        <div className="catalogue-grid-toolbar__actions">
          {selectable && selectedRows.length > 0 && bulkActions?.(selectedRows)}
          {exportFileName && (
            <button
              type="button"
              className="btn btn--outline btn--icon-left"
              onClick={() => exportRowsToCsv(sortedRows, arrangedColumns.filter((column) => column.type !== 'actions'), exportFileName)}
            >
              <Download size={16} />
              Export CSV
            </button>
          )}
          <Tooltip title="Visualize" arrow placement="top">
            <button
              type="button"
              className="catalogue-grid-toolbar__icon-button"
              onClick={() => setIsChartDrawerOpen(true)}
              aria-label="Visualize"
            >
              <BarChart3 size={14} />
            </button>
          </Tooltip>
          <Tooltip title="View" arrow placement="top">
            <button
              type="button"
              className="catalogue-grid-toolbar__icon-button"
              onClick={() => setIsConfiguratorOpen(true)}
              aria-label="View"
            >
              <LayoutTemplate size={14} />
            </button>
          </Tooltip>
          <Tooltip title="Reset" arrow placement="top">
            <button
              type="button"
              className="catalogue-grid-toolbar__icon-button"
              onClick={handleResetView}
              aria-label="Reset"
            >
              <RotateCcw size={14} />
            </button>
          </Tooltip>
          {toolbarEndSlot}
        </div>
      </div>

      <div className={cn('catalogue-table-scroll', 'catalogue-grid-scroll', `catalogue-grid-scroll--${preferences.density}`)}>
        <table className={cn('catalogue-table', 'catalogue-grid', `catalogue-grid--${preferences.density}`)}>
          <thead>
            <tr>
              {selectable && (
                <th
                  className="catalogue-grid__selection-header"
                  style={{ width: `${selectionColumnWidth}px`, minWidth: `${selectionColumnWidth}px`, left: '0px' }}
                >
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allFilteredSelected}
                    aria-label="Select visible rows"
                    onChange={(event) =>
                      setSelectedRowIds((current) => {
                        const currentSet = new Set(current);
                        if (event.target.checked) {
                          filteredRowIds.forEach((id) => currentSet.add(id));
                        } else {
                          filteredRowIds.forEach((id) => currentSet.delete(id));
                        }
                        return Array.from(currentSet);
                      })
                    }
                  />
                </th>
              )}

              {arrangedColumns.map((column) => {
                const pinState = preferences.pinnedLeftColumnIds.includes(column.id)
                  ? 'left'
                  : preferences.pinnedRightColumnIds.includes(column.id)
                    ? 'right'
                    : null;
                const style =
                  pinState === 'left'
                    ? { width: `${columnWidths[column.id]}px`, minWidth: `${columnWidths[column.id]}px`, left: `${leftOffsets[column.id]}px` }
                    : pinState === 'right'
                      ? { width: `${columnWidths[column.id]}px`, minWidth: `${columnWidths[column.id]}px`, right: `${rightOffsets[column.id]}px` }
                      : { width: `${columnWidths[column.id]}px`, minWidth: `${columnWidths[column.id]}px` };

                return (
                  <SortableTableHeader
                    key={column.id}
                    label={column.label}
                    sortKey={column.id}
                    sortState={effectiveSortState}
                    onSortChange={handleSortChange}
                    sortable={column.sortable !== false && column.type !== 'actions'}
                    className={cn(
                      column.headerClassName,
                      pinState === 'left' && 'catalogue-grid__cell--pinned-left',
                      pinState === 'right' && 'catalogue-grid__cell--pinned-right'
                    )}
                    dataType={
                      column.type === 'enum' || column.type === 'boolean' || column.type === 'actions'
                        ? 'text'
                        : column.type
                    }
                    aggregation={aggregations[column.id]}
                    menuLabel={column.menuLabel}
                    canGroup={column.groupable !== false && column.type !== 'actions'}
                    isGrouped={preferences.groupByColumnId === column.id}
                    onGroupToggle={() =>
                      updatePreferences((current) => ({
                        ...current,
                        groupByColumnId: current.groupByColumnId === column.id ? null : column.id,
                      }))
                    }
                    canPin={column.pinnable !== false}
                    pinState={pinState}
                    onPinChange={(_, nextPinState) => handlePinChange(column.id, nextPinState)}
                    canHide={!column.locked && column.hideable !== false && visibleColumns.length > 1}
                    onHide={() => handleVisibilityChange(column.id, false)}
                    onReset={() => handleResetColumn(column.id)}
                    style={style}
                    resizeHandle={
                      column.resizable !== false && (
                        <span
                          className="catalogue-grid__resize-handle"
                          onMouseDown={(event) => handleResizeStart(column, event)}
                        />
                      )
                    }
                  />
                );
              })}
            </tr>
          </thead>

          <tbody>
            {!preferences.groupByColumnId &&
              renderedRows.map((row, rowIndex) => {
                const id = rowId(row);

                return (
                  <tr key={id} className={rowClassName?.(row)}>
                    {selectable && (
                      <td
                        className="catalogue-grid__selection-cell catalogue-grid__cell--pinned-left"
                        style={{ width: `${selectionColumnWidth}px`, minWidth: `${selectionColumnWidth}px`, left: '0px' }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedRowIds.includes(id)}
                          aria-label={`Select row ${rowIndex + 1}`}
                          onChange={(event) =>
                            setSelectedRowIds((current) =>
                              event.target.checked
                                ? [...current, id]
                                : current.filter((selectedId) => selectedId !== id)
                            )
                          }
                        />
                      </td>
                    )}
                    {arrangedColumns.map((column) => renderDataCell(column, row, rowIndex))}
                  </tr>
                );
              })}

            {preferences.groupByColumnId &&
              groupedRows.map((group) => {
                const isCollapsed = collapsedGroupLabels[group.label] === true;

                return (
                  <React.Fragment key={group.label}>
                    <tr className="catalogue-grid__group-row">
                      <td colSpan={arrangedColumns.length + (selectable ? 1 : 0)}>
                        <button
                          type="button"
                          className="catalogue-grid__group-button"
                          onClick={() =>
                            setCollapsedGroupLabels((current) => ({
                              ...current,
                              [group.label]: !current[group.label],
                            }))
                          }
                        >
                          <span className="catalogue-grid__group-title">{group.label}</span>
                          <span className="catalogue-grid__group-meta">
                            {group.rows.length} {group.rows.length === 1 ? 'row' : 'rows'}
                          </span>
                        </button>
                      </td>
                    </tr>

                    {!isCollapsed &&
                      group.rows.map((row, rowIndex) => {
                        const id = rowId(row);

                        return (
                          <tr key={id} className={cn('catalogue-grid__group-child-row', rowClassName?.(row))}>
                            {selectable && (
                              <td
                                className="catalogue-grid__selection-cell catalogue-grid__cell--pinned-left"
                                style={{ width: `${selectionColumnWidth}px`, minWidth: `${selectionColumnWidth}px`, left: '0px' }}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedRowIds.includes(id)}
                                  aria-label={`Select row ${rowIndex + 1}`}
                                  onChange={(event) =>
                                    setSelectedRowIds((current) =>
                                      event.target.checked
                                        ? [...current, id]
                                        : current.filter((selectedId) => selectedId !== id)
                                    )
                                  }
                                />
                              </td>
                            )}
                            {arrangedColumns.map((column) => renderDataCell(column, row, rowIndex))}
                          </tr>
                        );
                      })}
                  </React.Fragment>
                );
              })}

            {renderCount < sortedRows.length && (
              <tr>
                <td colSpan={arrangedColumns.length + (selectable ? 1 : 0)} className="catalogue-grid__load-more-cell">
                  <div ref={loadMoreRef} className="catalogue-grid__load-more">
                    Loading more rows...
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <DataGridConfigurator
        isOpen={isConfiguratorOpen}
        columns={columns}
        preferences={preferences}
        onClose={() => setIsConfiguratorOpen(false)}
        onMoveColumn={handleMoveColumn}
        onVisibilityChange={handleVisibilityChange}
        onPinChange={handlePinChange}
        onGroupByChange={(columnId) =>
          updatePreferences((current) => ({
            ...current,
            groupByColumnId: columnId,
          }))
        }
        onDensityChange={(density) =>
          updatePreferences((current) => ({
            ...current,
            density,
          }))
        }
        onReset={handleResetView}
      />

      {isChartDrawerOpen && (
        <DataGridChartDrawer
          isOpen={isChartDrawerOpen}
          title={chartTitle}
          rows={filteredRows}
          columns={arrangedColumns}
          initialPreset={preferences.chartPreset}
          onClose={() => setIsChartDrawerOpen(false)}
          onPresetChange={(chartPreset) =>
            updatePreferences((current) => ({
              ...current,
              chartPreset,
            }))
          }
        />
      )}
    </>
  );
};

export default CommonDataGrid;
