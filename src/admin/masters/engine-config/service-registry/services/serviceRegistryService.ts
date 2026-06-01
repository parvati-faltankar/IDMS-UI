import {
  getServices as getServicesApi,
  saveService as saveServiceApi,
} from '../../../../../engine/api/configurationApi';
import type { ServiceConfig } from '../../../../../engine/types/configuration';
import { SERVICE_REGISTRY_SEED } from '../../../../../engine/seed/serviceRegistry';

export type { ServiceConfig };

export interface EngineConfigResult<T> {
  data: T;
  isOffline: boolean;
}

export async function loadServices(): Promise<EngineConfigResult<ServiceConfig[]>> {
  const result = await getServicesApi();
  if (result.success) return { data: result.data, isOffline: false };
  return { data: SERVICE_REGISTRY_SEED, isOffline: true };
}

export async function persistService(service: ServiceConfig): Promise<EngineConfigResult<ServiceConfig>> {
  const result = await saveServiceApi(service);
  if (result.success) return { data: result.data, isOffline: false };
  return { data: service, isOffline: true };
}
