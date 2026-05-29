export type ViewSurface =
  | 'list'
  | 'detail'
  | 'create-edit'
  | 'transaction-workspace'
  | 'dashboard'
  | 'wizard'
  | 'console';

export type BindingType = 'entity-field' | 'relationship' | 'query' | 'static' | 'computed' | 'external';

export type RuleEffect = 'show' | 'hide' | 'enable' | 'disable' | 'readonly' | 'required' | 'warning';

export type RuntimeMode = 'view' | 'edit' | 'preview';
export type RuntimeDevice = 'desktop' | 'tablet' | 'mobile';
export type RuntimeChannel = 'web' | 'mobile' | 'portal';

export interface ViewMetadata {
  id: string;
  viewCode: string;
  name: string;
  entityName: string;
  surface: ViewSurface;
  version: string;
  layout: LayoutNode;
  components: ComponentNode[];
  actions: ActionDefinition[];
  rules: BehaviorRule[];
  variants?: ViewVariant[];
}

export interface LayoutNode {
  id: string;
  type: 'root' | 'section' | 'row' | 'column' | 'card' | 'tabs';
  children?: LayoutNode[];
  componentIds?: string[];
}

export interface BindingDefinition {
  type: BindingType;
  source: string;
  fieldPath?: string;
}

export interface ComponentNode {
  id: string;
  type: string;
  label?: string;
  bindings?: BindingDefinition[];
  props?: Record<string, unknown>;
}

export interface ActionDefinition {
  id: string;
  label: string;
  commandId: string;
  type?: ActionType;
  targetComponentId?: string;
  payload?: ActionPayload;
  requiresConfirmation?: boolean;
}

export type ActionType = 'ui.navigate' | 'ui.open-panel' | 'workflow.transition';

export interface ActionPayload {
  route?: string;
  panelId?: string;
  transitionId?: string;
}

export interface RuleCondition {
  all?: RuleCondition[];
  any?: RuleCondition[];
  field?: string;
  contextPath?: string;
  operator?: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty';
  value?: unknown;
}

export interface BehaviorRule {
  id: string;
  targetComponentId?: string;
  targetActionId?: string;
  effect: RuleEffect;
  condition: RuleCondition;
}

export interface RuntimeContext {
  userId: string;
  roles: string[];
  mode: RuntimeMode;
  device: RuntimeDevice;
  channel?: RuntimeChannel;
  workflowState?: string;
  tenantId?: string;
  nodeId?: string;
  branchId?: string;
}

export interface ViewVariant {
  id: string;
  name: string;
  priority: number;
  appliesWhen: VariantCondition;
  delta: ViewMetadataDelta;
}

export interface VariantCondition {
  tenantId?: string;
  nodeId?: string;
  branchId?: string;
  roleIds?: string[];
  workflowState?: string;
  channel?: RuntimeChannel;
}

export interface ViewMetadataDelta {
  componentChanges?: ComponentNode[];
  ruleChanges?: BehaviorRule[];
  actionChanges?: ActionDefinition[];
}

export interface ValidationIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  path?: string;
  blocking: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
}

export interface RuntimeDiagnosticEvent {
  id: string;
  viewId: string;
  viewVersion: string;
  errorCode: string;
  message: string;
  componentId?: string;
  actionId?: string;
  traceId?: string;
}
