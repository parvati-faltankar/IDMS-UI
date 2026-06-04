import {
  getServices as getServicesApi,
  saveService as saveServiceApi,
} from '../../../../../engine/api/configurationApi';
import type { ServiceConfig } from '../../../../../engine/types/configuration';
import { SERVICE_REGISTRY_SEED } from '../../../../../engine/seed/serviceRegistry';
import { serviceStorage } from '../../../../../engine/storage/engineConfigStorage';

export type { ServiceConfig };

export interface EngineConfigResult<T> {
  data: T;
  isOffline: boolean;
}

/** Load: API → localStorage overrides on top of seed → seed fallback */
export async function loadServices(): Promise<EngineConfigResult<ServiceConfig[]>> {
  const result = await getServicesApi();
  if (result.success) return { data: result.data, isOffline: false };

  const local = serviceStorage.load<ServiceConfig>();
  if (local.length > 0) {
    const merged = SERVICE_REGISTRY_SEED.map(
      (s) => local.find((l) => l.serviceCode === s.serviceCode) ?? s
    );
    const newEntries = local.filter(
      (l) => !SERVICE_REGISTRY_SEED.some((s) => s.serviceCode === l.serviceCode)
    );
    return { data: [...merged, ...newEntries], isOffline: true };
  }

  return { data: SERVICE_REGISTRY_SEED, isOffline: true };
}

export async function persistService(service: ServiceConfig): Promise<EngineConfigResult<ServiceConfig>> {
  const result = await saveServiceApi(service);
  if (result.success) {
    serviceStorage.save<ServiceConfig>(service);
    return { data: result.data, isOffline: false };
  }
  serviceStorage.save<ServiceConfig>(service);
  return { data: service, isOffline: true };
}
