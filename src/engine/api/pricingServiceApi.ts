import type { ServiceRequest, ServiceResponse, PricingOutput } from '../types/services';
import { enginePost } from './apiClient';

export async function calculatePricing(
  request: ServiceRequest
): Promise<ServiceResponse<PricingOutput>> {
  return enginePost<PricingOutput>('/api/services/pricing/calculate', request);
}

export async function validatePriceOverride(
  request: ServiceRequest
): Promise<ServiceResponse<PricingOutput>> {
  return enginePost<PricingOutput>('/api/services/pricing/validate-override', request);
}

export async function repriceOrder(
  request: ServiceRequest
): Promise<ServiceResponse<PricingOutput>> {
  return enginePost<PricingOutput>('/api/services/pricing/reprice', request);
}
