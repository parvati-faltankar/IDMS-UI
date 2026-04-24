import React, { useMemo } from 'react';
import { Ban, Download, PencilLine } from 'lucide-react';
import SideDrawer from './SideDrawer';
import StatusBadge from './StatusBadge';
import { cn } from '../../utils/classNames';
import { formatDate, formatDateTime } from '../../utils/dateFormat';

type PreviewRecord = Record<string, unknown>;

interface DocumentPreviewDrawerProps<TDocument extends object> {
  document: TDocument | null;
  isOpen: boolean;
  documentTypeLabel: string;
  subtitle?: string;
  onClose: () => void;
  onEdit?: (document: TDocument) => void;
  onCancel?: (document: TDocument) => void;
  onDownload?: (document: TDocument) => void;
  canEdit?: boolean;
  canCancel?: boolean;
  canDownload?: boolean;
}

interface PreviewSection {
  title: string;
  entries: Array<[string, unknown]>;
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

const hiddenScalarKeys = new Set(['id']);
const supportedStatuses = new Set(['Draft', 'Pending Approval', 'Approved', 'Rejected', 'Cancelled']);
const supportedLineStatuses = new Set(['Open', 'Partially Cancelled', 'Partially Ordered', 'Fully Ordered', 'Cancelled']);
const supportedPriorities = new Set(['Low', 'Medium', 'High', 'Critical']);

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

function formatPreviewValue(key: string, value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const lowerKey = key.toLowerCase();

  if (lowerKey.includes('status')) {
    const badgeValue = String(value);

    if (lowerKey.includes('line') && supportedLineStatuses.has(badgeValue)) {
      return <StatusBadge kind="line-status" value={badgeValue as 'Open'} />;
    }

    if (supportedStatuses.has(badgeValue)) {
      return <StatusBadge kind="requisition-status" value={badgeValue as 'Draft'} />;
    }

    return String(value);
  }

  if (lowerKey.includes('priority')) {
    const badgeValue = String(value);

    if (supportedPriorities.has(badgeValue)) {
      return <StatusBadge kind="priority" value={badgeValue as 'Low'} />;
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
    return { title, entries };
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

function getLineCollections(document: PreviewRecord): Array<[string, PreviewRecord[]]> {
  return Object.entries(document).filter((entry): entry is [string, PreviewRecord[]] => isLineCollection(entry[1]));
}

const DocumentPreviewDrawer = <TDocument extends object>({
  document,
  isOpen,
  documentTypeLabel,
  subtitle,
  onClose,
  onEdit,
  onCancel,
  onDownload,
  canEdit,
  canCancel,
  canDownload,
}: DocumentPreviewDrawerProps<TDocument>) => {
  const previewRecord = document as PreviewRecord | null;
  const sections = useMemo(() => (previewRecord ? createSections(previewRecord) : []), [previewRecord]);
  const lineCollections = useMemo(() => (previewRecord ? getLineCollections(previewRecord) : []), [previewRecord]);

  if (!document || !previewRecord) {
    return null;
  }

  const status = getStatus(previewRecord);
  const isCancelled = status.toLowerCase() === 'cancelled';
  const resolvedCanEdit = canEdit ?? !isCancelled;
  const resolvedCanCancel = canCancel ?? !isCancelled;
  const resolvedCanDownload = canDownload ?? true;

  const headerActions = (
    <div className="document-preview__actions" aria-label={`${documentTypeLabel} actions`}>
      <button
        type="button"
        className={cn('document-preview__action-icon', !resolvedCanEdit && 'document-preview__action-icon--disabled')}
        onClick={() => resolvedCanEdit && onEdit?.(document)}
        disabled={!resolvedCanEdit}
        aria-label={`Edit ${getDocumentNumber(previewRecord)}`}
        title={resolvedCanEdit ? 'Edit' : 'Edit is not available'}
      >
        <PencilLine size={15} />
      </button>
      <button
        type="button"
        className={cn('document-preview__action-icon', !resolvedCanCancel && 'document-preview__action-icon--disabled')}
        onClick={() => resolvedCanCancel && onCancel?.(document)}
        disabled={!resolvedCanCancel}
        aria-label={`Cancel ${getDocumentNumber(previewRecord)}`}
        title={resolvedCanCancel ? 'Cancel' : 'Cancel is not available'}
      >
        <Ban size={15} />
      </button>
      <button
        type="button"
        className={cn('document-preview__action-icon', !resolvedCanDownload && 'document-preview__action-icon--disabled')}
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
      title={getDocumentNumber(previewRecord)}
      subtitle={subtitle ?? `${documentTypeLabel} preview`}
      headerActions={headerActions}
      onClose={onClose}
      panelClassName="document-preview-drawer"
    >
      <div className="document-preview">
        <div className="document-preview__top-grid">
          {sections.map((section) => (
            <section className="document-preview__section" key={section.title}>
              <div className="document-preview__section-title">{section.title}</div>
              <div className="document-preview__list">
                {section.entries.map(([key, value]) => (
                  <div className="document-preview__item" key={key}>
                    <span className="document-preview__label">{toTitleCaseKey(key)}</span>
                    <span className="document-preview__value">{formatPreviewValue(key, value)}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {lineCollections.map(([collectionName, rows]) => {
          const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));

          return (
            <section className="document-preview__section" key={collectionName}>
              <div className="document-preview__section-title">{toTitleCaseKey(collectionName)}</div>
              <div className="document-preview__table-wrap">
                <table className="document-preview__table">
                  <thead>
                    <tr>
                      {columns.map((column) => (
                        <th key={column}>{toTitleCaseKey(column)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rowIndex) => (
                      <tr key={`${collectionName}-${rowIndex}`}>
                        {columns.map((column) => (
                          <td
                            key={column}
                            className={cn(
                              /qty|quantity|amount|rate|price|tax|discount|count/i.test(column) &&
                                'document-preview__table-number'
                            )}
                          >
                            {formatPreviewValue(column, row[column])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </SideDrawer>
  );
};

export default DocumentPreviewDrawer;
