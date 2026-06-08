import type {
  ControlledActionRequest,
  ImportCommitRequest,
  ImportValidationResult,
} from '../types/warehouse.dto';
import type { AuditEvent, ValidationIssue, Warehouse } from '../types/warehouse.types';
import type { WarehouseLifecycleAction, WarehouseStatus } from '../types/warehouse.enums';
import type { WarehousePermissions } from '../types/warehouse.permissions';

export type ControlledActionKind =
  | 'Activate'
  | 'Block'
  | 'Unblock'
  | 'Inactivate'
  | 'Reactivate'
  | 'ChangeMode'
  | 'AssignBranch'
  | 'RevokeBranch'
  | 'ApproveImport'
  | 'ApproveMigration'
  | 'OverrideCapacity'
  | 'OverridePutaway'
  | 'OverridePicking'
  | 'ActivateTemplateVersion';

export interface ControlledActionSpec {
  readonly kind: ControlledActionKind;
  readonly summary: string;
  readonly consequenceNote: string;
  readonly approvalRequired: boolean;
  readonly effectiveDateAllowed: boolean;
  readonly approverRoute?: string;
  readonly requiredPermission: keyof WarehousePermissions | 'warehouse.activate';
  readonly reasonCodes: string[];
}

export interface ControlledActionPlan {
  readonly kind: ControlledActionKind;
  readonly title: string;
  readonly summary: string;
  readonly impactSummary: string[];
  readonly approvalRequired: boolean;
  readonly approverRoute?: string;
  readonly checklist: Array<{ id: string; label: string; passed: boolean; detail?: string }>;
  readonly consequenceNote: string;
  readonly request: ControlledActionRequest;
}

