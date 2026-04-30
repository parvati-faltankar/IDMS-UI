import React, { useMemo, useState } from 'react';
import { ArrowLeft, MoreVertical, PencilLine, Plus, Search, Trash2 } from 'lucide-react';
import AppShell from '../../components/common/AppShell';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import { FormField, Input, Select, Textarea } from '../../components/common/FormControls';
import { handleGridLastCellTab, hasRequiredGridValues } from '../../components/common/gridKeyboard';
import SuccessSummaryDialog from '../../components/common/SuccessSummaryDialog';
import { cn } from '../../utils/classNames'
import { formatDate } from '../../utils/dateFormat';
import { extendedSaleInvoiceDocuments, type SaleInvoiceDocument } from '../sale-invoice/saleInvoiceData';
import type { DeliveryDocument } from './deliveryData';

type DeliveryTabKey = 'general-details' | 'product-details' | 'transport-details';

interface DeliveryLineForm {
  id: string;
  productCode: string;
  productName: string;
  uom: string;
  orderedQty: string;
  deliveredQty: string;
  pendingQty: string;
  status: 'Open' | 'Partially Delivered' | 'Delivered';
  remarks: string;
}

interface DeliveryFormData {
  number: string;
  documentDate: string;
  customer: string;
  saleInvoiceNumber: string;
  saleOrderNumber: string;
  deliveryLocation: string;
  deliveryMethod: string;
  transporterName: string;
  vehicleNumber: string;
  priority: '' | 'Low' | 'Medium' | 'High';
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Cancelled';
  remarks: string;
}

interface CreateDeliveryProps {
  editingDocument?: DeliveryDocument;
  onBack: () => void;
  onNavigateToDeliveryList: () => void;
}

