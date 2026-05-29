import { describe, expect, it } from 'vitest';
import { sampleCreateEditView } from '../metadata/sampleCreateEditView';
import { createBuilderDraftState } from './draftState';
import {
  BUILDER_DRAFT_STORAGE_KEY,
  loadBuilderDraft,
  saveBuilderDraft,
  clearBuilderDraft,
} from './persistence';

function createMockStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => map.set(key, value),
    removeItem: (key: string) => map.delete(key),
    clear: () => map.clear(),
  };
}

describe('builder draft persistence', () => {
  it('saves and restores compatible draft envelope', () => {
    const storage = createMockStorage();
    storage.clear();
    const draft = createBuilderDraftState(sampleCreateEditView);

    const saveError = saveBuilderDraft(draft, storage);
    expect(saveError).toBeNull();

    const restored = loadBuilderDraft(createBuilderDraftState(sampleCreateEditView), storage);
    expect(restored.status).toBe('recovered');
    expect(restored.draft.metadata.id).toBe(draft.metadata.id);
  });

  it('recovers safely from invalid stored payload', () => {
    const storage = createMockStorage();
    storage.clear();
    storage.setItem(BUILDER_DRAFT_STORAGE_KEY, '{bad-json');

    const fallback = createBuilderDraftState(sampleCreateEditView);
    const restored = loadBuilderDraft(fallback, storage);
    expect(restored.status).toBe('recovered');
    expect(restored.reason).toContain('unreadable');
  });

  it('clears persisted draft key', () => {
    const storage = createMockStorage();
    storage.clear();
    storage.setItem(BUILDER_DRAFT_STORAGE_KEY, 'x');
    clearBuilderDraft(storage);
    expect(storage.getItem(BUILDER_DRAFT_STORAGE_KEY)).toBeNull();
  });
});
