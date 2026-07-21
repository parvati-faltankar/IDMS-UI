import { useCallback, useEffect, useRef, useState } from 'react';

export interface CodeGenerationPolicyUndoToast {
  id: number;
  message: string;
  description: string;
  undoLabel: string;
  onUndo: () => void;
}

interface OptimisticMutationConfig<T> {
  description: string;
  message: string;
  nextState: (current: T[]) => T[];
}

export function useCodeGenerationPolicyOptimisticMutations<T>(initialState: T[]) {
  const [items, setItems] = useState<T[]>(initialState);
  const [toast, setToast] = useState<CodeGenerationPolicyUndoToast | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const dismissToast = useCallback(() => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setToast(null);
  }, []);

  useEffect(() => () => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
    }
  }, []);

  const runOptimisticMutation = useCallback((config: OptimisticMutationConfig<T>) => {
    let previousState: T[] = [];

    setItems((current) => {
      previousState = current;
      return config.nextState(current);
    });

    const undo = () => {
      setItems(previousState);
      dismissToast();
    };

    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
    }

    setToast({
      id: Date.now(),
      message: config.message,
      description: config.description,
      undoLabel: 'Undo',
      onUndo: undo,
    });

    hideTimerRef.current = window.setTimeout(() => {
      setToast(null);
      hideTimerRef.current = null;
    }, 7000);
  }, [dismissToast]);

  return {
    dismissToast,
    items,
    runOptimisticMutation,
    setItems,
    toast,
  };
}
