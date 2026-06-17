import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, Info } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import AppDialog from '../../../../components/app/AppDialog';
import { MasterFormStepper } from '../../../../experience/components';
import { findGroupForMasterKey, findMasterByKey } from '../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../adminStorage';
import type { Customer, CustomerType } from '../types/customerMaster.types';
import {
  CUSTOMER_STEP_DEFINITIONS,
  CUSTOMER_TYPE_STEP_APPLICABILITY,
  CUSTOMER_TYPE_META,
  EMPTY_CUSTOMER,
} from '../constants/customerMaster.constants';
import { customerService } from '../services/customerService';
import { validateCustomerForActivation, validateCustomerForSave } from '../utils/customerValidation';
import CustomerTypePickerDialog from '../components/CustomerTypePickerDialog';
import { BasicDetailsStep }            from '../components/steps/BasicDetailsStep';
import { BusinessIdentificationStep }  from '../components/steps/BusinessIdentificationStep';
import { AddressDetailsStep }          from '../components/steps/AddressDetailsStep';
import { ContactPersonStep }           from '../components/steps/ContactPersonStep';
import { ConsentDetailsStep }          from '../components/steps/ConsentDetailsStep';
import { KycDetailsStep }              from '../components/steps/KycDetailsStep';
import { FamilyDetailsStep }           from '../components/steps/FamilyDetailsStep';

// ─── Constants ────────────────────────────────────────────────────────────────

const FORM_MASTER_KEY = 'customer-master';
const LIST_PATH       = '/admin/master/customer-master';

// ─── Style constants ──────────────────────────────────────────────────────────

