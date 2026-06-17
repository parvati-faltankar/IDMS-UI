import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, Info, Plus, Trash2 } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { MasterFormStepper } from '../../../../experience/components';
import { findGroupForMasterKey, findMasterByKey } from '../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../adminStorage';
import type {
  ProductMaster,
  ProductType,
  ProductStatus,
  ConsumptionStrategy,
  SalesDiscontinuationBehavior,
  PurchaseDiscontinuationBehavior,
  ProductScopeMapping,
  ProductUOMRow,
  ProductPackagingRow,
  ProductIdentifierRow,
  ProductAssociationRow,
} from '../types/productMaster.types';
import {
  PRODUCT_TYPES,
  PRODUCT_TYPE_HIDES_PACKAGING,
  PRODUCT_TYPE_HIDDEN_CONFIG_TABS,
  PRODUCT_TYPE_SHOWS_KIT_COMPONENTS,
  SCOPE_TYPES,
  SCOPE_DIMENSIONS,
  SCOPE_ACTIVATION_STATUSES,
  MOCK_SCOPE_VALUES,
  UOMS,
  WEIGHT_UOMS,
  DIMENSION_UOMS,
  MOCK_UOM_CONVERSIONS,
  PACK_TYPES,
  PACK_MATERIALS,
  ORG_TYPES,
  CONSUMPTION_STRATEGIES,
  SALES_CHANNELS,
  SALES_DISCONTINUATION_BEHAVIORS,
  PURCHASE_DISCONTINUATION_BEHAVIORS,
  IDENTIFIER_TYPES,
  ASSOCIATION_TYPES,
  COUNTRIES,
  MOCK_BRANDS,
  MOCK_PRODUCT_FAMILIES,
  MOCK_PRODUCT_LINES,
  MOCK_PRODUCT_CLASSES,
  MOCK_PRODUCT_CATEGORIES,
  MOCK_PRODUCT_SUBCATEGORIES,
} from '../constants/productMaster.constants';
import { productMasterService } from '../services/productMaster.service';

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { index: 0, label: 'Product Identity' },
  { index: 1, label: 'Scope & Operations' },
  { index: 2, label: 'Configuration' },
  { index: 3, label: 'More Details' },
];

// ─── Style constants (mirror SupplierFormPage exactly) ────────────────────────

const inputBase: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: '13px',
  border: '1px solid var(--color-border)', borderRadius: '8px',
  background: 'var(--color-surface)', color: 'var(--color-text)',
  outline: 'none', boxSizing: 'border-box',
};
const inputReadOnly: React.CSSProperties = {
  ...inputBase,
  background: 'var(--color-surface-subtle)',
  color: 'var(--color-text-muted)',
  cursor: 'not-allowed',
};
const labelBase: React.CSSProperties = {
  fontSize: '12px', fontWeight: 600, color: 'var(--color-text)',
  display: 'block', marginBottom: '6px',
};
const fieldErrTxt: React.CSSProperties = { fontSize: '11px', color: '#DC2626', marginTop: '4px' };
const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '9px 18px', fontSize: '13px', fontWeight: 600,
  borderRadius: '8px', cursor: 'pointer', border: 'none',
};
const btnPrimary: React.CSSProperties = { ...btnBase, background: 'var(--color-primary)', color: 'white' };
const btnOutline: React.CSSProperties = { ...btnBase, fontWeight: 500, background: 'transparent', color: 'var(--color-text)', border: '1px solid var(--color-border)' };
const sectionCard: React.CSSProperties = {
  border: '1px solid var(--color-border)', borderRadius: '12px',
  overflow: 'hidden', marginBottom: '20px',
};
const sCardHead: React.CSSProperties = {
  padding: '12px 20px', borderBottom: '1px solid var(--color-border)',
  background: 'var(--color-surface-subtle)', display: 'flex',
  alignItems: 'center', justifyContent: 'space-between',
};
const sCardBody: React.CSSProperties = { padding: '20px 24px', background: 'var(--color-surface)' };
const twoCol: React.CSSProperties   = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const threeCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' };
const fw: React.CSSProperties       = { marginBottom: '14px' };

// ─── Tab bar component ────────────────────────────────────────────────────────

