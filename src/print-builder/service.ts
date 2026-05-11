import { getPrintEntityRegistryItem, printEntityRegistry } from './entityRegistry';
import type {
  PrintBlockConfig,
  PrintCopyConfig,
  PrintCopyLabel,
  PrintEntityType,
  PrintPageSettings,
  PrintPreviewBlockView,
  PrintPreviewModel,
  PrintPreviewPage,
  PrintSectionId,
  PrintTemplateRecord,
  PrintTemplateStatus,
} from './types';

const STORAGE_KEY = 'print-builder:templates:v1';
export const PRINT_TEMPLATE_EVENT = 'print-builder:templates:updated';

function now() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function safeString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function safeNumber(value: unknown, fallback: number) {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getDefaultPageSettings(): PrintPageSettings {
  return {
    size: 'A4',
    orientation: 'portrait',
    margins: { top: 16, right: 16, bottom: 16, left: 16 },
  };
}

function getDefaultCopyConfig(): PrintCopyConfig {
  return {
    mode: 'single',
    labels: [{ id: 'copy-1', label: 'Original' }],
  };
}

function normalizeCopyLabels(mode: PrintCopyConfig['mode'], labels: PrintCopyLabel[]): PrintCopyLabel[] {
  const fallbackByMode: Record<PrintCopyConfig['mode'], string[]> = {
    single: ['Original'],
    duplicate: ['Original for Customer', 'Duplicate for Accounts'],
    triplicate: ['Original for Customer', 'Duplicate for Accounts', 'Triplicate for Transporter'],
    custom: labels.map((item) => item.label).filter((label) => label.trim().length > 0),
  };

  const normalizedLabels = (mode === 'custom' ? fallbackByMode.custom : fallbackByMode[mode]).map((label, index) => ({
    id: labels[index]?.id ?? `copy-${index + 1}`,
    label,
  }));

  return normalizedLabels.length > 0 ? normalizedLabels : [{ id: 'copy-1', label: 'Original' }];
}

function createStarterBlocks(entityType: PrintEntityType): Record<string, PrintBlockConfig> {
  const registryItem = getPrintEntityRegistryItem(entityType);
  const firstPartyField = registryItem?.fieldGroups.find((group) => group.id === 'party')?.fields[0];
  const firstTable = registryItem?.tableCollections[0];
  const firstCommercialField = registryItem?.fieldGroups.find((group) => group.id === 'commercial')?.fields[0];

  const titleBlockId = createId('print-block');
  const copyBlockId = createId('print-block');
  const numberBlockId = createId('print-block');
  const partyBlockId = createId('print-block');
  const dividerBlockId = createId('print-block');
  const tableBlockId = createId('print-block');
  const totalBlockId = createId('print-block');
  const signatureBlockId = createId('print-block');

  return {
    [titleBlockId]: {
      id: titleBlockId,
      type: 'text',
      section: 'header',
      title: 'Document title',
      content: registryItem?.label ?? 'Document',
      style: { fontSize: 24, fontWeight: 700, textAlign: 'left', widthMode: 'full', margin: 4 },
    },
    [copyBlockId]: {
      id: copyBlockId,
      type: 'copy-label',
      section: 'header',
      title: 'Copy label',
      style: { fontSize: 12, fontWeight: 600, textAlign: 'right', widthMode: 'half', margin: 4 },
    },
    [numberBlockId]: {
      id: numberBlockId,
      type: 'field',
      section: 'body',
      title: 'Document number',
      token: 'number',
      prefix: 'Document No: ',
      style: { fontSize: 13, fontWeight: 600, widthMode: 'half', margin: 4 },
    },
    [partyBlockId]: {
      id: partyBlockId,
      type: 'field',
      section: 'body',
      title: 'Primary party',
      token: firstPartyField?.token ?? 'customerName',
      prefix: `${firstPartyField?.label ?? 'Party'}: `,
      style: { fontSize: 13, widthMode: 'half', margin: 4 },
    },
    [dividerBlockId]: {
      id: dividerBlockId,
      type: 'divider',
      section: 'body',
      title: 'Section divider',
      thickness: 1,
      style: { widthMode: 'full', margin: 8, borderColor: '#d5deeb' },
    },
    [tableBlockId]: {
      id: tableBlockId,
      type: 'table',
      section: 'body',
      title: firstTable?.label ?? 'Line items',
      collectionKey: firstTable?.key ?? 'lines',
      columns: firstTable?.columns.slice(0, 6).map((column) => column.token) ?? [],
      showTotals: true,
      style: { widthMode: 'full', margin: 6 },
    },
    [totalBlockId]: {
      id: totalBlockId,
      type: 'field',
      section: 'footer',
      title: 'Primary total',
      token: firstCommercialField?.token ?? 'totalAmount',
      prefix: `${firstCommercialField?.label ?? 'Total'}: `,
      style: { fontSize: 14, fontWeight: 700, textAlign: 'right', widthMode: 'full', margin: 4 },
    },
    [signatureBlockId]: {
      id: signatureBlockId,
      type: 'signature',
      section: 'footer',
      title: 'Authorized signature',
      label: 'Authorized Signatory',
      style: { textAlign: 'right', widthMode: 'half', margin: 8 },
    },
  };
}

export function createPrintTemplateDraft(entityType: PrintEntityType): PrintTemplateRecord {
  const registryItem = getPrintEntityRegistryItem(entityType);
  const blocks = createStarterBlocks(entityType);
  const blockList = Object.values(blocks);

  return {
    id: createId('print-template'),
    entityType,
    name: `${registryItem?.label ?? 'Document'} Standard Print`,
    description: `Default structured print layout for ${registryItem?.label ?? entityType}.`,
    status: 'draft',
    isDefault: false,
    page: getDefaultPageSettings(),
    copyConfig: getDefaultCopyConfig(),
    sections: {
      header: { id: 'header', label: 'Header', blockIds: blockList.filter((block) => block.section === 'header').map((block) => block.id) },
      body: { id: 'body', label: 'Body', blockIds: blockList.filter((block) => block.section === 'body').map((block) => block.id) },
      footer: { id: 'footer', label: 'Footer', blockIds: blockList.filter((block) => block.section === 'footer').map((block) => block.id) },
    },
    blocks,
    createdBy: 'Alex Kumar',
    updatedBy: 'Alex Kumar',
    createdAt: now(),
    updatedAt: now(),
  };
}

function sanitizeBlock(block: PrintBlockConfig): PrintBlockConfig {
  return {
    ...block,
    title: safeString(block.title, 'Block'),
    style: {
      ...block.style,
      fontSize: safeNumber(block.style.fontSize, 13),
      fontWeight: [400, 500, 600, 700].includes(block.style.fontWeight ?? 500) ? block.style.fontWeight : 500,
      padding: safeNumber(block.style.padding, 0),
      margin: safeNumber(block.style.margin, 0),
      borderWidth: safeNumber(block.style.borderWidth, 0),
    },
  } as PrintBlockConfig;
}

function sanitizeTemplate(template: Partial<PrintTemplateRecord>): PrintTemplateRecord | null {
  if (!template.entityType || !getPrintEntityRegistryItem(template.entityType)) {
    return null;
  }

  const starter = createPrintTemplateDraft(template.entityType);
  const blocks = Object.fromEntries(
    Object.entries(template.blocks ?? starter.blocks).map(([id, block]) => [id, sanitizeBlock(block as PrintBlockConfig)])
  );
  const sections = (['header', 'body', 'footer'] as PrintSectionId[]).reduce<Record<PrintSectionId, PrintTemplateRecord['sections'][PrintSectionId]>>(
    (accumulator, sectionId) => {
      const sourceSection = template.sections?.[sectionId] ?? starter.sections[sectionId];
      accumulator[sectionId] = {
        id: sectionId,
        label: sourceSection?.label ?? starter.sections[sectionId].label,
        blockIds: (sourceSection?.blockIds ?? starter.sections[sectionId].blockIds).filter((blockId) => Boolean(blocks[blockId])),
      };
      return accumulator;
    },
    {} as Record<PrintSectionId, PrintTemplateRecord['sections'][PrintSectionId]>
  );

  const copyMode = template.copyConfig?.mode ?? starter.copyConfig.mode;
  const labels = normalizeCopyLabels(copyMode, template.copyConfig?.labels ?? starter.copyConfig.labels);

  return {
    ...starter,
    ...template,
    id: safeString(template.id, starter.id),
    entityType: template.entityType,
    name: safeString(template.name, starter.name),
    description: safeString(template.description, starter.description),
    status: (template.status ?? starter.status) as PrintTemplateStatus,
    isDefault: Boolean(template.isDefault),
    logoDataUrl: safeString(template.logoDataUrl, ''),
    logoName: safeString(template.logoName, ''),
    page: {
      ...starter.page,
      ...template.page,
      margins: {
        ...starter.page.margins,
        ...template.page?.margins,
      },
    },
    copyConfig: {
      mode: copyMode,
      labels,
    },
    sections,
    blocks,
    createdBy: safeString(template.createdBy, starter.createdBy),
    updatedBy: safeString(template.updatedBy, starter.updatedBy),
    createdAt: safeString(template.createdAt, starter.createdAt),
    updatedAt: safeString(template.updatedAt, starter.updatedAt),
  };
}

function sanitizeTemplates(value: unknown): PrintTemplateRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalizedTemplates = value
    .map((template) => sanitizeTemplate(template as Partial<PrintTemplateRecord>))
    .filter((template): template is PrintTemplateRecord => Boolean(template));

  const defaultsByEntity = new Map<PrintEntityType, string>();
  return normalizedTemplates.map((template) => {
    if (!template.isDefault || template.status === 'archived') {
      return template;
    }

    const existingDefault = defaultsByEntity.get(template.entityType);
    if (existingDefault) {
      return { ...template, isDefault: false };
    }

    defaultsByEntity.set(template.entityType, template.id);
    return template;
  });
}

