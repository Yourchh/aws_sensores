"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SensorChart } from "@/components/sensor-chart"
import { MetricCard } from "@/components/metric-card"
import { Thermometer, Droplets, Ruler, Lightbulb, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface SensorReading {
  device_id: string
  temperatura: number
  humedad: number
  distancia_cm: number
  luz_porcentaje: number
  estado_luz: string
  timestamp_lectura: string
}

interface DeviceStats {
  avg_temp: number
  min_temp: number
  max_temp: number
  avg_humidity: number
  min_humidity: number
  max_humidity: number
  avg_distance: number
  min_distance: number
  max_distance: number
  total_readings: number
}

interface DeviceDashboardProps {
  deviceId: string
}

export function DeviceDashboard({ deviceId }: DeviceDashboardProps) {
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null)
  const [history, setHistory] = useState<SensorReading[]>([])
  const [stats, setStats] = useState<DeviceStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [deviceId])

  const fetchData = async () => {
    try {
      const [latestRes, historyRes, statsRes] = await Promise.all([
        fetch(`/api/latest/${deviceId}`),
        fetch(`/api/history/${deviceId}`),
        fetch(`/api/stats/${deviceId}`),
      ])

      const latestData = await latestRes.json()
      const historyData = await historyRes.json()
      const statsData = await statsRes.json()

      console.log("[v0] Data fetched for device:", deviceId, { latestData, historyData, statsData })

      setLatestReading(latestData)
      setHistory(historyData.readings || [])
      setStats(statsData)
    } catch (error) {
      console.error("[v0] Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTrend = (current: number, avg: number) => {
    const diff = ((current - avg) / avg) * 100
    if (Math.abs(diff) < 2) return { icon: Minus, color: "text-muted-foreground", text: "Estable" }
    if (diff > 0) return { icon: TrendingUp, color: "text-green-600", text: `+${diff.toFixed(1)}%` }
    return { icon: TrendingDown, color: "text-red-600", text: `${diff.toFixed(1)}%` }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando datos del dispositivo...</div>
      </div>
    )
  }

  if (!latestReading || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No hay datos disponibles</CardTitle>
          <CardDescription>No se encontraron lecturas para este dispositivo.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const tempTrend = getTrend(latestReading.temperatura, stats.avg_temp)
  const humidityTrend = getTrend(latestReading.humedad, stats.avg_humidity)
  const distanceTrend = getTrend(latestReading.distancia_cm, stats.avg_distance)

  return (
    <div className="space-y-6">
      {/* Current Readings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Temperatura"
          value={`${latestReading.temperatura.toFixed(1)}°C`}
          icon={Thermometer}
          trend={tempTrend}
          subtitle={`Promedio: ${stats.avg_temp.toFixed(1)}°C`}
          color="orange"
        />
        <MetricCard
          title="Humedad"
          value={`${latestReading.humedad.toFixed(1)}%`}
          icon={Droplets}
          trend={humidityTrend}
          subtitle={`Promedio: ${stats.avg_humidity.toFixed(1)}%`}
          color="blue"
        />
        <MetricCard
          title="Distancia"
          value={`${latestReading.distancia_cm.toFixed(1)} cm`}
          icon={Ruler}
          trend={distanceTrend}
          subtitle={`Promedio: ${stats.avg_distance.toFixed(1)} cm`}
          color="green"
        />
        <MetricCard
          title="Estado de Luz"
          value={latestReading.estado_luz || "Apagada"}
          icon={Lightbulb}
          subtitle={`${latestReading.luz_porcentaje}%`}
          color="yellow"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SensorChart
          title="Temperatura"
          description="Historial de temperatura en °C"
          data={history}
          dataKey="temperatura"
          color="hsl(var(--chart-1))"
          unit="°C"
        />
        <SensorChart
          title="Humedad"
          description="Historial de humedad relativa"
          data={history}
          dataKey="humedad"
          color="hsl(var(--chart-2))"
          unit="%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SensorChart
          title="Distancia"
          description="Historial de mediciones de distancia"
          data={history}
          dataKey="distancia_cm"
          color="hsl(var(--chart-3))"
          unit="cm"
        />
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas del Dispositivo</CardTitle>
            <CardDescription>Resumen de todas las lecturas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total de Lecturas</p>
                <p className="text-2xl font-bold">{stats.total_readings}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Última Actualización</p>
                <p className="text-sm">{new Date(latestReading.timestamp_lectura).toLocaleString("es-MX")}</p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div>
                <p className="text-sm font-medium mb-2">Rango de Temperatura</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mín: {stats.min_temp.toFixed(1)}°C</span>
                  <span className="text-muted-foreground">Máx: {stats.max_temp.toFixed(1)}°C</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Rango de Humedad</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mín: {stats.min_humidity.toFixed(1)}%</span>
                  <span className="text-muted-foreground">Máx: {stats.max_humidity.toFixed(1)}%</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Rango de Distancia</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mín: {stats.min_distance.toFixed(1)} cm</span>
                  <span className="text-muted-foreground">Máx: {stats.max_distance.toFixed(1)} cm</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
