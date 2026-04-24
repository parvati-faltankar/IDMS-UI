import type { TableColumnAggregation } from '../components/common/SortableTableHeader';

interface BuildNumberAggregationOptions<T> {
  selector: (row: T) => number | string | null | undefined;
  formatter?: (value: number) => string;
}

const defaultNumberFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatTableAggregationNumber(value: number): string {
  return defaultNumberFormatter.format(value);
}

export function buildNumberColumnAggregation<T>(
  rows: T[],
  { selector, formatter = formatTableAggregationNumber }: BuildNumberAggregationOptions<T>
): TableColumnAggregation {
  const numericValues = rows
    .map((row) => {
      const value = selector(row);
      if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
      }

      if (typeof value === 'string') {
        const sanitizedValue = Number.parseFloat(value.replace(/,/g, '').trim());
        return Number.isFinite(sanitizedValue) ? sanitizedValue : null;
      }

      return null;
    })
    .filter((value): value is number => value !== null);

  const count = rows.length;

  if (numericValues.length === 0) {
    return {
      count: count.toString(),
    };
  }

  const sum = numericValues.reduce((total, value) => total + value, 0);
  const average = sum / numericValues.length;
  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);

  return {
    count: count.toString(),
    sum: formatter(sum),
    average: formatter(average),
    min: formatter(min),
    max: formatter(max),
  };
}

export function buildCountColumnAggregation<T>(rows: T[]): TableColumnAggregation {
  return {
    count: rows.length.toString(),
  };
}
