import type { ServiceResponse, NotificationOutput } from '../types/services';
import { enginePost } from './apiClient';

export type NotificationRequest = {
  tenantId: string;
  entityName: string;
  entityId: string;
  templateCode: string;
  recipients: string[];
  context: Record<string, unknown>;
  correlationId: string;
};

export async function sendNotification(
  request: NotificationRequest
): Promise<ServiceResponse<NotificationOutput>> {
  return enginePost<NotificationOutput>('/api/services/notification/send', request);
}
