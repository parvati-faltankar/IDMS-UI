import type { ServiceRequest, ServiceResponse, ChargeOutput } from '../types/services';
import { enginePost } from './apiClient';

export async function calculateCharges(
  request: ServiceRequest
): Promise<ServiceResponse<ChargeOutput>> {
  return enginePost<ChargeOutput>('/api/services/charge/calculate', request);
}

export async function validateCharges(
  request: ServiceRequest
): Promise<ServiceResponse<ChargeOutput>> {
  return enginePost<ChargeOutput>('/api/services/charge/validate', request);
}
