import { useMemo, useState } from 'react'
import type { AppNotification, EventEnvelope } from '../types'
import { useEvents } from '../context/EventsContext'

const MAP: Record<string, Pick<AppNotification, 'title' | 'level'>> = {
  'stock.received': { title: 'Entrada de material', level: 'success' },
  'stock.unmatched_receipt': { title: 'Recepción sin relacionar', level: 'warning' },
  'stock.reserved': { title: 'Material reservado', level: 'info' },
  'stock.shortage_detected': { title: 'Faltante detectado', level: 'warning' },
  'stock.shortage_resolved': { title: 'Faltante surtido', level: 'success' },
  'stock.issued': { title: 'Salida a orden', level: 'info' },
  'stock.transferred': { title: 'Transferencia', level: 'info' },
  'stock.adjusted': { title: 'Ajuste por conteo', level: 'warning' },
  'stock.reorder_suggested': { title: 'Se sugiere reabasto', level: 'warning' },
}
const toNotification = (e: EventEnvelope, read: boolean): AppNotification => ({
  id: e.event_id, at: e.occurred_at, read, event_type: e.event_type, key: e.key, data: e.data,
  ...(MAP[e.event_type] ?? { title: e.event_type, level: 'info' as const }),
  detail: typeof e.data.name === 'string' ? `${e.key} · ${e.data.name}` : e.key,
})
const withId = (set: Set<string>, id: string) => new Set(set).add(id) // copia + agrega (React exige NO mutar el Set)

export function useNotifications() {
  const events = useEvents() // FUENTE DE VERDAD: nunca se borra de aquí (el inventario también la usa)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())           // ids ya abiertos
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set()) // ids descartados con 🗑

  // La lista visible es una VISTA derivada: eventos − descartados, marcando cuáles están leídos.
  const items = useMemo(
    () => events.filter((e) => !dismissedIds.has(e.event_id)).map((e) => toNotification(e, readIds.has(e.event_id))),
    [events, dismissedIds, readIds])

  return {
    items,
    unread: items.filter((n) => !n.read).length, // el numerito de la campana
    markRead: (id: string) => setReadIds((s) => withId(s, id)),
    markAllRead: () => setReadIds((s) => new Set([...s, ...items.map((n) => n.id)])),
    dismiss: (id: string) => setDismissedIds((s) => withId(s, id)),
  }
}
