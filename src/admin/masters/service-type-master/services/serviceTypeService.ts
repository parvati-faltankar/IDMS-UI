// ─── Service Type Master — In-Memory Service ──────────────────────────────────

import type { ServiceTypeRecord, STStatus } from '../types/serviceTypeMaster.types';
import { SEED_SERVICE_TYPES } from '../constants/serviceTypeMaster.constants';

// ─── In-Memory Store ──────────────────────────────────────────────────────────

let store: ServiceTypeRecord[] = [...SEED_SERVICE_TYPES];
let nextSeq = store.length + 1;

function nextCode(): string {
  const code = `ST-${String(nextSeq).padStart(3, '0')}`;
  nextSeq++;
  return code;
}

function now(): string {
  const d = new Date();
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  const hr = String(d.getHours()).padStart(2, '0');
  const mn = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${mo}-${dy} ${hr}:${mn}`;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

function getAll(): ServiceTypeRecord[] {
  return [...store];
}

function getById(id: string): ServiceTypeRecord | undefined {
  return store.find((r) => r.id === id);
}

function create(
  data: Omit<ServiceTypeRecord, 'id' | 'code' | 'createdBy' | 'createdDate' | 'lastModifiedBy' | 'lastModifiedDate'> & { codeOverride?: boolean; code?: string }
): ServiceTypeRecord {
  const id = `st-${Date.now()}`;
  const code = data.codeOverride && data.code ? data.code : nextCode();
  const record: ServiceTypeRecord = {
    ...data,
    id,
    code,
    createdBy: 'Admin',
    createdDate: now(),
    lastModifiedBy: 'Admin',
    lastModifiedDate: now(),
  } as ServiceTypeRecord;
  store = [...store, record];
  return record;
}

function update(id: string, partial: Partial<ServiceTypeRecord>): ServiceTypeRecord | undefined {
  const idx = store.findIndex((r) => r.id === id);
  if (idx === -1) return undefined;
  const updated: ServiceTypeRecord = {
    ...store[idx],
    ...partial,
    id,
    lastModifiedBy: 'Admin',
    lastModifiedDate: now(),
  };
  store = store.map((r) => (r.id === id ? updated : r));
  return updated;
}

function changeStatus(id: string, status: STStatus): ServiceTypeRecord | undefined {
  return update(id, { status });
}

function remove(id: string): boolean {
  const idx = store.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  store = store.filter((r) => r.id !== id);
  return true;
}

export const serviceTypeService = {
  getAll,
  getById,
  create,
  update,
  changeStatus,
  remove,
};
