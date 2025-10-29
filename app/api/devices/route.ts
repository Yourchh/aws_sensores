import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const result = await query("SELECT DISTINCT device_id FROM lecturas_sensores ORDER BY device_id")

    const devices = result.rows.map((row) => row.device_id)

    return NextResponse.json({ devices })
  } catch (error) {
    console.error("[v0] Error fetching devices:", error)
    return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 })
  }
}
