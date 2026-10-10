import { API, USE_MOCKS } from '../config'
import type { EventEnvelope, ListResponse } from '../../types'

export type Unsubscribe = () => void
/** Contrato: "avísame cuando llegue un evento". Devuelve una función para dejar de escuchar. */
export interface EventsService { subscribe(onEvent: (e: EventEnvelope) => void): Unsubscribe }

/** Evento falso con la forma real (§5): source "inventory", UUID, fecha ISO con Z. */
const ev = (n: number, event_type: string, key: string, data: Record<string, unknown>, minsAgo: number): EventEnvelope => ({
  event_id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`, event_type, event_version: 1, source: 'inventory', key, data,
  occurred_at: new Date(Date.now() - minsAgo * 60_000).toISOString().replace(/\.\d+Z$/, 'Z'),
})
const seed = [
  ev(1, 'stock.shortage_detected', 'R061026012', { work_order_id: 12, part_id: 305, name: 'Rodamiento 7205 B', missing_quantity: 3, inspection_item_id: 901 }, 3),
  ev(2, 'stock.reorder_suggested', 'part:305', { part_id: 305, suggested_quantity: 10, work_order_ids: [12] }, 6),
  ev(3, 'stock.received', 'part:301', { part_id: 301, location_id: 100, quantity: 20, unit_cost: '185.00', currency: 'MXN', purchase_line_id: 5501 }, 20),
  ev(4, 'stock.unmatched_receipt', 'purchase_line:5507', { purchase_line_id: 5507, part_number: 'ROD 7205', description: 'Rodamiento 7205 genérico', quantity: 6 }, 35),
]

/** MOCK: entrega los eventos semilla y luego uno nuevo cada 20 s. */
const mockEvents: EventsService = {
  subscribe(onEvent) {
    seed.forEach(onEvent)
    let i = 0
    const t = setInterval(() => onEvent(ev(100 + i, ['stock.reserved', 'stock.shortage_resolved', 'stock.issued'][i++ % 3],
      'R061026012', { work_order_id: 12, part_id: 305, quantity: 1 }, 0)), 20_000)
    return () => clearInterval(t)
  },
}

/**
 * REAL: consulta GET /events (ruta de EXTENSIÓN propuesta en API_README §8) cada 5 s.
 * El navegador no habla Kafka; el README sugiere SSE/WebSocket a futuro: bastaría otra implementación aquí.
 */
const httpEvents: EventsService = {
  subscribe(onEvent) {
    const tick = async () => {
      try {
        const res = await fetch(`${API.base}/events?topic=inventory.events&limit=50`)
        if (res.ok) ((await res.json()) as ListResponse<EventEnvelope>).items.forEach(onEvent) // el contexto descarta duplicados
      } catch { /* sin red: reintenta en el siguiente ciclo */ }
    }
    tick()
    const t = setInterval(tick, 5_000)
    return () => clearInterval(t)
  },
}
export const eventsService: EventsService = USE_MOCKS ? mockEvents : httpEvents
