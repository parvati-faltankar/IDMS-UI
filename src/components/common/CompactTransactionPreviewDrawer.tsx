import React, { useEffect, useMemo, useState } from 'react';
import { Ban, ChevronDown, ChevronUp, Download, PencilLine, Printer } from 'lucide-react';
import SideDrawer from './SideDrawer';
import StatusBadge from './StatusBadge';
import { cn } from '../../utils/classNames';
import { formatDate, formatDateTime } from '../../utils/dateFormat';
import { useDocumentPrint } from '../../print-builder/useDocumentPrint';
import type { PrintEntityType } from '../../print-builder/types';

type PreviewRecord = Record<string, unknown>;

type PreviewMetric = {
  label: string;
  value: React.ReactNode;
};

interface CompactTransactionPreviewDrawerProps<TDocument extends object> {
  document: TDocument | null;
  isOpen: boolean;
  documentTypeLabel: string;
  subtitle?: string;
  onClose: () => void;
  onEdit?: (document: TDocument) => void;
  onCancel?: (document: TDocument) => void;
  onDownload?: (document: TDocument) => void;
  printEntityType?: PrintEntityType;
  canEdit?: boolean;
  canCancel?: boolean;
  canDownload?: boolean;
}

interface PreviewSection {
  title: string;
  entries: Array<[string, unknown]>;
  fullWidth: boolean;
}

interface LineCollectionPreview {
  name: string;
  rows: PreviewRecord[];
  columns: string[];
  primaryColumns: string[];
  secondaryColumns: string[];
}

const labelOverrides: Record<string, string> = {
  hsnSac: 'HSN/SAC',
  id: 'ID',
  poDate: 'PO Date',
  prDate: 'PR Date',
  number: 'Document No.',
  uom: 'UOM',
  gstin: 'GSTIN',
};

const metricLabelOverrides: Record<string, string> = {
  createdOn: 'Created on',
  deliveryDateTime: 'Delivery date',
  documentDateTime: 'Document date',
  invoiceDateTime: 'Invoice date',
  orderDateTime: 'Order date',
  requestDateTime: 'Request date',
  updatedAt: 'Updated on',
};

const hiddenScalarKeys = new Set(['id']);
const supportedStatuses = new Set(['Draft', 'Pending Approval', 'Approved', 'Rejected', 'Cancelled']);
const supportedLineStatuses = new Set(['Open', 'Partially Cancelled', 'Partially Ordered', 'Fully Ordered', 'Cancelled']);
const supportedPriorities = new Set(['Low', 'Medium', 'High', 'Critical']);
const summaryDateKeys = ['documentDateTime', 'orderDateTime', 'requestDateTime', 'invoiceDateTime', 'deliveryDateTime', 'createdOn', 'updatedAt'];
const summaryAmountKeys = ['totalAmount', 'netAmount', 'amount', 'lineAmount', 'taxableAmount'];
const summaryPartyKeys = ['customerName', 'customer', 'supplierName', 'supplier', 'buyerName', 'requesterName', 'salesExecutive'];
const lineKeyPatterns: Array<[RegExp, number]> = [
  [/^(number|code|itemcode|productcode|documentnumber)$/i, 120],
  [/name$/i, 112],
  [/description|remark|notes?/i, 84],
  [/^(uom|unit|category|type)$/i, 94],
  [/(qty|quantity|requestedqty|orderqty|allocatedqty|pendingqty|receivedqty|invoicedqty|deliveredqty|cancelledqty)/i, 130],
  [/(amount|tax|discount|rate|price)/i, 125],
  [/(date|time)/i, 96],
  [/status/i, 118],
  [/priority/i, 108],
  [/(warehouse|location|bin|branch|source|destination|supplier|customer|executive|transporter)/i, 82],
];

