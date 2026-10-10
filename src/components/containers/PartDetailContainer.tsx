import { useEffect, useState } from 'react'
import type { Availability, PartSummary } from '../../types'
import { inventoryService } from '../../services/inventory'
import { PartDetailPanel } from '../presentational/PartDetailPanel'

/** Pide GET /parts/{id}/availability cada vez que cambia la pieza elegida. */
export function PartDetailContainer({ part, onClose }: { part: PartSummary; onClose: () => void }) {
  const [availability, setAvailability] = useState<Availability | null>(null) // respuesta del servicio
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false                       // evita pintar una respuesta vieja si el usuario ya cambió de pieza
    setLoading(true); setAvailability(null); setError(null)
    inventoryService.getAvailability(part.part_id)
      .then((a) => !cancelled && setAvailability(a))
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [part.part_id])
  return <PartDetailPanel part={part} availability={availability} loading={loading} error={error} onClose={onClose} />
}
