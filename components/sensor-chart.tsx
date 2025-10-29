"use client"

import { useMemo, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Chart as ChartJS, LineController, LineElement, PointElement, CategoryScale, LinearScale, TimeScale, Tooltip, Legend, Filler } from "chart.js"
import 'chartjs-adapter-date-fns'

ChartJS.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, TimeScale, Tooltip, Legend, Filler)

interface SensorChartProps {
  title: string
  description: string
  data: any[] // raw API readings
  dataKey: string
  color: string
  unit: string
  limits?: { min?: number; max?: number }
}

export function SensorChart({ title, description, data, dataKey, color, unit, limits }: SensorChartProps) {
  const chartData = useMemo(() => {
    const labels: number[] = []
    const values: number[] = []
    for (const reading of data) {
      const raw = reading[dataKey]
      const ts = reading.timestamp_lectura
      if (raw == null || ts == null) continue
      const v = parseFloat(raw)
      // normalize timestamp to milliseconds since epoch
      const parseTimestampToMs = (input: any) => {
        if (input == null) return NaN
        // Date object
        if (input instanceof Date) return input.getTime()
        // numeric (ms or seconds)
        if (typeof input === 'number') {
          // if clearly seconds (e.g. 10-digit), convert to ms
          return input < 1e11 ? input * 1000 : input
        }
        // string: try ISO parse first
        if (typeof input === 'string') {
          // numeric string?
          if (/^\d+$/.test(input)) {
            const n = parseInt(input, 10)
            return n < 1e11 ? n * 1000 : n
          }
          const d = new Date(input)
          return isNaN(d.getTime()) ? NaN : d.getTime()
        }
        return NaN
      }

      const t = parseTimestampToMs(ts)
      if (isNaN(v) || isNaN(t)) continue
      labels.push(t)
      values.push(v)
    }
    return { labels, values }
  }, [data, dataKey])

  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    const thresholdsPlugin = {
      id: 'thresholds',
      afterDraw: (chart: any) => {
        if (!chart.options.plugins || !chart.options.plugins.thresholds) return
        const ctx = chart.ctx
        const yScale = chart.scales['y']
        const { thresholds } = chart.options.plugins.thresholds
        thresholds.forEach((t: any) => {
          if (t.value == null) return
          const y = yScale.getPixelForValue(t.value)
          ctx.save()
          ctx.beginPath()
          ctx.moveTo(chart.chartArea.left, y)
          ctx.lineTo(chart.chartArea.right, y)
          ctx.lineWidth = t.width || 1
          ctx.strokeStyle = t.color || 'rgba(255,0,0,0.6)'
          if (t.dash) ctx.setLineDash(t.dash)
          ctx.stroke()
          ctx.restore()
        })
      },
    }

    const config: any = {
      type: 'line',
      data: {
        datasets: [
          {
            label: title,
            data: chartData.values.map((v, i) => ({ x: chartData.labels[i], y: v })),
            borderColor: color,
            backgroundColor: color,
            tension: 0.2,
            fill: false,
            pointRadius: 3,
            pointBackgroundColor: chartData.values.map((v) => (limits && ((limits.max !== undefined && v > limits.max) || (limits.min !== undefined && v < limits.min)) ? '#ef4444' : color)),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'nearest', intersect: false },
        scales: {
          x: { type: 'time', time: { unit: 'minute', displayFormats: { minute: 'HH:mm' } }, ticks: { color: 'hsl(var(--muted-foreground))' } },
          y: { ticks: { color: 'hsl(var(--muted-foreground))' } },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context: any) {
                const v = context.parsed.y
                return `${v.toFixed(1)} ${unit}`
              },
            },
          },
          legend: { display: false },
          thresholds: {
            thresholds: [
              { value: limits?.max, color: 'rgba(239,68,68,0.7)', width: 2, dash: [6, 4] },
              { value: limits?.min, color: 'rgba(245,158,11,0.7)', width: 2, dash: [4, 4] },
            ],
          },
        },
      },
      plugins: [thresholdsPlugin],
    }

    const chart = new ChartJS(ctx, config)
    return () => chart.destroy()
  }, [chartData, color, unit, limits, title])

  if (!chartData || chartData.values.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Esperando datos válidos...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <div style={{ height: 300 }}>
          <canvas ref={canvasRef} />
        </div>
      </CardContent>
    </Card>
  )
}
