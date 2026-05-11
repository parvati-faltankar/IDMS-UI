import { parseIntent } from './intentParser';
import type { ChatMessage, ConversationStep, DocumentDraft, DocumentType, SuggestionAction } from './types';

export interface EngineState {
  isActive: boolean;
  documentType: DocumentType | null;
  step: ConversationStep;
  draft: DocumentDraft | null;
  messages: ChatMessage[];
}

function newMessage(role: ChatMessage['role'], text: string, step?: ConversationStep, suggestions?: SuggestionAction[]): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role,
    text,
    step,
    suggestions,
  };
}

export function createInitialEngineState(): EngineState {
  return {
    isActive: false,
    documentType: null,
    step: 'welcome',
    draft: null,
    messages: [],
  };
}

export function startFlow(documentType: DocumentType): EngineState {
  const firstPrompt =
    documentType === 'sale_order'
      ? 'Sure, let’s create a Sale Order. First, who is the customer?'
      : 'Sure, let’s create a Purchase Order. First, who is the supplier/vendor?';

  return {
    isActive: true,
    documentType,
    step: 'customer_or_supplier',
    draft: { documentType, lines: [], charges: '0.00' },
    messages: [newMessage('assistant', firstPrompt, 'customer_or_supplier')],
  };
}

export function resolveStarterInput(input: string): DocumentType | null {
  const intent = parseIntent(input);
  if (intent.type === 'create_sale_order') {
    return 'sale_order';
  }
  if (intent.type === 'create_purchase_order') {
    return 'purchase_order';
  }
  return null;
}

export function pushMessage(state: EngineState, role: ChatMessage['role'], text: string, step?: ConversationStep): EngineState {
  return {
    ...state,
    messages: [...state.messages, newMessage(role, text, step)],
  };
}
