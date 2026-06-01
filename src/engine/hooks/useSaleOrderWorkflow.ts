import { useCallback } from 'react';
import { useWorkflowEngine } from './useWorkflowEngine';
import type { WorkflowInstance } from '../types/workflowEngine';
import type { ServiceError } from '../types/services';
import { SALE_ORDER_ENTITY, SALE_ORDER_WORKFLOWS } from '../entities/saleOrder.config';

export type SaleOrderWorkflowPayload = {
  tenantId: string;
  viewCode: string;
  header: Record<string, unknown>;
  lines: Record<string, unknown>[];
  context?: Record<string, unknown>;
  entityId?: string;
};

export type SaleOrderWorkflowActions = {
  executeDraftSave: (payload: SaleOrderWorkflowPayload) => Promise<WorkflowInstance | null>;
  executeSubmit: (payload: SaleOrderWorkflowPayload) => Promise<WorkflowInstance | null>;
  executeHold: (entityId: string, reason: string, holdType: string, tenantId: string) => Promise<WorkflowInstance | null>;
  executeRelease: (entityId: string, reason: string, tenantId: string) => Promise<WorkflowInstance | null>;
  executeCancel: (entityId: string, reason: string, tenantId: string) => Promise<WorkflowInstance | null>;
  executeAmend: (entityId: string, reason: string, changes: Record<string, unknown>, tenantId: string) => Promise<WorkflowInstance | null>;
};

/**
 * Sale Order specific workflow hook.
 * Wraps useWorkflowEngine with SaleOrder workflow codes and entity name.
 * Reuse pattern: copy and adjust entity config for other entity workflow hooks.
 */
export function useSaleOrderWorkflow(): {
  state: { isLoading: boolean; workflowInstance: WorkflowInstance | null; workflowError: ServiceError | null };
  actions: SaleOrderWorkflowActions;
} {
  const { state, startWorkflow } = useWorkflowEngine();

  const buildRequest = (
    workflowCode: string,
    payload: SaleOrderWorkflowPayload,
    action: string
  ) => ({
    workflowCode,
    entityName: SALE_ORDER_ENTITY,
    entityId: payload.entityId,
    viewCode: payload.viewCode,
    action,
    tenantId: payload.tenantId,
    header: payload.header,
    lines: payload.lines,
    context: payload.context ?? {},
    correlationId: crypto.randomUUID(),
    idempotencyKey: `${workflowCode}-${Date.now()}`,
  });

  const executeDraftSave = useCallback(
    (payload: SaleOrderWorkflowPayload) =>
      startWorkflow(buildRequest(SALE_ORDER_WORKFLOWS.DRAFT_SAVE, payload, 'DraftSave')),
    [startWorkflow]
  );

  const executeSubmit = useCallback(
    (payload: SaleOrderWorkflowPayload) =>
      startWorkflow(buildRequest(SALE_ORDER_WORKFLOWS.SUBMIT, payload, 'Submit')),
    [startWorkflow]
  );

  const executeHold = useCallback(
    (entityId: string, reason: string, holdType: string, tenantId: string) =>
      startWorkflow(
        buildRequest(
          SALE_ORDER_WORKFLOWS.HOLD,
          { entityId, tenantId, viewCode: 'SO_DETAIL', header: { holdReason: reason, holdType }, lines: [] },
          'Hold'
        )
      ),
    [startWorkflow]
  );

  const executeRelease = useCallback(
    (entityId: string, reason: string, tenantId: string) =>
      startWorkflow(
        buildRequest(
          SALE_ORDER_WORKFLOWS.RELEASE,
          { entityId, tenantId, viewCode: 'SO_DETAIL', header: { releaseReason: reason }, lines: [] },
          'Release'
        )
      ),
    [startWorkflow]
  );

  const executeCancel = useCallback(
    (entityId: string, reason: string, tenantId: string) =>
      startWorkflow(
        buildRequest(
          SALE_ORDER_WORKFLOWS.CANCEL,
          { entityId, tenantId, viewCode: 'SO_DETAIL', header: { cancellationReason: reason }, lines: [] },
          'Cancel'
        )
      ),
    [startWorkflow]
  );

  const executeAmend = useCallback(
    (entityId: string, reason: string, changes: Record<string, unknown>, tenantId: string) =>
      startWorkflow(
        buildRequest(
          SALE_ORDER_WORKFLOWS.AMEND,
          { entityId, tenantId, viewCode: 'SO_DETAIL', header: { amendmentReason: reason, ...changes }, lines: [] },
          'Amend'
        )
      ),
    [startWorkflow]
  );

  return {
    state,
    actions: { executeDraftSave, executeSubmit, executeHold, executeRelease, executeCancel, executeAmend },
  };
}
