// ─── Supplier Master — Service (In-Memory Mock) ───────────────────────────────

import type { BusinessPartner } from '../types/supplierMaster.types';
import { SEED_SUPPLIERS } from './supplierSeedData';

let store: BusinessPartner[] = [...SEED_SUPPLIERS];

export const supplierService = {
  getAll(): BusinessPartner[] {
    return [...store];
  },

  getById(id: string): BusinessPartner | undefined {
    return store.find((bp) => bp.id === id);
  },

  generateCode(): string {
    const prefix = 'BP-';
    const max = store.reduce((m, bp) => {
      const n = parseInt(bp.bpCode.replace(prefix, ''), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    return `${prefix}${String(max + 1).padStart(4, '0')}`;
  },

  create(data: Omit<BusinessPartner, 'id' | 'createdAt' | 'updatedAt'>): BusinessPartner {
    const now = new Date().toISOString();
    const newBP: BusinessPartner = {
      ...data,
      id: `BP-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    store = [...store, newBP];
    return newBP;
  },

  update(
    id: string,
    data: Partial<Omit<BusinessPartner, 'id' | 'createdAt'>>,
  ): BusinessPartner | undefined {
    const idx = store.findIndex((bp) => bp.id === id);
    if (idx === -1) return undefined;
    const updated: BusinessPartner = {
      ...store[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    store = [...store.slice(0, idx), updated, ...store.slice(idx + 1)];
    return updated;
  },

  delete(id: string): boolean {
    const prev = store.length;
    store = store.filter((bp) => bp.id !== id);
    return store.length < prev;
  },

  activate(id: string): BusinessPartner | undefined {
    return this.update(id, { status: 'Active' });
  },

  inactivate(id: string, reason: string): BusinessPartner | undefined {
    return this.update(id, { status: 'Inactive', description: reason });
  },
};
