import { beforeEach, describe, expect, it } from 'vitest';
import {
  archivePrintTemplate,
  createPrintTemplateDraft,
  duplicatePrintTemplate,
  loadPrintTemplates,
  renderTemplatePreview,
  resolveDefaultTemplateForEntity,
  savePrintTemplate,
  setDefaultPrintTemplate,
} from './service';

describe('print builder service', () => {
  beforeEach(() => {
    window.localStorage.removeItem('print-builder:templates:v1');
  });

  it('creates and persists a draft template', () => {
    const draft = createPrintTemplateDraft('sale-order');
    const saved = savePrintTemplate({
      ...draft,
      name: 'My Sale Order Print',
    });

    const templates = loadPrintTemplates();

    expect(saved.name).toBe('My Sale Order Print');
    expect(templates).toHaveLength(1);
    expect(templates[0].entityType).toBe('sale-order');
    expect(templates[0].status).toBe('draft');
  });

  it('enforces a single default template per entity type', () => {
    const first = savePrintTemplate({
      ...createPrintTemplateDraft('sale-order'),
      name: 'SO Layout One',
      status: 'active',
      isDefault: true,
    });
    const second = savePrintTemplate({
      ...createPrintTemplateDraft('sale-order'),
      name: 'SO Layout Two',
      status: 'active',
      isDefault: false,
    });

    const updatedSecond = setDefaultPrintTemplate(second.id);
    const templates = loadPrintTemplates().filter((template) => template.entityType === 'sale-order');

    expect(updatedSecond?.isDefault).toBe(true);
    expect(templates.filter((template) => template.isDefault)).toHaveLength(1);
    expect(resolveDefaultTemplateForEntity('sale-order')?.id).toBe(second.id);
    expect(templates.find((template) => template.id === first.id)?.isDefault).toBe(false);
  });

  it('duplicates and archives templates safely', () => {
    const original = savePrintTemplate({
      ...createPrintTemplateDraft('purchase-order'),
      name: 'PO Master Print',
      status: 'active',
      isDefault: true,
    });

    const duplicated = duplicatePrintTemplate(original.id);
    archivePrintTemplate(original.id);

    const templates = loadPrintTemplates().filter((template) => template.entityType === 'purchase-order');

    expect(duplicated).not.toBeNull();
    expect(duplicated?.name).toContain('Copy');
    expect(duplicated?.isDefault).toBe(false);
    expect(templates.find((template) => template.id === original.id)?.status).toBe('archived');
  });

  it('renders preview copies using the configured copy labels', () => {
    const template = savePrintTemplate({
      ...createPrintTemplateDraft('sale-order'),
      name: 'SO Triplicate',
      status: 'active',
      copyConfig: {
        mode: 'triplicate',
        labels: [
          { id: 'copy-1', label: 'Original for Customer' },
          { id: 'copy-2', label: 'Duplicate for Accounts' },
          { id: 'copy-3', label: 'Triplicate for Transporter' },
        ],
      },
    });

    const preview = renderTemplatePreview(template, {
      number: 'SO-TEST-0001',
      customerName: 'Galaxy Motors',
      totalAmount: '25000.00',
      lines: [
        {
          productCode: 'SP-1001',
          productName: 'Clutch Plate',
          orderQuantity: '2',
          lineAmount: '25000.00',
        },
      ],
    });

    expect(preview.documentNumber).toBe('SO-TEST-0001');
    expect(preview.pages).toHaveLength(3);
    expect(preview.pages[0].copyLabel).toBe('Original for Customer');
    expect(preview.pages[2].copyLabel).toBe('Triplicate for Transporter');
  });
});
