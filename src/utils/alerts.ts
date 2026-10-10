import type { AppAlert, OpenShortage, UnmatchedReceipt } from '../types'
import { fmtDate } from './text'

/**
 * Las alertas NO se guardan: se CALCULAN del estado actual del servidor.
 * Cuando llega material (evento) el faltante deja de venir en GET /shortages y la alerta desaparece sola;
 * lo mismo con una recepción ya resuelta. Por eso no existe (ni debe existir) botón de descartar.
 */
export function buildAlerts(shortages: OpenShortage[], unmatched: UnmatchedReceipt[]): AppAlert[] {
  const a: AppAlert[] = shortages.map((s) => ({
    id: `sh-${s.work_order_id}-${s.inspection_item_id}`, kind: 'shortage', level: 'warning',
    title: `Faltante · ${s.work_order_code}`, detail: `${s.name}: faltan ${s.missing_quantity ?? '?'}`, at: s.opened_at,
    fields: [['Orden', s.work_order_code], ['Pieza', s.name], ['Cantidad faltante', String(s.missing_quantity ?? 'sin definir')], ['Abierto desde', fmtDate(s.opened_at)]],
    to: `/ordenes/${s.work_order_code}`, actionLabel: 'Ver orden de trabajo',
  }))
  const b: AppAlert[] = unmatched.map((r) => ({
    id: `um-${r.id}`, kind: 'unmatched', level: 'info',
    title: 'Recepción sin relacionar', detail: `${r.part_number} · ${r.quantity} pzas`, at: new Date().toISOString(),
    fields: [['N° de parte recibido', r.part_number], ['Descripción', r.description || '—'], ['Cantidad', String(r.quantity)], ['Precio unitario', r.unit_price], ['Línea de compra', String(r.purchase_line_id)]],
    to: '/resolucion', actionLabel: 'Ir a resolución',
  }))
  return [...a, ...b]
}
