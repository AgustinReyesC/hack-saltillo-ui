import { API } from '../config'
import type { Availability, ListResponse, PartSummary } from '../../types'
import { toStockRows } from '../../utils/stock'
import type { InventoryService } from './types'

/** Un solo lugar habla HTTP. Errores del contrato { detail } → Error con ese texto (la UI lo muestra tal cual). */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API.base}${path}`, init)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `HTTP ${res.status}`) // 404 / 409 / 422 llegan con su {detail}
  }
  return res.json() as Promise<T>
}
const get = <T,>(p: string) => request<T>(p)
const post = <T,>(p: string, body: unknown) =>
  request<T>(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
const items = async <T,>(p: string) => (await get<ListResponse<T>>(p)).items

export const httpInventoryService: InventoryService = {
  listParts: () => items('/parts'),
  findPartBySku: async (sku) => (await items<PartSummary>(`/parts?sku=${encodeURIComponent(sku)}`))[0] ?? null,
  getAvailability: (id) => get(`/parts/${id}/availability`),
  getLedger: (id) => get(`/parts/${id}/ledger`),
  listLocations: () => items('/locations'),
  // El contrato no trae "todas las existencias por ubicación": se arma con availability por pieza (N+1).
  // Si es lento, pedir la ruta de extensión GET /stock-balances y reemplazar SOLO esta función.
  async listStock() {
    const parts = (await items<PartSummary>('/parts')).filter((p) => p.on_hand > 0)
    const av = await Promise.all(parts.map((p) => get<Availability>(`/parts/${p.part_id}/availability`)))
    return av.flatMap((a, i) => toStockRows(parts[i], a))
  },
  listShortages: () => items('/shortages'),
  listReorders: () => items('/reorder-suggestions'),
  listUnmatched: () => items('/unmatched-receipts'),
  getWorkOrderMaterials: (code) => get(`/work-orders/${encodeURIComponent(code)}/materials`),
  issue: (r) => post('/issues', r),
  transfer: (r) => post('/transfers', r),
  count: (r) => post('/counts', r),
  resolveReceipt: (id, r) => post(`/unmatched-receipts/${id}/resolve`, r),
}
