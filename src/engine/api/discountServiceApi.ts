import type { ServiceRequest, ServiceResponse, DiscountOutput } from '../types/services';
import { enginePost } from './apiClient';

export async function calculateDiscount(
  request: ServiceRequest
): Promise<ServiceResponse<DiscountOutput>> {
  return enginePost<DiscountOutput>('/api/services/discount/calculate', request);
}

export async function validateDiscount(
  request: ServiceRequest
): Promise<ServiceResponse<DiscountOutput>> {
  return enginePost<DiscountOutput>('/api/services/discount/validate', request);
}
