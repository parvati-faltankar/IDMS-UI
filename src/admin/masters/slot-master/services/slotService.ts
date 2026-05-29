// ─── Slot Service (in-memory) ─────────────────────────────────────────────────

import { SEED_SLOTS, MOCK_BRANCH, MOCK_EMPLOYEES } from '../constants/slotMaster.constants';
import type {
  SlotRecord,
  GeneratedDay,
  GeneratedSlot,
  TaggedEmployee,
  DayOfWeek,
} from '../types/slotMaster.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString();
}

function padSeq(n: number): string {
  return `SLT-${String(n).padStart(4, '0')}`;
}

/** Parse "HH:MM" into total minutes since midnight */
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Convert minutes since midnight back to "HH:MM" */
function fromMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Day-of-week abbreviation from ISO date string */
function dayOfWeek(isoDate: string): DayOfWeek {
  const d = new Date(isoDate + 'T00:00:00');
  return (['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as DayOfWeek[])[d.getDay()];
}

/** Format ISO date to "Mon, 01 Jun" */
function formatDayLabel(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
}

/** Add one calendar day to an ISO date string (uses local date components, not UTC) */
function addDay(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${dy}`;
}

// ─── Core generation algorithm ────────────────────────────────────────────────

export interface GenerateConfig {
  startDate: string;
  endDate: string;
  slotStartTime: string;
  slotEndTime: string;
  slotDurationMin: number;
  timeGapMin: number;
  activeDays: DayOfWeek[];
}

export function generateSlots(config: GenerateConfig): GeneratedDay[] {
  const {
    startDate, endDate, slotStartTime, slotEndTime,
    slotDurationMin, timeGapMin, activeDays,
  } = config;

  if (!startDate || !endDate || !slotStartTime || !slotEndTime || slotDurationMin <= 0) {
    return [];
  }

  const startMins  = toMinutes(slotStartTime);
  const endMins    = toMinutes(slotEndTime);
  const stepMins   = slotDurationMin + timeGapMin;

  if (startMins >= endMins || stepMins <= 0) return [];

  const branch = MOCK_BRANCH;
  const breaks = branch.breaks.map((b) => ({ s: toMinutes(b.start), e: toMinutes(b.end) }));

  const days: GeneratedDay[] = [];
  let cursor = startDate;

  while (cursor <= endDate) {
    const dow = dayOfWeek(cursor);

    if (activeDays.includes(dow) && !branch.holidays.includes(cursor)) {
      const slots: GeneratedSlot[] = [];
      let t = startMins;

      while (t + slotDurationMin <= endMins) {
        const slotEnd = t + slotDurationMin;
        // Check overlap with any break
        const overlapsBreak = breaks.some((b) => t < b.e && slotEnd > b.s);
        if (!overlapsBreak) {
          slots.push({ startTime: fromMinutes(t), endTime: fromMinutes(slotEnd) });
        }
        t += stepMins;
      }

      if (slots.length > 0) {
        days.push({ date: cursor, dayLabel: formatDayLabel(cursor), slots });
      }
    }

    cursor = addDay(cursor);
    // Safety: never generate more than 365 days
    if (days.length > 365) break;
  }

  return days;
}

// ─── Employee round-robin tagging ─────────────────────────────────────────────

export function resolveTaggedEmployees(roleId: string): TaggedEmployee[] {
  if (!roleId) return [];
  const active = MOCK_EMPLOYEES.filter((e) => e.roleId === roleId && e.isActive);
  return active.map((e) => ({
    employeeId: e.id,
    employeeName: e.name,
    role: e.roleId,
  }));
}

// ─── In-memory store ──────────────────────────────────────────────────────────

const _store: (SlotRecord & { createdAt: string; updatedAt: string })[] = SEED_SLOTS.map(
  (s, i) => ({
    ...s,
    createdAt: s.createdAt ?? `2026-05-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`,
    updatedAt: s.updatedAt ?? `2026-05-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`,
  }),
);

let _seq = SEED_SLOTS.length;

// ─── Service ──────────────────────────────────────────────────────────────────

export const slotService = {
  getAll(): (SlotRecord & { createdAt: string; updatedAt: string })[] {
    return [..._store].reverse();
  },

  getById(id: string): (SlotRecord & { createdAt: string; updatedAt: string }) | undefined {
    return _store.find((r) => r.id === id);
  },

  generateCode(): string {
    _seq += 1;
    while (_store.some((r) => r.slotCode === padSeq(_seq))) _seq += 1;
    return padSeq(_seq);
  },

  create(
    data: Omit<SlotRecord, 'id'>,
  ): SlotRecord & { createdAt: string; updatedAt: string } {
    const ts = now();
    const record = {
      ...data,
      id: `slot-${crypto.randomUUID()}`,
      createdAt: ts,
      updatedAt: ts,
    } as SlotRecord & { createdAt: string; updatedAt: string };
    _store.push(record);
    return record;
  },

  update(
    id: string,
    data: Partial<Omit<SlotRecord, 'id'>>,
  ): (SlotRecord & { createdAt: string; updatedAt: string }) | undefined {
    const idx = _store.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    _store[idx] = { ..._store[idx], ...data, updatedAt: now() };
    return _store[idx];
  },

  delete(id: string): boolean {
    const idx = _store.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    _store.splice(idx, 1);
    return true;
  },

  activate(id: string): (SlotRecord & { createdAt: string; updatedAt: string }) | undefined {
    return slotService.update(id, { status: 'Active' });
  },

  inactivate(id: string): (SlotRecord & { createdAt: string; updatedAt: string }) | undefined {
    return slotService.update(id, { status: 'Inactive' });
  },

  /** Check if another slot in the same branch overlaps date+time range */
  hasOverlap(
    branch: string,
    startDate: string,
    endDate: string,
    slotStartTime: string,
    slotEndTime: string,
    activeDays: DayOfWeek[],
    excludeId?: string,
  ): boolean {
    const active = _store.filter(
      (r) => r.branch === branch && r.status !== 'Inactive' && r.id !== excludeId,
    );
    for (const r of active) {
      // Date range overlap
      if (r.startDate > endDate || r.endDate < startDate) continue;
      // Day overlap
      const dayOverlap = r.activeDays.some((d) => activeDays.includes(d));
      if (!dayOverlap) continue;
      // Time overlap
      if (r.slotStartTime < slotEndTime && r.slotEndTime > slotStartTime) return true;
    }
    return false;
  },
};

// ─── Re-exports for convenience ───────────────────────────────────────────────

export type { GeneratedDay, GeneratedSlot, TaggedEmployee };
