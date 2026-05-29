import type { RuntimeDiagnosticEvent, ViewMetadata } from '../types';

export interface RenderedComponentModel {
  id: string;
  type: string;
  label?: string;
  hidden?: boolean;
  disabled?: boolean;
}

export interface RenderedActionModel {
  id: string;
  label: string;
  hidden?: boolean;
  disabled?: boolean;
}

export interface RenderModel {
  viewId: string;
  componentModels: RenderedComponentModel[];
  actionModels: RenderedActionModel[];
  diagnostics: RuntimeDiagnosticEvent[];
}

export interface RenderResult {
  metadata: ViewMetadata;
  model: RenderModel;
}
