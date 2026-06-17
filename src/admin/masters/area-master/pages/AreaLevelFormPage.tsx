import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, Check, HelpCircle, Info } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { HeaderIconButton } from '../../../../experience/components';
import { SmartFormDrawer } from '../../../../experience/components/SmartFormDrawer';
import { SmartReviewDrawer } from '../../../../experience/components/SmartReviewDrawer';
import { HelpDrawer } from '../../../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../../../experience/help/helpTopics';
import { findGroupForMasterKey, findMasterByKey } from '../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../adminStorage';
import type { AreaLevel, AreaLevelRole, AreaLevelStatus, UsageTag } from '../types/areaMaster.types';
import { areaLevelService } from '../services/areaLevelService';
import { canDeleteAreaLevel, canChangeLevelSequence } from '../utils/areaLevelUsage';
import {
  validateAreaLevelForSave,
  validateAreaLevelForActivation,
  getRecommendedUsageTagsByRole,
  type AreaLevelFieldErrors,
} from '../utils/areaLevelValidation';
import { AREA_LEVEL_ROLES, USAGE_TAGS } from '../constants/areaMaster.constants';

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  areaLevelName: string;
  displayName: string;
  shortCode: string;
  levelSequence: string;
  areaLevelRole: string;
  parentRequired: string;
  allowedParentLevelIds: string[];
  allowedUsageTags: UsageTag[];
  defaultUsageTags: UsageTag[];
  mandatoryUsageTags: UsageTag[];
  description: string;
  remarks: string;
}

const EMPTY_FORM: FormState = {
  areaLevelName: '',
  displayName: '',
  shortCode: '',
  levelSequence: '',
  areaLevelRole: '',
  parentRequired: '',
  allowedParentLevelIds: [],
  allowedUsageTags: [],
  defaultUsageTags: [],
  mandatoryUsageTags: [],
  description: '',
  remarks: '',
};

function levelToForm(level: AreaLevel): FormState {
  return {
    areaLevelName: level.areaLevelName,
    displayName: level.displayName,
    shortCode: level.shortCode,
    levelSequence: level.levelSequence ? String(level.levelSequence) : '',
    areaLevelRole: level.areaLevelRole,
    parentRequired: level.parentRequired ? 'yes' : 'no',
    allowedParentLevelIds: level.allowedParentLevelIds,
    allowedUsageTags: level.allowedUsageTags,
    defaultUsageTags: level.defaultUsageTags,
    mandatoryUsageTags: level.mandatoryUsageTags,
    description: level.description,
    remarks: level.remarks,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────



const FORM_MASTER_KEY = 'area-master';

type SectionCompletion = 'complete' | 'partial' | 'empty';

type AreaLevelSectionKey = 'basic' | 'hierarchy' | 'role' | 'lifecycle';

const AREA_LEVEL_SECTIONS: Array<{ key: AreaLevelSectionKey; label: string }> = [
  { key: 'basic',      label: 'Basic Details' },
  { key: 'hierarchy', label: 'Hierarchy Control' },
  { key: 'role',      label: 'Role & Usage' },
  { key: 'lifecycle', label: 'Lifecycle & Remarks' },
];

const SECTION_ORDER: AreaLevelSectionKey[] = ['basic', 'hierarchy', 'role', 'lifecycle'];

function SectionBadge({ completion }: { completion: SectionCompletion }) {
  const cfg = completion === 'complete'
    ? { label: 'Complete',    color: '#15803D', dot: '#16A34A' }
    : completion === 'partial'
    ? { label: 'In progress', color: '#1D4ED8', dot: '#3B82F6' }
    : { label: 'Not started', color: '#94A3B8', dot: '#CBD5E1' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 500, color: cfg.color }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: '13px',
  border: '1px solid var(--color-border)', borderRadius: '8px',
  background: 'var(--color-surface)', color: 'var(--color-text)',
  outline: 'none', boxSizing: 'border-box',
};

const inputError: React.CSSProperties = {
  ...inputBase,
  border: '1px solid #FCA5A5',
};

const labelBase: React.CSSProperties = {
  fontSize: '12px', fontWeight: 600, color: 'var(--color-text)',
  display: 'block', marginBottom: '6px',
};

const fieldErrorText: React.CSSProperties = {
  fontSize: '11px', color: '#DC2626', marginTop: '4px',
};

const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '9px 18px', fontSize: '13px', fontWeight: 600,
  borderRadius: '8px', cursor: 'pointer', border: 'none',
};

const btnPrimary: React.CSSProperties = {
  ...btnBase, background: 'var(--color-primary)', color: 'white',
};

const btnOutline: React.CSSProperties = {
  ...btnBase, fontWeight: 500, background: 'transparent',
  color: 'var(--color-text)', border: '1px solid var(--color-border)',
};

const btnDanger: React.CSSProperties = {
  ...btnBase, background: '#FEF2F2', color: '#DC2626',
  border: '1px solid #FCA5A5',
};

const sectionCard: React.CSSProperties = {
  border: '1px solid var(--color-border)', borderRadius: '12px',
  overflow: 'hidden', marginBottom: '24px',
};

const sectionCardHeader: React.CSSProperties = {
  padding: '14px 20px',
  borderBottom: '1px solid var(--color-border)',
  background: 'var(--color-surface-subtle)',
  display: 'flex', alignItems: 'center', gap: '8px',
};

const sectionCardBody: React.CSSProperties = { padding: '20px 24px', background: 'var(--color-surface)' };

const twoCol: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
};

