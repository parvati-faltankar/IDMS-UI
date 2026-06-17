import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, Check, HelpCircle, Info, Lock } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { HeaderIconButton } from '../../../../experience/components';
import { SmartFormDrawer } from '../../../../experience/components/SmartFormDrawer';
import { SmartReviewDrawer } from '../../../../experience/components/SmartReviewDrawer';
import { HelpDrawer } from '../../../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../../../experience/help/helpTopics';
import { findGroupForMasterKey, findMasterByKey } from '../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../adminStorage';
import type { Area, AreaAlias, AliasType, AreaLevel, AreaStatus, GeoBoundaryType, UsageTag } from '../types/areaMaster.types';
import { areaService } from '../services/areaService';
import { areaLevelService } from '../services/areaLevelService';
import { validateAreaForSave, validateAreaForActivation, type AreaFieldErrors } from '../utils/areaValidation';
import { validateAliasRows, type AliasRowErrors } from '../utils/aliasValidation';
import {
  getAllowedParentAreas,
  getAllowedUsageTagsForAreaLevel,
  getMandatoryUsageTagsForAreaLevel,
  getInitialUsageTags,
  validateGeoFields,
  type GeoFieldErrors,
} from '../utils/areaUtils';
import { buildHierarchyPath, isCircularHierarchy } from '../utils/hierarchyUtils';
import {
  AREA_CATEGORIES,
  AREA_CLASSIFICATIONS,
  GEO_BOUNDARY_TYPES,
  ALIAS_TYPES,
  ALIAS_STATUSES,
  RADIUS_UNITS,
  MAP_PROVIDERS,
} from '../constants/areaMaster.constants';

// ─── Form state ───────────────────────────────────────────────────────────────

interface AreaFormState {
  areaName: string;
  displayName: string;
  externalLegacyCode: string;
  description: string;
  areaLevelId: string;
  parentAreaId: string;
  areaCategory: string;
  areaClassification: string;
  usageTags: UsageTag[];
  postalCode: string;
  latitude: string;
  longitude: string;
  geoBoundaryType: string;
  radiusValue: string;
  radiusUnit: string;
  polygonReference: string;
  mapProvider: string;
  externalBoundaryId: string;
  remarks: string;
  aliases: AreaAlias[];
}

const EMPTY_FORM: AreaFormState = {
  areaName: '', displayName: '', externalLegacyCode: '', description: '',
  areaLevelId: '', parentAreaId: '',
  areaCategory: '', areaClassification: '',
  usageTags: [],
  postalCode: '', latitude: '', longitude: '',
  geoBoundaryType: 'Not Applicable',
  radiusValue: '', radiusUnit: 'KM',
  polygonReference: '', mapProvider: '', externalBoundaryId: '',
  remarks: '',
  aliases: [],
};

function areaToForm(area: Area): AreaFormState {
  return {
    areaName: area.areaName,
    displayName: area.displayName,
    externalLegacyCode: area.externalLegacyCode,
    description: area.description,
    areaLevelId: area.areaLevelId,
    parentAreaId: area.parentAreaId ?? '',
    areaCategory: area.areaCategory,
    areaClassification: area.areaClassification,
    usageTags: area.usageTags,
    postalCode: area.postalCode,
    latitude: area.latitude !== null ? String(area.latitude) : '',
    longitude: area.longitude !== null ? String(area.longitude) : '',
    geoBoundaryType: area.geoBoundaryType,
    radiusValue: area.radiusValue !== null ? String(area.radiusValue) : '',
    radiusUnit: area.radiusUnit || 'KM',
    polygonReference: area.polygonReference,
    mapProvider: area.mapProvider,
    externalBoundaryId: area.externalBoundaryId,
    remarks: area.remarks,
    aliases: area.aliases,
  };
}