const ACTION_SPECS: Record<ControlledActionKind, ControlledActionSpec> = {
  Activate: {
    kind: 'Activate',
    summary: 'Activate this warehouse and unlock operational usage.',
    consequenceNote: 'Activation makes the warehouse operational and locks some setup choices.',
    approvalRequired: false,
    effectiveDateAllowed: false,
    requiredPermission: 'warehouse.activate',
    reasonCodes: ['GO-LIVE', 'SETUP-COMPLETE'],
  },
  Block: {
    kind: 'Block',
    summary: 'Block transactions while preserving history.',
    consequenceNote: 'Blocked warehouses remain visible but operational posting should stop.',
    approvalRequired: false,
    effectiveDateAllowed: false,
    requiredPermission: 'warehouse.block',
    reasonCodes: ['COMPLIANCE', 'OPERATIONS-HOLD', 'SAFETY'],
  },
  Unblock: {
    kind: 'Unblock',
    summary: 'Restore operational access to a blocked warehouse.',
    consequenceNote: 'Unblocking re-enables usage if other dependencies are clear.',
    approvalRequired: false,
    effectiveDateAllowed: false,
    requiredPermission: 'warehouse.unblock',
    reasonCodes: ['ISSUE-RESOLVED', 'CLEARANCE-RECEIVED'],
  },
  Inactivate: {
    kind: 'Inactivate',
    summary: 'Retire the warehouse from active use.',
    consequenceNote: 'Inactivation preserves history but should stop all operational usage.',
    approvalRequired: true,
    effectiveDateAllowed: true,
    approverRoute: 'Operations Governance',
    requiredPermission: 'warehouse.inactivate',
    reasonCodes: ['NETWORK-CONSOLIDATION', 'SITE-CLOSED', 'OWNERSHIP-CHANGE'],
  },
  Reactivate: {
    kind: 'Reactivate',
    summary: 'Return an inactive warehouse to service.',
    consequenceNote: 'Reactivation should be used only after governance checks pass.',
    approvalRequired: true,
    effectiveDateAllowed: true,
    approverRoute: 'Operations Governance',
    requiredPermission: 'warehouse.activate',
    reasonCodes: ['SITE-REOPEN', 'TEMPORARY-CLOSURE-ENDED'],
  },
  ChangeMode: {
    kind: 'ChangeMode',
    summary: 'Change Inventory Control Mode for this warehouse.',
    consequenceNote: 'Mode changes can alter posting behavior, hierarchy dependency, and location rules.',
    approvalRequired: true,
    effectiveDateAllowed: true,
    approverRoute: 'Inventory Governance',
    requiredPermission: 'warehouse.changeInventoryMode',
    reasonCodes: ['WMS-ENABLEMENT', 'PROCESS-REDESIGN'],
  },
  AssignBranch: {
    kind: 'AssignBranch',
    summary: 'Grant branch access to the warehouse.',
    consequenceNote: 'Branch assignment changes who can transact in this warehouse.',
    approvalRequired: false,
    effectiveDateAllowed: true,
    requiredPermission: 'warehouse.assignBranch',
    reasonCodes: ['COVERAGE-EXPANSION', 'OWNERSHIP-ALIGNMENT'],
  },
  RevokeBranch: {
    kind: 'RevokeBranch',
    summary: 'Remove branch assignment from the warehouse.',
    consequenceNote: 'Revoking assignment can immediately remove operational access for that branch.',
    approvalRequired: true,
    effectiveDateAllowed: true,
    approverRoute: 'Org Governance',
    requiredPermission: 'warehouse.revokeBranch',
    reasonCodes: ['ACCESS-REVOCATION', 'OWNERSHIP-REALIGNMENT'],
  },
  ApproveImport: {
    kind: 'ApproveImport',
    summary: 'Approve controlled import changes before commit.',
    consequenceNote: 'Approval authorizes the import result; commit still revalidates before mutation.',
    approvalRequired: true,
    effectiveDateAllowed: false,
    approverRoute: 'Master Data Approval',
    requiredPermission: 'warehouse.import',
    reasonCodes: ['CONTROLLED-FIELD-CHANGE', 'MIGRATION-REVIEW'],
  },
  ApproveMigration: {
    kind: 'ApproveMigration',
    summary: 'Approve a migration batch with governance-sensitive effects.',
    consequenceNote: 'Migration approval is separate from operational activation.',
    approvalRequired: true,
    effectiveDateAllowed: false,
    approverRoute: 'Migration Governance',
    requiredPermission: 'warehouse.import',
    reasonCodes: ['MIGRATION-WAVE', 'DATA-CUTOVER'],
  },
  OverrideCapacity: {
    kind: 'OverrideCapacity',
    summary: 'Temporarily override hard capacity constraints.',
    consequenceNote: 'Capacity overrides should be time-bound and auditable.',
    approvalRequired: true,
    effectiveDateAllowed: true,
    approverRoute: 'Warehouse Ops Approval',
    requiredPermission: 'location.editCapacity',
    reasonCodes: ['PEAK-LOAD', 'EMERGENCY-EXCEPTION'],
  },
  OverridePutaway: {
    kind: 'OverridePutaway',
    summary: 'Override directed putaway recommendation.',
    consequenceNote: 'Manual override should be justified because it bypasses configured routing.',
    approvalRequired: false,
    effectiveDateAllowed: false,
    requiredPermission: 'putawayOverride.grant',
    reasonCodes: ['NO-CANDIDATE', 'OPERATIONS-EXCEPTION'],
  },
  OverridePicking: {
    kind: 'OverridePicking',
    summary: 'Override directed picking recommendation.',
    consequenceNote: 'Manual override should be justified because it bypasses configured picking logic.',
    approvalRequired: false,
    effectiveDateAllowed: false,
    requiredPermission: 'pickingOverride.grant',
    reasonCodes: ['SHORT-PICK', 'OPERATIONS-EXCEPTION'],
  },
  ActivateTemplateVersion: {
    kind: 'ActivateTemplateVersion',
    summary: 'Activate a hierarchy template version.',
    consequenceNote: 'Template activation affects future location governance and hierarchy validation.',
    approvalRequired: true,
    effectiveDateAllowed: true,
    approverRoute: 'Warehouse Design Approval',
    requiredPermission: 'hierarchy.activate',
    reasonCodes: ['HIERARCHY-REVISION', 'GO-LIVE'],
  },
};

function mapActionToWarehouseLifecycleAction(kind: ControlledActionKind, currentStatus: WarehouseStatus): WarehouseLifecycleAction {
  if (kind === 'Block') return 'Block';
  if (kind === 'Unblock') return 'Unblock';
  if (kind === 'Inactivate') return 'Inactivate';
  if (kind === 'ChangeMode') return 'ChangeMode';
  if (kind === 'AssignBranch') return 'AssignBranch';
  if (kind === 'RevokeBranch') return 'RevokeBranch';
  if (kind === 'Reactivate') return currentStatus === 'Inactive' ? 'Activate' : 'Unblock';
  return 'Activate';
}

