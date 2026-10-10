import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Location, OpenShortage, PartSummary, ReorderSuggestion, UnmatchedReceipt } from '../types'
import { inventoryService } from '../services/inventory'
import { useEvents } from './EventsContext'

/**
 * Datos BARATOS que varias pantallas comparten (campana, dashboard, resolución, piso): se piden UNA vez aquí.
 * Cada vista sigue manejando su propio estado de UI; esto solo evita pedir lo mismo 4 veces.
 */
interface Warehouse {
  parts: PartSummary[]; locations: Location[]; shortages: OpenShortage[]; reorders: ReorderSuggestion[]; unmatched: UnmatchedReceipt[]
  loading: boolean; error: string | null; reload: () => Promise<void>
}
const Ctx = createContext<Warehouse | null>(null)

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const events = useEvents()
  const [data, setData] = useState({ parts: [] as PartSummary[], locations: [] as Location[], shortages: [] as OpenShortage[], reorders: [] as ReorderSuggestion[], unmatched: [] as UnmatchedReceipt[] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const reload = useCallback(async () => {
    try {
      const [parts, locations, shortages, reorders, unmatched] = await Promise.all([inventoryService.listParts(), inventoryService.listLocations(),
        inventoryService.listShortages(), inventoryService.listReorders(), inventoryService.listUnmatched()])
      setData({ parts, locations, shortages, reorders, unmatched }); setError(null)
    } catch (e) { setError((e as Error).message) } finally { setLoading(false) }
  }, [])
  useEffect(() => { reload() }, [reload])
  const latest = events[0] // un evento stock.* nuevo ⇒ recargar: así los faltantes "se resuelven solos"
  useEffect(() => { if (latest?.event_type.startsWith('stock.')) reload() }, [latest?.event_id, reload]) // eslint-disable-line react-hooks/exhaustive-deps
  const value = useMemo(() => ({ ...data, loading, error, reload }), [data, loading, error, reload])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export function useWarehouse() {
  const v = useContext(Ctx); if (!v) throw new Error('useWarehouse va dentro de <WarehouseProvider>'); return v
}
