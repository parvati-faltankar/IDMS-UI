export type DocumentType = 'sale_order' | 'purchase_order';

export type IntentType = 'create_sale_order' | 'create_purchase_order' | 'unknown';

export interface IntentResult {
  type: IntentType;
  confidence: number;
  text: string;
}

export type ConversationStep =
  | 'welcome'
  | 'customer_or_supplier'
  | 'open_documents'
  | 'product'
  | 'quantity'
  | 'pricing'
  | 'add_more'
  | 'review'
  | 'confirm_save'
  | 'saved';

export interface SuggestionAction {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user' | 'system';
  text: string;
  step?: ConversationStep;
  suggestions?: SuggestionAction[];
  meta?: Record<string, string>;
}

export interface SearchResultCard {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  metadata?: Array<{ label: string; value: string }>;
}

export interface LineItemDraft {
  id: string;
  code: string;
  name: string;
  quantity: string;
  rate: string;
  discountAmount?: string;
  discountPercent?: string;
  taxRate?: number;
  taxLabel?: string;
}

export interface DocumentDraft {
  documentType: DocumentType;
  customerOrSupplier?: SearchResultCard;
  lines: LineItemDraft[];
  charges?: string;
  notes?: string;
}

export interface ExtractedEntities {
  quantity?: string;
  discountAmount?: string;
  discountPercent?: string;
  charges?: string;
}

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface PreviewModel {
  header: Array<{ label: string; value: string }>;
  lines: Array<{ label: string; value: string }>;
  totals: Array<{ label: string; value: string }>;
}
