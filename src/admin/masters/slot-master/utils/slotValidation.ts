// ─── Slot Master — Validation ─────────────────────────────────────────────────

import type { SlotRecord, SlotFormErrors, DayOfWeek } from '../types/slotMaster.types';
import { MOCK_BRANCH } from '../constants/slotMaster.constants';

function toMins(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function validateSlot(
  form: Partial<SlotRecord>,
  existingSlots: SlotRecord[],
  editingId?: string,
): SlotFormErrors {
  const errs: SlotFormErrors = {};
  const branch = MOCK_BRANCH;

  // Required fields
  if (!form.name?.trim())    errs.name   = 'Slot name is required.';
  if (!form.entity)          errs.entity = 'Entity is required.';

  // Date validation
  if (!form.startDate) {
    errs.startDate = 'Start date is required.';
  } else if (branch.holidays.includes(form.startDate)) {
    errs.startDate = 'Slots cannot be created on holidays.';
  } else {
    const dow = new Date(form.startDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3) as DayOfWeek;
    if (!branch.workingDays.includes(dow) && (!form.activeDays || form.activeDays.length === 0)) {
      errs.startDate = 'Slots cannot be created on weekends.';
    }
  }

  if (!form.endDate) {
    errs.endDate = 'End date is required.';
  } else if (form.startDate && form.endDate < form.startDate) {
    errs.endDate = 'End date cannot be before start date.';
  } else if (branch.holidays.includes(form.endDate)) {
    errs.endDate = 'End date falls on a holiday.';
  }

  // Time validation
  const workStart = toMins(branch.workStart);
  const workEnd   = toMins(branch.workEnd);

  if (!form.slotStartTime) {
    errs.slotStartTime = 'Slot start time is required.';
  } else {
    const st = toMins(form.slotStartTime);
    if (st < workStart || st >= workEnd) {
      errs.slotStartTime = `Slot start time must be within branch working hours (${branch.workStart}–${branch.workEnd}).`;
    } else {
      const breakOverlap = branch.breaks.find(
        (b) => toMins(b.start) <= st && st < toMins(b.end),
      );
      if (breakOverlap) {
        errs.slotStartTime = `Slot start time overlaps with ${breakOverlap.name} (${breakOverlap.start}–${breakOverlap.end}).`;
      }
    }
  }

  if (!form.slotEndTime) {
    errs.slotEndTime = 'Slot end time is required.';
  } else {
    const et = toMins(form.slotEndTime);
    if (form.slotStartTime && et <= toMins(form.slotStartTime)) {
      errs.slotEndTime = 'Slot end time must be after start time.';
    } else if (et > workEnd) {
      errs.slotEndTime = `Slot end time must be within branch working hours (${branch.workStart}–${branch.workEnd}).`;
    }
  }

  // Duration
  if (!form.slotDurationMin || form.slotDurationMin <= 0) {
    errs.slotDurationMin = 'Slot duration is required.';
  }

  // Active days
  if (!form.activeDays || form.activeDays.length === 0) {
    errs.activeDays = 'At least one active day must be selected.';
  }

  // Overlap detection
  if (
    !errs.startDate && !errs.endDate && !errs.slotStartTime && !errs.slotEndTime &&
    form.startDate && form.endDate && form.slotStartTime && form.slotEndTime && form.activeDays
  ) {
    const conflicts = existingSlots.filter((r) => {
      if (r.id === editingId || r.status === 'Inactive') return false;
      if (r.startDate > form.endDate! || r.endDate < form.startDate!) return false;
      const dayOverlap = r.activeDays.some((d) => form.activeDays!.includes(d));
      if (!dayOverlap) return false;
      return r.slotStartTime < form.slotEndTime! && r.slotEndTime > form.slotStartTime!;
    });
    if (conflicts.length > 0) {
      errs.general = `Slot configuration conflicts with existing slot "${conflicts[0].name}" on the same branch.`;
    }
  }

  return errs;
}
