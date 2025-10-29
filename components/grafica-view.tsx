"use client"

import { useEffect, useState, useMemo } from "react"
import { SensorChart } from "@/components/sensor-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Reading {
  timestamp_lectura: string
  temperatura?: string
  humedad?: string
  consumo_w?: string
  luz_porcentaje?: string
  estado_luz?: string
  distancia_cm?: string
}
export default function GraficaView({ deviceId, initialHistory }: { deviceId: string; initialHistory?: Reading[] }) {
  const [history, setHistory] = useState<Reading[]>(initialHistory || [])
  const [loading, setLoading] = useState(!initialHistory)
  const [error, setError] = useState<string | null>(null)
  const [limit, setLimit] = useState<number>(200)
  const [visible, setVisible] = useState({ temp: true, hum: true, cons: true, luz: true, dist: true })

  useEffect(() => {
    if (initialHistory) return // already have data from server
    let mounted = true
    setLoading(true)
    setError(null)

    fetch(`/api/history/${deviceId}?limit=${limit}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((json) => {
        if (!mounted) return
        setHistory(json.readings || [])
      })
      .catch((e) => {
        console.error("Error fetching history for grafica", e)
        if (mounted) setError(String(e))
      })
      .finally(() => mounted && setLoading(false))

    return () => { mounted = false }
  }, [deviceId, limit, initialHistory])

  // Simple consumo simulation: derive consumo_w when missing using other sensors.
  const simulateConsumption = (r: Reading) => {
    // base consumption in W
    const base = 5
    const temp = r.temperatura ? parseFloat(String(r.temperatura)) : NaN
    const luz = r.luz_porcentaje ? parseFloat(String(r.luz_porcentaje)) : NaN
    const distancia = r.distancia_cm ? parseFloat(String(r.distancia_cm)) : NaN

    // luz contributes up to +50W proportionally
    const luzFactor = !isNaN(luz) ? (luz / 100) * 50 : 0
    // temperature increases consumption slightly above 22°C
    const tempFactor = !isNaN(temp) && temp > 22 ? (temp - 22) * 0.8 : 0
    // proximity devices may draw slightly more when object is near (inverse of distance)
    const distFactor = !isNaN(distancia) ? Math.max(0, (400 - distancia) / 400) * 10 : 0

    const simulated = base + luzFactor + tempFactor + distFactor
    return Number(simulated.toFixed(1))
  }

  // Ensure consumo_w exists for consumption chart and compute simple stats + alerts
  const historyWithConsumo: Reading[] = useMemo(() => {
    return history.map((r) => {
      if (r.consumo_w != null && String(r.consumo_w).trim() !== "") return r
      const derived = simulateConsumption(r)
      return { ...r, consumo_w: String(derived) }
    })
  }, [history])

  const consumoStats = useMemo(() => {
    const vals = historyWithConsumo.map((r) => {
      const v = r.consumo_w != null ? parseFloat(String(r.consumo_w)) : NaN
      return isNaN(v) ? 0 : v
    })
    if (vals.length === 0) return { mean: 0, last: 0, std: 0 }
    const last = vals[vals.length - 1]
    const mean = vals.reduce((s, x) => s + x, 0) / vals.length
    const variance = vals.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / vals.length
    const std = Math.sqrt(variance)
    return { mean, last, std }
  }, [historyWithConsumo])

  // Alert rules
  const consumoAlert = useMemo(() => {
    const { mean, last, std } = consumoStats
    // Absolute threshold (fallback)
    const ABS_MAX = 500 // Watts
    // Relative spike threshold: last > mean + 2*std or last > mean * 1.5
    const isSpike = mean > 0 ? (last > mean + 2 * std || last > mean * 1.5) : last > ABS_MAX
    const isAboveAbs = last > ABS_MAX
    const unstable = std / (mean || 1) > 0.25 // coefficient of variation > 25%
    return { isSpike, isAboveAbs, unstable }
  }, [consumoStats])

  if (loading) return <div className="p-6">Cargando histórico...</div>
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>

  const toggle = (k: keyof typeof visible) => setVisible((v) => ({ ...v, [k]: !v[k] }))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Gráficas para {deviceId}</CardTitle>
          <div className="flex items-center gap-3">
            <label className="text-sm">Rango:</label>
            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="border rounded px-2 py-1">
              <option value={50}>Últimos 50</option>
              <option value={100}>Últimos 100</option>
              <option value={200}>Últimos 200</option>
              <option value={500}>Últimos 500</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Últimas {history.length} lecturas</p>
          <div className="flex gap-3 mt-3">
            <label><input type="checkbox" checked={visible.temp} onChange={() => toggle('temp')} /> Temperatura</label>
            <label><input type="checkbox" checked={visible.hum} onChange={() => toggle('hum')} /> Humedad</label>
            <label><input type="checkbox" checked={visible.cons} onChange={() => toggle('cons')} /> Consumo</label>
            <label><input type="checkbox" checked={visible.luz} onChange={() => toggle('luz')} /> Luz</label>
            <label><input type="checkbox" checked={visible.dist} onChange={() => toggle('dist')} /> Distancia</label>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {visible.temp && (
          <SensorChart
            title="Temperatura"
            description="Historial de temperatura (°C)"
            data={history}
            dataKey="temperatura"
            color="rgb(255,99,132)"
            unit="°C"
            limits={{ min: -10, max: 40 }}
          />
        )}

        {visible.hum && (
          <SensorChart
            title="Humedad"
            description="Historial de humedad (%)"
            data={history}
            dataKey="humedad"
            color="rgb(54,162,235)"
            unit="%"
            limits={{ min: 10, max: 85 }}
          />
        )}

        {visible.cons && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Consumo energético</h3>
              {(consumoAlert.isSpike || consumoAlert.isAboveAbs || consumoAlert.unstable) && (
                <span className="text-sm text-red-600 font-semibold">
                  {consumoAlert.isAboveAbs ? 'Consumo por encima del umbral absoluto' : consumoAlert.isSpike ? 'Pico de consumo detectado' : consumoAlert.unstable ? 'Consumo inestable' : ''}
                </span>
              )}
            </div>
            <SensorChart
              title="Consumo energético"
              description="Historial de consumo (W)"
              data={historyWithConsumo}
              dataKey="consumo_w"
              color="rgb(255,205,86)"
              unit="W"
              limits={{ min: 0, max: Math.max(500, Math.round(consumoStats.mean * 2)) }}
            />
          </div>
        )}

        {visible.luz && (
          <SensorChart
            title="Luminosidad"
            description="Historial de luz (%)"
            data={history}
            dataKey="luz_porcentaje"
            color="rgb(153,102,255)"
            unit="%"
            limits={{ min: 0, max: 100 }}
          />
        )}

        {visible.dist && (
          <SensorChart
            title="Distancia"
            description="Historial de distancia (cm)"
            data={history}
            dataKey="distancia_cm"
            color="rgb(34,197,94)"
            unit="cm"
            limits={{ min: 0, max: 400 }}
          />
        )}
      </div>
    </div>
  )
}
