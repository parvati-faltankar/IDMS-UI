import type { CatalogueInsightItem, CatalogueInsightTone } from '../components/common/CatalogueInsightCards';

export function getInsightPercent(value: number, total: number): number {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

export function formatInsightCount(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatInsightAmount(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'INR',
  }).format(value);
}

export function sumNumericValues<T>(rows: T[], selector: (row: T) => string | number | undefined): number {
  return rows.reduce((sum, row) => {
    const value = Number.parseFloat(String(selector(row) ?? '0'));
    return sum + (Number.isNaN(value) ? 0 : value);
  }, 0);
}

export function buildCountInsight({
  key,
  label,
  count,
  total,
  support,
  hint,
  tone = 'neutral',
}: {
  key: string;
  label: string;
  count: number;
  total: number;
  support: string;
  hint?: string;
  tone?: CatalogueInsightTone;
}): CatalogueInsightItem {
  const progress = getInsightPercent(count, total);

  return {
    key,
    label,
    value: formatInsightCount(count),
    support,
    hint,
    progress,
    tone,
  };
}
