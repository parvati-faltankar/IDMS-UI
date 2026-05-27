// ─── Area Service — Mock ──────────────────────────────────────────────────────

import type { Area } from '../types/areaMaster.types';
import { SEED_AREAS } from './areaMasterSeed';

let store: Area[] = [...SEED_AREAS];

export const areaService = {
  getAll(): Area[] {
    return [...store];
  },

  getById(id: string): Area | undefined {
    return store.find((a) => a.id === id);
  },

  create(data: Omit<Area, 'id' | 'createdAt' | 'updatedAt'>): Area {
    const now = new Date().toISOString();
    const newArea: Area = { ...data, id: `AREA-${Date.now()}`, createdAt: now, updatedAt: now };
    store = [...store, newArea];
    return newArea;
  },

  update(id: string, data: Partial<Omit<Area, 'id' | 'createdAt'>>): Area | undefined {
    const idx = store.findIndex((a) => a.id === id);
    if (idx === -1) return undefined;
    const updated: Area = { ...store[idx], ...data, updatedAt: new Date().toISOString() };
    store = [...store.slice(0, idx), updated, ...store.slice(idx + 1)];
    return updated;
  },

  delete(id: string): boolean {
    const prev = store.length;
    store = store.filter((a) => a.id !== id);
    return store.length < prev;
  },

  generateCode(): string {
    const prefix = 'AREA-';
    const max = store.reduce((m, a) => {
      const n = parseInt(a.areaCode.replace(prefix, ''), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    return `${prefix}${String(max + 1).padStart(4, '0')}`;
  },

  activate(id: string): Area | undefined {
    return this.update(id, { status: 'Active' });
  },

  inactivate(id: string, reason: string): Area | undefined {
    return this.update(id, { status: 'Inactive', remarks: reason });
  },

  getChildren(parentAreaId: string): Area[] {
    return store.filter((a) => a.parentAreaId === parentAreaId);
  },

  hasActiveChildren(areaId: string): boolean {
    return store.some((a) => a.parentAreaId === areaId && a.status === 'Active');
  },
};
