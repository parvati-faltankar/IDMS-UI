import { useEffect, useMemo, useState } from 'react';
import PrintTemplatePreviewOverlay from './PrintTemplatePreviewOverlay';
import { hasActivePrintTemplates, PRINT_TEMPLATE_EVENT } from './service';
import type { PrintEntityType } from './types';

export function useDocumentPrint(entityType: PrintEntityType) {
  const [document, setDocument] = useState<Record<string, unknown> | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [fallbackPrint, setFallbackPrint] = useState<(() => void) | undefined>();
  const [templateVersion, setTemplateVersion] = useState(0);
  const templatesAvailable = useMemo(
    () => hasActivePrintTemplates(entityType),
    [entityType, isOpen, templateVersion]
  );

  useEffect(() => {
    const syncTemplates = () => setTemplateVersion((currentVersion) => currentVersion + 1);
    window.addEventListener(PRINT_TEMPLATE_EVENT, syncTemplates);
    window.addEventListener('storage', syncTemplates);

    return () => {
      window.removeEventListener(PRINT_TEMPLATE_EVENT, syncTemplates);
      window.removeEventListener('storage', syncTemplates);
    };
  }, []);

  const openPrintPreview = (nextDocument: Record<string, unknown>, fallback?: () => void) => {
    const activeTemplatesAvailable = hasActivePrintTemplates(entityType);

    if (!activeTemplatesAvailable && fallback) {
      fallback();
      return;
    }

    setDocument(nextDocument);
    setFallbackPrint(() => fallback);
    setIsOpen(true);
  };

  const closePrintPreview = () => {
    setIsOpen(false);
    setDocument(null);
    setFallbackPrint(undefined);
  };

  return {
    templatesAvailable,
    openPrintPreview,
    closePrintPreview,
    printPreviewOverlay: (
      <PrintTemplatePreviewOverlay
        isOpen={isOpen}
        entityType={entityType}
        previewDocument={document}
        onClose={closePrintPreview}
        fallbackPrint={fallbackPrint}
      />
    ),
  };
}
