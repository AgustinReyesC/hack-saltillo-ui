import type { OpenShortage, ReorderSuggestion } from '../types'

/**
 * Orden que motiva la compra. `code` null = la orden ya no tiene faltante abierto de la pieza (p. ej. se dio de baja).
 * `missing` = lo que le falta de ESA pieza; null = sin cantidad definida o sin faltante abierto.
 */
export interface ReorderOrder { work_order_id: number; code: string | null; missing: number | null }
export interface ReorderJustification { summary: string; orders: ReorderOrder[] }

const ordenes = (n: number) => `${n} ${n === 1 ? 'orden' : 'órdenes'}`
export const orderLabel = (o: ReorderOrder) => (o.code === null ? `#${o.work_order_id} (sin faltante abierto)` : `${o.code} (${o.missing ?? '?'})`)

/**
 * La sugerencia (GET /reorder-suggestions y evento stock.reorder_suggested) solo trae `work_order_ids`.
 * La justificación se arma cruzándolos con los faltantes abiertos de la misma pieza (GET /shortages):
 * código de cada orden + cuánto le falta. Regla de la API: sugerido = max(faltante, política de reabasto),
 * así que lo que sobre del faltante viene de la política. Sin órdenes ⇒ la causa es la existencia bajo el mínimo.
 */
export function reorderJustification(r: ReorderSuggestion, shortages: OpenShortage[]): ReorderJustification {
  if (!r.work_order_ids.length) return { summary: 'Existencia por debajo del mínimo de reabasto', orders: [] }
  const orders = r.work_order_ids.map((id): ReorderOrder => {
    const own = shortages.filter((s) => s.work_order_id === id && s.part_id === r.part_id)
    const known = own.flatMap((s) => (s.missing_quantity === null ? [] : [s.missing_quantity]))
    return { work_order_id: id, code: own[0]?.work_order_code ?? null, missing: known.length ? known.reduce((a, q) => a + q, 0) : null }
  })
  const missing = orders.reduce((a, o) => a + (o.missing ?? 0), 0)
  const undefinedQty = orders.filter((o) => o.code !== null && o.missing === null).length
  const n = ordenes(orders.length)

  if (orders.every((o) => o.missing !== null)) {
    const extra = r.suggested_quantity - missing
    return { summary: `Faltan ${missing} en ${n}${extra > 0 ? ` · +${extra} por política de reabasto` : ''}`, orders }
  }
  // Con cantidades sin definir solo se sabe un mínimo de lo que falta
  const base = missing > 0 ? `Faltan al menos ${missing} en ${n}` : `Faltantes en ${n}`
  return { summary: `${base}${undefinedQty ? ` · ${undefinedQty} sin cantidad definida` : ''}`, orders }
}