function toTitleCaseKey(key: string): string {
  if (labelOverrides[key]) {
    return labelOverrides[key];
  }

  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isScalarValue(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

function isLineCollection(value: unknown): value is PreviewRecord[] {
  return Array.isArray(value) && value.every((item) => item && typeof item === 'object' && !Array.isArray(item));
}

function getDocumentNumber(document: PreviewRecord): string {
  return String(document.number ?? document.documentNumber ?? document.code ?? 'Document Preview');
}

function getStatus(document: PreviewRecord): string {
  return String(document.status ?? '').trim();
}

function getFirstScalarEntry(document: PreviewRecord, keys: string[]): [string, unknown] | undefined {
  const lookup = new Set(keys.map((key) => key.toLowerCase()));
  return Object.entries(document).find(([key, value]) => lookup.has(key.toLowerCase()) && isScalarValue(value) && String(value).trim().length > 0);
}

function getPreviewParty(document: PreviewRecord): string | null {
  const entry = getFirstScalarEntry(document, summaryPartyKeys);
  return entry ? String(entry[1]).trim() : null;
}

function getSummaryValue(document: PreviewRecord, keys: string[]): { key: string; value: unknown } | null {
  const entry = getFirstScalarEntry(document, keys);
  return entry ? { key: entry[0], value: entry[1] } : null;
}

function formatPreviewValue(key: string, value: unknown, context: 'scalar' | 'line' = 'scalar'): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const lowerKey = key.toLowerCase();

  if (lowerKey.includes('status')) {
    const badgeValue = String(value);

    if (context === 'line' && supportedLineStatuses.has(badgeValue)) {
      return <StatusBadge kind='line-status' value={badgeValue as 'Open'} />;
    }

    if (supportedStatuses.has(badgeValue)) {
      return <StatusBadge kind='requisition-status' value={badgeValue as 'Draft'} />;
    }

    return String(value);
  }

  if (lowerKey.includes('priority')) {
    const badgeValue = String(value);

    if (supportedPriorities.has(badgeValue)) {
      return <StatusBadge kind='priority' value={badgeValue as 'Low'} />;
    }

    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'string') {
    const isIsoDateTime = /^\d{4}-\d{2}-\d{2}T/.test(value);
    const isIsoDate = /^\d{4}-\d{2}-\d{2}$/.test(value);

    if (isIsoDateTime) {
      const { dateLabel, timeLabel } = formatDateTime(value);
      return `${dateLabel}, ${timeLabel}`;
    }

    if (isIsoDate && (lowerKey.includes('date') || lowerKey.includes('created') || lowerKey.includes('updated'))) {
      return formatDate(value);
    }
  }

  return String(value);
}

function createSections(document: PreviewRecord): PreviewSection[] {
  const scalarEntries = Object.entries(document).filter(
    ([key, value]) => !hiddenScalarKeys.has(key) && isScalarValue(value)
  );
  const usedKeys = new Set<string>();

  const pick = (title: string, matcher: (key: string) => boolean): PreviewSection => {
    const entries = scalarEntries.filter(([key]) => !usedKeys.has(key) && matcher(key));
    entries.forEach(([key]) => usedKeys.add(key));
    return {
      title,
      entries,
      fullWidth: title === 'Additional details' || entries.length > 8,
    };
  };

  const sections = [
    pick('Document information', (key) => {
      const lowerKey = key.toLowerCase();
      return (
        key === 'number' ||
        lowerKey.includes('document') ||
        lowerKey.includes('date') ||
        lowerKey.includes('status') ||
        lowerKey.includes('priority')
      );
    }),
    pick('Party details', (key) => {
      const lowerKey = key.toLowerCase();
      return (
        lowerKey.includes('supplier') ||
        lowerKey.includes('customer') ||
        lowerKey.includes('buyer') ||
        lowerKey.includes('requester') ||
        lowerKey.includes('executive') ||
        lowerKey.includes('createdby') ||
        lowerKey.includes('receivedby') ||
        lowerKey.includes('allocatedby')
      );
    }),
    pick('Reference and fulfilment', (key) => {
      const lowerKey = key.toLowerCase();
      return (
        lowerKey.includes('requisition') ||
        lowerKey.includes('order') ||
        lowerKey.includes('invoice') ||
        lowerKey.includes('receipt') ||
        lowerKey.includes('allocation') ||
        lowerKey.includes('department') ||
        lowerKey.includes('branch') ||
        lowerKey.includes('warehouse') ||
        lowerKey.includes('location') ||
        lowerKey.includes('source') ||
        lowerKey.includes('destination') ||
        lowerKey.includes('delivery') ||
        lowerKey.includes('payment') ||
        lowerKey.includes('term') ||
        lowerKey.includes('method') ||
        lowerKey.includes('mode')
      );
    }),
    pick('Amount summary', (key) => {
      const lowerKey = key.toLowerCase();
      return (
        lowerKey.includes('amount') ||
        lowerKey.includes('tax') ||
        lowerKey.includes('discount') ||
        lowerKey.includes('currency')
      );
    }),
    pick('Additional details', () => true),
  ];

  return sections.filter((section) => section.entries.length > 0);
}

function isWidePreviewField(key: string, value: unknown): boolean {
  const lowerKey = key.toLowerCase();

  if (
    lowerKey.includes('address') ||
    lowerKey.includes('instruction') ||
    lowerKey.includes('remarks') ||
    lowerKey.includes('remark') ||
    lowerKey.includes('notes') ||
    lowerKey.includes('description') ||
    lowerKey.includes('terms')
  ) {
    return true;
  }

  if (typeof value === 'string' && value.length > 42) {
    return true;
  }

  return false;
}

function getLineCollections(document: PreviewRecord): Array<[string, PreviewRecord[]]> {
  return Object.entries(document).filter((entry): entry is [string, PreviewRecord[]] => isLineCollection(entry[1]));
}

function scoreLineColumn(column: string): number {
  return lineKeyPatterns.reduce((score, [pattern, value]) => (pattern.test(column) ? Math.max(score, value) : score), 0);
}

function selectPrimaryLineColumns(columns: string[], limit = 6): string[] {
  const uniqueColumns = columns.filter((column, index, list) => column !== 'id' && list.indexOf(column) === index);

  return [...uniqueColumns]
    .sort((left, right) => {
      const scoreDelta = scoreLineColumn(right) - scoreLineColumn(left);
      return scoreDelta !== 0 ? scoreDelta : uniqueColumns.indexOf(left) - uniqueColumns.indexOf(right);
    })
    .slice(0, limit);
}

function isNumericLineColumn(column: string): boolean {
  return /qty|quantity|amount|rate|price|tax|discount|count|balance|total/i.test(column);
}

function downloadDocument(document: PreviewRecord, documentTypeLabel: string) {
  const fileName = `${getDocumentNumber(document)}-${documentTypeLabel}`
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .toLowerCase();
  const blob = new Blob([JSON.stringify(document, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement('a');

  anchor.href = url;
  anchor.download = `${fileName}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

const CompactTransactionPreviewDrawer = <TDocument extends object>({
  document,
  isOpen,
  documentTypeLabel,
  subtitle,
  onClose,
  onEdit,
  onCancel,
  onDownload,
  printEntityType,
  canEdit,
  canCancel,
  canDownload,
}: CompactTransactionPreviewDrawerProps<TDocument>) => {
  const previewRecord = document as PreviewRecord | null;
  const printTools = useDocumentPrint(printEntityType ?? 'sale-order');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const sections = useMemo(() => (previewRecord ? createSections(previewRecord) : []), [previewRecord]);
  const lineCollections = useMemo(() => {
    if (!previewRecord) {
      return [];
    }

    return getLineCollections(previewRecord).map(([name, rows]) => {
      const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row).filter((key) => key !== 'id'))));
      const primaryColumns = selectPrimaryLineColumns(columns);
      const secondaryColumns = columns.filter((column) => !primaryColumns.includes(column));

      return {
        name,
        rows,
        columns,
        primaryColumns,
        secondaryColumns,
      };
    });
  }, [previewRecord]);

  useEffect(() => {
    setExpandedRows({});
  }, [previewRecord]);

  if (!document || !previewRecord) {
    return null;
  }

  const status = getStatus(previewRecord);
  const isCancelled = status.toLowerCase() === 'cancelled';
  const resolvedCanEdit = canEdit ?? !isCancelled;
  const resolvedCanCancel = canCancel ?? !isCancelled;
  const resolvedCanDownload = canDownload ?? true;
  const previewStatus = status && supportedStatuses.has(status) ? status : null;
  const previewPriority =
    typeof previewRecord.priority === 'string' && supportedPriorities.has(previewRecord.priority)
      ? previewRecord.priority
      : null;
  const previewParty = getPreviewParty(previewRecord);
  const normalizedSubtitle = subtitle && !subtitle.toLowerCase().includes('preview') ? subtitle : null;
  const drawerTitle = `${documentTypeLabel} Preview`;
  const drawerSubtitle = previewParty ?? normalizedSubtitle ?? getDocumentNumber(previewRecord);
  const heroSubtitle =
    previewParty && normalizedSubtitle && normalizedSubtitle !== previewParty
      ? `${previewParty} | ${normalizedSubtitle}`
      : previewParty ?? normalizedSubtitle ?? 'Review document details and line items.';

  const dateEntry = getSummaryValue(previewRecord, summaryDateKeys);
  const amountEntry = getSummaryValue(previewRecord, summaryAmountKeys);

  const summaryMetrics: PreviewMetric[] = [
    {
      label: 'Status',
      value: previewStatus ? (
        <StatusBadge kind='requisition-status' value={previewStatus as 'Draft'} className='transaction-preview__metric-badge' />
      ) : (
        '-'
      ),
    },
    {
      label: 'Priority',
      value: previewPriority ? (
        <StatusBadge kind='priority' value={previewPriority as 'Low'} className='transaction-preview__metric-badge' />
      ) : (
        '-'
      ),
    },
    {
      label: dateEntry ? metricLabelOverrides[dateEntry.key] ?? toTitleCaseKey(dateEntry.key) : 'Key date',
      value: dateEntry ? formatPreviewValue(dateEntry.key, dateEntry.value) : '-',
    },
    {
      label: amountEntry ? metricLabelOverrides[amountEntry.key] ?? toTitleCaseKey(amountEntry.key) : 'Amount',
      value: amountEntry ? formatPreviewValue(amountEntry.key, amountEntry.value) : '-',
    },
  ];

  const headerActions = (
    <div className='transaction-preview__actions' aria-label={`${documentTypeLabel} actions`}>
      <button
        type='button'
        className={cn('transaction-preview__action-icon', !resolvedCanEdit && 'transaction-preview__action-icon--disabled')}
        onClick={() => resolvedCanEdit && onEdit?.(document)}
        disabled={!resolvedCanEdit}
        aria-label={`Edit ${getDocumentNumber(previewRecord)}`}
        title={resolvedCanEdit ? 'Edit' : 'Edit is not available'}
      >
        <PencilLine size={15} />
      </button>
      <button
        type='button'
        className={cn('transaction-preview__action-icon', !resolvedCanCancel && 'transaction-preview__action-icon--disabled')}
        onClick={() => resolvedCanCancel && onCancel?.(document)}
        disabled={!resolvedCanCancel}
        aria-label={`Cancel ${getDocumentNumber(previewRecord)}`}
        title={resolvedCanCancel ? 'Cancel' : 'Cancel is not available'}
      >
        <Ban size={15} />
      </button>
      <button
        type='button'
        className={cn(
          'transaction-preview__action-icon',
          !printEntityType && 'transaction-preview__action-icon--disabled'
        )}
        onClick={() => {
          if (!printEntityType) {
            return;
          }

          printTools.openPrintPreview(previewRecord, () => window.print());
        }}
        disabled={!printEntityType}
        aria-label={`Print ${getDocumentNumber(previewRecord)}`}
        title={printEntityType ? 'Print' : 'Print is not available'}
      >
        <Printer size={15} />
      </button>
      <button
        type='button'
        className={cn('transaction-preview__action-icon', !resolvedCanDownload && 'transaction-preview__action-icon--disabled')}
        onClick={() => {
          if (!resolvedCanDownload) {
            return;
          }

          if (onDownload) {
            onDownload(document);
            return;
          }

          downloadDocument(previewRecord, documentTypeLabel);
        }}
        disabled={!resolvedCanDownload}
        aria-label={`Download ${getDocumentNumber(previewRecord)}`}
        title={resolvedCanDownload ? 'Download' : 'Download is not available'}
      >
        <Download size={15} />
      </button>
    </div>
  );

  return (
    <SideDrawer
      isOpen={isOpen}
      title={drawerTitle}
      subtitle={drawerSubtitle}
      headerActions={headerActions}
      onClose={onClose}
      panelClassName='side-drawer__panel--transaction-preview transaction-preview-drawer'
      contentClassName='transaction-preview-drawer__content'
    >
      <div className='transaction-preview'>
        <div className='transaction-preview__sheet'>
          <section className='transaction-preview__hero'>
            <div className='transaction-preview__hero-top'>
              <div className='transaction-preview__hero-copy'>
                <div className='transaction-preview__eyebrow'>{documentTypeLabel}</div>
                <div className='transaction-preview__number'>{getDocumentNumber(previewRecord)}</div>
                <div className='transaction-preview__hero-subtitle'>{heroSubtitle}</div>
              </div>

              <div className='transaction-preview__hero-meta'>
                {previewStatus && (
                  <StatusBadge
                    kind='requisition-status'
                    value={previewStatus as 'Draft'}
                    className='transaction-preview__hero-badge'
                  />
                )}
                {previewPriority && (
                  <StatusBadge
                    kind='priority'
                    value={previewPriority as 'Low'}
                    className='transaction-preview__hero-badge'
                  />
                )}
              </div>
            </div>

            <div className='transaction-preview__metrics' aria-label='Document summary metrics'>
              {summaryMetrics.map((metric) => (
                <div className='transaction-preview__metric' key={metric.label}>
                  <span className='transaction-preview__metric-label'>{metric.label}</span>
                  <span className='transaction-preview__metric-value'>{metric.value}</span>
                </div>
              ))}
            </div>
          </section>

          <div className='transaction-preview__grid'>
            {sections.map((section) => (
              <section
                className={cn('transaction-preview__section', section.fullWidth && 'transaction-preview__section--full')}
                key={section.title}
              >
                <div className='transaction-preview__section-header'>
                  <div className='transaction-preview__section-title'>{section.title}</div>
                  <span className='transaction-preview__section-count'>{section.entries.length}</span>
                </div>
                <div className='transaction-preview__field-grid'>
                  {section.entries.map(([key, value]) => (
                    <div
                      className={cn('transaction-preview__field', isWidePreviewField(key, value) && 'transaction-preview__field--wide')}
                      key={key}
                    >
                      <span className='transaction-preview__label'>{toTitleCaseKey(key)}</span>
                      <span className='transaction-preview__value'>{formatPreviewValue(key, value)}</span>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {lineCollections.map((collection) => {
              const hasDetails = collection.secondaryColumns.length > 0;

              return (
                <section className='transaction-preview__section transaction-preview__section--full' key={collection.name}>
                  <div className='transaction-preview__section-header'>
                    <div className='transaction-preview__section-title'>
                      {toTitleCaseKey(collection.name)}
                      <span className='transaction-preview__section-count'>{collection.rows.length}</span>
                    </div>
                    <span className='transaction-preview__section-note'>
                      {hasDetails ? 'Core columns first, extras in row details' : 'Compact line summary'}
                    </span>
                  </div>
                  <div className='transaction-preview__table-wrap'>
                    <table className='transaction-preview__table'>
                      <thead>
                        <tr>
                          {hasDetails && <th className='transaction-preview__table-expander-head' aria-label='Expand row details' />}
                          {collection.primaryColumns.map((column) => (
                            <th
                              key={column}
                              className={cn(isNumericLineColumn(column) && 'transaction-preview__table-number')}
                            >
                              {toTitleCaseKey(column)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {collection.rows.map((row, rowIndex) => {
                          const rowId = `${collection.name}-${rowIndex}`;
                          const isExpanded = Boolean(expandedRows[rowId]);
                          const colSpan = collection.primaryColumns.length + (hasDetails ? 1 : 0);

                          return (
                            <React.Fragment key={rowId}>
                              <tr className={cn(isExpanded && 'transaction-preview__table-row--expanded')}>
                                {hasDetails && (
                                  <td className='transaction-preview__table-expander-cell'>
                                    <button
                                      type='button'
                                      className='transaction-preview__table-expander'
                                      onClick={() =>
                                        setExpandedRows((current) => ({
                                          ...current,
                                          [rowId]: !current[rowId],
                                        }))
                                      }
                                      aria-expanded={isExpanded}
                                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${toTitleCaseKey(collection.name)} row ${rowIndex + 1}`}
                                    >
                                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                  </td>
                                )}
                                {collection.primaryColumns.map((column) => (
                                  <td
                                    key={column}
                                    className={cn(
                                      'transaction-preview__table-cell',
                                      isNumericLineColumn(column) && 'transaction-preview__table-number'
                                    )}
                                  >
                                    {formatPreviewValue(column, row[column], 'line')}
                                  </td>
                                ))}
                              </tr>

                              {hasDetails && isExpanded && (
                                <tr className='transaction-preview__table-details-row'>
                                  <td colSpan={colSpan}>
                                    <div className='transaction-preview__table-details'>
                                      {collection.secondaryColumns.map((column) => (
                                        <div className='transaction-preview__table-detail' key={column}>
                                          <span className='transaction-preview__table-detail-label'>{toTitleCaseKey(column)}</span>
                                          <span className='transaction-preview__table-detail-value'>
                                            {formatPreviewValue(column, row[column], 'line')}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
      {printTools.printPreviewOverlay}
    </SideDrawer>
  );
};

export default CompactTransactionPreviewDrawer;

