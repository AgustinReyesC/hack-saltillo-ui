import { useCallback, useEffect, useState } from 'react'
import type { OpenShortage, PartSummary, ReorderSuggestion, UnmatchedReceipt } from '../types'
import { inventoryService } from '../services/inventory'
import { useEvents } from '../context/EventsContext'

interface InventoryData { parts: PartSummary[]; shortages: OpenShortage[]; reorders: ReorderSuggestion[]; unmatched: UnmatchedReceipt[] }

/** Datos del panel. Solo conoce `inventoryService`: nunca sabe si son mocks o API real. */
export function useInventory() {
  const events = useEvents()
  const [data, setData] = useState<InventoryData>({ parts: [], shortages: [], reorders: [], unmatched: [] }) // todo el dataset
  const [loading, setLoading] = useState(true)               // primera carga
  const [error, setError] = useState<string | null>(null)    // mensaje {detail} de la API

  const load = useCallback(async () => {
    try {
      const [parts, shortages, reorders, unmatched] = await Promise.all([
        inventoryService.listParts(), inventoryService.listShortages(),
        inventoryService.listReorders(), inventoryService.listUnmatched()])
      setData({ parts, shortages, reorders, unmatched }); setError(null)
    } catch (e) { setError((e as Error).message) } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])                        // carga inicial
  const latest = events[0]
  useEffect(() => { if (latest?.event_type.startsWith('stock.')) load() },   // evento stock.* ⇒ refrescar
    [latest?.event_id, load]) // eslint-disable-line react-hooks/exhaustive-deps
  return { ...data, loading, error }
}
