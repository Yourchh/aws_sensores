import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ deviceId: string }> }) {
  try {
    const { deviceId } = await params
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const result = await query(
      `SELECT device_id, temperatura, humedad, distancia_cm, luz_porcentaje, estado_luz, timestamp_lectura
       FROM lecturas_sensores
       WHERE device_id = $1
       ORDER BY timestamp_lectura DESC
       LIMIT $2`,
      [deviceId, limit],
    )

    // Reverse to show oldest first for charts
    const readings = result.rows.reverse()

    return NextResponse.json({ readings })
  } catch (error) {
    console.error("[v0] Error fetching history:", error)
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 })
  }
}
