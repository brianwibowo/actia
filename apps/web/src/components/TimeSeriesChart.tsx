import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { Card, CardBody, CardHeader, StateBox } from './ui';

export interface ChartSeries {
  name: string;
  data: Array<[string, number | null]>;
  color: string;
  yAxisIndex?: number;
}

interface TimeSeriesChartProps {
  title: string;
  subtitle?: string;
  yLeftLabel: string;
  yRightLabel?: string;
  series: ChartSeries[];
  emptyMessage: string;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return `rgba(4, 120, 87, ${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function TimeSeriesChart({
  title,
  subtitle,
  yLeftLabel,
  yRightLabel,
  series,
  emptyMessage,
}: TimeSeriesChartProps) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [themeTick, setThemeTick] = useState(0);

  const hasData = series.some((s) => s.data.some((pt) => pt[1] !== null));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setThemeTick((n) => n + 1);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!elRef.current || !hasData) return;

    const chart = echarts.init(elRef.current);
    chartRef.current = chart;

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(elRef.current);

    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, [hasData]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !hasData) return;

    const styles = getComputedStyle(document.documentElement);
    const textColor = styles.getPropertyValue('--chart-text').trim() || '#0f172a';
    const mutedColor = styles.getPropertyValue('--chart-muted').trim() || '#475569';
    const gridColor = styles.getPropertyValue('--chart-grid').trim() || '#e2e8f0';
    const surfaceColor = styles.getPropertyValue('--chart-surface').trim() || '#ffffff';

    const yAxes: echarts.YAXisComponentOption[] = [
      {
        type: 'value',
        name: yLeftLabel,
        nameTextStyle: { color: mutedColor, fontSize: 11 },
        axisLabel: { color: mutedColor, fontSize: 11 },
        splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
      },
    ];

    if (yRightLabel) {
      yAxes.push({
        type: 'value',
        name: yRightLabel,
        nameTextStyle: { color: mutedColor, fontSize: 11 },
        axisLabel: { color: mutedColor, fontSize: 11 },
        splitLine: { show: false },
      });
    }

    chart.setOption(
      {
        animation: false,
        tooltip: {
          trigger: 'axis',
          backgroundColor: surfaceColor,
          borderColor: gridColor,
          borderWidth: 1,
          textStyle: { color: textColor, fontSize: 12 },
          axisPointer: {
            type: 'line',
            lineStyle: { color: mutedColor, type: 'dashed' },
          },
        },
        legend: {
          top: 0,
          left: 0,
          icon: 'roundRect',
          itemWidth: 12,
          itemHeight: 4,
          textStyle: { color: textColor, fontSize: 12 },
        },
        grid: {
          left: 48,
          right: yRightLabel ? 48 : 18,
          top: 44,
          bottom: 32,
        },
        xAxis: {
          type: 'time',
          axisLabel: { color: mutedColor, fontSize: 11 },
          axisLine: { lineStyle: { color: gridColor } },
        },
        yAxis: yAxes,
        series: series.map((s) => ({
          name: s.name,
          type: 'line',
          smooth: 0.28,
          showSymbol: false,
          connectNulls: false,
          yAxisIndex: s.yAxisIndex ?? 0,
          lineStyle: { width: 2.5, color: s.color },
          itemStyle: { color: s.color },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: hexToRgba(s.color, 0.16) },
              { offset: 1, color: hexToRgba(s.color, 0.0) },
            ]),
          },
          data: s.data,
        })),
      },
      true,
    );
  }, [hasData, series, yLeftLabel, yRightLabel, themeTick]);

  return (
    <Card>
      <CardHeader title={title} description={subtitle} />
      <CardBody>
        {!hasData ? (
          <StateBox description={emptyMessage} />
        ) : (
          <div ref={elRef} className="h-[260px] w-full sm:h-[320px]" />
        )}
      </CardBody>
    </Card>
  );
}
