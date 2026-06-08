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

  // ── Address-picker helpers ────────────────────────────────────────────────

  /**
   * Full-text search across active areas.
   * Matches areaName, displayName, postalCode, hierarchyPath, and searchable aliases.
   * Returns at most 20 results, ordered: exact name > startsWith > contains.
   */
  searchAreas(query: string, limit = 20): Area[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const active = store.filter((a) => a.status === 'Active');
    const matches = active.filter((a) => {
      const fields = [a.areaName, a.displayName, a.postalCode, a.hierarchyPath];
      const aliasNames = a.aliases
        .filter((al) => al.isSearchable && al.status === 'Active')
        .map((al) => al.aliasName);
      return [...fields, ...aliasNames].some((f) => f.toLowerCase().includes(q));
    });
    // Sort: exact match first, then startsWith, then contains
    matches.sort((a, b) => {
      const score = (area: Area) => {
        const name = area.areaName.toLowerCase();
        if (name === q) return 0;
        if (name.startsWith(q)) return 1;
        return 2;
      };
      return score(a) - score(b);
    });
    return matches.slice(0, limit);
  },

  /**
   * Given an area id, walks the parentAreaId chain and returns the resolved
   * hierarchy labels keyed by areaLevelId.
   * e.g. { 'ARLVL-0001': IndiaArea, 'ARLVL-0002': MaharashtraArea, ... }
   */
  resolveHierarchy(areaId: string): Record<string, Area> {
    const result: Record<string, Area> = {};
    let current = store.find((a) => a.id === areaId);
    while (current) {
      result[current.areaLevelId] = current;
      if (current.parentAreaId) {
        current = store.find((a) => a.id === current!.parentAreaId);
      } else {
        break;
      }
    }
    return result;
  },

  /**
   * Convenience: returns the full address tuple for an area id.
   * Fields default to '' when the corresponding hierarchy level is absent.
   */
  resolveAddressFields(areaId: string): {
    areaId: string;
    areaName: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    latitude: number | null;
    longitude: number | null;
  } {
    const area = store.find((a) => a.id === areaId);
    if (!area) {
      return { areaId, areaName: '', city: '', state: '', country: '', postalCode: '', latitude: null, longitude: null };
    }
    const hierarchy = this.resolveHierarchy(areaId);

    // Identify which level ids map to which roles by inspecting the store
    // Convention from seed: levelSequence 1=Country, 2=State, 3=City, 4=Area
    // We find by levelSequence to be seed-independent
    // Simpler: sort hierarchy entries by hierarchyPath depth (number of " > " separators)
    const sorted = Object.values(hierarchy).sort(
      (a, b) => (a.hierarchyPath.split(' > ').length) - (b.hierarchyPath.split(' > ').length),
    );

    const country  = sorted[0]?.areaName ?? '';
    const state    = sorted[1]?.areaName ?? '';
    const city     = sorted[2]?.areaName ?? '';
    // The area itself (deepest) provides postal code + coords
    const leaf     = sorted[sorted.length - 1];
    const postalCode  = leaf?.postalCode ?? '';
    const latitude    = leaf?.latitude ?? null;
    const longitude   = leaf?.longitude ?? null;
    const areaName    = area.areaName;

    return { areaId, areaName, city, state, country, postalCode, latitude, longitude };
  },

  /** Return all active areas belonging to a specific level id. */
  getActiveByLevel(levelId: string): Area[] {
    return store.filter((a) => a.areaLevelId === levelId && a.status === 'Active');
  },
};
