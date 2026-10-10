import { useCallback, useEffect, useState } from 'react'
import type { StockRow } from '../types'
import { inventoryService } from '../services/inventory'
import { useEvents } from '../context/EventsContext'
/** Existencias por pieza y ubicación (más pesado ⇒ solo lo usa el dashboard). Se refresca con eventos stock.* */
export function useStock() {
  const events = useEvents()
  const [rows, setRows] = useState<StockRow[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null)
  const load = useCallback(async () => {
    try { setRows(await inventoryService.listStock()); setError(null) } catch (e) { setError((e as Error).message) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])
  const latest = events[0]
  useEffect(() => { if (latest?.event_type.startsWith('stock.')) load() }, [latest?.event_id, load]) // eslint-disable-line react-hooks/exhaustive-deps
  return { rows, loading, error }
}