export function buildControlledActionPlan(args: {
  warehouse: Pick<Warehouse, 'warehouseCode' | 'warehouseName' | 'status' | 'version'>;
  kind: ControlledActionKind;
  reasonCode?: string;
  reasonDescription?: string;
  effectiveDate?: string;
  validationIssues?: ValidationIssue[];
}): ControlledActionPlan {
  const spec = ACTION_SPECS[args.kind];
  const validationIssues = args.validationIssues ?? [];
  const checklist = [
    {
      id: 'reason-code',
      label: 'Reason code captured',
      passed: Boolean(args.reasonCode),
      detail: 'A reason code is required for controlled actions.',
    },
    {
      id: 'reason-description',
      label: 'Explanation captured',
      passed: Boolean(args.reasonDescription?.trim()),
      detail: 'Add a short explanation for audit and reviewer context.',
    },
    {
      id: 'validation',
      label: 'Validation checklist is clear',
      passed: validationIssues.filter((issue) => issue.severity === 'error').length === 0,
      detail: validationIssues.filter((issue) => issue.severity === 'error')[0]?.message,
    },
    {
      id: 'effective-date',
      label: spec.effectiveDateAllowed ? 'Effective date provided where applicable' : 'No effective date required',
      passed: spec.effectiveDateAllowed ? Boolean(args.effectiveDate) : true,
      detail: spec.effectiveDateAllowed ? 'Choose when this change should take effect.' : undefined,
    },
  ];

  return {
    kind: args.kind,
    title: `${args.kind} Review`,
    summary: spec.summary,
    impactSummary: [
      `${args.warehouse.warehouseName} (${args.warehouse.warehouseCode})`,
      `Current version: ${args.warehouse.version}`,
      spec.approvalRequired ? 'Approval route will be invoked before completion.' : 'No additional approval route is required.',
    ],
    approvalRequired: spec.approvalRequired,
    approverRoute: spec.approverRoute,
    checklist,
    consequenceNote: spec.consequenceNote,
    request: {
      action: mapActionToWarehouseLifecycleAction(args.kind, args.warehouse.status),
      reasonCode: args.reasonCode,
      reasonDescription: args.reasonDescription,
      effectiveDate: args.effectiveDate,
      approvalRoute: spec.approverRoute,
      approvalRequired: spec.approvalRequired,
      correlationId: `COR-ACT-${Date.now()}`,
    },
  };
}

export function actionNeedsApproval(kind: ControlledActionKind): boolean {
  return ACTION_SPECS[kind].approvalRequired;
}

export function getReasonCodesForAction(kind: ControlledActionKind): string[] {
  return ACTION_SPECS[kind].reasonCodes;
}

export function requiresControlledChangeApproval(result: Pick<ImportValidationResult, 'approvalRequired' | 'requiresReason'>): boolean {
  return Boolean(result.approvalRequired || result.requiresReason);
}

export function buildImportCommitPayload(
  validation: ImportValidationResult,
  request: {
    mode: ImportCommitRequest['mode'];
    reasonCode?: string;
    reasonDescription?: string;
    approvalRoute?: string;
  },
): ImportCommitRequest {
  return {
    importSessionId: validation.importSessionId,
    mode: request.mode,
    idempotencyKey: validation.idempotencyKey,
    fileHash: validation.fileHash,
    reasonCode: request.reasonCode,
    reasonDescription: request.reasonDescription,
    approvalRoute: request.approvalRoute,
  };
}

export function formatAuditEventLabel(event: AuditEvent): string {
  const source = event.source ? ` (${event.source})` : '';
  return `${event.action}${source}`;
}

export function filterAuditEvents(
  events: AuditEvent[],
  filters: {
    action?: string;
    entityType?: AuditEvent['entityType'] | '';
    search?: string;
  },
): AuditEvent[] {
  const query = filters.search?.trim().toLowerCase() ?? '';
  return events.filter((event) => {
    if (filters.action && filters.action !== 'all' && event.action !== filters.action) return false;
    if (filters.entityType && event.entityType !== filters.entityType) return false;
    if (!query) return true;
    const haystack = [
      event.action,
      event.performedBy,
      event.reasonCode ?? '',
      event.reasonDescription ?? '',
      event.correlationId ?? '',
      event.referenceId ?? '',
    ].join(' ').toLowerCase();
    return haystack.includes(query);
  });
}

export function detectPermissionDenied(
  permissions: WarehousePermissions,
  permissionKey: keyof WarehousePermissions,
): ValidationIssue[] {
  if (permissions[permissionKey]) return [];
  return [{
    severity: 'error',
    category: 'PermissionDenied',
    message: 'You do not have permission to perform this action.',
  }];
}

export function parseWarehouseServiceError(error: unknown): { tone: 'error' | 'warning'; message: string } {
  if (error instanceof Error) {
    if (/stale/i.test(error.message)) {
      return { tone: 'warning', message: 'This record is stale. Reload the latest data before retrying.' };
    }
    return { tone: 'error', message: error.message };
  }

  return { tone: 'error', message: 'An unexpected service error occurred.' };
}