const priorityOptions = [
  { value: '', label: 'Select priority' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
];

const deliveryMethodOptions = [
  { value: '', label: 'Select delivery method' },
  { value: 'Road Transport', label: 'Road Transport' },
  { value: 'Customer Pickup', label: 'Customer Pickup' },
  { value: 'Courier', label: 'Courier' },
];

function parseDecimal(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDecimal(value: number): string {
  return value.toFixed(2);
}

function createEmptyLine(index: number): DeliveryLineForm {
  return {
    id: `delivery-line-${Date.now()}-${index}`,
    productCode: '',
    productName: '',
    uom: '',
    orderedQty: '',
    deliveredQty: '',
    pendingQty: '0.00',
    status: 'Open',
    remarks: '',
  };
}

function mapDocumentToForm(document?: DeliveryDocument): DeliveryFormData {
  if (!document) {
    return {
      number: 'DL-2026-00017',
      documentDate: new Date().toISOString().slice(0, 10),
      customer: '',
      saleInvoiceNumber: '',
      saleOrderNumber: '',
      deliveryLocation: '',
      deliveryMethod: '',
      transporterName: '',
      vehicleNumber: '',
      priority: '',
      status: 'Draft',
      remarks: '',
    };
  }

  return {
    number: document.number,
    documentDate: document.deliveryDateTime.slice(0, 10),
    customer: document.customerName,
    saleInvoiceNumber: document.saleInvoiceNumber,
    saleOrderNumber: document.saleOrderNumber,
    deliveryLocation: document.deliveryLocation,
    deliveryMethod: document.deliveryMethod,
    transporterName: document.transporterName,
    vehicleNumber: document.vehicleNumber,
    priority: document.priority,
    status: document.status,
    remarks: '',
  };
}

function mapDocumentLines(document?: DeliveryDocument): DeliveryLineForm[] {
  if (!document) {
    return [createEmptyLine(0)];
  }

  return document.lines.map((line, index) => ({
    id: `delivery-edit-line-${index}`,
    ...line,
  }));
}

function createLinesFromInvoice(invoice: SaleInvoiceDocument): DeliveryLineForm[] {
  return invoice.lines.map((line, index) => ({
    id: `delivery-invoice-line-${invoice.id}-${index}`,
    productCode: line.productCode,
    productName: line.productName,
    uom: line.uom,
    orderedQty: line.orderQuantity,
    deliveredQty: '',
    pendingQty: line.orderQuantity,
    status: 'Open',
    remarks: line.remark,
  }));
}

const CreateDelivery: React.FC<CreateDeliveryProps> = ({
  editingDocument,
  onBack,
  onNavigateToDeliveryList,
}) => {
  const [formData, setFormData] = useState<DeliveryFormData>(() => mapDocumentToForm(editingDocument));
  const [lines, setLines] = useState<DeliveryLineForm[]>(() => mapDocumentLines(editingDocument));
  const [activeTab, setActiveTab] = useState<DeliveryTabKey>('general-details');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchResultsOpen, setIsSearchResultsOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isSaveSuccessDialogOpen, setIsSaveSuccessDialogOpen] = useState(false);

  const tabs: Array<{ id: DeliveryTabKey; label: string }> = [
    { id: 'general-details', label: 'General Details' },
    { id: 'product-details', label: 'Product Details' },
    { id: 'transport-details', label: 'Transport Details' },
  ];

  const totalDeliveredQty = useMemo(
    () => lines.reduce((sum, line) => sum + parseDecimal(line.deliveredQty), 0),
    [lines]
  );
  const isDeliveryLineComplete = (line: DeliveryLineForm) =>
    hasRequiredGridValues(line, ['productCode', 'productName', 'uom', 'orderedQty', 'deliveredQty']);
  const canAddDeliveryLine = lines.length === 0 || isDeliveryLineComplete(lines[lines.length - 1]);

  const matchingInvoices = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    if (!normalizedSearch) {
      return extendedSaleInvoiceDocuments;
    }

    return extendedSaleInvoiceDocuments.filter(
      (invoice) =>
        invoice.number.toLowerCase().includes(normalizedSearch) ||
        invoice.saleOrderNumber.toLowerCase().includes(normalizedSearch) ||
        invoice.customerName.toLowerCase().includes(normalizedSearch) ||
        invoice.salesExecutive.toLowerCase().includes(normalizedSearch)
    );
  }, [searchQuery]);

  const selectedInvoice = useMemo(
    () => extendedSaleInvoiceDocuments.find((invoice) => invoice.id === selectedInvoiceId) ?? null,
    [selectedInvoiceId]
  );

  const updateFormData = (field: keyof DeliveryFormData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const updateLine = (lineId: string, field: keyof DeliveryLineForm, value: string) => {
    setLines((current) =>
      current.map((line) => {
        if (line.id !== lineId) {
          return line;
        }

        const nextLine = { ...line, [field]: value };
        const pendingQty = Math.max(parseDecimal(nextLine.orderedQty) - parseDecimal(nextLine.deliveredQty), 0);
        nextLine.pendingQty = formatDecimal(pendingQty);
        nextLine.status = pendingQty === 0 && parseDecimal(nextLine.orderedQty) > 0
          ? 'Delivered'
          : parseDecimal(nextLine.deliveredQty) > 0
            ? 'Partially Delivered'
            : 'Open';

        return nextLine;
      })
    );
  };

  const handleSelectInvoice = (invoiceId: string) => {
    const invoice = extendedSaleInvoiceDocuments.find((option) => option.id === invoiceId);
    if (!invoice) {
      return;
    }

    setSelectedInvoiceId(invoice.id);
    setFormData((current) => ({
      ...current,
      customer: invoice.customerName,
      saleInvoiceNumber: invoice.number,
      saleOrderNumber: invoice.saleOrderNumber,
      priority: invoice.priority,
      deliveryLocation: invoice.placeOfSupply,
    }));
    setLines(createLinesFromInvoice(invoice));
    setSearchQuery('');
    setIsSearchResultsOpen(false);
  };

  const addLine = () => {
    if (!canAddDeliveryLine) {
      return;
    }

    setLines((current) => [...current, createEmptyLine(current.length)]);
  };

  const handleRemarksKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    line: DeliveryLineForm,
    lineIndex: number
  ) => {
    handleGridLastCellTab({
      event,
      line,
      lineIndex,
      lines,
      isLineComplete: isDeliveryLineComplete,
      onAddLine: addLine,
    });
  };

  return (
    <AppShell
      activeLeaf="delivery"
      onDeliveryClick={onNavigateToDeliveryList}
      contentClassName="create-pr-shell"
    >
      <div className="create-pr-header">
        <div className="create-pr-header__top">
          <div className="create-pr-header__title-group">
            <button type="button" onClick={onBack} className="page-back-button create-pr-header__back" aria-label="Back to delivery catalogue">
              <ArrowLeft size={18} />
            </button>
            <div className="create-pr-header__title-wrap">
              <div className="create-pr-header__title-row">
                <h2 className="brand-page-title create-pr-header__title">
                  {editingDocument ? 'Edit Delivery' : 'New Delivery'}
                </h2>
                <span className="create-pr-header__status">{formData.status}</span>
              </div>
            </div>
          </div>

          <div className="create-pr-header__meta">
            <div className="create-pr-header__meta-item">
              <span className="create-pr-header__meta-label">Doc no:</span>
              <span className="create-pr-header__meta-value">{formData.number}</span>
            </div>
            <div className="create-pr-header__meta-item">
              <span className="create-pr-header__meta-label">Doc date:</span>
              <span className="create-pr-header__meta-value">{formatDate(formData.documentDate)}</span>
            </div>
            <button type="button" className="create-pr-header__icon-button" aria-label="Edit delivery header">
              <PencilLine size={16} />
            </button>
            <button type="button" className="create-pr-header__icon-button" aria-label="More options">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>

        <div className="create-pr-header__actions">
          <div className="po-create__requisition-picker">
            <div className="po-create__requisition-search">
              <div className="po-create__requisition-search-shell">
                <Search size={16} className="po-create__requisition-search-icon" />
                {selectedInvoice && (
                  <span className="po-create__selected-chip">
                    <span className="po-create__selected-chip-text">{selectedInvoice.number}</span>
                    <button
                      type="button"
                      className="po-create__selected-chip-remove"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setSelectedInvoiceId(null);
                        setSearchQuery('');
                      }}
                      aria-label="Remove selected invoice"
                    >
                      x
                    </button>
                  </span>
                )}
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setIsSearchResultsOpen(true);
                  }}
                  onFocus={() => setIsSearchResultsOpen(true)}
                  onBlur={() => {
                    window.setTimeout(() => setIsSearchResultsOpen(false), 140);
                  }}
                  placeholder={selectedInvoice ? '' : 'Search sale invoice by number, order, customer...'}
                  className="search-input po-create__requisition-search-input"
                  aria-label="Search sale invoice"
                />
              </div>
            </div>

            {isSearchResultsOpen && matchingInvoices.length > 0 && (
              <div className="po-create__requisition-results so-create__customer-results" role="listbox" aria-label="Sale invoice results">
                <table className="po-create__requisition-results-table">
                  <thead>
                    <tr>
                      <th>SI No.</th>
                      <th>SO No.</th>
                      <th>Customer</th>
                      <th>Sales executive</th>
                      <th>Status</th>
                      <th>Total amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchingInvoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className="po-create__requisition-results-row"
                        role="option"
                        tabIndex={0}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleSelectInvoice(invoice.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleSelectInvoice(invoice.id);
                          }
                        }}
                      >
                        <td className="po-create__requisition-results-number">{invoice.number}</td>
                        <td>{invoice.saleOrderNumber}</td>
                        <td>{invoice.customerName}</td>
                        <td>{invoice.salesExecutive}</td>
                        <td>{invoice.status}</td>
                        <td>{invoice.totalAmount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <button type="button" onClick={() => setIsDiscardDialogOpen(true)} className="btn btn--outline">
            Discard
          </button>
          <button type="button" onClick={() => setIsSaveSuccessDialogOpen(true)} className="btn btn--primary">
            Save
          </button>
        </div>
      </div>

      <div className="create-pr-page mx-auto w-full max-w-[1800px] px-6 py-6 space-y-6">
        <div className="create-pr-tabs">
          <div className="create-pr-tabs__list" role="tablist" aria-label="Delivery sections">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn('create-pr-tab', activeTab === tab.id ? 'create-pr-tab--active' : 'create-pr-tab--inactive')}
              >
                <span className="create-pr-tab__label">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'general-details' && (
          <section className="rounded border border-slate-200 bg-white p-4 space-y-4">
            <h3 className="brand-section-title font-semibold">Basic Details</h3>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FormField label="Customer">
                <Input value={formData.customer} onChange={(event) => updateFormData('customer', event.target.value)} placeholder="Customer name" />
              </FormField>
              <FormField label="Sale Invoice No.">
                <Input value={formData.saleInvoiceNumber} onChange={(event) => updateFormData('saleInvoiceNumber', event.target.value)} placeholder="Invoice number" />
              </FormField>
              <FormField label="Sale Order No.">
                <Input value={formData.saleOrderNumber} onChange={(event) => updateFormData('saleOrderNumber', event.target.value)} placeholder="Sale order number" />
              </FormField>
              <FormField label="Priority">
                <Select value={formData.priority} onChange={(event) => updateFormData('priority', event.target.value)} options={priorityOptions} />
              </FormField>
              <FormField label="Delivery Location">
                <Input value={formData.deliveryLocation} onChange={(event) => updateFormData('deliveryLocation', event.target.value)} placeholder="Delivery location" />
              </FormField>
              <FormField label="Delivery Method">
                <Select value={formData.deliveryMethod} onChange={(event) => updateFormData('deliveryMethod', event.target.value)} options={deliveryMethodOptions} />
              </FormField>
            </div>
          </section>
        )}

        {activeTab === 'product-details' && (
          <div className="rounded border border-slate-200 bg-white p-4">
            <section className="create-pr-grid">
              <div className="create-pr-grid__header">
                <div className="create-pr-grid__title-wrap">
                  <div className="create-pr-grid__title-row">
                    <h4 className="create-pr-grid__title">Product Details</h4>
                    <span className="create-pr-grid__count">{lines.length}</span>
                  </div>
                </div>
                <button type="button" onClick={addLine} disabled={!canAddDeliveryLine} className="btn btn--outline btn--icon-left create-pr-grid__add-button">
                  <Plus size={14} />
                  Add line
                </button>
              </div>

              <div className="create-pr-grid__table-wrap">
                <table className="create-pr-grid__table">
                  <thead>
                    <tr>
                      <th className="create-pr-grid__cell create-pr-grid__cell--action"></th>
                      <th className="create-pr-grid__cell">Product Code</th>
                      <th className="create-pr-grid__cell">Product Name</th>
                      <th className="create-pr-grid__cell">UOM</th>
                      <th className="create-pr-grid__cell create-pr-grid__cell--number">Ordered Qty</th>
                      <th className="create-pr-grid__cell create-pr-grid__cell--number">Delivered Qty</th>
                      <th className="create-pr-grid__cell create-pr-grid__cell--number">Pending Qty</th>
                      <th className="create-pr-grid__cell">Status</th>
                      <th className="create-pr-grid__cell">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, index) => (
                      <tr key={line.id}>
                        <td className="create-pr-grid__body-cell create-pr-grid__body-cell--action">
                          <button
                            type="button"
                            onClick={() => setLines((current) => current.filter((row) => row.id !== line.id))}
                            className="create-pr-grid__delete"
                            aria-label={`Delete line ${index + 1}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                        <td className="create-pr-grid__body-cell"><Input value={line.productCode} onChange={(event) => updateLine(line.id, 'productCode', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input min-w-32" /></td>
                        <td className="create-pr-grid__body-cell"><Input value={line.productName} onChange={(event) => updateLine(line.id, 'productName', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input min-w-40" /></td>
                        <td className="create-pr-grid__body-cell"><Input value={line.uom} onChange={(event) => updateLine(line.id, 'uom', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input min-w-20" /></td>
                        <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number"><Input value={line.orderedQty} onChange={(event) => updateLine(line.id, 'orderedQty', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input create-pr-grid__control--number min-w-24" /></td>
                        <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number"><Input value={line.deliveredQty} onChange={(event) => updateLine(line.id, 'deliveredQty', event.target.value)} className="create-pr-grid__control create-pr-grid__control--input create-pr-grid__control--number min-w-24" /></td>
                        <td className="create-pr-grid__body-cell create-pr-grid__body-cell--number"><Input value={line.pendingQty} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly create-pr-grid__control--number min-w-24" /></td>
                        <td className="create-pr-grid__body-cell"><Input value={line.status} readOnly disabled className="create-pr-grid__control create-pr-grid__control--readonly min-w-32" /></td>
                        <td className="create-pr-grid__body-cell"><Input value={line.remarks} onChange={(event) => updateLine(line.id, 'remarks', event.target.value)} onKeyDown={(event) => handleRemarksKeyDown(event, line, index)} className="create-pr-grid__control create-pr-grid__control--input min-w-36" /></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="create-pr-grid__footer-cell" colSpan={4}>Total</td>
                      <td className="create-pr-grid__footer-cell create-pr-grid__footer-cell--number">
                        {formatDecimal(lines.reduce((sum, line) => sum + parseDecimal(line.orderedQty), 0))}
                      </td>
                      <td className="create-pr-grid__footer-cell create-pr-grid__footer-cell--number">{formatDecimal(totalDeliveredQty)}</td>
                      <td className="create-pr-grid__footer-cell create-pr-grid__footer-cell--number">
                        {formatDecimal(lines.reduce((sum, line) => sum + parseDecimal(line.pendingQty), 0))}
                      </td>
                      <td className="create-pr-grid__footer-cell" colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'transport-details' && (
          <section className="rounded border border-slate-200 bg-white p-4 space-y-4">
            <h3 className="brand-section-title font-semibold">Transport Details</h3>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FormField label="Transporter Name">
                <Input value={formData.transporterName} onChange={(event) => updateFormData('transporterName', event.target.value)} placeholder="Transporter name" />
              </FormField>
              <FormField label="Vehicle Number">
                <Input value={formData.vehicleNumber} onChange={(event) => updateFormData('vehicleNumber', event.target.value)} placeholder="Vehicle number" />
              </FormField>
              <FormField label="Remarks">
                <Textarea value={formData.remarks} onChange={(event) => updateFormData('remarks', event.target.value)} rows={3} placeholder="Delivery remarks" />
              </FormField>
            </div>
          </section>
        )}
      </div>

      <ConfirmationDialog
        isOpen={isDiscardDialogOpen}
        title="Discard changes?"
        description="Are you sure you want to discard? All your entered information will be cleared."
        confirmLabel="Yes"
        cancelLabel="No"
        onConfirm={() => {
          setIsDiscardDialogOpen(false);
          onNavigateToDeliveryList();
        }}
        onClose={() => setIsDiscardDialogOpen(false)}
      />

      <SuccessSummaryDialog
        isOpen={isSaveSuccessDialogOpen}
        title="Saved successfully!"
        documentLabel="Delivery No"
        documentNumber={formData.number}
        sectionTitle="Delivery Summary"
        items={[
          { label: 'Customer', value: formData.customer || '-' },
          { label: 'Sale invoice', value: formData.saleInvoiceNumber || '-' },
          { label: 'Delivery method', value: formData.deliveryMethod || '-' },
          { label: 'Delivered qty', value: formatDecimal(totalDeliveredQty) },
        ]}
        totalLabel="Total packages"
        totalValue={`${lines.length}`}
        primaryActionLabel="Go to catalogue"
        onPrimaryAction={() => {
          setIsSaveSuccessDialogOpen(false);
          onNavigateToDeliveryList();
        }}
        onClose={() => setIsSaveSuccessDialogOpen(false)}
      />
    </AppShell>
  );
};

export default CreateDelivery;
