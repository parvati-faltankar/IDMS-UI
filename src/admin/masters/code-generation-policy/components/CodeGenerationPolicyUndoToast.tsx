import React from 'react';
import type { CodeGenerationPolicyUndoToast as CodeGenerationPolicyUndoToastState } from '../hooks/useCodeGenerationPolicyOptimisticMutations';

interface CodeGenerationPolicyUndoToastProps {
  onDismiss: () => void;
  toast: CodeGenerationPolicyUndoToastState | null;
}

export default function CodeGenerationPolicyUndoToast({
  onDismiss,
  toast,
}: CodeGenerationPolicyUndoToastProps) {
  if (!toast) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[2200] w-[min(420px,calc(100vw-32px))] rounded-2xl border border-slate-200/60 bg-white/70 p-4 shadow-xl backdrop-blur-lg dark:border-white/10 dark:bg-slate-950/60 dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
      <div className="flex items-start gap-3">
        <span className="relative mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400">
          <span className="absolute inset-0 rounded-full bg-emerald-400/70 blur-md" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{toast.message}</div>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{toast.description}</p>
          <div className="mt-3 flex items-center gap-2">
            <button
              className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
              onClick={toast.onUndo}
              type="button"
            >
              {toast.undoLabel}
            </button>
            <button
              className="inline-flex items-center rounded-full border border-slate-200/70 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-slate-900/60"
              onClick={onDismiss}
              type="button"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
