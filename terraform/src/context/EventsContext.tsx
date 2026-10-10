import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { EventEnvelope } from '../types'
import { eventsService } from '../services/events'

/** "Radio" de la app: una sola suscripción; inventario y notificaciones solo escuchan con useEvents(). */
const EventsContext = createContext<EventEnvelope[]>([])

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<EventEnvelope[]>([]) // más nuevo primero, máx. 100
  useEffect(() => eventsService.subscribe((ev) =>            // subscribe devuelve el "unsubscribe" = cleanup del efecto
    setEvents((prev) => prev.some((e) => e.event_id === ev.event_id) ? prev   // at-least-once ⇒ descarta duplicados (regla 3)
      : [ev, ...prev].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at)).slice(0, 100))), [])
  return <EventsContext.Provider value={events}>{children}</EventsContext.Provider>
}
export const useEvents = () => useContext(EventsContext)
