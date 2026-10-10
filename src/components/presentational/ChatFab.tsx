import { MessageCircle, X } from 'lucide-react'
/** Botón flotante (FAB) del chatbot, abajo a la derecha. Cambia de burbuja a X según `open`. */
interface Props { open: boolean; onClick: () => void }

export const ChatFab = ({ open, onClick }: Props) => (
  <button className="fab" onClick={onClick} aria-label={open ? 'Cerrar chat' : 'Abrir chat'}>{open ? <X size={22} aria-hidden="true" /> : <MessageCircle size={22} aria-hidden="true" />}</button>
)
