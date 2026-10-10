import { API } from '../config'
import type { ListResponse } from '../../types'
import type { InventoryService } from './types'

/** Un solo lugar que habla HTTP. Errores del contrato: { detail } → los volvemos Error con ese texto. */
async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API.base}${path}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }))
    throw new Error(body.detail ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}
const items = async <T,>(path: string) => (await get<ListResponse<T>>(path)).items // desenvuelve {items}

/** Implementación REAL. Si prefieres axios, solo cambia `get`: nada más del proyecto se entera. */
export const httpInventoryService: InventoryService = {
  listParts: () => items('/parts'),
  getAvailability: (id) => get(`/parts/${id}/availability`),
  listShortages: () => items('/shortages'),
  listReorders: () => items('/reorder-suggestions'),
  listUnmatched: () => items('/unmatched-receipts'),
}
