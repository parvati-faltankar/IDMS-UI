// ─── UOM Service (in-memory) ──────────────────────────────────────────────────
// Mirrors the pattern established by supplierService.ts

import { MOCK_UOMS } from '../constants/uomMaster.constants';
import type { UomRecord } from '../types/uomMaster.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString();
}

function padSeq(n: number): string {
  return `UOM-${String(n).padStart(4, '0')}`;
}

// ─── In-memory store ──────────────────────────────────────────────────────────

// Seed from MOCK_UOMS, adding tracking timestamps if missing
const _store: (UomRecord & { createdAt: string; updatedAt: string })[] = MOCK_UOMS.map(
  (u, i) => ({
    ...u,
    createdAt: u.createdAt ?? `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`,
    updatedAt: u.updatedAt ?? `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`,
  }),
);

let _seq = MOCK_UOMS.length;

// ─── Service ──────────────────────────────────────────────────────────────────

export const uomService = {
  /** Return a shallow copy of all records (newest first). */
  getAll(): (UomRecord & { createdAt: string; updatedAt: string })[] {
    return [..._store].reverse();
  },

  /** Find a single record by id. */
  getById(id: string): (UomRecord & { createdAt: string; updatedAt: string }) | undefined {
    return _store.find((r) => r.id === id);
  },

  /** Generate the next sequential UOM code. */
  generateCode(): string {
    _seq += 1;
    // ensure no collision with existing codes
    while (_store.some((r) => r.unitCode === padSeq(_seq))) {
      _seq += 1;
    }
    return padSeq(_seq);
  },

  /** Create a new record (status set to Draft on creation). */
  create(
    data: Omit<UomRecord, 'id'>,
  ): UomRecord & { createdAt: string; updatedAt: string } {
    const ts = now();
    const record = {
      ...data,
      id: `uom-${Date.now()}`,
      createdAt: ts,
      updatedAt: ts,
    } as UomRecord & { createdAt: string; updatedAt: string };
    _store.push(record);
    return record;
  },

  /** Update an existing record's mutable fields. */
  update(
    id: string,
    data: Partial<Omit<UomRecord, 'id'>>,
  ): (UomRecord & { createdAt: string; updatedAt: string }) | undefined {
    const idx = _store.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    _store[idx] = { ..._store[idx], ...data, updatedAt: now() };
    return _store[idx];
  },

  /** Delete a record (only allowed for Draft status). */
  delete(id: string): boolean {
    const idx = _store.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    _store.splice(idx, 1);
    return true;
  },

  /** Transition Draft → Active. */
  activate(id: string): (UomRecord & { createdAt: string; updatedAt: string }) | undefined {
    return uomService.update(id, { status: 'Active' });
  },

  /** Transition Active → Inactive. */
  inactivate(id: string): (UomRecord & { createdAt: string; updatedAt: string }) | undefined {
    return uomService.update(id, { status: 'Inactive' });
  },
};
