import { useEffect, useMemo, useState } from 'react';
import { Printer, X } from 'lucide-react';
import { cn } from '../utils/classNames';
import {
  loadTemplatesForEntity,
  renderTemplatePreview,
  resolveDefaultTemplateForEntity,
} from './service';
import PrintTemplateDocument from './PrintTemplateDocument';
import type { PrintEntityType, PrintTemplateRecord } from './types';

interface PrintTemplatePreviewOverlayProps {
  isOpen: boolean;
  entityType: PrintEntityType;
  previewDocument: Record<string, unknown> | null;
  onClose: () => void;
  fallbackPrint?: () => void;
}

export default function PrintTemplatePreviewOverlay({
  isOpen,
  entityType,
  previewDocument,
  onClose,
  fallbackPrint,
}: PrintTemplatePreviewOverlayProps) {
  const activeTemplates = useMemo(
    () => loadTemplatesForEntity(entityType).filter((template) => template.status === 'active'),
    [entityType, isOpen]
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [previewCopyIndex, setPreviewCopyIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      window.document.body.classList.remove('print-template-mode');
      return;
    }

    window.document.body.classList.add('print-template-mode');
    const defaultTemplate = resolveDefaultTemplateForEntity(entityType) ?? activeTemplates[0] ?? null;
    setSelectedTemplateId(defaultTemplate?.id ?? '');
    setPreviewCopyIndex(0);

    return () => {
      window.document.body.classList.remove('print-template-mode');
    };
  }, [activeTemplates, entityType, isOpen]);

  const selectedTemplate = useMemo<PrintTemplateRecord | null>(
    () => activeTemplates.find((template) => template.id === selectedTemplateId) ?? activeTemplates[0] ?? null,
    [activeTemplates, selectedTemplateId]
  );
  const model = useMemo(
    () => (selectedTemplate && previewDocument ? renderTemplatePreview(selectedTemplate, previewDocument) : null),
    [previewDocument, selectedTemplate]
  );

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }
    setPreviewCopyIndex((currentIndex) => Math.min(currentIndex, selectedTemplate.copyConfig.labels.length - 1));
  }, [selectedTemplate]);

  useEffect(() => {
    if (!isOpen || activeTemplates.length > 0 || !fallbackPrint) {
      return;
    }

    fallbackPrint();
    onClose();
  }, [activeTemplates.length, fallbackPrint, isOpen, onClose]);

  if (!isOpen || !previewDocument || !model || !selectedTemplate) {
    return null;
  }

  return (
    <div className="print-template-overlay" role="dialog" aria-modal="true" aria-label="Print preview">
      <button type="button" className="print-template-overlay__backdrop" onClick={onClose} aria-label="Close print preview" />

      <div className="print-template-overlay__dialog">
        <div className="print-template-overlay__header">
          <div>
            <div className="print-template-overlay__eyebrow">Print Preview</div>
            <h2 className="print-template-overlay__title">{selectedTemplate.name}</h2>
          </div>

          <div className="print-template-overlay__actions">
            <button
              type="button"
              className="btn btn--outline btn--icon-left"
              onClick={() => window.print()}
            >
              <Printer size={15} />
              Print
            </button>
            <button type="button" className="print-template-overlay__close" onClick={onClose} aria-label="Close print preview">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="print-template-overlay__toolbar">
          <label className="print-template-overlay__field">
            <span>Layout</span>
            <select value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)}>
              {activeTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>

          <label className="print-template-overlay__field">
            <span>Preview copy</span>
            <select value={previewCopyIndex} onChange={(event) => setPreviewCopyIndex(Number(event.target.value))}>
              {selectedTemplate.copyConfig.labels.map((copy, index) => (
                <option key={copy.id} value={index}>
                  {copy.label}
                </option>
              ))}
            </select>
          </label>

          <div className="print-template-overlay__meta">
            <span className={cn('brand-badge', selectedTemplate.isDefault && 'brand-badge--draft')}>
              {selectedTemplate.isDefault ? 'Default layout' : selectedTemplate.status}
            </span>
          </div>
        </div>

        <div className="print-template-overlay__canvas">
          <PrintTemplateDocument model={model} previewCopyIndex={previewCopyIndex} />
        </div>

        <div className="print-template-overlay__print-only">
          <PrintTemplateDocument model={model} renderAllCopies />
        </div>
      </div>
    </div>
  );
}
