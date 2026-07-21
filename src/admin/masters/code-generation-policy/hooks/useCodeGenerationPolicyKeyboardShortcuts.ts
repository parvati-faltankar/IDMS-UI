import { useEffect } from 'react';

export function useCodeGenerationPolicyKeyboardShortcuts({
  onDismiss,
  onPrimaryAction,
}: {
  onDismiss: () => void;
  onPrimaryAction: () => void;
}) {
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isInteractiveField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement ||
        target instanceof HTMLTextAreaElement ||
        !!target?.closest('[contenteditable="true"]');

      if (event.key === 'Escape') {
        onDismiss();
        return;
      }

      if (isInteractiveField || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (event.key.toLowerCase() === 'a') {
        event.preventDefault();
        onPrimaryAction();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [onDismiss, onPrimaryAction]);
}
