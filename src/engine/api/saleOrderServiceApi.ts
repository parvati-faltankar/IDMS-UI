import type { ServiceRequest, ServiceResponse, SaleOrderServiceOutput } from '../types/services';
import { enginePost } from './apiClient';

export async function createDraft(request: ServiceRequest): Promise<ServiceResponse<SaleOrderServiceOutput>> {
  return enginePost<SaleOrderServiceOutput>('/api/services/sale-order/create-draft', request);
}

export async function updateDraft(request: ServiceRequest): Promise<ServiceResponse<SaleOrderServiceOutput>> {
  return enginePost<SaleOrderServiceOutput>('/api/services/sale-order/update-draft', request);
}

export async function submitOrder(request: ServiceRequest): Promise<ServiceResponse<SaleOrderServiceOutput>> {
  return enginePost<SaleOrderServiceOutput>('/api/services/sale-order/submit', request);
}

export async function cancelOrder(request: ServiceRequest): Promise<ServiceResponse<SaleOrderServiceOutput>> {
  return enginePost<SaleOrderServiceOutput>('/api/services/sale-order/cancel', request);
}

export async function holdOrder(request: ServiceRequest): Promise<ServiceResponse<SaleOrderServiceOutput>> {
  return enginePost<SaleOrderServiceOutput>('/api/services/sale-order/hold', request);
}

export async function releaseOrder(request: ServiceRequest): Promise<ServiceResponse<SaleOrderServiceOutput>> {
  return enginePost<SaleOrderServiceOutput>('/api/services/sale-order/release', request);
}

export async function amendOrder(request: ServiceRequest): Promise<ServiceResponse<SaleOrderServiceOutput>> {
  return enginePost<SaleOrderServiceOutput>('/api/services/sale-order/amend', request);
}

export async function closeOrder(request: ServiceRequest): Promise<ServiceResponse<SaleOrderServiceOutput>> {
  return enginePost<SaleOrderServiceOutput>('/api/services/sale-order/close', request);
}

export async function reopenOrder(request: ServiceRequest): Promise<ServiceResponse<SaleOrderServiceOutput>> {
  return enginePost<SaleOrderServiceOutput>('/api/services/sale-order/reopen', request);
}
