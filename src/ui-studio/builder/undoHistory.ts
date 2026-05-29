export interface UndoHistoryState<T> {
  past: T[];
  future: T[];
  maxSize: number;
}

export function emptyHistory<T>(maxSize = 50): UndoHistoryState<T> {
  return { past: [], future: [], maxSize };
}

/** Push current state onto the past stack and clear future (new branch). */
export function pushHistory<T>(history: UndoHistoryState<T>, current: T): UndoHistoryState<T> {
  const past = [current, ...history.past].slice(0, history.maxSize);
  return { past, future: [], maxSize: history.maxSize };
}

/** Undo: pop the most recent past, push current to future. Returns null if nothing to undo. */
export function undoStep<T>(
  history: UndoHistoryState<T>,
  current: T,
): { history: UndoHistoryState<T>; restored: T } | null {
  if (history.past.length === 0) return null;
  const [restored, ...rest] = history.past;
  return {
    history: {
      past: rest,
      future: [current, ...history.future].slice(0, history.maxSize),
      maxSize: history.maxSize,
    },
    restored,
  };
}

/** Redo: pop the most recent future, push current to past. Returns null if nothing to redo. */
export function redoStep<T>(
  history: UndoHistoryState<T>,
  current: T,
): { history: UndoHistoryState<T>; restored: T } | null {
  if (history.future.length === 0) return null;
  const [restored, ...rest] = history.future;
  return {
    history: {
      past: [current, ...history.past].slice(0, history.maxSize),
      future: rest,
      maxSize: history.maxSize,
    },
    restored,
  };
}

export function canUndo<T>(history: UndoHistoryState<T>): boolean {
  return history.past.length > 0;
}

export function canRedo<T>(history: UndoHistoryState<T>): boolean {
  return history.future.length > 0;
}
