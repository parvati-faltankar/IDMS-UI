import type { ServiceRequest, ServiceResponse, NumberingOutput } from '../types/services';
import { enginePost } from './apiClient';

export async function generateDocumentNumber(
  request: ServiceRequest
): Promise<ServiceResponse<NumberingOutput>> {
  return enginePost<NumberingOutput>('/api/services/numbering/generate', request);
}
