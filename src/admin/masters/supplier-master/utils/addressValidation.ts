// ─── Supplier Master — Address Validation ────────────────────────────────────

import type { BPAddress } from '../types/supplierMaster.types';

export interface AddressFieldErrors {
  addressType?: string;
  addressLine1?: string;
  country?: string;
  state?: string;
  city?: string;
  latitude?: string;
  longitude?: string;
  isDefault?: string;
  areaLocality?: string;
}

export function validateAddress(
  address: Partial<BPAddress>,
  existingAddresses: BPAddress[],
  editingId?: string,
): AddressFieldErrors {
  const errors: AddressFieldErrors = {};
  const isMasterLinked = !!address.areaId && !address.isManualEntry;

  if (!address.addressType) errors.addressType = 'Address type is required.';
  if (!address.addressLine1?.trim()) errors.addressLine1 = 'Address line 1 is required.';

  if (!isMasterLinked) {
    // Manual-entry path: validate free-text fields
    if (!address.country) errors.country = 'Country is required.';
    if (!address.state?.trim()) errors.state = 'State is required.';
    if (!address.city?.trim()) errors.city = 'City is required.';
  } else {
    // Master-linked path: hierarchy is auto-filled; just confirm values exist
    if (!address.country) errors.country = 'Country could not be resolved from Area Master.';
    if (!address.state?.trim()) errors.state = 'State could not be resolved from Area Master.';
  }

  if (address.latitude) {
    const lat = parseFloat(address.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.latitude = 'Latitude must be between -90 and +90.';
    }
  }

  if (address.longitude) {
    const lng = parseFloat(address.longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.longitude = 'Longitude must be between -180 and +180.';
    }
  }

  // If setting as default, check if another active default already exists
  if (address.isDefault) {
    const existingDefault = existingAddresses.find(
      (a) => a.isDefault && a.status === 'Active' && a.id !== editingId,
    );
    if (existingDefault) {
      errors.isDefault =
        'Another address is already set as default. Saving will replace it.';
    }
  }

  return errors;
}
