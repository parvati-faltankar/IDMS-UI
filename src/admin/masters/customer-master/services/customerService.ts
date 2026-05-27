import type { Customer } from '../types/customerMaster.types';
import { EMPTY_CUSTOMER } from '../constants/customerMaster.constants';

// ─── In-memory store ──────────────────────────────────────────────────────────

let store: Customer[] = [];
let codeCounter = 1;

function generateId(): string {
  return `CUST-ID-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function generateCode(): string {
  return `CUST-${String(codeCounter++).padStart(4, '0')}`;
}

function generateDraftRef(): string {
  return `DRAFT-CUST-${String(Date.now()).slice(-6)}`;
}

function now(): string {
  return new Date().toISOString();
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const customerService = {
  getAll(): Customer[] {
    return [...store];
  },

  getById(id: string): Customer | undefined {
    return store.find((c) => c.id === id);
  },

  create(data: Omit<Customer, 'id' | 'draftReferenceId' | 'customerCode' | 'createdAt' | 'updatedAt'>): Customer {
    const ts = now();
    const created: Customer = {
      ...EMPTY_CUSTOMER,
      ...data,
      id: generateId(),
      draftReferenceId: generateDraftRef(),
      customerCode: data.customerStatus === 'Active' ? generateCode() : '',
      createdAt: ts,
      updatedAt: ts,
    };
    store.push(created);
    return created;
  },

  update(id: string, data: Partial<Customer>): Customer | undefined {
    const idx = store.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    const existing = store[idx];
    // Generate customer code on first activation
    const shouldGenerateCode =
      data.customerStatus === 'Active' && !existing.customerCode;
    store[idx] = {
      ...existing,
      ...data,
      id: existing.id,
      draftReferenceId: existing.draftReferenceId,
      customerCode: shouldGenerateCode
        ? generateCode()
        : (data.customerCode ?? existing.customerCode),
      createdAt: existing.createdAt,
      updatedAt: now(),
    };
    return store[idx];
  },

  activate(id: string): Customer | undefined {
    return customerService.update(id, { customerStatus: 'Active' });
  },

  inactivate(id: string, reason: string): Customer | undefined {
    return customerService.update(id, { customerStatus: 'Inactive', statusChangeReason: reason });
  },

  block(id: string, reason: string): Customer | undefined {
    return customerService.update(id, { customerStatus: 'Blocked', statusChangeReason: reason });
  },

  delete(id: string): boolean {
    const idx = store.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    store.splice(idx, 1);
    return true;
  },
};
