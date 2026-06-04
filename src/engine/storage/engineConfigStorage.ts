/**
 * localStorage persistence layer for Engine Configuration.
 * Used as a fallback when the backend API is offline.
 * Data is keyed by a string ID field unique to each record.
 */

const STORAGE_KEYS = {
  RULE_SETS:       'idms_engine_rule_sets',
  WORKFLOWS:       'idms_engine_workflows',
  SERVICES:        'idms_engine_services',
  APPROVAL_MATRIX: 'idms_engine_approval_matrix',
} as const;

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// ─── Generic read/write helpers ──────────────────────────────────────────────

function readStore<T>(key: StorageKey): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function writeStore<T>(key: StorageKey, records: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(records));
  } catch {
    // Quota exceeded or private browsing — silently ignore
  }
}

// ─── Upsert by primary-key field ─────────────────────────────────────────────

function upsert<T>(key: StorageKey, idField: keyof T, record: T): T[] {
  const existing = readStore<T>(key);
  const idx = existing.findIndex((r) => r[idField] === record[idField]);
  if (idx >= 0) existing[idx] = record;
  else existing.push(record);
  writeStore(key, existing);
  return existing;
}

function remove<T>(key: StorageKey, idField: keyof T, idValue: string): T[] {
  const existing = readStore<T>(key);
  const updated = existing.filter((r) => String(r[idField]) !== idValue);
  writeStore(key, updated);
  return updated;
}

// ─── Public per-entity helpers ────────────────────────────────────────────────

export const ruleSetStorage = {
  load: <T>() => readStore<T>(STORAGE_KEYS.RULE_SETS),
  save: <T>(record: T) => upsert<T>(STORAGE_KEYS.RULE_SETS, 'ruleSetCode' as keyof T, record),
  remove: <T>(code: string) => remove<T>(STORAGE_KEYS.RULE_SETS, 'ruleSetCode' as keyof T, code),
  clear: () => localStorage.removeItem(STORAGE_KEYS.RULE_SETS),
};

export const workflowStorage = {
  load: <T>() => readStore<T>(STORAGE_KEYS.WORKFLOWS),
  save: <T>(record: T) => upsert<T>(STORAGE_KEYS.WORKFLOWS, 'workflowCode' as keyof T, record),
  remove: <T>(code: string) => remove<T>(STORAGE_KEYS.WORKFLOWS, 'workflowCode' as keyof T, code),
  clear: () => localStorage.removeItem(STORAGE_KEYS.WORKFLOWS),
};

export const serviceStorage = {
  load: <T>() => readStore<T>(STORAGE_KEYS.SERVICES),
  save: <T>(record: T) => upsert<T>(STORAGE_KEYS.SERVICES, 'serviceCode' as keyof T, record),
  remove: <T>(code: string) => remove<T>(STORAGE_KEYS.SERVICES, 'serviceCode' as keyof T, code),
  clear: () => localStorage.removeItem(STORAGE_KEYS.SERVICES),
};

export const approvalMatrixStorage = {
  load: <T>() => readStore<T>(STORAGE_KEYS.APPROVAL_MATRIX),
  save: <T>(record: T) => upsert<T>(STORAGE_KEYS.APPROVAL_MATRIX, 'entryId' as keyof T, record),
  remove: <T>(id: string) => remove<T>(STORAGE_KEYS.APPROVAL_MATRIX, 'entryId' as keyof T, id),
  clear: () => localStorage.removeItem(STORAGE_KEYS.APPROVAL_MATRIX),
};
