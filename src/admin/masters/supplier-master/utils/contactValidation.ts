// ─── Supplier Master — Contact Validation ────────────────────────────────────

import type { BPContact } from '../types/supplierMaster.types';

export interface ContactFieldErrors {
  contactType?: string;
  contactName?: string;
  phone?: string;
  email?: string;
}

export function validateContact(
  contact: Partial<BPContact>,
  existingContacts: BPContact[],
  editingId?: string,
): ContactFieldErrors {
  const errors: ContactFieldErrors = {};

  if (!contact.contactType) errors.contactType = 'Contact type is required.';
  if (!contact.contactName?.trim()) errors.contactName = 'Contact name is required.';

  if (contact.phone && !/^\d{7,15}$/.test(contact.phone.replace(/\s/g, ''))) {
    errors.phone = 'Phone must be 7–15 digits.';
  }

  if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
    errors.email = 'Enter a valid email address.';
  }

  // Duplicate Primary contact guard
  if (contact.contactType === 'Primary') {
    const dup = existingContacts.find(
      (c) => c.contactType === 'Primary' && c.id !== editingId,
    );
    if (dup) errors.contactType = 'Only one Primary contact is allowed.';
  }

  return errors;
}
