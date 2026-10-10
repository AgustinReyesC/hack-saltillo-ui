import { useEffect, useState } from 'react'
import type { WorkOrderMaterials } from '../types'
import { inventoryService } from '../services/inventory'
import { useEvents } from '../context/EventsContext'
/** Materiales de una orden. `code` viene de la URL (/ordenes/:code); sin código no pide nada. Se refresca con eventos. */
export function useWorkOrder(code?: string) {
  const latestId = useEvents()[0]?.event_id
  const [data, setData] = useState<WorkOrderMaterials | null>(null); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!code) { setData(null); setError(null); return }
    let cancelled = false; setLoading(true)
    inventoryService.getWorkOrderMaterials(code).then((d) => { if (!cancelled) { setData(d); setError(null) } })
      .catch((e: Error) => { if (!cancelled) { setData(null); setError(e.message) } }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [code, latestId])
  return { data, loading, error }
}