const fieldWrap: React.CSSProperties = { marginBottom: '16px' };

// ─── Component ────────────────────────────────────────────────────────────────

const AreaLevelFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;

  // ── Data ──────────────────────────────────────────────────────────────
  const [existing, setExisting] = useState<AreaLevel | null>(null);
  const [allLevels, setAllLevels] = useState<AreaLevel[]>([]);
  const [notFound, setNotFound] = useState(false);

  // ── Form ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<AreaLevelFieldErrors>({});
  const [activationErrors, setActivationErrors] = useState<string[]>([]);

  // ── Modal state ───────────────────────────────────────────────────────
  const [activateOpen, setActivateOpen] = useState(false);
  const [inactivateOpen, setInactivateOpen] = useState(false);
  const [inactivateReason, setInactivateReason] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);  const [helpOpen, setHelpOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<AreaLevelSectionKey>('basic');

  // ── Toast ─────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  function showToast(message: string, tone: 'success' | 'error') {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Load on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    const levels = areaLevelService.getAll();
    setAllLevels(levels);
    if (!isNew && id) {
      const found = levels.find((l) => l.id === id);
      if (!found) {
        setNotFound(true);
      } else {
        setExisting(found);
        setForm(levelToForm(found));
      }
    }    const master = findMasterByKey(FORM_MASTER_KEY);
    const group  = findGroupForMasterKey(FORM_MASTER_KEY);
    if (master && group) {
      recordRecentAdminMaster({
        key:            master.key,
        label:          master.label,
        path:           master.path,
        groupLabel:     group.label,
        groupIconBg:    group.iconBg,
        groupIconColor: group.iconColor,
      });
    }  }, [id, isNew]);

  // ── Section completion helper ────────────────────────────────────────
  function getSectionCompletion(key: AreaLevelSectionKey, f: FormState): SectionCompletion {
    if (key === 'basic') {
      if (f.areaLevelName && f.shortCode) return 'complete';
      if (f.areaLevelName || f.shortCode) return 'partial';
      return 'empty';
    }
    if (key === 'hierarchy') {
      if (f.levelSequence && f.parentRequired) return 'complete';
      if (f.levelSequence || f.parentRequired) return 'partial';
      return 'empty';
    }
    if (key === 'role') {
      if (f.areaLevelRole && f.allowedUsageTags.length > 0) return 'complete';
      if (f.areaLevelRole || f.allowedUsageTags.length > 0) return 'partial';
      return 'empty';
    }
    if (key === 'lifecycle') {
      return f.remarks ? 'partial' : 'empty';
    }
    return 'empty';
  }

  // ── Derived state ─────────────────────────────────────────────────────
  const status: AreaLevelStatus = existing?.status ?? 'Draft';
  const isDraft    = isNew || status === 'Draft';
  const isActive   = status === 'Active';
  const isInactive = !isNew && status === 'Inactive';
  const isViewOnly = isInactive;

  const seqLocked = !isNew && existing ? !canChangeLevelSequence(existing.id) : false;
  const canDel    = !isNew && existing?.status === 'Draft' && canDeleteAreaLevel(existing.id);

  const otherLevels = useMemo(
    () => allLevels.filter((l) => l.id !== existing?.id),
    [allLevels, existing],
  );

  // Recommended usage tags for selected role
  const recommendedTags = useMemo<UsageTag[]>(() => {
    if (!form.areaLevelRole) return [];
    return getRecommendedUsageTagsByRole(form.areaLevelRole as AreaLevelRole);
  }, [form.areaLevelRole]);

  const showRecommendBanner = recommendedTags.length > 0 && !isViewOnly;

  // ── Field helpers ─────────────────────────────────────────────────────

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((e) => ({ ...e, [key]: undefined }));
  }

  function toggleParentLevel(levelId: string) {
    setField(
      'allowedParentLevelIds',
      form.allowedParentLevelIds.includes(levelId)
        ? form.allowedParentLevelIds.filter((id) => id !== levelId)
        : [...form.allowedParentLevelIds, levelId],
    );
  }

  function toggleUsageTag(tag: UsageTag, listKey: 'allowedUsageTags' | 'defaultUsageTags' | 'mandatoryUsageTags') {
    const current = form[listKey] as UsageTag[];
    const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
    setField(listKey, next);
  }

  function applyRecommendedTags() {
    setField('allowedUsageTags', [...recommendedTags]);
  }

  // ── Build partial level from form ─────────────────────────────────────
  function buildPartialLevel(): Partial<AreaLevel> {
    return {
      id: existing?.id,
      areaLevelCode: existing?.areaLevelCode ?? '',
      areaLevelName: form.areaLevelName,
      displayName: form.displayName,
      shortCode: form.shortCode,
      levelSequence: form.levelSequence ? parseInt(form.levelSequence, 10) : undefined as unknown as number,
      areaLevelRole: (form.areaLevelRole as AreaLevelRole) || undefined as unknown as AreaLevelRole,
      parentRequired: form.parentRequired === 'yes',
      allowedParentLevelIds: form.allowedParentLevelIds,
      allowedUsageTags: form.allowedUsageTags,
      defaultUsageTags: form.defaultUsageTags,
      mandatoryUsageTags: form.mandatoryUsageTags,
      description: form.description,
      remarks: form.remarks,
      status,
    };
  }

  // ── Actions ───────────────────────────────────────────────────────────

  function handleSaveDraft() {
    const partial = buildPartialLevel();
    const others = otherLevels;
    const errs = validateAreaLevelForSave(partial, others);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      showToast('Please fix the errors before saving.', 'error');
      return;
    }

    const data = {
      areaLevelCode: existing?.areaLevelCode ?? areaLevelService.generateCode(),
      areaLevelName: form.areaLevelName.trim(),
      displayName: form.displayName.trim(),
      shortCode: form.shortCode.trim(),
      levelSequence: form.levelSequence ? parseInt(form.levelSequence, 10) : 0,
      areaLevelRole: (form.areaLevelRole as AreaLevelRole) || 'Structural',
      parentRequired: form.parentRequired === 'yes',
      allowedParentLevelIds: form.allowedParentLevelIds,
      allowedUsageTags: form.allowedUsageTags,
      defaultUsageTags: form.defaultUsageTags,
      mandatoryUsageTags: form.mandatoryUsageTags,
      description: form.description,
      remarks: form.remarks,
      status: 'Draft' as AreaLevelStatus,
    };

    if (isNew) {
      areaLevelService.create(data);
      showToast('Area Level saved as Draft.', 'success');
    } else if (existing) {
      areaLevelService.update(existing.id, data);
      showToast('Draft saved.', 'success');
    }

    navigate('/admin/area-levels');
  }

  function handleActivateRequest() {
    const partial = buildPartialLevel();
    const others = otherLevels;
    const errors = validateAreaLevelForActivation(
      { ...partial, areaLevelCode: existing?.areaLevelCode ?? 'PENDING' },
      others,
    );
    setActivationErrors(errors);
    setActivateOpen(true);
  }

  function confirmActivate() {
    if (!existing) return;
    areaLevelService.activate(existing.id);
    setActivateOpen(false);
    showToast(`"${existing.areaLevelName}" activated successfully.`, 'success');
    navigate('/admin/area-levels');
  }

  function confirmInactivate() {
    if (!existing || !inactivateReason.trim()) return;
    areaLevelService.inactivate(existing.id, inactivateReason.trim());
    setInactivateOpen(false);
    showToast(`"${existing.areaLevelName}" inactivated.`, 'success');
    navigate('/admin/area-levels');
  }

  function confirmDelete() {
    if (!existing) return;
    areaLevelService.delete(existing.id);
    setDeleteOpen(false);
    showToast(`"${existing.areaLevelName}" deleted.`, 'success');
    navigate('/admin/area-levels');
  }

  // ── Activation checklist ──────────────────────────────────────────────
  const activationChecklist = activationErrors.length > 0
    ? activationErrors.map((e, i) => ({ id: String(i), label: e, passed: false }))
    : [{ id: 'ready', label: 'All required fields are complete and valid.', passed: true }];

  // ── Title / breadcrumbs ───────────────────────────────────────────────
  const pageTitle = isNew ? 'New Area Level' : (existing?.areaLevelName ?? 'Area Level');

  // ── Not found guard ───────────────────────────────────────────────────
  if (notFound) {
    return (
      <AdminShell>
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: 'var(--color-text-muted)' }}>
            Area Level not found.
          </p>
          <button type="button" onClick={() => navigate('/admin/area-levels')} style={{ ...btnOutline, marginTop: '16px' }}>
            ← Back to List
          </button>
        </div>
      </AdminShell>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <AdminShell>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
            background: toast.tone === 'success' ? '#15803D' : '#DC2626',
            color: 'white', padding: '12px 20px', borderRadius: '10px',
            fontSize: '13px', fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {toast.message}
        </div>
      )}

      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-surface)' }}>

        {/* ── 1. Compact Form Header ───────────────────────────────────────── */}
        <div style={{ flexShrink: 0, padding: '10px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '2px', userSelect: 'none' }}>
              Admin / Area Master / Area Level Configuration
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.25 }}>{pageTitle}</span>
              {existing?.status && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center',
                  fontSize: '11px', fontWeight: 600, padding: '2px 9px', borderRadius: '9999px', border: '1px solid',
                  ...(existing.status === 'Active'
                    ? { background: 'color-mix(in srgb, #10b981 12%, var(--color-surface))', color: 'color-mix(in srgb, #10b981 85%, var(--color-text))', borderColor: 'color-mix(in srgb, #10b981 35%, var(--color-border))' }
                    : existing.status === 'Inactive'
                    ? { background: 'var(--color-surface-subtle)', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }
                    : { background: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE' }),
                }}>
                  {existing.status}
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px', lineHeight: 1.35 }}>
              Configure area level properties, hierarchy rules, role, and usage tags.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button type="button" onClick={() => navigate('/admin/area-levels')} style={btnOutline}>← Back to List</button>
            <HeaderIconButton icon={<HelpCircle size={16} />} onClick={() => setHelpOpen(true)} title="How this works" />
          </div>
        </div>

        {/* ── 2. Workflow Bar ──────────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, height: '44px', padding: '0 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', overflowX: 'auto', flexShrink: 1, minWidth: 0 }}>
            {AREA_LEVEL_SECTIONS.map((s, i) => {
              const isAct = activeSection === s.key;
              const completion = getSectionCompletion(s.key, form);
              const isComplete = completion === 'complete';
              const isPartial = completion === 'partial';
              const circleColor = isAct ? 'var(--color-primary)' : isComplete ? '#16A34A' : isPartial ? '#3B82F6' : 'var(--color-border)';
              const labelColor  = isAct ? 'var(--color-primary)' : isComplete ? '#15803D' : isPartial ? '#1D4ED8' : 'var(--color-text-muted)';
              return (
                <React.Fragment key={s.key}>
                  {i > 0 && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: 'var(--color-border)' }}>
                      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveSection(s.key)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', border: 'none', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${circleColor}`,
                      background: isAct ? circleColor : isComplete ? '#DCFCE7' : 'transparent',
                      fontSize: '10px', fontWeight: 700,
                      color: isAct ? 'white' : isComplete ? '#15803D' : circleColor,
                      transition: 'all 0.15s',
                    }}>
                      {isComplete && !isAct ? <Check size={10} strokeWidth={3} /> : i + 1}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: isAct ? 600 : 400, color: labelColor, transition: 'color 0.15s' }}>
                      {s.label}
                    </span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── 3. Scrollable Form Body ────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px 24px', background: 'var(--color-surface-subtle)' }}>
        {/* Active-state lock banner */}
        {isActive && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '10px', marginBottom: '24px' }}>
            <Info size={15} style={{ color: '#EA580C', flexShrink: 0, marginTop: '1px' }} />
            <span style={{ fontSize: '13px', color: '#9A3412', lineHeight: 1.6 }}>
              This area level is <strong>Active</strong>. The Area Level Code and Level Sequence (if already in use) are locked. Other fields can be updated.
            </span>
          </div>
        )}

        {isInactive && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', background: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: '10px', marginBottom: '24px' }}>
            <AlertCircle size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginTop: '1px' }} />
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              This area level is <strong>Inactive</strong>. All fields are read-only.
            </span>
          </div>
        )}

        {/* ── Section 1: Basic Details ─────────────────────────────────── */}
        {activeSection === 'basic' && (
        <div style={sectionCard}>
          <div style={{ ...sectionCardHeader, justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Basic Details</span>
            <SectionBadge completion={(form.areaLevelName && form.shortCode) ? 'complete' : (form.areaLevelName || form.shortCode) ? 'partial' : 'empty'} />
          </div>
          <div style={sectionCardBody}>
            {/* Code + Name row */}
            <div style={twoCol}>
              <div style={fieldWrap}>
                <label style={labelBase}>Area Level Code</label>
                <div style={{ padding: '9px 12px', fontSize: '13px', fontFamily: 'monospace', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-muted)' }}>
                  {existing?.areaLevelCode ?? <span style={{ fontStyle: 'italic' }}>Auto-generated on save</span>}
                </div>
              </div>
              <div style={fieldWrap}>
                <label style={labelBase}>
                  Area Level Name <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.areaLevelName}
                  onChange={(e) => setField('areaLevelName', e.target.value)}
                  disabled={isViewOnly}
                  placeholder="e.g. State / Province"
                  style={fieldErrors.areaLevelName ? inputError : inputBase}
                />
                {fieldErrors.areaLevelName && <p style={fieldErrorText}>{fieldErrors.areaLevelName}</p>}
              </div>
            </div>

            <div style={twoCol}>
              <div style={fieldWrap}>
                <label style={labelBase}>Display Name</label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => setField('displayName', e.target.value)}
                  disabled={isViewOnly}
                  placeholder="e.g. State"
                  style={inputBase}
                />
              </div>
              <div style={fieldWrap}>
                <label style={labelBase}>
                  Short Code <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.shortCode}
                  onChange={(e) => setField('shortCode', e.target.value.toUpperCase())}
                  disabled={isViewOnly}
                  placeholder="e.g. STATE"
                  maxLength={10}
                  style={fieldErrors.shortCode ? inputError : inputBase}
                />
                {fieldErrors.shortCode && <p style={fieldErrorText}>{fieldErrors.shortCode}</p>}
              </div>
            </div>

            <div style={fieldWrap}>
              <label style={labelBase}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                disabled={isViewOnly}
                rows={3}
                placeholder="Describe this area level's purpose…"
                style={{ ...inputBase, resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>
          </div>
        </div>
        )}

        {/* ── Section 2: Hierarchy Control ────────────────────────────── */}
        {activeSection === 'hierarchy' && (
        <div style={sectionCard}>
          <div style={{ ...sectionCardHeader, justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Hierarchy Control</span>
            <SectionBadge completion={(form.levelSequence && form.parentRequired) ? 'complete' : (form.levelSequence || form.parentRequired) ? 'partial' : 'empty'} />
          </div>
          <div style={sectionCardBody}>
            <div style={twoCol}>
              <div style={fieldWrap}>
                <label style={labelBase}>
                  Level Sequence <span style={{ color: '#DC2626' }}>*</span>
                </label>
                {(seqLocked || isViewOnly) ? (
                  <div style={{ ...inputBase, background: 'var(--color-surface-subtle)', color: 'var(--color-text-muted)', cursor: 'not-allowed' }}>
                    {form.levelSequence || '—'}
                  </div>
                ) : (
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={form.levelSequence}
                    onChange={(e) => setField('levelSequence', e.target.value)}
                    placeholder="e.g. 2"
                    style={fieldErrors.levelSequence ? inputError : inputBase}
                  />
                )}
                {seqLocked && !isViewOnly && (
                  <p style={{ fontSize: '11px', color: '#EA580C', marginTop: '4px' }}>
                    Sequence is locked — this level is already in use.
                  </p>
                )}
                {fieldErrors.levelSequence && <p style={fieldErrorText}>{fieldErrors.levelSequence}</p>}
              </div>

              <div style={fieldWrap}>
                <label style={labelBase}>
                  Parent Required <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['yes', 'no'] as const).map((v) => {
                    const selected = form.parentRequired === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        disabled={isViewOnly}
                        onClick={() => setField('parentRequired', v)}
                        style={{
                          flex: 1, padding: '9px 0', fontSize: '13px', fontWeight: 600,
                          border: `1.5px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          borderRadius: '8px', cursor: isViewOnly ? 'default' : 'pointer',
                          background: selected ? 'var(--color-primary)' : 'transparent',
                          color: selected ? 'white' : 'var(--color-text)',
                        }}
                      >
                        {v === 'yes' ? 'Yes' : 'No'}
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.parentRequired && <p style={fieldErrorText}>{fieldErrors.parentRequired}</p>}
              </div>
            </div>

            {form.parentRequired === 'yes' && (
              <div style={fieldWrap}>
                <label style={labelBase}>Allowed Parent Levels</label>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '10px', lineHeight: 1.5 }}>
                  Select which area levels are permitted as parents for this level.
                </p>
                {otherLevels.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    No other area levels exist yet.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {otherLevels.map((lvl) => {
                      const selected = form.allowedParentLevelIds.includes(lvl.id);
                      return (
                        <button
                          key={lvl.id}
                          type="button"
                          disabled={isViewOnly}
                          onClick={() => toggleParentLevel(lvl.id)}
                          style={{
                            padding: '6px 14px', fontSize: '12px', fontWeight: 500,
                            border: `1.5px solid ${selected ? '#059669' : 'var(--color-border)'}`,
                            borderRadius: '8px', cursor: isViewOnly ? 'default' : 'pointer',
                            background: selected ? '#DCFCE7' : 'transparent',
                            color: selected ? '#059669' : 'var(--color-text)',
                          }}
                        >
                          {lvl.areaLevelName}
                          {lvl.levelSequence ? ` (Seq ${lvl.levelSequence})` : ''}
                        </button>
                      );
                    })}
                  </div>
                )}
                {fieldErrors.allowedParentLevelIds && <p style={fieldErrorText}>{fieldErrors.allowedParentLevelIds}</p>}
              </div>
            )}
          </div>
        </div>
        )}

        {/* ── Section 3: Role & Usage ──────────────────────────────────── */}
        {activeSection === 'role' && (
        <div style={sectionCard}>
          <div style={{ ...sectionCardHeader, justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Role &amp; Usage Tags</span>
            <SectionBadge completion={(form.areaLevelRole && form.allowedUsageTags.length > 0) ? 'complete' : (form.areaLevelRole || form.allowedUsageTags.length > 0) ? 'partial' : 'empty'} />
          </div>
          <div style={sectionCardBody}>
            <div style={fieldWrap}>
              <label style={labelBase}>
                Area Level Role <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <select
                value={form.areaLevelRole}
                onChange={(e) => setField('areaLevelRole', e.target.value)}
                disabled={isViewOnly}
                style={fieldErrors.areaLevelRole ? inputError : inputBase}
              >
                <option value="">— Select a role —</option>
                {AREA_LEVEL_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {fieldErrors.areaLevelRole && <p style={fieldErrorText}>{fieldErrors.areaLevelRole}</p>}
            </div>

            {showRecommendBanner && (
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', padding: '10px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', color: '#1D4ED8', lineHeight: 1.6 }}>
                  <strong>Recommended for {form.areaLevelRole}:</strong>{' '}
                  {recommendedTags.join(', ')}
                </span>
                <button
                  type="button"
                  onClick={applyRecommendedTags}
                  style={{ fontSize: '12px', fontWeight: 600, color: '#1D4ED8', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', padding: 0, flexShrink: 0 }}
                >
                  Apply →
                </button>
              </div>
            )}

            {/* Allowed Usage Tags */}
            <div style={fieldWrap}>
              <label style={labelBase}>
                Allowed Usage Tags <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '10px', lineHeight: 1.5 }}>
                Define which usage contexts this area level can serve.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {USAGE_TAGS.map((tag) => {
                  const selected = form.allowedUsageTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      disabled={isViewOnly}
                      onClick={() => toggleUsageTag(tag, 'allowedUsageTags')}
                      style={{
                        padding: '5px 12px', fontSize: '12px', fontWeight: 500,
                        border: `1.5px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        borderRadius: '6px', cursor: isViewOnly ? 'default' : 'pointer',
                        background: selected ? 'var(--color-primary)' : 'transparent',
                        color: selected ? 'white' : 'var(--color-text)',
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              {fieldErrors.allowedUsageTags && <p style={fieldErrorText}>{fieldErrors.allowedUsageTags}</p>}
            </div>

            {/* Default Usage Tags */}
            {form.allowedUsageTags.length > 0 && (
              <div style={fieldWrap}>
                <label style={labelBase}>Default Usage Tags</label>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '10px', lineHeight: 1.5 }}>
                  Tags pre-selected by default when this area level is used. Must be a subset of Allowed tags.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {form.allowedUsageTags.map((tag) => {
                    const selected = form.defaultUsageTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        disabled={isViewOnly}
                        onClick={() => toggleUsageTag(tag, 'defaultUsageTags')}
                        style={{
                          padding: '5px 12px', fontSize: '12px', fontWeight: 500,
                          border: `1.5px solid ${selected ? '#059669' : 'var(--color-border)'}`,
                          borderRadius: '6px', cursor: isViewOnly ? 'default' : 'pointer',
                          background: selected ? '#DCFCE7' : 'transparent',
                          color: selected ? '#059669' : 'var(--color-text)',
                        }}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.defaultUsageTags && <p style={fieldErrorText}>{fieldErrors.defaultUsageTags}</p>}
              </div>
            )}

            {/* Mandatory Usage Tags */}
            {form.allowedUsageTags.length > 0 && (
              <div style={fieldWrap}>
                <label style={labelBase}>Mandatory Usage Tags</label>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '10px', lineHeight: 1.5 }}>
                  Tags that must always be applied when this area level is used. Must be a subset of Allowed tags.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {form.allowedUsageTags.map((tag) => {
                    const selected = form.mandatoryUsageTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        disabled={isViewOnly}
                        onClick={() => toggleUsageTag(tag, 'mandatoryUsageTags')}
                        style={{
                          padding: '5px 12px', fontSize: '12px', fontWeight: 500,
                          border: `1.5px solid ${selected ? '#D97706' : 'var(--color-border)'}`,
                          borderRadius: '6px', cursor: isViewOnly ? 'default' : 'pointer',
                          background: selected ? '#FEF3C7' : 'transparent',
                          color: selected ? '#B45309' : 'var(--color-text)',
                        }}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.mandatoryUsageTags && <p style={fieldErrorText}>{fieldErrors.mandatoryUsageTags}</p>}
              </div>
            )}
          </div>
        </div>
        )}

        {/* ── Section 4: Lifecycle & Remarks ───────────────────────────── */}
        {activeSection === 'lifecycle' && (
        <div style={sectionCard}>
          <div style={{ ...sectionCardHeader, justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Lifecycle &amp; Remarks</span>
            <SectionBadge completion={form.remarks ? 'partial' : 'empty'} />
          </div>
          <div style={sectionCardBody}>
            <div style={twoCol}>
              <div style={fieldWrap}>
                <label style={labelBase}>Status</label>
                <div style={{ padding: '9px 12px', fontSize: '13px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-muted)' }}>
                  {existing?.status ?? 'Draft (not yet saved)'}
                </div>
              </div>
              <div style={fieldWrap}>
                <label style={labelBase}>Created At</label>
                <div style={{ padding: '9px 12px', fontSize: '13px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-muted)' }}>
                  {existing?.createdAt ? new Date(existing.createdAt).toLocaleDateString() : '—'}
                </div>
              </div>
            </div>

            <div style={fieldWrap}>
              <label style={labelBase}>Remarks</label>
              <textarea
                value={form.remarks}
                onChange={(e) => setField('remarks', e.target.value)}
                disabled={isViewOnly}
                rows={3}
                placeholder="Internal notes or inactivation reason…"
                style={{ ...inputBase, resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>
          </div>
        </div>
        )}

        </div> {/* close scrollable body */}

        {/* ── 4. Sticky Footer Bar (CGP-style) ──────────────────────────────── */}
        <div style={{ flexShrink: 0, height: '60px', padding: '0 24px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Left: Previous (disabled at step 0) + Delete */}
          <button
            type="button"
            onClick={() => { if (SECTION_ORDER.indexOf(activeSection) > 0) setActiveSection(SECTION_ORDER[SECTION_ORDER.indexOf(activeSection) - 1]); }}
            disabled={SECTION_ORDER.indexOf(activeSection) === 0}
            style={{ ...btnOutline, opacity: SECTION_ORDER.indexOf(activeSection) === 0 ? 0.4 : 1, cursor: SECTION_ORDER.indexOf(activeSection) === 0 ? 'not-allowed' : 'pointer' }}
          >← Previous</button>
          {canDel && (
            <button type="button" onClick={() => setDeleteOpen(true)} style={btnDanger}>Delete</button>
          )}
          {/* Step counter */}
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', padding: '0 4px' }}>
            Step {SECTION_ORDER.indexOf(activeSection) + 1} of {SECTION_ORDER.length}
          </span>
          {/* Spacer */}
          <span style={{ flex: 1 }} />
          {/* Right: Save / Inactivate / Continue or Activate */}
          {isActive && (
            <button type="button" onClick={() => setInactivateOpen(true)} style={btnDanger}>Inactivate</button>
          )}
          {isDraft && (
            <button type="button" onClick={handleSaveDraft} style={btnOutline}>Save Draft</button>
          )}
          {isActive && (
            <button type="button" onClick={handleSaveDraft} style={btnOutline}>Save</button>
          )}
          {SECTION_ORDER.indexOf(activeSection) < SECTION_ORDER.length - 1 && (
            <button type="button" onClick={() => setActiveSection(SECTION_ORDER[SECTION_ORDER.indexOf(activeSection) + 1])} style={btnPrimary}>Continue →</button>
          )}
          {SECTION_ORDER.indexOf(activeSection) === SECTION_ORDER.length - 1 && isDraft && !isNew && (
            <button type="button" onClick={handleActivateRequest} style={btnPrimary}>Activate</button>
          )}
          {SECTION_ORDER.indexOf(activeSection) === SECTION_ORDER.length - 1 && isNew && (
            <button type="button" onClick={handleSaveDraft} style={btnPrimary}>Save Draft</button>
          )}
        </div>
      </div> {/* close outer column */}

      {/* ── Inactivate Drawer ───────────────────────────────────────────── */}
      <SmartFormDrawer
        open={inactivateOpen}
        onClose={() => { setInactivateOpen(false); setInactivateReason(''); }}
        title="Inactivate Area Level"
        subtitle={existing?.areaLevelName}
        width="sm"
        onSave={confirmInactivate}
        saveLabel="Inactivate"
        saveDisabled={!inactivateReason.trim()}
        validationErrors={!inactivateReason.trim() ? ['Reason is required.'] : undefined}
      >
        <div>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '14px', lineHeight: 1.6 }}>
            Inactivating this area level will prevent it from being selected in new Area records. This action can be reversed.
          </p>
          <label style={labelBase}>
            Reason <span style={{ color: '#DC2626' }}>*</span>
          </label>
          <textarea
            value={inactivateReason}
            onChange={(e) => setInactivateReason(e.target.value)}
            rows={4}
            placeholder="Describe why this area level is being inactivated…"
            style={{
              ...inputBase,
              border: `1px solid ${inactivateReason.trim() ? 'var(--color-border)' : '#FCA5A5'}`,
              resize: 'vertical', lineHeight: 1.6,
            }}
          />
        </div>
      </SmartFormDrawer>

      {/* ── Activate Confirm ─────────────────────────────────────────────── */}
      <SmartReviewDrawer
        open={activateOpen}
        onClose={() => { setActivateOpen(false); setActivationErrors([]); }}
        title="Activate Area Level"
        subtitle={form.areaLevelName || pageTitle}
        description="Review the checklist and confirm activation. Once active, this area level becomes available for use in Area Master records."
        checklist={activationChecklist}
        warningText={activationErrors.length > 0 ? 'Resolve all issues before activating.' : undefined}
        consequenceNote="Activated area levels can be used to build geographic hierarchies. You can inactivate this level later if needed."
        confirmLabel="Activate"
        confirmDisabled={activationErrors.length > 0}
        onConfirm={confirmActivate}
        onCancel={() => { setActivateOpen(false); setActivationErrors([]); }}
      />

      {/* ── Delete Confirm ────────────────────────────────────────────────── */}
      <SmartReviewDrawer
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Area Level"
        subtitle={existing?.areaLevelName}
        description="This action is permanent and cannot be undone."
        checklist={[
          { id: 'draft', label: 'Area Level is in Draft status.', passed: existing?.status === 'Draft' },
          { id: 'unused', label: 'Not referenced by any Area records.', passed: existing ? canDeleteAreaLevel(existing.id) : false },
        ]}
        warningText="This record will be permanently deleted and cannot be recovered."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />
      {/* ── Help Drawer ───────────────────────────────────────────── */}
      <HelpDrawer
        open={helpOpen}
        topic={getHelpTopic('area-level-setup')}
        onClose={() => setHelpOpen(false)}
      />
    </AdminShell>
  );
};

export default AreaLevelFormPage;
