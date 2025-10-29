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
    const raw = result.rows.reverse()

    // Normalize timestamp_lectura to ISO 8601 strings (ms precision) so frontend always receives consistent x values
    const parseTimestampToMs = (input: any) => {
      if (input == null) return NaN
      if (input instanceof Date) return input.getTime()
      if (typeof input === 'number') return input < 1e11 ? input * 1000 : input
      if (typeof input === 'string') {
        if (/^\d+$/.test(input)) {
          const n = parseInt(input, 10)
          return n < 1e11 ? n * 1000 : n
        }
        const d = new Date(input)
        return isNaN(d.getTime()) ? NaN : d.getTime()
      }
      return NaN
    }

    // Accept timestamps within a reasonable window only
    const minAllowed = new Date('2000-01-01').getTime()
    const maxAllowed = Date.now() + 24 * 60 * 60 * 1000 // allow one day of clock skew

    const processed = raw.map((r: any) => {
      const ts = parseTimestampToMs(r.timestamp_lectura)
      return { ...r, __parsed_ts: ts }
    })

    const readings = processed
      .filter((r: any) => {
        const t = r.__parsed_ts
        return !isNaN(t) && t >= minAllowed && t <= maxAllowed
      })
      .map((r: any) => ({ ...r, timestamp_lectura: new Date(r.__parsed_ts).toISOString() }))

    const filteredOut = processed.length - readings.length
    if (filteredOut > 0) {
      // Log a small sample for diagnosis
      const sample = processed.filter((r: any) => isNaN(r.__parsed_ts) || r.__parsed_ts < minAllowed || r.__parsed_ts > maxAllowed).slice(0, 5)
      console.warn(`[v0] Filtered out ${filteredOut} readings with invalid timestamps for device ${deviceId}`, sample)
    }

    return NextResponse.json({ readings })
  } catch (error) {
    console.error("[v0] Error fetching history:", error)
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 })
  }
}
