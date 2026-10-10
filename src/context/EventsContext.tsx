import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { EventEnvelope } from '../types'
import { API, USE_MOCKS } from '../services/config'
import { makeLiveEvent, seedEvents } from '../mocks/eventsMock'

/**
 * La "radio" de la app: una sola fuente de eventos que cualquier componente escucha con useEvents().
 * Con USE_MOCKS=true los eventos son falsos; si no, vienen por SSE de la API real (/stream).
 */
const EventsContext = createContext<EventEnvelope[]>([])

export function EventsProvider({ children }: { children: ReactNode }) {
  // useState: eventos recibidos (nuevo primero). Arranca con datos de prueba si hay mocks.
  const [events, setEvents] = useState<EventEnvelope[]>(USE_MOCKS ? seedEvents : [])
  // Agrega un evento descartando duplicados (entrega "at-least-once") y limitando a 100.
  const push = (ev: EventEnvelope) =>
    setEvents((prev) => (prev.some((e) => e.event_id === ev.event_id) ? prev : [ev, ...prev].slice(0, 100)))

  // useEffect []: se ejecuta al montar; lo que devuelve (cleanup) se ejecuta al desmontar.
  useEffect(() => {
    if (USE_MOCKS) {                         // simulador local: un evento nuevo cada 20 s
      let i = 0
      const t = setInterval(() => push(makeLiveEvent(i++)), 20_000)
      return () => clearInterval(t)
    }
    const source = new EventSource(`${API.events}/stream`)
    source.onmessage = (m) => push(JSON.parse(m.data))
    return () => source.close()
  }, [])

  return <EventsContext.Provider value={events}>{children}</EventsContext.Provider>
}
export const useEvents = () => useContext(EventsContext)
