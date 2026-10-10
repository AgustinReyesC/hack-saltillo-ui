import { useState } from 'react'
import type { ChatMessage } from '../../types'
import { ChatFab } from '../presentational/ChatFab'
import { ChatWindow } from '../presentational/ChatWindow'

/** Respuesta fija que se usa cuando VITE_USE_MOCKS === 'true' (no se toca la red). */
const MOCK_REPLY = 'Esta es una respuesta simulada de la IA'

export function ChatContainer() {
  const [open, setOpen] = useState(false)     // ¿ventana de chat visible?
  const [sending, setSending] = useState(false) // ¿esperando respuesta? (bloquea el botón "Enviar")
  const [messages, setMessages] = useState<ChatMessage[]>([ // historial de la conversación
    { id: 'hello', role: 'bot', text: 'Hola, soy el asistente de Roceel. ¿Qué quieres consultar del inventario?' },
  ])

  // Agrega un mensaje al historial. Usamos la forma (prev => ...) para no perder mensajes si llegan seguidos.
  const addMessage = (role: ChatMessage['role'], text: string) =>
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role, text }])

  const handleSend = async (text: string) => {
    const question = text.trim()
    if (!question) return
    addMessage('user', question)
    setSending(true)

    // Las variables de Vite son SIEMPRE texto: se compara contra la cadena 'true', no contra el booleano true.
    if (import.meta.env.VITE_USE_MOCKS === 'true') {
      // MODO MOCK: sin fetch. Simulamos 1.5 s de "pensando" y respondemos con texto fijo.
      setTimeout(() => {
        addMessage('bot', MOCK_REPLY)
        setSending(false)
      }, 1500)
      return // salimos aquí: el bloque real de abajo no se ejecuta
    }

    // MODO REAL: POST {VITE_CHAT_URL}/chat con { message } → espera { answer }
    try {
      const res = await fetch(`${import.meta.env.VITE_CHAT_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`) // fetch NO lanza error por 404/500: hay que revisarlo a mano
      const data: { answer: string } = await res.json()
      addMessage('bot', data.answer)
    } catch {
      addMessage('bot', 'No pude contactar al asistente. Intenta de nuevo.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {open && <ChatWindow messages={messages} sending={sending} onSend={handleSend} onClose={() => setOpen(false)} />}
      <ChatFab open={open} onClick={() => setOpen(!open)} />
    </>
  )
}