// ─── Style constants ──────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: '13px',
  border: '1px solid var(--color-border)', borderRadius: '8px',
  background: 'var(--color-surface)', color: 'var(--color-text)',
  outline: 'none', boxSizing: 'border-box',
};
const inputErr: React.CSSProperties = { ...inputBase, border: '1px solid #FCA5A5' };
const labelBase: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: '6px' };
const fieldErrText: React.CSSProperties = { fontSize: '11px', color: '#DC2626', marginTop: '4px' };
const btnBase: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', cursor: 'pointer', border: 'none' };
const btnPrimary: React.CSSProperties = { ...btnBase, background: 'var(--color-primary)', color: 'white' };
const btnOutline: React.CSSProperties = { ...btnBase, fontWeight: 500, background: 'transparent', color: 'var(--color-text)', border: '1px solid var(--color-border)' };
const btnDanger: React.CSSProperties = { ...btnBase, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' };
const sCard: React.CSSProperties = { border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' };
const sHead: React.CSSProperties = { padding: '13px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)', display: 'flex', alignItems: 'center', gap: '8px' };
const sBody: React.CSSProperties = { padding: '20px 24px', background: 'var(--color-surface)' };
const twoCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const fWrap: React.CSSProperties = { marginBottom: '16px' };
const readonlyField: React.CSSProperties = { ...inputBase, background: 'var(--color-surface-subtle)', color: 'var(--color-text-muted)', cursor: 'default' };

const AREA_MASTER_KEY = 'area-master';

type AreaSectionCompletion = 'complete' | 'partial' | 'empty';

type AreaFormSectionKey = 'basic' | 'hierarchy' | 'usage' | 'geo' | 'aliases' | 'lifecycle';

const AREA_SECTIONS: Array<{ key: AreaFormSectionKey; label: string }> = [
  { key: 'basic',      label: 'Basic Details' },
  { key: 'hierarchy', label: 'Hierarchy' },
  { key: 'usage',     label: 'Usage' },
  { key: 'geo',       label: 'Geo & Postal' },
  { key: 'aliases',   label: 'Aliases' },
  { key: 'lifecycle', label: 'Lifecycle' },
];

const AREA_SECTION_ORDER: AreaFormSectionKey[] = ['basic', 'hierarchy', 'usage', 'geo', 'aliases', 'lifecycle'];

function AreaSectionBadge({ completion }: { completion: AreaSectionCompletion }) {
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

// ─── Component ────────────────────────────────────────────────────────────────

const AreaFormPage: React.FC = () => {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const isNew     = !id;

  // ── Server data ────────────────────────────────────────────────────────
  const [existing, setExisting]   = useState<Area | null>(null);
  const [allLevels, setAllLevels] = useState<AreaLevel[]>([]);
  const [allAreas, setAllAreas]   = useState<Area[]>([]);
  const [notFound, setNotFound]   = useState(false);

  // ── Form ───────────────────────────────────────────────────────────────
  const [form, setForm]               = useState<AreaFormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors]         = useState<AreaFieldErrors>({});
  const [aliasRowErrors, setAliasRowErrors]    = useState<Record<number, AliasRowErrors>>({});
  const [activationErrors, setActivationErrors] = useState<string[]>([]);

  // ── Modals ─────────────────────────────────────────────────────────────
  const [activateOpen, setActivateOpen]         = useState(false);
  const [inactivateOpen, setInactivateOpen]     = useState(false);
  const [inactivateReason, setInactivateReason] = useState('');
  const [deleteOpen, setDeleteOpen]             = useState(false);
  const [helpOpen, setHelpOpen]                 = useState(false);
  const [activeSection, setActiveSection]       = useState<AreaFormSectionKey>('basic');
  // ── Toast ──────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  function showToast(message: string, tone: 'success' | 'error') {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Load ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const levels = areaLevelService.getAll();
    const areas  = areaService.getAll();
    setAllLevels(levels);
    setAllAreas(areas);
    if (!isNew && id) {
      const found = areas.find((a) => a.id === id);
      if (!found) { setNotFound(true); }
      else { setExisting(found); setForm(areaToForm(found)); }
    }    const master = findMasterByKey(AREA_MASTER_KEY);
    const group  = findGroupForMasterKey(AREA_MASTER_KEY);
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

  // ── Derived ────────────────────────────────────────────────────────────
  const status: AreaStatus = existing?.status ?? 'Draft';
  const isDraft    = isNew || status === 'Draft';
  const isActive   = status === 'Active';
  const isInactive = !isNew && status === 'Inactive';
  const isViewOnly = isInactive;

  const selectedLevel = useMemo(
    () => allLevels.find((l) => l.id === form.areaLevelId) ?? null,
    [allLevels, form.areaLevelId],
  );

  const activeLevels = useMemo(
    () => allLevels.filter((l) => l.status === 'Active'),
    [allLevels],
  );

  const allowedParentAreas = useMemo(
    () => (selectedLevel ? getAllowedParentAreas(selectedLevel, allAreas) : []),
    [selectedLevel, allAreas],
  );

  const allowedTags = useMemo(
    () => (selectedLevel ? getAllowedUsageTagsForAreaLevel(selectedLevel) : []),
    [selectedLevel],
  );

  const mandatoryTags = useMemo(
    () => (selectedLevel ? getMandatoryUsageTagsForAreaLevel(selectedLevel) : []),
    [selectedLevel],
  );

  const parentArea = useMemo(
    () => allAreas.find((a) => a.id === form.parentAreaId) ?? null,
    [allAreas, form.parentAreaId],
  );

  const computedHierarchyPath = useMemo(
    () => buildHierarchyPath(form.areaName, parentArea),
    [form.areaName, parentArea],
  );

  const geoErrors: GeoFieldErrors = useMemo(() => validateGeoFields({
    latitude:  form.latitude  ? parseFloat(form.latitude)  : null,
    longitude: form.longitude ? parseFloat(form.longitude) : null,
    geoBoundaryType: form.geoBoundaryType as GeoBoundaryType,
    radiusValue:     form.radiusValue ? parseFloat(form.radiusValue) : null,
    radiusUnit:      form.radiusUnit,
    polygonReference: form.polygonReference,
    mapProvider:      form.mapProvider,
    externalBoundaryId: form.externalBoundaryId,
    postalCode:         form.postalCode,
  }), [form.latitude, form.longitude, form.geoBoundaryType, form.radiusValue, form.radiusUnit, form.polygonReference, form.mapProvider, form.externalBoundaryId, form.postalCode]);

  const parentRequired  = selectedLevel?.parentRequired ?? false;
  const canDel          = !isNew && existing?.status === 'Draft' && areaService.getChildren(existing.id).length === 0;
  const hasActiveChildren = !isNew && existing ? areaService.hasActiveChildren(existing.id) : false;
  const isCircular      = form.parentAreaId && existing
    ? isCircularHierarchy(existing.id, form.parentAreaId, allAreas)
    : false;

  // ── Section completion helper ──────────────────────────────────────────
  function getAreaSectionCompletion(key: AreaFormSectionKey): AreaSectionCompletion {
    if (key === 'basic')      return form.areaName ? 'complete' : 'empty';
    if (key === 'hierarchy')  return (form.areaLevelId && form.areaCategory) ? 'complete' : form.areaLevelId ? 'partial' : 'empty';
    if (key === 'usage')      return form.usageTags.length > 0 ? 'complete' : form.areaLevelId ? 'partial' : 'empty';
    if (key === 'geo')        return (form.postalCode || form.latitude || form.longitude) ? 'partial' : 'empty';
    if (key === 'aliases')    return form.aliases.length > 0 ? 'partial' : 'empty';
    if (key === 'lifecycle')  return form.remarks ? 'partial' : 'empty';
    return 'empty';
  }

  // ── Field helpers ──────────────────────────────────────────────────────

  function setField<K extends keyof AreaFormState>(key: K, val: AreaFormState[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    if (key in fieldErrors) setFieldErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleAreaLevelChange(newLevelId: string) {
    const newLevel = allLevels.find((l) => l.id === newLevelId);
    const initTags = newLevel ? getInitialUsageTags(newLevel) : [];
    const newAllowed = newLevel ? getAllowedParentAreas(newLevel, allAreas) : [];
    const parentStillValid = newAllowed.some((a) => a.id === form.parentAreaId);
    setForm((f) => ({
      ...f,
      areaLevelId: newLevelId,
      parentAreaId: parentStillValid ? f.parentAreaId : '',
      usageTags: initTags,
    }));
    setFieldErrors({});
  }

  function toggleUsageTag(tag: UsageTag) {
    if (mandatoryTags.includes(tag)) return;
    setField('usageTags', form.usageTags.includes(tag)
      ? form.usageTags.filter((t) => t !== tag)
      : [...form.usageTags, tag],
    );
  }

  // ── Alias helpers ──────────────────────────────────────────────────────

  function addAlias() {
    const newAlias: AreaAlias = {
      id:             `ALIAS-NEW-${Date.now()}`,
      aliasName:      '',
      aliasType:      'Old Name',
      languageLocale: '',
      isSearchable:   true,
      status:         'Active',
    };
    setField('aliases', [...form.aliases, newAlias]);
  }

  function updateAlias(idx: number, patch: Partial<AreaAlias>) {
    setField('aliases', form.aliases.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
    if (aliasRowErrors[idx]) {
      setAliasRowErrors((prev) => { const next = { ...prev }; delete next[idx]; return next; });
    }
  }

  function removeAlias(idx: number) {
    setField('aliases', form.aliases.filter((_, i) => i !== idx));
    setAliasRowErrors((prev) => {
      const next: Record<number, AliasRowErrors> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const ki = Number(k);
        if (ki < idx)      next[ki]     = v;
        else if (ki > idx) next[ki - 1] = v;
      });
      return next;
    });
  }

  // ── Build area from form ───────────────────────────────────────────────

  function buildAreaData(): Omit<Area, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      areaCode:          existing?.areaCode ?? areaService.generateCode(),
      areaName:          form.areaName.trim(),
      displayName:       form.displayName.trim(),
      externalLegacyCode: form.externalLegacyCode.trim(),
      description:       form.description,
      areaLevelId:       form.areaLevelId,
      parentAreaId:      form.parentAreaId || null,
      hierarchyPath:     computedHierarchyPath,
      usageTags:         form.usageTags,
      areaCategory:      form.areaCategory,
      areaClassification: form.areaClassification,
      postalCode:        form.postalCode,
      latitude:          form.latitude  ? parseFloat(form.latitude)  : null,
      longitude:         form.longitude ? parseFloat(form.longitude) : null,
      geoBoundaryType:   (form.geoBoundaryType as GeoBoundaryType) || 'Not Applicable',
      radiusValue:       form.radiusValue ? parseFloat(form.radiusValue) : null,
      radiusUnit:        form.radiusUnit,
      polygonReference:  form.polygonReference,
      mapProvider:       form.mapProvider,
      externalBoundaryId: form.externalBoundaryId,
      aliases:           form.aliases,
      status:            existing?.status ?? 'Draft',
      remarks:           form.remarks,
    };
  }

  // ── Actions ────────────────────────────────────────────────────────────

  function handleSaveDraft() {
    const data       = buildAreaData();
    const others     = allAreas.filter((a) => a.id !== existing?.id);
    const errs       = validateAreaForSave(data, others);
    const aliasErrs  = validateAliasRows(form.aliases, form.areaName);
    if (Object.keys(errs).length > 0 || Object.keys(aliasErrs).length > 0) {
      if (Object.keys(errs).length > 0)      setFieldErrors(errs);
      if (Object.keys(aliasErrs).length > 0) setAliasRowErrors(aliasErrs);
      showToast('Please fix the errors before saving.', 'error');
      return;
    }
    if (isNew) {
      const saved = areaService.create(data);
      showToast('Area saved as Draft.', 'success');
      navigate(`/admin/areas/${saved.id}`);
    } else if (existing) {
      areaService.update(existing.id, data);
      showToast('Draft saved.', 'success');
      navigate('/admin/areas');
    }
  }

  function handleActivateRequest() {
    const data     = buildAreaData();
    const areaObj  = { ...data, id: existing?.id ?? '', createdAt: '', updatedAt: '' } as Area;
    const others   = allAreas.filter((a) => a.id !== existing?.id);
    const errors   = validateAreaForActivation(areaObj, allLevels, others);
    setActivationErrors(errors);
    setActivateOpen(true);
  }

  function confirmActivate() {
    if (!existing) return;
    areaService.activate(existing.id);
    setActivateOpen(false);
    showToast(`"${existing.areaName}" activated.`, 'success');
    navigate('/admin/areas');
  }

  function confirmInactivate() {
    if (!existing || !inactivateReason.trim() || hasActiveChildren) return;
    areaService.inactivate(existing.id, inactivateReason.trim());
    setInactivateOpen(false);
    showToast(`"${existing.areaName}" inactivated.`, 'success');
    navigate('/admin/areas');
  }

  function confirmDelete() {
    if (!existing) return;
    areaService.delete(existing.id);
    setDeleteOpen(false);
    showToast(`"${existing.areaName}" deleted.`, 'success');
    navigate('/admin/areas');
  }

  const activationChecklist = activationErrors.length > 0
    ? activationErrors.map((e, i) => ({ id: String(i), label: e, passed: false }))
    : [{ id: 'ready', label: 'All required fields are complete and valid.', passed: true }];

  if (notFound) {
    return (
      <AdminShell>
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: 'var(--color-text-muted)' }}>Area not found.</p>
          <button type="button" onClick={() => navigate('/admin/areas')} style={{ ...btnOutline, marginTop: '16px' }}>← Back to List</button>
        </div>
      </AdminShell>
    );
  }

  const pageTitle = isNew ? 'New Area' : (existing?.areaName ?? 'Edit Area');

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <AdminShell>
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: toast.tone === 'success' ? '#15803D' : '#DC2626',
          color: 'white', padding: '12px 20px', borderRadius: '10px',
          fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>{toast.message}</div>
      )}

      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-surface)' }}>

        {/* ── 1. Compact Form Header ───────────────────────────────────────── */}
        <div style={{ flexShrink: 0, padding: '10px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '2px', userSelect: 'none' }}>
              Admin / Area Master
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
              Configure area properties, hierarchy, usage tags, and geo details.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button type="button" onClick={() => navigate('/admin/areas')} style={btnOutline}>← Back to List</button>
            <HeaderIconButton icon={<HelpCircle size={16} />} onClick={() => setHelpOpen(true)} title="How this works" />
          </div>
        </div>

        {/* ── 2. Workflow Bar ──────────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, height: '44px', padding: '0 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', overflowX: 'auto', flexShrink: 1, minWidth: 0 }}>
            {AREA_SECTIONS.map((s, i) => {
              const isAct = activeSection === s.key;
              const completion = getAreaSectionCompletion(s.key);
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
        {/* ─ Banners ─────────────────────────────────────────────────────── */}
        {isActive && (
          <div style={{ display: 'flex', gap: '10px', padding: '12px 16px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '10px', marginBottom: '20px' }}>
            <Info size={15} style={{ color: '#EA580C', flexShrink: 0, marginTop: '1px' }} />
            <span style={{ fontSize: '13px', color: '#9A3412', lineHeight: 1.6 }}>
              This area is <strong>Active</strong>. Area Level and Parent Area are locked. Display Name, Description, Postal, and Remarks remain editable.
            </span>
          </div>
        )}
        {isInactive && (
          <div style={{ display: 'flex', gap: '10px', padding: '12px 16px', background: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: '10px', marginBottom: '20px' }}>
            <AlertCircle size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginTop: '1px' }} />
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              This area is <strong>Inactive</strong>. All fields are read-only.
            </span>
          </div>
        )}
        {isCircular && (
          <div style={{ display: 'flex', gap: '10px', padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', marginBottom: '20px' }}>
            <AlertCircle size={15} style={{ color: '#DC2626', flexShrink: 0, marginTop: '1px' }} />
            <span style={{ fontSize: '13px', color: '#DC2626' }}>Circular hierarchy detected. The selected Parent Area is a descendant of this Area.</span>
          </div>
        )}

        {/* ─ Section 1: Basic Details ─────────────────────────────────────── */}
        {activeSection === 'basic' && (
        <div style={sCard}>
          <div style={{ ...sHead, justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Basic Details</span>
            <AreaSectionBadge completion={form.areaName ? 'complete' : 'empty'} />
          </div>
          <div style={sBody}>
            <div style={twoCol}>
              <div style={fWrap}>
                <label style={labelBase}>Area Code</label>
                <div style={readonlyField}>{existing?.areaCode ?? <em style={{ color: 'var(--color-text-muted)' }}>Auto-generated on save</em>}</div>
              </div>
              <div style={fWrap}>
                <label style={labelBase}>Area Name <span style={{ color: '#DC2626' }}>*</span></label>
                <input type="text" value={form.areaName}
                  onChange={(e) => setField('areaName', e.target.value)}
                  disabled={isViewOnly}
                  placeholder="e.g. Hinjewadi"
                  style={fieldErrors.areaName ? inputErr : inputBase}
                />
                {fieldErrors.areaName && <p style={fieldErrText}>{fieldErrors.areaName}</p>}
              </div>
            </div>
            <div style={twoCol}>
              <div style={fWrap}>
                <label style={labelBase}>Display Name</label>
                <input type="text" value={form.displayName}
                  onChange={(e) => setField('displayName', e.target.value)}
                  disabled={isViewOnly}
                  placeholder="User-facing label (if different)"
                  style={inputBase}
                />
              </div>
              <div style={fWrap}>
                <label style={labelBase}>External / Legacy Code</label>
                <input type="text" value={form.externalLegacyCode}
                  onChange={(e) => setField('externalLegacyCode', e.target.value)}
                  disabled={isViewOnly}
                  placeholder="e.g. PUNE-HINJ"
                  style={inputBase}
                />
              </div>
            </div>
            <div style={fWrap}>
              <label style={labelBase}>Description</label>
              <textarea value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                disabled={isViewOnly}
                rows={3}
                placeholder="Describe this area's purpose or coverage…"
                style={{ ...inputBase, resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>
          </div>
        </div>
        )}

        {/* ─ Section 2: Hierarchy & Classification ────────────────────────── */}
        {activeSection === 'hierarchy' && (
        <div style={sCard}>
          <div style={{ ...sHead, justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Hierarchy &amp; Classification</span>
            <AreaSectionBadge completion={(form.areaLevelId && form.areaCategory) ? 'complete' : form.areaLevelId ? 'partial' : 'empty'} />
          </div>
          <div style={sBody}>
            <div style={twoCol}>
              {/* Area Level */}
              <div style={fWrap}>
                <label style={labelBase}>Area Level <span style={{ color: '#DC2626' }}>*</span></label>
                {(isActive || isViewOnly) ? (
                  <div style={{ ...readonlyField, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={12} style={{ color: 'var(--color-text-muted)' }} />
                    {allLevels.find((l) => l.id === form.areaLevelId)?.areaLevelName ?? '—'}
                  </div>
                ) : (
                  <select value={form.areaLevelId}
                    onChange={(e) => handleAreaLevelChange(e.target.value)}
                    style={fieldErrors.areaLevelId ? inputErr : inputBase}
                  >
                    <option value="">— Select Area Level —</option>
                    {activeLevels.map((l) => (
                      <option key={l.id} value={l.id}>{l.areaLevelName} (Seq {l.levelSequence})</option>
                    ))}
                  </select>
                )}
                {fieldErrors.areaLevelId && <p style={fieldErrText}>{fieldErrors.areaLevelId}</p>}
              </div>

              {/* Parent Area — only shown when parentRequired */}
              {(parentRequired || form.parentAreaId) && (
                <div style={fWrap}>
                  <label style={labelBase}>
                    Parent Area {parentRequired && <span style={{ color: '#DC2626' }}>*</span>}
                  </label>
                  {(isActive || isViewOnly) ? (
                    <div style={{ ...readonlyField, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Lock size={12} style={{ color: 'var(--color-text-muted)' }} />
                      {allAreas.find((a) => a.id === form.parentAreaId)?.areaName ?? '—'}
                    </div>
                  ) : (
                    <select value={form.parentAreaId}
                      onChange={(e) => setField('parentAreaId', e.target.value)}
                      disabled={!form.areaLevelId}
                      style={fieldErrors.parentAreaId ? inputErr : inputBase}
                    >
                      <option value="">— No parent —</option>
                      {allowedParentAreas.map((a) => (
                        <option key={a.id} value={a.id}>{a.areaName} ({a.hierarchyPath})</option>
                      ))}
                    </select>
                  )}
                  {fieldErrors.parentAreaId && <p style={fieldErrText}>{fieldErrors.parentAreaId}</p>}
                  {!form.areaLevelId && !isActive && (
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Select an Area Level first.</p>
                  )}
                </div>
              )}
            </div>

            {/* Hierarchy Path */}
            <div style={fWrap}>
              <label style={labelBase}>Hierarchy Path</label>
              <div style={readonlyField}>{computedHierarchyPath || <em style={{ color: 'var(--color-text-muted)' }}>Enter Area Name to preview</em>}</div>
            </div>

            <div style={twoCol}>
              <div style={fWrap}>
                <label style={labelBase}>Area Category</label>
                <select value={form.areaCategory} onChange={(e) => setField('areaCategory', e.target.value)} disabled={isViewOnly} style={inputBase}>
                  <option value="">— None —</option>
                  {AREA_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={fWrap}>
                <label style={labelBase}>Area Classification</label>
                <select value={form.areaClassification} onChange={(e) => setField('areaClassification', e.target.value)} disabled={isViewOnly} style={inputBase}>
                  <option value="">— None —</option>
                  {AREA_CLASSIFICATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* ─ Section 3: Usage & Applicability ─────────────────────────────── */}
        {activeSection === 'usage' && (
        <div style={sCard}>
          <div style={{ ...sHead, justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Usage &amp; Applicability</span>
            <AreaSectionBadge completion={form.usageTags.length > 0 ? 'complete' : form.areaLevelId ? 'partial' : 'empty'} />
          </div>
          <div style={sBody}>
            {!form.areaLevelId ? (
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                Select an Area Level to see the available usage tags.
              </p>
            ) : allowedTags.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                The selected Area Level has no usage tags defined.
              </p>
            ) : (
              <>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '12px', lineHeight: 1.5 }}>
                  Select usage contexts for this area.{' '}
                  {mandatoryTags.length > 0 && <span><Lock size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> Mandatory tags are locked.</span>}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {allowedTags.map((tag) => {
                    const isMandatory = mandatoryTags.includes(tag);
                    const selected    = form.usageTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        disabled={isViewOnly || isMandatory}
                        onClick={() => toggleUsageTag(tag)}
                        title={isMandatory ? 'Mandatory — cannot be removed' : undefined}
                        style={{
                          padding: '5px 12px', fontSize: '12px', fontWeight: 500,
                          border: `1.5px solid ${selected ? (isMandatory ? '#D97706' : 'var(--color-primary)') : 'var(--color-border)'}`,
                          borderRadius: '6px',
                          cursor: (isViewOnly || isMandatory) ? 'default' : 'pointer',
                          background: selected ? (isMandatory ? '#FEF3C7' : 'var(--color-primary)') : 'transparent',
                          color: selected ? (isMandatory ? '#B45309' : 'white') : 'var(--color-text)',
                          opacity: !selected && isViewOnly ? 0.5 : 1,
                        }}
                      >
                        {tag}
                        {isMandatory && <Lock size={10} style={{ marginLeft: '4px', display: 'inline', verticalAlign: 'middle' }} />}
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.usageTags && <p style={fieldErrText}>{fieldErrors.usageTags}</p>}
              </>
            )}
          </div>
        </div>
        )}

        {/* ─ Section 4: Geo & Postal Details ──────────────────────────────── */}
        {activeSection === 'geo' && (
        <div style={sCard}>
          <div style={{ ...sHead, justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Geo &amp; Postal Details</span>
            <AreaSectionBadge completion={(form.postalCode || form.latitude || form.longitude) ? 'partial' : 'empty'} />
          </div>
          <div style={sBody}>
            <div style={twoCol}>
              <div style={fWrap}>
                <label style={labelBase}>Postal / Pin Code</label>
                <input type="text" value={form.postalCode} onChange={(e) => setField('postalCode', e.target.value)} disabled={isViewOnly} placeholder="e.g. 411057" style={geoErrors.postalCode ? inputErr : inputBase} />
                <p style={{ fontSize: '11px', color: geoErrors.postalCode ? '#DC2626' : 'var(--color-text-muted)', marginTop: '4px' }}>
                  {geoErrors.postalCode ?? 'Required when Geo Boundary Type is Postal / Pin Code Based.'}
                </p>
              </div>
              <div style={fWrap}>
                <label style={labelBase}>Geo Boundary Type</label>
                <select value={form.geoBoundaryType} onChange={(e) => setField('geoBoundaryType', e.target.value)} disabled={isViewOnly} style={inputBase}>
                  {GEO_BOUNDARY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Controls which boundary fields are required for activation.
                </p>
              </div>
            </div>

            <div style={twoCol}>
              <div style={fWrap}>
                <label style={labelBase}>Latitude</label>
                <input type="number" step="any" value={form.latitude} onChange={(e) => setField('latitude', e.target.value)} disabled={isViewOnly} placeholder="e.g. 18.5913" style={geoErrors.latitude ? inputErr : inputBase} />
                <p style={{ fontSize: '11px', color: geoErrors.latitude ? '#DC2626' : 'var(--color-text-muted)', marginTop: '4px' }}>
                  {geoErrors.latitude ?? 'Range: −90 to +90. Enter together with Longitude.'}
                </p>
              </div>
              <div style={fWrap}>
                <label style={labelBase}>Longitude</label>
                <input type="number" step="any" value={form.longitude} onChange={(e) => setField('longitude', e.target.value)} disabled={isViewOnly} placeholder="e.g. 73.7389" style={geoErrors.longitude ? inputErr : inputBase} />
                <p style={{ fontSize: '11px', color: geoErrors.longitude ? '#DC2626' : 'var(--color-text-muted)', marginTop: '4px' }}>
                  {geoErrors.longitude ?? 'Range: −180 to +180. Enter together with Latitude.'}
                </p>
              </div>
            </div>

            {/* Radius fields */}
            {form.geoBoundaryType === 'Radius' && (
              <div style={twoCol}>
                <div style={fWrap}>
                  <label style={labelBase}>Radius Value <span style={{ color: '#DC2626' }}>*</span></label>
                  <input type="number" step="any" min="0" value={form.radiusValue} onChange={(e) => setField('radiusValue', e.target.value)} disabled={isViewOnly} placeholder="e.g. 5" style={geoErrors.radiusValue ? inputErr : inputBase} />
                  {geoErrors.radiusValue && <p style={fieldErrText}>{geoErrors.radiusValue}</p>}
                </div>
                <div style={fWrap}>
                  <label style={labelBase}>Radius Unit <span style={{ color: '#DC2626' }}>*</span></label>
                  <select value={form.radiusUnit} onChange={(e) => setField('radiusUnit', e.target.value)} disabled={isViewOnly} style={geoErrors.radiusUnit ? inputErr : inputBase}>
                    <option value="">— Select Unit —</option>
                    {RADIUS_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                  {geoErrors.radiusUnit && <p style={fieldErrText}>{geoErrors.radiusUnit}</p>}
                </div>
              </div>
            )}

            {/* Polygon field */}
            {form.geoBoundaryType === 'Polygon' && (
              <div style={fWrap}>
                <label style={labelBase}>Polygon Reference <span style={{ color: '#DC2626' }}>*</span></label>
                <input type="text" value={form.polygonReference} onChange={(e) => setField('polygonReference', e.target.value)} disabled={isViewOnly} placeholder="GeoJSON ID or polygon reference key" style={geoErrors.polygonReference ? inputErr : inputBase} />
                <p style={{ fontSize: '11px', color: geoErrors.polygonReference ? '#DC2626' : 'var(--color-text-muted)', marginTop: '4px' }}>
                  {geoErrors.polygonReference ?? 'Enter a GeoJSON identifier, polygon ID, or external reference key.'}
                </p>
              </div>
            )}

            {/* External Map Reference fields */}
            {form.geoBoundaryType === 'External Map Reference' && (
              <div style={twoCol}>
                <div style={fWrap}>
                  <label style={labelBase}>Map Provider <span style={{ color: '#DC2626' }}>*</span></label>
                  <select value={form.mapProvider} onChange={(e) => setField('mapProvider', e.target.value)} disabled={isViewOnly} style={geoErrors.mapProvider ? inputErr : inputBase}>
                    <option value="">— Select Provider —</option>
                    {MAP_PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {geoErrors.mapProvider && <p style={fieldErrText}>{geoErrors.mapProvider}</p>}
                </div>
                <div style={fWrap}>
                  <label style={labelBase}>External Boundary ID <span style={{ color: '#DC2626' }}>*</span></label>
                  <input type="text" value={form.externalBoundaryId} onChange={(e) => setField('externalBoundaryId', e.target.value)} disabled={isViewOnly} placeholder="External reference ID" style={geoErrors.externalBoundaryId ? inputErr : inputBase} />
                  {geoErrors.externalBoundaryId && <p style={fieldErrText}>{geoErrors.externalBoundaryId}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* ─ Section 5: Aliases / Alternate Names ──────────────────────────── */}
        {activeSection === 'aliases' && (
        <div style={sCard}>
          <div style={{ ...sHead, justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Aliases / Alternate Names</span>
            {!isViewOnly && (
              <button type="button" onClick={addAlias}
                style={{ ...btnOutline, padding: '5px 12px', fontSize: '12px' }}>
                + Add Alias
              </button>
            )}
          </div>
          <div style={sBody}>
            {form.aliases.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontStyle: 'italic', lineHeight: 1.6 }}>
                No aliases added.{' '}
                {!isViewOnly && (
                  <button type="button" onClick={addAlias}
                    style={{ fontSize: '13px', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    Add the first alias
                  </button>
                )}
              </p>
            ) : (
              <>
                {/* Column headers */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 80px 90px 44px', gap: '8px', padding: '0 4px 8px', borderBottom: '1px solid var(--color-border)', marginBottom: '10px' }}>
                  {['Alias Name *', 'Alias Type *', 'Locale', 'Searchable', 'Status', ''].map((h, i) => (
                    <span key={i} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</span>
                  ))}
                </div>

                {form.aliases.map((alias, idx) => {
                  const rowErr = aliasRowErrors[idx];
                  return (
                    <div key={alias.id} style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 80px 90px 44px', gap: '8px', alignItems: 'center' }}>
                        {/* Alias Name */}
                        <input
                          type="text"
                          value={alias.aliasName}
                          onChange={(e) => updateAlias(idx, { aliasName: e.target.value })}
                          disabled={isViewOnly}
                          placeholder="e.g. Poona"
                          style={rowErr?.aliasName ? inputErr : inputBase}
                        />
                        {/* Alias Type */}
                        <select
                          value={alias.aliasType}
                          onChange={(e) => updateAlias(idx, { aliasType: e.target.value as AliasType })}
                          disabled={isViewOnly}
                          style={rowErr?.aliasType ? inputErr : inputBase}
                        >
                          <option value="">— Type —</option>
                          {ALIAS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        {/* Locale */}
                        <input
                          type="text"
                          value={alias.languageLocale}
                          onChange={(e) => updateAlias(idx, { languageLocale: e.target.value })}
                          disabled={isViewOnly}
                          placeholder="e.g. hi-IN"
                          style={inputBase}
                        />
                        {/* Is Searchable */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                          <input
                            type="checkbox"
                            checked={alias.isSearchable}
                            onChange={(e) => updateAlias(idx, { isSearchable: e.target.checked })}
                            disabled={isViewOnly}
                            style={{ width: '16px', height: '16px', cursor: isViewOnly ? 'default' : 'pointer' }}
                          />
                          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                            {alias.isSearchable ? 'Yes' : 'No'}
                          </span>
                        </div>
                        {/* Status */}
                        <select
                          value={alias.status}
                          onChange={(e) => updateAlias(idx, { status: e.target.value as AreaStatus })}
                          disabled={isViewOnly}
                          style={inputBase}
                        >
                          {ALIAS_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {/* Remove */}
                        {!isViewOnly && (
                          <button
                            type="button"
                            onClick={() => removeAlias(idx)}
                            title="Remove alias"
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: '32px', height: '32px', border: '1px solid #FCA5A5',
                              borderRadius: '6px', background: '#FEF2F2', color: '#DC2626',
                              cursor: 'pointer', fontSize: '16px', flexShrink: 0,
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                      {/* Row-level errors */}
                      {(rowErr?.aliasName || rowErr?.aliasType) && (
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 80px 90px 44px', gap: '8px', marginTop: '3px' }}>
                          <div>{rowErr?.aliasName && <p style={fieldErrText}>{rowErr.aliasName}</p>}</div>
                          <div>{rowErr?.aliasType && <p style={fieldErrText}>{rowErr.aliasType}</p>}</div>
                          <div /><div /><div /><div />
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '8px', lineHeight: 1.5 }}>
              Active searchable aliases are included in Area search. Inactive aliases are excluded from search.
            </p>
          </div>
        </div>
        )}

        {/* ─ Section 6: Lifecycle & Remarks ─────────────────────────────────────── */}
        {activeSection === 'lifecycle' && (
        <div style={sCard}>
          <div style={{ ...sHead, justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Lifecycle &amp; Remarks</span>
            <AreaSectionBadge completion={form.remarks ? 'partial' : 'empty'} />
          </div>
          <div style={sBody}>
            <div style={twoCol}>
              <div style={fWrap}>
                <label style={labelBase}>Status</label>
                <div style={readonlyField}>{existing?.status ?? 'Draft (not yet saved)'}</div>
              </div>
              <div style={fWrap}>
                <label style={labelBase}>Created At</label>
                <div style={readonlyField}>
                  {existing?.createdAt ? new Date(existing.createdAt).toLocaleDateString() : '—'}
                </div>
              </div>
            </div>
            <div style={fWrap}>
              <label style={labelBase}>Remarks</label>
              <textarea value={form.remarks} onChange={(e) => setField('remarks', e.target.value)} disabled={isViewOnly} rows={3}
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
            onClick={() => { if (AREA_SECTION_ORDER.indexOf(activeSection) > 0) setActiveSection(AREA_SECTION_ORDER[AREA_SECTION_ORDER.indexOf(activeSection) - 1]); }}
            disabled={AREA_SECTION_ORDER.indexOf(activeSection) === 0}
            style={{ ...btnOutline, opacity: AREA_SECTION_ORDER.indexOf(activeSection) === 0 ? 0.4 : 1, cursor: AREA_SECTION_ORDER.indexOf(activeSection) === 0 ? 'not-allowed' : 'pointer' }}
          >← Previous</button>
          {canDel && (
            <button type="button" onClick={() => setDeleteOpen(true)} style={btnDanger}>Delete</button>
          )}
          {/* Step counter */}
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', padding: '0 4px' }}>
            Step {AREA_SECTION_ORDER.indexOf(activeSection) + 1} of {AREA_SECTION_ORDER.length}
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
          {AREA_SECTION_ORDER.indexOf(activeSection) < AREA_SECTION_ORDER.length - 1 && (
            <button type="button" onClick={() => setActiveSection(AREA_SECTION_ORDER[AREA_SECTION_ORDER.indexOf(activeSection) + 1])} style={btnPrimary}>Continue →</button>
          )}
          {AREA_SECTION_ORDER.indexOf(activeSection) === AREA_SECTION_ORDER.length - 1 && isDraft && !isNew && (
            <button type="button" onClick={handleActivateRequest} style={btnPrimary}>Activate</button>
          )}
          {AREA_SECTION_ORDER.indexOf(activeSection) === AREA_SECTION_ORDER.length - 1 && isNew && (
            <button type="button" onClick={handleSaveDraft} style={btnPrimary}>Save Draft</button>
          )}
        </div>
      </div> {/* close outer column */}

      {/* ── Inactivate Drawer ──────────────────────────────────────────── */}
      <SmartFormDrawer
        open={inactivateOpen}
        onClose={() => { setInactivateOpen(false); setInactivateReason(''); }}
        title="Inactivate Area"
        subtitle={existing?.areaName}
        width="sm"
        onSave={confirmInactivate}
        saveLabel="Inactivate"
        saveDisabled={hasActiveChildren || !inactivateReason.trim()}
        validationErrors={
          hasActiveChildren
            ? ['This area has active child areas. Inactivate all child areas first.']
            : !inactivateReason.trim()
              ? ['Reason is required.']
              : undefined
        }
      >
        <div>
          {hasActiveChildren ? (
            <div style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', fontSize: '13px', color: '#DC2626', lineHeight: 1.6 }}>
              This area has one or more <strong>active child areas</strong>. You must inactivate all child areas before inactivating this area.
            </div>
          ) : (
            <>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '14px', lineHeight: 1.6 }}>
                Inactivating this area removes it from selection as a parent area. Provide a reason below.
              </p>
              <label style={labelBase}>Reason <span style={{ color: '#DC2626' }}>*</span></label>
              <textarea value={inactivateReason} onChange={(e) => setInactivateReason(e.target.value)} rows={4}
                placeholder="Describe why this area is being inactivated…"
                style={{ ...inputBase, border: `1px solid ${inactivateReason.trim() ? 'var(--color-border)' : '#FCA5A5'}`, resize: 'vertical', lineHeight: 1.6 }}
              />
            </>
          )}
        </div>
      </SmartFormDrawer>

      {/* ── Activate Confirm ───────────────────────────────────────────── */}
      <SmartReviewDrawer
        open={activateOpen}
        onClose={() => { setActivateOpen(false); setActivationErrors([]); }}
        title="Activate Area"
        subtitle={form.areaName || pageTitle}
        description="Review the checklist and confirm activation. Once active, this area can be used as a parent area."
        checklist={activationChecklist}
        warningText={activationErrors.length > 0 ? 'Resolve all issues before activating.' : undefined}
        consequenceNote="Activated areas can be selected as parent areas and used in transactions. You can inactivate later."
        confirmLabel="Activate"
        confirmDisabled={activationErrors.length > 0}
        onConfirm={confirmActivate}
        onCancel={() => { setActivateOpen(false); setActivationErrors([]); }}
      />

      {/* ── Delete Confirm ─────────────────────────────────────────────── */}
      <SmartReviewDrawer
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Area"
        subtitle={existing?.areaName}
        description="This action is permanent and cannot be undone."
        checklist={[
          { id: 'draft',      label: 'Area is in Draft status.',   passed: existing?.status === 'Draft' },
          { id: 'nochildren', label: 'Area has no child areas.',   passed: existing ? areaService.getChildren(existing.id).length === 0 : false },
        ]}
        warningText="This record will be permanently deleted."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      {/* ── Help Drawer ──────────────────────────────────────────── */}
      <HelpDrawer
        open={helpOpen}
        topic={getHelpTopic('area-master')}
        onClose={() => setHelpOpen(false)}
      />
    </AdminShell>
  );
};

export default AreaFormPage;
