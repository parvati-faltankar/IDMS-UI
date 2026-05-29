import type { BuilderDraftState } from './types';
import type {
  BuilderDraftPersistenceEnvelope,
  BuilderDraftRecoveryResult,
  BuilderPersistenceError,
} from './uxContracts';

export const BUILDER_DRAFT_SCHEMA_VERSION = 1;
export const BUILDER_DRAFT_STORAGE_KEY = 'ui-studio.builder.draft';
export const BUILDER_DRAFT_BACKUP_PREFIX = 'ui-studio.builder.backup.';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const memoryStore = new Map<string, string>();
const memoryStorage: StorageLike = {
  getItem: (key) => memoryStore.get(key) ?? null,
  setItem: (key, value) => {
    memoryStore.set(key, value);
  },
  removeItem: (key) => {
    memoryStore.delete(key);
  },
};

function resolveStorage(storage?: StorageLike): StorageLike {
  if (storage) {
    return storage;
  }
  const local = (globalThis as { localStorage?: StorageLike }).localStorage;
  return local ?? memoryStorage;
}

function parseEnvelope(raw: string): BuilderDraftPersistenceEnvelope<BuilderDraftState> | null {
  try {
    const parsed = JSON.parse(raw) as BuilderDraftPersistenceEnvelope<BuilderDraftState>;
    if (!parsed || typeof parsed.schemaVersion !== 'number' || !parsed.draft) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function backupIncompatibleDraft(raw: string, storage?: StorageLike): string {
  const safeStorage = resolveStorage(storage);
  const backupKey = `${BUILDER_DRAFT_BACKUP_PREFIX}${Date.now()}`;
  safeStorage.setItem(backupKey, raw);
  return backupKey;
}

export function saveBuilderDraft(
  draft: BuilderDraftState,
  storage?: StorageLike,
): BuilderPersistenceError | null {
  const safeStorage = resolveStorage(storage);
  try {
    const envelope: BuilderDraftPersistenceEnvelope<BuilderDraftState> = {
      schemaVersion: BUILDER_DRAFT_SCHEMA_VERSION,
      savedAt: Date.now(),
      draft,
    };
    safeStorage.setItem(BUILDER_DRAFT_STORAGE_KEY, JSON.stringify(envelope));
    return null;
  } catch {
    return { code: 'SAVE_FAILED', message: 'Unable to save builder draft to local storage.' };
  }
}

export function clearBuilderDraft(storage?: StorageLike): void {
  const safeStorage = resolveStorage(storage);
  safeStorage.removeItem(BUILDER_DRAFT_STORAGE_KEY);
}

export function loadBuilderDraft(
  fallbackDraft: BuilderDraftState,
  storage?: StorageLike,
): BuilderDraftRecoveryResult<BuilderDraftState> {
  const safeStorage = resolveStorage(storage);
  const raw = safeStorage.getItem(BUILDER_DRAFT_STORAGE_KEY);
  if (!raw) {
    return { status: 'idle', draft: fallbackDraft };
  }

  const envelope = parseEnvelope(raw);
  if (!envelope) {
    const backupKey = backupIncompatibleDraft(raw, safeStorage);
    clearBuilderDraft(safeStorage);
    return {
      status: 'recovered',
      reason: 'Stored draft was unreadable and has been reset.',
      backupKey,
      draft: fallbackDraft,
    };
  }

  if (envelope.schemaVersion !== BUILDER_DRAFT_SCHEMA_VERSION) {
    const backupKey = backupIncompatibleDraft(raw, safeStorage);
    clearBuilderDraft(safeStorage);
    return {
      status: 'recovered',
      reason: 'Draft schema version mismatch. Using a fresh draft.',
      backupKey,
      draft: fallbackDraft,
    };
  }

  return { status: 'recovered', draft: envelope.draft };
}
