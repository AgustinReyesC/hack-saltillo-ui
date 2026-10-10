/** Interruptor ÚNICO mocks ↔ API real. Cambia VITE_USE_MOCKS en .env y reinicia `npm run dev`. */
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false'
export const API = {
  base: import.meta.env.VITE_API_URL as string,   // API de inventario (API_README §7-8)
  chat: import.meta.env.VITE_CHAT_URL as string,  // API del agente/chatbot
}
