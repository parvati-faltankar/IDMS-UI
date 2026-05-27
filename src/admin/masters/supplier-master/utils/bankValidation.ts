// ─── Supplier Master — Bank Detail Validation ────────────────────────────────

import type { BPBankDetail } from '../types/supplierMaster.types';

export interface BankFieldErrors {
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  accountType?: string;
  defaultCurrency?: string;
}

export function validateBankDetail(
  bank: Partial<BPBankDetail>,
  existingBanks: BPBankDetail[],
  editingId?: string,
): BankFieldErrors {
  const errors: BankFieldErrors = {};

  if (!bank.bankName?.trim()) errors.bankName = 'Bank name is required.';
  if (!bank.accountHolderName?.trim()) errors.accountHolderName = 'Account holder name is required.';
  if (!bank.accountType) errors.accountType = 'Account type is required.';
  if (!bank.defaultCurrency) errors.defaultCurrency = 'Currency is required.';

  if (!bank.accountNumber?.trim()) {
    errors.accountNumber = 'Account number is required.';
  } else if (!/^\d{8,20}$/.test(bank.accountNumber.replace(/\s/g, ''))) {
    errors.accountNumber = 'Account number must be 8–20 digits.';
  }

  // Warn when marking as default if another default exists
  if (bank.isDefaultAccount) {
    const existing = existingBanks.find(
      (b) => b.isDefaultAccount && b.status === 'Active' && b.id !== editingId,
    );
    if (existing) {
      // Non-blocking — just informational; handled in UI
      void existing;
    }
  }

  return errors;
}
