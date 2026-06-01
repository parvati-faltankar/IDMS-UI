import {
  getApprovalMatrix as getApprovalMatrixApi,
  saveApprovalMatrixEntry as saveApprovalMatrixEntryApi,
  deleteApprovalMatrixEntry as deleteApprovalMatrixEntryApi,
} from '../../../../../engine/api/configurationApi';
import type { ApprovalMatrixEntry } from '../../../../../engine/types/approvalMatrix';
import { SALE_ORDER_APPROVAL_MATRIX_SEED } from '../../../../../engine/seed/approvalMatrix';

export type { ApprovalMatrixEntry };

export interface EngineConfigResult<T> {
  data: T;
  isOffline: boolean;
}

export async function loadApprovalMatrix(entityName?: string): Promise<EngineConfigResult<ApprovalMatrixEntry[]>> {
  const result = await getApprovalMatrixApi(entityName);
  if (result.success) return { data: result.data, isOffline: false };
  const seed = entityName
    ? SALE_ORDER_APPROVAL_MATRIX_SEED.filter((e) => e.entityName === entityName)
    : SALE_ORDER_APPROVAL_MATRIX_SEED;
  return { data: seed, isOffline: true };
}

export async function persistApprovalMatrixEntry(
  entry: ApprovalMatrixEntry,
): Promise<EngineConfigResult<ApprovalMatrixEntry>> {
  const result = await saveApprovalMatrixEntryApi(entry);
  if (result.success) return { data: result.data, isOffline: false };
  return { data: entry, isOffline: true };
}

export async function removeApprovalMatrixEntry(entryId: string): Promise<EngineConfigResult<boolean>> {
  const result = await deleteApprovalMatrixEntryApi(entryId);
  return { data: result.success, isOffline: !result.success };
}
