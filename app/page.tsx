"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DeviceDashboard } from "@/components/device-dashboard"
import { Thermometer, Droplets, Ruler, Lightbulb } from "lucide-react"

export default function Page() {
  const [devices, setDevices] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    try {
      const response = await fetch("/api/devices")
      const data = await response.json()
      console.log("[v0] Devices fetched:", data)
      setDevices(data.devices || [])
    } catch (error) {
      console.error("[v0] Error fetching devices:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-foreground">Dashboard ESP32 Sensores</h1>
          <p className="text-muted-foreground mt-1">Monitoreo en tiempo real de sensores IoT</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Cargando dispositivos...</div>
          </div>
        ) : devices.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No hay dispositivos disponibles</CardTitle>
              <CardDescription>
                Verifica que el servidor Flask esté ejecutándose y la base de datos tenga datos.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Tabs defaultValue={devices[0]} className="w-full">
            <TabsList
              className="grid w-full max-w-md mx-auto mb-8"
              style={{ gridTemplateColumns: `repeat(${devices.length}, 1fr)` }}
            >
              {devices.map((device) => (
                <TabsTrigger key={device} value={device} className="text-sm">
                  {device}
                </TabsTrigger>
              ))}
            </TabsList>

            {devices.map((device) => (
              <TabsContent key={device} value={device}>
                <DeviceDashboard deviceId={device} />
              </TabsContent>
            ))}
          </Tabs>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
            <CardContent className="flex items-center gap-3 p-6">
              <Thermometer className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              <div>
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">Temperatura</p>
                <p className="text-xs text-orange-700 dark:text-orange-300">Sensor térmico</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardContent className="flex items-center gap-3 p-6">
              <Droplets className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Humedad</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">Sensor de humedad</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardContent className="flex items-center gap-3 p-6">
              <Ruler className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">Distancia</p>
                <p className="text-xs text-green-700 dark:text-green-300">Sensor ultrasónico</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800">
            <CardContent className="flex items-center gap-3 p-6">
              <Lightbulb className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Luz</p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">Sensor de luz</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
