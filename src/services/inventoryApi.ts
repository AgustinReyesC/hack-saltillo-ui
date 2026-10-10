import { API } from './config'
import type { InventoryItem } from '../types'

/** ⚠ El contrato del README NO trae un "listar piezas"; se asume GET /parts (pídelo o ajústalo). */
export async function fetchParts(): Promise<InventoryItem[]> {
  const res = await fetch(`${API.inventory}/parts`)
  if (!res.ok) throw new Error(`Error ${res.status} en /parts`)
  return res.json()
}
