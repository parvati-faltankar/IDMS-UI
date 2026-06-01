import type { ServiceResponse, IntegrationEventOutput } from '../types/services';
import { enginePost } from './apiClient';

export type IntegrationEventRequest = {
  tenantId: string;
  entityName: string;
  entityId: string;
  eventName: string;
  payload: Record<string, unknown>;
  correlationId: string;
  idempotencyKey: string;
};

export async function publishEvent(
  request: IntegrationEventRequest
): Promise<ServiceResponse<IntegrationEventOutput>> {
  return enginePost<IntegrationEventOutput>('/api/services/integration-event/publish', request);
}
