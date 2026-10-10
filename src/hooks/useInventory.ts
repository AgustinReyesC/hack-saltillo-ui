import { useCallback, useEffect, useState } from 'react'
import type { InventoryItem } from '../types'
import { fetchParts } from '../services/inventoryApi'
import { USE_MOCKS } from '../services/config'
import { mockInventory } from '../mocks/inventoryMock'
import { useEvents } from '../context/EventsContext'

/** Lógica de datos del inventario (solo "Read"). Con mocks no toca la red. */
export function useInventory() {
  const events = useEvents()
  const [items, setItems] = useState<InventoryItem[]>(USE_MOCKS ? mockInventory : []) // filas de la tabla
  const [loading, setLoading] = useState(!USE_MOCKS)                                  // ¿cargando?
  const [error, setError] = useState<string | null>(null)                             // error de red

  const load = useCallback(async () => {
    if (USE_MOCKS) return
    try { setItems(await fetchParts()); setError(null) }
    catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])                    // carga inicial

  const latest = events[0]
  useEffect(() => {                                      // un evento stock.* ⇒ recargar tabla
    if (latest?.event_type.startsWith('stock.')) load()
  }, [latest?.event_id, load]) // eslint-disable-line react-hooks/exhaustive-deps

  return { items, loading, error }
}
