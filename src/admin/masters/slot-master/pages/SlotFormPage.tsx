// ─── Slot Master — Form Page ──────────────────────────────────────────────────
// Layout: left 60% (form cards) + right 40% (sticky live slot preview)
// Status lifecycle: Draft → Activate → Inactive

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ChevronRight, Info, Lock, Unlock } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { findGroupForMasterKey, findMasterByKey } from '../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../adminStorage';
import type { SlotRecord, SlotFormErrors, DayOfWeek } from '../types/slotMaster.types';
import {
  DEFAULT_SLOT_FORM, MASTER_KEY, TRANSACTION_ENTITIES, MOCK_ROLES,
  ALL_DAYS, DAY_LABELS, SLOT_STATUS_META, MOCK_BRANCH,
} from '../constants/slotMaster.constants';
import { slotService, generateSlots, resolveTaggedEmployees } from '../services/slotService';
import { validateSlot } from '../utils/slotValidation';
import { SlotPreviewPanel } from '../components/SlotPreviewPanel';
import { EmployeeTagChips } from '../components/EmployeeTagChips';

// ─── MASTER_KEY constant ──────────────────────────────────────────────────────

const _MK = MASTER_KEY;

// ─── Inline styles ────────────────────────────────────────────────────────────

const sCard: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '12px', overflow: 'hidden', marginBottom: '16px',
};

const sCardHead: React.CSSProperties = {
  padding: '10px 18px', borderBottom: '1px solid var(--color-border)',
  background: 'var(--color-surface-subtle)',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
};

const sCardBody: React.CSSProperties = {
  padding: '16px 18px',
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px',
};

const sLabel: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 600,
  color: 'var(--color-text-muted)', marginBottom: '5px',
  textTransform: 'uppercase', letterSpacing: '0.03em',
};

const sInput: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: '13px', boxSizing: 'border-box',
  border: '1px solid var(--color-border)', borderRadius: '8px',
  background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none',
};

const sInputError: React.CSSProperties = { ...sInput, borderColor: '#DC2626' };

const sInputReadOnly: React.CSSProperties = {
  ...sInput, background: 'var(--color-surface-subtle)',
  color: 'var(--color-text-muted)', cursor: 'not-allowed',
};

const sErrTxt: React.CSSProperties = { fontSize: '11px', color: '#DC2626', marginTop: '3px' };

const sFull: React.CSSProperties = { gridColumn: '1 / -1' };

const sReq = (): React.ReactElement => (
  <span style={{ color: '#DC2626', marginLeft: '2px' }}>*</span>
);

// ─── Component ────────────────────────────────────────────────────────────────

