import { useEffect, useState } from 'react'
import type { LedgerEntry } from '../../types'
import { inventoryService } from '../../services/inventory'
import { useWarehouse } from '../../context/WarehouseContext'
import { KardexModal } from '../presentational/KardexModal'

/** Pide GET /parts/{id}/ledger al abrirse. Recibe solo lo mínimo de la pieza (sirve para filas de cualquier tabla). */
export function KardexContainer({ part, onClose }: { part: { part_id: number; sku: string; name: string }; onClose: () => void }) {
  const { locations } = useWarehouse()
  const [entries, setEntries] = useState<LedgerEntry[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false; setLoading(true)
    inventoryService.getLedger(part.part_id).then((l) => { if (!cancelled) setEntries(l.entries) })
      .catch((e: Error) => { if (!cancelled) setError(e.message) }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [part.part_id])
  const codeOf = (id: number) => locations.find((l) => l.location_id === id)?.code ?? `#${id}`
  return <KardexModal title={part.name} subtitle={part.sku} entries={entries} codeOf={codeOf} loading={loading} error={error} onClose={onClose} />
}
