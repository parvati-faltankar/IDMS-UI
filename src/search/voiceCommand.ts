import { extendedPurchaseRequisitionDocuments } from '../purchaseRequisitionCatalogueData';
import { extendedPurchaseOrderDocuments } from '../purchase order/purchaseOrderData';
import { extendedSaleOrderDocuments } from '../sale order/saleOrderData';
import { extendedSaleAllocationDocuments } from '../sale allocation/saleAllocationData';
import { searchGlobalRecords, type GlobalSearchEntity, type GlobalSearchResult } from './globalSearch';

type VoiceAction = 'open' | 'search' | 'create' | 'navigate';
type DashboardModuleTab = 'overview' | 'sales' | 'procurement' | 'inventory' | 'services' | 'crm';

interface EntityVoiceConfig {
  entity?: GlobalSearchEntity;
  label: string;
  listRoute: string;
  createRoute?: string;
  synonyms: string[];
}

interface ModuleVoiceConfig {
  label: string;
  route: string;
  tab?: DashboardModuleTab;
  synonyms: string[];
}

interface SourceDocumentIntent {
  entity: 'sale-order' | 'sale-allocation' | 'purchase-order' | 'purchase-requisition';
  label: string;
  reference: string;
}

export interface VoiceCommandIntent {
  action: VoiceAction;
  entity?: GlobalSearchEntity;
  entityLabel?: string;
  listRoute?: string;
  createRoute?: string;
  moduleLabel?: string;
  moduleRoute?: string;
  sourceDocument?: SourceDocumentIntent;
  subject: string;
  wantsLatest: boolean;
  rawText: string;
}

export type VoiceCommandResolution =
  | {
      kind: 'navigate';
      href: string;
      message: string;
      intent: VoiceCommandIntent;
      result?: GlobalSearchResult;
    }
  | {
      kind: 'suggestions';
      message: string;
      query: string;
      intent: VoiceCommandIntent;
      suggestions: GlobalSearchResult[];
    }
  | {
      kind: 'no-match';
      message: string;
      query: string;
      intent: VoiceCommandIntent;
    };

const entityConfigs: EntityVoiceConfig[] = [
  {
    entity: 'sale-allocation-requisition',
    label: 'Sale Allocation Requisition',
    listRoute: '#/sale-allocation-requisition',
    createRoute: '#/sale-allocation-requisition/new',
    synonyms: ['sale allocation requisition', 'allocation requisition', 'sales allocation request'],
  },
  {
    entity: 'purchase-requisition',
    label: 'Purchase Requisition',
    listRoute: '#/purchase-requisition',
    createRoute: '#/purchase-requisition/new',
    synonyms: ['purchase requisition', 'purchase request', 'pr'],
  },
  {
    entity: 'purchase-receipt',
    label: 'Purchase Receipt',
    listRoute: '#/purchase-receipt',
    createRoute: '#/purchase-receipt/new',
    synonyms: ['purchase receipt', 'receipt', 'goods receipt', 'grn'],
  },
  {
    entity: 'purchase-invoice',
    label: 'Purchase Invoice',
    listRoute: '#/purchase-invoice',
    createRoute: '#/purchase-invoice/new',
    synonyms: ['purchase invoice', 'vendor invoice', 'supplier invoice'],
  },
  {
    entity: 'purchase-order',
    label: 'Purchase Order',
    listRoute: '#/purchase-order',
    createRoute: '#/purchase-order/new',
    synonyms: ['purchase order', 'po'],
  },
  {
    entity: 'sale-invoice',
    label: 'Sale Invoice',
    listRoute: '#/sale-invoice',
    createRoute: '#/sale-invoice/new',
    synonyms: ['sale invoice', 'sales invoice', 'customer invoice', 'invoice'],
  },
  {
    entity: 'sale-order',
    label: 'Sale Order',
    listRoute: '#/sale-order',
    createRoute: '#/sale-order/new',
    synonyms: ['sale order', 'sales order', 'so', 'customer order'],
  },
  {
    entity: 'sale-allocation',
    label: 'Sale Allocation',
    listRoute: '#/sale-allocation',
    createRoute: '#/sale-allocation/new',
    synonyms: ['sale allocation', 'allocation'],
  },
  {
    entity: 'delivery',
    label: 'Delivery',
    listRoute: '#/delivery',
    createRoute: '#/delivery/new',
    synonyms: ['delivery', 'dispatch', 'shipment'],
  },
];

