import { Bot, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { ChatMessage } from '../../types'

/** Ventanita del chat con su botón de cerrar (onClose). */
interface Props { messages: ChatMessage[]; sending: boolean; onSend: (t: string) => void; onClose: () => void }

export function ChatWindow({ messages, sending, onSend, onClose }: Props) {
  const [draft, setDraft] = useState('') // useState local: texto que se está escribiendo
  const submit = (e: FormEvent) => { e.preventDefault(); onSend(draft); setDraft('') }
  return (
    <section className="chat-window">
      <div className="chat-head"><span className="chat-title"><Bot size={18} aria-hidden="true" />Asistente IA</span><button className="x" onClick={onClose} aria-label="Cerrar chat"><X size={18} aria-hidden="true" /></button></div>
      <div className="messages">
        {messages.map((m) => <p key={m.id} className={`bubble ${m.role}`}>{m.text}</p>)}
      </div>
      <form onSubmit={submit} className="chat-form">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Escribe tu pregunta…" />
        <button disabled={sending}>{sending ? '…' : 'Enviar'}</button>
      </form>
    </section>
  )
}
