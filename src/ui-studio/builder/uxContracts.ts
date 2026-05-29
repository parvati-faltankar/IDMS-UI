export interface UiStudioDesignTokens {
  color: {
    bg: string;
    panel: string;
    text: string;
    muted: string;
    brand: string;
    danger: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
  };
  motion: {
    fastMs: number;
    normalMs: number;
  };
}

export interface UiAssistHint {
  id: string;
  title: string;
  body: string;
  tone: 'info' | 'tip' | 'warning';
  context: 'fields' | 'layout' | 'behavior' | 'actions';
}

export type UiFeedbackState = 'idle' | 'success' | 'error';

export type BuilderSaveState = 'idle' | 'saving' | 'saved' | 'recovered' | 'error';

export interface BuilderDraftPersistenceEnvelope<TDraft> {
  schemaVersion: number;
  savedAt: number;
  draft: TDraft;
}

export interface BuilderDraftRecoveryResult<TDraft> {
  status: BuilderSaveState;
  reason?: string;
  backupKey?: string;
  draft: TDraft;
}

export interface BuilderPersistenceError {
  code: 'LOAD_FAILED' | 'SAVE_FAILED' | 'SCHEMA_MISMATCH';
  message: string;
}
