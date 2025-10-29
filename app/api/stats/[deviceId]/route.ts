import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ deviceId: string }> }) {
  try {
    const { deviceId } = await params

    const result = await query(
      `SELECT 
         AVG(temperatura) as avg_temp,
         MIN(temperatura) as min_temp,
         MAX(temperatura) as max_temp,
         AVG(humedad) as avg_humidity,
         MIN(humedad) as min_humidity,
         MAX(humedad) as max_humidity,
         AVG(distancia_cm) as avg_distance,
         MIN(distancia_cm) as min_distance,
         MAX(distancia_cm) as max_distance,
         COUNT(*) as total_readings
       FROM lecturas_sensores
       WHERE device_id = $1`,
      [deviceId],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "No statistics found for this device" }, { status: 404 })
    }

    // Convert string values to numbers
    const stats = {
      avg_temp: Number.parseFloat(result.rows[0].avg_temp),
      min_temp: Number.parseFloat(result.rows[0].min_temp),
      max_temp: Number.parseFloat(result.rows[0].max_temp),
      avg_humidity: Number.parseFloat(result.rows[0].avg_humidity),
      min_humidity: Number.parseFloat(result.rows[0].min_humidity),
      max_humidity: Number.parseFloat(result.rows[0].max_humidity),
      avg_distance: Number.parseFloat(result.rows[0].avg_distance),
      min_distance: Number.parseFloat(result.rows[0].min_distance),
      max_distance: Number.parseFloat(result.rows[0].max_distance),
      total_readings: Number.parseInt(result.rows[0].total_readings),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("[v0] Error fetching stats:", error)
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
  }
}
