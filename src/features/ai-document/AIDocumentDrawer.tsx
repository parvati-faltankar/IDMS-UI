import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Plus, SendHorizontal } from 'lucide-react';
import SideDrawer from '../../components/common/SideDrawer';
import { aiDocumentService } from './aiDocumentService';
import { createInitialEngineState, pushMessage, resolveStarterInput, startFlow, type EngineState } from './documentCreationEngine';
import { extractEntities } from './entityExtractor';
import type { DocumentType, LineItemDraft, SearchResultCard } from './types';

interface AIDocumentDrawerProps {
  isOpen: boolean;
  username: string;
  onClose: () => void;
  onViewDocument: (documentType: DocumentType, id: string) => void;
}

const quantitySuggestions = ['1', '2', '3', '4', '5', '10'];

function cardKey(card: SearchResultCard) {
  return `${card.id}-${card.title}`;
}

const AIDocumentDrawer: React.FC<AIDocumentDrawerProps> = ({ isOpen, username, onClose, onViewDocument }) => {
  const [engineState, setEngineState] = useState<EngineState>(createInitialEngineState());
  const [inputValue, setInputValue] = useState('');
  const [partyResults, setPartyResults] = useState<SearchResultCard[]>([]);
  const [productResults, setProductResults] = useState<SearchResultCard[]>([]);
  const [openDocuments, setOpenDocuments] = useState<SearchResultCard[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [previewDocumentId, setPreviewDocumentId] = useState<string | null>(null);
  const [savedDocumentType, setSavedDocumentType] = useState<DocumentType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const quickActions = useMemo(
    () => [
      { id: 'qa-so', label: 'Create Sale Order', value: 'create sale order', enabled: true },
      { id: 'qa-po', label: 'Create Purchase Order', value: 'create purchase order', enabled: true },
      { id: 'qa-job', label: 'Create Job Card', value: 'create job card', enabled: false },
      { id: 'qa-customer', label: 'Create Customer', value: 'create customer', enabled: false },
      { id: 'qa-search', label: 'Search Documents', value: 'search documents', enabled: false },
    ],
    []
  );

  const resetSession = useCallback(() => {
    setEngineState(createInitialEngineState());
    setInputValue('');
    setPartyResults([]);
    setProductResults([]);
    setOpenDocuments([]);
    setSelectedProductId(null);
    setPreviewDocumentId(null);
    setSavedDocumentType(null);
    setIsSaving(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetSession();
    }
  }, [isOpen, resetSession]);

  const handleClose = () => {
    resetSession();
    onClose();
  };

  const focusComposer = () => window.setTimeout(() => inputRef.current?.focus(), 0);

  const startDocumentFlow = (text: string) => {
    const documentType = resolveStarterInput(text);
    if (!documentType) {
      setEngineState((current) =>
        pushMessage(
          current,
          'assistant',
          'I can create Sale Orders and Purchase Orders right now. Try "create sale order" or "create purchase order".',
          'welcome'
        )
      );
      return;
    }

    setEngineState(startFlow(documentType));
    setInputValue('');
    setPartyResults([]);
    setProductResults([]);
    setOpenDocuments([]);
    focusComposer();
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);

    if (!engineState.isActive || !engineState.documentType) {
      return;
    }

    const query = value.trim();
    if (engineState.step === 'customer_or_supplier') {
      setProductResults([]);
      setPartyResults(query ? aiDocumentService.searchParty(engineState.documentType, query) : []);
    }

    if (engineState.step === 'product') {
      setPartyResults([]);
      setProductResults(query ? aiDocumentService.searchProducts(query) : []);
    }
  };

  const selectParty = (party: SearchResultCard) => {
    if (!engineState.documentType) {
      return;
    }

    const nextOpenDocuments = aiDocumentService.getOpenDocuments(engineState.documentType, party.title);
    setOpenDocuments(nextOpenDocuments);
    setPartyResults([]);
    setInputValue('');
    setEngineState((current) => ({
      ...pushMessage(
        pushMessage(current, 'user', party.title, 'customer_or_supplier'),
        'assistant',
        nextOpenDocuments.length > 0
          ? 'I found open documents for this party. You can continue with a new order or review the open list below. Which product should we add?'
          : 'Great. Which product would you like to add?',
        'product'
      ),
      step: 'product',
      draft: current.draft ? { ...current.draft, customerOrSupplier: party } : current.draft,
    }));
    focusComposer();
  };

  const searchParty = (value: string) => {
    if (!engineState.documentType) {
      return;
    }

    if (resolveStarterInput(value)) {
      setEngineState((current) =>
        pushMessage(current, 'assistant', 'We are already in that flow. Please search by customer or supplier name.', 'customer_or_supplier')
      );
      return;
    }

    const results = aiDocumentService.searchParty(engineState.documentType, value);
    setPartyResults(results);
    setProductResults([]);

    if (results.length === 1) {
      selectParty(results[0]);
      return;
    }

    setEngineState((current) =>
      pushMessage(
        pushMessage(current, 'user', value, 'customer_or_supplier'),
        'assistant',
        results.length > 0 ? `I found ${results.length} matches. Select one from the suggestions.` : `No result found for "${value}". You can create it here or search again.`,
        'customer_or_supplier'
      )
    );
  };

  const createInlineParty = () => {
    if (!engineState.documentType || !inputValue.trim()) {
      return;
    }

    selectParty(aiDocumentService.createInlineParty(engineState.documentType, inputValue.trim()));
  };

  const selectProduct = (product: SearchResultCard) => {
    setProductResults([]);
    setOpenDocuments([]);
    setSelectedProductId(product.id);
    setInputValue('');
    setEngineState((current) => ({
      ...pushMessage(pushMessage(current, 'user', product.title, 'product'), 'assistant', 'How many quantity do you want?', 'quantity'),
      step: 'quantity',
    }));
    focusComposer();
  };

  const searchProduct = (value: string) => {
    const results = aiDocumentService.searchProducts(value);
    setProductResults(results);
    setPartyResults([]);

    if (results.length === 1) {
      selectProduct(results[0]);
      return;
    }

    setEngineState((current) =>
      pushMessage(
        pushMessage(current, 'user', value, 'product'),
        'assistant',
        results.length > 0 ? `I found ${results.length} products. Select one.` : `No product found for "${value}". Try another product name or code.`,
        'product'
      )
    );
  };

  const addLineWithQuantity = (quantity: string) => {
    if (!engineState.draft || !selectedProductId) {
      setEngineState((current) => pushMessage(current, 'assistant', 'Please select a product first, then choose quantity.', 'product'));
      return;
    }

    const line = aiDocumentService.toDraftLine(selectedProductId, quantity);
    if (!line) {
      return;
    }

    const nextLines: LineItemDraft[] = [...engineState.draft.lines, line];
    setEngineState((current) => ({
      ...pushMessage(
        pushMessage(current, 'user', `Quantity ${quantity}`, 'quantity'),
        'assistant',
        'Added. What would you like to do next?',
        'add_more'
      ),
      step: 'add_more',
      draft: current.draft ? { ...current.draft, lines: nextLines } : current.draft,
    }));
    setSelectedProductId(null);
    setInputValue('');
  };

  const addDiscount = () => {
    setInputValue('');
    setEngineState((current) => ({
      ...pushMessage(current, 'assistant', 'Discount noted. Review the order when you are ready.', 'add_more'),
      draft: current.draft
        ? {
            ...current.draft,
            lines: current.draft.lines.map((line) => ({ ...line, discountPercent: '5.00', discountAmount: '0.00' })),
          }
        : current.draft,
    }));
  };

  const addCharges = () => {
    setInputValue('');
    setEngineState((current) => ({
      ...pushMessage(current, 'assistant', 'Charges added. Review the order when you are ready.', 'add_more'),
      draft: current.draft ? { ...current.draft, charges: '100.00' } : current.draft,
    }));
  };

  const addAnotherProduct = () => {
    setEngineState((current) => ({
      ...pushMessage(current, 'assistant', 'Which product would you like to add?', 'product'),
      step: 'product',
    }));
    setProductResults([]);
    setInputValue('');
    focusComposer();
  };

  const reviewOrder = () => {
    if (!engineState.draft || engineState.draft.lines.length === 0) {
      setEngineState((current) => pushMessage(current, 'assistant', 'Add at least one product before review.', 'product'));
      return;
    }

    setEngineState((current) => ({
      ...pushMessage(current, 'assistant', 'Here is the order preview. Review it once, then save when ready.', 'confirm_save'),
      step: 'confirm_save',
    }));
    setInputValue('');
  };

  const saveOrder = () => {
    if (!engineState.draft || isSaving) {
      return;
    }

    setIsSaving(true);
    setInputValue('');
    const saved = aiDocumentService.saveDraft(engineState.draft);
    setSavedDocumentType(saved.documentType);
    setPreviewDocumentId(saved.id);
    setEngineState((current) => ({
      ...pushMessage(
        current,
        'assistant',
        `Saved successfully. ${saved.documentType === 'sale_order' ? 'Sale Order' : 'Purchase Order'} number: ${saved.number}`,
        'saved'
      ),
      step: 'saved',
    }));
    setIsSaving(false);
  };

  const handleSubmit = () => {
    const value = inputValue.trim();
    if (!value) {
      return;
    }

    if (!engineState.isActive) {
      startDocumentFlow(value);
      return;
    }

    switch (engineState.step) {
      case 'customer_or_supplier':
        searchParty(value);
        break;
      case 'product':
        searchProduct(value);
        break;
      case 'quantity': {
        const extracted = extractEntities(`quantity ${value}`);
        addLineWithQuantity(extracted.quantity || value);
        break;
      }
      case 'add_more':
        if (value.toLowerCase().includes('review')) {
          reviewOrder();
        } else if (value.toLowerCase().includes('discount')) {
          addDiscount();
        } else if (value.toLowerCase().includes('charge')) {
          addCharges();
        } else {
          addAnotherProduct();
        }
        break;
      case 'confirm_save':
        if (value.toLowerCase().includes('save') || value.toLowerCase().includes('yes')) {
          saveOrder();
        }
        break;
      default:
        break;
    }
  };

  const preview = engineState.draft ? aiDocumentService.buildPreview(engineState.draft) : null;
  const isConversationActive = engineState.isActive;
  const shouldShowPreview = Boolean(preview && (engineState.step === 'confirm_save' || engineState.step === 'saved'));
  const partyLabel = engineState.documentType === 'purchase_order' ? 'supplier/vendor' : 'customer';

  return (
    <SideDrawer
      isOpen={isOpen}
      title="AI Assistant"
      subtitle={isConversationActive ? 'Document creation in progress' : 'Create documents faster with guided chat'}
      onClose={handleClose}
      initialFocusRef={inputRef}
      panelClassName="side-drawer__panel--thirty ai-doc-drawer__panel"
      contentClassName="ai-doc-drawer__content"
      footer={
        isConversationActive ? (
          <div className="ai-doc-drawer__composer">
            <button type="button" className="ai-doc-drawer__round-button" aria-label="Add detail">
              <Plus size={18} />
            </button>
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(event) => handleInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleSubmit();
                }
              }}
              className="ai-doc-drawer__input"
              placeholder={
                engineState.step === 'customer_or_supplier'
                  ? `Search ${partyLabel}`
                  : engineState.step === 'product'
                    ? 'Search product, SKU, or item'
                    : 'Ask anything'
              }
              aria-label="AI drawer input"
            />
            <button type="button" className="ai-doc-drawer__round-button" aria-label="Voice input">
              <Mic size={17} />
            </button>
            <button type="button" className="ai-doc-drawer__send-button" onClick={handleSubmit} disabled={isSaving} aria-label="Send message">
              <SendHorizontal size={18} />
            </button>
          </div>
        ) : null
      }
    >
      {!isConversationActive ? (
        <div className="ai-doc-drawer__welcome">
          <h3 className="ai-doc-drawer__welcome-title">What are you working on, {username}?</h3>
          <div className="ai-doc-drawer__welcome-input-row">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(event) => handleInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleSubmit();
                }
              }}
              className="ai-doc-drawer__input ai-doc-drawer__input--center"
              placeholder="Ask anything"
              aria-label="AI welcome input"
            />
          </div>
          <div className="ai-doc-drawer__quick-actions">
            {quickActions.map((action) => (
              <button
                key={action.id}
                type="button"
                className="brand-badge ai-doc-drawer__quick-action"
                disabled={!action.enabled}
                onClick={() => action.enabled && startDocumentFlow(action.value)}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="ai-doc-drawer__chat">
          <div className="ai-doc-drawer__messages" role="log" aria-live="polite">
            {engineState.messages.map((message) => (
              <div key={message.id} className={`ai-doc-drawer__message ai-doc-drawer__message--${message.role}`}>
                {message.text}
              </div>
            ))}
          </div>

          {openDocuments.length > 0 && (
            <div className="ai-doc-drawer__result-group" aria-label="Open documents">
              {openDocuments.map((card) => (
                <div key={cardKey(card)} className="ai-doc-drawer__card ai-doc-drawer__card--static">
                  <strong>{card.title}</strong>
                  {card.subtitle && <span>{card.subtitle}</span>}
                  {card.description && <span>{card.description}</span>}
                </div>
              ))}
            </div>
          )}

          {partyResults.length > 0 && engineState.step === 'customer_or_supplier' && (
            <div className="ai-doc-drawer__result-group" aria-label={`${partyLabel} suggestions`}>
              {partyResults.map((card) => (
                <button key={cardKey(card)} type="button" className="ai-doc-drawer__card" onClick={() => selectParty(card)}>
                  <strong>{card.title}</strong>
                  {card.subtitle && <span>{card.subtitle}</span>}
                  {card.description && <span>{card.description}</span>}
                </button>
              ))}
            </div>
          )}

          {partyResults.length === 0 && engineState.step === 'customer_or_supplier' && inputValue.trim().length > 0 && (
            <div className="ai-doc-drawer__actions">
              <button type="button" className="btn btn--outline" onClick={createInlineParty}>
                Create "{inputValue.trim()}"
              </button>
            </div>
          )}

          {productResults.length > 0 && engineState.step === 'product' && (
            <div className="ai-doc-drawer__result-group" aria-label="Product suggestions">
              {productResults.map((card) => (
                <button key={cardKey(card)} type="button" className="ai-doc-drawer__card" onClick={() => selectProduct(card)}>
                  <strong>{card.title}</strong>
                  {card.subtitle && <span>{card.subtitle}</span>}
                  {card.description && <span>{card.description}</span>}
                </button>
              ))}
            </div>
          )}

          {engineState.step === 'quantity' && (
            <div className="ai-doc-drawer__chips">
              {quantitySuggestions.map((quantity) => (
                <button key={quantity} type="button" className="brand-badge ai-doc-drawer__chip" onClick={() => addLineWithQuantity(quantity)}>
                  {quantity}
                </button>
              ))}
            </div>
          )}

          {engineState.step === 'add_more' && (
            <div className="ai-doc-drawer__chips">
              <button type="button" className="brand-badge ai-doc-drawer__chip" onClick={addAnotherProduct}>
                Add Another Product
              </button>
              <button type="button" className="brand-badge ai-doc-drawer__chip" onClick={addDiscount}>
                Add Discount
              </button>
              <button type="button" className="brand-badge ai-doc-drawer__chip" onClick={addCharges}>
                Add Charges
              </button>
              <button type="button" className="brand-badge ai-doc-drawer__chip ai-doc-drawer__chip--primary" onClick={reviewOrder}>
                Review Order
              </button>
            </div>
          )}

          {shouldShowPreview && preview && (
            <div className="ai-doc-drawer__preview">
              <h4>Review</h4>
              {preview.header.map((item) => (
                <div key={item.label} className="ai-doc-drawer__preview-row">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
              {preview.lines.map((item) => (
                <div key={item.label} className="ai-doc-drawer__preview-row">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
              {preview.totals.map((item) => (
                <div key={item.label} className="ai-doc-drawer__preview-row">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
              {engineState.step !== 'saved' && (
                <div className="ai-doc-drawer__actions">
                  <button type="button" className="btn btn--primary" onClick={saveOrder} disabled={isSaving}>
                    Save
                  </button>
                </div>
              )}
            </div>
          )}

          {engineState.step === 'saved' && previewDocumentId && savedDocumentType && (
            <div className="ai-doc-drawer__actions">
              <button type="button" className="btn btn--outline" onClick={() => onViewDocument(savedDocumentType, previewDocumentId)}>
                View Document
              </button>
              <button type="button" className="btn btn--outline" onClick={resetSession}>
                Create Another
              </button>
              <button type="button" className="btn btn--primary" onClick={handleClose}>
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </SideDrawer>
  );
};

export default AIDocumentDrawer;