const moduleConfigs: ModuleVoiceConfig[] = [
  {
    label: 'Dashboard',
    route: '#/dashboard',
    tab: 'overview',
    synonyms: ['dashboard', 'home', 'homepage', 'overview', 'workspace'],
  },
  {
    label: 'Sales',
    route: '#/dashboard?tab=sales',
    tab: 'sales',
    synonyms: ['sales', 'sale module', 'sales module'],
  },
  {
    label: 'Procurement',
    route: '#/dashboard?tab=procurement',
    tab: 'procurement',
    synonyms: ['procurement', 'purchase module', 'purchase', 'purchasing'],
  },
  {
    label: 'Inventory',
    route: '#/dashboard?tab=inventory',
    tab: 'inventory',
    synonyms: ['inventory', 'stock', 'warehouse', 'stock transfer', 'stock adjustment'],
  },
  {
    label: 'Services',
    route: '#/dashboard?tab=services',
    tab: 'services',
    synonyms: ['services', 'service', 'service module', 'job card', 'appointment'],
  },
  {
    label: 'CRM',
    route: '#/dashboard?tab=crm',
    tab: 'crm',
    synonyms: ['crm', 'leads', 'lead', 'customers', 'customer module'],
  },
  {
    label: 'Form Layout',
    route: '#/form-layout-settings',
    synonyms: ['form layout', 'form layout screen', 'layout settings', 'layout screen', 'form configuration'],
  },
];

