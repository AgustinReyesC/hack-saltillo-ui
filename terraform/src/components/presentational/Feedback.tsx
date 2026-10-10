import { AlertTriangle, CheckCircle2 } from 'lucide-react'

/** Resultado de una operación (éxito / error). Mismos datos que antes: solo cambia cómo se ve. */
export const Feedback = ({ ok, text }: { ok: boolean; text: string }) => (
  <p className={`feedback ${ok ? 'ok' : 'bad'}`}>
    {ok ? <CheckCircle2 size={18} aria-hidden="true" /> : <AlertTriangle size={18} aria-hidden="true" />}<span>{text}</span>
  </p>
)
