import type { ServiceRequest, ServiceResponse, CurrencyOutput } from '../types/services';
import { enginePost } from './apiClient';

export async function deriveCurrency(
  request: ServiceRequest
): Promise<ServiceResponse<CurrencyOutput>> {
  return enginePost<CurrencyOutput>('/api/services/currency/derive', request);
}

export async function getExchangeRate(
  request: ServiceRequest
): Promise<ServiceResponse<CurrencyOutput>> {
  return enginePost<CurrencyOutput>('/api/services/currency/exchange-rate', request);
}

export async function applyRounding(
  request: ServiceRequest
): Promise<ServiceResponse<CurrencyOutput>> {
  return enginePost<CurrencyOutput>('/api/services/currency/apply-rounding', request);
}
