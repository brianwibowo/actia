import { useEffect, useRef, useState } from 'react'
import * as echarts from 'echarts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export interface ChartSeries {
  name: string
  data: Array<[string, number | null]>
  color: string
  yAxisIndex?: number
}

interface TimeSeriesChartProps {
  title: string
  subtitle?: string
  yLeftLabel: string
  yRightLabel?: string
  series: ChartSeries[]
  emptyMessage: string
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return `rgba(16, 185, 129, ${alpha})`
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function TimeSeriesChart({
  title,
  subtitle,
  yLeftLabel,
  yRightLabel,
  series,
  emptyMessage,
}: TimeSeriesChartProps) {
  const elRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)
  const [themeTick, setThemeTick] = useState(0)

  const hasData = series.some((s) => s.data.some((pt) => pt[1] !== null))

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setThemeTick((n) => n + 1)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!elRef.current || !hasData) return

    const chart = echarts.init(elRef.current)
    chartRef.current = chart

    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(elRef.current)

    return () => {
      ro.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [hasData])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart || !hasData) return

    const isDark = document.documentElement.classList.contains('dark')
    const textColor = isDark ? '#f8fafc' : '#0f172a'
    const mutedColor = isDark ? '#94a3b8' : '#64748b'
    const gridColor = isDark ? '#1e293b' : '#e2e8f0'
    const surfaceColor = isDark ? '#0f172a' : '#ffffff'

    const yAxes: echarts.YAXisComponentOption[] = [
      {
        type: 'value',
        name: yLeftLabel,
        nameTextStyle: { color: mutedColor, fontSize: 11 },
        axisLabel: { color: mutedColor, fontSize: 11 },
        splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
      },
    ]

    if (yRightLabel) {
      yAxes.push({
        type: 'value',
        name: yRightLabel,
        nameTextStyle: { color: mutedColor, fontSize: 11 },
        axisLabel: { color: mutedColor, fontSize: 11 },
        splitLine: { show: false },
      })
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
      true
    )
  }, [hasData, series, yLeftLabel, yRightLabel, themeTick])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>
            {emptyMessage}
          </div>
        ) : (
          <div ref={elRef} className='h-[260px] w-full sm:h-[320px]' />
        )}
      </CardContent>
    </Card>
  )
}
