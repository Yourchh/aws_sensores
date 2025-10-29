import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    // Use DISTINCT ON to get the latest row per device_id (Postgres)
    const sql = `
      SELECT DISTINCT ON (device_id)
        device_id,
        temperatura,
        humedad,
        distancia_cm,
        luz_porcentaje,
        estado_luz,
        consumo_w,
        timestamp_lectura
      FROM lecturas_sensores
      ORDER BY device_id, timestamp_lectura DESC
    `

    const res = await query(sql)
    const rows = res.rows.map((r: any) => ({
      device_id: r.device_id,
      temperatura: r.temperatura != null ? String(r.temperatura) : undefined,
      humedad: r.humedad != null ? String(r.humedad) : undefined,
      distancia_cm: r.distancia_cm != null ? String(r.distancia_cm) : undefined,
      luz_porcentaje: r.luz_porcentaje != null ? String(r.luz_porcentaje) : undefined,
      estado_luz: r.estado_luz != null ? String(r.estado_luz) : undefined,
      consumo_w: r.consumo_w != null ? String(r.consumo_w) : undefined,
      timestamp_lectura: r.timestamp_lectura ? new Date(r.timestamp_lectura).toISOString() : null,
    }))

    return NextResponse.json({ devices: rows })
  } catch (err) {
    console.error('Error in /api/latest_all', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
