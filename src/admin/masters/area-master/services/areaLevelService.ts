// ─── Area Level Service — Mock ────────────────────────────────────────────────

import type { AreaLevel } from '../types/areaMaster.types';
import { SEED_AREA_LEVELS } from './areaMasterSeed';

let store: AreaLevel[] = [...SEED_AREA_LEVELS];

export const areaLevelService = {
  getAll(): AreaLevel[] {
    return [...store];
  },

  getById(id: string): AreaLevel | undefined {
    return store.find((l) => l.id === id);
  },

  generateCode(): string {
    const prefix = 'ARLVL-';
    const max = store.reduce((m, l) => {
      const n = parseInt(l.areaLevelCode.replace(prefix, ''), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    return `${prefix}${String(max + 1).padStart(4, '0')}`;
  },

  create(data: Omit<AreaLevel, 'id' | 'createdAt' | 'updatedAt'>): AreaLevel {
    const now = new Date().toISOString();
    const newLevel: AreaLevel = { ...data, id: `ARLVL-${Date.now()}`, createdAt: now, updatedAt: now };
    store = [...store, newLevel];
    return newLevel;
  },

  update(id: string, data: Partial<Omit<AreaLevel, 'id' | 'createdAt'>>): AreaLevel | undefined {
    const idx = store.findIndex((l) => l.id === id);
    if (idx === -1) return undefined;
    const updated: AreaLevel = { ...store[idx], ...data, updatedAt: new Date().toISOString() };
    store = [...store.slice(0, idx), updated, ...store.slice(idx + 1)];
    return updated;
  },

  delete(id: string): boolean {
    const prev = store.length;
    store = store.filter((l) => l.id !== id);
    return store.length < prev;
  },

  activate(id: string): AreaLevel | undefined {
    return this.update(id, { status: 'Active' });
  },

  inactivate(id: string, reason: string): AreaLevel | undefined {
    return this.update(id, { status: 'Inactive', remarks: reason });
  },
};
