import type { ServiceRequest, ServiceResponse, TaxOutput } from '../types/services';
import { enginePost } from './apiClient';

export async function deriveTaxContext(
  request: ServiceRequest
): Promise<ServiceResponse<TaxOutput>> {
  return enginePost<TaxOutput>('/api/services/tax/derive-context', request);
}

export async function calculateTax(
  request: ServiceRequest
): Promise<ServiceResponse<TaxOutput>> {
  return enginePost<TaxOutput>('/api/services/tax/calculate', request);
}
