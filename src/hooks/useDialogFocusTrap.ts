import { useEffect, useRef } from 'react';

interface UseDialogFocusTrapOptions {
  isOpen: boolean;
  onClose: () => void;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  fallbackFocusRef?: React.RefObject<HTMLElement | null>;
}

export function useDialogFocusTrap<T extends HTMLElement>({
  isOpen,
  onClose,
  initialFocusRef,
  fallbackFocusRef,
}: UseDialogFocusTrapOptions) {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const focusTimer = window.setTimeout(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
        return;
      }

      fallbackFocusRef?.current?.focus();
    }, 20);

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [fallbackFocusRef, initialFocusRef, isOpen, onClose]);

  const handleKeyDown = (event: React.KeyboardEvent<T>) => {
    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = containerRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (!focusableElements || focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  return {
    containerRef,
    handleKeyDown,
  };
}
