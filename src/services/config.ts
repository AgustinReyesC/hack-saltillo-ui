/** Direcciones de las 3 APIs. Vienen de .env para no escribirlas "a mano" en los componentes. */
export const API = {
  inventory: import.meta.env.VITE_INVENTORY_URL as string, // servicio de inventario (:8000)
  events: import.meta.env.VITE_EVENTS_URL as string,       // API de eventos / simulador
  chat: import.meta.env.VITE_CHAT_URL as string,           // API del chatbot
}

/** Interruptor de datos de prueba. Con `VITE_USE_MOCKS=false` la app usa las APIs reales. */
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false'