const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: '0 18px', height: '34px', fontSize: '13px', fontWeight: 600,
  borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'opacity 0.1s',
};
const btnPrimary: React.CSSProperties  = { ...btnBase, background: 'var(--color-primary)', color: '#fff' };
const btnOutline: React.CSSProperties  = { ...btnBase, background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)' };
const btnDanger: React.CSSProperties   = { ...btnBase, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' };
const btnSuccess: React.CSSProperties  = { ...btnBase, background: '#15803D', color: '#fff' };

// ─── Component ────────────────────────────────────────────────────────────────

export default function CustomerFormPage() {
  const navigate = useNavigate();
  const { id }   = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const isNew        = !id;
  const typeFromUrl  = searchParams.get('type') as CustomerType | null;

  // ── Core state ────────────────────────────────────────────────────────
  const [existing, setExisting]   = useState<Customer | null>(null);
  const [notFound, setNotFound]   = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [form, setForm] = useState<Customer>(() => ({
    ...EMPTY_CUSTOMER,
    ...(typeFromUrl ? { customerType: typeFromUrl } : {}),
  }));

  function patchForm(updates: Partial<Customer>) {
    setForm((prev) => ({ ...prev, ...updates }));
  }

  // ── Lifecycle drawers ─────────────────────────────────────────────────
  const [activateOpen, setActivateOpen]       = useState(false);
  const [activationIssues, setActivationIssues] = useState<string[]>([]);
  const [inactivateOpen, setInactivateOpen]   = useState(false);
  const [inactivateReason, setInactivateReason] = useState('');
  const [deleteOpen, setDeleteOpen]           = useState(false);

  // ── Toast ─────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  function showToast(msg: string, tone: 'success' | 'error') {
    setToast({ message: msg, tone });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Load existing ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isNew && id) {
      const found = customerService.getById(id);
      if (!found) { setNotFound(true); return; }
      setExisting(found);
      setForm({ ...found });
    }
    // If new and no type: show picker
    if (isNew && !typeFromUrl) {
      setPickerOpen(true);
    }
    const master = findMasterByKey(FORM_MASTER_KEY);
    const group  = findGroupForMasterKey(FORM_MASTER_KEY);
    if (master && group) {
      recordRecentAdminMaster({ key: master.key, label: master.label, path: master.path, groupLabel: group.label, groupIconBg: group.iconBg, groupIconColor: group.iconColor });
    }
  }, [id, isNew, typeFromUrl]);

  // ── Derived ───────────────────────────────────────────────────────────
  const status    = existing?.customerStatus ?? form.customerStatus ?? 'Draft';
  const isActive  = status === 'Active';
  const isInactive = !isNew && (status === 'Inactive' || status === 'Blocked');
  const isViewOnly = isInactive;
  const canDelete = !isNew && status === 'Draft';
  const customerType = form.customerType;
  const typeMeta     = customerType ? CUSTOMER_TYPE_META[customerType] : null;

  // ── Dynamic steps based on customer type ─────────────────────────────
  const steps = useMemo(() => {
    const applicable = CUSTOMER_TYPE_STEP_APPLICABILITY[customerType] ?? [0, 2, 4, 5];
    return CUSTOMER_STEP_DEFINITIONS.filter((s) => applicable.includes(s.index));
  }, [customerType]);

  // Navigate to first step whenever type changes
  useEffect(() => {
    setActiveStep(steps[0]?.index ?? 0);
  }, [steps]);

  // ── stepHasData ───────────────────────────────────────────────────────
  function stepHasData(i: number): boolean {
    switch (i) {
      case 0: return !!(form.displayName.trim() || form.firstName.trim() || form.legalName.trim() || form.deptLegalName.trim() || form.internalEntityName.trim());
      case 1: return !!(form.dateOfIncorporation || form.isTaxExempt);
      case 2: return form.addresses.length > 0;
      case 3: return form.contacts.length > 0;
      case 4: return form.consents.length > 0;
      case 5: return form.kycDocuments.length > 0 || !!form.overallKYCStatus;
      case 6: return form.familyMembers.length > 0;
      default: return false;
    }
  }

  function getStepCount(i: number): number {
    switch (i) {
      case 2: return form.addresses.length;
      case 3: return form.contacts.length;
      case 4: return form.consents.length;
      case 5: return form.kycDocuments.length;
      case 6: return form.familyMembers.length;
      default: return 0;
    }
  }

  // ── Step navigation ───────────────────────────────────────────────────
  const currentStepPos = steps.findIndex((s) => s.index === activeStep);
  const canPrev = currentStepPos > 0;
  const canNext = currentStepPos < steps.length - 1;
  const stepperSteps = steps.map((step) => {
    const count = getStepCount(step.index);

    return {
      id: String(step.index),
      label: step.label,
      count: count > 0 ? count : undefined,
      state: activeStep === step.index ? 'current' : stepHasData(step.index) ? 'complete' : 'default',
    };
  });

  function goPrev() { if (canPrev) setActiveStep(steps[currentStepPos - 1].index); }
  function goNext() { if (canNext) setActiveStep(steps[currentStepPos + 1].index); }

  // ── Build Customer from form state ────────────────────────────────────
  function buildCustomer(): Partial<Customer> {
    return { ...form };
  }

  // ── Page title ────────────────────────────────────────────────────────
  const pageTitle = isNew
    ? `New ${customerType || 'Customer'}`
    : (existing?.displayName || existing?.customerCode || 'Edit Customer');

  // ── Save as Draft ─────────────────────────────────────────────────────
  function handleSaveDraft() {
    const allCustomers = customerService.getAll();
    const errs = validateCustomerForSave(form, allCustomers, existing?.id);
    if (Object.keys(errs).length > 0) {
      showToast(Object.values(errs)[0] ?? 'Please fix validation errors.', 'error');
      return;
    }
    const data = buildCustomer();
    if (isNew) {
      customerService.create(data as Omit<Customer, 'id' | 'draftReferenceId' | 'customerCode' | 'createdAt' | 'updatedAt'>);
      showToast('Customer saved as Draft.', 'success');
    } else if (existing) {
      customerService.update(existing.id, data);
      showToast('Draft saved.', 'success');
    }
    navigate(LIST_PATH);
  }

  // ── Activate ──────────────────────────────────────────────────────────
  function handleActivateRequest() {
    if (!existing) return;
    const merged: Customer = { ...existing, ...buildCustomer() };
    const issues = validateCustomerForActivation(merged);
    setActivationIssues(issues);
    setActivateOpen(true);
  }

  function confirmActivate() {
    if (!existing) return;
    customerService.update(existing.id, { ...buildCustomer(), customerStatus: 'Active' });
    setActivateOpen(false);
    showToast(`"${form.displayName || form.customerCode}" activated.`, 'success');
    navigate(LIST_PATH);
  }

  // ── Inactivate ────────────────────────────────────────────────────────
  function confirmInactivate() {
    if (!existing || !inactivateReason.trim()) return;
    customerService.inactivate(existing.id, inactivateReason.trim());
    setInactivateOpen(false);
    showToast(`Customer inactivated.`, 'success');
    navigate(LIST_PATH);
  }

  // ── Delete ────────────────────────────────────────────────────────────
  function confirmDelete() {
    if (!existing) return;
    customerService.delete(existing.id);
    setDeleteOpen(false);
    navigate(LIST_PATH);
  }

  // ── Not found ────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <AdminShell>
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: 'var(--color-text-muted)' }}>Customer not found.</p>
          <button type="button" onClick={() => navigate(LIST_PATH)} style={{ ...btnPrimary, marginTop: '16px' }}>← Back to List</button>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      {/* ── Toast ────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, background: toast.tone === 'success' ? '#15803D' : '#DC2626', color: 'white', padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toast.message}
        </div>
      )}

      {/* ── Customer Type Picker (for new without type) ───────────────────── */}
      <CustomerTypePickerDialog open={pickerOpen} onClose={() => { setPickerOpen(false); navigate(LIST_PATH); }} />

      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-surface)' }}>

        {/* ── 1. Header ────────────────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, padding: '10px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '2px', userSelect: 'none' }}>
              Admin / Business Partners / Customer Master
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.25 }}>{pageTitle}</span>
              {typeMeta && (
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 9px', borderRadius: '9999px', background: typeMeta.bgColor, color: typeMeta.color }}>{customerType}</span>
              )}
              {existing?.customerStatus && (
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 9px', borderRadius: '9999px', border: '1px solid',
                  ...(existing.customerStatus === 'Active' ? { background: '#F0FDF4', color: '#15803D', borderColor: '#86EFAC' }
                    : existing.customerStatus === 'Blocked' ? { background: '#FEF2F2', color: '#DC2626', borderColor: '#FCA5A5' }
                    : existing.customerStatus === 'Inactive' ? { background: '#F8FAFC', color: '#64748B', borderColor: '#E2E8F0' }
                    : { background: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE' }) }}>
                  {existing.customerStatus}
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px', lineHeight: 1.35 }}>
              {isNew ? 'Complete all required steps and save as draft, then activate.' : 'Update customer details and save changes.'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button type="button" onClick={() => navigate(LIST_PATH)} style={btnOutline}>← Back</button>
          </div>
        </div>

        {/* ── 2. Middle Area ────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ── Left Step Sidebar (220px) ────────────────────────────────────── */}
          <div style={{ width: '220px', flexShrink: 0, background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)', overflowY: 'auto' }}>
            <MasterFormStepper
              steps={stepperSteps}
              activeStepId={String(activeStep)}
              onStepChange={(stepId) => setActiveStep(Number(stepId))}
            />
          </div>

          {/* ── 3. Form Body ─────────────────────────────────────────────────── */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px 24px', background: 'var(--color-surface-subtle)' }}>

            {/* Status banners */}
            {isActive && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '10px', marginBottom: '20px' }}>
                <Info size={15} style={{ color: '#EA580C', flexShrink: 0, marginTop: '1px' }} />
                <span style={{ fontSize: '13px', color: '#9A3412', lineHeight: 1.6 }}>
                  This customer is <strong>Active</strong>. Customer Code is locked. All other fields can be updated.
                </span>
              </div>
            )}
            {isInactive && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', background: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: '10px', marginBottom: '20px' }}>
                <AlertCircle size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginTop: '1px' }} />
                <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                  This customer is <strong>{status}</strong>. All fields are read-only.
                </span>
              </div>
            )}

            {/* Step Content */}
            {activeStep === 0 && (
              <BasicDetailsStep form={form} onChange={patchForm} isViewOnly={isViewOnly} />
            )}
            {activeStep === 1 && (
              <BusinessIdentificationStep form={form} onChange={patchForm} kycDocuments={form.kycDocuments} isViewOnly={isViewOnly} />
            )}
            {activeStep === 2 && (
              <AddressDetailsStep addresses={form.addresses} onChange={(addresses) => patchForm({ addresses })} isViewOnly={isViewOnly} />
            )}
            {activeStep === 3 && (
              <ContactPersonStep contacts={form.contacts} onChange={(contacts) => patchForm({ contacts })} isViewOnly={isViewOnly} />
            )}
            {activeStep === 4 && (
              <ConsentDetailsStep consents={form.consents} onChange={(consents) => patchForm({ consents })} isViewOnly={isViewOnly} />
            )}
            {activeStep === 5 && (
              <KycDetailsStep form={form} onChange={patchForm} isViewOnly={isViewOnly} />
            )}
            {activeStep === 6 && (
              <FamilyDetailsStep familyMembers={form.familyMembers} onChange={(familyMembers) => patchForm({ familyMembers })} isViewOnly={isViewOnly} />
            )}
          </div>
        </div>

        {/* ── 4. Footer ─────────────────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, height: '60px', padding: '0 24px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button type="button" onClick={goPrev} disabled={!canPrev} style={{ ...btnOutline, opacity: !canPrev ? 0.4 : 1, cursor: !canPrev ? 'default' : 'pointer' }}>← Previous</button>
          <button type="button" onClick={goNext} disabled={!canNext} style={{ ...btnOutline, opacity: !canNext ? 0.4 : 1, cursor: !canNext ? 'default' : 'pointer' }}>Next →</button>

          {canDelete && (
            <button type="button" onClick={() => setDeleteOpen(true)} style={btnDanger}>Delete</button>
          )}

          <div style={{ flex: 1 }} />

          {!isViewOnly && isActive && existing && (
            <button type="button" onClick={() => setInactivateOpen(true)} style={{ ...btnBase, background: '#F8FAFC', color: '#64748B', border: '1px solid var(--color-border)' }}>Inactivate</button>
          )}
          {!isViewOnly && (
            <button type="button" onClick={handleSaveDraft} style={btnOutline}>Save as Draft</button>
          )}
          {!isViewOnly && !isNew && !isActive && (
            <button type="button" onClick={handleActivateRequest} style={btnSuccess}>Activate</button>
          )}
        </div>
      </div>

      {/* ── Activate Dialog ───────────────────────────────────────────────── */}
      <AppDialog open={activateOpen} onClose={() => setActivateOpen(false)} title="Activate Customer" width={480}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => setActivateOpen(false)} style={btnOutline}>Cancel</button>
            {activationIssues.length === 0 && (
              <button type="button" onClick={confirmActivate} style={btnSuccess}>Confirm Activation</button>
            )}
          </div>
        }
      >
        {activationIssues.length > 0 ? (
          <div>
            <p style={{ fontSize: '13px', color: 'var(--color-text)', marginBottom: '14px', lineHeight: 1.5 }}>
              Please resolve the following issues before activating:
            </p>
            <ul style={{ margin: 0, padding: '0 0 0 20px', listStyle: 'disc' }}>
              {activationIssues.map((issue, i) => (
                <li key={i} style={{ fontSize: '13px', color: '#DC2626', marginBottom: '6px', lineHeight: 1.5 }}>{issue}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--color-text)', lineHeight: 1.6 }}>
            Are you sure you want to activate <strong>{form.displayName || form.customerCode}</strong>?<br />
            A Customer Code will be generated and the record will be fully active.
          </p>
        )}
      </AppDialog>

      {/* ── Inactivate Dialog ─────────────────────────────────────────────── */}
      <AppDialog open={inactivateOpen} onClose={() => setInactivateOpen(false)} title="Inactivate Customer" width={440}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => setInactivateOpen(false)} style={btnOutline}>Cancel</button>
            <button type="button" onClick={confirmInactivate} disabled={!inactivateReason.trim()} style={{ ...btnDanger, opacity: !inactivateReason.trim() ? 0.5 : 1, cursor: !inactivateReason.trim() ? 'default' : 'pointer' }}>Confirm Inactivation</button>
          </div>
        }
      >
        <div>
          <p style={{ fontSize: '13px', color: 'var(--color-text)', marginBottom: '12px', lineHeight: 1.5 }}>Provide a reason for inactivating this customer.</p>
          <textarea value={inactivateReason} onChange={(e) => setInactivateReason(e.target.value)} maxLength={250} rows={3} placeholder="Enter reason…" style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5 }} />
        </div>
      </AppDialog>

      {/* ── Delete Dialog ─────────────────────────────────────────────────── */}
      <AppDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Draft" width={400}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => setDeleteOpen(false)} style={btnOutline}>Cancel</button>
            <button type="button" onClick={confirmDelete} style={btnDanger}>Delete Permanently</button>
          </div>
        }
      >
        <p style={{ fontSize: '13px', color: 'var(--color-text)', lineHeight: 1.6 }}>
          Delete this draft customer record? This action cannot be undone.
        </p>
      </AppDialog>
    </AdminShell>
  );
}
