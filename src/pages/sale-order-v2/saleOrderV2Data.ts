import type { WorkflowStatus } from '../../engine/types/workflowEngine';
import {
  extendedSaleOrderDocuments,
  saleOrderDocuments,
  type SaleOrderDocument,
  type SaleOrderLineDocument,
} from '../sale-order/saleOrderData';

export type { SaleOrderLineDocument, SaleOrderDocument };

export interface SaleOrderV2Document extends SaleOrderDocument {
  workflowInstanceId?: string;
  workflowStatus?: WorkflowStatus;
  approvalCaseId?: string;
  revisionNumber?: number;
  holdStatus?: 'OnHold' | 'Released';
  holdType?: string;
  holdReason?: string;
  downstreamReady?: boolean;
  rowVersion?: number;
  pricingEngineReference?: string;
  taxEngineReference?: string;
  discountPolicyReference?: string;
  chargeEngineReference?: string;
}

const toV2 = (document: SaleOrderDocument): SaleOrderV2Document => ({
  ...document,
  revisionNumber: 1,
  downstreamReady: false,
  rowVersion: 1,
});

export const saleOrderV2Documents: SaleOrderV2Document[] = saleOrderDocuments.map(toV2);

export const extendedSaleOrderV2Documents: SaleOrderV2Document[] =
  extendedSaleOrderDocuments.map(toV2);

export function findSaleOrderV2Document(id: string | undefined): SaleOrderV2Document | undefined {
  if (id === undefined) {
    return undefined;
  }
  return extendedSaleOrderV2Documents.find((document) => document.id === id);
}
