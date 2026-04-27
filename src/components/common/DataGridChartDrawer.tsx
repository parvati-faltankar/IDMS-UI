import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import SideDrawer from './SideDrawer';
import { Select } from './FormControls';
import type { DataGridChartPreset, DataGridColumn } from './dataGridTypes';

interface DataGridChartDrawerProps<TData> {
  isOpen: boolean;
  title: string;
  rows: TData[];
  columns: DataGridColumn<TData>[];
  initialPreset?: DataGridChartPreset;
  onClose: () => void;
  onPresetChange: (preset: DataGridChartPreset) => void;
}

interface ChartBucket {
  label: string;
  value: number;
  segments?: Array<{ label: string; value: number }>;
}

type ChartDatum = {
  label: string;
  value: number;
} & Record<string, string | number>;

const chartPalette = ['#1c1977', '#2563eb', '#0f766e', '#d97706', '#7c3aed', '#ea580c', '#475569', '#dc2626'];

function coerceNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const numericValue = Number.parseFloat(value.replace(/,/g, '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  return null;
}

function toBucketLabel(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return 'Not specified';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}

function buildDefaultPreset<TData>(
  initialPreset: DataGridChartPreset | undefined,
  dimensionColumns: DataGridColumn<TData>[],
  metricColumns: DataGridColumn<TData>[],
  seriesColumns: DataGridColumn<TData>[]
): DataGridChartPreset {
  const fallbackDimensionColumnId = initialPreset?.dimensionColumnId ?? dimensionColumns[0]?.id ?? '';
  const fallbackMetricColumnId = initialPreset?.metricColumnId ?? metricColumns[0]?.id ?? '__count__';

  return (
    initialPreset ?? {
      chartType: 'bar',
      dimensionColumnId: fallbackDimensionColumnId,
      metricColumnId: fallbackMetricColumnId,
      aggregation: fallbackMetricColumnId === '__count__' ? 'count' : 'sum',
      seriesColumnId: seriesColumns[0]?.id,
    }
  );
}

const DataGridChartDrawer = <TData,>({
  isOpen,
  title,
  rows,
  columns,
  initialPreset,
  onClose,
  onPresetChange,
}: DataGridChartDrawerProps<TData>) => {
  const dimensionColumns = useMemo(
    () => columns.filter((column) => column.type !== 'actions'),
    [columns]
  );
  const metricColumns = useMemo(
    () => columns.filter((column) => column.type === 'number'),
    [columns]
  );
  const seriesColumns = useMemo(
    () =>
      columns.filter(
        (column) => column.type === 'status' || column.type === 'enum' || column.type === 'boolean'
      ),
    [columns]
  );

  const [preset, setPreset] = useState<DataGridChartPreset>(() =>
    buildDefaultPreset(initialPreset, dimensionColumns, metricColumns, seriesColumns)
  );

  const dimensionColumn = columns.find((column) => column.id === preset.dimensionColumnId) ?? null;
  const metricColumn = columns.find((column) => column.id === preset.metricColumnId) ?? null;
  const seriesColumn = columns.find((column) => column.id === preset.seriesColumnId) ?? null;

  const chartBuckets = useMemo<ChartBucket[]>(() => {
    if (!dimensionColumn) {
      return [];
    }

    const groupedValues = new Map<string, number[]>();
    const groupedSeriesValues = new Map<string, Map<string, number>>();

    rows.forEach((row) => {
      const dimensionValue = toBucketLabel(dimensionColumn.getValue?.(row));
      const nextValue =
        preset.metricColumnId === '__count__' ? 1 : coerceNumber(metricColumn?.getValue?.(row)) ?? 0;

      if (!groupedValues.has(dimensionValue)) {
        groupedValues.set(dimensionValue, []);
      }
      groupedValues.get(dimensionValue)?.push(nextValue);

      if (preset.chartType === 'stacked-bar' && seriesColumn) {
        const seriesValue = toBucketLabel(seriesColumn.getValue?.(row));
        if (!groupedSeriesValues.has(dimensionValue)) {
          groupedSeriesValues.set(dimensionValue, new Map<string, number>());
        }

        const seriesMap = groupedSeriesValues.get(dimensionValue) as Map<string, number>;
        seriesMap.set(seriesValue, (seriesMap.get(seriesValue) ?? 0) + nextValue);
      }
    });

    const aggregateValues = (values: number[]) => {
      if (values.length === 0) {
        return 0;
      }

      if (preset.aggregation === 'count') {
        return values.length;
      }

      const sum = values.reduce((total, value) => total + value, 0);
      if (preset.aggregation === 'sum') {
        return sum;
      }
      if (preset.aggregation === 'average') {
        return sum / values.length;
      }
      if (preset.aggregation === 'min') {
        return Math.min(...values);
      }
      return Math.max(...values);
    };

    return Array.from(groupedValues.entries())
      .map(([label, values]) => ({
        label,
        value: aggregateValues(values),
        segments:
          preset.chartType === 'stacked-bar' && seriesColumn
            ? Array.from((groupedSeriesValues.get(label) ?? new Map<string, number>()).entries()).map(
                ([segmentLabel, segmentValue]) => ({
                  label: segmentLabel,
                  value: segmentValue,
                })
              )
            : undefined,
      }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 8);
  }, [dimensionColumn, metricColumn, preset.aggregation, preset.chartType, preset.metricColumnId, rows, seriesColumn]);

  const chartData = useMemo<ChartDatum[]>(
    () =>
      chartBuckets.map((bucket) => {
        const baseDatum: ChartDatum = {
          label: bucket.label,
          value: Number(bucket.value.toFixed(2)),
        };

        bucket.segments?.forEach((segment) => {
          baseDatum[segment.label] = Number(segment.value.toFixed(2));
        });

        return baseDatum;
      }),
    [chartBuckets]
  );

  const stackedKeys = useMemo(
    () => Array.from(new Set(chartBuckets.flatMap((bucket) => bucket.segments?.map((segment) => segment.label) ?? []))),
    [chartBuckets]
  );

  const totalValue = useMemo(
    () => chartBuckets.reduce((total, bucket) => total + bucket.value, 0),
    [chartBuckets]
  );
  const averageValue = useMemo(
    () => (chartBuckets.length === 0 ? 0 : totalValue / chartBuckets.length),
    [chartBuckets.length, totalValue]
  );
  const topBucket = chartBuckets[0] ?? null;

  const handlePresetChange = (nextPreset: DataGridChartPreset) => {
    setPreset(nextPreset);
    onPresetChange(nextPreset);
  };

  const chartTitle = preset.metricColumnId === '__count__' ? 'Rows' : metricColumn?.label ?? 'Metric';

  return (
    <SideDrawer
      isOpen={isOpen}
      title="Visualize data"
      subtitle={`Create a quick chart from the current ${title.toLowerCase()} view.`}
      onClose={onClose}
      panelClassName="side-drawer__panel--chart"
      footer={
        <>
          <button type="button" className="btn btn--outline" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn btn--primary" onClick={onClose}>
            Apply
          </button>
        </>
      }
    >
      <div className="catalogue-chart-builder">
        <div className="catalogue-chart-builder__controls">
          <label className="catalogue-chart-builder__field">
            <span className="field-label">Chart type</span>
            <Select
              value={preset.chartType}
              onChange={(event) =>
                handlePresetChange({
                  ...preset,
                  chartType: event.target.value as DataGridChartPreset['chartType'],
                })
              }
              options={[
                { value: 'bar', label: 'Bar chart' },
                { value: 'line', label: 'Line chart' },
                { value: 'area', label: 'Area chart' },
                { value: 'donut', label: 'Donut chart' },
                { value: 'stacked-bar', label: 'Stacked bar' },
              ]}
            />
          </label>

          <label className="catalogue-chart-builder__field">
            <span className="field-label">Category</span>
            <Select
              value={preset.dimensionColumnId}
              onChange={(event) =>
                handlePresetChange({
                  ...preset,
                  dimensionColumnId: event.target.value,
                })
              }
              options={dimensionColumns.map((column) => ({ value: column.id, label: column.label }))}
            />
          </label>

          <label className="catalogue-chart-builder__field">
            <span className="field-label">Metric</span>
            <Select
              value={preset.metricColumnId}
              onChange={(event) =>
                handlePresetChange({
                  ...preset,
                  metricColumnId: event.target.value,
                  aggregation: event.target.value === '__count__' ? 'count' : preset.aggregation,
                })
              }
              options={[
                { value: '__count__', label: 'Count rows' },
                ...metricColumns.map((column) => ({ value: column.id, label: column.label })),
              ]}
            />
          </label>

          <label className="catalogue-chart-builder__field">
            <span className="field-label">Aggregation</span>
            <Select
              value={preset.aggregation}
              onChange={(event) =>
                handlePresetChange({
                  ...preset,
                  aggregation: event.target.value as DataGridChartPreset['aggregation'],
                })
              }
              disabled={preset.metricColumnId === '__count__'}
              options={[
                { value: 'count', label: 'Count' },
                { value: 'sum', label: 'Sum' },
                { value: 'average', label: 'Average' },
                { value: 'min', label: 'Minimum' },
                { value: 'max', label: 'Maximum' },
              ]}
            />
          </label>

          {preset.chartType === 'stacked-bar' && seriesColumns.length > 0 && (
            <label className="catalogue-chart-builder__field">
              <span className="field-label">Series</span>
              <Select
                value={preset.seriesColumnId ?? seriesColumns[0]?.id ?? ''}
                onChange={(event) =>
                  handlePresetChange({
                    ...preset,
                    seriesColumnId: event.target.value,
                  })
                }
                options={seriesColumns.map((column) => ({ value: column.id, label: column.label }))}
              />
            </label>
          )}
        </div>

        <div className="catalogue-chart-builder__stats">
          <article className="catalogue-chart-builder__stat-card">
            <span>Rows in scope</span>
            <strong>{rows.length}</strong>
          </article>
          <article className="catalogue-chart-builder__stat-card">
            <span>Total {chartTitle.toLowerCase()}</span>
            <strong>{Math.round(totalValue)}</strong>
          </article>
          <article className="catalogue-chart-builder__stat-card">
            <span>Average per bucket</span>
            <strong>{Math.round(averageValue || 0)}</strong>
          </article>
          <article className="catalogue-chart-builder__stat-card">
            <span>Top category</span>
            <strong>{topBucket?.label ?? '-'}</strong>
          </article>
        </div>

        <div className="catalogue-chart-builder__canvas">
          <div className="catalogue-chart-builder__meta">
            <strong>Based on current filtered grid data</strong>
            <span>{rows.length} rows in scope</span>
          </div>

          {chartData.length === 0 ? (
            <div className="catalogue-chart-builder__empty">No chartable values are available for this selection.</div>
          ) : (
            <div className="catalogue-chart-builder__chart-surface">
              <ResponsiveContainer width="100%" height={320}>
                {preset.chartType === 'bar' ? (
                  <BarChart data={chartData} margin={{ top: 12, right: 12, bottom: 8, left: -12 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(148 163 184 / 0.24)" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} interval={0} tickMargin={10} minTickGap={16} />
                    <YAxis tickLine={false} axisLine={false} width={38} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[10, 10, 10, 10]} fill="#1c1977" maxBarSize={54} />
                  </BarChart>
                ) : preset.chartType === 'line' ? (
                  <LineChart data={chartData} margin={{ top: 12, right: 12, bottom: 8, left: -12 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(148 163 184 / 0.24)" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} interval={0} tickMargin={10} minTickGap={16} />
                    <YAxis tickLine={false} axisLine={false} width={38} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#1c1977" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                ) : preset.chartType === 'area' ? (
                  <AreaChart data={chartData} margin={{ top: 12, right: 12, bottom: 8, left: -12 }}>
                    <defs>
                      <linearGradient id="catalogue-chart-area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1c1977" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#1c1977" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(148 163 184 / 0.24)" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} interval={0} tickMargin={10} minTickGap={16} />
                    <YAxis tickLine={false} axisLine={false} width={38} />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#1c1977" strokeWidth={3} fill="url(#catalogue-chart-area)" />
                  </AreaChart>
                ) : preset.chartType === 'donut' ? (
                  <PieChart>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={24} />
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="46%"
                      innerRadius={72}
                      outerRadius={108}
                      paddingAngle={2}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${entry.label}`} fill={chartPalette[index % chartPalette.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 12, right: 12, bottom: 8, left: -12 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(148 163 184 / 0.24)" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} interval={0} tickMargin={10} minTickGap={16} />
                    <YAxis tickLine={false} axisLine={false} width={38} />
                    <Tooltip />
                    <Legend verticalAlign="top" height={28} />
                    {stackedKeys.map((stackKey, index) => (
                      <Bar key={stackKey} dataKey={stackKey} stackId="total" fill={chartPalette[index % chartPalette.length]} radius={index === stackedKeys.length - 1 ? [10, 10, 10, 10] : [0, 0, 0, 0]} maxBarSize={54} />
                    ))}
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </SideDrawer>
  );
};

export default DataGridChartDrawer;
