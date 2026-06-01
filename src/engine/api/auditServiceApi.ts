import type { AuditEvent, AuditOutput } from '../types/services';
import type { ServiceResponse } from '../types/services';
import { enginePost, engineGet } from './apiClient';

export async function writeAuditEvent(
  event: AuditEvent
): Promise<ServiceResponse<AuditOutput>> {
  return enginePost<AuditOutput>('/api/services/audit/write', event);
}

export async function getAuditLog(
  entityName: string,
  entityId: string
): Promise<ServiceResponse<AuditEvent[]>> {
  return engineGet<AuditEvent[]>(`/api/services/audit/log/${entityName}/${entityId}`);
}
