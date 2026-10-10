import { useState } from 'react'
import { useChat } from '../../hooks/useChat'
import { ChatFab } from '../presentational/ChatFab'
import { ChatWindow } from '../presentational/ChatWindow'

export function ChatContainer() {
  const { messages, sending, send } = useChat()
  const [open, setOpen] = useState(false) // useState: ¿ventana de chat visible?
  return (
    <>
      {open && <ChatWindow messages={messages} sending={sending} onSend={send} onClose={() => setOpen(false)} />}
      <ChatFab open={open} onClick={() => setOpen(!open)} />
    </>
  )
}
