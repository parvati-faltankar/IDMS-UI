import React from 'react';
import { cn } from '../utils/classNames';
import type { PrintPreviewBlockView, PrintPreviewModel } from './types';

interface PrintTemplateDocumentProps {
  model: PrintPreviewModel;
  previewCopyIndex?: number;
  renderAllCopies?: boolean;
  className?: string;
}

function blockStyleToCss(style: PrintPreviewBlockView['style']): React.CSSProperties {
  return {
    fontFamily: style.fontFamily,
    fontSize: style.fontSize ? `${style.fontSize}px` : undefined,
    fontWeight: style.fontWeight,
    fontStyle: style.italic ? 'italic' : undefined,
    textDecoration: style.underline ? 'underline' : undefined,
    color: style.color,
    textAlign: style.textAlign,
    padding: style.padding ? `${style.padding}px` : undefined,
    margin: style.margin ? `${style.margin}px` : undefined,
    borderWidth: style.borderWidth ? `${style.borderWidth}px` : undefined,
    borderStyle: style.borderWidth ? 'solid' : undefined,
    borderColor: style.borderColor,
    backgroundColor: style.backgroundColor,
    width: style.widthMode === 'half' ? '48%' : style.widthMode === 'full' ? '100%' : undefined,
  };
}

function RenderBlock({ block }: { block: PrintPreviewBlockView }) {
  const style = blockStyleToCss(block.style);

  if (block.type === 'divider') {
    return <div className="print-template-document__divider" style={style} aria-hidden="true" />;
  }

  if (block.type === 'image') {
    return (
      <div className="print-template-document__block print-template-document__block--image" style={style}>
        {block.imageSrc ? <img src={block.imageSrc} alt={block.value || block.title} /> : <span>No image selected</span>}
      </div>
    );
  }

  if (block.type === 'table') {
    return (
      <div className="print-template-document__block print-template-document__block--table" style={style}>
        <div className="print-template-document__block-title">{block.title}</div>
        {block.table ? (
          <>
            <table className="print-template-document__table">
              <thead>
                <tr>
                  {block.table.columns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.table.rows.map((row, rowIndex) => (
                  <tr key={`${block.id}-${rowIndex}`}>
                    {block.table?.columns.map((column) => (
                      <td key={column.key}>{row[column.key] ?? '-'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {block.table.totals && block.table.totals.length > 0 && (
              <div className="print-template-document__totals">
                {block.table.totals.map((total) => (
                  <div key={total.label} className="print-template-document__total-row">
                    <span>{total.label}</span>
                    <strong>{total.value}</strong>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="print-template-document__placeholder">No table data available.</div>
        )}
      </div>
    );
  }

  if (block.type === 'signature') {
    return (
      <div className="print-template-document__block print-template-document__block--signature" style={style}>
        <div className="print-template-document__signature-line" />
        <div className="print-template-document__signature-label">{block.signatureLabel || block.title}</div>
      </div>
    );
  }

  return (
    <div className="print-template-document__block" style={style}>
      {block.type !== 'copy-label' && block.title && <div className="print-template-document__block-title">{block.title}</div>}
      <div className={cn('print-template-document__block-value', block.type === 'copy-label' && 'print-template-document__block-value--copy')}>
        {block.value || '-'}
      </div>
    </div>
  );
}

export default function PrintTemplateDocument({
  model,
  previewCopyIndex = 0,
  renderAllCopies = false,
  className,
}: PrintTemplateDocumentProps) {
  const pages = renderAllCopies
    ? model.pages
    : model.pages[previewCopyIndex]
      ? [model.pages[previewCopyIndex]]
      : model.pages.slice(0, 1);

  return (
    <div className={cn('print-template-document', className)} data-print-entity={model.entityType}>
      {pages.map((page) => (
        <article key={`${model.templateId}-${page.copyLabel}`} className="print-template-document__page">
          <div className="print-template-document__page-meta">
            <span className="print-template-document__entity">{model.entityLabel}</span>
            <span className="print-template-document__document-number">{model.documentNumber}</span>
          </div>

          <div className="print-template-document__section print-template-document__section--header">
            {page.header.map((block) => (
              <RenderBlock key={block.id} block={block} />
            ))}
          </div>

          <div className="print-template-document__section print-template-document__section--body">
            {page.body.map((block) => (
              <RenderBlock key={block.id} block={block} />
            ))}
          </div>

          <div className="print-template-document__section print-template-document__section--footer">
            {page.footer.map((block) => (
              <RenderBlock key={block.id} block={block} />
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
