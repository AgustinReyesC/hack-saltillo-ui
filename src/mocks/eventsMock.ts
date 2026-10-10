import type { EventEnvelope } from '../types'

/** Fabrica un evento falso con el MISMO sobre que describe el README (event_id, event_type, key…). */
const ev = (n: number, type: string, key: string, minsAgo: number): EventEnvelope => ({
  event_id: `mock-${n}`, event_type: type, event_version: 1, source: 'simulator', key,
  occurred_at: new Date(Date.now() - minsAgo * 60_000).toISOString(), data: {},
})

/** Eventos con los que arranca la campana (para que muestre un número). */
export const seedEvents: EventEnvelope[] = [
  ev(1, 'stock.shortage_detected', 'R061026012', 3),
  ev(2, 'stock.reorder_suggested', 'RC-1007', 9),
  ev(3, 'stock.received', 'RC-1010', 25),
  ev(4, 'stock.unmatched_receipt', 'RC-9999', 40),
]

const live = ['stock.reserved', 'stock.shortage_resolved', 'stock.received']
/** Evento "en vivo" simulado cada pocos segundos (id único para que no se descarte como duplicado). */
export const makeLiveEvent = (i: number) => ev(1000 + i, live[i % live.length], `R0610260${10 + i}`, 0)
