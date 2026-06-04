import {
  getApprovalMatrix as getApprovalMatrixApi,
  saveApprovalMatrixEntry as saveApprovalMatrixEntryApi,
  deleteApprovalMatrixEntry as deleteApprovalMatrixEntryApi,
} from '../../../../../engine/api/configurationApi';
import type { ApprovalMatrixEntry } from '../../../../../engine/types/approvalMatrix';
import { SALE_ORDER_APPROVAL_MATRIX_SEED } from '../../../../../engine/seed/approvalMatrix';
import { approvalMatrixStorage } from '../../../../../engine/storage/engineConfigStorage';

export type { ApprovalMatrixEntry };

export interface EngineConfigResult<T> {
  data: T;
  isOffline: boolean;
}

/** Load: API → localStorage overrides on top of seed → seed fallback */
export async function loadApprovalMatrix(entityName?: string): Promise<EngineConfigResult<ApprovalMatrixEntry[]>> {
  const result = await getApprovalMatrixApi(entityName);
  if (result.success) return { data: result.data, isOffline: false };

  const seed = entityName
    ? SALE_ORDER_APPROVAL_MATRIX_SEED.filter((e) => e.entityName === entityName)
    : [...SALE_ORDER_APPROVAL_MATRIX_SEED];

  const local = approvalMatrixStorage.load<ApprovalMatrixEntry>();
  if (local.length > 0) {
    const merged = seed.map((s) => local.find((l) => l.entryId === s.entryId) ?? s);
    const newEntries = local.filter((l) => !seed.some((s) => s.entryId === l.entryId));
    return { data: [...merged, ...newEntries], isOffline: true };
  }

  return { data: seed, isOffline: true };
}

export async function persistApprovalMatrixEntry(
  entry: ApprovalMatrixEntry,
): Promise<EngineConfigResult<ApprovalMatrixEntry>> {
  const result = await saveApprovalMatrixEntryApi(entry);
  if (result.success) {
    approvalMatrixStorage.save<ApprovalMatrixEntry>(entry);
    return { data: result.data, isOffline: false };
  }
  approvalMatrixStorage.save<ApprovalMatrixEntry>(entry);
  return { data: entry, isOffline: true };
}

export async function removeApprovalMatrixEntry(entryId: string): Promise<EngineConfigResult<boolean>> {
  const result = await deleteApprovalMatrixEntryApi(entryId);
  // Remove from localStorage regardless of API result
  approvalMatrixStorage.remove<ApprovalMatrixEntry>(entryId);
  return { data: result.success, isOffline: !result.success };
}
