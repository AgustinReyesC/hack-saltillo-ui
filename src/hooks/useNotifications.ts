import { useMemo, useState } from 'react'
import type { AppNotification, EventEnvelope } from '../types'
import { useEvents } from '../context/EventsContext'

/** Traduce un evento técnico a un texto humano. */
function toNotification(e: EventEnvelope): AppNotification {
  const map: Record<string, Pick<AppNotification, 'title' | 'level'>> = {
    'stock.shortage_detected': { title: 'Faltante detectado', level: 'warning' },
    'stock.shortage_resolved': { title: 'Faltante resuelto', level: 'success' },
    'stock.reorder_suggested': { title: 'Se sugiere reordenar', level: 'warning' },
    'stock.unmatched_receipt': { title: 'Recepción sin coincidencia', level: 'warning' },
    'stock.received': { title: 'Material recibido', level: 'success' },
  }
  const base = map[e.event_type] ?? { title: e.event_type, level: 'info' as const }
  return { id: e.event_id, ...base, detail: `Orden/clave: ${e.key}`, at: e.occurred_at }
}

export function useNotifications() {
  const events = useEvents()
  // useState: ids ya leídos (para el contador de la campana).
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  // useMemo: recalcula la lista SOLO si cambian los eventos.
  const items = useMemo(() => events.map(toNotification), [events])
  const unread = items.filter((n) => !readIds.has(n.id)).length
  const markAllRead = () => setReadIds(new Set(items.map((n) => n.id)))
  return { items, unread, markAllRead }
}