function readTemplates() {
  if (typeof window === 'undefined') {
    return [] as PrintTemplateRecord[];
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    return sanitizeTemplates(rawValue ? JSON.parse(rawValue) : []);
  } catch {
    return [] as PrintTemplateRecord[];
  }
}

function writeTemplates(templates: PrintTemplateRecord[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  window.dispatchEvent(new CustomEvent(PRINT_TEMPLATE_EVENT));
}

function prepareTemplateForSave(template: PrintTemplateRecord): PrintTemplateRecord {
  const sanitized = sanitizeTemplate(template);
  if (!sanitized) {
    throw new Error('Invalid template');
  }

  return {
    ...sanitized,
    updatedAt: now(),
  };
}

function sortTemplates(templates: PrintTemplateRecord[]) {
  return [...templates].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function formatPreviewValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return String(value);
}

function buildTableView(document: Record<string, unknown>, block: Extract<PrintBlockConfig, { type: 'table' }>) {
  const collection = document[block.collectionKey];
  if (!Array.isArray(collection)) {
    return undefined;
  }

  const rows = collection.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object');
  const rowViews = rows.map((row) =>
    Object.fromEntries(block.columns.map((columnKey) => [columnKey, formatPreviewValue(row[columnKey])]))
  );

  const totals: Array<{ label: string; value: string }> = [];
  if (block.showTotals) {
    ['totalAmount', 'taxableAmount', 'taxAmount', 'discountAmount', 'netAmount'].forEach((key) => {
      if (document[key] !== undefined) {
        totals.push({ label: key.replace(/([a-z0-9])([A-Z])/g, '$1 $2'), value: formatPreviewValue(document[key]) });
      }
    });
  }

  return {
    key: block.collectionKey,
    label: block.title,
    columns: block.columns.map((columnKey) => ({ key: columnKey, label: columnKey.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/\b\w/g, (char) => char.toUpperCase()) })),
    rows: rowViews,
    totals: totals.length > 0 ? totals : undefined,
  };
}

