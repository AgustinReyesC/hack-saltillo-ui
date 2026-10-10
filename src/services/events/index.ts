import { API, USE_MOCKS } from '../config'
import type { EventEnvelope, ListResponse } from '../../types'

export type Unsubscribe = () => void
export interface EventsService { subscribe(onEvent: (e: EventEnvelope) => void): Unsubscribe }

/** MOCK: no inventa eventos solo; los emite el mockService cuando alguien hace una operación (pushMockEvent). */
const listeners = new Set<(e: EventEnvelope) => void>()
export function pushMockEvent(event_type: string, key: string, data: Record<string, unknown>) {
  const ev: EventEnvelope = { event_id: crypto.randomUUID(), event_type, event_version: 1, source: 'inventory', key, data,
    occurred_at: new Date().toISOString().replace(/\.\d+Z$/, 'Z') }
  listeners.forEach((l) => l(ev))
}
const mockEvents: EventsService = { subscribe(on) { listeners.add(on); return () => { listeners.delete(on) } } }

/** REAL: consulta GET /events cada 5 s (ruta de extensión). Para tiempo real se cambiaría por SSE/WebSocket aquí. */
const httpEvents: EventsService = {
  subscribe(onEvent) {
    const tick = async () => {
      try {
        const res = await fetch(`${API.base}/events?topic=inventory.events&limit=50`)
        if (res.ok) ((await res.json()) as ListResponse<EventEnvelope>).items.forEach(onEvent) // el contexto descarta duplicados
      } catch { /* reintenta en el siguiente ciclo */ }
    }
    tick(); const t = setInterval(tick, 5_000); return () => clearInterval(t)
  },
}
export const eventsService: EventsService = USE_MOCKS ? mockEvents : httpEvents
