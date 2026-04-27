import type React from 'react';
import type { SortState } from '../../utils/sortState';
import type { TableColumnAggregation, TableColumnDataType } from './SortableTableHeader';

export type DataGridDensity = 'compact' | 'comfortable';

export type DataGridPinState = 'left' | 'right' | null;

export type DataGridColumnFilter =
  | {
      kind: 'text';
      value: string;
    }
  | {
      kind: 'enum';
      value: string;
    }
  | {
      kind: 'boolean';
      value: 'all' | 'true' | 'false';
    }
  | {
      kind: 'number-range';
      min: string;
      max: string;
    }
  | {
      kind: 'date-range';
      from: string;
      to: string;
    };

export interface DataGridColumnOption {
  value: string;
  label: string;
}

export interface DataGridChartPreset {
  chartType: 'bar' | 'line' | 'area' | 'donut' | 'stacked-bar';
  dimensionColumnId: string;
  metricColumnId: string;
  aggregation: 'count' | 'sum' | 'average' | 'min' | 'max';
  seriesColumnId?: string;
}

export interface DataGridStoredPreferences {
  version: number;
  columnOrder: string[];
  hiddenColumnIds: string[];
  pinnedLeftColumnIds: string[];
  pinnedRightColumnIds: string[];
  columnWidths: Record<string, number>;
  columnFilters: Record<string, DataGridColumnFilter | undefined>;
  groupByColumnId: string | null;
  density: DataGridDensity;
  chartPreset?: DataGridChartPreset;
}

export interface DataGridColumn<TData> {
  id: string;
  label: string;
  type?: TableColumnDataType | 'enum' | 'boolean' | 'actions';
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  locked?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  groupable?: boolean;
  pinnable?: boolean;
  hideable?: boolean;
  resizable?: boolean;
  defaultPin?: Exclude<DataGridPinState, null>;
  menuLabel?: string;
  options?: DataGridColumnOption[];
  getValue?: (row: TData) => unknown;
  getSortValue?: (row: TData) => unknown;
  getExportValue?: (row: TData) => string;
  renderCell: (row: TData, context: DataGridRenderCellContext<TData>) => React.ReactNode;
  aggregation?: (rows: TData[]) => TableColumnAggregation;
  className?: string;
  headerClassName?: string;
}

export interface DataGridRenderCellContext<TData> {
  rowId: string;
  rowIndex: number;
  row: TData;
  isSelected: boolean;
}

export interface CommonDataGridProps<TData, TSortKey extends string = string> {
  gridId: string;
  rows: TData[];
  columns: DataGridColumn<TData>[];
  rowId: (row: TData) => string;
  rowClassName?: (row: TData) => string | undefined;
  emptyLabel?: string;
  selectable?: boolean;
  sortState?: SortState<TSortKey>;
  onSortChange?: (key: TSortKey, direction: 'asc' | 'desc' | null) => void;
  defaultDensity?: DataGridDensity;
  initialBatchSize?: number;
  batchSize?: number;
  incrementalRenderingThreshold?: number;
  onSelectionChange?: (rowIds: string[]) => void;
  bulkActions?: (selectedRows: TData[]) => React.ReactNode;
  toolbarEndSlot?: React.ReactNode;
  toolbarLabel?: string;
  chartTitle?: string;
  exportFileName?: string;
}

