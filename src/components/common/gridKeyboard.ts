import type React from 'react';

export interface GridLastCellTabOptions<TLine> {
  event: React.KeyboardEvent<HTMLElement>;
  line: TLine;
  lineIndex: number;
  lines: TLine[];
  canAddLine?: boolean;
  isLineComplete: (line: TLine) => boolean;
  onAddLine: () => void;
  onIncompleteLine?: (line: TLine) => void;
}

export function hasRequiredGridValues<TLine>(
  line: TLine,
  requiredFields: Array<keyof TLine>
) {
  return requiredFields.every((field) => {
    const value = line[field];
    if (typeof value === 'number') {
      return Number.isFinite(value) && value > 0;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return false;
      }

      const numericValue = Number(trimmed);
      return Number.isNaN(numericValue) || numericValue > 0;
    }

    return Boolean(value);
  });
}

export function handleGridLastCellTab<TLine>({
  event,
  line,
  lineIndex,
  lines,
  canAddLine = true,
  isLineComplete,
  onAddLine,
  onIncompleteLine,
}: GridLastCellTabOptions<TLine>) {
  if (event.key !== 'Tab' || event.shiftKey || !canAddLine || lineIndex !== lines.length - 1) {
    return;
  }

  if (!isLineComplete(line)) {
    event.preventDefault();
    onIncompleteLine?.(line);
    return;
  }

  event.preventDefault();
  onAddLine();
}
