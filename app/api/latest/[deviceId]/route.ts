import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ deviceId: string }> }) {
  try {
    const { deviceId } = await params

    const result = await query(
      `SELECT device_id, temperatura, humedad, distancia_cm, luz_porcentaje, estado_luz, timestamp_lectura
       FROM lecturas_sensores
       WHERE device_id = $1
       ORDER BY timestamp_lectura DESC
       LIMIT 1`,
      [deviceId],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "No readings found for this device" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("[v0] Error fetching latest reading:", error)
    return NextResponse.json({ error: "Failed to fetch latest reading" }, { status: 500 })
  }
}
