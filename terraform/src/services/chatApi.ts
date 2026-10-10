import { API } from './config'

/** Envía la pregunta al chatbot (API propia, independiente). Contrato supuesto: {message} → {answer}. */
export async function askChatbot(message: string): Promise<string> {
  const res = await fetch(`${API.chat}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return (await res.json()).answer as string
}