function buildBlockView(
  block: PrintBlockConfig,
  document: Record<string, unknown>,
  copyLabel: string,
  template: PrintTemplateRecord
): PrintPreviewBlockView {
  if (block.type === 'copy-label') {
    return {
      id: block.id,
      type: block.type,
      title: block.title,
      style: block.style,
      value: copyLabel,
    };
  }

  if (block.type === 'field') {
    const rawValue = document[block.token];
    return {
      id: block.id,
      type: block.type,
      title: block.title,
      style: block.style,
      value: `${block.prefix ?? ''}${formatPreviewValue(rawValue)}${block.suffix ?? ''}`,
    };
  }

  if (block.type === 'text') {
    return {
      id: block.id,
      type: block.type,
      title: block.title,
      style: block.style,
      value: block.content,
    };
  }

  if (block.type === 'image') {
    return {
      id: block.id,
      type: block.type,
      title: block.title,
      style: block.style,
      imageSrc: block.assetDataUrl || template.logoDataUrl,
      value: block.altText,
    };
  }

  if (block.type === 'divider') {
    return {
      id: block.id,
      type: block.type,
      title: block.title,
      style: block.style,
    };
  }

  if (block.type === 'signature') {
    return {
      id: block.id,
      type: block.type,
      title: block.title,
      style: block.style,
      signatureLabel: block.label,
    };
  }

  return {
    id: block.id,
    type: block.type,
    title: block.title,
    style: block.style,
    table: buildTableView(document, block),
  };
}

export function loadPrintTemplates() {
  return sortTemplates(readTemplates());
}

