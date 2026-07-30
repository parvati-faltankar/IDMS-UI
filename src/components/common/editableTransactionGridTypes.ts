import type React from 'react';

export type EditableGridColumnKind =
  | 'actions'
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'lookup'
  | 'status'
  | 'computed'
  | 'remarks';

export type EditableGridPin = 'left' | 'right' | null;
export type EditableGridColumnAlignment = 'left' | 'center' | 'right';

export type EditableGridCellElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export interface EditableGridOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface EditableGridLayoutColumn {
  key: string;
  label?: string;
  visible?: boolean;
  locked?: boolean;
}

export interface EditableGridViewPreset {
  id: string;
  label: string;
  columnIds: string[];
  description?: string;
  hidden?: boolean;
  disabled?: boolean;
}

export interface EditableGridMobileMetric {
  label: string;
  value: React.ReactNode;
}

export interface EditableGridMobileSummary {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  status?: React.ReactNode;
  metrics?: EditableGridMobileMetric[];
  detail?: React.ReactNode;
}

export interface EditableGridColumnContext<TRow> {
  gridId: string;
  row: TRow;
  rowId: string;
  rowIndex: number;
  column: EditableGridColumn<TRow>;
  error?: string;
  readOnly: boolean;
  disabled: boolean;
}

type EditableGridRowFlag<TRow> = boolean | ((row: TRow, context: EditableGridColumnContext<TRow>) => boolean);
type EditableGridRowText<TRow> = string | ((row: TRow, context: EditableGridColumnContext<TRow>) => string);

export interface EditableGridColumn<TRow> {
  id: string;
  label: string;
  kind: EditableGridColumnKind;
  align?: EditableGridColumnAlignment;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  locked?: boolean;
  pinned?: EditableGridPin;
  hideable?: boolean;
  mobilePriority?: number;
  required?: EditableGridRowFlag<TRow>;
  readOnly?: EditableGridRowFlag<TRow>;
  disabled?: EditableGridRowFlag<TRow>;
  placeholder?: EditableGridRowText<TRow>;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
  options?: EditableGridOption[] | ((row: TRow, context: EditableGridColumnContext<TRow>) => EditableGridOption[]);
  mobileLookup?: boolean;
  lookupTitle?: EditableGridRowText<TRow>;
  searchPlaceholder?: EditableGridRowText<TRow>;
  searchable?: boolean;
  getValue?: (row: TRow) => unknown;
  setValue?: (row: TRow, value: string, context: EditableGridColumnContext<TRow>) => TRow;
  renderDisplay?: (row: TRow, context: EditableGridColumnContext<TRow>) => React.ReactNode;
  onChange?: (row: TRow, value: string, context: EditableGridColumnContext<TRow>) => void;
  onBlur?: (row: TRow, context: EditableGridColumnContext<TRow>) => void;
  onKeyDown?: (event: React.KeyboardEvent<EditableGridCellElement>, row: TRow, context: EditableGridColumnContext<TRow>) => void;
  inputRef?: (row: TRow, element: EditableGridCellElement | null, context: EditableGridColumnContext<TRow>) => void;
  validate?: (row: TRow, value: unknown, context: EditableGridColumnContext<TRow>) => string | undefined;
  format?: (value: unknown, row: TRow, context: EditableGridColumnContext<TRow>) => string;
  parse?: (value: string, row: TRow, context: EditableGridColumnContext<TRow>) => string;
  aggregate?: (rows: TRow[]) => React.ReactNode;
  dataTour?: string | ((row: TRow, rowIndex: number) => string | undefined);
  className?: string;
  headerClassName?: string;
  footerClassName?: string;
}

export type EditableGridErrors<TRow> = Record<string, Partial<Record<keyof TRow | string, string | undefined>> | undefined>;

export type EditableGridFooterAggregates<TRow> =
  | Record<string, React.ReactNode>
  | ((rows: TRow[], columns: EditableGridColumn<TRow>[]) => Record<string, React.ReactNode>);

export interface EditableGridSelectionChangeMeta {
  reason: 'row' | 'range' | 'all' | 'clear' | 'external';
}

export interface EditableGridSelectionContext<TRow> {
  row: TRow;
  rowId: string;
  rowIndex: number;
}

export interface EditableGridSelectionConfig<TRow> {
  selectedRowIds: string[];
  onSelectionChange: (nextIds: string[], meta: EditableGridSelectionChangeMeta) => void;
  getRowSelectable?: (row: TRow, context: EditableGridSelectionContext<TRow>) => boolean;
  ariaLabel?: string;
}

export interface EditableGridBulkActionContext<TRow> {
  selectedRowIds: string[];
  selectedRows: TRow[];
  clearSelection: () => void;
}

export type EditableGridBulkActionFlag<TRow> =
  | boolean
  | ((context: EditableGridBulkActionContext<TRow>) => boolean);

export interface EditableGridBulkAction<TRow> {
  id: string;
  label: string;
  icon?: React.ReactNode;
  tone?: 'default' | 'primary' | 'danger';
  disabled?: EditableGridBulkActionFlag<TRow>;
  hidden?: EditableGridBulkActionFlag<TRow>;
  onAction: (context: EditableGridBulkActionContext<TRow>) => void;
}

export interface EditableTransactionGridProps<TRow> {
  gridId: string;
  title: string;
  description?: string;
  lineCountLabel?: string;
  hideHeaderIdentity?: boolean;
  summaryItems?: React.ReactNode[];
  attentionMessage?: React.ReactNode;
  headerHelp?: React.ReactNode;
  headerActions?: React.ReactNode;
  primaryActionLabel?: string;
  showInstructionalHint?: boolean;
  rows: TRow[];
  columns: EditableGridColumn<TRow>[];
  rowId: (row: TRow) => string;
  errors?: EditableGridErrors<TRow>;
  onRowsChange?: (rows: TRow[]) => void;
  onAddRow?: () => void;
  onDuplicateRow?: (rowId: string, row: TRow, rowIndex: number) => void;
  onDeleteRow?: (rowId: string, row: TRow, rowIndex: number) => void;
  selection?: EditableGridSelectionConfig<TRow>;
  bulkActions?: EditableGridBulkAction<TRow>[];
  selectionColumnLabel?: string;
  isRowComplete?: (row: TRow) => boolean;
  createRow?: (rowIndex: number) => TRow;
  onIncompleteRow?: (row: TRow) => void;
  footerAggregates?: EditableGridFooterAggregates<TRow>;
  layoutColumns?: EditableGridLayoutColumn[];
  viewPresets?: EditableGridViewPreset[];
  activeViewId?: string;
  defaultViewId?: string;
  onViewChange?: (viewId: string) => void;
  readOnly?: boolean;
  emptyState?: React.ReactNode;
  ariaLabel: string;
  mobileEditorTitle?: string | ((row: TRow, rowIndex: number) => string);
  getMobileRowSummary?: (
    row: TRow,
    context: { rowId: string; rowIndex: number; firstError?: string }
  ) => EditableGridMobileSummary;
  forceMobileLayout?: boolean;
}
