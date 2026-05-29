import type { RuntimeDiagnosticEvent, ViewMetadata } from '../types';

function sanitizeMessage(message: string): string {
  return message.replace(/\s+/g, ' ').trim();
}

export function createDiagnostic(
  view: ViewMetadata,
  errorCode: string,
  message: string,
  componentId?: string,
): RuntimeDiagnosticEvent {
  const sanitizedMessage = sanitizeMessage(message);
  const deterministicId = [view.id, view.version, errorCode, componentId ?? 'na'].join(':');

  return {
    id: deterministicId,
    viewId: view.id,
    viewVersion: view.version,
    errorCode,
    message: sanitizedMessage,
    componentId,
  };
}