export function loadTemplatesForEntity(entityType: PrintEntityType, includeArchived = false) {
  return loadPrintTemplates().filter((template) => template.entityType === entityType && (includeArchived || template.status !== 'archived'));
}

export function hasActivePrintTemplates(entityType: PrintEntityType) {
  return loadTemplatesForEntity(entityType).some((template) => template.status === 'active');
}

export function savePrintTemplate(template: PrintTemplateRecord) {
  const nextTemplate = prepareTemplateForSave(template);
  const currentTemplates = loadPrintTemplates();
  const existingIndex = currentTemplates.findIndex((item) => item.id === nextTemplate.id);
  const nextTemplates = [...currentTemplates];

  if (nextTemplate.isDefault) {
    for (let index = 0; index < nextTemplates.length; index += 1) {
      if (nextTemplates[index].entityType === nextTemplate.entityType) {
        nextTemplates[index] = { ...nextTemplates[index], isDefault: false };
      }
    }
  }

  if (existingIndex >= 0) {
    nextTemplates[existingIndex] = nextTemplate;
  } else {
    nextTemplates.unshift(nextTemplate);
  }

  writeTemplates(nextTemplates);
  return nextTemplate;
}

export function duplicatePrintTemplate(templateId: string) {
  const template = loadPrintTemplates().find((item) => item.id === templateId);
  if (!template) {
    return null;
  }

  const duplicatedTemplate: PrintTemplateRecord = {
    ...clone(template),
    id: createId('print-template'),
    name: `${template.name} Copy`,
    isDefault: false,
    status: template.status === 'archived' ? 'draft' : template.status,
    createdAt: now(),
    updatedAt: now(),
    createdBy: 'Alex Kumar',
    updatedBy: 'Alex Kumar',
  };

  return savePrintTemplate(duplicatedTemplate);
}

export function archivePrintTemplate(templateId: string) {
  const templates = loadPrintTemplates();
  const nextTemplates = templates.map((template) =>
    template.id === templateId ? { ...template, status: 'archived' as const, isDefault: false, updatedAt: now() } : template
  );
  writeTemplates(nextTemplates);
}

export function setDefaultPrintTemplate(templateId: string) {
  const templates = loadPrintTemplates();
  const targetTemplate = templates.find((template) => template.id === templateId);
  if (!targetTemplate) {
    return null;
  }

  const nextTemplates = templates.map((template) => {
    if (template.entityType !== targetTemplate.entityType) {
      return template;
    }

    if (template.id === templateId) {
      return {
        ...template,
        isDefault: true,
        status: template.status === 'draft' ? 'active' : template.status,
        updatedAt: now(),
      };
    }

    return { ...template, isDefault: false };
  });

  writeTemplates(nextTemplates);
  return nextTemplates.find((template) => template.id === templateId) ?? null;
}

export function resolveDefaultTemplateForEntity(entityType: PrintEntityType) {
  const templates = loadTemplatesForEntity(entityType).filter((template) => template.status === 'active');
  return templates.find((template) => template.isDefault) ?? templates[0] ?? null;
}

export function renderTemplatePreview(
  template: PrintTemplateRecord,
  document: Record<string, unknown>
): PrintPreviewModel {
  const registryItem = getPrintEntityRegistryItem(template.entityType);
  const pages: PrintPreviewPage[] = template.copyConfig.labels.map((copyLabel) => ({
    copyLabel: copyLabel.label,
    header: template.sections.header.blockIds.map((blockId) => buildBlockView(template.blocks[blockId], document, copyLabel.label, template)),
    body: template.sections.body.blockIds.map((blockId) => buildBlockView(template.blocks[blockId], document, copyLabel.label, template)),
    footer: template.sections.footer.blockIds.map((blockId) => buildBlockView(template.blocks[blockId], document, copyLabel.label, template)),
  }));

  return {
    entityType: template.entityType,
    entityLabel: registryItem?.label ?? template.entityType,
    templateId: template.id,
    templateName: template.name,
    documentNumber: safeString(document.number, 'Document'),
    pages,
  };
}

export function loadSampleDocumentForEntity(entityType: PrintEntityType, documentId?: string | null) {
  const registryItem = getPrintEntityRegistryItem(entityType);
  if (!registryItem) {
    return null;
  }

  if (documentId) {
    const matchedDocument = registryItem.sampleDocuments.find((document) => safeString((document as Record<string, unknown>).id) === documentId);
    if (matchedDocument) {
      return matchedDocument as Record<string, unknown>;
    }
  }

  return (registryItem.sampleDocuments[0] ?? null) as Record<string, unknown> | null;
}