const actionPatterns: Array<[VoiceAction, RegExp]> = [
  ['create', /\b(create|new|make|raise|start|open new)\b/],
  ['navigate', /\b(go to|navigate to|take me to|open module|module)\b/],
  ['open', /\b(open|show|view|find|pull up|get)\b/],
  ['search', /\b(search|look for|lookup|discover)\b/],
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compact(value: string) {
  return normalize(value).replace(/[^a-z0-9]/g, '');
}

function getAction(command: string): VoiceAction {
  return actionPatterns.find(([, pattern]) => pattern.test(command))?.[0] ?? 'search';
}

function synonymPattern(synonym: string) {
  return new RegExp(`\\b${synonym.replace(/\s+/g, '\\s+')}\\b`);
}

function getEntityConfig(command: string): EntityVoiceConfig | undefined {
  return entityConfigs.find((config) => config.synonyms.some((synonym) => synonymPattern(synonym).test(command)));
}

function getModuleConfig(command: string): ModuleVoiceConfig | undefined {
  return moduleConfigs.find((config) => config.synonyms.some((synonym) => synonymPattern(synonym).test(command)));
}

function getSourceDocument(command: string): SourceDocumentIntent | undefined {
  const sourcePatterns: Array<[SourceDocumentIntent['entity'], string, RegExp]> = [
    ['sale-order', 'Sale Order', /\b(?:of|from|for)?\s*(?:sale|sales)\s+order(?:\s+(?:number|no|id))?\s+([a-z]{1,4}[-\s]?\d[\da-z-\s]*)/],
    ['sale-allocation', 'Sale Allocation', /\b(?:of|from|for)?\s*(?:sale\s+)?allocation(?:\s+(?:number|no|id))?\s+([a-z]{1,4}[-\s]?\d[\da-z-\s]*)/],
    ['purchase-order', 'Purchase Order', /\b(?:of|from|for)?\s*purchase\s+order(?:\s+(?:number|no|id))?\s+([a-z]{1,4}[-\s]?\d[\da-z-\s]*)/],
    ['purchase-requisition', 'Purchase Requisition', /\b(?:of|from|for)?\s*purchase\s+requisition(?:\s+(?:number|no|id))?\s+([a-z]{1,4}[-\s]?\d[\da-z-\s]*)/],
  ];

  const match = sourcePatterns
    .map(([entity, label, pattern]) => {
      const result = command.match(pattern);
      return result?.[1] ? { entity, label, reference: result[1].trim() } : null;
    })
    .find((result): result is SourceDocumentIntent => Boolean(result));

  return match;
}

function cleanSubject(command: string, entityConfig?: EntityVoiceConfig, moduleConfig?: ModuleVoiceConfig): string {
  let subject = ` ${command} `;

  [
    'open new',
    'take me to',
    'navigate to',
    'go to',
    'open module',
    'create',
    'new',
    'make',
    'raise',
    'start',
    'open',
    'show',
    'view',
    'find',
    'search',
    'look for',
    'lookup',
    'latest',
    'recent',
    'last',
    'record',
    'document',
    'transaction',
    'module',
    'page',
    'screen',
  ].forEach((word) => {
    subject = subject.replace(new RegExp(`\\b${word}\\b`, 'g'), ' ');
  });

  entityConfig?.synonyms.forEach((synonym) => {
    subject = subject.replace(new RegExp(`\\b${synonym.replace(/\s+/g, '\\s+')}\\b`, 'g'), ' ');
  });

  moduleConfig?.synonyms.forEach((synonym) => {
    subject = subject.replace(new RegExp(`\\b${synonym.replace(/\s+/g, '\\s+')}\\b`, 'g'), ' ');
  });

  subject = subject
    .replace(/\b(of|for|by|from|related to|with|number|no|id)\b/g, ' ')
    .replace(/\b(supplier|customer|vendor|party|name)\b/g, ' ');

  return subject.replace(/\s+/g, ' ').trim();
}

function withQuery(route: string, query: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const queryString = params.toString();
  return queryString ? `${route}?${queryString}` : route;
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

const supplierNames = uniqueValues([
  ...extendedPurchaseRequisitionDocuments.map((document) => document.supplierName),
  ...extendedPurchaseOrderDocuments.map((document) => document.supplierName),
]);

const customerNames = uniqueValues([
  ...extendedSaleOrderDocuments.map((document) => document.customerName),
  ...extendedSaleAllocationDocuments.map((document) => document.customerName),
]);

function findBestNameMatch(subject: string, values: string[]) {
  const normalizedSubject = normalize(subject);
  const compactSubject = compact(subject);

  if (!normalizedSubject) {
    return undefined;
  }

  return (
    values.find((value) => normalize(value) === normalizedSubject || compact(value) === compactSubject) ??
    values.find((value) => normalize(value).includes(normalizedSubject) || compact(value).includes(compactSubject)) ??
    values.find((value) => normalizedSubject.includes(normalize(value)))
  );
}

function findSaleOrderByReference(reference: string) {
  const compactReference = compact(reference);
  return extendedSaleOrderDocuments.find(
    (document) => compact(document.number) === compactReference || compact(document.id) === compactReference
  );
}

function findPurchaseOrderByReference(reference: string) {
  const compactReference = compact(reference);
  return extendedPurchaseOrderDocuments.find(
    (document) => compact(document.number) === compactReference || compact(document.id) === compactReference
  );
}

export function parseVoiceCommand(rawText: string): VoiceCommandIntent {
  const command = normalize(rawText);
  const entityConfig = getEntityConfig(command);
  const moduleConfig = getModuleConfig(command);
  const sourceDocument = getSourceDocument(command);

  return {
    action: getAction(command),
    entity: entityConfig?.entity,
    entityLabel: entityConfig?.label,
    listRoute: entityConfig?.listRoute,
    createRoute: entityConfig?.createRoute,
    moduleLabel: moduleConfig?.label,
    moduleRoute: moduleConfig?.route,
    sourceDocument,
    subject: cleanSubject(command, entityConfig, moduleConfig),
    wantsLatest: /\b(latest|recent|last)\b/.test(command),
    rawText,
  };
}

function searchForIntent(intent: VoiceCommandIntent): GlobalSearchResult[] {
  const query = intent.subject || intent.entityLabel || intent.moduleLabel || intent.rawText;
  const groupedResults = searchGlobalRecords(query, 24);
  const results = groupedResults.flatMap((group) => group.results);
  const entityFilteredResults = intent.entity
    ? results.filter((result) => result.entity === intent.entity)
    : results;

  return entityFilteredResults.length > 0 ? entityFilteredResults : results;
}

function resolveLinkedCreateIntent(intent: VoiceCommandIntent): VoiceCommandResolution | null {
  if (intent.action !== 'create' || !intent.sourceDocument) {
    return null;
  }

  if (intent.entity === 'sale-invoice' && intent.sourceDocument.entity === 'sale-order') {
    const saleOrder = findSaleOrderByReference(intent.sourceDocument.reference);

    if (saleOrder) {
      return {
        kind: 'navigate',
        href: withQuery('#/sale-invoice/new', { source: 'sale-order', sourceId: saleOrder.id }),
        message: `Creating sale invoice from ${saleOrder.number}.`,
        intent,
      };
    }

    const matches = searchGlobalRecords(intent.sourceDocument.reference, 12)
      .flatMap((group) => group.results)
      .filter((result) => result.entity === 'sale-order');

    if (matches.length > 0) {
      return {
        kind: 'suggestions',
        query: intent.sourceDocument.reference,
        intent,
        suggestions: matches.slice(0, 6),
        message: `I could not find an exact sale order. Choose the correct source order.`,
      };
    }

    return {
      kind: 'no-match',
      query: intent.sourceDocument.reference,
      intent,
      message: `I could not find sale order ${intent.sourceDocument.reference}.`,
    };
  }

  if (intent.entity === 'purchase-invoice' && intent.sourceDocument.entity === 'purchase-order') {
    const purchaseOrder = findPurchaseOrderByReference(intent.sourceDocument.reference);

    if (purchaseOrder) {
      return {
        kind: 'no-match',
        query: intent.sourceDocument.reference,
        intent,
        message:
          'Purchase Invoice creation from Purchase Order is not wired in this screen yet. Please use the existing source document search in Purchase Invoice.',
      };
    }
  }

  return null;
}

function resolveCreateIntent(intent: VoiceCommandIntent): VoiceCommandResolution {
  if (!intent.createRoute) {
    return {
      kind: 'no-match',
      query: intent.subject || intent.rawText,
      intent,
      message: 'I found the command, but this create flow is not available yet.',
    };
  }

  if (intent.entity === 'purchase-order') {
    const supplier = findBestNameMatch(intent.subject, supplierNames);

    return {
      kind: 'navigate',
      href: withQuery(intent.createRoute, {
        supplier: supplier ?? intent.subject,
        supplierQuery: supplier ? undefined : intent.subject,
      }),
      message: supplier
        ? `Creating Purchase Order for ${supplier}.`
        : intent.subject
          ? `Opening Purchase Order create screen. I will keep "${intent.subject}" in the supplier search context.`
          : `Opening new ${intent.entityLabel}.`,
      intent,
    };
  }

  if (intent.entity === 'sale-order') {
    const customer = findBestNameMatch(intent.subject, customerNames);

    return {
      kind: 'navigate',
      href: withQuery(intent.createRoute, {
        customer: customer ?? intent.subject,
        customerQuery: customer ? undefined : intent.subject,
      }),
      message: customer
        ? `Creating Sale Order for ${customer}.`
        : intent.subject
          ? `Opening Sale Order create screen. I will keep "${intent.subject}" in the customer search context.`
          : `Opening new ${intent.entityLabel}.`,
      intent,
    };
  }

  return {
    kind: 'navigate',
    href: intent.createRoute,
    message: `Opening new ${intent.entityLabel}.`,
    intent,
  };
}

export function resolveVoiceCommand(rawText: string): VoiceCommandResolution {
  const intent = parseVoiceCommand(rawText);

  const linkedCreateResolution = resolveLinkedCreateIntent(intent);
  if (linkedCreateResolution) {
    return linkedCreateResolution;
  }

  if ((intent.action === 'navigate' || (intent.action === 'open' && !intent.entity)) && intent.moduleRoute) {
    return {
      kind: 'navigate',
      href: intent.moduleRoute,
      message: `Opening ${intent.moduleLabel}.`,
      intent,
    };
  }

  if (intent.action === 'create') {
    return resolveCreateIntent(intent);
  }

  if ((intent.action === 'navigate' || intent.action === 'open') && intent.listRoute && !intent.subject && !intent.wantsLatest) {
    return {
      kind: 'navigate',
      href: intent.listRoute,
      message: `Opening ${intent.entityLabel}.`,
      intent,
    };
  }

  const matches = searchForIntent(intent);

  if (matches.length === 0) {
    if (intent.listRoute && (intent.action === 'open' || intent.action === 'navigate')) {
      return {
        kind: 'navigate',
        href: intent.listRoute,
        message: `I could not find a specific record, so I opened ${intent.entityLabel}.`,
        intent,
      };
    }

    return {
      kind: 'no-match',
      query: intent.subject || intent.rawText,
      intent,
      message: 'I could not find a matching document. Try saying a document number, customer, supplier, or status.',
    };
  }

  if (intent.wantsLatest || matches.length === 1) {
    const result = matches[0];

    return {
      kind: 'navigate',
      href: result.href,
      message: `Opening ${result.title}.`,
      intent,
      result,
    };
  }

  return {
    kind: 'suggestions',
    query: intent.subject || intent.rawText,
    intent,
    suggestions: matches.slice(0, 6),
    message: `I found ${matches.length} possible matches. Choose the right one.`,
  };
}

export const supportedVoiceCommandExamples = [
  'Go to dashboard',
  'Open sale order',
  'Hi, open sale order SO-2026-00011',
  'Go to sale invoice screen',
  'Open form layout screen',
  'Create sale order for Galaxy Motors',
  'Create purchase order for Techsupply Corp',
  'Create sale invoice from sale order SO-2026-00011',
  'Open purchase order PO-2025-00001',
];
