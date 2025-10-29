"use client"

import GraficaView from "@/components/grafica-view"
import { useParams } from "next/navigation"

export default function Page() {
  const params = useParams() as { deviceId?: string }
  const deviceId = params?.deviceId

  if (!deviceId) return <div className="p-6">Device no especificado</div>

  return (
    <main className="container mx-auto px-4 py-8">
      <GraficaView deviceId={deviceId} />
    </main>
  )
}
