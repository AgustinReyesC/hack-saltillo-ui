import { useState } from 'react'
import type { ChatMessage } from '../types'
import { askChatbot } from '../services/chatApi'

/** Lógica del chatbot. Totalmente independiente del inventario y de los eventos. */
export function useChat() {
  // useState: historial de la conversación.
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'hello', role: 'bot', text: 'Hola, soy el asistente de Roceel. ¿Qué quieres consultar del inventario?' },
  ])
  // useState: mientras esperamos respuesta, bloqueamos el botón "Enviar".
  const [sending, setSending] = useState(false)

  async function send(text: string) {
    const q = text.trim()
    if (!q) return
    const add = (role: ChatMessage['role'], t: string) =>
      setMessages((m) => [...m, { id: crypto.randomUUID(), role, text: t }])
    add('user', q); setSending(true)
    try { add('bot', await askChatbot(q)) }
    catch { add('bot', 'No pude contactar al asistente. Intenta de nuevo.') }
    finally { setSending(false) }
  }
  return { messages, sending, send }
}
