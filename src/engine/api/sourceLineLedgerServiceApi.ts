import type { ServiceResponse, SourceLineLedgerOutput } from '../types/services';
import { enginePost, engineGet } from './apiClient';

export type SourceLineLedgerRequest = {
  tenantId: string;
  entityName: string;
  entityId: string;
  workflowInstanceId: string;
  lines: {
    lineId: string;
    orderedQuantity: number;
  }[];
  correlationId: string;
};

export async function generateSourceLineReference(
  request: SourceLineLedgerRequest
): Promise<ServiceResponse<SourceLineLedgerOutput>> {
  return enginePost<SourceLineLedgerOutput>('/api/services/source-line-ledger/generate-reference', request);
}

export async function validateProcessedScope(
  request: SourceLineLedgerRequest
): Promise<ServiceResponse<SourceLineLedgerOutput>> {
  return enginePost<SourceLineLedgerOutput>('/api/services/source-line-ledger/validate-scope', request);
}

export async function getSourceLineLedger(
  entityName: string,
  entityId: string
): Promise<ServiceResponse<SourceLineLedgerOutput>> {
  return engineGet<SourceLineLedgerOutput>(`/api/services/source-line-ledger/${entityName}/${entityId}`);
}
