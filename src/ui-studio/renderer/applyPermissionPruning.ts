import type { RuntimeContext, ViewMetadata } from '../types';

export type PermissionPruner = (view: ViewMetadata, context: RuntimeContext) => ViewMetadata;

export const defaultPermissionPruner: PermissionPruner = (view) => view;