function TabBar({ tabs, active, onChange }: {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (k: string) => void;
}) {
  return (
    <div style={{ display: 'flex', borderBottom: '2px solid var(--color-border)', marginBottom: '20px', gap: '0' }}>
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            style={{
              padding: '10px 18px', fontSize: '13px', fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-2px', transition: 'color 0.1s',
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Inline grid helpers (mirrors SupplierFormPage pattern) ──────────────────

function GridHead(cols: string[]) {
  return (
    <div style={{ display: 'flex', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', padding: '0 14px', height: '34px', alignItems: 'center', gap: '8px' }}>
      {cols.map((c) => (
        <div key={c} style={{ flex: 1, fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c}</div>
      ))}
      <div style={{ width: '40px', flexShrink: 0 }} />
    </div>
  );
}

const ROW_STYLE: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px',
  padding: '8px 14px', borderBottom: '1px solid var(--color-border)',
};

function RowDeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <div style={{ width: '40px', flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
      <button type="button" onClick={onClick} title="Remove"
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #FCA5A5', background: '#FEF2F2', cursor: 'pointer', color: '#DC2626' }}>
        <Trash2 size={11} />
      </button>
    </div>
  );
}

const pillStyle = (color: string, bg: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
  fontSize: '10px', fontWeight: 600, borderRadius: '9999px',
  background: bg, color: color,
});

// ─── Form shape ───────────────────────────────────────────────────────────────

interface CoreForm {
  productCode: string;
  productName: string;
  productDescription: string;
  productType: ProductType | '';
  manufacturerOEM: string;
  countryOfOrigin: string;
  countryOfAssembly: string;
  productClass: string;
  productCategory: string;
  productSubCategory: string;
  brand: string;
  productFamily: string;
  productLine: string;
  modelBaseProduct: string;
  variantConfiguration: string;
  skuTradeItem: string;
  baseUOM: string;
  netWeight: string;
  grossWeight: string;
  length: string;
  width: string;
  height: string;
  volume: string;
  dimensionUOM: string;
  weightUOM: string;
  stockableIndicator: boolean;
  serializedTrackingRequired: boolean;
  batchTrackingRequired: boolean;
  lotTrackingRequired: boolean;
  consumptionStrategy: ConsumptionStrategy | '';
  storageCondition: string;
  warrantyApplicable: boolean;
  sellableIndicator: boolean;
  salesChannelEligibility: string[];
  salesDiscontinuationBehavior: SalesDiscontinuationBehavior | '';
  purchasableIndicator: boolean;
  purchaseDiscontinuationBehavior: PurchaseDiscontinuationBehavior | '';
  effectiveFromDate: string;
  effectiveToDate: string;
  discontinuationDate: string;
}

const EMPTY_FORM: CoreForm = {
  productCode: '', productName: '', productDescription: '', productType: '',
  manufacturerOEM: '', countryOfOrigin: '', countryOfAssembly: '',
  productClass: '', productCategory: '', productSubCategory: '',
  brand: '', productFamily: '', productLine: '', modelBaseProduct: '',
  variantConfiguration: '', skuTradeItem: '',
  baseUOM: '', netWeight: '', grossWeight: '',
  length: '', width: '', height: '', volume: '',
  dimensionUOM: 'Millimetre', weightUOM: 'Kilogram',
  stockableIndicator: true, serializedTrackingRequired: false,
  batchTrackingRequired: false, lotTrackingRequired: false,
  consumptionStrategy: 'FIFO', storageCondition: '',
  warrantyApplicable: false,
  sellableIndicator: true, salesChannelEligibility: [],
  salesDiscontinuationBehavior: '',
  purchasableIndicator: true, purchaseDiscontinuationBehavior: '',
  effectiveFromDate: '', effectiveToDate: '', discontinuationDate: '',
};

function productToForm(p: ProductMaster): CoreForm {
  return {
    productCode: p.productCode, productName: p.productName,
    productDescription: p.productDescription, productType: p.productType,
    manufacturerOEM: p.manufacturerOEM, countryOfOrigin: p.countryOfOrigin,
    countryOfAssembly: p.countryOfAssembly,
    productClass: p.productClass, productCategory: p.productCategory,
    productSubCategory: p.productSubCategory,
    brand: p.brand, productFamily: p.productFamily, productLine: p.productLine,
    modelBaseProduct: p.modelBaseProduct, variantConfiguration: p.variantConfiguration,
    skuTradeItem: p.skuTradeItem, baseUOM: p.baseUOM,
    netWeight: p.netWeight, grossWeight: p.grossWeight,
    length: p.length, width: p.width, height: p.height, volume: p.volume,
    dimensionUOM: p.dimensionUOM || 'Millimetre', weightUOM: p.weightUOM || 'Kilogram',
    stockableIndicator: p.stockableIndicator, serializedTrackingRequired: p.serializedTrackingRequired,
    batchTrackingRequired: p.batchTrackingRequired, lotTrackingRequired: p.lotTrackingRequired,
    consumptionStrategy: p.consumptionStrategy, storageCondition: p.storageCondition,
    warrantyApplicable: p.warrantyApplicable,
    sellableIndicator: p.sellableIndicator, salesChannelEligibility: [...p.salesChannelEligibility],
    salesDiscontinuationBehavior: p.salesDiscontinuationBehavior,
    purchasableIndicator: p.purchasableIndicator,
    purchaseDiscontinuationBehavior: p.purchaseDiscontinuationBehavior,
    effectiveFromDate: p.effectiveFromDate, effectiveToDate: p.effectiveToDate,
    discontinuationDate: p.discontinuationDate,
  };
}

const FORM_MASTER_KEY = 'product-master';

// ─── Component ────────────────────────────────────────────────────────────────

const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;

  // ── Core data ──────────────────────────────────────────────────────────────
  const [existing, setExisting]   = useState<ProductMaster | null>(null);
  const [notFound, setNotFound]   = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  // ── Main form ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState<CoreForm>({ ...EMPTY_FORM });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ── Sub-entity arrays ──────────────────────────────────────────────────────
  const [scopeMappings,       setScopeMappings]       = useState<ProductScopeMapping[]>([]);
  const [applicableUOMs,      setApplicableUOMs]      = useState<ProductUOMRow[]>([]);
  const [packagingRows,       setPackagingRows]        = useState<ProductPackagingRow[]>([]);
  const [productIdentifiers,  setProductIdentifiers]  = useState<ProductIdentifierRow[]>([]);
  const [productAssociations, setProductAssociations] = useState<ProductAssociationRow[]>([]);

  // ── Step-level active tabs ─────────────────────────────────────────────────
  const [step0Tab, setStep0Tab] = useState<'definition' | 'classification' | 'hierarchy'>('definition');
  const [step1Tab, setStep1Tab] = useState<'scope' | 'uom' | 'packaging'>('scope');
  const [step2Tab, setStep2Tab] = useState<'inventory' | 'sales' | 'purchase' | 'dimensions'>('inventory');
  const [step3Tab, setStep3Tab] = useState<'identifiers' | 'associations' | 'status'>('identifiers');

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  const [activateOpen, setActivateOpen]         = useState(false);
  const [activationIssues, setActivationIssues] = useState<string[]>([]);
  const [inactivateOpen, setInactivateOpen]     = useState(false);
  const [deleteOpen, setDeleteOpen]             = useState(false);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  function showToast(msg: string, tone: 'success' | 'error') {
    setToast({ message: msg, tone });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isNew && id) {
      const found = productMasterService.getById(id);
      if (!found) { setNotFound(true); return; }
      setExisting(found);
      setForm(productToForm(found));
      setScopeMappings([...found.scopeMappings]);
      setApplicableUOMs([...found.applicableUOMs]);
      setPackagingRows([...found.packagingRows]);
      setProductIdentifiers([...found.productIdentifiers]);
      setProductAssociations([...found.productAssociations]);
    }
    const master = findMasterByKey(FORM_MASTER_KEY);
    const group  = findGroupForMasterKey(FORM_MASTER_KEY);
    if (master && group) {
      recordRecentAdminMaster({
        key: master.key, label: master.label, path: master.path,
        groupLabel: group.label, groupIconBg: group.iconBg, groupIconColor: group.iconColor,
      });
    }
  }, [id, isNew]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const status: ProductStatus = existing?.productStatus ?? 'Draft';
  const isActive       = status === 'Active';
  const isInactive     = !isNew && (status === 'Inactive' || status === 'Discontinued');
  const isViewOnly     = isInactive;
  const canDel         = !isNew && status === 'Draft';
  const productType    = form.productType as ProductType;
  const hidesPackaging = productType ? PRODUCT_TYPE_HIDES_PACKAGING[productType] : false;
  const hiddenConfigTabs = productType ? PRODUCT_TYPE_HIDDEN_CONFIG_TABS[productType] : [];
  const showsKitComponents = productType ? PRODUCT_TYPE_SHOWS_KIT_COMPONENTS[productType] : false;

  // ── Step completion dots ───────────────────────────────────────────────────
  function stepHasData(i: number): boolean {
    if (i === 0) return !!form.productName.trim();
    if (i === 1) return scopeMappings.length > 0 || !!form.baseUOM;
    if (i === 2) return form.stockableIndicator || form.sellableIndicator || form.purchasableIndicator;
    if (i === 3) return productIdentifiers.length > 0 || productAssociations.length > 0 || !!form.effectiveFromDate;
    return false;
  }

  const stepperSteps = STEPS.map((step) => {
    const count = getStepCount(step.index);

    return {
      id: String(step.index),
      label: step.label,
      count: count > 0 ? count : undefined,
      state: activeStep === step.index ? 'current' : stepHasData(step.index) ? 'complete' : 'default',
    };
  });

  function getStepCount(i: number): number {
    if (i === 1) return scopeMappings.length + applicableUOMs.length + packagingRows.length;
    if (i === 3) return productIdentifiers.length + productAssociations.length;
    return 0;
  }

  // ── Cascading: clear dependent hierarchy fields ────────────────────────────
  function setBrand(v: string) {
    setForm((f) => ({ ...f, brand: v, productFamily: '', productLine: '', modelBaseProduct: '' }));
  }
  function setProductFamily(v: string) {
    setForm((f) => ({ ...f, productFamily: v, productLine: '', modelBaseProduct: '' }));
  }
  function setProductLine(v: string) {
    setForm((f) => ({ ...f, productLine: v, modelBaseProduct: '' }));
  }
  // Cascading: clear dependent classification fields
  function setProductClass(v: string) {
    setForm((f) => ({ ...f, productClass: v, productCategory: '', productSubCategory: '' }));
  }
  function setProductCategory(v: string) {
    setForm((f) => ({ ...f, productCategory: v, productSubCategory: '' }));
  }

  // ── Derived cascades ───────────────────────────────────────────────────────
  const availableFamilies = form.brand ? (MOCK_PRODUCT_FAMILIES[form.brand] ?? []) : [];
  const availableLines    = form.productFamily ? (MOCK_PRODUCT_LINES[form.productFamily] ?? []) : [];
  const availableCategories    = form.productClass ? (MOCK_PRODUCT_CATEGORIES[form.productClass] ?? []) : [];
  const availableSubCategories = form.productCategory ? (MOCK_PRODUCT_SUBCATEGORIES[form.productCategory] ?? []) : [];

  // ── Field helpers ──────────────────────────────────────────────────────────
  function setField<K extends keyof CoreForm>(k: K, v: CoreForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setFieldErrors((previous) => {
      const next = { ...previous };
      delete next[String(k)];
      return next;
    });
  }

  // ── Build product ──────────────────────────────────────────────────────────
  function buildProduct(): Omit<ProductMaster, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      productCode: form.productCode || (existing?.productCode ?? productMasterService.generateCode()),
      productName: form.productName.trim(),
      productDescription: form.productDescription.trim(),
      productType: (form.productType as ProductType) || 'Finished Good',
      manufacturerOEM: form.manufacturerOEM.trim(),
      countryOfOrigin: form.countryOfOrigin,
      countryOfAssembly: form.countryOfAssembly,
      productClass: form.productClass, productCategory: form.productCategory,
      productSubCategory: form.productSubCategory,
      brand: form.brand, productFamily: form.productFamily, productLine: form.productLine,
      modelBaseProduct: form.modelBaseProduct.trim(), variantConfiguration: form.variantConfiguration.trim(),
      skuTradeItem: form.skuTradeItem.trim(),
      scopeMappings, applicableUOMs, packagingRows,
      baseUOM: form.baseUOM,
      netWeight: form.netWeight, grossWeight: form.grossWeight,
      length: form.length, width: form.width, height: form.height, volume: form.volume,
      dimensionUOM: form.dimensionUOM, weightUOM: form.weightUOM,
      stockableIndicator: form.stockableIndicator,
      serializedTrackingRequired: form.serializedTrackingRequired,
      batchTrackingRequired: form.batchTrackingRequired, lotTrackingRequired: form.lotTrackingRequired,
      consumptionStrategy: form.consumptionStrategy,
      storageCondition: form.storageCondition, warrantyApplicable: form.warrantyApplicable,
      sellableIndicator: form.sellableIndicator,
      salesChannelEligibility: form.salesChannelEligibility,
      salesDiscontinuationBehavior: form.salesDiscontinuationBehavior,
      purchasableIndicator: form.purchasableIndicator,
      purchaseDiscontinuationBehavior: form.purchaseDiscontinuationBehavior,
      productIdentifiers, productAssociations,
      productStatus: existing?.productStatus ?? 'Draft',
      effectiveFromDate: form.effectiveFromDate, effectiveToDate: form.effectiveToDate,
      discontinuationDate: form.discontinuationDate,
    };
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  function validateForSave(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!form.productName.trim()) errs.productName = 'Product Name is required.';
    if (!form.productType) errs.productType = 'Product Type is required.';
    return errs;
  }

  function validateForActivation(): string[] {
    const issues: string[] = [];
    if (!form.productName.trim()) issues.push('Product Name is required.');
    if (!form.productType) issues.push('Product Type is required.');
    if (!form.productClass) issues.push('Product Class is required.');
    if (!form.productCategory) issues.push('Product Category is required.');
    if (!form.baseUOM) issues.push('Base UOM is required.');
    if (!form.effectiveFromDate) issues.push('Effective From Date is required.');
    if (scopeMappings.length === 0) issues.push('At least one Scope mapping is required.');
    return issues;
  }

  // ── Save Draft ─────────────────────────────────────────────────────────────
  function handleSaveDraft() {
    const errs = validateForSave();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      showToast('Please fix validation errors before saving.', 'error');
      return;
    }
    const data = buildProduct();
    if (isNew) {
      productMasterService.create(data);
      showToast('Product saved as Draft.', 'success');
    } else if (existing) {
      productMasterService.update(existing.id, data);
      showToast('Draft saved.', 'success');
    }
    navigate('/admin/product-master');
  }

  // ── Activate ───────────────────────────────────────────────────────────────
  function handleActivateRequest() {
    const issues = validateForActivation();
    setActivationIssues(issues);
    setActivateOpen(true);
  }

  function confirmActivate() {
    if (!existing) return;
    const data = buildProduct();
    productMasterService.update(existing.id, { ...data, productStatus: 'Active' });
    setActivateOpen(false);
    showToast(`"${form.productName}" activated.`, 'success');
    navigate('/admin/product-master');
  }

  function confirmInactivate() {
    if (!existing) return;
    productMasterService.inactivate(existing.id);
    setInactivateOpen(false);
    showToast(`"${form.productName}" inactivated.`, 'success');
    navigate('/admin/product-master');
  }

  function confirmDelete() {
    if (!existing) return;
    productMasterService.delete(existing.id);
    setDeleteOpen(false);
    navigate('/admin/product-master');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ── STEP 0: PRODUCT IDENTITY ─────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────

  function renderStep0() {
    const step0Tabs = [
      { key: 'definition',     label: 'Definition' },
      { key: 'classification', label: 'Classification' },
      { key: 'hierarchy',      label: 'Hierarchy' },
    ];

    return (
      <div>
        <TabBar tabs={step0Tabs} active={step0Tab} onChange={(k) => setStep0Tab(k as typeof step0Tab)} />

        {step0Tab === 'definition' && (
          <div style={sectionCard}>
            <div style={sCardHead}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>Product Definition</span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Basic identity and operational nature of the product</span>
            </div>
            <div style={sCardBody}>
              {/* Product Code — auto-generated, read-only for existing */}
              <div style={fw}>
                <label style={labelBase}>Product Code</label>
                <input
                  type="text"
                  value={form.productCode || (isNew ? '(auto-generated on save)' : '')}
                  readOnly
                  style={inputReadOnly}
                  placeholder="Auto-generated on save"
                />
                <p style={{ ...fieldErrTxt, color: 'var(--color-text-muted)', marginTop: '4px' }}>Product Code is auto-generated and cannot be changed after transactions exist.</p>
              </div>

              <div style={{ ...twoCol, marginBottom: '14px' }}>
                <div>
                  <label style={labelBase}>Product Name <span style={{ color: '#DC2626' }}>*</span></label>
                  <input
                    type="text"
                    value={form.productName}
                    onChange={(e) => setField('productName', e.target.value)}
                    style={fieldErrors.productName ? { ...inputBase, border: '1px solid #FCA5A5' } : inputBase}
                    placeholder="e.g. Royale Aspira 20L Shade 101"
                    disabled={isViewOnly}
                  />
                  {fieldErrors.productName && <p style={fieldErrTxt}>{fieldErrors.productName}</p>}
                </div>
                <div>
                  <label style={labelBase}>Product Type <span style={{ color: '#DC2626' }}>*</span></label>
                  <select
                    value={form.productType}
                    onChange={(e) => setField('productType', e.target.value as ProductType)}
                    style={fieldErrors.productType ? { ...inputBase, border: '1px solid #FCA5A5' } : inputBase}
                    disabled={isViewOnly || !!existing}
                  >
                    <option value="">Select type…</option>
                    {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {fieldErrors.productType && <p style={fieldErrTxt}>{fieldErrors.productType}</p>}
                  {existing && <p style={{ ...fieldErrTxt, color: 'var(--color-text-muted)', marginTop: '4px' }}>Product Type cannot be changed after the record is created.</p>}
                  {form.productType && !existing && (
                    <p style={{ fontSize: '11px', color: 'var(--color-primary)', marginTop: '4px' }}>
                      {PRODUCT_TYPE_HIDES_PACKAGING[form.productType as ProductType] && '• Packaging section will be hidden. '}
                      {(PRODUCT_TYPE_HIDDEN_CONFIG_TABS[form.productType as ProductType] ?? []).length > 0 && '• Some configuration sections will be adapted.'}
                    </p>
                  )}
                </div>
              </div>

              <div style={fw}>
                <label style={labelBase}>Product Description</label>
                <textarea
                  value={form.productDescription}
                  onChange={(e) => setField('productDescription', e.target.value)}
                  style={{ ...inputBase, resize: 'vertical', minHeight: '72px' }}
                  placeholder="Detailed description of the product…"
                  disabled={isViewOnly}
                />
              </div>

              <div style={{ ...twoCol, marginBottom: '14px' }}>
                <div>
                  <label style={labelBase}>Manufacturer / OEM</label>
                  <input type="text" value={form.manufacturerOEM} onChange={(e) => setField('manufacturerOEM', e.target.value)} style={inputBase} placeholder="e.g. Asian Paints Ltd." disabled={isViewOnly} />
                </div>
                <div>
                  <label style={labelBase}>Country of Origin</label>
                  <select value={form.countryOfOrigin} onChange={(e) => setField('countryOfOrigin', e.target.value)} style={inputBase} disabled={isViewOnly}>
                    <option value="">Select country…</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={twoCol}>
                <div>
                  <label style={labelBase}>Country of Assembly</label>
                  <select value={form.countryOfAssembly} onChange={(e) => setField('countryOfAssembly', e.target.value)} style={inputBase} disabled={isViewOnly}>
                    <option value="">Select country…</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {step0Tab === 'classification' && (
          <div style={sectionCard}>
            <div style={sCardHead}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Product Classification</span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Business grouping: Class → Category → Sub-category</span>
            </div>
            <div style={sCardBody}>
              <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'var(--color-surface-subtle)', borderRadius: '8px', fontSize: '12px', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                Select Product Class first. Category and Sub-category will filter based on your selection.
              </div>
              <div style={{ ...threeCol, marginBottom: '14px' }}>
                <div>
                  <label style={labelBase}>Product Class <span style={{ color: '#DC2626' }}>*</span></label>
                  <select value={form.productClass} onChange={(e) => setProductClass(e.target.value)} style={inputBase} disabled={isViewOnly}>
                    <option value="">Select class…</option>
                    {MOCK_PRODUCT_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelBase}>Product Category</label>
                  <select value={form.productCategory} onChange={(e) => setProductCategory(e.target.value)} style={{ ...inputBase, opacity: !form.productClass ? 0.5 : 1 }} disabled={isViewOnly || !form.productClass}>
                    <option value="">{!form.productClass ? '— Select Class first —' : 'Select category…'}</option>
                    {availableCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelBase}>Product Sub-category</label>
                  <select value={form.productSubCategory} onChange={(e) => setField('productSubCategory', e.target.value)} style={{ ...inputBase, opacity: !form.productCategory ? 0.5 : 1 }} disabled={isViewOnly || !form.productCategory}>
                    <option value="">{!form.productCategory ? '— Select Category first —' : 'Select sub-category…'}</option>
                    {availableSubCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {form.productClass && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
                  {form.productClass && <span style={pillStyle('#1D4ED8', '#EFF6FF')}>{form.productClass}</span>}
                  {form.productCategory && <><span style={{ color: 'var(--color-text-muted)', fontSize: '12px', alignSelf: 'center' }}>›</span><span style={pillStyle('#0891B2', '#ECFEFF')}>{form.productCategory}</span></>}
                  {form.productSubCategory && <><span style={{ color: 'var(--color-text-muted)', fontSize: '12px', alignSelf: 'center' }}>›</span><span style={pillStyle('#7C3AED', '#F5F3FF')}>{form.productSubCategory}</span></>}
                </div>
              )}
            </div>
          </div>
        )}

        {step0Tab === 'hierarchy' && (
          <div style={sectionCard}>
            <div style={sCardHead}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Product Hierarchy</span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Brand → Family → Line/Series → Model → Variant → SKU (cascading)</span>
            </div>
            <div style={sCardBody}>
              <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'var(--color-surface-subtle)', borderRadius: '8px', fontSize: '12px', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                Select each level in order. Downstream levels will filter automatically.
              </div>

              <div style={{ ...twoCol, marginBottom: '14px' }}>
                <div>
                  <label style={labelBase}>Brand <span style={{ color: '#DC2626' }}>*</span></label>
                  <select value={form.brand} onChange={(e) => setBrand(e.target.value)} style={inputBase} disabled={isViewOnly}>
                    <option value="">Select brand…</option>
                    {MOCK_BRANDS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelBase}>Product Family</label>
                  <select value={form.productFamily} onChange={(e) => setProductFamily(e.target.value)} style={{ ...inputBase, opacity: !form.brand ? 0.5 : 1 }} disabled={isViewOnly || !form.brand}>
                    <option value="">{!form.brand ? '— Select Brand first —' : 'Select product family…'}</option>
                    {availableFamilies.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ ...twoCol, marginBottom: '14px' }}>
                <div>
                  <label style={labelBase}>Product Line / Series</label>
                  <select value={form.productLine} onChange={(e) => setProductLine(e.target.value)} style={{ ...inputBase, opacity: !form.productFamily ? 0.5 : 1 }} disabled={isViewOnly || !form.productFamily}>
                    <option value="">{!form.productFamily ? '— Select Family first —' : 'Select product line…'}</option>
                    {availableLines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelBase}>Model / Base Product</label>
                  <input type="text" value={form.modelBaseProduct} onChange={(e) => setField('modelBaseProduct', e.target.value)} style={{ ...inputBase, opacity: !form.productLine ? 0.5 : 1 }} placeholder={!form.productLine ? '— Select Line first —' : 'e.g. Royale Aspira'} disabled={isViewOnly || !form.productLine} />
                </div>
              </div>

              <div style={{ ...twoCol, marginBottom: '14px' }}>
                <div>
                  <label style={labelBase}>Variant / Configuration</label>
                  <input type="text" value={form.variantConfiguration} onChange={(e) => setField('variantConfiguration', e.target.value)} style={inputBase} placeholder="e.g. 20L / Shade 101 / Matte" disabled={isViewOnly} />
                </div>
                <div>
                  <label style={labelBase}>SKU / Trade Item <span style={{ color: '#DC2626' }}>*</span></label>
                  <input type="text" value={form.skuTradeItem} onChange={(e) => setField('skuTradeItem', e.target.value)} style={inputBase} placeholder="Transaction-level product identifier" disabled={isViewOnly} />
                  <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>This is the final sellable/purchasable/stockable item used in transactions.</p>
                </div>
              </div>

              {/* Hierarchy breadcrumb visual */}
              {(form.brand || form.productFamily || form.modelBaseProduct || form.skuTradeItem) && (
                <div style={{ marginTop: '16px', padding: '12px 16px', background: 'var(--color-surface-subtle)', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '12px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '4px' }}>Path</span>
                  {form.brand && <><span style={pillStyle('#15803D', '#DCFCE7')}>{MOCK_BRANDS.find((b) => b.id === form.brand)?.name ?? form.brand}</span><span style={{ color: 'var(--color-text-muted)' }}>›</span></>}
                  {form.productFamily && <><span style={pillStyle('#0891B2', '#ECFEFF')}>{availableFamilies.find((f) => f.id === form.productFamily)?.name ?? form.productFamily}</span><span style={{ color: 'var(--color-text-muted)' }}>›</span></>}
                  {form.productLine && <><span style={pillStyle('#7C3AED', '#F5F3FF')}>{availableLines.find((l) => l.id === form.productLine)?.name ?? form.productLine}</span><span style={{ color: 'var(--color-text-muted)' }}>›</span></>}
                  {form.modelBaseProduct && <><span style={pillStyle('#B45309', '#FFFBEB')}>{form.modelBaseProduct}</span><span style={{ color: 'var(--color-text-muted)' }}>›</span></>}
                  {form.variantConfiguration && <><span style={pillStyle('#BE185D', '#FDF2F8')}>{form.variantConfiguration}</span><span style={{ color: 'var(--color-text-muted)' }}>›</span></>}
                  {form.skuTradeItem && <span style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '12px' }}>📦 {form.skuTradeItem}</span>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ── STEP 1: SCOPE & OPERATIONS ───────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────

  function renderStep1() {
    const step1Tabs = [
      { key: 'scope',     label: 'Scope & Applicability' },
      { key: 'uom',       label: 'Unit of Measurement' },
      ...(hidesPackaging ? [] : [{ key: 'packaging', label: 'Packaging' }]),
    ];

    function addScopeRow() {
      setScopeMappings((prev) => [...prev, {
        id: `SCM-${Date.now()}`, scopeType: 'Local', scopeDimension: 'Organization',
        scopeValue: '', scopeActivationStatus: 'Active', effectiveFromDate: '', effectiveToDate: '',
      }]);
    }
    function updateScopeRow(id: string, field: keyof ProductScopeMapping, value: string) {
      setScopeMappings((prev) => prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        // Reset scope value when dimension changes
        if (field === 'scopeDimension') updated.scopeValue = '';
        return updated;
      }));
    }
    function removeScopeRow(id: string) {
      setScopeMappings((prev) => prev.filter((r) => r.id !== id));
    }

    function addUOMRow() {
      setApplicableUOMs((prev) => [...prev, {
        id: `UOM-${Date.now()}`, applicableUOM: '', conversionReference: '', conversionToBaseUOM: '',
      }]);
    }
    function updateUOMRow(id: string, field: string, value: string) {
      setApplicableUOMs((prev) => prev.map((r) => {
        if (r.id !== id) return r;
        if (field === 'conversionReference') {
          const conv = MOCK_UOM_CONVERSIONS.find((c) => c.label === value);
          return { ...r, conversionReference: value, conversionToBaseUOM: conv?.conversionDisplay ?? '' };
        }
        return { ...r, [field]: value };
      }));
    }
    function removeUOMRow(id: string) {
      setApplicableUOMs((prev) => prev.filter((r) => r.id !== id));
    }

    function addPackagingRow() {
      setPackagingRows((prev) => [...prev, {
        id: `PKG-${Date.now()}`, packType: '', packSize: '', packMaterial: '',
        packagingDescription: '', purchaseSetQuantity: '', salesSetQuantity: '', organizationType: '',
      }]);
    }
    function updatePackagingRow(id: string, field: string, value: string) {
      setPackagingRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
    }
    function removePackagingRow(id: string) {
      setPackagingRows((prev) => prev.filter((r) => r.id !== id));
    }

    return (
      <div>
        <TabBar tabs={step1Tabs} active={step1Tab} onChange={(k) => setStep1Tab(k as typeof step1Tab)} />

        {step1Tab === 'scope' && (
          <div style={sectionCard}>
            <div style={sCardHead}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Scope & Applicability</span>
              <button type="button" onClick={addScopeRow} disabled={isViewOnly}
                style={{ ...btnOutline, padding: '5px 12px', fontSize: '12px', opacity: isViewOnly ? 0.4 : 1 }}>
                <Plus size={12} /> Add Scope
              </button>
            </div>
            {scopeMappings.length === 0 ? (
              <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                No scope mappings defined. Click "Add Scope" to define where this product is applicable.
              </div>
            ) : (
              <div>
                {GridHead(['Scope Type', 'Dimension', 'Scope Value', 'Status', 'Effective From', 'Effective To'])}
                {scopeMappings.map((row) => {
                  const scopeValueOptions = MOCK_SCOPE_VALUES[row.scopeDimension] ?? [];
                  return (
                    <div key={row.id} style={ROW_STYLE}>
                      <div style={{ flex: 1 }}>
                        <select value={row.scopeType} onChange={(e) => updateScopeRow(row.id, 'scopeType', e.target.value)} style={{ ...inputBase, padding: '6px 8px', fontSize: '12px' }} disabled={isViewOnly}>
                          {SCOPE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <select value={row.scopeDimension} onChange={(e) => updateScopeRow(row.id, 'scopeDimension', e.target.value)} style={{ ...inputBase, padding: '6px 8px', fontSize: '12px' }} disabled={isViewOnly}>
                          {SCOPE_DIMENSIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <select value={row.scopeValue} onChange={(e) => updateScopeRow(row.id, 'scopeValue', e.target.value)} style={{ ...inputBase, padding: '6px 8px', fontSize: '12px' }} disabled={isViewOnly}>
                          <option value="">Select…</option>
                          {scopeValueOptions.map((v) => <option key={v.id} value={v.name}>{v.name}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <select value={row.scopeActivationStatus} onChange={(e) => updateScopeRow(row.id, 'scopeActivationStatus', e.target.value)} style={{ ...inputBase, padding: '6px 8px', fontSize: '12px' }} disabled={isViewOnly}>
                          {SCOPE_ACTIVATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <input type="date" value={row.effectiveFromDate} onChange={(e) => updateScopeRow(row.id, 'effectiveFromDate', e.target.value)} style={{ ...inputBase, padding: '6px 8px', fontSize: '12px' }} disabled={isViewOnly} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <input type="date" value={row.effectiveToDate} onChange={(e) => updateScopeRow(row.id, 'effectiveToDate', e.target.value)} style={{ ...inputBase, padding: '6px 8px', fontSize: '12px' }} disabled={isViewOnly} />
                      </div>
                      <RowDeleteBtn onClick={() => removeScopeRow(row.id)} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {step1Tab === 'uom' && (
          <div>
            {/* Base UOM header */}
            <div style={{ ...sectionCard, marginBottom: '16px' }}>
              <div style={sCardHead}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Base UOM</span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Primary anchor unit for all conversions</span>
              </div>
              <div style={{ ...sCardBody, paddingBottom: '16px' }}>
                <div style={{ maxWidth: '320px' }}>
                  <label style={labelBase}>Base UOM <span style={{ color: '#DC2626' }}>*</span></label>
                  <select value={form.baseUOM} onChange={(e) => setField('baseUOM', e.target.value)} style={inputBase} disabled={isViewOnly}>
                    <option value="">Select base UOM…</option>
                    {UOMS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Applicable UOM grid */}
            <div style={sectionCard}>
              <div style={sCardHead}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Applicable UOMs</span>
                <button type="button" onClick={addUOMRow} disabled={isViewOnly || !form.baseUOM}
                  style={{ ...btnOutline, padding: '5px 12px', fontSize: '12px', opacity: (isViewOnly || !form.baseUOM) ? 0.4 : 1 }}
                  title={!form.baseUOM ? 'Set Base UOM first' : ''}>
                  <Plus size={12} /> Add UOM
                </button>
              </div>
              {!form.baseUOM && (
                <div style={{ padding: '20px 24px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Set a Base UOM above before adding applicable UOMs.
                </div>
              )}
              {form.baseUOM && applicableUOMs.length === 0 && (
                <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                  No applicable UOMs added. Click "Add UOM" to define alternative units of measure.
                </div>
              )}
              {applicableUOMs.length > 0 && (
                <div>
                  {GridHead(['Applicable UOM', 'Conversion Reference', 'Conversion to Base UOM (read-only)'])}
                  {applicableUOMs.map((row) => (
                    <div key={row.id} style={ROW_STYLE}>
                      <div style={{ flex: 1 }}>
                        <select value={row.applicableUOM} onChange={(e) => updateUOMRow(row.id, 'applicableUOM', e.target.value)} style={{ ...inputBase, padding: '6px 8px', fontSize: '12px' }} disabled={isViewOnly}>
                          <option value="">Select UOM…</option>
                          {UOMS.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <select value={row.conversionReference} onChange={(e) => updateUOMRow(row.id, 'conversionReference', e.target.value)} style={{ ...inputBase, padding: '6px 8px', fontSize: '12px' }} disabled={isViewOnly}>
                          <option value="">Select conversion…</option>
                          {MOCK_UOM_CONVERSIONS.map((c) => <option key={c.id} value={c.label}>{c.label}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <input
                          type="text"
                          value={row.conversionToBaseUOM}
                          readOnly
                          style={{ ...inputReadOnly, padding: '6px 8px', fontSize: '12px' }}
                          placeholder="Auto-filled from Conversion Master"
                        />
                      </div>
                      <RowDeleteBtn onClick={() => removeUOMRow(row.id)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step1Tab === 'packaging' && !hidesPackaging && (
          <div style={sectionCard}>
            <div style={sCardHead}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Packaging</span>
              <button type="button" onClick={addPackagingRow} disabled={isViewOnly}
                style={{ ...btnOutline, padding: '5px 12px', fontSize: '12px', opacity: isViewOnly ? 0.4 : 1 }}>
                <Plus size={12} /> Add Packaging Row
              </button>
            </div>
            {packagingRows.length === 0 ? (
              <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                No packaging rows defined. Click "Add Packaging Row" to capture commercial packaging details.
              </div>
            ) : (
              <div>
                {GridHead(['Pack Type', 'Pack Size', 'Material', 'Description', 'Pur. Set Qty', 'Sales Set Qty', 'Org Type'])}
                {packagingRows.map((row) => (
                  <div key={row.id} style={{ ...ROW_STYLE, gap: '6px' }}>
                    {(['packType', 'packSize', 'packMaterial', 'packagingDescription', 'purchaseSetQuantity', 'salesSetQuantity', 'organizationType'] as const).map((field) => (
                      <div key={field} style={{ flex: 1 }}>
                        {field === 'packType' ? (
                          <select value={row.packType} onChange={(e) => updatePackagingRow(row.id, field, e.target.value)} style={{ ...inputBase, padding: '6px 8px', fontSize: '12px' }} disabled={isViewOnly}>
                            <option value="">—</option>
                            {PACK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        ) : field === 'packMaterial' ? (
                          <select value={row.packMaterial} onChange={(e) => updatePackagingRow(row.id, field, e.target.value)} style={{ ...inputBase, padding: '6px 8px', fontSize: '12px' }} disabled={isViewOnly}>
                            <option value="">—</option>
                            {PACK_MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
                          </select>
                        ) : field === 'organizationType' ? (
                          <select value={row.organizationType} onChange={(e) => updatePackagingRow(row.id, field, e.target.value)} style={{ ...inputBase, padding: '6px 8px', fontSize: '12px' }} disabled={isViewOnly}>
                            <option value="">—</option>
                            {ORG_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input
                            type={field === 'purchaseSetQuantity' || field === 'salesSetQuantity' ? 'number' : 'text'}
                            value={row[field]}
                            onChange={(e) => updatePackagingRow(row.id, field, e.target.value)}
                            style={{ ...inputBase, padding: '6px 8px', fontSize: '12px' }}
                            placeholder={field === 'purchaseSetQuantity' ? 'Pur. Qty' : field === 'salesSetQuantity' ? 'Sales Qty' : field === 'packSize' ? 'e.g. 20L' : ''}
                            disabled={isViewOnly}
                          />
                        )}
                      </div>
                    ))}
                    <RowDeleteBtn onClick={() => removePackagingRow(row.id)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ── STEP 2: CONFIGURATION ────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────

  function renderStep2() {
    // Build tabs based on product type visibility rules
    const allConfigTabs = [
      { key: 'inventory',  label: 'Inventory Config', index: 0 },
      { key: 'sales',      label: 'Sales Config',      index: 1 },
      { key: 'purchase',   label: 'Purchase Config',   index: 2 },
      { key: 'dimensions', label: 'Dimensions',         index: 3 },
    ];
    const visibleConfigTabs = allConfigTabs.filter((t) => !hiddenConfigTabs.includes(t.index));

    // If current tab is hidden, auto-redirect to first visible
    const step2TabVisible = visibleConfigTabs.some((t) => t.key === step2Tab);
    const effectiveStep2Tab = step2TabVisible ? step2Tab : (visibleConfigTabs[0]?.key ?? 'inventory');

    function toggleSalesChannel(channel: string) {
      setField('salesChannelEligibility', form.salesChannelEligibility.includes(channel)
        ? form.salesChannelEligibility.filter((c) => c !== channel)
        : [...form.salesChannelEligibility, channel]
      );
    }

    return (
      <div>
        {visibleConfigTabs.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            <p style={{ fontWeight: 600, marginBottom: '8px' }}>No configuration sections apply to this product type.</p>
            <p style={{ margin: 0 }}>Service products do not have inventory configuration or dimensions.</p>
          </div>
        ) : (
          <>
            <TabBar tabs={visibleConfigTabs} active={effectiveStep2Tab} onChange={(k) => setStep2Tab(k as typeof step2Tab)} />

            {effectiveStep2Tab === 'inventory' && (
              <div style={sectionCard}>
                <div style={sCardHead}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Inventory Configuration</span>
                </div>
                <div style={sCardBody}>
                  {/* Tracking toggles */}
                  <div style={{ marginBottom: '20px' }}>
                    <p style={labelBase}>Stock & Tracking</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      {([
                        ['stockableIndicator',         'Stockable',         'Maintains inventory ledger'],
                        ['serializedTrackingRequired', 'Serialized Tracking', 'Tracks individual units (vehicles, equipment)'],
                        ['batchTrackingRequired',      'Batch Tracking',    'Tracks production/receipt batch'],
                        ['lotTrackingRequired',        'Lot Tracking',      'Tracks lot grouping'],
                        ['warrantyApplicable',         'Warranty Applicable', 'Warranty applies to this product'],
                      ] as [keyof CoreForm, string, string][]).map(([field, label, desc]) => (
                        <label key={field} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', border: `1.5px solid ${form[field] ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: '10px', cursor: isViewOnly ? 'not-allowed' : 'pointer', background: form[field] ? 'color-mix(in srgb, var(--color-primary) 5%, white)' : 'var(--color-surface)', minWidth: '200px', flex: '0 1 calc(50% - 6px)', transition: 'all 0.12s' }}>
                          <input type="checkbox" checked={form[field] as boolean} onChange={(e) => setField(field, e.target.checked as CoreForm[typeof field])} style={{ marginTop: '2px', accentColor: 'var(--color-primary)' }} disabled={isViewOnly} />
                          <div>
                            <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>{label}</p>
                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>{desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={twoCol}>
                    <div>
                      <label style={labelBase}>Consumption Strategy</label>
                      <select value={form.consumptionStrategy} onChange={(e) => setField('consumptionStrategy', e.target.value as ConsumptionStrategy)} style={inputBase} disabled={isViewOnly}>
                        <option value="">Select strategy…</option>
                        {CONSUMPTION_STRATEGIES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelBase}>Storage Condition</label>
                      <input type="text" value={form.storageCondition} onChange={(e) => setField('storageCondition', e.target.value)} style={inputBase} placeholder="e.g. Store in cool, dry place" disabled={isViewOnly} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {effectiveStep2Tab === 'sales' && (
              <div style={sectionCard}>
                <div style={sCardHead}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Sales Configuration</span>
                </div>
                <div style={sCardBody}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', border: `1.5px solid ${form.sellableIndicator ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: '10px', cursor: isViewOnly ? 'not-allowed' : 'pointer', background: form.sellableIndicator ? 'color-mix(in srgb, var(--color-primary) 5%, white)' : 'var(--color-surface)', maxWidth: '340px', transition: 'all 0.12s' }}>
                      <input type="checkbox" checked={form.sellableIndicator} onChange={(e) => setField('sellableIndicator', e.target.checked)} style={{ marginTop: '2px', accentColor: 'var(--color-primary)' }} disabled={isViewOnly} />
                      <div>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: 600 }}>Sellable Indicator</p>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>Product can be selected in sales documents</p>
                      </div>
                    </label>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelBase}>Sales Channel Eligibility</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                      {SALES_CHANNELS.map((ch) => {
                        const selected = form.salesChannelEligibility.includes(ch);
                        return (
                          <button key={ch} type="button" onClick={() => !isViewOnly && toggleSalesChannel(ch)}
                            style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 500, border: `1.5px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: '20px', cursor: isViewOnly ? 'default' : 'pointer', background: selected ? 'color-mix(in srgb, var(--color-primary) 10%, white)' : 'var(--color-surface)', color: selected ? 'var(--color-primary)' : 'var(--color-text-muted)', transition: 'all 0.12s' }}>
                            {ch}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ maxWidth: '440px' }}>
                    <label style={labelBase}>Sales Discontinuation Behavior</label>
                    <select value={form.salesDiscontinuationBehavior} onChange={(e) => setField('salesDiscontinuationBehavior', e.target.value as SalesDiscontinuationBehavior)} style={inputBase} disabled={isViewOnly}>
                      <option value="">Select behavior…</option>
                      {SALES_DISCONTINUATION_BEHAVIORS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {effectiveStep2Tab === 'purchase' && (
              <div style={sectionCard}>
                <div style={sCardHead}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Purchase Configuration</span>
                </div>
                <div style={sCardBody}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', border: `1.5px solid ${form.purchasableIndicator ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: '10px', cursor: isViewOnly ? 'not-allowed' : 'pointer', background: form.purchasableIndicator ? 'color-mix(in srgb, var(--color-primary) 5%, white)' : 'var(--color-surface)', maxWidth: '340px', transition: 'all 0.12s' }}>
                      <input type="checkbox" checked={form.purchasableIndicator} onChange={(e) => setField('purchasableIndicator', e.target.checked)} style={{ marginTop: '2px', accentColor: 'var(--color-primary)' }} disabled={isViewOnly} />
                      <div>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: 600 }}>Purchasable Indicator</p>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>Product can be selected in purchase documents</p>
                      </div>
                    </label>
                  </div>

                  <div style={{ maxWidth: '440px' }}>
                    <label style={labelBase}>Purchase Discontinuation Behavior</label>
                    <select value={form.purchaseDiscontinuationBehavior} onChange={(e) => setField('purchaseDiscontinuationBehavior', e.target.value as PurchaseDiscontinuationBehavior)} style={inputBase} disabled={isViewOnly}>
                      <option value="">Select behavior…</option>
                      {PURCHASE_DISCONTINUATION_BEHAVIORS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {effectiveStep2Tab === 'dimensions' && (
              <div style={sectionCard}>
                <div style={sCardHead}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Product Dimensions</span>
                </div>
                <div style={sCardBody}>
                  <div style={{ ...twoCol, marginBottom: '14px' }}>
                    <div>
                      <label style={labelBase}>Weight UOM</label>
                      <select value={form.weightUOM} onChange={(e) => setField('weightUOM', e.target.value)} style={inputBase} disabled={isViewOnly}>
                        {WEIGHT_UOMS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelBase}>Dimension UOM</label>
                      <select value={form.dimensionUOM} onChange={(e) => setField('dimensionUOM', e.target.value)} style={inputBase} disabled={isViewOnly}>
                        {DIMENSION_UOMS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ ...twoCol, marginBottom: '14px' }}>
                    <div>
                      <label style={labelBase}>Net Weight ({form.weightUOM || 'kg'})</label>
                      <input type="number" value={form.netWeight} onChange={(e) => setField('netWeight', e.target.value)} style={inputBase} placeholder="e.g. 24.5" disabled={isViewOnly} />
                    </div>
                    <div>
                      <label style={labelBase}>Gross Weight ({form.weightUOM || 'kg'})</label>
                      <input type="number" value={form.grossWeight} onChange={(e) => setField('grossWeight', e.target.value)} style={inputBase} placeholder="e.g. 25.8" disabled={isViewOnly} />
                      {form.netWeight && form.grossWeight && parseFloat(form.grossWeight) < parseFloat(form.netWeight) && (
                        <p style={fieldErrTxt}>Gross Weight must be ≥ Net Weight.</p>
                      )}
                    </div>
                  </div>

                  <div style={threeCol}>
                    {(['length', 'width', 'height'] as const).map((field) => (
                      <div key={field}>
                        <label style={labelBase}>{field.charAt(0).toUpperCase() + field.slice(1)} ({form.dimensionUOM || 'mm'})</label>
                        <input type="number" value={form[field]} onChange={(e) => setField(field, e.target.value)} style={inputBase} placeholder="e.g. 320" disabled={isViewOnly} />
                      </div>
                    ))}
                  </div>

                  <div style={{ ...twoCol, marginTop: '14px' }}>
                    <div>
                      <label style={labelBase}>Volume (m³)</label>
                      <input type="number" value={form.volume} onChange={(e) => setField('volume', e.target.value)} style={inputBase} placeholder="e.g. 0.040" disabled={isViewOnly} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ── STEP 3: MORE DETAILS ─────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────

  function renderStep3() {
    const step3Tabs = [
      { key: 'identifiers',   label: 'Product Identifiers' },
      { key: 'associations',  label: 'Product Associations' },
      { key: 'status',        label: 'Status & Availability' },
    ];

    function addIdentifierRow() {
      setProductIdentifiers((prev) => [...prev, { id: `PID-${Date.now()}`, identifierType: '', identifierValue: '' }]);
    }
    function updateIdentifierRow(id: string, field: string, value: string) {
      setProductIdentifiers((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
    }
    function removeIdentifierRow(id: string) {
      setProductIdentifiers((prev) => prev.filter((r) => r.id !== id));
    }

    function addAssociationRow() {
      setProductAssociations((prev) => [...prev, {
        id: `PAS-${Date.now()}`, associationType: '', relatedProductCode: '', relatedProductName: '',
      }]);
    }
    function updateAssociationRow(id: string, field: string, value: string) {
      setProductAssociations((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
    }
    function removeAssociationRow(id: string) {
      setProductAssociations((prev) => prev.filter((r) => r.id !== id));
    }

    return (
      <div>
        <TabBar tabs={step3Tabs} active={step3Tab} onChange={(k) => setStep3Tab(k as typeof step3Tab)} />

        {step3Tab === 'identifiers' && (
          <div style={sectionCard}>
            <div style={sCardHead}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Product Identifiers</span>
              <button type="button" onClick={addIdentifierRow} disabled={isViewOnly}
                style={{ ...btnOutline, padding: '5px 12px', fontSize: '12px', opacity: isViewOnly ? 0.4 : 1 }}>
                <Plus size={12} /> Add Identifier
              </button>
            </div>
            {productIdentifiers.length === 0 ? (
              <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                No identifiers added. Use "Add Identifier" to capture GTIN, HSN, OEM Part No., etc.
              </div>
            ) : (
              <div>
                {GridHead(['Identifier Type', 'Identifier Value'])}
                {productIdentifiers.map((row) => (
                  <div key={row.id} style={ROW_STYLE}>
                    <div style={{ flex: 1 }}>
                      <select value={row.identifierType} onChange={(e) => updateIdentifierRow(row.id, 'identifierType', e.target.value)} style={{ ...inputBase, padding: '6px 8px', fontSize: '12px' }} disabled={isViewOnly}>
                        <option value="">Select type…</option>
                        {IDENTIFIER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 2 }}>
                      <input
                        type="text"
                        value={row.identifierValue}
                        onChange={(e) => updateIdentifierRow(row.id, 'identifierValue', e.target.value)}
                        style={{ ...inputBase, padding: '6px 8px', fontSize: '12px' }}
                        placeholder={row.identifierType === 'GTIN' ? '14-digit GTIN' : row.identifierType === 'HSN' ? '4-8 digit HSN' : 'Enter value…'}
                        disabled={isViewOnly}
                      />
                    </div>
                    <RowDeleteBtn onClick={() => removeIdentifierRow(row.id)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step3Tab === 'associations' && (
          <div style={sectionCard}>
            <div style={sCardHead}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Product Associations</span>
              <button type="button" onClick={addAssociationRow} disabled={isViewOnly}
                style={{ ...btnOutline, padding: '5px 12px', fontSize: '12px', opacity: isViewOnly ? 0.4 : 1 }}>
                <Plus size={12} /> Add Association
              </button>
            </div>
            {productAssociations.length === 0 ? (
              <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                No associations defined. Use "Add Association" to link alternate products or supersession.
                {showsKitComponents && <p style={{ marginTop: '8px', color: 'var(--color-primary)', fontWeight: 500 }}>This is a Kit product — add Kit Component associations to define what this kit contains.</p>}
              </div>
            ) : (
              <div>
                {GridHead(['Association Type', 'Related Product Code', 'Related Product Name'])}
                {productAssociations.map((row) => (
                  <div key={row.id} style={ROW_STYLE}>
                    <div style={{ flex: 1 }}>
                      <select value={row.associationType} onChange={(e) => updateAssociationRow(row.id, 'associationType', e.target.value)} style={{ ...inputBase, padding: '6px 8px', fontSize: '12px' }} disabled={isViewOnly}>
                        <option value="">Select type…</option>
                        {ASSOCIATION_TYPES.filter((t) => showsKitComponents || t !== 'Kit Component').map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <input type="text" value={row.relatedProductCode} onChange={(e) => updateAssociationRow(row.id, 'relatedProductCode', e.target.value)} style={{ ...inputBase, padding: '6px 8px', fontSize: '12px', fontFamily: 'monospace' }} placeholder="PRD-XXXX" disabled={isViewOnly} />
                    </div>
                    <div style={{ flex: 2 }}>
                      <input type="text" value={row.relatedProductName} onChange={(e) => updateAssociationRow(row.id, 'relatedProductName', e.target.value)} style={{ ...inputBase, padding: '6px 8px', fontSize: '12px' }} placeholder="Product name…" disabled={isViewOnly} />
                    </div>
                    <RowDeleteBtn onClick={() => removeAssociationRow(row.id)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step3Tab === 'status' && (
          <div style={sectionCard}>
            <div style={sCardHead}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Status & Availability</span>
            </div>
            <div style={sCardBody}>
              {/* Current status display */}
              {existing && (
                <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--color-surface-subtle)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Current Status</span>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
                    fontSize: '12px', fontWeight: 600, borderRadius: '9999px',
                    ...(status === 'Active' ? { background: '#DCFCE7', color: '#15803D' }
                      : status === 'Inactive' ? { background: '#FEF2F2', color: '#DC2626' }
                      : status === 'Discontinued' ? { background: '#FEF3C7', color: '#92400E' }
                      : { background: '#EFF6FF', color: '#1D4ED8' }),
                  }}>{status}</span>
                </div>
              )}

              <div style={{ ...twoCol, marginBottom: '14px' }}>
                <div>
                  <label style={labelBase}>Effective From Date <span style={{ color: '#DC2626' }}>*</span></label>
                  <input type="date" value={form.effectiveFromDate} onChange={(e) => setField('effectiveFromDate', e.target.value)} style={inputBase} disabled={isViewOnly} />
                </div>
                <div>
                  <label style={labelBase}>Effective To Date</label>
                  <input type="date" value={form.effectiveToDate} onChange={(e) => setField('effectiveToDate', e.target.value)} style={inputBase} disabled={isViewOnly} />
                  <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Leave blank for indefinite validity.</p>
                </div>
              </div>

              {(isActive || status === 'Discontinued') && (
                <div style={{ maxWidth: '320px' }}>
                  <label style={labelBase}>Discontinuation Date</label>
                  <input type="date" value={form.discontinuationDate} onChange={(e) => setField('discontinuationDate', e.target.value)} style={inputBase} disabled={isViewOnly} />
                  <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Used for discontinuation planning. Triggers sales/purchase discontinuation behavior.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ── Page title ───────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────

  const pageTitle = isNew
    ? 'New Product'
    : (form.productName || existing?.productName || 'Product Record');

  if (notFound) {
    return (
      <AdminShell>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Product not found</h2>
          <button type="button" onClick={() => navigate('/admin/product-master')} style={{ ...btnOutline, marginTop: '16px' }}>← Back to List</button>
        </div>
      </AdminShell>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ── Render ───────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <AdminShell>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, background: toast.tone === 'success' ? '#15803D' : '#DC2626', color: 'white', padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toast.message}
        </div>
      )}

      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-surface)' }}>

        {/* ── Header (64px) ──────────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, padding: '10px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Admin / Products / Product Master</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.25 }}>{pageTitle}</span>
              {form.productType && (
                <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', background: 'var(--color-surface-subtle)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                  {form.productType}
                </span>
              )}
              {existing?.productStatus && (
                <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '11px', fontWeight: 600, padding: '2px 9px', borderRadius: '9999px', border: '1px solid',
                  ...(status === 'Active' ? { background: 'color-mix(in srgb,#10b981 12%,var(--color-surface))', color: 'color-mix(in srgb,#10b981 85%,var(--color-text))', borderColor: 'color-mix(in srgb,#10b981 35%,var(--color-border))' }
                    : status === 'Inactive' ? { background: 'var(--color-surface-subtle)', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }
                    : status === 'Discontinued' ? { background: '#FEF3C7', color: '#92400E', borderColor: '#FDE68A' }
                    : { background: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE' }) }}>
                  {status}
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Configure product identity, hierarchy, scope, UOM, packaging, and operational indicators.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button type="button" onClick={() => navigate('/admin/product-master')} style={btnOutline}>← Back to List</button>
          </div>
        </div>

        {/* ── Middle area: sidebar + body ───────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left step sidebar (220px) */}
          <div style={{ width: '220px', flexShrink: 0, background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)', overflowY: 'auto' }}>
            <MasterFormStepper
              steps={stepperSteps}
              activeStepId={String(activeStep)}
              onStepChange={(stepId) => setActiveStep(Number(stepId))}
            />

            {form.productType && (
              <div style={{ margin: '12px 12px 0', padding: '10px 12px', background: 'var(--color-surface-subtle)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Product Type</p>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>{form.productType}</p>
                {hidesPackaging && <p style={{ margin: '4px 0 0', fontSize: '10px', color: 'var(--color-text-muted)' }}>Packaging hidden</p>}
                {hiddenConfigTabs.length > 0 && <p style={{ margin: '2px 0 0', fontSize: '10px', color: 'var(--color-text-muted)' }}>Some config sections hidden</p>}
              </div>
            )}
          </div>

          {/* Scrollable form body */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px 24px', background: 'var(--color-surface-subtle)' }}>

            {/* Status banners */}
            {isActive && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '10px', marginBottom: '20px' }}>
                <Info size={15} style={{ color: '#EA580C', flexShrink: 0, marginTop: '1px' }} />
                <span style={{ fontSize: '13px', color: '#9A3412', lineHeight: 1.6 }}>
                  This product is <strong>Active</strong>. Product Code and Product Type are locked. All other fields can be updated.
                </span>
              </div>
            )}
            {isInactive && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', background: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: '10px', marginBottom: '20px' }}>
                <AlertCircle size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginTop: '1px' }} />
                <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                  This product is <strong>{status}</strong>. All fields are read-only.
                </span>
              </div>
            )}

            {activeStep === 0 && renderStep0()}
            {activeStep === 1 && renderStep1()}
            {activeStep === 2 && renderStep2()}
            {activeStep === 3 && renderStep3()}
          </div>
        </div>

        {/* ── Footer (60px) ────────────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, height: '60px', padding: '0 24px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button type="button" onClick={() => setActiveStep((s) => Math.max(0, s - 1))} disabled={activeStep === 0}
            style={{ ...btnOutline, opacity: activeStep === 0 ? 0.4 : 1, cursor: activeStep === 0 ? 'default' : 'pointer' }}>
            ← Previous
          </button>

          {canDel && (
            <button type="button" onClick={() => setDeleteOpen(true)}
              style={{ ...btnBase, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', fontWeight: 500 }}>
              Delete
            </button>
          )}

          <div style={{ flex: 1 }} />

          {isActive && (
            <button type="button" onClick={() => setInactivateOpen(true)}
              style={{ ...btnBase, background: 'transparent', color: '#DC2626', border: '1px solid #FCA5A5', fontWeight: 500 }}>
              Inactivate
            </button>
          )}

          {!isInactive && !isActive && (
            <button type="button" onClick={handleSaveDraft} style={btnOutline}>Save Draft</button>
          )}

          {isActive && (
            <button type="button" onClick={handleSaveDraft} style={btnOutline}>Save</button>
          )}

          {!isNew && !isActive && !isInactive && (
            <button type="button" onClick={handleActivateRequest}
              style={{ ...btnPrimary, background: '#16A34A' }}>
              Activate
            </button>
          )}

          {activeStep < STEPS.length - 1 ? (
            <button type="button" onClick={() => setActiveStep((s) => Math.min(STEPS.length - 1, s + 1))} style={btnPrimary}>
              Continue →
            </button>
          ) : (
            !isInactive && (
              <button type="button" onClick={handleSaveDraft} style={btnPrimary}>
                {isNew ? 'Save as Draft' : 'Save Changes'}
              </button>
            )
          )}
        </div>
      </div>

      {/* ── Activate confirmation ─────────────────────────────────────────── */}
      {activateOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '28px', maxWidth: '440px', width: '90%', boxShadow: '0 20px 48px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 700 }}>Activate Product</h3>
            {activationIssues.length > 0 ? (
              <>
                <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#DC2626' }}>The following issues must be resolved before activation:</p>
                <ul style={{ margin: '0 0 16px', padding: '0 0 0 18px', fontSize: '13px', color: '#DC2626', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {activationIssues.map((issue) => <li key={issue}>{issue}</li>)}
                </ul>
                <button type="button" onClick={() => setActivateOpen(false)} style={btnOutline}>Close</button>
              </>
            ) : (
              <>
                <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--color-text-muted)' }}>This will make the product available for transactions. Are you sure?</p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setActivateOpen(false)} style={btnOutline}>Cancel</button>
                  <button type="button" onClick={confirmActivate} style={{ ...btnPrimary, background: '#16A34A' }}>Activate</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Inactivate confirmation ───────────────────────────────────────── */}
      {inactivateOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '28px', maxWidth: '400px', width: '90%', boxShadow: '0 20px 48px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 700 }}>Inactivate Product</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--color-text-muted)' }}>This product will no longer be available for new transactions. Existing transactions will not be affected.</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setInactivateOpen(false)} style={btnOutline}>Cancel</button>
              <button type="button" onClick={confirmInactivate} style={{ ...btnBase, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>Inactivate</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ───────────────────────────────────────────── */}
      {deleteOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '28px', maxWidth: '380px', width: '90%', boxShadow: '0 20px 48px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 700, color: '#DC2626' }}>Delete Draft Product</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--color-text-muted)' }}>This will permanently delete the draft. This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setDeleteOpen(false)} style={btnOutline}>Cancel</button>
              <button type="button" onClick={confirmDelete} style={{ ...btnPrimary, background: '#DC2626' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
};

export default ProductFormPage;