const SlotFormPage: React.FC = () => {
  const navigate      = useNavigate();
  const { recordId }  = useParams<{ recordId: string }>();
  const isNew         = !recordId;

  const existing = useMemo(
    () => (recordId ? slotService.getById(recordId) ?? null : null),
    [recordId],
  );

  const isViewOnly = !isNew && existing?.status === 'Active';

  // ── Form state ────────────────────────────────────────────────────────────
  type FormState = Omit<SlotRecord, 'id' | 'createdAt' | 'updatedAt'>;

  const [form, setFormState] = useState<FormState>(() => {
    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, createdAt: _ca, updatedAt: _ua, ...rest } = existing;
      return rest;
    }
    return { ...DEFAULT_SLOT_FORM, slotCode: slotService.generateCode() };
  });

  const [codeLocked,    setCodeLocked]    = useState(true);
  const [errors,        setErrors]        = useState<SlotFormErrors>({});
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [saving,        setSaving]        = useState(false);

  // For existing records the code is always locked — no useEffect needed
  // (initial state already set to true; no runtime toggle required)

  function setForm(updater: Partial<FormState> | ((prev: FormState) => Partial<FormState>)) {
    setFormState((prev) => {
      const patch = typeof updater === 'function' ? updater(prev) : updater;
      return { ...prev, ...patch };
    });
  }

  // ── Auto-populate displayName from name ────────────────────────────────────
  function handleNameChange(value: string) {
    setForm((prev) => ({
      name: value,
      displayName: prev.displayName === prev.name ? value : prev.displayName,
    }));
  }

  // ── Auto-tag employees when role changes ────────────────────────────────────
  function handleRoleChange(roleId: string) {
    const employees = resolveTaggedEmployees(roleId);
    setForm({ tagToRole: roleId, taggedEmployees: employees });
  }

  function handleReassign() {
    const employees = resolveTaggedEmployees(form.tagToRole);
    setForm({ taggedEmployees: employees });
  }

  // ── Day toggles ────────────────────────────────────────────────────────────
  function toggleDay(day: DayOfWeek) {
    setForm((prev) => {
      const active = prev.activeDays ?? [];
      const next = active.includes(day) ? active.filter((d) => d !== day) : [...active, day];
      return { activeDays: next };
    });
  }

  // ── Live slot count ────────────────────────────────────────────────────────
  const liveGenerated = useMemo(() => {
    if (!form.startDate || !form.endDate || !form.slotStartTime || !form.slotEndTime || form.slotDurationMin <= 0) return [];
    return generateSlots({
      startDate: form.startDate, endDate: form.endDate,
      slotStartTime: form.slotStartTime, slotEndTime: form.slotEndTime,
      slotDurationMin: form.slotDurationMin, timeGapMin: form.timeGapMin ?? 0,
      activeDays: form.activeDays,
    });
  }, [form.startDate, form.endDate, form.slotStartTime, form.slotEndTime, form.slotDurationMin, form.timeGapMin, form.activeDays]);

  const dailySlotCount = liveGenerated.length > 0 ? liveGenerated[0].slots.length : 0;
  const totalSlotCount = liveGenerated.reduce((s, d) => s + d.slots.length, 0);
  const totalDays      = liveGenerated.length;

  // ── Validate on demand ─────────────────────────────────────────────────────
  const validateNow = useCallback(() => {
    const all = slotService.getAll();
    const errs = validateSlot(
      { ...form, dailySlotCount, totalSlotCount, totalDays },
      all,
      isNew ? undefined : recordId,
    );
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form, dailySlotCount, totalSlotCount, totalDays, isNew, recordId]);

  // Re-validate after each form change once the user has attempted save
  // Use layout effect to avoid cascading renders on the same tick
  React.useLayoutEffect(() => {
    if (saveAttempted) validateNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, saveAttempted]);

  // ── Save (Draft) ───────────────────────────────────────────────────────────
  function handleSave() {
    setSaveAttempted(true);
    if (!validateNow()) return;
    setSaving(true);

    const payload: Omit<SlotRecord, 'id'> = {
      ...form, dailySlotCount, totalSlotCount, totalDays, generatedDays: liveGenerated,
    };

    if (isNew) {
      slotService.create(payload);
    } else if (recordId) {
      slotService.update(recordId, payload);
    }

    setSaving(false);
    navigate('/admin/master/slot-master');
  }

  // ── Activate directly from form ────────────────────────────────────────────
  function handleActivate() {
    setSaveAttempted(true);
    if (!validateNow()) return;
    setSaving(true);

    const payload: Omit<SlotRecord, 'id'> = {
      ...form, status: 'Active', dailySlotCount, totalSlotCount, totalDays, generatedDays: liveGenerated,
    };

    if (isNew) {
      slotService.create(payload);
    } else if (recordId) {
      slotService.update(recordId, payload);
      slotService.activate(recordId);
    }

    setSaving(false);
    navigate('/admin/master/slot-master');
  }

  // ── Record recent ──────────────────────────────────────────────────────────
  useEffect(() => {
    const master = findMasterByKey(_MK);
    const group  = findGroupForMasterKey(_MK);
    if (master && group) {
      recordRecentAdminMaster({
        key: master.key, label: master.label, path: master.path,
        groupLabel: group.label, groupIconBg: group.iconBg, groupIconColor: group.iconColor,
      });
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const statusMeta = SLOT_STATUS_META[form.status];

  return (
    <AdminShell>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

        {/* ── Page header ────────────────────────────────────────────────── */}
        <div style={{
          padding: '12px 24px', borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)', display: 'flex', alignItems: 'center',
          gap: '8px', flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={() => navigate('/admin/master/slot-master')}
            style={{ fontSize: '12px', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '3px' }}
          >
            Slot Master
          </button>
          <ChevronRight size={12} style={{ color: 'var(--color-text-muted)' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>
            {isNew ? 'New Slot' : form.name || 'Edit Slot'}
          </span>
          {!isNew && (
            <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: statusMeta.bg, color: statusMeta.color }}>
              {form.status}
            </span>
          )}
          {isViewOnly && (
            <span style={{ marginLeft: '4px', fontSize: '11px', color: '#B45309', background: '#FFFBEB', padding: '2px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Info size={11} /> View Only — activate to edit
            </span>
          )}
        </div>

        {/* ── Body: form (left) + preview (right) ────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* LEFT: form area */}
          <div style={{ flex: '0 0 60%', overflowY: 'auto', padding: '20px 24px 80px' }}>

            {/* General error banner */}
            {errors.general && (
              <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FCA5A5', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <AlertCircle size={15} style={{ color: '#DC2626', flexShrink: 0, marginTop: '1px' }} />
                <span style={{ fontSize: '12px', color: '#DC2626' }}>{errors.general}</span>
              </div>
            )}

            {/* ── Card 1: Basic Information ─────────────────────────────── */}
            <div style={sCard}>
              <div style={sCardHead}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Basic Information</span>
              </div>
              <div style={sCardBody}>

                {/* Slot Code */}
                <div>
                  <label style={sLabel}>Slot Code</label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      value={form.slotCode}
                      onChange={(e) => codeLocked ? undefined : setForm({ slotCode: e.target.value })}
                      readOnly={codeLocked || isViewOnly}
                      style={codeLocked ? sInputReadOnly : sInput}
                    />
                    {!isViewOnly && (
                      <button
                        type="button" title={codeLocked ? 'Unlock to edit code' : 'Lock code'}
                        onClick={() => setCodeLocked((l) => !l)}
                        style={{ flexShrink: 0, width: '34px', height: '34px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}
                      >
                        {codeLocked ? <Lock size={13} /> : <Unlock size={13} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Entity */}
                <div>
                  <label style={sLabel}>Entity {sReq()}</label>
                  <select
                    value={form.entity}
                    onChange={(e) => setForm({ entity: e.target.value })}
                    disabled={isViewOnly}
                    style={errors.entity ? sInputError : sInput}
                  >
                    <option value="">— Select entity —</option>
                    {TRANSACTION_ENTITIES.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                  {errors.entity && <p style={sErrTxt}>{errors.entity}</p>}
                </div>

                {/* Name */}
                <div>
                  <label style={sLabel}>Slot Name {sReq()}</label>
                  <input
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Morning Service Slots"
                    disabled={isViewOnly}
                    style={errors.name ? sInputError : sInput}
                  />
                  {errors.name && <p style={sErrTxt}>{errors.name}</p>}
                </div>

                {/* Display Name */}
                <div>
                  <label style={sLabel}>Display Name</label>
                  <input
                    value={form.displayName}
                    onChange={(e) => setForm({ displayName: e.target.value })}
                    placeholder="Auto-filled from name, editable"
                    disabled={isViewOnly}
                    style={sInput}
                  />
                </div>

                {/* Description */}
                <div style={{ ...sFull }}>
                  <label style={sLabel}>Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ description: e.target.value })}
                    placeholder="Optional description (max 500 chars)"
                    maxLength={500}
                    rows={2}
                    disabled={isViewOnly}
                    style={{ ...sInput, resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>
              </div>
            </div>

            {/* ── Card 2: Schedule Configuration ───────────────────────── */}
            <div style={sCard}>
              <div style={sCardHead}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Schedule Configuration</span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Branch: <strong>{MOCK_BRANCH.name}</strong> · {MOCK_BRANCH.workStart}–{MOCK_BRANCH.workEnd}
                </span>
              </div>
              <div style={sCardBody}>

                {/* Start Date */}
                <div>
                  <label style={sLabel}>Start Date {sReq()}</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ startDate: e.target.value })}
                    disabled={isViewOnly}
                    style={errors.startDate ? sInputError : sInput}
                  />
                  {errors.startDate && <p style={sErrTxt}>{errors.startDate}</p>}
                </div>

                {/* End Date */}
                <div>
                  <label style={sLabel}>End Date {sReq()}</label>
                  <input
                    type="date"
                    value={form.endDate}
                    min={form.startDate || undefined}
                    onChange={(e) => setForm({ endDate: e.target.value })}
                    disabled={isViewOnly}
                    style={errors.endDate ? sInputError : sInput}
                  />
                  {errors.endDate && <p style={sErrTxt}>{errors.endDate}</p>}
                </div>

                {/* Slot Start Time */}
                <div>
                  <label style={sLabel}>Slot Start Time {sReq()}</label>
                  <input
                    type="time"
                    value={form.slotStartTime}
                    onChange={(e) => setForm({ slotStartTime: e.target.value })}
                    disabled={isViewOnly}
                    style={errors.slotStartTime ? sInputError : sInput}
                  />
                  {errors.slotStartTime && <p style={sErrTxt}>{errors.slotStartTime}</p>}
                </div>

                {/* Slot End Time */}
                <div>
                  <label style={sLabel}>Slot End Time {sReq()}</label>
                  <input
                    type="time"
                    value={form.slotEndTime}
                    min={form.slotStartTime || undefined}
                    onChange={(e) => setForm({ slotEndTime: e.target.value })}
                    disabled={isViewOnly}
                    style={errors.slotEndTime ? sInputError : sInput}
                  />
                  {errors.slotEndTime && <p style={sErrTxt}>{errors.slotEndTime}</p>}
                </div>

                {/* Duration */}
                <div>
                  <label style={sLabel}>Slot Duration (min) {sReq()}</label>
                  <input
                    type="number" min={1} max={480}
                    value={form.slotDurationMin}
                    onChange={(e) => setForm({ slotDurationMin: Number(e.target.value) })}
                    disabled={isViewOnly}
                    style={errors.slotDurationMin ? sInputError : sInput}
                  />
                  {errors.slotDurationMin && <p style={sErrTxt}>{errors.slotDurationMin}</p>}
                </div>

                {/* Time Gap */}
                <div>
                  <label style={sLabel}>Time Gap Between Slots (min)</label>
                  <input
                    type="number" min={0} max={120}
                    value={form.timeGapMin ?? 0}
                    onChange={(e) => setForm({ timeGapMin: Number(e.target.value) })}
                    disabled={isViewOnly}
                    style={sInput}
                  />
                </div>

                {/* Active Days */}
                <div style={sFull}>
                  <label style={sLabel}>Active Days {sReq()}</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {ALL_DAYS.map((day) => {
                      const active = form.activeDays.includes(day);
                      const isWorkingDay = MOCK_BRANCH.workingDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={isViewOnly}
                          onClick={() => !isViewOnly && toggleDay(day)}
                          title={`${DAY_LABELS[day]}${!isWorkingDay ? ' (non-working day)' : ''}`}
                          style={{
                            width: '42px', height: '34px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                            border: active ? 'none' : `1px solid ${isWorkingDay ? 'var(--color-border)' : '#E2E8F0'}`,
                            background: active ? 'var(--color-primary)' : (isWorkingDay ? 'transparent' : 'var(--color-surface-subtle)'),
                            color: active ? '#fff' : (isWorkingDay ? 'var(--color-text)' : 'var(--color-text-muted)'),
                            cursor: isViewOnly ? 'not-allowed' : 'pointer',
                            opacity: !isWorkingDay && !active ? 0.5 : 1,
                          }}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                  {errors.activeDays && <p style={sErrTxt}>{errors.activeDays}</p>}
                </div>

                {/* Autogenerated counts */}
                {totalSlotCount > 0 && (
                  <div style={{ ...sFull, display: 'flex', gap: '10px' }}>
                    {[
                      { label: 'Total Days',  value: totalDays },
                      { label: 'Slots / Day', value: dailySlotCount },
                      { label: 'Total Slots', value: totalSlotCount },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ flex: 1, padding: '10px 14px', background: 'var(--color-surface-subtle)', borderRadius: '8px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-primary)' }}>{value}</div>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Card 3: Employee Tagging ──────────────────────────────── */}
            <div style={sCard}>
              <div style={sCardHead}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Employee Tagging</span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Employees are auto-tagged by role in round-robin order</span>
              </div>
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={sLabel}>Tag to Role</label>
                    <select
                      value={form.tagToRole}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      disabled={isViewOnly}
                      style={sInput}
                    >
                      <option value="">— None —</option>
                      {MOCK_ROLES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    {form.taggedEmployees.length > 0 && (
                      <span style={{ fontSize: '11px', color: '#15803D', fontWeight: 600 }}>
                        {form.taggedEmployees.length} employee{form.taggedEmployees.length !== 1 ? 's' : ''} will be assigned
                      </span>
                    )}
                  </div>
                </div>
                <EmployeeTagChips
                  employees={form.taggedEmployees}
                  onReassign={handleReassign}
                  isViewOnly={isViewOnly}
                />
              </div>
            </div>

            {/* ── Card 4: Settings ─────────────────────────────────────── */}
            <div style={sCard}>
              <div style={sCardHead}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Settings</span>
              </div>
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isViewOnly ? 'not-allowed' : 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ isActive: e.target.checked })}
                    disabled={isViewOnly}
                    style={{ width: '15px', height: '15px', accentColor: 'var(--color-primary)' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>Is Active</span>
                </label>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  When active, generated slots are available to users.
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: sticky live preview */}
          <div style={{ flex: '0 0 40%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <SlotPreviewPanel
              startDate={form.startDate}
              endDate={form.endDate}
              slotStartTime={form.slotStartTime}
              slotEndTime={form.slotEndTime}
              slotDurationMin={form.slotDurationMin}
              timeGapMin={form.timeGapMin ?? 0}
              activeDays={form.activeDays}
            />
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        {!isViewOnly && (
          <div style={{
            position: 'sticky', bottom: 0, left: 0, right: 0,
            padding: '12px 24px', borderTop: '1px solid var(--color-border)',
            background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: '10px',
            flexShrink: 0, zIndex: 20,
          }}>
            <button
              type="button"
              onClick={() => navigate('/admin/master/slot-master')}
              style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            >
              Cancel
            </button>
            <div style={{ flex: 1 }} />
            {Object.keys(errors).length > 0 && saveAttempted && (
              <span style={{ fontSize: '12px', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={12} />
                {Object.keys(errors).length} validation error{Object.keys(errors).length !== 1 ? 's' : ''}
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{ padding: '8px 20px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)' }}
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={handleActivate}
              disabled={saving}
              style={{ padding: '8px 20px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer' }}
            >
              Save & Activate
            </button>
          </div>
        )}

        {isViewOnly && (
          <div style={{ position: 'sticky', bottom: 0, padding: '12px 24px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', gap: '10px', flexShrink: 0, zIndex: 20 }}>
            <button type="button" onClick={() => navigate('/admin/master/slot-master')} style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}>Back to List</button>
          </div>
        )}
      </div>
    </AdminShell>
  );
};

export default SlotFormPage;
